const TF_MAP={M1:'M1',M5:'M5',M15:'M15',M30:'M30',H1:'H1',H4:'H4',D:'D',W:'W',MN:'M'};
function send(res,status,body){res.status(status).setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Content-Type','application/json; charset=utf-8');res.send(JSON.stringify(body));}
function normalizeUpstream(d,tf){const arr=(d.candles||d.data||[]).map(c=>({t:+(c.t??c.time??c.timestamp),o:+(c.o??c.open),h:+(c.h??c.high),l:+(c.l??c.low),c:+(c.c??c.close),v:+(c.v??c.volume??0),complete:c.complete!==false})).filter(c=>Number.isFinite(c.t)&&Number.isFinite(c.o)&&Number.isFinite(c.c));return{ok:true,symbol:'XAUUSD',tf,source:d.source||'A.R.I. UPSTREAM',server_time:new Date().toISOString(),candles:arr};}
module.exports=async(req,res)=>{
  if(req.method!=='GET')return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  const tf=String(req.query.tf||'M15').toUpperCase(),granularity=TF_MAP[tf];if(!granularity)return send(res,400,{ok:false,error:'TF_INVALIDO'});
  const count=Math.max(50,Math.min(1200,Number(req.query.count)||700));
  try{
    const upstream=process.env.ARI_TRADING_FEED_URL;
    if(upstream){const u=new URL(upstream);u.searchParams.set('symbol','XAUUSD');u.searchParams.set('tf',tf);u.searchParams.set('count',String(count));const headers={'Accept':'application/json'};if(process.env.ARI_TRADING_FEED_TOKEN)headers.Authorization=`Bearer ${process.env.ARI_TRADING_FEED_TOKEN}`;const r=await fetch(u,{headers,cache:'no-store'});const d=await r.json().catch(()=>null);if(!r.ok||!d)throw new Error(`UPSTREAM_${r.status}`);return send(res,200,normalizeUpstream(d,tf));}
    const token=process.env.ARI_OANDA_API_TOKEN||process.env.OANDA_API_TOKEN;if(!token)return send(res,503,{ok:false,error:'FEED_REAL_NO_CONFIGURADO',required:'ARI_TRADING_FEED_URL o ARI_OANDA_API_TOKEN server-side'});
    const env=String(process.env.ARI_OANDA_ENV||'live').toLowerCase(),base=process.env.ARI_OANDA_BASE_URL||(env==='practice'?'https://api-fxpractice.oanda.com':'https://api-fxtrade.oanda.com');
    const u=new URL('/v3/instruments/XAU_USD/candles',base);u.searchParams.set('price','M');u.searchParams.set('granularity',granularity);u.searchParams.set('count',String(Math.min(count,5000)));u.searchParams.set('smooth','false');u.searchParams.set('dailyAlignment','17');u.searchParams.set('alignmentTimezone','America/New_York');u.searchParams.set('weeklyAlignment','Friday');
    const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'}),d=await r.json().catch(()=>null);if(!r.ok||!d)throw new Error(`OANDA_${r.status}`);
    const candles=(d.candles||[]).map(x=>({t:Date.parse(x.time),o:+x.mid.o,h:+x.mid.h,l:+x.mid.l,c:+x.mid.c,v:+(x.volume||0),complete:x.complete!==false})).filter(x=>Number.isFinite(x.t)&&Number.isFinite(x.o));
    return send(res,200,{ok:true,symbol:'XAUUSD',tf,granularity,source:'OANDA XAU_USD',server_time:new Date().toISOString(),candles});
  }catch(e){return send(res,502,{ok:false,error:String(e.message||e).slice(0,180)});}
};