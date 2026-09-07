(()=>{
  const PROJECT_KEY='ari-daw-project-v0',MARKER='ari-daw-demo-base-voice-v1';
  if(!location.pathname.startsWith('/ari/music/')||localStorage.getItem(MARKER)==='1')return;
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  let project;
  try{project=JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{project=null}
  if(!project||!Array.isArray(project.tracks))project={version:1,name:'Sin título',bpm:72,bars:32,meter:[4,4],metronome:false,loop:{on:false,start:0,end:32},tracks:[],updatedAt:new Date().toISOString()};
  project.bars=Math.max(32,Number(project.bars)||32);
  project.bpm=Number(project.bpm)||72;
  project.meter=Array.isArray(project.meter)?project.meter:[4,4];
  project.loop=project.loop&&typeof project.loop==='object'?project.loop:{on:false,start:0,end:32};
  const hasBase=project.tracks.some(t=>t.demoRole==='base'||t.name==='BASE · DEMO');
  const hasVoice=project.tracks.some(t=>t.demoRole==='voice'||t.name==='VOZ · GRABAR');
  if(!hasBase){
    const notes=[];
    const bars=[
      {root:50,arp:[62,65,69,65]},
      {root:46,arp:[58,62,65,62]},
      {root:41,arp:[53,57,60,57]},
      {root:48,arp:[60,64,67,64]},
      {root:50,arp:[62,65,69,65]},
      {root:46,arp:[58,62,65,62]},
      {root:48,arp:[60,64,67,64]},
      {root:48,arp:[60,64,67,64]}
    ];
    bars.forEach((bar,bi)=>{
      const at=bi*4;
      notes.push({id:uid(),pitch:bar.root,at,length:3.7,velocity:.34});
      bar.arp.forEach((pitch,i)=>notes.push({id:uid(),pitch,at:at+i,length:.74,velocity:i===0?.74:.64}));
    });
    project.tracks.push({
      id:'ari-demo-base-v1',demoRole:'base',type:'instrument',name:'BASE · DEMO',muted:false,solo:false,armed:false,volume:.72,pan:0,instrument:'PIANO',
      devices:[{id:uid(),type:'FILTER',enabled:true,freq:10500},{id:uid(),type:'REVERB',enabled:true,mix:.12}],
      clips:[{id:'ari-demo-base-clip-v1',type:'midi',name:'BASE · Dm · 8 BARS',start:0,length:32,notes}]
    });
  }
  if(!hasVoice){
    project.tracks.push({id:'ari-demo-voice-v1',demoRole:'voice',type:'audio',name:'VOZ · GRABAR',muted:false,solo:false,armed:true,volume:.95,pan:0,instrument:null,devices:[],clips:[]});
  }else{
    const voice=project.tracks.find(t=>t.demoRole==='voice'||t.name==='VOZ · GRABAR');
    if(voice){voice.armed=true;project.tracks.filter(t=>t.type==='audio'&&t.id!==voice.id).forEach(t=>t.armed=false)}
  }
  if(project.name==='Sin título'||!project.name)project.name='DEMO · BASE + VOZ';
  project.updatedAt=new Date().toISOString();
  localStorage.setItem(PROJECT_KEY,JSON.stringify(project));
  localStorage.setItem(MARKER,'1');
  sessionStorage.setItem('ari-demo-seeded','1');
  location.reload();
})();