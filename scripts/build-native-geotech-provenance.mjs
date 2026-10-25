/**
 * Evidence for the separate DÈLGHEM D2 t-z/q-z geotechnical benchmarks
 * and validated-input viscous device analytical constitutive illustrations.
 * Never call viscous example a Kratos building transient analysis.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const site=path.resolve(new URL('..',import.meta.url).pathname);
const d2=process.env.DELGHEM_D2_REPO??'/Users/delghe/Desktop/D2/Progetto';
const basename='assets/engineering';
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const read=name=>fs.readFileSync(path.join(site,name));
const report=JSON.parse(read(basename+'/soil-piles-and-dampers.json'));
const profile=JSON.parse(read(basename+'/pile-stratigraphic-stress.json'));
const frame=JSON.parse(read(basename+'/steel-frame-viscous-comparison.json'));
if(profile.schema!=='delghem-d2-pile-stratigraphy-influence-1'||profile.cases.length!==2||
 profile.cases.some(x=>x.isSoilFiniteElementStress!==false)||
 frame.schema!=='delghem-steel-frame-viscous-comparison-1'||
 frame.analysisDomain!=='calibrated-equivalent-SDOF'||
 frame.comparison.usesKratosSeismicDeviceRoute!==false||
 frame.comparison.driftReductionPercent<=0||frame.completeSeismicVerification!==false)
 throw Error('Native stratigraphy or D2 reduced dynamic comparison outside qualified scope');
for(const caseData of profile.cases){
 if(caseData.sourceHashSha256!==digest(read(basename+'/'+caseData.nativeInputFile))||
  Math.abs(caseData.shaftNodes.reduce((v,x)=>v+x.reactionKN,caseData.toeReactionKN)-caseData.loadKN)>1e-4)
  throw Error('Pile section input/equilibrium mismatch '+caseData.id);
}
if(frame.geometry.nativeFrameSourceSha256!==digest(read(frame.geometry.nativeFrameSource))||
  frame.cases.some(x=>x.energyAudit.maxNewtonResidual>1e-7))
 throw Error('D2 source steel frame geometry or dynamic convergence is not proven');
const nativePortal=JSON.parse(read(frame.geometry.nativeFrameSource));
const H=frame.geometry.sectionShapes?.S_HEB260;
const I=frame.geometry.sectionShapes?.S_IPE330;
if(nativePortal.nodes.length!==4||nativePortal.members.length!==3||
  nativePortal.nodes.some(n=>n.y!==0)||frame.geometry.visualExtrusionDepthM!==0||
  !(H?.h===.26&&H.b===.26&&H.tw===.01&&H.tf===.0175)||
  !(I?.h===.33&&I.b===.16&&I.tw===.0075&&I.tf===.0115))
 throw Error('Rendered steel portal no longer matches 4 native nodes / 3 I-profile members');

if(report.schema!=='delghem-d2-geo-and-viscous-benchmarks-1'||report.piles?.length!==2||report.devices?.length!==2
 ||report.completeGeotechnicalVerification!==false||report.completeStructuralVerification!==false)
 throw Error('Invalid DÈLGHEM D2 engineering source scope');
for(const x of report.piles){
 const actualInput=read(basename+'/'+x.sourceInput);
 if(!x.converged||Math.abs(x.residualKN)>1e-4||digest(actualInput)!==x.inputSha256)
  throw Error('Unverified D2 numerical pile equilibrium/input signature '+x.id);
}
for(const d of report.devices){
 if(!(d.energyPerCycleKNM>0)||d.cycle.length<200||
 ![.5,1].includes(d.alpha))throw Error('Constitutive passivity incomplete');
}
const inputs=[
 basename+'/pile-stratigraphic-stress.json',
 basename+'/steel-frame-viscous-comparison.json',
 frame.geometry.nativeFrameSource,
 'scripts/build-pile-stratigraphic-stress.mjs',
 'scripts/build-steel-viscous-comparison.mjs',
 'engineering-simulations.js',
 'steel-portal-renderer.mjs',
 ...['it','en'].flatMap(lang=>[
  basename+'/pile-stratigraphy-'+lang+'.webp',
  basename+'/pile-stratigraphy-clay-'+lang+'.webp',
  basename+'/pile-lithostatic-'+lang+'.webp',
  basename+'/steel-viscous-frame-'+lang+'.webp',
  basename+'/steel-viscous-bare-'+lang+'.webp',
  basename+'/steel-dynamic-response-'+lang+'.webp'
 ]),
 basename+'/soil-piles-and-dampers.json',
 basename+'/pile-layered-sand-input.json',
 basename+'/pile-layered-clay-input.json',
 basename+'/pile-curves.webp',
 basename+'/damper-velocity.webp',
 basename+'/damper-cycle.webp',
 'scripts/build-native-geotech-damper-evidence.mjs',
 'scripts/build-native-geotech-provenance.mjs'
];
const lines=[
 'DÈLGHEM D2 — GEOTECHNICAL AND VISCOUS CONSTITUTIVE DATA EVIDENCE',
 'Built 25 October 2026 from independently reproducible D2 first-party modules.',
 '',
 'STRICT ENGINE DISTINCTIONS',
 '  Pile responses are ACTUAL solved DÈLGHEM D2 geotechnical axial t-z/q-z numerical calculations (nonlinear springs of shaft and toe).',
 '  The geotechnical pile domain is not claimed to be the Kratos shell/frame solver.',
 '  Viscous damper parameters C and alpha were validated with the D2 seismic-devices input validator.',
 '  Viscous plots were generated as analytical constitutive response: NOT building FEM time-history simulation and NOT certified physical device tests.',
 '',
 'PILE SCREENING CASES (ASSUMED SOIL AND GEOMETRY)',
 ...report.piles.flatMap(p=>[
  '  '+p.id+' ('+p.kind+'):',
  '    Diameter '+p.model.diameterM+' m, length '+p.model.lengthM+' m, assumed E '+p.model.EGPa+' GPa.',
  '    Head applied vertical force '+p.model.headLoadKN+' kN; settlement '+p.headSettlementMM+' mm.',
  '    Computed shaft reaction '+p.shaftReactionKN+' kN; tip reaction '+p.tipReactionKN+' kN.',
  '    Equilibrium residual '+p.residualKN+' kN; iterations '+p.iterations+'; converged '+p.converged+'.',
  '    Raw actual native input '+p.sourceInput+' SHA256 '+p.inputSha256+'.',
  '    These are numerical diagnostic pile load–settlement responses, NOT full geotechnical NTC bearing checks or field-calibrated profiles.'
 ]),
 '',
 'PILE STRATIGRAPHY: EXACT SELF-WEIGHT AND APPROXIMATE LOAD INFLUENCE',
 '  DÈLGHEM D2 pile axial t-z/q-z solves are real nonlinear first-party calculations (shaft and toe).',
 '  EXACT layered vertical gravity effective lithostatic stress σ′v,0 is integrated using the native D2 geotech-piles.verticalStress module with ASSUMED layered unit weights.',
 '  APPROXIMATE stress influence Δσz is a regularized Boussinesq-like load spreading proxy. Its point load sources are the real D2 t-z/q-z force reactions. It is NOT a 2D/3D continuum FEM solution of a soil mass.',
 '  The computed σ0 map is valid ONLY for the declared hypothetical effective unit weights and layering. The stratum below 15 m toe is an assumed extension to 24 m.',
 '  Visual gamma=0.35 changes only the nonlinear colour scale; underlying stress numbers remain unchanged.',
 ...profile.cases.flatMap(p=>[
  '  '+p.id+': 0.60 m pile, 15 m embedment, 700 kN head load, native solution settled '+p.pile.headSettlementMM+' mm.',
  '    Tip reaction '+p.toeReactionKN+' kN and total shaft '+p.shaftNodes.reduce((a,b)=>a+b.reactionKN,0)+' kN. Balance residual '+p.pile.forceBalanceResidualKN+' kN.',
  '    Grid '+p.grid.nx+'×'+p.grid.nz+', 0–'+p.grid.zMaxM+' m, induced approximate influence peak '+p.grid.maxInfluenceKPa+' kPa.',
  '    Native pile input SHA256: '+p.sourceHashSha256+'.'
 ]),
 '',
 'FRAME TIME-HISTORY: STEEL PORTAL WITH AND WITHOUT LINEAR VISCOUS DEVICE',
 '  GEOMETRIC SOURCE CORRECTION (25 OCTOBER 2026): FOUR NATIVE NODES BL, BR, TL, TR AND THREE ACTUAL NATIVE MEMBERS ONLY.',
 '  Two HEB260 columns and one IPE330 beam. No fictitious four-column rear frame, no roof extrusions, no fake pad footings.',
 '  Actual D2 catalogue sections h,b,tw,tf: HEB260 0.260/0.260/0.010/0.0175 m, IPE330 0.330/0.160/0.0075/0.0115 m.',
 '  Correct assonometric viewer uses native file nodes/members, and verifies SHA256 of actual geometry before rendering.',
 '  A separate source-coaxial conceptual damper overlay connects BL to TR; it is NOT an additional native D2 FEM member.',
 '  DÈLGHEM Spessori ON/OFF switches 3 real profile solids per member / only native centre lines, without changing geometry or solved benchmark results.',
 '  ISO is orthographic; Frontale XZ and mouse/touch rotations are display options only.',

 '  A genuine editable DÈLGHEM D2 HEB260/IPE330 S355 portal source geometry was validated separately from its time history.',
 '  Original native portal geometry SHA256: '+frame.geometry.nativeFrameSourceSha256+' ('+frame.geometry.nativeFrameSource+').',
 '  Two completed DÈLGHEM D2 hystereticMDOF implicit Newmark runs, with equivalent SDOF lateral portal stiffness from assembled 2D Euler-Bernoulli frame finite elements.',
 '  D2 mass '+frame.input.massT+' t, K '+frame.frameStiffness.lateralKNM+' kN/m, computed f₁ '+frame.input.modalFrequencyHz+' Hz.',
 '  Both runs use the SAME explicitly synthetic analytical input accelerogram, not a recorded earthquake or calibrated design spectrum.',
 '  Without damper: peak roof response '+frame.cases[0].peakDisplacementMM+' mm.',
 '  With linear α=1 viscous device: peak roof response '+frame.cases[1].peakDisplacementMM+' mm.',
 '  This particular diagnostic source yields '+frame.comparison.driftReductionPercent+'% drift reduction, not a universal guarantee.',
 '  Equivalent dashpot Ceff=Caxial·cos²(theta), with source validated D2 Caxial=180 and α=1; equivalent Ceff='+frame.cases[1].effectiveDampingKNsM+' kN·s/m.',
 '  Validated device parameter domain in current D2 requires geometrically coincident connector nodes. The 3D diagonal is a VISUAL embodiment of an equivalent single story damper direction, NOT a native D2 end-to-end beam device connection.',
 '  NOT Kratos native 3D viscous device structural FEM and not a code-certified seismic check.',
 '  Displayed deformation magnification is 12×, expressly labelled.',
 '',
 'VISCOUS DAMPERS: CONSTITUTIVE LAW ONLY',
 ...report.devices.flatMap(d=>[
  '  '+d.id+' alpha '+d.alpha,
  '    C '+d.cCoefficientKnSecMAlpha+' in force/(velocity^alpha) consistent units; '+d.viscousLaw+'.',
  '    Harmonic displacement amplitude '+d.displacementAmplitudeMM+' mm; frequency '+d.frequencyHz+' Hz.',
  '    Maximum constitutive force '+d.maxForceKN+' kN; positive closed-loop energy '+d.energyPerCycleKNM+' kN·m.',
  '    Source-validated device PARAMETERS; results analytically sampled from the force–velocity law only.',
  '    Constitutive example: NOT dynamic FEM of a building, NOT manufacturer device certification.'
 ]),
 '',
 'DÈLGHEM D2 SOURCE MODULES (CODE BYTES HASHED, NOT COPIED)',
 ...[...report.sourceModules,
  'D2/src/core/geotech-piles.mjs',
  'D2/src/core/delghem-hysteretic-mdof.mjs',
  'D2/src/core/catalog.mjs',
  'D2/src/core/material-library.mjs'
 ].map(rel=>{
   const fragment=rel.slice('D2/'.length);
   const filepath=path.join(d2,fragment);
   return '  '+rel+' SHA256 '+digest(fs.readFileSync(filepath));
 }),
 '',
 'WEBSITE FILES (DATA, SOURCE-BASED CHART FALLBACKS AND GENERATORS)',
 ...inputs.map(p=>'  '+p+' SHA256 '+digest(read(p))+' | bytes '+read(p).byteLength),
 '',
 'LIMITATIONS AND INDEPENDENCE',
 '  No foundation safety, settlement acceptance, seismic collapse limit state, damper qualification or building capacity has been certified.',
 '  Images pile-curves.webp, damper-velocity.webp and damper-cycle.webp are screenshots from the numerical/analytical on-page plots.',
 '  Actual app screenshots are separately identified as authentic DÈLGHEM D2 application media.',
 ''
];
const location=path.join(site,basename,'PROVENANCE.txt');
fs.writeFileSync(location,lines.join('\n'));
console.log('D2_GEOTECH_DAMPER_SOURCE_PROVENANCE',location,fs.statSync(location).size,'bytes');
