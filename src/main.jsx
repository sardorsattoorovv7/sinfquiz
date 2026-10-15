import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import {PaperBrand,PaperButton} from './paper/PaperUI.jsx';

class PageLoadBoundary extends React.Component {
  state={error:null};

  static getDerivedStateFromError(error){return {error}}

  render(){
    if(!this.state.error)return this.props.children;
    return <main className="paper-workshop pw-error-page" role="alert" style={{maxWidth:520,margin:'12vh auto',padding:'2rem',fontFamily:'var(--pw-font)',lineHeight:1.7}}>
      <PaperBrand/>
      <h1>Bo‘lim yuklanmadi</h1>
      <p>{import.meta.env.DEV
        ? 'Lokal server bilan aloqa uzildi. VS Code terminalida npm run dev ishlab turganini tekshiring, keyin qayta yuklang.'
        : 'Internet aloqasini tekshirib, sahifani qayta yuklang.'}</p>
      {this.state.error?.message&&<details style={{margin:'1rem 0',padding:'.75rem',border:'var(--pw-rule)',borderRadius:5,background:'var(--pw-paper-alt)'}}>
        <summary style={{cursor:'pointer',fontWeight:650}}>Xato tafsilotini ko‘rsatish</summary>
        <code style={{display:'block',marginTop:'.65rem',whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:'.82rem'}}>{String(this.state.error.message).slice(0,600)}</code>
      </details>}
      <PaperButton variant="primary" onClick={()=>window.location.reload()}>Qayta yuklash</PaperButton>
    </main>;
  }
}

createRoot(document.getElementById('root')).render(<PageLoadBoundary><App/></PageLoadBoundary>);
