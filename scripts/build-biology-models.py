"""Convert licensed, existing meshes to self-contained school GLBs. No anatomy is generated.

Optional rebuilding: python build-biology-models.py SOURCE_DIRECTORY
Requires numpy, Pillow and fast-simplification; production uses the bundled GLBs.
Official source URLs and license history are recorded in BIOLOGY-MODELS-7.21.md.
"""
from pathlib import Path
from collections import defaultdict
import json, struct, zipfile, hashlib, io, sys, re, csv
import numpy as np
from PIL import Image
import fast_simplification

SOURCE = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[1] / 'public/biology/v7.21'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {'version':'7.21.0', 'coordinateNote':'BodyParts3D mm → (x, z, −y)/200; y -= 4.25. No independent organ repositioning.', 'assets':{}}

def save_glb(name, doc, binary):
    doc['buffers']=[{'byteLength':len(binary)}]
    a=json.dumps(doc, separators=(',',':'),ensure_ascii=False).encode(); a+=b' '*((-len(a))%4)
    b=bytes(binary)+b'\0'*((-len(binary))%4)
    result=struct.pack('<III',0x46546c67,2,12+8+len(a)+8+len(b))+struct.pack('<II',len(a),0x4e4f534a)+a+struct.pack('<II',len(b),0x004e4942)+b
    (OUT/name).write_bytes(result)
    return result

def glb_doc(data):
    length,kind=struct.unpack_from('<II',data,12); assert kind==0x4e4f534a
    d=json.loads(data[20:20+length]); offset=20+length
    if offset<len(data): size,kind=struct.unpack_from('<II',data,offset);b=data[offset+8:offset+8+size]
    else:b=b''
    return d,b

