import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('BookingsController (integration)', () => {
  let app: INestApplication;

  beforeAll(() => {
    process.env.CLERK_SECRET_KEY =
      process.env.CLERK_SECRET_KEY ?? 'sk_test_placeholder';
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        user: { findUnique: jest.fn() },
        bookingRequest: { findUnique: jest.fn() },
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('GET /booking-requests/:id requires auth', async () => {
    await request(app.getHttpServer())
      .get('/booking-requests/fake-id')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
