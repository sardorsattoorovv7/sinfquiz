import manifest from '../../public/informatics/v7.44/SOURCES.json' with {type:'json'};
export const INFORMATICS_ASSET_BASE='/informatics/v7.44/';
export const informaticsAssets=Object.freeze(Object.fromEntries(manifest.assets.map(asset=>[asset.id,Object.freeze(asset)])));
export function informaticsAssetUrl(id){if(!Object.hasOwn(informaticsAssets,id))throw Error('Noma’lum informatika modeli.');return INFORMATICS_ASSET_BASE+informaticsAssets[id].file;}
export const REAL_PART_POS={case:[0,2.265,0],motherboard:[-.84,2.7,.48],cpu:[-.66,3.32,.34],cooler:[-.34,3.32,.34],ram:[-.51,3.33,-.36],rom:[-.73,1.56,.08],hdd:[0,.47,-1.18],ssd:[.06,1.12,-1.16],nvme:[-.75,2.88,.16],gpu:[-.18,2.47,.5],psu:[0,.48,1.25],chipset:[-.76,2.07,-.12],cmos:[-.70,1.98,.38],sata:[-.72,1.51,-.72],pcie:[-.75,2.6,.8],io:[-.58,3.52,1.73],fan:[0,3.05,-2.02],cables:[-.44,2.9,-.7]};
// Extracted board regions retain the source board's calibration and location.
const board=informaticsAssets.motherboard.calibration;
for(const id of ['chipset','sata','pcie','io']){const a=informaticsAssets[id].calibration.anchor,d=a.map((v,i)=>(v-board.anchor[i])*board.scale),origin=REAL_PART_POS.motherboard;REAL_PART_POS[id]=[origin[0]+d[1],origin[1]-d[2],origin[2]-d[0]];}
REAL_PART_POS.gpu[1]=REAL_PART_POS.pcie[1]-.13;
export const REAL_PART_OFFSETS={case:[-2,0,0],motherboard:[-1.7,0,0],cpu:[.5,2.3,.3],cooler:[2.5,2.2,.6],ram:[1.3,1.8,-1.9],rom:[1.4,.2,-2.1],hdd:[.3,-.1,-2],ssd:[1,1,-2.2],nvme:[1.9,1.2,-1.3],gpu:[2.8,-.1,.1],psu:[-.4,-.1,2.2],chipset:[1.9,.7,-.5],cmos:[1.6,-.4,-.2],sata:[.6,-.5,-1.9],pcie:[1,-.1,1.4],io:[-.2,1,1.9],fan:[-.6,1,-1.8],cables:[1.2,-.5,-1.1]};
export const assetTotals=Object.freeze({count:manifest.assets.length,bytes:manifest.assets.reduce((n,a)=>n+a.bytes,0)});
