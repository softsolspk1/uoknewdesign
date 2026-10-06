const fs = require('fs');
const path = require('path');

const deptMap = {
  'Agriculture &amp; Agribusiness Management': 'agriculture',
  'Applied Chemistry &amp; Chemical Technology': 'appliedchemistry',
  'Applied Physics': 'appliedphysics',
  'Biochemistry': 'biochemistry',
  'Biotechnology': 'biotechnology',
  'Botany': 'botany',
  'Chemistry': 'chemistry',
  'Food Science &amp; Technology': 'foodscience',
  'Genetics': 'genetics',
  'Geography': 'geography',
  'Geology': 'geology',
  'Health, Physical Education &amp; Sports Sciences': 'healthphysical',
  'Mathematics': 'mathematics',
  'Microbiology': 'microbiology',
  'Petroleum Technology': 'petroleumtechnology',
  'Physics': 'physics',
  'Physiology': 'physiology',
  'Statistics': 'statistics',
  'Zoology': 'zoology',
  'Arabic': 'arabic',
  'Bengali': 'bengali',
  'Criminology': 'criminology',
  'Economics': 'economics',
  'English': 'english',
  'History': 'generalhistory',
  'International Relations': 'internationalrelations',
  'Islamic History': 'islamichistory',
  'Library &amp; Information Science': 'libraryinformationsciences',
  'Mass Communication': 'masscommunication',
  'Persian': 'persian',
  'Philosophy': 'philosophy',
  'Political Science': 'politicalscience',
  'Psychology': 'psychology',
  'Sindhi': 'sindhi',
  'Shah Latif Chair': 'shahlatifchair',
  'Social Work': 'socialwork',
  'Sociology': 'sociology',
  'Urdu': 'urdu',
  'Visual Studies': 'visualstudies',
  'Karachi University Business School': 'businessadministration',
  'Commerce': 'commerce',
  'Public Administration': 'publicadministration',
  'Pharmaceutical Chemistry': 'pharmaceuticalchemistry',
  'Pharmaceutics': 'pharmaceutics',
  'Pharmacology': 'pharmacology',
  'Pharmacognosy': 'pharmacognosy',
  'Pharmacy Practice': 'pharmacypractice',
  'Education': 'education',
  'Special Education': 'specialeducation',
  'Teacher Education': 'teachereducation',
  'Chemical Engineering (Accredited with PEC)': 'chemicalengineering',
  'Islamic Learning': 'islamiclearning',
  "Qur'an wa Sunnah": 'quranwasunnah',
  'Usool-ud-Din': 'usooluddin',
  'School of Law': 'law',
};

const instMap = {
  'Institute of Environmental Studies': 'institute-ies.html',
  'Institute of Marine Science': 'institute-ims.html',
  'Institute of Space Science &amp; Technology': 'institute-isst.html',
  'National Nematological Research Centre': 'institute-nnrc.html',
  'Center for Digital Forensic Science &amp; Technology': 'institute-cdfst.html',
  'Area Study Center for Europe': 'institute-asce.html',
  'Centre for Molecular Genetics': 'institute-cmg.html',
  "Centre of Excellence for Women's Studies": 'institute-cews.html',
  'Center for Health &amp; Wellbeing': 'institute-chwb.html',
  'Pakistan Study Center': 'institute-psc.html',
  'Confucius Institute': 'institute-confucius.html',
  'Sardar Yasin Malik Professional Development Centre': 'institute-sympdc.html',
  'Shaheed Mohtarma Benazir Bhutto Chair': 'institute-smbbc.html'
};

const topLevelPages = [
  { title: "Registrar's Office", file: "registrar.html" },
  { title: "Alumni", file: "alumni.html" },
  { title: "Policies", file: "policies.html" },
  { title: "Examinations", file: "examination.html" },
  { title: "Downloads", file: "downloads.html" },
  { title: "Postgraduate Admissions", file: "pg-admissions.html" },
  { title: "Foreign Students' Policy", file: "foreign-students.html" },
  { title: "Semester Fee", file: "semester-fee.html" },
  { title: "Academic Journals", file: "journals.html" },
  { title: "Convocation", file: "convocation.html" },
  { title: "News", file: "news.html" }
];


