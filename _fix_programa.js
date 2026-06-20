const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// ── 1. Agregar estado hideModalDone ───────────────────────────────────────
const oldStates = `  const[showEntregas,setShowEntregas]=useState(false);
  const[showVencidas,setShowVencidas]=useState(false);
  const[showRecuperados,setShowRecuperados]=useState(false);
  const[selectedEntDep,setSelectedEntDep]=useState(null);`;
const newStates = `  const[showEntregas,setShowEntregas]=useState(false);
  const[showVencidas,setShowVencidas]=useState(false);
  const[showRecuperados,setShowRecuperados]=useState(false);
  const[selectedEntDep,setSelectedEntDep]=useState(null);
  const[hideModalDone,setHideModalDone]=useState(false);`;

if (!html.includes(oldStates)) { console.error('ERROR: estados no encontrados'); process.exit(1); }
html = html.replace(oldStates, newStates);
console.log('✓ Estado hideModalDone agregado');

// ── 2. Mejora 1: Cambiar pills horizontales a lista vertical ──────────────
const oldPills = `      // Summary pill
      totalPlanTasks>0&&h('div',{style:{marginTop:8,fontSize:11,color:'var(--text3)'}},
        h('span',{style:{background:'rgba(14,165,233,.15)',color:'var(--blue)',
          padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600}},
          totalPlanTasks+' tareas del plan esta semana'
        ),
        (userResp||filtResp!=='all')&&h('span',{style:{marginLeft:6,background:'rgba(168,85,247,.15)',
          color:'var(--purple)',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600}},
          userResp||filtResp
        ),
        totalVencidas>0&&h('span',{
          onClick:function(){setShowVencidas(!showVencidas);setShowEntregas(false);},
          style:{marginLeft:6,background:showVencidas?'rgba(239,68,68,.35)':'rgba(239,68,68,.15)',
            color:'var(--red)',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
            cursor:'pointer',userSelect:'none',border:'1px solid rgba(239,68,68,.4)'}},
          '⚠ '+totalVencidas+' vencida'+(totalVencidas>1?'s':'')+' '+(showVencidas?'▲':'▼')
        ),
        vencidasRecuperadas.length>0&&h('span',{
          onClick:function(){setShowRecuperados(!showRecuperados);},
          style:{marginLeft:6,background:showRecuperados?'rgba(34,197,94,.35)':'rgba(34,197,94,.15)',
            color:'var(--green)',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
            cursor:'pointer',userSelect:'none',border:'1px solid rgba(34,197,94,.3)'}},
          '✅ '+vencidasRecuperadas.length+' recuperado'+(vencidasRecuperadas.length>1?'s':'')+' '+(showRecuperados?'▲':'▼')
        ),
        totalEntregasSemana>0&&h('span',{
          onClick:function(){setShowEntregas(!showEntregas);setShowVencidas(false);},
          style:{marginLeft:6,background:showEntregas?'rgba(34,197,94,.35)':'rgba(34,197,94,.15)',
            color:'var(--green)',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
            cursor:'pointer',userSelect:'none',border:'1px solid rgba(34,197,94,.3)'}},
          '🏠 '+totalEntregasSemana+' entrega'+(totalEntregasSemana>1?'s':'')+' '+(showEntregas?'▲':'▼')
        )
      )`;

