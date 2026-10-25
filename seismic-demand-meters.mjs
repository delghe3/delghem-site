/**
 * Display-only, source-consistent shear-force demand for the REAL solved
 * native D2 single-storey steel-portal equivalent-SDOF histories.
 *
 * k [kN/m] comes from Euler-Bernoulli 2D frame condensation in the stored
 * source file; displacement [mm] comes from its solved histories.
 *
 * |V_frame|=k|u_roof|. The viscous damper force is NOT included here,
 * because it is transferred through a separate schematic device and this
 * meter compares elastic frame demand, NOT total foundation shear,
 * member-end forces, local stress, or a complete NTC seismic verification.
 */
export function portalFrameShearHistory(source){
 if(source?.schema!=='delghem-steel-frame-viscous-comparison-1'
 ||source?.analysisDomain!=='calibrated-equivalent-SDOF'
 ||source?.cases?.length!==2)throw Error('Invalid native D2 portal source');
 const k=source.frameStiffness?.lateralKNM;
 if(!(Number.isFinite(k)&&k>0))throw Error('Invalid condensed frame stiffness');
 const result={
  schema:'delghem-frame-elastic-restoring-shear-v1',
  meaning:'Abs elastic frame restoring force from reduced-order lateral stiffness k times solved displacement u; not beam/column section stresses',
  without:[],with:[],peaks:{}
 };
 for(const c of source.cases){
  if(!(c.id==='with'||c.id==='without'))throw Error('Unknown portal case');
  let running=0;
  for(const row of c.records){
   if(!Number.isFinite(row.displacementMM))throw Error('Invalid native displacement');
   const currentKN=Math.abs(k*row.displacementMM/1000);
   running=Math.max(running,currentKN);
   result[c.id].push({currentKN,runningPeakKN:running});
  }
  result.peaks[c.id]=running;
 }
 if(result.with.length!==result.without.length)throw Error('Unmatched seismic input timelines');
 return result;
}
