const fs = require('fs');
const path = require('path');

const replacements = [
  [/\bcategoriasClub\b/g, 'categories'],
  [/\bjugadores\b/g, 'players'],
  [/\bmovimientosCaja\b/g, 'treasury'],
  [/\bMovimientoCaja\b/g, 'Treasury'],
  [/\btransactions\b/g, 'treasury'],
  [/\bTransaction\b/g, 'Treasury'],
  [/\bdocumentosHistorial\b/g, 'documentHistory'],
  [/\bNuevoDocumentoHistorial\b/g, 'NewDocumentHistory'],
  [/\bNuevoClub\b/g, 'NewClub'],
  [/\bNuevaCategoriaClub\b/g, 'NewCategory'],
  [/\bNuevoJugador\b/g, 'NewPlayer'],
  [/\bNuevoMovimiento\b/g, 'NewTreasury'],
  [/\bNuevaTransaction\b/g, 'NewTreasury'],
  [/\bnombre\b/g, 'name'],
  [/\bfechaFundacion\b/g, 'foundationDate'],
  [/\bdireccionCancha\b/g, 'courtAddress'],
  [/\badminTelefono\b/g, 'adminPhone'],
  [/\bcodigoFederacion\b/g, 'federationCode'],
  [/\bpresidenteNombre\b/g, 'presidentName'],
  [/\bpresidenteApellidos\b/g, 'presidentLastname'],
  [/\bdistrito\b/g, 'district'],
  [/\brol\b/g, 'role'],
  [/\bactivo\b/g, 'active']
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
      // Don't modify schema.ts again
      if (!filePath.includes('schema.ts')) {
        processFile(filePath);
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Refactoring complete.');
