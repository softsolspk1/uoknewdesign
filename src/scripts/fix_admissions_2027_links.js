// Every "Admissions 2027" link (header CTA button, nav dropdown item,
// sidemenu news card, footer link) across all legacy_html pages currently
// jumps straight to the external application portal (uokadmission.edu.pk/login),
// bypassing the site's own informational /admissions page entirely. On the
// real uok.edu.pk, the header "Admissions" nav goes to the site's own
// /admissions/index.php first; the external portal is only linked from
// inside that page's own "Apply Now" button. This script re-points every
// link whose visible label mentions "Admissions" + "2027" to the internal
// /admissions page instead, so the same info-first-then-apply flow works here.
const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(__dirname, '../../legacy_html');

function repointAnchor(full, attrs, inner) {
  let newAttrs = attrs
    .replace(/\s*target="_blank"/i, '')
    .replace(/\s*rel="noopener noreferrer"/i, '');
  return `<a href="/admissions"${newAttrs}>${inner}</a>`;
}

function fixFile(file) {
  const filePath = path.join(LEGACY_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = 0;

  const tagRe = /<a\s+href="https:\/\/uokadmission\.edu\.pk\/login"([^>]*)>((?:(?!<\/a>)[\s\S])*)<\/a>/gi;

  // Pass 1: the sidemenu "Admissions Program 2027 Now Open" news card has
  // three sibling links (image, title, date badge) pointing at the same
  // destination -- only the title link's own text mentions "2027", so fix
  // the whole card block as one unit to avoid leaving the image/date links
  // pointed at the external portal while the title goes internal. Split on
  // the repeating card marker instead of trying to regex-match balanced
  // nested <div>s.
  const CARD_MARKER = '<div class="recent-post">';
  if (html.includes(CARD_MARKER)) {
    const parts = html.split(CARD_MARKER);
    for (let i = 1; i < parts.length; i++) {
      const nextMarkerIdx = parts[i].indexOf('<div class="widget footer-widget">');
      const boundary = nextMarkerIdx === -1 ? parts[i].length : nextMarkerIdx;
      const cardBlock = parts[i].slice(0, boundary);
      const rest = parts[i].slice(boundary);
      if (/Admissions Program 2027/i.test(cardBlock)) {
        const fixedBlock = cardBlock.replace(tagRe, (f, attrs, inner) => {
          changed++;
          return repointAnchor(f, attrs, inner);
        });
        parts[i] = fixedBlock + rest;
      }
    }
    html = parts.join(CARD_MARKER);
  }

  // Pass 2: any remaining anchor whose own visible text mentions both
  // "Admissions" and "2027" (nav dropdown item, header CTA button, etc.)
  html = html.replace(tagRe, (full, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, ' ');
    if (/Admissions/i.test(text) && /2027/.test(text)) {
      changed++;
      return repointAnchor(full, attrs, inner);
    }
    return full;
  });

  if (changed > 0) {
    fs.writeFileSync(filePath, html, 'utf8');
  }
  return changed;
}

function main() {
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.endsWith('.html'));
  let totalFiles = 0;
  let totalLinks = 0;
  for (const file of files) {
    const n = fixFile(file);
    if (n > 0) {
      totalFiles++;
      totalLinks += n;
      console.log(`[FIXED] ${file}: ${n} link(s)`);
    }
  }
  console.log(`\nDone. ${totalLinks} "Admissions 2027" links re-pointed to /admissions across ${totalFiles} files.`);
}

main();
