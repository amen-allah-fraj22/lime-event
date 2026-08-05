'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

/**
 * "See LIME in action" promo video block.
 *
 * TO GO LIVE: drop a real file at apps/web/public/media/promo.mp4 (and optionally
 * a real poster image), then set VIDEO_SRC below. While VIDEO_SRC is empty the
 * block shows the placeholder poster + a "coming soon" badge, so nothing looks
 * broken. You can also swap this for a YouTube/Vimeo embed if you prefer.
 */
const VIDEO_SRC = ''; // e.g. '/media/promo.mp4'
const POSTER_SRC = '/media/promo-poster.svg'; // swap for a real still frame later

export function PromoVideo() {
  const [playing, setPlaying] = useState(false);
  const hasVideo = VIDEO_SRC.length > 0;

  return (
    <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-4xl border border-surface-variant/60 shadow-float">
      {playing && hasVideo ? (
        <video
          className="h-full w-full object-cover"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          controls
          autoPlay
          playsInline
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER_SRC}
            alt="LIME Event promo video preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => hasVideo && setPlaying(true)}
            aria-label={hasVideo ? 'Play video' : 'Demo video coming soon'}
            className="group absolute inset-0 flex items-center justify-center bg-custom-dark/20 transition-colors hover:bg-custom-dark/10"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-custom-dark shadow-float transition-transform group-hover:scale-105">
              <MaterialIcon name="play_arrow" filled size={44} />
            </span>
          </button>
          {!hasVideo && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-custom-dark/80 px-4 py-1.5 text-label-sm font-medium text-white backdrop-blur-sm">
              Demo reel coming soon
            </span>
          )}
        </>
      )}
    </div>
  );
}
