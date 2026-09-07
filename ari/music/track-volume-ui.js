(()=>{
  const ROOT_ID='tracks';
  const STYLE_ID='ari-track-volume-style';
  let observer=null;

  const db=v=>v<=0?'-∞ dB':((20*Math.log10(v))>=0?'+':'')+(20*Math.log10(v)).toFixed(1)+' dB';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .track-head .mixers{grid-template-columns:24px minmax(54px,1fr) 54px!important;gap:5px!important}
      .track-head .vol-label{font-size:7px;font-weight:950;letter-spacing:.08em;color:var(--muted);text-align:left}
      .track-head .vol{min-width:0;width:100%!important;height:18px!important;cursor:ew-resize}
      .track-head .vol-db{font-size:7.5px!important;font-variant-numeric:tabular-nums;text-align:right!important;color:var(--text)!important;font-weight:850;white-space:nowrap}
      .track-head .vol:focus-visible{outline:1px solid var(--accent);outline-offset:1px}
      @media(max-width:560px){.track-head .mixers{grid-template-columns:20px minmax(42px,1fr) 45px!important}.track-head .vol-db{font-size:6.5px!important}}
    `;document.head.appendChild(s);
  }

  function enhanceRow(row){
    const mixers=row.querySelector('.mixers'),slider=mixers?.querySelector('.vol');
    if(!mixers||!slider)return;
    slider.min='0';slider.max='2';slider.step='.005';slider.setAttribute('aria-label','Volumen de pista');
    let label=mixers.querySelector('.vol-label');
    if(!label){label=document.createElement('span');label.className='vol-label';label.textContent='VOL';mixers.insertBefore(label,slider)}
    let readout=mixers.querySelector('.pan');
    if(readout){readout.classList.add('vol-db');readout.textContent=db(Number(slider.value)||0)}
    if(slider.dataset.ariDbBound!=='1'){
      slider.dataset.ariDbBound='1';
      const paint=()=>{const r=mixers.querySelector('.vol-db');if(r)r.textContent=db(Number(slider.value)||0)};
      slider.addEventListener('input',()=>requestAnimationFrame(paint));
      slider.addEventListener('change',paint);
      slider.addEventListener('dblclick',e=>{e.preventDefault();slider.value='1';slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}))});
    }
  }

  function enhance(){
    ensureStyle();
    const root=document.getElementById(ROOT_ID);if(!root)return;
    root.querySelectorAll('.track-row').forEach(enhanceRow);
  }

  function mount(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    const root=document.getElementById(ROOT_ID);if(!root){setTimeout(mount,200);return}
    enhance();
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>requestAnimationFrame(enhance));
    observer.observe(root,{childList:true,subtree:true});
  }

  window.ARI_TRACK_VOLUME_UI=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  addEventListener('pageshow',mount);
})();
