import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@CurrentUser() user: User) {
    const { passwordHash, failedAttempts, lockedUntil, ...safeUser } = user;
    return safeUser;
  }

  @Patch('profile')
@UseGuards(JwtAuthGuard)
async updateProfile(
  @CurrentUser() user: User,
  @Body() dto: { name?: string; phone?: string; address?: string },
) {
  return this.authService.updateProfile(user.id, dto);
}
}