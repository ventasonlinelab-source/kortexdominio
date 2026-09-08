(()=>{'use strict';
const P=window.ARIChartEngine?.prototype;if(!P)return;
const style=document.createElement('style');style.id='ari-chart-runtime-fix-v1';style.textContent=`
.ari-chart-engine{background:var(--chart-sepia,#eee6d2)!important;color:var(--text,#27231d)!important;border-color:var(--border,#d8ccb9)!important}
.ari-chart-top,.ari-ohlc,.ari-drawbar{background:var(--panel,#f5eddf)!important;color:var(--muted,#786d5b)!important;border-color:var(--border,#d8ccb9)!important}
.ari-canvas-wrap{background:var(--chart-sepia,#eee6d2)!important}
.ari-tf,.ari-chart-actions button,.ari-tool{color:var(--muted,#615645)!important}.ari-tf.active,.ari-tool.active{color:var(--gold,#815916)!important}
html[data-theme="dark"] .ari-canvas-wrap canvas{filter:invert(.9) hue-rotate(180deg) saturate(.45) brightness(.72) contrast(1.08)}
@media(max-width:760px){.ari-chart-workspace{grid-template-columns:34px minmax(0,1fr)!important}}
`;if(!document.getElementById(style.id))document.head.appendChild(style);
function span(tf){return({M1:60e3,M5:300e3,M15:900e3,M30:1800e3,H1:3600e3,H4:14400e3,D:86400e3,W:604800e3})[tf]||null}
function fmt(ms){const t=Math.max(0,Math.floor(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function nextClose(engine,now){const a=engine.candles?.at(-1)?.t;if(engine.tf==='MN'){const d=new Date(Number.isFinite(a)?a:now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)}const s=span(engine.tf);if(Number.isFinite(a)&&s){const n=a+s;if(n>now-1000)return n}if(s)return(Math.floor(now/s)+1)*s;return now+60e3}
P._startTimers=function(){
  clearInterval(this.pollTimer);clearInterval(this.clockTimer);
  this.pollTimer=setInterval(()=>{if(!document.hidden)this.load(true)},2500);
  const tick=()=>{const now=Date.now(),n=nextClose(this,now);this.clock.querySelector('b').textContent=this.tf;this.clock.querySelector('span').textContent=fmt(n-now);this.clock.querySelector('span').dataset.nextClose=new Date(n).toISOString()};
  tick();this.clockTimer=setInterval(tick,250);document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.load(true)},{passive:true});
};
})();