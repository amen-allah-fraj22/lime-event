import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendQuoteDto } from './dto/send-quote.dto';

const QUOTE_EXPIRY_HOURS = 48;
const MAX_REQUESTS_PER_EVENT = 5;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private contracts: ContractsService,
  ) {}

  async create(organizerId: string, dto: CreateBookingDto) {
    const event = await this.prisma.event.findUnique({ where: { id: dto.event_id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer_id !== organizerId) throw new ForbiddenException();

    const count = await this.prisma.bookingRequest.count({
      where: { event_id: dto.event_id },
    });
    if (count >= MAX_REQUESTS_PER_EVENT) {
      throw new BadRequestException('Maximum 5 requests per event');
    }

    const booking = await this.prisma.bookingRequest.create({
      data: {
        event_id: dto.event_id,
        artist_id: dto.artist_id,
        organizer_id: organizerId,
        message: dto.message,
        status: BookingStatus.pending,
      },
      include: { event: true, artist: true, organizer: true },
    });

    await this.notifications.notifyUser(
      dto.artist_id,
      'booking_request',
      'New booking request',
      `You have a new request for ${event.title}`,
    );

    return booking;
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        event: true,
        artist: {
          include: {
            artist_profile: {
              select: {
                id: true,
                display_name: true,
                bio: true,
                genres: true,
                city: true,
                avg_rating: true,
                total_bookings: true,
              },
            },
          },
        },
        organizer: true,
        contract: true,
        payment: true,
        messages: { orderBy: { created_at: 'asc' } },
      },
    });
    if (!booking) throw new NotFoundException();
    if (booking.organizer_id !== userId && booking.artist_id !== userId) {
      throw new ForbiddenException();
    }
    return booking;
  }

  async sendQuote(bookingId: string, artistId: string, dto: SendQuoteDto) {
    const booking = await this.getBookingForArtist(bookingId, artistId);
    const expires = new Date();
    expires.setHours(expires.getHours() + QUOTE_EXPIRY_HOURS);

    const updated = await this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.quoted,
        quote_amount: dto.quote_amount,
        quote_conditions: dto.quote_conditions as Prisma.InputJsonValue,
        quote_expires_at: expires,
      },
    });

    await this.notifications.notifyUser(
      booking.organizer_id,
      'quote_received',
      'Quote received',
      'An artist sent you a quote',
    );

    return updated;
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
      data: { status: BookingStatus.accepted },
      include: {
        event: true,
        artist: { include: { artist_profile: true } },
        organizer: true,
        contract: true,
      },
    });

    await this.notifications.notifyUser(
      booking.artist_id,
      'quote_accepted',
      'Quote accepted',
      `Your quote for ${booking.event.title} was accepted`,
    );

    await this.contracts.createForBooking(bookingId);

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
    return this.prisma.message.create({
      data: {
        booking_request_id: bookingId,
        sender_id: senderId,
        content: dto.content,
      },
    });
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
