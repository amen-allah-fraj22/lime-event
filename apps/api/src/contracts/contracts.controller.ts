import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ContractsService } from './contracts.service';

class SignContractDto {
  signature!: string;
}

@Controller('contracts')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Post('from-booking/:bookingId')
  createFromBooking(@Param('bookingId') bookingId: string) {
    return this.contractsService.createForBooking(bookingId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { dbUser: { id: string } }) {
    return this.contractsService.findOne(id, req.dbUser.id);
  }

  @Post(':id/sign')
  async sign(
    @Param('id') id: string,
    @Body() body: SignContractDto,
    @Req() req: { dbUser: { id: string } },
  ) {
    const contract = await this.contractsService.findOne(id, req.dbUser.id);
    const br = contract.booking_request;
    const signingRole =
      br.organizer_id === req.dbUser.id
        ? ('organizer' as const)
        : br.artist_id === req.dbUser.id
          ? ('artist' as const)
          : null;
    if (!signingRole) {
      throw new ForbiddenException();
    }
    return this.contractsService.sign(
      id,
      req.dbUser.id,
      signingRole,
      body.signature,
    );
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async pdf(
    @Param('id') id: string,
    @Req() req: { dbUser: { id: string } },
    @Res() res: Response,
  ) {
    const html = await this.contractsService.getPdfHtmlAsync(id, req.dbUser.id);
    res.send(html);
  }
}
