import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const R=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(R,f),'utf8');
const {mixedDemo}=await import('../assets/real-d2/mixed-demo-geometry.mjs');
const provenance=read('assets/real-d2/MIXED_DEMO_PROVENANCE.txt');

test('mixed RC/steel DÈLGHEM demonstration is a real D2-valid editable model',()=>{
 assert.equal(mixedDemo.nodes.length,60);
 assert.equal(mixedDemo.members.length,124);
 assert.equal(mixedDemo.shells.length,30);
 assert.equal(mixedDemo.members.filter(x=>x.kind==='brace').length,8);
 assert.equal(mixedDemo.members.filter(x=>x.kind==='rc-column').length,16);
 assert.equal(mixedDemo.members.filter(x=>x.kind==='steel-column').length,32);
 assert.equal(mixedDemo.shells.filter(x=>x.kind==='rc-wall').length,8);
 assert.equal(mixedDemo.shells.filter(x=>x.kind==='rc-floor').length,22);
 assert.equal(mixedDemo.status,'conceptual_mixed_demonstration_unverified');
 assert.deepEqual(mixedDemo.qualifications,{solved:false,designed:false,executive:false});
 assert.match(provenance,/DÈLGHEM D2/);
 assert.match(mixedDemo.source.basis,/validateEditableModel/);
 assert.match(mixedDemo.source.derivedModelSha256,/^[a-f0-9]{64}$/);
});
test('section hierarchy matches real catalog families and realistic story tapering',()=>{
 const names=new Set(mixedDemo.sections.map(s=>s.name));
 for(const name of ['HEB340','HEB280','IPE400','IPE360','IPE300','IPE270','HEA160','RC 650×650 mm','RC 500×500 mm'])assert.ok(names.has(name),name);
 const section=id=>mixedDemo.sections[mixedDemo.members.find(x=>x.id===id).section].name;
 assert.equal(section('C_L1_A1'),'HEB340');
 assert.equal(section('C_L4_A1'),'HEB280');
 assert.equal(section('C_L1_B2'),'RC 650×650 mm');
 assert.equal(section('C_L4_B2'),'RC 500×500 mm');
 assert.equal(section('BX_L1_A1'),'IPE400');
 assert.equal(section('BX_L4_A1'),'IPE360');
 assert.equal(section('BY_L1_A1'),'IPE300');
 assert.equal(section('BY_L4_A1'),'IPE270');
});
test('mixed demo viewer extrudes concrete walls, floors and true I-profiles; does not invent FEA results',()=>{
 const source=read('model-stage.js');
 assert.match(source,/complex-demo-geometry\.mjs/);
 assert.match(source,/mixedDemo\.shells/);
 assert.match(source,/mixedDemo\.members/);
 assert.match(source,/crossSection/);
 assert.match(source,/paintFaces/);
 assert.match(source,/rc-wall/);
 assert.match(source,/rc-floor/);
 assert.match(source,/rc-column/);
 assert.match(source,/brac(e|ing)/);
 assert.match(source,/mode!=='deformed'/);
 assert.match(source,/view==='forces'|mode==='forces'/);
 assert.match(source,/setMotion/);
 assert.doesNotMatch(source,/No computed (stress|safety) checks have been completed[^]/);
});
test('website labels model as proposed concept not an optimized verified structural design',()=>{
 for(const path of ['index.html','it/index.html']){
  const s=read(path);
  assert.match(s,/class="model-poster"/);
  assert.match(s,/conceptual|concettuale/i);
  assert.match(s,/capriat|truss/i);
  assert.match(s,/C30\/37/);
  assert.match(s,/class="contact-copy-button"/);
 }
});
