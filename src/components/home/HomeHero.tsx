'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- inner pages are legacy HTML whose jQuery plugins only initialise on a full page load, so links must not client-navigate. */

import React, { useCallback, useEffect, useState } from 'react';

export interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  // Rendered as "<before><highlight><after>" so the accent word stays styled.
  subtitle: [string, string, string];
  text: string;
  quote: string;
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
  href: string;
}

const SLIDE_MS = 7000;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    const t = window.setTimeout(() => go(index + 1), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, count, go]);

  return (
    <section className="hv2 hv2-hero" aria-roledescription="carousel" aria-label="Featured">
      {slides.map((s, i) => (
        <div
          key={s.image}
          className={`hv2-hero-slide${i === index ? ' is-active' : ''}`}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
        >
          <div className="hv2-hero-bg" style={{ backgroundImage: `url("${s.image}")` }} />
          <div className="hv2-hero-shade" />
          <div className="hv2-wrap hv2-hero-content">
            <div className="hv2-hero-copy">
              <p className="hv2-hero-eyebrow">{s.eyebrow}</p>
              {i === 0 ? <h1 className="hv2-hero-title">{s.title}</h1> : <h2 className="hv2-hero-title">{s.title}</h2>}
              <p className="hv2-hero-subtitle">
                {s.subtitle[0]}
                <span>{s.subtitle[1]}</span>
                {s.subtitle[2]}
              </p>
              <p className="hv2-hero-text">{s.text}</p>
              <div className="hv2-hero-btns">
                <a href="/admissions" className="hv2-btn hv2-btn-red" tabIndex={i === index ? 0 : -1}>
                  Admission Now <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </a>
                <a href="/academics" className="hv2-btn hv2-btn-ghost" tabIndex={i === index ? 0 : -1}>
                  View Academics <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </a>
              </div>
            </div>
            <p className="hv2-hero-quote">“{s.quote}”</p>
          </div>
        </div>
      ))}

      <div className="hv2-hero-dots" role="tablist" aria-label="Choose slide">
        {[0, 1, 2, 3].map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === index}
            aria-label={`Slide ${d + 1}`}
            className={d === index ? 'is-active' : undefined}
            onClick={() => go(d)}
            disabled={d >= count}
          />
        ))}
      </div>

      <div className="hv2-hero-pager">
        <div className="hv2-hero-nums">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? 'is-active' : undefined}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <button type="button" className="hv2-hero-arrow" onClick={() => go(index - 1)} aria-label="Previous slide">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        </button>
        <button type="button" className="hv2-hero-arrow" onClick={() => go(index + 1)} aria-label="Next slide">
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
        <span className="hv2-hero-dash" aria-hidden="true" />
      </div>
    </section>
  );
}

export function AnnouncementBar({ fallback }: { fallback: Announcement[] }) {
  const [items, setItems] = useState<Announcement[]>(fallback);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news/ticker')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !Array.isArray(d.items) || d.items.length === 0) return;
        setItems(
          d.items.map((n: { id: string; title: string; link: string | null; pdfUrl: string | null; date: string }) => ({
            id: n.id,
            title: n.title,
            href: n.pdfUrl || (n.link && n.link.trim()) || '/news',
            date: new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          })),
        );
        setIndex(0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => window.clearTimeout(t);
  }, [index, paused, items.length]);

  const item = items[index];
  if (!item) return null;
  const step = (d: number) => setIndex((i) => (i + d + items.length) % items.length);
  const external = /^https?:\/\//i.test(item.href) || /\.pdf$/i.test(item.href);

  return (
    <div className="hv2 hv2-announce" role="region" aria-label="Latest announcement">
      <div className="hv2-wrap hv2-announce-inner">
        <span className="hv2-announce-label">
          <i className="fa-solid fa-volume-high" aria-hidden="true" /> Latest Announcement
        </span>
        <div className="hv2-announce-item" aria-live="polite">
          <span className="hv2-announce-date">{item.date}</span>
          <span className="hv2-announce-pipe" aria-hidden="true">|</span>
          <a
            href={item.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
          >
            {item.title} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </a>
        </div>
        <a href="/news" className="hv2-announce-all">
          View All Announcements <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </a>
        <div className="hv2-announce-ctrl">
          <button type="button" onClick={() => step(-1)} aria-label="Previous announcement">
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next announcement">
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="is-dark"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play announcements' : 'Pause announcements'}
          >
            <i className={`fa-solid ${paused ? 'fa-play' : 'fa-pause'}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
