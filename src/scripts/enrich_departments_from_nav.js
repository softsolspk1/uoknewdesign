// Rebuilds every department page's tab structure directly from the real
// "left_course" navigation menu embedded in that department's own index.php
// on the backup mirror (verified byte-identical to the live uok.edu.pk/faculties
// nav via crawl_live_nav.js — 0 discrepancies across all 58 departments).
//
// This replaces the older guess-based approach (enrich_all_departments_full.js)
// which forced a fixed 7-9 tab template and fell back to generic boilerplate
// text whenever a guessed filename didn't exist for a department -- even when
// that department's real site simply never had that section. Driving tabs off
// the department's own nav means every tab shown is one the live site actually
// has, with real sourced content, and departments that have more/fewer/
// differently-named sections (e.g. Computer Science's B.S. / M.S. / U.B.I.T. /
// M.C.S split, or KUBS's Centers & Offices / Newsletter) come through correctly
// without per-department special-casing.
const fs = require('fs');
const path = require('path');

const BACKUP_FACULTIES = 'D:/backup-uok.edu.pk-9-2-2026/public_html/faculties';
const LEGACY_DIR = path.join(__dirname, '../../legacy_html');
const FACULTY_MAP_FILE = path.join(__dirname, 'faculty_map.json');

let facultyMap = {};
if (fs.existsSync(FACULTY_MAP_FILE)) {
  facultyMap = JSON.parse(fs.readFileSync(FACULTY_MAP_FILE, 'utf8'));
}
if (!facultyMap['pharmacy']) {
  facultyMap['pharmacy'] = { facultyId: 'fac-4', facultyName: 'Faculty of Pharmacy & Pharmaceutical Sciences', deptTitle: 'Faculty of Pharmacy' };
}
if (!facultyMap['researchfacility']) {
  facultyMap['researchfacility'] = { facultyId: 'fac-1', facultyName: 'Faculty of Science', deptTitle: 'Central Research Facility' };
}

const INDEX_CANDIDATES = ['index.php', 'indexnew.php', 'indextab2.php', 'about.php', 'indexold.php'];

