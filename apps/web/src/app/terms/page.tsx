import type { Metadata } from 'next';
import { LegalPageLayout, LegalSection } from '@/components/lime/legal/LegalPageLayout';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="August 2026">
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-body-md text-amber-900">
        <strong>Draft.</strong> This is a starting template covering the basics of how LIME
        operates today — it has not been reviewed by a lawyer. Have it checked before relying on
        it as your actual, binding terms.
      </div>

      <LegalSection heading="1. What LIME is">
        <p>
          LIME Event (&quot;LIME&quot;, &quot;we&quot;) is a platform connecting event organizers
          with musicians and performers (&quot;artists&quot;) in Tunisia. We provide the tools to
          find talent, negotiate a booking, sign a contract, and manage the event — we are not a
          party to the booking itself, which is an agreement directly between the organizer and
          the artist.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts">
        <p>
          You must provide accurate information when creating an account and are responsible for
          activity under it. You must be legally able to enter contracts in Tunisia to use LIME as
          an organizer or artist.
        </p>
      </LegalSection>

      <LegalSection heading="3. Bookings, contracts and payment">
        <p>
          Organizers and artists negotiate fees directly through LIME&apos;s messaging and offer
          tools. Once both sides accept, a digital contract is generated and signed on the
          platform. Payment terms are whatever the signed contract states between the organizer
          and artist — LIME does not currently hold or process funds on either party&apos;s
          behalf.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cancellations and disputes">
        <p>
          Cancellation terms are set by whatever the signed contract for that booking says. LIME
          is not responsible for resolving disputes between organizers and artists but may suspend
          accounts that repeatedly violate these terms.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>
          Don&apos;t use LIME to post false information, harass other users, or attempt to book
          talent outside the platform to avoid it. We can suspend or remove accounts that abuse
          the platform.
        </p>
      </LegalSection>

      <LegalSection heading="6. Changes to these terms">
        <p>
          We may update these terms as the platform evolves. Continuing to use LIME after a change
          means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact">
        <p>
          Questions about these terms:{' '}
          <a href="mailto:contact@limeevent.com" className="text-primary underline">
            contact@limeevent.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
