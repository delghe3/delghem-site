import test from 'node:test';import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';import{resolve,dirname}from'node:path';import{fileURLToPath}from'node:url';
import{siliconBenchmarks,benchmarkPresentation}from'../silicon-benchmarks.mjs';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');const read=p=>readFileSync(resolve(base,p),'utf8');
test('Independent platform evidence is between 3D hero and engineering seismic showcase, in both locales',()=>{
 for(const file of ['index.html','it/index.html']){
  const h=read(file);
  assert.ok(h.indexOf('id="home"')<h.indexOf('id="silicon-performance"'));
  assert.ok(h.indexOf('id="silicon-performance"')<h.indexOf('id="engineering-benchmarks"'));
  for(const id of ['silicon-native-bar','silicon-translated-bar','silicon-benchmark-source-link','silicon-benchmark-delta'])
   assert.ok(h.includes('id="'+id+'"'));
  for(const id of ['m1-single','m1-multi','m5-groundwater'])assert.match(h,new RegExp('data-silicon-benchmark="'+id+'"'));
  assert.match(h,/not a DÈLGHEM|not to the DÈLGHEM|non al solutore DÈLGHEM/i);
  assert.match(h,/silicon-performance\.js\?v=20261026-nativebench1/);
  assert.match(h,/silicon-performance\.css\?v=20261026-nativebench1/);
 }
});
test('Published M1 scores and independent groundwater times have correct units and orientation',()=>{
 const [single,multi,ground]=siliconBenchmarks;
 assert.deepEqual([single.native,single.translated,multi.native,multi.translated],[1687,1313,7433,5888]);
 assert.deepEqual([ground.native,ground.translated],[6.66,8.17]);
 assert.equal(single.kind,'score');assert.equal(ground.kind,'time');
 const sg=benchmarkPresentation(single),gr=benchmarkPresentation(ground);
 assert.ok(Math.abs(sg.improvementPercent-28.484)<.05);
 assert.ok(Math.abs(gr.improvementPercent-18.482)<.05);
 assert.equal(sg.nativeWidth,100);
 assert.equal(gr.translatedWidth,100);
 assert.ok(gr.nativeWidth<gr.translatedWidth);
 for(const item of siliconBenchmarks){
  assert.equal(benchmarkPresentation(item).notDelghem,true);
  assert.ok(item.scope.includes('not')||item.scope.includes('NOT'));
  assert.ok(item.source.startsWith('https://'));
 }
});
test('Real DXF-derived composite boards are the primary portfolio images; each keeps source PDF/ZIP accessible',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=read(page);
  for(const name of ['delghem-rc-multiview-board.svg','delghem-steel-multiview-board.svg',
    'Armature-87-tavole-A1.zip','Acciaio-28-tavole-A1.zip',
    'Armature-cinque-tavole-A1.pdf','Acciaio-tre-tavole-A1.pdf'])assert.ok(html.includes(name),page+': '+name);
  assert.ok(html.indexOf('id="production-drawings"')<html.indexOf('id="materials-takeoff"'));
  assert.ok(html.indexOf('id="materials-takeoff"')<html.indexOf('id="technical-reports"'));
 }
 assert.match(read('production-drawings.js'),/production-dossier/);
});
