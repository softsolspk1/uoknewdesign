// Scans legacy_html/*.html, src/content/*.html and the shared React
// components (Header/Footer/NewsTicker) for <a href> targets and reports
// internal links that don't resolve to any known route. "Known routes" =
// union of legacy_html filenames (the source every DB page/slug is seeded
// from) and the slugs actually present in the production Page table, plus
// a handful of static app routes. Run: node src/scripts/check_broken_links.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const LEGACY_DIR = path.join(ROOT, 'legacy_html');
const CONTENT_DIR = path.join(ROOT, 'src/content');
const COMPONENTS_DIR = path.join(ROOT, 'src/components');

const DB_PAGES_FILE = process.argv[2]; // optional path to a JSON array of {slug}

const STATIC_ROUTES = new Set([
  '', '/', 'admin', 'login', 'contact',
]);

function loadValidSlugs() {
  const slugs = new Set(STATIC_ROUTES);
  const legacyFiles = fs.readdirSync(LEGACY_DIR).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  for (const f of legacyFiles) slugs.add(path.basename(f, '.html'));

  if (DB_PAGES_FILE && fs.existsSync(DB_PAGES_FILE)) {
    const pages = JSON.parse(fs.readFileSync(DB_PAGES_FILE, 'utf8'));
    for (const p of pages) slugs.add(p.slug);
  }
  return slugs;
}

function collectSourceFiles() {
  const files = [];
  for (const f of fs.readdirSync(LEGACY_DIR)) {
    if (f.endsWith('.html') && !f.startsWith('_')) files.push(path.join(LEGACY_DIR, f));
  }
  if (fs.existsSync(CONTENT_DIR)) {
    for (const f of fs.readdirSync(CONTENT_DIR)) {
      if (f.endsWith('.html')) files.push(path.join(CONTENT_DIR, f));
    }
  }
  if (fs.existsSync(COMPONENTS_DIR)) {
    for (const f of fs.readdirSync(COMPONENTS_DIR)) {
      if (f.endsWith('.tsx')) files.push(path.join(COMPONENTS_DIR, f));
    }
  }
  return files;
}

function extractHrefs(html) {
  const hrefs = [];
  const re = /href=(?:"([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html))) {
    hrefs.push(m[1] !== undefined ? m[1] : m[2]);
  }
  return hrefs;
}

function classify(href) {
  if (!href || href === '#') return 'skip';
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return 'skip';
  if (href.startsWith('http://') || href.startsWith('https://')) return 'external';
  if (href.startsWith('/api/') || href.startsWith('/admin')) return 'skip'; // app-internal, not content routes
  if (href.startsWith('/assets/') || href.startsWith('/faculties/') || href.startsWith('/docs/') ||
      href.startsWith('/images/') || href.startsWith('assets/') || /\.(pdf|jpg|jpeg|png|gif|svg|doc|docx|xls|xlsx|css|js|json|ico|webp)$/i.test(href.split('#')[0].split('?')[0])) {
    return 'asset';
  }
  return 'internal';
}

function normalizeInternal(href) {
  let clean = href.split('#')[0].split('?')[0];
  clean = clean.replace(/^\//, '').replace(/\.html$/i, '');
  return clean;
}

function main() {
  const validSlugs = loadValidSlugs();
  const files = collectSourceFiles();

  const brokenInternal = new Map(); // slug -> Set(files)
  const externalLinks = new Map(); // url -> Set(files)

  for (const filePath of files) {
    const html = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(ROOT, filePath);
    const hrefs = extractHrefs(html);
    for (const href of hrefs) {
      const kind = classify(href);
      if (kind === 'internal') {
        const slug = normalizeInternal(href);
        if (slug === '') continue;
        if (!validSlugs.has(slug)) {
          if (!brokenInternal.has(slug)) brokenInternal.set(slug, new Set());
          brokenInternal.get(slug).add(rel);
        }
      } else if (kind === 'external') {
        if (!externalLinks.has(href)) externalLinks.set(href, new Set());
        externalLinks.get(href).add(rel);
      }
    }
  }

  console.log(`Scanned ${files.length} files against ${validSlugs.size} known slugs.\n`);

  console.log(`=== BROKEN INTERNAL LINKS (${brokenInternal.size} distinct targets) ===`);
  const sortedBroken = [...brokenInternal.entries()].sort((a, b) => b[1].size - a[1].size);
  for (const [slug, filesSet] of sortedBroken) {
    console.log(`  "${slug}"  (${filesSet.size} files) e.g. ${[...filesSet].slice(0, 3).join(', ')}`);
  }

  console.log(`\n=== DISTINCT EXTERNAL LINKS (${externalLinks.size}) ===`);
  fs.writeFileSync(
    path.join(ROOT, 'scratch_external_links.json'),
    JSON.stringify([...externalLinks.entries()].map(([url, filesSet]) => ({ url, files: [...filesSet] })), null, 2)
  );
  console.log('Written to scratch_external_links.json for a separate reachability pass.');
}

main();
