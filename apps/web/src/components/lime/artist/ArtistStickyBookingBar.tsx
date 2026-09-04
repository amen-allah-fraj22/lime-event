'use client';

import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { ArtistProfileFull } from '@/lib/artist-profile-types';

/**
 * Mobile-only fixed bar so the booking CTA is always one tap away while
 * scrolling, instead of only living in the hero. Sits just above
 * MobileBottomNav (which reserves ~6rem + safe-area at the page's own
 * bottom padding), not on top of it.
 */
export function ArtistStickyBookingBar({
  artist,
  bookingSlot,
}: {
  artist: ArtistProfileFull;
  bookingSlot: React.ReactNode;
}) {
  const hasStats = artist.total_bookings > 0 || artist.avg_rating > 0;

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-outline-variant/40 bg-surface-container-lowest px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
      style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {hasStats && (
        <div className="mb-2 flex items-center gap-3 text-xs text-secondary">
          {artist.avg_rating > 0 && (
            <span className="flex items-center gap-1">
              <MaterialIcon name="star" size={14} filled className="text-primary" />
              {artist.avg_rating.toFixed(1)}
            </span>
          )}
          {artist.total_bookings > 0 && (
            <span>
              {artist.total_bookings} completed booking{artist.total_bookings === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}
      {bookingSlot}
    </div>
  );
}
