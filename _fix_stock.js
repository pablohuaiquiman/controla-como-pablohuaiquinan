const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const raw = fs.readFileSync(filePath);
const hasCRLF = raw.indexOf('\r\n') !== -1;
let html = raw.toString('utf8').replace(/\r\n/g, '\n');

// ── 1. Agregar refs y estados de stock en LogisticaView ───────────────────
const oldStates = `  var[editMat,setEditMat]=useState(null); // {ei:entryIdx, mi:matIdx}
  var[editMatDraft,setEditMatDraft]=useState({name:'',qty:'',ud:'un'});
  var isAdmin=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra');`;

const newStates = `  var[editMat,setEditMat]=useState(null); // {ei:entryIdx, mi:matIdx}
  var[editMatDraft,setEditMatDraft]=useState({name:'',qty:'',ud:'un'});
  // ── STOCK ──
  var ofiCamRef=useRef(null);
  var ofiFileRef=useRef(null);
  var bodCamRef=useRef(null);
  var bodFileRef=useRef(null);
  var[showStockOfi,setShowStockOfi]=useState(false);
  var[showStockBod,setShowStockBod]=useState(false);
  var[addStockOfiForm,setAddStockOfiForm]=useState(false);
  var[addStockBodForm,setAddStockBodForm]=useState(false);
  var[stockFormDraft,setStockFormDraft]=useState({name:'',qty:'',ud:'un'});
  var[editStockItem,setEditStockItem]=useState(null);
  var[editStockDraft,setEditStockDraft]=useState({name:'',qty:'',ud:'un'});
  var[showTransfer,setShowTransfer]=useState(false);
  var[transferQtys,setTransferQtys]=useState({});
  var[guidesSec,setGuidesSec]=useState(null);
  var isAdmin=auth&&(auth.role==='Admin'||auth.role==='Jefe Obra');`;

if (!html.includes(oldStates)) { console.error('ERROR: estados de LogisticaView no encontrados'); process.exit(1); }
html = html.replace(oldStates, newStates);
console.log('✓ Estados y refs de stock agregados');

