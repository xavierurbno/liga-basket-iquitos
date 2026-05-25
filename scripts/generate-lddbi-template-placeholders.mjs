/**
 * Genera PNG provisionales hasta que subas el mockup oficial.
 * node scripts/generate-lddbi-template-placeholders.mjs
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "carnet", "lddbi-template");
const W = 1011;
const H = 638;
const PRIMARY = "#1e3a5f";
const ACCENT = "#0d9488";

async function card(svgBody, name) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${svgBody}
</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(path.join(OUT, name), buf);
  console.log("Wrote", name);
}

await fs.mkdir(OUT, { recursive: true });

await card(
  `
  <rect width="100%" height="19%" fill="${PRIMARY}"/>
  <rect y="19%" width="100%" height="70%" fill="#ffffff"/>
  <rect y="89%" width="100%" height="11%" fill="${ACCENT}"/>
  <text x="50%" y="10%" text-anchor="middle" fill="#fff" font-family="Arial" font-size="28" font-weight="bold">ANVERSO — reemplaza con tu mockup PNG</text>
  <text x="50%" y="55%" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="22">Zona datos + foto (dinámico en código)</text>
`,
  "anverso-template.png",
);

await card(
  `
  <rect width="100%" height="20%" fill="${PRIMARY}"/>
  <rect y="20%" width="100%" height="69%" fill="#ffffff"/>
  <rect y="89%" width="100%" height="11%" fill="${PRIMARY}"/>
  <text x="50%" y="10%" text-anchor="middle" fill="#fff" font-family="Arial" font-size="28" font-weight="bold">REVERSO — reemplaza con tu mockup PNG</text>
  <text x="12%" y="12%" fill="#fff" font-family="Arial" font-size="18">QR</text>
  <rect x="3%" y="4%" width="14%" height="22%" fill="#fff" stroke="#cbd5e1"/>
`,
  "reverso-template.png",
);