function cleanHtml(raw, slug) {
  if (!raw) return '';
  let content = raw;

  const rightMatch = content.match(/<div[^>]*class=["']right_course["'][^>]*>([\s\S]*)/i);
  if (!rightMatch) return '';
  content = rightMatch[1];
  const endMarkers = [
    /<br\s+class=["']clear["']\s*\/?>/i,
    /<div\s+id=["']contentendouter["']/i,
    /<div\s+id=["']contentend["']/i,
    /<\?php\s+include/i,
    /<div\s+id=["']footer["']/i,
    /<div\s+id=["']bottom["']/i,
    /<\/body>/i
  ];
  let minEnd = content.length;
  for (const marker of endMarkers) {
    const m = content.match(marker);
    if (m && m.index < minEnd) minEnd = m.index;
  }
  content = content.slice(0, minEnd);

  content = content.replace(/<\?php[\s\S]*?\?>/gi, '');
  content = content.replace(/<!--[\s\S]*?-->/gi, '');
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  content = content.replace(/\s+on\w+="[^"]*"/gi, '');
  content = content.replace(/\s+on\w+='[^']*'/gi, '');
  content = content.replace(/<form[\s\S]*?<\/form>/gi, '');
  content = content.replace(/<img[^>]+src=["'][^"']*(?:spacer|blank|clear)\.gif["'][^>]*>/gi, '');
  // Only strip links that are genuinely empty (href=".pdf"/"/docs/.pdf"/literal
  // "undefined") -- a broader version of this used to also match (and destroy
  // the text of) every valid "*.pdf" link on the page.
  content = content.replace(/<a[^>]*href=["'](?:\.pdf|\/docs\/\.pdf|docs\/\.pdf|undefined)["'][^>]*>([\s\S]*?)<\/a>/gi, '$1');

  content = content.replace(/(href|src)=["']([^"':#]+?\.(?:pdf|doc|docx|jpg|jpeg|png|gif|xls|xlsx))["']/gi, (match, attr, file) => {
    if (file.startsWith('/') || file.startsWith('http')) return match;
    const cleanFile = file.replace(/^\.\//, '').replace(/^\.\.\//, '');
    if (cleanFile === '.pdf' || cleanFile === '') return '';

    const publicDest = path.join(__dirname, '../../public/faculties', slug, cleanFile);
    const backupSrc = path.join(BACKUP_FACULTIES, slug, cleanFile);

    if (fs.existsSync(backupSrc) && !fs.existsSync(publicDest)) {
      try {
        fs.mkdirSync(path.dirname(publicDest), { recursive: true });
        fs.copyFileSync(backupSrc, publicDest);
      } catch {}
    }
    return `${attr}="/faculties/${slug}/${cleanFile}"`;
  });

  content = content.replace(/<font[^>]*size=["']?\+?[123]["']?[^>]*>([\s\S]*?)<\/font>/gi, '<strong>$1</strong>');
  content = content.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');
  content = content.replace(/<h2[^>]*>/gi, '<h4 class="dept-subheading fs-5 text-dark fw-bold mt-4 mb-3">');
  content = content.replace(/<\/h2>/gi, '</h4>');
  content = content.replace(/<h3[^>]*>/gi, '<h5 class="dept-subheading fs-6 text-dark fw-bold mt-3 mb-2">');
  content = content.replace(/<\/h3>/gi, '</h5>');
  content = content.replace(/\s+(?:width|height|bgcolor|align|valign|border|cellspacing|cellpadding|style)=["'][^"']*["']/gi, '');
  content = content.replace(/<table[^>]*>/gi, '<div class="table-responsive my-3"><table class="table table-bordered table-striped table-hover align-middle">');
  content = content.replace(/<\/table>/gi, '</table></div>');
  content = content.replace(/<div class="table-responsive[^"]*">\s*<div class="table-responsive[^"]*">/gi, '<div class="table-responsive my-3">');
  content = content.replace(/<\/div>\s*<\/div>\s*<\/table>/gi, '</div></table>');
  content = content.replace(/<a\s+href="([^"]+\.pdf)"[^>]*>\s*\(Profile\)\s*<\/a>/gi, '<a href="$1" target="_blank" class="dept-pdf-badge"><i class="fa-solid fa-file-pdf"></i> Profile</a>');
  content = content.replace(/<a\s+[^>]*href=["']\/faculties\/([^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, relPath, text) => {
    const localTarget = path.join(__dirname, '../../public/faculties', relPath);
    if (!fs.existsSync(localTarget)) {
      return text.replace(/\(Profile\)/i, '').trim() || '';
    }
    return match;
  });
  content = content.replace(/(?:&nbsp;\s*){3,}/gi, ' ');
  content = content.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '');
  content = content.replace(/(?:<\/div>\s*)+$/gi, '');

  return content.trim();
}

function getDeptNameFromHtml(fileContent, slug) {
  const titleMatch = fileContent.match(/<h1 class="breadcumb-title">([^<]+)<\/h1>/i) ||
                     fileContent.match(/<title>([^<|]+)[|<]/i);
  if (titleMatch) {
    let t = titleMatch[1].trim();
    t = t.replace(/\s*—\s*University of Karachi.*$/i, '')
         .replace(/\s*\|\s*University of Karachi.*$/i, '')
         .trim();
    return t;
  }
  return 'Department of ' + slug.charAt(0).toUpperCase() + slug.slice(1);
}

function findIndexFile(deptDir) {
  for (const c of INDEX_CANDIDATES) {
    if (fs.existsSync(path.join(deptDir, c))) return c;
  }
  return null;
}

// Parses the department's own left_course <ul> menu into [{file, label}].
// href="#" (self-link to the intro) yields {file: null, label}.
function parseNav(indexRaw, slug) {
  const m = indexRaw.match(/<div[^>]*class=["']left_course["'][^>]*>([\s\S]*?)<div[^>]*class=["']right_course["']/i);
  if (!m) return [];
  const block = m[1];
  const entries = [];
  const re = /<a\s+href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let mm;
  const prefix = `/faculties/${slug}/`;
  while ((mm = re.exec(block))) {
    let href = mm[1].trim();
    const label = mm[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    if (!label) continue;
    if (href.startsWith(prefix)) href = href.slice(prefix.length);
    if (href === '#' || href === '') {
      entries.push({ file: null, label });
    } else if (!href.startsWith('http') && !href.includes('/')) {
      entries.push({ file: href, label });
    }
  }
  const seen = new Set();
  return entries.filter(e => {
    const key = `${e.file || ''}|${e.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugifyId(label, file, usedIds) {
  let base = (file ? file.replace(/\.php$/i, '') : label)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) base = 'section';
  if (/^\d/.test(base)) base = `t-${base}`;
  let id = base;
  let i = 2;
  while (usedIds.has(id)) id = `${base}-${i++}`;
  usedIds.add(id);
  return id;
}

function iconFor(label) {
  const l = label.toLowerCase();
  if (/introduction|main page|^home$|^about/.test(l)) return 'fa-solid fa-circle-info';
  if (/faculty|staff/.test(l)) return 'fa-solid fa-chalkboard-user';
  if (/course|syllab|curricul|outline/.test(l)) return 'fa-solid fa-book-open';
  if (/objective|vision|mission/.test(l)) return 'fa-solid fa-bullseye';
  if (/center|centre|office/.test(l)) return 'fa-solid fa-sitemap';
  if (/newsletter/.test(l)) return 'fa-solid fa-newspaper';
  if (/seminar|event|activit|conference/.test(l)) return 'fa-solid fa-calendar-check';
  if (/alumni/.test(l)) return 'fa-solid fa-user-graduate';
  if (/research|publicat/.test(l)) return 'fa-solid fa-microscope';
  if (/facilit|lab\b|resource/.test(l)) return 'fa-solid fa-building-columns';
  if (/contact/.test(l)) return 'fa-solid fa-envelope';
  if (/program|degree|admission|b\.?s\.?|m\.?s\.?|ph\.?d|m\.?phil|pgd|b\.?a\.?|b\.?c\.?s\.?|m\.?c\.?s|ubit/i.test(label)) return 'fa-solid fa-graduation-cap';
  return 'fa-solid fa-file-lines';
}

function eyebrowFor(label) {
  const l = label.toLowerCase();
  if (/introduction|main page|^home$|^about/.test(l)) return 'Overview & History';
  if (/faculty|staff/.test(l)) return 'Academic Staff & Researchers';
  if (/course|syllab|curricul|outline/.test(l)) return 'Academic Curriculum & Syllabi';
  if (/objective|vision|mission/.test(l)) return 'Vision & Mission';
  if (/center|centre|office/.test(l)) return 'Specialized Units';
  if (/newsletter/.test(l)) return 'Publications & Updates';
  if (/seminar|event|activit|conference/.test(l)) return 'Events & Engagement';
  if (/alumni/.test(l)) return 'Alumni Network';
  if (/research|publicat/.test(l)) return 'Scholarly Contributions';
  if (/facilit|lab\b|resource/.test(l)) return 'Infrastructure & Laboratories';
  if (/contact/.test(l)) return 'Get In Touch';
  if (/program|degree|admission|b\.?s\.?|m\.?s\.?|ph\.?d|m\.?phil|pgd|b\.?a\.?|b\.?c\.?s\.?|m\.?c\.?s|ubit/i.test(label)) return 'Degree Offerings';
  return 'Department Information';
}

function genericContactFallback(deptName) {
  return `
    <div class="row gy-3">
      <div class="col-md-6">
        <div class="p-4 rounded-4 bg-light border h-100">
          <h5 class="fw-bold text-dark fs-6 mb-3"><i class="fa-solid fa-building me-2 text-success"></i>Department Office</h5>
          <p class="mb-1 text-dark fw-semibold">${deptName}</p>
          <p class="mb-2 text-muted small">University of Karachi, Main Campus, University Road, Karachi-75270, Pakistan</p>
          <p class="mb-0 text-muted small"><i class="fa-solid fa-clock me-1 text-success"></i> Office Hours: Monday &ndash; Friday, 8:30 AM &ndash; 3:30 PM</p>
        </div>
      </div>
      <div class="col-md-6">
        <div class="p-4 rounded-4 bg-light border h-100">
          <h5 class="fw-bold text-dark fs-6 mb-3"><i class="fa-solid fa-phone-volume me-2 text-success"></i>Telecommunications</h5>
          <p class="mb-2"><strong>Phone Exchange:</strong> <a href="tel:+922199261300" class="text-success">(+92-21) 9926 1300-07</a></p>
          <p class="mb-2"><strong>Department Email:</strong> <a href="mailto:registrar@uok.edu.pk" class="text-success">registrar@uok.edu.pk</a></p>
          <p class="mb-0"><strong>Admissions Helpdesk:</strong> <a href="https://uokadmission.edu.pk" target="_blank" class="text-success">uokadmission.edu.pk</a></p>
        </div>
      </div>
    </div>`;
}

function buildTabsForDepartment(slug, deptDir, deptName) {
  const usedIds = new Set();
  const tabs = [];

  const indexFile = findIndexFile(deptDir);
  let indexRaw = '';
  if (indexFile) {
    indexRaw = fs.readFileSync(path.join(deptDir, indexFile), 'utf8');
  }

  const introContent = indexRaw ? cleanHtml(indexRaw, slug) : '';
  tabs.push({
    id: slugifyId('Introduction', null, usedIds),
    label: 'Introduction',
    icon: iconFor('Introduction'),
    eyebrow: eyebrowFor('Introduction'),
    content: introContent && introContent.length > 15
      ? introContent
      : `<p>Welcome to the <strong>${deptName}</strong> at the University of Karachi. The department is committed to academic rigor, cutting-edge research, and preparing highly qualified graduates to meet national and global challenges.</p>`,
  });

  const navEntries = indexRaw ? parseNav(indexRaw, slug) : [];
  for (const entry of navEntries) {
    if (!entry.file) continue; // "#" self-link to intro, already handled above
    if (/^(introduction|main page|home)$/i.test(entry.label)) continue;
    const filePath = path.join(deptDir, entry.file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    const content = cleanHtml(raw, slug);
    if (!content || content.length < 15) continue;
    tabs.push({
      id: slugifyId(entry.label, entry.file, usedIds),
      label: entry.label,
      icon: iconFor(entry.label),
      eyebrow: eyebrowFor(entry.label),
      content,
    });
  }

  if (!tabs.some(t => /contact/i.test(t.label))) {
    tabs.push({
      id: slugifyId('Contact', null, usedIds),
      label: 'Contact',
      icon: iconFor('Contact'),
      eyebrow: eyebrowFor('Contact'),
      content: genericContactFallback(deptName),
    });
  }

  return tabs;
}

function buildModernDepartmentSection(deptName, slug, tabs, facultyInfo) {
  let navButtonsHtml = '';
  tabs.forEach((tab, index) => {
    const isFirst = index === 0;
    const activeClass = isFirst ? ' active' : '';
    const ariaSelected = isFirst ? 'true' : 'false';
    navButtonsHtml += `
      <button class="nav-link${activeClass}" id="tab-${tab.id}-btn" data-bs-toggle="pill" data-bs-target="#tab-${tab.id}" type="button" role="tab" aria-controls="tab-${tab.id}" aria-selected="${ariaSelected}">
        <i class="${tab.icon}"></i> <span>${tab.label}</span>
      </button>`;
  });

  let panesHtml = '';
  tabs.forEach((tab, index) => {
    const isFirst = index === 0;
    const showClass = isFirst ? ' show active' : '';
    panesHtml += `
      <div class="tab-pane fade${showClass}" id="tab-${tab.id}" role="tabpanel" aria-labelledby="tab-${tab.id}-btn">
        <div class="dept-pane-header">
          <span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold mb-2" style="font-size:0.75rem;letter-spacing:0.5px;">${tab.eyebrow}</span>
          <h2 class="fw-bold text-dark mt-2 mb-0 fs-3">${tab.label}</h2>
        </div>
        <div class="dept-pane-body content-typography">
          ${tab.content}
        </div>
      </div>`;
  });

  return `
<section class="th-program-wrapper space-top space-extra2-bottom overflow-hidden" id="department-details">
  <div class="container th-container4">
    <div class="row gy-4 gx-40">

      <!-- Left Column: Department Navigation Sidebar -->
      <div class="col-xl-3 col-lg-4">
        <aside class="dept-sidebar sticky-top" style="top: 100px; z-index: 10;">
          <div class="dept-nav-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <div class="dept-nav-header p-4 text-white">
              <span class="badge bg-white text-dark px-2 py-1 mb-2 fw-semibold" style="font-size:0.75rem;letter-spacing:0.5px;">DEPARTMENT MENU</span>
              <h4 class="text-white mb-1 fw-bold fs-5">${deptName}</h4>
              <p class="text-white-50 mb-0 small"><i class="fa-solid fa-graduation-cap me-1"></i> ${facultyInfo.facultyName}</p>
            </div>
            <div class="dept-nav-body p-2 bg-white">
              <div class="nav flex-column nav-pills dept-nav-pills" id="dept-tabs" role="tablist" aria-orientation="vertical">
${navButtonsHtml}
              </div>
            </div>
            <div class="dept-nav-footer p-3 bg-light border-top text-center">
              <a href="academics#${facultyInfo.facultyId}" class="btn btn-outline-success btn-sm w-100 rounded-pill fw-semibold">
                <i class="fa-solid fa-arrow-left me-1"></i> ${facultyInfo.facultyName}
              </a>
            </div>
          </div>

          <div class="dept-contact-quick-card p-4 rounded-4 shadow-sm bg-white border">
            <h5 class="fw-bold text-dark fs-6 mb-2"><i class="fa-solid fa-headset text-success me-2"></i>Inquiries</h5>
            <p class="text-muted small mb-3">Reach out to the department office for inquiries regarding admissions, courses, or research.</p>
            <button class="btn btn-success btn-sm w-100 rounded-pill fw-semibold" onclick="document.getElementById('tab-contact-btn').click(); window.scrollTo({ top: document.getElementById('department-details').offsetTop - 80, behavior: 'smooth' });">
              <i class="fa-solid fa-envelope me-1"></i> Contact Office
            </button>
          </div>
        </aside>
      </div>

      <!-- Right Column: Department Inner Page Content Panes -->
      <div class="col-xl-9 col-lg-8">
        <div class="tab-content dept-tab-content bg-white p-4 p-md-5 rounded-4 shadow-sm border" id="dept-tabContent">
${panesHtml}
        </div>
      </div>

    </div>
  </div>

  <script>
  (function() {
    function handleHashChange() {
      var hash = window.location.hash;
      if (hash) {
        var clean = hash.replace(/^#tab-/, '').replace(/^#/, '');
        var targetBtn = document.getElementById('tab-' + clean + '-btn');
        if (targetBtn && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
          var tab = bootstrap.Tab.getOrCreateInstance(targetBtn);
          tab.show();
        }
      }
    }
    window.addEventListener('DOMContentLoaded', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('DOMContentLoaded', function() {
      var buttons = document.querySelectorAll('#dept-tabs button[data-bs-toggle="pill"]');
      buttons.forEach(function(btn) {
        btn.addEventListener('shown.bs.tab', function(e) {
          var targetId = e.target.getAttribute('data-bs-target');
          if (targetId) {
            var rawKey = targetId.replace('#tab-', '');
            if (history.replaceState) {
              history.replaceState(null, null, '#' + rawKey);
            }
          }
        });
      });
    });
  })();
  </script>
</section>
`;
}

function processDepartment(file) {
  const slug = file.replace(/^department-/, '').replace(/\.html$/, '');
  const legacyPath = path.join(LEGACY_DIR, file);
  let html = fs.readFileSync(legacyPath, 'utf8');

  const deptDir = path.join(BACKUP_FACULTIES, slug);
  const deptName = getDeptNameFromHtml(html, slug);
  const facultyInfo = facultyMap[slug] || {
    facultyId: 'fac-1',
    facultyName: 'University of Karachi Faculties',
    deptTitle: deptName,
  };

  const tabs = buildTabsForDepartment(slug, deptDir, deptName);
  console.log(`[PROCESS] ${file} (${slug}) -> ${deptName} :: ${tabs.length} tabs (${tabs.map(t => t.label).join(', ')})`);

  const modernSectionHtml = buildModernDepartmentSection(deptName, slug, tabs, facultyInfo);

  const existingSectionRegex = /<section[^>]*id=["']department-details["'][^>]*>[\s\S]*?<\/section>/i;
  let updatedHtml;
  if (existingSectionRegex.test(html)) {
    updatedHtml = html.replace(existingSectionRegex, modernSectionHtml.trim());
  } else {
    let insertIdx = html.indexOf('<section class="apply-stadum-area');
    if (insertIdx === -1) insertIdx = html.indexOf('<div class="marquee-area');
    if (insertIdx === -1) insertIdx = html.indexOf('<footer');
    if (insertIdx === -1) {
      console.error(`[ERROR] Could not find insertion point in ${file}`);
      return;
    }
    updatedHtml = html.slice(0, insertIdx) + modernSectionHtml.trim() + '\n' + html.slice(insertIdx);
  }

  fs.writeFileSync(legacyPath, updatedHtml, 'utf8');
}

function main() {
  console.log('--- Rebuilding department tabs from real live-site navigation ---');
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.startsWith('department-') && f.endsWith('.html'));
  console.log(`Found ${files.length} department files.`);

  let count = 0;
  for (const file of files) {
    try {
      processDepartment(file);
      count++;
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  console.log(`--- Finished processing ${count} department pages! ---`);
}

main();
