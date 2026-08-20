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
            connect it without you doing so
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. What's public vs. private">
        <p>
          Artist profiles (name, bio, genres, photos, portfolio) are public and shown to
          organizers browsing the platform. Contact details, contract terms, and private messages
          are only visible to the people directly involved in that booking.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          You can edit or delete most of your profile information yourself from your account. To
          request full account deletion or a copy of your data, contact us below.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contact">
        <p>
          Questions about your data:{' '}
          <a href="mailto:contact@lime.tn" className="text-primary underline">
            contact@lime.tn
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
