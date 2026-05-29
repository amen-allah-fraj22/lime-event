import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsController (integration)', () => {
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
        event: { findUnique: jest.fn() },
        bookingRequest: { findMany: jest.fn() },
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('GET /events/:id/quotes requires auth', async () => {
    await request(app.getHttpServer()).get('/events/fake-id/quotes').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