// ── 2. Agregar funciones de stock antes de "if(showUnits&&isAdmin)" ───────
const funcMarker = `  if(showUnits&&isAdmin){`;
const stockFns = `  // ── FUNCIONES STOCK ────────────────────────────────────────────────────
  var stockOfi=logData['__stock_ofi']||{mats:[],guides:[]};
  var stockBod=logData['__stock_bod']||{mats:[],guides:[]};
  function saveStockSec(sk,data){onLogSave(Object.assign({},logData,{['__stock_'+sk]:data}));}
  function addStockMat(sk,nm,qty,ud){
    var s=Object.assign({},logData['__stock_'+sk]||{mats:[],guides:[]});
    var ms=(s.mats||[]).slice();
    ms.push({id:Date.now()+'',name:nm,qty:Number(qty)||0,ud:ud||'un'});
    saveStockSec(sk,Object.assign({},s,{mats:ms}));
  }
  function updateStockMat(sk,idx,patch){
    var s=Object.assign({},logData['__stock_'+sk]||{mats:[],guides:[]});
    var ms=(s.mats||[]).slice();
    ms[idx]=Object.assign({},ms[idx],patch);
    saveStockSec(sk,Object.assign({},s,{mats:ms}));
  }
  function deleteStockMat(sk,idx){
    var s=Object.assign({},logData['__stock_'+sk]||{mats:[],guides:[]});
    saveStockSec(sk,Object.assign({},s,{mats:(s.mats||[]).filter(function(_,i){return i!==idx;})}));
  }
  function compressImg(dataUrl,cb){
    var img=new Image();
    img.onload=function(){
      var max=800,w=img.width,h2=img.height;
      if(w>max||h2>max){var r=Math.min(max/w,max/h2);w=Math.round(w*r);h2=Math.round(h2*r);}
      var cv=document.createElement('canvas');cv.width=w;cv.height=h2;
      cv.getContext('2d').drawImage(img,0,0,w,h2);
      cb(cv.toDataURL('image/jpeg',0.55));
    };
    img.src=dataUrl;
  }
  function handleGuideFile(sk,file){
    if(!file)return;
    var rd=new FileReader();
    rd.onload=function(ev){
      compressImg(ev.target.result,function(compressed){
        var s=Object.assign({},logData['__stock_'+sk]||{mats:[],guides:[]});
        var gs=(s.guides||[]).slice();
        gs.push({ts:Date.now(),name:file.name,data:compressed});
        saveStockSec(sk,Object.assign({},s,{guides:gs}));
        toast&&toast('✓ Guía agregada');
      });
    };
    rd.readAsDataURL(file);
  }
  function deleteStockGuide(sk,idx){
    var s=Object.assign({},logData['__stock_'+sk]||{mats:[],guides:[]});
    saveStockSec(sk,Object.assign({},s,{guides:(s.guides||[]).filter(function(_,i){return i!==idx;})}));
  }
  function doTransfer(){
    var so=Object.assign({},logData['__stock_ofi']||{mats:[],guides:[]});
    var sb=Object.assign({},logData['__stock_bod']||{mats:[],guides:[]});
    var mo2=(so.mats||[]).slice();
    var mb2=(sb.mats||[]).slice();
    Object.keys(transferQtys).forEach(function(ix){
      var qty=Number(transferQtys[ix])||0;
      if(qty<=0)return;
      var i=parseInt(ix);
      var mat=mo2[i];if(!mat)return;
      mo2[i]=Object.assign({},mat,{qty:Math.max(0,(mat.qty||0)-qty)});
      var bi=mb2.findIndex(function(m){return m.name===mat.name&&m.ud===mat.ud;});
      if(bi>=0)mb2[bi]=Object.assign({},mb2[bi],{qty:(mb2[bi].qty||0)+qty});
      else mb2.push({id:Date.now()+'_'+i,name:mat.name,qty:qty,ud:mat.ud||'un'});
    });
    onLogSave(Object.assign({},logData,{
      '__stock_ofi':Object.assign({},so,{mats:mo2}),
      '__stock_bod':Object.assign({},sb,{mats:mb2})
    }));
    setTransferQtys({});setShowTransfer(false);
    toast&&toast('✓ Transferencia completada');
  }
  if(showUnits&&isAdmin){`;

if (!html.includes(funcMarker)) { console.error('ERROR: marker if(showUnits&&isAdmin) no encontrado'); process.exit(1); }
html = html.replace(funcMarker, stockFns);
console.log('✓ Funciones de stock inyectadas');

// ── 3. Inyectar sección STOCK al final del return del calendario ───────────
// Cambiar el cierre del return principal del calendario para agregar los cards de stock
const calendarEnd = `        })
      )
    )
  );
}

function MatView(`;