def repack(name, doc, binary, source, license, author):
    # Copy all buffer views, resizing only embedded texture images for mobile.
    views=doc.get('bufferViews',[]);image_views={im['bufferView']:im for im in doc.get('images',[]) if 'bufferView' in im}
    result=bytearray()
    for i,v in enumerate(views):
        chunk=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
        if i in image_views:
            image=Image.open(io.BytesIO(chunk));image.thumbnail((1024,1024));buf=io.BytesIO()
            if image.mode in ('RGBA','LA'):image.save(buf,format='PNG',optimize=True);mime='image/png'
            else:image.convert('RGB').save(buf,format='JPEG',quality=86);mime='image/jpeg'
            chunk=buf.getvalue();image_views[i]['mimeType']=mime
        result.extend(b'\0'*((-len(result))%4));v['buffer']=0;v['byteOffset']=len(result);v['byteLength']=len(chunk);result.extend(chunk)
    doc.setdefault('asset',{})['extras']={'source':source,'license':license,'author':author,'adaptation':'Embedded files, maximum 1024px textures. Geometry/rig preserved.'}
    data=save_glb(name,doc,result)
    manifest['assets'][name]={'source':source,'license':license,'author':author,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def table(name):
    d=defaultdict(list)
    for line in (SOURCE/name).read_text().splitlines()[1:]:
        cells=line.split('\t')
        if len(cells)==3:d[cells[0]].append(cells[2])
    return d

part_table=table('partof_element_parts.txt');isa_table=table('isa_element_parts.txt')
archives=[zipfile.ZipFile(SOURCE/n) for n in ['partof_BP3D_4.0_obj_99.zip','isa_BP3D_4.0_obj_99.zip']]
lookup={}
for archive in archives:
    for n in archive.namelist():
        if n.endswith('.obj'):lookup.setdefault(Path(n).stem,(archive,n))
headers={}
for fj,(archive,n) in lookup.items():
    text=archive.read(n).decode();head=text.split('\nv ',1)[0]
    headers[fj]={'name':re.search(r'English name\s*:\s*(.*)',head).group(1),'fma':re.search(r'Concept ID\s*:\s*(.*)',head).group(1)}

def fids(*fmas):return sorted(set(fj for fma in fmas for fj in (isa_table.get(fma) or part_table.get(fma) or []) if fj in lookup))

def obj(fj):
    archive,path=lookup[fj];vertices=[];faces=[]
    for line in archive.read(path).decode().splitlines():
        if line.startswith('v '):vertices.append([float(v) for v in line.split()[1:4]])
        elif line.startswith('f '):
            ids=[int(v.split('/')[0])-1 for v in line.split()[1:]]
            for i in range(1,len(ids)-1):faces.append([ids[0],ids[i],ids[i+1]])
    p=np.asarray(vertices,dtype=np.float64);p=p[:,[0,2,1]]/200;p[:,1]-=4.25;p[:,2]*=-1
    return p,np.asarray(faces,dtype=np.int32)

def anatomy_asset(filename,specs,source='https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',author='Database Center for Life Science (DBCLS)',source_label='BodyParts3D 4.0',credit='BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International'):
    binary=bytearray();doc={'asset':{'version':'2.0','generator':'SinfQuiz BodyParts3D converter','copyright':credit},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'bufferViews':[],'accessors':[]}
    summary=[]
    def accessor(a,kind,component,target):
        binary.extend(b'\0'*((-len(binary))%4));offset=len(binary);binary.extend(a.tobytes())
        view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes,'target':target})
        entry={'bufferView':view,'componentType':component,'count':len(a),'type':kind}
        if kind=='VEC3':entry.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
        doc['accessors'].append(entry);return len(doc['accessors'])-1
    for key,part,label,ids,color,limit in specs:
        if not ids:continue
        vertices=[];faces=[];offset=0
        for fj in ids:
            p,f=obj(fj);vertices.append(p);faces.append(f+offset);offset+=len(p)
        p=np.concatenate(vertices);f=np.concatenate(faces)
        original_faces=len(f)
        if len(f)>limit:p,f=fast_simplification.simplify(p,f,target_count=limit,agg=7)
        normals=np.zeros(p.shape)
        n=np.cross(p[f[:,1]]-p[f[:,0]],p[f[:,2]]-p[f[:,0]])
        for i in range(3):np.add.at(normals,f[:,i],n)
        norms=np.linalg.norm(normals,axis=1);normals/=np.where(norms>0,norms,1)[:,None]
        pos=accessor(p.astype('<f4'),'VEC3',5126,34962);normal=accessor(normals.astype('<f4'),'VEC3',5126,34962)
        dtype='<u2' if len(p)<65536 else '<u4';index=accessor(f.reshape(-1).astype(dtype),'SCALAR',5123 if dtype=='<u2' else 5125,34963)
        srgb=[int(color[i:i+2],16)/255 for i in (0,2,4)];rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb]
        material=len(doc['materials']);doc['materials'].append({'name':label,'pbrMetallicRoughness':{'baseColorFactor':rgb+[1],'metallicFactor':0,'roughnessFactor':.57},'doubleSided':True})
        extras={'part':part,'label':label,'key':key,'sourceIds':ids,'fmaIds':sorted(set(headers[x]['fma'] for x in ids)),'source':source_label,'license':'CC-BY-4.0'}
        mesh=len(doc['meshes']);doc['meshes'].append({'name':key,'primitives':[{'attributes':{'POSITION':pos,'NORMAL':normal},'indices':index,'material':material}]})
        node=len(doc['nodes']);doc['nodes'].append({'name':key,'mesh':mesh,'extras':extras});doc['scenes'][0]['nodes'].append(node)
        summary.append({**extras,'triangles':len(f),'sourceTriangles':original_faces,'bounds':[p.min(axis=0).tolist(),p.max(axis=0).tolist()]})
    data=save_glb(filename,doc,binary)
    manifest['assets'][filename]={'source':source,'license':'CC-BY-4.0','author':author,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'structures':summary}
    print(filename,len(data),sum(s['triangles'] for s in summary),'triangles',flush=True)

