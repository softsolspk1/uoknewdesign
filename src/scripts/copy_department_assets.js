const fs = require('fs');
const path = require('path');

const BACKUP_FACULTIES = 'D:/backup-uok.edu.pk-9-2-2026/public_html/faculties';
const PUBLIC_FACULTIES = path.join(__dirname, '../../public/faculties');

const ALLOWED_EXTS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'
]);

if (!fs.existsSync(PUBLIC_FACULTIES)) {
  fs.mkdirSync(PUBLIC_FACULTIES, { recursive: true });
}

function copyDirectoryAssets(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Avoid recursive loops or temp dirs
      if (entry.name !== 'tmp' && entry.name !== '_vti_cnf') {
        copiedCount += copyDirectoryAssets(srcPath, destPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTS.has(ext)) {
        try {
          fs.copyFileSync(srcPath, destPath);
          copiedCount++;
        } catch (err) {
          console.error(`Failed to copy ${srcPath}:`, err.message);
        }
      }
    }
  }

  return copiedCount;
}

function main() {
  console.log('--- Starting Copy of Department Assets (PDFs, Docs, Images) ---');
  console.log(`Source: ${BACKUP_FACULTIES}`);
  console.log(`Destination: ${PUBLIC_FACULTIES}`);

  if (!fs.existsSync(BACKUP_FACULTIES)) {
    console.error(`Source directory does not exist: ${BACKUP_FACULTIES}`);
    process.exit(1);
  }

  const deptDirs = fs.readdirSync(BACKUP_FACULTIES, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'tmp');

  let totalFiles = 0;
  for (const dir of deptDirs) {
    const srcDept = path.join(BACKUP_FACULTIES, dir.name);
    const destDept = path.join(PUBLIC_FACULTIES, dir.name);
    const count = copyDirectoryAssets(srcDept, destDept);
    if (count > 0) {
      console.log(`[COPIED] ${dir.name}: ${count} assets`);
      totalFiles += count;
    }
  }

  console.log(`--- Finished! Copied a total of ${totalFiles} department media & document assets. ---`);
}

main();
