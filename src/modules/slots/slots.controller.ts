import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { CreateSlotsDto } from './dto/create-slots.dto';
import { BlockDayDto } from './dto/block-day.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('slots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // Crear slots en bulk (solo partners)
  @Post()
  @Roles(UserRole.PARTNER)
  async createBulk(
    @CurrentUser() user: User,
    @Body() createSlotsDto: CreateSlotsDto,
  ) {
    return this.slotsService.createBulk(user.id, createSlotsDto);
  }

  // Ver slots disponibles de un servicio en una fecha
  @Get('available')
  async findAvailable(
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.slotsService.findAvailable(serviceId, date);
  }

  // Ver agenda del partner por fecha
  @Get('partner/:partnerId')
  async findByPartnerAndDate(
    @Param('partnerId') partnerId: string,
    @Query('date') date: string,
  ) {
    return this.slotsService.findByPartnerAndDate(partnerId, date);
  }

  // Bloquear un día completo (solo partners)
  @Post('block-day')
  @Roles(UserRole.PARTNER)
  async blockDay(
    @CurrentUser() user: User,
    @Body() blockDayDto: BlockDayDto,
  ) {
    return this.slotsService.blockDay(user.id, blockDayDto);
  }
}