const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'control_victoria_v9.html');
const rawBytes = fs.readFileSync(filePath);
// Detectar si usa CRLF
const hasCRLF = rawBytes.indexOf('\r\n') !== -1;
// Trabajar en LF para los reemplazos
let html = rawBytes.toString('utf8').replace(/\r\n/g, '\n');

// ── 1. Actualizar quickSave para soportar cualquier fase ──────────────────
const oldQS = `  function quickSave(depNum,pid,pct){
    var sv=Object.assign({},saves[depNum]||{});
    sv.f3=Object.assign({},sv.f3||{},{[pid]:pct});
    onSave(depNum,sv);
  }`;
const newQS = `  function quickSave(depNum,pid,pct,fk){
    fk=fk||'f3';
    var sv=Object.assign({},saves[depNum]||{});
    sv[fk]=Object.assign({},sv[fk]||{},{[pid]:pct});
    onSave(depNum,sv);
  }`;

if (!html.includes(oldQS)) { console.error('ERROR: no se encontró quickSave'); process.exit(1); }
html = html.replace(oldQS, newQS);
console.log('✓ quickSave actualizado');

// ── 2. Panel S2 (Entregas Programadas Esta Semana) ────────────────────────
const oldPanelS2 = `              (function(){
                if(!isOpen)return null;
                var dn2=e.dep.d;
                var ps3b=_D.ps3;
                var sv3b=(saves[dn2]||{}).f3||{};
                var lk3b=_D.lf3||{};
                var rFiltB=userResp||(filtResp!=='all'?rl2Resp(filtResp):null);
                var pRowsB=ps3b.filter(function(p){return rFiltB?getPartidaRespName(3,p.id)===rFiltB:true;});
                var doneCountB=pRowsB.filter(function(p){var c=sv3b[p.id]!=null?sv3b[p.id]:(lk3b[dn2]?lk3b[dn2][p.id]||0:0);return Math.round(c)>=100;}).length;
                var visRowsB=hideEditDone?pRowsB.filter(function(p){var c=sv3b[p.id]!=null?sv3b[p.id]:(lk3b[dn2]?lk3b[dn2][p.id]||0:0);return Math.round(c)<100;}):pRowsB;
                return h('div',{style:{borderTop:'1px solid var(--border)',marginTop:6,paddingTop:8,display:'flex',flexDirection:'column',gap:5}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:4}},
                    h('div',{style:{fontSize:9,color:'var(--text2)',fontWeight:700,letterSpacing:.5,flex:1}},
                      rFiltB?'FASE 3 — '+(RESP_LABEL[rFiltB]||rFiltB.replace('sucto.','').toUpperCase()):'FASE 3 — PARTIDAS'),
                    doneCountB>0&&h('button',{
                      onClick:function(evt){evt.stopPropagation();setHideEditDone(!hideEditDone);},
                      style:{padding:'2px 8px',borderRadius:10,border:'1px solid '+(hideEditDone?'var(--green)':'var(--border)'),
                        background:hideEditDone?'rgba(34,197,94,.15)':'var(--bg2)',
                        color:hideEditDone?'var(--green)':'var(--text2)',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}
                    },hideEditDone?'▶ Ver completadas ('+doneCountB+')':'✓ Ocultar 100% ('+doneCountB+')')
                  ),
                  pRowsB.length===0&&h('div',{style:{fontSize:10,color:'var(--text3)',textAlign:'center',padding:'8px 0',fontStyle:'italic'}},'Sin partidas F3 asignadas a este responsable'),
                  pRowsB.length>0&&visRowsB.length===0&&h('div',{style:{fontSize:10,color:'var(--green)',textAlign:'center',padding:'8px 0'}},'✓ Todas las partidas al 100%'),
                  visRowsB.map(function(p){
                    var cur=sv3b[p.id]!=null?sv3b[p.id]:(lk3b[dn2]?lk3b[dn2][p.id]||0:0);
                    cur=Math.round(cur);
                    var nm=p.name.replace(/^F3 /i,'');
                    return h('div',{key:p.id,style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',
                      background:cur>=100?'rgba(34,197,94,.06)':'var(--bg3)',borderRadius:6,padding:'5px 8px',
                      opacity:cur>=100?.7:1}},
                      h('div',{style:{flex:1,fontSize:10,color:'var(--text)',minWidth:120,
                        textDecoration:cur>=100?'line-through':'none'}},nm),
                      h('div',{style:{fontSize:11,fontWeight:700,minWidth:32,textAlign:'right',
                        color:cur>=100?'var(--green)':cur>0?'var(--amber)':'var(--text3)'}},cur+'%'),
                      h('div',{style:{display:'flex',gap:3}},
                        [0,25,50,75,100].map(function(v){
                          var active=cur===v;
                          return h('button',{key:v,
                            onClick:function(evt){evt.stopPropagation();quickSave(dn2,p.id,v);},
                            style:{padding:'4px 7px',borderRadius:5,
                              border:'1px solid '+(active?'var(--accent)':'var(--border)'),
                              background:active?'var(--accent)':'var(--bg2)',
                              color:active?'#000':'var(--text2)',
                              fontSize:10,fontWeight:active?700:400,cursor:'pointer',minWidth:36}
                          },v+'%');
                        })
                      )
                    );
                  })
                );
              })()`;