const oldMobile = `<div class="th-mobile-menu">
      <ul>
        <li><a href="index.html">Home</a></li>
        <li class="menu-item-has-children">
          <a href="about.html">About Us</a>
          <ul class="sub-menu">
            <li><a href="about.html">About &amp; History</a></li>
            <li><a href="administration.html">Administration</a></li>
          </ul>
        </li>
        <li><a href="academics.html">Academics</a></li>
        <li><a href="admissions.html">Admissions</a></li>
        <li class="menu-item-has-children">
          <a href="research.html">Research</a>
          <ul class="sub-menu">
            <li><a href="research.html">Research Institutes</a></li>
            <li><a href="institute-kibge.html">Dr. A.Q. Khan Institute (KIBGE)</a></li>
            <li><a href="department-computerscience.html">Dept. of Computer Science (UBIT)</a></li>
          </ul>
        </li>
        <li><a href="library.html">Library</a></li>
        <li><a href="student-life.html">Student Life</a></li>
        <li><a href="contact.html">Contact Us</a></li>
      </ul>
    </div>`;

const newMobile = `<div class="th-mobile-menu">
      <ul>
        <li><a href="index.html">Home</a></li>
        <li class="menu-item-has-children">
          <a href="about.html">About Us</a>
          <ul class="sub-menu">
            <li><a href="about.html">About &amp; History</a></li>
            <li><a href="administration.html">Administration</a></li>
            <li><a href="registrar.html">Registrar's Office</a></li>
            <li><a href="alumni.html">Alumni</a></li>
            <li><a href="policies.html">Policies</a></li>
          </ul>
        </li>
        <li class="menu-item-has-children">
          <a href="academics.html">Academics</a>
          <ul class="sub-menu">
            <li><a href="academics.html">Faculties &amp; Departments</a></li>
            <li><a href="department-computerscience.html">Dept. of Computer Science (UBIT)</a></li>
            <li><a href="examination.html">Examinations</a></li>
            <li><a href="downloads.html">Downloads</a></li>
          </ul>
        </li>
        <li class="menu-item-has-children">
          <a href="admissions.html">Admissions</a>
          <ul class="sub-menu">
            <li><a href="admissions.html">Admissions 2026</a></li>
            <li><a href="pg-admissions.html">Postgraduate Admissions</a></li>
            <li><a href="foreign-students.html">Foreign Students' Policy</a></li>
            <li><a href="semester-fee.html">Semester Fee</a></li>
          </ul>
        </li>
        <li class="menu-item-has-children">
          <a href="research.html">Research</a>
          <ul class="sub-menu">
            <li><a href="research.html">Research Institutes Overview</a></li>
            <li class="menu-item-has-children">
              <a href="https://iccs.edu/" target="_blank">International Center for Chemical and Biological Sciences (ICCBS)</a>
              <ul class="sub-menu">
                <li><a href="#">H.E.J. Research Institute of Chemistry</a></li>
                <li><a href="#">Dr. Panjwani Center for Molecular Medicine &amp; Drug Research</a></li>
                <li><a href="#">Other Chemistry Centers</a></li>
                <li><a href="#">Other Biological Sciences Related Centers</a></li>
                <li><a href="#">Third World Center for Science and Technology</a></li>
                <li><a href="#">Center for Bioequivalence Studies and Clinical Research (CBSCR)</a></li>
                <li><a href="#">Industrial Analytical Center (IAC)</a></li>
                <li><a href="#">Biotechnology Wing</a></li>
                <li><a href="#">Prof. Dr. Wolfgang Voelter Laboratories Complex (NRL)</a></li>
                <li><a href="#">Welcome to National Facility for Laboratory Animal Research and Care (NFLARC)</a></li>
                <li><a href="#">L.E.J. Nanotechnology Center</a></li>
                <li><a href="#">Technology Park &amp; Technology Incubation Center</a></li>
                <li><a href="#">Latif Ebrahim Jamal National Science Information Center</a></li>
              </ul>
            </li>
            <li><a href="institute-ies.html">Institute of Environmental Studies</a></li>
            <li><a href="institute-ims.html">Institute of Marine Science</a></li>
            <li><a href="institute-isst.html">Institute of Space Science &amp; Technology</a></li>
            <li><a href="institute-nnrc.html">National Nematological Research Centre</a></li>
            <li><a href="institute-cdfst.html">Center for Digital Forensic Science &amp; Technology</a></li>
            <li><a href="institute-asce.html">Area Study Center for Europe</a></li>
            <li><a href="institute-cmg.html">Centre for Molecular Genetics</a></li>
            <li><a href="institute-cews.html">Centre of Excellence for Women's Studies</a></li>
            <li><a href="institute-chwb.html">Center for Health &amp; Wellbeing</a></li>
            <li><a href="institute-psc.html">Pakistan Study Center</a></li>
            <li><a href="institute-confucius.html">Confucius Institute</a></li>
            <li><a href="institute-sympdc.html">Sardar Yasin Malik Professional Development Centre</a></li>
            <li><a href="institute-smbbc.html">Shaheed Mohtarma Benazir Bhutto Chair</a></li>
            <li><a href="institute-kibge.html">Dr. A.Q. Khan Institute (KIBGE)</a></li>
            <li><a href="journals.html">Academic Journals</a></li>
          </ul>
        </li>
        <li><a href="library.html">Library</a></li>
        <li class="menu-item-has-children">
          <a href="student-life.html">Student Life</a>
          <ul class="sub-menu">
            <li><a href="student-life.html">Student Life</a></li>
            <li><a href="convocation.html">Convocation</a></li>
          </ul>
        </li>
        <li><a href="news.html">News</a></li>
        <li><a href="contact.html">Contact Us</a></li>
      </ul>
    </div>`;

