const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../../legacy_html/academics.html'), 'utf8');

const facultyContainers = content.split(/<div class="faculty-table-container"/gi).slice(1);
const facultyMap = {};

facultyContainers.forEach(block => {
  const idMatch = block.match(/id="(fac-\d+)"/i);
  const nameMatch = block.match(/<h3>(?:<i[^>]*><\/i>)?\s*(.*?)\s*<\/h3>/i);
  
  if (idMatch && nameMatch) {
    const facultyId = idMatch[1];
    let facultyName = nameMatch[1].replace(/<[^>]+>/g, '').trim();
    facultyName = facultyName.replace(/&amp;/g, '&');

    const deptRegex = /href="(department-[a-z0-9-]+)"[^>]*>[\s\S]*?<span>(.*?)<\/span>/gi;
    let dMatch;
    while ((dMatch = deptRegex.exec(block)) !== null) {
      const slug = dMatch[1].replace('department-', '');
      const deptTitle = dMatch[2].replace(/<[^>]+>/g, '').trim().replace(/&amp;/g, '&');
      facultyMap[slug] = {
        facultyId,
        facultyName,
        deptTitle
      };
    }
  }
});

console.log(`Found ${Object.keys(facultyMap).length} department mappings in academics.html:`);
console.log(JSON.stringify(facultyMap, null, 2));

fs.writeFileSync(path.join(__dirname, 'faculty_map.json'), JSON.stringify(facultyMap, null, 2));
