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
async getDashboard(userId: string) {
  const partner = await this.findByUserId(userId);

  // Promise.all ejecuta las 4 queries en paralelo — S5.9
  const [todayBookings, monthBookings, averageRating, recentBookings] =
    await Promise.all([
      // Turnos de hoy
      this.partnerRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('bookings', 'b')
        .innerJoin('slots', 's', 's.id = b.slot_id')
        .innerJoin('services', 'sv', 'sv.id = b.service_id')
        .where('sv.partner_id = :partnerId', { partnerId: partner.id })
        .andWhere('b.status IN (:...statuses)', {
          statuses: ['confirmed', 'completed'],
        })
        .andWhere('DATE(s.datetime) = CURRENT_DATE')
        .getRawOne(),

      // Turnos del mes
      this.partnerRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .addSelect('SUM(sv.price)', 'revenue')
        .from('bookings', 'b')
        .innerJoin('slots', 's', 's.id = b.slot_id')
        .innerJoin('services', 'sv', 'sv.id = b.service_id')
        .where('sv.partner_id = :partnerId', { partnerId: partner.id })
        .andWhere('b.status IN (:...statuses)', {
          statuses: ['confirmed', 'completed'],
        })
        .andWhere(
          "DATE_TRUNC('month', s.datetime) = DATE_TRUNC('month', CURRENT_DATE)",
        )
        .getRawOne(),

      // Calificación promedio
      this.partnerRepository.manager
        .createQueryBuilder()
        .select('AVG(r.rating)', 'average')
        .addSelect('COUNT(r.id)', 'total')
        .from('reviews', 'r')
        .where('r.partner_id = :partnerId', { partnerId: partner.id })
        .getRawOne(),

      // Últimas 5 reservas
      this.partnerRepository.manager
        .createQueryBuilder()
        .select([
          'b.id',
          'b.status',
          'b.created_at',
          'u.name',
          'sv.name',
          's.datetime',
        ])
        .from('bookings', 'b')
        .innerJoin('users', 'u', 'u.id = b.user_id')
        .innerJoin('services', 'sv', 'sv.id = b.service_id')
        .innerJoin('slots', 's', 's.id = b.slot_id')
        .where('sv.partner_id = :partnerId', { partnerId: partner.id })
        .orderBy('b.created_at', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

  return {
    today: {
      bookings: parseInt(todayBookings?.count ?? '0'),
    },
    month: {
      bookings: parseInt(monthBookings?.count ?? '0'),
      revenue: parseFloat(monthBookings?.revenue ?? '0'),
    },
    rating: {
      average: parseFloat(averageRating?.average ?? '0'),
      total: parseInt(averageRating?.total ?? '0'),
    },
    recentBookings,
  };
}

}