
// ══════════════════════════════════════════════════════════════
// MÓDULO: ASISTENCIA
// ══════════════════════════════════════════════════════════════
function parseXlsxCasa(buffer){
  var wb=XLSX.read(new Uint8Array(buffer),{type:'array'});
  var wsName=wb.SheetNames.find(function(n){return n.trim().toUpperCase().includes('ASISTENCIA');})||wb.SheetNames[0];
  var ws=wb.Sheets[wsName];
  var raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
  var hdrIdx=-1,dayMap={};
  for(var i=0;i<raw.length;i++){
    var row=raw[i];
    var nums=row.filter(function(v){var n=parseInt(v);return n>=1&&n<=31&&String(v).trim()===String(n);});
    if(nums.length>=20){hdrIdx=i;row.forEach(function(v,ci){var n=parseInt(v);if(n>=1&&n<=31&&String(v).trim()===String(n))dayMap[ci]=n;});break;}
  }
  if(hdrIdx<0)return[];
  var workers=[];
  for(var r=hdrIdx+1;r<raw.length;r++){
    var row=raw[r];
    var nombre=String(row[3]||'').trim();
    if(!nombre||nombre==='APELLIDOS Y NOMBRES')continue;
    var w={num:String(row[1]||'').trim(),cod:String(row[2]||'').trim(),nombre:nombre,cargo:String(row[4]||'').trim(),rut:String(row[5]||'').trim(),dias:{}};
    Object.keys(dayMap).forEach(function(ci){w.dias[dayMap[ci]]=String(row[ci]||'').trim().toUpperCase();});
    workers.push(w);
  }
  return workers;
}
function parseXlsxSubcont(buffer){
  var wb=XLSX.read(new Uint8Array(buffer),{type:'array'});
  var result={};
  wb.SheetNames.forEach(function(sheetName){
    var ws=wb.Sheets[sheetName];
    var raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
    var hdrIdx=-1,dayMap={};
    for(var i=0;i<raw.length;i++){
      var row=raw[i];
      var nums=row.filter(function(v){var n=parseInt(v);return n>=1&&n<=31&&String(v).trim()===String(n);});
      if(nums.length>=15){hdrIdx=i;row.forEach(function(v,ci){var n=parseInt(v);if(n>=1&&n<=31&&String(v).trim()===String(n))dayMap[ci]=n;});break;}
    }
    if(hdrIdx<0)return;
    var workers=[];
    for(var r=hdrIdx+1;r<raw.length;r++){
      var row=raw[r];
      var nombre=String(row[3]||'').trim();
      if(!nombre||nombre.toUpperCase()==='APELLIDOS Y NOMBRES'||nombre.toUpperCase()==='FINIQUITADOS')continue;
      var w={num:String(row[1]||'').trim(),nombre:nombre,cargo:String(row[4]||'').trim(),rut:String(row[5]||'').trim(),dias:{}};
      Object.keys(dayMap).forEach(function(ci){w.dias[dayMap[ci]]=String(row[ci]||'').trim().toUpperCase();});
      workers.push(w);
    }
    if(workers.length>0)result[sheetName.trim()]=workers;
  });
  return result;
}

