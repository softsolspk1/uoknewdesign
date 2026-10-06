// Inner-page content is legacy theme HTML stored in the DB (or legacy_html/).
// Pages saved from the admin editor were captured from the live DOM, so they
// carry runtime residue from the theme's JS: GSAP SplitText wrappers (one
// <div> per character, some frozen at opacity:0/visibility:hidden), inline
// transform styles, and Swiper's generated classes/bullets. Those make
// headings invisible or garbled and bloat pages several-fold, so they are
// stripped here before rendering.

const SPLIT_WRAPPER = /^<div\s+(?:style="\s*position:\s*relative;\s*display:\s*inline-block;[^"]*"|class="split-line"[^>]*)\s*>$/;
const DIV_TAG = /<div\b[^>]*>|<\/div\s*>/gi;

const RUNTIME_PROPS = new Set([
  'opacity',
  'visibility',
  'translate',
  'rotate',
  'scale',
  'transform',
  'perspective',
  'transition-duration',
  'animation-delay',
  'animation-name',
]);
const RUNTIME_TRIGGERS = ['translate', 'rotate', 'scale', 'transform', 'perspective', 'animation-name', 'visibility', 'transition-duration'];

const SWIPER_RUNTIME_CLASS =
  /\s*\bswiper-(?:initialized|horizontal|vertical|backface-hidden|slide-(?:active|next|prev|visible|fully-visible)|watch-progress|pointer-events|autoheight|pagination-(?:clickable|bullets|horizontal|lock)|button-lock)\b/g;

function unwrapSplitText(html: string): string {
  const out: string[] = [];
  const skipStack: boolean[] = [];
  let pos = 0;
  for (const m of html.matchAll(DIV_TAG)) {
    out.push(html.slice(pos, m.index));
    pos = m.index! + m[0].length;
    const tag = m[0];
    if (tag.startsWith('</')) {
      if (!skipStack.pop()) out.push(tag);
    } else {
      const skip = SPLIT_WRAPPER.test(tag);
      skipStack.push(skip);
      if (!skip) out.push(tag);
    }
  }
  out.push(html.slice(pos));
  return out.join('');
}

// Drop a style attribute only when every declaration in it is animation
// state, so author-written styles (even ones using opacity) survive.
function stripRuntimeStyle(attr: string, decls: string): string {
  const props = decls
    .split(';')
    .filter((d) => d.includes(':'))
    .map((d) => d.split(':')[0].trim().toLowerCase());
  if (!props.length) return attr;
  const allRuntime = props.every((p) => RUNTIME_PROPS.has(p));
  const hasTrigger = props.some((p) => RUNTIME_TRIGGERS.includes(p));
  return allRuntime && hasTrigger ? '' : attr;
}

export function cleanLegacyHtml(html: string): string {
  return unwrapSplitText(html)
    .replace(/\s*style="([^"]*)"/g, (attr, decls: string) => stripRuntimeStyle(attr, decls))
    .replace(/<span class="char\d+">([^<]*)<\/span>/g, '$1')
    .replace(/<span class="swiper-notification"[^>]*><\/span>/g, '')
    .replace(/<span class="swiper-pagination-bullet[^"]*"[^>]*><\/span>/g, '')
    .replace(/class="([^"]*)"/g, (_, cls: string) => `class="${cls.replace(SWIPER_RUNTIME_CLASS, '').trim()}"`);
}

export interface Crumb {
  label: string;
  href?: string;
}

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// The legacy theme opens every page with a .breadcumb-wrapper banner. The
// redesign renders its own hero instead, so pull the title/trail out of it
// (falling back to the page title when an edit has left it empty) and drop
// the old banner from the body.
export function extractPageHero(html: string, fallbackTitle: string): { title: string; crumbs: Crumb[]; body: string } {
  let title = '';
  let crumbs: Crumb[] = [];
  let body = html;

  const start = html.search(/<div\b[^>]*class="[^"]*\bbreadcumb-wrapper\b/);
  if (start !== -1) {
    // Find the matching close of the wrapper div by depth counting.
    let depth = 0;
    let end = -1;
    DIV_TAG.lastIndex = 0;
    for (const m of html.slice(start).matchAll(DIV_TAG)) {
      depth += m[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = start + m.index! + m[0].length;
        break;
      }
    }
    if (end !== -1) {
      const banner = html.slice(start, end);
      const h1 = banner.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
      if (h1) title = textOf(h1[1]);
      const menu = banner.match(/<ul\b[^>]*class="[^"]*\bbreadcumb-menu\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/);
      if (menu) {
        crumbs = [...menu[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
          .map((li): Crumb | null => {
            const a = li[1].match(/<a\b[^>]*href="([^"]*)"/);
            const label = textOf(li[1]);
            if (!label) return null;
            const href = a ? (/^(https?:|\/|#)/.test(a[1]) ? a[1] : `/${a[1]}`) : undefined;
            return { label, href };
          })
          .filter((c): c is Crumb => c !== null);
      }
      body = html.slice(0, start) + html.slice(end);
    }
  }

  if (!title) title = fallbackTitle;
  if (!crumbs.length || crumbs[0].label.toLowerCase() !== 'home') {
    crumbs = [{ label: 'Home', href: '/' }, ...crumbs.filter((c) => c.label.toLowerCase() !== 'home')];
  }
  if (crumbs.length === 1) crumbs.push({ label: title });
  return { title, crumbs, body };
}