specs=[]
def add(key,part,label,fmas,color='c48288',limit=6500):specs.append((key,part,label,fids(*fmas),color,limit))
add('brain','brain','Bosh miya',['FMA50801'],'c593a4',14000)
heart_ids=fids('FMA7088');assigned=set()
chambers=[('right-atrium','O‘ng bo‘lmacha devori','FMA9457'),('left-atrium','Chap bo‘lmacha devori','FMA9531'),('right-ventricle','O‘ng qorincha devori','FMA9533'),('left-ventricle','Chap qorincha devori','FMA9556')]
for key,label,fma in chambers:
    ids=[i for i in fids(fma) if i not in assigned];assigned.update(ids)
    specs.append((key,'heart',label,ids,'ad596d' if 'left' in key else 'c07d89',3500))
specs.append(('heart-vessels','heart','Yurakning boshqa qismlari',sorted(set(heart_ids)-assigned),'b46b75',5000))
add('right-bronchial-tree','lungs','O‘ng o‘pkaning bronx va tomirlari',['FMA7309'],'d0a0ae',8000);add('left-bronchial-tree','lungs','Chap o‘pkaning bronx va tomirlari',['FMA7310'],'d0a0ae',8000)
add('trachea','lungs','Traxeya va asosiy bronxlar',['FMA7394','FMA7395','FMA7396'],'d4b7a2',4500)
add('diaphragm','diaphragm','Diafragma',['FMA13295'],'b27573',4500)
add('liver','liver','Jigar',['FMA7197'],'8d5050',6500)
add('stomach','stomach','Oshqozon',['FMA7148'],'d2a58f',6500)
add('esophagus','stomach','Qizilo‘ngach',['FMA7131'],'c5a18d',3500)
add('pancreas','pancreas','Oshqozon osti bezi',['FMA7198'],'c6ad6f',4500)
add('small-intestine','intestine','Ingichka ichak',['FMA7200'],'d7ad99',11000)
add('large-intestine','intestine','Yo‘g‘on ichak',['FMA7201'],'bb8c77',9000)
add('right-kidney','kidneys','O‘ng buyrak',['FMA7204'],'a76665',6000);add('left-kidney','kidneys','Chap buyrak',['FMA7205'],'a76665',6000)
add('spinal-cord','brain','Orqa miya markaziy kanali',['FMA7647'],'d9bc88',3000)
anatomy_asset('anatomy-organs.glb',specs)
anatomy_asset('anatomy-skin.glb',[('skin','skin','Tashqi tana',fids('FMA7163'),'ccb19e',20000)])

bone_groups=defaultdict(list)
# The part-of skeleton aggregate includes soft cranial contents and omits limbs.
# Select actual, named bone meshes instead; never call an eyeball a skull bone.
bone_names=r'^(?:(?:left|right) )?(?:(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|[0-9]+) )?(?:humerus|radius|ulna|femur|tibia|fibula|patella|clavicle|scapula|sternum|sacrum|coccyx|talus|calcaneus|[a-z -]*vertebra|[a-z -]*rib|[a-z -]*phalanx(?: of [a-z -]+)?|[a-z -]*bone)$'
for fj in sorted(lookup):
    text=headers[fj]['name'].lower()
    if not re.fullmatch(bone_names,text) or any(x in text for x in ['hyoid muscle','cartilage']):continue
    if any(x in text for x in ['vertebra','sacrum','coccyx']):k=('spine','Umurtqa pog‘onasi')
    elif any(x in text for x in ['rib','sternum']):k=('ribcage','Ko‘krak qafasi suyaklari')
    elif any(x in text for x in ['femur','patella']):k=('thigh','Son suyagi va tizza qopqog‘i')
    elif any(x in text for x in ['tibia','fibula']):k=('shin','Boldir suyaklari')
    elif 'humerus' in text:k=('upper-arm','Yelka suyaklari')
    elif any(x in text for x in ['radius','ulna']):k=('forearm','Bilak suyaklari')
    elif any(x in text for x in ['hip bone','pelvis','ilium','ischium','pubis']):k=('pelvis','Chanoq suyaklari')
    elif any(x in text for x in ['scapula','clavicle']):k=('shoulder','Kurak va o‘mrov')
    elif any(x in text for x in ['tarsal','metatars','talus','calcaneus','cuboid','navicular','cuneiform','foot']):k=('feet','Oyoq panjasi suyaklari')
    elif any(x in text for x in ['carpal','metacarp','scaphoid','lunate','triquetr','pisiform','trapez','capitate','hamate','hand']):k=('hands','Qo‘l panjasi suyaklari')
    elif 'phalanx' in text:k=('digits','Barmoq suyaklari')
    else:k=('skull','Bosh suyagi qismlari')
    if k[0] in ['upper-arm','forearm']:
        side='right' if 'right' in text else 'left';k=(k[0]+'-'+side,k[1]+(' · o‘ng' if side=='right' else ' · chap'))
    bone_groups[k].append(fj)
