// One-off research script: crawls the live uok.edu.pk site to discover each
// department's REAL sub-page navigation (left_course menu), so we can compare
// it against our local backup mirror and legacy_html output. Not part of the
// build; run manually with `node src/scripts/crawl_live_nav.js`.
const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(__dirname, '../../legacy_html');
const BACKUP_FACULTIES = 'D:/backup-uok.edu.pk-9-2-2026/public_html/faculties';
const OUT_FILE = path.join(__dirname, '../../scratch_live_nav_report.json');

const INDEX_CANDIDATES = ['index.php', 'indexnew.php', 'indextab2.php', 'about.php'];

async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLeftCourseLinks(html, slug) {
  const m = html.match(/<div[^>]*class=["']left_course["'][^>]*>([\s\S]*?)<div[^>]*class=["']right_course["']/i) ||
            html.match(/<div[^>]*class=["']left_course["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  const block = m ? m[1] : html;
  const links = [];
  const re = /<a\s+href=["']([^"'#][^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let mm;
  const prefix = `/faculties/${slug}/`;
  while ((mm = re.exec(block))) {
    let href = mm[1].trim();
    const label = mm[2].replace(/<[^>]+>/g, '').trim();
    if (href.startsWith(prefix)) href = href.slice(prefix.length);
    if (!href.startsWith('http') && !href.includes('/') && href.match(/\.php$/i)) {
      links.push({ file: href, label });
    }
  }
  // de-dupe by file
  const seen = new Set();
  return links.filter(l => (seen.has(l.file) ? false : (seen.add(l.file), true)));
}

async function main() {
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.startsWith('department-') && f.endsWith('.html'));
  const slugs = files.map(f => f.replace(/^department-/, '').replace(/\.html$/, ''));
  const report = {};

  for (const slug of slugs) {
    let html = null;
    let usedIndex = null;
    for (const cand of INDEX_CANDIDATES) {
      html = await fetchText(`https://www.uok.edu.pk/faculties/${slug}/${cand}`);
      if (html) { usedIndex = cand; break; }
    }
    if (!html) {
      report[slug] = { error: 'index not reachable' };
      console.log(`[FAIL] ${slug}`);
      continue;
    }
    const links = extractLeftCourseLinks(html, slug);
    const backupDir = path.join(BACKUP_FACULTIES, slug);
    const localFiles = fs.existsSync(backupDir) ? fs.readdirSync(backupDir) : [];
    const entries = links.map(l => ({
      file: l.file,
      label: l.label,
      localExists: localFiles.includes(l.file),
    }));
    report[slug] = { usedIndex, tabCount: entries.length, entries };
    console.log(`[OK] ${slug}: ${entries.length} tabs (${entries.filter(e => !e.localExists).length} missing locally)`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
  console.log(`\nWrote report to ${OUT_FILE}`);
}

main();
