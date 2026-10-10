export const BIOLOGY_ASSET_BASE='/biology/v7.21/';
export const BIOLOGY_ASSETS=Object.freeze({organs:'anatomy-organs.glb',lungs:'anatomy-lungs.glb',skeleton:'anatomy-skeleton.glb',skin:'anatomy-skin.glb',muscles:'anatomy-muscles.glb',eye:'anatomy-eye.glb',plant:'plant.glb',livingPlant:'living-plant.glb',seedling:'seedling.glb',flower:'flower.glb',leaf:'leaf.glb',tree:'tree.glb',fungus:'fungus.glb',fish:'fish.glb',fox:'fox.glb',bird:'bird.glb'});
export function biologyAssetUrl(key){if(typeof key!=='string'||!Object.hasOwn(BIOLOGY_ASSETS,key))throw new Error('Noma’lum biologiya modeli.');return BIOLOGY_ASSET_BASE+BIOLOGY_ASSETS[key]}
export function biologySceneAssets(scene){
 if(['leaf','soil','compost'].includes(scene))return ['leaf','livingPlant','plant','tree','fungus'];
 if(['seed','growth','photosynthesis','transport'].includes(scene))return ['livingPlant','seedling','plant'];
 if(scene==='pollination')return ['flower'];
 if(['habitat','adaptation','lifecycle','foodchain'].includes(scene))return ['fish','fox','bird','plant','leaf'];
 if(scene==='movement')return ['skeleton','muscles'];
 if(['breathing','circulation'].includes(scene))return ['organs','lungs'];
 if(['digestion','excretion','endocrine','reflex'].includes(scene))return ['organs'];
 if(scene==='senses')return ['organs','eye'];
 return [];
}
export const BIOLOGY_MODEL_SOURCES=Object.freeze([
 {name:'BodyParts3D · organlar, skelet va mushaklar',author:'Database Center for Life Science',license:'CC BY 4.0',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html'},
 {name:'O‘pka sirtlari · HuBMAP',author:'Kristen Browne; Heidi Schlehlein',license:'CC BY 4.0',url:'https://doi.org/10.48539/HBM532.KLZD.394'},
 {name:'Tirik o‘simlik',author:'Rico Cilliers · Poly Haven',license:'CC0',url:'https://polyhaven.com/a/potted_plant_02'},
 {name:'Gul · Empodium',author:'Jenelle van Heerden; Rico Cilliers · Poly Haven',license:'CC0',url:'https://polyhaven.com/a/flower_empodium'},
 {name:'O‘simlik, daraxt va zamburug‘',author:'Kenney · Nature Kit',license:'CC0',url:'https://kenney.nl/assets/nature-kit'},
 {name:'Qush',author:'Mesh2Motion contributors',license:'CC0',url:'https://github.com/Mesh2Motion/mesh2motion-app'},
 {name:'Baliq va tulki',author:'Microsoft; PixelMannen; tomkranis; AsoboStudio; scurest',license:'CC0 / CC BY 4.0',url:'https://github.com/KhronosGroup/glTF-Sample-Assets'},
]);
