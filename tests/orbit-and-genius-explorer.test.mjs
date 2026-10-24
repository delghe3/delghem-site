import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');

test('3D model defaults to a visible, smooth automatic orbit and lets visitors reset the view',async()=>{
  const stage=await import('../model-stage.js');
  assert.ok(stage.DEFAULT_ORBIT_SPEED >= .22 && stage.DEFAULT_ORBIT_SPEED <= .65,
    'A complete rotation should take about 10 to 29 seconds, not several minutes');
  const code=read('model-stage.js');
  assert.match(code,/yaw\s*\+=\s*dt\s*\*\s*DEFAULT_ORBIT_SPEED/);
  assert.match(code,/reset-model/);
  assert.match(code,/requestAnimationFrame/);
  assert.match(code,/project\(plus\(origin,vector\),true\)/,
    'XYZ axis marker should rotate with the model, not remain fixed on screen');
  for(const home of ['index.html','it/index.html']){
    const html=read(home);
    assert.match(html,/id="reset-model"/);
    assert.match(html,/id="model-motion-status"/);
    assert.match(html,/id="rotate-model"/);
  }
  assert.match(read('app.js'),/const running\s*=\s*enabled\s*&&\s*modelRotation/);
  assert.match(read('app.js'),/setAttribute\('aria-pressed',\s*String\(running\)\)/);
});

test('Genius interactive explorer explains model edits and validation boundaries in Italian and English',()=>{
  for(const home of ['index.html','it/index.html']){
    const html=read(home);
    const section=html.slice(html.indexOf('<section class="genius-section'),html.indexOf('<section class="workflow-section'));
    assert.match(section,/id="genius-journey"/);
    assert.match(section,/id="genius-demo-command"/);
    assert.match(section,/id="genius-demo-target"/);
    assert.match(section,/id="genius-demo-change"/);
    assert.match(section,/id="genius-demo-review"/);
    for(const command of ['node','section','load','analysis'])assert.match(section,new RegExp('data-genius-case="'+command+'"'));
    assert.match(section,/non.*esegue|does not execute/i,'walkthrough must be explicitly non-executing');
    assert.match(html,/genius-demo\.js/);
  }
  const script=read('genius-demo.js');
  assert.match(script,/textContent/);
  assert.match(script,/aria-pressed/);
  assert.match(script,/Configure Pushover/);
  assert.match(script,/under validation|in fase di validazione/i);
});
