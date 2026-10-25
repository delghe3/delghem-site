import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const data=p=>JSON.parse(read(p));

test('Original D2 damper histories yield reproducible nonnegative frame elastic shear demand from stiffness and u(t)',async()=>{
 const {portalFrameShearHistory}=await import('../seismic-demand-meters.mjs');
 const source=data('assets/engineering/steel-frame-viscous-comparison.json');
 const result=portalFrameShearHistory(source);
 assert.equal(result.schema,'delghem-frame-elastic-restoring-shear-v1');
 assert.equal(result.without.length,source.input.accelerationMS2.length);
 assert.equal(result.with.length,result.without.length);
 const k=source.frameStiffness.lateralKNM;
 for(const c of source.cases){
  let peak=0;
  for(const [i,s] of c.records.entries()){
   const item=result[c.id][i];
   const target=Math.abs(k*s.displacementMM/1000);
   assert.ok(Math.abs(item.currentKN-target)<1e-9);
   peak=Math.max(peak,target);
   assert.ok(Math.abs(item.runningPeakKN-peak)<1e-9);
  }
  assert.ok(Math.abs(result.peaks[c.id]-peak)<1e-9);
 }
 assert.equal(result.without[0].currentKN,0);
 assert.equal(result.with[0].currentKN,0);
 assert.ok(result.peaks.without>result.peaks.with,
  'the same D2 diagnostic input has lower peak restoring shear when damping reduces drift');
});

test('Dissipator frames and isolated frames each show matching dynamic shear strips below their own canvases in IT and EN',()=>{
 for(const name of ['index.html','it/index.html']){
  const html=read(name);
  for(const [klass,control,canvasPrefix,side] of [
   ['steel-frame-case--bare','steel-bare-canvas','steel-shear','without'],
   ['steel-frame-case--damped','steel-damper-canvas','steel-shear','with'],
   ['isolation-model-card--fixed','isolation-fixed-canvas','isolation','fixed'],
   ['isolation-model-card--isolated','isolation-isolated-canvas','isolation','isolated']]){
   const start=html.indexOf(klass),end=html.indexOf('</figure>',start);
   assert.ok(start>=0&&end>start);
   const frame=html.slice(start,end);
   const ids=canvasPrefix==='steel-shear'
    ?['steel-shear-'+side+'-panel','steel-shear-'+side+'-fill','steel-shear-'+side+'-value','steel-shear-'+side+'-peak']
    :['isolation-'+side+'-shear-panel','isolation-'+side+'-shear-fill','isolation-'+side+'-shear-value','isolation-'+side+'-shear-peak','isolation-'+side+'-shear-floor'];
   for(const id of ids)assert.ok(frame.includes('id="'+id+'"'),name+' missing '+id);
   assert.ok(frame.indexOf('id="'+ids[0]+'"')>frame.indexOf('id="'+control+'"'),'below the corresponding model');
  }
  assert.match(html,/same scale|scala unica/i);
  assert.match(html,/kN/);
  assert.match(html,/non (?:è|sono) una tensione|not a member stress/i);
 }
});

test('Damper demand HUD derives from native D2 history and uses common pair scale',()=>{
 const js=read('engineering-simulations.js');
 assert.match(js,/portalFrameShearHistory/);
 assert.match(js,/\['without','with'\]/);
 assert.match(js,/\$\('steel-shear-'\+id\+'-fill'\)/);
 assert.match(js,/shearDemand\.peaks\.without/);
 assert.match(js,/shearDemand\.peaks\.with/);
 assert.match(js,/frameView\.index/);
 assert.match(js,/runningPeakKN/);
 assert.match(read('seismic-isolators.css'),/\.steel-shear-meter/);
});
