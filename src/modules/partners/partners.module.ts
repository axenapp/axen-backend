import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { GeocodingService } from './geocoding.service';
import { Partner } from './partner.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Partner, User])],
  controllers: [PartnersController],
  providers: [PartnersService, GeocodingService],
  exports: [PartnersService],
})
export class PartnersModule {}