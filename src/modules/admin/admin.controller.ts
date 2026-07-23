import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ─────────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── Usuarios ──────────────────────────────────────────────────────────────
  @Get('users')
  findAllUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.findAllUsers(Number(page), Number(limit));
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: { role?: UserRole; name?: string; phone?: string }) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Partners ──────────────────────────────────────────────────────────────
  @Get('partners')
  findAllPartners(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.findAllPartners(Number(page), Number(limit));
  }

  @Patch('partners/:id/suspend')
  suspendPartner(@Param('id') id: string) {
    return this.adminService.suspendPartner(id);
  }

  @Patch('partners/:id/activate')
  activatePartner(@Param('id') id: string) {
    return this.adminService.activatePartner(id);
  }

  @Delete('partners/:id')
  deletePartner(@Param('id') id: string) {
    return this.adminService.deletePartner(id);
  }

  // ── Servicios ─────────────────────────────────────────────────────────────
  @Get('services')
  findAllServices(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.findAllServices(Number(page), Number(limit));
  }

  @Patch('services/:id')
  updateService(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; price?: number; isActive?: boolean },
  ) {
    return this.adminService.updateService(id, dto);
  }

  @Delete('services/:id')
  deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(id);
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  @Get('bookings')
  findAllBookings(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.findAllBookings(Number(page), Number(limit));
  }
}