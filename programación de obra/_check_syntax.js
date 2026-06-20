// Busca strings JS con saltos de línea literales (error de escape en template literals)
const fs = require('fs');
const html = fs.readFileSync('control_victoria_v9.html', 'utf8').replace(/\r\n/g, '\n');
const lines = html.split('\n');
const errors = [];

// Detectar strings de una sola línea que quedaron abiertos (comillas impares)
// Método simple: si la línea tiene un número impar de comillas simples NO escapadas
// y la siguiente línea no es solo cierre, hay un string roto.
for (let i = 4700; i < 5700; i++) {
  const line = lines[i] || '';
  // Contar comillas simples sin escapar
  let inStr = false, count = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === "'" && line[j-1] !== '\\') {
      inStr = !inStr;
      count++;
    }
  }
  if (count % 2 === 1) {
    errors.push(`Línea ${i+1}: comillas impares -> ${line.trim().slice(0,90)}`);
  }
}

if (errors.length === 0) {
  console.log('✓ Sin strings rotos detectados en el rango 4700-5700');
} else {
  console.log(`⚠ ${errors.length} posible(s) string(s) roto(s):`);
  errors.forEach(e => console.log('  ' + e));
}
