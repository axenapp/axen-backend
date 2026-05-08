import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingStatus } from '../bookings/booking.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async sendBookingConfirmation(booking: Booking) {
    this.logger.log(
      `[EMAIL] Confirmación de reserva enviada → booking ${booking.id}`,
    );
    // TODO: implementar envío real con Resend cuando tengamos API key
  }

  async sendCancellationNotification(booking: Booking) {
    this.logger.log(
      `[EMAIL] Notificación de cancelación enviada → booking ${booking.id}`,
    );
  }

  async sendBookingReminder(booking: Booking) {
    this.logger.log(
      `[EMAIL] Recordatorio enviado → booking ${booking.id}`,
    );
  }

  async sendWelcomeEmail(email: string, name: string) {
    this.logger.log(`[EMAIL] Bienvenida enviada → ${email}`);
  }

  async sendPartnerActivatedEmail(email: string, partnerName: string) {
    this.logger.log(
      `[EMAIL] Negocio activado enviado → ${email} (${partnerName})`,
    );
  }

  // Cron que corre cada hora — busca turnos en las próximas 24hs
  // y envía recordatorio si reminder_sent = false (RN-08)
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    this.logger.log('[CRON] Ejecutando cron de recordatorios...');

    const now = new Date();
    const in24hs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
        reminderSent: false,
      },
      relations: ['slot', 'service', 'service.partner', 'user'],
    });

    // Filtrar los que tienen turno en las próximas 24hs
    const upcoming = bookings.filter((b) => {
      const slotTime = new Date(b.slot.datetime);
      return slotTime >= now && slotTime <= in24hs;
    });

    this.logger.log(
      `[CRON] Encontrados ${upcoming.length} turnos para recordar`,
    );

    for (const booking of upcoming) {
      await this.sendBookingReminder(booking);

      // Marcar como enviado — garantiza idempotencia (RN-08)
      booking.reminderSent = true;
      await this.bookingRepository.save(booking);

      this.logger.log(
        `[CRON] reminder_sent=true → booking ${booking.id}`,
      );
    }
  }
}