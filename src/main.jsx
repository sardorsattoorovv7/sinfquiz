import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';

class PageLoadBoundary extends React.Component {
  state={error:null};

  static getDerivedStateFromError(error){return {error}}

  render(){
    if(!this.state.error)return this.props.children;
    return <main role="alert" style={{maxWidth:520,margin:'12vh auto',padding:'2rem',fontFamily:'system-ui,sans-serif',lineHeight:1.5}}>
      <h1>Bo‘lim yuklanmadi</h1>
      <p>{import.meta.env.DEV
        ? 'Lokal server bilan aloqa uzildi. VS Code terminalida npm run dev ishlab turganini tekshiring, keyin qayta yuklang.'
        : 'Internet aloqasini tekshirib, sahifani qayta yuklang.'}</p>
      <button type="button" onClick={()=>window.location.reload()} style={{padding:'.7rem 1rem',border:0,borderRadius:8,background:'#6d28d9',color:'#fff',cursor:'pointer'}}>Qayta yuklash</button>
    </main>;
  }
}

createRoot(document.getElementById('root')).render(<PageLoadBoundary><App/></PageLoadBoundary>);
