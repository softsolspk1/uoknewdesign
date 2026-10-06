import React from 'react';
import Link from 'next/link';
import type { MenuNode } from '@/lib/menu';

function FooterLink({ url, children }: { url: string; children: React.ReactNode }) {
  const isExternal = /^https?:\/\//.test(url);
  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={url}>{children}</Link>;
}

export default function Footer({ menu }: { menu: MenuNode[] }) {
  return (
    <>
      <footer className="footer-wrapper footer-default footer-overlay">
        <div className="footer-top">
          <div className="container">
            <div className="row gy-40 align-items-center justify-content-between">
              <div className="col-xl-auto">
                <div
                  className="footer-logo z-index-common"
                  data-cue="slideInLeft"
                  style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
                >
                  <Link href="/">
                    <img
                      src="/uok101.jpg"
                      alt="University of Karachi — 75 Years"
                      style={{ maxHeight: '68px', width: 'auto', maxWidth: '300px' }}
                    />
                  </Link>
                  <div className="footer-75-badge-wrap">
                    <div>
                      <div className="f-tag">1951 – 2026 • Diamond Jubilee</div>
                      <div className="f-title">75 Years of Academic Leadership</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-auto">
                <div className="client-group-wrap z-index-common d-flex align-items-center gap-3" data-cue="slideInRight">
                  <img src="/assets/img/normal/client-group1.png" alt="img" />
                  <h4 className="title mb-0">
                    Have any question?{' '}
                    <Link href="/contact">
                      <img src="/assets/img/icon/chat2.svg" alt="" /> <span className="text-theme">Contact</span>
                    </Link>{' '}
                    our office
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="widget-area">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5">
              <div className="col">
                <div className="widget footer-widget">
                  <div className="th-widget-about">
                    <h3 className="widget_title">About the University</h3>
                    <p className="about-text">
                      Celebrating 75 Years of Academic Leadership (1951–2026). The University of Karachi is one of Pakistan's
                      largest public universities — 1,279 acres, nine faculties, 53 departments and 27 research institutes.
                    </p>
                    <div className="footer-info">
                      <Link href="/contact">
                        <span className="footer-info-icon">
                          <i className="fa-solid fa-location-dot"></i>
                        </span>{' '}
                        University Road, Karachi-75270
                      </Link>
                      <a href="mailto:registrar@uok.edu.pk">
                        <span className="footer-info-icon">
                          <i className="fa-solid fa-envelope"></i>
                        </span>{' '}
                        registrar@uok.edu.pk
                      </a>
                    </div>
                    <div className="th-social mt-4">
                      <a href="https://www.facebook.com/uoktimes/" target="_blank" rel="noreferrer">
                        <i className="fab fa-facebook-f"></i>
                      </a>
                      <a href="https://www.linkedin.com/company/kutimes/" target="_blank" rel="noreferrer">
                        <i className="fab fa-linkedin-in"></i>
                      </a>
                      <a href="https://www.youtube.com/KUTIMES" target="_blank" rel="noreferrer">
                        <i className="fab fa-youtube"></i>
                      </a>
                      <a href="https://www.instagram.com/kutimes1951/" target="_blank" rel="noreferrer">
                        <i className="fab fa-instagram"></i>
                      </a>
                      <a href="https://x.com/intent/tweet?text=University%20of%20Karachi" target="_blank" rel="noreferrer">
                        <i className="fab fa-twitter"></i>
                      </a>
                      <a href="https://whatsapp.com/channel/0029Vap9QMDAO7RIzFDvuu2B" target="_blank" rel="noreferrer">
                        <i className="fab fa-whatsapp"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {menu.map((column) => (
                <div className="col" key={column.id}>
                  <div className="widget widget_nav_menu footer-widget">
                    <h3 className="widget_title">{column.label}</h3>
                    <div className="menu-all-pages-container">
                      <ul className="menu">
                        {column.children.map((link) => (
                          <li key={link.id}>
                            <FooterLink url={link.url}>{link.label}</FooterLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="copyright-wrap z-index-common">
          <div className="container">
            <div className="row justify-content-center gy-3 align-items-center">
              <div className="col-12 text-center">
                <p
                  className="copyright-text"
                  style={{
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    color: '#fff',
                  }}
                >
                  <i className="fal fa-copyright"></i> Copyright 2026{' '}
                  <Link href="/" style={{ color: '#fff' }}>University of Karachi</Link>. All Rights Reserved.{' '}
                  <span style={{ opacity: 0.7, color: '#fff' }}>
                    {' — Developed by '}
                    <a href="https://softsols.pk/" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>Softsols Pakistan</a>
                  </span>
                </p>
              </div>
              <div className="col-12 text-center">
                <div className="footer-links" style={{ justifyContent: 'center' }}>
                  <ul>
                    <li><Link href="/copyright">Copyright</Link></li>
                    <li><Link href="/disclaimer">Disclaimer</Link></li>
                    <li><Link href="/policies">Policies (HEC / Sindh HEC)</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className="scroll-top">
        <svg className="progress-circle svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
          <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"></path>
        </svg>
      </div>
    </>
  );
}
