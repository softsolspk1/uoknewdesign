// Applies addLazyLoading() to the git-tracked legacy_html/*.html files and
// src/content/home.html in place.
const fs = require('fs');
const path = require('path');
const { addLazyLoading } = require('./lazyLoadTransform');

const targets = [
  ...fs
    .readdirSync(path.join(process.cwd(), 'legacy_html'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(process.cwd(), 'legacy_html', f)),
  path.join(process.cwd(), 'src/content/home.html'),
];

let changedCount = 0;
for (const file of targets) {
  const before = fs.readFileSync(file, 'utf8');
  const after = addLazyLoading(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changedCount++;
  }
}

console.log(`Updated ${changedCount}/${targets.length} files.`);
