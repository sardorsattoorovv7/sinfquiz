// All values are SI unless a returned name explicitly contains another unit.
// Display positions and time are educational scales, separate from SI calculations.
export const physicalConstants={solarFlux:1361,sigma:5.670374419e-8,atmosphere:101325,gravity:9.81,bulkModulus:2.2e9,challengerDepth:10935,scubaRecord:332.35};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function solarExperiment(parameters,progress){
 const distance=clamp(Number(parameters.distance)||1,.5,1.5),albedo=clamp(Number.isFinite(Number(parameters.albedo))?Number(parameters.albedo):.3,0,.8),t=clamp(Number(progress)||0,0,1),{solarFlux,sigma}=physicalConstants;
 const flux=solarFlux/distance**2,absorbed=flux*(1-albedo)/4,equilibrium=Math.pow(absorbed/sigma,.25),initial=Math.pow(solarFlux*.7/(4*sigma),.25);
 const temperature=initial+(equilibrium-initial)*(1-Math.exp(-5*t));
 const netFlux=absorbed-sigma*temperature**4,change=temperature-initial;
 return {distance,flux,absorbed,equilibrium,temperature,temperatureC:temperature-273.15,initial,change,netFlux,heat:clamp(change/110,-1,1),displaySeparation:10*distance};
}
export function oceanExperiment(parameters,progress){
 const {atmosphere,gravity,bulkModulus,challengerDepth}=physicalConstants;
 const target=clamp(Number(parameters.targetDepth)||0,0,challengerDepth),depth=target*clamp(Number(progress)||0,0,1),surfaceDensity=clamp(Number(parameters.surfaceDensity)||1025,990,1040),compressible=parameters.compressible!=='off';
 // Constant bulk modulus: rho = rho0 exp(deltaP/K), dP/dh=rho*g.
 // It integrates to deltaP=-K ln(1-rho0*g*h/K). Not a full TEOS-10 seawater profile.
 const x=surfaceDensity*gravity*depth/bulkModulus,gaugePressure=compressible?-bulkModulus*Math.log1p(-x):surfaceDensity*gravity*depth,density=compressible?surfaceDensity/(1-x):surfaceDensity;
 const pressure=atmosphere+gaugePressure,bar=pressure/1e5,gaugeBar=gaugePressure/1e5,ratio=pressure/atmosphere,airFraction=atmosphere/pressure,waterCompression=1-surfaceDensity/density;
 const rating=clamp(Number(parameters.rating)||1200,1,1500),load=gaugeBar/rating,failed=parameters.mode==='cabin'&&load>1;
 const collapse=failed?clamp(1-Math.exp(-(load-1)*25),0,.94):0;
 const displayDrop=16*Math.log1p(depth/500)/Math.log1p(challengerDepth/500);
 return {depth,target,density,surfaceDensity,pressure,gaugePressure,bar,gaugeBar,ratio,airFraction,waterCompression,rating,load,failed,collapse,displayDrop};
}
export const physicalSources=[
 ['Quyosh va Yer energiya balansi','https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/'],
 ['Bosim va chuqurlik','https://www.noaa.gov/jetstream/ll-engagement'],
 ['Challenger Deep o‘lchovi: 10 935 ±6 m (2021)','https://repository.library.noaa.gov/view/noaa/33477'],
 ['SCUBA rekordi: Ahmed Gabr, 332,35 m (2014)','https://www.guinnessworldrecords.com/world-records/deepest-scuba-dive-male'],
 ['Haqiqiy dengiz suvi zichligi uchun TEOS-10','https://www.teos-10.org/pubs/gsw/html/gsw_rho.html'],
];
