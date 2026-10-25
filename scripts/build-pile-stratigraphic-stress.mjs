/**
 * Real D2 pile t-z/q-z axial reaction transfer + exact layered self-weight
 * stress (sigma_v,eff,0) and a deliberately LABELLED approximate load-spread
 * vertical influence field. NOT a 2D Kratos/soil FEM result.
 *
 * All output confined to the SitoDelghem website repository.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const SITE=path.resolve(new URL('..',import.meta.url).pathname);
const D2=process.env.DELGHEM_D2_REPO??'/Users/delghe/Desktop/D2/Progetto';
const [axial,geo]=await Promise.all([
 import(pathToFileURL(path.join(D2,'src/core/pile-axial-soil.mjs')).href),
 import(pathToFileURL(path.join(D2,'src/core/geotech-piles.mjs')).href)
]);
const raw=JSON.parse(fs.readFileSync(path.join(SITE,'assets/engineering/soil-piles-and-dampers.json')));
const digest=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const round=v=>Number(v.toFixed(4));
const cases=[];
const widthM=14.4,depthM=24,nx=145,nz=161;
for(const sample of raw.piles){
 const filename=sample.sourceInput;
 const bytes=fs.readFileSync(path.join(SITE,'assets/engineering',filename));
 if(digest(bytes)!==sample.inputSha256)throw Error('Source input SHA mismatch '+sample.id);
 const item=JSON.parse(bytes);
 const solved=axial.solvePileAxialItem(item);
 if(!solved.converged||Math.abs(solved.equilibrium.residualKn)>1e-4)
  throw Error('Native axial solution not at equilibrium '+sample.id);
 if(Math.abs(solved.head.settlementM*1000-sample.headSettlementMM)>1e-8)
  throw Error('Results have drifted vs published D2 pile benchmark');
 const materials=sample.model.layers.map((layer,i)=>({
  id:'L'+(i+1),kind:sample.kind,topM:layer.topM,
  bottomM:layer.bottomM,
  gammaEffKnM3:layer.gammaEffKnM3,
  descriptionIt:sample.kind==='sand'
   ?(i===0?'Sabbia meno addensata':'Sabbia mediamente addensata')
   :(i===0?'Argilla meno consistente':'Argilla più consistente'),
  descriptionEn:sample.kind==='sand'
   ?(i===0?'Looser sand':'Medium-dense sand')
   :(i===0?'Softer clay':'Stiffer clay'),
  color:sample.kind==='sand'?['#f4d5a2','#ddbd89'][i]:['#a6c3c4','#769eaa'][i]
 }));
 const strata=[
  ...materials,
  {...materials.at(-1),id:'L3',topM:15,bottomM:depthM,
   descriptionIt:sample.kind==='sand'?'Sabbia (strato assunto fino a 24 m)':'Argilla (strato assunto fino a 24 m)',
   descriptionEn:sample.kind==='sand'?'Sand (assumed extension to 24 m)':'Clay (assumed extension to 24 m)',
   assumedExtension:true}
 ];
 const geolayers=strata.map(x=>({
  type:sample.kind,zTopM:x.topM,zBottomM:x.bottomM,gammaKnM3:x.gammaEffKnM3,
  ...(sample.kind==='sand'?{phiDeg:34}:{cuKPa:55})
 }));
 geo.validateSoilProfile(geolayers);
 const nodes=solved.nodes.map(p=>({
  depthM:p.depthM,reactionKN:p.reactionKn,settlementMM:p.settlementM*1000,
  limitShaftKnm:p.tultKnM
 }));
 const sum=nodes.reduce((s,p)=>s+p.reactionKN,0)+solved.tip.reactionKn;
 if(Math.abs(sum-700)>1e-4)throw Error('Not force conservative '+sample.id);
 const xs=Array.from({length:nx},(_,i)=>round(-widthM/2+widthM*i/(nx-1)));
 const zs=Array.from({length:nz},(_,i)=>round(depthM*i/(nz-1)));
 const litho=[],increment=[];
 const effectiveR=.6;
 const influence=(x,z)=>{
  let result=0;
  const r=Math.abs(x);
  // Axial native D2 nodal skin reactions act as distributed load sources.
  // Only BELOW each reaction depth: regularized Boussinesq-like kernel.
  // Approximation uses a smoothing radius to avoid fictitious singularities;
  // it is NOT a continuum FEM/soil stress solution.
  for(const n of nodes){
   if(z<n.depthM)continue;
   const h=z-n.depthM+effectiveR;
   const radius2=r*r+h*h;
   result+=(3*n.reactionKN*h**3)/(2*Math.PI*radius2**2.5);
  }
  if(z>=item.lengthM){
   const h=z-item.lengthM+effectiveR;
   const radius2=r*r+h*h;
   result+=(3*solved.tip.reactionKn*h**3)/(2*Math.PI*radius2**2.5);
  }
  return Math.max(0,result);
 };
 for(const z of zs)for(const x of xs){
  litho.push(round(geo.verticalStress(geolayers,z)));
  increment.push(round(influence(x,z)));
 }
 const max=Math.max(...increment);
 if(max<1||max>100000||increment.some(x=>!Number.isFinite(x)))
  throw Error('Unphysical stress-influence map '+sample.id);
 cases.push({
  id:sample.id,inputSource:'DÈLGHEM D2 t-z/q-z',
  solverModule:'D2/src/core/pile-axial-soil.mjs',
  baselineModule:'D2/src/core/geotech-piles.mjs',
  sourceHashSha256:digest(bytes),nativeInputFile:filename,
  pile:{diameterM:item.diameterM,lengthM:item.lengthM,headSettlementMM:solved.head.settlementM*1000,
   headLoadKN:item.headNKn,converged:solved.converged,
   forceBalanceResidualKN:solved.equilibrium.residualKn},
  loadKN:700,shaftNodes:nodes,toeReactionKN:solved.tip.reactionKn,layers:strata,
  grid:{nx,nz,xMinM:xs[0],xMaxM:xs.at(-1),zMinM:0,zMaxM:depthM,
   maxInfluenceKPa:round(max),sigmaLithostaticKPa:litho,sigmaInfluenceKPa:increment},
  baselineMethod:'Exact piecewise integrated layered effective vertical lithostatic stress from D2 geotech-piles.verticalStress',
  influenceMethod:'Approximate, illustrative regularized elastic load-spreading influence from actual D2 t-z shaft and q-z toe reactions; downward-only source superposition, not continuum 2D/3D FEM or a verified geotechnical stress result.',
  completeGeotechnicalVerification:false,
  isSoilFiniteElementStress:false,
  sourceDomain:'Axial pile force/settlement is a genuine DÈLGHEM D2 numerical t-z/q-z calculation. Overlay σ0 is a genuine D2 exact-layered lithostatic integral. Δσ is a transparent analytic approximation intended only to visualise pile load diffusion.',
 });
 console.log('PILE_SECTION_STRESS_OK',sample.id,{
  measuredHeadSettlementMM:solved.head.settlementM*1000,
  reactionSumKN:sum,tipKN:solved.tip.reactionKn,
  gridCells:nx*nz,maxProxyKPa:max,
  baseLithoKPa:geo.verticalStress(geolayers,depthM)});
}
const report={schema:'delghem-d2-pile-stratigraphy-influence-1',
 publicationScope:'Educational section and stress influence overlay; shaft and toe native D2 solver; exact self-weight effective lithostatic stress; approximate spread from native reactions. NO soil continuum FEM and NO NTC geotechnical ULS/SLS check.',
 completeGeotechnicalVerification:false,cases};
const destination=path.join(SITE,'assets/engineering/pile-stratigraphic-stress.json');
fs.writeFileSync(destination,JSON.stringify(report)+'\n');
console.log('PILE_STRESS_SOURCES_WRITTEN',destination,fs.statSync(destination).size);
