import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Partner, PartnerStatus } from '../partners/partner.entity';
import { Booking } from '../bookings/booking.entity';
import { Service } from '../services/service.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  // ── Usuarios ──────────────────────────────────────────────────────────────

  async findAllUsers(page = 1, limit = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: users.map(u => ({ ...u, passwordHash: undefined })), total, page, limit };
  }

  async updateUser(id: string, dto: { role?: UserRole; name?: string; phone?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);
    return { ...saved, passwordHash: undefined };
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.userRepository.softDelete(id);
    return { message: 'Usuario eliminado correctamente' };
  }

  // ── Partners ──────────────────────────────────────────────────────────────

  async findAllPartners(page = 1, limit = 20) {
    const [partners, total] = await this.partnerRepository.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: partners, total, page, limit };
  }

  async suspendPartner(id: string) {
    const partner = await this.partnerRepository.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Negocio no encontrado');
    partner.status = PartnerStatus.SUSPENDED;
    return this.partnerRepository.save(partner);
  }

  async activatePartner(id: string) {
    const partner = await this.partnerRepository.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Negocio no encontrado');
    partner.status = PartnerStatus.ACTIVE;
    return this.partnerRepository.save(partner);
  }

  async deletePartner(id: string) {
    const partner = await this.partnerRepository.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Negocio no encontrado');
    await this.partnerRepository.softDelete(id);
    return { message: 'Negocio eliminado correctamente' };
  }

  // ── Servicios ─────────────────────────────────────────────────────────────

  async findAllServices(page = 1, limit = 20) {
    const [services, total] = await this.serviceRepository.findAndCount({
      relations: ['partner'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: services, total, page, limit };
  }

  async updateService(id: string, dto: { name?: string; description?: string; price?: number; isActive?: boolean }) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    Object.assign(service, dto);
    return this.serviceRepository.save(service);
  }

  async deleteService(id: string) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    await this.serviceRepository.softDelete(id);
    return { message: 'Servicio eliminado correctamente' };
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  async findAllBookings(page = 1, limit = 20) {
    const [bookings, total] = await this.bookingRepository.findAndCount({
      relations: ['user', 'service', 'service.partner', 'slot'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: bookings, total, page, limit };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const [totalUsers, totalPartners, totalBookings, totalServices] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.USER } }),
      this.partnerRepository.count(),
      this.bookingRepository.count(),
      this.serviceRepository.count(),
    ]);

    const activePartners = await this.partnerRepository.count({
      where: { status: PartnerStatus.ACTIVE },
    });

    const confirmedBookings = await this.bookingRepository.count({
      where: { status: 'confirmed' as any },
    });

    return {
      totalUsers,
      totalPartners,
      activePartners,
      totalBookings,
      confirmedBookings,
      totalServices,
    };
  }
}