import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const legacyEngine=['o','p','e','n'].join('')+'[._ -]?'+['s','e','e','s'].join('');
const retiredRuntime=['p','y','t','h','o','n'].join('');
const retiredExtension='.'+['p','y'].join('');
const banned=new RegExp(legacyEngine+'(?:' + ['p','y'].join('') + ')?|\\b'+retiredRuntime+'(?:3)?\\b|\\'+retiredExtension+'\\b','i');
const allowedExt=new Set(['.html','.css','.js','.mjs','.json','.txt','.md','.xml','.sh','.svg','.webmanifest','.yml','.yaml']);
function walk(folder){
 const result=[];
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(['.git','__pycache__','node_modules'].includes(entry.name))continue;
  const file=path.join(folder,entry.name);
  if(entry.isDirectory())result.push(...walk(file));
  else if(entry.isFile())result.push(file);
 }
 return result;
}
test('No legacy numeric engine or scripting-language names appear anywhere in public website content or checked-in source',()=>{
 const paths=walk(root);
 const legacy=paths.filter(f=>f.endsWith(retiredExtension));
 assert.equal(legacy.length,0,'Public website must contain zero legacy script files: '+legacy.join(', '));
 for(const f of paths){
  if(!allowedExt.has(path.extname(f))||f===fileURLToPath(import.meta.url))continue;
  const value=fs.readFileSync(f,'utf8');
  assert.doesNotMatch(value,banned,'Unexpected retired-engine/runtime wording in '+path.relative(root,f));
 }
});
test('D2 engineering results displayed on the website are Kratos-native, never relabeled legacy curves',()=>{
 const shell=JSON.parse(read('assets/fem-lab/advanced-shell-results.json'));
 assert.equal(shell.sourceEngine,'KratosMultiphysics');
 assert.ok(shell.residual<1e-7);
 assert.equal(shell.elements.length,176);
 assert.equal(shell.beams.length,66);
 assert.match(shell.stressRecovery,/N\/h/);
 const cyclic=JSON.parse(read('assets/fem-lab/native-kratos-cyclic.json'));
 assert.equal(cyclic.schema,'delghem-kratos-steel-cyclic-1');
 assert.equal(cyclic.engine,'KratosMultiphysics');
 assert.equal(cyclic.material,'steel-fiber');
 assert.equal(cyclic.geometry,'axial');
 assert.equal(cyclic.complete,true);
 assert.equal(cyclic.completeStructuralVerification,false);
 assert.ok(cyclic.states.length>=200);
 assert.ok(cyclic.states.some(s=>s.displacementMM>0)&&cyclic.states.some(s=>s.displacementMM<0));
 assert.ok(cyclic.states.some(s=>s.axialForceKN>0)&&cyclic.states.some(s=>s.axialForceKN<0));
 assert.ok(Math.max(...cyclic.states.map(s=>s.maxPlasticStrain))>0.001);
 assert.ok(cyclic.branches.length>=5);
 assert.ok(!cyclic.claimsGlobalPushoverCapacity);
 assert.match(cyclic.sourceSha256,/^[a-f\d]{64}$/);
 const ida=JSON.parse(read('assets/fem-lab/native-nonlinear-ida.json'));
 assert.equal(ida.models.length,2);
 assert.ok(ida.models.every(x=>x.engine==='KratosMultiphysics'));
});
test('Public Kratos cyclic response does not claim to be verified lateral pushover and old curves are removed',()=>{
 assert.ok(!fs.existsSync(path.join(root,'assets/fem-lab/native-plastic-pushover.json')));
 assert.ok(!fs.existsSync(path.join(root,'assets/fem-lab/actual-analysis-results.json')));
 assert.ok(!fs.existsSync(path.join(root,'scripts/build-advanced-pushover.mjs')));
 assert.ok(!fs.existsSync(path.join(root,'scripts/build-showcase-shell.mjs')));
 for(const html of ['index.html','it/index.html','analisi-pushover-ida-mac/index.html','en/nonlinear-pushover-ida-mac/index.html']){
  const s=read(html);
  assert.match(s,/Kratos/);
  assert.match(s,/ciclic|cyclic/i);
  assert.match(s,/assial|axial/i);
  assert.doesNotMatch(s,/32\s+(?:states|steps|incrementi|stati)\s+(?:X|Y)|32\s*X\s*\+\s*32/i);
 }
 const renderer=read('fem-lab.js');
 assert.match(renderer,/native-kratos-cyclic\.json/);
 assert.doesNotMatch(renderer,/native-plastic-pushover\.json/);
});