const oldDesktop = `<nav class="main-menu d-none d-xl-block">
                  <ul>
                    <li><a href="index.html">Home</a></li>
                    <li class="menu-item-has-children">
                      <a href="about.html">About Us</a>
                      <ul class="sub-menu">
                        <li><a href="about.html">History &amp; Overview</a></li>
                        <li><a href="administration.html">Administration</a></li>
                      </ul>
                    </li>
                    <li class="menu-item-has-children">
                      <a href="academics.html">Academics</a>
                      <ul class="sub-menu">
                        <li><a href="academics.html">Faculties &amp; Departments</a></li>
                        <li><a href="department-computerscience.html">Dept. of Computer Science (UBIT)</a></li>
                      </ul>
                    </li>
                    <li><a href="admissions.html">Admissions</a></li>
                    <li class="menu-item-has-children">
                      <a href="research.html">Research</a>
                      <ul class="sub-menu">
                        <li><a href="research.html">Research Institutes</a></li>
                        <li><a href="institute-kibge.html">Dr. A.Q. Khan Institute (KIBGE)</a></li>
                      </ul>
                    </li>
                    <li><a href="library.html">Library</a></li>
                    <li><a href="student-life.html">Student Life</a></li>
                    <li><a href="contact.html">Contact Us</a></li>
                  </ul>
                </nav>`;

