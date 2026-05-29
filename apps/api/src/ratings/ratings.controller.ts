import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Post()
  create(
    @Body()
    body: {
      booking_request_id: string;
      reviewee_id: string;
      score: number;
      comment?: string;
      categories?: Record<string, number>;
    },
    @Req() req: { dbUser: { id: string } },
  ) {
    return this.ratingsService.create(
      body.booking_request_id,
      req.dbUser.id,
      body.reviewee_id,
      body.score,
      body.comment,
      body.categories,
    );
  }
}
