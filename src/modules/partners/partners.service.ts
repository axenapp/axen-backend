import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner, PartnerStatus } from './partner.entity';
import { User, UserRole } from '../users/user.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { GeocodingService } from './geocoding.service';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async create(userId: string, createPartnerDto: CreatePartnerDto) {
    const existing = await this.partnerRepository.findOne({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Este usuario ya tiene un negocio registrado');
    }

    await this.userRepository.update(userId, { role: UserRole.PARTNER });

    const partner = this.partnerRepository.create({
      userId,
      ...createPartnerDto,
      status: PartnerStatus.DRAFT,
    });

    return this.partnerRepository.save(partner);
  }

  async findOne(id: string) {
    const partner = await this.partnerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!partner) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return partner;
  }

  async findByUserId(userId: string) {
    const partner = await this.partnerRepository.findOne({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('No tenés un negocio registrado');
    }

    return partner;
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    const partner = await this.findOne(id);
    Object.assign(partner, updatePartnerDto);
    return this.partnerRepository.save(partner);
  }

  async updateLocation(id: string, address: string) {
    const partner = await this.findOne(id);

    // Geocodificar la dirección con Google Maps
    const { lat, lng, formattedAddress } =
      await this.geocodingService.geocode(address);

    partner.address = formattedAddress;
    partner.lat = lat;
    partner.lng = lng;

    return this.partnerRepository.save(partner);
  }

  async activate(id: string) {
    const partner = await this.findOne(id);
    partner.status = PartnerStatus.ACTIVE;
    return this.partnerRepository.save(partner);
  }

  async findAllActive() {
    return this.partnerRepository.find({
      where: { status: PartnerStatus.ACTIVE },
    });
  }
}