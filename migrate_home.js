const fs = require('fs');

function htmlToJsx(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<img([^>]*)>/g, (match, p1) => {
      // Ensure img tags are self-closing
      if (p1.endsWith('/')) return match;
      return `<img${p1} />`;
    })
    .replace(/<input([^>]*)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<input${p1} />`;
    })
    .replace(/<br([^>]*)>/g, '<br />')
    .replace(/<hr([^>]*)>/g, '<hr />')
    .replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
}

const html = fs.readFileSync('legacy_html/index.html', 'utf8');

const headerEnd = html.indexOf('</header>') + 9;
const footerStart = html.indexOf('<footer');

let mainContent = html.substring(headerEnd, footerStart);

const jsxContent = `
export default function Home() {
  return (
    <main>
      ${htmlToJsx(mainContent)}
    </main>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', jsxContent);
console.log('Homepage migrated.');
