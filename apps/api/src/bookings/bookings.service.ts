import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { shouldMoveToNegotiating } from './booking-timeline.util';

const QUOTE_EXPIRY_HOURS = 48;
const MAX_REQUESTS_PER_EVENT = 5;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateBookingDto) {
    const event = await this.prisma.event.findUnique({ where: { id: dto.event_id } });
    if (!event) throw new NotFoundException('Event not found');

    let initiated_by = 'organizer';
    let organizerId = event.organizer_id;
    let artistId = dto.artist_id;

    if (event.organizer_id === userId) {
      // Organizer is inviting an artist
      initiated_by = 'organizer';
    } else if (dto.artist_id === userId || !dto.artist_id) {
      // Artist is applying to an event
      initiated_by = 'artist';
      artistId = userId; // Implicitly set artist_id to the sender
    } else {
      throw new ForbiddenException('You must be the event organizer or the applying artist.');
    }

    const count = await this.prisma.bookingRequest.count({
      where: { event_id: dto.event_id, artist_id: artistId },
    });
    if (count > 0) {
      throw new BadRequestException('A booking request already exists for this artist and event');
    }

    const totalRequests = await this.prisma.bookingRequest.count({
      where: { event_id: dto.event_id },
    });
    if (totalRequests >= MAX_REQUESTS_PER_EVENT) {
      throw new BadRequestException('Maximum 5 requests per event');
    }

    const booking = await this.prisma.bookingRequest.create({
      data: {
        event_id: dto.event_id,
        artist_id: artistId,
        organizer_id: organizerId,
        message: dto.message,
        status: BookingStatus.pending,
        quote_conditions: { initiated_by },
      },
      include: { event: true, artist: true, organizer: true },
    });

    if (initiated_by === 'organizer') {
      await this.notifications.notifyUser(
        artistId,
        'booking_request',
        'New booking request',
        `You have a new request for ${event.title}`,
      );
    } else {
      await this.notifications.notifyUser(
        organizerId,
        'booking_request',
        'New artist application',
        `An artist applied to perform at ${event.title}`,
      );
    }

    return booking;
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        event: true,
        artist: {
          include: {
            artist_profile: true,
          },
        },
        organizer: true,
        contract: true,
        payment: true,
        messages: { orderBy: { created_at: 'asc' } },
        negotiation_offers: { orderBy: { created_at: 'asc' } },
      },
    });
    if (!booking) throw new NotFoundException();
    if (booking.organizer_id !== userId && booking.artist_id !== userId) {
      throw new ForbiddenException();
    }
    return booking;
  }

  async sendQuote(bookingId: string, artistId: string, dto: SendQuoteDto) {
    await this.getBookingForArtist(bookingId, artistId);
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException();

    const expires = new Date();
    expires.setHours(expires.getHours() + QUOTE_EXPIRY_HOURS);

    await this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        quote_expires_at: expires,
        quote_conditions: dto.quote_conditions as Prisma.InputJsonValue,
      },
    });

    const note =
      typeof dto.quote_conditions === 'object' &&
      dto.quote_conditions &&
      'note' in dto.quote_conditions
        ? String((dto.quote_conditions as { note?: string }).note)
        : undefined;

    const offer = await this.sendOffer(bookingId, artistId, {
      fee: dto.quote_amount,
      message: note,
    });

    await this.notifications.notifyUser(
      booking.organizer_id,
      'quote_received',
      'Offer received',
      'An artist sent you an offer',
    );

    return offer;
  }

  async acceptQuote(bookingId: string, organizerId: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });
    if (!booking) throw new NotFoundException();
    if (booking.organizer_id !== organizerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.quoted && booking.status !== BookingStatus.negotiating) {
      throw new BadRequestException('Quote must be quoted before accept');
    }
    if (booking.quote_expires_at && booking.quote_expires_at < new Date()) {
      await this.prisma.bookingRequest.update({
        where: { id: bookingId },
        data: { status: BookingStatus.expired },
      });
      throw new BadRequestException('Quote has expired');
    }

    const updated = await this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.accepted,
        agreed_fee: booking.quote_amount,
        confirmed_at: new Date(),
      },
      include: {
        event: true,
        artist: { include: { artist_profile: true } },
        organizer: true,
      },
    });

    await this.notifications.notifyUser(
      booking.artist_id,
      'quote_accepted',
      'Offer accepted',
      `Your offer for ${booking.event.title} was accepted`,
    );

    return this.findOne(bookingId, organizerId);
  }

  async listForUser(userId: string) {
    return this.prisma.bookingRequest.findMany({
      where: {
        OR: [{ organizer_id: userId }, { artist_id: userId }],
      },
      include: {
        event: { select: { id: true, title: true, event_date: true, city: true } },
        artist: {
          include: { artist_profile: { select: { id: true, display_name: true } } },
        },
        organizer: { select: { id: true, email: true } },
        contract: { select: { id: true, status: true } },
        payment: {
          select: {
            gross_amount: true,
            commission_amount: true,
            net_amount: true,
            status: true,
            released_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    status: BookingStatus,
  ) {
    const booking = await this.findOne(bookingId, userId);
    const allowed: BookingStatus[] = [BookingStatus.declined, BookingStatus.cancelled, BookingStatus.negotiating];
    if (!allowed.includes(status)) throw new BadRequestException();

    if (status === BookingStatus.declined && booking.artist_id !== userId) {
      throw new ForbiddenException();
    }
    if (status === BookingStatus.cancelled && booking.organizer_id !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  async getMessages(bookingId: string, userId: string) {
    await this.findOne(bookingId, userId);
    return this.prisma.message.findMany({
      where: { booking_request_id: bookingId },
      orderBy: { created_at: 'asc' },
    });
  }

  async sendMessage(bookingId: string, senderId: string, dto: SendMessageDto) {
    await this.findOne(bookingId, senderId);
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
    });
    if (
      booking &&
      shouldMoveToNegotiating(booking.status, senderId, booking.artist_id)
    ) {
      await this.prisma.bookingRequest.update({
        where: { id: bookingId },
        data: { status: BookingStatus.negotiating },
      });
    }
    return this.prisma.message.create({
      data: {
        booking_request_id: bookingId,
        sender_id: senderId,
        content: dto.content,
        message_type: 'text',
      },
    });
  }

  async getThread(bookingId: string, userId: string) {
    await this.findOne(bookingId, userId);
    const [messages, offers] = await Promise.all([
      this.prisma.message.findMany({
        where: { booking_request_id: bookingId },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.negotiationOffer.findMany({
        where: { booking_request_id: bookingId },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    type ThreadItem =
      | { kind: 'message'; id: string; created_at: Date; sender_id: string; content: string; message_type: string }
      | {
          kind: 'offer';
          id: string;
          created_at: Date;
          proposed_by: string;
          fee: number;
          message: string | null;
          includes_transport: boolean;
          includes_meals: boolean;
          includes_accommodation: boolean;
          other_conditions: string | null;
          status: string;
        };

    const merged: ThreadItem[] = [
      ...messages.map((m) => ({
        kind: 'message' as const,
        id: m.id,
        created_at: m.created_at,
        sender_id: m.sender_id,
        content: m.content,
        message_type: m.message_type,
      })),
      ...offers.map((o) => ({
        kind: 'offer' as const,
        id: o.id,
        created_at: o.created_at,
        proposed_by: o.proposed_by,
        fee: o.fee,
        message: o.message,
        includes_transport: o.includes_transport,
        includes_meals: o.includes_meals,
        includes_accommodation: o.includes_accommodation,
        other_conditions: o.other_conditions,
        status: o.status,
      })),
    ];

    return merged.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  async sendOffer(bookingId: string, userId: string, dto: CreateOfferDto) {
    const booking = await this.findOne(bookingId, userId);
    const locked: BookingStatus[] = [
      BookingStatus.accepted,
      BookingStatus.contracted,
      BookingStatus.completed,
      BookingStatus.cancelled,
      BookingStatus.declined,
    ];
    if (locked.includes(booking.status)) {
      throw new BadRequestException(
        'This booking is already confirmed. Use messages to coordinate details.',
      );
    }

    await this.prisma.negotiationOffer.updateMany({
      where: { booking_request_id: bookingId, status: 'pending' },
      data: { status: 'superseded' },
    });

    const offer = await this.prisma.negotiationOffer.create({
      data: {
        booking_request_id: bookingId,
        proposed_by: userId,
        fee: dto.fee,
        message: dto.message,
        includes_transport: dto.includes_transport ?? false,
        includes_meals: dto.includes_meals ?? false,
        includes_accommodation: dto.includes_accommodation ?? false,
        other_conditions: dto.other_conditions,
      },
    });

    await this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.quoted,
        quote_amount: dto.fee,
        quote_conditions: dto.other_conditions
          ? ({ note: dto.other_conditions } as Prisma.InputJsonValue)
          : undefined,
      },
    });

    await this.prisma.message.create({
      data: {
        booking_request_id: bookingId,
        sender_id: userId,
        content: `New offer: ${dto.fee.toLocaleString()} TND`,
        message_type: 'offer',
      },
    });

    return offer;
  }

  async acceptOffer(offerId: string, bookingId: string, userId: string, closeEvent?: boolean) {
    const booking = await this.findOne(bookingId, userId);
    const offer = await this.prisma.negotiationOffer.findFirst({
      where: { id: offerId, booking_request_id: bookingId },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.proposed_by === userId) {
      throw new BadRequestException('You cannot accept your own offer');
    }
    if (offer.status !== 'pending') {
      throw new BadRequestException('Offer is no longer pending');
    }

    await this.prisma.negotiationOffer.update({
      where: { id: offerId },
      data: { status: 'accepted' },
    });

    await this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.accepted,
        agreed_fee: offer.fee,
        quote_amount: offer.fee,
        confirmed_at: new Date(),
      },
    });

    if (closeEvent) {
      // Close the event
      await this.prisma.event.update({
        where: { id: booking.event_id },
        data: { status: 'closed' },
      });
      // Decline other pending requests for this event
      await this.prisma.bookingRequest.updateMany({
        where: {
          event_id: booking.event_id,
          id: { not: bookingId },
          status: BookingStatus.pending,
        },
        data: { status: BookingStatus.declined },
      });
    }

    await this.prisma.message.create({
      data: {
        booking_request_id: bookingId,
        sender_id: userId,
        content: `✅ Offer of ${offer.fee.toLocaleString()} TND accepted. Booking confirmed.${closeEvent ? ' Event is now closed.' : ''}`,
        message_type: 'system',
      },
    });

    const otherId =
      booking.organizer_id === userId ? booking.artist_id : booking.organizer_id;
    await this.notifications.notifyUser(
      otherId,
      'booking_confirmed',
      'Booking confirmed',
      `Offer accepted for ${booking.event.title}`,
    );

    return offer;
  }

  async declineOffer(offerId: string, bookingId: string, userId: string) {
    const booking = await this.findOne(bookingId, userId);
    const offer = await this.prisma.negotiationOffer.findFirst({
      where: { id: offerId, booking_request_id: bookingId },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.proposed_by === userId) {
      throw new BadRequestException('You cannot decline your own offer');
    }

    const updated = await this.prisma.negotiationOffer.update({
      where: { id: offerId },
      data: { status: 'declined' },
    });

    await this.prisma.message.create({
      data: {
        booking_request_id: bookingId,
        sender_id: userId,
        content: `Offer of ${offer.fee.toLocaleString()} TND was declined.`,
        message_type: 'system',
      },
    });

    await this.notifications.notifyUser(
      offer.proposed_by,
      'offer_declined',
      'Offer declined',
      `Your offer for ${booking.event.title} was declined`,
    );

    return updated;
  }

  private async getBookingForArtist(bookingId: string, artistId: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException();
    if (booking.artist_id !== artistId) throw new ForbiddenException();
    return booking;
  }
}