function AsistenciaView({asistData,onAsistSave,auth,toast}){
  var today=new Date();
  var[yr,setYr]=useState(today.getFullYear());
  var[mo,setMo]=useState(today.getMonth());
  var[tab,setTab]=useState('casa');
  var[dayView,setDayView]=useState(null);
  var[loading,setLoading]=useState(false);
  var isAdmin=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra');
  var MONTH_NAMES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var DAY_NAMES=['Lun','Mar','Mi\xe9','Jue','Vie','S\xe1b','Dom'];
  var todayStr=today.toISOString().slice(0,10);
  var moKey=yr+'-'+String(mo+1).padStart(2,'0');
  var moData=asistData[moKey]||{};
  var casaW=moData.casa||[];
  var subcW=moData.subcontratos||{};
  var firstDow=(new Date(yr,mo,1).getDay()+6)%7;
  var lastDate=new Date(yr,mo+1,0).getDate();
  var cells=[];for(var i=0;i<firstDow;i++)cells.push(null);for(var d=1;d<=lastDate;d++)cells.push(d);while(cells.length%7!==0)cells.push(null);
  var weeks=[];for(var w=0;w<cells.length;w+=7)weeks.push(cells.slice(w,w+7));

  function loadFile(tipo){
    var input=document.createElement('input');input.type='file';input.accept='.xlsx,.xls';
    input.onchange=function(e){
      var file=e.target.files[0];if(!file)return;setLoading(true);
      var reader=new FileReader();
      reader.onload=function(ev){
        try{
          var nd=Object.assign({},asistData);if(!nd[moKey])nd[moKey]={};
          if(tipo==='casa')nd[moKey].casa=parseXlsxCasa(ev.target.result);
          else nd[moKey].subcontratos=parseXlsxSubcont(ev.target.result);
          nd[moKey].loadedAt=new Date().toISOString();
          onAsistSave(nd);toast&&toast('Asistencia cargada correctamente');
        }catch(err){toast&&toast('Error al leer el archivo');}
        setLoading(false);
      };reader.readAsArrayBuffer(file);
    };input.click();
  }
  function getDayStat(day){
    if(tab==='casa'){
      var tot=casaW.length,pr=casaW.filter(function(w){return w.dias&&w.dias[day]==='X';}).length,pe=casaW.filter(function(w){return w.dias&&w.dias[day]==='P';}).length;
      return{total:tot,presentes:pr,permisos:pe,ausentes:tot-pr-pe};
    }
    var tot=0,pr=0,pe=0;
    Object.values(subcW).forEach(function(ws){ws.forEach(function(w){tot++;var dv=w.dias&&w.dias[day];if(dv==='X')pr++;else if(dv==='P')pe++;});});
    return{total:tot,presentes:pr,permisos:pe,ausentes:tot-pr-pe};
  }

  if(dayView){
    var dn=parseInt(dayView);
    var dl=dn+' de '+MONTH_NAMES[mo]+' '+yr;
    var casaList=casaW.map(function(w){return Object.assign({},w,{estado:(w.dias&&w.dias[dn])||'',empresa:'Casa'});});
    var subcList=[];Object.entries(subcW).forEach(function(kv){kv[1].forEach(function(w){subcList.push(Object.assign({},w,{empresa:kv[0],estado:(w.dias&&w.dias[dn])||''}));});});
    var list=tab==='casa'?casaList:subcList;
    var pr=list.filter(function(w){return w.estado==='X';}),pe=list.filter(function(w){return w.estado==='P';}),au=list.filter(function(w){return w.estado!=='X'&&w.estado!=='P';});
    var all=[].concat(pr,pe,au);
    function ecol(e){return e==='X'?'var(--green)':e==='P'?'var(--amber)':'var(--text3)';}
    function elbl(e){return e==='X'?'Presente':e==='P'?'Permiso':e==='#'?'Feriado':'Ausente';}
    return h('div',{className:'page'},
      h('div',{className:'flex aic jb mb10'},
        h('button',{className:'bc-btn',style:{fontSize:13},onClick:function(){setDayView(null);}},'← Asistencia'),
        h('div',{style:{textAlign:'right'}},
          h('div',{style:{fontSize:14,fontWeight:700,color:'var(--text)'}},dl),
          h('div',{style:{fontSize:11,color:'var(--text3)'}},pr.length+' presentes \xb7 '+pe.length+' permisos \xb7 '+au.length+' ausentes')
        )
      ),
      h('div',{className:'ftabs',style:{marginBottom:10}},
        [{k:'casa',l:'Casa ('+casaW.length+')'},{k:'subcontratos',l:'Subctos.'}].map(function(t){
          return h('button',{key:t.k,className:'ftab '+(tab===t.k?'on':''),onClick:function(){setTab(t.k);}},t.l);
        })
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}},
        h('div',{style:{textAlign:'center',padding:'8px',background:'rgba(34,197,94,.1)',borderRadius:8,border:'1px solid rgba(34,197,94,.2)'}},
          h('div',{style:{fontSize:22,fontWeight:800,color:'var(--green)',fontFamily:'var(--mono)'}},pr.length),
          h('div',{style:{fontSize:9,color:'var(--green)',marginTop:2,fontWeight:700,letterSpacing:'.06em'}},'PRESENTES')),
        h('div',{style:{textAlign:'center',padding:'8px',background:'rgba(245,158,11,.1)',borderRadius:8,border:'1px solid rgba(245,158,11,.2)'}},
          h('div',{style:{fontSize:22,fontWeight:800,color:'var(--amber)',fontFamily:'var(--mono)'}},pe.length),
          h('div',{style:{fontSize:9,color:'var(--amber)',marginTop:2,fontWeight:700,letterSpacing:'.06em'}},'PERMISOS')),
        h('div',{style:{textAlign:'center',padding:'8px',background:'rgba(239,68,68,.1)',borderRadius:8,border:'1px solid rgba(239,68,68,.2)'}},
          h('div',{style:{fontSize:22,fontWeight:800,color:'var(--red)',fontFamily:'var(--mono)'}},au.length),
          h('div',{style:{fontSize:9,color:'var(--red)',marginTop:2,fontWeight:700,letterSpacing:'.06em'}},'AUSENTES'))
      ),
      list.length===0?h('div',{style:{textAlign:'center',padding:40,color:'var(--text3)',fontSize:13}},'Sin datos cargados para este mes'):
      h('div',{className:'gap8'},
        all.map(function(w,i){
          var col=ecol(w.estado);
          return h('div',{key:i,style:{display:'flex',alignItems:'center',gap:10,background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px'}},
            h('div',{style:{width:8,height:8,borderRadius:'50%',background:col,flexShrink:0}}),
            h('div',{style:{flex:1}},
              h('div',{style:{fontSize:12,fontWeight:600,color:'var(--text)'}},w.nombre),
              h('div',{style:{fontSize:10,color:'var(--text3)'}},w.empresa+' \xb7 '+w.cargo+(w.rut?' \xb7 '+w.rut:''))
            ),
            h('div',{style:{fontSize:10,fontWeight:700,color:col,letterSpacing:'.04em'}},elbl(w.estado))
          );
        })
      )
    );
  }

  return h('div',{className:'page'},
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}},
      h('div',null,
        h('div',{style:{fontSize:18,fontWeight:700,letterSpacing:'.1em',color:'var(--text)',textTransform:'uppercase'}},'Asistencia'),
        h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:2}},'Control diario — pincha un d\xeda para ver detalle')
      ),
      isAdmin&&h('div',{style:{display:'flex',gap:6}},
        h('button',{onClick:function(){loadFile('casa');},style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',color:'var(--text2)',cursor:'pointer',fontSize:11,fontWeight:600}},loading?'Cargando...':'Cargar Casa'),
        h('button',{onClick:function(){loadFile('subcontratos');},style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',color:'var(--text2)',cursor:'pointer',fontSize:11,fontWeight:600}},loading?'...':'Cargar Subctos.')
      )
    ),
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}},
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h('button',{onClick:function(){if(mo===0){setMo(11);setYr(yr-1);}else setMo(mo-1);},style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',color:'var(--text2)',cursor:'pointer',fontSize:13}},'<'),
        h('span',{style:{fontSize:13,fontWeight:700,color:'var(--text)',minWidth:110,textAlign:'center'}},MONTH_NAMES[mo]+' '+yr),
        h('button',{onClick:function(){if(mo===11){setMo(0);setYr(yr+1);}else setMo(mo+1);},style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',color:'var(--text2)',cursor:'pointer',fontSize:13}},'>'),
        moData.loadedAt&&h('span',{style:{fontSize:9,color:'var(--text3)',marginLeft:4}},'act. '+moData.loadedAt.slice(0,10))
      ),
      h('div',{className:'ftabs',style:{margin:0}},
        [{k:'casa',l:'Casa'},{k:'subcontratos',l:'Subctos.'}].map(function(t){
          return h('button',{key:t.k,className:'ftab '+(tab===t.k?'on':''),onClick:function(){setTab(t.k);}},t.l);
        })
      )
    ),
    (tab==='casa'&&casaW.length===0)||(tab==='subcontratos'&&Object.keys(subcW).length===0)?
      h('div',{style:{textAlign:'center',padding:'18px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text3)',fontSize:12,marginBottom:10}},
        isAdmin?'Sin datos para este mes. Usa los botones "Cargar" para subir la planilla Excel.':'Sin datos de asistencia para este mes.'):null,
    h('div',{style:{overflowX:'auto'}},
      h('div',{style:{minWidth:280}},
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:2}},
          DAY_NAMES.map(function(dn,i){return h('div',{key:i,style:{textAlign:'center',fontSize:10,fontWeight:700,letterSpacing:'.08em',color:i>=5?'var(--amber)':'var(--text3)',padding:'4px 0',textTransform:'uppercase'}},dn);})
        ),
        weeks.map(function(week,wi){
          return h('div',{key:wi,style:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:2}},
            week.map(function(day,di){
              if(!day)return h('div',{key:di,style:{background:'rgba(6,13,24,.4)',borderRadius:6,minHeight:58}});
              var dKey2=yr+'-'+String(mo+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
              var isToday=dKey2===todayStr,isWeekend=di>=5;
              var st=getDayStat(day),hasData=st.total>0;
              var pct=hasData?Math.round(st.presentes/st.total*100):0;
              var barCol=pct>=90?'var(--green)':pct>=70?'var(--blue)':pct>0?'var(--amber)':'var(--text3)';
              return h('div',{key:di,onClick:hasData?function(){setDayView(String(day));}:null,style:{
                background:isToday?'rgba(14,165,233,.1)':'var(--card)',
                border:'1px solid '+(isToday?'rgba(14,165,233,.4)':hasData?'var(--border)':'rgba(30,58,95,.4)'),
                borderRadius:6,padding:'5px',minHeight:58,display:'flex',flexDirection:'column',gap:2,
                cursor:hasData?'pointer':'default',transition:'all .15s',opacity:hasData?1:.6}},
                h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between'}},
                  h('span',{style:{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:isToday?'var(--blue)':isWeekend?'var(--amber)':'var(--text2)',background:isToday?'rgba(14,165,233,.15)':'transparent',borderRadius:3,padding:isToday?'1px 4px':'0'}},day)
                ),
                hasData?[
                  h('div',{key:'bar',style:{height:3,background:'var(--bg3)',borderRadius:2,margin:'2px 0'}},h('div',{style:{height:'100%',width:pct+'%',background:barCol,borderRadius:2}})),
                  h('div',{key:'cnt',style:{fontSize:9,color:barCol,fontFamily:'var(--mono)',fontWeight:700}},st.presentes+'/'+st.total),
                  st.permisos>0&&h('div',{key:'pe',style:{fontSize:8,color:'var(--amber)'}},st.permisos+' permiso'+(st.permisos>1?'s':''))
                ]:isWeekend?h('span',{style:{fontSize:8,color:'var(--text3)'}},'FDS'):h('span',{style:{fontSize:8,color:'var(--text3)'}},'Sin datos')
              );
            })
          );
        })
      )
    )
  );
}

