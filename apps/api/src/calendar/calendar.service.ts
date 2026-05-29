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

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { artist_id: userId },
    });

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
      })),
      availability_blocks: blocks,
    };
  }
}
