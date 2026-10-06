'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- inner pages are legacy HTML whose jQuery plugins only initialise on a full page load, so links must not client-navigate. */

import React, { useState } from 'react';
import type { MenuNode } from '@/lib/menu';

interface NavItem {
  label: string;
  url: string;
  // Top-level label in the admin-managed header menu whose children feed this
  // item's dropdown, so /admin/menus edits still show up on the homepage.
  match?: RegExp;
  fallback?: { label: string; url: string }[];
}

const NAV: NavItem[] = [
  { label: 'Home', url: '/' },
  {
    label: 'About',
    url: '/about',
    match: /^about/i,
    fallback: [
      { label: 'About & History', url: '/about' },
      { label: 'Vice Chancellor', url: '/vice-chancellor' },
      { label: 'Administration', url: '/administration' },
    ],
  },
  {
    label: 'Academics',
    url: '/academics',
    match: /^academics/i,
    fallback: [
      { label: 'Faculties & Departments', url: '/academics' },
      { label: 'Examinations', url: '/examination' },
      { label: 'Downloads', url: '/downloads' },
    ],
  },
  {
    label: 'Admissions',
    url: '/admissions',
    match: /^admissions/i,
    fallback: [
      { label: 'Admissions', url: '/admissions' },
      { label: 'Postgraduate Admissions', url: '/pg-admissions' },
      { label: "Foreign Students' Policy", url: '/foreign-students' },
      { label: 'Semester Fee', url: '/semester-fee' },
    ],
  },
  {
    label: 'Research',
    url: '/research',
    match: /^research/i,
    fallback: [
      { label: 'Research Institutes Overview', url: '/research' },
      { label: 'Academic Journals', url: '/journals' },
    ],
  },
  {
    label: 'Student Life',
    url: '/student-life',
    match: /^(student|campus)/i,
    fallback: [
      { label: 'Student Life', url: '/student-life' },
      { label: 'Scholarships', url: 'https://www.uok.edu.pk/sfao' },
      { label: 'Convocation', url: '/convocation' },
    ],
  },
  {
    label: 'Alumni',
    url: '/alumni',
    match: /^alumni/i,
    fallback: [{ label: 'Alumni Network', url: '/alumni' }],
  },
  {
    label: 'Contact',
    url: '/contact',
    match: /^contact/i,
    fallback: [
      { label: 'Contact Us', url: '/contact' },
      { label: 'Downloads', url: '/downloads' },
    ],
  },
];

const TOP_LINKS = [
  { label: 'Students', url: '/student-life' },
  { label: 'Faculty', url: '/academics' },
  { label: 'Alumni', url: '/alumni' },
  { label: 'Library', url: '/library' },
  { label: 'Careers', url: '/administration' },
  { label: 'Tenders', url: '/downloads' },
];

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function linkProps(url: string, target?: string | null) {
  const external = target === '_blank' || isExternal(url);
  const href = isExternal(url) || url.startsWith('/') || url.startsWith('#') ? url : `/${url}`;
  return external ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };
}

export default function HomeHeader({ menu }: { menu: MenuNode[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.map((item) => {
    const fromMenu = item.match ? menu.find((m) => item.match!.test(m.label.trim())) : undefined;
    const children = fromMenu && fromMenu.children.length
      ? fromMenu.children.map((c) => ({ label: c.label, url: c.url, target: c.target }))
      : (item.fallback || []).map((c) => ({ ...c, target: null as string | null }));
    return { ...item, children };
  });

  return (
    <header className="hv2 hv2-site-header">
      <div className="hv2-topbar">
        <div className="hv2-wrap hv2-topbar-inner">
          <p className="hv2-topbar-tag">
            A Legacy of Knowledge <span aria-hidden="true">|</span> A Brighter Tomorrow
          </p>
          <nav className="hv2-topbar-links" aria-label="Quick links">
            {TOP_LINKS.map((l) => (
              <a key={l.label} href={l.url}>{l.label}</a>
            ))}
            <span className="hv2-topbar-sep" aria-hidden="true" />
            <button type="button" className="hv2-lang" aria-label="Language">
              <i className="fa-regular fa-globe" aria-hidden="true" /> EN{' '}
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

      <div className="hv2-mainbar">
        <div className="hv2-wrap hv2-mainbar-inner">
          <a href="/" className="hv2-brand" aria-label="University of Karachi — Home">
            <img src="/assets/img/logo-icon.png" alt="" className="hv2-brand-crest" />
            <span className="hv2-brand-text">
              <span className="hv2-brand-name">University of Karachi</span>
              <span className="hv2-brand-urdu" lang="ur">جامعہ کراچی</span>
              <span className="hv2-brand-motto">Excellence • Knowledge • Service</span>
            </span>
          </a>

          <nav className={`hv2-nav${mobileOpen ? ' is-open' : ''}`} aria-label="Main">
            <ul>
              {items.map((item) => (
                <li key={item.label} className={item.children.length ? 'has-sub' : undefined}>
                  <a href={item.url} className={item.url === '/' ? 'is-active' : undefined}>
                    {item.label}
                    {item.children.length > 0 && <i className="fa-solid fa-chevron-down" aria-hidden="true" />}
                  </a>
                  {item.children.length > 0 && (
                    <ul className="hv2-sub">
                      {item.children.map((c) => (
                        <li key={c.label + c.url}>
                          <a {...linkProps(c.url, c.target)}>{c.label}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="hv2-header-actions">
            <form className="hv2-search" action="https://www.google.com/search" target="_blank" role="search">
              <input type="hidden" name="sitesearch" value="uok.edu.pk" />
              <input type="search" name="q" placeholder="Search..." aria-label="Search" />
              <button type="submit" aria-label="Submit search">
                <i className="fa-regular fa-magnifying-glass" aria-hidden="true" />
              </button>
            </form>
            <a href="/login" className="hv2-btn hv2-btn-red">
              Login Portal <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </a>
            <button
              type="button"
              className="hv2-burger"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
