/**
 * Repeat the D2 B01 irregular two-level wall + slab FEM benchmark at 4×4
 * quadrilateral refinement. Native KratosMultiphysics only, D2 source fixture,
 * fixture is read-only; no D2 application code is modified.
 * Data provenance: D2 scripts/b01-irregular-wall-slab-refinement.mjs;
 * D2 tests/fixtures/b01-coupled-wall-slab.hfm.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const D2=process.env.DELGHEM_D2_REPO || '/Users/delghe/Desktop/D2/Progetto';
const site=path.resolve(new URL('..',import.meta.url).pathname);
const {validate}=await import(pathToFileURL(path.join(D2,'src/core/model.mjs')).href);
const {shellLoads}=await import(pathToFileURL(path.join(D2,'src/core/shell-geometry.mjs')).href);
const fixture=path.join(D2,'tests/fixtures/b01-coupled-wall-slab.hfm.json');
const fixtureBytes=fs.readFileSync(fixture);
const original=JSON.parse(fixtureBytes.toString('utf8'));
validate(original);
const pos=n=>[n.x,n.y,n.z];
const diff=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const length=v=>Math.hypot(...v);
const near=(a,b)=>length(diff(a,b))<=1e-8;
const shape=(p,u,v)=>[0,1,2].map(i=>
 (1-u)*(1-v)*p[0][i]+u*(1-v)*p[1][i]+u*v*p[2][i]+(1-u)*v*p[3][i]);
function totalLoads(m){
 return [...shellLoads(m,{LC1:1}).values()].reduce(
  (a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]);
}
function subdivide(m,n){
 const src=structuredClone(m),out=structuredClone(m);
 if((src.diaphragms??[]).length)throw Error('Diaphragms not handled by this benchmark');
 const existingShellLoads=src.loadCases.map(c=>c.shellLoads??[]);
 for(const c of out.loadCases)c.shellLoads=[];
 out.shells=[];
 let next=0;
 const findNode=point=>{
  const hits=out.nodes.filter(x=>near(pos(x),point));
  if(hits.length>1)throw Error('Coincident FEM node ambiguity');
  if(hits.length)return hits[0].id;
  let id;
  do{id='N_B01R_'+(++next);}while(out.nodes.some(x=>x.id===id));
  out.nodes.push({id,x:point[0],y:point[1],z:point[2],fixed:Array(6).fill(false)});
  return id;
 };
 let serial=0;
 for(const shell of src.shells){
  if(shell.nodes.length!==4)throw Error('Only 4-node shells allowed');
  const points=shell.nodes.map(id=>{
   const found=src.nodes.find(x=>x.id===id);
   if(!found)throw Error('Shell node missing '+id);
   return pos(found);
  });
  const grid=[];
  for(let v=0;v<=n;v++){
   const row=[];
   for(let u=0;u<=n;u++)row.push(findNode(shape(points,u/n,v/n)));
   grid.push(row);
  }
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const id=i===0&&j===0?shell.id:'SH_B01R_'+(++serial);
   if(out.shells.some(x=>x.id===id)||src.shells.some(x=>x.id===id&&id!==shell.id))
     throw Error('Shell ID collision '+id);
   out.shells.push({...structuredClone(shell),id,
    nodes:[grid[j][i],grid[j][i+1],grid[j+1][i+1],grid[j+1][i]]});
   for(let c=0;c<out.loadCases.length;c++)
    for(const load of existingShellLoads[c].filter(x=>x.shell===shell.id))
     out.loadCases[c].shellLoads.push({...structuredClone(load),shell:id});
  }
 }
 // Real BEAM-to-shell coupling: split each original physical beam wherever
 // generated mesh nodes lie on its axis. Preserve material/section/orientation.
 out.members=[];
 let beamSerial=0;
 const childrenById=new Map();
 for(const beam of src.members){
  const from=src.nodes.find(x=>x.id===beam.n1);
  const to=src.nodes.find(x=>x.id===beam.n2);
  if(!from||!to)throw Error('Beam endpoint missing');
  const origin=pos(from),end=pos(to),d=diff(end,origin),sq=dot(d,d);
  if(sq<=1e-12)throw Error('Degenerate BEAM');
  const hits=out.nodes.flatMap(x=>{
   const v=diff(pos(x),origin),t=dot(v,d)/sq;
   if(!(t>1e-9&&t<1-1e-9)||length(diff(v,d.map(y=>y*t)))>1e-8)return [];
   return [{t,id:x.id}];
  }).sort((a,b)=>a.t-b.t);
  const ids=[beam.n1,...hits.map(x=>x.id),beam.n2],children=[];
  if(new Set(ids).size!==ids.length)throw Error('BEAM duplicate node identity');
  for(let j=0;j<ids.length-1;j++){
   const id=j===0?beam.id:'B_B01R_'+(++beamSerial);
   out.members.push({...structuredClone(beam),id,n1:ids[j],n2:ids[j+1]});
   children.push(id);
  }
  childrenById.set(beam.id,children);
 }
 for(let c=0;c<out.loadCases.length;c++){
  if((src.loadCases[c].memberLinearLoads??[]).length||
    (src.loadCases[c].memberPointLoads??[]).length||
    (src.loadCases[c].memberThermalLoads??[]).length)
   throw Error('Unsupported distributed special actions in this independent benchmark');
  out.loadCases[c].memberLoads=src.loadCases[c].memberLoads.flatMap(load=>
   (childrenById.get(load.member)??[]).map(id=>({...structuredClone(load),member:id})));
 }
 validate(out);
 const before=totalLoads(src),after=totalLoads(out);
 for(let i=0;i<3;i++)if(Math.abs(before[i]-after[i])>1e-7*Math.max(1,Math.abs(before[i])))
  throw Error('Shell pressure resultant not conserved: '+before[i]+' '+after[i]);
 return out;
}

const model=subdivide(original,4);
process.env.HYPERFEM_COMMERCIAL_RUNTIME='1'; // fail closed: NO other solver fallback
const {runShellEngine}=await import(pathToFileURL(path.join(D2,'app/shell-engine.mjs')).href);
const t=Date.now();
const {result}=await runShellEngine(D2,{model,analysis:'static',selection:'case:LC1'});
if(result.engine!=='KratosMultiphysics'||!(result.residual<1e-7)||
   result.shells?.length!==176||model.shells?.length!==176||!result.nodes)
 throw Error('Native Kratos verification failed: '+JSON.stringify({
  engine:result.engine,residual:result.residual,shells:result.shells?.length}));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pts=Object.fromEntries(model.nodes.map(n=>[n.id,[n.x,n.y,n.z]]));
const materials=new Map(model.materials.map(m=>[m.id,m]));
const shellInputs=new Map(model.shells.map(s=>[s.id,s]));
const keys=['sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa'];
const toMPa=stressKnM2=>stressKnM2/1000;
function faceStress(resultants,h,which){
 const sign=which==='top'?1:-1;
 const v=[
  toMPa(resultants[0]/h+sign*6*resultants[3]/(h*h)),
  toMPa(resultants[1]/h+sign*6*resultants[4]/(h*h)),
  toMPa(resultants[2]/h+sign*6*resultants[5]/(h*h))
 ];
 const vm=Math.sqrt(Math.max(0,v[0]*v[0]+v[1]*v[1]-v[0]*v[1]+3*v[2]*v[2]));
 return Object.fromEntries(keys.map((key,i)=>[key,i<3?v[i]:vm]));
}
const elements=result.shells.map(shell=>{
 const source=shellInputs.get(shell.id);
 if(!source||shell.gauss.length!==4)throw Error('Incomplete Kratos shell '+shell.id);
 const h=source.thickness,material=materials.get(source.material);
 if(!material||source.laminate)throw Error('This public isotropic benchmark disallows unresolved layered shells');
 const gauss=shell.gauss.map(g=>{
  const R=g.resultants;
  if(!Array.isArray(R)||R.length!==8||!R.every(Number.isFinite))
   throw Error('Missing native shell stress resultants '+shell.id);
  // Linear-elastic constitutive recovery from Kratos membrane forces and
  // bending moments, in the actual native QUAD4 local panel basis.
  // N/h ± 6M/h² gives face plane stresses in kN/m²; /1000 gives MPa.
  const top=faceStress(R,h,'top'),bottom=faceStress(R,h,'bottom');
  if(Object.values(top).concat(Object.values(bottom)).some(x=>!Number.isFinite(x)))
   throw Error('Nonfinite native Kratos face stress recovery '+shell.id);
  // The actual Kratos generalized membrane strains can independently check
  // isotropic plane stress at the four Gauss points (up to solver scaling).
  if(Array.isArray(g.strains)){
   const factor=material.E/(1-material.nu*material.nu);
   const chk=[factor*(g.strains[0]+material.nu*g.strains[1]),
             factor*(g.strains[1]+material.nu*g.strains[0]),
             material.E/(2*(1+material.nu))*g.strains[2]];
   const rec=[R[0]/h,R[1]/h,R[2]/h];
   const maximum=Math.max(1,...rec.map(Math.abs),...chk.map(Math.abs));
   const err=Math.max(...chk.map((x,i)=>Math.abs(x-rec[i])))/maximum;
   if(err>0.12)throw Error('Kratos membrane stress/strain constitutive audit failed '+shell.id+' '+err);
  }
  return {position:g.point,top,bottom};
 });
 return {id:shell.id,nodes:shell.nodes,vertices:shell.nodes.map(id=>pts[id]),
  thicknessM:h,material:source.material,gauss};
});
const beams=model.members.map(b=>({
 id:b.id,n1:b.n1,n2:b.n2,a:pts[b.n1],b:pts[b.n2],
 kind:'physical supporting beam'}));
const displacements=Object.fromEntries(result.nodes.map(n=>[n.id,n.u.slice(0,3)]));
const out={
 schema:'delghem-showcase-shell-1',
 modelTitle:original.title,
 sourceFixture:'D2/tests/fixtures/b01-coupled-wall-slab.hfm.json',
 sourceBenchmark:'site/scripts/build-kratos-shell.mjs',
 sourceFixtureSha256:sha(fixtureBytes),
 sourceBenchmarkSha256:sha(fs.readFileSync(path.join(site,'scripts/build-kratos-shell.mjs'))),
 rawSolverResultSha256:sha(JSON.stringify(result)),
 sourceEngine:result.engine,analysis:result.analysis,selection:'case:LC1',residual:result.residual,
 completeStructuralVerification:false,
 loadCase:'LC1 · assigned forces and slab pressure',
 mesh:{nodeCount:model.nodes.length,shellCount:model.shells.length,
  beamCount:model.members.length,subdivisionPerOriginalQuad:4},
 stressRecovery:'linear elastic isotropic face plane stresses N/h ± 6M/h² from genuine Kratos membrane force and bending moment resultants, MPa; local shell coordinates',
 elements,beams,displacements,
 limits:'D2 B01 spatial benchmark with wall opening, 176 native Kratos QUAD4 shells, 66 actual frame members. Four real Gauss point native shell resultants per element; face stresses reconstructed from local isotropic membrane/bending resultants, not directly output as stresses by Kratos. No general building design safety certification.'
};
const target=path.join(site,'assets/fem-lab/advanced-shell-results.json');
const temp=target+'.tmp';
fs.writeFileSync(temp,JSON.stringify(out)+'\n');
fs.renameSync(temp,target);
console.log('KRATOS_SHELL_EXPORTED',JSON.stringify({
 shellCount:out.elements.length,nodes:out.mesh.nodeCount,beams:beams.length,
 residual:out.residual,engine:out.sourceEngine,
 bytes:fs.statSync(target).size,seconds:(Date.now()-t)/1000}));
