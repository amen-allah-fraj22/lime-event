import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { CreateOfferDto } from './dto/create-offer.dto';

@Controller('booking-requests')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('organizer', 'agency', 'admin', 'artist')
  create(@Body() dto: CreateBookingDto, @Req() req: { dbUser: { id: string } }) {
    return this.bookingsService.create(req.dbUser.id, dto);
  }

  @Get()
  list(@Req() req: { dbUser: { id: string } }) {
    return this.bookingsService.listForUser(req.dbUser.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.bookingsService.findOne(id, req.dbUser.id);
  }

  @Post(':id/quote')
  @UseGuards(RolesGuard)
  @Roles('artist')
  sendQuote(
    @Param('id') id: string,
    @Body() dto: SendQuoteDto,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.bookingsService.sendQuote(id, req.dbUser.id, dto);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('organizer', 'agency')
  accept(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.bookingsService.acceptQuote(id, req.dbUser.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.bookingsService.updateStatus(id, req.dbUser.id, status);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.bookingsService.getMessages(id, req.dbUser.id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.bookingsService.sendMessage(id, req.dbUser.id, dto);
  }

  @Get(':id/thread')
  getThread(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.bookingsService.getThread(id, req.dbUser.id);
  }

  @Post(':id/offers')
  sendOffer(
    @Param('id') id: string,
    @Body() dto: CreateOfferDto,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.bookingsService.sendOffer(id, req.dbUser.id, dto);
  }

  @Post(':id/offers/:offerId/accept')
  acceptOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: string,
    @Req() req: { dbUser: { id: string } },
    @Query('closeEvent') closeEvent?: string,
  ) {
    const shouldClose = closeEvent === 'true';
    return this.bookingsService.acceptOffer(offerId, id, req.dbUser.id, shouldClose);
  }

  @Post(':id/offers/:offerId/decline')
  declineOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: string,
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.bookingsService.declineOffer(offerId, id, req.dbUser.id);
  }
}
