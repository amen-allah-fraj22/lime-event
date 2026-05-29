import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DbUserGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const clerkUserId = req.clerkUserId as string | undefined;
    if (!clerkUserId) throw new UnauthorizedException();

    try {
      const user = await this.prisma.user.findUnique({
        where: { clerk_user_id: clerkUserId },
      });
      if (!user || !user.is_active) throw new UnauthorizedException();

      req.dbUser = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      if (
        error instanceof Prisma.PrismaClientInitializationError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code))
      ) {
        throw new ServiceUnavailableException({
          message: 'Database unreachable',
          hint: 'Restore your Supabase project if paused, then run npm run db:migrate',
        });
      }
      throw error;
    }
  }
}
