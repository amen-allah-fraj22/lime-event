import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateProfileCompletion,
  isProfileComplete,
  toPublicArtistProfile,
} from './artist-profile.utils';
import { buildArtistPhotoUrl } from './artist-photo.multer';
import { BrowseArtistsDto } from './dto/browse-artists.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async browse(query: BrowseArtistsDto) {
    const where: Prisma.ArtistProfileWhereInput = {};

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
    return toPublicArtistProfile(profile);
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

    const url = buildArtistPhotoUrl(profileId, file.filename);
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
