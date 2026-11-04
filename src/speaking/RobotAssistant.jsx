import React from 'react';
import './robot.css';

export default function RobotAssistant({mood='idle',size='normal'}){
 return <svg className={'sq-robot sq-robot--'+size} data-mood={mood} viewBox="0 0 160 164" fill="none" aria-hidden="true" focusable="false">
  <ellipse className="sq-robot-shadow" cx="80" cy="154" rx="42" ry="6"/>
  <g className="sq-robot-float">
   <g className="sq-robot-antenna"><path className="sq-robot-line" d="M80 31V17"/><circle className="sq-robot-light" cx="80" cy="12" r="7"/></g>
   <rect className="sq-robot-ear" x="20" y="52" width="13" height="29" rx="6"/><rect className="sq-robot-ear" x="127" y="52" width="13" height="29" rx="6"/>
   <rect className="sq-robot-shell" x="29" y="30" width="102" height="69" rx="23"/>
   <rect className="sq-robot-screen" x="40" y="41" width="80" height="47" rx="15"/>
   <g className="sq-robot-eyes"><rect x="54" y="54" width="12" height="15" rx="6"/><rect x="94" y="54" width="12" height="15" rx="6"/></g>
   <path className="sq-robot-smile" d="M70 73Q80 81 90 73"/>
   <circle className="sq-robot-cheek" cx="49" cy="72" r="4"/><circle className="sq-robot-cheek" cx="111" cy="72" r="4"/>
   <path className="sq-robot-line" d="M73 100v8m14-8v8"/>
   <path className="sq-robot-shell" d="M55 108h50l8 32H47l8-32Z"/>
   <rect className="sq-robot-badge" x="67" y="115" width="26" height="16" rx="5"/>
   <path className="sq-robot-bolt" d="m83 118-7 6h7l-5 5"/>
   <g className="sq-robot-wave"><path className="sq-robot-line" d="m112 115 16-10 8-17"/><circle className="sq-robot-hand" cx="138" cy="83" r="8"/></g>
   <path className="sq-robot-line" d="m49 116-14 13"/><circle className="sq-robot-hand" cx="31" cy="132" r="7"/>
   <path className="sq-robot-feet" d="M57 141v8h14v-8m18 0v8h14v-8"/>
  </g>
  <path className="sq-robot-spark" d="M144 30v12m-6-6h12M12 91v8m-4-4h8"/>
 </svg>;
}
