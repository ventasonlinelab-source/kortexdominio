(()=>{
  const side=document.querySelector('#live .side');
  if(!side||side.dataset.hof409TfCapture==='1')return;

  const MODELS={
    SEMANA:{label:'SEMANA',tfs:['MN','W1','D1'],synthesis:'SÍNTESIS SEMANAL'},
    APERTURA:{label:'APERTURA',tfs:['H4','H1','M15','M5'],synthesis:'SÍNTESIS OPERATIVA'},
    SETUP:{label:'SETUP',tfs:['H4','M15','M5','M1'],synthesis:'PLAN / CONDICIÓN DE EJECUCIÓN'}
  };
  const MAX_IMAGE_BYTES=20*1024*1024;
  const ASSET='XAUUSD';
  const VERSION='HOF409-TF-V1';
  const legacyAsset=document.getElementById('asset');
  if(legacyAsset){legacyAsset.innerHTML='<option value="OANDA:XAUUSD">XAUUSD</option>';legacyAsset.value='OANDA:XAUUSD';}

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid=()=>crypto.randomUUID?.()||('ari_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  function isoWeek(date=new Date()){
    const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
    const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);
    const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const w=Math.ceil((((d-y)/86400000)+1)/7);
    return d.getUTCFullYear()+'-'+String(w).padStart(2,'0');
  }
  function localDate(date=new Date()){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function analysisId(mode){
    const stamp=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14),tail=uid().replace(/-/g,'').slice(0,8).toUpperCase();
    return `${mode}-${stamp}-${tail}`;
  }
  function makeDraft(mode){
    return{
      mode,
      analysis_id:analysisId(mode),
      created_at:new Date().toISOString(),
      semana_id:`SEMANA-${isoWeek()}`,
      apertura_id:mode==='APERTURA'?`APERTURA-${localDate()}`:null,
      blocks:MODELS[mode].tfs.map((timeframe,orden)=>({timeframe,texto_raw:'',imagenes:[],orden})),
      synthesis:'',
      lastFingerprint:null
    };
  }
  const drafts={SEMANA:makeDraft('SEMANA'),APERTURA:makeDraft('APERTURA'),SETUP:makeDraft('SETUP')};
  let mode='SEMANA';

  const style=document.createElement('style');
  style.id='hof409-tf-capture-style';
  style.textContent=`
    .tfdoc-shell{display:grid;gap:10px}.tfdoc-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
    .tfdoc-mode{border:1px solid var(--border);background:var(--panel2);color:var(--muted);border-radius:11px;padding:10px 7px;font-size:9px;font-weight:900;letter-spacing:.06em}
    .tfdoc-mode.active{border-color:var(--gold);color:var(--gold)}.tfdoc-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-end}
    .tfdoc-title{font-size:11px;font-weight:900;letter-spacing:.08em}.tfdoc-id{font-size:8px;color:var(--muted);overflow-wrap:anywhere;text-align:right}
    .tfdoc-blocks{display:grid;gap:8px}.tfdoc-block{border:1px solid var(--border);background:var(--panel);border-radius:13px;padding:10px;display:grid;gap:7px}
    .tfdoc-tf{font-size:13px;font-weight:950;color:var(--gold);letter-spacing:.08em}.tfdoc-block textarea,.tfdoc-synthesis textarea{width:100%;min-height:76px;resize:vertical;border:1px solid var(--border);background:var(--panel2);color:var(--text);border-radius:10px;padding:9px;font:inherit;font-size:12px;line-height:1.4;outline:0}
    .tfdoc-block textarea:focus,.tfdoc-synthesis textarea:focus{border-color:var(--gold)}.tfdoc-upload{display:grid;gap:5px}.tfdoc-upload-label{font-size:9px;color:var(--muted)}
    .tfdoc-upload input{width:100%;font-size:10px;color:var(--muted)}.tfdoc-upload input::file-selector-button{border:1px solid var(--border);background:var(--panel2);color:var(--text);border-radius:8px;padding:7px;margin-right:6px;font-weight:800}
    .tfdoc-images{display:grid;gap:5px}.tfdoc-image{display:grid;grid-template-columns:42px minmax(0,1fr) 28px;gap:7px;align-items:center;border:1px solid var(--line);background:var(--panel2);border-radius:9px;padding:5px}
    .tfdoc-image img{width:42px;height:34px;object-fit:cover;border-radius:6px}.tfdoc-image span{font-size:8px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tfdoc-remove{border:1px solid var(--border);background:transparent;color:var(--muted);width:28px;height:28px;border-radius:7px;font-weight:900}
    .tfdoc-synthesis{border:1px solid var(--border);background:var(--panel);border-radius:13px;padding:10px;display:grid;gap:7px}.tfdoc-synthesis label{font-size:9px;font-weight:900;letter-spacing:.06em;color:var(--gold)}
    .tfdoc-save{width:100%;padding:12px}.tfdoc-status{min-height:17px;font-size:9px;color:var(--muted);line-height:1.4}.tfdoc-status.error{color:var(--bad,#a84f48)}.tfdoc-status.ok{color:var(--good,#477e58)}
    @media(max-width:520px){.tfdoc-modes{grid-template-columns:repeat(3,1fr)}.tfdoc-mode{font-size:8px;padding:9px 4px}.tfdoc-head{align-items:flex-start;flex-direction:column}.tfdoc-id{text-align:left}}
  `;
  if(!document.getElementById(style.id))document.head.appendChild(style);

  side.dataset.hof409TfCapture='1';
  side.innerHTML='<section class="tfdoc-shell" aria-label="Captura estructurada por temporalidad"><div class="tfdoc-modes" role="tablist"><button class="tfdoc-mode active" type="button" data-tfdoc-mode="SEMANA">SEMANA</button><button class="tfdoc-mode" type="button" data-tfdoc-mode="APERTURA">APERTURA</button><button class="tfdoc-mode" type="button" data-tfdoc-mode="SETUP">SETUP</button></div><div id="tfDocRoot"></div></section>';
  const root=document.getElementById('tfDocRoot');

  function blockHtml(block){
    const images=block.imagenes.map(img=>`<div class="tfdoc-image"><img src="${esc(img.url)}" alt="${esc(block.timeframe)}"><span title="${esc(img.name)}">${esc(img.name)}</span><button class="tfdoc-remove" type="button" data-remove-image="${esc(img.id)}" data-remove-tf="${esc(block.timeframe)}" aria-label="Eliminar imagen">×</button></div>`).join('');
    return `<article class="tfdoc-block" data-tf-block="${esc(block.timeframe)}"><div class="tfdoc-tf">${esc(block.timeframe)}</div><textarea data-tf-text="${esc(block.timeframe)}" placeholder="Lectura ${esc(block.timeframe)}…">${esc(block.texto_raw)}</textarea><div class="tfdoc-upload"><label class="tfdoc-upload-label">IMÁGENES ${esc(block.timeframe)} · opcional · varias permitidas</label><input type="file" accept="image/*" multiple data-tf-upload="${esc(block.timeframe)}"></div><div class="tfdoc-images">${images}</div></article>`;
  }

  function render(){
    const draft=drafts[mode],model=MODELS[mode];
    side.querySelectorAll('[data-tfdoc-mode]').forEach(b=>b.classList.toggle('active',b.dataset.tfdocMode===mode));
    root.innerHTML=`<div class="tfdoc-head"><div><div class="eyebrow">CAPTURA ESTRUCTURADA</div><div class="tfdoc-title">${esc(model.label)} · ${esc(ASSET)}</div></div><div class="tfdoc-id">${esc(draft.analysis_id)}</div></div><div class="tfdoc-blocks">${draft.blocks.map(blockHtml).join('')}</div><div class="tfdoc-synthesis"><label>${esc(model.synthesis)}</label><textarea id="tfDocSynthesis" placeholder="${esc(model.synthesis)}…">${esc(draft.synthesis)}</textarea></div><button class="btn primary tfdoc-save" id="tfDocSave" type="button">GUARDAR ANÁLISIS</button><div class="tfdoc-status" id="tfDocStatus">RAW por TF · persistencia canónica pendiente de la siguiente fase.</div>`;

    root.querySelectorAll('[data-tf-text]').forEach(el=>el.addEventListener('input',()=>{const b=draft.blocks.find(x=>x.timeframe===el.dataset.tfText);if(b)b.texto_raw=el.value;}));
    document.getElementById('tfDocSynthesis').addEventListener('input',e=>draft.synthesis=e.target.value);
    root.querySelectorAll('[data-tf-upload]').forEach(input=>input.addEventListener('change',()=>addImages(input.dataset.tfUpload,[...(input.files||[])])));
    root.querySelectorAll('[data-remove-image]').forEach(btn=>btn.addEventListener('click',()=>removeImage(btn.dataset.removeTf,btn.dataset.removeImage)));
    document.getElementById('tfDocSave').addEventListener('click',preparePayload);
  }

  function setStatus(message,kind=''){
    const el=document.getElementById('tfDocStatus');if(!el)return;el.textContent=message;el.className='tfdoc-status'+(kind?' '+kind:'');
  }
  function addImages(tf,files){
    const block=drafts[mode].blocks.find(x=>x.timeframe===tf);if(!block)return;
    let rejected=0;
    for(const file of files){
      if(!file.type.startsWith('image/')||file.size>MAX_IMAGE_BYTES){rejected++;continue;}
      block.imagenes.push({id:uid(),file,name:file.name||'imagen',type:file.type||'image/jpeg',size:file.size,lastModified:file.lastModified||0,url:URL.createObjectURL(file)});
    }
    render();
    if(rejected)setStatus(`${rejected} imagen(es) omitidas: formato no válido o más de 20 MB.`,'error');
    else setStatus(`${block.imagenes.length} imagen(es) ligadas automáticamente a ${tf}.`);
  }
  function removeImage(tf,id){
    const block=drafts[mode].blocks.find(x=>x.timeframe===tf);if(!block)return;
    const i=block.imagenes.findIndex(x=>x.id===id);if(i<0)return;
    URL.revokeObjectURL(block.imagenes[i].url);block.imagenes.splice(i,1);render();setStatus(`Imagen eliminada de ${tf}.`);
  }
  function fileToPayload(img){
    return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('No se pudo leer '+img.name));r.onload=()=>resolve({name:img.name,type:img.type,size:img.size,data_base64:String(r.result).split(',')[1]||''});r.readAsDataURL(img.file);});
  }
  function fingerprint(draft){
    return JSON.stringify({mode:draft.mode,analysis_id:draft.analysis_id,blocks:draft.blocks.map(b=>({tf:b.timeframe,text:b.texto_raw,images:b.imagenes.map(i=>[i.name,i.size,i.lastModified])})),synthesis:draft.synthesis});
  }
  async function buildPayload(draft){
    const bloques=[];
    for(const b of draft.blocks){
      const imagenes=[];for(const img of b.imagenes)imagenes.push(await fileToPayload(img));
      bloques.push({timeframe:b.timeframe,texto_raw:b.texto_raw,imagenes,orden:b.orden});
    }
    return{
      tipo:draft.mode,
      activo:ASSET,
      analysis_id:draft.analysis_id,
      created_at:draft.created_at,
      semana_id:draft.semana_id,
      apertura_id:draft.apertura_id,
      estado:'NUEVO',
      origen:'A.R.I.',
      version:VERSION,
      bloques,
      sintesis_raw:draft.synthesis,
      sintesis_tipo:MODELS[draft.mode].synthesis
    };
  }
  async function preparePayload(){
    const draft=drafts[mode],save=document.getElementById('tfDocSave');
    const hasTf=draft.blocks.some(b=>b.texto_raw.trim()||b.imagenes.length);
    if(!hasTf){setStatus('Añade texto o imagen en al menos un bloque TF.','error');return;}
    const fp=fingerprint(draft);
    if(draft.lastFingerprint===fp){setStatus('Sin cambios · este RAW ya generó el mismo payload.','ok');return;}
    if(save.disabled)return;save.disabled=true;const old=save.textContent;save.textContent='PREPARANDO…';setStatus('Estructurando RAW por TF…');
    try{
      const payload=await buildPayload(draft);
      window.ARI_LAST_ANALYSIS_PAYLOAD=payload;
      window.dispatchEvent(new CustomEvent('ari-trading:analysis-payload',{detail:payload}));
      draft.lastFingerprint=fp;
      sessionStorage.setItem('ari-trading-last-analysis-meta',JSON.stringify({tipo:payload.tipo,analysis_id:payload.analysis_id,created_at:payload.created_at,timeframes:payload.bloques.map(b=>b.timeframe),version:payload.version}));
      setStatus('RAW estructurado listo · persistencia canónica pendiente.','ok');
    }catch(err){setStatus('No preparado · '+String(err.message||err).slice(0,160),'error');}
    finally{save.disabled=false;save.textContent=old;}
  }

  side.querySelector('.tfdoc-modes').addEventListener('click',e=>{const b=e.target.closest('[data-tfdoc-mode]');if(!b||!MODELS[b.dataset.tfdocMode])return;mode=b.dataset.tfdocMode;render();});
  addEventListener('beforeunload',()=>Object.values(drafts).flatMap(d=>d.blocks).flatMap(b=>b.imagenes).forEach(i=>URL.revokeObjectURL(i.url)));

  window.ARI_HOF409_CAPTURE_TF={
    version:VERSION,
    models:JSON.parse(JSON.stringify(MODELS)),
    getMode:()=>mode,
    getDraft:()=>drafts[mode],
    buildPayload:()=>buildPayload(drafts[mode]),
    qa:()=>({
      semana:MODELS.SEMANA.tfs.join('/')==='MN/W1/D1',
      apertura:MODELS.APERTURA.tfs.join('/')==='H4/H1/M15/M5',
      setup:MODELS.SETUP.tfs.join('/')==='H4/M15/M5/M1',
      blocks:root.querySelectorAll('[data-tf-block]').length===MODELS[mode].tfs.length,
      textareas:root.querySelectorAll('[data-tf-text]').length===MODELS[mode].tfs.length,
      uploaders:[...root.querySelectorAll('[data-tf-upload]')].every(x=>x.multiple&&x.accept==='image/*'),
      singleCta:root.querySelectorAll('#tfDocSave').length===1,
      legacyFreeform:!document.getElementById('docText')&&!document.getElementById('docImage')
    })
  };
  render();
})();