/* eslint-disable @next/next/no-html-link-for-pages -- inner pages are legacy HTML whose jQuery plugins only initialise on a full page load, so links must not client-navigate. */
import React from 'react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import PageViewBeacon from '@/components/PageViewBeacon';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import HomeCarousel from '@/components/home/HomeCarousel';
import { AnnouncementBar, HeroSlider, type Announcement, type HeroSlide } from '@/components/home/HomeHero';
import { ensureExtraSchema } from '@/lib/schemaBootstrap';

// Cached and served statically; admin saves go live immediately via
// revalidatePath('/') in the pages API, this is just a safety-net TTL.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({
    where: { slug: 'home' },
    select: { metaTitle: true, metaDescription: true },
  }).catch(() => null);

  return {
    title: page?.metaTitle || 'University of Karachi — Official Website',
    description:
      page?.metaDescription ||
      "Official website of the University of Karachi. Celebrating 75 Years of Academic Leadership (1951–2026).",
  };
}

const HERO_SLIDES: HeroSlide[] = [
  {
    image: '/photos/Admin Block.jpg',
    eyebrow: 'A Legacy of Excellence Since 1951',
    title: 'University of Karachi',
    subtitle: ['Knowledge for a ', 'Brighter', ' Tomorrow'],
    text: 'Established in 1951, a legacy of academic excellence spanning a 1,279-acre campus, nine faculties, 53 departments and 20 research institutes.',
    quote: 'A leading national university, shaping a better, more equitable future.',
  },
  {
    image: '/assets/img/uok/silver-jubilee-gate.jpg',
    eyebrow: 'Research & Innovation',
    title: 'Advancing Discovery',
    subtitle: ['Research that ', 'Builds', ' Pakistan'],
    text: 'Home to internationally recognised centres including the H.E.J. Research Institute of Chemistry and the Dr. A.Q. Khan Institute of Biotechnology & Genetic Engineering.',
    quote: 'Knowledge, character and service for a better Pakistan.',
  },
  {
    image: '/assets/img/uok/sheikh-zayed-islamic-center.jpg',
    eyebrow: 'Excellence in Higher Education',
    title: 'Learn. Lead. Serve.',
    subtitle: ['Programs for a ', 'Changing', ' World'],
    text: 'Nine faculties and 53 departments offering undergraduate, graduate and doctoral programs to over 41,000 students.',
    quote: 'One of Pakistan’s largest public universities.',
  },
];

const ANNOUNCEMENT_FALLBACK: Announcement[] = [
  { id: 'a1', date: '17 Nov 2024', title: 'Research Associates (Artificial Intelligence (AI) Applications in Health)', href: '/news' },
  { id: 'a2', date: '07 Oct 2025', title: 'Admissions 2026: Applications now open for undergraduate & graduate programs', href: '/admissions' },
];

const STATS = [
  { icon: 'fa-graduation-cap', value: '50,000+', label: 'Alumni Worldwide' },
  { icon: 'fa-users', value: '9', label: 'Faculties' },
  { icon: 'fa-book-open', value: '53', label: 'Departments' },
  { icon: 'fa-flask', value: '20', label: 'Research Institutes' },
  { icon: 'fa-globe', value: 'Global', label: 'Collaborations' },
  { icon: 'fa-trophy', value: '73+', label: 'Years of Excellence' },
];

const QUICK_CARDS = [
  {
    title: 'Academics',
    text: 'Nine faculties and 53 departments offering undergraduate, graduate and doctoral programs.',
    icon: 'fa-graduation-cap',
    image: '/photos/education.jpg',
    href: '/academics',
    tone: 'navy',
  },
  {
    title: 'Research',
    text: '20 research institutes and centers, including ICCBS and HEJ Research Institute.',
    icon: 'fa-microscope',
    image: '/assets/img/uok/banner-nab.jpg',
    href: '/research',
    tone: 'teal',
  },
  {
    title: 'Admissions',
    text: 'Undergraduate, graduate, evening program and foreign student pathways.',
    icon: 'fa-file-lines',
    image: '/assets/img/uok/wiki-arts-lobby.jpg',
    href: '/admissions',
    tone: 'red',
  },
  {
    title: 'Scholarships',
    text: 'Student societies & clubs, academic and sports competitions and cultural activities.',
    icon: 'fa-users',
    image: '/science.jpg',
    href: 'https://www.uok.edu.pk/sfao',
    tone: 'green',
  },
];

