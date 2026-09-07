export default function handler(req,res){
  if(req.method==='GET')return res.status(200).json({ok:true,service:'ari-music-sync-log'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const body=req.body&&typeof req.body==='object'?req.body:{};
  const safe={
    event:'ARI_MUSIC_SYNC_POINTER',
    at:new Date().toISOString(),
    project:body.project||null,
    track:body.track||null,
    clip:body.clip||null,
    blobId:body.blobId||null,
    upload:body.upload||null
  };
  console.log('ARI_MUSIC_SYNC_POINTER',JSON.stringify(safe));
  return res.status(200).json({ok:true});
}
