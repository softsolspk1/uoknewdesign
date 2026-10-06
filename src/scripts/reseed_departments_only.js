// Pushes the freshly-rebuilt legacy_html/department-*.html content into the
// production Page table, scoped to department slugs only (does not touch any
// other page). Backs up the previous content for each slug first so the
// change can be rolled back if needed.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LEGACY_DIR = path.join(__dirname, '../../legacy_html');
const BACKUP_OUT = path.join(__dirname, '../../scratch_prod_dept_backup.json');

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
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.startsWith('department-') && f.endsWith('.html'));
  console.log(`Found ${files.length} department files to push.`);

  const backup = {};
  let updated = 0;
  let created = 0;

  for (const file of files) {
    const slug = path.basename(file, '.html');
    const contentRaw = fs.readFileSync(path.join(LEGACY_DIR, file), 'utf8');
    const bodyContent = extractBody(contentRaw);

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      backup[slug] = { content: existing.content, updatedAt: existing.updatedAt };
    }

    await prisma.page.upsert({
      where: { slug },
      update: { content: bodyContent, isPublished: true },
      create: {
        slug,
        title: slug.replace(/^department-/, '').replace(/-/g, ' '),
        category: 'department',
        content: bodyContent,
        isPublished: true,
      },
    });

    if (existing) updated++; else created++;
    console.log(`[${existing ? 'UPDATE' : 'CREATE'}] ${slug}`);
  }

  fs.writeFileSync(BACKUP_OUT, JSON.stringify(backup, null, 2));
  console.log(`\nBackup of ${Object.keys(backup).length} previous rows written to ${BACKUP_OUT}`);
  console.log(`Done. Updated: ${updated}, Created: ${created}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
