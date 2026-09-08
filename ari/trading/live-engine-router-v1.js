(()=>{'use strict';
const p=location.pathname;if(!(p==='/ari/trading/'||p==='/ari/trading/index.html'))return;
const LIVE='/ari/trading/live.html',FALLBACK='ari-trading-tv-fallback-until';let health=null,checking=null;
function recentFallback(){const until=Number(sessionStorage.getItem(FALLBACK)||0);if(until>Date.now())return true;if(until)sessionStorage.removeItem(FALLBACK);return false}
async function check(){if(health!==null)return health;if(checking)return checking;checking=(async()=>{try{const r=await fetch('/api/ari-trading-feed?tf=M15&count=80',{cache:'no-store'}),d=await r.json().catch(()=>null);health=!!(r.ok&&d?.ok&&Array.isArray(d.candles)&&d.candles.length>20);return health}catch{health=false;return false}finally{checking=null}})();return checking}
async function openOwn(){if(recentFallback())return false;if(await check()){sessionStorage.removeItem(FALLBACK);location.assign(LIVE);return true}sessionStorage.setItem(FALLBACK,String(Date.now()+60000));sessionStorage.setItem('ari-trading-screen','live');location.assign('/ari/trading/?resume=1');return false}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-go="live"]');if(!b||recentFallback())return;e.preventDefault();e.stopImmediatePropagation();openOwn()},{capture:true});
setTimeout(async()=>{if(recentFallback())return;const active=document.querySelector('#live.screen.active');if(active&&await check())location.replace(LIVE)},60);
check();window.ARI_TRADING_ENGINE_ROUTER={check,openOwn,fallbackUntil:()=>Number(sessionStorage.getItem(FALLBACK)||0)};
})();