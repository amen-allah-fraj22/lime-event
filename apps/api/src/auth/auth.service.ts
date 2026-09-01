import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { isAppRole } from './app-roles';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async syncUser(dto: SyncUserDto) {
    const incomingRoles = dto.roles.filter(isAppRole);
    const existing = await this.prisma.user.findUnique({
      where: { clerk_user_id: dto.clerk_user_id },
    });

    if (existing) {
      const mergedRoles = Array.from(new Set([...existing.roles, ...incomingRoles]));
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { roles: mergedRoles },
      });
      await this.ensureArtistProfile(user.id, mergedRoles, dto.email);
      return user;
    }

    const roles = incomingRoles.length ? incomingRoles : ['organizer'];
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        roles,
        active_role: roles[0],
        clerk_user_id: dto.clerk_user_id,
      },
    });

    await this.ensureArtistProfile(user.id, roles, dto.email);
    return user;
  }

  /** Deletes cascade to ArtistProfile/Events/BookingRequests via onDelete: Cascade in the schema. */
  async deleteUserByClerkId(clerkUserId: string) {
    await this.prisma.user.deleteMany({ where: { clerk_user_id: clerkUserId } });
  }

  private async ensureArtistProfile(
    userId: string,
    roles: string[],
    email: string,
  ) {
    if (!roles.includes('artist')) return;

    const profile = await this.prisma.artistProfile.findUnique({
      where: { user_id: userId },
    });
    if (profile) return;

    await this.prisma.artistProfile.create({
      data: {
        user_id: userId,
        display_name: email.split('@')[0],
        genres: [],
      },
    });
  }
}
