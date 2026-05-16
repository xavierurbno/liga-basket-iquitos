const fs = require('fs');
const path = require('path');

const replacements = [
  [/\bnotes: input.notes\b/g, 'description: input.description'],
  [/\bnotes: formData.get\("notes"\)\b/g, 'description: formData.get("description")'],
  [/\bdireccion\b/g, 'address'],
  [/\bpresidenteDni\b/g, 'presidentDni'],
  [/\b@\/lib\/actions\/documentosHistorial\b/g, '@/lib/actions/documentHistory'],
  [/\b@\/lib\/actions\/jugadores\b/g, '@/lib/actions/players'],
  [/\b@\/lib\/actions\/treasury\b/g, '@/lib/actions/treasury'],
  [/\b@\/lib\/utils\/edad\b/g, '@/lib/utils/age']
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  // Custom fixes for specific files
  if (filePath.endsWith('queries.ts')) {
    content = content.replace(/paymentChannel: "YAPE" \| "PLIN" \| "EFECTIVO"/g, 'paymentChannel: any');
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
console.log('Refactoring 4 complete.');
