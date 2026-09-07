(()=>{
  const PROJECT_KEY='ari-daw-project-v0';
  const UNDO_KEY='ari-daw-undo-v1';
  const REDO_KEY='ari-daw-redo-v1';
  const MAX=100;
  const nativeSet=Storage.prototype.setItem;
  const nativeRemove=Storage.prototype.removeItem;
  let restoring=false;
  let lastPushAt=0;

  function readStack(key){
    try{const x=JSON.parse(sessionStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return[]}
  }
  function writeStack(key,stack){
    try{sessionStorage.setItem(key,JSON.stringify(stack.slice(-MAX)))}catch{}
  }
  function pushUndo(previous){
    if(previous==null)return;
    const now=Date.now(),stack=readStack(UNDO_KEY);
    if(now-lastPushAt>280){
      if(stack[stack.length-1]!==previous)stack.push(previous);
      writeStack(UNDO_KEY,stack);
    }
    lastPushAt=now;
    writeStack(REDO_KEY,[]);
  }
  function isProjectStorage(storage,key){return storage===localStorage&&String(key)===PROJECT_KEY}

  Storage.prototype.setItem=function(key,value){
    if(!restoring&&isProjectStorage(this,key)){
      const previous=localStorage.getItem(PROJECT_KEY),next=String(value);
      if(previous!==next)pushUndo(previous);
    }
    return nativeSet.call(this,key,value);
  };
  Storage.prototype.removeItem=function(key){
    if(!restoring&&isProjectStorage(this,key)){
      const previous=localStorage.getItem(PROJECT_KEY);
      if(previous!=null)pushUndo(previous);
    }
    return nativeRemove.call(this,key);
  };

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1200)}
  }
  function apply(direction){
    const fromKey=direction==='undo'?UNDO_KEY:REDO_KEY;
    const toKey=direction==='undo'?REDO_KEY:UNDO_KEY;
    const from=readStack(fromKey);
    if(!from.length){toast(direction==='undo'?'Nada que deshacer':'Nada que rehacer');return false}
    const current=localStorage.getItem(PROJECT_KEY);
    const target=from.pop();
    const to=readStack(toKey);
    if(current!=null&&to[to.length-1]!==current)to.push(current);
    writeStack(fromKey,from);writeStack(toKey,to);
    restoring=true;
    try{nativeSet.call(localStorage,PROJECT_KEY,target)}finally{restoring=false}
    sessionStorage.setItem('ari-history-restored-v1',direction);
    location.reload();
    return true;
  }
  function checkpoint(){
    const current=localStorage.getItem(PROJECT_KEY);
    if(current==null)return;
    const stack=readStack(UNDO_KEY);
    if(stack[stack.length-1]!==current)stack.push(current);
    writeStack(UNDO_KEY,stack);writeStack(REDO_KEY,[]);lastPushAt=0;
  }
  function historyState(){return{undo:readStack(UNDO_KEY).length,redo:readStack(REDO_KEY).length}}

  addEventListener('keydown',e=>{
    const mod=e.ctrlKey||e.metaKey;
    if(!mod||String(e.key).toLowerCase()!=='z')return;
    const tag=e.target?.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||e.target?.isContentEditable)return;
    e.preventDefault();
    if(e.shiftKey)apply('redo');else apply('undo');
  },true);

  window.ARI_UNDO=()=>apply('undo');
  window.ARI_REDO=()=>apply('redo');
  window.ARI_HISTORY_CHECKPOINT=checkpoint;
  window.ARI_HISTORY_STATE=historyState;
  window.ARI_HISTORY_READY=true;
  dispatchEvent(new CustomEvent('ari:history-ready'));
})();