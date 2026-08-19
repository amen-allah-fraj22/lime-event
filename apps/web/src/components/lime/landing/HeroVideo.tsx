'use client';

import { useEffect, useState } from 'react';

interface HeroVideoProps {
  /** Tailwind classes for the legibility scrim laid over the video. */
  scrimClassName?: string;
  /** object-position for the video crop. */
  objectPosition?: string;
}

/**
 * Full-bleed looping video background for the hero. Autoplay only works muted,
 * so it's muted + playsInline + loop. Honours prefers-reduced-motion by showing
 * a still poster instead of playing. The poster (the silk still) also paints
 * immediately while the video buffers, so there's never a black flash.
 *
 * Decorative only: aria-hidden + pointer-events-none. Meant to sit as
 * `absolute inset-0` inside a `relative overflow-hidden` section.
 */
export function HeroVideo({
  scrimClassName = 'bg-gradient-to-r from-surface/90 via-surface/45 to-surface/10',
  objectPosition = 'center',
}: HeroVideoProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {reducedMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/media/hero-silk.jpg"
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      ) : (
        <video
          className="h-full w-full object-cover"
          style={{ objectPosition }}
          src="/media/hero-video.mp4"
          poster="/media/hero-silk.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
      <div className={`absolute inset-0 ${scrimClassName}`} />
    </div>
  );
}
