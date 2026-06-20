const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// ── 1. Agregar constantes globales de pasillos antes de PisosView ─────────
const pisosViewMarker = '// ── PISOS VIEW ─────────────────────────────────────────────\nfunction PisosView(';
const pasilloDefs = `// ── PASILLOS: constantes globales ───────────────────────────────────────
var PASILLO_PARTIDAS=[
  'Instalaciones eléctricas en tabiques o muros',
  'Instalaciones sanitarias en tabiques o muros',
  'Huinchas en tabiques',
  'Instalación de ductos de extracción',
  'Instalación de tuberías de clima',
  'Instalaciones eléctricas en pasillo',
  'Agua potable',
  'Red seca',
  'Red húmeda',
  'Peinetas de agua potable'
];
var PASILLO_SECTORES=[
  {key:'san_antonio',label:'San Antonio'},
  {key:'huerfanos',label:'Huérfanos'}
];
// Pisos que tienen pasillos configurados (se puede ampliar)
var PASILLO_PISOS=['2'];
var PASILLO_PISO_LABELS={'2':'Piso 2'};

// ── PISOS VIEW ─────────────────────────────────────────────
function PisosView(`;

if (!html.includes(pisosViewMarker)) { console.error('ERROR: PisosView marker no encontrado'); process.exit(1); }
html = html.replace(pisosViewMarker, pasilloDefs);
console.log('✓ Constantes de pasillos inyectadas');

// ── 2. Agregar estados de pasillos en PisosView ───────────────────────────
const oldPisosStates = `  const[floor,sf]=useState(null);
  const[dep,sd]=useState(null);
  const[hideDone,shd]=useState(false);
  const[fase,sfase]=useState('all');
  const[filt,sfilt]=useState('all');`;
const newPisosStates = `  const[floor,sf]=useState(null);
  const[dep,sd]=useState(null);
  const[hideDone,shd]=useState(false);
  const[fase,sfase]=useState('all');
  const[filt,sfilt]=useState('all');
  const[pasilloSaves,setPasilloSaves]=useState(function(){
    try{return JSON.parse(localStorage.getItem('pasillos_v1')||'{}');}catch(e){return{};}
  });
  const[selPasillo,setSelPasillo]=useState(null);`;

if (!html.includes(oldPisosStates)) { console.error('ERROR: estados de PisosView no encontrados'); process.exit(1); }
html = html.replace(oldPisosStates, newPisosStates);
console.log('✓ Estados de pasillos agregados a PisosView');

// ── 3. Agregar función savePasillo antes del return de PisosView ──────────
const pisosReturnMarker = '  var comp=0,inpr=0,pend=0;';
const savePasilloFn = `  function savePasillo(pisoKey,secKey,idx,pct){
    setPasilloSaves(function(prev){
      var next=JSON.parse(JSON.stringify(prev));
      if(!next[pisoKey])next[pisoKey]={};
      if(!next[pisoKey][secKey])next[pisoKey][secKey]={};
      next[pisoKey][secKey][idx]=pct;
      try{localStorage.setItem('pasillos_v1',JSON.stringify(next));}catch(e){}
      toast&&toast('✓ Guardado');
      return next;
    });
  }
  function getPasilloV(pisoKey,secKey,idx){
    return Math.round(((pasilloSaves[pisoKey]||{})[secKey]||{})[idx]||0);
  }
  function getPasilloSecPct(pisoKey,secKey){
    var done=0;
    PASILLO_PARTIDAS.forEach(function(_,i){if(getPasilloV(pisoKey,secKey,i)>=100)done++;});
    return PASILLO_PARTIDAS.length?Math.round(done/PASILLO_PARTIDAS.length*100):0;
  }
  function getPasilloPisoPct(pisoKey){
    var done=0,total=PASILLO_SECTORES.length*PASILLO_PARTIDAS.length;
    PASILLO_SECTORES.forEach(function(s){
      PASILLO_PARTIDAS.forEach(function(_,i){if(getPasilloV(pisoKey,s.key,i)>=100)done++;});
    });
    return total?Math.round(done/total*100):0;
  }
  var canEditP=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra'||auth.role==='Supervisor');
  var comp=0,inpr=0,pend=0;`;

if (!html.includes(pisosReturnMarker)) { console.error('ERROR: return marker de PisosView no encontrado'); process.exit(1); }
html = html.replace(pisosReturnMarker, savePasilloFn);
console.log('✓ Funciones de pasillos inyectadas');

