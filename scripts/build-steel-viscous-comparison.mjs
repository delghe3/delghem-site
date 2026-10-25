/**
 * Visually spatial (3D extruded) but numerically PLANE steel portal benchmark.
 * Calibrate lateral story stiffness by static Euler–Bernoulli 2D beam FE
 * assembly/condensation, then solve TWO real DÈLGHEM D2 reduced-order dynamic
 * time histories with identical masses and analytical accelerogram:
 * undamped-device versus validated linear viscous device equivalent Ceff.
 *
 * The D2 Kratos steel dynamic router does NOT accept seismicDevices; we
 * therefore do not falsely claim full Kratos damper-in-building simulation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const SITE=path.resolve(new URL('..',import.meta.url).pathname);
const D2=process.env.DELGHEM_D2_REPO??'/Users/delghe/Desktop/D2/Progetto';
const [dynamics,devices,catalog,models,materials]=await Promise.all([
 import(pathToFileURL(path.join(D2,'src/core/delghem-hysteretic-mdof.mjs')).href),
 import(pathToFileURL(path.join(D2,'src/core/seismic-devices.mjs')).href),
 import(pathToFileURL(path.join(D2,'src/core/catalog.mjs')).href),
 import(pathToFileURL(path.join(D2,'src/core/model.mjs')).href),
 import(pathToFileURL(path.join(D2,'src/core/material-library.mjs')).href)
]);
const byAlias=alias=>{
 const p=catalog.PROFILES.find(p=>p.alias===alias);
 if(!p)throw Error('D2 official steel profile not found '+alias);
 return p;
};
const heb=byAlias('HEB260'),ipe=byAlias('IPE330');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const displayNumber=x=>Number(x.toFixed(6)); // only public-rendered time series rounded; native D2 energy audits remain double precision
const pts=[
 {id:'BL',x:0,z:0},{id:'BR',x:6,z:0},
 {id:'TL',x:0,z:4},{id:'TR',x:6,z:4}
];
const beams=[
 {id:'COL-L',a:'BL',b:'TL',section:'HEB 260',material:'S355',A:heb.A,I:heb.Iy},
 {id:'COL-R',a:'BR',b:'TR',section:'HEB 260',material:'S355',A:heb.A,I:heb.Iy},
 {id:'BEAM-TOP',a:'TL',b:'TR',section:'IPE 330',material:'S355',A:ipe.A,I:ipe.Iy}
];
// Original editable D2 structural geometry is a bounded 2D steel portal:
 // the source does not invent a native geometric viscous link forbidden by D2.
const nativeFrame={
 schema:'hyperfem-1',
 title:'DÈLGHEM benchmark: geometria portale S355 HEB260 IPE330 (non verificata)',
 units:'kN-m',
 materials:[{id:'M_STEEL',...materials.materialFromLibrary('OPEN_S355',{thickness:20})}],
 sections:[
  {id:'S_HEB260',name:heb.alias,A:heb.A,Iy:heb.Iy,Iz:heb.Iz,J:heb.J},
  {id:'S_IPE330',name:ipe.alias,A:ipe.A,Iy:ipe.Iy,Iz:ipe.Iz,J:ipe.J}
 ],
 nodes:pts.map(p=>({
  id:p.id,x:p.x,y:0,z:p.z,
  fixed:p.z===0
   ?[true,true,true,true,true,true]
   :[false,true,false,true,false,true]
 })),
 members:beams.map(b=>({
  id:b.id,n1:b.a,n2:b.b,material:'M_STEEL',type:'beam',
  section:b.section==='HEB 260'?'S_HEB260':'S_IPE330',
  orientation:b.id==='BEAM-TOP'?[0,0,1]:[1,0,0]
 })),
 shells:[],loadCases:[{id:'CONCEPT',name:'Geometria telaio per riduzione modale illustrativa',
  loads:[],memberLoads:[],shellLoads:[]}],combinations:[]
};
models.validateEditableModel(nativeFrame);
const frameSource=JSON.stringify(nativeFrame,null,2)+'\n';
const frameSourceRel='assets/engineering/portal-steel-d2.hfm.json';
fs.writeFileSync(path.join(SITE,frameSourceRel),frameSource);
const E=210_000_000; // kN / m^2; 210 GPa
const id=new Map(pts.map((p,i)=>[p.id,i]));
const K=Array.from({length:12},()=>Array(12).fill(0));
for(const beam of beams){
 const p=pts[id.get(beam.a)],q=pts[id.get(beam.b)],dx=q.x-p.x,dz=q.z-p.z,L=Math.hypot(dx,dz),c=dx/L,s=dz/L;
 const EA=E*beam.A,EI=E*beam.I;
 const a=EA/L,b=12*EI/L**3,e=6*EI/L**2,f=4*EI/L,g=2*EI/L;
 const kl=[
  [a,0,0,-a,0,0],
  [0,b,e,0,-b,e],
  [0,e,f,0,-e,g],
  [-a,0,0,a,0,0],
  [0,-b,-e,0,b,-e],
  [0,e,g,0,-e,f]
 ];
 const T=[
  [c,s,0,0,0,0],[-s,c,0,0,0,0],[0,0,1,0,0,0],
  [0,0,0,c,s,0],[0,0,0,-s,c,0],[0,0,0,0,0,1]
 ];
 const n=[3*id.get(beam.a),3*id.get(beam.a)+1,3*id.get(beam.a)+2,
  3*id.get(beam.b),3*id.get(beam.b)+1,3*id.get(beam.b)+2];
 for(let i=0;i<6;i++)for(let j=0;j<6;j++){
  let k=0;for(let x=0;x<6;x++)for(let y=0;y<6;y++)k+=T[x][i]*kl[x][y]*T[y][j];
  K[n[i]][n[j]]+=k;
 }
}
const dofs=[6,7,8,9,10,11];
const A=dofs.map(i=>dofs.map(j=>K[i][j]));
const F=[.5,0,0,.5,0,0];
// Reproducible complete-pivot-free Gaussian elimination with row scaling.
function solve(a,b){
 const M=a.map((row,i)=>[...row,b[i]]);
 for(let k=0;k<M.length;k++){
  let pivot=k;
  for(let i=k+1;i<M.length;i++)if(Math.abs(M[i][k])>Math.abs(M[pivot][k]))pivot=i;
  if(Math.abs(M[pivot][k])<1e-12)throw Error('Portal frame lateral stiffness matrix singular');
  [M[k],M[pivot]]=[M[pivot],M[k]];
  for(let i=k+1;i<M.length;i++){
   const ratio=M[i][k]/M[k][k];
   for(let j=k;j<=M.length;j++)M[i][j]-=ratio*M[k][j];
  }
 }
 const x=Array(M.length).fill(0);
 for(let i=x.length-1;i>=0;i--){
  x[i]=(M[i].at(-1)-x.slice(i+1).reduce((sum,n,j)=>sum+M[i][i+j+1]*n,0))/M[i][i];
 }
 return x;
}
const staticDisp=solve(A,F);
const averageRoofDisp=(staticDisp[0]+staticDisp[3])/2;
const storyK=1/averageRoofDisp;
if(!(storyK>300&&storyK<20000))throw Error('Portal frame stiffness outside defensible range '+storyK);
const massT=28,frequencyHz=Math.sqrt(storyK/massT)/(2*Math.PI);
const viscousAlpha=1,cAxial=180;
const diagonalL=Math.hypot(6,4),cos=6/diagonalL;
const equivalentC=cAxial*cos*cos;
const inherentZeta=.025,structuralC=2*inherentZeta*Math.sqrt(storyK*massT);
// The present D2 device contract validates COINCIDENT connector endpoints
// only. We validate its C/alpha law honestly; the geometric diagonal shown
// in the website is a reduced-order theoretical projection, not a device
// natively connected across separated D2 beam nodes.
const deviceModel={nodes:[{id:'A',x:0,y:0,z:0},{id:'B',x:0,y:0,z:0}],
 seismicDevices:[{id:'D1',n1:'A',n2:'B',type:'viscous-damper',dir:0,
  parameters:{cKnSecM:cAxial,alpha:viscousAlpha,parallelKKnM:0}}]};
devices.validateSeismicDevices(deviceModel);
const dt=.01,T=18,count=Math.round(T/dt)+1;
const acceleration=Array.from({length:count},(_,i)=>{
 const t=i*dt;
 const envelope=t<=12?Math.sin(Math.PI*t/12)**2:0;
 return 9.81*.22*envelope*(.70*Math.sin(2*Math.PI*frequencyHz*.98*t)+
  .23*Math.sin(2*Math.PI*frequencyHz*1.44*t+.42)+
  .07*Math.sin(2*Math.PI*frequencyHz*.47*t+.2));
});
const groundPGA=Math.max(...acceleration.map(Math.abs));
const cases=[];
for(const withDamper of [false,true]){
 const c=structuralC+(withDamper?equivalentC:0);
 const input={
  schema:'delghem-hysteretic-mdof-request-1',
  massesT:[massT],
  stories:[{id:'PORTAL',lowerFloor:0,upperFloor:1,initialStiffnessKnM:storyK,
   yieldForceKn:1e8,postYieldRatio:0}],
  dampingKnSM:[[c]],dtSec:dt,
  groundAccelerationMps2:acceleration,
  initialDisplacementM:[0],initialVelocityMps:[0]
 };
 const copy=JSON.stringify(input);
 const result=dynamics.hystereticMDOF(input);
 if(copy!==JSON.stringify(input))throw Error('Native D2 time history modified input unexpectedly');
 if(result.records.length!==count||result.diagnostics.maximumNewtonResidual>1e-7||
  result.diagnostics.relativeEnergyResidual>0.018||
  result.diagnostics.totalPlasticDissipationKnM>1e-9)
  throw Error('D2 MDOF time-history convergence/elastic state failed '+withDamper+' '+JSON.stringify(result.diagnostics));
 const records=result.records.map((r,i)=>({
  timeS:displayNumber(r.timeSec),
  displacementMM:displayNumber(r.displacementM[0]*1000),
  velocityMS:displayNumber(r.velocityMps[0]),
  roofAccelerationMS2:displayNumber(r.accelerationMps2[0]+acceleration[i]),
  viscousDamperAxialForceKN:displayNumber(withDamper?cAxial*cos*r.velocityMps[0]:0)
 }));
 const peakDisplacementMM=Math.max(...records.map(x=>Math.abs(x.displacementMM)));
 const peakAccelerationMS2=Math.max(...records.map(x=>Math.abs(x.roofAccelerationMS2)));
 const peakBaseShearKN=Math.max(...result.records.map(x=>Math.abs(x.storyDevices[0].forceKn+c*x.velocityMps[0])));
 const maxDamperForceKN=Math.max(...records.map(x=>Math.abs(x.viscousDamperAxialForceKN)));
 const viscousDamperEnergyKNM=withDamper?
  result.diagnostics.totalViscousDissipationKnM*(equivalentC/c):0;
 cases.push({
  id:withDamper?'with':'without',
  nativeD2Status:result.status,
  inputSha256:sha(JSON.stringify(input)),
  damperCkNsM:withDamper?cAxial:0,
  effectiveDampingKNsM:withDamper?equivalentC:0,
  inherentDampingKNsM:structuralC,
  peakDisplacementMM,peakDriftPercent:peakDisplacementMM/1000/4*100,
  peakAccelerationMS2,peakBaseShearKN,maxDamperForceKN,
  viscousDamperEnergyKNM,
  energyAudit:{
   maxNewtonResidual:result.diagnostics.maximumNewtonResidual,
   relativeEnergyResidual:result.diagnostics.relativeEnergyResidual,
   totalViscousDissipationKNM:result.diagnostics.totalViscousDissipationKnM,
   totalPlasticDissipationKNM:result.diagnostics.totalPlasticDissipationKnM
  },
  completeSeismicVerification:false,
  records
 });
 console.log('REAL_D2_PORTAL_DYNAMIC',withDamper?'WITH VISCOUS':'BARE',{
  stiffnessKnM:storyK,modalHz:frequencyHz,peakDisplacementMM,
  peakBaseShearKN,peakAccelerationMS2,
  damperEnergyKNM:viscousDamperEnergyKNM,
  residual:result.diagnostics.maximumNewtonResidual,
  relativeEnergyResidual:result.diagnostics.relativeEnergyResidual});
}
const bare=cases[0],damped=cases[1];
const driftReductionPercent=100*(bare.peakDisplacementMM-damped.peakDisplacementMM)/bare.peakDisplacementMM;
if(!(driftReductionPercent>5&&driftReductionPercent<100))
 throw Error('In this specific real solved excitation, model viscous device did not lower roof drift: '+driftReductionPercent);
const report={
 schema:'delghem-steel-frame-viscous-comparison-1',
 nativeTimeHistoryEngine:'DÈLGHEM D2 hystereticMDOF',
 analysisDomain:'calibrated-equivalent-SDOF',
 numericalMethod:'D2 1DOF implicit Newmark solver, elastic (very high yield threshold), one roof mass and equivalent portal shear stiffness',
 outputPrecision:'Time histories rounded to 6 decimals only for browser transport; full-precision D2 residual and energy diagnostics are preserved.',
 geometry:{nodes:pts,beams,bayWidthM:6,heightM:4,visualExtrusionDepthM:0,
  visualDomain:'Native planar D2 XZ portal shown as solid HEB/IPE actual sections, not a four-column spatial frame.',
  sectionShapes:{
   S_HEB260:{catalogKey:heb.key,source:'D2/src/core/catalog.mjs',h:heb.h,b:heb.b,tw:heb.tw,tf:heb.tf},
   S_IPE330:{catalogKey:ipe.key,source:'D2/src/core/catalog.mjs',h:ipe.h,b:ipe.b,tw:ipe.tw,tf:ipe.tf}
  },
  nativeFrameSource:frameSourceRel,nativeFrameSourceSha256:sha(frameSource),
  materials:{steel:'S355',columns:'HEB 260',beam:'IPE 330'},
  damper:{from:'BL',to:'TR',directionCosineX:cos,alpha:viscousAlpha,coefficientCkNsM:cAxial}},
 frameStiffness:{source:'Euler-Bernoulli 2D portal finite-element matrix assembly, 6 free roof DOF with fixed bases, static lateral unit-force condensation',lateralKNM:storyK,
  staticControlDisplacementM:averageRoofDisp,steelEKnM2:E,steel:beams,
  catalogSource:'D2/src/core/catalog.mjs · actual HEB260/IPE330 profile A and Iy'},
 input:{massT,dtSec:dt,accelerationMS2:acceleration.map(displayNumber),
  recordType:'Analytical diagnostic ground-motion waveform, NOT recorded historical earthquake and NOT calibrated NTC/Eurocode design record.',
  pgaMS2:groundPGA,modalFrequencyHz:frequencyHz,structuralDampingRatio:inherentZeta},
 comparison:{
  usesKratosSeismicDeviceRoute:false,
  viscousRepresentation:'Equivalent linear viscous matrix Ceff=Caxial × cos²(theta) on one reduced roof degree of freedom. D2 source validator accepts only coincident connector endpoints; the diagonal architectural representation is an analytical direction-cosine projection, NOT a validated direct beam-to-beam damper connection.',
  modelingAssumptions:'Axonometric Canvas viewer renders exactly the four native D2 nodes, two HEB260 columns and one IPE330 beam as finite-thickness steel I sections, without invented additional columns or beams. The pinned schematic diagonal damper is a conceptual visual overlay, NOT a native connected member. Numerical analysis uses one equivalent roof degree of freedom with D2 Newmark MDOF solver; no spatial Kratos device and no code-based seismic design verification.',
  driftReductionPercent,
  maxDamperForceKN:damped.maxDamperForceKN,
  alpha:1,
  notSiteValidated:true
 },
 completeSeismicVerification:false,completeStructuralVerification:false,cases
};
const filename=path.join(SITE,'assets/engineering/steel-frame-viscous-comparison.json');
fs.writeFileSync(filename,JSON.stringify(report)+'\n');
console.log('D2_FRAME_DAMPER_COMPARISON_WRITTEN',filename,fs.statSync(filename).size,'bytes','drift reduction',driftReductionPercent.toFixed(2),'%');
