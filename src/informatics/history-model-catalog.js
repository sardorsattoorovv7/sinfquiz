import manifest from '../../public/informatics/v7.44/history/SOURCES.json' with {type:'json'};
export const historicalModels=Object.freeze(Object.fromEntries(manifest.models.map(m=>[m.id,Object.freeze(m)])));
export function historicalEmbedUrl(id){const m=historicalModels[id];if(!m||!/^[a-f0-9]{32}$/.test(m.uid))return null;return `https://sketchfab.com/models/${m.uid}/embed?autostart=1`;}