const newDesktop = `<nav class="main-menu d-none d-xl-block">
                  <ul>
                    <li><a href="index.html">Home</a></li>
                    <li class="menu-item-has-children">
                      <a href="about.html">About Us</a>
                      <ul class="sub-menu">
                        <li><a href="about.html">History &amp; Overview</a></li>
                        <li><a href="administration.html">Administration</a></li>
                        <li><a href="registrar.html">Registrar's Office</a></li>
                        <li><a href="alumni.html">Alumni</a></li>
                        <li><a href="policies.html">Policies</a></li>
                      </ul>
                    </li>
                    <li class="menu-item-has-children">
                      <a href="academics.html">Academics</a>
                      <ul class="sub-menu">
                        <li><a href="academics.html">Faculties &amp; Departments</a></li>
                        <li><a href="department-computerscience.html">Dept. of Computer Science (UBIT)</a></li>
                        <li><a href="examination.html">Examinations</a></li>
                        <li><a href="downloads.html">Downloads</a></li>
                      </ul>
                    </li>
                    <li class="menu-item-has-children">
                      <a href="admissions.html">Admissions</a>
                      <ul class="sub-menu">
                        <li><a href="admissions.html">Admissions 2026</a></li>
                        <li><a href="pg-admissions.html">Postgraduate Admissions</a></li>
                        <li><a href="foreign-students.html">Foreign Students' Policy</a></li>
                        <li><a href="semester-fee.html">Semester Fee</a></li>
                      </ul>
                    </li>
                    <li class="menu-item-has-children">
                      <a href="research.html">Research</a>
                      <ul class="sub-menu">
                        <li><a href="research.html">Research Institutes Overview</a></li>
                        <li class="menu-item-has-children">
                          <a href="https://iccs.edu/" target="_blank">International Center for Chemical and Biological Sciences (ICCBS)</a>
                          <ul class="sub-menu">
                            <li><a href="#">H.E.J. Research Institute of Chemistry</a></li>
                            <li><a href="#">Dr. Panjwani Center for Molecular Medicine &amp; Drug Research</a></li>
                            <li><a href="#">Other Chemistry Centers</a></li>
                            <li><a href="#">Other Biological Sciences Related Centers</a></li>
                            <li><a href="#">Third World Center for Science and Technology</a></li>
                            <li><a href="#">Center for Bioequivalence Studies and Clinical Research (CBSCR)</a></li>
                            <li><a href="#">Industrial Analytical Center (IAC)</a></li>
                            <li><a href="#">Biotechnology Wing</a></li>
                            <li><a href="#">Prof. Dr. Wolfgang Voelter Laboratories Complex (NRL)</a></li>
                            <li><a href="#">Welcome to National Facility for Laboratory Animal Research and Care (NFLARC)</a></li>
                            <li><a href="#">L.E.J. Nanotechnology Center</a></li>
                            <li><a href="#">Technology Park &amp; Technology Incubation Center</a></li>
                            <li><a href="#">Latif Ebrahim Jamal National Science Information Center</a></li>
                          </ul>
                        </li>
                        <li><a href="institute-ies.html">Institute of Environmental Studies</a></li>
                        <li><a href="institute-ims.html">Institute of Marine Science</a></li>
                        <li><a href="institute-isst.html">Institute of Space Science &amp; Technology</a></li>
                        <li><a href="institute-nnrc.html">National Nematological Research Centre</a></li>
                        <li><a href="institute-cdfst.html">Center for Digital Forensic Science &amp; Technology</a></li>
                        <li><a href="institute-asce.html">Area Study Center for Europe</a></li>
                        <li><a href="institute-cmg.html">Centre for Molecular Genetics</a></li>
                        <li><a href="institute-cews.html">Centre of Excellence for Women's Studies</a></li>
                        <li><a href="institute-chwb.html">Center for Health &amp; Wellbeing</a></li>
                        <li><a href="institute-psc.html">Pakistan Study Center</a></li>
                        <li><a href="institute-confucius.html">Confucius Institute</a></li>
                        <li><a href="institute-sympdc.html">Sardar Yasin Malik Professional Development Centre</a></li>
                        <li><a href="institute-smbbc.html">Shaheed Mohtarma Benazir Bhutto Chair</a></li>
                        <li><a href="institute-kibge.html">Dr. A.Q. Khan Institute (KIBGE)</a></li>
                        <li><a href="journals.html">Academic Journals</a></li>
                      </ul>
                    </li>
                    <li><a href="library.html">Library</a></li>
                    <li class="menu-item-has-children">
                      <a href="student-life.html">Student Life</a>
                      <ul class="sub-menu">
                        <li><a href="student-life.html">Student Life</a></li>
                        <li><a href="convocation.html">Convocation</a></li>
                      </ul>
                    </li>
                    <li><a href="news.html">News</a></li>
                    <li><a href="contact.html">Contact Us</a></li>
                  </ul>
                </nav>`;

