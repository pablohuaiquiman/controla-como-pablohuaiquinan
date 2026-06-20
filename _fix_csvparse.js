// Corrección: los escapes \r\n dentro del template literal se convirtieron en bytes reales.
// Este script reemplaza la función parseCSVRaw rota con una versión correcta
// usando String.fromCharCode para evitar el problema de escape en template literals.
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// Buscar la función parseCSVRaw con el contenido roto (caracteres de control reales)
// y reemplazarla por una versión que usa String.fromCharCode (sin escapes problemáticos)
const brokenStart = 'function parseCSVRaw(text){';
const brokenEnd = "    return{headers:splitLine(lines[0]),\n           rows:lines.slice(1).map(function(l){return splitLine(l);})};\n  }";

const idxStart = html.indexOf(brokenStart);
if (idxStart < 0) { console.error('ERROR: parseCSVRaw no encontrada'); process.exit(1); }

// Encontrar el final de la función
const idxEnd = html.indexOf(brokenEnd, idxStart);
if (idxEnd < 0) { console.error('ERROR: fin de parseCSVRaw no encontrado'); process.exit(1); }

const endFull = idxEnd + brokenEnd.length;

// Versión corregida: usa String.fromCharCode para CR y LF
// Así evitamos completamente los problemas con escapes en template literals
const fixedFn = `function parseCSVRaw(text){
    var LF=String.fromCharCode(10),CR=String.fromCharCode(13);
    var lines=text.replace(new RegExp(CR+LF,'g'),LF).replace(new RegExp(CR,'g'),LF)
      .split(LF).filter(function(l){return l.trim();});
    if(!lines.length)return{headers:[],rows:[]};
    var delim=lines[0].indexOf(';')>=0?';':',';
    function splitLine(line){
      var res=[],cur='',inQ=false;
      for(var i=0;i<line.length;i++){
        var c=line[i];
        if(c==='"'){inQ=!inQ;}
        else if(c===delim&&!inQ){res.push(cur.trim());cur='';}
        else cur+=c;
      }
      res.push(cur.trim());
      return res;
    }
    return{headers:splitLine(lines[0]),
           rows:lines.slice(1).map(function(l){return splitLine(l);})};
  }`;

html = html.slice(0, idxStart) + fixedFn + html.slice(endFull);
console.log('✓ parseCSVRaw corregida (usando String.fromCharCode)');

// También verificar y corregir normH si tiene el mismo problema con los acentos
// Los reemplazos de acentos deberían estar bien porque son literales de string,
// pero vamos a verificar que la función existe correctamente
if (html.includes('function normH(h2)')) {
  console.log('✓ normH presente');
} else {
  console.error('AVISO: normH no encontrada');
}

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