const newPills = `      // Summary list vertical
      h('div',{style:{marginTop:10,display:'flex',flexDirection:'column',gap:5}},
        h('div',{style:{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
          borderRadius:9,background:'rgba(14,165,233,.07)',border:'1px solid rgba(14,165,233,.18)'}},
          h('span',{style:{fontSize:16}},'📋'),
          h('div',{style:{flex:1,fontSize:12,fontWeight:700,color:'var(--blue)'}},
            totalPlanTasks+' tarea'+(totalPlanTasks!==1?'s':'')+' del plan esta semana'),
          (userResp||filtResp!=='all')&&h('span',{style:{background:'rgba(168,85,247,.15)',
            color:'var(--purple)',padding:'2px 9px',borderRadius:8,fontSize:10,fontWeight:700}},
            userResp||filtResp)
        ),
        totalVencidas>0&&h('div',{
          onClick:function(){setShowVencidas(!showVencidas);setShowEntregas(false);},
          style:{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
            borderRadius:9,cursor:'pointer',userSelect:'none',
            background:showVencidas?'rgba(239,68,68,.16)':'rgba(239,68,68,.06)',
            border:'1px solid '+(showVencidas?'rgba(239,68,68,.45)':'rgba(239,68,68,.2)')}},
          h('span',{style:{fontSize:16}},'⚠️'),
          h('div',{style:{flex:1,fontSize:12,fontWeight:700,color:'var(--red)'}},
            totalVencidas+' depto'+(totalVencidas!==1?'s':'')+' vencido'+(totalVencidas!==1?'s':'')+' sin entregar'),
          h('span',{style:{color:'var(--red)',fontSize:12,fontWeight:700}},showVencidas?'▲':'▼')
        ),
        vencidasRecuperadas.length>0&&h('div',{
          onClick:function(){setShowRecuperados(!showRecuperados);},
          style:{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
            borderRadius:9,cursor:'pointer',userSelect:'none',
            background:showRecuperados?'rgba(34,197,94,.15)':'rgba(34,197,94,.05)',
            border:'1px solid '+(showRecuperados?'rgba(34,197,94,.45)':'rgba(34,197,94,.18)')}},
          h('span',{style:{fontSize:16}},'✅'),
          h('div',{style:{flex:1,fontSize:12,fontWeight:700,color:'var(--green)'}},
            vencidasRecuperadas.length+' depto'+(vencidasRecuperadas.length!==1?'s':'')+' vencido'+(vencidasRecuperadas.length!==1?'s':'')+' ya entregado'+(vencidasRecuperadas.length!==1?'s':'')),
          h('span',{style:{color:'var(--green)',fontSize:12,fontWeight:700}},showRecuperados?'▲':'▼')
        ),
        totalEntregasSemana>0&&h('div',{
          onClick:function(){setShowEntregas(!showEntregas);setShowVencidas(false);},
          style:{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
            borderRadius:9,cursor:'pointer',userSelect:'none',
            background:showEntregas?'rgba(34,197,94,.15)':'rgba(34,197,94,.05)',
            border:'1px solid '+(showEntregas?'rgba(34,197,94,.45)':'rgba(34,197,94,.18)')}},
          h('span',{style:{fontSize:16}},'🏠'),
          h('div',{style:{flex:1,fontSize:12,fontWeight:700,color:'var(--green)'}},
            totalEntregasSemana+' entrega'+(totalEntregasSemana!==1?'s':'')+' programada'+(totalEntregasSemana!==1?'s':'')+' esta semana'),
          h('span',{style:{color:'var(--green)',fontSize:12,fontWeight:700}},showEntregas?'▲':'▼')
        )
      )`;

if (!html.includes(oldPills)) { console.error('ERROR: pills no encontradas'); process.exit(1); }
html = html.replace(oldPills, newPills);
console.log('✓ Pills convertidas a lista vertical');

// ── 3. Mejoras 2 y 3: Botón "Ocultar 100%" en el modal selectedEntDep ─────
// Buscar el header del modal y agregar el botón toggle
const oldModalHeader = `        // Header
        h('div',{style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',gap:10,flexShrink:0}},
          h('span',{style:{fontSize:20,fontWeight:800,color:'var(--green)',fontFamily:'var(--mono)'}},
            'D'+(selectedEntDep.dep.d||'')),
          h('div',{style:{flex:1}},
            h('div',{style:{fontSize:14,fontWeight:700,color:'var(--text)'}},selectedEntDep.dep.n||''),
            h('div',{style:{fontSize:11,color:'var(--text3)'}},selectedEntDep.pisoName||'')
          ),
          h('button',{onClick:function(){setSelectedEntDep(null);},
            style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,
              padding:'5px 12px',color:'var(--text2)',cursor:'pointer',fontSize:18,lineHeight:1}},
            '✕')
        ),`;

const newModalHeader = `        // Header
        h('div',{style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',flexShrink:0}},
          h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:8}},
            h('span',{style:{fontSize:20,fontWeight:800,color:'var(--green)',fontFamily:'var(--mono)'}},
              'D'+(selectedEntDep.dep.d||'')),
            h('div',{style:{flex:1}},
              h('div',{style:{fontSize:14,fontWeight:700,color:'var(--text)'}},selectedEntDep.dep.n||''),
              h('div',{style:{fontSize:11,color:'var(--text3)'}},selectedEntDep.pisoName||'')
            ),
            h('button',{onClick:function(){setSelectedEntDep(null);},
              style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,
                padding:'5px 12px',color:'var(--text2)',cursor:'pointer',fontSize:18,lineHeight:1}},
              '✕')
          ),
          h('button',{
            onClick:function(){setHideModalDone(!hideModalDone);},
            style:{width:'100%',padding:'5px 0',borderRadius:7,
              border:'1px solid '+(hideModalDone?'var(--green)':'var(--border)'),
              background:hideModalDone?'rgba(34,197,94,.12)':'var(--bg3)',
              color:hideModalDone?'var(--green)':'var(--text2)',
              fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .2s'}},
            hideModalDone?'▶ Ver completadas también':'✓ Ocultar partidas al 100%')
        ),`;

