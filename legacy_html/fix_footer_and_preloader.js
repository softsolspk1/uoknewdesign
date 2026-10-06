const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
let count = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // 1. Revert Pre-Loader back to UOK
  const currentPreloader = `<span class="loader">University of Karachi <span class="loading-text">University of Karachi</span></span>`;
  const revertedPreloader = `<span class="loader">UOK <span class="loading-text">University of Karachi</span></span>`;
  
  // Also check if any files still have "UoK" and replace it to "UOK" just in case they want exactly "UOK"
  const alternatePreloader = `<span class="loader">UoK <span class="loading-text">University of Karachi</span></span>`;

  if (content.includes(currentPreloader)) {
    content = content.split(currentPreloader).join(revertedPreloader);
  }
  if (content.includes(alternatePreloader)) {
    content = content.split(alternatePreloader).join(revertedPreloader);
  }

  // 2. Remove Campus Gallery
  // The gallery block starts with: <div class="col-md-6 col-xl-auto">
  // and ends with three </div> tags.
  const galleryRegex = /<div class="col-md-6 col-xl-auto">\s*<div class="widget th-widget-instagram footer-widget">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
  content = content.replace(galleryRegex, '');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
  }
}

console.log(`Successfully reverted preloader and removed Campus Gallery in ${count} files.`);