const FACULTY_TAGS = {
  islamic: { label: 'Islamic Studies', icon: 'fa-book-quran', tone: 'red' },
  law: { label: 'Law', icon: 'fa-scale-balanced', tone: 'blue' },
  science: { label: 'Science', icon: 'fa-graduation-cap', tone: 'green' },
  arts: { label: 'Arts', icon: 'fa-palette', tone: 'blue' },
  pharmacy: { label: 'Pharmacy', icon: 'fa-flask', tone: 'red' },
  management: { label: 'Management', icon: 'fa-chart-line', tone: 'green' },
} as const;

const FACULTIES: { name: string; text: string; image: string; href: string; tag: keyof typeof FACULTY_TAGS }[] = [
  {
    name: 'Faculty of Islamic Studies',
    text: 'Islamic Learning, Qur’an wa Sunnah, Uloom-ud-Din and the Sirah Chair.',
    image: '/assets/img/uok/banner-nab.jpg',
    href: '/academics',
    tag: 'islamic',
  },
  {
    name: 'Faculty of Law',
    text: 'The School of Law preparing graduates for legal practice and public service.',
    image: '/assets/img/uok/hero-ubit.jpg',
    href: '/department-law',
    tag: 'law',
  },
  {
    name: 'Faculty of Science',
    text: '21 departments spanning biology, chemistry, physics, mathematics and computer science.',
    image: '/assets/img/uok/banner-chem.jpg',
    href: '/academics',
    tag: 'science',
  },
  {
    name: 'Faculty of Arts & Social Sciences',
    text: 'Languages, humanities and social sciences shaping thoughtful citizens.',
    image: '/Social Sciences.jpg',
    href: '/academics',
    tag: 'arts',
  },
  {
    name: 'Faculty of Pharmacy',
    text: 'Pharmaceutics, pharmacology, pharmacognosy and pharmacy practice.',
    image: '/assets/img/uok/pharmacy-faculty-building.jpg',
    href: '/department-pharmacy',
    tag: 'pharmacy',
  },
  {
    name: 'Faculty of Management',
    text: 'Business administration, commerce and public administration programs.',
    image: '/assets/img/uok/banner-fst.jpg',
    href: '/department-businessadministration',
    tag: 'management',
  },
  {
    name: 'Faculty of Education',
    text: 'Teacher education, special education and educational leadership.',
    image: '/photos/education.jpg',
    href: '/department-education',
    tag: 'arts',
  },
];

const NEWS_LIST = [
  {
    day: '28',
    month: 'Sep 2025',
    title: 'UoK Medical Team in Flood Relief',
    text: 'University of Karachi medical teams provide healthcare support in affected areas.',
    image: '/assets/img/research/research_inner_1.jpg',
    href: '/news',
  },
  {
    day: '04',
    month: 'Sep 2025',
    title: 'Cancer Research Breakthrough',
    text: 'Study identifies new pathway for early detection.',
    image: '/assets/img/research/research_1_6.jpg',
    href: '/news',
  },
];

const NEWS_CARDS = [
  {
    tag: 'Academic Excellence',
    tone: 'navy',
    title: 'Marking 73 Years of Academic Excellence',
    text: 'Since 1951, the University of Karachi has grown into one of Pakistan’s largest public universities.',
    image: '/assets/img/uok/hero-ubit.jpg',
    href: '/about',
  },
  {
    tag: 'Admissions',
    tone: 'red',
    title: 'Admissions 2026 Applications Now Open',
    text: 'Undergraduate, graduate and evening program applications are open for the new academic year.',
    image: '/assets/img/uok/silver-jubilee-gate.jpg',
    href: '/admissions',
  },
];

