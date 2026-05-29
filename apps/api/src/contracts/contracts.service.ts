import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, ContractStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createForBooking(bookingId: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        artist: { include: { artist_profile: true } },
        organizer: true,
      },
    });
    if (!booking) throw new NotFoundException();
    if (booking.status !== BookingStatus.accepted) {
      throw new BadRequestException('Booking must be accepted first');
    }

    const templateType = booking.event.event_type;
    const existing = await this.prisma.contract.findUnique({
      where: { booking_request_id: bookingId },
    });
    if (existing) return existing;

    return this.prisma.contract.create({
      data: {
        booking_request_id: bookingId,
        template_type: templateType,
        status: ContractStatus.pending_organizer,
      },
    });
  }

  async findOne(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        booking_request: {
          include: {
            event: true,
            artist: { include: { artist_profile: true } },
            organizer: true,
          },
        },
      },
    });
    if (!contract) throw new NotFoundException();
    const br = contract.booking_request;
    if (br.organizer_id !== userId && br.artist_id !== userId) {
      throw new ForbiddenException();
    }
    return contract;
  }

  async sign(
    contractId: string,
    userId: string,
    signingRole: 'organizer' | 'artist',
    signatureDataUrl: string,
  ) {
    const contract = await this.findOne(contractId, userId);
    const br = contract.booking_request;

    if (signingRole === 'organizer' && br.organizer_id === userId) {
      const updated = await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          organizer_signature: signatureDataUrl,
          organizer_signed_at: new Date(),
          status: ContractStatus.pending_artist,
        },
      });
      await this.notifications.notifyUser(
        br.artist_id,
        'contract_sign',
        'Contract awaiting your signature',
        `Please sign the contract for ${br.event.title}`,
      );
      return updated;
    }

    if (signingRole === 'artist' && br.artist_id === userId) {
      const updated = await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          artist_signature: signatureDataUrl,
          artist_signed_at: new Date(),
          status: ContractStatus.signed,
        },
      });

      await this.prisma.bookingRequest.update({
        where: { id: br.id },
        data: { status: BookingStatus.contracted },
      });

      const eventDate = br.event.event_date;
      await this.prisma.availabilityBlock.upsert({
        where: {
          artist_id_date: { artist_id: br.artist_id, date: eventDate },
        },
        create: { artist_id: br.artist_id, date: eventDate, is_blocked: true },
        update: { is_blocked: true },
      });

      await this.notifications.notifyUser(
        br.organizer_id,
        'contract_signed',
        'Contract fully signed',
        `Contract for ${br.event.title} is complete`,
      );
      await this.notifications.notifyUser(
        br.artist_id,
        'contract_signed',
        'Contract fully signed',
        `Contract for ${br.event.title} is complete`,
      );

      return updated;
    }

    throw new ForbiddenException();
  }

  async getPdfHtmlAsync(contractId: string, userId: string) {
    const contract = await this.findOne(contractId, userId);
    return this.buildHtmlFromContract(contract);
  }

  private buildHtmlFromContract(contract: {
    booking_request: {
      quote_amount: number | null;
      event: { title: string; event_date: Date; event_type: string };
      artist: { artist_profile: { display_name: string } | null };
      organizer: { email: string };
    };
    organizer_signature?: string | null;
    artist_signature?: string | null;
    template_type?: string | null;
  }) {
    const br = contract.booking_request;
    const template = contract.template_type ?? br.event.event_type ?? 'private';
    const templatePath = path.join(
      __dirname,
      'templates',
      `${template}.html`,
    );
    const fallbackPath = path.join(__dirname, 'templates', 'private.html');
    const filePath = fs.existsSync(templatePath) ? templatePath : fallbackPath;
    let html = fs.readFileSync(filePath, 'utf8');

    const replacements: Record<string, string> = {
      eventTitle: br.event.title,
      eventDate: br.event.event_date.toISOString().split('T')[0],
      artistName: br.artist.artist_profile?.display_name ?? 'Artist',
      organizerName: br.organizer.email,
      agreedPrice: String(br.quote_amount ?? 0),
      organizerSignatureUrl: contract.organizer_signature ?? '',
      artistSignatureUrl: contract.artist_signature ?? '',
    };

    for (const [key, value] of Object.entries(replacements)) {
      html = html.split(`{{${key}}}`).join(value);
    }
    return html;
  }
}
