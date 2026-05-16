const fs = require('fs');
let code = fs.readFileSync('src/lib/actions/system-dashboard.ts', 'utf8');

// fix getters
code = code.replace(/const sede = asText\(formData\.get\("sede"\)\);/g, 'const courtAddress = asText(formData.get("courtAddress"));');
code = code.replace(/const contacto = asText\(formData\.get\("contacto"\)\);/g, 'const adminPhone = asText(formData.get("adminPhone"));');
code = code.replace(/const sede = \(formData\.get\("sede"\) as string \| null\)\?\.trim\(\);/g, 'const courtAddress = (formData.get("courtAddress") as string | null)?.trim();');
code = code.replace(/const contacto = \(formData\.get\("contacto"\) as string \| null\)\?\.trim\(\);/g, 'const adminPhone = (formData.get("adminPhone") as string | null)?.trim();');

// fix zod parse
code = code.replace(/sede,/g, 'courtAddress,');
code = code.replace(/contacto: contacto \|\| null,/g, 'adminPhone: adminPhone || null,');

// fix db insert/update values
code = code.replace(/courtAddress: sede\.slice\(0, 250\),/g, 'courtAddress: courtAddress.slice(0, 250),');
code = code.replace(/adminPhone: contacto \? contacto\.slice\(0, 15\) : null,/g, 'adminPhone: adminPhone ? adminPhone.slice(0, 15) : null,');

code = code.replace(/courtAddress: sede \? sede\.slice\(0, 250\) : null,/g, 'courtAddress: courtAddress ? courtAddress.slice(0, 250) : null,');

// Also president names in the DB insertion where they use asText()
code = code.replace(/asText\(formData\.get\("presidentName"\)\) \|\|\s*asText\(formData\.get\("presidentName"\)\)/g, 'asText(formData.get("presidentName"))');
code = code.replace(/asText\(formData\.get\("secretaryName"\)\) \|\|\s*asText\(formData\.get\("secretaryName"\)\)/g, 'asText(formData.get("secretaryName"))');
code = code.replace(/asText\(formData\.get\("treasurerName"\)\) \|\|\s*asText\(formData\.get\("treasurerName"\)\)/g, 'asText(formData.get("treasurerName"))');

fs.writeFileSync('src/lib/actions/system-dashboard.ts', code);
console.log('system-dashboard fully updated');
