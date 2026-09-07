(()=>{
  const PROJECT_KEY='ari-daw-project-v0',MARKER='ari-song-ganador-sin-victoria-v1';
  if(!location.pathname.startsWith('/ari/music/')||localStorage.getItem(MARKER)==='1')return;
  const uid=()=>crypto.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
  function readProject(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}}
  function saveProject(p){p.updatedAt=new Date().toISOString();localStorage.setItem(PROJECT_KEY,JSON.stringify(p))}
  function buildMotif(){
    const notes=[];
    // Compases 5-8. Primeros 2 beats = "pim pim pim pim" (registro alto).
    // Últimos 2 beats = "pum pum pum pum" (registro bajo).
    const bars=[
      {hi:[69,72,74,77],lo:[50,50,45,50]}, // Dm
      {hi:[65,70,74,77],lo:[46,46,41,46]}, // Bb
      {hi:[67,72,76,79],lo:[48,48,43,48]}, // C
      {hi:[67,72,76,79],lo:[48,43,48,43]}  // C
    ];
    bars.forEach((b,bi)=>{
      const base=bi*4;
      b.hi.forEach((pitch,i)=>notes.push({id:uid(),pitch,at:base+i*.5,length:.30,velocity:i===0?.82:.72}));
      b.lo.forEach((pitch,i)=>notes.push({id:uid(),pitch,at:base+2+i*.5,length:.34,velocity:i===0?.70:.60}));
    });
    return notes;
  }
  function apply(){
    const p=readProject();
    if(!p||!Array.isArray(p.tracks)){setTimeout(apply,450);return}
    p.name='GANADOR SIN VICTORIA';
    p.songConcept={
      title:'GANADOR SIN VICTORIA',
      theme:'Me gané a mí; al ordenar lo interno, dejé de pelear con lo externo.',
      creativeFrame:['QUÉ antes que CÓMO','palabra alineada con la idea','del caos interno al orden','la victoria es sobre uno mismo'],
      structure:[
        {startBar:1,endBar:4,name:'INTRO · ANTES DE GANAR'},
        {startBar:5,endBar:8,name:'SEÑAL · PIM/PUM'},
        {startBar:9,endBar:16,name:'VERSO · LA BATALLA ERA YO'},
        {startBar:17,endBar:20,name:'PRE · ME ELIJO'},
        {startBar:21,endBar:28,name:'ESTRIBILLO · GANADOR SIN VICTORIA'},
        {startBar:29,endBar:32,name:'SALIDA · AFUERA SE ORDENA'}
      ]
    };
    let voice=p.tracks.find(t=>t.demoRole==='voice'||t.name==='VOZ · GRABAR'||(t.type==='audio'&&/VOZ/i.test(t.name||'')));
    if(voice){voice.name='VOZ · GANADOR';voice.armed=true;p.tracks.filter(t=>t.type==='audio'&&t.id!==voice.id).forEach(t=>t.armed=false)}
    const exists=p.tracks.some(t=>t.songRole==='ganador-pim-pum'||t.id==='ari-ganador-piano-v1');
    if(!exists){
      p.tracks.push({
        id:'ari-ganador-piano-v1',songRole:'ganador-pim-pum',type:'instrument',name:'PIANO · PIM/PUM',muted:false,solo:false,armed:false,volume:.66,pan:0,instrument:'PIANO',
        devices:[{id:uid(),type:'FILTER',enabled:true,freq:13200},{id:uid(),type:'REVERB',enabled:true,mix:.09}],
        clips:[{id:'ari-ganador-pim-pum-clip-v1',type:'midi',name:'PIM ×4 · PUM ×4 · C5',start:16,length:16,notes:buildMotif()}]
      });
    }
    saveProject(p);
    localStorage.setItem(MARKER,'1');
    sessionStorage.setItem('ari-song-ganador-seeded','1');
    location.reload();
  }
  apply();
})();