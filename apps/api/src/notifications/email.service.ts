import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async sendGeneric(to: string, subject: string, html: string) {
    if (!this.resend) return;
    await this.resend.emails.send({
      from: 'LIME Event <noreply@lime-event.tn>',
      to,
      subject,
      html: `<p>${html}</p>`,
    });
  }
}