// ── 4. Inyectar sección PASILLOS y modal al final del return de PisosView ─
// El return de PisosView cierra con:  "    })\n  );\n}\nconst PLAN="
const pisosViewEnd = `    })\n  );\n}\nconst PLAN=`;
const pasillosSection = `    }),
    // ── SECCIÓN PASILLOS ──────────────────────────────────────────────────
    h('div',{style:{background:'var(--bg2)',border:'1px solid rgba(168,85,247,.25)',
      borderRadius:12,padding:'12px 14px',marginTop:10}},
      h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:10}},
        h('span',{style:{background:'rgba(168,85,247,.15)',color:'var(--purple)',
          padding:'2px 8px',borderRadius:6,fontSize:9,fontWeight:700,
          letterSpacing:'.07em'}},'PASILLOS'),
        h('span',{style:{fontSize:12,fontWeight:700,color:'var(--text)',flex:1}},
          'Control de Avance — Pasillos por Piso'),
        h('span',{style:{fontSize:10,color:'var(--text3)'}},
          PASILLO_SECTORES.map(function(s){return s.label;}).join(' · '))
      ),
      PASILLO_PISOS.map(function(pisoKey){
        var pct=getPasilloPisoPct(pisoKey);
        var col=pct>=100?'var(--green)':pct>0?'var(--amber)':'var(--text3)';
        return h('div',{key:pisoKey,
          onClick:function(){setSelPasillo(pisoKey);},
          style:{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
            borderRadius:9,cursor:'pointer',marginBottom:4,
            background:'var(--bg3)',border:'1px solid rgba(168,85,247,.2)',
            transition:'background .12s'},
          onMouseEnter:function(e){e.currentTarget.style.background='rgba(168,85,247,.08)';},
          onMouseLeave:function(e){e.currentTarget.style.background='var(--bg3)';}},
          h('span',{style:{fontSize:13,fontWeight:700,color:'var(--purple)',
            minWidth:56,fontFamily:'var(--mono)'}},PASILLO_PISO_LABELS[pisoKey]||('Piso '+pisoKey)),
          h('div',{style:{flex:1}},
            h('div',{style:{height:7,background:'var(--bg2)',borderRadius:4,overflow:'hidden'}},
              h('div',{style:{height:'100%',borderRadius:4,
                background:pct>=100?'var(--green)':pct>0?'rgba(168,85,247,.7)':'transparent',
                width:Math.max(pct,0)+'%',transition:'width .35s'}}))
          ),
          h('span',{style:{fontSize:13,fontWeight:700,color:col,
            minWidth:40,textAlign:'right',fontFamily:'var(--mono)'}},pct+'%'),
          h('div',{style:{display:'flex',gap:6}},
            PASILLO_SECTORES.map(function(sec){
              var sp=getPasilloSecPct(pisoKey,sec.key);
              var sc=sp>=100?'var(--green)':sp>0?'var(--amber)':'var(--text3)';
              return h('span',{key:sec.key,style:{fontSize:9,color:sc,
                background:sp>=100?'rgba(34,197,94,.1)':'rgba(255,255,255,.04)',
                border:'1px solid '+(sp>=100?'rgba(34,197,94,.3)':'rgba(255,255,255,.08)'),
                borderRadius:5,padding:'1px 6px',fontWeight:700}},
                sec.label+' '+sp+'%');
            })
          ),
          h('span',{style:{color:'var(--text3)',fontSize:12}},'▶')
        );
      })
    ),
    // ── MODAL DETALLE PASILLOS ────────────────────────────────────────────
    selPasillo&&h('div',{style:{position:'fixed',inset:0,
      background:'rgba(0,0,0,.78)',zIndex:1000,display:'flex',
      alignItems:'flex-start',justifyContent:'center',
      padding:'10px 8px',overflowY:'auto'},
      onClick:function(e){if(e.target===e.currentTarget)setSelPasillo(null);}},
      h('div',{style:{background:'var(--bg2)',borderRadius:14,width:'100%',
        maxWidth:680,border:'1px solid rgba(168,85,247,.35)',overflow:'hidden'}},
        // Header
        h('div',{style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',gap:10,
          background:'rgba(168,85,247,.06)'}},
          h('span',{style:{fontSize:20}},'🏢'),
          h('div',{style:{flex:1}},
            h('div',{style:{fontSize:15,fontWeight:800,color:'var(--purple)'}},
              (PASILLO_PISO_LABELS[selPasillo]||('Piso '+selPasillo))+' — Pasillos'),
            h('div',{style:{fontSize:11,color:'var(--text3)'}},
              PASILLO_PARTIDAS.length+' partidas · '+PASILLO_SECTORES.length+' sectores')
          ),
          // Resumen por sector en el header
          h('div',{style:{display:'flex',gap:8}},
            PASILLO_SECTORES.map(function(sec){
              var sp=getPasilloSecPct(selPasillo,sec.key);
              var sc=sp>=100?'var(--green)':sp>0?'var(--amber)':'var(--text3)';
              return h('div',{key:sec.key,style:{textAlign:'center'}},
                h('div',{style:{fontSize:14,fontWeight:800,color:sc,
                  fontFamily:'var(--mono)'}},sp+'%'),
                h('div',{style:{fontSize:9,color:'var(--text3)'}},sec.label));
            })
          ),
          h('button',{onClick:function(){setSelPasillo(null);},
            style:{background:'var(--bg3)',border:'1px solid var(--border)',
              borderRadius:8,padding:'4px 12px',color:'var(--text2)',
              cursor:'pointer',fontSize:16,lineHeight:1}},'✕')
        ),
        // Tabla de partidas
        h('div',{style:{overflowY:'auto',maxHeight:'70vh'}},
          // Header de columnas
          h('div',{style:{display:'grid',
            gridTemplateColumns:'1fr '+PASILLO_SECTORES.map(function(){return '160px';}).join(' '),
            background:'rgba(168,85,247,.08)',
            borderBottom:'2px solid rgba(168,85,247,.25)',
            position:'sticky',top:0,zIndex:10}},
            h('div',{style:{padding:'8px 12px',fontSize:9,fontWeight:700,
              color:'var(--text3)',letterSpacing:'.07em'}},'PARTIDA'),
            PASILLO_SECTORES.map(function(sec){
              return h('div',{key:sec.key,style:{padding:'8px 10px',textAlign:'center',
                borderLeft:'1px solid rgba(168,85,247,.2)',
                fontSize:11,fontWeight:700,color:'var(--purple)'}},sec.label);
            })
          ),
          // Filas de partidas
          PASILLO_PARTIDAS.map(function(nombre,idx){
            var isEven=idx%2===0;
            var bg=isEven?'var(--bg3)':'rgba(0,0,0,.04)';
            return h('div',{key:idx,style:{display:'grid',
              gridTemplateColumns:'1fr '+PASILLO_SECTORES.map(function(){return '160px';}).join(' '),
              background:bg,borderBottom:'1px solid rgba(255,255,255,.05)'}},
              // Nombre de partida
              h('div',{style:{padding:'8px 12px',display:'flex',alignItems:'center',gap:6}},
                h('span',{style:{fontSize:9,fontWeight:700,color:'rgba(168,85,247,.5)',
                  fontFamily:'var(--mono)',minWidth:20}},'#'+(idx+1)),
                h('span',{style:{fontSize:10,color:'var(--text)'}},nombre)
              ),
              // Botones por sector
              PASILLO_SECTORES.map(function(sec){
                var v=getPasilloV(selPasillo,sec.key,idx);
                var col=v>=100?'var(--green)':v>0?'var(--amber)':'var(--text3)';
                return h('div',{key:sec.key,style:{padding:'6px 8px',
                  borderLeft:'1px solid rgba(168,85,247,.15)',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:3}},
                  h('div',{style:{fontSize:11,fontWeight:700,color:col,
                    fontFamily:'var(--mono)',marginBottom:2}},v+'%'),
                  canEditP
                    ?h('div',{style:{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}},
                        [0,25,50,75,100].map(function(pv){
                          var active=v===pv;
                          var btnCol=pv>=100?'34,197,94':pv>=75?'34,197,94':pv>=50?'245,158,11':pv>=25?'239,120,68':'100,116,139';
                          return h('button',{key:pv,
                            onClick:function(){savePasillo(selPasillo,sec.key,idx,pv);},
                            style:{padding:'3px 6px',borderRadius:5,fontSize:9,cursor:'pointer',
                              border:'1px solid '+(active?'rgba('+btnCol+',.7)':'var(--border)'),
                              background:active?'rgba('+btnCol+',.18)':'var(--bg2)',
                              color:active?'rgb('+btnCol+')':'var(--text3)',
                              fontWeight:active?700:400,minWidth:32}},
                            pv+'%');
                        })
                      )
                    :null
                );
              })
            );
          })
        ),
        // Footer resumen
        h('div',{style:{padding:'10px 18px',borderTop:'1px solid var(--border)',
          display:'flex',gap:12,flexWrap:'wrap',background:'rgba(168,85,247,.04)'}},
          PASILLO_SECTORES.map(function(sec){
            var done=0,partial=0;
            PASILLO_PARTIDAS.forEach(function(_,i){
              var v=getPasilloV(selPasillo,sec.key,i);
              if(v>=100)done++;else if(v>0)partial++;
            });
            return h('div',{key:sec.key,style:{display:'flex',alignItems:'center',gap:8,flex:1}},
              h('div',{style:{fontSize:11,fontWeight:700,color:'var(--purple)',flex:1}},sec.label),
              h('span',{style:{fontSize:10,color:'var(--green)',fontWeight:600}},done+' ✓'),
              h('span',{style:{fontSize:10,color:'var(--amber)',fontWeight:600}},partial+' ◑'),
              h('span',{style:{fontSize:10,color:'var(--text3)'}},
                (PASILLO_PARTIDAS.length-done-partial)+' ○')
            );
          })
        )
      )
    )
  );
}
const PLAN=`;

if (!html.includes(pisosViewEnd)) { console.error('ERROR: cierre de PisosView no encontrado'); process.exit(1); }
html = html.replace(pisosViewEnd, pasillosSection);
console.log('✓ Sección PASILLOS y modal inyectados');

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