const oldLinks = `<div class="col-sm-6 col-xl-auto">
          <div class="widget widget_nav_menu footer-widget">
            <h3 class="widget_title">Useful Links</h3>
            <div class="menu-all-pages-container">
              <ul class="menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About Us</a></li>
                <li><a href="administration.html">Administration</a></li>
                <li><a href="academics.html">Academics</a></li>
                <li><a href="admissions.html">Admissions</a></li>
                <li><a href="research.html">Research</a></li>
                <li><a href="contact.html">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>`;

const newLinks = `<div class="col-sm-6 col-xl-auto">
          <div class="widget widget_nav_menu footer-widget">
            <h3 class="widget_title">Useful Links</h3>
            <div class="menu-all-pages-container">
              <ul class="menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About Us</a></li>
                <li><a href="administration.html">Administration</a></li>
                <li><a href="academics.html">Academics</a></li>
                <li><a href="admissions.html">Admissions</a></li>
                <li><a href="research.html">Research</a></li>
                <li><a href="news.html">News</a></li>
                <li><a href="alumni.html">Alumni</a></li>
                <li><a href="contact.html">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-auto">
          <div class="widget widget_nav_menu footer-widget">
            <h3 class="widget_title">Resources</h3>
            <div class="menu-all-pages-container">
              <ul class="menu">
                <li><a href="downloads.html">Downloads</a></li>
                <li><a href="examination.html">Examinations</a></li>
                <li><a href="pg-admissions.html">Postgraduate Admissions</a></li>
                <li><a href="foreign-students.html">Foreign Students' Policy</a></li>
                <li><a href="semester-fee.html">Semester Fee</a></li>
                <li><a href="journals.html">Academic Journals</a></li>
                <li><a href="policies.html">Policies</a></li>
                <li><a href="registrar.html">Registrar's Office</a></li>
                <li><a href="convocation.html">Convocation</a></li>
              </ul>
            </div>
          </div>
        </div>`;

function applyNewMenus(htmlStr) {
  let modified = htmlStr;
  if (modified.includes(oldMobile)) modified = modified.split(oldMobile).join(newMobile);
  if (modified.includes(oldDesktop)) modified = modified.split(oldDesktop).join(newDesktop);
  if (modified.includes(oldLinks)) modified = modified.split(oldLinks).join(newLinks);
  return modified;
}

const oldPreloader = `<span class="loader">UoK <span class="loading-text">University of Karachi</span></span>`;
const newPreloader = `<span class="loader">University of Karachi <span class="loading-text">University of Karachi</span></span>`;

function applyPreloaderFix(htmlStr) {
  if (htmlStr.includes(oldPreloader)) {
    return htmlStr.split(oldPreloader).join(newPreloader);
  }
  return htmlStr;
}

let baseHtml = fs.readFileSync('department-computerscience.html', 'utf8');

// Apply new menus to base template so all generated pages get them
baseHtml = applyNewMenus(baseHtml);
baseHtml = applyPreloaderFix(baseHtml);

