/**
 * Kratos-only static, materially nonlinear cyclic benchmark evidence.
 * This specimen is axial (X) and not a global lateral Pushover capacity curve.
 * Values are taken from recorded, genuinely converged Kratos raw states.
 * Writes to the public website only; the D2 project remains read-only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const D2=process.env.DELGHEM_D2_REPO??'/Users/delghe/Desktop/D2/Progetto';
const site=path.resolve(new URL('..',import.meta.url).pathname);
const directory='work/continuous-20261022T231218Z-51b4fe/verification/distributed-aligned/results';
const source=path.join(directory,'steel-linear-distributed-cycle-preload-kratos-raw.json');
const request=path.join(directory,'steel-linear-distributed-cycle-preload-request.json');
const dataBytes=fs.readFileSync(path.join(D2,source));
const requestBytes=fs.readFileSync(path.join(D2,request));
const sourceData=JSON.parse(dataBytes);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sourceData.engine!=='KratosMultiphysics'||sourceData.complete!==true||
   sourceData.settings?.material!=='steel-fiber'||
   sourceData.settings?.geometry!=='Linear'||
   sourceData.settings?.control!=='displacement'||
   sourceData.settings?.dof!==0||
   JSON.stringify(sourceData.settings?.targets)!=='[0.012,0,-0.008,0,0.006]'||
   sourceData.sourceModel?.members?.length!==2)
 throw Error('Expected source-backed Kratos cyclic axial specimen is not qualified');
const accepted=sourceData.states.filter(s=>s.stage==='variable');
const base=sourceData.states.filter(s=>s.stage==='preload').at(-1);
if(!base||accepted.length!==240||sourceData.solverControls?.effectiveSteps!==48)
 throw Error('Kratos source requires five genuine loading branches and full preload state');
const preloadReaction=base.supportResultant[0];
const states=accepted.map((s,i)=>{
 const displacementMM=s.controlIncrement*1000;
 const axialForceKN=preloadReaction-s.supportResultant[0];
 if(!Number.isFinite(displacementMM)||!Number.isFinite(axialForceKN)||
  !Number.isFinite(s.maxPlasticStrain))throw Error('Nonfinite native Kratos result at '+s.index);
 return {
  index:s.index,
  branch:Math.floor(i/48)+1,
  displacementMM,
  axialForceKN,
  maxPlasticStrain:s.maxPlasticStrain,
  loadFactor:s.factor,
  converged:true
 };
});
const branches=sourceData.settings.targets.map((target,i)=>{
 const points=states.filter(s=>s.branch===i+1);
 if(points.length!==48)throw Error('Kratos branch '+(i+1)+' lacks accepted states');
 return {
  index:i+1,
  targetDisplacementMM:target*1000,
  firstState:points[0].index,
  lastState:points.at(-1).index,
  firstDisplacementMM:points[0].displacementMM,
  lastDisplacementMM:points.at(-1).displacementMM,
  points
 };
});
const hasPositive=states.some(x=>x.axialForceKN>0);
const hasNegative=states.some(x=>x.axialForceKN<0);
const plastic=Math.max(...states.map(s=>s.maxPlasticStrain));
if(!hasPositive||!hasNegative||plastic<0.001)
 throw Error('Genuine Kratos axial cyclic reversal and plasticity not present');
const result={
 schema:'delghem-kratos-steel-cyclic-1',
 engine:'KratosMultiphysics',
 analysis:'nonlinear-static',
 material:'steel-fiber',
 geometry:'axial',
 modelTitle:'DÈLGHEM D2 · IPE 300 S235 axial cyclic specimen · X',
 specimen:{steelGrade:'S235',profile:'IPE 300',lengthM:3,
  orientation:'X',segments:2,control:'displacement',fiberConstitutive:'steel-fiber'},
 complete:true,
 completeStructuralVerification:false,
 claimsGlobalPushoverCapacity:false,
 observedCollapse:false,
 preloadAxialReactionKN:preloadReaction,
 maxPlasticStrain:plastic,
 sourceSha256:sha(dataBytes),
 sourceRequestSha256:sha(requestBytes),
 sourcePath:'D2/'+source,
 branchCount:branches.length,
 states,branches,
 note:'Genuine completed KratosMultiphysics non-linear axial cyclic displacement-control run with 5 loading/unloading/reversal branches; 240 accepted states and observed steel-fiber plasticity. Not a lateral Pushover, not an 8-storey building capacity, not structural safety certification.'
};
const out=path.join(site,'assets/fem-lab/native-kratos-cyclic.json');
const tmp=out+'.tmp';
fs.writeFileSync(tmp,JSON.stringify(result)+'\n');
fs.renameSync(tmp,out);
console.log('KRATOS_CYCLIC_EXPORTED',JSON.stringify({
 states:states.length,branches:branches.length,maxPlasticStrain:plastic,
 axialMax:Math.max(...states.map(s=>s.axialForceKN)),
 axialMin:Math.min(...states.map(s=>s.axialForceKN)),
 sourcesha:result.sourceSha256,bytes:fs.statSync(out).size}));
