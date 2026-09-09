(()=>{
  if(window.__ARI_TF_NOTION_PERSIST_V1__)return;
  window.__ARI_TF_NOTION_PERSIST_V1__=true;
  const ENDPOINT='/ari/trading/live-document';
  const setStatus=(message,kind='')=>{
    const el=document.getElementById('tfDocStatus');
    if(!el)return;
    el.textContent=message;
    el.className='tfdoc-status'+(kind?' '+kind:'');
  };
  addEventListener('ari-trading:analysis-payload',async event=>{
    const payload=event.detail;
    if(!payload?.analysis_id||!Array.isArray(payload.bloques))return;
    setStatus('Persistiendo RAW por TF en Notion…');
    try{
      const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      let out={};
      try{out=await response.json()}catch(_){out={}}
      if(!response.ok||!out.ok||!out.persisted)throw new Error(out.error||`HTTP ${response.status}`);
      sessionStorage.setItem('ari-trading-last-analysis-meta',JSON.stringify({tipo:payload.tipo,analysis_id:payload.analysis_id,created_at:payload.created_at,timeframes:payload.bloques.map(b=>b.timeframe),version:payload.version,page_id:out.page_id,destination:out.destination,persisted:true}));
      const hhmm=new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
      setStatus(`Guardado · ${hhmm}${out.duplicate?' · ya persistido':''}`,'ok');
    }catch(err){
      const draft=window.ARI_HOF409_CAPTURE_TF?.getDraft?.();
      if(draft)draft.lastFingerprint=null;
      setStatus('No guardado · '+String(err?.message||err).slice(0,160),'error');
    }
  });
})();
