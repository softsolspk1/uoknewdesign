// One-off content update, applied to the git-tracked legacy_html/*.html
// fallback pages: swaps the Diamond Jubilee logo image and bumps the
// "Admissions" year label. A separate DB migration script
// (update_logo_and_admissions_year_db.js) applies the same changes to
// database-stored Page content.
const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(process.cwd(), 'legacy_html');
const files = fs.readdirSync(LEGACY_DIR).filter((f) => f.endsWith('.html'));

let changedCount = 0;
for (const file of files) {
  const full = path.join(LEGACY_DIR, file);
  const before = fs.readFileSync(full, 'utf8');
  let content = before;

  // Logo: same-path swap, no markup structure change.
  content = content.split('assets/img/logo22.png').join('/uok101.jpg');

  // Admissions year: bump the headline + its immediately-following calendar
  // date stamp together (best effort, tolerant of minor per-file markup
  // differences), then fall back to plain text substitutions so the
  // headline itself is never left unbumped even if that linkage doesn't
  // match exactly.
  content = content.replace(
    /(Admissions Program )2026(\s+Now Open<\/a><\/h4>[\s\S]{0,300}?<i class="far fa-calendar"><\/i>)2026/g,
    '$12027$22027'
  );
  content = content.split('Admissions Program 2026').join('Admissions Program 2027');
  content = content.split('Admissions 2026').join('Admissions 2027');

  if (content !== before) {
    fs.writeFileSync(full, content);
    changedCount++;
  }
}

console.log(`Updated ${changedCount}/${files.length} legacy_html files.`);
