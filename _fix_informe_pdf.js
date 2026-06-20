const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// ── 1. Mover _LOGO a scope global (para que lo use la nueva función PDF) ──
// La var _LOGO está dentro de generarPDFSobreTiempo, la sacamos afuera
const logoStart = html.indexOf('  var _LOGO=\'data:image/png;base64,');
const logoEnd   = html.indexOf("';\n  try{doc.addImage(_LOGO", logoStart) + 2; // include "';"
if (logoStart < 0 || logoEnd < 2) { console.error('ERROR: _LOGO no encontrado'); process.exit(1); }

const logoDecl  = html.substring(logoStart, logoEnd); // full "  var _LOGO='...base64...';"
// Reemplazar dentro de la función con referencia al global
html = html.replace(logoDecl, '  // _LOGO definido globalmente antes de esta función');
// Insertar como global justo antes de generarPDFSobreTiempo
const fnMarker = 'function generarPDFSobreTiempo(';
// Construir la global (trim la indentación, cambiar var → const al nivel global)
const globalLogoDecl = logoDecl.trimStart().replace(/^var /, 'var ');
html = html.replace(fnMarker, globalLogoDecl + '\nfunction generarPDFSobreTiempo(');
console.log('✓ _LOGO movido a scope global');

// ── 2. Agregar estados showReportModal y reportSel ────────────────────────
const oldStates2 = `  const[hideModalDone,setHideModalDone]=useState(false);`;
const newStates2 = `  const[hideModalDone,setHideModalDone]=useState(false);
  const[showReportModal,setShowReportModal]=useState(false);
  const[reportSel,setReportSel]=useState({});`;
if (!html.includes(oldStates2)) { console.error('ERROR: estado hideModalDone no encontrado'); process.exit(1); }
html = html.replace(oldStates2, newStates2);
console.log('✓ Estados showReportModal y reportSel agregados');

