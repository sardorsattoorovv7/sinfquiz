"""Package NASA VTAD models with smaller embedded textures; keep geometry intact."""
import pathlib, urllib.request, json, struct, io, hashlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parents[1] / 'public/space/v7.30'
root.mkdir(parents=True, exist_ok=True)
sources = {
 'earth': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/EarthClouds_1_12756.glb',
 'moon': 'https://solarsystem.nasa.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcllRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--7d626e5badbf2157a4fa43b9e891ab22ca767f3e/Moon_1_3474.glb',
}
manifest=[]
for name,url in sources.items():
 raw=urllib.request.urlopen(url, timeout=45).read()
 size,kind=struct.unpack_from('<II',raw,12)
 doc=json.loads(raw[20:20+size]); off=20+size
 bsize,bkind=struct.unpack_from('<II',raw,off); binary=raw[off+8:off+8+bsize]
 images={x['bufferView']:x for x in doc.get('images',[])}; parts=[]; pos=0
 for i,v in enumerate(doc['bufferViews']):
  data=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  if i in images:
   im=Image.open(io.BytesIO(data)).convert('RGB'); im.thumbnail((2048,1024))
   out=io.BytesIO(); im.save(out,format='JPEG',quality=88); data=out.getvalue(); images[i]['mimeType']='image/jpeg'
  pad=(-pos)%4; parts.append(b'\0'*pad); pos+=pad
  v['byteOffset']=pos; v['byteLength']=len(data); parts.append(data); pos+=len(data)
 doc['buffers'][0]['byteLength']=pos
 js=json.dumps(doc,separators=(',',':')).encode(); js+=b' '*((-len(js))%4)
 buf=b''.join(parts); buf+=b'\0'*((-len(buf))%4)
 packed=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
 path=root/(name+'-nasa.glb'); path.write_bytes(packed)
 manifest.append({'file':path.name,'bytes':len(packed),'sha256':hashlib.sha256(packed).hexdigest(),'source':url,'credit':'NASA / VTAD','changes':'Embedded textures reduced to 2048 px JPEG. Geometry unchanged.'})
 print(name,len(packed),flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
