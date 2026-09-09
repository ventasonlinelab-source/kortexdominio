(()=>{
  if(window.__ARI_HOF409_UX_COPY_CLEAN__)return;
  window.__ARI_HOF409_UX_COPY_CLEAN__=1;

  const clean=()=>{
    const topMeta=document.querySelector('.top .meta');
    if(topMeta)topMeta.remove();

    const liveEyebrow=document.querySelector('#live .headrow .eyebrow');
    if(liveEyebrow)liveEyebrow.textContent='LIVE';
    document.querySelectorAll('#live .headrow .meta').forEach(el=>el.remove());

    const tfHeadEyebrow=document.querySelector('#tfDocRoot .tfdoc-head .eyebrow');
    if(tfHeadEyebrow)tfHeadEyebrow.remove();
    const tfId=document.querySelector('#tfDocRoot .tfdoc-id');
    if(tfId)tfId.remove();

    document.querySelectorAll('#tfDocRoot [data-tf-text]').forEach(el=>el.removeAttribute('placeholder'));
    document.querySelectorAll('#tfDocRoot .tfdoc-upload-label').forEach(el=>{el.textContent='IMÁGENES';});
    const synthesis=document.getElementById('tfDocSynthesis');
    if(synthesis)synthesis.removeAttribute('placeholder');
    const tfStatus=document.getElementById('tfDocStatus');
    if(tfStatus&&/RAW por TF|persistencia canónica pendiente|Estructurando RAW|RAW estructurado listo/i.test(tfStatus.textContent||''))tfStatus.textContent='';

    const followup=rootFollowup();
    if(followup){
      followup.querySelectorAll('.ful').forEach(el=>{
        if(/^NOTA CORTA/i.test(el.textContent||''))el.textContent='NOTA';
      });
      const note=followup.querySelector('#fuText');
      if(note)note.removeAttribute('placeholder');
      const status=followup.querySelector('#fust');
      if(status&&/Se añadirá cronológicamente a la APERTURA activa/i.test(status.textContent||''))status.textContent='';
    }
  };

  function rootFollowup(){return document.getElementById('mobileFollowupRoot');}

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;clean();});
  };
  clean();
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
  window.ARI_HOF409_UX_COPY_CLEAN={version:'HOF409-UX-COPY-CLEAN-V1',apply:clean,qa:()=>({
    topDescription:!!document.querySelector('.top .meta'),
    liveDescription:!!document.querySelector('#live .headrow .meta'),
    tfEyebrow:!!document.querySelector('#tfDocRoot .tfdoc-head .eyebrow'),
    tfId:!!document.querySelector('#tfDocRoot .tfdoc-id'),
    tfPlaceholders:[...document.querySelectorAll('#tfDocRoot [data-tf-text]')].filter(x=>x.hasAttribute('placeholder')).length,
    synthesisPlaceholder:!!document.getElementById('tfDocSynthesis')?.hasAttribute('placeholder'),
    followupNoteDescription:[...document.querySelectorAll('#mobileFollowupRoot .ful')].some(x=>/^NOTA CORTA/i.test(x.textContent||'')),
    flowControls:{modes:document.querySelectorAll('.tfdoc-mode').length,save:!!document.getElementById('tfDocSave'),chart:!!document.getElementById('ariChartMount')}
  })};
})();
