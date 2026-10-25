/**
 * Generate an independently inspectable provenance inventory for the
 * KratosMultiphysics-only published DÈLGHEM FEM laboratory.
 * Static website-only artifact; never alters original D2 application.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const site=path.resolve(new URL('..',import.meta.url).pathname);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=rel=>fs.readFileSync(path.join(site,rel));
const shell=JSON.parse(read('assets/fem-lab/advanced-shell-results.json'));
const cyclic=JSON.parse(read('assets/fem-lab/native-kratos-cyclic.json'));
const ida=JSON.parse(read('assets/fem-lab/native-nonlinear-ida.json'));
const surfaces=JSON.parse(read('assets/fem-lab/kratos-2d-surfaces.json'));
if(shell.sourceEngine!=='KratosMultiphysics'||cyclic.engine!=='KratosMultiphysics'||
 ida.models.some(x=>x.engine!=='KratosMultiphysics')||!cyclic.complete||
 shell.elements.length!==176||cyclic.states.length!==240||
 surfaces.engine!=='KratosMultiphysics'||surfaces.cases?.length!==3||
 surfaces.cases.some(c=>c.sourceEngine!=='KratosMultiphysics'||c.completeStructuralVerification!==false||c.mesh.shells!==c.elements.length))
 throw Error('Unqualified Kratos provenance; no public inventory emitted');
const items=[
 'assets/fem-lab/kratos-2d-surfaces.json',
 'assets/fem-lab/kratos-2d-input/skewed-double-opening-slab.hfm.json',
 'assets/fem-lab/kratos-2d-input/double-window-shear-wall.hfm.json',
 'assets/fem-lab/kratos-2d-input/l-shaped-transfer-plate.hfm.json',
 'assets/fem-lab/gallery/surface-skewed-double-opening-slab.webp',
 'assets/fem-lab/gallery/surface-double-window-shear-wall.webp',
 'assets/fem-lab/gallery/surface-l-shaped-transfer-plate.webp',
 'scripts/build-kratos-2d-surfaces.mjs',
 'assets/fem-lab/advanced-shell-results.json',
 'assets/fem-lab/native-kratos-cyclic.json',
 'assets/fem-lab/native-nonlinear-ida.json',
 'assets/fem-lab/gallery/stress-actual-solver.webp',
 'assets/fem-lab/gallery/kratos-axial-loading.webp',
 'assets/fem-lab/gallery/kratos-axial-cyclic-loop.webp',
 'assets/fem-lab/gallery/kratos-axial-plastic-strain.webp',
 'assets/fem-lab/gallery/ida-nonlinear-x-actual-solver.webp',
 'assets/fem-lab/gallery/ida-nonlinear-y-actual-solver.webp',
 'assets/fem-lab/gallery/ida-hysteresis-actual-solver.webp',
 'assets/fem-lab/gallery/ida-hysteresis-y-actual-solver.webp',
 'assets/fem-lab/gallery/accelerogram-x-actual-solver.webp',
 'assets/fem-lab/gallery/accelerogram-y-actual-solver.webp',
 'assets/fem-lab/gallery/response-x-actual-solver.webp',
 'assets/fem-lab/gallery/response-y-actual-solver.webp',
 'scripts/build-kratos-shell.mjs',
 'scripts/build-kratos-cyclic.mjs',
 'scripts/build-advanced-ida.mjs'
];
const lines=[
 'DÈLGHEM D2 — KRATOSMULTIPHYSICS SOURCE-BACKED FEM LAB',
 'Build date: 25 October 2026',
 'This is a website source evidence record for distinct, actually solved D2 Kratos benchmark cases.',
 '',
 'ENGINE: KratosMultiphysics for all FEM source-backed charts in the FEM Laboratory (B01, axial cyclic, IDA, and the three 2D QUAD4 shell solves).',
 'SEPARATE NUMERICAL DOMAINS: geotechnical pile t-z/q-z response uses the DÈLGHEM D2 pile-axial module, and viscous plots are validated-input constitutive illustrations; see assets/engineering/PROVENANCE.txt.',,
 '',
 'STATIC SHELL BENCHMARK B01',
 '  Solver: '+shell.sourceEngine,
 '  Separate geometry: '+shell.modelTitle,
 '  Elements: '+shell.mesh.shellCount+' QUAD4, '+shell.mesh.beamCount+' physical beam segments, '+shell.mesh.nodeCount+' nodes.',
 '  Static equilibrium residual: '+shell.residual,
 '  Input fixture SHA256: '+shell.sourceFixtureSha256,
 '  Solved native Kratos result SHA256: '+shell.rawSolverResultSha256,
 '  Face stress recovery: '+shell.stressRecovery,
 '  Values in MPa are reconstructed from native local membrane force and bending moment resultants N/h ± 6M/h²; surface color uses only same-element Gauss values.',
 '  NOT a certified static or seismic verification of the homepage concept tower.',
 '',
 'NONLINEAR STATIC S235 STEEL-FIBER AXIAL CYCLIC SPECIMEN',
 '  Solver: '+cyclic.engine,
 '  Specimen: '+cyclic.specimen.profile+', steel '+cyclic.specimen.steelGrade+', '+cyclic.specimen.lengthM+' m, '+cyclic.specimen.orientation+' axis.',
 '  Five axial loading/unloading/reversal branches, '+cyclic.states.length+' genuinely accepted variable states.',
 '  Maximum observed fiber plastic strain: '+cyclic.maxPlasticStrain,
 '  D2 raw result SHA256: '+cyclic.sourceSha256,
 '  Original analysis request SHA256: '+cyclic.sourceRequestSha256,
 '  Source: '+cyclic.sourcePath,
 '  This is an axial cyclic case, NOT a lateral building Pushover capacity curve; no ultimate displacement/collapse inferred.',
 '',
 'INCREMENTAL DYNAMIC ANALYSIS',
 '  Solver: KratosMultiphysics',
 '  '+ida.models.length+' diagnostic orientations, '+ida.models.reduce((n,m)=>n+m.runs.length,0)+' genuinely completed nonlinear intensity analyses.',
 ...ida.models.map(x=>'  '+x.id+': input SHA256 '+x.sourceRequestSha256+'; native result SHA256 '+x.nativeResultSha256),
 '  Input accelerograms are analytical diagnostics, not actual historic earthquake records.',
 '  No collapse observed; no statistical fragility curve is inferred from the orientations.',
 '',
 'THREE INDEPENDENT KRATOS 2D PLANAR QUAD4 SURFACE BENCHMARKS',
 '  All have physically meshed openings and actual native Kratos input/result evidence.',
 ...surfaces.cases.flatMap(c=>[
  '  '+c.id+' ('+c.plane+' plane)',
  '    Native solver: '+c.sourceEngine+'; analysis: '+c.analysis+'.',
  '    Mesh: '+c.mesh.nodes+' nodes, '+c.mesh.shells+' QUAD4 shell elements; '+c.mesh.gaussPerShell+' Gauss points each.',
  '    Load: '+c.load.pressureKNM2+' kN/m2 '+c.load.system+'; boundary: '+c.boundary.support+'.',
  '    Static equilibrium residual: '+c.diagnostics.residual+'.',
  '    Input SHA256: '+c.sourceSha256+' (assets/fem-lab/'+c.sourceFile+').',
  '    Native calculated result SHA256: '+c.nativeSolverResultSha256+'.',
  '    Stress: '+c.stressRecovery,
  '    This benchmark is NOT certified or qualified for building safety; stresses recovered for elastic local faces only.'
 ]),
 '',
 'IMAGE AND DATA FILE INTEGRITY (SOURCE HASHES)',
 ...items.map(rel=>rel+' | SHA256: '+hash(read(rel))+' | bytes: '+read(rel).byteLength),
 '',
 'RESTRICTIONS',
 '  All cases are independently documented benchmarks and are not results for the eight-storey homepage D2 concept structure.',
 '  Not certified or licensed structural design checks; no inferred code compliance or verified collapse capacity.',
 '  Gallery images are browser captures of genuine solver-fed Canvas/SVG plots; they are not photographs of the engineering application.',
 '  Source screenshots of the D2 interface are separate original media, not representations of the same 240-state axial specimen.',
 ''
];
const out=path.join(site,'assets/fem-lab/PROVENANCE.txt');
fs.writeFileSync(out,lines.join('\n'));
console.log('KRATOS_PROVENANCE_EXPORTED',out,fs.statSync(out).size,'entries',items.length);
