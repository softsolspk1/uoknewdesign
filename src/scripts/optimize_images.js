// One-off maintenance script: recompresses every raster image under public/
// in place (same path/extension) so existing <img src> references — in the
// DB, legacy_html, and components — need no changes. Many source images were
// raw camera uploads (3000-4000px, several MB each); this caps dimensions
// and re-encodes at a web-appropriate quality, only writing back when the
// result is smaller than the original.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 78;
const PNG_QUALITY = 78;
const EXTS = new Set(['.jpg', '.jpeg', '.png']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function optimize(file) {
  const before = fs.statSync(file).size;
  const ext = path.extname(file).toLowerCase();
  try {
    // Read fully into a buffer first: passing a file path straight to sharp
    // leaves handles open longer on Windows and exhausts them after a few
    // hundred files in a tight loop.
    const input = fs.readFileSync(file);
    let img = sharp(input, { failOn: 'none' }).rotate();
    const meta = await img.metadata();
    if (meta.width && meta.width > MAX_WIDTH) {
      img = img.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    let buffer;
    if (ext === '.png') {
      buffer = await img.png({ quality: PNG_QUALITY, palette: true, effort: 8 }).toBuffer();
    } else {
      buffer = await img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    }

    if (buffer.length < before) {
      fs.writeFileSync(file, buffer);
      return { file, before, after: buffer.length, changed: true };
    }
    return { file, before, after: before, changed: false };
  } catch (err) {
    return { file, before, after: before, changed: false, error: err.message };
  }
}

async function main() {
  const files = walk(PUBLIC_DIR);
  console.log(`Found ${files.length} raster images under public/`);
  let totalBefore = 0;
  let totalAfter = 0;
  let changedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const res = await optimize(file);
    totalBefore += res.before;
    totalAfter += res.after;
    if (res.changed) changedCount++;
    if (res.error) {
      errorCount++;
      console.error(`ERROR ${path.relative(PUBLIC_DIR, file)}: ${res.error}`);
    }
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.log(`\nDone. ${changedCount}/${files.length} files recompressed, ${errorCount} errors.`);
  console.log(`Total: ${mb(totalBefore)} MB -> ${mb(totalAfter)} MB (saved ${mb(totalBefore - totalAfter)} MB)`);
}

main();
