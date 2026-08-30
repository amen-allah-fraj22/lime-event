'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

/**
 * Sits above the stat tiles on the artist dashboard. Two states, driven by
 * real data: incomplete profile (needs the wizard) vs. complete-but-not-yet
 * approved by an admin. Renders nothing once both conditions clear.
 */
export function ProfileCompletionBanner({
  artistProfileId,
  profileCompletion,
  isProfileComplete,
  isVerified,
}: {
  artistProfileId: string;
  profileCompletion: number;
  isProfileComplete: boolean;
  isVerified: boolean;
}) {
  if (isProfileComplete && isVerified) return null;

  if (!isProfileComplete) {
    return (
      <div className="dashboard-shadow relative mb-8 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl border border-primary-container/30 bg-primary-container/10 p-6 md:flex-row md:items-center">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-container/20 blur-2xl" />
        <div className="z-10 flex w-full items-center gap-4 md:w-auto">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container/20">
            <MaterialIcon name="auto_awesome" className="text-primary" size={28} />
          </div>
          <div className="flex-1">
            <h2 className="font-headline text-headline-md text-on-surface">
              Finish your profile to start getting booked
            </h2>
            <p className="mt-1 text-body-md text-secondary">
              Organizers can&apos;t find you until your profile is ready.
            </p>
            <div className="mt-3 flex w-full max-w-sm items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary-container transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, profileCompletion))}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-label-sm font-bold text-primary">
                {profileCompletion}% complete
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/artists/${artistProfileId}/edit`}
          className="z-10 w-full shrink-0 rounded-lg bg-primary-container px-6 py-3 text-center text-label-md font-bold text-on-primary-fixed transition-all hover:scale-[1.02] hover:shadow-md active:scale-95 md:w-auto"
        >
          Complete Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-shadow relative mb-8 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-high p-6 md:flex-row md:items-center">
      <div className="pointer-events-none absolute -right-12 -top-12 rotate-12 opacity-5">
        <MaterialIcon name="hourglass_empty" size={200} />
      </div>
      <div className="z-10 flex w-full items-center gap-4 md:w-auto">
        <div className="dashboard-shadow flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-secondary">
          <MaterialIcon name="hourglass_empty" size={28} />
        </div>
        <div className="flex-1">
          <h2 className="font-headline text-headline-md text-on-surface">Your profile is under review</h2>
          <p className="mt-1 text-body-md text-secondary">
            We&apos;ll notify you once it&apos;s approved and visible to organizers.
          </p>
        </div>
      </div>
      <div className="z-10 inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-full border-2 border-transparent bg-surface-variant px-6 py-3 text-label-md font-bold uppercase text-secondary opacity-70">
        <MaterialIcon name="pending" size={18} />
        Pending
      </div>
    </div>
  );
}
