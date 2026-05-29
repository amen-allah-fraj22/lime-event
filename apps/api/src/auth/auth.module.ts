import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { DbUserGuard } from './db-user.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  controllers: [AuthController, ClerkWebhookController],
  providers: [AuthService, ClerkAuthGuard, RolesGuard, DbUserGuard],
  exports: [AuthService, ClerkAuthGuard, RolesGuard, DbUserGuard],
})
export class AuthModule {}
