export const speakingPlans = Object.freeze([
 {id:'free',name:'Bepul',price:0,full:1,short:2},
 {id:'single',name:'Bitta tahlil',price:15000,full:1,short:0,days:30},
 {id:'plus',name:'Speaking Plus',price:45000,full:4,short:12,days:30},
]);

export const speakingPlan = id => speakingPlans.find(plan=>plan.id===id);
export const sumSpeakingCredits = (balances,kind) => balances.reduce((total,plan)=>total+plan[kind],0);
const priceDigits=new Intl.NumberFormat('en-US');
export const speakingPrice = price => priceDigits.format(price).replaceAll(',','\u00a0')+' so‘m';
const uzDate=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Tashkent'});
export const speakingExpiry = value => uzDate.format(new Date(value)).replaceAll('/','.');
