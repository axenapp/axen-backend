import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // Registrar un nuevo negocio (cualquier usuario autenticado)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createPartnerDto: CreatePartnerDto,
  ) {
    return this.partnersService.create(user.id, createPartnerDto);
  }

  // Listar todos los negocios activos (cualquier usuario autenticado)
  @Get()
  async findAll() {
    return this.partnersService.findAllActive();
  }

  // Ver mi propio negocio
  @Get('me')
  @Roles(UserRole.PARTNER)
  async findMe(@CurrentUser() user: User) {
    return this.partnersService.findByUserId(user.id);
  }

  // Dashboard del partner
  @Get('dashboard')
  @Roles(UserRole.PARTNER)
  async getDashboard(@CurrentUser() user: User) {
    return this.partnersService.getDashboard(user.id);
  }

  // Ver un negocio por ID (público para usuarios autenticados)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  // Actualizar mi negocio
  @Patch(':id')
  @Roles(UserRole.PARTNER)
  async update(
    @Param('id') id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(id, updatePartnerDto);
  }
    // Actualizar ubicación del negocio con geocodificación
    @Patch(':id/location')
    @Roles(UserRole.PARTNER)
    async updateLocation(
    @Param('id') id: string,
    @Body('address') address: string,
    ) {
    return this.partnersService.updateLocation(id, address);
    }
  // Activar el negocio (completar onboarding)
  @Patch(':id/activate')
  @Roles(UserRole.PARTNER)
  async activate(@Param('id') id: string) {
    return this.partnersService.activate(id);
  }
}