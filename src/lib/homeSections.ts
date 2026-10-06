import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ensureExtraSchema } from '@/lib/schemaBootstrap';

export const NEWS_START = '<!--NEWS_ITEMS_START-->';
export const NEWS_END = '<!--NEWS_ITEMS_END-->';
export const FAQ_START = '<!--FAQ_ITEMS_START-->';
export const FAQ_END = '<!--FAQ_ITEMS_END-->';
export const HERO_START = '<!--HERO_SLIDES_START-->';
export const HERO_END = '<!--HERO_SLIDES_END-->';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkAttrs(link: string | null | undefined): string {
  const href = link && link.trim() ? link.trim() : '/';
  if (/^https?:\/\//i.test(href)) {
    return `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`;
  }
  return `href="${escapeHtml(href.replace(/^\//, ''))}"`;
}

function renderNewsCard(n: {
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  link: string | null;
}): string {
  const a = linkAttrs(n.link);
  const img = n.imageUrl || 'assets/img/uok/header-gate.jpg';
  return `<div class="col-lg-4">
        <div class="blog-card wow fadeInUp">
          <div class="blog-img position-relative">
            <a ${a}><div class="blog-img-box position-relative overflow-hidden"><img src="${escapeHtml(img)}" alt="blog image" /></div></a>
          </div>
          <div class="blog-content">
            <div class="blog-meta"><a class="author" href="/">University of Karachi</a></div>
            <h3 class="box-title"><a ${a}>${escapeHtml(n.title)}</a></h3>
            <p class="box-text">${escapeHtml(n.excerpt || '')}</p>
            <div class="btn-wrap"><a ${a} class="th-btn style-border1 th-icon">Read More</a></div>
          </div>
        </div>
      </div>`;
}

const DEFAULT_SLIDE_IMAGE = 'assets/img/uok/header-gate.jpg';

