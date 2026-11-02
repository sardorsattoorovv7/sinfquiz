import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
export function ffprobePath(env=process.env){
 const custom=env.SPEAKING_FFPROBE_PATH?.trim();
 if(custom&&custom!=='ffprobe')return custom;
 try{return require('@ffprobe-installer/ffprobe').path;}catch{return custom||'ffprobe';}
}
