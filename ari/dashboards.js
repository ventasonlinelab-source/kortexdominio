(()=>{
  const ID='ari-dashboard-menu-hof404',CONTEXT_KEY='ari-context-system',THEME_KEY='ari-theme',SEPIA_KEY='ari-global-sepia-v1',REFRESH_ID='ari-global-refresh';
  const ROUTES=[
    {icon:'◆',title:'HERMES',detail:'Clínicas · Pipeline · Citas',href:'/ari/hermes/'},
    {icon:'⌁',title:'TRADING',detail:'Mercado · Gráficos · Operaciones',href:'/ari/trading/'},
    {icon:'♫',title:'MÚSICA',detail:'DAW · Creación · Producción',href:'/ari/music/'},
    {icon:'🛒',title:'LISTA DE LA COMPRA',detail:'Pendientes del súper',href:'/ari/shopping/'}
  ];
  function ensureGlobalStyle(){
    if(document.getElementById('ari-global-ui-style'))return;
    const s=document.createElement('style');s.id='ari-global-ui-style';s.textContent=`
      html[data-theme="light"]{
        --bg:#e8decf!important;--panel:#f7efe3!important;--panel2:#eadfce!important;
        --chrome:#f4eadb!important;--chrome2:#eadfce!important;--grid:#e2d4c1!important;--grid-strong:#cbb99f!important;
        --line:#d3c2aa!important;--border:#d3c2aa!important;--text:#2d261f!important;--muted:#7f705e!important;--muted2:#6f6252!important;
        --gold:#a9792d!important;--accent:#a9792d!important;--accent-soft:#ead9b8!important;
        --bottom:rgba(244,234,219,.97)!important;--header:rgba(244,234,219,.95)!important;
        --phase-a:#e2d6c6!important;--phase-b:#d4c5b2!important;--phase-border:#c9b99f!important;
        --task-bg:#d8c09a!important;--task-border:#b9965c!important;--task-accent:#8d6424!important;
        --ticket:rgba(247,239,227,.98)!important
      }
      #${REFRESH_ID}{appearance:none;border:0;background:transparent;font:inherit;cursor:pointer}
      #${REFRESH_ID}[disabled]{opacity:.55;cursor:default}
    `;document.head.appendChild(s);
  }
  function applyGlobalTheme(){
    if(localStorage.getItem(SEPIA_KEY)!=='1'){localStorage.setItem(THEME_KEY,'light');localStorage.setItem(SEPIA_KEY,'1')}
    const pref=localStorage.getItem(THEME_KEY)||'light',dark=matchMedia('(prefers-color-scheme: dark)').matches,resolved=pref==='auto'?(dark?'dark':'light'):pref;
    document.documentElement.dataset.theme=resolved;
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=resolved==='dark'?'#161816':'#e8decf';
  }
  async function hardRefresh(btn){
    if(btn?.disabled)return;if(btn){btn.disabled=true;const b=btn.querySelector('b');if(b)b.textContent='…'}
    try{
      if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.update()}
      if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('ari-')).map(k=>caches.delete(k)))}
      const u=new URL(location.href);u.searchParams.set('refresh',Date.now());location.replace(u.toString());
    }catch(e){if(btn){btn.disabled=false;const b=btn.querySelector('b');if(b)b.textContent='↻'}}
  }
  function layoutBottom(nav){
    const visible=[...nav.children].filter(x=>!x.hidden&&getComputedStyle(x).display!=='none').length;
    if(visible)nav.style.gridTemplateColumns=`repeat(${visible},minmax(0,1fr))`;
  }
  function ensureRefresh(){
    const nav=document.querySelector('nav.bottom,.bottom');if(!nav)return;
    let btn=document.getElementById(REFRESH_ID)||document.getElementById('refreshApp');
    if(!btn){btn=document.createElement('button');btn.id=REFRESH_ID;btn.className='nav';btn.type='button';btn.innerHTML='<b>↻</b>Actualizar';nav.appendChild(btn)}
    if(!btn.dataset.globalRefresh){btn.dataset.globalRefresh='1';btn.addEventListener('click',()=>hardRefresh(btn))}
    layoutBottom(nav);
  }
  function ensureDashboardMenu(){
    if(document.getElementById(ID))return;
    const view=document.querySelector('.view[data-view="menu"]');if(!view)return;
    const status=view.querySelector('#updateStatus'),section=document.createElement('section');section.id=ID;
    section.innerHTML=`<div class="section-title">DASHBOARDS / SISTEMAS</div><div class="menu-list">${ROUTES.map(r=>`<button class="menu-item" data-dashboard-route="${r.href}"><span class="menu-main"><span class="menu-icon">${r.icon}</span><span class="menu-copy"><strong>${r.title}</strong><span>${r.detail}</span></span></span><span class="chev">›</span></button>`).join('')}</div>`;
    if(status)view.insertBefore(section,status);else view.appendChild(section);
    section.querySelectorAll('[data-dashboard-route]').forEach(b=>b.addEventListener('click',()=>location.assign(b.dataset.dashboardRoute)));
  }
  function ensureMusicTools(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    if(document.querySelector('script[data-ari-clip-tools]')||window.ARI_DAW_SPLIT_CLIP)return;
    const s=document.createElement('script');s.src='/ari/music/clip-tools.js?v=1';s.dataset.ariClipTools='1';s.defer=true;document.head.appendChild(s);
  }
  function syncContext(){
    const el=document.getElementById('contextMusic'),nav=document.getElementById('bottomNav');if(!el||!nav){ensureRefresh();return}
    const ctx=localStorage.getItem(CONTEXT_KEY);
    if(ctx==='music'){el.href='/ari/music/?resume=1';el.innerHTML='<b>♫</b>Música';el.hidden=false;nav.classList.add('has-context')}
    else if(ctx==='trading'){el.href='/ari/trading/?resume=1';el.innerHTML='<b>⌁</b>Trading';el.hidden=false;nav.classList.add('has-context')}
    else if(ctx==='hermes'){el.href='/ari/hermes/';el.innerHTML='<b>◆</b>Hermes';el.hidden=false;nav.classList.add('has-context')}
    else{el.hidden=true;nav.classList.remove('has-context')}
    ensureRefresh();layoutBottom(nav);
  }
  function ensure(){ensureGlobalStyle();applyGlobalTheme();ensureDashboardMenu();syncContext();ensureRefresh();ensureMusicTools()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  addEventListener('pageshow',ensure);addEventListener('storage',e=>{if(e.key===CONTEXT_KEY)syncContext();if(e.key===THEME_KEY)applyGlobalTheme()});
  window.ARI_ENSURE_DASHBOARDS=ensure;window.ARI_HARD_REFRESH=hardRefresh;
})();