import { ForbiddenException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getForUser(userId: string, requesterId: string) {
    if (userId !== requesterId) {
      throw new ForbiddenException();
    }

    const asArtist = await this.prisma.bookingRequest.findMany({
      where: {
        artist_id: userId,
        status: {
          in: [
            BookingStatus.accepted,
            BookingStatus.contracted,
            BookingStatus.completed,
          ],
        },
      },
      include: { event: true },
    });

    const asOrganizer = await this.prisma.event.findMany({
      where: { organizer_id: userId },
      include: { booking_requests: true },
    });

    const overrides = await this.prisma.dayAvailabilityOverride.findMany({
      where: { artist_id: userId },
    });

    const manualEvents = await this.prisma.artistManualEvent.findMany({
      where: { artist_id: userId },
    });

    const googleData = await this.getGoogleCalendarEvents(userId).catch(() => ({ events: [], connected: false }));

    return {
      bookings_as_artist: asArtist.map((b) => ({
        id: b.id,
        title: b.event.title,
        date: b.event.event_date,
        status: b.status,
        city: b.event.city,
      })),
      events_as_organizer: asOrganizer.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.event_date,
        status: e.status,
        city: e.city,
        is_confirmed: e.booking_requests.some((br) =>
          (
            [
              BookingStatus.accepted,
              BookingStatus.contracted,
              BookingStatus.completed,
            ] as BookingStatus[]
          ).includes(br.status),
        ),
      })),
      day_overrides: overrides,
      manual_events: manualEvents,
      google_events: googleData.events,
      google_connected: googleData.connected,
    };
  }

  async addManualEvent(artistId: string, dto: { date: string, start_time?: string, end_time?: string, title: string }) {
    return this.prisma.artistManualEvent.create({
      data: {
        artist_id: artistId,
        date: new Date(dto.date),
        start_time: dto.start_time,
        end_time: dto.end_time,
        title: dto.title,
      }
    });
  }

  async removeManualEvent(artistId: string, eventId: string) {
    const event = await this.prisma.artistManualEvent.findUnique({ where: { id: eventId } });
    if (!event || event.artist_id !== artistId) {
      throw new ForbiddenException();
    }
    return this.prisma.artistManualEvent.delete({ where: { id: eventId } });
  }

  async setDayOverride(artistId: string, dto: { date: string, status: 'OPEN' | 'WARN' | 'BLOCKED' }) {
    const targetDate = new Date(dto.date);
    return this.prisma.dayAvailabilityOverride.upsert({
      where: {
        artist_id_date: {
          artist_id: artistId,
          date: targetDate,
        }
      },
      update: {
        status: dto.status,
      },
      create: {
        artist_id: artistId,
        date: targetDate,
        status: dto.status,
      }
    });
  }

  // --- Google Calendar OAuth ---
  getGoogleAuthUrl(artistId: string) {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: artistId, // Pass artistId in state to know who is connecting
      prompt: 'consent' // Force consent to get refresh token
    });

    return { url };
  }

  async handleGoogleCallback(artistId: string, code: string) {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens to database
    await this.prisma.artistProfile.update({
      where: { user_id: artistId },
      data: {
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      }
    });

    return { success: true };
  }

  async getGoogleCalendarEvents(artistId: string) {
    const profile = await this.prisma.artistProfile.findUnique({
      where: { user_id: artistId }
    });

    if (!profile || !profile.google_calendar_refresh_token) {
      return { events: [], connected: false };
    }

    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: profile.google_calendar_access_token,
      refresh_token: profile.google_calendar_refresh_token,
      expiry_date: profile.google_calendar_token_expiry?.getTime() || 0,
    });

    // Handle token refresh automatically by googleapis
    oauth2Client.on('tokens', async (tokens: any) => {
      if (tokens.refresh_token) {
        await this.prisma.artistProfile.update({
          where: { user_id: artistId },
          data: {
            google_calendar_access_token: tokens.access_token,
            google_calendar_refresh_token: tokens.refresh_token,
            google_calendar_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          }
        });
      } else {
        await this.prisma.artistProfile.update({
          where: { user_id: artistId },
          data: {
            google_calendar_access_token: tokens.access_token,
            google_calendar_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          }
        });
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Fetch events from today to 6 months in future
    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 6);

    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items?.map((item: any) => ({
        id: item.id,
        title: item.summary || 'Busy',
        date: item.start?.date || item.start?.dateTime,
        end_date: item.end?.date || item.end?.dateTime,
      })) || [];

      return { events, connected: true };
    } catch (error) {
      console.error('Failed to fetch Google Calendar events', error);
      return { events: [], connected: true, error: 'Failed to sync' };
    }
  }
}
