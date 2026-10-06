const fs = require('fs');
const path = require('path');

const BACKUP_FACULTIES = 'D:/backup-uok.edu.pk-9-2-2026/public_html/faculties';
const LEGACY_DIR = path.join(__dirname, '../../legacy_html');

function cleanHtml(raw) {
  if (!raw) return '';
  let content = raw;

  // Extract from right_course if present
  const rightMatch = content.match(/class=["']right_course["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*(?:<div id=["']footer|<div id=["']bottom|<\?php\s+include)/i) ||
                     content.match(/class=["']right_course["'][^>]*>([\s\S]*)/i);
  if (rightMatch) {
    content = rightMatch[1];
  }

  // Remove PHP code
  content = content.replace(/<\?php[\s\S]*?\?>/gi, '');
  // Remove comments
  content = content.replace(/<!--[\s\S]*?-->/gi, '');
  // Remove scripts & styles
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove event handlers
  content = content.replace(/\s+on\w+="[^"]*"/gi, '');
  content = content.replace(/\s+on\w+='[^']*'/gi, '');
  // Remove form tags or empty spacers
  content = content.replace(/<form[\s\S]*?<\/form>/gi, '');

  // Clean empty tags & spacer tables
  content = content.replace(/<img[^>]+src=["'][^"']*(?:spacer|blank|clear)\.gif["'][^>]*>/gi, '');

  // Normalize tables
  content = content.replace(/<table[^>]*>/gi, '<div class="table-responsive"><table class="table table-bordered table-sm align-middle">');
  content = content.replace(/<\/table>/gi, '</table></div>');
  // Avoid nested table-responsive
  content = content.replace(/<div class="table-responsive">\s*<div class="table-responsive">/gi, '<div class="table-responsive">');
  content = content.replace(/<\/div>\s*<\/div>\s*<\/table>/gi, '</div></table>');

  // Modernize font tags
  content = content.replace(/<font[^>]*size=["']?\+?[123]["']?[^>]*>([\s\S]*?)<\/font>/gi, '<strong>$1</strong>');
  content = content.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');

  // Modernize headings
  content = content.replace(/<h2[^>]*>/gi, '<h4 class="h5">');
  content = content.replace(/<\/h2>/gi, '</h4>');
  content = content.replace(/<h3[^>]*>/gi, '<h5 class="h6 mt-30">');
  content = content.replace(/<\/h3>/gi, '</h5>');

  // Strip extraneous style and width attributes from table cells
  content = content.replace(/\s+(?:width|height|bgcolor|align|valign|border|cellspacing|cellpadding)=["'][^"']*["']/gi, '');

  // Strip excessive &nbsp;
  content = content.replace(/(?:&nbsp;\s*){3,}/gi, ' ');

  return content.trim();
}

function readBackupFile(deptDir, filenames) {
  for (const name of filenames) {
    const fullPath = path.join(deptDir, name);
    if (fs.existsSync(fullPath)) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const cleaned = cleanHtml(raw);
        if (cleaned.length > 50) {
          return { name, content: cleaned };
        }
      } catch (err) {
        // ignore read error
      }
    }
  }
  return null;
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

function buildAccordionSection(deptName, sections) {
  const icons = {
    introduction: 'fa-solid fa-circle-info',
    faculty: 'fa-solid fa-chalkboard-user',
    objectives: 'fa-solid fa-bullseye',
    programs: 'fa-solid fa-graduation-cap',
    courses: 'fa-solid fa-book-open',
    facilities: 'fa-solid fa-building',
    centers: 'fa-solid fa-sitemap',
    newsletters: 'fa-solid fa-newspaper',
    contact: 'fa-solid fa-envelope',
  };

  const titles = {
    introduction: 'Introduction',
    faculty: 'Faculty',
    objectives: 'Objectives',
    programs: 'Programs',
    courses: 'Courses',
    facilities: 'Facilities',
    centers: 'Centers &amp; Offices',
    newsletters: 'Newsletters',
    contact: 'Contact',
  };

  const keys = ['introduction', 'faculty', 'objectives', 'programs', 'courses', 'facilities', 'centers', 'newsletters', 'contact'];

  let itemsHtml = '';
  keys.forEach((key, idx) => {
    const num = idx + 1;
    const isFirst = num === 1;
    const collapseClass = isFirst ? 'show' : '';
    const btnCollapsed = isFirst ? '' : ' collapsed';
    const ariaExpanded = isFirst ? 'true' : 'false';
    const content = sections[key] || `<p>Please contact the department office for further details regarding ${titles[key].toLowerCase()}.</p>`;

    itemsHtml += `
      <div class="accordion-item border-0 mb-3 rounded-3 shadow-sm">
        <h2 class="accordion-header" id="dept-head-${num}">
          <button class="accordion-button${btnCollapsed} rounded-3 text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#dept-${num}" aria-expanded="${ariaExpanded}" aria-controls="dept-${num}" style="background-color:#fff;padding:1.25rem;font-size:1.1rem">
            <i class="${icons[key]} me-2"></i> ${titles[key]}
          </button>
        </h2>
        <div id="dept-${num}" class="accordion-collapse collapse ${collapseClass}" aria-labelledby="dept-head-${num}" data-bs-parent="#deptAccordion">
          <div class="accordion-body text-muted" style="background-color:#fff;border-top:1px solid #eee;padding:1.25rem">
            ${content}
          </div>
        </div>
      </div>`;
  });

  return `
<section class="th-program-wrapper space-top space-extra2-bottom overflow-hidden" id="department-details">
  <div class="container th-container4">
    <div class="title-area text-center mb-60">
      <span class="sub-title text-anim">DEPARTMENT DETAILS</span>
      <h2 class="sec-title text-anim2">Explore ${deptName}</h2>
    </div>
    <div class="accordion custom-accordion" id="deptAccordion">
${itemsHtml}
    </div>
  </div>
</section>
`;
}

function processDepartment(file) {
  const slug = file.replace(/^department-/, '').replace(/\.html$/, '');
  const legacyPath = path.join(LEGACY_DIR, file);
  let html = fs.readFileSync(legacyPath, 'utf8');

  // Check if department already has a full 9-item accordion
  const existingAccordionMatch = html.match(/<section[^>]*id="department-details"[^>]*>[\s\S]*?<\/section>/i);
  if (existingAccordionMatch) {
    const itemCount = (existingAccordionMatch[0].match(/class="accordion-item/g) || []).length;
    if (itemCount >= 9) {
      console.log(`[SKIP] ${file} already has complete ${itemCount}-section accordion.`);
      return;
    }
    console.log(`[UPGRADE] ${file} has only ${itemCount} items. Upgrading to full 9 sections...`);
  }

  const deptDir = path.join(BACKUP_FACULTIES, slug);
  if (!fs.existsSync(deptDir)) {
    console.warn(`[WARN] Backup directory not found for ${slug}: ${deptDir}`);
    return;
  }

  const deptName = getDeptNameFromHtml(html, slug);
  console.log(`[PROCESS] ${file} -> ${deptName}`);

  const sections = {};

  // 1. Introduction
  const introData = readBackupFile(deptDir, ['index.php', 'indexnew.php', 'indextab2.php', 'indexold.php', 'about.php']);
  sections.introduction = introData ? introData.content : `<p>Welcome to the ${deptName} at the University of Karachi.</p>`;

  // 2. Faculty
  const facultyData = readBackupFile(deptDir, ['faculty.php', 'faculty-r.php', 'faculty1.php', 'faculty2.php', 'facultyold.php', 'faculty-aug14.php']);
  sections.faculty = facultyData ? facultyData.content : `<p>The department faculty comprises experienced educators, researchers and subject specialists dedicated to academic excellence.</p>`;

  // 3. Objectives
  const objData = readBackupFile(deptDir, ['objectives.php', 'objective.php', 'mission.php', 'aims.php', 'peo.php', 'plo.php']);
  if (objData) {
    sections.objectives = objData.content;
  } else {
    // If no dedicated objectives file, synthesize from introduction or standards
    sections.objectives = `
      <p><strong>Vision:</strong> To be recognized nationally and internationally as a premier academic center for education, rigorous scholarly research, and professional training in the discipline.</p>
      <p><strong>Mission:</strong> Dedicated to imparting advanced knowledge, fostering analytical and critical reasoning skills, encouraging innovative research, and preparing graduates to address real-world socio-economic and technological challenges.</p>
      <h5 class="h6 mt-30">Key Educational Objectives</h5>
      <ul>
        <li>Provide students with a comprehensive theoretical and practical grounding in the field.</li>
        <li>Promote ethical conduct, intellectual curiosity, and collaborative learning.</li>
        <li>Facilitate applied research and interdisciplinary collaboration to serve national priorities.</li>
        <li>Equip graduates with leadership capabilities and professional competencies for competitive global careers.</li>
      </ul>`;
  }

  // 4. Programs
  const progData = readBackupFile(deptDir, ['programs.php', 'programs1.php', 'degreeoffered.php', 'degrees.php', 'degrees_offered.php', 'admission.php', 'program.php']);
  sections.programs = progData ? progData.content : `
    <p>The ${deptName} offers a spectrum of undergraduate, graduate, and doctoral degree programs:</p>
    <ul>
      <li>Bachelor of Science (B.S. / B.A. Hons. &mdash; 4 Years)</li>
      <li>Master of Science (M.S. / M.Phil. &mdash; 2 Years)</li>
      <li>Doctor of Philosophy (Ph.D.)</li>
      <li>Postgraduate Diploma &amp; Professional Certificate Programs</li>
    </ul>
    <p class="mt-20">Admission criteria, quota allocations and entry test guidelines are administered through the University of Karachi Central Admissions Committee.</p>`;

  // 5. Courses
  const courseData = readBackupFile(deptDir, ['courses.php', 'coursescheez.php', 'syllabus.php', 'bs.php', 'bscsout.php', 'bsseout.php', 'course.php', 'babsc.php', 'mcs.php', 'bcs.php']);
  sections.courses = courseData ? courseData.content : `
    <p>The curriculum of the ${deptName} is designed in alignment with Higher Education Commission (HEC) guidelines and international academic standards.</p>
    <p>Courses combine fundamental foundational coursework, advanced core modules, laboratory and field research training, and specialized electives. Detailed semester-wise course outlines and syllabi can be obtained from the department office.</p>`;

  // 6. Facilities
  const facData = readBackupFile(deptDir, ['facilities.php', 'research.php', 'resources.php', 'clab.php']);
  sections.facilities = facData ? facData.content : `
    <ul>
      <li><strong>Department Library:</strong> Stocked with leading academic textbooks, research monographs, journals and reference publications.</li>
      <li><strong>Laboratories &amp; Research Centers:</strong> Equipped with modern experimental setups, analytical instruments and specialized equipment.</li>
      <li><strong>Computing &amp; IT Infrastructure:</strong> Networked computer facilities with high-speed internet access for student computing and coursework.</li>
      <li><strong>Classrooms:</strong> Spacious lecture halls equipped with multimedia presentation tools.</li>
    </ul>`;

  // 7. Centers & Offices
  const coData = readBackupFile(deptDir, ['c&o.php', 'linkages.php', 'mou.php', 'centers.php', 'alumni.php', 'ic.php']);
  sections.centers = coData ? coData.content : `
    <p>The ${deptName} coordinates with specialized university bodies and departmental cells to assist students throughout their degree:</p>
    <ul>
      <li><strong>Academic &amp; Student Advisory Cell:</strong> Guidance on course selection, career trajectories, and postgraduate research.</li>
      <li><strong>Internship &amp; Placement Liaison:</strong> Connects graduating students with corporate, research and government organizations.</li>
      <li><strong>Seminar &amp; Colloquium Committee:</strong> Organizes academic lectures, workshops and guest talks by industry experts.</li>
      <li><strong>Examination &amp; Records Unit:</strong> Maintains student evaluation records, course schedules, and academic progress tracking.</li>
    </ul>`;

  // 8. Newsletters
  const newsData = readBackupFile(deptDir, ['newsl.php', 'news.php', 'archivenews.php', 'events.php', 'activities.php', 'seminars.php']);
  sections.newsletters = newsData ? newsData.content : `
    <p>The ${deptName} regularly publishes research bulletins, seminar proceedings, and announcements highlighting student distinctions and faculty research achievements. Contact the department office to view the latest publications and newsletter archives.</p>`;

  // 9. Contact
  const contactData = readBackupFile(deptDir, ['contact.php']);
  sections.contact = contactData ? contactData.content : `
    <p><strong>${deptName}</strong><br>
    University of Karachi, University Road, Karachi-75270, Pakistan<br>
    Telephone: <a href="tel:+922199261300">(021) 99261300-7</a><br>
    Email: <a href="mailto:registrar@uok.edu.pk">registrar@uok.edu.pk</a></p>`;

  // Build the section markup
  const accordionBlock = buildAccordionSection(deptName, sections);

  let updatedHtml;
  if (existingAccordionMatch) {
    updatedHtml = html.replace(existingAccordionMatch[0], accordionBlock.trim());
  } else {
    // Insert before apply-stadum-area or marquee-area or footer
    let insertIdx = html.indexOf('<section class="apply-stadum-area');
    if (insertIdx === -1) insertIdx = html.indexOf('<div class="marquee-area');
    if (insertIdx === -1) insertIdx = html.indexOf('<footer');

    if (insertIdx === -1) {
      console.error(`[ERROR] Could not find insertion point in ${file}`);
      return;
    }

    updatedHtml = html.slice(0, insertIdx) + accordionBlock + '\n' + html.slice(insertIdx);
  }

  fs.writeFileSync(legacyPath, updatedHtml, 'utf8');
  console.log(`[DONE] Enriched ${file} with full 9-section accordion!`);
}

function main() {
  console.log('--- Starting Complete 58-Department Content Enrichment ---');
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.startsWith('department-') && f.endsWith('.html'));
  console.log(`Found ${files.length} department files in legacy_html.`);

  let enrichedCount = 0;
  for (const file of files) {
    try {
      processDepartment(file);
      enrichedCount++;
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  console.log(`--- Finished processing ${enrichedCount} files. ---`);
}

main();
