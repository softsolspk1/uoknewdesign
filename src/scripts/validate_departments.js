const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(__dirname, '../../legacy_html');
const PUBLIC_DIR = path.join(__dirname, '../../public');

function validate() {
  console.log('--- Validating All 58 Department Pages ---');
  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.startsWith('department-') && f.endsWith('.html'));

  let totalIssues = 0;
  let missingPdfCount = 0;
  let totalTabs = 0;

  files.forEach(file => {
    const slug = file.replace(/^department-/, '').replace(/\.html$/, '');
    const fullPath = path.join(LEGACY_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. Check for legacy garbage markers
    const garbagePatterns = [
      '#contentendouter',
      'id="contentend"',
      '<br class="clear" />',
      '<?php',
      'include_once',
      'class="right_course"'
    ];

    garbagePatterns.forEach(pat => {
      if (content.includes(pat)) {
        console.warn(`[GARBAGE FOUND] in ${file}: "${pat}"`);
        totalIssues++;
      }
    });

    // 2. Check Department Tabs
    const tabButtons = content.match(/id="tab-[a-z0-9-]+-btn"/gi) || [];
    const tabPanes = content.match(/id="tab-[a-z0-9-]+"/gi) || [];

    // Filter out -btn matches from tabPanes count
    const actualPanes = tabPanes.filter(id => !id.endsWith('-btn"'));

    if (tabButtons.length !== actualPanes.length) {
      console.warn(`[MISMATCH TABS] in ${file}: ${tabButtons.length} buttons vs ${actualPanes.length} panes`);
      totalIssues++;
    }
    totalTabs += tabButtons.length;

    // 3. Check PDF links to ensure file exists in public/
    const pdfMatches = content.match(/href="(\/faculties\/[^"]+\.pdf)"/gi) || [];
    pdfMatches.forEach(hrefMatch => {
      const href = hrefMatch.replace(/^href="/, '').replace(/"$/, '');
      const localPath = path.join(PUBLIC_DIR, href);
      if (!fs.existsSync(localPath)) {
        console.warn(`[MISSING PDF] in ${file}: ${href} -> Local: ${localPath}`);
        missingPdfCount++;
        totalIssues++;
      }
    });
  });

  console.log('-----------------------------------------');
  console.log(`Validated ${files.length} department files.`);
  console.log(`Total active navigation tabs created: ${totalTabs} (Avg ${(totalTabs / files.length).toFixed(1)} per department)`);
  console.log(`Missing PDFs: ${missingPdfCount}`);
  console.log(`Total critical issues: ${totalIssues}`);
}

validate();
