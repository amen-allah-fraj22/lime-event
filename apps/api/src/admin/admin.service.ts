import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
    private notifications: NotificationsService,
  ) {}

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
    // Sequential rather than Promise.all: this endpoint can run a dozen
    // queries in one call, and the Supabase pooler here is capped at a
    // small number of concurrent connections — firing them all at once
    // starves other requests. One at a time keeps this to a single
    // connection at the cost of a slightly slower response.
    const users = await this.prisma.user.count();
    const bookings = await this.prisma.bookingRequest.count({
      where: { status: { in: ['pending', 'quoted', 'accepted', 'contracted'] } },
    });
    const payments = await this.prisma.payment.findMany({ where: { status: 'released' } });
    const pendingPayouts = await this.prisma.payment.count({ where: { status: 'held' } });
    const artistCount = await this.prisma.user.count({ where: { roles: { has: 'artist' } } });
    const organizerCount = await this.prisma.user.count({ where: { roles: { has: 'organizer' } } });
    const agencyCount = await this.prisma.user.count({ where: { roles: { has: 'agency' } } });
    const verifiedArtistCount = await this.prisma.artistProfile.count({
      where: { user: { is_verified: true } },
    });
    const pendingArtistCount = await this.prisma.artistProfile.count({
      where: { user: { is_verified: false } },
    });
    const completionAgg = await this.prisma.artistProfile.aggregate({
      _avg: { profile_completion: true },
    });
    const visitors = await this.analytics.visitorStats();
    const totalRevenue = payments.reduce((s, p) => s + p.commission_amount, 0);
    return {
      total_users: users,
      active_bookings: bookings,
      total_revenue_tnd: totalRevenue,
      pending_payouts: pendingPayouts,
      accounts_by_role: {
        artist: artistCount,
        organizer: organizerCount,
        agency: agencyCount,
      },
      artist_verification: {
        verified: verifiedArtistCount,
        pending: pendingArtistCount,
      },
      avg_artist_profile_completion: Math.round(completionAgg._avg.profile_completion ?? 0),
      visitors,
    };
  }

  async pendingArtists() {
    return this.prisma.artistProfile.findMany({
      where: { user: { is_verified: false } },
      include: { user: { select: { id: true, email: true, created_at: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async verifyArtist(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { is_verified: true },
    });
    await this.notifications
      .notifyUser(
        userId,
        'artist_verified',
        "Your profile is now live!",
        "An admin approved your artist profile — organizers can now find and book you.",
      )
      .catch(() => undefined);
    return updated;
  }

  async rejectArtist(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.notifications
      .notifyUser(
        userId,
        'artist_verification_needed',
        'Your profile needs a few changes',
        "An admin reviewed your profile and it isn't ready to go live yet — please check your details and try again.",
      )
      .catch(() => undefined);
    return { ok: true };
  }
}
