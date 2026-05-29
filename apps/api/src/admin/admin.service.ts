import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      include: { artist_profile: true },
    });
  }

  updateUser(id: string, data: { is_active?: boolean; is_verified?: boolean }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  listBookings() {
    return this.prisma.bookingRequest.findMany({
      include: { event: true, artist: true, organizer: true },
      orderBy: { created_at: 'desc' },
    });
  }

  listPayments() {
    return this.prisma.payment.findMany({
      include: { booking_request: { include: { event: true } } },
      orderBy: { id: 'desc' },
    });
  }

  async dashboardStats() {
    const [users, bookings, payments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.bookingRequest.count({
        where: { status: { in: ['pending', 'quoted', 'accepted', 'contracted'] } },
      }),
      this.prisma.payment.findMany({ where: { status: 'released' } }),
    ]);
    const totalRevenue = payments.reduce((s, p) => s + p.commission_amount, 0);
    const pendingPayouts = await this.prisma.payment.count({
      where: { status: 'held' },
    });
    return {
      total_users: users,
      active_bookings: bookings,
      total_revenue_tnd: totalRevenue,
      pending_payouts: pendingPayouts,
    };
  }
}
