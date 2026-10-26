/**
 * Public platform benchmark evidence. These are NOT DELGHEM runtime tests and
 * must never be relabelled as DELGHEM or solver-scale speedups.
 * Each pair preserves its independent workload, units, host and source.
 */
export const siliconBenchmarks=Object.freeze([
 {
  id:'m1-single', kind:'score',native:1687,translated:1313,unit:'Geekbench 5 points',
  host:'Apple M1 MacBook Air 8 GB (2020)',
  workload:'Geekbench 5 CPU single core',
  source:'https://www.macrumors.com/2020/11/15/m1-chip-emulating-x86-benchmark/',
  scope:'Historical reported Geekbench 5 results; not a controlled DELGHEM FEM measurement'
 },
 {
  id:'m1-multi',kind:'score',native:7433,translated:5888,unit:'Geekbench 5 points',
  host:'Apple M1 MacBook Air 8 GB (2020)',
  workload:'Geekbench 5 CPU multi core',
  source:'https://www.macrumors.com/2020/11/15/m1-chip-emulating-x86-benchmark/',
  scope:'Historical reported Geekbench 5 results; Geekbench is not a FEM runtime benchmark'
 },
 {
  id:'m5-groundwater',kind:'time',native:6.66,translated:8.17,unit:'minutes',
  host:'Apple M5 MacBook Pro (public model experiment)',
  workload:'Agent-based groundwater model, 1–16 agents, mean runtime',
  source:'https://github.com/roh-sgm/ARM_Benchmark_Public',
  scope:'ARM64 gfortran and translated x86 ifort DIFFER in compiler as well as architecture; this is not an isolated translation penalty or a structural FEM run'
 }
]);
export function benchmarkPresentation(item){
 const native=item.native,translated=item.translated;
 if(!(native>0&&translated>0&&['time','score'].includes(item.kind)))throw Error('Invalid public benchmark');
 const maximum=Math.max(native,translated);
 const delta=item.kind==='score'?
   (native/translated-1)*100:
   (1-native/translated)*100;
 return {
  nativeWidth:100*native/maximum,
  translatedWidth:100*translated/maximum,
  improvementPercent:delta,
  interpretation:item.kind==='time'?'lower runtime is better':'higher score is better',
  units:item.unit,
  notDelghem:true
 };
}
