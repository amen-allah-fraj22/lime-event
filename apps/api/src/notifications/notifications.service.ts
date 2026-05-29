import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async notifyUser(userId: string, type: string, title: string, body: string) {
    const notification = await this.prisma.notification.create({
      data: { user_id: userId, type, title, body },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email && process.env.RESEND_API_KEY) {
      await this.email.sendGeneric(user.email, title, body).catch(() => undefined);
    }

    return notification;
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }
}