const ANNOUNCEMENTS_FALLBACK = [
  {
    day: '07',
    month: 'Oct 2025',
    title: 'Higher Income From 2D Materials to Single-Material Junction: Dielectric Properties and Sensing Applications of SnS',
    text: 'Invited speaker at an international symposium on advanced materials.',
    href: '/news',
  },
  {
    day: '28',
    month: 'Oct 2025',
    title: 'MUIH panel reviews The Indus Hospital and ICBSB – University of Karachi',
    text: 'Read more about the collaborative initiatives and impact.',
    href: '/news',
  },
  {
    day: '04',
    month: 'Oct 2025',
    title: 'Cancer’s Tribune: about the research carried out at the Jamil-ur-Rahman Center for Genome Research',
    text: 'A study on early detection and innovative therapeutic approaches.',
    href: '/news',
  },
  {
    day: '28',
    month: 'Oct 2025',
    title: 'MUIH panel reviews The Indus Hospital and ICBSB – University of Karachi',
    text: 'Read more about the collaborative initiatives and impact.',
    href: '/news',
  },
];

const ADMISSION_POINTS = [
  'Undergraduate (B.S.) Admissions',
  'Foreign Students’ Admissions',
  'Graduate (M.S./M.Phil.) Admissions',
  'Merit Scholarships',
  'Ph.D. & Research Programs',
  'Semester Fee & Vouchers',
  'Evening Program',
  'Entry Test Guidance',
];

const INSTITUTES = [
  { name: 'Dr. Panjwani Center for Molecular Medicine', image: '/assets/img/uok/banner-elib.jpg', href: 'https://www.iccs.edu/page-pcmd' },
  { name: 'Center of Excellence in Marine Biology', image: '/assets/img/uok/banner-nab.jpg', href: 'https://marinebiology.edu.pk/' },
  { name: 'Institute of Environmental Studies', image: '/assets/img/uok/banner-fst.jpg', href: '/institute-ies' },
  { name: 'H.E.J. Research Institute of Chemistry', image: '/assets/img/uok/hej-research-institute-2.jpg', href: 'http://www.iccs.edu' },
  { name: 'Dr. A.Q. Khan Institute of Biotechnology', image: '/assets/img/uok/dr-aq-khan-institute.jpg', href: '/institute-kibge' },
  { name: 'Applied Economics Research Centre', image: '/assets/img/uok/atta-ur-rahman-labs.jpg', href: 'http://www.aerc.edu.pk' },
  { name: 'Latif Ebrahim Jamal Science Information Center', image: '/assets/img/uok/lej-science-information-center.jpg', href: '/research' },
  { name: 'Sheikh Zayed Islamic Center', image: '/assets/img/uok/sheikh-zayed-islamic-center.jpg', href: 'http://szic.edu.pk/' },
];

function ext(href: string) {
  return /^https?:\/\//i.test(href) || /\.pdf$/i.test(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
}

async function getAnnouncements() {
  const rows = await prisma.news
    .findMany({
      where: { isPublished: true },
      orderBy: [{ order: 'asc' }, { date: 'desc' }],
      take: 4,
      select: { id: true, title: true, excerpt: true, link: true, pdfUrl: true, date: true },
    })
    .catch(() => []);
  if (rows.length === 0) return ANNOUNCEMENTS_FALLBACK;
  return rows.map((n) => ({
    day: n.date.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: n.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    title: n.title,
    text: n.excerpt || '',
    href: n.pdfUrl || (n.link && n.link.trim()) || '/news',
  }));
}

