/**
 * Real native DÈLGHEM D2 EIGHT-storey tower + asymmetric annexes: RC core,
 * S355 steel frames, GL24h pitched roofs and DIRECT pad footings. Validated as EDITABLE model
 * by D2. Geotechnical / structural design has NOT been performed or certified.
 */
import {complexDemo} from './assets/real-d2/complex-demo-geometry.mjs?v=20261024-8floor-d2a';
const mixedDemo=complexDemo;
const mid=(complexDemo.bbox.min.map((v,i)=>(v+complexDemo.bbox.max[i])/2));
const extent=complexDemo.bbox.max.map((v,i)=>v-complexDemo.bbox.min[i]);
const towerHeight=complexDemo.levels.at(-1);
const roofHeight=complexDemo.bbox.max[2];
const isTallConcept=complexDemo.storeyCount>=8;

// 360° in about 18.5 seconds, perceptible without abrupt motion.
export const DEFAULT_ORBIT_SPEED = 0.34;
const FRAME_INTERVAL = 1000/(isTallConcept?19:24);

const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const plus=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const minus=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const times=(v,k)=>[v[0]*k,v[1]*k,v[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>times(v,1/(Math.hypot(...v)||1));
const light=norm([-.50,-.35,1.2]);
const colors={
  'steel-column':[23,85,168],
  'rc-column':[182,197,203],
  'main-beam':[27,155,211],
  'secondary-beam':[40,190,210],
  'brace':[244,109,70],
  'rc-wall':[168,182,195],
  'rc-floor':[100,197,219],
  'rc-roof':[100,205,207],
  'wood-deck':[218,174,103],
  'wood-roof':[246,178,90],
  'steel-roof':[92,185,222],
  'rc-balcony':[100,205,209],
  'rc-beam':[183,198,210],
  'rc-footing':[197,214,224],
  'foundation-tie':[130,169,192],
  'steel-truss':[58,100,234],
  'steel-purlin':[47,140,197],
  'cantilever':[20,174,217],
  'wood-post':[183,118,61],
  'wood-beam':[199,138,64],
  'wood-truss':[250,170,73],
  'wood-purlin':[253,199,110]
};

function crossSection(section){
  const {b,h,tw,tf}=section,B=b/2,H=h/2;
  if(section.material==='rc'||section.material==='wood'||section.shape==='rect'){
    // Real rectangular native D2 reinforced concrete and GL24h sections.
    return [[-B,-H],[B,-H],[B,H],[-B,H]];
  }
  const T=tw/2;
  // True HE and IPE flanges and web from the D2 catalog properties.
  return [[-B,-H],[B,-H],[B,-H+tf],[T,-H+tf],[T,H-tf],[B,H-tf],
    [B,H],[-B,H],[-B,H-tf],[-T,H-tf],[-T,-H+tf],[-B,-H+tf]];
}

// Solid I-profile faces use the exact D2 section dimensions and roll axis.
function makeGeometry(){
  const faces=[];
  for(const member of mixedDemo.members){
    const a=mixedDemo.nodes[member.a],b=mixedDemo.nodes[member.b];
    const axis=norm(minus(b,a));
    const roll=member.orientation??[0,1,0];
    let u=minus(roll,times(axis,dot(axis,roll)));
    if(Math.hypot(...u)<.005)u=cross(axis,[0,0,1]);
    if(Math.hypot(...u)<.005)u=[1,0,0];
    u=norm(u);
    const v=norm(cross(axis,u));
    const outline=crossSection(mixedDemo.sections[member.section]);
    const vertex=(p,node)=>plus(node,plus(times(u,p[0]),times(v,p[1])));
    const atA=outline.map(p=>vertex(p,a)),atB=outline.map(p=>vertex(p,b));
    for(let i=0;i<outline.length;i++){
      const k=(i+1)%outline.length;
      const vertices=[atA[i],atB[i],atB[k],atA[k]];
      const normal=norm(cross(minus(vertices[1],vertices[0]),minus(vertices[3],vertices[0])));
      faces.push({vertices,normal,kind:member.kind,side:i,height:(a[2]+b[2])/2});
    }
    faces.push({vertices:atA.slice().reverse(),normal:times(axis,-1),kind:member.kind,side:12,height:a[2]});
    faces.push({vertices:atB,normal:axis,kind:member.kind,side:13,height:b[2]});
  }
  // Concrete shear-wall and floor QUAD shells are present in the real,
  // DÈLGHEM-validated mixed .hfm.json model (not added as screen decoration).
  for(const shell of mixedDemo.shells){
    const corners=shell.nodes.map(i=>mixedDemo.nodes[i]);
    const n=norm(cross(minus(corners[1],corners[0]),minus(corners[3],corners[0])));
    const d=times(n,shell.thickness/2);
    const positive=corners.map(x=>plus(x,d)),negative=corners.map(x=>minus(x,d));
    const z=corners.reduce((sum,v)=>sum+v[2],0)/corners.length;
    faces.push({vertices:positive,normal:n,kind:shell.kind,side:30,height:z});
    faces.push({vertices:negative.slice().reverse(),normal:times(n,-1),kind:shell.kind,side:31,height:z});
    for(let i=0;i<4;i++){
      const k=(i+1)%4;
      const vertices=[positive[i],positive[k],negative[k],negative[i]];
      const normal=norm(cross(minus(vertices[1],vertices[0]),minus(vertices[3],vertices[0])));
      faces.push({vertices,normal,kind:shell.kind,side:32+i,height:z});
    }
  }
  // Foundations are not decorative: geometry comes from the D2
  // foundationSystem.items of type DIRECT and belongs to native support IDs.
  for(const footing of mixedDemo.footings){
    const {x,y,z,widthM,lengthM,thicknessM}=footing;
    const X=widthM/2,Y=lengthM/2,Z=thicknessM/2;
    const corners=[
      [x-X,y-Y,z-Z],[x+X,y-Y,z-Z],[x+X,y+Y,z-Z],[x-X,y+Y,z-Z],
      [x-X,y-Y,z+Z],[x+X,y-Y,z+Z],[x+X,y+Y,z+Z],[x-X,y+Y,z+Z]
    ];
    for(const indices of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
      const vertices=indices.map(i=>corners[i]);
      const normal=norm(cross(minus(vertices[1],vertices[0]),minus(vertices[3],vertices[0])));
      faces.push({vertices,normal,kind:footing.kind,side:34,height:z});
    }
  }
  return faces;
}
const faces=makeGeometry();

export function initModelStage(){
  const canvas=document.getElementById('structure-canvas');
  if(!canvas||!canvas.getContext)return {setMotion(){},setView(){},destroy(){}};
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return {setMotion(){},setView(){},destroy(){}};
  const stage=canvas.closest('.structure-stage'),controls=[...document.querySelectorAll('[data-model-view]')];
  const italian=document.documentElement.lang==='it';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,dpr=1,scale=1,yaw=-.97,pitch=.60,mode='structure';
  let camera={cs:1,sn:0,cp:1,sp:0};
  let motion=false,visible=true,dragging=false,pointer=null,start=null,phase=0,last=0,raf=0,disposed=false;
  canvas.style.touchAction='pan-y';
  canvas.tabIndex=0;
  const legend=document.createElement('div');
  legend.className='model-legend';legend.hidden=true;
  legend.innerHTML=italian
    ? '<strong class="legend-head">COLORI ILLUSTRATIVI</strong><div class="legend-gradient"></div><div class="legend-ends"><span>QUALITATIVO</span><span>NON CALCOLATO</span></div><small>Nessuna sollecitazione FEM calcolata</small>'
    : '<strong class="legend-head">ILLUSTRATIVE COLORS</strong><div class="legend-gradient"></div><div class="legend-ends"><span>QUALITATIVE</span><span>NOT COMPUTED</span></div><small>No computed FEM forces</small>';
  stage.append(legend);

  function displaced(p){
    if(mode!=='deformed')return p;
    const z=clamp(p[2]/Math.max(1,towerHeight),0,1),k=z*z;
    return [p[0]+k*(.55+.04*Math.sin(phase+p[1]*.1)),
      p[1]+k*(.15+.03*Math.cos(phase+p[0]*.1)),p[2]];
  }
  function project(p,original=false){
    const q=original?p:displaced(p);
    const x=q[0]-mid[0],y=q[1]-mid[1],z=q[2]-mid[2];
    const {cs,sn,cp,sp}=camera;
    const xx=x*cs-y*sn,depth=(x*sn+y*cs)*cp+z*sp;
    const yy=(x*sn+y*cs)*sp-z*cp;
    const persp=clamp(1-depth*.008,.79,1.21);
    return {x:width*.50+xx*scale*persp,y:height*.52+yy*scale*persp,depth};
  }
  function poly(points,color,border='rgba(18,54,66,.12)'){
    ctx.beginPath();
    points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
    if(border){
      ctx.lineWidth=.45;ctx.strokeStyle=border;ctx.stroke();
    }
  }
  function rgba(color,k,alpha=1){
    const values=color.map(v=>Math.round(clamp(v*k,0,255)));
    return 'rgba('+values.join(',')+','+alpha+')';
  }
  function drawBackdrop(){
    const bg=ctx.createRadialGradient(width*.54,height*.39,8,width*.51,height*.44,Math.max(width,height)*.72);
    bg.addColorStop(0,'rgba(141,202,198,.14)');
    bg.addColorStop(1,'rgba(225,239,238,0)');
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='rgba(42,93,115,.12)';ctx.lineWidth=.85;
    for(const x of mixedDemo.gridX){
      const a=project([x,mixedDemo.bbox.min[1]-1,0],true),b=project([x,mixedDemo.bbox.max[1]+1,0],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(const y of mixedDemo.gridY){
      const a=project([mixedDemo.bbox.min[0]-1,y,0],true),b=project([mixedDemo.bbox.max[0]+1,y,0],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  function drawGhost(){
    if(mode!=='deformed')return;
    ctx.strokeStyle='rgba(42,78,91,.2)';ctx.lineWidth=1.2;
    for(const member of mixedDemo.members){
      const a=project(mixedDemo.nodes[member.a],true);
      const b=project(mixedDemo.nodes[member.b],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  function paintFaces(){
    // Depth-sort faces rather than overpainting member centerlines: real I flanges/web are visible.
    const projected=faces.map(face=>{
      const points=face.vertices.map(p=>project(p));
      return {face,points,depth:points.reduce((sum,p)=>sum+p.depth,0)/points.length};
    }).sort((a,b)=>b.depth-a.depth);
    for(const item of projected){
      const {face,points}=item;
      const lighting=clamp(.78+dot(face.normal,light)*.25,.48,1.10);
      const base=colors[face.kind]??colors.primary;
      let pigment=base;
      if(mode==='forces'&&face.kind!=='rc-floor'&&face.kind!=='rc-wall'){
        // Qualitative gradient only: NOT calculated forces or a solver result.
        const heightRatio=clamp(face.height/Math.max(1,roofHeight),0,1);
        pigment=[Math.round(30+173*heightRatio),Math.round(128+19*Math.sin(heightRatio*Math.PI)),Math.round(203-122*heightRatio)];
      }
      // Semi-transparent concrete floors expose the contrasting structural skeleton.
      const opacity=['rc-floor','rc-roof','rc-balcony'].includes(face.kind)?.22:
        face.kind==='wood-roof'?.64:face.kind==='wood-deck'?.28:
        face.kind==='steel-roof'?.43:face.kind==='rc-wall'?.74:1;
      const border=['rc-floor','rc-roof','rc-balcony','wood-deck','wood-roof','steel-roof'].includes(face.kind)?'rgba(39,95,123,.23)':'rgba(22,49,70,.23)';
      poly(points,rgba(pigment,lighting,opacity),border);
    }
  }
  function axisTriad(){
    const x=38,y=height-49,origin=mid;
    const pivot=project(origin,true);
    // Project the global basis with the very same camera as the structural model.
    for(const [vector,color,label] of [
      [[1,0,0],'#b96b50','X'],[[0,1,0],'#367da7','Y'],[[0,0,1],'#39977d','Z']
    ]){
      const end=project(plus(origin,vector),true);
      const length=26/(Math.hypot(end.x-pivot.x,end.y-pivot.y)||1);
      const dx=(end.x-pivot.x)*length,dy=(end.y-pivot.y)*length;
      ctx.strokeStyle=color;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();
      ctx.fillStyle=color;ctx.font='700 10px system-ui';ctx.fillText(label,x+dx+4,y+dy);
    }
  }
  function labels(){
    ctx.textAlign='left';ctx.fillStyle='rgba(29,76,93,.83)';
    ctx.font='700 10px Manrope,system-ui,sans-serif';
    if(width>480)ctx.fillText('DÈLGHEM D2 · '+complexDemo.storeyCount+' STOREYS · C30/37 / S355 / GL24h',Math.max(15,width*.045),height*.10);
  }
  function render(){
    if(disposed||width<2||height<2)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    camera={cs:Math.cos(yaw),sn:Math.sin(yaw),cp:Math.cos(pitch),sp:Math.sin(pitch)};
    drawBackdrop();drawGhost();paintFaces();axisTriad();
    stage.classList.add('model-ready');
  }
  function resize(){
    const r=canvas.getBoundingClientRect();
    width=Math.max(1,r.width);height=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,width<480?1.4:1.8);
    canvas.width=Math.max(1,Math.round(width*dpr));
    canvas.height=Math.max(1,Math.round(height*dpr));
    // Fit the native D2 model bounding volume through a 360-degree camera orbit.
    const orbitDiameter=Math.hypot(extent[0],extent[1]);
    scale=Math.min(width/(orbitDiameter*1.13),height/(orbitDiameter*.68+extent[2]*.78));
    render();
  }
  function tick(timestamp){
    raf=0;
    if(disposed||!motion||!visible||document.hidden||reduced.matches)return;
    if(!last)last=timestamp;
    const elapsed=timestamp-last;
    if(elapsed>=FRAME_INTERVAL*(width<480?1.27:1)){
      const dt=Math.min(.10,elapsed/1000);
      last=timestamp;
      if(!dragging)yaw+=dt*DEFAULT_ORBIT_SPEED;
      if(yaw>TAU)yaw-=TAU;
      phase+=dt;
      render();
    }
    raf=requestAnimationFrame(tick);
  }
  function schedule(){
    if(disposed||raf||!motion||!visible||document.hidden||reduced.matches)return;
    last=0;raf=requestAnimationFrame(tick);
  }
  function setMotion(value){
    motion=!!value;
    if(motion)schedule();
    else if(raf){cancelAnimationFrame(raf);raf=0;render();}
  }
  function setView(next){
    if(!['structure','deformed','forces'].includes(next))return;
    mode=next;legend.hidden=next!=='forces';
    controls.forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.modelView===next)));
    render();
  }
  controls.forEach(c=>c.addEventListener('click',()=>setView(c.dataset.modelView)));
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    dragging=true;pointer=e.pointerId;start={x:e.clientX,y:e.clientY,yaw,pitch};
    canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==pointer)return;
    yaw=start.yaw+(e.clientX-start.x)*.008;
    pitch=clamp(start.pitch+(e.clientY-start.y)*.006,-.05,.95);render();
  });
  const stop=e=>{if(e.pointerId===pointer){dragging=false;pointer=null;start=null;}};
  canvas.addEventListener('pointerup',stop);
  canvas.addEventListener('pointercancel',stop);
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
    e.preventDefault();
    if(e.key==='Home'){yaw=-.97;pitch=.60;}
    if(e.key==='ArrowLeft')yaw-=.12;
    if(e.key==='ArrowRight')yaw+=.12;
    if(e.key==='ArrowUp')pitch=clamp(pitch-.08,-.05,.95);
    if(e.key==='ArrowDown')pitch=clamp(pitch+.08,-.05,.95);
    render();
  });
  document.getElementById('reset-model')?.addEventListener('click',()=>{yaw=-.97;pitch=.60;render();canvas.focus({preventScroll:true});});
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}
    if(visible)schedule();
  });
  intersection.observe(canvas);
  const visibility=()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();};
  const preference=()=>{if(reduced.matches&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();};
  document.addEventListener('visibilitychange',visibility);
  reduced.addEventListener?.('change',preference);
  resize();schedule();
  return {
    setMotion,setView,
    destroy(){
      disposed=true;if(raf)cancelAnimationFrame(raf);
      observer.disconnect();intersection.disconnect();
      document.removeEventListener('visibilitychange',visibility);
      reduced.removeEventListener?.('change',preference);
      legend.remove();stage.classList.remove('model-ready');
    }
  };
}
