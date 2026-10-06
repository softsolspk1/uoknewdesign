const fs = require('fs');

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

const NEWS_SEED = [
  {
    title: 'Admissions 2026 Applications Now Open',
    excerpt: 'Undergraduate, graduate and evening program applications are open for the new academic year.',
    content: 'Undergraduate, graduate and evening program applications are open for the new academic year.',
    imageUrl: 'assets/img/uok/header-gate.jpg',
    link: 'https://uokadmission.edu.pk/login',
    order: 0,
  },
  {
    title: 'KIBGE Advances Biotechnology Research',
    excerpt: 'The Dr. A.Q. Khan Institute continues research across agricultural, medical and industrial biotechnology.',
    content: 'The Dr. A.Q. Khan Institute continues research across agricultural, medical and industrial biotechnology.',
    imageUrl: 'assets/img/uok/banner-chem.jpg',
    link: 'institute-kibge',
    order: 1,
  },
  {
    title: 'Marking 75 Years of Academic Excellence',
    excerpt: "Since 1951, the University of Karachi has grown into one of Pakistan's largest public universities.",
    content: "Since 1951, the University of Karachi has grown into one of Pakistan's largest public universities.",
    imageUrl: 'assets/img/uok/hero-ubit.jpg',
    link: 'about',
    order: 2,
  },
];

const FAQ_SEED = [
  {
    question: 'How do I apply for admission?',
    answer:
      'Applications are submitted through the Directorate of Admissions for each program cycle. Visit the Admissions page for eligibility and required documents.',
    order: 0,
  },
  {
    question: 'Is an entry test required?',
    answer:
      'Most undergraduate and graduate programs require the University of Karachi Entry Test. Requirements vary by faculty and program.',
    order: 1,
  },
  {
    question: 'What is the semester fee structure?',
    answer: "Fee vouchers are issued each semester through the Semester Cell. Contact the Registrar's office for the current fee schedule.",
    order: 2,
  },
  {
    question: 'Are foreign students accepted?',
    answer: "Yes. The Foreign Students' Advisor supports international applicants through a dedicated admissions policy.",
    order: 3,
  },
  {
    question: 'What faculties and departments are offered?',
    answer: 'The University offers nine faculties and 53 academic departments — see the Academics page for the full list.',
    order: 4,
  },
  {
    question: 'How can I contact the library?',
    answer: 'The Dr. Mahmud Husain Library can be reached via the Library page, which lists services, hours and the digital library.',
    order: 5,
  },
];

// homeSections.ts is TS; re-implement the marker constants inline for this
// one-off JS migration script instead of trying to require a .ts file.
const NEWS_START = '<!--NEWS_ITEMS_START-->';
const NEWS_END = '<!--NEWS_ITEMS_END-->';
const FAQ_START = '<!--FAQ_ITEMS_START-->';
const FAQ_END = '<!--FAQ_ITEMS_END-->';

async function main() {
  const existingNews = await prisma.news.count();
  if (existingNews === 0) {
    for (const n of NEWS_SEED) await prisma.news.create({ data: n });
    console.log('Seeded', NEWS_SEED.length, 'news items');
  } else {
    console.log('News table already has', existingNews, 'rows, skipping seed');
  }

  const existingFaq = await prisma.faq.count();
  if (existingFaq === 0) {
    for (const f of FAQ_SEED) await prisma.faq.create({ data: f });
    console.log('Seeded', FAQ_SEED.length, 'FAQ items');
  } else {
    console.log('Faq table already has', existingFaq, 'rows, skipping seed');
  }

  // Wrap the existing static blocks in markers (empty between markers for now;
  // the API's regenerate* calls will fill them right after).
  const files = ['src/content/home.html'];
  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');

    const blogRowStart = html.indexOf('<div class="row gy-4">', html.indexOf('id="blog-sec"'));
    const blogRowInnerStart = blogRowStart + '<div class="row gy-4">'.length;
    const blogRowEnd = html.indexOf('</div>\n  </div>\n</section>', blogRowInnerStart);
    if (blogRowStart === -1 || blogRowEnd === -1) {
      console.error('Could not locate News row in', file);
    } else {
      html = html.slice(0, blogRowInnerStart) + '\n      ' + NEWS_START + '\n      ' + NEWS_END + '\n    ' + html.slice(blogRowEnd);
    }

    const accordionMarker = '<div class="accordion custom-accordion" id="faqAccordion">';
    const accStart = html.indexOf(accordionMarker);
    const accInnerStart = accStart + accordionMarker.length;
    const accEnd = html.indexOf('</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>', accInnerStart);
    if (accStart === -1 || accEnd === -1) {
      console.error('Could not locate FAQ accordion in', file);
    } else {
      html = html.slice(0, accInnerStart) + '\n            ' + FAQ_START + '\n            ' + FAQ_END + '\n          ' + html.slice(accEnd);
    }

    fs.writeFileSync(file, html, 'utf8');
    console.log('Updated', file, 'with markers');
  }

  // Same for DB content
  const home = await prisma.page.findUnique({ where: { slug: 'home' } });
  let html = home.content;

  const blogRowStart = html.indexOf('<div class="row gy-4">', html.indexOf('id="blog-sec"'));
  const blogRowInnerStart = blogRowStart + '<div class="row gy-4">'.length;
  const blogRowEnd = html.indexOf('</div>\n  </div>\n</section>', blogRowInnerStart);
  if (blogRowStart === -1 || blogRowEnd === -1) {
    console.error('Could not locate News row in DB content');
  } else {
    html = html.slice(0, blogRowInnerStart) + '\n      ' + NEWS_START + '\n      ' + NEWS_END + '\n    ' + html.slice(blogRowEnd);
  }

  const accordionMarker = '<div class="accordion custom-accordion" id="faqAccordion">';
  const accStart = html.indexOf(accordionMarker);
  const accInnerStart = accStart + accordionMarker.length;
  const accEnd = html.indexOf('</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>', accInnerStart);
  if (accStart === -1 || accEnd === -1) {
    console.error('Could not locate FAQ accordion in DB content');
  } else {
    html = html.slice(0, accInnerStart) + '\n            ' + FAQ_START + '\n            ' + FAQ_END + '\n          ' + html.slice(accEnd);
  }

  await prisma.page.update({ where: { id: home.id }, data: { content: html } });
  console.log('Updated DB home content with markers');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
