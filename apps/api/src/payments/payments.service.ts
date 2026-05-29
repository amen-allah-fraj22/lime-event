import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly commissionRate = Number(
    process.env.COMMISSION_RATE ?? 0.125,
  );

  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(
    bookingRequestId: string,
    grossAmount: number,
    method: string,
  ) {
    const commissionAmount = Math.round(grossAmount * this.commissionRate);
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