if (!html.includes(oldModalHeader)) { console.error('ERROR: modal header no encontrado'); process.exit(1); }
html = html.replace(oldModalHeader, newModalHeader);
console.log('✓ Botón ocultar 100% agregado al modal');

// ── 4. Filtrar partidas en el body del modal cuando hideModalDone=true ─────
const oldModalBody = `                h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
                  parts.map(function(p){
                    var raw=sv[ph.key]&&sv[ph.key][p.id]!=null?sv[ph.key][p.id]:(lf&&lf[depNum]?lf[depNum][p.id]||0:0);
                    var v=raw||0;
                    var isDone=v>=100;
                    var isPartial=v>0&&v<100;
                    var statusColor=isDone?'var(--green)':isPartial?'var(--amber)':'var(--text3)';
                    var bgColor=isDone?'rgba(34,197,94,.08)':isPartial?'rgba(245,158,11,.06)':'var(--bg3)';
                    return h('div',{key:p.id,style:{
                      display:'flex',alignItems:'center',gap:8,
                      padding:'6px 10px',borderRadius:8,
                      background:bgColor,
                      border:'1px solid '+(isDone?'rgba(34,197,94,.2)':isPartial?'rgba(245,158,11,.2)':'var(--border)')}},
                      h('span',{style:{fontSize:10,fontWeight:700,color:statusColor,
                        minWidth:20,textAlign:'center'}},
                        isDone?'✓':isPartial?'◑':'○'),
                      h('span',{style:{fontSize:11,color:isDone?'var(--text2)':'var(--text)',
                        flex:1,textDecoration:isDone?'line-through':'none',
                        opacity:isDone?.7:1}},
                        p.name),
                      h('span',{style:{fontSize:11,fontWeight:700,color:statusColor,
                        fontFamily:'var(--mono)',minWidth:32,textAlign:'right'}},
                        v+'%')
                    );
                  })
                )`;

const newModalBody = `                h('div',{style:{display:'flex',flexDirection:'column',gap:4}},
                  (function(){
                    var visParts=hideModalDone?parts.filter(function(p){
                      var raw=sv[ph.key]&&sv[ph.key][p.id]!=null?sv[ph.key][p.id]:(lf&&lf[depNum]?lf[depNum][p.id]||0:0);
                      return (raw||0)<100;
                    }):parts;
                    if(visParts.length===0)return h('div',{style:{fontSize:10,color:'var(--green)',
                      textAlign:'center',padding:'6px 0',fontStyle:'italic'}},'✓ Todas al 100%');
                    return visParts.map(function(p){
                      var raw=sv[ph.key]&&sv[ph.key][p.id]!=null?sv[ph.key][p.id]:(lf&&lf[depNum]?lf[depNum][p.id]||0:0);
                      var v=raw||0;
                      var isDone=v>=100;
                      var isPartial=v>0&&v<100;
                      var statusColor=isDone?'var(--green)':isPartial?'var(--amber)':'var(--text3)';
                      var bgColor=isDone?'rgba(34,197,94,.08)':isPartial?'rgba(245,158,11,.06)':'var(--bg3)';
                      return h('div',{key:p.id,style:{
                        display:'flex',alignItems:'center',gap:8,
                        padding:'6px 10px',borderRadius:8,
                        background:bgColor,
                        border:'1px solid '+(isDone?'rgba(34,197,94,.2)':isPartial?'rgba(245,158,11,.2)':'var(--border)')}},
                        h('span',{style:{fontSize:10,fontWeight:700,color:statusColor,
                          minWidth:20,textAlign:'center'}},
                          isDone?'✓':isPartial?'◑':'○'),
                        h('span',{style:{fontSize:11,color:isDone?'var(--text2)':'var(--text)',
                          flex:1,textDecoration:isDone?'line-through':'none',
                          opacity:isDone?.7:1}},
                          p.name),
                        h('span',{style:{fontSize:11,fontWeight:700,color:statusColor,
                          fontFamily:'var(--mono)',minWidth:32,textAlign:'right'}},
                          v+'%')
                      );
                    });
                  })()
                )`;

if (!html.includes(oldModalBody)) { console.error('ERROR: modal body no encontrado'); process.exit(1); }
html = html.replace(oldModalBody, newModalBody);
console.log('✓ Filtro de partidas 100% aplicado al modal');

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
