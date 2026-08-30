import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(path: string, sessionId: string) {
    await this.prisma.pageView.create({
      data: { path: path.slice(0, 300), session_id: sessionId.slice(0, 100) },
    });
    return { ok: true };
  }

  async visitorStats() {
    // Sequential to avoid piling onto an already-constrained connection pool.
    const today = await this.uniqueSessions(daysAgo(0));
    const last7d = await this.uniqueSessions(daysAgo(6));
    const last30d = await this.uniqueSessions(daysAgo(29));
    return { today, last_7_days: last7d, last_30_days: last30d };
  }

  private async uniqueSessions(since: Date) {
    const rows = await this.prisma.pageView.findMany({
      where: { created_at: { gte: since } },
      select: { session_id: true },
      distinct: ['session_id'],
    });
    return rows.length;
  }
}