// ── 3. Agregar funciones helper antes del return de ProgramaView ──────────
// Buscamos "  return h('div',{className:'page gap10'}," que es el return de ProgramaView
const returnMarker = `  return h('div',{className:'page gap10'},\n    // ── FILTERS CARD ──`;
const helperFunctions = `  // ── Helper: fases config reutilizable ──
  var _PHASE_DEFS=[
    {fi:1,fk:'f1',label:'FASE 1',color:'var(--blue)',rgb:[30,100,200],ps:_D.ps,lf:_D.lf1||{}},
    {fi:2,fk:'f2',label:'FASE 2',color:'var(--purple)',rgb:[140,60,220],ps:_D.ps2,lf:_D.lf2||{}},
    {fi:3,fk:'f3',label:'FASE 3',color:'var(--green)',rgb:[22,163,74],ps:_D.ps3,lf:_D.lf3||{}},
    {fi:4,fk:'f4',label:'FASE 4',color:'var(--amber)',rgb:[180,120,20],ps:_D.ps4||[],lf:_D.lf4||{}}
  ];
  function _getV(dn,ph,p){
    var sv=saves[dn]||{};
    var c=(sv[ph.fk]||{})[p.id];
    return c!=null?c:(ph.lf[dn]?ph.lf[dn][p.id]||0:0);
  }
  function togglePartida(dn,fk,pid,val){
    setReportSel(function(prev){
      var next=Object.assign({},prev);
      next[dn]=Object.assign({},next[dn]||{});
      next[dn][fk]=Object.assign({},next[dn][fk]||{});
      next[dn][fk][pid]=val;
      return next;
    });
  }
  function toggleDeptSel(dn,mode){
    setReportSel(function(prev){
      var next=Object.assign({},prev);
      next[dn]={};
      _PHASE_DEFS.forEach(function(ph){
        next[dn][ph.fk]={};
        ph.ps.forEach(function(p){
          var v=_getV(dn,ph,p);
          next[dn][ph.fk][p.id]=mode==='all'?true:mode==='none'?false:Math.round(v)<100;
        });
      });
      return next;
    });
  }
  function initReportSel(){
    var sel={};
    var seen=new Set();
    var allEnts=vencidasPendientes.slice();
    weekDays.forEach(function(wd){(depDeliveriesThisWeek[wd.date]||[]).forEach(function(e){allEnts.push(e);});});
    allEnts.forEach(function(ent){
      var dn=ent.dep.d;
      if(seen.has(dn))return;
      seen.add(dn);
      sel[dn]={};
      _PHASE_DEFS.forEach(function(ph){
        sel[dn][ph.fk]={};
        ph.ps.forEach(function(p){
          var v=_getV(dn,ph,p);
          sel[dn][ph.fk][p.id]=Math.round(v)<100;
        });
      });
    });
    return sel;
  }
  function generarPDFInforme(rSel){
    if(typeof jspdf==='undefined'){toast&&toast('Error: jsPDF no disponible');return;}
    var doc=new jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'letter'});
    var pw=216,ph=279,margin=14,y=20;
    var cw=pw-margin*2;
    var _td=new Date();
    var today=_td.getFullYear()+'-'+String(_td.getMonth()+1).padStart(2,'0')+'-'+String(_td.getDate()).padStart(2,'0');
    // Logo
    try{doc.addImage(_LOGO,'PNG',margin,y-6,28,8);}catch(e){}
    // Título
    doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(10,20,60);
    doc.text('INFORME DE AVANCE DE OBRA',pw/2,y,{align:'center'});
    y+=5;
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(100,100,100);
    doc.text('Edificio Victoria',pw/2,y,{align:'center'});
    doc.text('Fecha: '+today,pw-margin,y-5,{align:'right'});
    y+=4;
    if(userResp||filtResp!=='all'){
      doc.setFont('helvetica','bold');doc.setTextColor(60,60,120);
      doc.text('Responsable: '+(userResp||filtResp),margin,y);
      y+=4;
    }
    doc.text('Semana: '+startDate+' al '+endDate,margin,y);
    y+=4;
    doc.setDrawColor(180,180,200);doc.setLineWidth(.4);doc.line(margin,y,pw-margin,y);
    y+=6;
    function chk(need){if(y+need>ph-16){doc.addPage();y=16;}}
    function secHdr(txt,r,g,b){
      chk(10);
      doc.setFillColor(r,g,b);doc.rect(margin,y,cw,7,'F');
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
      doc.text(txt,margin+3,y+5);
      y+=9;
    }
    function deptHdr(ent,f3pct,isRed){
      chk(12);
      var bgr=isRed?[255,245,245]:[240,255,245];
      doc.setFillColor(bgr[0],bgr[1],bgr[2]);doc.rect(margin,y,cw,10,'F');
      doc.setDrawColor(isRed?220:180,isRed?100:220,isRed?100:150);doc.setLineWidth(.3);
      doc.line(margin,y,margin,y+10);
      // D-number
      doc.setFontSize(12);doc.setFont('helvetica','bold');
      doc.setTextColor(isRed?200:20,isRed?50:140,isRed?50:70);
      doc.text('D'+ent.dep.d,margin+3,y+7);
      // name + piso
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30,30,30);
      var nm=ent.dep.n||'';if(nm.length>40)nm=nm.substring(0,38)+'..';
      doc.text(nm,margin+18,y+4.5);
      doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(100,100,100);
      doc.text((ent.pisoName||'')+(ent.eDate?' · '+ent.eDate:''),margin+18,y+8.5);
      // F3%
      doc.setFontSize(10);doc.setFont('helvetica','bold');
      doc.setTextColor(isRed?200:22,isRed?50:163,isRed?50:74);
      doc.text('F3: '+f3pct+'%',pw-margin-3,y+6,{align:'right'});
      // bar
      var bx=pw-margin-36,bw=30,by=y+7.5,bh=2;
      doc.setFillColor(220,220,220);doc.rect(bx,by,bw,bh,'F');
      var fw=Math.min(bw,bw*f3pct/100);
      doc.setFillColor(isRed?220:34,isRed?80:197,isRed?80:94);
      if(fw>0)doc.rect(bx,by,fw,bh,'F');
      y+=12;
    }
    function drawParts(dn,rSelD){
      var sv=saves[dn]||{};
      var anyPhase=false;
      _PHASE_DEFS.forEach(function(ph){
        var selPids=ph.ps.filter(function(p){return rSelD&&rSelD[ph.fk]&&rSelD[ph.fk][p.id];});
        if(!selPids.length)return;
        chk(8);
        // Phase label
        doc.setFontSize(7.5);doc.setFont('helvetica','bold');
        doc.setTextColor(ph.rgb[0],ph.rgb[1],ph.rgb[2]);
        doc.text('▸ '+ph.label,margin+4,y+3.5);
        doc.setDrawColor(ph.rgb[0],ph.rgb[1],ph.rgb[2]);doc.setLineWidth(.2);
        doc.line(margin+4+doc.getTextWidth('▸ '+ph.label)+2,y+2,pw-margin-4,y+2);
        y+=6;
        anyPhase=true;
        // Partidas
        selPids.forEach(function(p){
          chk(7);
          var v=Math.round(_getV(dn,ph,p));
          var isDone=v>=100;var isPartial=v>0&&v<100;
          // Row bg alternate
          doc.setFillColor(isDone?245:250,isDone?255:250,isDone?248:255);
          doc.rect(margin+4,y-.5,cw-4,6.5,'F');
          // Status dot
          doc.setFontSize(7);doc.setFont('helvetica','bold');
          doc.setTextColor(isDone?22:isPartial?180:150,isDone?163:isPartial?100:150,isDone?74:isPartial?20:150);
          doc.text(isDone?'✓':isPartial?'▶':'○',margin+5.5,y+4);
          // Name
          var nm=p.name.replace(/^F[1-4] /i,'');
          if(nm.length>68)nm=nm.substring(0,66)+'...';
          doc.setFontSize(8);doc.setFont('helvetica',isDone?'italic':'normal');
          doc.setTextColor(isDone?140:30,isDone?140:30,isDone?140:30);
          doc.text(nm,margin+10,y+4);
          // %
          doc.setFont('helvetica','bold');
          doc.setTextColor(isDone?22:isPartial?180:160,isDone?163:isPartial?100:160,isDone?74:isPartial?20:160);
          doc.text(v+'%',pw-margin-3,y+4,{align:'right'});
          y+=7;
        });
      });
      if(anyPhase)y+=3;
    }
    // ── Sección Vencidos ──
    if(vencidasPendientes.length>0){
      secHdr('  ⚠  DEPARTAMENTOS VENCIDOS SIN ENTREGAR — '+vencidasPendientes.length+' pendiente'+(vencidasPendientes.length>1?'s':''),170,40,40);
      vencidasPendientes.forEach(function(ent){
        var dn=ent.dep.d;
        if(!rSel[dn])return;
        var f3=Math.round(calcDeptoFase(dn,3,saves)||0);
        deptHdr(ent,f3,true);
        drawParts(dn,rSel[dn]);
      });
      y+=4;
    }
    // ── Sección Entregas Esta Semana ──
    var allEntregas=[];
    weekDays.forEach(function(wd){(depDeliveriesThisWeek[wd.date]||[]).forEach(function(e){allEntregas.push(e);});});
    if(allEntregas.length>0){
      secHdr('  🏠  ENTREGAS PROGRAMADAS ESTA SEMANA — '+allEntregas.length+' departamento'+(allEntregas.length>1?'s':''),20,120,70);
      allEntregas.forEach(function(ent){
        var dn=ent.dep.d;
        if(!rSel[dn])return;
        var f3=Math.round(calcDeptoFase(dn,3,saves)||0);
        deptHdr(ent,f3,false);
        drawParts(dn,rSel[dn]);
      });
    }
    // Números de página
    var nPg=doc.getNumberOfPages();
    for(var pg=1;pg<=nPg;pg++){
      doc.setPage(pg);
      doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(160,160,160);
      doc.text('Pág. '+pg+' / '+nPg,pw-margin,ph-8,{align:'right'});
      doc.text('Edificio Victoria — Control de Obra',margin,ph-8);
    }
    var fname='informe-avance-'+today+'.pdf';
    doc.save(fname);
    toast&&toast('PDF generado: '+fname);
  }
${returnMarker}`;

