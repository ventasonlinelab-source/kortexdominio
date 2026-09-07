(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const STYLE_ID='ari-duplicate-track-style';
  let observer=null;

  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  const clone=x=>typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x));

  function readProject(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}}
  function writeProject(p){p.updatedAt=new Date().toISOString();localStorage.setItem(PROJECT_KEY,JSON.stringify(p))}
  function toast(msg){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1400)}

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .mini-toggle.duplicate-track{font-size:11px!important;line-height:1;width:25px!important}
      .mini-toggle.duplicate-track:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
    `;document.head.appendChild(s);
  }

  function duplicate(trackId){
    const p=readProject();if(!p||!Array.isArray(p.tracks))return false;
    const index=p.tracks.findIndex(t=>String(t.id)===String(trackId));if(index<0)return false;
    const original=p.tracks[index],copy=clone(original);
    copy.id=uid();
    copy.name=(original.name||'PISTA')+' · COPIA';
    copy.armed=false;
    delete copy.demoRole;delete copy.songRole;
    copy.devices=(copy.devices||[]).map(d=>({...d,id:uid()}));
    copy.clips=(copy.clips||[]).map(c=>{
      const nc={...c,id:uid(),name:(c.name||c.type||'CLIP')+' · COPIA'};
      delete nc.demoRole;delete nc.songRole;
      if(Array.isArray(nc.notes))nc.notes=nc.notes.map(n=>({...n,id:uid()}));
      return nc;
    });
    p.tracks.splice(index+1,0,copy);
    writeProject(p);
    sessionStorage.setItem('ari-last-duplicated-track-v1',copy.id);
    toast('Pista duplicada ✓');
    setTimeout(()=>location.reload(),120);
    return true;
  }

  function enhanceRow(row){
    const head=row.querySelector('.track-head'),buttons=head?.querySelector('.track-buttons');
    if(!buttons||buttons.querySelector('.duplicate-track'))return;
    const id=row.dataset.track;if(!id)return;
    const b=document.createElement('button');
    b.type='button';b.className='mini-toggle duplicate-track';b.title='Duplicar pista';b.setAttribute('aria-label','Duplicar pista');b.textContent='⧉';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();duplicate(id)});
    buttons.appendChild(b);
  }

  function enhance(){ensureStyle();document.querySelectorAll('#tracks .track-row').forEach(enhanceRow)}
  function mount(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    const root=document.getElementById('tracks');if(!root){setTimeout(mount,180);return}
    enhance();
    observer?.disconnect();observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(root,{childList:true,subtree:true});
  }

  window.ARI_DUPLICATE_TRACK=duplicate;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  addEventListener('pageshow',mount);
})();
