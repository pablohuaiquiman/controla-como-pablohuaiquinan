const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// ── 1. Agregar refs + estado del modal de importación ─────────────────────
const oldStates = `  var[guidesSec,setGuidesSec]=useState(null);
  var isAdmin=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra');`;

const newStates = `  var[guidesSec,setGuidesSec]=useState(null);
  var importCsvOfiRef=useRef(null);
  var importCsvBodRef=useRef(null);
  var[importModal,setImportModal]=useState(null); // {sec, items:[{name,qty,ud,sel}], error}
  var isAdmin=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra');`;

if (!html.includes(oldStates)) { console.error('ERROR: estados de guidesSec no encontrados'); process.exit(1); }
html = html.replace(oldStates, newStates);
console.log('✓ Refs e importModal agregados');

// ── 2. Agregar funciones de parseo CSV e importación ──────────────────────
const funcMarker = `    setTransferQtys({});setShowTransfer(false);
    toast&&toast('✓ Transferencia completada');
  }
  if(showUnits&&isAdmin){`;

const csvFns = `    setTransferQtys({});setShowTransfer(false);
    toast&&toast('✓ Transferencia completada');
  }
  // ── IMPORTAR CSV ICONSTRUYE ─────────────────────────────────────────────
  function parseCSVRaw(text){
    var lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n')
      .filter(function(l){return l.trim();});
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
  }
  function normH(h2){
    return (h2||'').toLowerCase().trim()
      .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
      .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
      .replace(/[úùü]/g,'u').replace(/ñ/g,'n');
  }
  function findCol(norms,patterns){
    for(var i=0;i<norms.length;i++){
      if(patterns.some(function(p){return norms[i].indexOf(p)>=0;}))return i;
    }
    return -1;
  }
  function handleImportCSV(file,sk){
    if(!file)return;
    var rd=new FileReader();
    rd.onload=function(ev){
      var parsed=parseCSVRaw(ev.target.result);
      if(!parsed.headers.length){
        setImportModal({sec:sk,items:[],error:'No se pudo leer el archivo. Verifica que sea CSV.'});
        return;
      }
      var norms=parsed.headers.map(normH);
      var ci={
        nombre:findCol(norms,['descripcion','nombre','detalle','item','glosa','material','articulo','producto','nombre del articulo']),
        cantidad:findCol(norms,['cantidad','cant','qty','cantidad despacho','cantidad pedida','ctd']),
        unidad:findCol(norms,['unidad','ud','um','unidad de medida','unidad medida','medida'])
      };
      if(ci.nombre<0){
        setImportModal({sec:sk,items:[],
          error:'No se encontró columna de descripción.\nColumnas detectadas: '+parsed.headers.join(' | ')});
        return;
      }
      var items=[];
      parsed.rows.forEach(function(row){
        var nm=(row[ci.nombre]||'').replace(/^"|"$/g,'').trim();
        if(!nm)return;
        var qtyRaw=ci.cantidad>=0?(row[ci.cantidad]||'0'):'0';
        var qty=parseFloat(qtyRaw.replace(/[^0-9.,\-]/g,'').replace(',','.'))||0;
        var ud=ci.unidad>=0?((row[ci.unidad]||'un').replace(/^"|"$/g,'').trim()||'un'):'un';
        if(!ud||ud.toLowerCase()==='null'||ud.toLowerCase()==='n/a')ud='un';
        items.push({name:nm,qty:qty,ud:ud,sel:qty>0});
      });
      setImportModal({sec:sk,items:items,error:null});
    };
    rd.readAsText(file,'UTF-8');
  }
  function confirmImport(){
    if(!importModal)return;
    var sk=importModal.sec;
    var s=Object.assign({},logData['__stock_'+sk]||{mats:[],guides:[]});
    var ms=(s.mats||[]).slice();
    importModal.items.forEach(function(it){
      if(!it.sel)return;
      var bi=ms.findIndex(function(m){return m.name===it.name&&m.ud===it.ud;});
      if(bi>=0)ms[bi]=Object.assign({},ms[bi],{qty:(ms[bi].qty||0)+it.qty});
      else ms.push({id:Date.now()+'_rnd'+Math.random().toString(36).slice(2),
        name:it.name,qty:it.qty,ud:it.ud});
    });
    saveStockSec(sk,Object.assign({},s,{mats:ms}));
    var cnt=importModal.items.filter(function(it){return it.sel;}).length;
    setImportModal(null);
    toast&&toast('✓ '+cnt+' material'+(cnt!==1?'es':'')+' importado'+(cnt!==1?'s':''));
  }
  if(showUnits&&isAdmin){`;

if (!html.includes(funcMarker)) { console.error('ERROR: cierre de doTransfer no encontrado'); process.exit(1); }
html = html.replace(funcMarker, csvFns);
console.log('✓ Funciones CSV inyectadas');

// ── 3. Botón iConstruye en la sección guías de OFICINA ────────────────────
const oldOfiGuide = `            h('button',{onClick:function(){ofiFileRef.current&&ofiFileRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(14,165,233,.3)',
                background:'rgba(14,165,233,.07)',color:'var(--blue)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📁 Cargar Guía')
          )
        )
      )
    ),
    // ── STOCK BODEGA ──────────────────────────────────────────────────────`;

