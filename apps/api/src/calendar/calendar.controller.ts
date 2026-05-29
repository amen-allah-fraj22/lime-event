import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get(':userId')
  get(
    @Param('userId') userId: string,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.calendarService.getForUser(userId, req.dbUser.id);
  }
}
