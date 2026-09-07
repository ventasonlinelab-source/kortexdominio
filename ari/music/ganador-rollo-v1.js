(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const MARKER='ari-song-ganador-rollo-v1';
  if(!location.pathname.startsWith('/ari/music/')||localStorage.getItem(MARKER)==='1')return;
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  const read=()=>{try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}};
  const save=p=>{p.updatedAt=new Date().toISOString();localStorage.setItem(PROJECT_KEY,JSON.stringify(p))};

  const chordBars=[
    [50,53,57,60], // Dm7
    [46,50,53,57], // Bbmaj7-ish
    [41,48,53,57], // F add9 color
    [48,52,55,62]  // C add9
  ];
  const roots=[38,34,41,36]; // D2 Bb1 F2 C2

  function keysNotes(){
    const notes=[];
    for(let bar=0;bar<32;bar++){
      const chord=chordBars[bar%4],at=bar*4;
      const section=bar<4?'intro':bar<8?'motif':bar<16?'verse':bar<20?'pre':bar<28?'chorus':'outro';
      const v=section==='chorus'?.48:section==='pre'?.40:section==='verse'?.31:.28;
      notes.push({id:uid(),pitch:chord[0]+12,at,length:1.7,velocity:v});
      notes.push({id:uid(),pitch:chord[2]+12,at:2,length:1.7,velocity:v*.88});
      if(section==='motif'||section==='chorus'){
        notes.push({id:uid(),pitch:chord[1]+24,at:.75,length:.30,velocity:v*.85});
        notes.push({id:uid(),pitch:chord[3]+24,at:2.75,length:.30,velocity:v*.78});
      }
    }
    return notes;
  }
  function padNotes(){
    const notes=[];
    for(let bar=0;bar<32;bar++){
      if(bar<4||bar>=28||bar>=8&&bar<16)continue;
      const chord=chordBars[bar%4],at=bar*4,v=bar>=20&&bar<28?.24:.15;
      chord.slice(0,3).forEach((p,i)=>notes.push({id:uid(),pitch:p+12,at,length:3.75,velocity:v*(i?0.82:1)}));
    }
    return notes;
  }
  function bassNotes(){
    const notes=[];
    for(let bar=0;bar<32;bar++){
      if(bar<8||bar>=28)continue;
      const root=roots[bar%4],at=bar*4;
      if(bar<16){
        notes.push({id:uid(),pitch:root,at,length:3.45,velocity:.34});
      }else if(bar<20){
        notes.push({id:uid(),pitch:root,at,length:1.45,velocity:.43});
        notes.push({id:uid(),pitch:root,at:2.25,length:1.2,velocity:.36});
      }else{
        notes.push({id:uid(),pitch:root,at,length:1.05,velocity:.52});
        notes.push({id:uid(),pitch:root,at:1.75,length:.72,velocity:.40});
        notes.push({id:uid(),pitch:root,at:2.75,length:.92,velocity:.47});
      }
    }
    return notes;
  }
  function drumNotes(){
    const notes=[];
    for(let bar=0;bar<32;bar++){
      if(bar<16||bar>=28)continue;
      const at=bar*4,chorus=bar>=20;
      notes.push({id:uid(),pitch:36,at,length:.18,velocity:chorus?.68:.44});
      notes.push({id:uid(),pitch:50,at:2,length:.16,velocity:chorus?.48:.30});
      if(chorus){
        notes.push({id:uid(),pitch:36,at:2.75,length:.16,velocity:.44});
        notes.push({id:uid(),pitch:50,at:1.5,length:.12,velocity:.22});
        notes.push({id:uid(),pitch:50,at:3.5,length:.12,velocity:.25});
      }
    }
    return notes;
  }
  function voiceDevices(){return [
    {id:uid(),type:'EQ',enabled:true,low:-3,high:1.5},
    {id:uid(),type:'COMP',enabled:true,threshold:-20,ratio:2.2},
    {id:uid(),type:'GAIN',enabled:true,value:1.28},
    {id:uid(),type:'REVERB',enabled:true,mix:.065},
    {id:uid(),type:'DELAY',enabled:true,time:.14,mix:.035}
  ]}
  function mkTrack(id,name,instrument,volume,devices,clipName,notes){return {
    id,type:'instrument',name,muted:false,solo:false,armed:false,volume,pan:0,instrument,devices,clips:[{id:uid(),type:'midi',name:clipName,start:0,length:128,notes}]
  }}

  function apply(){
    const p=read();
    if(!p||!Array.isArray(p.tracks)){setTimeout(apply,350);return}
    p.name='GANADOR SIN VICTORIA';
    p.bpm=86;
    p.bars=Math.max(32,Number(p.bars)||32);
    p.loop={...(p.loop||{}),on:false,start:0,end:16};

    // Preserve all previous material, but silence the old arrangement.
    p.tracks.forEach(t=>{
      if(t.type==='instrument'&&!String(t.id).startsWith('ari-rollo-'))t.muted=true;
      if(t.type==='audio'&&(t.clips||[]).length){t.armed=false;t.muted=true;if(/VOZ|VOCAL|TAKE/i.test(t.name||''))t.name='VOZ · TOMA ANTERIOR'}
    });
    p.tracks=p.tracks.filter(t=>!String(t.id).startsWith('ari-rollo-')&&t.id!=='ari-ganador-voice-new-v1');

    p.tracks.push(
      mkTrack('ari-rollo-keys-v1','KEYS · CÁLIDAS','PIANO',.62,[{id:uid(),type:'FILTER',enabled:true,freq:7200},{id:uid(),type:'REVERB',enabled:true,mix:.12}],'BASE · KEYS 1–32',keysNotes()),
      mkTrack('ari-rollo-pad-v1','PAD · AIRE','PAD',.38,[{id:uid(),type:'FILTER',enabled:true,freq:5200},{id:uid(),type:'REVERB',enabled:true,mix:.18}],'PAD · CRECE POR SECCIONES',padNotes()),
      mkTrack('ari-rollo-bass-v1','SUB · PULSO','BASS',.46,[{id:uid(),type:'FILTER',enabled:true,freq:1800},{id:uid(),type:'COMP',enabled:true,threshold:-20,ratio:2.5}],'SUB · 9–28',bassNotes()),
      mkTrack('ari-rollo-drums-v1','DRUMS · SECO','DRUMS',.42,[{id:uid(),type:'FILTER',enabled:true,freq:9800}],'GROOVE · 17–28',drumNotes())
    );

    p.tracks.push({
      id:'ari-ganador-voice-new-v1',type:'audio',name:'VOZ · NUEVA TOMA',muted:false,solo:false,armed:true,volume:1,pan:0,instrument:null,devices:voiceDevices(),clips:[]
    });
    p.songConcept={...(p.songConcept||{}),referenceDirection:'Inspiración de energía/groove del rolo subido: cálido, oscuro, sub con peso y crecimiento por capas. Composición y armonía originales.',tempo:86};
    save(p);
    localStorage.setItem(MARKER,'1');
    location.reload();
  }
  apply();
})();
