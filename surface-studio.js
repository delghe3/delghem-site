import {recoverSharedVertexField,drawContinuousContours} from './contour-shading.mjs?v=20261025-smooth19';
/**
 * DÈLGHEM native Kratos 2D surface studio — three separate completed
 * Kratos shell/QUAD4 benchmark solutions. Always-visible visualisation;
 * fields are true local Gauss-recovered face stresses in MPa, not invented
 * capacity checks; smooth nodal shading is only graphical. Browser-only view.
 */
const surfaceRoot=document.getElementById('surface-lab');
if(surfaceRoot){
 const it=document.documentElement.lang==='it';
 const $=id=>surfaceRoot.querySelector('#'+id);
 const labels={magnitude:it?'TENSIONE EQUIVALENTE':'EQUIVALENT STRESS',min:it?'Min':'Min',max:it?'Max':'Max'};
 const palette=['#1a3468','#2855a9','#267fc6','#27b2ca','#70d3bd','#e5dd7c','#f7a355','#e15e46','#a52f49'];
 const rgb=palette.map(h=>h.slice(1).match(/../g).map(t=>parseInt(t,16)));
 const lerp=(a,b,k)=>a+(b-a)*k;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const heat=t=>{
  const pos=clamp(t,0,1)*(rgb.length-1);
  const i=Math.min(rgb.length-2,Math.floor(pos)),delta=pos-i;
  return 'rgb('+rgb[i].map((v,j)=>Math.round(lerp(v,rgb[i+1][j],delta))).join(',')+')';
 };
 const dataURL=new URL('./assets/fem-lab/kratos-2d-surfaces.json',import.meta.url);
 const layerCanvas=document.createElement('canvas');
 const smoothLayer={canvas:layerCanvas,context:layerCanvas.getContext('2d',{alpha:true})};
 const fieldIndex=()=>['vonMisesMPa','sigma11MPa','sigma22MPa','tau12MPa'].indexOf(currentField);
 const gaussian=el=>el.gauss.map(g=>g[currentFace][fieldIndex()]);
 const vertexKey=(el,i)=>el.vertices[i].map(x=>Math.round(x*1e6)).join(':');

 let dataset=null,currentField='vonMisesMPa',currentFace='top',showMesh=false,aliasing=false,hovered=null;
 const cases=[...surfaceRoot.querySelectorAll('[data-surface]')];
 const byId=new Map(cases.map(e=>[e.dataset.surface,e]));
 const screen=[];
 const status=$('surface-focus-status');
 const currentUnit='MPa';
 const n=v=>Number(v).toLocaleString(it?'it-IT':'en-GB',{maximumFractionDigits:3});
 const plain=p=>[p[0],p[1]];
 function point(e,caseData,xf){
  return caseData.plane==='xz'?[e[0],e[2]]:plain(e);
 }
 function boxFor(caseData,container){
  const points=caseData.elements.flatMap(el=>el.vertices.map(p=>point(p,caseData)));
  const loX=Math.min(...points.map(p=>p[0])),hiX=Math.max(...points.map(p=>p[0]));
  const loY=Math.min(...points.map(p=>p[1])),hiY=Math.max(...points.map(p=>p[1]));
  const width=container.clientWidth,height=container.clientHeight;
  const marginX=Math.max(23,width*.055),marginY=Math.max(28,height*.075);
  const zoom=Math.min((width-2*marginX)/Math.max(.01,hiX-loX),
   (height-2*marginY)/Math.max(.01,hiY-loY));
  return {
   scale:zoom,
   screen:point=>({
    x:(width-(hiX-loX)*zoom)/2+(point[0]-loX)*zoom,
    y:(height+(hiY-loY)*zoom)/2-(point[1]-loY)*zoom
   }),
   width,height,loX,hiX,loY,hiY
  };
 }
 function worldQuad(q,u,v){
  const weights=[(1-u)*(1-v),u*(1-v),u*v,(1-u)*v];
  return [0,1].map(d=>weights.reduce((s,w,k)=>s+w*q[k][d],0));
 }
 function shadeCell(ctx,verts,fill){
  ctx.beginPath();
  verts.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 }
 function paintCase(caseData,element){
  const canvas=element.querySelector('canvas');
  if(!canvas)return;
  const {width,height}=canvas.getBoundingClientRect();
  if(width<30||height<30)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const pixelWidth=Math.max(1,Math.round(width*dpr)),pixelHeight=Math.max(1,Math.round(height*dpr));
  if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
  const c=canvas.getContext('2d',{alpha:false});
  c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle='#eef8f4';c.fillRect(0,0,width,height);
  const grad=c.createLinearGradient(0,0,0,height);
  grad.addColorStop(0,'#f7fcf7');grad.addColorStop(1,'#dcebe9');
  c.fillStyle=grad;c.fillRect(0,0,width,height);
  const geo=boxFor(caseData,canvas);
  const values=caseData.elements.flatMap(e=>e.gauss.map(g=>g[currentFace][['vonMisesMPa','sigma11MPa','sigma22MPa','tau12MPa'].indexOf(currentField)]));
  const min=Math.min(...values),max=Math.max(...values),range=Math.max(max-min,1e-8);
  const cells=[];
  // ALIASING: shared vertex colors and one full-resolution interpolated
  // raster layer. No painted micro-cells, no interpolation across voids.
  if(aliasing){
   const recovered=recoverSharedVertexField(caseData.elements,gaussian,vertexKey);
   const quads=caseData.elements.map((el,i)=>({
    pts:el.vertices.map(p=>geo.screen(point(p,caseData))),values:recovered[i]
   }));
   drawContinuousContours(c,smoothLayer,quads,palette,min,max,dpr);
  }
  for(const el of caseData.elements){
   const q=el.vertices.map(p=>point(p,caseData)),outline=q.map(geo.screen);
   // Picking reports the original arithmetic mean of four Gauss samples.
   const inside=gaussian(el);
   if(!aliasing)for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const u=col/2,v=row/2,u2=(col+1)/2,v2=(row+1)/2;
    const pts=[[u,v],[u2,v],[u2,v2],[u,v2]]
     .map(uv=>geo.screen(worldQuad(q,...uv)));
    const value=inside[row===0?(col===0?0:1):(col===0?3:2)];
    shadeCell(c,pts,heat((value-min)/range));
   }
   if(showMesh){
    c.beginPath();
    outline.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.closePath();c.lineWidth=.62;c.strokeStyle='rgba(23,66,88,.47)';c.stroke();
   }
   if(hovered?.caseId===caseData.id&&hovered?.elementId===el.id){
    c.beginPath();
    outline.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.closePath();c.lineWidth=2.8;c.strokeStyle='#132f3b';c.stroke();
   }
   cells.push({id:el.id,q:outline,mean:inside.reduce((s,x)=>s+x,0)/inside.length});
  }
  // The outlines and openings are actual element topology; do not paint a
  // fictitious continuous field through the two windows/service opening.
  const sample=cells.map(cell=>cell.q[0]);
  const resultCard=element.querySelector('.surface-footer');
  if(resultCard){
   const minimum=resultCard.querySelector('[data-surface-min]');
   const maximum=resultCard.querySelector('[data-surface-max]');
   if(minimum)minimum.textContent=n(min)+' '+currentUnit;
   if(maximum)maximum.textContent=n(max)+' '+currentUnit;
  }

  c.fillStyle='#204d61';
  c.font='750 10px ui-monospace, SFMono-Regular, monospace';
  c.textAlign='left';
  c.fillText(caseData.mesh.shells+' QUAD4 · '+caseData.diagnostics.residual.toExponential(1)+' res.',12,19);
  c.font='650 10px system-ui';
  c.fillStyle='#567b82';
  c.textAlign='right';
  c.fillText(caseData.plane==='xz'?'X–Z':'X–Y',width-11,20);
  c.textAlign='left';
  element.dataset.stressReady='true';
  element._surfacePicking={cells,dpr,width,height,canvas};
 }
 function inside(p,q){
  let c=false;
  for(let i=0,j=q.length-1;i<q.length;j=i++){
   const a=q[i],b=q[j];
   if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)c=!c;
  }
  return c;
 }
 function schedule(){
  for(const c of dataset?.cases??[]){
   const el=byId.get(c.id);
   if(el)paintCase(c,el);
  }
  const lbl={'vonMisesMPa':'σVM','sigma11MPa':'σ11','sigma22MPa':'σ22','tau12MPa':'τ12'}[currentField];
  const info=$('surface-field-readout');
  if(info)info.textContent=lbl+' · '+(currentFace==='top'?(it?'Faccia superiore':'Top face'):(it?'Faccia inferiore':'Bottom face'));
 }
 function pointer(event,card){
  if(!dataset)return;
  const hit=dataset.cases.find(s=>s.id===card.dataset.surface);
  const c=card._surfacePicking;
  if(!hit||!c)return;
  const r=c.canvas.getBoundingClientRect();
  const p={x:event.clientX-r.left,y:event.clientY-r.top};
  const item=c.cells.findLast(q=>inside(p,q.q));
  const updated=item?{caseId:hit.id,elementId:item.id,mean:item.mean}:null;
  if(JSON.stringify(updated)!==JSON.stringify(hovered)){
   hovered=updated;schedule();
  }
  if(status)status.textContent=item
   ?hit[it?'titleIt':'titleEn']+' · '+item.id+' · '+n(item.mean)+' MPa'
   :(it?'Seleziona un elemento per leggere la tensione.':'Select an element to inspect its stress.');
 }
 (async()=>{
  try{
   const r=await fetch(dataURL,{cache:'no-cache'});
   if(!r.ok)throw new Error('Source-backed Kratos dataset not reachable: HTTP '+r.status);
   const value=await r.json();
   if(value.schema!=='delghem-kratos-2d-surface-suite-1'||value.engine!=='KratosMultiphysics'||value.cases?.length!==3
     ||value.cases.some(x=>x.sourceEngine!=='KratosMultiphysics'||x.completeStructuralVerification!==false||x.elements.length!==x.mesh.shells))
    throw new Error('Kratos numerical scope not validated');
   dataset=value;
   for(const card of cases){
    const canvas=card.querySelector('canvas');
    if(!canvas)continue;
    card.dataset.stressReady='false';
    canvas.addEventListener('pointermove',e=>pointer(e,card));
    canvas.addEventListener('click',e=>pointer(e,card));
    canvas.addEventListener('pointerleave',()=>{if(hovered){hovered=null;schedule();}});
   }
   for(const id of ['surface-field','surface-face']){
    $(id)?.addEventListener('change',()=>{
     currentField=$('surface-field').value;
     currentFace=$('surface-face').value;
     hovered=null;schedule();
    });
   }
   $('surface-mesh-toggle')?.addEventListener('click',e=>{
    showMesh=!showMesh;
    e.currentTarget.setAttribute('aria-pressed',String(showMesh));
    hovered=null;schedule();
   });
   $('surface-aliasing-toggle')?.addEventListener('click',e=>{
    aliasing=!aliasing;
    e.currentTarget.setAttribute('aria-pressed',String(aliasing));
    surfaceRoot.dataset.aliasing=String(aliasing);
    hovered=null;schedule();
   });
   const observer=new ResizeObserver(()=>schedule());
   for(const card of cases)observer.observe(card.querySelector('canvas'));
   schedule();
   surfaceRoot.dataset.loaded='true';
   surfaceRoot.querySelector('.surface-error')?.remove();
  }catch(error){
   console.error('3D+2D FEM: authentic Kratos 2D source unavailable',error);
   surfaceRoot.dataset.loaded='false';
   const message=surfaceRoot.querySelector('.surface-error');
   if(message)message.hidden=false;
  }
 })();
}
