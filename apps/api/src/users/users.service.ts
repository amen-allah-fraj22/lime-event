import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { canSwitchActiveRole, isAppRole } from '../auth/app-roles';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(clerkUserId: string) {
    return this.prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
      include: { artist_profile: true },
    });
  }

  async addRole(userId: string, role: string) {
    if (!isAppRole(role)) {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.roles.includes('agency')) {
      throw new ForbiddenException(
        'Agency accounts cannot add artist or organizer roles',
      );
    }
    if (role === 'organizer' && !user.roles.includes('artist')) {
      throw new BadRequestException(
        'Only artist accounts can add organizer access',
      );
    }
    if (role === 'artist' && !user.roles.includes('organizer')) {
      throw new BadRequestException(
        'Only organizer accounts can add artist access',
      );
    }

    if (user.roles.includes(role)) return user;

    const roles = [...user.roles, role];
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });

    if (role === 'artist') {
      const profile = await this.prisma.artistProfile.findUnique({
        where: { user_id: userId },
      });
      if (!profile) {
        await this.prisma.artistProfile.create({
          data: {
            user_id: userId,
            display_name: user.email.split('@')[0],
            genres: [],
          },
        });
      }
    }

    return this.getMe(updated.clerk_user_id);
  }

  async setActiveRole(userId: string, activeRole: string) {
    if (!isAppRole(activeRole)) {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.roles.includes(activeRole)) {
      throw new BadRequestException('Role not assigned to user');
    }
    if (!canSwitchActiveRole(user.roles, activeRole)) {
      throw new ForbiddenException(
        'Agency accounts cannot switch to artist or organizer mode',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { active_role: activeRole },
      include: { artist_profile: true },
    });
  }

  async profileCompleteness(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { artist_profile: true },
    });
    if (!user) return 0;
    if (!user.roles.includes('artist') || !user.artist_profile) {
      return user.email ? 50 : 0;
    }
    const p = user.artist_profile;
    let score = 20;
    if (p.bio) score += 15;
    if (p.genres.length) score += 15;
    if (p.city) score += 15;
    if (p.pricing_min != null && p.pricing_max != null) score += 20;
    if (p.portfolio_links) score += 15;
    return Math.min(100, score);
  }
}
