import {makeId,clamp} from './model.js';
export const TABLE_LIMIT=12;
export function newTable(rows=4,columns=3,attributes={}){
 rows=clamp(Math.floor(Number(rows)||4),1,TABLE_LIMIT);columns=clamp(Math.floor(Number(columns)||3),1,TABLE_LIMIT);
 return {id:makeId(),type:'table',x:120,y:120,w:1120,h:Math.min(760,Math.max(240,rows*62)),color:'auto',width:2,fontSize:30,header:true,cells:Array.from({length:rows},()=>Array(columns).fill('')),...attributes};
}
export function tableCellAt(table,point){
 if(point.x<table.x||point.y<table.y||point.x>=table.x+table.w||point.y>=table.y+table.h)return null;
 return {row:Math.floor((point.y-table.y)/table.h*table.cells.length),column:Math.floor((point.x-table.x)/table.w*table.cells[0].length)};
}
export function resizeTableCells(table,rows,columns){
 const n=newTable(rows,columns);return {...table,cells:n.cells.map((row,i)=>row.map((_,j)=>table.cells[i]?.[j]||''))};
}
