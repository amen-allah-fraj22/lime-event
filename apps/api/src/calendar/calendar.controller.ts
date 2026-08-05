import { Controller, Get, Param, Req, UseGuards, Post, Body, Delete, ForbiddenException } from '@nestjs/common';
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

  @Post(':userId/manual-events')
  addManualEvent(
    @Param('userId') userId: string,
    @Req() req: { dbUser: { id: string } },
    @Body() body: { date: string, start_time?: string, end_time?: string, title: string },
  ) {
    if (userId !== req.dbUser.id) throw new ForbiddenException();
    return this.calendarService.addManualEvent(userId, body);
  }

  @Delete(':userId/manual-events/:eventId')
  removeManualEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: { dbUser: { id: string } },
  ) {
    if (userId !== req.dbUser.id) throw new ForbiddenException();
    return this.calendarService.removeManualEvent(userId, eventId);
  }

  @Post(':userId/day-overrides')
  setDayOverride(
    @Param('userId') userId: string,
    @Req() req: { dbUser: { id: string } },
    @Body() body: { date: string, status: 'OPEN' | 'WARN' | 'BLOCKED' },
  ) {
    if (userId !== req.dbUser.id) throw new ForbiddenException();
    return this.calendarService.setDayOverride(userId, body);
  }

  // --- Google Calendar OAuth ---
  
  @Get(':userId/google/auth-url')
  getGoogleAuthUrl(
    @Param('userId') userId: string,
    @Req() req: { dbUser: { id: string } },
  ) {
    if (userId !== req.dbUser.id) throw new ForbiddenException();
    return this.calendarService.getGoogleAuthUrl(userId);
  }

  @Post(':userId/google/callback')
  async handleGoogleCallback(
    @Param('userId') userId: string,
    @Req() req: { dbUser: { id: string } },
    @Body() body: { code: string },
  ) {
    if (userId !== req.dbUser.id) throw new ForbiddenException();
    return this.calendarService.handleGoogleCallback(userId, body.code);
  }

  @Get(':userId/google/events')
  getGoogleCalendarEvents(
    @Param('userId') userId: string,
    @Req() req: { dbUser: { id: string } },
  ) {
    if (userId !== req.dbUser.id) throw new ForbiddenException();
    return this.calendarService.getGoogleCalendarEvents(userId);
  }
}
