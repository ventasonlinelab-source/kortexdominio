(()=>{
  const ID='ari-dashboard-menu-hof404',CONTEXT_KEY='ari-context-system';
  const ROUTES=[
    {icon:'◆',title:'HERMES',detail:'Clínicas · Pipeline · Citas',href:'/ari/hermes/'},
    {icon:'⌁',title:'TRADING',detail:'Mercado · Gráficos · Operaciones',href:'/ari/trading/'},
    {icon:'♫',title:'MÚSICA',detail:'DAW · Creación · Producción',href:'/ari/music/'},
    {icon:'🛒',title:'LISTA DE LA COMPRA',detail:'Pendientes del súper',href:'/ari/shopping/'}
  ];
  function ensure(){
    if(!document.getElementById(ID)){
      const view=document.querySelector('.view[data-view="menu"]');
      if(view){
        const status=view.querySelector('#updateStatus');
        const section=document.createElement('section');
        section.id=ID;
        section.innerHTML=`<div class="section-title">DASHBOARDS / SISTEMAS</div><div class="menu-list">${ROUTES.map(r=>`<button class="menu-item" data-dashboard-route="${r.href}"><span class="menu-main"><span class="menu-icon">${r.icon}</span><span class="menu-copy"><strong>${r.title}</strong><span>${r.detail}</span></span></span><span class="chev">›</span></button>`).join('')}</div>`;
        if(status)view.insertBefore(section,status);else view.appendChild(section);
        section.querySelectorAll('[data-dashboard-route]').forEach(b=>b.addEventListener('click',()=>location.assign(b.dataset.dashboardRoute)));
      }
    }
    syncContext();
  }
  function syncContext(){
    const el=document.getElementById('contextMusic'),nav=document.getElementById('bottomNav');if(!el||!nav)return;
    const ctx=localStorage.getItem(CONTEXT_KEY);
    if(ctx==='music'){el.href='/ari/music/?resume=1';el.innerHTML='<b>♫</b>Música';el.hidden=false;nav.classList.add('has-context')}
    else if(ctx==='trading'){el.href='/ari/trading/?resume=1';el.innerHTML='<b>⌁</b>Trading';el.hidden=false;nav.classList.add('has-context')}
    else if(ctx==='hermes'){el.href='/ari/hermes/';el.innerHTML='<b>◆</b>Hermes';el.hidden=false;nav.classList.add('has-context')}
    else{el.hidden=true;nav.classList.remove('has-context')}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  addEventListener('pageshow',ensure);addEventListener('storage',e=>{if(e.key===CONTEXT_KEY)syncContext()});
  window.ARI_ENSURE_DASHBOARDS=ensure;
})();