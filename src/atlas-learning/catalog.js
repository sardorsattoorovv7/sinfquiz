import {atlasTopics} from '../math-atlas-content.js';
import {biologyTopics} from '../biology-content.js';
import {chemistryTopics} from '../chemistry-content.js';
import {chemistryLabs} from '../chemistry-labs.js';
import {spaceTopics} from '../space/content.js';
import {informaticsGuides} from './guides.js';

export const atlasCatalog={math:atlasTopics,biology:biologyTopics,chemistry:[...chemistryTopics,...chemistryLabs],space:spaceTopics,informatics:Object.entries(informaticsGuides).map(([id,g])=>({id,title:{history:'Vaqt muzeyi',anatomy:'Kompyuter ichida',system:'OS va ma’lumot',practice:'Amaliy ishlar'}[id],scene:id,grade:5,group:'Kompyuterga sayohat',definition:g.idea}))};
export const topicCount=Object.values(atlasCatalog).reduce((n,topics)=>n+topics.length,0);
