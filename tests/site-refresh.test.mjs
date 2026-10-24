import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');
const pages=[['Italiano',read('index.html')],['English',read('en/index.html')]];
const css=read('style.css');

test('La frase richiesta compare accanto al pagamento in entrambe le lingue',()=>{
  assert.match(read('index.html'),/Delghem è un progetto indipendente, se vuoi supportarlo con una donazione aiuteresti concretamente il progetto a prendere vita/);
  assert.match(read('en/index.html'),/Delghem is an independent project/i);
  for(const [,html] of pages){
    assert.ok(html.indexOf('class="paypal-personal-appeal"')>0);
    assert.ok(html.indexOf('class="paypal-personal-appeal"')<html.indexOf('class="paypal-send-link"'));
  }
});

test('rimuove il vecchio pulsante donazione riservato a configurazioni non verificate',()=>{
  for(const [language,html] of pages){
    assert.doesNotMatch(html,/cmd=_donations|cgi-bin\/webscr\?cmd=/i,language);
    assert.doesNotMatch(html,/<a[^>]*class="donate-button"/i,language);
  }
});

test('per ogni lingua offre il percorso di invio PayPal e il destinatario reale',()=>{
  for(const [language,html] of pages){
    assert.match(html,/class="paypal-send-link"/,language);
    assert.match(html,/https:\/\/www\.paypal\.com\/myaccount\/transfer\/send/,language);
    assert.match(html,/ildelghe3@gmail\.com/,language);
    assert.match(html,/class="copy-paypal"/,language);
    assert.match(html,/id="paypal-copy-status"/,language);
  }
});

test('spiega il percorso corretto, senza fingere che il pagamento sia precompilato',()=>{
  assert.match(pages[0][1],/Invia e richiedi/);
  assert.match(pages[0][1],/Beni e servizi/);
  assert.match(pages[1][1],/Send &amp; Request/);
  assert.match(pages[1][1],/Goods and Services/);
  for(const [language,html] of pages){
    assert.match(html,/class="funding-steps"/,language);
    assert.match(html,/class="paypal-me-note"/,language);
  }
});

test('prima schermata bilingue e percorsi rapidi tecnici accessibili',()=>{
  for(const [language,html] of pages){
    assert.match(html,/class="hero-spec"/,language);
    assert.match(html,/class="engineering-track"/,language);
    assert.match(html,/href="#app"/,language);
    assert.match(html,/href="#support"/,language);
    assert.match(html,/id="structure-canvas"/,language);
    assert.match(html,/vAlpha1/,language);
    assert.match(html,/2027/,language);
  }
});

test('CSS responsive per nuova grafica e conto personale',()=>{
  for(const name of ['.hero-spec','.engineering-track','.funding-steps','.paypal-send-link','.paypal-me-note']){
    assert.ok(css.includes(name),'Missing '+name);
  }
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/@media\s*\(max-width:\s*650px\)/);
});

test('preesistenze bilingui e DNS conservati',()=>{
  assert.equal(read('CNAME').trim(),'www.delghe.com');
  for(const [language,html] of pages){
    assert.match(html,/assets\/app-model\.png/,language);
    assert.match(html,/support-actions\.js/,language);
    assert.match(html,/(share-actions|social)\.js/,language);
  }
});

test('il pulsante di copia presenta stato accessibile',()=>{
  const js=read('support-actions.js');
  assert.match(js,/paypal-copy-status/);
  assert.match(js,/navigator\.clipboard/);
  assert.match(read('index.html'),/aria-live="polite"/);
});


test('frase di invito richiesta compare immediatamente accanto al pulsante PayPal in italiano e inglese',()=>{
  const italian='Delghem è un progetto indipendente, se vuoi supportarlo con una donazione aiuteresti concretamente il progetto a prendere vita';
  const english='Delghem is an independent project. If you choose to support it with a donation, you will help bring the project to life.';
  for(const [language,html] of pages){
    const section=html.split('<section class="support-section chapter"')[1].split('</section>')[0];
    const expected=language==='Italiano'?italian:english;
    assert.ok(section.includes(expected),language+': missing invitation');
    const position=section.indexOf(expected);
    assert.ok(position>0&&Math.abs(section.indexOf('class="paypal-send-link"')-position)<1800,language+': invitation too far from PayPal button');
    assert.match(section,/class="paypal-impact-statement"/,language);
  }
});

test('mobile release teaser separates alpha date and support link',()=>{
 for(const [language,html] of pages){
  assert.match(html,/class="release-inline"/);
  assert.match(html,/class="hero-support-link"/);
 }
 assert.match(css,/\.release-inline\s*>\s*span/);
 assert.match(css,/@media\s*\(max-width:\s*650px\)/);
});
