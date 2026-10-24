/**
 * Material-nonlinear S235 steel cantilever Pushover X/Y, actual D2 OpenSeesPy,
 * source-only imports, writes just website data, no D2 repository mutations.
 * Curves are benchmark local capacity to MAX ANALYSED DISPLACEMENT, not global
 * building capacity and not certified collapse/limit-state evaluation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const D2=process.env.DELGHEM_D2_REPO || '/Users/delghe/Desktop/D2/Progetto';
const site=path.resolve(new URL('..',import.meta.url).pathname);
const {example}=await import(pathToFileURL(path.join(D2,'scripts/nonlinear-fixtures.mjs')).href);
const {configurePushover}=await import(pathToFileURL(path.join(D2,'src/core/pushover.mjs')).href);
const {prepareNonlinearRequest}=await import(pathToFileURL(path.join(D2,'src/core/nonlinear-settings.mjs')).href);
const {validateNonlinearOutput}=await import(pathToFileURL(path.join(D2,'src/core/nonlinear-output.mjs')).href);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=example('steel');
baseline.title='DELGHEM D2: S235 IPE300 vertical cantilever, fiber plasticity benchmark';
baseline.nodes.find(n=>n.id==='N2').x=0;
baseline.nodes.find(n=>n.id==='N2').z=3;
baseline.nodes.find(n=>n.id==='N2').mass=[20,20,20,0,0,0];
baseline.loadCases[0].loads=[];
baseline.members[0].orientation=[0,1,0];
const results=[];
for(const direction of ['X','Y']){
 const model=configurePushover(baseline,{
  direction,shape:'mass',targetDisplacementM:.12,steps:32,
  material:'steel-fiber',geometry:'Linear',segments:2,integrationPoints:5,fiberOrder:6,
  maxIterations:75,tolerance:1e-9,hardening:.01,maxFiberStrain:.08
 });
 const request=prepareNonlinearRequest(model);
 const process=spawnSync(path.join(D2,'.venv/bin/python'),[path.join(D2,'scripts/nonlinear_bridge.py')],{
  cwd:D2,input:JSON.stringify(request),encoding:'utf8',timeout:100000,maxBuffer:60000000,
  env:{...globalThis.process.env,OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1',VECLIB_MAXIMUM_THREADS:'1',PYTHONDONTWRITEBYTECODE:'1'}
 });
 const row=(process.stdout??'').split('\n').findLast(x=>x.startsWith('HYPERFEM_NONLINEAR:'));
 if(process.status!==0||!row)throw Error('OpenSees Pushover '+direction+' FAILED: '+String(process.stderr).slice(-3000)+' '+String(process.stdout).slice(-1400));
 const result=JSON.parse(row.slice('HYPERFEM_NONLINEAR:'.length));
 if(result.error)throw Error('OpenSees '+direction+' '+result.error);
 const v=validateNonlinearOutput(result,request);
 const states=v.states.filter(s=>s.stage==='variable');
 const axis=direction==='X'?0:1;
 const points=states.map(s=>({
  displacementMM:s.controlIncrement*1000,
  shearKN:Math.abs(s.supportResultant[axis]),
  maxPlasticStrain:s.maxPlasticStrain,
  maxFiberStrain:s.maxFiberStrain,
  state:s.index,iterations:s.iterations
 }));
 const maxPlasticStrain=Math.max(...states.map(s=>s.maxPlasticStrain||0));
 if(!points.length||!v.complete||maxPlasticStrain<1e-5)throw Error('No verified converged plastic behavior for '+direction+': '+JSON.stringify({points:points.length,complete:v.complete,maxPlasticStrain,reason:v.stopReason}));
 const data={
  direction,modelTitle:baseline.title,
  sourceEngine:v.engine,material:'steel-fiber',geometry:v.settings.geometry,
  profile:'IPE 300',steelGrade:'S235',heightM:3,
  completed:v.complete,completeStructuralVerification:v.completeStructuralVerification??false,
  stageCount:points.length,
  maxPlasticStrain,firstYieldRecordedState:points.find(p=>p.maxPlasticStrain>1e-8)?.state??null,
  actualSourceRequestSha256:hash(JSON.stringify(request)),rawSolverResultSha256:hash(row),
  analysisLimit:{type:'last-converged-displacement',displacementMM:points.at(-1).displacementMM},
  points
 };
 results.push(data);
 console.log('PLASTIC_PUSHOVER',direction,JSON.stringify({states:points.length,plastic:maxPlasticStrain,maxShear:Math.max(...points.map(p=>p.shearKN)),lastU:points.at(-1).displacementMM,engine:v.engine}));
}
const out={
 schema:'delghem-showcase-plastic-pushover-1',
 realNonlinearBenchmarks:results,
 notRepresentingBuildingCapacity:true,
 note:'Two independent real steel-fiber OpenSeesPy D2 cantilever benchmark paths for IPE 300 S235 under lateral X/Y displacement control. Plastic strain >0 confirmed for both. Curves stop at last converged displacement. No global structural capacity, codified limit state or collapse is inferred. Base forces are reactions.'
};
const dest=path.join(site,'assets/fem-lab/native-plastic-pushover.json');
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(out)+'\n');
console.log('PUSHOVER_EXPORTED',dest,fs.statSync(dest).size);
