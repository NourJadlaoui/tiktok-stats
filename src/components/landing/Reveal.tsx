'use client';

import { useEffect, useRef, useState } from 'react';

/** Wraps children so they fade/slide in the first time they scroll into
 * view, instead of only animating on initial page load — keeps the long
 * landing page feeling alive as you scroll rather than static after the
 * hero. Falls back to always-visible if IntersectionObserver isn't
 * available (SSR-safe: starts visible, then hides+arms once mounted). */
export default function Reveal({
  children,
  delay = 0,
  className = ''
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}
      style={visible ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
