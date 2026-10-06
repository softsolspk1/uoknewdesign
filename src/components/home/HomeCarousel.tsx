'use client';

import React, { useRef } from 'react';

// Horizontal scroll-snap row with prev/next arrows sitting outside the track,
// used by the faculties and research-institutes strips on the homepage.
export default function HomeCarousel({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className={`hv2-carousel${className ? ` ${className}` : ''}`}>
      <button type="button" className="hv2-carousel-arrow is-prev" onClick={() => scroll(-1)} aria-label={`Previous ${label}`}>
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>
      <div className="hv2-carousel-track" ref={track} role="list" aria-label={label}>
        {children}
      </div>
      <button type="button" className="hv2-carousel-arrow is-next" onClick={() => scroll(1)} aria-label={`Next ${label}`}>
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}
