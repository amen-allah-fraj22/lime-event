import type { Metadata } from 'next';
import { LegalPageLayout, LegalSection } from '@/components/lime/legal/LegalPageLayout';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="August 2026">
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-body-md text-amber-900">
        <strong>Draft.</strong> This is a starting template reflecting how LIME actually handles
        data today — it has not been reviewed by a lawyer. Have it checked before relying on it as
        your actual, binding policy.
      </div>

      <LegalSection heading="1. What we collect">
        <p>
          Account details you provide at sign-up (name, email, username), profile information you
          add (bio, city, genres, photos, portfolio links), and event/booking details you create
          on the platform (event briefs, messages, offers, contracts).
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>
          To run the core service: matching organizers and artists, letting you message and
          negotiate, generating contracts, and showing your public profile to other users. We
          don&apos;t sell your data to third parties.
        </p>
      </LegalSection>

      <LegalSection heading="3. Who processes it for us">
        <p>
          We use a small number of service providers to run LIME, each only for its specific job:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Clerk — handles sign-up, login, and account security</li>
          <li>Supabase — hosts our database and your uploaded photos</li>
          <li>Resend — sends booking/notification emails, if you have email notifications on</li>
          <li>
            Google Calendar — only if you personally connect your calendar for sync; we never
            connect it without you doing so. See section 4 below for exactly what this involves.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Google Calendar data">
        <p>
          If you&apos;re an artist and you choose to connect your Google Calendar from your LIME
          calendar page, here is exactly what that involves:
        </p>
        <p className="mt-3">
          <strong>What we access.</strong> Using Google&apos;s{' '}
          <code className="rounded bg-surface-container px-1.5 py-0.5 text-body-sm">
            calendar.readonly
          </code>{' '}
          scope, we read the title, start time, and end time of events on the primary Google
          Calendar of the account you connect. We request read-only access — LIME never creates,
          edits, or deletes anything in your Google Calendar, and we don&apos;t access any other
          Google data (no Gmail, Drive, Contacts, or anything outside Calendar).
        </p>
        <p className="mt-3">
          <strong>How we use it.</strong> Solely to show you your own busy/free days on your LIME
          availability calendar, so organizers see accurate availability and can&apos;t
          double-book you against an existing commitment on your Google Calendar.
        </p>
        <p className="mt-3">
          <strong>Who we share it with.</strong> Nobody. Your Google Calendar event data is only
          ever shown to you, on your own private calendar view — not to organizers, other artists,
          or any third party. We don&apos;t sell it, use it for advertising, or share it with any
          other service.
        </p>
        <p className="mt-3">
          <strong>How we protect it.</strong> Your Google access and refresh tokens are stored in
          our database (hosted by Supabase, encrypted at rest) and are only ever transmitted over
          encrypted HTTPS connections. They are never exposed to your browser or to any other
          user&apos;s account.
        </p>
        <p className="mt-3">
          <strong>Retention and deletion.</strong> We fetch your calendar events on demand to
          display them — we don&apos;t keep a separate copy of your event history. The stored
          Google tokens themselves are kept only until you disconnect Google Calendar (a
          &quot;Disconnect Google Calendar&quot; option is available directly on your calendar
          page, which also revokes LIME&apos;s access with Google immediately) or until you delete
          your LIME account, whichever comes first. You can also revoke LIME&apos;s access at any
          time directly from your Google Account at{' '}
          <a
            href="https://myaccount.google.com/permissions"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="5. What's public vs. private">
        <p>
          Artist profiles (name, bio, genres, photos, portfolio) are public and shown to
          organizers browsing the platform. Contact details, contract terms, and private messages
          are only visible to the people directly involved in that booking.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>
          You can edit most of your profile information yourself from your account. You can also
          delete your account entirely, at any time, from your profile page — this permanently
          removes your account and its data, including any connected Google Calendar tokens (see
          section 4). To request a copy of your data instead, contact us below.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact">
        <p>
          Questions about your data:{' '}
          <a href="mailto:contact@limeevent.com" className="text-primary underline">
            contact@limeevent.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
