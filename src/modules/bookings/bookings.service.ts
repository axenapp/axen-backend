import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { Slot, SlotStatus } from '../slots/slot.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
    private readonly dataSource: DataSource,
    private readonly partnersService: PartnersService,
  ) {}

  async create(userId: string, createBookingDto: CreateBookingDto) {
    const { slotId, serviceId } = createBookingDto;

    // Transacción ACID con SELECT FOR UPDATE — previene doble reserva
    return this.dataSource.transaction(async (manager) => {
      // Bloquear la fila del slot para escritura exclusiva
      const slot = await manager
        .createQueryBuilder(Slot, 'slot')
        .setLock('pessimistic_write')
        .where('slot.id = :slotId', { slotId })
        .getOne();

      if (!slot) {
        throw new NotFoundException('Slot no encontrado');
      }

      // Verificar que el slot esté libre
      if (slot.status !== SlotStatus.FREE) {
        throw new ConflictException(
          'Este horario ya no está disponible. Por favor seleccioná otro horario.',
        );
      }

      // Marcar el slot como reservado
      slot.status = SlotStatus.RESERVED;
      await manager.save(Slot, slot);

      // Crear el booking
      const booking = manager.create(Booking, {
        userId,
        slotId,
        serviceId,
        status: BookingStatus.PENDING_PAYMENT,
      });

      return manager.save(Booking, booking);
    });
  }

  async findAllByUser(userId: string) {
    return this.bookingRepository.find({
      where: { userId },
      relations: ['slot', 'service', 'service.partner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['slot', 'service', 'service.partner', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return booking;
  }

  async cancel(id: string, userId: string) {
    const booking = await this.findOne(id);

    // Ownership check — RN-03
    if (booking.userId !== userId) {
      throw new ForbiddenException(
        'No tenés permisos para cancelar esta reserva',
      );
    }

    // Verificar que el booking se pueda cancelar
    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.PENDING_PAYMENT
    ) {
      throw new UnprocessableEntityException(
        'Esta reserva no puede cancelarse en su estado actual',
      );
    }

    // Verificar ventana de cancelación — RN-04
    const partner = booking.service.partner;
    const cancelWindowHours = partner.cancelWindowHours || 2;
    const slotDatetime = new Date(booking.slot.datetime);
    const now = new Date();
    const hoursUntilSlot =
      (slotDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSlot < cancelWindowHours) {
      throw new UnprocessableEntityException(
        `No podés cancelar este turno porque quedan menos de ${cancelWindowHours} horas. Comunicate directamente con el negocio.`,
      );
    }

    // Cancelar el booking y liberar el slot
    return this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      await manager.save(Booking, booking);

      // Liberar el slot
      const slot = await manager.findOne(Slot, {
        where: { id: booking.slotId },
      });
      if (slot) {
        slot.status = SlotStatus.FREE;
        await manager.save(Slot, slot);
      }

      return booking;
    });
  }

  async complete(id: string, userId: string) {
    // El partner marca el turno como completado
    const booking = await this.findOne(id);
    const partner = await this.partnersService.findByUserId(userId);

    // Verificar que el booking pertenece al partner
    if (booking.service.partner.id !== partner.id) {
      throw new ForbiddenException(
        'No tenés permisos para completar esta reserva',
      );
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new UnprocessableEntityException(
        'Solo se pueden completar reservas confirmadas',
      );
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    return this.bookingRepository.save(booking);
  }

  async confirm(id: string) {
    // Llamado desde el módulo de pagos cuando el webhook confirma el pago
    const booking = await this.findOne(id);
    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  async findAllByPartner(userId: string) {
    const partner = await this.partnersService.findByUserId(userId);

    return this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.user', 'user')
      .where('service.partnerId = :partnerId', { partnerId: partner.id })
      .orderBy('slot.datetime', 'ASC')
      .getMany();
  }
}