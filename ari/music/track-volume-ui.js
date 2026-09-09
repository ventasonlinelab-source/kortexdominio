(()=>{
  const ROOT_ID='tracks';
  const STYLE_ID='ari-track-volume-style';
  let observer=null;

  const db=v=>v<=0?'-∞ dB':((20*Math.log10(v))>=0?'+':'')+(20*Math.log10(v)).toFixed(1)+' dB';

  function ensureStyle(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
    s.textContent=`
      .track-row{height:78px!important}
      .track-head{height:78px!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-rows:22px 14px 28px!important;gap:2px 5px!important;padding:5px 6px!important;overflow:visible!important}
      .track-head .track-name{grid-column:1;grid-row:1}
      .track-head .track-buttons{grid-column:2;grid-row:1}
      .track-head .track-type{grid-column:1/-1;grid-row:2;align-self:center}
      .track-head .mixers{grid-column:1/-1!important;grid-row:3!important;display:grid!important;grid-template-columns:24px minmax(54px,1fr) 54px!important;align-items:center!important;gap:5px!important;min-width:0!important}
      .track-head .vol-label{font-size:7px;font-weight:950;letter-spacing:.08em;color:var(--muted);text-align:left}
      .track-head .vol{display:block!important;min-width:0;width:100%!important;height:20px!important;cursor:ew-resize;accent-color:var(--accent)}
      .track-head .vol-db{font-size:7.5px!important;font-variant-numeric:tabular-nums;text-align:right!important;color:var(--text)!important;font-weight:850;white-space:nowrap}
      .track-head .vol:focus-visible{outline:1px solid var(--accent);outline-offset:1px}
      .track-row .lane{height:78px!important}
      .track-row .lane .clip{top:16px!important}
      @media(max-width:560px){
        .track-row,.track-head,.track-row .lane{height:76px!important}
        .track-head{grid-template-rows:21px 13px 27px!important}
        .track-head .mixers{grid-template-columns:20px minmax(42px,1fr) 45px!important}
        .track-head .vol-db{font-size:6.5px!important}
        .track-row .lane .clip{top:15px!important}
      }
    `;
  }

  function enhanceRow(row){
    const mixers=row.querySelector('.mixers'),slider=mixers?.querySelector('.vol');
    if(!mixers||!slider)return;
    slider.min='0';slider.max='2';slider.step='.005';slider.setAttribute('aria-label','Volumen de pista');
    let label=mixers.querySelector('.vol-label');
    if(!label){label=document.createElement('span');label.className='vol-label';label.textContent='VOL';mixers.insertBefore(label,slider)}
    let readout=mixers.querySelector('.pan');
    if(readout){readout.classList.add('vol-db');const txt=db(Number(slider.value)||0);if(readout.textContent!==txt)readout.textContent=txt}
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
    observer.observe(root,{childList:true});
  }

  window.ARI_TRACK_VOLUME_UI=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  addEventListener('pageshow',mount);
})();
