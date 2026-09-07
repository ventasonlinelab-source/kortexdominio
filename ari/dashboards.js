(()=>{
  const ID='ari-dashboard-menu-hof404';
  const ROUTES=[
    {icon:'◆',title:'HERMES',detail:'Clínicas · Pipeline · Citas',href:'/ari/hermes/'},
    {icon:'⌁',title:'TRADING',detail:'Mercado · Gráficos · Operaciones',href:'/ari/trading/'},
    {icon:'♫',title:'MÚSICA',detail:'DAW · Creación · Producción',href:'/ari/music/'}
  ];
  function ensure(){
    if(document.getElementById(ID))return;
    const view=document.querySelector('.view[data-view="menu"]');
    if(!view)return;
    const status=view.querySelector('#updateStatus');
    const section=document.createElement('section');
    section.id=ID;
    section.innerHTML=`<div class="section-title">DASHBOARDS / SISTEMAS</div><div class="menu-list">${ROUTES.map(r=>`<button class="menu-item" data-dashboard-route="${r.href}"><span class="menu-main"><span class="menu-icon">${r.icon}</span><span class="menu-copy"><strong>${r.title}</strong><span>${r.detail}</span></span></span><span class="chev">›</span></button>`).join('')}</div>`;
    if(status)view.insertBefore(section,status);else view.appendChild(section);
    section.querySelectorAll('[data-dashboard-route]').forEach(b=>b.addEventListener('click',()=>location.assign(b.dataset.dashboardRoute)));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  addEventListener('pageshow',ensure);
  window.ARI_ENSURE_DASHBOARDS=ensure;
})();