const genericContent = (title) => \`
<div class="breadcumb-wrapper position-relative" data-bg-src="assets/img/shape/breadcrumb-shep.png">
  <div class="breadcumb-banner"><img src="assets/img/breadcrumb/breadcumb-banner.png" alt="bg-banner"></div>
  <div class="breadcumb-shape"><img src="assets/img/shape/triangle-light.png" alt="shape" class="jump"></div>
  <div class="container th-container4">
    <div class="row">
      <div class="col-xxl-6">
        <div class="breadcumb-content">
          <h1 class="breadcumb-title">\${title}</h1>
          <ul class="breadcumb-menu"><li><a href="index.html">Home</a></li><li>\${title}</li></ul>
        </div>
      </div>
    </div>
  </div>
</div>

<section class="th-program-wrapper program-details space-top space-extra2-bottom overflow-hidden">
  <div class="container th-container4">
    <div class="row gy-4 gx-60">
      <div class="col-xl-8">
        <div class="peogram-area">
          <div class="title-area">
            <h2 class="sec-title text-anim2">\${title}</h2>
          </div>
          <div class="program-content">
            <p style="font-size: 1.1rem; color: #666; margin-top: 20px;">Welcome to the \${title}. This page is currently being updated and detailed information will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
\`;

const headEndMatch = baseHtml.indexOf('<div class="breadcumb-wrapper position-relative"');
const footerMatch = baseHtml.indexOf('<footer class="footer-wrapper footer-default');

const headerPart = baseHtml.substring(0, headEndMatch);
const footerPart = baseHtml.substring(footerMatch);

let generatedCount = 0;

function createPage(title, filename) {
  let newHeader = headerPart.replace(/<title>.*?<\\/title>/, \`<title>\${title} | University of Karachi</title>\`);
  const finalHtml = newHeader + genericContent(title) + footerPart;
  fs.writeFileSync(filename, finalHtml, 'utf8');
  generatedCount++;
}

// Scaffold Pages
for (const [title, stem] of Object.entries(deptMap)) {
  const cleanTitle = title.replace(/&amp;/g, '&');
  const filename = \`department-\${stem}.html\`;
  if (filename !== 'department-computerscience.html') {
    createPage("Department of " + cleanTitle, filename);
  }
}

for (const [title, filename] of Object.entries(instMap)) {
  const cleanTitle = title.replace(/&amp;/g, '&');
  if (filename !== 'institute-kibge.html') {
    createPage(cleanTitle, filename);
  }
}

for (const page of topLevelPages) {
  createPage(page.title, page.file);
}

console.log(\`Successfully generated \${generatedCount} pages.\`);

// Now apply menu updates to ALL HTML files in the current directory
let updatedCount = 0;
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = applyNewMenus(content);
  newContent = applyPreloaderFix(newContent);
  
  // Custom updates from original _redo_all.js
  if (f === 'academics.html') {
    for (const [text, stem] of Object.entries(deptMap)) {
      const oldTag = \`<li>\${text}</li>\`;
      const newTag = \`<li><a href="department-\${stem}.html">\${text}</a></li>\`;
      if (newContent.includes(oldTag)) newContent = newContent.split(oldTag).join(newTag);
    }
  }

  if (f === 'research.html') {
    for (const [text, href] of Object.entries(instMap)) {
      const oldTag = \`<a href="research.html">\${text}</a>\`;
      const newTag = \`<a href="\${href}">\${text}</a>\`;
      if (newContent.includes(oldTag)) newContent = newContent.split(oldTag).join(newTag);
    }
    
    // Also include smbbc card update
    const oldSzic = \`<h3 class="box-title"><a href="research.html">Sheikh Zayed Islamic Center</a></h3>
            <p class="box-text">Research and teaching in Islamic studies. Email: info@szic.edu.pk</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>\`;
    const newSzic = \`<h3 class="box-title"><a href="research.html">Sheikh Zayed Islamic Center</a></h3>
            <p class="box-text">Research and teaching in Islamic studies. Email: info@szic.edu.pk</p>
          </div>
        </div>
      </div>

      <div class="col-xl-4 col-md-6">
        <div class="research-card">
          <div class="box-img global-img"><img src="assets/img/uok/banner-dpa.jpg" alt="Shaheed Mohtarma Benazir Bhutto Chair"></div>
          <div class="box-content">
            <h3 class="box-title"><a href="institute-smbbc.html">Shaheed Mohtarma Benazir Bhutto Chair</a></h3>
            <p class="box-text">A research and advisory chair established at the University of Karachi.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>\`;
    if (newContent.includes(oldSzic)) {
      newContent = newContent.split(oldSzic).join(newSzic);
    }
  }

  if (content !== newContent) {
    fs.writeFileSync(f, newContent, 'utf8');
    updatedCount++;
  }
}
console.log(\`Successfully updated menus/links in \${updatedCount} existing files.\`);
