import {computeIsolationComparison} from './seismic-isolation-model.mjs?v=20261025-shear2';

/**
 * Synchronized 3D-looking diagram of a MULTIBAY STEEL FRAME, not a spatial
 * FEM deformation. Its motion is mapped from a separate lumped-mass
 * Newmark shear-building calculation; see the on-page qualification.
 */
const isolationRoot=document.getElementById('seismic-isolation');
if(isolationRoot){
 const it=document.documentElement.lang==='it';
 const $=id=>isolationRoot.querySelector('#'+id);
 const model=computeIsolationComparison();
 const {fixed,isolated,timeline,peaks}=model;
 const dt=model.parameters.dtS,duration=model.parameters.durationS;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let tIndex=0,cursor=0,playing=true,visible=false,manualPause=false,lastTime=null,frame=0,yaw=.48,drag=null;
 const fixedCanvas=$('isolation-fixed-canvas'),isolatedCanvas=$('isolation-isolated-canvas');
 const canvasList=[fixedCanvas,isolatedCanvas];
 const text=(en,ita)=>it?ita:en;
 const format=(v,n=1)=>Number(v).toLocaleString(it?'it-IT':'en-GB',{maximumFractionDigits:n,minimumFractionDigits:n});
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const marker={input:null,response:null};
 const snapshots=[null,null];
 const maxIndex=fixed.length-1;
 const color={fixed:'#357da9',isolated:'#d58050'};
 const plot={l:74,r:926,t:16,b:132};
 const responsePlot={l:74,r:926,t:23,b:208};
 function project(x,y,z,shiftX=0,ground=0){
  const co=Math.cos(yaw),si=Math.sin(yaw);
  const xx=x-10,yy=y-5;
  const dx=xx*co-yy*si,depth=(xx*si+yy*co)*.355;
  return [520+dx*28+shiftX+ground,416+depth*28-z*25];
 }
 function line(ctx,a,b,width,stroke){
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);
  ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();
 }
 function poly(ctx,pts,fill,stroke,width=1){
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
 }
 function ellipse(ctx,x,y,rx,ry,fill,stroke){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}
 }
 function member(ctx,a,b,type,front=false){
  // A graphic representation of rolled HEB300 columns and IPE330 beams:
  // webs shaded deep steel, light bevel and flange edge highlights.
  const w=type==='column'?8.9:6.9;
  line(ctx,[a[0]+2,a[1]+3],[b[0]+2,b[1]+3],w+4,'#15445b28');
  line(ctx,a,b,w,type==='column'?'#25485c':'#377389');
  line(ctx,[a[0]-1,a[1]-1],[b[0]-1,b[1]-1],w*.37,type==='column'?'#9ed6dc':'#bee2df');
  line(ctx,[a[0]+w*.3,a[1]],[b[0]+w*.3,b[1]],1.7,'#152d40');
  if(front){ctx.fillStyle='#aacfd2';for(const p of [a,b])ctx.fillRect(p[0]-3,p[1]-3,6,6);}
 }
 function terrain(ctx,ground){
  const f=[[0,0,-.65],[20,0,-.65],[20,10,-.65],[0,10,-.65]].map(x=>project(...x,0,ground));
  poly(ctx,f,'#d5e4dd','#a4c6c0',2);
  ctx.lineWidth=.65;ctx.strokeStyle='#9fc2bd62';
  for(let x=-10;x<=30;x+=2.5)
   line(ctx,project(x,-9,-.72,0,ground),project(x,19,-.72,0,ground),.5,'#85b0b457');
  for(let y=-10;y<=20;y+=2.5)
   line(ctx,project(-12,y,-.72,0,ground),project(31,y,-.72,0,ground),.5,'#85b0b457');
  const back=[[0,0,-1.05],[20,0,-1.05],[20,10,-1.05],[0,10,-1.05]].map(x=>project(...x,0,ground));
  poly(ctx,[f[0],f[1],back[1],back[0]],'#adcac2','#a0beb7',1);
 }
 function deck(ctx,z,displacement,isolatedFrame=false,ground=0){
  const a=project(0,0,z,displacement,ground),b=project(20,0,z,displacement,ground),
   c=project(20,10,z,displacement,ground),d=project(0,10,z,displacement,ground);
  poly(ctx,[a,b,c,d],isolatedFrame?'#bdede1ab':'#d8e8e9a9','#58989e',1);
  line(ctx,a,b,2.1,isolatedFrame?'#3d9f99':'#69999c');
  line(ctx,b,c,2.1,isolatedFrame?'#3d9f99':'#69999c');
  poly(ctx,[a,b,[b[0],b[1]+5],[a[0],a[1]+5]],isolatedFrame?'#417d82':'#8eafb2','#5c8890',.6);
 }
 function drawBearings(ctx,ground,baseShift){
  // Schematic layered elastomeric bearings under each of 15 column lines:
  // not device dimensions or a non-linear hysteretic law.
  for(let row=2;row>=0;row--)for(let col=0;col<=4;col++){
   const x=col*5,y=row*5;
   const lo=project(x,y,-.02,0,ground),hi=project(x,y,.52,baseShift,ground);
   poly(ctx,[[lo[0]-13,lo[1]+4],[lo[0]+13,lo[1]+4],[lo[0]+13,lo[1]-2],[lo[0]-13,lo[1]-2]],'#607f8b','#284c5b');
   line(ctx,[lo[0],lo[1]-2],[hi[0],hi[1]+3],12,'#1d5365');
   for(let layer=0;layer<5;layer++){
    const f=(layer+.5)/5,cx=lo[0]+(hi[0]-lo[0])*f,cy=lo[1]+(hi[1]-lo[1])*f;
    ellipse(ctx,cx,cy,10.8,3.5,layer%2?'#d9824a':'#394e63','#345260');
   }
   ellipse(ctx,hi[0],hi[1],12,4,'#d39b68','#536578');
  }
 }
 function drawFrame(canvas,isolatedFrame,state,ag){
  const ctx=canvas.getContext('2d',{alpha:false});
  const ratio=Math.min(window.devicePixelRatio||1,1.75);
  const cssW=canvas.clientWidth||530,cssH=canvas.clientHeight||300;
  const w=Math.max(1,Math.round(cssW*ratio)),h=Math.max(1,Math.round(cssH*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(w/1060,0,0,h/590,0,0);
  const background=ctx.createLinearGradient(0,0,1060,590);
  background.addColorStop(0,'#fbfffb');background.addColorStop(.6,'#e2f2ec');background.addColorStop(1,'#cde3df');
  ctx.fillStyle=background;ctx.fillRect(0,0,1060,590);
  ctx.fillStyle='#78a3a6';ctx.font='850 15px ui-monospace,monospace';
  ctx.fillText(isolatedFrame?'SEISMIC BEARINGS · BASE SLIDING':'FIXED CONSTRAINTS · RIGID BASE',42,44);
  ctx.font='800 11px ui-monospace,monospace';ctx.fillStyle='#6e939a';
  ctx.fillText('4 BAYS × 2 BAYS · 3 STOREYS / S355',42,65);
  const shake=ag*2.1;
  terrain(ctx,shake);
  const levels=state.levelsMM.map(x=>x*.51);
  const baseElevation=isolatedFrame?.52:0;
  if(isolatedFrame){drawBearings(ctx,shake,levels[0]);deck(ctx,.55,levels[0],true,shake);}
  else{
   for(let row=0;row<=2;row++)for(let col=0;col<=4;col++){
    const p=project(col*5,row*5,-.05,0,shake);
    poly(ctx,[[p[0]-12,p[1]],[p[0]+12,p[1]],[p[0]+12,p[1]+7],[p[0]-12,p[1]+7]],'#8eb0b2','#567981',1);
    for(let tick=-8;tick<10;tick+=6)line(ctx,[p[0]+tick,p[1]+7],[p[0]+tick-5,p[1]+13],1,'#426276');
   }
  }
  const columns=[];
  for(let story=1;story<=3;story++){
   const from=(story-1)*3.5+baseElevation,to=story*3.5+baseElevation;
   for(let row=0;row<=2;row++)for(let col=0;col<=4;col++){
    const x=col*5,y=row*5;
    columns.push([project(x,y,from,levels[story-1],shake),project(x,y,to,levels[story],shake),x+y]);
   }
  }
  columns.sort((a,b)=>b[2]-a[2]).forEach(([a,b])=>member(ctx,a,b,'column'));
  for(let level=1;level<=3;level++){
   const z=level*3.5+baseElevation,s=levels[level];
   // A translucent slab inside the steel beam perimeter is a diaphragm
   // symbol, not a structural shell element or a mass-distribution result.
   deck(ctx,z-.10,s,false,shake);
   // X girders: IPE 330 at every grid row
   for(let row=2;row>=0;row--)for(let col=0;col<4;col++)
    member(ctx,project(col*5,row*5,z,s,shake),project((col+1)*5,row*5,z,s,shake),'beam',true);
   // Y girders: IPE 330 at every column line
   for(let col=4;col>=0;col--)for(let row=0;row<2;row++)
    member(ctx,project(col*5,row*5,z,s,shake),project(col*5,(row+1)*5,z,s,shake),'beam',true);
  }
  const suffix=isolatedFrame?text('BEARINGS / LINEAR','ISOLATORI / LINEARI'):text('FIXED / RIGID','INCASTRI / RIGIDI');
  ctx.fillStyle=isolatedFrame?'#ab704e':'#2b79a3';
  ctx.fillRect(36,527,8,27);
  ctx.fillStyle='#29596a';ctx.font='850 13px ui-monospace,monospace';
  ctx.fillText(suffix,54,546);
  ctx.font='720 11px ui-monospace,monospace';ctx.fillStyle='#6e8e93';
  ctx.fillText(text('DISPLACEMENT × ~16 / DIAGRAM','SPOSTAMENTI AMPLIFICATI / SCHEMA'),740,547);
  isolationRoot.dataset.ready='true';
 }
 function svgPlot(svg,data,selA,selB,config,scope){
  const P=scope==='input'?plot:responsePlot;
  const xmax=duration;
  const vals=data.flatMap(d=>[selA(d),...(selB?[selB(d)]:[])]);
  const peak=Math.max(.0001,...vals.map(Math.abs))*1.16;
  const y=p=>P.b-(p+peak)/(2*peak)*(P.b-P.t);
  const x=t=>P.l+t/xmax*(P.r-P.l);
  const pts=selector=>data.map(d=>x(d.timeS).toFixed(2)+','+y(selector(d)).toFixed(2)).join(' ');
  const grid=Array.from({length:5},(_,i)=>{
   const yy=P.t+i*(P.b-P.t)/4;const value=peak*(1-i/2);
   return '<line x1="'+P.l+'" y1="'+yy+'" x2="'+P.r+'" y2="'+yy+'" stroke="#bfdad5" stroke-width=".9"/>'
      +'<text x="64" y="'+(yy+4)+'" text-anchor="end" font-size="11" fill="#6c8c91">'+value.toFixed(1)+'</text>';
  }).join('');
  const xticks=Array.from({length:6},(_,i)=>{
   const xx=x(i*duration/5);return '<text x="'+xx+'" y="'+(P.b+19)+'" text-anchor="middle" fill="#62838a" font-size="11">'+(i*duration/5).toFixed(0)+' s</text>';
  }).join('');
  const curves=selB
   ?'<polyline fill="none" stroke="'+color.fixed+'" stroke-width="2.5" points="'+pts(selA)+'"/><polyline fill="none" stroke="'+color.isolated+'" stroke-width="3" points="'+pts(selB)+'"/>'
   :'<polyline fill="none" stroke="#277f9a" stroke-width="2.5" points="'+pts(selA)+'"/>';
  const id='isolation-clip-'+scope;
  svg.innerHTML='<defs><clipPath id="'+id+'"><rect x="'+P.l+'" y="'+P.t+'" width="'+(P.r-P.l)+'" height="'+(P.b-P.t)+'"/></clipPath></defs>'
   +'<rect x="'+P.l+'" y="'+P.t+'" width="'+(P.r-P.l)+'" height="'+(P.b-P.t)+'" fill="#f0f8f3"/>'
   +grid+'<line x1="'+P.l+'" y1="'+y(0)+'" x2="'+P.r+'" y2="'+y(0)+'" stroke="#6da7a8" stroke-width="1.2" stroke-dasharray="6 5"/>'
   +'<g clip-path="url(#'+id+')">'+curves+'</g>'
   +xticks+'<line id="isolation-'+scope+'-marker" x1="'+P.l+'" x2="'+P.l+'" y1="'+P.t+'" y2="'+P.b+'" stroke="#cc6943" stroke-width="2" stroke-dasharray="4 3"/>';
  marker[scope]=$('isolation-'+scope+'-marker');
 }
 function redrawMetric(){
  const key=$('isolation-metric').value;
  const a=key==='acceleration'?x=>x.roofAbsoluteAccelerationMS2:key==='drift'?x=>x.maxStoryDriftMM:x=>x.roofDisplacementMM;
  const merged=fixed.map((p,i)=>({...p,b:isolated[i]}));
  svgPlot($('isolation-response-chart'),merged,a,x=>a(x.b),{},'response');
  updateMarker();
 }
 function updateMarker(){
  for(const [name,P] of [['input',plot],['response',responsePlot]]){
   const x=P.l+timeline[tIndex].timeS/duration*(P.r-P.l);
   marker[name]?.setAttribute('x1',x.toFixed(2));
   marker[name]?.setAttribute('x2',x.toFixed(2));
  }
 }
 function present(index){
  tIndex=clamp(Math.floor(index),0,maxIndex);
  const A=fixed[tIndex],B=isolated[tIndex],input=timeline[tIndex];
  drawFrame(fixedCanvas,false,A,input.accelerationMS2);
  drawFrame(isolatedCanvas,true,B,input.accelerationMS2);
  $('isolation-fixed-live').textContent=text('ROOF','COPERTURA')+' '+format(A.roofDisplacementMM)+' mm';
  $('isolation-isolated-live').textContent=text('BASE','BASE')+' '+format(B.baseDisplacementMM)+' mm';
  // Common kN scale for the two three-storey reduced shear-building cases.
  const shearScaleKN=Math.max(peaks.fixedStoryShearKN,peaks.isolatedStoryShearKN);
  for(const side of ['fixed','isolated'])$('isolation-'+side+'-shear-scale').textContent=format(shearScaleKN,1)+' kN';
  for(const [side,state] of [['fixed',A],['isolated',B]]){
   const base='isolation-'+side+'-shear';
   const value=state.maxStoryShearKN;
   const fraction=clamp(value/Math.max(1e-12,shearScaleKN),0,1);
   const reached=clamp(state.peakReachedStoryShearKN/Math.max(1e-12,shearScaleKN),0,1);
   $(base+'-value').textContent=format(value,1)+' kN';
   $(base+'-peak-value').textContent=format(state.peakReachedStoryShearKN,1)+' kN';
   $(base+'-fill').style.width=(fraction*100).toFixed(2)+'%';
   $(base+'-peak').style.left=(reached*100).toFixed(2)+'%';
   $(base+'-floor').textContent=String(state.criticalStory);
   $(base+'-panel').dataset.level=fraction>.67?'high':fraction>.34?'medium':'low';
  }

  $('isolation-input-live').textContent='a_g = '+format(input.accelerationMS2,2)+' m/s²';
  $('isolation-time-label').textContent=format(input.timeS,2)+' s';
  $('isolation-time').value=String(tIndex);
  const key=$('isolation-metric').value;
  const k=key==='acceleration'?'roofAbsoluteAccelerationMS2':key==='drift'?'maxStoryDriftMM':'roofDisplacementMM';
  $('isolation-response-live').textContent=format(A[k],2)+' / '+format(B[k],2)+(key==='acceleration'?' m/s²':' mm');
  updateMarker();
 }
 function syncPlay(){
  $('isolation-play').setAttribute('aria-pressed',String(playing&&!manualPause));
  $('isolation-play').textContent=playing&&!manualPause?text('Pause','Pausa'):text('Play','Riprendi');
 }
 function animate(now){
  frame=0;
  if(!visible||!playing||manualPause||document.hidden||reduced?.matches){lastTime=null;return;}
  const elapsed=Math.min(.1,(now-(lastTime??now))/1000);lastTime=now;
  const next=cursor+elapsed/dt;
  cursor=next>maxIndex?0:next;
  present(Math.floor(cursor));
  frame=requestAnimationFrame(animate);
 }
 function begin(){
  if(frame||!visible||document.hidden||!playing||manualPause||reduced?.matches)return;
  lastTime=null;frame=requestAnimationFrame(animate);
 }
 function stop(){if(frame){cancelAnimationFrame(frame);frame=0;}lastTime=null;}
 function playButton(){
  manualPause=!manualPause;
  syncPlay();
  if(manualPause)stop();else begin();
 }
 $('isolation-play').addEventListener('click',playButton);
 $('isolation-restart').addEventListener('click',()=>{
  cursor=0;present(0);manualPause=false;playing=true;syncPlay();stop();begin();
 });
 $('isolation-time').max=String(maxIndex);
 $('isolation-time').addEventListener('input',e=>{
  cursor=Number(e.currentTarget.value);present(cursor);stop();manualPause=true;syncPlay();
 });
 $('isolation-metric').addEventListener('change',redrawMetric);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else begin();});
 reduced?.addEventListener?.('change',e=>{if(e.matches)stop();else begin();});
 // Dragging either canvas changes the angle for both structural models.
 for(const canvas of canvasList){
  canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,yaw,pointer:e.pointerId};canvas.setPointerCapture?.(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
   if(!drag||drag.pointer!==e.pointerId)return;
   yaw=clamp(drag.yaw+(e.clientX-drag.x)*.006,-.70,1.20);present(tIndex);
  });
  canvas.addEventListener('pointerup',()=>{drag=null;});
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;
   e.preventDefault();yaw=e.key==='Home'?.48:clamp(yaw+(e.key==='ArrowLeft'?-.12:.12),-.70,1.20);
   present(tIndex);
  });
 }
 const percent=(before,after)=>100*(1-after/Math.max(before,1e-10));
 $('isolation-accel-reduction').textContent=format(percent(peaks.fixedAcceleration,peaks.isolatedAcceleration),1)+'%';
 $('isolation-drift-reduction').textContent=format(percent(peaks.fixedStoryDriftMM,peaks.isolatedStoryDriftMM),1)+'%';
 $('isolation-base-travel').textContent=format(peaks.isolationTravelMM,1)+' mm';
 svgPlot($('isolation-input-chart'),timeline,p=>p.accelerationMS2,null,{},'input');
 redrawMetric();present(0);syncPlay();
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   visible=entries.some(x=>x.isIntersecting);if(visible)begin();else stop();
  },{threshold:.07});
  observer.observe(isolationRoot);
 }else{visible=true;begin();}
}
