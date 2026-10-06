import prisma from '@/lib/prisma';

export interface MenuNode {
  id: string;
  label: string;
  url: string;
  target: string | null;
  order: number;
  children: MenuNode[];
}

interface SeedItem {
  label: string;
  url: string;
  target?: string;
  children?: SeedItem[];
}

// ---------------------------------------------------------------------------
// Default header/footer navigation. This is the same content that used to be
// hardcoded in Header.tsx / Footer.tsx — it's inserted once (only if the
// MenuItem table is empty) so the live site never regresses, and from then on
// admins manage it entirely from /admin/menus.
// ---------------------------------------------------------------------------

// Institutes with their own official domain link out (target marks them
// external); the rest link to their inner page on this site, since the old
// www.uok.edu.pk/research_institutes/* pages no longer exist.
const RESEARCH_CENTERS: SeedItem[] = [
  { label: 'Research Institutes Overview', url: 'research' },
  { label: 'HEJ Research Institute of Chemistry', url: 'http://www.iccs.edu', target: '_blank' },
  { label: 'Dr. A.Q. Khan Institute of Biotechnology & Genetic Engineering (KIBGE)', url: 'institute-kibge' },
  { label: 'Dr. Panjwani Center for Molecular Medicine & Drug Research', url: 'https://www.iccs.edu/page-pcmd', target: '_blank' },
  { label: 'Centre of Excellence for Marine Biology', url: 'https://marinebiology.edu.pk/', target: '_blank' },
  { label: 'Institute of Environmental Studies', url: 'institute-ies' },
  { label: 'Umaer Basha Institute of Technology (UBIT)', url: 'department-computerscience' },
  { label: 'Institute of Marine Science', url: 'institute-ims' },
  { label: 'Institute of Space Science & Technology', url: 'institute-isst' },
  { label: 'Institute of Clinical Psychology', url: 'https://icpuok.edu.pk/', target: '_blank' },
  { label: 'National Nematological Research Centre', url: 'institute-nnrc' },
  { label: 'Marine Reference Collection & Resource Centre', url: 'institute-mrcc' },
  { label: 'Dr. Zafar H. Zaidi Centre for Proteomics', url: 'http://proteomics.edu.pk/', target: '_blank' },
  { label: 'Dr. M. Ajmal Khan Institute of Sustainable Halophyte Utilization', url: 'http://www.halophyte.org', target: '_blank' },
  { label: 'Center for Digital Forensic Science & Technology', url: 'institute-cdfst' },
  { label: 'Applied Economics Research Center', url: 'http://www.aerc.edu.pk', target: '_blank' },
  { label: 'Area Study Center for Europe', url: 'institute-asce' },
  { label: 'Centre for Molecular Genetics', url: 'institute-cmg' },
  { label: "Centre of Excellence for Women's Studies", url: 'institute-cews' },
  { label: 'Center for Plant Conservation', url: 'institute-cpc' },
  { label: 'Center for Health & Wellbeing', url: 'institute-chwb' },
  { label: 'Pakistan Study Center', url: 'institute-psc' },
  { label: 'Confucius Institute', url: 'institute-confucius' },
  { label: 'Sardar Yasin Malik Professional Development Centre', url: 'institute-sympdc' },
  { label: 'Sheikh Zayed Islamic Center', url: 'http://szic.edu.pk/', target: '_blank' },
  { label: 'Shaheed Mohtarma Benazir Bhutto Chair', url: 'institute-smbbc' },
  { label: 'M.A.H.Q Biological Research Centre', url: 'institute-brc' },
  { label: 'Centralized Science Laboratory', url: 'institute-csl' },
  { label: 'Academic Journals', url: 'journals' },
];

