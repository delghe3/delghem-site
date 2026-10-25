import {buildNativePortalScene,renderNativeSteelPortal} from './steel-portal-renderer.mjs?v=20261025-showcase12';

/**
 * Engineering Lab II. Two independently sourced visualisations:
 *
 * 1) DÈLGHEM D2 t-z/q-z: exact native pile reactions and geostatic σ′v,0,
 *    plus strictly labelled approximate Δσz stress-INFLUENCE proxy in
 *    surrounding layered soil. NOT a continuum FEM soil stress result.
 *
 * 2) Portal frame numerically reduced from static 2D Euler-Bernoulli FE
 *    stiffness and solved twice by DÈLGHEM D2 native MDOF Newmark engine
 *    with equivalent viscous damping. 3D frame is illustrative extrusion,
 *    NOT a direct geometric 3D Kratos seismic device model.
 */
const enhancedEngineeringRoot=document.getElementById('engineering-benchmarks');
if(enhancedEngineeringRoot){
 const it=document.documentElement.lang==='it';
 const $=id=>enhancedEngineeringRoot.querySelector('#'+id);
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const num=(v,n=2)=>Number(v).toLocaleString(it?'it-IT':'en-GB',{maximumFractionDigits:n});
 const palette=['#183d7a','#2457a6','#247ebf','#34afbe','#6fc9a7','#e2d875','#ef9a50','#dd5b4c','#922d50'].map(x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)));
 const heat=(v,max,proxy=false)=>{
  // Nonlinear *color scale*, not nonlinear manipulation of physical values.
  // Gamma=.35 enhances stress gradients away from the narrow pile-tip peak.
  const t=proxy?Math.pow(clamp(v/Math.max(1,max),0,1),.35):v/Math.max(1,max);
  const p=clamp(t,0,1)*(palette.length-1),i=Math.min(palette.length-2,Math.floor(p)),r=p-i;
  return 'rgb('+palette[i].map((v,j)=>Math.round(v+(palette[i+1][j]-v)*r)).join(',')+')';
 };
 const svgNS='http://www.w3.org/2000/svg',make=(p,tag,attrs={},content)=>{
  const x=document.createElementNS(svgNS,tag);
  for(const [name,val] of Object.entries(attrs))x.setAttribute(name,String(val));
  if(content!==undefined)x.textContent=String(content);
  p.append(x);return x;
 };
 const frameStates={caseId:'with',timeIndex:0,playing:false,cameraYaw:-.68,cameraPitch:.32,down:null,raf:0,timestamp:0,indexFraction:0};
 let soilData=null,frameData=null,frameNative=null;
 let activeSoil=null,activeFrame=null,soilState={mode:'influence',lastLayout:null};
 const c2d=(canvas)=>{
  const w=canvas.getBoundingClientRect().width;
  const h=canvas.getBoundingClientRect().height;
  if(w<60||h<60)return null;
  const ratio=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
  }
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.setTransform(ratio,0,0,ratio,0,0);
  return {ctx,w,h,ratio};
 };
 function drawArrow(ctx,x1,y1,x2,y2,color='#e47d52',width=2.3){
  const ang=Math.atan2(y2-y1,x2-x1);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);
  for(const side of [-1,1]){
   const alpha=ang+Math.PI+side*.52;
   ctx.lineTo(x2+8*Math.cos(alpha),y2+8*Math.sin(alpha));
   ctx.moveTo(x2,y2);
  }
  ctx.stroke();
 }
 function soilAt(caseData,index){
  const grid=caseData.grid;
  const x=index%grid.nx,z=Math.floor(index/grid.nx);
  return {x:grid.xMinM+x*(grid.xMaxM-grid.xMinM)/(grid.nx-1),
   z:grid.zMinM+z*(grid.zMaxM-grid.zMinM)/(grid.nz-1)};
 }
 function drawSoil(){
  if(!soilData)return;
  const selected=$('pile-soil-select')?.value??'layered-sand';
  activeSoil=soilData.cases.find(x=>x.id===selected)||soilData.cases[0];
  const sample=activeSoil,canvas=$('soil-stress-canvas'),size=c2d(canvas);
  if(!sample||!size)return;
  const {ctx,w,h}=size,g=sample.grid,isInfluence=soilState.mode==='influence';
  const margin={l:78,r:28,t:45,b:41};
  const area={x:margin.l,y:margin.t,w:w-margin.l-margin.r,h:h-margin.t-margin.b};
  const coordinateX=x=>area.x+(x-g.xMinM)/(g.xMaxM-g.xMinM)*area.w;
  const coordinateY=z=>area.y+(z-g.zMinM)/(g.zMaxM-g.zMinM)*area.h;
  ctx.fillStyle='#f3faf6';ctx.fillRect(0,0,w,h);
  for(const layer of sample.layers){
   const y0=coordinateY(layer.topM),y1=coordinateY(layer.bottomM);
   ctx.fillStyle=layer.color;
   ctx.globalAlpha=.16;ctx.fillRect(area.x,y0,area.w,y1-y0);
  }
  ctx.globalAlpha=1;
  const stress=isInfluence?g.sigmaInfluenceKPa:g.sigmaLithostaticKPa;
  const maximum=isInfluence?g.maxInfluenceKPa:Math.max(...g.sigmaLithostaticKPa);
  const dx=area.w/(g.nx-1),dz=area.h/(g.nz-1);
  // Cell data are actual D2 geostatic σ0 or expressly approximated Δσ.
  // No arbitrary image or invented tension map is blended into the canvas.
  for(let j=0;j<g.nz;j++){
   const sy=area.y+j*dz;
   for(let i=0;i<g.nx;i++){
    const k=j*g.nx+i;
    ctx.fillStyle=heat(stress[k],maximum,isInfluence);
    ctx.fillRect(area.x+i*dx,sy,dx+1,dz+1);
   }
  }
  const font=Math.max(10,Math.min(12,w/57));
  ctx.lineWidth=1.4;ctx.strokeStyle='#eff8f1';
  ctx.fillStyle='#124355';
  ctx.font='800 '+font+'px system-ui';
  ctx.textAlign='left';
  for(const [layerIndex,l] of sample.layers.entries()){
   const y=coordinateY(l.topM),ylower=coordinateY(l.bottomM);
   ctx.strokeStyle='rgba(250,255,252,.92)';
   ctx.lineWidth=1.6;
   ctx.beginPath();ctx.moveTo(area.x,y);ctx.lineTo(area.x+area.w,y);ctx.stroke();
   // A real stratigraphic swatch strip (not a fabricated stress band).
   ctx.fillStyle=l.color;
   ctx.fillRect(area.x+area.w-9,y,9,ylower-y);
   // Contrast-backed native material names remain readable on every field.
   const name=w<440
    ?('L'+(layerIndex+1)+' · '+(it
      ?(sample.id==='layered-sand'?'Sabbia':'Argilla')
      :(sample.id==='layered-sand'?'Sand':'Clay')))
    :(it?l.descriptionIt:l.descriptionEn);
   ctx.font='800 '+Math.max(9,Math.min(11,w/55))+'px system-ui';
   const tw=Math.min(area.w-42,ctx.measureText(name).width+16);
   const ly=Math.min(ylower-9,y+23);
   ctx.fillStyle='rgba(250,255,252,.87)';
   ctx.fillRect(area.x+8,ly-14,tw,20);
   ctx.fillStyle='#315365';
   ctx.fillText(name,area.x+16,ly);
  }
  // 0–24m vertical geometric depth and 0.60m diameter actual native pile.
  ctx.font='750 '+Math.max(10,Math.min(12,w/48))+'px system-ui';
  for(const z of [0,5,10,15,20,24]){
   const y=coordinateY(z);
   ctx.textAlign='right';ctx.fillStyle='#335e6c';ctx.fillText(z+' m',area.x-11,y+4);
   ctx.beginPath();ctx.moveTo(area.x-7,y);ctx.lineTo(area.x,y);ctx.strokeStyle='#557b89';ctx.stroke();
  }
  const pipeHalf=coordinateX(.3)-coordinateX(0);
  const x0=coordinateX(0),y0=coordinateY(0),tipY=coordinateY(15);
  const grad=ctx.createLinearGradient(x0-pipeHalf,0,x0+pipeHalf,0);
  grad.addColorStop(0,'#78919d');grad.addColorStop(.24,'#e5f0ef');
  grad.addColorStop(.68,'#cadada');grad.addColorStop(1,'#6a8791');
  ctx.fillStyle=grad;ctx.fillRect(x0-pipeHalf,y0,pipeHalf*2,tipY-y0);
  ctx.strokeStyle='#1d4558';ctx.lineWidth=2;ctx.strokeRect(x0-pipeHalf,y0,pipeHalf*2,tipY-y0);
  ctx.fillStyle='#233f51';ctx.beginPath();ctx.moveTo(x0-pipeHalf,tipY);
  ctx.lineTo(x0,tipY+9);ctx.lineTo(x0+pipeHalf,tipY);ctx.closePath();ctx.fill();
  // The real D2 shaft transfer is drawn vertically into the soil: positive
  // compression/skin friction transfers force downward from pile to ground,
  // and a signed reversal would reverse these arrows. Horizontal/radial
  // arrows would incorrectly suggest that the axial t-z law is lateral load.
  const maxForce=Math.max(...sample.shaftNodes.map(n=>Math.abs(n.reactionKN)));
  for(const node of sample.shaftNodes){
   if(node.depthM<=.1||node.depthM>14.75||Math.round(node.depthM*2)%4!==0)continue;
   const y=coordinateY(node.depthM);
   const length=11+22*Math.abs(node.reactionKN)/Math.max(1,maxForce);
   const sign=node.reactionKN>=0?1:-1;
   for(const x of [x0-pipeHalf-7,x0+pipeHalf+7]){
     drawArrow(ctx,x,y-sign*length*.5,x,y+sign*length*.5,'#fff4c8',2.3);
   }
  }
  drawArrow(ctx,x0,y0-32,x0,y0-3,'#c34d35',3);
  ctx.font='900 '+Math.max(11,Math.min(14,w/42))+'px system-ui';
  ctx.textAlign='center';ctx.fillStyle='#a4362a';ctx.fillText('700 kN',x0,y0-36);
  drawArrow(ctx,x0,tipY+2,x0,tipY+32,'#fbf5ca',3);
  ctx.font='800 '+Math.max(9,Math.min(12,w/60))+'px system-ui';
  ctx.fillStyle='#fcfff6';ctx.fillText((it?'PUNTA':'TOE')+' '+num(sample.toeReactionKN,1)+' kN',x0,tipY+49);
  ctx.font='750 '+Math.max(9,Math.min(11,w/58))+'px system-ui';
  ctx.textAlign='center';ctx.fillStyle='#1d4b5e';
  for(const x of [-6,-3,0,3,6]){
   ctx.fillText((x<0?'−':'')+Math.abs(x)+' m',coordinateX(x),h-11);
  }
  ctx.strokeStyle='#bdd8d2';ctx.strokeRect(area.x,area.y,area.w,area.h);
  const shaftForce=sample.shaftNodes.reduce((sum,node)=>sum+node.reactionKN,0);
  // Display actual conservative D2 t-z / q-z reactions, not extrapolated
  // stress influence integrals as if they were FEM force verification.
  $('soil-shaft-force').textContent=num(shaftForce,1)+' kN';
  $('soil-tip-force').textContent=num(sample.toeReactionKN,1)+' kN';
  $('soil-head-settlement').textContent=num(sample.pile.headSettlementMM,2)+' mm';
  $('soil-profile-depth').textContent=
   (it?'Palo':'Pile')+' Ø0,60 m · L15 m · '+num(sample.pile.headSettlementMM,2)+' mm';
  const high=isInfluence?g.maxInfluenceKPa:g.sigmaLithostaticKPa.at(-1);
  $('soil-stress-legend').innerHTML='<strong>0 kPa</strong><i aria-hidden="true"></i><strong>'+num(high,1)+' kPa</strong>';
  canvas.dataset.renderReady='true';
  soilState.lastLayout={x:area.x,y:area.y,w:area.w,h:area.h,max:high};
  $('soil-stress-field').value=soilState.mode;
  $('soil-stress-scene').dataset.ready='true';
 }
 function soilProbe(event){
  if(!soilData||!activeSoil||!soilState.lastLayout)return;
  const canvas=$('soil-stress-canvas'),box=canvas.getBoundingClientRect();
  const x=event.clientX-box.left,y=event.clientY-box.top,loc=soilState.lastLayout;
  if(x<loc.x||x>loc.x+loc.w||y<loc.y||y>loc.y+loc.h)return;
  const g=activeSoil.grid;
  const ix=clamp(Math.round((x-loc.x)/loc.w*(g.nx-1)),0,g.nx-1),
   iz=clamp(Math.round((y-loc.y)/loc.h*(g.nz-1)),0,g.nz-1);
  const value=(soilState.mode==='influence'?g.sigmaInfluenceKPa:g.sigmaLithostaticKPa)[iz*g.nx+ix];
  const depth=iz*g.zMaxM/(g.nz-1),xx=g.xMinM+ix*(g.xMaxM-g.xMinM)/(g.nx-1);
  const layer=activeSoil.layers.find(l=>depth>=l.topM-1e-6&&depth<=l.bottomM+1e-6);
  $('soil-stress-probe').textContent=
   (it?'Profondità':'Depth')+' '+num(depth,1)+' m · x='+num(xx,1)+' m · '+
   (soilState.mode==='influence'?'Δσz proxy':"σ′v,0")+' = '+num(value,2)+' kPa'+
   ' · '+(layer?(it?layer.descriptionIt:layer.descriptionEn):'');
 }

 // Reduced-order dynamic steel portal (the D2 MDOF response is genuinely
 // solved; the extrusion and steel damper cylinder are visual aids).
 const frameView={id:'with',index:0,playing:false,showThickness:true,yaw:-.57,pitch:.47,
  pointer:null,start:null,frameRaf:0,lastMs:0,indexFraction:0};
 function paintFrame(){
  if(!frameData||!frameNative)return;
  const canvas=$('steel-damper-canvas'),dimensions=c2d(canvas);
  if(!dimensions)return;
  const state=frameData.cases.find(c=>c.id===frameView.id);
  if(!state)throw Error('Native D2 time-history case not found');
  const sample=state.records[frameView.index];
  const nativeScene=renderNativeSteelPortal(dimensions.ctx,{
   width:dimensions.w,height:dimensions.h,scene:frameNative,
   yaw:frameView.yaw,pitch:frameView.pitch,
   driftMM:sample.displacementMM,amplification:12,
   timeS:sample.timeS,withDamper:frameView.id==='with',
   showThickness:frameView.showThickness,
   italian:it,format:num
  });
  // Expose structural provenance in inspectable DOM attributes: even after
  // zoom/orbit the scene contains only the 4 nodes and 3 D2 members.
  canvas.dataset.nativeMembers=String(nativeScene.sourceMemberCount);
  canvas.dataset.nativeNodes=String(frameNative.sourceNodeCount);
  canvas.dataset.nativeProfileSolids=String(frameNative.solids.length);
  canvas.dataset.nativeDimension='XZ / source 2D';
  canvas.dataset.thickness=frameView.showThickness?'on':'off';
  canvas.dataset.cameraYaw=frameView.yaw.toFixed(5);
  canvas.dataset.cameraPitch=frameView.pitch.toFixed(5);
  canvas.dataset.damperOverlay=frameView.id==='with'?'equivalent-linear-C':'none';
  canvas.dataset.ready='true';
  $('steel-frame-scene').dataset.ready='true';
 }
 function responseGraph(){
  if(!frameData)return;
  const root=$('steel-frame-response'),sets=frameData.cases;
  root.replaceChildren();
  const left=82,right=870,top=37,bottom=325;
  const x=t=>left+(t/frameData.input.dtSec/(frameData.input.accelerationMS2.length-1))*(right-left);
  const metric=$('steel-frame-metric')?.value??'displacement';
  const field=metric==='acceleration'?'roofAccelerationMS2':'displacementMM';
  const valuePeak=Math.max(...sets.flatMap(s=>s.records.map(row=>Math.abs(row[field]))));
  const peak=metric==='acceleration'
    ?Math.ceil(valuePeak/5)*5:Math.ceil(valuePeak/20)*20;
  const y=v=>(bottom+top)/2-(v/peak)*(bottom-top)*.47;
  for(let i=0;i<=6;i++){
   const time=frameData.input.dtSec*(frameData.input.accelerationMS2.length-1)*i/6;
   make(root,'line',{x1:x(time),x2:x(time),y1:top,y2:bottom,stroke:'#dae9e7','stroke-width':1});
   make(root,'text',{x:x(time),y:bottom+24,'text-anchor':'middle',fill:'#64828d','font-size':12},num(time,0));
  }
  for(const value of [-peak,-peak/2,0,peak/2,peak]){
   make(root,'line',{x1:left,x2:right,y1:y(value),y2:y(value),stroke:value===0?'#628e95':'#e0ebe7','stroke-width':value===0?1.8:1});
   make(root,'text',{x:left-14,y:y(value)+4,'text-anchor':'end',fill:'#5d7c84','font-size':12},num(value,0));
  }
  const defs=make(root,'defs'),clip=make(defs,'clipPath',{id:'steel-plot-clip'});
  make(clip,'rect',{x:left,y:top,width:right-left,height:bottom-top});
  for(const source of sets){
   const arr=source.records;let d='';
   for(let i=0;i<arr.length;i+=3){
    const p=arr[i];d+=(d?'L':'M')+x(p.timeS).toFixed(2)+','+y(p[field]).toFixed(2)+' ';
   }
   const final=arr.at(-1);d+='L'+x(final.timeS).toFixed(2)+','+y(final[field]).toFixed(2);
   make(root,'path',{d,fill:'none',stroke:source.id==='with'?'#c9774b':'#286eab',
    'stroke-width':3.6,'stroke-linecap':'round','stroke-linejoin':'round','clip-path':'url(#steel-plot-clip)'});
  }
  make(root,'text',{x:470,y:385,'text-anchor':'middle','font-size':14,fill:'#355a68'},it?'Tempo [s]':'Time [s]');
  make(root,'text',{x:20,y:180,transform:'rotate(-90,20,180)','text-anchor':'middle','font-size':14,fill:'#355a68'},
   metric==='acceleration'
    ?(it?'Accelerazione assoluta [m/s²]':'Roof absolute acceleration [m/s²]')
    :(it?'Spostamento copertura [mm]':'Roof drift [mm]'));
  const time=frameData.cases[0].records[frameView.index].timeS;
  make(root,'line',{x1:x(time),x2:x(time),y1:top,y2:bottom,stroke:'#bc653c','stroke-dasharray':'5 6','stroke-width':2,id:'steel-time-marker'});
 }
 function markTime(){
  if(!frameData)return;
  const t=frameData.cases[0].records[frameView.index].timeS;
  const xx=82+t/(frameData.input.dtSec*(frameData.input.accelerationMS2.length-1))*(870-82);
  $('steel-frame-response').querySelector('#steel-time-marker')?.setAttribute('x1',String(xx));
  $('steel-frame-response').querySelector('#steel-time-marker')?.setAttribute('x2',String(xx));
 }
 function updateFrame(){
  const source=frameData?.cases.find(x=>x.id===frameView.id);
  if(!source)return;
  const record=source.records[frameView.index];
  $('steel-frame-time').value=String(frameView.index);
  $('steel-frame-time-label').textContent=num(record.timeS,2)+' s';
  $('steel-peak-drift').textContent=num(source.peakDriftPercent,2)+'%';
  $('steel-peak-drift-label').textContent=frameView.id==='with'
    ?(it?'DRIFT CON DISPOSITIVO':'DRIFT WITH DEVICE')
    :(it?'DRIFT SENZA DISPOSITIVO':'DRIFT WITHOUT DEVICE');
  $('steel-frame-description').textContent=
   (it?'Configurazione':'Configuration')+' '+
   (frameView.id==='with'?(it?'con':'with'):(it?'senza':'without'))+' · '+
   'u(t)='+num(record.displacementMM,1)+' mm · a(t)='+num(record.roofAccelerationMS2,2)+' m/s² · '+
   (it?'deformata visuale ×12':'visual displacement ×12');
  markTime();paintFrame();
 }
 function setFrameMode(id){
  if(!['with','without'].includes(id)||!frameData)return;
  frameView.id=id;
  $('steel-frame-toggle').value=id;
  updateFrame();
 }
 function togglePlay(){
  if(!frameData)return;
  frameView.playing=!frameView.playing;
  const button=$('steel-frame-play');
  button.setAttribute('aria-pressed',String(frameView.playing));
  button.textContent=frameView.playing?(it?'Pausa':'Pause'):(it?'Riproduci':'Play');
  if(frameView.playing){
   if(frameView.index>=frameData.cases[0].records.length-1)frameView.index=0;
   frameView.lastMs=0;
   frameView.indexFraction=frameView.index;
   frameView.frameRaf=requestAnimationFrame(stepFrame);
  }else if(frameView.frameRaf){
   cancelAnimationFrame(frameView.frameRaf);frameView.frameRaf=0;
  }
 }
 function stepFrame(ms){
  if(!frameView.playing||document.hidden){frameView.frameRaf=0;return;}
  if(!frameView.lastMs)frameView.lastMs=ms;
  const elapsed=Math.min(120,Math.max(0,ms-frameView.lastMs));
  frameView.lastMs=ms;
  // Website preview 2× simulated time, actual records remain exactly those
  // computed by D2 and the selected time marker shows physical seconds.
  frameView.indexFraction=Math.min(frameData.cases[0].records.length-1,
   frameView.indexFraction+elapsed/1000/frameData.input.dtSec*2);
  frameView.index=Math.round(frameView.indexFraction);
  updateFrame();
  if(frameView.index===frameData.cases[0].records.length-1){
   frameView.playing=false;
   $('steel-frame-play').setAttribute('aria-pressed','false');
   $('steel-frame-play').textContent=it?'Riproduci':'Play';
   frameView.frameRaf=0;
   return;
  }
  frameView.frameRaf=requestAnimationFrame(stepFrame);
 }
 function initFrame(){
  $('steel-frame-time').max=String(frameData.cases[0].records.length-1);
  $('steel-frame-toggle').addEventListener('change',e=>setFrameMode(e.target.value));
  $('steel-frame-metric')?.addEventListener('change',()=>responseGraph());
  $('steel-frame-time').addEventListener('input',e=>{
   if(frameView.playing)togglePlay();
   frameView.index=clamp(Number(e.target.value)||0,0,frameData.cases[0].records.length-1);
   updateFrame();
  });
  $('steel-frame-play').addEventListener('click',togglePlay);
  $('steel-frame-camera').addEventListener('click',()=>{
   frameView.yaw=-.57;frameView.pitch=.47;updateFrame();
  });
  $('steel-frame-front')?.addEventListener('click',()=>{
   frameView.yaw=0;frameView.pitch=0;updateFrame();
  });
  $('steel-frame-thickness')?.addEventListener('click',()=>{
   frameView.showThickness=!frameView.showThickness;
   const control=$('steel-frame-thickness');
   control.setAttribute('aria-pressed',String(frameView.showThickness));
   control.textContent=it
    ?(frameView.showThickness?'Spessori ON':'Spessori OFF')
    :(frameView.showThickness?'Sections ON':'Sections OFF');
   paintFrame();
  });
  const view=$('steel-damper-canvas');
  view.style.touchAction='none';
  view.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   if(frameView.playing)togglePlay();
   frameView.pointer=e.pointerId;
   frameView.start={yaw:frameView.yaw,pitch:frameView.pitch,x:e.clientX,y:e.clientY};
   try{view.setPointerCapture(e.pointerId);}catch{}
   view.focus({preventScroll:true});
  });
  view.addEventListener('pointermove',e=>{
   if(frameView.pointer!==e.pointerId||!frameView.start)return;
   frameView.yaw=frameView.start.yaw+(e.clientX-frameView.start.x)*.008;
   frameView.pitch=clamp(frameView.start.pitch+(e.clientY-frameView.start.y)*.007,-1.33,1.33);
   paintFrame();
  });
  const end=e=>{if(frameView.pointer===e.pointerId){frameView.pointer=null;frameView.start=null;}};
  view.addEventListener('pointerup',end);
  view.addEventListener('pointercancel',end);
  view.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
   e.preventDefault();
   if(e.key==='Home'){frameView.yaw=-.57;frameView.pitch=.47;}
   if(e.key==='ArrowLeft')frameView.yaw-=.16;
   if(e.key==='ArrowRight')frameView.yaw+=.16;
   if(e.key==='ArrowUp')frameView.pitch=clamp(frameView.pitch-.15,-1.33,1.33);
   if(e.key==='ArrowDown')frameView.pitch=clamp(frameView.pitch+.15,-1.33,1.33);
   paintFrame();
  });
  $('steel-drift-reduction').textContent=num(frameData.comparison.driftReductionPercent,1)+'%';
  $('steel-damper-energy').textContent=num(frameData.cases[1].viscousDamperEnergyKNM,2)+' kN·m';
  $('steel-peak-drift').textContent=num(frameData.cases[1].peakDriftPercent,2)+'%';
  responseGraph();
  updateFrame();
 }
 (async()=>{
  try{
   const [soilResponse,frameResponse,nativeResponse]=await Promise.all([
    fetch(new URL('./assets/engineering/pile-stratigraphic-stress.json',import.meta.url),{cache:'no-cache'}),
    fetch(new URL('./assets/engineering/steel-frame-viscous-comparison.json',import.meta.url),{cache:'no-cache'}),
    fetch(new URL('./assets/engineering/portal-steel-d2.hfm.json',import.meta.url),{cache:'no-cache'})
   ]);
   if(!soilResponse.ok||!frameResponse.ok||!nativeResponse.ok)
    throw Error('Published D2 soil, native steel geometry or dynamic source unavailable');
   const [soil,frame,nativeRaw]=await Promise.all([soilResponse.json(),frameResponse.json(),nativeResponse.text()]);
   if(soil.schema!=='delghem-d2-pile-stratigraphy-influence-1'||soil.cases?.length!==2||
      soil.cases.some(x=>x.isSoilFiniteElementStress!==false||x.pile.converged!==true)||soil.completeGeotechnicalVerification!==false)
    throw Error('Native soil source scope not qualified');
   if(frame.schema!=='delghem-steel-frame-viscous-comparison-1'||frame.cases?.length!==2||
      frame.analysisDomain!=='calibrated-equivalent-SDOF'||
      frame.comparison.usesKratosSeismicDeviceRoute!==false||frame.completeSeismicVerification!==false)
    throw Error('Native D2 SDOF frame model scope not qualified');
   if(frame.geometry.nativeFrameSource!=='assets/engineering/portal-steel-d2.hfm.json')
    throw Error('D2 portal geometry URI differs from canonical native source');
   // Verify native file bytes against the SHA256 recorded by the source
   // generator. This prevents a misleading 3D render of stale geometry
   // paired with dynamic results from another structural frame.
   const hashBytes=new Uint8Array(await crypto.subtle.digest(
    'SHA-256',new TextEncoder().encode(nativeRaw)));
   const actualSha=[...hashBytes].map(v=>v.toString(16).padStart(2,'0')).join('');
   if(actualSha!==frame.geometry.nativeFrameSourceSha256)
    throw Error('D2 native portal SHA mismatch vs published dynamic data');
   frameNative=buildNativePortalScene(JSON.parse(nativeRaw),frame.geometry);
   soilData=soil;frameData=frame;
   $('soil-stress-field').addEventListener('change',e=>{
    soilState.mode=e.target.value==='lithostatic'?'lithostatic':'influence';
    drawSoil();
   });
   $('pile-soil-select').addEventListener('change',drawSoil);
   const soilCanvas=$('soil-stress-canvas');
   soilCanvas.addEventListener('pointermove',soilProbe);
   soilCanvas.addEventListener('click',soilProbe);
   const resize=new ResizeObserver(()=>{
    if(soilData)drawSoil();
    if(frameData)paintFrame();
   });
   resize.observe(soilCanvas);resize.observe($('steel-damper-canvas'));
   initFrame();drawSoil();
   enhancedEngineeringRoot.dataset.enhanced='true';
  }catch(e){
   console.error('DÈLGHEM soil/steel sourced visualisations unavailable',e);
   enhancedEngineeringRoot.dataset.enhanced='false';
  }
 })();
}
