(()=>{
  const TF_ORDER=['MN','W1','D1','H4','H1','M30','M15','M5','M1'];
  const state=[];
  function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():`img-${Date.now()}-${Math.random().toString(36).slice(2)}`}
  function el(tag,attrs={},text=''){const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>{if(k==='class')n.className=v;else if(k==='type')n.type=v;else n.setAttribute(k,v)});if(text)n.textContent=text;return n}
  function render(){
    const root=document.getElementById('tfUploadList'); if(!root) return; root.innerHTML='';
    state.sort((a,b)=>TF_ORDER.indexOf(a.tf)-TF_ORDER.indexOf(b.tf));
    state.forEach(item=>{
      const row=el('div',{class:'tf-upload-row'});
      const name=el('div',{class:'tf-upload-name'},item.file.name);
      const sel=el('select',{class:'tf-upload-select','data-id':item.id});
      TF_ORDER.forEach(tf=>{const o=el('option',{value:tf},tf); if(tf===item.tf)o.selected=true; sel.appendChild(o)});
      sel.addEventListener('change',()=>{item.tf=sel.value;render()});
      const del=el('button',{class:'tf-upload-remove',type:'button'},'×');
      del.addEventListener('click',()=>{const i=state.findIndex(x=>x.id===item.id); if(i>-1)state.splice(i,1);render()});
      row.append(name,sel,del); root.appendChild(row);
    });
    const counter=document.getElementById('tfUploadCount'); if(counter) counter.textContent=state.length?`${state.length} imagen${state.length===1?'':'es'}`:'Sin imágenes';
  }
  function mount(){
    const host=document.querySelector('#live .side'); if(!host||document.getElementById('tfUploadBox')) return;
    const box=el('div',{class:'field',id:'tfUploadBox'});
    box.innerHTML='<label>Capturas · temporalidad obligatoria</label><div class="tf-upload-head"><span id="tfUploadCount">Sin imágenes</span><label class="btn tf-upload-add">+ AÑADIR IMÁGENES<input id="tfUploadInput" type="file" accept="image/*" multiple hidden></label></div><div id="tfUploadList" class="tf-upload-list"></div><div class="hint">Cada imagen debe llevar su TF antes de guardar.</div>';
    const actions=host.querySelector('.actions'); host.insertBefore(box,actions||null);
    document.getElementById('tfUploadInput').addEventListener('change',e=>{
      [...e.target.files].forEach(f=>state.push({id:uid(),file:f,tf:'H1'})); e.target.value=''; render();
    });
  }
  window.ARI_TF_UPLOAD={getFiles:()=>state.map(x=>({id:x.id,file:x.file,timeframe:x.tf})),clear:()=>{state.splice(0);render()},order:TF_ORDER};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
