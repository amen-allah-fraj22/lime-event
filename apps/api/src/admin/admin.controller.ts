import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { PaymentsService } from '../payments/payments.service';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(ClerkAuthGuard, DbUserGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private paymentsService: PaymentsService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboardStats();
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Get('artists/pending')
  pendingArtists() {
    return this.adminService.pendingArtists();
  }

  @Post('artists/:userId/verify')
  verifyArtist(@Param('userId') userId: string) {
    return this.adminService.verifyArtist(userId);
  }

  @Post('artists/:userId/reject')
  rejectArtist(@Param('userId') userId: string) {
    return this.adminService.rejectArtist(userId);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: { is_active?: boolean; is_verified?: boolean }) {
    return this.adminService.updateUser(id, body);
  }

  @Get('bookings')
  bookings() {
    return this.adminService.listBookings();
  }

  @Get('payments')
  payments() {
    return this.adminService.listPayments();
  }

  @Patch('payments/:id/paid')
  markPaid(@Param('id') id: string) {
    return this.paymentsService.markAsPaid(id);
  }
}
