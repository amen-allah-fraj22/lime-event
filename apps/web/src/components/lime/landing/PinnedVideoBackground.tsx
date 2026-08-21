'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Pins a looping video as a fixed background behind whatever sections are passed
 * as children. Uses `position: sticky` (native, smooth, no scroll listener): the
 * video sticks to the top of the viewport and stays put while the two sections
 * scroll over it, then releases and scrolls away once they're passed.
 *
 * The children (existing sections) must have transparent backgrounds so the
 * video shows through; their own cards stay opaque and readable. A scrim keeps
 * headings legible over the footage. Honours prefers-reduced-motion with a still.
 */
export function PinnedVideoBackground({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Play only while the pinned background is on screen — starts the clip when
  // you scroll to it (not every browser auto-resumes muted autoplay on scroll)
  // and frees the decoder once it's passed.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reducedMotion]);

  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-0 h-screen w-full overflow-hidden"
      >
        {reducedMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/media/hero-silk.jpg" alt="" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src="/media/hero-video.mp4"
            poster="/media/hero-silk.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
        {/* Scrim so the sections' headings stay readable over the footage. */}
        <div className="absolute inset-0 bg-surface/55" />
      </div>

      {/* Sections pulled up to sit over the pinned video. */}
      <div className="relative z-10 -mt-[100vh]">{children}</div>
    </div>
  );
}
