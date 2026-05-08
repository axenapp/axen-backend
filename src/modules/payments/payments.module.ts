import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
import { Booking } from '../bookings/booking.entity';
import { Slot } from '../slots/slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking, Slot])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}