const newOfiGuide = `            h('button',{onClick:function(){ofiFileRef.current&&ofiFileRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(14,165,233,.3)',
                background:'rgba(14,165,233,.07)',color:'var(--blue)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📁 Cargar Guía')
          ),
          h('input',{ref:importCsvOfiRef,type:'file',accept:'.csv,.txt',
            style:{display:'none'},onChange:function(e){
              handleImportCSV(e.target.files&&e.target.files[0],'ofi');e.target.value='';}}),
          h('button',{onClick:function(){importCsvOfiRef.current&&importCsvOfiRef.current.click();},
            style:{width:'100%',marginTop:6,padding:'7px 0',borderRadius:7,
              border:'1px solid rgba(14,165,233,.5)',background:'rgba(14,165,233,.1)',
              color:'var(--blue)',cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'.03em'}},
            '📊 Importar materiales desde iConstruye (CSV)')
        )
      )
    ),
    // ── STOCK BODEGA ──────────────────────────────────────────────────────`;

if (!html.includes(oldOfiGuide)) { console.error('ERROR: sección guías Oficina no encontrada'); process.exit(1); }
html = html.replace(oldOfiGuide, newOfiGuide);
console.log('✓ Botón iConstruye en Oficina agregado');

// ── 4. Botón iConstruye en la sección guías de BODEGA ────────────────────
const oldBodGuide = `            h('button',{onClick:function(){bodFileRef.current&&bodFileRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(168,85,247,.3)',
                background:'rgba(168,85,247,.07)',color:'var(--purple)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📁 Cargar Guía')
          )
        )
      )
    ),
    // ── MODAL TRANSFERENCIA ───────────────────────────────────────────────`;

const newBodGuide = `            h('button',{onClick:function(){bodFileRef.current&&bodFileRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(168,85,247,.3)',
                background:'rgba(168,85,247,.07)',color:'var(--purple)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📁 Cargar Guía')
          ),
          h('input',{ref:importCsvBodRef,type:'file',accept:'.csv,.txt',
            style:{display:'none'},onChange:function(e){
              handleImportCSV(e.target.files&&e.target.files[0],'bod');e.target.value='';}}),
          h('button',{onClick:function(){importCsvBodRef.current&&importCsvBodRef.current.click();},
            style:{width:'100%',marginTop:6,padding:'7px 0',borderRadius:7,
              border:'1px solid rgba(168,85,247,.5)',background:'rgba(168,85,247,.1)',
              color:'var(--purple)',cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'.03em'}},
            '📊 Importar materiales desde iConstruye (CSV)')
        )
      )
    ),
    // ── MODAL TRANSFERENCIA ───────────────────────────────────────────────`;

if (!html.includes(oldBodGuide)) { console.error('ERROR: sección guías Bodega no encontrada'); process.exit(1); }
html = html.replace(oldBodGuide, newBodGuide);
console.log('✓ Botón iConstruye en Bodega agregado');

// ── 5. Modal de importación al final del return de LogisticaView ──────────
const oldEnd = `      })()
    )
  );
}

function MatView(`;

