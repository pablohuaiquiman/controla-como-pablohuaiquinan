// Corrige strings con saltos de línea literales dentro de comillas simples
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// ── Fix 1: string roto en handleImportCSV (línea 4796) ───────────────────
// El \n dentro de una plantilla se convirtió en salto real dentro de string JS
const broken1 = "          error:'No se encontró columna de descripción.\nColumnas detectadas: '+parsed.headers.join(' | ')});";
const fixed1  = "          error:'No se encontró columna de descripción. Columnas: '+parsed.headers.join(' | ')});";

if (!html.includes(broken1)) {
  console.error('ERROR: string roto 1 no encontrado');
  // Intentar búsqueda alternativa
  const idx = html.indexOf("error:'No se encontr");
  if (idx >= 0) {
    console.log('Contexto:', JSON.stringify(html.slice(idx, idx+120)));
  }
  process.exit(1);
}
html = html.replace(broken1, fixed1);
console.log('✓ Fix 1 aplicado');

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