const stockUI = `        })
      )
    ),
    // ── FILE INPUTS OCULTOS ───────────────────────────────────────────────
    h('input',{ref:ofiCamRef,type:'file',accept:'image/*',capture:'environment',
      style:{display:'none'},onChange:function(e){handleGuideFile('ofi',e.target.files&&e.target.files[0]);e.target.value=''}}),
    h('input',{ref:ofiFileRef,type:'file',accept:'image/*,application/pdf',
      style:{display:'none'},onChange:function(e){handleGuideFile('ofi',e.target.files&&e.target.files[0]);e.target.value=''}}),
    h('input',{ref:bodCamRef,type:'file',accept:'image/*',capture:'environment',
      style:{display:'none'},onChange:function(e){handleGuideFile('bod',e.target.files&&e.target.files[0]);e.target.value=''}}),
    h('input',{ref:bodFileRef,type:'file',accept:'image/*,application/pdf',
      style:{display:'none'},onChange:function(e){handleGuideFile('bod',e.target.files&&e.target.files[0]);e.target.value=''}}),
    // ── STOCK OFICINA CENTRAL ─────────────────────────────────────────────
    h('div',{style:{background:'var(--card)',border:'1px solid rgba(14,165,233,.3)',
      borderRadius:12,marginTop:14,overflow:'hidden'}},
      h('div',{onClick:function(){setShowStockOfi(!showStockOfi);},
        style:{padding:'12px 16px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',
          background:'rgba(14,165,233,.05)',
          borderBottom:showStockOfi?'1px solid rgba(14,165,233,.15)':'none'}},
        h('span',{style:{fontSize:20}},'🏢'),
        h('div',{style:{flex:1}},
          h('div',{style:{fontSize:13,fontWeight:800,color:'var(--text)',letterSpacing:'.06em'}},
            'STOCK OFICINA CENTRAL'),
          h('div',{style:{fontSize:11,color:'var(--text3)'}},
            stockOfi.mats.length+' material'+(stockOfi.mats.length!==1?'es':'')+
            (stockOfi.guides.length?' · '+stockOfi.guides.length+' guía'+(stockOfi.guides.length!==1?'s':''):''))
        ),
        h('span',{style:{color:'var(--blue)',fontSize:14,fontWeight:700}},showStockOfi?'▲':'▼')
      ),
      showStockOfi&&h('div',{style:{padding:'12px 14px'}},
        stockOfi.mats.length>0&&h('div',{style:{marginBottom:10}},
          h('div',{style:{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',
            marginBottom:6,textTransform:'uppercase'}},'MATERIALES EN STOCK'),
          stockOfi.mats.map(function(m,mi){
            var isEdit=editStockItem&&editStockItem.sec==='ofi'&&editStockItem.idx===mi;
            if(isEdit){
              return h('div',{key:mi,style:{display:'flex',flexDirection:'column',gap:5,
                padding:'7px 0',borderBottom:mi<stockOfi.mats.length-1?'1px solid rgba(14,165,233,.1)':'none'}},
                h('div',{style:{display:'flex',gap:4}},
                  h('input',{autoFocus:true,value:editStockDraft.name,
                    onChange:function(e){setEditStockDraft(Object.assign({},editStockDraft,{name:e.target.value}));},
                    style:{flex:2,background:'var(--bg2)',border:'1px solid var(--blue)',borderRadius:5,
                      padding:'5px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                  h('input',{value:editStockDraft.qty,placeholder:'Cant.',
                    onChange:function(e){setEditStockDraft(Object.assign({},editStockDraft,{qty:e.target.value}));},
                    style:{flex:'0 0 52px',background:'var(--bg2)',border:'1px solid var(--border)',
                      borderRadius:5,padding:'5px 5px',color:'var(--text)',fontSize:12,outline:'none'}}),
                  h('select',{value:editStockDraft.ud,
                    onChange:function(e){setEditStockDraft(Object.assign({},editStockDraft,{ud:e.target.value}));},
                    style:{flex:'0 0 62px',background:'var(--bg2)',border:'1px solid var(--border)',
                      borderRadius:5,padding:'5px 2px',color:'var(--text2)',fontSize:12,outline:'none'}},
                    UNITS.map(function(u){return h('option',{key:u,value:u},u);}))
                ),
                h('div',{style:{display:'flex',gap:5}},
                  h('button',{onClick:function(){
                    updateStockMat('ofi',mi,{name:editStockDraft.name.trim(),
                      qty:Number(editStockDraft.qty)||0,ud:editStockDraft.ud});
                    setEditStockItem(null);toast&&toast('✓ Guardado');
                  },style:{flex:1,padding:'5px 0',borderRadius:6,background:'var(--green)',border:'none',
                    color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}},'Guardar'),
                  h('button',{onClick:function(){setEditStockItem(null);},
                    style:{padding:'5px 10px',borderRadius:6,border:'1px solid var(--border)',
                      background:'transparent',color:'var(--text3)',fontSize:12,cursor:'pointer'}},'Cancelar')
                )
              );
            }
            return h('div',{key:mi,style:{display:'flex',alignItems:'center',gap:8,
              padding:'6px 0',borderBottom:mi<stockOfi.mats.length-1?'1px solid rgba(14,165,233,.08)':'none'}},
              h('span',{style:{fontSize:12,color:'var(--text)',flex:1}},m.name),
              h('span',{style:{fontSize:12,fontFamily:'var(--mono)',color:'var(--blue)',fontWeight:700}},
                (m.qty||0)+' '+(m.ud||'un')),
              canEdit&&h('div',{style:{display:'flex',gap:3}},
                h('button',{onClick:function(){
                  setEditStockItem({sec:'ofi',idx:mi});
                  setEditStockDraft({name:m.name,qty:String(m.qty||0),ud:m.ud||'un'});
                },style:{background:'rgba(14,165,233,.1)',border:'1px solid rgba(14,165,233,.2)',
                  borderRadius:5,color:'var(--blue)',cursor:'pointer',fontSize:10,padding:'2px 7px'}},'Editar'),
                h('button',{onClick:function(){deleteStockMat('ofi',mi);},
                  style:{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.15)',
                    borderRadius:5,color:'var(--red)',cursor:'pointer',fontSize:10,padding:'2px 6px'}},'x')
              )
            );
          })
        ),
        canEdit&&(addStockOfiForm
          ?h('div',{style:{background:'var(--bg2)',borderRadius:8,padding:'8px 10px',marginBottom:10}},
              h('div',{style:{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:6,
                letterSpacing:'.07em'}},'AGREGAR MATERIAL'),
              h('div',{style:{display:'flex',gap:4,marginBottom:6}},
                h('input',{autoFocus:true,placeholder:'Nombre...',value:stockFormDraft.name,
                  onChange:function(e){setStockFormDraft(Object.assign({},stockFormDraft,{name:e.target.value}));},
                  onKeyDown:function(e){if(e.key==='Escape')setAddStockOfiForm(false);},
                  style:{flex:2,background:'var(--bg3)',border:'1px solid var(--blue)',borderRadius:5,
                    padding:'6px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                h('input',{value:stockFormDraft.qty,placeholder:'Cant.',
                  onChange:function(e){setStockFormDraft(Object.assign({},stockFormDraft,{qty:e.target.value}));},
                  style:{flex:'0 0 52px',background:'var(--bg3)',border:'1px solid var(--border)',
                    borderRadius:5,padding:'6px 5px',color:'var(--text)',fontSize:12,outline:'none'}}),
                h('select',{value:stockFormDraft.ud,
                  onChange:function(e){setStockFormDraft(Object.assign({},stockFormDraft,{ud:e.target.value}));},
                  style:{flex:'0 0 62px',background:'var(--bg3)',border:'1px solid var(--border)',
                    borderRadius:5,padding:'6px 2px',color:'var(--text2)',fontSize:12,outline:'none'}},
                  UNITS.map(function(u){return h('option',{key:u,value:u},u);}))
              ),
              h('div',{style:{display:'flex',gap:5}},
                h('button',{onClick:function(){
                  if(!stockFormDraft.name.trim())return;
                  addStockMat('ofi',stockFormDraft.name.trim(),stockFormDraft.qty,stockFormDraft.ud);
                  setStockFormDraft({name:'',qty:'',ud:stockFormDraft.ud});
                  setAddStockOfiForm(false);toast&&toast('✓ Material agregado');
                },style:{flex:1,padding:'6px 0',borderRadius:6,background:'var(--blue)',border:'none',
                  color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}},'+ Agregar'),
                h('button',{onClick:function(){setAddStockOfiForm(false);},
                  style:{padding:'6px 10px',borderRadius:6,border:'1px solid var(--border)',
                    background:'transparent',color:'var(--text3)',fontSize:12,cursor:'pointer'}},'Cancelar')
              )
            )
          :h('button',{onClick:function(){setAddStockOfiForm(true);setStockFormDraft({name:'',qty:'',ud:'un'});},
              style:{width:'100%',padding:'7px 0',borderRadius:7,border:'1px dashed rgba(14,165,233,.4)',
                background:'transparent',color:'rgba(14,165,233,.8)',cursor:'pointer',
                fontSize:12,fontWeight:600,marginBottom:10}},
              '+ Agregar material')
        ),
        h('div',{style:{borderTop:'1px solid rgba(14,165,233,.1)',paddingTop:10}},
          h('div',{style:{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',
            marginBottom:8,textTransform:'uppercase'}},'GUÍAS DE DESPACHO'),
          stockOfi.guides.length>0&&h('div',{style:{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}},
            stockOfi.guides.map(function(g,gi){
              return h('div',{key:gi,style:{position:'relative',width:64,height:64}},
                h('img',{src:g.data,alt:'Guía',
                  style:{width:64,height:64,objectFit:'cover',borderRadius:6,cursor:'pointer',
                    border:'1px solid rgba(14,165,233,.3)'},
                  onClick:function(){setGuidesSec({sec:'ofi',idx:gi});}}),
                canEdit&&h('button',{onClick:function(){deleteStockGuide('ofi',gi);},
                  style:{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',
                    background:'var(--red)',border:'none',color:'#fff',fontSize:9,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center'}},'x')
              );
            })
          ),
          h('div',{style:{display:'flex',gap:6}},
            h('button',{onClick:function(){ofiCamRef.current&&ofiCamRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(14,165,233,.3)',
                background:'rgba(14,165,233,.07)',color:'var(--blue)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📷 Fotografiar Guía'),
            h('button',{onClick:function(){ofiFileRef.current&&ofiFileRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(14,165,233,.3)',
                background:'rgba(14,165,233,.07)',color:'var(--blue)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📁 Cargar Guía')
          )
        )
      )
    ),
    // ── STOCK BODEGA ──────────────────────────────────────────────────────
    h('div',{style:{background:'var(--card)',border:'1px solid rgba(168,85,247,.3)',
      borderRadius:12,marginTop:10,overflow:'hidden'}},
      h('div',{onClick:function(){setShowStockBod(!showStockBod);},
        style:{padding:'12px 16px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',
          background:'rgba(168,85,247,.05)',
          borderBottom:showStockBod?'1px solid rgba(168,85,247,.15)':'none'}},
        h('span',{style:{fontSize:20}},'🏭'),
        h('div',{style:{flex:1}},
          h('div',{style:{fontSize:13,fontWeight:800,color:'var(--text)',letterSpacing:'.06em'}},
            'STOCK BODEGA'),
          h('div',{style:{fontSize:11,color:'var(--text3)'}},
            stockBod.mats.length+' material'+(stockBod.mats.length!==1?'es':'')+
            (stockBod.guides.length?' · '+stockBod.guides.length+' guía'+(stockBod.guides.length!==1?'s':''):''))
        ),
        h('span',{style:{color:'var(--purple)',fontSize:14,fontWeight:700}},showStockBod?'▲':'▼')
      ),
      showStockBod&&h('div',{style:{padding:'12px 14px'}},
        canEdit&&stockOfi.mats.length>0&&h('button',{
          onClick:function(){setTransferQtys({});setShowTransfer(true);},
          style:{width:'100%',padding:'8px 0',borderRadius:8,marginBottom:12,
            border:'1px solid rgba(168,85,247,.4)',background:'rgba(168,85,247,.1)',
            color:'var(--purple)',cursor:'pointer',fontSize:12,fontWeight:700}},
          '⬇ Recibir material desde Oficina Central'),
        stockBod.mats.length>0&&h('div',{style:{marginBottom:10}},
          h('div',{style:{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',
            marginBottom:6,textTransform:'uppercase'}},'MATERIALES EN BODEGA'),
          stockBod.mats.map(function(m,mi){
            var isEdit=editStockItem&&editStockItem.sec==='bod'&&editStockItem.idx===mi;
            if(isEdit){
              return h('div',{key:mi,style:{display:'flex',flexDirection:'column',gap:5,
                padding:'7px 0',borderBottom:mi<stockBod.mats.length-1?'1px solid rgba(168,85,247,.1)':'none'}},
                h('div',{style:{display:'flex',gap:4}},
                  h('input',{autoFocus:true,value:editStockDraft.name,
                    onChange:function(e){setEditStockDraft(Object.assign({},editStockDraft,{name:e.target.value}));},
                    style:{flex:2,background:'var(--bg2)',border:'1px solid var(--purple)',borderRadius:5,
                      padding:'5px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                  h('input',{value:editStockDraft.qty,placeholder:'Cant.',
                    onChange:function(e){setEditStockDraft(Object.assign({},editStockDraft,{qty:e.target.value}));},
                    style:{flex:'0 0 52px',background:'var(--bg2)',border:'1px solid var(--border)',
                      borderRadius:5,padding:'5px 5px',color:'var(--text)',fontSize:12,outline:'none'}}),
                  h('select',{value:editStockDraft.ud,
                    onChange:function(e){setEditStockDraft(Object.assign({},editStockDraft,{ud:e.target.value}));},
                    style:{flex:'0 0 62px',background:'var(--bg2)',border:'1px solid var(--border)',
                      borderRadius:5,padding:'5px 2px',color:'var(--text2)',fontSize:12,outline:'none'}},
                    UNITS.map(function(u){return h('option',{key:u,value:u},u);}))
                ),
                h('div',{style:{display:'flex',gap:5}},
                  h('button',{onClick:function(){
                    updateStockMat('bod',mi,{name:editStockDraft.name.trim(),
                      qty:Number(editStockDraft.qty)||0,ud:editStockDraft.ud});
                    setEditStockItem(null);toast&&toast('✓ Guardado');
                  },style:{flex:1,padding:'5px 0',borderRadius:6,background:'var(--green)',border:'none',
                    color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}},'Guardar'),
                  h('button',{onClick:function(){setEditStockItem(null);},
                    style:{padding:'5px 10px',borderRadius:6,border:'1px solid var(--border)',
                      background:'transparent',color:'var(--text3)',fontSize:12,cursor:'pointer'}},'Cancelar')
                )
              );
            }
            return h('div',{key:mi,style:{display:'flex',alignItems:'center',gap:8,
              padding:'6px 0',borderBottom:mi<stockBod.mats.length-1?'1px solid rgba(168,85,247,.08)':'none'}},
              h('span',{style:{fontSize:12,color:'var(--text)',flex:1}},m.name),
              h('span',{style:{fontSize:12,fontFamily:'var(--mono)',color:'var(--purple)',fontWeight:700}},
                (m.qty||0)+' '+(m.ud||'un')),
              canEdit&&h('div',{style:{display:'flex',gap:3}},
                h('button',{onClick:function(){
                  setEditStockItem({sec:'bod',idx:mi});
                  setEditStockDraft({name:m.name,qty:String(m.qty||0),ud:m.ud||'un'});
                },style:{background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.2)',
                  borderRadius:5,color:'var(--purple)',cursor:'pointer',fontSize:10,padding:'2px 7px'}},'Editar'),
                h('button',{onClick:function(){deleteStockMat('bod',mi);},
                  style:{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.15)',
                    borderRadius:5,color:'var(--red)',cursor:'pointer',fontSize:10,padding:'2px 6px'}},'x')
              )
            );
          })
        ),
        canEdit&&(addStockBodForm
          ?h('div',{style:{background:'var(--bg2)',borderRadius:8,padding:'8px 10px',marginBottom:10}},
              h('div',{style:{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:6,
                letterSpacing:'.07em'}},'AGREGAR MATERIAL'),
              h('div',{style:{display:'flex',gap:4,marginBottom:6}},
                h('input',{autoFocus:true,placeholder:'Nombre...',value:stockFormDraft.name,
                  onChange:function(e){setStockFormDraft(Object.assign({},stockFormDraft,{name:e.target.value}));},
                  onKeyDown:function(e){if(e.key==='Escape')setAddStockBodForm(false);},
                  style:{flex:2,background:'var(--bg3)',border:'1px solid var(--purple)',borderRadius:5,
                    padding:'6px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                h('input',{value:stockFormDraft.qty,placeholder:'Cant.',
                  onChange:function(e){setStockFormDraft(Object.assign({},stockFormDraft,{qty:e.target.value}));},
                  style:{flex:'0 0 52px',background:'var(--bg3)',border:'1px solid var(--border)',
                    borderRadius:5,padding:'6px 5px',color:'var(--text)',fontSize:12,outline:'none'}}),
                h('select',{value:stockFormDraft.ud,
                  onChange:function(e){setStockFormDraft(Object.assign({},stockFormDraft,{ud:e.target.value}));},
                  style:{flex:'0 0 62px',background:'var(--bg3)',border:'1px solid var(--border)',
                    borderRadius:5,padding:'6px 2px',color:'var(--text2)',fontSize:12,outline:'none'}},
                  UNITS.map(function(u){return h('option',{key:u,value:u},u);}))
              ),
              h('div',{style:{display:'flex',gap:5}},
                h('button',{onClick:function(){
                  if(!stockFormDraft.name.trim())return;
                  addStockMat('bod',stockFormDraft.name.trim(),stockFormDraft.qty,stockFormDraft.ud);
                  setStockFormDraft({name:'',qty:'',ud:stockFormDraft.ud});
                  setAddStockBodForm(false);toast&&toast('✓ Material agregado');
                },style:{flex:1,padding:'6px 0',borderRadius:6,background:'var(--purple)',border:'none',
                  color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}},'+ Agregar'),
                h('button',{onClick:function(){setAddStockBodForm(false);},
                  style:{padding:'6px 10px',borderRadius:6,border:'1px solid var(--border)',
                    background:'transparent',color:'var(--text3)',fontSize:12,cursor:'pointer'}},'Cancelar')
              )
            )
          :h('button',{onClick:function(){setAddStockBodForm(true);setStockFormDraft({name:'',qty:'',ud:'un'});},
              style:{width:'100%',padding:'7px 0',borderRadius:7,border:'1px dashed rgba(168,85,247,.4)',
                background:'transparent',color:'rgba(168,85,247,.8)',cursor:'pointer',
                fontSize:12,fontWeight:600,marginBottom:10}},
              '+ Agregar material')
        ),
        h('div',{style:{borderTop:'1px solid rgba(168,85,247,.1)',paddingTop:10}},
          h('div',{style:{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',
            marginBottom:8,textTransform:'uppercase'}},'GUÍAS DE RECEPCIÓN'),
          stockBod.guides.length>0&&h('div',{style:{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}},
            stockBod.guides.map(function(g,gi){
              return h('div',{key:gi,style:{position:'relative',width:64,height:64}},
                h('img',{src:g.data,alt:'Guía',
                  style:{width:64,height:64,objectFit:'cover',borderRadius:6,cursor:'pointer',
                    border:'1px solid rgba(168,85,247,.3)'},
                  onClick:function(){setGuidesSec({sec:'bod',idx:gi});}}),
                canEdit&&h('button',{onClick:function(){deleteStockGuide('bod',gi);},
                  style:{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',
                    background:'var(--red)',border:'none',color:'#fff',fontSize:9,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center'}},'x')
              );
            })
          ),
          h('div',{style:{display:'flex',gap:6}},
            h('button',{onClick:function(){bodCamRef.current&&bodCamRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(168,85,247,.3)',
                background:'rgba(168,85,247,.07)',color:'var(--purple)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📷 Fotografiar Guía'),
            h('button',{onClick:function(){bodFileRef.current&&bodFileRef.current.click();},
              style:{flex:1,padding:'7px 0',borderRadius:7,border:'1px solid rgba(168,85,247,.3)',
                background:'rgba(168,85,247,.07)',color:'var(--purple)',cursor:'pointer',
                fontSize:11,fontWeight:600}},'📁 Cargar Guía')
          )
        )
      )
    ),
    // ── MODAL TRANSFERENCIA ───────────────────────────────────────────────
    showTransfer&&h('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,.78)',
      zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',
      padding:'20px 12px',overflowY:'auto'},
      onClick:function(e){if(e.target===e.currentTarget)setShowTransfer(false);}},
      h('div',{style:{background:'var(--bg2)',borderRadius:14,width:'100%',maxWidth:480,
        border:'1px solid rgba(168,85,247,.4)',overflow:'hidden'}},
        h('div',{style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',gap:10,background:'rgba(168,85,247,.06)'}},
          h('span',{style:{fontSize:20}},'⬇'),
          h('div',{style:{flex:1}},
            h('div',{style:{fontSize:14,fontWeight:800,color:'var(--purple)'}},'Recibir en Bodega'),
            h('div',{style:{fontSize:11,color:'var(--text3)'}},
              'Indica la cantidad a transferir desde Oficina Central')
          ),
          h('button',{onClick:function(){setShowTransfer(false);},
            style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,
              padding:'4px 12px',color:'var(--text2)',cursor:'pointer',fontSize:16}},'✕')
        ),
        h('div',{style:{padding:'14px 16px',maxHeight:'55vh',overflowY:'auto'}},
          stockOfi.mats.length===0
            ?h('div',{style:{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:13}},
                'Sin materiales en Oficina Central')
            :stockOfi.mats.map(function(m,mi){
                var val=String(transferQtys[mi]||'');
                return h('div',{key:mi,style:{display:'flex',alignItems:'center',gap:8,
                  padding:'9px 0',borderBottom:mi<stockOfi.mats.length-1?'1px solid rgba(168,85,247,.1)':'none'}},
                  h('div',{style:{flex:1}},
                    h('div',{style:{fontSize:12,color:'var(--text)',fontWeight:600}},m.name),
                    h('div',{style:{fontSize:10,color:'var(--text3)'}},
                      'Disponible: '+(m.qty||0)+' '+(m.ud||'un'))
                  ),
                  h('input',{type:'number',min:0,max:m.qty||0,value:val,placeholder:'0',
                    onChange:function(e){
                      setTransferQtys(Object.assign({},transferQtys,{[mi]:e.target.value}));
                    },
                    style:{width:68,background:'var(--bg3)',border:'1px solid rgba(168,85,247,.4)',
                      borderRadius:6,padding:'5px 7px',color:'var(--text)',fontSize:12,
                      outline:'none',textAlign:'center'}}),
                  h('span',{style:{fontSize:11,color:'var(--text3)',minWidth:22}},m.ud||'un')
                );
              })
        ),
        h('div',{style:{padding:'12px 18px',borderTop:'1px solid var(--border)',
          display:'flex',gap:8,background:'rgba(168,85,247,.04)'}},
          h('button',{onClick:doTransfer,
            style:{flex:1,padding:'10px 0',borderRadius:8,background:'var(--purple)',
              border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}},
            '✓ Confirmar Transferencia'),
          h('button',{onClick:function(){setShowTransfer(false);},
            style:{padding:'10px 14px',borderRadius:8,border:'1px solid var(--border)',
              background:'transparent',color:'var(--text3)',fontSize:13,cursor:'pointer'}},
            'Cancelar')
        )
      )
    ),
    // ── MODAL VISOR DE GUÍAS ──────────────────────────────────────────────
    guidesSec&&h('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',
      zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',
      padding:'20px 12px'},
      onClick:function(e){if(e.target===e.currentTarget)setGuidesSec(null);}},
      (function(){
        var gs=guidesSec.sec==='ofi'?stockOfi.guides:stockBod.guides;
        var g=gs[guidesSec.idx];
        if(!g)return null;
        var total=gs.length;
        return h('div',{style:{background:'var(--bg2)',borderRadius:12,overflow:'hidden',
          maxWidth:520,width:'100%',border:'1px solid rgba(255,255,255,.12)'}},
          h('div',{style:{padding:'10px 14px',display:'flex',alignItems:'center',gap:8,
            borderBottom:'1px solid var(--border)'}},
            h('span',{style:{fontSize:13,fontWeight:700,color:'var(--text)',flex:1}},
              (guidesSec.sec==='ofi'?'Oficina Central':'Bodega')+
              ' — Guía '+(guidesSec.idx+1)+' / '+total),
            total>1&&h('div',{style:{display:'flex',gap:4}},
              h('button',{onClick:function(){
                setGuidesSec({sec:guidesSec.sec,idx:(guidesSec.idx-1+total)%total});
              },style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                padding:'3px 10px',color:'var(--text2)',cursor:'pointer',fontSize:13}},'←'),
              h('button',{onClick:function(){
                setGuidesSec({sec:guidesSec.sec,idx:(guidesSec.idx+1)%total});
              },style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                padding:'3px 10px',color:'var(--text2)',cursor:'pointer',fontSize:13}},'→')
            ),
            h('button',{onClick:function(){setGuidesSec(null);},
              style:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                padding:'4px 10px',color:'var(--text2)',cursor:'pointer',fontSize:16}},'✕')
          ),
          h('img',{src:g.data,alt:'Guía',
            style:{width:'100%',maxHeight:'70vh',objectFit:'contain',display:'block'}})
        );
      })()
    )
  );
}

function MatView(`;

if (!html.includes(calendarEnd)) { console.error('ERROR: cierre del calendario no encontrado'); process.exit(1); }
html = html.replace(calendarEnd, stockUI);
console.log('✓ Sección STOCK inyectada');

if (hasCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK');
