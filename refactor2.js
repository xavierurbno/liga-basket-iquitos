const fs = require('fs');
const path = require('path');

const replacements = [
  [/\btipo\b/g, 'type'],
  [/\bmonto\b/g, 'amount'],
  [/\bfecha\b/g, 'transactionDate'],
  [/\bconcepto\b/g, 'concept'],
  [/\bmetodoPago\b/g, 'paymentChannel'],
  [/\bcanalPago\b/g, 'paymentChannel'],
  [/\bdescripcion\b/g, 'notes'],
  [/\bobservaciones\b/g, 'notes'],
  [/\bnombres\b/g, 'name'],
  [/\bapellidos\b/g, 'lastname'],
  [/\bfechaNacimiento\b/g, 'birthdate'],
  [/\bgenero\b/g, 'gender'],
  [/\bcategoria\b/g, 'category'],
  [/\bposicion\b/g, 'position'],
  [/\bnumeroCamiseta\b/g, 'jerseyNumber'],
  [/\btalla\b/g, 'size'],
  [/\bfotoUrl\b/g, 'photoUrl'],
  [/\bestado\b/g, 'status'],
  [/\bnumeroFicha\b/g, 'carnetNumber'],
  [/\bnombreTutor\b/g, 'tutorName'],
  [/\bdniTutor\b/g, 'tutorDni'],
  [/\btelefonoTutor\b/g, 'tutorPhone'],
  [/\bgrupoSanguineo\b/g, 'bloodType'],
  [/\balergias\b/g, 'allergies'],
  [/\bcontactoEmergencia\b/g, 'emergencyContact'],
  [/\bjugadorId\b/g, 'playerId'],
  [/\bcomprobanteUrl\b/g, 'proofUrl'],
  [/\bregistradoPor\b/g, 'registeredBy'],
  [/\bfechaMovimiento\b/g, 'transactionDate'],
  [/\bcodigoOperacion\b/g, 'operationCode'],
  [/\bentrenadorNombre\b/g, 'coachName'],
  [/\bentrenadorApellidos\b/g, 'coachLastname'],
  [/\bentrenadorDni\b/g, 'coachDni'],
  [/\bentrenadorFechaNacimiento\b/g, 'coachBirthdate'],
  [/\bentrenadorContacto\b/g, 'coachContact'],
  [/\bentrenadorCorreo\b/g, 'coachEmail'],
  [/\bentrenadorFotoUrl\b/g, 'coachPhotoUrl'],
  [/\bdelegadoNombre\b/g, 'delegateName'],
  [/\bdelegadoApellidos\b/g, 'delegateLastname'],
  [/\bdelegadoDni\b/g, 'delegateDni'],
  [/\bdelegadoFechaNacimiento\b/g, 'delegateBirthdate'],
  [/\bdelegadoContacto\b/g, 'delegateContact'],
  [/\bdelegadoCorreo\b/g, 'delegateEmail'],
  [/\bdelegadoFotoUrl\b/g, 'delegatePhotoUrl'],
  [/\bnombreArchivo\b/g, 'fileName'],
  [/\burlPublica\b/g, 'publicUrl'],
  [/\btamanoBytes\b/g, 'sizeBytes'],
  [/\bverificado\b/g, 'verified'],
  [/\bverificadoPor\b/g, 'verifiedBy'],
  [/\bfechaVerificacion\b/g, 'verificationDate'],
  [/\bfechaVencimiento\b/g, 'expirationDate'],
  [/\bidentificadorCorto\b/g, 'shortIdentifier'],
  [/\bcorrelativo\b/g, 'correlative']
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
      // Don't modify schema.ts
      if (!filePath.includes('schema.ts')) {
        processFile(filePath);
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Refactoring 2 complete.');
