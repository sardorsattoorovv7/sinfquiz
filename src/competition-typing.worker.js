import {typingMatch,typingPreview} from './competition-typing.js';
self.onmessage=({data})=>self.postMessage({id:data.id,match:(data.preview?typingPreview:typingMatch)(data.target,data.typed)});
