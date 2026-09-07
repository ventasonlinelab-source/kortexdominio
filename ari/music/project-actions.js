(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const ROW_ID='ari-project-actions';
  const LAME_URL='https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
  const REF_BLOB_ID='ari-reference-base-asset-v1';
  let clearArmedUntil=0;
  let exporting=false;

  const readProject=()=>{try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}};
  const writeProject=p=>localStorage.setItem(PROJECT_KEY,JSON.stringify(p));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));

  function toast(msg){
    let el=document.getElementById('toast');
    if(el){el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);return}
    el=document.createElement('div');el.textContent=msg;Object.assign(el.style,{position:'fixed',right:'14px',bottom:'72px',zIndex:9999,background:'var(--text,#222)',color:'var(--panel,#fff)',padding:'9px 11px',borderRadius:'8px',fontSize:'10px'});document.body.appendChild(el);setTimeout(()=>el.remove(),1800);
  }

  async function openDb(){
    return await new Promise((resolve,reject)=>{
      const req=indexedDB.open('ari-daw-audio',1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('blobs'))req.result.createObjectStore('blobs')};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function getBlob(id){
    const db=await openDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('blobs');const req=tx.objectStore('blobs').get(id);
      req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)};
    });
  }
  async function putBlob(id,blob){
    const db=await openDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('blobs','readwrite');tx.objectStore('blobs').put(blob,id);
      tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }

  function voiceDevices(){return[
    {id:uid(),type:'EQ',enabled:true,low:-3,high:1.5},
    {id:uid(),type:'COMP',enabled:true,threshold:-20,ratio:2.2},
    {id:uid(),type:'GAIN',enabled:true,value:1.24},
    {id:uid(),type:'REVERB',enabled:true,mix:.07},
    {id:uid(),type:'DELAY',enabled:true,time:.14,mix:.035}
  ]}
  function ensureVoice(project){
    let voice=(project.tracks||[]).find(t=>t.id==='ari-ref-voice-v1'||/^VOZ · GANADOR/i.test(t.name||''));
    if(!voice){
      voice={id:'ari-ref-voice-v1',type:'audio',name:'VOZ · GANADOR',muted:false,solo:false,armed:true,volume:1,pan:0,instrument:null,devices:voiceDevices(),clips:[]};
      project.tracks.push(voice);
    }
    for(const t of project.tracks||[])if(t.type==='audio')t.armed=t.id===voice.id;
    voice.name='VOZ · GANADOR';voice.muted=false;voice.volume=1;
    if(!Array.isArray(voice.devices)||!voice.devices.length)voice.devices=voiceDevices();
    return voice;
  }
  function ensureReferenceTrack(project){
    let base=(project.tracks||[]).find(t=>t.id==='ari-ref-base-v1');
    if(!base){base={id:'ari-ref-base-v1',type:'audio',name:'BASE · REFERENCIA · CARGAR',muted:false,solo:false,armed:false,volume:.82,pan:0,instrument:null,devices:[],clips:[]};project.tracks.unshift(base)}
    base.type='audio';base.armed=false;base.muted=false;base.volume=.82;base.pan=0;base.devices=[];
    return base;
  }
  function syncArrangementWidth(){
    const p=readProject();if(!p)return;
    const barw=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barw'))||104;
    const bars=Math.max(32,Number(p.bars)||32);
    document.documentElement.style.setProperty('--ari-bars-width',(bars*barw)+'px');
  }

  async function clearProject(btn){
    if(Date.now()>clearArmedUntil){
      clearArmedUntil=Date.now()+4500;btn.textContent='¿SEGURO?';btn.classList.add('confirming');
      setTimeout(()=>{if(Date.now()>clearArmedUntil){btn.textContent='LIMPIAR TODO';btn.classList.remove('confirming')}},4700);
      return;
    }
    btn.disabled=true;btn.textContent='LIMPIANDO…';
    const p=readProject()||{};
    writeProject({version:p.version||1,name:'Sin título',bpm:Number(p.bpm)||86,bars:32,meter:Array.isArray(p.meter)?p.meter:[4,4],metronome:false,loop:{on:false,start:0,end:16},tracks:[],updatedAt:new Date().toISOString()});
    // Deliberately preserve IndexedDB blobs so Ctrl/Cmd+Z can restore audio after LIMPIAR.
    localStorage.setItem('ari-daw-demo-base-voice-v1','1');
    localStorage.setItem('ari-song-ganador-sin-victoria-v3','1');
    localStorage.setItem('ari-song-ganador-rollo-v1','1');
    localStorage.setItem('ari-ganador-reference-session-v1','1');
    location.reload();
  }

  async function audioDuration(blob){
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('audio_context_missing');
    const ctx=new Ctx();
    try{return (await ctx.decodeAudioData(await blob.arrayBuffer())).duration}finally{try{await ctx.close()}catch{}}
  }
  async function importReference(file,btn){
    if(!file)return;
    btn.disabled=true;btn.textContent='CARGANDO…';
    try{
      const duration=await audioDuration(file);
      await putBlob(REF_BLOB_ID,file);
      const p=readProject()||{version:1,name:'GANADOR SIN VICTORIA · PRÁCTICA',bpm:86,bars:48,meter:[4,4],metronome:false,loop:{on:false,start:0,end:16},tracks:[]};
      p.name='GANADOR SIN VICTORIA · PRÁCTICA';p.bpm=86;p.meter=[4,4];p.metronome=false;p.loop={on:false,start:0,end:16};p.tracks=Array.isArray(p.tracks)?p.tracks:[];
      const base=ensureReferenceTrack(p);ensureVoice(p);
      const beats=duration*p.bpm/60;
      base.name='BASE · REFERENCIA ✓';
      base.clips=[{id:'ari-ref-base-clip-v1',type:'audio',name:'BASE · REFERENCIA',start:0,length:beats,sourceOffset:0,blobId:REF_BLOB_ID}];
      p.bars=Math.max(32,Math.ceil(beats/4));
      p.updatedAt=new Date().toISOString();
      localStorage.setItem('ari-reference-audio-imported-v1','1');
      writeProject(p);
      toast(file.size===2143705?'Referencia exacta cargada ✓':'Base de referencia cargada ✓');
      setTimeout(()=>location.reload(),350);
    }catch(e){console.error('[A.R.I. reference import]',e);toast('No pude leer ese audio');btn.disabled=false;btn.textContent='CARGAR BASE REF.'}
  }

  function loadLame(){
    if(window.lamejs)return Promise.resolve(window.lamejs);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-ari-lame]');
      if(existing){existing.addEventListener('load',()=>resolve(window.lamejs),{once:true});existing.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');s.src=LAME_URL;s.async=true;s.dataset.ariLame='1';s.onload=()=>window.lamejs?resolve(window.lamejs):reject(new Error('lame_missing'));s.onerror=reject;document.head.appendChild(s);
    });
  }

  function impulse(ctx,seconds=1.5){
    const len=Math.floor(ctx.sampleRate*seconds),b=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8)}
    return b;
  }
  function buildTrackBus(ctx,track,soloActive){
    const input=ctx.createGain(),vol=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();let cur=input;
    const connect=n=>{cur.connect(n);cur=n};
    for(const d of(track.devices||[])){
      if(d.enabled===false)continue;
      if(d.type==='GAIN'){const n=ctx.createGain();n.gain.value=d.value??1;connect(n)}
      else if(d.type==='EQ'){const lo=ctx.createBiquadFilter(),hi=ctx.createBiquadFilter();lo.type='lowshelf';lo.frequency.value=220;lo.gain.value=d.low??0;hi.type='highshelf';hi.frequency.value=4200;hi.gain.value=d.high??0;connect(lo);connect(hi)}
      else if(d.type==='COMP'){const n=ctx.createDynamicsCompressor();n.threshold.value=d.threshold??-18;n.ratio.value=d.ratio??3;connect(n)}
      else if(d.type==='FILTER'){const n=ctx.createBiquadFilter();n.type='lowpass';n.frequency.value=d.freq??16000;connect(n)}
      else if(d.type==='REVERB'){
        const i=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),conv=ctx.createConvolver(),out=ctx.createGain();cur.connect(i);i.connect(dry);dry.gain.value=.78;dry.connect(out);conv.buffer=impulse(ctx);i.connect(conv);conv.connect(wet);wet.gain.value=d.mix??.22;wet.connect(out);cur=out;
      }else if(d.type==='DELAY'){
        const i=ctx.createGain(),dry=ctx.createGain(),delay=ctx.createDelay(2),fb=ctx.createGain(),wet=ctx.createGain(),out=ctx.createGain();cur.connect(i);i.connect(dry);dry.gain.value=.8;dry.connect(out);delay.delayTime.value=d.time??.25;fb.gain.value=.28;i.connect(delay);delay.connect(fb);fb.connect(delay);delay.connect(wet);wet.gain.value=d.mix??.2;wet.connect(out);cur=out;
      }
    }
    connect(vol);vol.gain.value=(track.muted||(soloActive&&!track.solo))?0:(track.volume??.8);cur.connect(pan);if(pan.pan)pan.pan.value=track.pan??0;pan.connect(ctx.destination);return input;
  }
  function scheduleMidi(ctx,track,bus,n,when,dur){
    const instr=track.instrument||'PIANO',vel=clamp(n.velocity??.78,0,1);
    if(instr==='DRUMS'){
      const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(n.pitch<45?120:220,when);osc.frequency.exponentialRampToValueAtTime(n.pitch<45?45:90,when+.12);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(.7*vel,when+.005);g.gain.exponentialRampToValueAtTime(.0001,when+.18);osc.connect(g);g.connect(bus);osc.start(when);osc.stop(when+.2);return;
    }
    const osc=ctx.createOscillator(),g=ctx.createGain(),f=440*Math.pow(2,(n.pitch-69)/12);osc.frequency.value=f;osc.type=instr==='BASS'?'sawtooth':instr==='PAD'?'sine':'triangle';const attack=instr==='PAD'?.18:.008,release=instr==='PAD'?.35:.16;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.001,vel*(instr==='BASS'?.38:.25)),when+attack);g.gain.exponentialRampToValueAtTime(.0001,when+Math.max(attack+.03,dur+release));osc.connect(g);g.connect(bus);osc.start(when);osc.stop(when+dur+release+.03);
  }
  async function decodeBlob(blob){
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;const ctx=new Ctx();
    try{return await ctx.decodeAudioData(await blob.arrayBuffer())}catch{return null}finally{try{await ctx.close()}catch{}}
  }
  async function renderMaster(project,setProgress){
    const bpm=Number(project.bpm)||86,spb=60/bpm;
    let maxBeat=Math.max(4,(Number(project.bars)||32)*4);
    for(const t of(project.tracks||[]))for(const c of(t.clips||[]))maxBeat=Math.max(maxBeat,(Number(c.start)||0)+(Number(c.length)||0));
    const seconds=maxBeat*spb+2.25,sr=44100,frames=Math.ceil(seconds*sr);
    const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!Offline)throw new Error('offline_audio_not_supported');
    const ctx=new Offline(2,frames,sr),soloActive=(project.tracks||[]).some(t=>t.solo);
    const decoded=new Map();let audioCount=0;
    for(const t of(project.tracks||[]))for(const c of(t.clips||[]))if(c.type==='audio'&&c.blobId)audioCount++;
    let done=0;
    for(const t of(project.tracks||[])){
      const bus=buildTrackBus(ctx,t,soloActive);
      for(const c of(t.clips||[])){
        const cStart=(Number(c.start)||0)*spb,cLen=Math.max(.01,(Number(c.length)||.25)*spb);
        if(c.type==='audio'&&c.blobId){
          let buf=decoded.get(c.blobId);
          if(!buf){const blob=await getBlob(c.blobId);buf=blob?await decodeBlob(blob):null;if(buf)decoded.set(c.blobId,buf);done++;setProgress(audioCount?Math.round(done/audioCount*35):35)}
          if(!buf)continue;const src=ctx.createBufferSource();src.buffer=buf;src.connect(bus);const off=Math.max(0,Number(c.sourceOffset)||0),dur=Math.min(cLen,Math.max(.01,buf.duration-off));try{src.start(cStart,off,dur)}catch{}
        }else if(c.type==='midi'){
          for(const n of(c.notes||[])){const at=cStart+(Number(n.at)||0)*spb,dur=Math.max(.04,(Number(n.length)||.25)*spb);scheduleMidi(ctx,t,bus,n,at,dur)}
        }
      }
    }
    setProgress(40);const rendered=await ctx.startRendering();setProgress(62);return rendered;
  }
  function floatTo16(float){const out=new Int16Array(float.length);for(let i=0;i<float.length;i++){const s=Math.max(-1,Math.min(1,float[i]));out[i]=s<0?s*32768:s*32767}return out}
  async function encodeMp3(buffer,setProgress){
    const lame=await loadLame(),sr=buffer.sampleRate,channels=Math.min(2,buffer.numberOfChannels),left=buffer.getChannelData(0),right=channels>1?buffer.getChannelData(1):left,enc=new lame.Mp3Encoder(2,sr,192),chunks=[],block=1152,total=left.length;
    for(let i=0;i<total;i+=block){const l=floatTo16(left.subarray(i,Math.min(i+block,total))),r=floatTo16(right.subarray(i,Math.min(i+block,total))),mp3=enc.encodeBuffer(l,r);if(mp3.length)chunks.push(new Int8Array(mp3));if(i%(block*40)===0){setProgress(62+Math.round(i/total*34));await new Promise(requestAnimationFrame)}}
    const end=enc.flush();if(end.length)chunks.push(new Int8Array(end));setProgress(100);return new Blob(chunks,{type:'audio/mpeg'});
  }
  function filename(name){return (String(name||'ari-music').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 _-]+/g,'').trim().replace(/\s+/g,'_')||'ari-music')+'.mp3'}
  function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
  async function exportMp3(btn){
    if(exporting)return;const project=readProject();if(!project||!(project.tracks||[]).length){toast('No hay pistas que exportar');return}
    exporting=true;btn.disabled=true;const original='EXP. MP3';const progress=n=>btn.textContent='MP3 '+Math.max(0,Math.min(100,n))+'%';
    try{progress(1);const master=await renderMaster(project,progress),mp3=await encodeMp3(master,progress);download(mp3,filename(project.name));toast('MP3 exportado ✓')}
    catch(e){console.error('[A.R.I. MP3 export]',e);toast('No se pudo exportar MP3')}
    finally{exporting=false;btn.disabled=false;setTimeout(()=>btn.textContent=original,500)}
  }

  function mount(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    syncArrangementWidth();
    if(document.getElementById(ROW_ID))return;
    const tracks=document.getElementById('tracks');if(!tracks){setTimeout(mount,250);return}
    const style=document.createElement('style');style.textContent=`
      .arr-inner{min-width:calc(var(--headerw) + var(--ari-bars-width,3328px))!important}
      .ruler-row,.track-row{grid-template-columns:var(--headerw) var(--ari-bars-width,3328px)!important}
      #${ROW_ID}{height:48px;display:grid;grid-template-columns:var(--headerw) minmax(0,1fr);border-bottom:1px solid var(--line);background:var(--chrome2)}
      #${ROW_ID} .label{display:flex;align-items:center;padding:0 8px;border-right:1px solid var(--line);font-size:8px;font-weight:900;color:var(--muted);letter-spacing:.08em}
      #${ROW_ID} .actions{display:flex;align-items:center;gap:7px;padding:7px 10px;position:sticky;left:var(--headerw);overflow-x:auto}
      #${ROW_ID} button{height:32px;border:1px solid var(--line);background:var(--panel);border-radius:6px;padding:0 11px;font-size:9px;font-weight:900;white-space:nowrap}
      #${ROW_ID} .clear{color:var(--record);border-color:color-mix(in srgb,var(--record) 55%,var(--line))}
      #${ROW_ID} .clear.confirming{background:var(--record);color:#fff;border-color:var(--record)}
      #${ROW_ID} .export,#${ROW_ID} .reference{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
      #${ROW_ID} .history{color:var(--muted)}
      #${ROW_ID} button:disabled{opacity:.65;cursor:wait}
    `;document.head.appendChild(style);
    const row=document.createElement('div');row.id=ROW_ID;row.innerHTML='<div class="label">PROYECTO</div><div class="actions"><button class="reference" type="button">CARGAR BASE REF.</button><button class="history undo" type="button" title="Ctrl/Cmd+Z">↶ DESHACER</button><button class="history redo" type="button" title="Ctrl/Cmd+Shift+Z">↷ REHACER</button><button class="clear" type="button">LIMPIAR TODO</button><button class="export" type="button">EXP. MP3</button><input class="ref-file" type="file" accept="audio/*,video/mp4,.mp4,.m4a,.webm,.mp3,.wav" hidden></div>';
    tracks.insertAdjacentElement('afterend',row);
    const input=row.querySelector('.ref-file'),refBtn=row.querySelector('.reference');
    refBtn.onclick=()=>{input.value='';input.click()};
    input.onchange=()=>importReference(input.files?.[0],refBtn);
    row.querySelector('.undo').onclick=()=>window.ARI_UNDO?.();
    row.querySelector('.redo').onclick=()=>window.ARI_REDO?.();
    row.querySelector('.clear').onclick=e=>clearProject(e.currentTarget);
    row.querySelector('.export').onclick=e=>exportMp3(e.currentTarget);
    if(readProject()?.tracks?.some(t=>t.id==='ari-ref-base-v1'&&(t.clips||[]).length)){refBtn.textContent='BASE REF. ✓'}
  }

  window.ARI_EXPORT_MP3=()=>exportMp3(document.querySelector(`#${ROW_ID} .export`));
  window.ARI_CLEAR_PROJECT=()=>clearProject(document.querySelector(`#${ROW_ID} .clear`));
  window.ARI_IMPORT_REFERENCE=file=>importReference(file,document.querySelector(`#${ROW_ID} .reference`));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  addEventListener('pageshow',mount);addEventListener('resize',syncArrangementWidth);
})();