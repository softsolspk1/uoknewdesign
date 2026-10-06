// Pushes the current legacy_html/*.html body content into the production
// Page table's `content` column only (title/category/meta untouched), for
// every slug that already has a DB row. Backs up previous content first so
// the change can be rolled back if needed. Used after site-wide markup
// fixes (e.g. fix_admissions_2027_links.js) that touch the shared
// header/nav/footer baked into every page, not just department pages.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LEGACY_DIR = path.join(__dirname, '../../legacy_html');
const BACKUP_OUT = path.join(__dirname, '../../scratch_prod_full_backup.json');

function extractBody(contentRaw) {
  const headerEndIdx = contentRaw.indexOf('</header>');
  const footerStartIdx = contentRaw.indexOf('<footer');
  if (headerEndIdx !== -1 && footerStartIdx !== -1 && footerStartIdx > headerEndIdx) {
    return contentRaw.substring(headerEndIdx + 9, footerStartIdx).trim();
  }
  const bStart = contentRaw.indexOf('<body');
  const bEnd = contentRaw.indexOf('</body>');
  if (bStart !== -1 && bEnd !== -1) {
    const afterBodyTag = contentRaw.indexOf('>', bStart) + 1;
    return contentRaw.substring(afterBodyTag, bEnd).trim();
  }
  return contentRaw.trim();
}

async function main() {
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  console.log(`Found ${files.length} legacy html files.`);

  const backup = {};
  let updated = 0;
  let skippedNoRow = 0;
  let unchanged = 0;

  for (const file of files) {
    const slug = path.basename(file, '.html');
    const contentRaw = fs.readFileSync(path.join(LEGACY_DIR, file), 'utf8');
    const bodyContent = extractBody(contentRaw);

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (!existing) {
      skippedNoRow++;
      continue;
    }
    if (existing.content === bodyContent) {
      unchanged++;
      continue;
    }

    backup[slug] = { content: existing.content, updatedAt: existing.updatedAt };
    await prisma.page.update({ where: { slug }, data: { content: bodyContent } });
    updated++;
    console.log(`[UPDATE] ${slug}`);
  }

  fs.writeFileSync(BACKUP_OUT, JSON.stringify(backup, null, 2));
  console.log(`\nBackup of ${Object.keys(backup).length} previous rows written to ${BACKUP_OUT}`);
  console.log(`Done. Updated: ${updated}, Unchanged: ${unchanged}, No DB row (skipped): ${skippedNoRow}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
