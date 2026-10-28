import fs from 'fs';
import path from 'path';

const SRC_DIR = '/Users/unknown1/Desktop/HCM Final/hcm_frontend/src';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('dist')) {
        getFiles(filePath, fileList);
      }
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles(SRC_DIR);
let rigidGrids = [];
let fixedWidths = [];
let unconstrainedModals = [];

files.forEach(file => {
  const rel = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check rigid grids: grid-cols-3, grid-cols-4 without grid-cols-1 or sm: or md:
    if (line.match(/\bgrid-cols-[3-6]\b/) && !line.match(/\bgrid-cols-1\b/) && !line.match(/\b(sm|md|lg):grid-cols-/)) {
      rigidGrids.push({ file: rel, line: idx + 1, snippet: line.trim() });
    }

    // Check fixed widths > 380px without responsive classes
    const match = line.match(/(?:^|\s)w-\[(\d+)px\]/);
    if (match) {
      const px = parseInt(match[1], 10);
      if (px > 380 && !line.includes('sm:') && !line.includes('md:') && !line.includes('lg:') && !line.includes('max-w-full') && !line.includes('blur') && !line.includes('pointer-events-none')) {
        fixedWidths.push({ file: rel, line: idx + 1, snippet: line.trim() });
      }
    }
  });
});

console.log('Rigid Grids without mobile fallback:', rigidGrids.length);
rigidGrids.forEach(g => console.log(`  [${g.file}:${g.line}] ${g.snippet}`));

console.log('\nFixed Widths > 380px without responsive bounds:', fixedWidths.length);
fixedWidths.forEach(w => console.log(`  [${w.file}:${w.line}] ${w.snippet}`));
