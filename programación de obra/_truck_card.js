var mats=entry.materiales||[];
          var editingHora=editMat&&editMat.ei===idx&&editMat.mi==='hora';
          var addingMat=editMat&&editMat.ei===idx&&editMat.mi==='new';
          return h('div',{key:idx,style:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}},
            h('div',{style:{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(14,165,233,.04)'}},
              h('div',{style:{display:'flex',alignItems:'center',gap:10}},
                h('span',{style:{fontSize:22}},truckIcon(entry.camion)),
                h('div',null,
                  h('div',{style:{fontSize:13,fontWeight:700,color:'var(--text)'}},entry.camion),
                  editingHora
                    ? h('div',{style:{display:'flex',alignItems:'center',gap:5,marginTop:3}},
                        h('input',{type:'time',autoFocus:true,value:editMatDraft.qty||entry.hora||'',
                          onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{qty:e.target.value}));},
                          onKeyDown:function(e){
                            if(e.key==='Enter'){
                              var entries=getDayEntries(dayView).slice();
                              entries[idx]=Object.assign({},entries[idx],{hora:editMatDraft.qty});
                              saveDayEntries(dayView,entries);
                              setEditMat(null);
                              toast&&toast('Hora actualizada');
                            }
                            if(e.key==='Escape')setEditMat(null);
                          },
                          style:{background:'var(--bg2)',border:'1px solid var(--blue)',borderRadius:6,padding:'3px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                        h('button',{onClick:function(){
                          var entries=getDayEntries(dayView).slice();
                          entries[idx]=Object.assign({},entries[idx],{hora:editMatDraft.qty});
                          saveDayEntries(dayView,entries);
                          setEditMat(null);
                          toast&&toast('Hora actualizada');
                        },style:{background:'var(--green)',border:'none',borderRadius:5,color:'#fff',fontSize:11,padding:'3px 8px',cursor:'pointer',fontWeight:700}},'OK'),
                        h('button',{onClick:function(){setEditMat(null);},style:{background:'transparent',border:'1px solid var(--border)',borderRadius:5,color:'var(--text3)',fontSize:11,padding:'3px 6px',cursor:'pointer'}},'✕')
                      )
                    : h('div',{style:{display:'flex',alignItems:'center',gap:5,marginTop:2}},
                        h('span',{style:{fontSize:12,color:'var(--blue)',fontFamily:'var(--mono)',fontWeight:700}},entry.hora?'⏱ '+entry.hora+' hrs':'Sin hora'),
                        canEdit&&h('button',{onClick:function(){setEditMat({ei:idx,mi:'hora'});setEditMatDraft({qty:entry.hora||''});},
                          style:{background:'rgba(14,165,233,.1)',border:'1px solid rgba(14,165,233,.2)',borderRadius:4,color:'var(--blue)',cursor:'pointer',fontSize:9,padding:'1px 6px'}},'Editar')
                      )
                )
              ),
              h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                h('span',{style:{fontSize:11,color:mats.length>0?'var(--text2)':'var(--text3)'}},mats.length+' material'+(mats.length!==1?'es':'')),
                canEdit&&h('button',{onClick:function(){deleteTruck(dayView,idx);},
                  style:{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'var(--red)',cursor:'pointer',fontSize:11,padding:'3px 8px'}},'Eliminar')
              )
            ),
            h('div',{style:{padding:'8px 14px'}},
              h('div',{style:{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',marginBottom:6,textTransform:'uppercase'}},'Materiales programados'),
              mats.length===0&&!addingMat
                ? h('div',{style:{fontSize:11,color:'var(--text3)',fontStyle:'italic',paddingBottom:4}},'Sin materiales registrados')
                : mats.map(function(m,mi){
                    var isEditing=editMat&&editMat.ei===idx&&editMat.mi===mi;
                    if(isEditing){
                      return h('div',{key:mi,style:{display:'flex',flexDirection:'column',gap:6,padding:'7px 0',borderBottom:mi<mats.length-1?'1px solid rgba(30,58,95,.3)':'none'}},
                        h('div',{style:{display:'flex',gap:5}},
                          h('input',{autoFocus:true,value:editMatDraft.name,onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{name:e.target.value}));},onKeyDown:function(e){if(e.key==='Enter')saveEditMat();if(e.key==='Escape')setEditMat(null);},style:{flex:2,background:'var(--bg2)',border:'1px solid var(--blue)',borderRadius:6,padding:'5px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                          h('input',{value:editMatDraft.qty,placeholder:'Cant.',onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{qty:e.target.value}));},style:{flex:'0 0 52px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 5px',color:'var(--text)',fontSize:12,outline:'none'}}),
                          h('select',{value:editMatDraft.ud,onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{ud:e.target.value}));},style:{flex:'0 0 68px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 3px',color:'var(--text2)',fontSize:12,outline:'none'}},UNITS.map(function(u){return h('option',{key:u,value:u},u);}))
                        ),
                        h('div',{style:{display:'flex',gap:6}},
                          h('button',{onClick:saveEditMat,style:{flex:1,padding:'5px 0',borderRadius:6,background:'var(--green)',border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}},'Guardar'),
                          h('button',{onClick:function(){setEditMat(null);},style:{padding:'5px 10px',borderRadius:6,border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',fontSize:12,cursor:'pointer'}},'Cancelar')
                        )
                      );
                    }
                    return h('div',{key:mi,style:{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:mi<mats.length-1?'1px solid rgba(30,58,95,.3)':'none'}},
                      h('span',{style:{fontSize:12,color:'var(--text)',flex:1}},m.name),
                      m.qty&&h('span',{style:{fontSize:12,fontFamily:'var(--mono)',color:'var(--blue)',fontWeight:700}},m.qty+' '+(m.ud||'')),
                      canEdit&&h('div',{style:{display:'flex',gap:4,marginLeft:4}},
                        h('button',{onClick:function(){setEditMat({ei:idx,mi:mi});setEditMatDraft({name:m.name,qty:m.qty||'',ud:m.ud||UNITS[0]||'un'});},style:{background:'rgba(14,165,233,.1)',border:'1px solid rgba(14,165,233,.2)',borderRadius:5,color:'var(--blue)',cursor:'pointer',fontSize:10,padding:'2px 7px'}},'Editar'),
                        h('button',{onClick:function(){deleteMat(dayView,idx,mi);},style:{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.15)',borderRadius:5,color:'var(--red)',cursor:'pointer',fontSize:10,padding:'2px 7px'}},'x')
                      )
                    );
                  }),
              addingMat&&h('div',{style:{display:'flex',flexDirection:'column',gap:6,padding:'7px 0',borderTop:mats.length?'1px solid rgba(30,58,95,.3)':'none',marginTop:mats.length?4:0}},
                h('div',{style:{display:'flex',gap:5}},
                  h('input',{autoFocus:true,placeholder:'Nombre del material...',value:editMatDraft.name||'',
                    onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{name:e.target.value}));},
                    onKeyDown:function(e){
                      if(e.key==='Enter'){
                        if(!(editMatDraft.name||'').trim())return;
                        var entries=getDayEntries(dayView).slice();
                        var ms=(entries[idx].materiales||[]).slice();
                        ms.push({name:(editMatDraft.name||'').trim(),qty:editMatDraft.qty||'',ud:editMatDraft.ud||UNITS[0]||'un'});
                        entries[idx]=Object.assign({},entries[idx],{materiales:ms});
                        saveDayEntries(dayView,entries);
                        setEditMatDraft({name:'',qty:'',ud:editMatDraft.ud||UNITS[0]||'un'});
                        toast&&toast('Material agregado');
                      }
                      if(e.key==='Escape')setEditMat(null);
                    },
                    style:{flex:2,background:'var(--bg2)',border:'1px solid var(--blue)',borderRadius:6,padding:'5px 7px',color:'var(--text)',fontSize:12,outline:'none'}}),
                  h('input',{value:editMatDraft.qty||'',placeholder:'Cant.',
                    onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{qty:e.target.value}));},
                    style:{flex:'0 0 52px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 5px',color:'var(--text)',fontSize:12,outline:'none'}}),
                  h('select',{value:editMatDraft.ud||UNITS[0]||'un',
                    onChange:function(e){setEditMatDraft(Object.assign({},editMatDraft,{ud:e.target.value}));},
                    style:{flex:'0 0 68px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 3px',color:'var(--text2)',fontSize:12,outline:'none'}},
                    UNITS.map(function(u){return h('option',{key:u,value:u},u);}))
                ),
                h('div',{style:{display:'flex',gap:6}},
                  h('button',{
                    onClick:function(){
                      if(!(editMatDraft.name||'').trim())return;
                      var entries=getDayEntries(dayView).slice();
                      var ms=(entries[idx].materiales||[]).slice();
                      ms.push({name:(editMatDraft.name||'').trim(),qty:editMatDraft.qty||'',ud:editMatDraft.ud||UNITS[0]||'un'});
                      entries[idx]=Object.assign({},entries[idx],{materiales:ms});
                      saveDayEntries(dayView,entries);
                      setEditMatDraft({name:'',qty:'',ud:editMatDraft.ud||UNITS[0]||'un'});
                      toast&&toast('Material agregado');
                    },
                    style:{flex:1,padding:'5px 0',borderRadius:6,background:'var(--green)',border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}},'+ Agregar'),
                  h('button',{onClick:function(){setEditMat(null);},style:{padding:'5px 10px',borderRadius:6,border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',fontSize:12,cursor:'pointer'}},'Cerrar')
                )
              ),
              canEdit&&!addingMat&&!editingHora&&h('button',{
                onClick:function(){setEditMat({ei:idx,mi:'new'});setEditMatDraft({name:'',qty:'',ud:UNITS[0]||'un'});},
                style:{width:'100%',marginTop:8,padding:'5px 0',borderRadius:6,border:'1px dashed rgba(14,165,233,.35)',background:'transparent',color:'rgba(14,165,233,.7)',cursor:'pointer',fontSize:11,fontWeight:600}
              },'+ Agregar material')
            )
          );
