import {introAt,INTRO_DURATION_MS} from './site-intro-timeline.mjs?v=20261025-showcase15seo';

/**
 * The DÈLGHEM public homepage opens with one five-second identity sequence.
 * Coloured mesh cells are decorative engineering visual language only.
 * The side cards reference ACTUAL existing D2 / Kratos source imagery.
 * No browser APIs, external requests or persistence are needed beyond this
 * one deterministic display interval.
 */
const root=document.getElementById('site-intro');
if(root){
 const word=document.getElementById('site-intro-word');
 const progress=document.getElementById('site-intro-progress');
 const tagline=document.getElementById('site-intro-tagline');
 const countdown=document.getElementById('site-intro-countdown');
 const skip=document.getElementById('site-intro-skip');
 const mesh=document.getElementById('site-intro-mesh');
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let raf=0,started=0,lastDraw=-1,stage=-1,closed=false,meshWidth=0,meshHeight=0;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const colours=[
  [34,86,170],[45,123,196],[56,182,196],
  [100,221,191],[231,214,104],[245,137,71],[202,73,70]
 ];
 const heat=(v)=>{
  const fraction=clamp(v,0,.999)* (colours.length-1);
  const i=Math.floor(fraction),t=fraction-i;
  return colours[i].map((v,k)=>Math.round(v+(colours[i+1][k]-v)*t));
 };
 function cleanUp(){
  if(closed)return;
  closed=true;
  cancelAnimationFrame(raf);
  window.removeEventListener('resize',resize);
  reduce.removeEventListener?.('change',handleMotion);
  document.documentElement.classList.remove('site-intro-active');
  root.dataset.done='true';
  root.classList.add('is-dismissed');
  root.setAttribute('aria-hidden','true');
  // The last 390 ms already fade out before the five-second mark. Removing
  // it here reveals the completed website after exactly five seconds.
  root.remove();
 }
 function handleMotion(event){
  if(event.matches)cleanUp();
 }
 function resize(){
  if(!mesh?.getContext)return;
  const bounds=root.getBoundingClientRect();
  meshWidth=Math.max(2,bounds.width);
  meshHeight=Math.max(2,bounds.height);
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  mesh.width=Math.round(meshWidth*dpr);
  mesh.height=Math.round(meshHeight*dpr);
  const ctx=mesh.getContext('2d',{alpha:true});
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function rgba(rgb,a){
  return 'rgba('+rgb.join(',')+','+a+')';
 }
 function paintMesh(ms){
  const ctx=mesh?.getContext?.('2d');
  if(!ctx||meshWidth<=3||meshHeight<=3)return;
  const w=meshWidth,h=meshHeight;
  ctx.clearRect(0,0,w,h);
  const t=ms*.001;
  // A wave-distorted quadrilateral mesh: intentionally decorative, not a
  // simulated stress solution. The REAL solver screenshot remains visible
  // in the picture panel and elsewhere in the technical site.
  const nx=w<650?15:29,ny=w<650?10:15;
  const ux=(i)=>i/nx,vx=(j)=>j/ny;
  const position=(i,j)=>{
   const u=ux(i),v=vx(j);
   const spread=w<650?.78:1.21;
   const px=w*(.5+(u-.5)*spread)
     +Math.sin(u*10.3+t*.78+v*4.1)*Math.min(13,w*.021);
   const py=h*(.61+(v-.5)*(w<650?.61:.68))
     +h*.055*Math.sin(u*3.1-v*7.4+t*.44)
     +Math.cos(u*9-v*11+t*.65)*Math.min(14,h*.017);
   return {x:px,y:py};
  };
  const stress=(u,v)=>{
   const peak1=Math.exp(-((u-.24-t*.011)**2/.030+(v-.46)**2/.028));
   const peak2=Math.exp(-((u-.74+t*.008)**2/.017+(v-.65)**2/.031));
   const edge=Math.abs(Math.sin(u*8.7-v*6.2+t*.35))*.27;
   return clamp(.13+peak1*.84+peak2*.72+edge,0,1);
  };
  ctx.save();
  ctx.globalCompositeOperation='screen';
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
   const a=position(i,j),b=position(i+1,j),c=position(i+1,j+1),d=position(i,j+1);
   const u=(i+.5)/nx,v=(j+.5)/ny;
   const colour=heat(stress(u,v));
   const fade=.18+.32*(1-Math.abs(u-.5)*.50);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
   ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();
   ctx.fillStyle=rgba(colour,fade);ctx.fill();
   ctx.strokeStyle='rgba(117,205,208,.18)';
   ctx.lineWidth=w<650?.48:.64;ctx.stroke();
  }
  // A few selected FEM lattice connections emphasize the engineering theme
  // without pretending the decorative mesh is computed structural output.
  for(let j=1;j<ny;j+=3){
   ctx.beginPath();
   for(let i=0;i<=nx;i++){
    const p=position(i,j);
    i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
   }
   ctx.strokeStyle='rgba(119,234,219,.35)';ctx.lineWidth=1.25;
   ctx.stroke();
  }
  const pulse=.5+.5*Math.sin(t*2.2);
  const centers=[position(Math.round(nx*.25),Math.round(ny*.43)),
   position(Math.round(nx*.74),Math.round(ny*.65))];
  for(const [i,p] of centers.entries()){
   const rad=(i===0?48:35)*(w<650?.65:1);
   const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad*(.8+pulse*.4));
   grad.addColorStop(0,i===0?'rgba(251,151,96,.29)':'rgba(113,212,237,.27)');
   grad.addColorStop(1,'rgba(79,210,198,0)');
   ctx.fillStyle=grad;
   ctx.beginPath();ctx.arc(p.x,p.y,rad*1.25,0,Math.PI*2);
   ctx.fill();
  }
  ctx.restore();
  // Central dark vignette keeps the growing word completely readable even
  // on mobile where only the decorative mesh is visible.
  const shadow=ctx.createRadialGradient(w*.50,h*.49,w*.03,w*.50,h*.49,w*.48);
  shadow.addColorStop(0,'rgba(4,21,29,.81)');
  shadow.addColorStop(.45,'rgba(4,21,29,.62)');
  shadow.addColorStop(1,'rgba(4,21,29,0)');
  ctx.fillStyle=shadow;ctx.fillRect(0,0,w,h);
  mesh.dataset.renderReady='true';
 }
 function runFrame(now){
  if(closed)return;
  const elapsed=Math.max(0,now-started);
  const state=introAt(elapsed);
  if(state.stage!==stage){
   stage=state.stage;
   word.textContent=state.word;
   root.dataset.letters=String(state.word.length);
  }
  progress.style.transform='scaleX('+state.progress.toFixed(5)+')';
  countdown.textContent='00:'+String(Math.ceil((INTRO_DURATION_MS-state.elapsed)/1000)).padStart(2,'0');
  if(state.tagline&&root.dataset.phase==='build'){
   root.dataset.phase='complete';
   tagline.setAttribute('aria-hidden','false');
  }
  if(state.exit&&root.dataset.phase!=='exit'){
   root.dataset.phase='exit';
  }
  if(now-lastDraw>=32||lastDraw<0){
   paintMesh(state.elapsed);
   lastDraw=now;
  }
  if(state.done){cleanUp();return;}
  raf=requestAnimationFrame(runFrame);
 }
 skip.addEventListener('click',cleanUp);
 function start(){
  if(closed)return;
  if(reduce.matches){
   word.textContent='DELGHEM';
   progress.style.transform='scaleX(1)';
   root.dataset.phase='complete';
   tagline.setAttribute('aria-hidden','false');
   cleanUp();
   return;
  }
  document.documentElement.classList.add('site-intro-active');
  reduce.addEventListener?.('change',handleMotion);
  window.addEventListener('resize',resize,{passive:true});
  root.dataset.ready='true';
  root.dataset.phase='build';
  tagline.setAttribute('aria-hidden','true');
  word.textContent='D';
  resize();
  started=performance.now();
  paintMesh(0);
  raf=requestAnimationFrame(runFrame);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
