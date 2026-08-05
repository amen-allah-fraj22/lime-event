import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicArtistProfile } from '../artists/artist-profile.utils';
import { CreateEventDto } from './dto/create-event.dto';
import { buildEventPhotoUrl } from './event-photo.multer';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(organizerId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        organizer_id: organizerId,
        title: dto.title,
        event_type: dto.event_type,
        city: dto.city,
        venue: dto.venue,
        event_date: new Date(dto.event_date),
        start_time: dto.start_time,
        duration_hours: dto.duration_hours,
        guest_count: dto.guest_count,
        budget_min: dto.budget_min,
        budget_max: dto.budget_max,
        style_tags: dto.style_tags ?? [],
        status: 'open',
      },
    });
  }

  async uploadPhoto(eventId: string, organizerId: string, file: Express.Multer.File) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException();
    if (event.organizer_id !== organizerId) throw new ForbiddenException();

    const url = buildEventPhotoUrl(eventId, file.filename);
    return this.prisma.event.update({
      where: { id: eventId },
      data: { venue_photo_url: url },
    });
  }

  async listPublicEvents() {
    return this.prisma.event.findMany({
      where: { status: 'open' },
      include: {
        organizer: { select: { id: true, email: true } },
      },
      orderBy: { event_date: 'asc' },
    });
  }

  async listForOrganizer(organizerId: string) {
    return this.prisma.event.findMany({
      where: { organizer_id: organizerId },
      include: {
        booking_requests: {
          include: {
            artist: { include: { artist_profile: true } },
          },
        },
      },
      orderBy: { event_date: 'asc' },
    });
  }

  async findOne(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { id: true, email: true } } },
    });
    if (!event) throw new NotFoundException();
    return event;
  }

  async getQuotes(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { id: true, email: true } } },
    });
    if (!event) throw new NotFoundException();
    if (event.organizer_id !== organizerId) throw new ForbiddenException();

    const quotes = await this.prisma.bookingRequest.findMany({
      where: {
        event_id: eventId,
        status: { in: [BookingStatus.quoted, BookingStatus.negotiating] },
      },
      include: {
        artist: { include: { artist_profile: true } },
      },
      orderBy: { quote_amount: 'asc' },
    });

    return { event, quotes };
  }

  async getMatches(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException();
    if (event.organizer_id !== organizerId) throw new ForbiddenException();

    const where: Prisma.ArtistProfileWhereInput = {};

    if (event.city) {
      where.city = { contains: event.city, mode: 'insensitive' };
    }
    // Artist pay is private and negotiated per booking (never disclosed upfront),
    // so matching never filters on price — the organizer's budget is just context
    // shown to the artist, who decides whether to respond.

    let artists = await this.prisma.artistProfile.findMany({
      where,
      include: { user: true },
    });

    if (event.event_type) {
      const eventType = String(event.event_type);
      artists = artists.filter(
        (a) =>
          a.performance_types.length === 0 ||
          a.performance_types.includes(eventType),
      );
    }

    const bookedArtistIds = await this.getBookedArtistIds(event.event_date);
    const available = artists.filter((a) => !bookedArtistIds.has(a.user_id));

    return available
      .sort((a, b) => {
        const completeDiff =
          Number(b.is_profile_complete) - Number(a.is_profile_complete);
        if (completeDiff !== 0) return completeDiff;
        const scoreDiff = b.profile_completion - a.profile_completion;
        if (scoreDiff !== 0) return scoreDiff;
        return b.avg_rating - a.avg_rating;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(toPublicArtistProfile);
  }

  private async getBookedArtistIds(date: Date): Promise<Set<string>> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await this.prisma.bookingRequest.findMany({
      where: {
        status: {
          in: [
            BookingStatus.accepted,
            BookingStatus.contracted,
            BookingStatus.completed,
          ],
        },
        event: {
          event_date: { gte: dayStart, lte: dayEnd },
        },
      },
      select: { artist_id: true },
    });
    return new Set(booked.map((b) => b.artist_id));
  }
}
