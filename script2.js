const fs = require('fs');
let code = fs.readFileSync('src/lib/actions/system-dashboard.ts', 'utf8');

code = code.replace(/sede: z\.string\(\)\.trim\(\)\.min\(1, "Sede requerida"\),/g, 'courtAddress: z.string().trim().min(1, "Sede requerida"),');
code = code.replace(/contacto: optionalText,/g, 'adminPhone: optionalText,');
code = code.replace(/const sede = asText\(formData\.get\("courtAddress"\)\);/g, 'const courtAddress = asText(formData.get("courtAddress"));');
code = code.replace(/const contacto = asText\(formData\.get\("adminPhone"\)\);/g, 'const adminPhone = asText(formData.get("adminPhone"));');
code = code.replace(/sede,/g, 'courtAddress,');
code = code.replace(/contacto: contacto \|\| null,/g, 'adminPhone: adminPhone || null,');

// Zod schema changes
code = code.replace(/presidenteNombres/g, 'presidentName');
code = code.replace(/secretarioNombres/g, 'secretaryName');
code = code.replace(/tesoreroNombres/g, 'treasurerName');
code = code.replace(/presidenteFotoFile/g, 'presidentPhotoFile');
code = code.replace(/secretarioFotoFile/g, 'secretaryPhotoFile');
code = code.replace(/tesoreroFotoFile/g, 'treasurerPhotoFile');
code = code.replace(/presidenteFotoSubida/g, 'presidentPhotoSubida');
code = code.replace(/secretarioFotoSubida/g, 'secretaryPhotoSubida');
code = code.replace(/tesoreroFotoSubida/g, 'treasurerPhotoSubida');

fs.writeFileSync('src/lib/actions/system-dashboard.ts', code);
console.log('system-dashboard updated');
