// Applies addLazyLoading() to every Page.content row in the database.
// Requires DATABASE_URL to be set. Run with: node src/scripts/add_lazy_loading_db.js
// Pass --dry-run to preview how many rows would change without writing.
const { PrismaClient } = require('@prisma/client');
const { addLazyLoading } = require('./lazyLoadTransform');

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const pages = await prisma.page.findMany({ select: { id: true, slug: true, content: true } });
  let changedCount = 0;

  for (const page of pages) {
    const after = addLazyLoading(page.content);
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
