/* =============================================================================
   generate-icons.mjs — rasterize the maskable brand icon (brand/icon-source.svg)
   into the PWA / iOS PNGs. Run manually only when the logo changes:

     npm i --no-save sharp && node scripts/generate-icons.mjs

   `sharp` is intentionally NOT a project dependency (offline-first app, minimal
   deps); install it ad hoc just to regenerate the assets below.
   ============================================================================= */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "brand", "icon-source.svg");

const OUTPUTS = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

const svg = await readFile(src);

for (const { file, size } of OUTPUTS) {
  const png = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  await writeFile(join(root, "public", file), png);
  console.log(`✓ public/${file} (${size}×${size})`);
}
