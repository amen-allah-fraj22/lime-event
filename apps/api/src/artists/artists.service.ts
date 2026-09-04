import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  calculateProfileCompletion,
  isProfileComplete,
  toPublicArtistProfile,
} from './artist-profile.utils';
import { buildArtistPhotoFilename, buildArtistPhotoUrl } from './artist-photo.multer';
import { BrowseArtistsDto } from './dto/browse-artists.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

const ARTIST_PHOTOS_BUCKET = 'artist-photos';

@Injectable()
export class ArtistsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async browse(query: BrowseArtistsDto) {
    // Only verified artists are publicly discoverable — an admin approves a
    // profile before organizers can find it in Explore/search. The artist's
    // own profile page (findOne, below) stays reachable while pending so
    // they can keep viewing/editing it.
    const where: Prisma.ArtistProfileWhereInput = { user: { is_verified: true } };

    if (query.city?.trim()) {
      where.city = { contains: query.city.trim(), mode: 'insensitive' };
    }
    if (query.search) {
      where.OR = [
        { display_name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.artist_type) {
      where.artist_type = query.artist_type;
    }
    if (query.has_sound === 'true') {
      where.provides_sound_system = true;
    }
    if (query.has_lighting === 'true') {
      where.provides_lighting = true;
    }
    if (query.has_mixing === 'true') {
      where.provides_mixing_desk = true;
    }

    const take = query.genre?.trim() ? 200 : 50;

    let artists = await this.prisma.artistProfile.findMany({
      where,
      include: { user: { select: { id: true, email: true, is_verified: true } } },
      orderBy: [{ profile_completion: 'desc' }, { avg_rating: 'desc' }],
      take,
    });

    if (query.genre?.trim()) {
      const search = query.genre.trim().toLowerCase();
      artists = artists.filter(
        (a) =>
          a.genres.some((g) => g.toLowerCase().includes(search)) ||
          a.subgenres.some((g) => g.toLowerCase().includes(search)),
      );
    }

    return artists.slice(0, 50).map(toPublicArtistProfile);
  }

  async findOne(id: string) {
    const profile = await this.prisma.artistProfile.findFirst({
      where: { OR: [{ id }, { user_id: id }] },
      include: { user: { select: { id: true, is_verified: true } } },
    });
    if (!profile) throw new NotFoundException('Artist not found');

    const [viewsThisWeek, availabilityPreview] = await Promise.all([
      this.profileViewsThisWeek(profile.id),
      this.getAvailabilityPreview(profile.user_id),
    ]);

    return {
      ...toPublicArtistProfile(profile),
      views_this_week: viewsThisWeek,
      availability_preview: availabilityPreview,
    };
  }

  /** Distinct visiting sessions that hit this artist's public profile page in the last 7 days. */
  private async profileViewsThisWeek(profileId: string): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const rows = await this.prisma.pageView.findMany({
      where: { path: `/artists/${profileId}`, created_at: { gte: since } },
      select: { session_id: true },
      distinct: ['session_id'],
    });
    return rows.length;
  }

  /**
   * Day-by-day open/busy/blocked status for the next ~6 weeks, for the
   * public profile's availability preview. Deliberately excludes any event
   * titles or booking details — just enough for an organizer to see "is
   * this artist plausibly free," not who else booked them or for what.
   */
  private async getAvailabilityPreview(
    userId: string,
  ): Promise<{ date: string; status: 'open' | 'busy' | 'blocked' | 'booked' }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() + 42);

    const [overrides, bookings] = await Promise.all([
      this.prisma.dayAvailabilityOverride.findMany({
        where: { artist_id: userId, date: { gte: today, lte: rangeEnd } },
      }),
      this.prisma.bookingRequest.findMany({
        where: {
          artist_id: userId,
          status: { in: ['accepted', 'contracted', 'completed'] },
          event: { event_date: { gte: today, lte: rangeEnd } },
        },
        include: { event: { select: { event_date: true } } },
      }),
    ]);

    const bookedDates = new Set(bookings.map((b) => b.event.event_date.toISOString().slice(0, 10)));
    const overrideByDate = new Map(
      overrides.map((o) => [o.date.toISOString().slice(0, 10), o.status]),
    );

    const days: { date: string; status: 'open' | 'busy' | 'blocked' | 'booked' }[] = [];
    for (let d = new Date(today); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const override = overrideByDate.get(key);
      const status = bookedDates.has(key)
        ? 'booked'
        : override === 'BLOCKED'
          ? 'blocked'
          : override === 'WARN'
            ? 'busy'
            : 'open';
      days.push({ date: key, status });
    }
    return days;
  }

  async getAvailability(artistId: string, dateStr: string) {
    const profile = await this.prisma.artistProfile.findFirst({
      where: { OR: [{ id: artistId }, { user_id: artistId }] },
      select: { user_id: true }
    });
    if (!profile) throw new NotFoundException('Artist not found');

    const targetDate = new Date(dateStr);
    
    const override = await this.prisma.dayAvailabilityOverride.findFirst({
      where: {
        artist_id: profile.user_id,
        date: targetDate,
      }
    });

    if (override?.status === 'BLOCKED') {
      return { available: false, reason: 'artist_blocked' };
    }
    if (override?.status === 'WARN') {
      return { available: true, warning: 'artist_busy' };
    }

    return { available: true };
  }

  async update(profileId: string, userId: string, dto: UpdateArtistDto) {
    const profile = await this.prisma.artistProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException();
    if (profile.user_id !== userId) throw new ForbiddenException();

    const data: Prisma.ArtistProfileUpdateInput = {
      ...dto,
      portfolio_links: dto.portfolio_links as Prisma.InputJsonValue | undefined,
      band_members: dto.band_members as Prisma.InputJsonValue | undefined,
    };

    const updated = await this.prisma.artistProfile.update({
      where: { id: profileId },
      data,
      include: { user: { select: { id: true, is_verified: true } } },
    });

    const score = calculateProfileCompletion(updated);
    return this.prisma.artistProfile.update({
      where: { id: profileId },
      data: {
        profile_completion: score,
        is_profile_complete: isProfileComplete(score),
      },
      include: { user: { select: { id: true, is_verified: true } } },
    });
  }

  async uploadPhoto(
    profileId: string,
    userId: string,
    kind: 'profile' | 'cover',
    file: Express.Multer.File,
  ) {
    const profile = await this.prisma.artistProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException();
    if (profile.user_id !== userId) throw new ForbiddenException();

    const url = this.storage.enabled
      ? await this.storage.upload(
          ARTIST_PHOTOS_BUCKET,
          `${profileId}/${buildArtistPhotoFilename(kind, file.originalname)}`,
          file.buffer,
          file.mimetype,
        )
      : buildArtistPhotoUrl(profileId, file.filename);
    const field = kind === 'cover' ? 'cover_photo_url' : 'profile_photo_url';

    const updated = await this.prisma.artistProfile.update({
      where: { id: profileId },
      data: { [field]: url },
      include: { user: { select: { id: true, is_verified: true } } },
    });

    const score = calculateProfileCompletion(updated);
    await this.prisma.artistProfile.update({
      where: { id: profileId },
      data: {
        profile_completion: score,
        is_profile_complete: isProfileComplete(score),
      },
    });

    return { url, kind };
  }
}
