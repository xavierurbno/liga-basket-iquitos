const fs = require('fs');

function fixNotes(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\bnotes\b/g, 'description');
  fs.writeFileSync(file, content, 'utf8');
}

fixNotes('src/app/(dashboard)/dashboard/clubes/[clubId]/categorias/[categoriaId]/page.tsx');
fixNotes('src/app/(dashboard)/dashboard/clubes/[clubId]/page.tsx');
fixNotes('src/components/system/CategoryWizardModal.tsx'); // Probably where CategoriaWizardInitialData is defined

console.log('Fixed notes');
