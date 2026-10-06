import {typingMatch} from './competition-typing.js';
self.onmessage=({data})=>self.postMessage({id:data.id,match:typingMatch(data.target,data.typed)});
