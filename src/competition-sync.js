// A single timer per open room; random delays prevent an entire class polling together.
export function createCompetitionSync({refresh,active=()=>true,random=Math.random,schedule=setTimeout,cancel=clearTimeout}){
 let stopped=false,live=false,failures=0,timer=null,signalTimer=null,running=false,pending=false;
 const arm=()=>{cancel(timer);if(stopped)return;const base=failures?Math.min(60000,15000*2**failures):live?30000:15000;timer=schedule(()=>run(),base*(.8+.4*random()))};
 async function run(){
  if(stopped)return;if(!active()){arm();return}if(running){pending=true;return}running=true;
  try{const ok=await refresh();failures=ok===false?failures+1:0}catch{failures++}
  finally{running=false;if(stopped)return;if(pending){pending=false;timer=schedule(run,300)}else arm()}
 }
 return {
  start(){run()},
  signal(){if(stopped||signalTimer!==null||!active())return;signalTimer=schedule(()=>{signalTimer=null;run()},1800+random()*800)},
  resume(){if(active())run()},
  connected(value){live=!!value;arm()},
  stop(){stopped=true;cancel(timer);cancel(signalTimer)},
 };
}
