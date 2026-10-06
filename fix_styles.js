const fs = require('fs');

const files = ['src/components/Header.tsx', 'src/components/Footer.tsx', 'src/app/page.tsx'];

function cssToObject(cssText) {
  return cssText.split(';').reduce((acc, rule) => {
    if (!rule.trim()) return acc;
    const colonIndex = rule.indexOf(':');
    if (colonIndex === -1) return acc;
    let key = rule.slice(0, colonIndex).trim();
    let value = rule.slice(colonIndex + 1).trim();
    key = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    acc[key] = value;
    return acc;
  }, {});
}

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace inline styles
  content = content.replace(/style="([^"]*)"/g, (match, styleString) => {
    const styleObj = cssToObject(styleString);
    return `style={${JSON.stringify(styleObj)}}`;
  });
  
  // Replace <style> tags
  content = content.replace(/<style>([\s\S]*?)<\/style>/g, (match, inner) => {
    return `<style dangerouslySetInnerHTML={{ __html: \`${inner}\` }} />`;
  });
  
  fs.writeFileSync(file, content);
});
console.log('Fixed styles.');
