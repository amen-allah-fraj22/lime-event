'use client';

import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { ArtistProfileFull } from '@/lib/artist-profile-types';
import { AvailabilityPreviewCalendar } from './AvailabilityPreviewCalendar';

/**
 * Desktop-only sticky column that follows the page as you scroll past the
 * hero — the booking CTA plus everything that helps an organizer decide
 * without leaving the page: rating/completed-bookings trust signals, a
 * real view-count social-proof line, and a real availability preview.
 * Deliberately no price — pricing stays private, negotiated per booking.
 */
export function ArtistBookingSidebar({
  artist,
  bookingSlot,
}: {
  artist: ArtistProfileFull;
  bookingSlot: React.ReactNode;
}) {
  const hasStats = artist.total_bookings > 0 || artist.avg_rating > 0;

  return (
    <aside className="hidden lg:block lg:w-80 lg:shrink-0">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-card">
          {bookingSlot}

          {hasStats && (
            <div className="mt-4 space-y-2 border-t border-surface-variant pt-4">
              {artist.avg_rating > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <MaterialIcon name="star" size={16} filled className="text-primary" />
                  <span className="font-semibold">{artist.avg_rating.toFixed(1)} rating</span>
                </div>
              )}
              {artist.total_bookings > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <MaterialIcon name="task_alt" size={16} className="text-secondary" />
                  <span>
                    {artist.total_bookings} completed booking{artist.total_bookings === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              {artist.user?.is_verified && (
                <div className="flex items-center gap-2 text-sm">
                  <MaterialIcon name="verified" size={16} filled className="text-primary" />
                  <span>Verified by LIME</span>
                </div>
              )}
            </div>
          )}

          {!!artist.views_this_week && artist.views_this_week > 0 && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-secondary">
              <MaterialIcon name="visibility" size={14} />
              {artist.views_this_week} {artist.views_this_week === 1 ? 'person' : 'people'} viewed
              this profile this week
            </p>
          )}
        </div>

        {artist.availability_preview && artist.availability_preview.length > 0 && (
          <AvailabilityPreviewCalendar days={artist.availability_preview} />
        )}
      </div>
    </aside>
  );
}
