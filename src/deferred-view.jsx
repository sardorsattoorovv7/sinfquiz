import React from 'react';
import {PaperSkeleton} from './paper/PaperUI.jsx';

// Keep navigation mounted while the selected view and its styles arrive.
// Defining this outside render also keeps lazy component identity stable.
export function deferredView(load,name='default',label='Bo‘lim ochilmoqda…'){
 const View=React.lazy(()=>load().then(module=>({default:module[name]})));
 return function DeferredView(props){
  return <React.Suspense fallback={<PaperSkeleton label={label}/>}><View {...props}/></React.Suspense>;
 };
}