anatomy_asset('anatomy-skeleton.glb',[(key,'skeleton',label,ids,'e9dfc7',8000) for (key,label),ids in bone_groups.items()])
muscles=[('pectoralis','Ko‘krak mushaklari',['FMA13373','FMA13374']),('deltoid','Deltasimon mushak',['FMA34676']),('biceps','Yelkaning ikki boshli mushagi',['FMA37682','FMA37683']),('triceps','Yelkaning uch boshli mushagi',['FMA37692','FMA37693','FMA37694']),('abdomen','Qorin mushaklari',['FMA78435']),('quadriceps','Sonning to‘rt boshli mushagi',['FMA22429']),('gluteus','Dumba mushaklari',['FMA22314']),('calf','Boldir mushaklari',['FMA45950'])]
anatomy_asset('anatomy-muscles.glb',[(key,'muscles',label,fids(*ids),'b5716c',9000) for key,label,ids in muscles])
anatomy_asset('anatomy-eye.glb',[('eye','eye','Ko‘z olmasi',[fj for fj in fids('FMA12514') if 'left' not in headers[fj]['name'].lower()],'ded5c3',5500)])

# HuBMAP lung segments retain pair-wise source coordinates, uniformly fitted
# to the educational BodyParts3D chest. This is a composite reference, not a
# single-person clinical scan. The bronchial trees remain separate structures.
hra=json.loads((SOURCE/'hra-lung-meshes.json').read_text())
crosswalk={r['node_name']:r['OntologyID'] for r in csv.DictReader((SOURCE/'hra-lung-crosswalk.csv').read_text().splitlines())}
allp=np.concatenate([np.asarray(n['position']).reshape(-1,3) for n in hra]);c=(allp.min(axis=0)+allp.max(axis=0))/2;scale=1.34/(allp.max(axis=0)[1]-allp.min(axis=0)[1])
hra_meshes={n['name']:((np.asarray(n['position']).reshape(-1,3)-c)*scale+np.array([0,1.92,.53]),np.asarray(n['index'],dtype=np.int32).reshape(-1,3)) for n in hra}
original_obj=obj
def obj(fj):return hra_meshes[fj] if fj in hra_meshes else original_obj(fj)
for name in hra_meshes:headers[name]={'name':name,'fma':crosswalk.get(name,'UBERON:0002048').replace('FMA:','FMA')}
lung_specs=[]
for side,label in [('right','O‘ng o‘pka'),('left','Chap o‘pka')]:
    ids=[n['name'] for n in hra if '_'+side+'_' in n['name']]
    lung_specs.append((side+'-lung','lungs',label,ids,'c78f9e',16000))