const newPanelS2 = `              (function(){
                if(!isOpen)return null;
                var dn2=e.dep.d;
                var sv2=saves[dn2]||{};
                var rFiltB=userResp||(filtResp!=='all'?rl2Resp(filtResp):null);
                var phDefsB=[
                  {fi:1,fk:'f1',label:'FASE 1',color:'var(--blue)',ps:_D.ps,lf:_D.lf1||{}},
                  {fi:2,fk:'f2',label:'FASE 2',color:'var(--purple)',ps:_D.ps2,lf:_D.lf2||{}},
                  {fi:3,fk:'f3',label:'FASE 3',color:'var(--green)',ps:_D.ps3,lf:_D.lf3||{}},
                  {fi:4,fk:'f4',label:'FASE 4',color:'var(--amber)',ps:_D.ps4||[],lf:_D.lf4||{}}
                ];
                var totalDoneB=0;
                phDefsB.forEach(function(ph){
                  var pR=ph.ps.filter(function(p){return rFiltB?getPartidaRespName(ph.fi,p.id)===rFiltB:true;});
                  pR.forEach(function(p){
                    var c=(sv2[ph.fk]||{})[p.id]!=null?(sv2[ph.fk]||{})[p.id]:(ph.lf[dn2]?ph.lf[dn2][p.id]||0:0);
                    if(Math.round(c)>=100)totalDoneB++;
                  });
                });
                var hasAnyB=phDefsB.some(function(ph){
                  return ph.ps.some(function(p){return rFiltB?getPartidaRespName(ph.fi,p.id)===rFiltB:true;});
                });
                return h('div',{style:{borderTop:'1px solid var(--border)',marginTop:6,paddingTop:8,display:'flex',flexDirection:'column',gap:8}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:2}},
                    h('div',{style:{fontSize:9,color:'var(--text2)',fontWeight:700,letterSpacing:.5,flex:1}},
                      rFiltB?'PARTIDAS — '+(RESP_LABEL[rFiltB]||rFiltB.replace('sucto.','').toUpperCase()):'TODAS LAS PARTIDAS'),
                    totalDoneB>0&&h('button',{
                      onClick:function(evt){evt.stopPropagation();setHideEditDone(!hideEditDone);},
                      style:{padding:'2px 8px',borderRadius:10,border:'1px solid '+(hideEditDone?'var(--green)':'var(--border)'),
                        background:hideEditDone?'rgba(34,197,94,.15)':'var(--bg2)',
                        color:hideEditDone?'var(--green)':'var(--text2)',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}
                    },hideEditDone?'▶ Ver completadas ('+totalDoneB+')':'✓ Ocultar 100% ('+totalDoneB+')')
                  ),
                  !hasAnyB&&h('div',{style:{fontSize:10,color:'var(--text3)',textAlign:'center',padding:'8px 0',fontStyle:'italic'}},'Sin partidas asignadas a este responsable'),
                  phDefsB.map(function(ph){
                    var pRowsB=ph.ps.filter(function(p){return rFiltB?getPartidaRespName(ph.fi,p.id)===rFiltB:true;});
                    if(!pRowsB.length)return null;
                    var svPhB=sv2[ph.fk]||{};
                    var visRowsB=hideEditDone?pRowsB.filter(function(p){var c=svPhB[p.id]!=null?svPhB[p.id]:(ph.lf[dn2]?ph.lf[dn2][p.id]||0:0);return Math.round(c)<100;}):pRowsB;
                    if(hideEditDone&&visRowsB.length===0)return null;
                    return h('div',{key:ph.fi},
                      h('div',{style:{fontSize:8,fontWeight:700,letterSpacing:'.08em',color:ph.color,padding:'3px 0',marginBottom:3,borderBottom:'1px solid rgba(255,255,255,.06)',textTransform:'uppercase'}},ph.label),
                      visRowsB.length===0
                        ?h('div',{style:{fontSize:9,color:'var(--green)',textAlign:'center',padding:'4px 0'}},'✓ Todas al 100%')
                        :visRowsB.map(function(p){
                          var cur=svPhB[p.id]!=null?svPhB[p.id]:(ph.lf[dn2]?ph.lf[dn2][p.id]||0:0);
                          cur=Math.round(cur);
                          var nm=p.name.replace(/^F[1-4] /i,'');
                          return h('div',{key:p.id,style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',
                            background:cur>=100?'rgba(34,197,94,.06)':'var(--bg3)',borderRadius:6,padding:'5px 8px',marginBottom:3,
                            opacity:cur>=100?.7:1}},
                            h('div',{style:{flex:1,fontSize:10,color:'var(--text)',minWidth:120,
                              textDecoration:cur>=100?'line-through':'none'}},nm),
                            h('div',{style:{fontSize:11,fontWeight:700,minWidth:32,textAlign:'right',
                              color:cur>=100?'var(--green)':cur>0?'var(--amber)':'var(--text3)'}},cur+'%'),
                            h('div',{style:{display:'flex',gap:3}},
                              [0,25,50,75,100].map(function(v){
                                var active=cur===v;
                                return h('button',{key:v,
                                  onClick:function(evt){evt.stopPropagation();quickSave(dn2,p.id,v,ph.fk);},
                                  style:{padding:'4px 7px',borderRadius:5,
                                    border:'1px solid '+(active?'var(--accent)':'var(--border)'),
                                    background:active?'var(--accent)':'var(--bg2)',
                                    color:active?'#000':'var(--text2)',
                                    fontSize:10,fontWeight:active?700:400,cursor:'pointer',minWidth:36}
                                },v+'%');
                              })
                            )
                          );
                        })
                    );
                  })
                );
              })()`;

