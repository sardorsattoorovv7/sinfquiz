import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {graphicsBudget} from './island-clock.js';
import {ISLAND_ASSET} from './island-asset.js';
import {cachedGardenModel} from './garden-model-cache.js';

const output='\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
const palettes={
 day:{sky:'#e7ede5',horizon:'#f8f7f0',water:'#337080',foam:'#c3eee9',sun:'#fff4db',ambient:'#e8f6ff',ground:'#b2bab3'},
 dusk:{sky:'#bbc9bf',horizon:'#ece0cb',water:'#3c617a',foam:'#a7e6ed',sun:'#ffd3ac',ambient:'#d9e2f3',ground:'#a29fae'},
 night:{sky:'#0b1d35',horizon:'#233d5d',water:'#153b59',foam:'#7ccedf',sun:'#bfdcfc',ambient:'#b0c9ee',ground:'#738ba7'},
};
function mixColor(key,time){const c=new T.Color(0);for(const phase of ['day','dusk','night'])c.add(new T.Color(palettes[phase][key]).multiplyScalar(time[phase]));return c;}

function disposeObjects(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(object=>{
  if(object.geometry)geometries.add(object.geometry);
  if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material]){
   materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
  }
 });
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});
}

export function mountIslandWorld(host,initial,{onReady,onFail,onProgress}){
 let disposed=false,lost=false,visible=true,frame=0,last=0,elapsed=0,dirty=true,frames=0,slowFrames=0,live=initial,mixer,assetRoot,loaded=false,shadowTime=-1;
 const connection=navigator.connection,budgetForSize=()=>graphicsBudget({width:host.clientWidth,height:host.clientHeight,dpr:devicePixelRatio,cores:navigator.hardwareConcurrency,saveData:connection?.saveData});
 let budget=budgetForSize(),pixelRatio=budget.pixelRatio;
 const assetUrl=budget.low?ISLAND_ASSET.lowUrl:ISLAND_ASSET.url;
 const abort=new AbortController(),renderer=new T.WebGLRenderer({antialias:!budget.low,powerPreference:'low-power'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
 renderer.shadowMap.enabled=budget.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const canvas=renderer.domElement;canvas.className='island-webgl';canvas.setAttribute('aria-hidden','true');host.append(canvas);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-20,20,12,-12,.1,180);
 const orbit=new OrbitControls(camera,canvas),homePosition=new T.Vector3(28,22,36),homeTarget=new T.Vector3(0,0,0);
 camera.position.copy(homePosition);orbit.target.copy(homeTarget);orbit.enablePan=false;orbit.enableDamping=false;orbit.enableZoom=false;orbit.minZoom=.75;orbit.maxZoom=2;orbit.minPolarAngle=.4;orbit.maxPolarAngle=1.25;orbit.enabled=false;orbit.update();canvas.style.touchAction='pan-y';
 const ambient=new T.HemisphereLight(0xffffff,0x788a74,2.4),sun=new T.DirectionalLight(0xfff3da,2.6),rim=new T.DirectionalLight(0xc6e9ff,.65);
 sun.position.set(-22,32,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:95});sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;rim.position.set(12,18,-22);scene.add(ambient,sun,rim);
 const skyUniforms={uTop:{value:new T.Color()},uHorizon:{value:new T.Color()},uNight:{value:0}};
 const sky=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms:skyUniforms,depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}',
  fragmentShader:`uniform vec3 uTop;uniform vec3 uHorizon;uniform float uNight;varying vec2 vUv;void main(){vec3 col=mix(uHorizon,uTop,smoothstep(.12,1.,vUv.y));vec2 cell=floor(vUv*vec2(160.,90.));float seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);float star=step(.993,seed)*(1.-smoothstep(0.,.085,length(fract(vUv*vec2(160.,90.))-.5)))*smoothstep(.48,.8,vUv.y)*uNight;gl_FragColor=vec4(col+star*.55,1.);${output}}`,
 }));sky.frustumCulled=false;sky.renderOrder=-100;scene.add(sky);

 function environment(){
  const t=live.time;ambient.color.copy(mixColor('ambient',t));ambient.groundColor.copy(mixColor('ground',t));ambient.intensity=1.75+t.day*1.05+t.dusk*.4;
  sun.color.copy(mixColor('sun',t));sun.intensity=.85+t.day*1.7+t.dusk*.8;rim.intensity=.65+t.night*.65;
  skyUniforms.uTop.value.copy(mixColor('sky',t));skyUniforms.uHorizon.value.copy(mixColor('horizon',t));skyUniforms.uNight.value=t.night;
  renderer.shadowMap.needsUpdate=true;dirty=true;
 }
 function request(){if(!frame&&!disposed&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
 function suspend(){cancelAnimationFrame(frame);frame=0;last=0;}
 function draw(now){
  frame=0;if(disposed||lost||!visible||document.hidden)return;
  const dt=last?Math.min((now-last)/1000,.08):0;
  if(live.motion&&dt&&dt<1/budget.fps&&!dirty){frame=requestAnimationFrame(draw);return;}
  last=now;if(live.motion&&loaded){elapsed+=dt;mixer?.update(dt);orbit.autoRotate=!orbit.enabled;orbit.autoRotateSpeed=.22;orbit.update(dt);}
  const start=performance.now();renderer.render(scene,camera);const ms=performance.now()-start;frames++;dirty=false;
  if(ms>38)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
  if(slowFrames>30&&pixelRatio>.65){pixelRatio=Math.max(.65,pixelRatio*.8);renderer.setPixelRatio(pixelRatio);renderer.setSize(host.clientWidth,host.clientHeight,false);slowFrames=0;}
  canvas.__islandStats={frames,elapsed,drawMs:ms,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,width:canvas.width,height:canvas.height,quality:budget.low?'low':'standard',pixelRatio,azimuth:orbit.getAzimuthalAngle(),zoom:camera.zoom,phase:live.time.phase,paused:!live.motion,modelId:ISLAND_ASSET.id,modelLoaded:loaded,animationClips:mixer?1:0,autoOrbit:live.motion&&!orbit.enabled,assetUrl};
  if(live.motion&&loaded)request();
 }
 function resize(){
  if(disposed||lost)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  budget=budgetForSize();pixelRatio=budget.pixelRatio;renderer.setPixelRatio(pixelRatio);renderer.setSize(w,h,false);renderer.shadowMap.enabled=budget.shadows;renderer.shadowMap.needsUpdate=true;
  const aspect=w/h,half=Math.max(10,15.6/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();dirty=true;request();
 }
 const orbitChanged=()=>{dirty=true;request();},visibilityChanged=()=>{if(document.hidden)suspend();else{dirty=true;request();}};
 orbit.addEventListener('change',orbitChanged);document.addEventListener('visibilitychange',visibilityChanged);
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;canvas.__islandVisible=visible;if(!visible)suspend();else{dirty=true;request();}},{rootMargin:'40px'});observer.observe(host);
 const ro=new ResizeObserver(resize);ro.observe(host);
 const contextLost=e=>{e.preventDefault();lost=true;suspend();onFail({reason:'context'});};canvas.addEventListener('webglcontextlost',contextLost);

 async function loadAsset(){
  // The versioned local file uses HTTP cache; no third-party viewer or account.
  // Leaving home aborts the transport and disposes textures and geometry.
  const timeout=setTimeout(()=>abort.abort(new DOMException('Model request timed out.','TimeoutError')),45000);
  try{
   const response=await cachedGardenModel(assetUrl,{signal:abort.signal});
   if(!response.ok)throw new Error(`Model HTTP ${response.status}`);
   const total=Number(response.headers.get('content-length'))||0;let buffer;
   if(response.body&&total){
    const reader=response.body.getReader(),chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;chunks.push(value);if(!disposed)onProgress?.(Math.min(99,Math.round(size/total*100)));}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}buffer=bytes.buffer;
   }else buffer=await response.arrayBuffer();
   clearTimeout(timeout);if(disposed||lost)return;
   const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),gltf=await loader.parseAsync(buffer,'');
   if(disposed||lost){disposeObjects(gltf.scene);return;}
   assetRoot=gltf.scene;assetRoot.updateMatrixWorld(true);
   // Fit the complete licensed garden; retain all artist geometry and textures.
   const focus=assetRoot;
   const box=new T.Box3().setFromObject(focus),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=(budget.low?30:36)/Math.max(size.x,size.y,size.z);
   const fitted=new T.Group();fitted.name='GardenArtistModel';fitted.scale.setScalar(scale);fitted.position.copy(center).multiplyScalar(-scale);fitted.add(assetRoot);scene.add(fitted);
   assetRoot.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.frustumCulled=true;if(object.material)for(const m of Array.isArray(object.material)?object.material:[object.material])for(const value of Object.values(m))if(value?.isTexture)value.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}});
   if(gltf.animations.length){mixer=new T.AnimationMixer(assetRoot);for(const clip of gltf.animations)mixer.clipAction(clip).play();mixer.update(0);}
   await renderer.compileAsync(scene,camera);if(disposed||lost)return;
   loaded=true;environment();request();onProgress?.(100);onReady();
  }catch(error){if(!disposed&&!lost){suspend();onFail({reason:abort.signal.aborted?'timeout':'load',error});}}
  finally{clearTimeout(timeout);}
 }
 environment();resize();loadAsset();
 return {
  rotate(delta){camera.position.sub(orbit.target).applyAxisAngle(new T.Vector3(0,1,0),delta).add(orbit.target);orbit.update();dirty=true;request();},
  zoom(factor){camera.zoom=T.MathUtils.clamp(camera.zoom*factor,.75,2);camera.updateProjectionMatrix();dirty=true;request();},
  reset(){camera.position.copy(homePosition);orbit.target.copy(homeTarget);camera.zoom=1;camera.updateProjectionMatrix();orbit.update();dirty=true;request();},
  explore(value){orbit.enabled=value;orbit.autoRotate=!value&&live.motion;orbit.enableZoom=value;canvas.style.touchAction=value?'none':'pan-y';},
  update(next){live=next;orbit.autoRotate=next.motion&&!orbit.enabled;environment();if(!next.motion)suspend();request();},
  dispose(){
   disposed=true;abort.abort();suspend();ro.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibilityChanged);canvas.removeEventListener('webglcontextlost',contextLost);orbit.removeEventListener('change',orbitChanged);orbit.dispose();
   if(mixer){mixer.stopAllAction();mixer.uncacheRoot(assetRoot);}disposeObjects(scene);sun.shadow.dispose();
   const gl=renderer.getContext();renderer.dispose();if(!gl.isContextLost())renderer.forceContextLoss();canvas.remove();
  },
 };
}
