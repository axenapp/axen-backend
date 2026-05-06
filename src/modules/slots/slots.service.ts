import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Slot, SlotStatus } from './slot.entity';
import { CreateSlotsDto } from './dto/create-slots.dto';
import { BlockDayDto } from './dto/block-day.dto';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
    private readonly partnersService: PartnersService,
  ) {}

  async createBulk(userId: string, createSlotsDto: CreateSlotsDto) {
    const partner = await this.partnersService.findByUserId(userId);

    const slots = createSlotsDto.datetimes.map((datetime) =>
      this.slotRepository.create({
        serviceId: createSlotsDto.serviceId,
        partnerId: partner.id,
        datetime: new Date(datetime),
        status: SlotStatus.FREE,
      }),
    );

    return this.slotRepository.save(slots);
  }

  async findAvailable(serviceId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.slotRepository.find({
      where: {
        serviceId,
        status: SlotStatus.FREE,
        datetime: Between(startOfDay, endOfDay),
      },
      order: { datetime: 'ASC' },
    });
  }

  async findOne(id: string) {
    const slot = await this.slotRepository.findOne({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Slot no encontrado');
    }

    return slot;
  }

  async blockDay(userId: string, blockDayDto: BlockDayDto) {
    const partner = await this.partnersService.findByUserId(userId);

    const startOfDay = new Date(blockDayDto.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(blockDayDto.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener todos los slots del día
    const slots = await this.slotRepository.find({
      where: {
        partnerId: partner.id,
        datetime: Between(startOfDay, endOfDay),
      },
    });

    // Bloquear todos los slots libres
    // Los reservados serán manejados por el módulo de bookings
    const updatedSlots = slots.map((slot) => {
      if (slot.status === SlotStatus.FREE) {
        slot.status = SlotStatus.BLOCKED;
      }
      return slot;
    });

    return this.slotRepository.save(updatedSlots);
  }

  async findByPartnerAndDate(partnerId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.slotRepository.find({
      where: {
        partnerId,
        datetime: Between(startOfDay, endOfDay),
      },
      relations: ['service'],
      order: { datetime: 'ASC' },
    });
  }
}