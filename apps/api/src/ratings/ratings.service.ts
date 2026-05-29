import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(
    bookingRequestId: string,
    reviewerId: string,
    revieweeId: string,
    score: number,
    comment?: string,
    categories?: Record<string, number>,
  ) {
    if (score < 1 || score > 5) throw new BadRequestException('Score must be 1-5');

    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingRequestId },
    });
    if (!booking || booking.status !== BookingStatus.completed) {
      throw new BadRequestException('Booking must be completed');
    }

    const rating = await this.prisma.rating.create({
      data: {
        booking_request_id: bookingRequestId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        score,
        comment,
        categories,
      },
    });

    const artistProfile = await this.prisma.artistProfile.findUnique({
      where: { user_id: revieweeId },
    });
    if (artistProfile) {
      const agg = await this.prisma.rating.aggregate({
        where: { reviewee_id: revieweeId },
        _avg: { score: true },
        _count: true,
      });
      if (agg._count >= 3 && agg._avg.score != null) {
        await this.prisma.artistProfile.update({
          where: { user_id: revieweeId },
          data: { avg_rating: agg._avg.score },
        });
      }
    }

    return rating;
  }
}
