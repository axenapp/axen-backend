import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Crear un servicio (solo partners)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTNER)
  async create(
    @CurrentUser() user: User,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(user.id, createServiceDto);
  }

  // Ver todos los servicios activos (PÚBLICO)
  @Get()
  async findAll() {
    return this.servicesService.findAllActive();
  }

  // Ver servicios de un partner específico (PÚBLICO)
  @Get('partner/:partnerId')
  async findByPartner(@Param('partnerId') partnerId: string) {
    return this.servicesService.findAllByPartner(partnerId);
  }

  // Ver un servicio por ID (PÚBLICO)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  // Actualizar un servicio (solo el partner dueño)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTNER)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, user.id, updateServiceDto);
  }

  // Desactivar un servicio (solo partner)
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTNER)
  async deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.servicesService.deactivate(id, user.id);
  }

  // Eliminar un servicio (solo partner)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARTNER)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.servicesService.remove(id, user.id);
  }
}