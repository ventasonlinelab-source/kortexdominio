const BACKEND='https://n8n.kortex10x.com/ari-courses-api/';
function send(res,status,body){res.status(status);res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Content-Type','application/json; charset=utf-8');res.send(typeof body==='string'?body:JSON.stringify(body));}
function allowed(path,method){
  if(method==='GET'&&(path==='health'||path==='catalog'))return true;
  if(method==='GET'&&/^(course|lesson|media|progress)\/[A-Za-z0-9_-]+$/.test(path))return true;
  if(method==='PUT'&&/^progress\/[A-Za-z0-9_-]+$/.test(path))return true;
  return false;
}
module.exports=async(req,res)=>{
  const method=String(req.method||'GET').toUpperCase();
  const path=String(req.query.path||'').replace(/^\/+|\/+$/g,'');
  if(!allowed(path,method))return send(res,404,{ok:false,error:'NOT_FOUND'});
  const token=req.headers['x-vercel-oidc-token']||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return send(res,503,{ok:false,error:'OIDC_UNAVAILABLE'});
  try{
    const headers={Authorization:`Bearer ${token}`,Accept:'application/json'};
    let body;
    if(method==='PUT'){
      headers['Content-Type']='application/json';
      body=JSON.stringify(req.body&&typeof req.body==='object'?req.body:{});
    }
    const r=await fetch(BACKEND+path,{method,headers,body,cache:'no-store'});
    const text=await r.text();
    let out; try{out=JSON.parse(text)}catch{out={ok:false,error:'UPSTREAM_INVALID_JSON'}}
    return send(res,r.status,out);
  }catch(e){return send(res,502,{ok:false,error:'UPSTREAM_UNAVAILABLE',detail:String(e.message||e).slice(0,120)});}
};