// ══════════════════════════════════════════════════════════════
// MÓDULO: SOBRE TIEMPO / COLACIÓN
// ══════════════════════════════════════════════════════════════
function generarPDFSobreTiempo(rec,fecha){
  var doc=new jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'letter'});
  var pw=doc.internal.pageSize.getWidth(),margin=18,y=16;
  doc.setFontSize(8);doc.setFont('helvetica','normal');
  doc.setDrawColor(0);doc.setLineWidth(0.3);
  doc.rect(margin,y-4,22,8);
  doc.text('Constructora',margin+1,y);doc.text('Bascu\xf1an',margin+1,y+3.5);
  doc.setFontSize(9);doc.text('fecha',pw-58,y);
  doc.setFont('helvetica','bold');doc.text(fecha,pw-44,y);
  y+=8;doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text('LISTADO DE PERSONAL SOBRE TIEMPO',pw/2,y,{align:'center'});
  var tot=0;
  (rec.jefatura||[]).forEach(function(){tot++;});
  (rec.bodega||[]).forEach(function(){tot++;});
  (rec.grupos||[]).forEach(function(g){(g.trabajadores||[]).forEach(function(){tot++;});});
  y+=4;doc.setFontSize(9);doc.setFont('helvetica','bold');
  doc.text('CANTIDAD',pw-margin,y,{align:'right'});
  y+=5;doc.setFontSize(13);doc.text(String(tot),pw-margin,y,{align:'right'});
  y+=5;doc.setLineWidth(0.3);doc.line(margin,y,pw-margin,y);y+=3;

  function drawSection(title,workers,cant){
    if(y>240){doc.addPage();y=16;}
    doc.setFontSize(9);doc.setFont('helvetica','bold');
    doc.text(title,margin,y);doc.text('CANT',pw-margin,y,{align:'right'});y+=4;
    doc.setFontSize(8);
    doc.text('ITEM',margin,y);doc.text('NOMBRE',margin+12,y);doc.text('CARGO',margin+95,y);doc.text('RUT',margin+130,y);
    doc.text(String(cant),pw-margin,y,{align:'right'});
    y+=2;doc.setLineWidth(0.2);doc.line(margin,y,pw-margin,y);y+=3;
    doc.setFont('helvetica','normal');
    var rows=Math.max((workers.length||0)+1,3);
    for(var i=0;i<rows;i++){
      var w=workers[i];
      doc.text(String(i+1),margin,y);
      if(w){
        doc.text((w.nombre||'').substring(0,36),margin+12,y);
        doc.text((w.cargo||'').substring(0,18),margin+95,y);
        doc.text((w.rut||'').substring(0,12),margin+130,y);
        if(w.sinColacion){
          doc.setFillColor(255,255,0);doc.rect(pw-margin-25,y-3,25,4,'F');
          doc.setFont('helvetica','bold');doc.text('SIN COLACION',pw-margin,y,{align:'right'});doc.setFont('helvetica','normal');
        }
      }
      y+=5;if(y>250){doc.addPage();y=16;}
    }
    y+=2;
  }

  drawSection('JEFATURA',rec.jefatura||[],(rec.jefatura||[]).length);
  drawSection('ENCARGADO DE BODEGA',rec.bodega||[],(rec.bodega||[]).length);
  (rec.grupos||[]).forEach(function(g,gi){
    var svn=g.supervisor?g.supervisor.nombre:'';
    drawSection('PERSONAL '+(gi+1)+' : DEL SUPERVISOR '+svn,g.trabajadores||[],(g.trabajadores||[]).length);
    if(g.funciones){
      if(y>245){doc.addPage();y=16;}
      doc.setFont('helvetica','bold');doc.setFontSize(8);
      doc.text('FUNCIONES : '+g.funciones,margin,y);doc.setFont('helvetica','normal');y+=7;
    }
  });
  doc.save('sobretiempo_'+fecha.replace(/-/g,'')+'.pdf');
}

