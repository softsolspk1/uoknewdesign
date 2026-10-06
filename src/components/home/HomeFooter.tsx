'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- inner pages are legacy HTML whose jQuery plugins only initialise on a full page load, so links must not client-navigate. */

import React from 'react';

const QUICK_LINKS = [
  { label: 'Downloads', url: '/downloads' },
  { label: 'Our Patients', url: 'https://www.iccs.edu' },
  { label: 'Safety & Security', url: '/administration' },
  { label: 'Bioassay Forms', url: '/downloads' },
  { label: 'Spectroscopic Forms', url: '/downloads' },
];

const RESOURCES = [
  { label: 'Tender / Quotations', url: '/downloads' },
  { label: 'Photo Gallery', url: '/about' },
  { label: 'SIREN', url: '/research' },
  { label: 'UNESCO and ICCBS', url: 'https://www.iccs.edu' },
  { label: 'HEJ Knowledge Hub', url: 'https://www.iccs.edu' },
];

const SOCIAL = [
  { label: 'Facebook', url: 'https://www.facebook.com/uoktimes/', icon: 'fa-brands fa-facebook' },
  { label: 'X', url: 'https://x.com/intent/tweet?text=University%20of%20Karachi', icon: 'x' },
  { label: 'Instagram', url: 'https://www.instagram.com/kutimes1951/', icon: 'fa-brands fa-instagram' },
  { label: 'YouTube', url: 'https://www.youtube.com/KUTIMES', icon: 'fa-brands fa-youtube' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/company/kutimes/', icon: 'fa-brands fa-linkedin-in' },
];

function FooterLink({ url, children }: { url: string; children: React.ReactNode }) {
  const external = /^https?:\/\//i.test(url);
  return (
    <a href={url} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      {children}
    </a>
  );
}

export default function HomeFooter() {
  return (
    <footer className="hv2 hv2-footer">
      <div className="hv2-footer-main">
        <div className="hv2-footer-art" aria-hidden="true" />
        <div className="hv2-wrap hv2-footer-grid">
          <div className="hv2-footer-brand">
            <img src="/assets/img/logo-icon.png" alt="" className="hv2-footer-crest" />
            <div>
              <p className="hv2-footer-name">University of Karachi</p>
              <p className="hv2-footer-urdu" lang="ur">جامعہ کراچی</p>
              <p className="hv2-footer-tag">
                In Pursuit of Knowledge
                <br />
                For a Better Tomorrow
              </p>
            </div>
          </div>

          <div className="hv2-footer-col">
            <h2>Quick Links</h2>
            <ul>
              {QUICK_LINKS.map((l) => (
                <li key={l.label}><FooterLink url={l.url}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          <div className="hv2-footer-col">
            <h2>Important Resources</h2>
            <ul>
              {RESOURCES.map((l) => (
                <li key={l.label}><FooterLink url={l.url}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          <div className="hv2-footer-social">
            <h2>Follow Us</h2>
            <div className="hv2-footer-icons">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  {s.icon === 'x' ? (
                    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                      />
                    </svg>
                  ) : (
                    <i className={s.icon} aria-hidden="true" />
                  )}
                </a>
              ))}
            </div>
          </div>

          <p className="hv2-footer-motto">
            Knowledge
            <br />
            Unites People
          </p>
        </div>
      </div>

      <div className="hv2-footer-bar">
        <div className="hv2-wrap hv2-footer-bar-inner">
          <p>© 2026 University of Karachi. All Rights Reserved.</p>
          <nav aria-label="Legal">
            <a href="/policies">Privacy Policy</a>
            <a href="/disclaimer">Terms of Use</a>
            <a href="/academics">Sitemap</a>
            <a href="/contact">Contact Us</a>
          </nav>
          <div className="hv2-footer-bar-actions">
            <a href="/contact" className="hv2-feedback">
              <i className="fa-regular fa-message" aria-hidden="true" /> Feedback
            </a>
            <button
              type="button"
              className="hv2-to-top"
              aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <i className="fa-solid fa-arrow-up" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
