(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const MARKER='ari-ganador-reference-session-v1';
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  function read(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}}
  function voiceDevices(){return[
    {id:uid(),type:'EQ',enabled:true,low:-3,high:1.5},
    {id:uid(),type:'COMP',enabled:true,threshold:-20,ratio:2.2},
    {id:uid(),type:'GAIN',enabled:true,value:1.24},
    {id:uid(),type:'REVERB',enabled:true,mix:.07},
    {id:uid(),type:'DELAY',enabled:true,time:.14,mix:.035}
  ]}
  function apply(){
    if(!location.pathname.startsWith('/ari/music/')||localStorage.getItem(MARKER)==='1')return;
    if(!window.ARI_HISTORY_READY){addEventListener('ari:history-ready',apply,{once:true});setTimeout(apply,450);return}
    const old=read()||{};
    const project={
      version:old.version||1,
      name:'GANADOR SIN VICTORIA · PRÁCTICA',
      bpm:86,
      bars:48,
      meter:[4,4],
      metronome:false,
      loop:{on:false,start:0,end:16},
      tracks:[
        {id:'ari-ref-base-v1',type:'audio',name:'BASE · REFERENCIA · CARGAR',muted:false,solo:false,armed:false,volume:.82,pan:0,instrument:null,devices:[],clips:[]},
        {id:'ari-ref-voice-v1',type:'audio',name:'VOZ · GANADOR',muted:false,solo:false,armed:true,volume:1,pan:0,instrument:null,devices:voiceDevices(),clips:[]}
      ],
      songConcept:{title:'Ganador sin victoria',practiceReference:true,referenceTempo:86},
      updatedAt:new Date().toISOString()
    };
    localStorage.setItem('ari-daw-demo-base-voice-v1','1');
    localStorage.setItem('ari-song-ganador-sin-victoria-v3','1');
    localStorage.setItem('ari-song-ganador-rollo-v1','1');
    localStorage.setItem(MARKER,'1');
    localStorage.setItem(PROJECT_KEY,JSON.stringify(project));
    location.reload();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();