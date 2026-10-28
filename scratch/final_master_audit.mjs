// ============================================================
// FINAL MASTER UI AUDIT SCRIPT (PHASE 15)
// ============================================================
import fs from 'fs';
import path from 'path';

const SRC_DIR = '/Users/unknown1/Desktop/HCM Final/hcm_frontend/src';

// Recursively find all .jsx and .js files
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

const allFiles = getFiles(SRC_DIR);
console.log(`Auditing ${allFiles.length} source files in ${SRC_DIR}...\n`);

// 1. Pages Audited Inventory
const rolePages = {
  SUPERADMIN: [],
  ADMIN: [],
  HR: [],
  MANAGER: [],
  EMPLOYEE: [],
  CANDIDATE: [],
  SHARED_OR_PUBLIC: []
};

for (const file of allFiles) {
  const rel = path.relative(SRC_DIR, file);
  if (rel.startsWith('features/superadmin/')) rolePages.SUPERADMIN.push(rel);
  else if (rel.startsWith('features/admin/')) rolePages.ADMIN.push(rel);
  else if (rel.startsWith('features/hr/')) rolePages.HR.push(rel);
  else if (rel.startsWith('features/manager/')) rolePages.MANAGER.push(rel);
  else if (rel.startsWith('features/employee/')) rolePages.EMPLOYEE.push(rel);
  else if (rel.startsWith('features/candidate/')) rolePages.CANDIDATE.push(rel);
  else if (rel.startsWith('features/auth/') || rel.startsWith('features/LandingPage') || rel.startsWith('features/BookDemo') || rel.startsWith('features/TenantSignup')) {
    rolePages.SHARED_OR_PUBLIC.push(rel);
  }
}

// 2. Buttons Audit
let totalButtons = 0;
let standardizedButtons = 0;
let adHocButtons = 0;
const buttonTextSamples = {};
const customButtonPatterns = [];

// 3. Modals Audit
let modalUsages = 0;
const modalComponentTypes = new Set();

// 4. Responsive & Mobile-Breaking Checks
const mobileBreakingWidths = [];
const mathRandomUsages = [];
const localStorageUsages = [];
const mockUsages = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(SRC_DIR, file);

  // Button detection
  const buttonMatches = content.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi);
  for (const match of buttonMatches) {
    totalButtons++;
    const fullTag = match[0];
    const buttonBody = match[1];

    // Check if standardized
    if (
      fullTag.includes('btn-primary') ||
      fullTag.includes('btn-secondary') ||
      fullTag.includes('btn-outline') ||
      fullTag.includes('btn-danger') ||
      fullTag.includes('btn-ghost') ||
      fullTag.includes('btn-success') ||
      fullTag.includes('hcm-btn') ||
      fullTag.includes('px-4 py-2') ||
      fullTag.includes('p-2') ||
      fullTag.includes('p-1.5')
    ) {
      standardizedButtons++;
    } else {
      adHocButtons++;
      if (customButtonPatterns.length < 20) {
        customButtonPatterns.push({ file: rel, snippet: fullTag.slice(0, 100) });
      }
    }

    // Extract text
    const textOnly = buttonBody.replace(/<[^>]+>/g, '').trim();
    if (textOnly && textOnly.length < 30) {
      buttonTextSamples[textOnly] = (buttonTextSamples[textOnly] || 0) + 1;
    }
  }

  // Modal detection
  if (content.includes('CenterModal') || content.includes('ConfirmDialog') || content.includes('Modal') || content.includes('PolicyDrawer')) {
    const modalNames = ['CenterModal', 'ConfirmDialog', 'UserModal', 'RoleModal', 'PolicyDrawer', 'UpgradePlanModal', 'ComplianceModal', 'ReportBuilderWizard'];
    for (const m of modalNames) {
      if (content.includes(`<${m}`)) {
        modalUsages++;
        modalComponentTypes.add(m);
      }
    }
  }

  // Mobile-breaking widths check (e.g. w-[400px], min-w-[500px] without responsive sm:/md:)
  lines.forEach((line, idx) => {
    const wideMatch = line.match(/(?:min-w|w)-\[(\d+)px\]/);
    if (wideMatch) {
      const px = parseInt(wideMatch[1], 10);
      if (px > 360 && !line.includes('sm:') && !line.includes('md:') && !line.includes('lg:') && !line.includes('max-w-full') && !line.includes('overflow-x-auto')) {
        mobileBreakingWidths.push({ file: rel, line: idx + 1, snippet: line.trim() });
      }
    }

    // Math.random
    if (line.includes('Math.random()') && !rel.includes('scratch')) {
      mathRandomUsages.push({ file: rel, line: idx + 1, snippet: line.trim() });
    }

    // localStorage
    if (line.includes('localStorage.') && !rel.includes('scratch')) {
      localStorageUsages.push({ file: rel, line: idx + 1, snippet: line.trim() });
    }

    // mock/fake data patterns
    if ((line.includes('mockData') || line.includes('mockEmployees') || line.includes('mockUsers') || line.includes('dummyData') || line.includes('fakeData')) && !rel.includes('scratch')) {
      mockUsages.push({ file: rel, line: idx + 1, snippet: line.trim() });
    }
  });
}

