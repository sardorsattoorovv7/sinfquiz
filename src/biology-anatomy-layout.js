export const anatomicalPart=part=>part==='diaphragm'?'lungs':part;
export function sliceDefinition(axis,percent,bounds){const i={front:2,side:0,top:1}[axis]??2,p=Math.min(85,Math.max(0,Number(percent)||0)),normal=[0,0,0];normal[i]=-1;return {normal,constant:bounds.max[i]-(bounds.max[i]-bounds.min[i])*p/100};}
export function anatomyViewKeys(layer,organ){return layer==='outer'?['skin']:layer==='skeleton'?['skeleton']:layer==='muscles'?['skeleton','muscles']:layer==='inside'&&['skeleton','muscles','skin'].includes(organ)?[organ]:['organs','skin','lungs'];}
export function anatomyRenderKeys(layer,organ,isolate=false){return anatomyViewKeys(layer,organ).filter(k=>k!=='skin'||layer==='outer'||((isolate||layer==='inside')&&organ==='skin'));}
