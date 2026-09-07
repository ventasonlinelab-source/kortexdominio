(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const DB_NAME='ari-daw-audio';
  const STORE='blobs';
  const ACCEPT=/\.(mp3|wav|m4a|aac|ogg|flac|webm|mp4)$/i;
  let dragDepth=0;

  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  const readProject=()=>{try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}};
  const writeProject=p=>localStorage.setItem(PROJECT_KEY,JSON.stringify(p));
  const isAudioFile=f=>!!f&&(String(f.type||'').startsWith('audio/')||ACCEPT.test(String(f.name||''))||String(f.type||'')==='video/mp4');
  const cleanName=n=>String(n||'Audio').replace(/\.[^.]+$/,'').trim()||'Audio';
  const snap=(n,step=.25)=>Math.max(0,Math.round(n/step)*step);

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800);return}
    const t=document.createElement('div');t.textContent=msg;Object.assign(t.style,{position:'fixed',right:'14px',bottom:'72px',zIndex:99999,background:'var(--text,#222)',color:'var(--panel,#fff)',padding:'9px 11px',borderRadius:'8px',fontSize:'10px'});document.body.appendChild(t);setTimeout(()=>t.remove(),1800);
  }

  function ensureOverlay(){
    let el=document.getElementById('ari-audio-drop-overlay');
    if(el)return el;
    const style=document.createElement('style');style.textContent=`
      #ari-audio-drop-overlay{position:absolute;inset:8px;z-index:40;border:2px dashed var(--accent);border-radius:10px;background:color-mix(in srgb,var(--accent-soft) 78%,transparent);display:none;place-items:center;pointer-events:none;color:var(--accent);font-size:13px;font-weight:950;letter-spacing:.04em;text-align:center}
      #ari-audio-drop-overlay.show{display:grid}
      #ari-audio-drop-overlay small{display:block;margin-top:5px;font-size:9px;color:var(--muted);font-weight:750;letter-spacing:0}
      .arrangement.ari-drag-audio{outline:2px solid color-mix(in srgb,var(--accent) 60%,transparent);outline-offset:-2px}
    `;document.head.appendChild(style);
    el=document.createElement('div');el.id='ari-audio-drop-overlay';el.innerHTML='<div>SUELTA AUDIO PARA IMPORTAR<small>MP3 · WAV · M4A · AAC · OGG · FLAC · WEBM</small></div>';
    const arrangement=document.querySelector('.arrangement');if(arrangement)arrangement.appendChild(el);
    return el;
  }

  function showOverlay(on){
    const a=document.querySelector('.arrangement'),o=ensureOverlay();
    if(a)a.classList.toggle('ari-drag-audio',!!on);if(o)o.classList.toggle('show',!!on);
  }

  async function openDb(){return await new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function putBlob(id,blob){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}

  async function durationOf(file){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(Ctx){
      const ctx=new Ctx();
      try{const b=await ctx.decodeAudioData(await file.arrayBuffer());if(Number.isFinite(b.duration)&&b.duration>0)return b.duration}catch{}finally{try{await ctx.close()}catch{}}
    }
    return await new Promise((resolve,reject)=>{
      const u=URL.createObjectURL(file),a=document.createElement('audio');a.preload='metadata';a.src=u;
      a.onloadedmetadata=()=>{const d=a.duration;URL.revokeObjectURL(u);Number.isFinite(d)&&d>0?resolve(d):reject(new Error('duration'))};
      a.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('decode'))};
    });
  }

  function dropBeat(e){
    const lane=e.target?.closest?.('.lane');if(!lane)return 0;
    const rect=lane.getBoundingClientRect();
    const barw=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barw'))||104;
    return snap((Math.max(0,e.clientX-rect.left)/barw)*4,.25);
  }

  function targetAudioTrack(project,e){
    const row=e.target?.closest?.('.track-row');if(!row)return null;
    const container=document.getElementById('tracks');if(!container)return null;
    const rows=[...container.querySelectorAll('.track-row')];const idx=rows.indexOf(row);
    const t=idx>=0?project.tracks?.[idx]:null;
    return t?.type==='audio'?t:null;
  }

  async function importFiles(files,e){
    const audio=files.filter(isAudioFile);if(!audio.length){toast('Suelta un archivo de audio');return}
    const project=readProject();if(!project||!Array.isArray(project.tracks)){toast('Proyecto no disponible');return}
    const bpm=Number(project.bpm)||86;const start=dropBeat(e);const preferred=targetAudioTrack(project,e);
    let imported=0,maxEnd=(Number(project.bars)||32)*4;
    toast(audio.length>1?'Importando audios…':'Importando audio…');
    for(let i=0;i<audio.length;i++){
      const file=audio[i];
      try{
        const duration=await durationOf(file),blobId='ari-import-'+uid();await putBlob(blobId,file);
        const beats=Math.max(.25,duration*bpm/60),name=cleanName(file.name);
        let track=(i===0?preferred:null);
        if(!track){track={id:'ari-audio-'+uid(),type:'audio',name,muted:false,solo:false,armed:false,volume:.86,pan:0,instrument:null,devices:[],clips:[]};project.tracks.push(track)}
        track.clips=Array.isArray(track.clips)?track.clips:[];
        track.clips.push({id:'ari-clip-'+uid(),type:'audio',name,start:start+i*.25,length:beats,sourceOffset:0,blobId,fileName:file.name,mimeType:file.type||'audio/*'});
        maxEnd=Math.max(maxEnd,start+i*.25+beats);imported++;
      }catch(err){console.error('[A.R.I. drag import]',file?.name,err);toast('No pude leer '+(file?.name||'ese audio'))}
    }
    if(!imported)return;
    project.bars=Math.max(32,Math.ceil(maxEnd/4));project.updatedAt=new Date().toISOString();writeProject(project);
    toast(imported===1?'Audio importado ✓':`${imported} audios importados ✓`);
    setTimeout(()=>location.reload(),250);
  }

  function hasFiles(e){return [...(e.dataTransfer?.types||[])].includes('Files')}
  function mount(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    const arrangement=document.querySelector('.arrangement');if(!arrangement){setTimeout(mount,250);return}
    if(arrangement.dataset.ariDropImport==='1')return;arrangement.dataset.ariDropImport='1';ensureOverlay();
    arrangement.addEventListener('dragenter',e=>{if(!hasFiles(e))return;e.preventDefault();dragDepth++;showOverlay(true)});
    arrangement.addEventListener('dragover',e=>{if(!hasFiles(e))return;e.preventDefault();e.dataTransfer.dropEffect='copy';showOverlay(true)});
    arrangement.addEventListener('dragleave',e=>{if(!hasFiles(e))return;dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)showOverlay(false)});
    arrangement.addEventListener('drop',async e=>{if(!hasFiles(e))return;e.preventDefault();e.stopPropagation();dragDepth=0;showOverlay(false);const files=[...(e.dataTransfer?.files||[])];await importFiles(files,e)});
  }

  window.ARI_IMPORT_AUDIO_FILES=(files)=>importFiles([...(files||[])],{target:document.querySelector('.arrangement'),clientX:0});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  addEventListener('pageshow',mount);
})();