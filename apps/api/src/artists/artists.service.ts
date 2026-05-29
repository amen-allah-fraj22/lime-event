import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BrowseArtistsDto } from './dto/browse-artists.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async browse(query: BrowseArtistsDto) {
    const where: Prisma.ArtistProfileWhereInput = {};

    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }
    if (query.genre) {
      where.genres = { has: query.genre };
    }
    if (query.priceMin != null) {
      where.pricing_max = { gte: query.priceMin };
    }
    if (query.priceMax != null) {
      where.pricing_min = { lte: query.priceMax };
    }
    if (query.search) {
      where.OR = [
        { display_name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.artistProfile.findMany({
      where,
      include: { user: { select: { id: true, email: true, is_verified: true } } },
      orderBy: { avg_rating: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.artistProfile.findFirst({
      where: { OR: [{ id }, { user_id: id }] },
      include: { user: { select: { id: true, is_verified: true } } },
    });
    if (!profile) throw new NotFoundException('Artist not found');
    return profile;
  }

  async update(profileId: string, userId: string, dto: UpdateArtistDto) {
    const profile = await this.prisma.artistProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException();
    if (profile.user_id !== userId) throw new ForbiddenException();

    return this.prisma.artistProfile.update({
      where: { id: profileId },
      data: {
        ...dto,
        portfolio_links: dto.portfolio_links as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
