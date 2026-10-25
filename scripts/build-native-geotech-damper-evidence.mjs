/**
 * Generate DÈLGHEM native numerical engineering evidence for the website.
 * Pile: actual D2 t-z/q-z nonlinear axial foundation engine.
 * Devices: D2's validated viscous-damper constitutive contract, with
 * analytical force–velocity and harmonic loop illustrations (NOT a
 * full structure time-history FEM solution).
 * D2 application is read-only; outputs are written only to this site.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const D2='/Users/delghe/Desktop/D2/Progetto';
const SITE=path.resolve(new URL('..',import.meta.url).pathname);
const outDir=path.join(SITE,'assets/engineering');
fs.mkdirSync(outDir,{recursive:true});
const load=async f=>import(pathToFileURL(path.join(D2,f)).href);
const {generateAPISandAxialProfile,generateAPIClayAxialProfile}=await load('src/core/pile-axial-geotech.mjs');
const {solvePileAxialItem,solvePileAxialByHeadSettlement}=await load('src/core/pile-axial-soil.mjs');
const {validateSeismicDevices}=await load('src/core/seismic-devices.mjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const sand=[{topM:0,bottomM:5,phiDeg:32,gammaEffKnM3:9,relativeDensity:'loose'},
 {topM:5,bottomM:15,phiDeg:36,gammaEffKnM3:10,relativeDensity:'medium'}];
const clay=[{topM:0,bottomM:5,cuKPa:40,gammaEffKnM3:9},
 {topM:5,bottomM:15,cuKPa:70,gammaEffKnM3:10}];
const profiles=[
 {id:'layered-sand',titleIt:'Palo Ø60 in sabbia stratificata',titleEn:'Ø600 mm pile in layered sand',
  kind:'sand',layers:sand,profile:generateAPISandAxialProfile(sand,{lengthM:15,diameterM:.6},{suctionRatio:.05})},
 {id:'layered-clay',titleIt:'Palo Ø60 in argilla stratificata',titleEn:'Ø600 mm pile in layered clay',
  kind:'clay',layers:clay,profile:generateAPIClayAxialProfile(clay,{lengthM:15,diameterM:.6},{suctionRatio:.05})}
];
const piles=[];
for(const p of profiles){
 const item={id:p.id,name:p.titleEn,lengthM:15,diameterM:.6,EGPa:30,
  segments:30,headNKn:700,tolerance:1e-9,maxIterations:100,
  shaft:p.profile.shaft,tip:p.profile.tip,geotechAudit:p.profile.audit};
 const input=JSON.stringify(item,null,2)+'\n';
 const file='pile-'+p.id+'-input.json';
 fs.writeFileSync(path.join(outDir,file),input);
 const solved=solvePileAxialItem(item);
 if(!solved.converged||Math.abs(solved.equilibrium.residualKn)>1e-4||
  !Number.isFinite(solved.head.settlementM))throw Error('D2 axial pile solve not accepted '+p.id);
 const samples=[];
 for(let i=0;i<=32;i++){
  const settlementM=.00005+i*.0003;
  const r=solvePileAxialByHeadSettlement(item,settlementM);
  if(!Number.isFinite(r.reactionKn)||!Number.isFinite(r.headTangentKnM))throw Error('Nonfinite axial constitutive response '+p.id);
  samples.push({settlementMM:Number((settlementM*1000).toFixed(4)),
   reactionKN:Number(r.reactionKn.toFixed(6)),
   tangentKnM:Number(r.headTangentKnM.toFixed(6))});
 }
 piles.push({id:p.id,titleIt:p.titleIt,titleEn:p.titleEn,kind:p.kind,
  model:{lengthM:15,diameterM:.6,EGPa:30,layers:p.layers,headLoadKN:700,
   shaftLaw:p.profile.audit.method,tipKn:p.profile.tip.qultKn},
  analysis:'D2 native nonlinear axial t-z/q-z pile shaft + tip',
  solver: 'DÈLGHEM D2 pile axial geotechnical numerical module',
  converged:solved.converged,headSettlementMM:solved.head.settlementM*1000,
  tipReactionKN:solved.tip.reactionKn,shaftReactionKN:solved.equilibrium.shaftReactionKn,
  residualKN:solved.equilibrium.residualKn,iterations:solved.iterations,
  capacityScope:'Numerical nonlinear t-z/q-z load–settlement screening; NOT geotechnical ULS/SLS certification.',
  sourceInput:file,inputSha256:hash(input),
  sampledCurve:samples});
}
const C=180;const displacementAmplitudeM=.028;const frequencyHz=1.25;
const devices=[];
for(const alpha of [.5,1]){
 const id=alpha===.5?'nonlinear-viscous':'linear-viscous';
 const n1={id:'D1',x:0,y:0,z:0},n2={id:'D2',x:0,y:0,z:0};
 const validated={nodes:[n1,n2],seismicDevices:[{id:'DV1',n1:'D1',n2:'D2',
  type:'viscous-damper',dir:0,parameters:{cKnSecM:C,alpha,parallelKKnM:0}}]};
 validateSeismicDevices(validated);
 const omega=2*Math.PI*frequencyHz;
 const velocityMax=omega*displacementAmplitudeM;
 const f=v=>C*Math.sign(v)*Math.pow(Math.abs(v),alpha);
 const velocityCurve=Array.from({length:101},(_,i)=>{
  const v=-.5+i*.01;
  return {velocityMS:v,forceKN:f(v)};
 });
 const n=241;
 const cycle=Array.from({length:n},(_,i)=>{
  const t=i/(n-1)/frequencyHz;
  const x=displacementAmplitudeM*Math.sin(omega*t);
  const v=displacementAmplitudeM*omega*Math.cos(omega*t);
  return {timeS:t,displacementMM:x*1000,velocityMS:v,forceKN:f(v)};
 });
 let energyKNM=0;
 for(let i=1;i<cycle.length;i++)
  energyKNM+=.5*(cycle[i].forceKN+cycle[i-1].forceKN)*
  (cycle[i].displacementMM-cycle[i-1].displacementMM)/1000;
 if(!(energyKNM>0))throw Error('Viscous energy loop is not passive '+id);
 devices.push({
  id,alpha,cCoefficientKnSecMAlpha:C,frequencyHz,displacementAmplitudeMM:28,
  maxVelocityMS:velocityMax,
  maxForceKN:C*velocityMax**alpha,energyPerCycleKNM:energyKNM,
  viscousLaw:'F = C × sgn(v) × |v|^alpha',
  inputSpec:'Two coincident model endpoints in direction X; native D2 device parameter validation passed.',
  illustrationScope:'Constitutive analytical illustration of a validated input device; NOT dynamic FEM response of a building or manufacturer qualified damper.',
  velocityCurve,cycle
 });
}
const report={schema:'delghem-d2-geo-and-viscous-benchmarks-1',
 numericalScope:'Two actual D2 nonlinear pile t-z/q-z numerical analyses and two source-validated damper constitutive-law illustrations. No geotechnical code certification or full structural viscous-device time-history inference.',
 piles,devices,sourceModules:[
 'D2/src/core/pile-axial-geotech.mjs',
 'D2/src/core/pile-axial-soil.mjs',
 'D2/src/core/seismic-devices.mjs'
 ],completeGeotechnicalVerification:false,completeStructuralVerification:false};
const file=path.join(outDir,'soil-piles-and-dampers.json');
fs.writeFileSync(file,JSON.stringify(report)+'\n');
console.log('D2_FOUNDATIONS_AND_DAMPERS_NUMERIC_EVIDENCE',JSON.stringify({
 piles:piles.map(x=>({id:x.id,settlementMM:x.headSettlementMM,residualKN:x.residualKN,shaft:x.shaftReactionKN,tip:x.tipReactionKN})),
 devices:devices.map(x=>({alpha:x.alpha,maxForceKN:x.maxForceKN,energyPerCycleKNM:x.energyPerCycleKNM})),
 bytes:fs.statSync(file).size
}));