if (!html.includes(oldPanelS2)) { console.error('ERROR: no se encontró panel S2'); process.exit(1); }
html = html.replace(oldPanelS2, newPanelS2);
console.log('✓ Panel S2 actualizado');

// ── 3. Panel S4 (Dptos Vencidos) ──────────────────────────────────────────
const oldPanelS4 = `              if(isOpen){
                var ps3=_D.ps3;
                var sv3=(saves[dn]||{}).f3||{};
                var lk3=_D.lf3||{};
                var rFilt=userResp||(filtResp!=='all'?rl2Resp(filtResp):null);
                var pRows=ps3.filter(function(p){return rFilt?getPartidaRespName(3,p.id)===rFilt:true;});
                var doneCount=pRows.filter(function(p){var c=sv3[p.id]!=null?sv3[p.id]:(lk3[dn]?lk3[dn][p.id]||0:0);return Math.round(c)>=100;}).length;
                var visRows=hideEditDone?pRows.filter(function(p){var c=sv3[p.id]!=null?sv3[p.id]:(lk3[dn]?lk3[dn][p.id]||0:0);return Math.round(c)<100;}):pRows;
                editPanel=h('div',{style:{borderTop:'1px solid var(--border)',marginTop:6,paddingTop:8,display:'flex',flexDirection:'column',gap:5}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:4}},
                    h('div',{style:{fontSize:9,color:'var(--text2)',fontWeight:700,letterSpacing:.5,flex:1}},
                      rFilt?'FASE 3 — '+(RESP_LABEL[rFilt]||rFilt.replace('sucto.','').toUpperCase()):'FASE 3 — PARTIDAS'),
                    doneCount>0&&h('button',{
                      onClick:function(e){e.stopPropagation();setHideEditDone(!hideEditDone);},
                      style:{padding:'2px 8px',borderRadius:10,border:'1px solid '+(hideEditDone?'var(--green)':'var(--border)'),
                        background:hideEditDone?'rgba(34,197,94,.15)':'var(--bg2)',
                        color:hideEditDone?'var(--green)':'var(--text2)',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}
                    },hideEditDone?'▶ Ver completadas ('+doneCount+')':'✓ Ocultar 100% ('+doneCount+')')
                  ),
                  pRows.length===0&&h('div',{style:{fontSize:10,color:'var(--text3)',textAlign:'center',padding:'8px 0',fontStyle:'italic'}},'Sin partidas F3 asignadas a este responsable'),
                  pRows.length>0&&visRows.length===0&&h('div',{style:{fontSize:10,color:'var(--green)',textAlign:'center',padding:'8px 0'}},'✓ Todas las partidas al 100%'),
                  visRows.map(function(p){
                    var cur=sv3[p.id]!=null?sv3[p.id]:(lk3[dn]?lk3[dn][p.id]||0:0);
                    cur=Math.round(cur);
                    var nm=p.name.replace(/^F3 /i,'');
                    return h('div',{key:p.id,style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',
                      background:cur>=100?'rgba(34,197,94,.06)':'var(--bg3)',borderRadius:6,padding:'5px 8px',
                      opacity:cur>=100?.7:1}},
                      h('div',{style:{flex:1,fontSize:10,color:'var(--text)',minWidth:120,
                        textDecoration:cur>=100?'line-through':'none'}},nm),
                      h('div',{style:{fontSize:11,fontWeight:700,minWidth:32,textAlign:'right',
                        color:cur>=100?'var(--green)':cur>0?'var(--amber)':'var(--text3)'}},cur+'%'),
                      h('div',{style:{display:'flex',gap:3}},
                        [0,25,50,75,100].map(function(v){
                          var active=cur===v;
                          return h('button',{key:v,
                            onClick:function(e){e.stopPropagation();quickSave(dn,p.id,v);},
                            style:{padding:'4px 7px',borderRadius:5,
                              border:'1px solid '+(active?'var(--accent)':'var(--border)'),
                              background:active?'var(--accent)':'var(--bg2)',
                              color:active?'#000':'var(--text2)',
                              fontSize:10,fontWeight:active?700:400,cursor:'pointer',minWidth:36}
                          },v+'%');
                        })
                      )
                    );
                  })
                );
              }`;

