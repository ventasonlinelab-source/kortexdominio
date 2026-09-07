export default async function handler(req,res){
  try{
    const oidc=process.env.VERCEL_OIDC_TOKEN;
    if(!oidc)return res.status(500).json({ok:false,error:'oidc_unavailable'});
    const rawPath=String(req.query?.path||'').replace(/^\/+/, '');
    const allowed=/^(health|ahora|calendar\/status|messages\/pending|messages\/conversation\/[A-Za-z0-9_.:-]+(?:\/(?:ignore|reply))?)$/;
    if(!allowed.test(rawPath))return res.status(400).json({ok:false,error:'bad_path'});
    const target='https://n8n.kortex10x.com/meta-ahora/corp-bridge/'+rawPath;
    const method=req.method==='POST'?'POST':'GET';
    const upstream=await fetch(target,{
      method,
      headers:{'Authorization':'Bearer '+oidc,'Content-Type':'application/json','Accept':'application/json'},
      body:method==='POST'?JSON.stringify(req.body||{}):undefined,
      cache:'no-store'
    });
    const text=await upstream.text();
    res.setHeader('Cache-Control','no-store');
    res.status(upstream.status);
    try{return res.json(JSON.parse(text));}catch{return res.send(text);}
  }catch(e){return res.status(502).json({ok:false,error:'bridge_unavailable'});}
}