anatomy_asset('anatomy-lungs.glb',lung_specs,source='https://purl.humanatlas.io/ref-organ/lung-male/v1.4',author='Kristen Browne; Heidi Schlehlein / Human Reference Atlas, HuBMAP',source_label='HuBMAP Lung Male v1.4',credit='Kristen Browne; Heidi Schlehlein / Human Reference Atlas, HuBMAP. CC BY 4.0. Uniformly aligned and simplified for SinfQuiz.')
(OUT/'HuBMAP-Lung-metadata.yaml').write_bytes((SOURCE/'hra-lung-metadata.yaml').read_bytes())
(OUT/'HuBMAP-Lung-crosswalk.csv').write_bytes((SOURCE/'hra-lung-crosswalk.csv').read_bytes())

with zipfile.ZipFile(SOURCE/'kenney_nature-kit.zip') as archive:
    for src,dst in [('plant_flatTall','plant'),('flower_redA','flower'),('tree_oak','tree'),('mushroom_tan','fungus'),('crops_leafsStageA','seedling'),('grass_leafs','leaf')]:
        data=archive.read('Models/GLTF format/'+src+'.glb');doc,b=glb_doc(data)
        repack(dst+'.glb',doc,b,'https://kenney.nl/assets/nature-kit','CC0-1.0','Kenney')
    (OUT/'Kenney-License.txt').write_bytes(archive.read('License.txt'))
for src,dst,lic,author in [('BarramundiFish','fish','CC0-1.0','Microsoft'),('Fox','fox','CC-BY-4.0 (rig/conversion); CC0-1.0 (geometry)','PixelMannen; tomkranis; AsoboStudio; scurest')]:
    doc,b=glb_doc((SOURCE/(src+'.glb')).read_bytes());repack(dst+'.glb',doc,b,'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/'+src,lic,author)
    (OUT/(src+'-README.md')).write_bytes((SOURCE/(src+'-README.md')).read_bytes())

plant=SOURCE/'polyhaven-plant';doc=json.loads((plant/'potted_plant_02.gltf').read_text());binary=bytearray((plant/doc['buffers'][0]['uri']).read_bytes())
for image in doc.get('images',[]):
    p=plant/image.pop('uri');data=p.read_bytes();binary.extend(b'\0'*((-len(binary))%4));offset=len(binary);binary.extend(data)
    image.update(bufferView=len(doc['bufferViews']),mimeType='image/jpeg');doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data)})
repack('living-plant.glb',doc,binary,'https://polyhaven.com/a/potted_plant_02','CC0-1.0','Rico Cilliers / Poly Haven')
# Photographic flower replaces the low-detail decorative flower mesh.
f=SOURCE/'polyhaven-flower';fd=json.loads((f/'flower_empodium.gltf').read_text());fb=bytearray((f/fd['buffers'][0]['uri']).read_bytes())
for image in fd.get('images',[]):
    path=f/image.pop('uri');data=path.read_bytes();fb.extend(b'\0'*((-len(fb))%4));offset=len(fb);fb.extend(data)
    image.update(bufferView=len(fd['bufferViews']),mimeType='image/jpeg');fd['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data)})
repack('flower.glb',fd,fb,'https://polyhaven.com/a/flower_empodium','CC0-1.0','Jenelle van Heerden (photography); Rico Cilliers (modeling) / Poly Haven')
bird_doc,bird_bin=glb_doc((SOURCE/'Mesh2Motion-Bird.glb').read_bytes())
repack('bird.glb',bird_doc,bird_bin,'https://github.com/Mesh2Motion/mesh2motion-app/blob/main/static/models/model-bird.glb','CC0-1.0','Mesh2Motion contributors')
(OUT/'Mesh2Motion-CC0.md').write_bytes((SOURCE/'Mesh2Motion-CC0.md').read_bytes())
(OUT/'Mesh2Motion-README.md').write_bytes((SOURCE/'Mesh2Motion-README.md').read_bytes())
(OUT/'BodyParts3D-license.txt').write_bytes((SOURCE/'BodyParts3D-license.html').read_bytes())
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Total model bytes:',sum(a['bytes'] for a in manifest['assets'].values()),flush=True)
