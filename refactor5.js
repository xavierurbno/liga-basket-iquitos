const fs = require('fs');
const path = require('path');

const replacements = [
  [/\bnotes:\b/g, 'description:'],
  [/\bpresidenteFechaNacimiento\b/g, 'presidentBirthdate'],
  [/\bsecretarioNombre\b/g, 'secretaryName'],
  [/\bsecretarioApellidos\b/g, 'secretaryLastname'],
  [/\bsecretarioDni\b/g, 'secretaryDni'],
  [/\bsecretarioFechaNacimiento\b/g, 'secretaryBirthdate'],
  [/\bsecretarioContacto\b/g, 'secretaryContact'],
  [/\bsecretarioCorreo\b/g, 'secretaryEmail'],
  [/\bsecretarioFotoUrl\b/g, 'secretaryPhotoUrl'],
  [/\btesoreroNombre\b/g, 'treasurerName'],
  [/\btesoreroApellidos\b/g, 'treasurerLastname'],
  [/\btesoreroDni\b/g, 'treasurerDni'],
  [/\btesoreroFechaNacimiento\b/g, 'treasurerBirthdate'],
  [/\btesoreroContacto\b/g, 'treasurerContact'],
  [/\btesoreroCorreo\b/g, 'treasurerEmail'],
  [/\btesoreroFotoUrl\b/g, 'treasurerPhotoUrl'],
  [/\bpresidenteContacto\b/g, 'presidentContact'],
  [/\bpresidenteCorreo\b/g, 'presidentEmail'],
  [/\bpresidenteFotoUrl\b/g, 'presidentPhotoUrl'],
  [/\b@\/lib\/utils\/edad\b/g, '@/lib/utils/age']
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  if (filePath.endsWith('queries.ts')) {
    content = content.replace(/paymentChannel: "YAPE" \| "PLIN" \| "EFECTIVO"/g, 'paymentChannel: string');
  }

  // Only apply 'notes' replacement carefully
  // Actually, 'notes' -> 'description' can be dangerous if it's treasury notes.
  // I'll do this one manually or via script specifically for category pages/actions.

  for (const [regex, replacement] of replacements) {
    if (regex.source === '\\bnotes:\\b') {
      if (filePath.includes('categorias') || filePath.includes('system-dashboard')) {
        // do it
        content = content.replace(regex, replacement);
      }
    } else {
      content = content.replace(regex, replacement);
    }
  }

  // Restore treasury notes
  if (filePath.includes('treasury.ts')) {
    content = content.replace(/\bdescription:\b/g, 'notes:');
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
console.log('Refactoring 5 complete.');
