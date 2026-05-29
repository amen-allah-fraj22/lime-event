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

  it('calculates 12.5% commission correctly', async () => {
    const result = await service.createPaymentIntent('req-1', 400, 'bank_transfer');
    expect(result.commission_amount).toBe(50);
    expect(result.net_amount).toBe(350);
  });
});
