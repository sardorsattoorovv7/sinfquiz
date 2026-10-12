"""NASA Sun GLB, optimized embedded imagery. Previous NASA assets stay unchanged."""
import pathlib,urllib.request,json,struct,io,hashlib
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1]/'public/space/v7.31';root.mkdir(parents=True,exist_ok=True)
url='https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/s/Sun_1_1391000.glb'
raw=urllib.request.urlopen(url,timeout=35).read();size=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+size]);off=20+size;bsize=struct.unpack_from('<I',raw,off)[0];binary=raw[off+8:off+8+bsize]
images={im['bufferView']:im for im in doc.get('images',[])};parts=[];pos=0
for i,v in enumerate(doc['bufferViews']):
 data=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
 if i in images:
  im=Image.open(io.BytesIO(data)).convert('RGB');im.thumbnail((2048,1024));buf=io.BytesIO();im.save(buf,format='JPEG',quality=88);data=buf.getvalue();images[i]['mimeType']='image/jpeg'
 pad=(-pos)%4;parts.append(b'\0'*pad);pos+=pad;v['byteOffset']=pos;v['byteLength']=len(data);parts.append(data);pos+=len(data)
doc['buffers'][0]['byteLength']=pos;js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);buf=b''.join(parts);buf+=b'\0'*((-len(buf))%4)
out=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
path=root/'sun-nasa.glb';path.write_bytes(out);(root/'manifest.json').write_text(json.dumps([{'file':path.name,'bytes':len(out),'sha256':hashlib.sha256(out).hexdigest(),'source':url,'sourcePage':'https://science.nasa.gov/learn/heat/resource/sun-3d-model/','credit':'NASA / VTAD','rights':'NASA educational media guidelines; credit retained. No endorsement.','changes':'Embedded textures reduced to 2048 px JPEG. Geometry unchanged.'}],indent=2)+'\n');print('Sun GLB:',len(out),'bytes')
