'use client';

import { useEffect } from 'react';

export function useStatCounters(sectionId = 'stats-section') {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll<HTMLElement>('[data-target]').forEach((el) => {
            const target = Number(el.dataset.target ?? 0);
            const duration = 2000;
            const start = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              el.textContent = String(Math.floor(progress * target));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionId]);
}
