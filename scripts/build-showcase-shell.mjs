/**
 * Repeat the D2 B01 irregular two-level wall + slab FEM benchmark at 4×4
 * quadrilateral refinement. Solver code and material properties are D2's,
 * with no global D2 file mutations.
 * Data provenance: D2 scripts/b01-irregular-wall-slab-refinement.mjs;
 * D2 tests/fixtures/b01-coupled-wall-slab.hfm.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
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
const request={model,analysis:'static',selection:'case:LC1'};
const proc=spawnSync(path.join(D2,'.venv/bin/python'),[path.join(D2,'scripts/opensees_shell.py')],{
 cwd:D2,input:JSON.stringify(request),encoding:'utf8',
 timeout:105000,maxBuffer:64_000_000,
 env:{...process.env,OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1',VECLIB_MAXIMUM_THREADS:'1',OMP_WAIT_POLICY:'PASSIVE',
 PYTHONDONTWRITEBYTECODE:'1'}
});
const line=(proc.stdout??'').split('\n').find(x=>x.startsWith('HYPERFEM_JSON:'));
if(proc.status!==0||!line)throw Error('D2 OpenSees solve failed: '+String(proc.stderr).slice(-4500)+' '+String(proc.stdout).slice(-1800));
const result=JSON.parse(line.slice('HYPERFEM_JSON:'.length));
if(result.error)throw Error(result.error);
if(!(result.residual<1e-7)||result.shells.length!==176||model.shells.length!==176||!result.nodes)throw Error('Incorrect D2 native physical solve');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pts=Object.fromEntries(model.nodes.map(n=>[n.id,[n.x,n.y,n.z]]));
const selected=['sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa'];
const elements=result.shells.map(shell=>({
 id:shell.id, nodes:shell.nodes,
 vertices:shell.nodes.map(id=>pts[id]),thicknessM:shell.thickness,
 gauss:shell.gauss.map(g=>({
  position:g.point,
  top:Object.fromEntries(selected.map(key=>[key,g.faceStresses.top[key]])),
  bottom:Object.fromEntries(selected.map(key=>[key,g.faceStresses.bottom[key]]))
 }))
}));
const beams=model.members.map(b=>({id:b.id,n1:b.n1,n2:b.n2,a:pts[b.n1],b:pts[b.n2],kind:'physical supporting beam'}));
const displacements=Object.fromEntries(result.nodes.map(n=>[n.id,n.u.slice(0,3)]));
const exportData={
 schema:'delghem-showcase-shell-1',
 modelTitle:original.title,
 sourceFixture:'D2/tests/fixtures/b01-coupled-wall-slab.hfm.json',
 sourceBenchmark:'D2/scripts/b01-irregular-wall-slab-refinement.mjs',
 sourceFixtureSha256:hash(fixtureBytes),
 sourceBenchmarkSha256:hash(fs.readFileSync(path.join(D2,'scripts/b01-irregular-wall-slab-refinement.mjs'))),
 rawSolverResultSha256:hash(line),
 sourceEngine:result.engine,analysis:result.analysis,selection:result.selection,residual:result.residual,
 completeStructuralVerification:false,
 loadCase:'LC1 · distributed pressure on slabs and assigned node forces',
 mesh:{nodeCount:model.nodes.length,shellCount:model.shells.length,beamCount:model.members.length,subdivisionPerOriginalQuad:4},
 elements,beams,displacements,
 limits:'D2 B01 isolated spatial benchmark with refined QUAD shells, structural walls, slab, beams and a wall opening. Real static OpenSeesPy solver data. The face stresses are retrieved at native Gauss points, with per-shell average only for colorization. Not the homepage native building, not a project verification.'
};
const output=path.join(site,'assets/fem-lab/advanced-shell-results.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(exportData)+'\n');
console.log('SHOWCASE_EXPORTED',JSON.stringify({
 model:exportData.modelTitle,quad:exportData.mesh.shellCount,nodes:exportData.mesh.nodeCount,
 beams:exportData.mesh.beamCount,rawSha:exportData.rawSolverResultSha256,
 fileBytes:fs.statSync(output).size,engine:result.engine,residual:result.residual
}));
