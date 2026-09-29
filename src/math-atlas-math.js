export const round=(value,digits=2)=>Number.isFinite(value)?Number(value.toFixed(digits)):0;
export const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
export const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export function triangleMeasures(a,b,c){
 const sideA=distance(b,c),sideB=distance(a,c),base=distance(a,b);
 const signed=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const area=Math.abs(signed)/2, height=base?2*area/base:0;
 const angle=(u,v,w)=>{const p={x:u.x-v.x,y:u.y-v.y},q={x:w.x-v.x,y:w.y-v.y};return Math.atan2(Math.abs(p.x*q.y-p.y*q.x),p.x*q.x+p.y*q.y)*180/Math.PI};
 return {base,height,area,sides:[sideA,sideB,base],angles:[angle(b,a,c),angle(a,b,c),angle(a,c,b)]};
}
export const lineY=(m,b,x)=>m*x+b;
export const lineTable=(m,b)=>[-2,-1,0,1,2,3].map(x=>({x,y:lineY(m,b,x)}));
export const equationSolution=(count,extra,total)=>count?((total-extra)/count):null;
export function transformPoint(point,{dx=0,dy=0,angle=0,scale=1,reflect=false}={}){
 const x=(reflect?-point.x:point.x)*scale,y=point.y*scale,r=angle*Math.PI/180;
 return {x:x*Math.cos(r)-y*Math.sin(r)+dx,y:x*Math.sin(r)+y*Math.cos(r)+dy};
}
export function polygonArea(points){return Math.abs(points.reduce((sum,p,i)=>sum+p.x*points[(i+1)%points.length].y-p.y*points[(i+1)%points.length].x,0))/2}
export function solidMeasures(kind,{a=3,b=2,c=2,r=2,h=3}={}){
 const pi=Math.PI,slant=Math.hypot(r,h);
 switch(kind){
  case 'cube':return {volume:a**3,surface:6*a*a,faces:6,edges:12,vertices:8,formula:'V = a³; S = 6a²',net:'6 ta kvadrat'};
  case 'cuboid':return {volume:a*b*c,surface:2*(a*b+a*c+b*c),faces:6,edges:12,vertices:8,formula:'V = abc; S = 2(ab + ac + bc)',net:'6 ta to‘g‘ri to‘rtburchak'};
  case 'prism':return {volume:a*b*h/2,surface:a*b+(a+b+Math.hypot(a,b))*h,faces:5,edges:9,vertices:6,formula:'V = B·h; B = ab/2',net:'2 ta uchburchak, 3 ta to‘rtburchak'};
  case 'pyramid':return {volume:a*a*h/3,surface:a*a+2*a*Math.hypot(a/2,h),faces:5,edges:8,vertices:5,formula:'V = a²h/3',net:'1 ta kvadrat, 4 ta uchburchak'};
  case 'cylinder':return {volume:pi*r*r*h,surface:2*pi*r*(r+h),faces:2,curvedSurfaces:1,edges:2,vertices:0,formula:'V = πr²h; S = 2πr(r + h)',net:'2 ta doira va 1 ta to‘g‘ri to‘rtburchak'};
  case 'cone':return {volume:pi*r*r*h/3,surface:pi*r*(r+slant),faces:1,curvedSurfaces:1,edges:1,vertices:1,formula:'V = πr²h/3; S = πr(r + l)',net:'1 ta doira va 1 ta sektor'};
  case 'sphere':return {volume:4*pi*r**3/3,surface:4*pi*r*r,faces:0,curvedSurfaces:1,edges:0,vertices:0,formula:'V = 4πr³/3; S = 4πr²',net:'Shar sirtini tekislikka cho‘zmasdan yoyib bo‘lmaydi'};
  default:throw Error('Noma’lum jism');
 }
}
