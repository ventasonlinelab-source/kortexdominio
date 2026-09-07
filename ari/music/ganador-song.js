(()=>{
  const PROJECT_KEY='ari-daw-project-v0',MARKER='ari-song-ganador-sin-victoria-v2';
  if(!location.pathname.startsWith('/ari/music/')||localStorage.getItem(MARKER)==='1')return;
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  function readProject(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}}
  function saveProject(p){p.updatedAt=new Date().toISOString();localStorage.setItem(PROJECT_KEY,JSON.stringify(p))}

  function buildMotif(){
    const notes=[];
    const bars=[
      {hi:[69,72,74,77],lo:[50,50,45,50]},
      {hi:[65,70,74,77],lo:[46,46,41,46]},
      {hi:[67,72,76,79],lo:[48,48,43,48]},
      {hi:[67,72,76,79],lo:[48,43,48,43]}
    ];
    bars.forEach((b,bi)=>{
      const base=bi*4;
      b.hi.forEach((pitch,i)=>notes.push({id:uid(),pitch,at:base+i*.5,length:.30,velocity:i===0?.82:.72}));
      b.lo.forEach((pitch,i)=>notes.push({id:uid(),pitch,at:base+2+i*.5,length:.34,velocity:i===0?.70:.60}));
    });
    return notes;
  }

  function buildVersePiano(){
    const notes=[];
    const progression=[
      {root:50,arp:[62,65,69,65]},
      {root:46,arp:[58,62,65,62]},
      {root:41,arp:[53,57,60,57]},
      {root:48,arp:[60,64,67,64]},
      {root:50,arp:[62,65,69,65]},
      {root:46,arp:[58,62,65,62]},
      {root:41,arp:[53,57,60,57]},
      {root:48,arp:[60,64,67,64]}
    ];
    progression.forEach((bar,bi)=>{
      const at=bi*4;
      notes.push({id:uid(),pitch:bar.root,at,length:3.72,velocity:.23});
      bar.arp.forEach((pitch,i)=>notes.push({id:uid(),pitch,at:at+i,length:.72,velocity:i===0?.49:.39}));
    });
    return notes;
  }

  function buildSoftBass(){
    const notes=[];
    [38,34,41,36].forEach((pitch,bi)=>{
      notes.push({id:uid(),pitch,at:bi*4,length:3.65,velocity:bi===0?.46:.39});
    });
    return notes;
  }

  function ensureBaseVerse(p){
    let base=p.tracks.find(t=>t.demoRole==='base'||t.name==='BASE · DEMO'||t.songRole==='ganador-base');
    if(!base){
      base={id:'ari-ganador-base-v1',songRole:'ganador-base',type:'instrument',name:'PIANO · BASE',muted:false,solo:false,armed:false,volume:.70,pan:0,instrument:'PIANO',devices:[{id:uid(),type:'FILTER',enabled:true,freq:10800},{id:uid(),type:'REVERB',enabled:true,mix:.10}],clips:[]};
      p.tracks.unshift(base);
    }
    base.songRole=base.songRole||'ganador-base';
    base.instrument='PIANO';
    base.clips=Array.isArray(base.clips)?base.clips:[];
    if(!base.clips.some(c=>c.id==='ari-ganador-verso-piano-v1'||c.songRole==='ganador-verso-piano')){
      base.clips.push({id:'ari-ganador-verso-piano-v1',songRole:'ganador-verso-piano',type:'midi',name:'VERSO 1 · PIANO',start:32,length:32,notes:buildVersePiano()});
    }
  }

  function ensureBass(p){
    let bass=p.tracks.find(t=>t.songRole==='ganador-bass'||t.id==='ari-ganador-bass-v1');
    if(!bass){
      bass={id:'ari-ganador-bass-v1',songRole:'ganador-bass',type:'instrument',name:'BAJO · SUAVE',muted:false,solo:false,armed:false,volume:.46,pan:0,instrument:'BASS',devices:[{id:uid(),type:'FILTER',enabled:true,freq:4200}],clips:[]};
      p.tracks.push(bass);
    }
    bass.clips=Array.isArray(bass.clips)?bass.clips:[];
    if(!bass.clips.some(c=>c.id==='ari-ganador-bass-13-16-v1')){
      bass.clips.push({id:'ari-ganador-bass-13-16-v1',type:'midi',name:'BAJO · 13–16',start:48,length:16,notes:buildSoftBass()});
    }
  }

  function apply(){
    const p=readProject();
    if(!p||!Array.isArray(p.tracks)){setTimeout(apply,450);return}
    p.name='GANADOR SIN VICTORIA';
    p.bpm=Number(p.bpm)||72;
    p.bars=Math.max(32,Number(p.bars)||32);
    p.songConcept={
      title:'GANADOR SIN VICTORIA',
      theme:'Me gané a mí; al ordenar lo interno, dejé de pelear con lo externo.',
      creativeFrame:['QUÉ antes que CÓMO','palabra alineada con la idea','del caos interno al orden','la victoria es sobre uno mismo'],
      structure:[
        {startBar:1,endBar:4,name:'INTRO A · PIANO SOLO'},
        {startBar:5,endBar:8,name:'INTRO B · PIM/PUM'},
        {startBar:9,endBar:12,name:'VERSO 1A · PIANO + VOZ'},
        {startBar:13,endBar:16,name:'VERSO 1B · PIANO + VOZ + BAJO'},
        {startBar:17,endBar:20,name:'PRE · ME ELIJO'},
        {startBar:21,endBar:28,name:'ESTRIBILLO · GANADOR SIN VICTORIA'},
        {startBar:29,endBar:32,name:'SALIDA · AFUERA SE ORDENA'}
      ]
    };

    let voice=p.tracks.find(t=>t.demoRole==='voice'||t.name==='VOZ · GRABAR'||t.name==='VOZ · GANADOR'||(t.type==='audio'&&/VOZ/i.test(t.name||'')));
    if(voice){
      voice.name='VOZ · GANADOR';
      voice.armed=true;
      p.tracks.filter(t=>t.type==='audio'&&t.id!==voice.id).forEach(t=>t.armed=false);
    }

    let motif=p.tracks.find(t=>t.songRole==='ganador-pim-pum'||t.id==='ari-ganador-piano-v1');
    if(!motif){
      motif={id:'ari-ganador-piano-v1',songRole:'ganador-pim-pum',type:'instrument',name:'PIANO · PIM/PUM',muted:false,solo:false,armed:false,volume:.66,pan:0,instrument:'PIANO',devices:[{id:uid(),type:'FILTER',enabled:true,freq:13200},{id:uid(),type:'REVERB',enabled:true,mix:.09}],clips:[]};
      p.tracks.push(motif);
    }
    motif.clips=Array.isArray(motif.clips)?motif.clips:[];
    if(!motif.clips.some(c=>c.id==='ari-ganador-pim-pum-clip-v1')){
      motif.clips.push({id:'ari-ganador-pim-pum-clip-v1',type:'midi',name:'PIM ×4 · PUM ×4 · C5',start:16,length:16,notes:buildMotif()});
    }

    ensureBaseVerse(p);
    ensureBass(p);
    saveProject(p);
    localStorage.setItem(MARKER,'1');
    sessionStorage.setItem('ari-song-ganador-layered-v2','1');
    location.reload();
  }
  apply();
})();