import {Vector3,Quaternion} from 'three';

const v=(x,y,z)=>new Vector3(x,y,z);
const clamp=t=>Math.min(1,Math.max(0,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
const mix=(a,b,t)=>a+(b-a)*t;

export function solveArm(start,target,pole,length=.47){
 const direction=target.clone().sub(start),distance=Math.min(length*2-.002,Math.max(.001,direction.length()));direction.normalize();
 const end=start.clone().addScaledVector(direction,distance);
 const perpendicular=pole.clone().addScaledVector(direction,-pole.dot(direction));if(perpendicular.lengthSq()<.001)perpendicular.set(0,0,1);perpendicular.normalize();
 const elbow=start.clone().addScaledVector(direction,distance/2).addScaledVector(perpendicular,Math.sqrt(Math.max(0,length*length-distance*distance/4)));
 return {elbow,end};
}

function fighter(seat,gap,t,engage,bias=0){
 const side=seat===0?-1:1,facing=-side,x=side*gap+bias;
 const breathe=Math.sin(t*2.2+seat*Math.PI)*.014;
 const crouch=.08*engage;
 const hip=v(x,1.02-crouch,0);
 const chest=v(x+facing*(.10+.09*engage),1.72-crouch+breathe,0);
 const joints={hip,chest,neck:chest.clone().add(v(facing*.01,.13,0)),head:chest.clone().add(v(facing*.05,.36,0))};
 for(const [key,z]of [['L',-.27],['R',.27]]){
  joints['shoulder'+key]=chest.clone().add(v(facing*.015,-.01,z));
  joints['hip'+key]=hip.clone().add(v(0,0,z*.62));
  const leadFoot=key===(seat===0?'R':'L');
  joints['ankle'+key]=v(x+(leadFoot?facing*.22:-facing*.18),.10,z*(1.08+.12*engage));
  joints['knee'+key]=joints['hip'+key].clone().lerp(joints['ankle'+key],.52).add(v(facing*(.13+.06*engage),.02,0));
  const guard=v(x+facing*.20,1.25,z*1.35);
  const lapel=v(-side*(gap-.30)+bias,1.61-crouch,-z*.28);
  const sleeve=v(-side*(gap-.43)+bias,1.43-crouch,z*.78);
  const target=guard.lerp(key==='R'?lapel:sleeve,engage);
  const arm=solveArm(joints['shoulder'+key],target,v(0,-1,z*2.2));
  joints['elbow'+key]=arm.elbow;joints['hand'+key]=arm.end;
 }
 return {seat,facing,joints,bodyRotation:0,action:'stance'};
}

function translate(p,delta){for(const point of Object.values(p.joints))point.add(delta)}
function transform(p,angle,center,translation=v(0,0,0)){
 const q=new Quaternion().setFromAxisAngle(v(0,0,1),angle);
 for(const point of Object.values(p.joints))point.sub(center).applyQuaternion(q).add(center).add(translation);
 p.bodyRotation+=angle;
}
function lowerUpperBody(p,amount,lean=0){
 const pivot=p.joints.hip.clone();
 for(const key of ['chest','neck','head','shoulderL','shoulderR'])p.joints[key].y-=amount;
 if(lean){const q=new Quaternion().setFromAxisAngle(v(0,0,1),lean);for(const key of ['chest','neck','head','shoulderL','shoulderR'])p.joints[key].sub(pivot).applyQuaternion(q).add(pivot)}
}
function retargetArm(p,key,target){
 const shoulder=p.joints['shoulder'+key];
 const arm=solveArm(shoulder,target,key==='L'?v(0,-1,-1):v(0,-1,1));
 p.joints['elbow'+key]=arm.elbow;p.joints['hand'+key]=arm.end;
}

export function sampleKurashPose({phase='waiting',startsAt=0,endedAt=0,result=null,players=[]},serverTime){
 const seconds=startsAt?(serverTime-startsAt)/1000:serverTime/1000;
 const approach=phase==='countdown'?smooth((seconds+3)/2.7):['running','finished'].includes(phase)?1:0;
 const gap=mix(1.30,.66,approach);
 const lead=(players[0]?.correct||0)-(players[1]?.correct||0);
 const pressure=phase==='running'?Math.sin(seconds*2.05)*.025+Math.max(-1,Math.min(1,lead))*.035:0;
 const pair=[fighter(0,gap,seconds,approach,pressure),fighter(1,gap,seconds,approach,pressure)];

 if(phase==='running'){
  const sway=Math.sin(seconds*2.05)*.035;
  translate(pair[0],v(sway,0,Math.sin(seconds*1.4)*.015));
  translate(pair[1],v(sway,0,-Math.sin(seconds*1.4)*.015));
  pair.forEach(p=>p.action='grip');
 }

 if(phase==='cancelled'||(phase==='finished'&&result?.kind==='draw')){
  const elapsed=(serverTime-(result?.animationAt||endedAt||serverTime))/1000;
  const release=smooth(elapsed/.55),step=smoother((elapsed-.30)/1.2);
  const draw=[fighter(0,.66+step*.58,seconds,1-release),fighter(1,.66+step*.58,seconds,1-release)];
  draw.forEach(p=>p.action=step>.8?'respect':'release');
  return draw;
 }

 if(phase!=='finished'||result?.kind!=='win'||serverTime<result.animationAt)return pair;

 const elapsed=(serverTime-result.animationAt)/1000;
 const winnerSeat=result.winnerSeat,loserSeat=1-winnerSeat,dir=winnerSeat===0?1:-1;
 const prepare=smooth(elapsed/.48);
 const entry=smoother((elapsed-.38)/.62);
 const load=smoother((elapsed-.90)/.55);
 const throwPhase=smoother((elapsed-1.30)/.82);
 const settle=smooth((elapsed-2.05)/.48);
 const celebrate=smooth((elapsed-2.55)/.72);
 const winner=pair[winnerSeat];
 const loser=fighter(loserSeat,.66,seconds,1,pressure);
 pair[loserSeat]=loser;

 translate(winner,v(dir*(.08*prepare+.16*entry),-.03*prepare*(1-settle),0));
 lowerUpperBody(winner,.16*prepare*(1-settle),-dir*.12*prepare*(1-settle));
 const frontKey=winnerSeat===0?'R':'L';
 winner.joints['ankle'+frontKey].x+=dir*.34*entry*(1-.65*settle);
 winner.joints['knee'+frontKey].x+=dir*.25*entry*(1-.65*settle);

 translate(loser,v(-dir*.24*prepare,-.02*prepare,0));
 const pivot=winner.joints.hip.clone().add(v(dir*.18,.24,0));
 const angle=-dir*(.30*load+(Math.PI/2-.30)*throwPhase);
 const lift=Math.sin(Math.PI*throwPhase)*.56+.24*load*(1-throwPhase);
 transform(loser,angle,pivot,v(dir*(.13*load+.63*throwPhase),lift,0));
 loser.action=throwPhase>.92?'landed':load>.15?'airborne':'off-balance';

 if(throwPhase>.02){
  const lowest=Math.min(...Object.values(loser.joints).map(point=>point.y));
  const desired=.14;
  const correction=settle>0?(desired-lowest)*settle:Math.max(0,desired-lowest);
  for(const point of Object.values(loser.joints))point.y+=correction;
 }

 for(const key of ['L','R']){
  const shoulder=winner.joints['shoulder'+key];
  const hold=(key==='R'?loser.joints.chest:loser.joints['shoulder'+(winnerSeat===0?'L':'R')]).clone();
  const release=shoulder.clone().add(v(-dir*.10,-.50,key==='L'?-.12:.12));
  const victory=shoulder.clone().add(v(-dir*.05,.72,key==='R'?.08:-.08));
  const target=hold.lerp(release,smooth((elapsed-1.78)/.35)).lerp(victory,key==='R'?celebrate:0);
  retargetArm(winner,key,target);
 }
 winner.action=celebrate>.2?'victory':entry>.2?'throw-entry':'grip';
 return pair;
}
