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
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles(SRC_DIR);
const terms = ['mock', 'dummy', 'fake', 'sample'];

const results = {};
terms.forEach(t => results[t] = []);

files.forEach(file => {
  const rel = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // ignore comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    terms.forEach(term => {
      // Regex for identifier or string containing term
      const regex = new RegExp(`\\b${term}[a-zA-Z0-9_]*\\b`, 'i');
      if (regex.test(line) && !line.includes('demoCredentials') && !rel.includes('scratch')) {
        results[term].push({ file: rel, line: idx + 1, text: line.trim().slice(0, 100) });
      }
    });
  });
});

console.log('=== FINAL SEARCH RESULTS ===');
terms.forEach(t => {
  console.log(`\nTerm "${t}": ${results[t].length} occurrences`);
  results[t].slice(0, 8).forEach(r => console.log(`  [${r.file}:${r.line}] ${r.text}`));
});