const DEFAULT_HEADER: SeedItem[] = [
  { label: 'Home', url: '/' },
  {
    label: 'About Us',
    url: 'about',
    children: [
      { label: 'About & History', url: 'about' },
      { label: "Registrar's Office", url: 'registrar' },
      { label: 'Policies', url: 'policies' },
    ],
  },
  {
    label: 'Academics',
    url: 'academics',
    children: [
      { label: 'Faculties & Departments', url: 'academics' },
      { label: 'Examinations', url: 'examination' },
      { label: 'Downloads', url: 'downloads' },
    ],
  },
  {
    label: 'Administration',
    url: 'administration',
    children: [
      { label: 'Vice Chancellor', url: 'vice-chancellor' },
      { label: 'Registrar', url: 'registrar' },
      { label: 'Syndicate Members', url: 'syndicate-members' },
      { label: 'Former Vice Chancellors', url: 'former-vice-chancellors' },
      { label: 'Affiliations', url: 'affiliations' },
      { label: 'Directorates & Offices', url: 'administration#directorates' },
    ],
  },
  {
    label: 'Admissions',
    url: '/admissions',
    children: [
      { label: 'Admissions 2027', url: '/admissions' },
      { label: 'Postgraduate Admissions', url: 'pg-admissions' },
      { label: "Foreign Students' Policy", url: 'foreign-students' },
      { label: 'Semester Fee', url: 'semester-fee' },
    ],
  },
  {
    label: 'Examination',
    url: 'examination',
    children: [
      { label: 'Main Page', url: 'examination' },
      { label: 'B.Com.', url: 'examination-bcom' },
      { label: 'M.A. (Economics)', url: 'examination-maeco' },
      { label: 'Examination Schedule', url: 'examination-schedule' },
      { label: 'Verification Fees', url: 'examination-verification-fees' },
      { label: 'Latest Results', url: 'examination-results' },
      { label: 'Result Archive', url: 'examination-results-archive' },
      { label: 'Contact Us', url: 'examination-contact' },
      { label: 'Semester Examination', url: 'examination-semester' },
    ],
  },
  { label: 'Research', url: 'research', children: RESEARCH_CENTERS },
  {
    label: 'Alumni',
    url: 'alumni',
    children: [
      { label: 'Alumni Overview', url: 'alumni' },
      { label: 'Renowned Alumni', url: 'alumni#renowned-alumni' },
      { label: 'Support Your Alma Mater', url: 'alumni#support' },
      { label: 'Contact Alumni', url: 'alumni#contact' },
    ],
  },
  {
    label: 'Contact Us',
    url: 'contact',
    children: [
      { label: 'Contact Us', url: 'contact' },
      { label: 'Student Life', url: 'student-life' },
      { label: 'Convocation', url: 'convocation' },
      { label: 'Outreach Overview', url: 'outreach' },
      { label: 'Annual Report', url: 'outreach#annual-report' },
      { label: 'Magazines', url: 'outreach#magazines' },
      { label: 'Prospectus', url: 'outreach#prospectus' },
    ],
  },
];

const DEFAULT_FOOTER: SeedItem[] = [
  {
    label: 'About Us',
    url: '#',
    children: [
      { label: 'Home', url: '/' },
      { label: 'About Us', url: '/about' },
      { label: 'Downloads', url: '/downloads' },
      { label: 'News & Events', url: '/news' },
      { label: 'Semester Fee', url: '/semester-fee' },
      { label: 'Directory', url: '/directory' },
    ],
  },
  {
    label: 'Quick Links',
    url: '#',
    children: [
      { label: 'Administration', url: '/administration' },
      { label: 'Academics', url: '/academics' },
      { label: 'Affiliation Committee', url: '/affiliation-committee' },
      { label: 'Student Advisor Office', url: '/student-advisor' },
      { label: 'Job Portal', url: 'http://uok.rozee.pk/', target: '_blank' },
    ],
  },
  {
    label: 'Student Services',
    url: '#',
    children: [
      { label: 'Physical Education', url: '/physical-education' },
      { label: 'Tenders & Quotations', url: '/tenders' },
      { label: 'Syllabus (Undergraduate)', url: '/syllabus' },
      { label: 'Placements & Internships', url: '/placements' },
      { label: 'Protection Against Harassment', url: '/harassment' },
    ],
  },
  {
    label: 'Web Links',
    url: '#',
    children: [
      { label: 'Digital Library', url: '/digital-library' },
      { label: 'KU Journal of Science', url: '/kujs' },
      { label: 'Quality Enhancement Cell', url: 'http://qecku.com/', target: '_blank' },
      { label: 'Karachi University Press', url: 'https://kupress.pk/en/', target: '_blank' },
      { label: 'NAEAC', url: 'http://naeac.org/', target: '_blank' },
    ],
  },
];

