/**
 * DÈLGHEM website — three native 2D-planar QUAD4 benchmark solutions.
 *
 * Only D2's genuine KratosMultiphysics numerical engine is invoked.
 * Input models are genuinely validated, discretized planar shell surfaces.
 * Output local face stresses are recovered from Kratos Gauss-point membrane
 * forces and bending moments for isotropic LINEAR ELASTIC shells:
 * σ11 = N11/h ± 6 M11/h²; σ22 = N22/h ± 6 M22/h²;
 * τ12 = N12/h ± 6 M12/h². Kratos works in kN/m; /1000 -> MPa.
 * These are independent diagnostic specimens: NOT safety certificates.
 * The structural application repository is read-only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const D2=process.env.DELGHEM_D2_REPO||'/Users/delghe/Desktop/D2/Progetto';
const WEBSITE=path.resolve(new URL('..',import.meta.url).pathname);
const assets=path.join(WEBSITE,'assets/fem-lab');
const sourceDir=path.join(assets,'kratos-2d-input');
fs.mkdirSync(sourceDir,{recursive:true});
process.env.HYPERFEM_COMMERCIAL_RUNTIME='1';
const {validate}=await import(pathToFileURL(path.join(D2,'src/core/model.mjs')).href);
const {runShellEngine}=await import(pathToFileURL(path.join(D2,'app/shell-engine.mjs')).href);
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const round=n=>Number(n.toFixed(8));
const tests=[
 {
  id:'skewed-double-opening-slab',
  titleIt:'Soletta irregolare con due aperture',
  titleEn:'Skewed slab with two openings',
  descIt:'Soletta piana in C.A. elasticamente vincolata lungo il bordo occidentale; due asole strutturali, due bordi incastrati, 3,8 kN/m² verticali e shell QUAD4 originali.',
  descEn:'Irregular reinforced-concrete plate, west and south edges clamped, two genuine voids, downward 3.8 kN/m² load and native QUAD4 shell elements.',
  subtitleIt:'Piastra irregolare · 2 vani · carico gravitazionale',
  subtitleEn:'Skewed plate · 2 openings · downward pressure',
  dimensions:'13.2 × 8.4 m',thickness:.26,
  nx:22,ny:14,plane:'xy',pressure:3.8,anchor:'west-and-south',
  remove:(i,j)=>(i>=5&&i<=8&&j>=4&&j<=7)||(i>=14&&i<=17&&j>=9&&j<=11),
  coords:(u,v)=>[13.2*u+.38*Math.sin(Math.PI*v)*Math.sin(Math.PI*u),8.4*v+.46*u*Math.sin(Math.PI*v),0],
  material:'Elastic conceptual C30/37',
  young:32800000,poisson:.2,kind:'irregular-slab'
 },
 {
  id:'double-window-shear-wall',
  titleIt:'Parete portante a doppia apertura',
  titleEn:'Double-window structural wall',
  descIt:'Parete elastica verticale alta 8,4 m con due vere finestre nella mesh, base incastrata e pressione trasversale uniforme pari a 2,6 kN/m².',
  descEn:'An 8.4 m tall elastic structural wall with two actual meshed openings, fixed foundation edge and uniform 2.6 kN/m² transverse action.',
  subtitleIt:'Parete forata · 2 finestre · azione trasversale',
  subtitleEn:'Perforated wall · 2 windows · transverse pressure',
  dimensions:'14.4 × 8.4 m',thickness:.36,
  nx:24,ny:14,plane:'xz',pressure:2.6,anchor:'base',
  remove:(i,j)=>(i>=4&&i<=9&&j>=4&&j<=8)||(i>=15&&i<=20&&j>=4&&j<=8),
  coords:(u,v)=>[14.4*u,0,8.4*v],
  material:'Elastic conceptual C30/37',
  young:32800000,poisson:.2,kind:'two-window-wall'
 },
 {
  id:'l-shaped-transfer-plate',
  titleIt:'Soletta a L con vano interno',
  titleEn:'L-shaped transfer slab with service opening',
  descIt:'Piastra a L con cortile rientrante e foro interno nella mesh; supportata su due bordi, spessore 28 cm e pressione verticale di 4,2 kN/m².',
  descEn:'L-shaped plate with a re-entrant courtyard and real mesh opening, two supported edges, 280 mm thickness and 4.2 kN/m² vertical pressure.',
  subtitleIt:'Impalcato a L · rientranza · vano impianti',
  subtitleEn:'L-shaped slab · re-entrant corner · opening',
  dimensions:'15.4 × 10.8 m',thickness:.28,
  nx:22,ny:16,plane:'xy',pressure:4.2,anchor:'west-and-south',
  remove:(i,j)=>(i>=12&&j>=9)||(i>=4&&i<=6&&j>=6&&j<=9),
  coords:(u,v)=>[15.4*u+.19*Math.sin(2*Math.PI*v)*u,10.8*v+.23*u*v,0],
  material:'Elastic conceptual C30/37',
  young:32800000,poisson:.2,kind:'l-transfer-slab'
 }
];
function nativeModel(t){
 const ix=(i,j)=>'N'+(1+j*(t.nx+1)+i);
 const grid=[];
 for(let j=0;j<=t.ny;j++)for(let i=0;i<=t.nx;i++){
  const p=t.coords(i/t.nx,j/t.ny);
  const supported=t.anchor==='west'?i===0:
   t.anchor==='base'?j===0:i===0||j===0;
  grid.push({id:ix(i,j),x:round(p[0]),y:round(p[1]),z:round(p[2]),fixed:Array(6).fill(supported)});
 }
 const shells=[],shellLoads=[];
 for(let j=0;j<t.ny;j++)for(let i=0;i<t.nx;i++){
  if(t.remove(i,j))continue;
  const id='SH'+(shells.length+1);
  shells.push({id,nodes:[ix(i,j),ix(i+1,j),ix(i+1,j+1),ix(i,j+1)],
   material:'M1',thickness:t.thickness});
  shellLoads.push({shell:id,system:'global',
   values:t.plane==='xz'?[0,-t.pressure,0]:[0,0,-t.pressure]});
 }
 const used=new Set(shells.flatMap(q=>q.nodes));
 const model={
  schema:'hyperfem-1',title:t.titleEn+' (independent diagnostic Kratos specimen)',
  units:'kN-m',materials:[{id:'M1',name:t.material,E:t.young,nu:t.poisson}],
  sections:[],nodes:grid.filter(n=>used.has(n.id)),members:[],shells,
  loadCases:[{id:'LC1',name:t.plane==='xz'?'Transverse pressure':'Downward surface load',
   loads:[],memberLoads:[],shellLoads}],combinations:[]
 };
 validate(model);
 if(model.nodes.length>512||shells.length>512)throw Error('Bounded D2 input domain exceeded '+t.id);
 return model;
}
const FEATS=['sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa'];
function faceStress(v,h,face){
 const scale=face==='top'?1:-1;
 const p=[(v[0]/h+scale*6*v[3]/h**2)/1000,
  (v[1]/h+scale*6*v[4]/h**2)/1000,
  (v[2]/h+scale*6*v[5]/h**2)/1000];
 const mises=Math.sqrt(Math.max(0,p[0]**2+p[1]**2-p[0]*p[1]+3*p[2]**2));
 return p.concat(mises).map(round);
}
const cases=[];
for(const t of tests){
 const model=nativeModel(t);
 const nativeFile='kratos-2d-input/'+t.id+'.hfm.json';
 const rawBytes=Buffer.from(JSON.stringify(model,null,2)+'\n');
 const file=path.join(assets,nativeFile);
 fs.writeFileSync(file,rawBytes);
 const started=Date.now();
 console.log('KRATOS_2D_SOLVE_BEGIN',t.id,model.nodes.length,'nodes',model.shells.length,'QUAD4');
 const {result}=await runShellEngine(D2,{model,analysis:'static',selection:'case:LC1'});
 if(result.engine!=='KratosMultiphysics'||!Number.isFinite(result.residual)||
 result.residual>1e-7||result.shells.length!==model.shells.length||
 result.nodes.length!==model.nodes.length)throw Error('Native Kratos 2D analysis incomplete '+t.id);
 const nodePositions=Object.fromEntries(model.nodes.map(n=>[n.id,[n.x,n.y,n.z]]));
 const sourceRows=new Map(model.shells.map(s=>[s.id,s]));
 const rows=result.shells.map(shell=>{
  const source=sourceRows.get(shell.id);
  if(!source||shell.gauss.length!==4)throw Error('Gauss integration mismatch '+shell.id);
  const resultants=shell.gauss.map(g=>{
   if(!Array.isArray(g.resultants)||g.resultants.length!==8||
     !g.resultants.every(Number.isFinite))throw Error('Invalid Kratos shell forces '+shell.id);
   return {xi:g.xi,eta:g.eta,top:faceStress(g.resultants,t.thickness,'top'),
    bottom:faceStress(g.resultants,t.thickness,'bottom')};
  });
  return {id:shell.id,vertices:source.nodes.map(id=>nodePositions[id]),gauss:resultants};
 });
 const stressValues=rows.flatMap(e=>e.gauss.flatMap(g=>[...g.top,...g.bottom]));
 if(!stressValues.every(Number.isFinite)||Math.max(...stressValues.filter((v,i)=>i%4===3))<1e-5)
 throw Error('Unphysical zero/invalid stress recovery '+t.id);
 const maxAbsDisplacement=Math.max(...result.nodes.flatMap(n=>n.u.slice(0,3).map(Math.abs)));
 const audit={
  schema:'delghem-kratos-2d-plate-1',id:t.id,sourceEngine:result.engine,
  analysis:'static / linear elastic',titleIt:t.titleIt,titleEn:t.titleEn,
  descriptionIt:t.descIt,descriptionEn:t.descEn,
  subtitleIt:t.subtitleIt,subtitleEn:t.subtitleEn,
  kind:t.kind,plane:t.plane,thicknessM:t.thickness,dimensions:t.dimensions,
  mesh:{nodes:model.nodes.length,shells:model.shells.length,gaussPerShell:4},
  boundary:{support:t.anchor,description:t.anchor==='base'?'Base clamped':'Clamped edge/s'},
  load:{caseId:'LC1',pressureKNM2:t.pressure,system:t.plane==='xz'?'global-Y':'global-Z'},
  material:{name:t.material,YoungKPa:t.young,Poisson:t.poisson},
  diagnostics:{residual:result.residual,maxAbsDisplacementM:maxAbsDisplacement},
  sourceFile:nativeFile,sourceSha256:sha(rawBytes),
  nativeSolverResultSha256:sha(JSON.stringify(result)),
  stressRecovery:'Elastic top/bottom local face σ from native Kratos Gauss resultants: N/h ± 6M/h², kN/m² to MPa. No nodal stress recovery.',
  completeStructuralVerification:false,
  numericalLimits:'Independent diagnostic shell model; no structure built, no code compliance, no calibrated soil, no collapse or capacity inferred.',
  fields:FEATS,materialsSupported:['C30/37 elastic idealisation'],elements:rows
 };
 cases.push(audit);
 console.log('KRATOS_2D_SOLVE_OK',JSON.stringify({
  id:t.id,nodes:audit.mesh.nodes,shells:audit.mesh.shells,
  residual:audit.diagnostics.residual,maxAbsDisplacementM:maxAbsDisplacement,
  stressMaxMPa:Math.max(...stressValues.filter((v,i)=>i%4===3)),
  seconds:(Date.now()-started)/1000}).slice(0,1100));
}
const output={schema:'delghem-kratos-2d-surface-suite-1',engine:'KratosMultiphysics',
 independentCases:cases.length,caseIDs:cases.map(x=>x.id),
 sourceD2:'D2/native-shell-engine linear-elastic QUAD4; three independent solved geometries with actual integrations',
 numericalScope:'Educational diagnostic FEM stress visualizations of three distinct 2D planar shell meshes, neither actual designed buildings nor code-certified results.',
 completeStructuralVerification:false,cases};
const destination=path.join(assets,'kratos-2d-surfaces.json');
const temp=destination+'.tmp';
fs.writeFileSync(temp,JSON.stringify(output)+'\n');
fs.renameSync(temp,destination);
console.log('KRATOS_2D_DATA_WRITTEN',destination,fs.statSync(destination).size,'bytes');
