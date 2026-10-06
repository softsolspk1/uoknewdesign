const fs = require('fs');
let f = fs.readFileSync('src/components/Footer.tsx', 'utf8');

// There are too many </div> before copyright-wrap.
// Let's just use replace_file_content or fix it by removing one </div>.
f = f.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="copyright-wrap/, '</div>\n      </div>\n    </div>\n  </div>\n  <div className="copyright-wrap');

fs.writeFileSync('src/components/Footer.tsx', f);
console.log('fixed footer');
