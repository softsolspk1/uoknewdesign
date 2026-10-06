const fs = require('fs');
const path = require('path');

// Manually load .env if not set
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
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

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Database with DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');

  // 1. Seed Master Super Admin
  const adminEmail = 'uok@softsols.pk';
  const adminPassword = await bcrypt.hash('?S@fTs@Ls?@U@K1', 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      name: 'Super Admin',
      role: 'admin',
      assignedDepartments: 'all',
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      name: 'Super Admin',
      role: 'admin',
      assignedDepartments: 'all',
    },
  });
  console.log('Super Admin user seeded:', adminEmail);

  // 2. Parse and seed all legacy HTML pages
  const legacyDir = path.join(__dirname, '../../legacy_html');
  const files = fs.readdirSync(legacyDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));

  console.log(`Found ${files.length} HTML files to seed.`);
  let count = 0;

  for (const file of files) {
    const slug = path.basename(file, '.html');
    const contentRaw = fs.readFileSync(path.join(legacyDir, file), 'utf8');

    // Extract Title
    let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const titleMatch = contentRaw.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/—\s*University of Karachi/gi, '')
        .replace(/\|\s*University of Karachi/gi, '')
        .replace(/University of Karachi/gi, '')
        .replace(/[—|•-]/g, '')
        .trim() || title;
    }

    // Extract Meta Description
    let metaDescription = 'University of Karachi official page';
    const descMatch = contentRaw.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    if (descMatch) {
      metaDescription = descMatch[1].trim();
    }

    // Determine Category
    let category = 'main';
    if (file.startsWith('department-')) {
      category = 'department';
    } else if (file.startsWith('institute-')) {
      category = 'institute';
    } else if (file.includes('dashboard') || file === 'login.html') {
      category = 'portal';
    }

    // Extract Main Content
    let bodyContent = '';
    const headerEndIdx = contentRaw.indexOf('</header>');
    const footerStartIdx = contentRaw.indexOf('<footer');

    if (headerEndIdx !== -1 && footerStartIdx !== -1 && footerStartIdx > headerEndIdx) {
      bodyContent = contentRaw.substring(headerEndIdx + 9, footerStartIdx).trim();
    } else {
      const bStart = contentRaw.indexOf('<body');
      const bEnd = contentRaw.indexOf('</body>');
      if (bStart !== -1 && bEnd !== -1) {
        const afterBodyTag = contentRaw.indexOf('>', bStart) + 1;
        bodyContent = contentRaw.substring(afterBodyTag, bEnd).trim();
      } else {
        bodyContent = contentRaw;
      }
    }

    await prisma.page.upsert({
      where: { slug },
      update: {
        title,
        category,
        content: bodyContent,
        metaTitle: title + ' — University of Karachi',
        metaDescription,
        isPublished: true,
      },
      create: {
        slug,
        title,
        category,
        content: bodyContent,
        metaTitle: title + ' — University of Karachi',
        metaDescription,
        isPublished: true,
      },
    });

    count++;
    if (count % 15 === 0 || count === files.length) {
      console.log(`Seeded ${count}/${files.length} pages...`);
    }
  }

  console.log(`Successfully completed seeding ${count} pages into database!`);
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
