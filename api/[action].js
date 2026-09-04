const TARGETS={pending:['GET','crm-v1-hof385-pending'],reply:['POST','crm-v1-hof385-reply'],archive:['POST','crm-v1-hof385-archive'],'push-key':['GET','crm-v1-hof385-push-key'],'push-subscribe':['POST','crm-v1-hof385-push-subscribe']};
export default async function handler(req,res){
  try{
    const action=String(req.query.action||'');const target=TARGETS[action];
    if(!target)return res.status(404).json({ok:false,error:'not_found'});
    const [method,path]=target;if(req.method!==method)return res.status(405).json({ok:false,error:'method_not_allowed'});
    const oidc=process.env.VERCEL_OIDC_TOKEN;if(!oidc)return res.status(503).json({ok:false,error:'runtime_identity_unavailable'});
    const headers={authorization:`Bearer ${oidc}`,accept:'application/json'};let body;
    if(method==='POST'){headers['content-type']='application/json';body=JSON.stringify(req.body||{});}
    const upstream=await fetch(`https://n8n.kortex10x.com/webhook/${path}`,{method,headers,body,cache:'no-store'});
    const text=await upstream.text();res.setHeader('cache-control','no-store');res.status(upstream.status);
    try{return res.json(text?JSON.parse(text):{});}catch{return res.send(text);}
  }catch(e){return res.status(502).json({ok:false,error:'upstream_unavailable'});}
}
