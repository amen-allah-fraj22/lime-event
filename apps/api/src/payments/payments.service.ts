import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Progressive commission scale, applied band by band like a tax bracket:
 * 7% on the first 1 500 TND of the fee, 5% on the 1 500–5 000 TND band,
 * 3% above 5 000 TND. This mirrors the pricing policy published in the
 * business plan; the effective rate therefore decreases as the fee grows.
 */
const COMMISSION_TIERS = [
  { upTo: Number(process.env.COMMISSION_TIER_1_CAP ?? 1500), rate: Number(process.env.COMMISSION_TIER_1_RATE ?? 0.07) },
  { upTo: Number(process.env.COMMISSION_TIER_2_CAP ?? 5000), rate: Number(process.env.COMMISSION_TIER_2_RATE ?? 0.05) },
  { upTo: Number.POSITIVE_INFINITY, rate: Number(process.env.COMMISSION_TIER_3_RATE ?? 0.03) },
];

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  calculateCommission(grossAmount: number) {
    let remaining = grossAmount;
    let bandStart = 0;
    let commission = 0;

    for (const tier of COMMISSION_TIERS) {
      if (remaining <= 0) break;
      const amountInBand = Math.min(remaining, tier.upTo - bandStart);
      commission += amountInBand * tier.rate;
      remaining -= amountInBand;
      bandStart = tier.upTo;
    }

    return Math.round(commission);
  }

  async createPaymentIntent(
    bookingRequestId: string,
    grossAmount: number,
    method: string,
  ) {
    const commissionAmount = this.calculateCommission(grossAmount);
    const netAmount = grossAmount - commissionAmount;

    return this.prisma.payment.create({
      data: {
        booking_request_id: bookingRequestId,
        gross_amount: grossAmount,
        commission_amount: commissionAmount,
        net_amount: netAmount,
        status: PaymentStatus.pending,
        payment_method: method,
      },
    });
  }

  async markAsPaid(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.held, held_at: new Date() },
    });
  }

  async releaseToArtist(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.released, released_at: new Date() },
    });
  }

  async findByBooking(bookingRequestId: string) {
    return this.prisma.payment.findUnique({
      where: { booking_request_id: bookingRequestId },
    });
  }

  async findOne(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException();
    return payment;
  }
}
