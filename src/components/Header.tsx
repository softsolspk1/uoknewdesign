import React from 'react';
import NewsTicker from './NewsTicker';
import type { MenuNode } from '@/lib/menu';

function NavList({ nodes }: { nodes: MenuNode[] }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id} className={node.children.length ? 'menu-item-has-children' : undefined}>
          <a href={node.url} target={node.target || undefined} rel={node.target === '_blank' ? 'noopener noreferrer' : undefined}>
            {node.label}
          </a>
          {node.children.length > 0 && (
            <ul className="sub-menu">
              {node.children.map((child) => (
                <li key={child.id}>
                  <a
                    href={child.url}
                    target={child.target || undefined}
                    rel={child.target === '_blank' ? 'noopener noreferrer' : undefined}
                  >
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function Header({ menu }: { menu: MenuNode[] }) {
  return (
    <>
      <NewsTicker />


<div className="preloader">
  <div className="preloader-inner">
    <img src="/uok101.jpg" alt="University of Karachi — 75 Years of Academic Leadership" />
    <span className="loader">University of Karachi <span className="loading-text">75 Years of Academic Leadership (1951–2026)</span></span>
  </div>
</div>

<div className="sidemenu-wrapper">
  <div className="sidemenu-content">
    <button className="closeButton sideMenuCls"><i className="far fa-times"></i></button>
    <div className="widget footer-widget">
      <div className="th-widget-about">
        <div className="about-logo">
          <a href="/" className="uok-brand-lockup" style={{"gap":"10px"}}>
            <img className="uok-crest-img" src="assets/img/logo-icon.png" alt="University of Karachi" />
            <div className="uok-brand-text">
              <span className="uok-brand-title" style={{"fontSize":"15px"}}>UNIVERSITY OF KARACHI</span>
              <div className="uok-brand-subtitle">
                <span className="uok-brand-urdu" style={{"fontSize":"12px"}}>جامعہ کراچی</span>
                <span className="uok-brand-sep">•</span>
                <span className="uok-brand-tag" style={{"fontSize":"9.5px"}}>ESTD. 1951</span>
              </div>
            </div>
            <img className="uok-jubilee-img" src="/uok101.jpg" alt="Diamond Jubilee" />
          </a>
        </div>
        <p className="about-text">Celebrating 75 Years of Academic Leadership (1951–2026). The University of Karachi is one of Pakistan's largest public universities — a 1,279-acre campus with nine faculties, 53 academic departments and 20 research institutes.</p>
        <div className="footer-info">
          <a href="contact"><span className="footer-info-icon"><i className="fa-solid fa-location-dot"></i></span> University Road, Karachi-75270, Pakistan</a>
          <a href="mailto:registrar@uok.edu.pk"><span className="footer-info-icon"><i className="fa-solid fa-envelope"></i></span> registrar@uok.edu.pk</a>
        </div>
      </div>
    </div>
    <div className="widget footer-widget">
      <h3 className="widget_title">Campus News</h3>
      <div className="recent-post-wrap">
        <div className="recent-post">
          <div className="media-img"><a href="/admissions"><img src="assets/img/uok/header-gate.jpg" alt="News" /></a></div>
          <div className="media-body">
            <h4 className="post-title"><a href="/admissions" className="text-inherit">Admissions Program 2027 Now Open</a></h4>
            <div className="recent-post-meta"><a href="/admissions"><i className="far fa-calendar"></i>2027</a></div>
          </div>
        </div>
        <div className="recent-post">
          <div className="media-img"><a href="research"><img src="assets/img/uok/banner-chem.jpg" alt="News" /></a></div>
          <div className="media-body">
            <h4 className="post-title"><a className="text-inherit" href="research">20 Research Institutes Driving Innovation</a></h4>
            <div className="recent-post-meta"><a href="research"><i className="far fa-calendar"></i>2026</a></div>
          </div>
        </div>
        <div className="recent-post">
          <div className="media-img"><a href="institute-kibge"><img src="assets/img/uok/banner-elib.jpg" alt="News" /></a></div>
          <div className="media-body">
            <h4 className="post-title"><a className="text-inherit" href="institute-kibge">KIBGE Advances Biotechnology Research</a></h4>
            <div className="recent-post-meta"><a href="institute-kibge"><i className="far fa-calendar"></i>2026</a></div>
          </div>
        </div>
      </div>
    </div>
    <div className="widget footer-widget">
      <h3 className="widget_title">Quick Links</h3>
      <div className="th-social">
        <a href="contact"><i className="fa-solid fa-location-dot"></i></a>
        <a href="mailto:registrar@uok.edu.pk"><i className="fa-solid fa-envelope"></i></a>
        <a href="tel:+922199261300"><i className="fa-solid fa-phone"></i></a>
      </div>
    </div>
  </div>
</div>

<div className="popup-search-box">
  <button className="searchClose"><i className="far fa-times"></i></button>
  <form action="#">
    <input type="text" placeholder="What are you looking for?" />
    <button type="submit"><i className="fal fa-search"></i></button>
  </form>
</div>

<div className="th-menu-wrapper">
  <div className="th-menu-area text-center">
    <button className="th-menu-toggle"><i className="fal fa-times"></i></button>
    <div className="mobile-logo">
      <a href="/" className="uok-brand-lockup" style={{"justifyContent":"center","gap":"12px"}}>
        <img className="uok-crest-img" src="assets/img/logo-icon.png" alt="University of Karachi" />
        <div className="uok-brand-text">
          <span className="uok-brand-title" style={{"fontSize":"16px"}}>UNIVERSITY OF KARACHI</span>
          <div className="uok-brand-subtitle">
            <span className="uok-brand-urdu" style={{"fontSize":"13px"}}>جامعہ کراچی</span>
            <span className="uok-brand-sep">•</span>
            <span className="uok-brand-tag" style={{"fontSize":"10px"}}>ESTD. 1951</span>
          </div>
        </div>
        <img className="uok-jubilee-img" src="/uok101.jpg" alt="Diamond Jubilee" />
      </a>
    </div>
    <div className="mobile-scholarship-wrap">
      <a
        href="https://www.uok.edu.pk/sfao"
        target="_blank"
        rel="noopener noreferrer"
        className="header-scholarships-btn"
      >
        <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
        <span>Scholarships</span>
      </a>
    </div>
    <div className="th-mobile-menu">
      <NavList nodes={menu} />
    </div>
  </div>
</div>

<header className="th-header header-layout1">
  <div className="header-info d-none d-sm-block">
    <div className="container th-container2">
      <div className="row justify-content-between align-items-center">
        <div className="col-auto">
          <div className="header-logo">
            <a href="/" className="uok-brand-lockup">
              <div className="uok-crest-wrap">
                <img className="uok-crest-img" src="assets/img/logo-icon.png" alt="University of Karachi Logo" />
              </div>
              <div className="uok-brand-text">
                <span className="uok-brand-title">UNIVERSITY OF KARACHI</span>
                <div className="uok-brand-subtitle">
                  <span className="uok-brand-urdu">جامعہ کراچی</span>
                  <span className="uok-brand-sep">•</span>
                  <span className="uok-brand-tag">ESTD. 1951</span>
                </div>
              </div>
              <div className="uok-brand-divider" aria-hidden="true"></div>
              <div className="uok-jubilee-wrap">
                <img className="uok-jubilee-img" src="/uok101.jpg" alt="University of Karachi 75 Years Diamond Jubilee" />
                <div className="uok-jubilee-text d-none d-xxl-flex">
                  <span className="uok-jubilee-title">DIAMOND JUBILEE</span>
                  <span className="uok-jubilee-years">75 YEARS (1951–2026)</span>
                </div>
              </div>
            </a>
          </div>
        </div>
        <div className="col-auto">
          <div className="header-info-right">
            <div className="header-info-item">
              <div className="header-info-icon"><i className="fa-solid fa-location-dot"></i></div>
              <div className="header-info-content">
                <span className="header-info-text">Address</span>
                <h3 className="header-info-title"><a href="contact">University Road, Karachi-75270</a></h3>
              </div>
            </div>
            <div className="header-info-item">
              <div className="header-info-icon"><i className="fa-solid fa-envelope"></i></div>
              <div className="header-info-content">
                <span className="header-info-text">Email</span>
                <h3 className="header-info-title"><a href="mailto:registrar@uok.edu.pk">registrar@uok.edu.pk</a></h3>
              </div>
            </div>
            <a
              href="https://www.uok.edu.pk/sfao"
              target="_blank"
              rel="noopener noreferrer"
              className="header-scholarships-btn"
            >
              <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
              <span>Scholarships</span>
            </a>
            <div className="header-info-sep" aria-hidden="true"></div>
            <button
              type="button"
              className="header-search-icon-btn searchBoxToggler"
              aria-label="Search"
            >
              <i className="fal fa-search" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="sticky-wrapper">
    <div className="menu-area">
      <div className="container th-container2">
        <div className="menu-wrapp">
          <div className="row align-items-center justify-content-between">
            <div className="col">
              <div className="header-left d-flex align-items-center">
                <div className="sticky-logo-wrap">
                  <a href="/" className="sticky-brand-lockup">
                    <img className="sticky-crest-img" src="assets/img/logo-icon.png" alt="University of Karachi" />
                    <div className="sticky-brand-text">
                      <span className="sticky-brand-name">University of Karachi</span>
                      <span className="sticky-brand-sub">جامعہ کراچی • 75 Years</span>
                    </div>
                    <img className="sticky-jubilee-img" src="/uok101.jpg" alt="Diamond Jubilee" />
                  </a>
                </div>
                <div className="header-button d-none d-sm-block">
                  <a href="/admissions" className="th-btn">Admissions 2027 <img src="assets/img/icon/right-icon.svg" className="th-arrow" alt="icon" /></a>
                </div>
                <nav className="main-menu d-none d-xl-block">
                  <NavList nodes={menu} />
                </nav>
              </div>
            </div>
            <div className="col-auto ms-lg-auto">
              <div className="header-button d-flex align-items-center">
                <a href="/semester-fees" className="th-btn d-none d-sm-inline-flex">
                  Semester Fee <img src="/assets/img/icon/right-icon.svg" className="th-arrow" alt="icon" />
                </a>
                <button type="button" className="th-menu-toggle d-inline-block d-xl-none"><i className="far fa-bars"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</header>
    </>
  );
}
