import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

const UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database unreachable';
      this.logger.error(exception.message);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (UNAVAILABLE_CODES.has(exception.code)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database unreachable';
      } else {
        message = exception.message;
      }
      this.logger.error(`${exception.code}: ${exception.message}`);
    } else if (exception instanceof Prisma.PrismaClientRustPanicError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database connection failed';
      this.logger.error(exception.message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      hint:
        status === HttpStatus.SERVICE_UNAVAILABLE
          ? 'Open Supabase dashboard → restore project if paused, then verify DATABASE_URL in apps/api/.env and run: npm run db:migrate'
          : undefined,
    });
  }
}
