const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
let count = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // The text to search for (currently UOK)
  const currentPreloader = `<span class="loader">UOK <span class="loading-text">University of Karachi</span></span>`;
  // The text to replace it with (University of Karachi)
  const newPreloader = `<span class="loader">University of Karachi <span class="loading-text">University of Karachi</span></span>`;
  
  // Also handle 'UoK' just in case some pages still have the original capitalization
  const alternatePreloader = `<span class="loader">UoK <span class="loading-text">University of Karachi</span></span>`;

  if (content.includes(currentPreloader)) {
    content = content.split(currentPreloader).join(newPreloader);
  }
  if (content.includes(alternatePreloader)) {
    content = content.split(alternatePreloader).join(newPreloader);
  }

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
  }
}

console.log(`Successfully updated pre-loader text to 'University of Karachi' in ${count} files.`);
