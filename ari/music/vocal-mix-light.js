(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const MARKER='ari-vocal-mix-light-v1';
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  function read(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}}
  function toast(msg){const el=document.getElementById('toast');if(el){el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1400)}}
  function targetVoice(project){
    const audio=(project?.tracks||[]).filter(t=>t?.type==='audio');
    return audio.find(t=>t.armed)||audio.find(t=>/VOZ|VOCAL|MIC/i.test(String(t.name||'')))||null;
  }
  function mergeDevices(devices){
    const keep=(Array.isArray(devices)?devices:[]).filter(d=>!['EQ','COMP','GAIN','REVERB','DELAY'].includes(String(d?.type||'').toUpperCase()));
    return [
      {id:uid(),type:'EQ',enabled:true,low:-3.5,high:1.8},
      {id:uid(),type:'COMP',enabled:true,threshold:-22,ratio:2.4},
      {id:uid(),type:'GAIN',enabled:true,value:1.16},
      {id:uid(),type:'REVERB',enabled:true,mix:.09},
      {id:uid(),type:'DELAY',enabled:true,time:.13,mix:.04},
      ...keep
    ];
  }
  function apply(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    if(localStorage.getItem(MARKER)==='1'){window.ARI_VOCAL_MIX_LIGHT=true;return}
    const project=read();if(!project||!Array.isArray(project.tracks))return;
    const voice=targetVoice(project);if(!voice)return;
    if(window.ARI_HISTORY_CHECKPOINT)window.ARI_HISTORY_CHECKPOINT();
    voice.devices=mergeDevices(voice.devices);
    voice.volume=Math.min(1.15,Math.max(.85,Number(voice.volume)||1));
    project.updatedAt=new Date().toISOString();
    localStorage.setItem(PROJECT_KEY,JSON.stringify(project));
    localStorage.setItem(MARKER,'1');
    sessionStorage.setItem('ari-vocal-mix-light-applied-v1','1');
    window.ARI_VOCAL_MIX_LIGHT=true;
    toast('Mezcla vocal ligera aplicada');
    setTimeout(()=>location.reload(),250);
  }
  window.ARI_APPLY_VOCAL_MIX_LIGHT=()=>{localStorage.removeItem(MARKER);apply()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,500),{once:true});else setTimeout(apply,500);
})();
