import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /api/v1/payments/preference
  // Genera la preferencia de pago y devuelve la URL de checkout
  @UseGuards(JwtAuthGuard)
  @Post('preference')
  createPreference(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createPreference(dto, user.id);
  }

  // POST /api/v1/payments/webhook
  // Recibe notificaciones de MercadoPago (sin JWT, es llamado por MP)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    return this.paymentsService.handleWebhook(body, xSignature ?? '', xRequestId ?? '');
  }

  // GET /api/v1/payments/booking/:bookingId
  // Consulta los pagos de una reserva específica
  @UseGuards(JwtAuthGuard)
  @Get('booking/:bookingId')
  getPaymentsByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getPaymentsByBooking(bookingId, user.id);
  }
}