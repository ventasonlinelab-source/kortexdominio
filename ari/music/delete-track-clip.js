(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const STYLE_ID='ari-delete-track-clip-style';
  let observer=null;

  function readProject(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'null')}catch{return null}}
  function writeProject(p){p.updatedAt=new Date().toISOString();localStorage.setItem(PROJECT_KEY,JSON.stringify(p))}
  function toast(msg){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1400)}
  function checkpoint(){try{window.ARI_HISTORY_CHECKPOINT?.()}catch{}}
  function selectedClipId(){return document.querySelector('.clip.selected')?.dataset.clip||null}
  function selectedTrackId(){return document.querySelector('.track-head.selected')?.closest('.track-row')?.dataset.track||null}
  function findClip(p,id){for(const track of p?.tracks||[]){const index=(track.clips||[]).findIndex(c=>String(c.id)===String(id));if(index>=0)return{track,index,clip:track.clips[index]}}return null}

  function deleteTrack(trackId){
    const p=readProject();if(!p||!Array.isArray(p.tracks))return false;
    const index=p.tracks.findIndex(t=>String(t.id)===String(trackId));if(index<0)return false;
    checkpoint();
    p.tracks.splice(index,1);
    writeProject(p);
    sessionStorage.setItem('ari-last-delete-v1',JSON.stringify({type:'track',id:String(trackId)}));
    toast('Pista borrada · Deshacer disponible');
    setTimeout(()=>location.reload(),100);
    return true;
  }

  function deleteClip(clipId){
    const p=readProject(),found=findClip(p,clipId);if(!p||!found)return false;
    checkpoint();
    found.track.clips.splice(found.index,1);
    writeProject(p);
    sessionStorage.setItem('ari-last-delete-v1',JSON.stringify({type:'clip',id:String(clipId),trackId:String(found.track.id)}));
    toast('Clip borrado · Deshacer disponible');
    setTimeout(()=>location.reload(),100);
    return true;
  }

  function deleteSelected(){const clip=selectedClipId();if(clip)return deleteClip(clip);const track=selectedTrackId();if(track)return deleteTrack(track);toast('Selecciona una pista o clip');return false}

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .mini-toggle.delete-track{font-size:11px!important;line-height:1;width:25px!important;color:var(--record)!important}
      .mini-toggle.delete-track:hover{border-color:var(--record)!important;background:var(--record-soft)!important}
    `;document.head.appendChild(s);
  }

  function enhanceTrackRow(row){
    const head=row.querySelector('.track-head'),buttons=head?.querySelector('.track-buttons');if(!buttons)return;
    const id=row.dataset.track;if(!id)return;
    let b=buttons.querySelector('.delete-track');
    if(!b){b=document.createElement('button');b.type='button';b.className='mini-toggle delete-track';b.title='Borrar pista · Undo disponible';b.setAttribute('aria-label','Borrar pista');b.textContent='⌫';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteTrack(id)});buttons.appendChild(b)}
  }

  function enhanceInspector(){
    const clipBtn=document.getElementById('deleteClip');
    if(clipBtn&&!clipBtn.dataset.ariDeleteBound){
      clipBtn.dataset.ariDeleteBound='1';clipBtn.textContent='BORRAR CLIP · ⌫';
      clipBtn.addEventListener('click',e=>{const id=selectedClipId();if(!id)return;e.preventDefault();e.stopImmediatePropagation();deleteClip(id)},true);
    }
    const trackBtn=document.getElementById('deleteTrack');
    if(trackBtn&&!trackBtn.dataset.ariDeleteBound){
      trackBtn.dataset.ariDeleteBound='1';trackBtn.textContent='BORRAR PISTA · ⌫';trackBtn.classList.add('danger');
      trackBtn.addEventListener('click',e=>{const id=selectedTrackId();if(!id)return;e.preventDefault();e.stopImmediatePropagation();deleteTrack(id)},true);
    }
  }

  function enhance(){ensureStyle();document.querySelectorAll('#tracks .track-row').forEach(enhanceTrackRow);enhanceInspector()}
  function mount(){
    if(!location.pathname.startsWith('/ari/music/'))return;
    const tracks=document.getElementById('tracks'),inspector=document.getElementById('inspectorBody');if(!tracks||!inspector){setTimeout(mount,180);return}
    enhance();observer?.disconnect();observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.body,{childList:true,subtree:true});
  }

  addEventListener('keydown',e=>{
    const tag=e.target?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target?.isContentEditable)return;
    if(e.key!=='Backspace'&&e.key!=='Delete')return;
    if(!selectedClipId()&&!selectedTrackId())return;
    e.preventDefault();e.stopImmediatePropagation();deleteSelected();
  },true);

  window.ARI_DELETE_TRACK=deleteTrack;
  window.ARI_DELETE_CLIP=deleteClip;
  window.ARI_DELETE_SELECTED=deleteSelected;
  window.ARI_DELETE_TRACK_CLIP_READY=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  addEventListener('pageshow',mount);
})();