function renderHeroSlide(s: { heading: string; description: string | null; imageUrl: string | null; videoUrl?: string | null }): string {
  const img = s.imageUrl || DEFAULT_SLIDE_IMAGE;
  const bg = s.videoUrl
    ? `<div class="th-hero-bg">
            <video class="th-hero-bg-video" autoplay muted loop playsinline preload="auto"${s.imageUrl ? ` poster="${escapeHtml(s.imageUrl)}"` : ''} style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(1.15) saturate(1.15) contrast(1.05);">
              <source src="${escapeHtml(s.videoUrl)}" type="video/mp4" />
            </video>
            <div style="position:absolute;inset:0;background:linear-gradient(rgba(8, 25, 51, 0.12), rgba(8, 25, 51, 0.4));"></div>
          </div>`
    : `<div class="th-hero-bg" style="background-image:linear-gradient(rgba(8, 25, 51, 0.45), rgba(8, 25, 51, 0.65)), url('${escapeHtml(img)}');background-size:cover;background-position:center;background-repeat:no-repeat;"></div>`;
  return `<div class="swiper-slide">
        <div class="hero-inner">
          ${bg}
          <div class="container th-container2">
            <div class="row gy-60 align-items-center">
              <div class="col-xxl-8 col-xl-9 col-lg-10">
                <div class="hero-style1">
                  <div class="hero-text-wrap">
                    <h1 class="hero-title text-white" data-ani="slideinup" data-ani-delay="0.3s">${escapeHtml(s.heading)}</h1>
                    ${s.description ? `<p class="hero-text text-white" data-ani="slideinup" data-ani-delay="0.5s">${escapeHtml(s.description)}</p>` : ''}
                    <div class="btn-wrap justify-content-center justify-content-lg-start" data-ani="slideinup" data-ani-delay="0.8s">
                      <a href="/admissions" class="th-btn white-hover th-icon">Admission Now</a>
                      <a href="academics" class="th-btn style-border1 th-icon white-hover">View Academics</a>
                    </div>
                    <div class="anniversary-hero-seal-wrap" data-ani="slideinup" data-ani-delay="0.9s">
                      <img class="hero-seal-img" src="/uok101.jpg" alt="University of Karachi 75 Years Diamond Jubilee" />
                      <div class="anniversary-hero-seal-content">
                        <span class="anniversary-hero-seal-tag">1951 – 2026 • Diamond Jubilee</span>
                        <h4 class="anniversary-hero-seal-title">75 Years of Academic Leadership</h4>
                        <p class="anniversary-hero-seal-sub">Pakistan's Premier Public Research Institution</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}

function renderFaqItem(f: { question: string; answer: string }, index: number): string {
  const n = index + 1;
  const num = String(n).padStart(2, '0');
  const showId = `collapse-${n}`;
  const headerId = `collapse-item-${n}`;
  const isFirst = index === 0;
  return `<div class="accordion-item border-0 mb-3 rounded-3 shadow-sm wow fadeInUp" data-wow-delay=".${Math.min(n, 6)}s">
              <h2 class="accordion-header" id="${headerId}">
                <button class="accordion-button${isFirst ? '' : ' collapsed'} rounded-3 text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${showId}" aria-expanded="${isFirst ? 'true' : 'false'}" aria-controls="${showId}" style="background-color:#fff;padding:1.25rem;font-size:1.1rem">
                  ${num}. ${escapeHtml(f.question)}
                </button>
              </h2>
              <div id="${showId}" class="accordion-collapse collapse${isFirst ? ' show' : ''}" aria-labelledby="${headerId}" data-bs-parent="#faqAccordion">
                <div class="accordion-body text-muted" style="background-color:#fff;border-top:1px solid #eee;padding:1.25rem">
                  ${escapeHtml(f.answer)}
                </div>
              </div>
            </div>`;
}

function spliceBetweenMarkers(html: string, startMarker: string, endMarker: string, replacement: string): string | null {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  return `${before}\n${replacement}\n      ${after}`;
}

async function updateHomeContent(mutate: (content: string) => string | null) {
  const home = await prisma.page.findUnique({ where: { slug: 'home' } });
  if (!home) return;
  const updated = mutate(home.content);
  if (updated === null) return; // markers not found; skip silently
  await prisma.page.update({ where: { id: home.id }, data: { content: updated } });
  revalidatePath('/');
}

export async function regenerateNewsSection() {
  const items = await prisma.news.findMany({
    where: { isPublished: true },
    orderBy: [{ order: 'asc' }, { date: 'desc' }],
    take: 6,
  });
  const html = items.map(renderNewsCard).join('\n      ');
  await updateHomeContent((content) => spliceBetweenMarkers(content, NEWS_START, NEWS_END, html));
}

export async function regenerateHeroSlider() {
  await ensureExtraSchema();
  const slides = await prisma.slide.findMany({
    where: { isPublished: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    take: 8,
  });
  const defaultSlides = [
    {
      heading: 'Welcome to the University of Karachi',
      description: 'Celebrating 75 Years of Academic Leadership (1951–2026). A legacy of excellence spanning 1,279 acres, nine faculties, 53 departments and 20 research institutes.',
      imageUrl: 'assets/img/uok/header-gate.jpg',
    },
    {
      heading: 'Advancing Research & Innovation',
      description: 'Home to internationally recognized centers including the H.E.J. Research Institute of Chemistry and the Dr. A.Q. Khan Institute of Biotechnology & Genetic Engineering (KIBGE).',
      imageUrl: 'assets/img/uok/banner-nab.jpg',
    },
    {
      heading: 'Excellence in Higher Education',
      description: 'Nine faculties and 53 departments offering comprehensive undergraduate, graduate and doctoral programs serving over 41,000 students.',
      imageUrl: 'assets/img/uok/banner-elib.jpg',
    },
  ];
  const html = slides.length > 0
    ? slides.map(renderHeroSlide).join('\n      ')
    : defaultSlides.map(renderHeroSlide).join('\n      ');
  await updateHomeContent((content) => spliceBetweenMarkers(content, HERO_START, HERO_END, html));
}

export async function regenerateFaqSection() {
  const items = await prisma.faq.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
    take: 12,
  });
  const html = items.map(renderFaqItem).join('\n            ');
  await updateHomeContent((content) => spliceBetweenMarkers(content, FAQ_START, FAQ_END, html));
}
