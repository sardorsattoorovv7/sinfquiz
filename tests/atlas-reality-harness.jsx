// Browser-only component probe served by Vite during test:e2e:reality.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import ScenarioExperiment from '../src/atlas-reality/ScenarioExperiment.jsx';
import {atlasCatalog} from '../src/atlas-learning/catalog.js';
import {realityContext} from '../src/atlas-reality/contexts.js';
import '../src/atlas-reality/reality.css';
const root=createRoot(document.getElementById('probe'));
window.renderReality=(subject,id)=>{const topic=atlasCatalog[subject].find(t=>t.id===id);flushSync(()=>root.render(<main style={{maxWidth:1150,margin:'auto'}}><section className={`ar-experience ar-${subject}`}><h1>{topic.title}</h1><ScenarioExperiment key={`${subject}:${id}`} subject={subject} topic={topic} context={realityContext(subject,topic)} user={{id:'qa-probe'}}/></section></main>));};
window.realityHarnessReady=true;
