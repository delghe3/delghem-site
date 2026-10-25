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
 let soilData=null,frameData=null;
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
 const frameView={id:'with',index:0,playing:false,yaw:-.70,pitch:.32,
  pointer:null,start:null,frameRaf:0,lastMs:0,indexFraction:0};
 function frameProject(position,offset,size){
  const {w,h}=size;
  const x=position[0]+offset-.0-3,y=position[1]-1.5,z=position[2]-2.05;
  const cs=Math.cos(frameView.yaw),sn=Math.sin(frameView.yaw);
  const px=x*cs-y*sn,depth=x*sn+y*cs;
  const py=z*Math.cos(frameView.pitch)-depth*Math.sin(frameView.pitch);
  const scale=Math.min(w/12.6,h/8.3);
  const perspective=clamp(1-depth*.048,.78,1.22);
  return {x:w*.50+px*scale*perspective,
   y:h*.60-py*scale*perspective,depth};
 }
 function paintFrame(){
  if(!frameData)return;
  const c=$('steel-damper-canvas'),size=c2d(c);
  if(!size)return;
  const {ctx,w,h}=size;
  const grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#f5fcfa');grad.addColorStop(1,'#d9ebe8');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  const series=frameData.cases.find(x=>x.id===frameView.id);
  const point=series.records[frameView.index];
  const amp=12,ux=point.displacementMM/1000*amp;
  const shift=(z)=>ux*Math.max(0,z/4);
  const P=(x,y,z)=>frameProject([x,y,z],shift(z),size);
  const segment=(p,q,color,width=9)=>{
   const a=P(...p),b=P(...q);
   ctx.lineCap='round';ctx.strokeStyle='#193f54';ctx.lineWidth=width+3;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   ctx.strokeStyle=color;ctx.lineWidth=width;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=Math.max(1,width*.22);
   ctx.beginPath();ctx.moveTo(a.x-1,a.y-1);ctx.lineTo(b.x-1,b.y-1);ctx.stroke();
  };
  // Engineered 6m×4m real source 2D portal geometry extruded to 3m:
  // blue HEB columns, IPE roof beam, two visible concrete bases.
  const ground=[
   P(-2,-2,0),P(8,-2,0),P(8,5,0),P(-2,5,0)
  ];
  ctx.fillStyle='#d9eae5';ctx.strokeStyle='#8cafb0';ctx.lineWidth=1.4;
  ctx.beginPath();ground.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.closePath();ctx.fill();ctx.stroke();
  for(let x=-2;x<=8;x+=1){
   const a=P(x,-2,0),b=P(x,5,0);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
   ctx.strokeStyle='#b9d5d0';ctx.lineWidth=.65;ctx.stroke();
  }
  for(let y=-2;y<=5;y+=1){
   const a=P(-2,y,0),b=P(8,y,0);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  const portal=[0,3];
  for(const offsetY of portal){
   segment([0,offsetY,0],[0,offsetY,4],'#4b97b6',12);
   segment([6,offsetY,0],[6,offsetY,4],'#3b7e9e',12);
   segment([0,offsetY,4],[6,offsetY,4],'#5aacc5',10);
  }
  for(const x of [0,6])segment([x,0,4],[x,3,4],'#6eaab9',8);
  for(const x of [0,6])for(const y of [0,3]){
   const a=P(x,y,0);
   ctx.fillStyle='#7a959b';ctx.strokeStyle='#2c5266';ctx.lineWidth=1;
   ctx.fillRect(a.x-11,a.y-2,22,10);ctx.strokeRect(a.x-11,a.y-2,22,10);
  }
  const inDamper=frameView.id==='with';
  if(inDamper){
   const a=[0,0,.10],b=[6,0,4];
   segment(a,b,'#b6c4c9',5);
   const lerp3=t=>a.map((v,i)=>v+(b[i]-v)*t);
   const f=lerp3(.55),g=lerp3(.78),e=P(...f),j=P(...g);
   ctx.lineWidth=19;ctx.strokeStyle='#9a4834';
   ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(j.x,j.y);ctx.stroke();
   ctx.lineWidth=13;ctx.strokeStyle='#f0a260';ctx.stroke();
   ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(j.x,j.y);ctx.stroke();
   ctx.lineWidth=4;ctx.strokeStyle='#f9e2b5';ctx.stroke();
   ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(j.x,j.y);ctx.stroke();
   for(const point3 of [lerp3(.55),lerp3(.78)]){
    const p=P(...point3);ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);
    ctx.fillStyle='#cfe7dd';ctx.fill();ctx.strokeStyle='#7e4d37';ctx.stroke();
   }
   ctx.fillStyle='#884125';ctx.font='850 11px system-ui';ctx.textAlign='left';
   ctx.fillText(it?'DISSIPATORE VISCOSO':'VISCOUS DAMPER',Math.min(w-155,Math.max(8,j.x+11)),j.y-8);
  }
  const roof=P(6,0,4);
  ctx.textAlign='left';
  ctx.fillStyle='#173e53';ctx.font='850 12px system-ui';
  ctx.fillText(it?'PORTALE S355 · 6 × 4 m':'S355 PORTAL · 6 × 4 m',14,24);
  ctx.font='780 10px system-ui';
  ctx.fillStyle='#4c7480';
  ctx.fillText(it?'Deformata ingrandita ×12':'Deformation exaggerated ×12',14,41);
  ctx.fillStyle=inDamper?'#b35c37':'#3a708d';ctx.font='850 12px system-ui';
  ctx.fillText((inDamper?(it?'CON VISCOSO':'WITH DAMPER'):(it?'SENZA VISCOSO':'NO DAMPER')),
   14,h-17);
  ctx.fillStyle='#226478';ctx.font='780 11px ui-monospace,monospace';
  ctx.textAlign='right';
  ctx.fillText('u = '+num(point.displacementMM,1)+' mm',w-13,24);
  ctx.fillText('t = '+num(point.timeS,2)+' s',w-13,40);
  c.dataset.ready='true';$('steel-frame-scene').dataset.ready='true';
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
   frameView.yaw=-.70;frameView.pitch=.32;updateFrame();
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
   if(e.key==='Home'){frameView.yaw=-.7;frameView.pitch=.32;}
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
   const [soilResponse,frameResponse]=await Promise.all([
    fetch(new URL('./assets/engineering/pile-stratigraphic-stress.json',import.meta.url),{cache:'no-cache'}),
    fetch(new URL('./assets/engineering/steel-frame-viscous-comparison.json',import.meta.url),{cache:'no-cache'})
   ]);
   if(!soilResponse.ok||!frameResponse.ok)throw Error('Published native D2 numerical source unavailable');
   const [soil,frame]=await Promise.all([soilResponse.json(),frameResponse.json()]);
   if(soil.schema!=='delghem-d2-pile-stratigraphy-influence-1'||soil.cases?.length!==2||
      soil.cases.some(x=>x.isSoilFiniteElementStress!==false||x.pile.converged!==true)||soil.completeGeotechnicalVerification!==false)
    throw Error('Native soil source scope not qualified');
   if(frame.schema!=='delghem-steel-frame-viscous-comparison-1'||frame.cases?.length!==2||
      frame.analysisDomain!=='calibrated-equivalent-SDOF'||
      frame.comparison.usesKratosSeismicDeviceRoute!==false||frame.completeSeismicVerification!==false)
    throw Error('Native D2 SDOF frame model scope not qualified');
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
