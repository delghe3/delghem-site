import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const R=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(R,p),'utf8');
test('real reinforced concrete drawing gallery links D2 exported A1 and DXF evidence in both languages',()=>{
  for(const h of ['index.html','it/index.html']){
    const s=read(h);
    const section=s.slice(s.indexOf('<section class="rc-drawings-section'),s.indexOf('<section class="steel-story-section'));
    assert.ok(section.length>500,h+' missing RC drawing section');
    assert.match(section,/id="rc-drawings"/);
    for(const file of ['rc-column-C1.webp','rc-beam-BX1.webp','rc-beam-BY1.webp','armature-d2-a1-01.webp']){
      assert.match(section,new RegExp(file));
      assert.ok(existsSync(resolve(R,'assets/rc-drawings',file)));
      assert.ok(statSync(resolve(R,'assets/rc-drawings',file)).size>1000);
    }
    assert.match(section,/preliminar|preliminary/i);
    assert.match(section,/87/);
    assert.match(section,/DXF/);
  }
});
test('brand-focused HTML and structured data associate DELGHE with software DÈLGHEM',()=>{
  for(const h of ['index.html','it/index.html']){
    const s=read(h);
    assert.match(s,/<title>DELGHE.*DÈLGHEM/i);
    assert.match(s,/<meta name="description" content="DELGHE/);
    assert.match(s,/"@type":"Organization","@id":"https:\/\/www\.delghe\.com\/#organization","name":"DELGHE"/);
    assert.match(s,/name="robots" content="index,follow/);
    assert.match(s,/rel="canonical"/);
  }
});
