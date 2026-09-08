const TF_MAP={M1:'M1',M5:'M5',M15:'M15',M30:'M30',H1:'H1',H4:'H4',D:'D',W:'W',MN:'M'};
const BIQUOTE_TF={M1:'1m',M5:'5m',M15:'15m',M30:'30m',H1:'1h',H4:'4h',D:'1d'};
const BIQUOTE_BASE='https://biquote.io';
function send(res,status,body){res.status(status).setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Content-Type','application/json; charset=utf-8');res.send(JSON.stringify(body));}
function normalizeUpstream(d,tf){const arr=(d.candles||d.data||[]).map(c=>({t:+(c.t??c.time??c.timestamp),o:+(c.o??c.open),h:+(c.h??c.high),l:+(c.l??c.low),c:+(c.c??c.close),v:+(c.v??c.volume??0),complete:c.complete!==false})).filter(c=>Number.isFinite(c.t)&&Number.isFinite(c.o)&&Number.isFinite(c.c));return{ok:true,symbol:'XAUUSD',tf,source:d.source||'A.R.I. UPSTREAM',server_time:new Date().toISOString(),candles:arr};}
function biquoteBar(x){return{t:Date.parse(x.openTime),o:+x.open,h:+x.high,l:+x.low,c:+x.close,v:+(x.tickVolume??x.volume??0),complete:x.isOpen!==true};}
function weekStartUtc(ms){const d=new Date(ms),day=(d.getUTCDay()+6)%7;return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-day);}
function monthStartUtc(ms){const d=new Date(ms);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);}
function aggregateBars(bars,tf,count){const key=tf==='W'?weekStartUtc:monthStartUtc,groups=new Map();for(const b of bars.sort((a,b)=>a.t-b.t)){const k=key(b.t),g=groups.get(k);if(!g)groups.set(k,{t:k,o:b.o,h:b.h,l:b.l,c:b.c,v:b.v,complete:b.complete});else{g.h=Math.max(g.h,b.h);g.l=Math.min(g.l,b.l);g.c=b.c;g.v+=b.v;g.complete=g.complete&&b.complete;}}return [...groups.values()].slice(-count);}
async function fetchBiquote(tf,count){
  const direct=BIQUOTE_TF[tf],dailyNeeded=!direct;
  const interval=direct||'1d';
  const limit=dailyNeeded?1000:Math.min(1000,count);
  const u=new URL(`/api/XAUUSD/ohlc`,BIQUOTE_BASE);u.searchParams.set('interval',interval);u.searchParams.set('limit',String(limit));
  const tickUrl=new URL('/api/XAUUSD',BIQUOTE_BASE);
  const [barsRes,tickRes]=await Promise.all([fetch(u,{headers:{Accept:'application/json','User-Agent':'A.R.I.-Trading/1.0'},cache:'no-store'}),fetch(tickUrl,{headers:{Accept:'application/json','User-Agent':'A.R.I.-Trading/1.0'},cache:'no-store'})]);
  const d=await barsRes.json().catch(()=>null),tick=await tickRes.json().catch(()=>null);
  if(!barsRes.ok||!d||!Array.isArray(d.bars))throw new Error(`BIQUOTE_OHLC_${barsRes.status}`);
  let candles=d.bars.map(biquoteBar).filter(x=>Number.isFinite(x.t)&&Number.isFinite(x.o)&&Number.isFinite(x.h)&&Number.isFinite(x.l)&&Number.isFinite(x.c)).sort((a,b)=>a.t-b.t);
  if(dailyNeeded)candles=aggregateBars(candles,tf,count);else candles=candles.slice(-count);
  if(!candles.length)throw new Error('BIQUOTE_SIN_VELAS');
  const marketState=tickRes.ok&&tick?tick.marketState:null,stale=tickRes.ok&&tick?tick.stale:null,quoteAgeSeconds=tickRes.ok&&tick?tick.quoteAgeSeconds:null;
  if(marketState==='open'&&stale===true)throw new Error('BIQUOTE_TICK_STALE');
  return{ok:true,symbol:'XAUUSD',tf,source:'BIQUOTE XAUUSD · MT5',provider:'biquote',server_time:new Date().toISOString(),quote:{bid:tick?.bid??null,ask:tick?.ask??null,mid:tick?.mid??null,timestamp:tick?.timestamp??null,marketState,stale,quoteAgeSeconds},candles};
}
async function fetchOanda(tf,count,token){
  const granularity=TF_MAP[tf],env=String(process.env.ARI_OANDA_ENV||'live').toLowerCase(),base=process.env.ARI_OANDA_BASE_URL||(env==='practice'?'https://api-fxpractice.oanda.com':'https://api-fxtrade.oanda.com');
  const u=new URL('/v3/instruments/XAU_USD/candles',base);u.searchParams.set('price','M');u.searchParams.set('granularity',granularity);u.searchParams.set('count',String(Math.min(count,5000)));u.searchParams.set('smooth','false');u.searchParams.set('dailyAlignment','17');u.searchParams.set('alignmentTimezone','America/New_York');u.searchParams.set('weeklyAlignment','Friday');
  const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'}),d=await r.json().catch(()=>null);if(!r.ok||!d)throw new Error(`OANDA_${r.status}`);
  const candles=(d.candles||[]).map(x=>({t:Date.parse(x.time),o:+x.mid.o,h:+x.mid.h,l:+x.mid.l,c:+x.mid.c,v:+(x.volume||0),complete:x.complete!==false})).filter(x=>Number.isFinite(x.t)&&Number.isFinite(x.o));
  return{ok:true,symbol:'XAUUSD',tf,granularity,source:'OANDA XAU_USD',provider:'oanda',server_time:new Date().toISOString(),candles};
}
module.exports=async(req,res)=>{
  if(req.method!=='GET')return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  const tf=String(req.query.tf||'M15').toUpperCase(),granularity=TF_MAP[tf];if(!granularity)return send(res,400,{ok:false,error:'TF_INVALIDO'});
  const count=Math.max(50,Math.min(1200,Number(req.query.count)||700));
  try{
    const upstream=process.env.ARI_TRADING_FEED_URL;
    if(upstream){const u=new URL(upstream);u.searchParams.set('symbol','XAUUSD');u.searchParams.set('tf',tf);u.searchParams.set('count',String(count));const headers={'Accept':'application/json'};if(process.env.ARI_TRADING_FEED_TOKEN)headers.Authorization=`Bearer ${process.env.ARI_TRADING_FEED_TOKEN}`;const r=await fetch(u,{headers,cache:'no-store'});const d=await r.json().catch(()=>null);if(!r.ok||!d)throw new Error(`UPSTREAM_${r.status}`);return send(res,200,normalizeUpstream(d,tf));}
    const token=process.env.ARI_OANDA_API_TOKEN||process.env.OANDA_API_TOKEN;
    if(token)return send(res,200,await fetchOanda(tf,count,token));
    try{return send(res,200,await fetchBiquote(tf,count));}catch(freeError){return send(res,503,{ok:false,error:'FEED_REAL_NO_DISPONIBLE',zero_cost_attempt:'BIQUOTE',zero_cost_error:String(freeError.message||freeError).slice(0,160),fallback:'TRADINGVIEW_LIVE_SE_MANTIENE'});}
  }catch(e){return send(res,502,{ok:false,error:String(e.message||e).slice(0,180)});}
};