async function seedLocation(location: 'header' | 'footer', items: SeedItem[]) {
  let topOrder = 0;
  for (const item of items) {
    const parent = await prisma.menuItem.create({
      data: {
        location,
        label: item.label,
        url: item.url,
        target: item.target || null,
        order: topOrder++,
      },
    });
    let childOrder = 0;
    for (const child of item.children || []) {
      await prisma.menuItem.create({
        data: {
          location,
          label: child.label,
          url: child.url,
          target: child.target || null,
          parentId: parent.id,
          order: childOrder++,
        },
      });
    }
  }
}

let seedingPromise: Promise<void> | null = null;

// Only inserts the default menus the very first time the table is empty —
// once an admin edits anything (including deleting everything on purpose),
// this is a no-op forever, same idempotent pattern as ensureExtraSchema().
//
// Two guards against double-seeding: an in-process promise cache (so two
// requests landing in the same server instance at once await the same
// insert instead of both racing prisma.menuItem.count() === 0), and a
// cross-process lock row with a fixed id inserted via ON CONFLICT DO
// NOTHING (so two separate serverless invocations can't both "win" the
// count() === 0 check either).
export async function ensureMenuSeed() {
  if (!seedingPromise) {
    seedingPromise = (async () => {
      try {
        const lockResult: any = await prisma.$executeRawUnsafe(
          `INSERT INTO "MenuItem" (id, location, label, url, "order") VALUES ('seed-lock', '_lock', '_lock', '#', 0) ON CONFLICT (id) DO NOTHING`
        );
        const wonLock = typeof lockResult === 'number' ? lockResult > 0 : true;
        if (wonLock) {
          await seedLocation('header', DEFAULT_HEADER);
          await seedLocation('footer', DEFAULT_FOOTER);
        }
      } catch (error) {
        console.error('ensureMenuSeed failed (will retry on next request):', error);
        seedingPromise = null;
      }
    })();
  }
  await seedingPromise;
}

function buildTree(rows: { id: string; label: string; url: string; target: string | null; order: number; parentId: string | null }[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  rows.forEach((r) => byId.set(r.id, { id: r.id, label: r.label, url: r.url, target: r.target, order: r.order, children: [] }));

  const roots: MenuNode[] = [];
  rows.forEach((r) => {
    const node = byId.get(r.id)!;
    if (r.parentId && byId.has(r.parentId)) {
      byId.get(r.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

let fallbackCounter = 0;
function seedItemsToNodes(items: SeedItem[]): MenuNode[] {
  return items.map((item, i) => ({
    id: `fallback-${fallbackCounter++}`,
    label: item.label,
    url: item.url,
    target: item.target || null,
    order: i,
    children: item.children ? seedItemsToNodes(item.children) : [],
  }));
}

// If the DB is unreachable (or somehow empty), the nav still renders from
// the same defaults ensureMenuSeed() would have written — visitors never see
// a blank header/footer.
function fallbackTree(location: 'header' | 'footer'): MenuNode[] {
  return seedItemsToNodes(location === 'header' ? DEFAULT_HEADER : DEFAULT_FOOTER);
}

export async function getMenuTree(location: 'header' | 'footer'): Promise<MenuNode[]> {
  try {
    await ensureMenuSeed();
    const rows = await prisma.menuItem.findMany({
      where: { location, isPublished: true },
      select: { id: true, label: true, url: true, target: true, order: true, parentId: true },
    });
    const tree = buildTree(rows);
    return tree.length > 0 ? tree : fallbackTree(location);
  } catch (error) {
    console.error(`getMenuTree(${location}) failed:`, error);
    return fallbackTree(location);
  }
}
