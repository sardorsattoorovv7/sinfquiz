import React from 'react';
import {BIOLOGY_MODEL_SOURCES} from './biology-asset-catalog.js';
export default function BiologyModelSources(){return <details className="bio-model-sources"><summary>Tayyor modellar va manbalar</summary><p>Modellar sayt bilan birga yuklanadi. Ranglar va jarayon belgilari o‘rganish uchun moslashtirilgan.</p><ul>{BIOLOGY_MODEL_SOURCES.map(s=><li key={s.name}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a><small>{s.author} · {s.license}</small></li>)}</ul></details>}