function SobretiempoView({asistData,stData,onStSave,auth,toast}){
  var today=new Date().toISOString().slice(0,10);
  var[fecha,setFecha]=useState(today);
  var[monto,setMonto]=useState(1800);
  var[jefatura,setJefatura]=useState([]);
  var[bodega,setBodega]=useState([]);
  var[grupos,setGrupos]=useState([]);
  var[showPicker,setShowPicker]=useState(null);
  var[pickerQ,setPickerQ]=useState('');
  var[manNom,setManNom]=useState('');
  var[manCgo,setManCgo]=useState('');
  var[manRut,setManRut]=useState('');
  var isAdmin=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra');
  var moKey=fecha.slice(0,7);
  var asistMo=asistData[moKey]||{};
  var allPersonal=asistMo.casa||[];
  var savedRec=stData[fecha];
  var totalPersonas=jefatura.length+bodega.length;grupos.forEach(function(g){totalPersonas+=(g.trabajadores||[]).length;});
  var totalConCol=jefatura.length+bodega.length;grupos.forEach(function(g){(g.trabajadores||[]).forEach(function(t){if(!t.sinColacion)totalConCol++;});});
  var montoTotal=totalConCol*monto;

  function doSave(){onStSave(Object.assign({},stData,{[fecha]:{fecha,monto,jefatura,bodega,grupos,savedAt:new Date().toISOString()}}));toast&&toast('Guardado');}
  function loadRec(){if(savedRec){setMonto(savedRec.monto||1800);setJefatura(savedRec.jefatura||[]);setBodega(savedRec.bodega||[]);setGrupos(savedRec.grupos||[]);toast&&toast('Registro cargado');}}
  function addGrupo(){setGrupos(grupos.concat([{supervisor:null,funciones:'',trabajadores:[]}]));}
  function updGrupo(gi,ch){var ng=grupos.slice();ng[gi]=Object.assign({},ng[gi],ch);setGrupos(ng);}
  function remGrupo(gi){setGrupos(grupos.filter(function(_,i){return i!==gi;}));}
  function addWtoGrupo(gi,w){var ng=grupos.slice();var ws2=(ng[gi].trabajadores||[]).slice();ws2.push(Object.assign({},w,{sinColacion:false}));ng[gi]=Object.assign({},ng[gi],{trabajadores:ws2});setGrupos(ng);}
  function toggleSC(gi,wi){var ng=grupos.slice();var ws2=(ng[gi].trabajadores||[]).slice();ws2[wi]=Object.assign({},ws2[wi],{sinColacion:!ws2[wi].sinColacion});ng[gi]=Object.assign({},ng[gi],{trabajadores:ws2});setGrupos(ng);}
  function remWfromGrupo(gi,wi){var ng=grupos.slice();ng[gi]=Object.assign({},ng[gi],{trabajadores:(ng[gi].trabajadores||[]).filter(function(_,i){return i!==wi;})});setGrupos(ng);}

  function pickWorker(w){
    var pw2={nombre:w.nombre,cargo:w.cargo,rut:w.rut};
    if(showPicker.t==='jefatura')setJefatura(jefatura.concat([pw2]));
    else if(showPicker.t==='bodega')setBodega(bodega.concat([pw2]));
    else if(showPicker.t==='supervisor')updGrupo(showPicker.gi,{supervisor:pw2});
    else if(showPicker.t==='grupo')addWtoGrupo(showPicker.gi,pw2);
    setShowPicker(null);setPickerQ('');setManNom('');setManCgo('');setManRut('');
  }
  function pickManual(){
    if(!manNom.trim())return;
    pickWorker({nombre:manNom.trim().toUpperCase(),cargo:manCgo.trim().toUpperCase(),rut:manRut.trim()});
  }
  var pickerRes=allPersonal.filter(function(w){
    if(!pickerQ.trim())return true;var q=pickerQ.toLowerCase();
    return w.nombre.toLowerCase().includes(q)||w.cargo.toLowerCase().includes(q)||(w.rut||'').includes(q);
  }).slice(0,20);

  if(showPicker){
    return h('div',{className:'page'},
      h('div',{className:'flex aic jb mb10'},
        h('button',{className:'bc-btn',style:{fontSize:13},onClick:function(){setShowPicker(null);setPickerQ('');setManNom('');setManCgo('');setManRut('');}},'<- Sobre Tiempo'),
        h('div',{style:{fontSize:13,fontWeight:700,color:'var(--text)'}},'Seleccionar Personal')
      ),
      h('div',{className:'search-wrap'},
        h('span',{className:'search-icon'},'🔍'),
        h('input',{autoFocus:true,value:pickerQ,onChange:function(e){setPickerQ(e.target.value);},placeholder:'Buscar nombre, cargo o RUT...'})
      ),
      h('div',{style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:12,marginBottom:10}},
        h('div',{style:{fontSize:10,color:'var(--text3)',marginBottom:7,fontWeight:700,letterSpacing:'.06em'}},'INGRESO MANUAL'),
        h('div',{style:{display:'flex',flexWrap:'wrap',gap:5,marginBottom:6}},
          h('input',{placeholder:'Nombre completo',value:manNom,onChange:function(e){setManNom(e.target.value);},style:{flex:'2 1 150px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 8px',color:'var(--text)',fontSize:12,outline:'none'}}),
          h('input',{placeholder:'Cargo',value:manCgo,onChange:function(e){setManCgo(e.target.value);},style:{flex:'1 1 100px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 8px',color:'var(--text)',fontSize:12,outline:'none'}}),
          h('input',{placeholder:'RUT',value:manRut,onChange:function(e){setManRut(e.target.value);},onKeyDown:function(e){if(e.key==='Enter')pickManual();},style:{flex:'0 0 100px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 8px',color:'var(--text)',fontSize:12,outline:'none'}}),
          h('button',{onClick:pickManual,style:{background:'var(--blue)',border:'none',borderRadius:6,color:'#fff',fontSize:12,padding:'7px 12px',cursor:'pointer',fontWeight:700}},'+ Agregar')
        )
      ),
      allPersonal.length===0&&h('div',{style:{padding:10,background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',borderRadius:8,fontSize:11,color:'var(--amber)',marginBottom:8}},'Sin base de personal. Carga la asistencia o usa el ingreso manual.'),
      h('div',{className:'gap8'},
        pickerRes.map(function(w,i){
          return h('button',{key:i,onClick:function(){pickWorker(w);},style:{width:'100%',textAlign:'left',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',cursor:'pointer',transition:'all .15s'}},
            h('div',{style:{fontSize:13,fontWeight:600,color:'var(--text)'}},w.nombre),
            h('div',{style:{fontSize:10,color:'var(--text3)',marginTop:2}},w.cargo+(w.rut?' \xb7 '+w.rut:''))
          );
        })
      )
    );
  }

  function wRow(w,onRem,onSC,showSC){
    return h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid rgba(30,58,95,.3)'}},
      h('div',{style:{flex:1}},
        h('div',{style:{fontSize:12,fontWeight:600,color:'var(--text)'}},w.nombre),
        h('div',{style:{fontSize:10,color:'var(--text3)'}},w.cargo+(w.rut?' \xb7 '+w.rut:''))
      ),
      showSC&&h('button',{onClick:onSC,style:{fontSize:10,padding:'3px 7px',borderRadius:4,border:'1px solid '+(w.sinColacion?'var(--amber)':'var(--border)'),background:w.sinColacion?'rgba(245,158,11,.15)':'transparent',color:w.sinColacion?'var(--amber)':'var(--text3)',cursor:'pointer',whiteSpace:'nowrap'}},'Sin colaci\xf3n'),
      h('button',{onClick:onRem,style:{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:15,lineHeight:1,padding:'0 4px'}},'x')
    );
  }

  return h('div',{className:'page'},
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}},
      h('div',null,
        h('div',{style:{fontSize:18,fontWeight:700,letterSpacing:'.1em',color:'var(--text)',textTransform:'uppercase'}},'Sobre Tiempo'),
        h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:2}},'Colaci\xf3n — Listado de personal por supervisor')
      ),
      h('div',{style:{display:'flex',gap:6,alignItems:'center'}},
        savedRec&&h('button',{onClick:loadRec,style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 9px',color:'var(--text3)',cursor:'pointer',fontSize:11,fontWeight:600}},'Cargar'),
        h('button',{onClick:doSave,style:{background:'var(--blue)',border:'none',borderRadius:6,padding:'6px 12px',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700}},'Guardar')
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}},
      h('div',{style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:12}},
        h('div',{style:{fontSize:10,color:'var(--text3)',marginBottom:5,fontWeight:700,letterSpacing:'.07em'}},'FECHA'),
        h('input',{type:'date',value:fecha,onChange:function(e){setFecha(e.target.value);},style:{width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 10px',color:'var(--text)',fontSize:13,outline:'none',boxSizing:'border-box'}})
      ),
      h('div',{style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:12}},
        h('div',{style:{fontSize:10,color:'var(--text3)',marginBottom:5,fontWeight:700,letterSpacing:'.07em'}},'MONTO POR PERSONA'),
        h('div',{style:{display:'flex',alignItems:'center',gap:6}},
          h('span',{style:{fontSize:13,color:'var(--text2)'}},'$'),
          h('input',{type:'number',value:monto,onChange:function(e){setMonto(parseInt(e.target.value)||0);},style:{flex:1,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 8px',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'var(--mono)'}})
        )
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}},
      h('div',{className:'card',style:{textAlign:'center',padding:'10px 8px'}},h('div',{className:'card-title'},'PERSONAL'),h('div',{className:'card-val',style:{fontSize:26,color:'var(--blue)'}},totalPersonas)),
      h('div',{className:'card',style:{textAlign:'center',padding:'10px 8px'}},h('div',{className:'card-title'},'CON COLACI\xd3N'),h('div',{className:'card-val',style:{fontSize:26,color:'var(--green)'}},totalConCol)),
      h('div',{className:'card',style:{textAlign:'center',padding:'10px 8px'}},h('div',{className:'card-title'},'MONTO TOTAL'),h('div',{style:{fontSize:16,fontWeight:700,fontFamily:'var(--mono)',color:'var(--amber)'}},'$'+montoTotal.toLocaleString('es-CL')))
    ),
    h('div',{style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:12,marginBottom:8}},
      h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--text)',letterSpacing:'.08em'}},'JEFATURA'),
        jefatura.length<3&&h('button',{onClick:function(){setShowPicker({t:'jefatura'});},style:{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text2)',cursor:'pointer'}},'+ Agregar')
      ),
      jefatura.length===0?h('div',{style:{fontSize:11,color:'var(--text3)',textAlign:'center',padding:'6px'}},'Sin jefatura asignada'):jefatura.map(function(w,i){return wRow(w,function(){setJefatura(jefatura.filter(function(_,x){return x!==i;}));},null,false);})
    ),
    h('div',{style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:12,marginBottom:8}},
      h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--text)',letterSpacing:'.08em'}},'ENCARGADO DE BODEGA'),
        bodega.length<1&&h('button',{onClick:function(){setShowPicker({t:'bodega'});},style:{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text2)',cursor:'pointer'}},'+ Agregar')
      ),
      bodega.length===0?h('div',{style:{fontSize:11,color:'var(--text3)',textAlign:'center',padding:'6px'}},'Sin bodeguero asignado'):bodega.map(function(w,i){return wRow(w,function(){setBodega(bodega.filter(function(_,x){return x!==i;}));},null,false);})
    ),
    h('div',{className:'gap8'},
      grupos.map(function(grupo,gi){
        return h('div',{key:gi,style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}},
          h('div',{style:{padding:'10px 12px',background:'rgba(14,165,233,.04)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}},
            h('div',{style:{fontSize:11,fontWeight:700,color:'var(--blue)',letterSpacing:'.06em'}},'PERSONAL '+(gi+1)+(grupo.supervisor?' : '+grupo.supervisor.nombre:'')),
            h('div',{style:{display:'flex',gap:6,alignItems:'center'}},
              h('span',{style:{fontSize:11,color:'var(--text3)'}},(grupo.trabajadores||[]).length+' trab.'),
              h('button',{onClick:function(){remGrupo(gi);},style:{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:5,color:'var(--red)',cursor:'pointer',fontSize:10,padding:'2px 7px'}},'Eliminar')
            )
          ),
          h('div',{style:{padding:'10px 12px'}},
            h('div',{style:{marginBottom:10}},
              h('div',{style:{fontSize:10,color:'var(--text3)',marginBottom:5,fontWeight:600,letterSpacing:'.06em'}},'SUPERVISOR DEL GRUPO'),
              grupo.supervisor?
                h('div',{style:{display:'flex',alignItems:'center',gap:8,background:'var(--bg2)',borderRadius:7,padding:'7px 10px'}},
                  h('div',{style:{flex:1}},h('div',{style:{fontSize:12,fontWeight:600,color:'var(--text)'}},grupo.supervisor.nombre),h('div',{style:{fontSize:10,color:'var(--text3)'}},grupo.supervisor.cargo)),
                  h('button',{onClick:function(){updGrupo(gi,{supervisor:null});},style:{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:13}},'x')
                ):
                h('button',{onClick:function(){setShowPicker({t:'supervisor',gi:gi});},style:{width:'100%',padding:'7px',borderRadius:7,border:'1px dashed var(--border)',background:'transparent',color:'var(--text3)',cursor:'pointer',fontSize:11}},'+ Seleccionar supervisor')
            ),
            h('div',{style:{marginBottom:8}},
              h('div',{style:{fontSize:10,color:'var(--text3)',marginBottom:5,fontWeight:600,letterSpacing:'.06em'}},'TRABAJADORES'),
              (grupo.trabajadores||[]).length===0?h('div',{style:{fontSize:11,color:'var(--text3)',textAlign:'center',padding:'5px'}},'Sin trabajadores'):
              (grupo.trabajadores||[]).map(function(w,wi){return wRow(w,function(){remWfromGrupo(gi,wi);},function(){toggleSC(gi,wi);},true);}),
              h('button',{onClick:function(){setShowPicker({t:'grupo',gi:gi});},style:{width:'100%',marginTop:6,padding:'5px',borderRadius:6,border:'1px dashed rgba(14,165,233,.3)',background:'transparent',color:'rgba(14,165,233,.6)',cursor:'pointer',fontSize:11}},'+ Agregar trabajador')
            ),
            h('div',null,
              h('div',{style:{fontSize:10,color:'var(--text3)',marginBottom:4,fontWeight:600,letterSpacing:'.06em'}},'FUNCIONES'),
              h('textarea',{value:grupo.funciones||'',onChange:function(e){updGrupo(gi,{funciones:e.target.value.toUpperCase()});},placeholder:'Describir las tareas del grupo...',rows:2,style:{width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 9px',color:'var(--text)',fontSize:12,outline:'none',resize:'none',boxSizing:'border-box',fontFamily:'var(--font)'}})
            )
          )
        );
      }),
      h('button',{onClick:addGrupo,style:{width:'100%',padding:'10px',borderRadius:10,border:'1px dashed rgba(14,165,233,.4)',background:'transparent',color:'var(--blue)',cursor:'pointer',fontSize:13,fontWeight:600}},'+ Agregar grupo de personal')
    ),
    h('div',{style:{marginTop:16}},
      h('button',{onClick:function(){
        if(typeof jspdf==='undefined'){toast&&toast('Error: jsPDF no disponible');return;}
        doSave();generarPDFSobreTiempo({jefatura,bodega,grupos,monto},fecha);toast&&toast('PDF generado');
      },style:{width:'100%',padding:'12px',borderRadius:10,background:'var(--green)',border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',letterSpacing:'.05em'}},'Generar PDF')
    )
  );
}

