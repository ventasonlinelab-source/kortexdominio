(()=>{
  if(document.getElementById('hof409-candle-position'))return;
  const s=document.createElement('style');
  s.id='hof409-candle-position';
  s.textContent='.candleclock{right:0!important;top:50%!important;transform:translateY(-50%)!important;border-right:0!important;border-radius:7px 0 0 7px!important;padding:5px 7px!important;font-size:10px!important;box-shadow:-5px 0 16px rgba(0,0,0,.16)!important}.candleclock::before{content:"";position:absolute;right:100%;top:50%;width:18px;height:1px;background:rgba(216,168,75,.55)}.candleclock .clocktf{margin-right:4px!important}';
  document.head.appendChild(s);
})();