/**
 * Actual D2 Kratos steel-fiber nonlinear incremental dynamic analysis (IDA)
 * with 8 discretely solved intensity levels for two separate oriented
 * diagnostic benchmark models. Never synthetic interpolations.
 * Read-only inputs in D2. All outputs in site's assets/fem-lab/.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const D2=process.env.DELGHEM_D2_REPO||'/Users/delghe/Desktop/D2/Progetto';
const site=path.resolve(new URL('..',import.meta.url).pathname);
const {runDynamicEngine}=await import(pathToFileURL(path.join(D2,'app/dynamic-engine.mjs')).href);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const scales=[.05,.15,.30,.45,.60,.75,.90,1.0];
const dir='work/work-codex-20261024/ida/final-qualified-bending-gate';
const plans=[
 {id:'strong-X',source:'strong-X-gp5-request.json',label:'Strong axis / X'},
 {id:'weak-Y',source:'weak-Y-gp5-request.json',label:'Weak axis / Y'}
];
const results=[];
for(const item of plans){
 const input=fs.readFileSync(path.join(D2,dir,item.source),'utf8');
 const request=JSON.parse(input);
 if(request.settings.material!=='steel-fiber'||request.settings.scales.length!==2||request.settings.accelerogramG.length!==721)
   throw Error('Source is no longer a qualified scoped steel-fiber diagnostic '+item.id);
 request.settings.scales=[...scales];
 if(request.sourceModel?.dynamicAnalysis)request.sourceModel.dynamicAnalysis.scales=[...scales];
 // D2 executable service runs each exact input intensity with Kratos Newmark.
 console.log('ADVANCED_IDA_BEGIN',item.id,'scales',scales,'engine native Kratos');
 const result=await runDynamicEngine(D2,request,progress=>{
  if(progress&&typeof progress==='object')console.log('ADVANCED_IDA_PROGRESS',item.id,JSON.stringify(progress).slice(0,320));
 });
 if(result.engine!=='KratosMultiphysics'||result.runs.length!==scales.length)throw Error('D2 native solver mismatch');
 const basePeak=Math.max(...request.settings.accelerogramG.map(Math.abs));
 const rows=result.runs.map((run,i)=>{
  if(Math.abs(run.scale-scales[i])>1e-10||!['completed','collapsed','failed'].includes(run.status))
   throw Error('Invalid scale/status from Kratos');
  return {
   scale:run.scale,pgaG:basePeak*run.scale,
   peakDriftPercent:run.maxDriftRatio*100,
   peakControlMM:run.maxAbsControlM*1000,
   peakBaseShearKN:run.maxAbsBaseShearKn,
   maxPlasticStrain:run.maxPlasticStrain??null,
   status:run.status,completedTimeS:run.completedTimeS,
   reason:run.reason,
   trajectory:run.history.map((p,index)=>(index%3===0||index===run.history.length-1)?{
    timeS:p.timeS,
    groundAccelG:p.groundAccelMS2/9.80665,
    displacementMM:p.controlM*1000,
    baseShearKN:p.baseShearKn,
    driftPercent:p.driftRatio*100,
    plasticStrain:p.maxAbsPlasticStrain
   }:null).filter(Boolean)
  };
 });
 results.push({
  id:item.id,label:item.label,sourceRequestSha256:hash(input),
  sourceRequestPath:'D2/'+dir+'/'+item.source,
  derivedRequestSha256:hash(JSON.stringify(request)),
  nativeResultSha256:hash(JSON.stringify(result)),
  inputRecordG:request.settings.accelerogramG,
  dtS:request.settings.dt,
  steps:request.settings.accelerogramG.length,
  material:request.settings.material,
  engine:result.engine,completeStructuralVerification:result.completeStructuralVerification,
  runs:rows
 });
 console.log('ADVANCED_IDA_SOLVED',item.id,
  'seconds',result.elapsedSeconds,
  'statuses',rows.map(p=>p.status),
  'plastic',rows.map(p=>Number((p.maxPlasticStrain||0).toFixed(5))));
}
const out={
 schema:'delghem-showcase-steel-ida-1',
 source:'DÈLGHEM D2 native KratosMultiphysics steel-fiber nonlinear diagnostic',
 models:results,
 intensityMeasure:'PGA g',
 engineeringDemand:'peak interstorey drift percent, maximum of actual physical vertical edges',
 noFragilityClaim:true,
 noCollapseClaim:results.every(r=>r.runs.every(x=>x.status==='completed')),
 note:'Two different diagnostic cantilever orientations with discrete, independently solved intensity levels; not independent recorded earthquake events. No statistically fitted fragility or global structural verification. Operational collapsed statuses, if any, are explicitly solver thresholds and not code design limit states.'
};
const dest=path.join(site,'assets/fem-lab/native-nonlinear-ida.json');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(out)+'\n');
console.log('ADVANCED_IDA_EXPORTED',dest,fs.statSync(dest).size);
