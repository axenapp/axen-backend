import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { Slot } from '../slots/slot.entity';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Slot]),
    PartnersModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}