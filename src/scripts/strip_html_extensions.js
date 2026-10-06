const fs = require('fs');
const path = require('path');

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rewrites href="slug.html" / href="/slug.html" (optionally with #hash) to
// extension-less links, mapping index.html -> / specifically.
function stripHtmlLinks(html) {
  return html.replace(
    /href=(["'])(\/?)([a-zA-Z0-9_-]+)\.html(#[a-zA-Z0-9_-]*)?\1/g,
    (match, quote, leadingSlash, name, hash) => {
      const fragment = hash || '';
      if (name === 'index') {
        return `href=${quote}/${fragment}${quote}`;
      }
      return `href=${quote}${leadingSlash}${name}${fragment}${quote}`;
    }
  );
}

async function run() {
  // 1. Database Page.content
  const pages = await prisma.page.findMany({ select: { id: true, slug: true, content: true } });
  let dbChanged = 0;
  for (const p of pages) {
    const updated = stripHtmlLinks(p.content);
    if (updated !== p.content) {
      await prisma.page.update({ where: { id: p.id }, data: { content: updated } });
      dbChanged++;
    }
  }
  console.log(`Database pages updated: ${dbChanged}/${pages.length}`);

  // 2. legacy_html fallback files
  const legacyDir = path.join(__dirname, '../../legacy_html');
  const files = fs.readdirSync(legacyDir).filter((f) => f.endsWith('.html'));
  let fileChanged = 0;
  for (const f of files) {
    const full = path.join(legacyDir, f);
    const raw = fs.readFileSync(full, 'utf8');
    const updated = stripHtmlLinks(raw);
    if (updated !== raw) {
      fs.writeFileSync(full, updated, 'utf8');
      fileChanged++;
    }
  }
  console.log(`legacy_html files updated: ${fileChanged}/${files.length}`);

  // 3. bundled homepage fallback
  const homeFallback = path.join(__dirname, '../content/home.html');
  const homeRaw = fs.readFileSync(homeFallback, 'utf8');
  const homeUpdated = stripHtmlLinks(homeRaw);
  if (homeUpdated !== homeRaw) {
    fs.writeFileSync(homeFallback, homeUpdated, 'utf8');
    console.log('src/content/home.html updated');
  }

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
