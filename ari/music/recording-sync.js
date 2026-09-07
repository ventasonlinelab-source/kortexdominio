(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const SYNC_MAP_KEY='ari-daw-server-audio-map-v1';
  const API='/ari/music/api/recording';
  let busy=false;

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
  function writeJSON(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function isVoiceTake(track,clip){
    const tn=String(track?.name||'').toUpperCase();
    const cn=String(clip?.name||'').toUpperCase();
    return track?.type==='audio' && !!clip?.blobId && (/VOZ|VOCAL|MIC/.test(tn)||/^TAKE\s*\d*/.test(cn));
  }
  async function openDb(){
    return await new Promise((resolve,reject)=>{
      const req=indexedDB.open('ari-daw-audio',1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('blobs'))req.result.createObjectStore('blobs')};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function getBlob(id){
    const db=await openDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('blobs');
      const req=tx.objectStore('blobs').get(id);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  async function blobToBase64(blob){
    return await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  function setUi(text){
    const el=document.getElementById('saveStatus');
    if(el)el.textContent=text;
  }
  async function uploadBlob(blob,project,track,clip){
    const audio_base64=await blobToBase64(blob);
    if(!audio_base64)throw new Error('empty_audio');
    const title=[project?.name||'A.R.I. MUSIC',track?.name||'VOZ',clip?.name||'TAKE'].join(' · ');
    const res=await fetch(API,{
      method:'POST',
      cache:'no-store',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title,mime_type:blob.type||'audio/webm',audio_base64})
    });
    let data=null;
    try{data=await res.json()}catch{data={ok:false,error:'invalid_json'}}
    if(!res.ok||data?.ok===false)throw new Error(data?.error||('http_'+res.status));
    return {ok:true,uploadedAt:new Date().toISOString(),title,mimeType:blob.type||'audio/webm',bytes:blob.size,response:data};
  }
  async function syncOnce(){
    if(busy)return;
    busy=true;
    try{
      const project=readJSON(PROJECT_KEY,null);
      if(!project||!Array.isArray(project.tracks))return;
      const syncMap=readJSON(SYNC_MAP_KEY,{});
      const pending=[];
      for(const track of project.tracks){
        for(const clip of (track.clips||[])){
          if(isVoiceTake(track,clip)&&!syncMap[clip.blobId])pending.push({track,clip});
        }
      }
      if(!pending.length){
        if(Object.keys(syncMap).length)setUi('LOCAL + SERVIDOR');
        return;
      }
      for(const {track,clip} of pending){
        setUi('SINCRONIZANDO VOZ…');
        try{
          const blob=await getBlob(clip.blobId);
          if(!blob)continue;
          const meta=await uploadBlob(blob,project,track,clip);
          syncMap[clip.blobId]=meta;
          writeJSON(SYNC_MAP_KEY,syncMap);
          sessionStorage.setItem('ari-last-server-recording-v1',JSON.stringify({blobId:clip.blobId,...meta}));
          window.dispatchEvent(new CustomEvent('ari:recording-synced',{detail:{blobId:clip.blobId,trackId:track.id,clipId:clip.id,meta}}));
          setUi('LOCAL + SERVIDOR');
        }catch(err){
          console.error('[A.R.I. recording sync]',err);
          setUi('LOCAL · SYNC PENDIENTE');
          await sleep(900);
        }
      }
    }finally{busy=false}
  }
  window.ARI_SYNC_RECORDINGS=syncOnce;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(syncOnce,700),{once:true});
  else setTimeout(syncOnce,700);
  setInterval(syncOnce,2500);
})();