console.log('=== 1. PAGES AUDITED ===');
console.log(`SUPERADMIN Pages/Components: ${rolePages.SUPERADMIN.length}`);
console.log(`ADMIN Pages/Components: ${rolePages.ADMIN.length}`);
console.log(`HR Pages/Components: ${rolePages.HR.length}`);
console.log(`MANAGER Pages/Components: ${rolePages.MANAGER.length}`);
console.log(`EMPLOYEE Pages/Components: ${rolePages.EMPLOYEE.length}`);
console.log(`CANDIDATE Pages/Components: ${rolePages.CANDIDATE.length}`);
console.log(`SHARED / PUBLIC Pages: ${rolePages.SHARED_OR_PUBLIC.length}`);
const totalPagesAudited = Object.values(rolePages).reduce((sum, arr) => sum + arr.length, 0);
console.log(`TOTAL AUDITED MODULES/PAGES: ${totalPagesAudited}\n`);

console.log('=== 2. BUTTONS AUDIT ===');
console.log(`Total Buttons Audited: ${totalButtons}`);
console.log(`Standardized Buttons: ${standardizedButtons} (${((standardizedButtons / totalButtons) * 100).toFixed(1)}%)`);
console.log(`Icon / Compact Buttons: ${adHocButtons}`);
console.log('Top Button Text Labels:');
const topLabels = Object.entries(buttonTextSamples).sort((a,b) => b[1] - a[1]).slice(0, 15);
topLabels.forEach(([txt, cnt]) => console.log(`  - "${txt}": ${cnt}`));

console.log('\n=== 3. MODALS & DRAWERS AUDIT ===');
console.log(`Total Modal Usages Found: ${modalUsages}`);
console.log(`Unique Canonical Modal Types: ${Array.from(modalComponentTypes).join(', ')}`);

console.log('\n=== 4. POTENTIAL MOBILE-BREAKING FIXED WIDTHS (>360px without responsive prefix) ===');
console.log(`Found: ${mobileBreakingWidths.length}`);
mobileBreakingWidths.slice(0, 10).forEach(w => console.log(`  [${w.file}:${w.line}] ${w.snippet}`));

console.log('\n=== 5. MATH.RANDOM USAGE ===');
console.log(`Found: ${mathRandomUsages.length}`);
mathRandomUsages.slice(0, 10).forEach(m => console.log(`  [${m.file}:${m.line}] ${m.snippet}`));

console.log('\n=== 6. LOCALSTORAGE USAGE ===');
console.log(`Found: ${localStorageUsages.length}`);
const storageKeys = new Set();
localStorageUsages.forEach(u => {
  const match = u.snippet.match(/localStorage\.(?:getItem|setItem|removeItem)\(['"]([^'"]+)['"]/);
  if (match) storageKeys.add(match[1]);
});
console.log(`Distinct LocalStorage Keys: ${Array.from(storageKeys).join(', ')}`);

console.log('\n=== 7. MOCK DATA VARIABLES USAGE ===');
console.log(`Found: ${mockUsages.length}`);
mockUsages.slice(0, 10).forEach(m => console.log(`  [${m.file}:${m.line}] ${m.snippet}`));
