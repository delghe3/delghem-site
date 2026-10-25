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
 ...report.sourceModules.map(rel=>{
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