export default async function Home() {
  await ensureExtraSchema();
  const [page, announcements] = await Promise.all([
    prisma.page.findUnique({ where: { slug: 'home' }, select: { pdfUrl: true, pdfLabel: true } }).catch(() => null),
    getAnnouncements(),
  ]);

  return (
    <>
      <PageViewBeacon path="/" />
      {/* Script font for the VC signature; React hoists this into <head>. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&family=Noto+Nastaliq+Urdu:wght@700&display=swap"
        precedence="default"
      />
      <main className="hv2 hv2-home">
        <HeroSlider slides={HERO_SLIDES} />
        <AnnouncementBar fallback={ANNOUNCEMENT_FALLBACK} />

        {/* Legacy of impact + VC message */}
        <section className="hv2-wrap hv2-impact-row">
          <div className="hv2-impact">
            <div className="hv2-impact-img" style={{ backgroundImage: 'url("/assets/img/uok/wiki-silver-jubilee-gate.jpg")' }} />
            <div className="hv2-impact-body">
              <h2 className="hv2-impact-title">A Legacy of Impact</h2>
              <p className="hv2-impact-sub">Advancing knowledge. Empowering people. Building a better Pakistan.</p>
              <ul className="hv2-stats">
                {STATS.map((s) => (
                  <li key={s.label}>
                    <i className={`fa-solid ${s.icon}`} aria-hidden="true" />
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <article className="hv2-vc">
            <div className="hv2-vc-photo">
              <span className="hv2-vc-block" aria-hidden="true" />
              <img src="/assets/img/uok/vc-waseem-qazi.jpg" alt="Prof. Dr. Waseem Qazi, Vice Chancellor" />
              <div className="hv2-vc-sign">
                <span className="hv2-vc-signature" aria-hidden="true">Waseem Qazi</span>
                <strong>Prof. Dr. Waseem Qazi</strong>
                <span>Vice Chancellor</span>
              </div>
            </div>
            <div className="hv2-vc-body">
              <p className="hv2-kicker">Leadership</p>
              <h2>Message from the Vice Chancellor</h2>
              <p>
                Prof. Dr. Waseem Qazi serves as Vice Chancellor of the University of Karachi, guiding one of
                Pakistan’s largest and most historic institutions of higher learning toward continued academic and
                research excellence.
              </p>
              <a href="/vice-chancellor" className="hv2-btn hv2-btn-maroon hv2-btn-sm">
                Vice Chancellor’s Office <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </a>
            </div>
          </article>
        </section>

        {/* Quick access cards */}
        <section className="hv2-quick-band">
          <div className="hv2-wrap hv2-quick">
            {QUICK_CARDS.map((c, i) => (
              <a key={c.title} href={c.href} {...ext(c.href)} className={`hv2-quick-card tone-${c.tone}`}>
                <span className="hv2-quick-img" style={{ backgroundImage: `url("${c.image}")` }} aria-hidden="true" />
                <span className="hv2-quick-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="hv2-quick-body">
                  <i className={`fa-solid ${c.icon} hv2-quick-icon`} aria-hidden="true" />
                  <span className="hv2-quick-title">
                    {c.title} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                  <span className="hv2-quick-text">{c.text}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Faculties */}
        <section className="hv2-wrap hv2-section">
          <h2 className="hv2-h-sans">Explore Our Faculties</h2>
          <HomeCarousel label="faculties">
            {FACULTIES.map((f) => {
              const tag = FACULTY_TAGS[f.tag];
              return (
                <article key={f.name} className="hv2-faculty" role="listitem">
                  <div className="hv2-faculty-img">
                    <img src={f.image} alt="" loading="lazy" />
                    <span className={`hv2-badge tone-${tag.tone}`}>
                      <i className={`fa-solid ${tag.icon}`} aria-hidden="true" /> {tag.label}
                    </span>
                  </div>
                  <div className="hv2-faculty-body">
                    <h3>{f.name}</h3>
                    <p>{f.text}</p>
                    <div className="hv2-faculty-foot">
                      <a href={f.href} className="hv2-learn">
                        Learn More <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                      </a>
                      <a href={f.href} className="hv2-circle" aria-label={`Open ${f.name}`}>
                        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </HomeCarousel>
        </section>

        {/* News + announcements */}
        <section className="hv2-wrap hv2-news-row">
          <div className="hv2-news">
            <h2 className="hv2-h-serif">News</h2>
            <div className="hv2-news-grid">
              <div className="hv2-news-list">
                {NEWS_LIST.map((n) => (
                  <article key={n.title} className="hv2-news-item">
                    <p className="hv2-news-date">
                      <strong>{n.day}</strong>
                      <span>{n.month}</span>
                    </p>
                    <img src={n.image} alt="" loading="lazy" />
                    <div>
                      <h3>{n.title}</h3>
                      <p>{n.text}</p>
                      <a href={n.href} className="hv2-read">
                        Read More <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              {NEWS_CARDS.map((n) => (
                <article key={n.title} className="hv2-news-card">
                  <img src={n.image} alt="" loading="lazy" />
                  <div>
                    <p className={`hv2-news-tag tone-${n.tone}`}>{n.tag}</p>
                    <h3>{n.title}</h3>
                    <p>{n.text}</p>
                    <a href={n.href} className="hv2-read is-navy">
                      Read More <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <a href="/news" className="hv2-view-all">
              View All News <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </a>
          </div>

          <div className="hv2-ann">
            <h2 className="hv2-h-serif">Announcements</h2>
            <ul>
              {announcements.map((a, i) => (
                <li key={i}>
                  <a href={a.href} {...ext(a.href)}>
                    <span className="hv2-ann-date">
                      <strong>{a.day}</strong>
                      <span>{a.month}</span>
                    </span>
                    <span className="hv2-ann-body">
                      <strong>{a.title}</strong>
                      {a.text && <span>{a.text}</span>}
                    </span>
                    <span className="hv2-circle" aria-hidden="true">
                      <i className="fa-solid fa-arrow-right" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a href="/news" className="hv2-view-all">
              View All News <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* Promo tiles */}
        <section className="hv2-wrap hv2-promos">
          <article className="hv2-promo-adm" style={{ backgroundImage: 'url("/assets/img/uok/banner-nab.jpg")' }}>
            <div className="hv2-promo-adm-inner">
              <p className="hv2-promo-kicker">Admissions 2026</p>
              <p className="hv2-promo-stamp">Admissions - 2026</p>
              <h2>
                Among Pakistan’s
                <br />
                Largest Universities
              </h2>
              <p className="hv2-promo-lead">
                Nine faculties, 53 departments and a range of admission pathways for undergraduate, graduate and
                international students.
              </p>
              <ul className="hv2-checks">
                {ADMISSION_POINTS.map((p) => (
                  <li key={p}>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> {p}
                  </li>
                ))}
              </ul>
              <div className="hv2-promo-btns">
                <a href="/admissions" className="hv2-btn hv2-btn-pink hv2-btn-sm">
                  Apply Now <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </a>
                <a href="/admissions" className="hv2-btn hv2-btn-ghost hv2-btn-xs">Learn More</a>
              </div>
            </div>
          </article>

          <a href="/student-life" className="hv2-promo-life">
            <span className="hv2-promo-life-img" style={{ backgroundImage: 'url("/assets/img/blog/blog_3_2.jpg")' }} />
            <span className="hv2-promo-life-copy">
              <span className="hv2-promo-life-title">Student Life</span>
              <span className="hv2-promo-life-text">
                Student societies &amp; clubs, academic and sports competitions and cultural activities.
              </span>
            </span>
          </a>

          <article className="hv2-promo-future" style={{ backgroundImage: 'url("/assets/img/about/about-thumb2-2.jpg")' }}>
            <div className="hv2-promo-future-top">
              <p className="hv2-promo-kicker is-small">Admissions 2026</p>
              <h2>Your Future Starts Here</h2>
              <p>Join a community of thinkers, doers and changemakers at Pakistan’s largest public university.</p>
              <a href="/admissions" className="hv2-btn hv2-btn-pink hv2-btn-xs">
                Apply Now <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </a>
            </div>
            <ul className="hv2-promo-future-icons">
              <li><i className="fa-solid fa-users" aria-hidden="true" />Diverse Programs</li>
              <li><i className="fa-solid fa-globe" aria-hidden="true" />Global Opportunities</li>
              <li><i className="fa-solid fa-chart-column" aria-hidden="true" />Brighter Careers</li>
            </ul>
          </article>

          <div className="hv2-promo-quote">
            <span className="hv2-promo-quote-art" style={{ backgroundImage: 'url("/assets/img/uok/sheikh-zayed-islamic-center.jpg")' }} aria-hidden="true" />
            <p className="hv2-promo-quote-text">“Knowledge Empowers People and Transforms Nations.”</p>
          </div>
        </section>

        {/* Research institutes */}
        <section className="hv2-wrap hv2-section hv2-institutes">
          <h2 className="hv2-h-sans">Our Research Institutes</h2>
          <HomeCarousel label="research institutes">
            {INSTITUTES.map((r) => (
              <a key={r.name} href={r.href} {...ext(r.href)} className="hv2-inst" role="listitem">
                <img src={r.image} alt="" loading="lazy" />
                <span>{r.name}</span>
              </a>
            ))}
          </HomeCarousel>
          <a href="/research" className="hv2-view-all">
            Explore All Institutes <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </a>
        </section>
      </main>
      <PdfDownloadButton url={page?.pdfUrl} label={page?.pdfLabel} />
    </>
  );
}