const newPanelS4 = `              if(isOpen){
                var sv4=saves[dn]||{};
                var rFilt=userResp||(filtResp!=='all'?rl2Resp(filtResp):null);
                var phDefs4=[
                  {fi:1,fk:'f1',label:'FASE 1',color:'var(--blue)',ps:_D.ps,lf:_D.lf1||{}},
                  {fi:2,fk:'f2',label:'FASE 2',color:'var(--purple)',ps:_D.ps2,lf:_D.lf2||{}},
                  {fi:3,fk:'f3',label:'FASE 3',color:'var(--green)',ps:_D.ps3,lf:_D.lf3||{}},
                  {fi:4,fk:'f4',label:'FASE 4',color:'var(--amber)',ps:_D.ps4||[],lf:_D.lf4||{}}
                ];
                var totalDone4=0;
                phDefs4.forEach(function(ph){
                  var pR=ph.ps.filter(function(p){return rFilt?getPartidaRespName(ph.fi,p.id)===rFilt:true;});
                  pR.forEach(function(p){
                    var c=(sv4[ph.fk]||{})[p.id]!=null?(sv4[ph.fk]||{})[p.id]:(ph.lf[dn]?ph.lf[dn][p.id]||0:0);
                    if(Math.round(c)>=100)totalDone4++;
                  });
                });
                var hasAny4=phDefs4.some(function(ph){
                  return ph.ps.some(function(p){return rFilt?getPartidaRespName(ph.fi,p.id)===rFilt:true;});
                });
                editPanel=h('div',{style:{borderTop:'1px solid var(--border)',marginTop:6,paddingTop:8,display:'flex',flexDirection:'column',gap:8}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:2}},
                    h('div',{style:{fontSize:9,color:'var(--text2)',fontWeight:700,letterSpacing:.5,flex:1}},
                      rFilt?'PARTIDAS — '+(RESP_LABEL[rFilt]||rFilt.replace('sucto.','').toUpperCase()):'TODAS LAS PARTIDAS'),
                    totalDone4>0&&h('button',{
                      onClick:function(e){e.stopPropagation();setHideEditDone(!hideEditDone);},
                      style:{padding:'2px 8px',borderRadius:10,border:'1px solid '+(hideEditDone?'var(--green)':'var(--border)'),
                        background:hideEditDone?'rgba(34,197,94,.15)':'var(--bg2)',
                        color:hideEditDone?'var(--green)':'var(--text2)',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}
                    },hideEditDone?'▶ Ver completadas ('+totalDone4+')':'✓ Ocultar 100% ('+totalDone4+')')
                  ),
                  !hasAny4&&h('div',{style:{fontSize:10,color:'var(--text3)',textAlign:'center',padding:'8px 0',fontStyle:'italic'}},'Sin partidas asignadas a este responsable'),
                  phDefs4.map(function(ph){
                    var pRows=ph.ps.filter(function(p){return rFilt?getPartidaRespName(ph.fi,p.id)===rFilt:true;});
                    if(!pRows.length)return null;
                    var svPh4=sv4[ph.fk]||{};
                    var visRows=hideEditDone?pRows.filter(function(p){var c=svPh4[p.id]!=null?svPh4[p.id]:(ph.lf[dn]?ph.lf[dn][p.id]||0:0);return Math.round(c)<100;}):pRows;
                    if(hideEditDone&&visRows.length===0)return null;
                    return h('div',{key:ph.fi},
                      h('div',{style:{fontSize:8,fontWeight:700,letterSpacing:'.08em',color:ph.color,padding:'3px 0',marginBottom:3,borderBottom:'1px solid rgba(255,255,255,.06)',textTransform:'uppercase'}},ph.label),
                      visRows.length===0
                        ?h('div',{style:{fontSize:9,color:'var(--green)',textAlign:'center',padding:'4px 0'}},'✓ Todas al 100%')
                        :visRows.map(function(p){
                          var cur=svPh4[p.id]!=null?svPh4[p.id]:(ph.lf[dn]?ph.lf[dn][p.id]||0:0);
                          cur=Math.round(cur);
                          var nm=p.name.replace(/^F[1-4] /i,'');
                          return h('div',{key:p.id,style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',
                            background:cur>=100?'rgba(34,197,94,.06)':'var(--bg3)',borderRadius:6,padding:'5px 8px',marginBottom:3,
                            opacity:cur>=100?.7:1}},
                            h('div',{style:{flex:1,fontSize:10,color:'var(--text)',minWidth:120,
                              textDecoration:cur>=100?'line-through':'none'}},nm),
                            h('div',{style:{fontSize:11,fontWeight:700,minWidth:32,textAlign:'right',
                              color:cur>=100?'var(--green)':cur>0?'var(--amber)':'var(--text3)'}},cur+'%'),
                            h('div',{style:{display:'flex',gap:3}},
                              [0,25,50,75,100].map(function(v){
                                var active=cur===v;
                                return h('button',{key:v,
                                  onClick:function(e){e.stopPropagation();quickSave(dn,p.id,v,ph.fk);},
                                  style:{padding:'4px 7px',borderRadius:5,
                                    border:'1px solid '+(active?'var(--accent)':'var(--border)'),
                                    background:active?'var(--accent)':'var(--bg2)',
                                    color:active?'#000':'var(--text2)',
                                    fontSize:10,fontWeight:active?700:400,cursor:'pointer',minWidth:36}
                                },v+'%');
                              })
                            )
                          );
                        })
                    );
                  })
                );
              }`;

if (!html.includes(oldPanelS4)) { console.error('ERROR: no se encontró panel S4'); process.exit(1); }
html = html.replace(oldPanelS4, newPanelS4);
console.log('✓ Panel S4 actualizado');

// Restaurar CRLF si el original lo usaba
if (hasCRLF) html = html.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ Archivo guardado OK (CRLF=' + hasCRLF + ')');
