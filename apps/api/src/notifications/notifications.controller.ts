import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: { dbUser: { id: string } }) {
    return this.notificationsService.listForUser(req.dbUser.id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: { dbUser: { id: string } }) {
    return this.notificationsService.markAllRead(req.dbUser.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.notificationsService.markRead(id, req.dbUser.id);
  }
}
