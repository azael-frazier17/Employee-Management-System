import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 up to `target` (dashboard stat cards).
 * Uses requestAnimationFrame with an ease-out curve; skips the animation
 * when the user prefers reduced motion.
 */
export default function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const end = Number(target) || 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || end === 0) {
      setValue(end);
      return undefined;
    }

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
