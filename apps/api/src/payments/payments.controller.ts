import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('organizer', 'agency')
  create(
    @Body()
    body: { booking_request_id: string; gross_amount: number; payment_method: string },
  ) {
    return this.paymentsService.createPaymentIntent(
      body.booking_request_id,
      body.gross_amount,
      body.payment_method,
    );
  }

  @Post(':id/release')
  @UseGuards(RolesGuard)
  @Roles('admin')
  release(@Param('id') id: string) {
    return this.paymentsService.releaseToArtist(id);
  }
}
