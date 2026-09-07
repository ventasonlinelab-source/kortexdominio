(()=>{
  const STYLE_ID='ari-contextual-style-v17';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #contextWorkspace{margin:0 0 12px}
      .context-shell{border:1px solid var(--border);background:var(--panel);border-radius:18px;overflow:hidden}
      .context-head{padding:15px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px}
      .context-head-copy{min-width:0}.context-kicker{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}.context-title{font-size:16px;font-weight:760;line-height:1.2}.context-status{font-size:9px;color:var(--muted);white-space:nowrap}
      .msg-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-bottom:1px solid var(--border)}
      .msg-stat{background:var(--panel);padding:11px 8px;text-align:center}.msg-stat b{display:block;font-size:15px}.msg-stat span{font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
      .msg-list{display:grid}.msg-row{appearance:none;border:0;border-top:1px solid var(--border);background:transparent;color:var(--text);padding:13px 15px;text-align:left;display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center}.msg-row:first-child{border-top:0}.msg-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--panel2);border:1px solid var(--border);font-size:12px;font-weight:800}.msg-main{min-width:0}.msg-name{font-size:13px;font-weight:720}.msg-preview{font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.msg-meta{text-align:right}.msg-time{font-size:9px;color:var(--muted)}.msg-count{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:color-mix(in srgb,var(--gold) 24%,var(--panel));color:var(--gold);font-size:9px;font-weight:800;margin-top:4px}
      .msg-empty{padding:18px 16px;text-align:center}.msg-empty strong{display:block;font-size:13px}.msg-empty span{display:block;font-size:10px;color:var(--muted);margin-top:5px;line-height:1.45}
      .msg-actions{display:flex;gap:8px;padding:12px 14px;border-top:1px solid var(--border)}.msg-action{appearance:none;border:1px solid var(--border);background:var(--panel2);color:var(--text);border-radius:12px;padding:10px 12px;font-size:10px;font-weight:700;flex:1}.msg-action.primary{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 15%,var(--panel))}
      .task-row.done:after,.task-row.completed:after{display:none!important}
      .task-row.done .task-title,.task-row.completed .task-title{text-decoration-line:line-through;text-decoration-thickness:2px;text-decoration-color:var(--task-accent);opacity:.55}
      .task-row.done .task-label,.task-row.completed .task-label{display:none}
      .task-row.done .task-time,.task-row.completed .task-time{opacity:.45}
    `;
    document.head.appendChild(style);
  }

  function root(){return document.getElementById('contextWorkspace')}
  function pendingMessages(){const data=window.ARI_PENDING_MESSAGES;return Array.isArray(data)?data:[]}
  function initials(name='?'){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}

  function renderMessaging(){
    const host=root(); if(!host)return;
    const msgs=pendingMessages();
    const unread=msgs.reduce((n,m)=>n+(Number(m.unread)||0),0);
    const priority=msgs.filter(m=>m.priority==='high'||m.priority==='critical').length;
    host.hidden=false;
    host.innerHTML=`<section class="context-shell" data-mode="messaging">
      <div class="context-head"><div class="context-head-copy"><div class="context-kicker">MENSAJERÍA</div><div class="context-title">Mensajes pendientes</div></div><div class="context-status">${msgs.length?'sincronizado':'WhatsApp pendiente'}</div></div>
      <div class="msg-summary"><div class="msg-stat"><b>${msgs.length}</b><span>chats</span></div><div class="msg-stat"><b>${unread}</b><span>mensajes</span></div><div class="msg-stat"><b>${priority}</b><span>prioridad</span></div></div>
      ${msgs.length?`<div class="msg-list">${msgs.map((m,i)=>`<button class="msg-row" data-msg-index="${i}"><span class="msg-avatar">${initials(m.name)}</span><span class="msg-main"><span class="msg-name">${m.name||'Contacto'}</span><span class="msg-preview">${m.preview||'Mensaje pendiente'}</span></span><span class="msg-meta"><span class="msg-time">${m.time||''}</span>${m.unread?`<span class="msg-count">${m.unread}</span>`:''}</span></button>`).join('')}</div>`:`<div class="msg-empty"><strong>Mensajería lista en Ahora.</strong><span>Aquí aparecerán directamente los mensajes pendientes reales cuando termine la conexión de WhatsApp. No se muestran datos inventados.</span></div>`}
      <div class="msg-actions"><button class="msg-action" id="msgWho">¿Quién me ha escrito?</button><button class="msg-action primary" id="msgRead">Léeme lo importante</button></div>
    </section>`;
    const input=document.getElementById('noteInput');
    host.querySelectorAll('.msg-row').forEach(btn=>btn.onclick=()=>{const m=msgs[Number(btn.dataset.msgIndex)];if(input){input.value=`Dime qué dice ${m?.name||'este contacto'}`;input.focus()}});
    const who=host.querySelector('#msgWho'),read=host.querySelector('#msgRead');
    if(who)who.onclick=()=>{if(input){input.value='¿Quién me ha escrito y qué prioridad tiene cada mensaje?';input.focus()}};
    if(read)read.onclick=()=>{if(input){input.value='Léeme los mensajes importantes pendientes.';input.focus()}};
  }

  const repaint=()=>{renderMessaging()};
  if(typeof window.renderAll==='function'){
    const original=window.renderAll;
    window.renderAll=function(){original();repaint()};
  }
  if(typeof window.renderNow==='function'){
    const original=window.renderNow;
    window.renderNow=function(){original();repaint()};
  }
  window.ARI_RENDER_CONTEXT=repaint;
  setTimeout(repaint,0);
})();