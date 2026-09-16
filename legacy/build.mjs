// build.mjs — genera dist/index.html: un único archivo autocontenido
// (CSS y JS incrustados) sin dependencias ni peticiones locales.
// Uso: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");

// Orden de scripts idéntico al de index.html.
const scriptOrder = [
  "js/config.js",
  "js/util.js",
  "js/icons.js",
  "js/storage.js",
  "js/logic.js",
  "js/ui.js",
  "js/app.js",
];

const css = read("css/styles.css");
const js = scriptOrder.map(read).join("\n;\n");
let html = read("index.html");

// 1) Sustituir el <link> del CSS local por un <style> incrustado.
html = html.replace(
  /\s*<link rel="stylesheet" href="css\/styles\.css">/,
  "\n  <style>\n" + css + "\n  </style>"
);

// 2) Quitar los 7 <script src="js/..."> y el comentario, y poner un solo <script>.
html = html.replace(
  /\s*<!-- Orden importa[\s\S]*?<\/script>\s*<\/body>/,
  "\n  <script>\n" + js + "\n  </script>\n</body>"
);

// Verificación defensiva: no debe quedar ninguna referencia a archivos locales.
if (/href="css\//.test(html) || /src="js\//.test(html)) {
  throw new Error("El build todavía referencia archivos locales; revisá las expresiones de reemplazo.");
}

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html, "utf8");

const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
console.log(`dist/index.html generado (${kb} KB, autocontenido).`);
