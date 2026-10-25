import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {computeIsolationComparison} from '../seismic-isolation-model.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
test('Both languages render independent dynamic shear-demand strips immediately beneath the matching steel frame',()=>{
 for(const path of ['index.html','it/index.html']){
  const html=read(path);
  for(const side of ['fixed','isolated']){
   const start=html.indexOf('<figure class="isolation-model-card isolation-model-card--'+side+'"');
   assert.ok(start>=0,path+': figure '+side);
   const end=html.indexOf('</figure>',start);
   assert.ok(end>start);
   const figure=html.slice(start,end);
   const canvas=figure.indexOf('id="isolation-'+side+'-canvas"');
   const panel=figure.indexOf('id="isolation-'+side+'-shear-panel"');
   assert.ok(canvas>0&&panel>canvas,path+': strip belongs BELOW matching canvas');
   for(const id of ['isolation-'+side+'-shear-value','isolation-'+side+'-shear-fill',
     'isolation-'+side+'-shear-peak','isolation-'+side+'-shear-floor']){
    assert.match(figure,new RegExp('id="'+id+'"'));
   }
   assert.match(figure,/kN/);
  }
  assert.match(html,/same scale|scala unica/i);
  assert.match(html,/not a member stress|non (?:è|sono) una tensione/i);
 }
});

test('Model computes time-varying restoring plus damping story shear directly from dynamic states',()=>{
 const s=computeIsolationComparison();
 for(const [states,name] of [[s.fixed,'fixed'],[s.isolated,'isolated']]){
  assert.equal(states[0].maxStoryShearKN,0);
  let past=0;
  for(const state of states){
   assert.equal(state.storyShearKN.length,3);
   assert.equal(state.storyVelocityMS.length,4);
   assert.equal(state.maxStoryShearKN,Math.max(...state.storyShearKN.map(Math.abs)));
   for(let j=0;j<3;j++){
    const du=(state.levelsMM[j+1]-state.levelsMM[j])/1000;
    const dv=state.storyVelocityMS[j+1]-state.storyVelocityMS[j];
    const expected=(s.parameters.storyStiffnessNPerM*du+s.parameters.storyDampingNsPerM*dv)/1000;
    assert.ok(Math.abs(expected-state.storyShearKN[j])<1e-8,name+' story '+j);
   }
   past=Math.max(past,state.maxStoryShearKN);
   assert.ok(Math.abs(state.peakReachedStoryShearKN-past)<1e-8);
   assert.ok(state.criticalStory>=1&&state.criticalStory<=3);
  }
 }
 assert.ok(s.peaks.fixedStoryShearKN>s.peaks.isolatedStoryShearKN*2,
   'this input should visibly distinguish the fixed and isolated peak demands');
 assert.equal(s.peaks.fixedStoryShearKN,Math.max(...s.fixed.map(x=>x.maxStoryShearKN)));
 assert.equal(s.peaks.isolatedStoryShearKN,Math.max(...s.isolated.map(x=>x.maxStoryShearKN)));
});

test('The live render uses a single common scale, changes values and strip widths with the time slider',()=>{
 const source=read('seismic-isolators.js');
 for(const id of ['fixed','isolated']){
  assert.ok(source.includes("['fixed',A],['isolated',B]"));
  assert.ok(source.includes("'isolation-'+side+'-shear'"));
  assert.ok(source.includes("$(base+'-value')"));
  assert.ok(source.includes("$(base+'-fill')"));
 }
 assert.match(source,/peaks\.fixedStoryShearKN/);
 assert.match(source,/peaks\.isolatedStoryShearKN/);
 assert.match(source,/peakReachedStoryShearKN/);
 assert.match(source,/tIndex/);
 assert.match(source,/maxStoryShearKN/);
 assert.match(read('seismic-isolators.css'),/\.isolation-shear-meter/);
});
