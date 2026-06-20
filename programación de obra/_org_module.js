
// ══════════════════════════════════════════════════════════════
// MÓDULO: ORGANIGRAMA DE ASISTENCIA
// orgData: { nodes: [{id,rut,nombre,cargo,parentId},...] }
// ══════════════════════════════════════════════════════════════

var TEAM_COLORS=['#0ea5e9','#a855f7','#22c55e','#f59e0b','#06b6d4','#f97316','#14b8a6','#ef4444','#3b82f6','#ec4899'];

function buildOrgTree(nodes){
  var map={};
  nodes.forEach(function(n){map[n.id]=Object.assign({},n,{children:[]});});
  var roots=[];
  nodes.forEach(function(n){
    if(n.parentId&&map[n.parentId])map[n.parentId].children.push(map[n.id]);
    else roots.push(map[n.id]);
  });
  return roots;
}

function getNodeStatus(rut,dayNum,casaW){
  var w=casaW.find(function(x){return x.rut===rut;});
  return w?((w.dias&&w.dias[dayNum])||''):'?';
}

function getTeamStats(node,dayNum,casaW){
  var tot=0,pr=0,pe=0;
  function count(n){
    var w=casaW.find(function(x){return x.rut===n.rut;});
    if(w){tot++;var s=(w.dias&&w.dias[dayNum])||'';if(s==='X')pr++;else if(s==='P')pe++;}
    (n.children||[]).forEach(count);
  }
  count(node);
  return{total:tot,presentes:pr,permisos:pe,pct:tot?Math.round(pr/tot*100):0};
}

function statusDotColor(s){
  return s==='X'?'var(--green)':s==='P'?'var(--amber)':s&&s!=='?'?'var(--red)':'var(--border)';
}

function getInitials(nombre){
  return (nombre||'').split(' ').filter(Boolean).slice(0,2).map(function(w){return w[0].toUpperCase();}).join('');
}

