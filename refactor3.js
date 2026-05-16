const fs = require('fs');
const path = require('path');

const replacements = [
  [/\bcategoriaId\b/g, 'categoryId'],
  [/\btelefono\b/g, 'phone'],
  [/\bINGRESO\b/g, 'income'],
  [/\bEGRESO\b/g, 'expense'],
  [/\bclubNombre\b/g, 'clubName'],
  [/\borganizationId: null,\n/g, ''],
  [/\borganizationId\b/g, ''], // just in case it's in types
  [/\b@\/lib\/utils\/edad\b/g, '@/lib/utils/age'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      if (!filePath.includes('schema.ts')) {
        processFile(filePath);
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Refactoring 3 complete.');
