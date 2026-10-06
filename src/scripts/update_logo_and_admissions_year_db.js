// Applies the same content updates as update_logo_and_admissions_year.js
// (Diamond Jubilee logo swap + Admissions year bump) to every Page.content
// row in the database. Requires DATABASE_URL to be set.
// Run with: node src/scripts/update_logo_and_admissions_year_db.js
// Pass --dry-run to preview how many rows would change without writing.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function updateContent(content) {
  let updated = content.split('assets/img/logo22.png').join('/uok101.jpg');
  updated = updated.split('/assets/img/logo22.png').join('/uok101.jpg');

  updated = updated.replace(
    /(Admissions Program )2026(\s+Now Open<\/a><\/h4>[\s\S]{0,300}?<i class="far fa-calendar"><\/i>)2026/g,
    '$12027$22027'
  );
  updated = updated.split('Admissions Program 2026').join('Admissions Program 2027');
  updated = updated.split('Admissions 2026').join('Admissions 2027');

  return updated;
}

async function main() {
  const pages = await prisma.page.findMany({ select: { id: true, slug: true, content: true } });
  let changedCount = 0;

  for (const page of pages) {
    const after = updateContent(page.content);
    if (after !== page.content) {
      changedCount++;
      if (!dryRun) {
        await prisma.page.update({ where: { id: page.id }, data: { content: after } });
      }
    }
  }

  console.log(`${dryRun ? '[dry run] ' : ''}Updated ${changedCount}/${pages.length} pages.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
