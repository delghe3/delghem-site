import {sampleGaussScalar} from './contour-shading.mjs?v=20261025-aliasing17';
/**
 * DÈLGHEM D2 • native solver FEM showcase.
 * ALL FOUR LAB CHAPTERS ARE SCROLLABLE/ALWAYS VISIBLE.
 * All datasets come from Kratos: 176 actual QUAD4 shells and 66 beams,
 * 240 real nonlinear steel-fiber axial cyclic states and 16 nonlinear IDA runs.
 * The static axial cyclic specimen is NOT a verified lateral Pushover.
 * Test cases are independent of one another and of the conceptual home model.
 */
const labRoot=document.getElementById('fem-lab');
if(labRoot){
 const it=document.documentElement.lang==='it';
 const $=id=>labRoot.querySelector('#'+id);
 const txt=(en,ita)=>it?ita:en;
 const num=(n,d=3)=>Number(n).toLocaleString(it?'it-IT':'en-GB',{maximumFractionDigits:d});
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const mix=(a,b,t)=>a+(b-a)*t;
 const NS='http://www.w3.org/2000/svg';
 const stressKeys=['vonMisesMPa','sigma11MPa','sigma22MPa','tau12MPa'];
 const labels={
  u:txt('Control displacement [mm]','Spostamento nodo [mm]'),
  v:txt('Base shear [kN]','Taglio alla base [kN]'),
  pga:txt('Input PGA [g]','PGA in ingresso [g]'),
  drift:txt('Peak drift [%]','Drift massimo [%]'),
  plastic:txt('Maximum plastic strain [%]','Deformazione plastica max [%]'),
  acc:txt('Ground acceleration [g]','Accelerazione al suolo [g]'),
  time:txt('Time [s]','Tempo [s]')
 };
 const palette=['#2948a9','#1680c9','#1caeba','#69cfa5','#e5d766','#f49a37','#d84256'];
 const sNode=(parent,tag,attributes={},content='')=>{
  const element=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));
  if(content!==''&&content!==null&&content!==undefined)element.textContent=String(content);
  parent.append(element);return element;
 };
 const tick=v=>{
  if(!Number.isFinite(v))return '—';
  const a=Math.abs(v);
  if(a<1e-10)return '0';
  if(a<1e-4)return Number(v).toExponential(1);
  if(a<.01)return Number(v.toFixed(5)).toString();
  if(a<.1)return Number(v.toFixed(3)).toString();
  if(a<10)return Number(v.toFixed(2)).toString();
  return Number(v.toFixed(1)).toString();
 };
 function axes(svg,params={}){
  svg.replaceChildren();
  const L=109,R=867,T=42,B=377,W=R-L,H=B-T;
  const x0=params.xMin??0,x1=params.xMax??1,y0=params.yMin??0,y1=params.yMax??1;
  const xx=x=>L+W*(x-x0)/Math.max(1e-12,x1-x0);
  const yy=y=>B-H*(y-y0)/Math.max(1e-12,y1-y0);
  for(let i=0;i<=5;i++){
   const x=mix(x0,x1,i/5),y=mix(y0,y1,i/5);
   sNode(svg,'line',{x1:xx(x),y1:T,x2:xx(x),y2:B,stroke:'#cadcda','stroke-width':1});
   sNode(svg,'line',{x1:L,y1:yy(y),x2:R,y2:yy(y),stroke:'#bcd3d2','stroke-width':1});
   sNode(svg,'text',{x:xx(x),y:B+24,'text-anchor':'middle',fill:'#50747b','font-size':12},tick(x));
   sNode(svg,'text',{x:L-14,y:yy(y)+4,'text-anchor':'end',fill:'#50747b','font-size':12},tick(y));
  }
  sNode(svg,'path',{d:'M '+L+' '+T+' L '+L+' '+B+' L '+R+' '+B,fill:'none',stroke:'#2e6070','stroke-width':2});
  if(y0<0&&y1>0)sNode(svg,'line',{x1:L,y1:yy(0),x2:R,y2:yy(0),stroke:'#31768b','stroke-dasharray':'5 6','stroke-width':1.5});
  if(x0<0&&x1>0)sNode(svg,'line',{x1:xx(0),y1:T,x2:xx(0),y2:B,stroke:'#31768b','stroke-dasharray':'5 6','stroke-width':1.5});
  sNode(svg,'text',{x:(L+R)/2,y:447,'text-anchor':'middle',fill:'#164451','font-size':16,'font-weight':750},params.xLabel??'');
  sNode(svg,'text',{transform:'translate(25,210) rotate(-90)','text-anchor':'middle',fill:'#164451','font-size':16,'font-weight':750},params.yLabel??'');
  return {x:xx,y:yy,L,R,T,B};
 }
 function trace(svg,points,ax,{color='#087d9c',width=3,title='',opacity=1}={}){
  if(!points.length)return;
  const data=points.map(p=>ax.x(p.x).toFixed(2)+','+ax.y(p.y).toFixed(2)).join(' ');
  const element=sNode(svg,'polyline',{points:data,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',opacity});
  if(title)sNode(element,'title',{},title);
 }
 function marker(svg,point,ax,{plastic=false,color='#087d9c',radius=5,description=''}={}){
  const x=ax.x(point.x),y=ax.y(point.y),r=plastic?7:radius;
  const el=plastic?sNode(svg,'path',{d:'M '+x+' '+(y-r)+' L '+(x+r)+' '+y+' L '+x+' '+(y+r)+' L '+(x-r)+' '+y+' Z',fill:'#df674b',stroke:'#fff','stroke-width':2,tabindex:0})
   :sNode(svg,'circle',{cx:x,cy:y,r,fill:color,stroke:'#fff','stroke-width':1.5,tabindex:0});
  const label=description+' · '+tick(point.x)+' / '+tick(point.y)+(plastic?' · '+txt('yielded fiber','fibra plastica'):'');
  el.setAttribute('aria-label',label);sNode(el,'title',{},label);
 }
 function range(values,pad=.13){
  const lo=Math.min(...values),hi=Math.max(...values);
  if(!Number.isFinite(lo)||!Number.isFinite(hi))return [-1,1];
  const delta=Math.max(hi-lo,1e-7,Math.abs(hi)*.01,Math.abs(lo)*.01);
  return [lo-delta*pad,hi+delta*pad];
 }
 const pc=v=>num(v*100,3)+'%';
 let shell=null,cyclic=null,ida=null;
 // ---- Genuine Kratos S235 axial cyclic nonlinearity (not lateral pushover) ----
 function drawCyclicLoading(){
  const svg=$('lab-pushover-svg');
  const branch=cyclic.branches[0];
  const points=[{displacementMM:0,axialForceKN:0,maxPlasticStrain:0},...branch.points];
  const rows=points.map(p=>({x:p.displacementMM,y:p.axialForceKN}));
  const max=Math.max(...rows.map(x=>x.y));
  const ax=axes(svg,{xMin:0,xMax:Math.max(13,branch.targetDisplacementMM*1.1),
   yMin:0,yMax:max*1.15,xLabel:labels.u,
   yLabel:txt('Axial force above preload [kN]','Forza assiale oltre il precarico [kN]')});
  const first=points.findIndex(s=>s.maxPlasticStrain>1e-7);
  const pivot=Math.max(1,first);
  trace(svg,rows.slice(0,pivot+1),ax,{color:'#087e9f',width:4.4,title:'Actual Kratos elastic segment'});
  trace(svg,rows.slice(pivot),ax,{color:'#df694d',width:4.8,title:'Actual Kratos steel-fiber plastic segment'});
  rows.slice(1).forEach((r,i)=>{if(i%6===0||i===first-1||i===rows.length-2)
    marker(svg,r,ax,{plastic:points[i+1].maxPlasticStrain>1e-7,
     color:'#087e9f',description:txt('Kratos axial loading','Carico assiale Kratos')});});
  if(first>0){
   const r=rows[first],x=ax.x(r.x),y=ax.y(r.y);
   sNode(svg,'circle',{cx:x,cy:y,r:10,fill:'none',stroke:'#c6543f','stroke-width':2.6});
   sNode(svg,'text',{x:Math.min(ax.R-12,x+14),y:y-17,fill:'#a7533a',
    'font-size':12,'font-weight':860},txt('FIRST PLASTIC FIBER','PRIMA FIBRA PLASTICA'));
  }
  sNode(svg,'text',{x:ax.R-6,y:ax.T+13,'text-anchor':'end',
   fill:'#326776','font-size':12,'font-weight':860},'KRATOS · '+branch.points.length+' '+txt('CONVERGED','CONVERGENTI'));
 }
 function drawCyclicLoop(){
  const svg=$('lab-pushover-y-svg');
  const values=cyclic.states;
  const bx=range([...values.map(p=>p.displacementMM),0],.09);
  const by=range([...values.map(p=>p.axialForceKN),0],.12);
  const ax=axes(svg,{xMin:bx[0],xMax:bx[1],yMin:by[0],yMax:by[1],
   xLabel:labels.u,yLabel:txt('Signed axial force [kN]','Forza assiale con segno [kN]')});
  const palette=['#0c85a0','#df744c','#3768a5','#936dba','#32a18f'];
  for(const [i,branch] of cyclic.branches.entries()){
   const rows=branch.points.map(p=>({x:p.displacementMM,y:p.axialForceKN}));
   if(i>0){
    const previous=cyclic.branches[i-1].points.at(-1);
    rows.unshift({x:previous.displacementMM,y:previous.axialForceKN});
   }
   trace(svg,rows,ax,{color:palette[i],width:3.25,
    title:'Native Kratos steel-fiber axial path '+(i+1)});
   const final=rows.at(-1);
   marker(svg,final,ax,{color:palette[i],radius:6,
    description:txt('Converged branch','Ramo convergente')+' '+(i+1)});
  }
  sNode(svg,'text',{x:ax.R-8,y:ax.T+14,'text-anchor':'end',
   fill:'#326776','font-size':12,'font-weight':850},
   cyclic.states.length+' '+txt('ACCEPTED STATES / 5 BRANCHES','STATI ACCETTATI / 5 RAMI'));
 }
 function drawCyclicPlasticity(){
  const svg=$('lab-plastic-svg');
  const rows=[{x:0,y:0},...cyclic.states.map((p,i)=>({x:i+1,y:p.maxPlasticStrain*100}))];
  const max=Math.max(...rows.map(x=>x.y))*1.25;
  const ax=axes(svg,{xMin:0,xMax:cyclic.states.length*1.035,
   yMin:0,yMax:max,xLabel:txt('Accepted load increment','Incremento di carico accettato'),
   yLabel:labels.plastic});
  const colors=['#168da5','#e07851','#4d70ac','#976bc1','#33a594'];
  for(const [i,branch] of cyclic.branches.entries()){
   const start=i*48,end=(i+1)*48;
   const curve=rows.slice(i===0?0:start,end+1);
   trace(svg,curve,ax,{color:colors[i],width:3.4,
    title:txt('Plastic strain on axial branch ','Deformazione plastica sul ramo ')+(i+1)});
   const last=curve.at(-1);
   marker(svg,last,ax,{plastic:last.y>1e-5,color:colors[i],radius:5,
    description:txt('Branch ending','Fine ramo')+' '+(i+1)});
  }
 }
 function drawCyclicSpecimen(){
  const svg=$('lab-schematic-svg');svg.replaceChildren();
  const start=76,end=312,y=129;
  sNode(svg,'rect',{x:start,y:y-15,width:end-start,height:30,
   fill:'#4c91a5',stroke:'#1a536e','stroke-width':2.4,rx:3});
  sNode(svg,'path',{d:'M 69 82 V 181 M 69 96 l -15 17 M 69 119 l -15 17 M 69 142 l -15 17 M 69 165 l -15 17',
   stroke:'#38687b','stroke-width':3.2,fill:'none'});
  sNode(svg,'path',{d:'M 307 129 H 368 M 352 115 l 16 14 -16 14',stroke:'#df754d','stroke-width':4,fill:'none'});
  sNode(svg,'text',{x:294,y:97,fill:'#b46847','font-size':13,'font-weight':850},'uX ↔');
  sNode(svg,'text',{x:187,y:104,'text-anchor':'middle',fill:'#18546b',
   'font-size':14,'font-weight':850},'IPE 300 · S235');
  sNode(svg,'line',{x1:start,y1:177,x2:end,y2:177,stroke:'#6997a1','stroke-width':1.5});
  for(const x of [start,end])sNode(svg,'line',{x1:x,y1:169,x2:x,y2:184,stroke:'#6997a1','stroke-width':1.5});
  sNode(svg,'text',{x:194,y:195,fill:'#376a75','text-anchor':'middle',
   'font-size':13,'font-weight':800},'L = 3.00 m');
  sNode(svg,'text',{x:194,y:239,fill:'#527982','text-anchor':'middle',
   'font-size':11},txt('Actual axial cyclic specimen','Provino ciclico assiale reale'));
 }
 function renderCyclic(){
  drawCyclicLoading();drawCyclicLoop();drawCyclicPlasticity();drawCyclicSpecimen();
  const f=cyclic.states.map(p=>Math.abs(p.axialForceKN));
  $('lab-pushover-count').textContent=cyclic.states.length+' / '+cyclic.branches.length;
  $('lab-push-peak').textContent=num(Math.max(...f),1)+' kN';
  $('lab-push-plastic').textContent=pc(cyclic.maxPlasticStrain);
 }
 // Keep all solver graphs and dynamic hysteresis on-screen. Only redundant
 // APP SCREENSHOT EVIDENCE (not numerical charts) is placed in a lightweight
 // disclosure. No-JavaScript visitors still get the original screenshots.
 function compactScreenshots(){
  for(const parent of labRoot.querySelectorAll('.lab-analysis-supplement')){
   const evidence=[...parent.children].filter(n=>
    n.classList.contains('lab-app-evidence')||
    n.classList.contains('lab-workflow-image'));
   if(!evidence.length)continue;
   const details=document.createElement('details');
   details.className='lab-evidence-collapse';
   const summary=document.createElement('summary');
   summary.textContent=txt(
    'Original DÈLGHEM screenshots and analysis settings ↗',
    'Schermate originali DÈLGHEM e impostazioni dell’analisi ↗');
   details.append(summary);
   const wrapper=document.createElement('div');wrapper.className='lab-evidence-collapse-grid';
   evidence.forEach(node=>wrapper.append(node));
   details.append(wrapper);
   parent.append(details);
  }
 }
 compactScreenshots();
 // ---- 16 actual Kratos nonlinear IDA time histories, eight PGA levels each ----
 function renderIDA(){
  const models=ida.models;
  models.forEach((m,i)=>{
   const svg=$(i?'lab-ida-y-svg':'lab-ida-svg'),runs=m.runs;
   const maxX=Math.max(...runs.map(r=>r.peakDriftPercent))*1.18;
   const maxY=Math.max(...runs.map(r=>r.pgaG))*1.18;
   const ax=axes(svg,{xMax:maxX,yMax:maxY,xLabel:labels.drift,yLabel:labels.pga});
   const line=[{x:0,y:0,plastic:false},...runs.map(r=>({x:r.peakDriftPercent,y:r.pgaG,plastic:r.maxPlasticStrain>1e-7}))];
   const first=line.findIndex(r=>r.plastic);
   trace(svg,line.slice(0,Math.max(1,first)+1),ax,{color:i?'#c06f44':'#087e9f',width:3.9});
   if(first>0)trace(svg,line.slice(first),ax,{color:'#de664b',width:4.3});
   line.slice(1).forEach(q=>marker(svg,q,ax,{plastic:q.plastic,color:i?'#c06f44':'#087e9f',radius:4.8,description:m.id+' / Kratos'}));
   sNode(svg,'text',{x:ax.R-5,y:ax.T+14,'text-anchor':'end',fill:'#a85a3c','font-size':12,'font-weight':840},
     txt('8 COMPUTED PGA LEVELS','8 INTENSITÀ CALCOLATE'));
   renderHysteresis(m,i);
  });
  const runs=ida.models.flatMap(x=>x.runs);
  $('lab-ida-count').textContent=runs.length;
  $('lab-ida-status').textContent=runs.filter(r=>r.status==='completed').length+' / '+runs.length;
  $('lab-ida-plastic').textContent=runs.filter(r=>r.maxPlasticStrain>1e-7).length+' '+txt('runs','analisi');
 }
 function renderHysteresis(m,i){
  const svg=$(i?'lab-hysteresis-y-svg':'lab-hysteresis-svg'),r=m.runs.at(-1);
  const pts=r.trajectory;
  const xRange=range([...pts.map(p=>p.displacementMM),0],.1);
  const yRange=range([...pts.map(p=>p.baseShearKN),0],.12);
  const ax=axes(svg,{xMin:xRange[0],xMax:xRange[1],yMin:yRange[0],yMax:yRange[1],xLabel:labels.u,yLabel:labels.v});
  const line=pts.map(p=>({x:p.displacementMM,y:p.baseShearKN}));
  trace(svg,line,ax,{color:i?'#b76b42':'#087e9f',width:2.9,title:'Actual converged Kratos base-shear displacement history'});
  marker(svg,line[0],ax,{color:'#126f8b',radius:6,description:txt('First recorded state','Primo stato reale')});
  marker(svg,line.at(-1),ax,{color:'#dc7147',radius:6,description:txt('Final recorded state','Ultimo stato reale')});
  sNode(svg,'text',{x:ax.R-5,y:ax.T+11,'text-anchor':'end',fill:'#446975','font-size':12,'font-weight':820},
   'PGA '+num(r.pgaG,3)+' g / εp '+pc(r.maxPlasticStrain));
 }
 function plotTime(svg,rows,yLabel,color){
  const values=rows.map(p=>p.y);
  const bounds=range([...values,0],.11);
  const ax=axes(svg,{xMax:rows.at(-1).x,yMin:bounds[0],yMax:bounds[1],xLabel:labels.time,yLabel});
  trace(svg,rows,ax,{color,width:2.4,title:txt('Actual native solver samples','Campioni reali del solutore')});
 }
 function renderAcceleration(){
  const selected=Number($('lab-scale').value);
  if(!Number.isFinite(selected)||selected<=0)throw Error('Invalid PGA scale');
  ida.models.forEach((m,i)=>{
   const run=m.runs.find(r=>Math.abs(r.scale-selected)<1e-8);
   if(!run)throw Error('Missing computed history for requested scale '+selected);
   const ground=m.inputRecordG.map((x,j)=>({x:j*m.dtS,y:x*selected}));
   const displacement=run.trajectory.map(p=>({x:p.timeS,y:p.displacementMM}));
   plotTime($(i?'lab-accelerograms-y-svg':'lab-accelerograms-svg'),ground,labels.acc,i?'#c06b45':'#087e9f');
   plotTime($(i?'lab-response-y-svg':'lab-response-svg'),displacement,labels.u,i?'#b56d43':'#0b7898');
   const max=Math.max(...ground.map(p=>Math.abs(p.y)));
   $(i?'lab-accelerogram-y-pga':'lab-accelerogram-pga').textContent=num(max,4)+' g';
  });
  $('lab-accelerogram-dt').textContent=ida.models.map(m=>num(m.dtS,5)+' s').join(' / ');
  $('lab-accelerogram-samples').textContent=ida.models.map(m=>m.inputRecordG.length).join(' / ');
  $('lab-accelerogram-plastic').textContent=ida.models.map(m=>pc(m.runs.find(r=>Math.abs(r.scale-selected)<1e-8).maxPlasticStrain)).join(' / ');
 }
 // ---- Spatial, gently shaded QUAD4 stress fields on B01 irregular building ----
 const canvas=$('lab-stress-canvas'),ctx=canvas?.getContext('2d',{alpha:false});
 const view={yaw:-.57,pitch:.48,mesh:false,aliasing:false,deformed:false,auto:false,selected:null,hover:null,drag:null,polys:[],frame:0};
 let frameBounds=null;
 function faceMean(element,side,field){
  return element.gauss.reduce((a,g)=>a+g[side][field],0)/element.gauss.length;
 }
 function heat(t){
  const x=clamp(t,0,1)*(palette.length-1),i=Math.min(palette.length-2,Math.floor(x)),f=x-i;
  const a=palette[i].slice(1).match(/../g).map(s=>parseInt(s,16));
  const b=palette[i+1].slice(1).match(/../g).map(s=>parseInt(s,16));
  return 'rgb('+a.map((v,k)=>Math.round(mix(v,b[k],f))).join(',')+')';
 }
 function deform(p,id){
  const u=(view.deformed?shell.displacements[id]:null)??[0,0,0];
  const k=view.deformed?800:0;
  return [p[0]+u[0]*k,p[1]+u[1]*k,p[2]+u[2]*k];
 }
 function rotate(p){
  const q=p.map((v,i)=>v-frameBounds.center[i]),c=Math.cos(view.yaw),s=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);
  const x=q[0]*c-q[1]*s,y=q[0]*s+q[1]*c;
  return {x,y:y*sp-q[2]*cp,depth:y*cp+q[2]*sp};
 }
 function blerp(q,u,v){
  return {x:(1-u)*(1-v)*q[0].x+u*(1-v)*q[1].x+u*v*q[2].x+(1-u)*v*q[3].x,
   y:(1-u)*(1-v)*q[0].y+u*(1-v)*q[1].y+u*v*q[2].y+(1-u)*v*q[3].y};
 }
 function polygon(points,fill,stroke=null,w=1){
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
 }
 function drawStress(){
  if(!ctx||!shell||!frameBounds)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w<150||h<150)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.65),dw=Math.round(w*dpr),dh=Math.round(h*dpr);
  if(canvas.width!==dw||canvas.height!==dh){canvas.width=dw;canvas.height=dh;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const sky=ctx.createLinearGradient(0,0,w,h);
  sky.addColorStop(0,'#f5fbf8');sky.addColorStop(.58,'#e7f2ef');sky.addColorStop(1,'#d3e7e6');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const field=$('lab-stress-field').value,side=$('lab-stress-face').value;
  const elements=shell.elements,values=elements.map(e=>faceMean(e,side,field));
  const min=Math.min(...values),max=Math.max(...values),span=Math.max(1e-12,max-min);
  $('lab-stress-max').textContent=num(max,3);$('lab-stress-min').textContent=num(min,3);
  $('lab-shell-count').textContent=elements.length;$('lab-beam-count').textContent=shell.beams.length;
  $('lab-stress-count').textContent=shell.mesh.shellCount+' QUAD4 / '+shell.mesh.beamCount+' BEAMS';
  const visible=[
   ...elements.flatMap(e=>e.vertices.map((p,j)=>deform(p,e.nodes[j]))),
   ...shell.beams.flatMap(b=>[deform(b.a,b.n1),deform(b.b,b.n2)])
  ].map(rotate);
  const minX=Math.min(...visible.map(p=>p.x)),maxX=Math.max(...visible.map(p=>p.x));
  const minY=Math.min(...visible.map(p=>p.y)),maxY=Math.max(...visible.map(p=>p.y));
  const scale=Math.min((w-80)/Math.max(1e-8,maxX-minX),(h-110)/Math.max(1e-8,maxY-minY));
  const ox=w/2-(minX+maxX)*scale/2,oy=h/2-(minY+maxY)*scale/2+5;
  const screen=p=>({x:p.x*scale+ox,y:p.y*scale+oy,depth:p.depth});
  ctx.save();ctx.strokeStyle='#648b9d29';ctx.lineWidth=.7;
  for(let k=-10;k<=10;k++){
   const x=k*.5;
   const a=screen(rotate([x,-2,0])),b=screen(rotate([x,7,0]));
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   const c=screen(rotate([-3,x,0])),d=screen(rotate([9,x,0]));
   ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke();
  }
  ctx.restore();
  const colored=elements.map((e,i)=>{
   const pts=e.vertices.map((p,j)=>screen(rotate(deform(p,e.nodes[j]))));
   return {id:e.id,source:e,pts,depth:pts.reduce((s,p)=>s+p.depth,0)/4,val:values[i]};
  }).sort((a,b)=>b.depth-a.depth);
  view.polys=colored;
  for(const item of colored){
   const q=item.pts,N=view.aliasing?9:2;
   const samples=item.source.gauss.map(g=>g[side][field]);
   for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const u=i/N,v=j/N,u2=(i+1)/N,v2=(j+1)/N;
    const value=view.aliasing
     ?sampleGaussScalar(samples,(u+u2)/2,(v+v2)/2)
     :samples[j===0?(i===0?0:1):(i===0?3:2)];
    polygon([blerp(q,u,v),blerp(q,u2,v),blerp(q,u2,v2),blerp(q,u,v2)],heat((value-min)/span));
   }
   const focus=item.id===view.selected||item.id===view.hover;
   polygon(q,null,focus?'#153b4a':view.mesh?'#224d65a6':'#2b677229',focus?3.3:view.mesh?1.05:.3);
  }
  // Frame members use the actual 66 section-centerline segments returned by
  // the source mesh; purely architectural styling, not invented steel stresses.
  ctx.lineCap='round';
  const edges=shell.beams.map(b=>{
   const a=screen(rotate(deform(b.a,b.n1))),c=screen(rotate(deform(b.b,b.n2)));
   return {a,b:c,depth:(a.depth+c.depth)/2};
  }).sort((a,b)=>b.depth-a.depth);
  for(const e of edges){
   ctx.beginPath();ctx.moveTo(e.a.x+1.2,e.a.y+2);ctx.lineTo(e.b.x+1.2,e.b.y+2);
   ctx.lineWidth=Math.max(2.8,Math.min(6.2,w*.005));ctx.strokeStyle='#123d55d0';ctx.stroke();
   ctx.beginPath();ctx.moveTo(e.a.x,e.a.y);ctx.lineTo(e.b.x,e.b.y);
   ctx.lineWidth=Math.max(1.1,Math.min(2.5,w*.0024));ctx.strokeStyle='#a1e4eb';ctx.stroke();
  }
  ctx.lineCap='butt';
  const zero={x:43,y:h-65};
  for(const [vec,col,label] of [[[1,0,0],'#dc6948','X'],[[0,1,0],'#2c9e7b','Y'],[[0,0,1],'#2275b9','Z']]){
   const a=rotate([0,0,0]),b=rotate(vec),dx=(b.x-a.x)*32,dy=(b.y-a.y)*32;
   ctx.strokeStyle=col;ctx.lineWidth=2.7;ctx.beginPath();ctx.moveTo(zero.x,zero.y);ctx.lineTo(zero.x+dx,zero.y+dy);ctx.stroke();
   ctx.fillStyle=col;ctx.font='850 11px system-ui';ctx.fillText(label,zero.x+dx+3,zero.y+dy);
  }
  ctx.font='850 13px system-ui';ctx.fillStyle='#1c4c60';ctx.fillText('DELGHEM D2 • B01 / '+elements.length+' QUAD4',20,31);
  if(view.deformed){ctx.fillStyle='#bd6c44';ctx.font='830 11px system-ui';ctx.fillText(txt('DEFORMED ×800','DEFORMAZIONE ×800'),20,48);}
  const chosen=elements.find(e=>e.id===view.selected);
  $('lab-stress-selected').textContent=chosen?.id??'—';
  $('lab-stress-readout').textContent=chosen?namesFrom(field)+' / '+(side==='top'?txt('top','superiore'):txt('bottom','inferiore'))+': '+num(faceMean(chosen,side,field),4)+' MPa · '+txt('mean of 4 real Gauss points','media di 4 punti di Gauss reali')
    :txt('Select a shell for actual stresses.','Seleziona una shell per leggere le tensioni reali.');
  // Mark the canvas ready only when it actually contains non-black opaque
  // pixels. Otherwise the actual FEM poster remains visible as a fallback,
  // including if an older cached version of JavaScript crashes before init.
  try{
   const pixel=ctx.getImageData(Math.max(0,Math.min(canvas.width-1,Math.floor(canvas.width/2))),
     Math.max(0,Math.min(canvas.height-1,Math.floor(canvas.height/2))),1,1).data;
   if(pixel[3]>=240&&pixel[0]+pixel[1]+pixel[2]>65)
    labRoot.dataset.labStressReady='true';
  }catch(error){console.warn('FEM stress poster retained',error);}

 }
 function namesFrom(field){return {vonMisesMPa:'σVM',sigma11MPa:'σ11',sigma22MPa:'σ22',tau12MPa:'τ12'}[field]??field;}
 function scheduleStress(){
  if(view.frame)return;
  view.frame=requestAnimationFrame(()=>{view.frame=0;drawStress();});
 }
 function inside(x,y,pts){
  let yes=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
   const a=pts[i],b=pts[j];
   if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;
  }return yes;
 }
 function hit(e){
  const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  return [...view.polys].reverse().find(p=>inside(x,y,p.pts))?.id??null;
 }
 for(const [id,field] of [['lab-mesh-toggle','mesh'],['lab-aliasing-toggle','aliasing'],['lab-deform-toggle','deformed'],['lab-motion-toggle','auto']]){
  $(id).addEventListener('click',()=>{
   view[field]=!view[field];
   $(id).setAttribute('aria-pressed',String(view[field]));
   scheduleStress();
   if(field==='auto'&&view.auto)requestAnimationFrame(frameAuto);
  });
 }
 $('lab-reset-view').addEventListener('click',()=>{
  view.yaw=-.57;view.pitch=.48;view.auto=false;
  $('lab-motion-toggle').setAttribute('aria-pressed','false');scheduleStress();
 });
 const reduce=window.matchMedia?.('(prefers-reduced-motion:reduce)');
 let previous=null;
 function frameAuto(now){
  if(!view.auto||document.hidden||reduce?.matches){previous=null;return;}
  view.yaw+=Math.min(100,Math.max(0,now-(previous??now)))/1000*.23;
  previous=now;scheduleStress();requestAnimationFrame(frameAuto);
 }
 if(ctx){
  canvas.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;
   view.drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,moved:false};
   canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
   if(view.drag){
    const dx=e.clientX-view.drag.x,dy=e.clientY-view.drag.y;
    if(Math.hypot(dx,dy)>5)view.drag.moved=true;
    view.yaw=view.drag.yaw+dx*.012;
    view.pitch=clamp(view.drag.pitch+dy*.01,-.28,1.25);
    scheduleStress();
   }else{const el=hit(e);if(el!==view.hover){view.hover=el;scheduleStress();}}
  });
  canvas.addEventListener('pointerup',e=>{
   if(view.drag&&!view.drag.moved){view.selected=hit(e);scheduleStress();}
   view.drag=null;
  });
  canvas.addEventListener('pointercancel',()=>{view.drag=null;});
  canvas.addEventListener('pointerleave',()=>{if(!view.drag){view.hover=null;scheduleStress();}});
  canvas.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
   e.preventDefault();
   if(e.key==='Home'){view.yaw=-.57;view.pitch=.48;}
   if(e.key==='ArrowLeft')view.yaw-=.16;
   if(e.key==='ArrowRight')view.yaw+=.16;
   if(e.key==='ArrowUp')view.pitch=clamp(view.pitch-.12,-.28,1.25);
   if(e.key==='ArrowDown')view.pitch=clamp(view.pitch+.12,-.28,1.25);
   scheduleStress();
  });
 }
 $('lab-stress-face').addEventListener('change',scheduleStress);
 $('lab-stress-field').addEventListener('change',scheduleStress);
 $('lab-scale').addEventListener('change',()=>{if(ida)renderAcceleration();});
 if('ResizeObserver' in window)new ResizeObserver(scheduleStress).observe(canvas);
 else window.addEventListener('resize',scheduleStress,{passive:true});
 // All four chapters are present and visible in static HTML, not tabs.
 const paths={
  shell:new URL('./assets/fem-lab/advanced-shell-results.json',import.meta.url),
  cyclic:new URL('./assets/fem-lab/native-kratos-cyclic.json',import.meta.url),
  ida:new URL('./assets/fem-lab/native-nonlinear-ida.json',import.meta.url)
 };
 async function load(name){
  const resp=await fetch(paths[name],{cache:'force-cache',credentials:'omit'});
  if(!resp.ok)throw Error('D2 dataset '+name+' HTTP '+resp.status);
  return resp.json();
 }
 Promise.all(Object.keys(paths).map(async name=>[name,await load(name)]))
 .then(rows=>{
  for(const [key,data] of rows){
   if(key==='shell')shell=data;
   if(key==='cyclic')cyclic=data;
   if(key==='ida')ida=data;
  }
  if(shell?.schema!=='delghem-showcase-shell-1'||shell.elements?.length!==176||
    cyclic?.schema!=='delghem-kratos-steel-cyclic-1'||cyclic.engine!=='KratosMultiphysics'||cyclic.states?.length!==240||
    ida?.schema!=='delghem-showcase-steel-ida-1'||ida.models?.length!==2||
    ida.models.some(m=>m.runs?.length!==8)||ida.noFragilityClaim!==true)
    throw Error('DÈLGHEM D2 provenance mismatch');
  const points=[...shell.elements.flatMap(e=>e.vertices),...shell.beams.flatMap(b=>[b.a,b.b])];
  const lo=[0,1,2].map(i=>Math.min(...points.map(p=>p[i])));
  const hi=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
  frameBounds={center:lo.map((v,i)=>(v+hi[i])/2)};
  $('lab-scale').value='1.0';
  renderCyclic();renderIDA();renderAcceleration();
  // Show interactive chart SVGs only after all 11 figures have rendered.
  labRoot.dataset.labChartsReady='true';
  scheduleStress();
  labRoot.dataset.labReady='true';
 }).catch(error=>{
  console.error('DÈLGHEM FEM LAB (real source data)',error);
  $('lab-data-error').hidden=false;
 });
}
