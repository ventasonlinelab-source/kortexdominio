(()=>{
  const STYLE_ID='ari-contextual-style';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .context-workspace{margin-top:14px}
      .context-shell{border:1px solid var(--border);background:var(--panel);border-radius:18px;overflow:hidden}
      .context-head{padding:15px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px}
      .context-head-copy{min-width:0}.context-kicker{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}.context-title{font-size:16px;font-weight:760;line-height:1.2}.context-status{font-size:9px;color:var(--muted);white-space:nowrap}
      .msg-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-bottom:1px solid var(--border)}
      .msg-stat{background:var(--panel);padding:11px 8px;text-align:center}.msg-stat b{display:block;font-size:15px}.msg-stat span{font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
      .msg-list{display:grid}.msg-row{appearance:none;border:0;border-top:1px solid var(--border);background:transparent;color:var(--text);padding:13px 15px;text-align:left;display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center}.msg-row:first-child{border-top:0}.msg-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);border:1px solid var(--border);font-size:12px;font-weight:800}.msg-main{min-width:0}.msg-name{font-size:13px;font-weight:720}.msg-preview{font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.msg-meta{text-align:right}.msg-time{font-size:9px;color:var(--muted)}.msg-count{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:color-mix(in srgb,var(--gold) 24%,var(--panel));color:var(--gold);font-size:9px;font-weight:800;margin-top:4px}
      .msg-empty{padding:22px 16px;text-align:center}.msg-empty strong{display:block;font-size:13px}.msg-empty span{display:block;font-size:10px;color:var(--muted);margin-top:5px;line-height:1.45}
      .msg-actions{display:flex;gap:8px;padding:12px 14px;border-top:1px solid var(--border)}.msg-action{appearance:none;border:1px solid var(--border);background:var(--panel2);color:var(--text);border-radius:12px;padding:10px 12px;font-size:10px;font-weight:700;flex:1}.msg-action.primary{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 15%,var(--panel))}
      .task-row.completed{opacity:.55}.task-row.completed:after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:var(--task-accent);opacity:.8}.task-row.completed .task-label,.task-row.completed .task-time{opacity:.45}
    `;
    document.head.appendChild(style);
  }

  function ensureWorkspace(){
    const now=document.querySelector('[data-view="ahora"]');
    if(!now)return null;
    let root=document.getElementById('contextWorkspace');
    if(!root){root=document.createElement('div');root.id='contextWorkspace';root.className='context-workspace';const panel=now.querySelector('.panel');panel?.insertAdjacentElement('afterend',root)}
    return root;
  }

  function pendingMessages(){
    const data=window.ARI_PENDING_MESSAGES;
    return Array.isArray(data)?data:[];
  }

  function initials(name='?'){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}

  function renderMessaging(root){
    const msgs=pendingMessages();
    const unread=msgs.reduce((n,m)=>n+(Number(m.unread)||0),0);
    const priority=msgs.filter(m=>m.priority==='high'||m.priority==='critical').length;
    root.innerHTML=`
      <section class="context-shell" data-mode="messaging">
        <div class="context-head"><div class="context-head-copy"><div class="context-kicker">AHORA · MENSAJERÍA</div><div class="context-title">Mensajes pendientes</div></div><div class="context-status">${msgs.length?'sincronizado':'WhatsApp pendiente'}</div></div>
        <div class="msg-summary"><div class="msg-stat"><b>${msgs.length}</b><span>chats</span></div><div class="msg-stat"><b>${unread}</b><span>mensajes</span></div><div class="msg-stat"><b>${priority}</b><span>prioridad</span></div></div>
        ${msgs.length?`<div class="msg-list">${msgs.map((m,i)=>`<button class="msg-row" data-msg-index="${i}"><span class="msg-avatar">${initials(m.name)}</span><span class="msg-main"><span class="msg-name">${m.name||'Contacto'}</span><span class="msg-preview">${m.preview||'Mensaje pendiente'}</span></span><span class="msg-meta"><span class="msg-time">${m.time||''}</span>${m.unread?`<span class="msg-count">${m.unread}</span>`:''}</span></button>`).join('')}</div>`:`<div class="msg-empty"><strong>Workspace preparado.</strong><span>En cuanto conectemos WhatsApp aquí aparecerán solo los mensajes pendientes reales, agrupados por persona y prioridad. A.R.I. no inventa conversaciones.</span></div>`}
        <div class="msg-actions"><button class="msg-action" id="msgWho">¿Quién me ha escrito?</button><button class="msg-action primary" id="msgRead">Léeme lo importante</button></div>
      </section>`;
    root.querySelectorAll('.msg-row').forEach(btn=>btn.onclick=()=>{
      const m=msgs[Number(btn.dataset.msgIndex)];
      const input=document.getElementById('noteInput');
      if(input){input.value=`Dime qué dice ${m?.name||'este contacto'}`;input.focus()}
    });
    const who=root.querySelector('#msgWho'),read=root.querySelector('#msgRead'),input=document.getElementById('noteInput');
    if(who)who.onclick=()=>{if(input){input.value='¿Quién me ha escrito y qué prioridad tiene cada mensaje?';input.focus()}};
    if(read)read.onclick=()=>{if(input){input.value='Léeme los mensajes importantes pendientes.';input.focus()}};
  }

  function contextEvent(){
    try{
      const current=typeof activeEvent==='function'?activeEvent():null;
      if(current&&String(current.title||'').includes('VER MENSAJES PENDIENTES'))return current;
      const next=typeof nextTask==='function'?nextTask():null;
      if(next&&String(next.title||'').includes('VER MENSAJES PENDIENTES'))return next;
      return current;
    }catch(_){return null}
  }

  function renderContext(){
    const root=ensureWorkspace(); if(!root)return;
    const e=contextEvent(),title=String(e?.title||'');
    if(title.includes('VER MENSAJES PENDIENTES')){renderMessaging(root);root.hidden=false}
    else{root.innerHTML='';root.hidden=true}
  }

  if(typeof window.taskRow==='function'){
    const originalTaskRow=window.taskRow;
    window.taskRow=function(e){
      let completed=false;
      try{completed=typeof isTaskDone==='function'?isTaskDone(e,selectedDate):e?.completed===true}catch(_){completed=e?.completed===true}
      const html=originalTaskRow(e);
      return completed?html.replace('task-row ','task-row completed '):html;
    };
  }

  if(typeof window.renderAll==='function'){
    const originalRenderAll=window.renderAll;
    window.renderAll=function(){originalRenderAll();renderContext()};
  }
  if(typeof window.renderNow==='function'){
    const originalRenderNow=window.renderNow;
    window.renderNow=function(){originalRenderNow();renderContext()};
  }

  window.ARI_RENDER_CONTEXT=renderContext;
  setTimeout(renderContext,0);
})();