import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password, phone } = registerDto;

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado en el sistema');
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = this.userRepository.create({
      name,
      email,
      passwordHash,
      phone,
    });

    await this.userRepository.save(user);

    // Generar y retornar el token
    const token = this.generateToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar el usuario
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Cuenta bloqueada temporalmente. Intentá de nuevo en 15 minutos',
      );
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      user.failedAttempts += 1;

      // Bloquear tras 5 intentos
      if (user.failedAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedAttempts = 0;
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Login exitoso — resetear intentos fallidos
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);

    const token = this.generateToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  // Nunca retornar el passwordHash al cliente
  private sanitizeUser(user: User) {
    const { passwordHash, failedAttempts, lockedUntil, ...safeUser } = user;
    return safeUser;
  }
}