const fs = require('fs');
const path = require('path');

const replacements = [
  [/\bnotes: input\.notes\b/g, 'description: input.description'],
  [/\bnotes: formData\.get\("notes"\)\b/g, 'description: formData.get("description")'],
  [/\bnotes: String\b/g, 'description: String'],
  [/\b@\/lib\/utils\/edad\b/g, '@/lib/utils/age']
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  if (filePath.endsWith('queries.ts')) {
    content = content.replace(/paymentChannel: "YAPE" \| "PLIN" \| "EFECTIVO" \| "TRANSFERENCIA" \| "BCP" \| "BBVA" \| "INTERBANK"/g, 'paymentChannel: string');
  }

  // Specifically fix categories
  if (filePath.includes('categorias') || filePath.includes('system-dashboard') || filePath.includes('categories')) {
    content = content.replace(/\bnotes:/g, 'description:');
    content = content.replace(/\bnotes\?/g, 'description?');
  }

  // Replace presidentBirthdate if not done
  content = content.replace(/presidenteFechaNacimiento/g, 'presidentBirthdate');

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
console.log('Refactoring 6 complete.');
