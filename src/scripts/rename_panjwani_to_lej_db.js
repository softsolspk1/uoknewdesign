const path = require('path');
const fs = require('fs');

const workspace = path.join(__dirname, '../..');
for (const envName of ['.env', '.env.local']) {
  const envFile = path.join(workspace, envName);
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
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
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slugs = ['home', 'index'];
  let updatedCount = 0;

  for (const slug of slugs) {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) {
      console.log(`Page '${slug}' not found.`);
      continue;
    }

    let content = page.content;
    let modified = false;

    if (content.includes('Dr. Panjwani Center (ICCBS)')) {
      content = content.replaceAll('Dr. Panjwani Center (ICCBS)', 'LEJ National Science Information Center(LEJNSIC)');
      modified = true;
    }

    if (content.includes('alt="Dr. Panjwani Center"')) {
      content = content.replaceAll('alt="Dr. Panjwani Center"', 'alt="LEJ National Science Information Center"');
      modified = true;
    }

    if (modified) {
      await prisma.page.update({
        where: { id: page.id },
        data: { content },
      });
      console.log(`Updated page '${slug}' in database.`);
      updatedCount++;
    } else {
      console.log(`No changes needed for page '${slug}'.`);
    }
  }

  console.log(`Finished. Updated ${updatedCount} pages.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
