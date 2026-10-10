import {BOARD_WIDTH as W,BOARD_HEIGHT as H,boardStyle,visibleInk,objectBounds,makeId,clamp} from './model.js';
const images=new Map();
export const clearBoardImageCache=()=>images.clear();
export function readyImages(objects) {
  return Promise.all(objects.filter(o=>o.type==='image').map(o=>{
    if(!images.has(o.src)) {
      const img=new Image(),promise=new Promise((resolve,reject)=>{img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Rasm ochilmadi.'));});
      images.set(o.src,{img,promise});img.src=o.src;
    }
    return images.get(o.src).promise;
  }));
}
function background(ctx,id) {
  const s=boardStyle(id);ctx.fillStyle=s.background;ctx.fillRect(0,0,W,H);
  const dark=['green','black','dark'].includes(id);ctx.strokeStyle=dark?'#ffffff13':'#22548420';ctx.lineWidth=1;
  if(['grid','coordinates','lines'].includes(s.pattern)) {
    ctx.beginPath();for(let y=50;y<H;y+=40){ctx.moveTo(0,y);ctx.lineTo(W,y);}
    if(s.pattern!=='lines')for(let x=0;x<W;x+=40){ctx.moveTo(x,0);ctx.lineTo(x,H);}
    ctx.stroke();
  }
  if(s.pattern==='dots') {ctx.fillStyle='#7897b6';for(let x=20;x<W;x+=40)for(let y=20;y<H;y+=40){ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}}
  if(s.pattern==='lines') {ctx.strokeStyle='#c6757555';ctx.beginPath();ctx.moveTo(80,0);ctx.lineTo(80,H);ctx.stroke();}
  if(s.pattern==='coordinates') {
    ctx.strokeStyle=s.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,450);ctx.lineTo(W,450);ctx.moveTo(800,0);ctx.lineTo(800,H);ctx.stroke();
    ctx.fillStyle=s.ink;ctx.font='18px system-ui';ctx.textAlign='center';
    for(let x=40;x<W;x+=40)if(x!==800)ctx.fillText(String((x-800)/40),x,475);
    ctx.textAlign='right';for(let y=50;y<H;y+=40)if(y!==450)ctx.fillText(String((450-y)/40),788,y+6);
    ctx.fillText('x',1585,435);ctx.fillText('y',787,22);ctx.textAlign='left';
  }
  if(s.pattern==='chalk'||s.pattern==='paper') {
    ctx.fillStyle=s.pattern==='chalk'?'#ffffff0c':'#704f1610';
    for(let i=0;i<1800;i++)ctx.fillRect((i*283)%W,(i*191)%H,1+(i%2),1);
  }
}
function wrappedLines(ctx,text,maxWidth) {
  const result=[];
  const push=part=>{
    if(ctx.measureText(part).width<=maxWidth){result.push(part);return;}
    let chunk='';for(const letter of part){if(chunk&&ctx.measureText(chunk+letter).width>maxWidth){result.push(chunk);chunk='';}chunk+=letter;}result.push(chunk);
  };
  for(const line of text.split('\n')) {
    let current='';for(const word of line.split(' ')) {const candidate=current?`${current} ${word}`:word;
      if(ctx.measureText(candidate).width>maxWidth&&current){push(current);current=word;}else current=candidate;}
    push(current);
  }
  return result;
}
let textContext;
export function fitTextObject(o) {
  if(o.type!=='text')return o;
  textContext ||= document.createElement('canvas').getContext('2d');
  const w=clamp(o.w,16,W-40),fontSize=clamp(o.fontSize,12,150);
  textContext.font=`600 ${fontSize}px system-ui, sans-serif`;
  const h=wrappedLines(textContext,o.text,w).length*fontSize*1.3;
  if(h>H-40)throw Error('Matn doskaga sig‘madi. Matnni qisqartiring, enini kattalashtiring yoki shriftni kichraytiring.');
  return {...o,w,h,fontSize,x:clamp(o.x,0,W-w),y:clamp(o.y,0,H-h)};
}
function drawObject(ctx,o,style) {
  ctx.save();const chalk=boardStyle(style).pattern==='chalk';ctx.strokeStyle=ctx.fillStyle=visibleInk(o.color,style,o.type==='text');
  ctx.lineWidth=o.width;ctx.lineCap=chalk?'butt':'round';ctx.lineJoin='round';
  if(o.dashed)ctx.setLineDash([12,10]);
  if(o.type==='stroke') {
    ctx.globalAlpha=o.brush==='highlight'?.24:o.brush==='marker'?.72:1;
    // Equal-pressure segments share a path: smooth ink without thousands of draw calls.
    let lastWidth=-1;
    for(let i=1;i<o.points.length;i++) {
      const a=o.points[i-1],b=o.points[i],nextWidth=o.width*(.45+.55*Math.round(b.pressure*20)/20);
      if(nextWidth!==lastWidth){if(lastWidth>=0)ctx.stroke();ctx.lineWidth=nextWidth;ctx.beginPath();ctx.moveTo(a.x,a.y);lastWidth=nextWidth;}
      ctx.lineTo(b.x,b.y);
    }
    if(lastWidth>=0)ctx.stroke();
    if(chalk&&o.brush!=='highlight') {
      ctx.globalAlpha=.18;ctx.strokeStyle=boardStyle(style).background;ctx.lineWidth=Math.max(1,o.width*.3);ctx.setLineDash([.7,3.2]);
      ctx.beginPath();o.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
    }
  } else if(o.type==='text') {
    ctx.font=`${chalk?'500':'600'} ${o.fontSize}px system-ui, sans-serif`;ctx.textBaseline='top';
    wrappedLines(ctx,o.text,o.w).forEach((line,i)=>ctx.fillText(line,o.x,o.y+i*o.fontSize*1.3));
  } else if(o.type==='image') {
    const img=images.get(o.src)?.img;if(img?.complete&&img.naturalWidth)ctx.drawImage(img,o.x,o.y,o.w,o.h);
  } else if(['line','arrow'].includes(o.type)) {
    const a={x:o.x+(o.flipX?o.w:0),y:o.y+(o.flipY?o.h:0)},b={x:o.x+(o.flipX?0:o.w),y:o.y+(o.flipY?0:o.h)};
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    if(o.type==='arrow') {const angle=Math.atan2(b.y-a.y,b.x-a.x),length=Math.max(18,o.width*4);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-length*Math.cos(angle-.45),b.y-length*Math.sin(angle-.45));ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-length*Math.cos(angle+.45),b.y-length*Math.sin(angle+.45));ctx.stroke();}
  } else {
    ctx.beginPath();if(o.type==='ellipse')ctx.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2,o.h/2,0,0,2*Math.PI);
    else if(o.type==='triangle'){ctx.moveTo(o.x+o.w/2,o.y);ctx.lineTo(o.x+o.w,o.y+o.h);ctx.lineTo(o.x,o.y+o.h);ctx.closePath();}
    else ctx.rect(o.x,o.y,o.w,o.h);ctx.stroke();
  }
  ctx.restore();
}
export function drawBoard(ctx,page,{draft=null,selected=null,scale=1}={}) {
  ctx.clearRect(0,0,W,H);background(ctx,page.style);
  const objects=draft?.objects||page.objects;
  objects.forEach(o=>drawObject(ctx,o,page.style));
  if(draft?.object)drawObject(ctx,draft.object,page.style);
  const picked=objects.find(o=>o.id===selected);
  if(picked) {
    const b=objectBounds(picked),size=10/Math.max(.15,scale);ctx.save();ctx.strokeStyle='#007c89';ctx.fillStyle='#ffffff';ctx.lineWidth=2/Math.max(.15,scale);ctx.setLineDash([6/scale,4/scale]);ctx.strokeRect(b.x-4,b.y-4,b.w+8,b.h+8);ctx.setLineDash([]);
    ctx.fillRect(b.x+b.w-size/2,b.y+b.h-size/2,size,size);ctx.strokeRect(b.x+b.w-size/2,b.y+b.h-size/2,size,size);ctx.restore();
  }
}
export async function rasterFromFile(file) {
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('PNG, JPG yoki WebP rasm tanlang.');
  if(file.size>8*1024*1024)throw Error('Rasm hajmi 8 MBdan oshmasin.');
  const src=URL.createObjectURL(file),img=new Image();
  try {
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Rasm fayli ochilmadi.'));img.src=src;});
    if(img.naturalWidth*img.naturalHeight>40000000)throw Error('Rasm o‘lchami juda katta. Kichikroq rasm tanlang.');
    const ratio=Math.min(1,1600/img.naturalWidth,1200/img.naturalHeight),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const data=canvas.toDataURL('image/webp',.86);
    if(data.length>4500000)throw Error('Siqilgan rasm ham juda katta. Kichikroq rasm tanlang.');
    const fit=Math.min(1,720/canvas.width,650/canvas.height),w=canvas.width*fit,h=canvas.height*fit;
    return {id:makeId(),type:'image',src:data,x:180,y:160,w,h,color:'auto',width:2};
  } finally {URL.revokeObjectURL(src);}
}
export async function exportBoard(page) {
  await readyImages(page.objects);const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;drawBoard(canvas.getContext('2d'),page);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Rasmni tayyorlab bo‘lmadi.');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`SinfQuiz-${page.name.replace(/[^\p{L}\p{N}\s_-]/gu,'').slice(0,50)||'doska'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
