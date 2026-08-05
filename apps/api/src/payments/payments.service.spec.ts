import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    const mockPrisma = {
      payment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'pay-1',
            ...data,
            status: 'pending',
          }),
        ),
        update: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'held' }),
      },
    };
    service = new PaymentsService(mockPrisma as never);
  });

  it('charges 7% on a fee inside the first band', async () => {
    const result = await service.createPaymentIntent('req-1', 400, 'bank_transfer');
    expect(result.commission_amount).toBe(28);
    expect(result.net_amount).toBe(372);
  });

  it('charges 7% on the pilot average booking value', () => {
    // 600 TND is the average booking value used across the financial model.
    expect(service.calculateCommission(600)).toBe(42);
  });

  it('charges 7% exactly at the top of the first band', () => {
    expect(service.calculateCommission(1500)).toBe(105);
  });

  it('applies 5% only to the portion above 1 500 TND', () => {
    // 1 500 * 7% + 1 500 * 5% = 105 + 75
    expect(service.calculateCommission(3000)).toBe(180);
  });

  it('applies 3% only to the portion above 5 000 TND', () => {
    // 1 500 * 7% + 3 500 * 5% + 1 000 * 3% = 105 + 175 + 30
    expect(service.calculateCommission(6000)).toBe(310);
  });

  it('keeps the effective rate below the headline 7% as the fee grows', () => {
    expect(service.calculateCommission(6000) / 6000).toBeLessThan(0.07);
  });

  it('charges nothing on a zero fee', () => {
    expect(service.calculateCommission(0)).toBe(0);
  });
});
