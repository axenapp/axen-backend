import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly partnersService: PartnersService,
  ) {}

  async create(userId: string, createServiceDto: CreateServiceDto) {
    // Verificar que el usuario tiene un negocio registrado
    const partner = await this.partnersService.findByUserId(userId);

    const service = this.serviceRepository.create({
      ...createServiceDto,
      partnerId: partner.id,
    });

    return this.serviceRepository.save(service);
  }

  async findAllByPartner(partnerId: string) {
    return this.serviceRepository.find({
      where: { partnerId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  async update(id: string, userId: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.findOne(id);
    const partner = await this.partnersService.findByUserId(userId);

    // Verificar que el servicio pertenece al partner
    if (service.partnerId !== partner.id) {
      throw new ForbiddenException(
        'No tenés permisos para modificar este servicio',
      );
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async deactivate(id: string, userId: string) {
    const service = await this.findOne(id);
    const partner = await this.partnersService.findByUserId(userId);

    if (service.partnerId !== partner.id) {
      throw new ForbiddenException(
        'No tenés permisos para modificar este servicio',
      );
    }

    service.isActive = false;
    return this.serviceRepository.save(service);
  }

  async remove(id: string, userId: string) {
    const service = await this.findOne(id);
    const partner = await this.partnersService.findByUserId(userId);

    if (service.partnerId !== partner.id) {
      throw new ForbiddenException(
        'No tenés permisos para eliminar este servicio',
      );
    }

    // Verificar que no tenga turnos futuros activos (RN-07)
    // Por ahora verificamos sin el módulo de bookings
    // Se completará cuando implementemos bookings

    return this.serviceRepository.remove(service);
  }

  async findAllActive() {
    return this.serviceRepository.find({
      where: { isActive: true },
      relations: ['partner'],
      order: { createdAt: 'DESC' },
    });
  }
}