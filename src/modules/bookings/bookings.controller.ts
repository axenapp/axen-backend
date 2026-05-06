import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Crear una reserva (usuarios finales)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user.id, createBookingDto);
  }

  // Ver mis reservas (usuario final)
  @Get('my')
  async findMy(@CurrentUser() user: User) {
    return this.bookingsService.findAllByUser(user.id);
  }

  // Ver reservas del negocio (partner)
  @Get('partner')
  @Roles(UserRole.PARTNER)
  async findByPartner(@CurrentUser() user: User) {
    return this.bookingsService.findAllByPartner(user.id);
  }

  // Ver una reserva por ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  // Cancelar una reserva
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.cancel(id, user.id);
  }

  // Marcar turno como completado (partner)
  @Patch(':id/complete')
  @Roles(UserRole.PARTNER)
  async complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.complete(id, user.id);
  }
}