if (!html.includes(returnMarker)) { console.error('ERROR: return marker no encontrado'); process.exit(1); }
html = html.replace(returnMarker, helperFunctions);
console.log('✓ Funciones helper y generarPDFInforme inyectadas');

// ── 4. Agregar botón "Generar Informe PDF" en el filtros card ─────────────
// Justo antes del cierre del filters card ("),  // ── PANEL VENCIDAS ──")
const oldFiltersEnd = `      )
    ),
    // ── PANEL VENCIDAS ──`;
const newFiltersEnd = `      ),
      (totalVencidas>0||totalEntregasSemana>0)&&h('button',{
        onClick:function(){setReportSel(initReportSel());setShowReportModal(true);},
        style:{width:'100%',marginTop:8,padding:'8px 0',borderRadius:8,
          border:'1px solid rgba(168,85,247,.4)',
          background:'rgba(168,85,247,.08)',
          color:'var(--purple)',cursor:'pointer',fontSize:12,fontWeight:700,
          display:'flex',alignItems:'center',justifyContent:'center',gap:6}},
        h('span',null,'📄'),
        'Generar Informe PDF'
      )
    ),
    // ── PANEL VENCIDAS ──`;
if (!html.includes(oldFiltersEnd)) { console.error('ERROR: filters end no encontrado'); process.exit(1); }
html = html.replace(oldFiltersEnd, newFiltersEnd);
console.log('✓ Botón Generar Informe PDF agregado');

