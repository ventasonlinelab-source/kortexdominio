const { getVercelOidcToken } = require('@vercel/oidc');
const BASE='https://n8n.kortex10x.com/meta-ahora/corp-bridge/';
function send(res,status,body){res.status(status).setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Content-Type','application/json; charset=utf-8');res.send(JSON.stringify(body));}
function allowed(path){return path==='messages/unread'||/^messages\/conversation\/[A-Za-z0-9_-]+(?:\/(?:read|ignore|reply))?$/.test(path);}
module.exports=async(req,res)=>{
  if(!['GET','POST'].includes(req.method))return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  const path=String(req.query.path||'');
  if(!allowed(path))return send(res,400,{ok:false,error:'PATH_INVALID'});
  let token;
  try{token=await getVercelOidcToken();}catch{}
  if(!token)return send(res,503,{ok:false,error:'OIDC_UNAVAILABLE'});
  try{
    const r=await fetch(BASE+path,{method:req.method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},body:req.method==='POST'?JSON.stringify(req.body||{}):undefined,cache:'no-store'});
    const text=await r.text();let body;try{body=JSON.parse(text||'{}')}catch{body={ok:false,error:'UPSTREAM_NON_JSON'}}
    return send(res,r.status,body);
  }catch(e){return send(res,502,{ok:false,error:'BRIDGE_UNAVAILABLE'});}
};
