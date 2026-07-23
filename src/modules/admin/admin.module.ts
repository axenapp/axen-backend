import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Partner } from '../partners/partner.entity';
import { Booking } from '../bookings/booking.entity';
import { Service } from '../services/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Partner, Booking, Service])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}