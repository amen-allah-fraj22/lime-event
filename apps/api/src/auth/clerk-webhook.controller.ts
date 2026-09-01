import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { AuthService } from './auth.service';
import { isAppRole } from './app-roles';

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    public_metadata?: { role?: string; roles?: string[] };
    unsafe_metadata?: { role?: string; roles?: string[] };
  };
};

@Controller('auth')
export class ClerkWebhookController {
  constructor(private authService: AuthService) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: { rawBody?: Buffer },
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');

    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException('CLERK_WEBHOOK_SECRET not set');

    const wh = new Webhook(secret);
    let payload: ClerkWebhookEvent;
    try {
      payload = wh.verify(req.rawBody.toString(), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (payload.type === 'user.created' || payload.type === 'user.updated') {
      const email = payload.data.email_addresses?.[0]?.email_address;
      if (!email) return { received: true };

      const metaRoles =
        payload.data.public_metadata?.roles ??
        payload.data.unsafe_metadata?.roles;
      const roleStr =
        payload.data.public_metadata?.role ??
        payload.data.unsafe_metadata?.role;
      const roles =
        Array.isArray(metaRoles) && metaRoles.length
          ? metaRoles.filter(isAppRole)
          : roleStr && isAppRole(roleStr)
            ? [roleStr]
            : ['organizer'];

      await this.authService.syncUser({
        email,
        roles,
        clerk_user_id: payload.data.id,
      });
    }

    if (payload.type === 'user.deleted') {
      await this.authService.deleteUserByClerkId(payload.data.id);
    }

    return { received: true };
  }
}
