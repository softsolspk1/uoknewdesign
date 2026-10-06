const fs = require('fs');
const path = require('path');

function htmlToJsx(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<img([^>]*)>/g, '<img$1 />')
    .replace(/<input([^>]*)>/g, '<input$1 />')
    .replace(/<br([^>]*)>/g, '<br$1 />')
    .replace(/<hr([^>]*)>/g, '<hr$1 />')
    .replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
}

const headerHtml = fs.readFileSync('legacy_html/_chrome-header.html', 'utf8');
const footerHtml = fs.readFileSync('legacy_html/_chrome-footer.html', 'utf8');

const headerJsx = `
export default function Header() {
  return (
    <>
      ${htmlToJsx(headerHtml)}
    </>
  );
}
`;

const footerJsx = `
export default function Footer() {
  return (
    <>
      ${htmlToJsx(footerHtml)}
    </>
  );
}
`;

fs.mkdirSync('src/components', { recursive: true });
fs.writeFileSync('src/components/Header.tsx', headerJsx);
fs.writeFileSync('src/components/Footer.tsx', footerJsx);

console.log('Components created.');
