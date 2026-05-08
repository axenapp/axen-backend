import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import * as crypto from 'crypto';

import { Payment, PaymentStatus } from './payment.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { Slot, SlotStatus } from '../slots/slot.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mpClient: MercadoPagoConfig;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Slot)
    private readonly slotRepo: Repository<Slot>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: this.configService.get<string>('MP_ACCESS_TOKEN') as string,
    });
  }

  async createPreference(dto: CreatePaymentDto, userId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['service', 'user'],
    });

    if (!booking) throw new NotFoundException('Booking no encontrado');
    if (booking.userId !== userId)
      throw new UnauthorizedException('No tenés permiso para pagar esta reserva');
    if (booking.status !== BookingStatus.PENDING_PAYMENT)
      throw new BadRequestException(
        `El booking ya está en estado ${booking.status}`,
      );

    const preferenceApi = new Preference(this.mpClient);
    const preference = await preferenceApi.create({
      body: {
        items: [
          {
            id: booking.serviceId,
            title: booking.service.name,
            quantity: 1,
            unit_price: Number(booking.service.price),
            currency_id: 'ARS',
          },
        ],
        external_reference: booking.id,
        back_urls: {
          success: `${this.configService.get('FRONTEND_URL')}/payment/success`,
          failure: `${this.configService.get('FRONTEND_URL')}/payment/failure`,
          pending: `${this.configService.get('FRONTEND_URL')}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: `${this.configService.get('BACKEND_URL')}/api/v1/payments/webhook`,
      },
    });

    const payment = this.paymentRepo.create({
      bookingId: booking.id,
      mpPreferenceId: preference.id,
      amount: booking.service.price,
      currency: 'ARS',
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepo.save(payment);

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    };
  }

  async handleWebhook(
    body: any,
    xSignature: string,
    xRequestId: string,
  ): Promise<void> {
    this.verifyWebhookSignature(xSignature, xRequestId, body);

    if (body.type !== 'payment') return;

    const mpPaymentId = String(body.data?.id);
    if (!mpPaymentId) return;

    const mpPaymentApi = new MPPayment(this.mpClient);
    const mpPayment = await mpPaymentApi.get({ id: mpPaymentId });

    const bookingId = mpPayment.external_reference as string;
    const mpStatus = mpPayment.status as string;

    await this.processPaymentResult(bookingId, mpPaymentId, mpStatus, body);
  }

  private async processPaymentResult(
    bookingId: string,
    mpPaymentId: string,
    mpStatus: string,
    webhookPayload: object,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) {
        this.logger.warn(`Webhook: booking ${bookingId} no encontrado`);
        return;
      }

      const payment = await manager.findOne(Payment, {
        where: { bookingId },
        order: { createdAt: 'DESC' },
      });

      if (mpStatus === 'approved') {
        booking.status = BookingStatus.CONFIRMED;

        const slot = await manager.findOne(Slot, { where: { id: booking.slotId } });
        if (slot) {
          slot.status = SlotStatus.RESERVED;
          await manager.save(Slot, slot);
        }

        if (payment) {
          payment.status = PaymentStatus.APPROVED;
          payment.mpPaymentId = mpPaymentId;
          payment.webhookPayload = webhookPayload;
          await manager.save(Payment, payment);
        }
      } else if (['rejected', 'cancelled'].includes(mpStatus)) {
        booking.status = BookingStatus.FAILED;

        const slot = await manager.findOne(Slot, { where: { id: booking.slotId } });
        if (slot) {
          slot.status = SlotStatus.FREE;
          await manager.save(Slot, slot);
        }

        if (payment) {
          payment.status = PaymentStatus.REJECTED;
          payment.mpPaymentId = mpPaymentId;
          payment.webhookPayload = webhookPayload;
          await manager.save(Payment, payment);
        }
      }

      await manager.save(Booking, booking);
      this.logger.log(`Webhook procesado: booking=${bookingId} mpStatus=${mpStatus}`);
    });
  }

  private verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    body: any,
  ): void {
    const secret = this.configService.get<string>('MP_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('MP_WEBHOOK_SECRET no configurado, saltando verificación');
      return;
    }

    const parts: Record<string, string> = {};
    xSignature.split(',').forEach((part) => {
      const [k, v] = part.split('=');
      parts[k.trim()] = v.trim();
    });

    const ts = parts['ts'];
    const hash = parts['v1'];
    if (!ts || !hash) throw new UnauthorizedException('Firma inválida');

    const dataId = body?.data?.id ?? '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    if (expected !== hash) {
      this.logger.error('Firma webhook inválida');
      throw new UnauthorizedException('Firma webhook inválida');
    }
  }

  async getPaymentsByBooking(bookingId: string, userId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking no encontrado');
    if (booking.userId !== userId)
      throw new UnauthorizedException('No tenés permiso');

    return this.paymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }
}