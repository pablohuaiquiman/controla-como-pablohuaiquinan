            h('div',{style:{padding:'8px 14px'}},
              h('div',{style:{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--text3)',marginBottom:6,textTransform:'uppercase'}},'Materiales programados'),
              mats.length===0
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
                  })
            )