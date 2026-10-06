'use client';

import React, { useEffect, useState } from 'react';

interface TickerItem {
  id: string;
  title: string;
  link: string | null;
  pdfUrl: string | null;
}

const DEFAULT_ITEMS: TickerItem[] = [
  {
    id: 'def-1',
    title: 'Admissions 2027: Online Applications Open for Undergraduate & Postgraduate Programs',
    link: '/admissions',
    pdfUrl: null,
  },
  {
    id: 'def-2',
    title: 'University of Karachi Diamond Jubilee (1951–2026) Celebrations & Academic Events',
    link: '/about',
    pdfUrl: null,
  },
  {
    id: 'def-3',
    title: 'Notice: Postgraduate Research Grant Applications & Semester Fee Schedule Announced',
    link: '/semester-fee',
    pdfUrl: null,
  },
  {
    id: 'def-4',
    title: 'Annual Convocation: Degree Verification & Registration Portal Open for Graduating Batches',
    link: '/convocation',
    pdfUrl: null,
  },
];

function itemHref(item: TickerItem): string {
  if (item.pdfUrl) return item.pdfUrl;
  if (item.link && item.link.trim()) return item.link.trim();
  return '/';
}

export default function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news/ticker')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.items) && d.items.length > 0) {
          setItems(d.items);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Duplicate the list so the CSS marquee loop has no visible seam.
  const track = [...items, ...items];

  return (
    <div className="news-ticker-bar" role="region" aria-label="Latest University News Alerts">
      <div className="news-ticker-inner">
        <span className="news-ticker-label">
          <i className="fa-solid fa-bullhorn"></i>{' '}
          <span className="news-ticker-label-text">News Alert</span>
        </span>
        <div className="news-ticker-track-wrap">
          <div className="news-ticker-track">
            {track.map((item, i) => {
              const href = itemHref(item);
              const isExternalOrPdf = Boolean(item.pdfUrl) || /^https?:\/\//i.test(href);
              return (
                <a
                  key={`${item.id}-${i}`}
                  href={href}
                  target={isExternalOrPdf ? '_blank' : undefined}
                  rel={isExternalOrPdf ? 'noopener noreferrer' : undefined}
                  className="news-ticker-item"
                >
                  {item.pdfUrl ? (
                    <span className="ticker-pdf-badge" title="PDF Document Attached">
                      <i className="fa-solid fa-file-pdf"></i> PDF
                    </span>
                  ) : null}
                  <span>{item.title}</span>
                  <span className="ticker-bullet" aria-hidden="true">•</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

