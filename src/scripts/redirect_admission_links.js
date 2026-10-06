const fs = require('fs');
const path = require('path');

const EXTERNAL_URL = 'https://uokadmission.edu.pk/login';
const TARGET_SLUGS = new Set(['admissions', 'pg-admissions']);

// Matches a full opening <a ...> tag
const openTagRe = /<a\b[^>]*>/gi;
// Matches individual attributes: name="value" | name='value' | name
const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'))?/g;

function rewriteTag(tag) {
  attrRe.lastIndex = 0;
  let m;
  let first = true;
  const attrs = [];
  let hrefValue = null;

  // First token inside <a ...> is "a" itself from the regex match; skip it.
  const inner = tag.slice(1, -1).trim(); // strip < and >
  const innerAttrRe = new RegExp(attrRe.source, 'g');
  let idx = 0;
  while ((m = innerAttrRe.exec(inner))) {
    const name = m[1];
    const value = m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : null;
    if (idx === 0) {
      idx++;
      continue; // this is the tag name "a"
    }
    idx++;
    if (name.toLowerCase() === 'href') {
      hrefValue = value;
      continue; // drop, we'll re-add
    }
    if (name.toLowerCase() === 'target' || name.toLowerCase() === 'rel') {
      continue; // drop, we'll re-add
    }
    attrs.push(value !== null ? `${name}="${value}"` : name);
  }

  if (hrefValue === null) return null;
  const clean = hrefValue.replace(/^\//, '');
  if (!TARGET_SLUGS.has(clean)) return null;

  const rebuilt = `<a href="${EXTERNAL_URL}" target="_blank" rel="noopener noreferrer"${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  return rebuilt;
}

function transform(html) {
  let changed = 0;
  const out = html.replace(openTagRe, (tag) => {
    const rebuilt = rewriteTag(tag);
    if (rebuilt) {
      changed++;
      return rebuilt;
    }
    return tag;
  });
  return { out, changed };
}

module.exports = { transform, EXTERNAL_URL };

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');

  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const i = trimmed.indexOf('=');
        if (i !== -1) {
          const k = trimmed.slice(0, i).trim();
          let v = trimmed.slice(i + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          if (!process.env[k]) process.env[k] = v;
        }
      }
    });
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  async function run() {
    let totalChanged = 0;

    // DB pages
    const pages = await prisma.page.findMany({ select: { id: true, slug: true, content: true } });
    for (const p of pages) {
      const { out, changed } = transform(p.content);
      if (changed > 0) {
        totalChanged += changed;
        console.log(`DB:${p.slug} -> ${changed} link(s) rewritten`);
        if (!dryRun) {
          await prisma.page.update({ where: { id: p.id }, data: { content: out } });
        }
      }
    }

    // Static source files
    const staticFiles = ['src/components/Header.tsx', 'src/components/Footer.tsx', 'src/content/home.html'];
    for (const f of staticFiles) {
      const raw = fs.readFileSync(f, 'utf8');
      const { out, changed } = transform(raw);
      if (changed > 0) {
        totalChanged += changed;
        console.log(`FILE:${f} -> ${changed} link(s) rewritten`);
        if (!dryRun) fs.writeFileSync(f, out, 'utf8');
      }
    }

    // legacy_html fallback files
    const legacyDir = path.join(__dirname, '../../legacy_html');
    const files = fs.readdirSync(legacyDir).filter((f) => f.endsWith('.html'));
    for (const f of files) {
      const full = path.join(legacyDir, f);
      const raw = fs.readFileSync(full, 'utf8');
      const { out, changed } = transform(raw);
      if (changed > 0) {
        totalChanged += changed;
        console.log(`legacy_html/${f} -> ${changed} link(s) rewritten`);
        if (!dryRun) fs.writeFileSync(full, out, 'utf8');
      }
    }

    console.log(`\nTotal links rewritten: ${totalChanged}${dryRun ? ' (dry run, no writes)' : ''}`);
    await prisma.$disconnect();
  }

  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