// ── 5. Agregar modal de configuración del informe ─────────────────────────
// Justo antes de "// ── DAYS ──"
const daysMarker = `    // ── DAYS ──\n    weekDays.map`;
const reportModal = `    // ── MODAL INFORME PDF ──
    showReportModal&&(totalVencidas>0||totalEntregasSemana>0)&&h('div',{
      style:{position:'fixed',inset:0,background:'rgba(0,0,0,.78)',zIndex:1100,
        display:'flex',alignItems:'flex-start',justifyContent:'center',
        padding:'10px 8px',overflowY:'auto'},
      onClick:function(e){if(e.target===e.currentTarget)setShowReportModal(false);}},
      h('div',{style:{background:'var(--bg2)',borderRadius:14,width:'100%',maxWidth:640,
        display:'flex',flexDirection:'column',maxHeight:'92vh',overflow:'hidden',
        border:'1px solid rgba(168,85,247,.3)'}},
        // Header
        h('div',{style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',gap:10,flexShrink:0}},
          h('span',{style:{fontSize:20}},'📄'),
          h('div',{style:{flex:1}},
            h('div',{style:{fontSize:14,fontWeight:700,color:'var(--text)'}},'Configurar Informe PDF'),
            h('div',{style:{fontSize:11,color:'var(--text3)'}},
              [totalVencidas>0&&(totalVencidas+' vencido'+(totalVencidas>1?'s':'')),
               totalEntregasSemana>0&&(totalEntregasSemana+' entrega'+(totalEntregasSemana>1?'s':''))
              ].filter(Boolean).join(' · '))
          ),
          h('button',{onClick:function(){setShowReportModal(false);},
            style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,
              padding:'4px 12px',color:'var(--text2)',cursor:'pointer',fontSize:16,lineHeight:1}},'✕')
        ),
        // Body scrollable
        h('div',{style:{overflowY:'auto',padding:'10px 14px',flex:1}},
          (function(){
            var sections=[];
            // Vencidos
            if(vencidasPendientes.length>0){
              sections.push(h('div',{key:'ven',style:{marginBottom:14}},
                h('div',{style:{fontSize:10,fontWeight:700,color:'var(--red)',
                  letterSpacing:'.08em',marginBottom:8,display:'flex',alignItems:'center',gap:6}},
                  '⚠ DEPARTAMENTOS VENCIDOS',
                  h('span',{style:{background:'rgba(239,68,68,.15)',color:'var(--red)',
                    borderRadius:6,padding:'0 6px',fontSize:10,fontWeight:700}},
                    vencidasPendientes.length+' dpto'+(vencidasPendientes.length>1?'s':''))
                ),
                vencidasPendientes.map(function(ent){
                  return h(ReportDeptCard,{key:ent.dep.d,ent:ent,
                    saves:saves,reportSel:reportSel,
                    toggleDeptSel:toggleDeptSel,togglePartida:togglePartida,
                    phaseDefs:_PHASE_DEFS,getV:_getV,isRed:true});
                })
              ));
            }
            // Entregas semana
            var allEnts2=[];
            weekDays.forEach(function(wd){(depDeliveriesThisWeek[wd.date]||[]).forEach(function(e){allEnts2.push(e);});});
            if(allEnts2.length>0){
              sections.push(h('div',{key:'ent',style:{marginBottom:14}},
                h('div',{style:{fontSize:10,fontWeight:700,color:'var(--green)',
                  letterSpacing:'.08em',marginBottom:8,display:'flex',alignItems:'center',gap:6}},
                  '🏠 ENTREGAS ESTA SEMANA',
                  h('span',{style:{background:'rgba(34,197,94,.15)',color:'var(--green)',
                    borderRadius:6,padding:'0 6px',fontSize:10,fontWeight:700}},
                    allEnts2.length+' dpto'+(allEnts2.length>1?'s':''))
                ),
                allEnts2.map(function(ent){
                  return h(ReportDeptCard,{key:ent.dep.d,ent:ent,
                    saves:saves,reportSel:reportSel,
                    toggleDeptSel:toggleDeptSel,togglePartida:togglePartida,
                    phaseDefs:_PHASE_DEFS,getV:_getV,isRed:false});
                })
              ));
            }
            return sections;
          })()
        ),
        // Footer sticky
        h('div',{style:{padding:'10px 14px',borderTop:'1px solid var(--border)',
          display:'flex',gap:8,flexShrink:0,background:'var(--bg2)'}},
          h('button',{onClick:function(){setShowReportModal(false);},
            style:{flex:1,padding:'9px 0',borderRadius:8,border:'1px solid var(--border)',
              background:'var(--bg3)',color:'var(--text2)',fontSize:12,cursor:'pointer'}},'Cancelar'),
          h('button',{
            onClick:function(){generarPDFInforme(reportSel);},
            style:{flex:2,padding:'9px 0',borderRadius:8,border:'none',
              background:'var(--purple)',color:'#fff',fontSize:13,fontWeight:700,
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}},
            h('span',null,'📄'),'Exportar PDF')
        )
      )
    ),
    // ── DAYS ──
    weekDays.map`;

