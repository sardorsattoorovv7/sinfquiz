"""Original course transcripts -> local, explicitly labelled Flite synthetic speech."""
import json,hashlib,subprocess,tempfile,os,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parent.parent
lessons=json.loads((root/'generated/english-course.json').read_text())
out=root/'public/english-course/v7.23';out.mkdir(parents=True,exist_ok=True)
def render(item):
    name,text,voice=item;p=out/(name+'.mp3')
    digest=hashlib.sha256(text.encode()).hexdigest()
    with tempfile.NamedTemporaryFile(mode='w',suffix='.txt',delete=False) as f:
        f.write(text);src=f.name
    fd,audio_tmp=tempfile.mkstemp(suffix='.mp3');os.close(fd)
    try:
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i',f'flite=textfile={src}:voice={voice}','-ar','16000','-ac','1','-b:a','40k','-y',audio_tmp],check=True)
        duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',audio_tmp]))
        data=Path(audio_tmp).read_bytes()
        if len(data)<1500 or duration<1:raise ValueError(name)
        atomic=out/(name+'.new')
        with open(atomic,'wb') as dst:
            dst.write(data);dst.flush();os.fsync(dst.fileno())
        os.replace(atomic,p)
        return {'file':name+'.mp3','transcript':text,'transcriptSha256':digest,'audioSha256':hashlib.sha256(data).hexdigest(),'seconds':duration,'voice':voice,'synthetic':True}
    finally:
        os.unlink(src);os.unlink(audio_tmp)
items=[]
for i,l in enumerate(lessons):
    items.extend([(l['id'],l['listening']['transcript'],'slt' if i%2 else 'rms'),(l['id']+'-dictation',l['pronunciation']['text'],'slt')])
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    manifest=list(pool.map(render,items))
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(f'{len(manifest)} audio files verified')