// ── Nodo individual del árbol ──────────────────────────────
function OrgNodeItem({node,dayNum,casaW,depth,teamColor}){
  var hasKids=(node.children||[]).length>0;
  var initOpen=depth<1;
  var[open,setOpen]=useState(initOpen);
  var st=getNodeStatus(node.rut,dayNum,casaW);
  var ts=getTeamStats(node,dayNum,casaW);
  var dotCol=statusDotColor(st);
  var inits=getInitials(node.nombre);
  var tc=teamColor||'var(--blue)';
  var isRoot=depth===0;

  return h('div',{style:{marginLeft:depth>0?12:0,paddingLeft:depth>0?8:0,borderLeft:depth>0?'2px solid '+tc+'35':undefined}},
    h('div',{
      onClick:function(){if(hasKids)setOpen(function(o){return !o;});},
      style:{
        display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:9,marginBottom:4,
        background:isRoot?tc+'12':'var(--card)',
        border:'1px solid '+(isRoot?tc+'50':'var(--border)'),
        cursor:hasKids?'pointer':'default',transition:'all .15s'
      }},
      h('div',{style:{
        width:30,height:30,borderRadius:15,flexShrink:0,
        background:tc+'25',border:'2px solid '+tc,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:10,fontWeight:800,color:tc,letterSpacing:'.03em'
      }},inits),
      h('div',{style:{flex:1,minWidth:0}},
        h('div',{style:{fontSize:isRoot?13:12,fontWeight:isRoot?700:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},node.nombre),
        h('div',{style:{fontSize:9,color:'var(--text3)',letterSpacing:'.04em',marginTop:1}},node.cargo)
      ),
      h('div',{style:{display:'flex',alignItems:'center',gap:5,flexShrink:0}},
        dayNum&&hasKids&&h('span',{style:{fontSize:10,fontFamily:'var(--mono)',color:tc,fontWeight:700}},ts.presentes+'/'+ts.total),
        h('div',{style:{width:9,height:9,borderRadius:5,background:dotCol,boxShadow:dotCol!=='var(--border)'?'0 0 5px '+dotCol:'none'}}),
        hasKids&&h('span',{style:{fontSize:12,color:'var(--text3)',marginLeft:2}},open?'▾':'▸')
      )
    ),
    open&&hasKids&&h('div',{style:{marginTop:2}},
      (node.children||[]).map(function(child,i){
        return h(OrgNodeItem,{key:i,node:child,dayNum:dayNum,casaW:casaW,depth:depth+1,teamColor:tc});
      })
    )
  );
}

// ── Ranking de equipos ──────────────────────────────────────
function OrgTeamRanking({roots,dayNum,casaW}){
  var teams=roots.map(function(r,i){
    var ts=getTeamStats(r,dayNum,casaW);
    return Object.assign({},ts,{nombre:r.nombre.split(' ').slice(0,2).join(' '),color:TEAM_COLORS[i%TEAM_COLORS.length]});
  }).filter(function(t){return t.total>0;});
  teams.sort(function(a,b){return b.pct-a.pct;});
  if(!teams.length)return null;
  return h('div',{style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',marginBottom:12}},
    h('div',{style:{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',marginBottom:10,textTransform:'uppercase'}},'Ranking de equipos'),
    teams.map(function(t,i){
      return h('div',{key:i,style:{marginBottom:i<teams.length-1?8:0}},
        h('div',{style:{display:'flex',alignItems:'center',gap:6,marginBottom:3}},
          h('span',{style:{fontSize:14,width:18,flexShrink:0}},i===0?'🏆':i===1?'🥈':i===2?'🥉':''),
          h('span',{style:{flex:1,fontSize:12,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},t.nombre),
          h('span',{style:{fontSize:11,fontFamily:'var(--mono)',color:t.color,fontWeight:700,flexShrink:0}},t.presentes+'/'+t.total+' \xb7 '+t.pct+'%')
        ),
        h('div',{style:{height:4,background:'var(--bg2)',borderRadius:2}},
          h('div',{style:{height:'100%',width:t.pct+'%',background:t.color,borderRadius:2,transition:'width .5s cubic-bezier(.4,0,.2,1)'}})
        )
      );
    })
  );
}

// ── Vista principal del organigrama ────────────────────────
function OrgTreeView({orgData,moData,dayNum,isAdmin,onEdit,toast}){
  var casaW=(moData&&moData.casa)||[];
  var nodes=(orgData&&orgData.nodes)||[];
  if(!nodes.length){
    return h('div',{style:{textAlign:'center',padding:'32px 20px'}},
      h('div',{style:{fontSize:36,marginBottom:12}},'🏗'),
      h('div',{style:{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:6}},'Sin organigrama configurado'),
      h('div',{style:{fontSize:12,color:'var(--text3)',marginBottom:16,lineHeight:1.5}},
        isAdmin?'Crea la jerarquía de equipos para ver asistencia por equipo y el ranking.':'Pide al administrador que configure el organigrama.'),
      isAdmin&&h('button',{onClick:onEdit,style:{background:'var(--blue)',border:'none',borderRadius:8,color:'#fff',padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer'}},'+ Configurar organigrama')
    );
  }
  var roots=buildOrgTree(nodes);
  return h('div',null,
    isAdmin&&h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:10}},
      h('button',{onClick:onEdit,style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 10px',color:'var(--text2)',cursor:'pointer',fontSize:11,fontWeight:600}},'✏ Editar organigrama')
    ),
    dayNum&&casaW.length>0&&h(OrgTeamRanking,{roots:roots,dayNum:dayNum,casaW:casaW}),
    h('div',{style:{display:'flex',flexDirection:'column',gap:2}},
      roots.map(function(r,i){
        return h(OrgNodeItem,{key:i,node:r,dayNum:dayNum,casaW:casaW,depth:0,teamColor:TEAM_COLORS[i%TEAM_COLORS.length]});
      })
    )
  );
}

// ── Builder del organigrama (solo Admin) ─────────────────
function OrgBuilderView({orgData,casaW,onSave,onBack,toast}){
  var existingNodes=(orgData&&orgData.nodes)||[];
  function makeId(rut){return 'n_'+rut.replace(/[^a-zA-Z0-9]/g,'_');}

  var allW=casaW.map(function(w){
    var ex=existingNodes.find(function(n){return n.rut===w.rut;});
    return{id:ex?ex.id:makeId(w.rut),rut:w.rut,nombre:w.nombre,cargo:w.cargo,parentId:ex?ex.parentId:null};
  });

  var initMap={};allW.forEach(function(w){initMap[w.rut]=w.parentId||'';});
  var[parentMap,setParentMap]=useState(initMap);
  var[q,setQ]=useState('');
  var[saved,setSaved]=useState(false);

  function save(){
    var nodes=allW.map(function(w){
      return{id:w.id,rut:w.rut,nombre:w.nombre,cargo:w.cargo,parentId:parentMap[w.rut]||null};
    });
    onSave({nodes:nodes});
    toast&&toast('Organigrama guardado');
    setSaved(true);
    setTimeout(function(){onBack();},600);
  }

  var filtered=q.trim()?allW.filter(function(w){
    var ql=q.toLowerCase();
    return w.nombre.toLowerCase().includes(ql)||w.cargo.toLowerCase().includes(ql);
  }):allW;

  return h('div',{className:'page'},
    h('div',{className:'flex aic jb mb10'},
      h('button',{className:'bc-btn',style:{fontSize:13},onClick:onBack},'← Organigrama'),
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h('div',{style:{fontSize:14,fontWeight:700,color:'var(--text)'}},'Editar Organigrama'),
        h('button',{onClick:save,style:{background:saved?'var(--green)':'var(--blue)',border:'none',borderRadius:6,padding:'6px 14px',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',transition:'background .2s'}},saved?'Guardado ✓':'Guardar')
      )
    ),
    h('div',{style:{background:'rgba(14,165,233,.07)',border:'1px solid rgba(14,165,233,.2)',borderRadius:8,padding:'9px 12px',marginBottom:10,fontSize:11,color:'var(--text2)',lineHeight:1.5}},
      'Asigna un jefe a cada persona. Los que no tengan jefe asignado quedan como ra\xedz del \xe1rbol.'
    ),
    h('div',{className:'search-wrap',style:{marginBottom:10}},
      h('span',{className:'search-icon'},'🔍'),
      h('input',{value:q,onChange:function(e){setQ(e.target.value);},placeholder:'Buscar trabajador...'})
    ),
    h('div',{className:'gap8'},
      filtered.map(function(w){
        var opts=[{v:'',l:'— Sin jefe (ra\xedz del \xe1rbol)'}].concat(
          allW.filter(function(x){return x.rut!==w.rut;}).map(function(x){return{v:x.id,l:x.nombre+' \xb7 '+x.cargo};})
        );
        return h('div',{key:w.id,style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 12px'}},
          h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:5}},
            h('div',{style:{width:28,height:28,borderRadius:14,background:'var(--bg2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--text2)',flexShrink:0}},getInitials(w.nombre)),
            h('div',{style:{flex:1}},
              h('div',{style:{fontSize:12,fontWeight:600,color:'var(--text)'}},w.nombre),
              h('div',{style:{fontSize:10,color:'var(--text3)'}},w.cargo+(w.rut?' \xb7 '+w.rut:''))
            )
          ),
          h('select',{
            value:parentMap[w.rut]||'',
            onChange:function(e){var v=e.target.value;setParentMap(function(m){var nm=Object.assign({},m);nm[w.rut]=v||null;return nm;});},
            style:{width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 8px',color:'var(--text2)',fontSize:11,outline:'none'}
          },
            opts.map(function(o){return h('option',{key:o.v,value:o.v},o.l);})
          )
        );
      })
    )
  );
}

// ── Vista día agrupada por equipos ──────────────────────────
function DayByTeams({orgData,dayNum,casaW,subcW}){
  var nodes=(orgData&&orgData.nodes)||[];
  if(!nodes.length){
    return h('div',{style:{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12}},'Sin organigrama configurado. Configura la jerarqu\xeda en la pesta\xf1a Organigrama.');
  }
  var roots=buildOrgTree(nodes);

  function TeamCard({node,color,idx}){
    var[open,setOpen]=useState(true);
    var ts=getTeamStats(node,dayNum,casaW);
    var members=[];
    function collect(n,level){
      var w=casaW.find(function(x){return x.rut===n.rut;});
      if(w)members.push({worker:w,node:n,level:level,st:(w.dias&&w.dias[dayNum])||''});
      (n.children||[]).forEach(function(c){collect(c,level+1);});
    }
    collect(node,0);
    return h('div',{style:{background:'var(--card)',border:'1px solid '+(color+'40'),borderRadius:12,overflow:'hidden',marginBottom:8}},
      h('div',{onClick:function(){setOpen(function(o){return !o;});},style:{padding:'10px 12px',background:color+'10',display:'flex',alignItems:'center',gap:8,cursor:'pointer'}},
        idx===0&&ts.pct>=90&&h('span',{style:{fontSize:16}},'🏆'),
        h('div',{style:{flex:1}},
          h('div',{style:{fontSize:13,fontWeight:700,color:'var(--text)'}},node.nombre.split(' ').slice(0,3).join(' ')),
          h('div',{style:{fontSize:10,color:'var(--text3)'}},node.cargo)
        ),
        h('div',{style:{display:'flex',alignItems:'center',gap:8,flexShrink:0}},
          h('div',{style:{textAlign:'right'}},
            h('div',{style:{fontSize:12,fontFamily:'var(--mono)',fontWeight:700,color:color}},ts.presentes+'/'+ts.total),
            h('div',{style:{fontSize:9,color:'var(--text3)'}},ts.pct+'% asist.')
          ),
          h('div',{style:{width:32,height:32,borderRadius:16,background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}},
            h('div',{style:{position:'absolute',inset:0,borderRadius:16,background:'conic-gradient('+color+' 0% '+ts.pct+'%,var(--bg3) '+ts.pct+'% 100%)'}}),
            h('div',{style:{position:'absolute',inset:3,borderRadius:10,background:'var(--card)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:color}},ts.pct+'%')
          ),
          h('span',{style:{fontSize:12,color:'var(--text3)'}},open?'▾':'▸')
        )
      ),
      open&&h('div',{style:{padding:'6px 12px 10px'}},
        h('div',{style:{height:3,background:'var(--bg2)',borderRadius:2,marginBottom:8}},h('div',{style:{height:'100%',width:ts.pct+'%',background:color,borderRadius:2}})),
        members.map(function(m,mi){
          var dotCol=statusDotColor(m.st);
          var lbl=m.st==='X'?'Presente':m.st==='P'?'Permiso':m.st==='#'?'Feriado':'Ausente';
          return h('div',{key:mi,style:{display:'flex',alignItems:'center',gap:8,padding:'4px 0',paddingLeft:m.level*10,borderBottom:mi<members.length-1?'1px solid rgba(30,58,95,.2)':'none'}},
            h('div',{style:{width:7,height:7,borderRadius:4,background:dotCol,flexShrink:0}}),
            h('div',{style:{flex:1,minWidth:0}},
              h('div',{style:{fontSize:11,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},m.worker.nombre),
              h('div',{style:{fontSize:9,color:'var(--text3)'}},m.worker.cargo)
            ),
            h('div',{style:{fontSize:9,fontWeight:700,color:dotCol,letterSpacing:'.04em',flexShrink:0}},lbl)
          );
        })
      )
    );
  }

  // Subcontratos por empresa
  var subcCompanies=Object.keys(subcW).map(function(emp){
    var workers=subcW[emp]||[];
    var tot=workers.length;
    var pr=workers.filter(function(w){return w.dias&&w.dias[dayNum]==='X';}).length;
    return{empresa:emp,total:tot,presentes:pr,pct:tot?Math.round(pr/tot*100):0};
  }).filter(function(c){return c.total>0;});
  subcCompanies.sort(function(a,b){return b.pct-a.pct;});

  return h('div',null,
    h('div',{style:{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',marginBottom:8,textTransform:'uppercase'}},'Equipos Casa'),
    roots.map(function(r,i){return h(TeamCard,{key:i,node:r,color:TEAM_COLORS[i%TEAM_COLORS.length],idx:i});}),
    subcCompanies.length>0&&[
      h('div',{key:'hdr',style:{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',margin:'12px 0 8px',textTransform:'uppercase'}},'Subcontratos'),
      h('div',{key:'cards',style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}},
        subcCompanies.map(function(c,i){
          var col=TEAM_COLORS[(roots.length+i)%TEAM_COLORS.length];
          return h('div',{key:i,style:{background:'var(--card)',border:'1px solid '+col+'30',borderRadius:10,padding:'10px 10px'}},
            i===0&&c.pct>=90&&h('span',{style:{fontSize:12}},'🏆'),
            h('div',{style:{fontSize:10,fontWeight:700,color:'var(--text)',marginBottom:2,lineHeight:1.3}},c.empresa),
            h('div',{style:{fontSize:11,fontFamily:'var(--mono)',color:col,fontWeight:700}},c.presentes+'/'+c.total),
            h('div',{style:{height:3,background:'var(--bg2)',borderRadius:2,marginTop:4}},
              h('div',{style:{height:'100%',width:c.pct+'%',background:col,borderRadius:2}}))
          );
        })
      )
    ]
  );
}
