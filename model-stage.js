/**
 * DÈLGHEM D2 validated mixed steel/RC conceptual demo: 60 nodes, 124 members, 30 shells.
 * Pure browser-side 3D projection of actual declared member geometry and roll orientations.
 * Preliminary demonstrative MODEL INPUT: no FEM stress/displacement result or safety check.
 */
import {mixedDemo} from './assets/real-d2/mixed-demo-geometry.mjs';

const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const plus=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const minus=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const times=(v,k)=>[v[0]*k,v[1]*k,v[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>times(v,1/(Math.hypot(...v)||1));
const light=norm([-.50,-.35,1.2]);
const colors={
  'steel-column':[40,86,111],
  'rc-column':[184,190,191],
  'main-beam':[26,128,154],
  'secondary-beam':[83,166,180],
  'brace':[218,122,64],
  'rc-wall':[172,183,183],
  'rc-floor':[135,204,206]
};

function crossSection(section){
  const {b,h,tw,tf}=section,B=b/2,H=h/2;
  if(section.material==='rc'){
    // Concrete square/prismatic column, true D2 RC section extents.
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
  let width=1,height=1,dpr=1,scale=1,yaw=-.59,pitch=.46,mode='structure';
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
    const z=clamp(p[2]/14.4,0,1),k=z*z;
    return [p[0]+k*(.55+.04*Math.sin(phase+p[1]*.1)),
      p[1]+k*(.15+.03*Math.cos(phase+p[0]*.1)),p[2]];
  }
  function project(p,original=false){
    const q=original?p:displaced(p);
    const x=q[0]-9,y=q[1]-5,z=q[2]-7.2;
    const cs=Math.cos(yaw),sn=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const xx=x*cs-y*sn,depth=(x*sn+y*cs)*cp+z*sp;
    const yy=(x*sn+y*cs)*sp-z*cp;
    const persp=clamp(1-depth*.012,.77,1.23);
    return {x:width*.50+xx*scale*persp,y:height*.525+yy*scale*persp,depth};
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
      const a=project([x,-2,0],true),b=project([x,12,0],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(const y of mixedDemo.gridY){
      const a=project([-2,y,0],true),b=project([20,y,0],true);
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
        const heightRatio=clamp(face.height/14.4,0,1);
        pigment=[Math.round(30+173*heightRatio),Math.round(128+19*Math.sin(heightRatio*Math.PI)),Math.round(203-122*heightRatio)];
      }
      // Semi-transparent concrete floors expose the contrasting structural skeleton.
      const opacity=face.kind==='rc-floor'?.28:face.kind==='rc-wall'?.88:1;
      const border=face.kind==='rc-floor'?'rgba(63,126,136,.2)':'rgba(20,56,68,.16)';
      poly(points,rgba(pigment,lighting,opacity),border);
    }
  }
  function axisTriad(){
    const x=38,y=height-49;
    for(const [dx,dy,color,label] of [[27,8,'#b96b50','X'],[-17,10,'#367da7','Y'],[0,-29,'#39977d','Z']]){
      ctx.strokeStyle=color;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();
      ctx.fillStyle=color;ctx.font='700 10px system-ui';ctx.fillText(label,x+dx+4,y+dy);
    }
  }
  function labels(){
    ctx.textAlign='left';ctx.fillStyle='rgba(29,76,93,.83)';
    ctx.font='700 10px Manrope,system-ui,sans-serif';
    ctx.fillText('DÈLGHEM D2 · MIXED STRUCTURAL DEMO',Math.max(15,width*.045),27);
    ctx.font='600 9px Manrope,system-ui,sans-serif';
    ctx.fillText('C30/37  /  HEB340–280  /  IPE400–270',Math.max(15,width*.045),43);
    if(width>480)ctx.fillText('60 NODES  ·  124 MEMBERS  ·  8 BRACES',Math.max(15,width*.045),57);
  }
  function render(){
    if(disposed||width<2||height<2)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    drawBackdrop();drawGhost();paintFaces();axisTriad();
    stage.classList.add('model-ready');
  }
  function resize(){
    const r=canvas.getBoundingClientRect();
    width=Math.max(1,r.width);height=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(width*dpr));
    canvas.height=Math.max(1,Math.round(height*dpr));
    // Keep the true 18 x 10 x 14.4 m model inside the Chrome viewport.
    scale=Math.min(width/25,height/22)*.95;
    render();
  }
  function tick(timestamp){
    raf=0;
    if(disposed||!motion||!visible||document.hidden||reduced.matches)return;
    if(timestamp-last>65){
      const dt=last?Math.min(.07,(timestamp-last)/1000):.046;
      last=timestamp;if(!dragging)yaw+=dt*.045;
      phase+=dt;render();
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
    if(e.key==='Home'){yaw=-.59;pitch=.46;}
    if(e.key==='ArrowLeft')yaw-=.12;
    if(e.key==='ArrowRight')yaw+=.12;
    if(e.key==='ArrowUp')pitch=clamp(pitch-.08,-.05,.95);
    if(e.key==='ArrowDown')pitch=clamp(pitch+.08,-.05,.95);
    render();
  });
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
