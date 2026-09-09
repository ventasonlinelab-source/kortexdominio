(()=>{
  if(!location.pathname.startsWith('/ari/music/'))return;
  const INPUT_KEY='ari-music-input-device-v1';
  const OUTPUT_KEY='ari-music-output-device-v1';
  const PROJECT_KEY='ari-daw-project-v0';
  const $=s=>document.querySelector(s);
  let devices=[];
  let testStream=null, meterCtx=null, meterSource=null, meterRaf=0, analyser=null;
  let actualInputId='', signalPeak=0;

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function selectedInputId(){return localStorage.getItem(INPUT_KEY)||''}
  function selectedOutputId(){return localStorage.getItem(OUTPUT_KEY)||''}
  function labelFor(kind,id){
    if(!id)return kind==='audioinput'?'Sistema · entrada predeterminada':'Sistema · salida predeterminada';
    const d=devices.find(x=>x.kind===kind&&x.deviceId===id);
    return d?.label||`${kind==='audioinput'?'Entrada':'Salida'} seleccionada`;
  }
  function inputLabel(){return labelFor('audioinput',actualInputId||selectedInputId())}
  function outputLabel(){return labelFor('audiooutput',selectedOutputId())}
  function short(s,n=34){s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s}
  function setStatus(msg,kind='ok'){
    const el=$('#ari-io-status');if(!el)return;el.textContent=msg;el.dataset.kind=kind;
  }
  function setMeter(v){const bar=$('#ari-io-meter > i'),txt=$('#ari-io-level');if(bar)bar.style.width=Math.max(0,Math.min(100,v*100))+'%';if(txt)txt.textContent=v>.035?'SEÑAL':'SIN SEÑAL'}

  function inputConstraints(base={}){
    const id=selectedInputId();
    const out={channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false,...base};
    if(id)out.deviceId={exact:id};
    return out;
  }
  async function applyOutput(ctx){
    if(!ctx)return false;
    const id=selectedOutputId();
    if(typeof ctx.setSinkId!=='function'){
      if(id)setStatus('Salida elegida visible · este navegador no permite cambiar el sink','warn');
      return false;
    }
    try{
      await ctx.setSinkId(id||'');
      setStatus(actualInputId?'ENTRADA ACTIVA · '+short(inputLabel(),28):'SALIDA ACTIVA · '+short(outputLabel(),28));
      return true;
    }catch(e){
      console.error('[A.R.I. output routing]',e);
      setStatus('No pude aplicar esa salida','bad');
      return false;
    }
  }
  function stopMeter(){
    cancelAnimationFrame(meterRaf);meterRaf=0;
    try{meterSource?.disconnect()}catch{} meterSource=null;analyser=null;
    try{meterCtx?.close()}catch{} meterCtx=null;setMeter(0);
  }
  function startMeter(stream){
    stopMeter();
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
    meterCtx=new Ctx({latencyHint:'interactive'});analyser=meterCtx.createAnalyser();analyser.fftSize=1024;
    meterSource=meterCtx.createMediaStreamSource(stream);meterSource.connect(analyser);
    const data=new Float32Array(analyser.fftSize);
    const tick=()=>{
      if(!analyser)return;analyser.getFloatTimeDomainData(data);let sum=0;for(const x of data)sum+=x*x;const rms=Math.sqrt(sum/data.length);signalPeak=Math.max(signalPeak,rms);setMeter(Math.min(1,rms*7));meterRaf=requestAnimationFrame(tick)
    };tick();
  }
  function confirmInputStream(stream){
    const tr=stream?.getAudioTracks?.()[0];
    const settings=tr?.getSettings?.()||{};actualInputId=settings.deviceId||selectedInputId()||'';signalPeak=0;
    startMeter(stream);setStatus('ENTRADA ACTIVA · '+short(inputLabel(),28));updateTrackRoutes();
  }
  function releaseInputStream(){const hadSignal=signalPeak>=.001;actualInputId='';stopMeter();setStatus(hadSignal?'TOMA CON SEÑAL ✓':'ALERTA · TOMA SIN SEÑAL',hadSignal?'ok':'bad');updateTrackRoutes();return hadSignal}
  async function stopTest(){
    if(testStream){testStream.getTracks().forEach(t=>t.stop());testStream=null}
    stopMeter();const b=$('#ari-io-test');if(b)b.textContent='PROBAR MIC';setStatus('I/O LISTO');updateTrackRoutes();
  }
  async function toggleTest(){
    if(testStream){await stopTest();return}
    if(!navigator.mediaDevices?.getUserMedia){setStatus('Micrófono no disponible','bad');return}
    try{
      testStream=await navigator.mediaDevices.getUserMedia({audio:inputConstraints()});
      confirmInputStream(testStream);const b=$('#ari-io-test');if(b)b.textContent='PARAR TEST';
    }catch(e){console.error('[A.R.I. mic test]',e);setStatus('No pude abrir esa entrada','bad')}
  }

  function fillSelect(sel,kind,stored){
    if(!sel)return;
    const list=devices.filter(d=>d.kind===kind);
    const fallback=kind==='audioinput'?'Sistema · entrada predeterminada':'Sistema · salida predeterminada';
    sel.innerHTML=`<option value="">${fallback}</option>`+list.filter(d=>d.deviceId!=='default').map((d,i)=>`<option value="${esc(d.deviceId)}">${esc(d.label||((kind==='audioinput'?'Entrada ':'Salida ')+(i+1)))}</option>`).join('');
    if(stored&&list.some(d=>d.deviceId===stored))sel.value=stored;else sel.value='';
  }
  async function refreshDevices(unlock=false){
    if(!navigator.mediaDevices?.enumerateDevices){setStatus('El navegador no expone dispositivos','bad');return}
    let temp=null;
    try{
      if(unlock){temp=await navigator.mediaDevices.getUserMedia({audio:true});}
      devices=await navigator.mediaDevices.enumerateDevices();
      fillSelect($('#ari-io-input'),'audioinput',selectedInputId());
      fillSelect($('#ari-io-output'),'audiooutput',selectedOutputId());
      const ins=devices.filter(d=>d.kind==='audioinput').length,outs=devices.filter(d=>d.kind==='audiooutput').length;
      setStatus(`${ins} ENTRADAS · ${outs} SALIDAS`);updateTrackRoutes();
    }catch(e){console.error('[A.R.I. enumerate devices]',e);setStatus('Da permiso al micrófono para ver nombres','warn')}
    finally{temp?.getTracks?.().forEach(t=>t.stop())}
  }
  function updateTrackRoutes(){
    let p=null;try{p=JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{}
    if(!p?.tracks)return;
    document.querySelectorAll('.track-row').forEach(row=>{
      const t=p.tracks.find(x=>x.id===row.dataset.track);const type=row.querySelector('.track-type');if(!t||!type)return;
      if(t.type==='audio'){
        const inTxt=t.armed?short(inputLabel()):'—';
        type.textContent=`AUDIO · IN ${inTxt} · OUT ${short(outputLabel())}`;
        type.title=`Entrada: ${t.armed?inputLabel():'No armada'}\nSalida: ${outputLabel()}`;
      }else{
        const instr=t.instrument||'INSTRUMENTO';type.textContent=`${instr} · OUT ${short(outputLabel())}`;type.title=`Salida: ${outputLabel()}`;
      }
    });
  }
  function mount(){
    if($('#ari-io-strip'))return;
    const transport=$('.transport'),shell=$('.shell');if(!transport||!shell){setTimeout(mount,150);return}
    const style=document.createElement('style');style.id='ari-audio-routing-style';style.textContent=`
      .shell.ari-has-io{grid-template-rows:50px 44px 50px minmax(0,1fr) 170px 58px!important}
      .ari-io-strip{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--line);background:var(--chrome);overflow-x:auto;overflow-y:hidden;white-space:nowrap}
      .ari-io-field{display:flex;align-items:center;gap:5px;font-size:8px;font-weight:900;color:var(--muted);letter-spacing:.04em}.ari-io-field select{height:32px;min-width:190px;max-width:300px;border:1px solid var(--line);background:var(--panel);border-radius:6px;padding:0 7px;font-size:9px;font-weight:800;color:var(--text)}
      .ari-io-btn{height:32px;border:1px solid var(--line);background:var(--panel);border-radius:6px;padding:0 9px;font-size:8px;font-weight:900;color:var(--text)}
      .ari-io-btn.primary{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
      .ari-io-state{display:flex;align-items:center;gap:7px;margin-left:auto;font-size:8px;font-weight:900;color:var(--muted)}#ari-io-status[data-kind="bad"]{color:var(--record)}#ari-io-status[data-kind="warn"]{color:var(--accent)}
      #ari-io-meter{width:74px;height:7px;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:var(--panel2)}#ari-io-meter>i{display:block;height:100%;width:0;background:var(--accent);transition:width .06s linear}#ari-io-level{min-width:48px}
      .track-head .track-type{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:7px!important;line-height:1.15!important}
      @media(max-width:820px){.shell.ari-has-io{grid-template-rows:48px 42px 50px minmax(0,1fr) 150px 56px!important}.ari-io-strip{padding:5px 8px}.ari-io-field select{min-width:170px}.ari-io-state{margin-left:0}}
      @media(max-width:560px){.shell.ari-has-io{grid-template-rows:46px 42px 54px minmax(0,1fr) 130px 54px!important}.ari-io-field select{min-width:155px;max-width:190px}.ari-io-state{display:none}}
    `;document.head.appendChild(style);
    const strip=document.createElement('section');strip.id='ari-io-strip';strip.className='ari-io-strip';strip.innerHTML=`
      <label class="ari-io-field">ENTRADA <select id="ari-io-input" aria-label="Entrada de audio"></select></label>
      <label class="ari-io-field">SALIDA <select id="ari-io-output" aria-label="Salida de audio"></select></label>
      <button class="ari-io-btn primary" id="ari-io-detect" type="button">DETECTAR</button>
      <button class="ari-io-btn" id="ari-io-test" type="button">PROBAR MIC</button>
      <div class="ari-io-state"><span id="ari-io-status">CARGANDO I/O…</span><span id="ari-io-meter"><i></i></span><span id="ari-io-level">SIN SEÑAL</span></div>`;
    transport.insertAdjacentElement('afterend',strip);shell.classList.add('ari-has-io');
    $('#ari-io-input').onchange=e=>{localStorage.setItem(INPUT_KEY,e.target.value);actualInputId='';setStatus('ENTRADA · '+short(inputLabel(),30));updateTrackRoutes()};
    $('#ari-io-output').onchange=e=>{localStorage.setItem(OUTPUT_KEY,e.target.value);setStatus('SALIDA · '+short(outputLabel(),30));updateTrackRoutes();window.dispatchEvent(new CustomEvent('ari:audio-output-changed'))};
    $('#ari-io-detect').onclick=()=>refreshDevices(true);$('#ari-io-test').onclick=toggleTest;
    refreshDevices(false);
    const trackRoot=$('#tracks');if(trackRoot)new MutationObserver(()=>requestAnimationFrame(updateTrackRoutes)).observe(trackRoot,{childList:true,subtree:true});
    navigator.mediaDevices?.addEventListener?.('devicechange',()=>refreshDevices(false));
  }

  window.ARI_AUDIO_ROUTING={inputConstraints,applyOutput,confirmInputStream,releaseInputStream,stopTest,refreshDevices,inputLabel,outputLabel,updateTrackRoutes};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
