'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

interface ParallaxSilkProps {
  /** 0 = static, higher = drifts more as the section scrolls through view. */
  speed?: number;
  /** Image opacity — kept low for the "atmospheric" look. */
  opacity?: number;
  /** Which part of the silk to favour (the busy flow sits on the right). */
  objectPosition?: string;
  /** Load eagerly (use for the above-the-fold hero only). */
  priority?: boolean;
  /** Tailwind classes for the legibility scrim laid over the image. */
  scrimClassName?: string;
}

/**
 * Decorative flowing-silk background with a scroll parallax drift, a legibility
 * scrim, and a prefers-reduced-motion fallback (renders static, no transform).
 * Purely atmospheric — marked aria-hidden and pointer-events-none so it never
 * interferes with content. Meant to sit as `absolute inset-0` inside a
 * `relative overflow-hidden` section.
 */
export function ParallaxSilk({
  speed = 0.22,
  opacity = 0.6,
  objectPosition = 'right center',
  priority = false,
  scrimClassName = 'bg-gradient-to-r from-surface/60 via-transparent to-transparent',
}: ParallaxSilkProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    if (!host || !layer) return;
    // Honour reduced-motion: leave the image perfectly still.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      const rect = host.getBoundingClientRect();
      // The inner layer is oversized by 20% each side; clamp the drift so its
      // edges can never slide into view.
      const slack = host.offsetHeight * 0.18;
      let t = -rect.top * speed;
      if (t > slack) t = slack;
      else if (t < -slack) t = -slack;
      layer.style.transform = `translate3d(0, ${t.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div ref={layerRef} className="absolute inset-x-0 -inset-y-[20%] will-change-transform">
        <Image
          src="/media/hero-silk.jpg"
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition, opacity }}
        />
      </div>
      <div className={`absolute inset-0 ${scrimClassName}`} />
    </div>
  );
}
