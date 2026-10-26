import {siliconBenchmarks,benchmarkPresentation} from './silicon-benchmarks.mjs?v=20261026-nativebench1';

const section=document.getElementById('silicon-performance');
if(section){
 const get=id=>section.querySelector('#'+id);
 const it=document.documentElement.lang==='it';
 const t=(en,ital)=>it?ital:en;
 const fmt=(number,kind)=>number.toLocaleString(it?'it-IT':'en-GB',{
   minimumFractionDigits:kind==='time'?2:0,
   maximumFractionDigits:kind==='time'?2:0
 });
 let active='m1-single';
 const render=id=>{
  const item=siliconBenchmarks.find(x=>x.id===id);
  if(!item)return;
  const graph=benchmarkPresentation(item);
  active=id;
  const score=item.kind==='score';
  section.querySelectorAll('[data-silicon-benchmark]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.siliconBenchmark===id)));
  get('silicon-benchmark-workload').textContent=item.workload;
  get('silicon-benchmark-host').textContent=item.host;
  get('silicon-native-value').textContent=fmt(item.native,item.kind)+' '+(score?t('points','punti'):'min');
  get('silicon-translated-value').textContent=fmt(item.translated,item.kind)+' '+(score?t('points','punti'):'min');
  get('silicon-native-bar').style.width=graph.nativeWidth.toFixed(2)+'%';
  get('silicon-translated-bar').style.width=graph.translatedWidth.toFixed(2)+'%';
  get('silicon-benchmark-delta').textContent=(score?'+':'−')+fmt(graph.improvementPercent,'time')+'%';
  get('silicon-benchmark-interpretation').textContent=score?
    t('Higher Geekbench scores are better. This figure is a public Apple M1 test, not a DÈLGHEM solve.',
      'Geekbench: più punti è meglio. Il risultato riguarda Apple M1, non un calcolo DÈLGHEM.'):
    t('Lower is faster. Here native ARM64 uses a DIFFERENT Fortran compiler from x86/Rosetta: the speed difference cannot be attributed solely to translation.',
      'Un tempo inferiore è migliore. Qui ARM64 e x86/Rosetta usano compilatori Fortran DIVERSI: non si può attribuire il divario solo alla traduzione.');
  get('silicon-benchmark-method').textContent=it?
   (score?'Punteggi Geekbench 5 segnalati su MacBook Air M1 (2020). Non sono benchmark FEM né prove condotte su DÈLGHEM.':
    'Modello idrogeologico ad agenti su M5: media su 1–16 agenti. Binario x86 ifort con Rosetta 2 e ARM64 gfortran nativo, compilatori differenti. Non è una prova FEM o un confronto isolato della traduzione.'):
   (score?'Reported Geekbench 5 results on MacBook Air M1 (2020). Not a FEM benchmark or a test of DÈLGHEM.':
    'Agent-based groundwater model on M5: mean across 1–16 agents. Translated x86 ifort vs native ARM64 gfortran, different compilers. Not FEM and not an isolated translation measurement.');
  get('silicon-benchmark-source-link').href=item.source;
 };
 section.querySelectorAll('[data-silicon-benchmark]').forEach(button=>
  button.addEventListener('click',()=>render(button.dataset.siliconBenchmark)));
 render(active);
}