const newEnd = `      })()
    ),
    // ── MODAL IMPORTAR ICONSTRUYE ─────────────────────────────────────────
    importModal&&h('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',
      zIndex:1002,display:'flex',alignItems:'flex-start',justifyContent:'center',
      padding:'16px 10px',overflowY:'auto'},
      onClick:function(e){if(e.target===e.currentTarget)setImportModal(null);}},
      h('div',{style:{background:'var(--bg2)',borderRadius:14,width:'100%',maxWidth:520,
        border:'1px solid rgba(14,165,233,.4)',overflow:'hidden'}},
        // Header
        h('div',{style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',gap:10,background:'rgba(14,165,233,.06)'}},
          h('span',{style:{fontSize:20}},'📊'),
          h('div',{style:{flex:1}},
            h('div',{style:{fontSize:14,fontWeight:800,color:'var(--blue)'}},
              'Importar desde iConstruye'),
            h('div',{style:{fontSize:11,color:'var(--text3)'}},
              (importModal.sec==='ofi'?'→ Oficina Central':'→ Bodega')+
              (importModal.items.length?' · '+importModal.items.length+' ítems detectados':''))
          ),
          h('button',{onClick:function(){setImportModal(null);},
            style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,
              padding:'4px 12px',color:'var(--text2)',cursor:'pointer',fontSize:16}},'✕')
        ),
        // Error state
        importModal.error
          ?h('div',{style:{padding:'20px 18px'}},
              h('div',{style:{color:'var(--red)',fontSize:12,marginBottom:10,
                lineHeight:1.6,whiteSpace:'pre-line'}},'⚠ '+importModal.error),
              h('div',{style:{color:'var(--text3)',fontSize:11,lineHeight:1.7,marginBottom:12}},
                'Pasos para exportar desde iConstruye:',
                h('br'),
                '1. Abre la Orden de Compra o Guía de Despacho',
                h('br'),
                '2. Pincha "Exportar" o "Descargar" → elige CSV o Excel',
                h('br'),
                '3. Guarda como .csv y carga aquí'),
              h('button',{onClick:function(){setImportModal(null);},
                style:{padding:'7px 14px',borderRadius:7,border:'1px solid var(--border)',
                  background:'var(--bg3)',color:'var(--text2)',cursor:'pointer',fontSize:12}},
                'Cerrar')
            )
          // Success state: preview list
          :h('div',null,
              // Barra de controles
              h('div',{style:{padding:'9px 16px',borderBottom:'1px solid var(--border)',
                display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',
                background:'rgba(14,165,233,.03)'}},
                h('span',{style:{fontSize:11,color:'var(--text3)',flex:1}},
                  importModal.items.filter(function(it){return it.sel;}).length+
                  ' de '+importModal.items.length+' seleccionados'),
                h('button',{onClick:function(){
                  setImportModal(Object.assign({},importModal,{
                    items:importModal.items.map(function(it){return Object.assign({},it,{sel:true});})
                  }));
                },style:{padding:'4px 10px',borderRadius:6,
                  border:'1px solid rgba(14,165,233,.35)',
                  background:'rgba(14,165,233,.1)',color:'var(--blue)',
                  cursor:'pointer',fontSize:11,fontWeight:700}},'Sel. Todo'),
                h('button',{onClick:function(){
                  setImportModal(Object.assign({},importModal,{
                    items:importModal.items.map(function(it){return Object.assign({},it,{sel:false});})
                  }));
                },style:{padding:'4px 10px',borderRadius:6,border:'1px solid var(--border)',
                  background:'transparent',color:'var(--text2)',cursor:'pointer',fontSize:11}},
                  'Ninguno')
              ),
              // Lista de ítems
              h('div',{style:{maxHeight:'50vh',overflowY:'auto'}},
                importModal.items.length===0
                  ?h('div',{style:{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:12}},
                      'No se detectaron materiales en el archivo')
                  :importModal.items.map(function(it,ii){
                      return h('div',{key:ii,
                        onClick:function(){
                          var items=importModal.items.slice();
                          items[ii]=Object.assign({},items[ii],{sel:!items[ii].sel});
                          setImportModal(Object.assign({},importModal,{items:items}));
                        },
                        style:{display:'flex',alignItems:'center',gap:10,
                          padding:'8px 16px',cursor:'pointer',
                          borderBottom:'1px solid rgba(255,255,255,.04)',
                          background:it.sel?'rgba(14,165,233,.04)':'transparent',
                          transition:'background .1s'}},
                        // Checkbox
                        h('div',{style:{width:17,height:17,borderRadius:4,flexShrink:0,
                          border:'2px solid '+(it.sel?'var(--blue)':'rgba(255,255,255,.2)'),
                          background:it.sel?'var(--blue)':'transparent',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          transition:'all .15s'}},
                          it.sel&&h('span',{style:{color:'#fff',fontSize:10,fontWeight:700,lineHeight:1}},'✓')
                        ),
                        // Nombre
                        h('span',{style:{fontSize:11,flex:1,
                          color:it.sel?'var(--text)':'var(--text3)',
                          textDecoration:it.sel?'none':'line-through',
                          opacity:it.sel?1:.55,transition:'all .1s'}},it.name),
                        // Cantidad
                        h('span',{style:{fontSize:12,fontFamily:'var(--mono)',fontWeight:700,
                          color:it.sel?'var(--blue)':'var(--text3)',
                          minWidth:42,textAlign:'right'}},it.qty||'-'),
                        // Unidad
                        h('span',{style:{fontSize:10,color:it.sel?'var(--text2)':'var(--text3)',
                          minWidth:30,opacity:it.sel?1:.55}},it.ud)
                      );
                    })
              ),
              // Footer
              h('div',{style:{padding:'12px 18px',borderTop:'1px solid var(--border)',
                display:'flex',gap:8,background:'rgba(14,165,233,.03)'}},
                h('button',{onClick:confirmImport,
                  disabled:importModal.items.filter(function(it){return it.sel;}).length===0,
                  style:{flex:1,padding:'10px 0',borderRadius:8,
                    background:importModal.items.filter(function(it){return it.sel;}).length>0
                      ?'var(--blue)':'rgba(14,165,233,.3)',
                    border:'none',color:'#fff',fontSize:13,fontWeight:700,
                    cursor:importModal.items.filter(function(it){return it.sel;}).length>0?'pointer':'default'}},
                  '✓ Importar ('+importModal.items.filter(function(it){return it.sel;}).length+')'),
                h('button',{onClick:function(){setImportModal(null);},
                  style:{padding:'10px 14px',borderRadius:8,border:'1px solid var(--border)',
                    background:'transparent',color:'var(--text3)',fontSize:13,cursor:'pointer'}},
                  'Cancelar')
              )
            )
      )
    )
  );
}

function MatView(`;

if (!html.includes(oldEnd)) { console.error('ERROR: cierre del return de LogisticaView no encontrado'); process.exit(1); }
html = html.replace(oldEnd, newEnd);
console.log('✓ Modal de importación iConstruye inyectado');

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