if (!html.includes(daysMarker)) { console.error('ERROR: days marker no encontrado'); process.exit(1); }
html = html.replace(daysMarker, reportModal);
console.log('✓ Modal de informe PDF inyectado');

// ── 6. Agregar componente ReportDeptCard antes de ProgramaView ────────────
const programaViewMarker = 'function ProgramaView({ganttData,saves,onWeekSave,weekData,auth,toast,userResp}){';
const reportDeptCardComp = `// ── Componente: Tarjeta de departamento en configuración de informe ──────
function ReportDeptCard({ent,saves,reportSel,toggleDeptSel,togglePartida,phaseDefs,getV,isRed}){
  var dn=ent.dep.d;
  var selD=reportSel[dn]||{};
  var[expanded,setExpanded]=useState(true);
  var nSel=0,nTotal=0;
  phaseDefs.forEach(function(ph){
    ph.ps.forEach(function(p){nTotal++;if((selD[ph.fk]||{})[p.id])nSel++;});
  });
  var borderColor=isRed?'rgba(239,68,68,.3)':'rgba(34,197,94,.3)';
  var headerBg=isRed?'rgba(239,68,68,.05)':'rgba(34,197,94,.04)';
  var mainColor=isRed?'var(--red)':'var(--green)';
  return h('div',{style:{background:'var(--bg3)',borderRadius:10,
    border:'1px solid '+borderColor,marginBottom:8,overflow:'hidden'}},
    // Header de departamento
    h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
      background:headerBg,borderBottom:'1px solid '+borderColor}},
      h('span',{style:{fontWeight:800,fontSize:14,color:mainColor,
        fontFamily:'var(--mono)',minWidth:44}},'D'+dn),
      h('div',{style:{flex:1,minWidth:0}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--text)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},ent.dep.n||''),
        h('div',{style:{fontSize:9,color:'var(--text3)'}},ent.pisoName||'')
      ),
      h('span',{style:{fontSize:9,color:'var(--text3)',whiteSpace:'nowrap'}},
        nSel+' / '+nTotal),
      // Quick select buttons
      h('div',{style:{display:'flex',gap:3}},
        h('button',{onClick:function(){toggleDeptSel(dn,'pending');},
          style:{padding:'2px 7px',borderRadius:5,border:'1px solid rgba(14,165,233,.3)',
            background:'rgba(14,165,233,.1)',color:'var(--blue)',
            fontSize:9,cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}},'Pendientes'),
        h('button',{onClick:function(){toggleDeptSel(dn,'all');},
          style:{padding:'2px 7px',borderRadius:5,border:'1px solid var(--border)',
            background:'var(--bg2)',color:'var(--text3)',
            fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}},'Todas'),
        h('button',{onClick:function(){toggleDeptSel(dn,'none');},
          style:{padding:'2px 7px',borderRadius:5,border:'1px solid var(--border)',
            background:'var(--bg2)',color:'var(--text3)',
            fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}},'Ninguna')
      ),
      h('button',{onClick:function(){setExpanded(!expanded);},
        style:{background:'transparent',border:'none',color:'var(--text3)',
          fontSize:12,cursor:'pointer',padding:'0 4px'}},expanded?'▲':'▼')
    ),
    // Lista de partidas (expandible)
    expanded&&h('div',{style:{padding:'6px 12px 8px'}},
      phaseDefs.map(function(ph){
        if(!ph.ps.length)return null;
        return h('div',{key:ph.fk,style:{marginBottom:6}},
          h('div',{style:{fontSize:8,fontWeight:700,color:ph.color,
            letterSpacing:'.06em',marginBottom:4,textTransform:'uppercase'}},ph.label),
          ph.ps.map(function(p){
            var sv=saves[dn]||{};
            var v=Math.round(getV(dn,ph,p));
            var isDone=v>=100;
            var isChecked=!!(selD[ph.fk]||{})[p.id];
            var statusColor=isDone?'var(--green)':v>0?'var(--amber)':'var(--text3)';
            return h('label',{key:p.id,
              style:{display:'flex',alignItems:'center',gap:6,padding:'3px 0',
                cursor:'pointer',opacity:isDone?.65:1,
                borderBottom:'1px solid rgba(255,255,255,.03)'}},
              h('input',{type:'checkbox',checked:isChecked,
                onChange:function(e){togglePartida(dn,ph.fk,p.id,e.target.checked);},
                style:{accentColor:ph.color,flexShrink:0}}),
              h('span',{style:{flex:1,fontSize:10,
                color:isDone?'var(--text3)':'var(--text)',
                textDecoration:isDone?'line-through':'none'}},
                p.name.replace(/^F[1-4] /i,'')),
              h('span',{style:{fontSize:10,fontWeight:700,color:statusColor,
                fontFamily:'var(--mono)',minWidth:30,textAlign:'right'}},
                v+'%')
            );
          })
        );
      })
    )
  );
}

${programaViewMarker}`;

if (!html.includes(programaViewMarker)) { console.error('ERROR: ProgramaView no encontrado'); process.exit(1); }
html = html.replace(programaViewMarker, reportDeptCardComp);
console.log('✓ Componente ReportDeptCard inyectado');

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
