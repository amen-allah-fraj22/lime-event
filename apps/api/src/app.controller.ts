import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private prisma: PrismaService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'lime-api' };
  }

  @Get('health/db')
  async healthDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      // Log the real reason — swallowing it silently is why past "disconnected"
      // states were undiagnosable (was it auth? network? SSL? a paused Supabase
      // project?). Prisma error codes: P1001 = can't reach DB host (paused/
      // network/wrong host), P1000 = auth failed, P1017 = server closed the
      // connection. The response stays generic; the detail goes to server logs only.
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code?: string }).code
          : undefined;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `health/db failed${code ? ` [${code}]` : ''}: ${message.split('\n')[0]}`,
      );
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        code,
        hint: 'Check DATABASE_URL in apps/api/.env; if Supabase, confirm the project is not paused. See server logs for the underlying error.',
      });
    }
  }
}
