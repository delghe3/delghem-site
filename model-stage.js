// Real-time interactive, purely illustrative FEM frame. No engineering solver or fictitious result values.
// Self-contained Canvas renderer: pointer/touch, keyboard, resizing and reduced-motion support.
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a,b,t) => a+(b-a)*t;
const palette = ['#2b65b5','#33a5cf','#65c3a8','#e9c775','#e9874e','#d64c52'];
function heat(t) {
  const n=clamp(t,0,1)*(palette.length-1),i=Math.min(palette.length-2,Math.floor(n)),q=n-i;
  const a=palette[i].match(/\w\w/g).map(x=>parseInt(x,16)),b=palette[i+1].match(/\w\w/g).map(x=>parseInt(x,16));
  return '#'+a.map((x,j)=>Math.round(lerp(x,b[j],q)).toString(16).padStart(2,'0')).join('');
}
function createFrame() {
  const nodes=[],edges=[],X=[-2.5,-.85,.85,2.5],Y=[-1.8,0,1.8],Z=[0,1.24,2.48,3.72,4.96];
  const idx=(i,j,k)=>k*Y.length*X.length+j*X.length+i;
  for(let k=0;k<Z.length;k++)for(let j=0;j<Y.length;j++)for(let i=0;i<X.length;i++)nodes.push({x:X[i],y:Y[j],z:Z[k],i,j,k});
  for(let k=0;k<Z.length;k++)for(let j=0;j<Y.length;j++)for(let i=0;i<X.length;i++){
    const from=idx(i,j,k);
    if(k<Z.length-1)edges.push({a:from,b:idx(i,j,k+1),kind:'column',level:k});
    if(k>0&&i<X.length-1)edges.push({a:from,b:idx(i+1,j,k),kind:'beam',level:k});
    if(k>0&&j<Y.length-1)edges.push({a:from,b:idx(i,j+1,k),kind:'beam',level:k});
  }
  // Perimeter steel bracing. Every diagonal uses the same FEM grid vertices as the frame.
  // X pairs are in perimeter bays only; interior bays remain unobstructed.
  for(let k=0;k<Z.length-1;k++){
    for(const j of [0,Y.length-1]){
      for(const i of (k%2===0?[0,2]:[1])){
        edges.push({a:idx(i,j,k),b:idx(i+1,j,k+1),kind:'brace',level:k});
        edges.push({a:idx(i+1,j,k),b:idx(i,j,k+1),kind:'brace',level:k});
      }
    }
    for(const i of [0,X.length-1]){
      const j=k%2;
      edges.push({a:idx(i,j,k),b:idx(i,j+1,k+1),kind:'brace',level:k});
      edges.push({a:idx(i,j+1,k),b:idx(i,j,k+1),kind:'brace',level:k});
    }
  }
  return {nodes,edges};
}
const frame=createFrame();
export function initModelStage() {
  const canvas=document.getElementById('structure-canvas');
  if(!canvas || !canvas.getContext)return {setMotion(){}};
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return {setMotion(){}};
  const parent=canvas.closest('.structure-stage');
  const controls=[...document.querySelectorAll('[data-model-view]')];
  const legend=document.createElement('div');
  legend.className='model-legend';legend.hidden=true;
  legend.innerHTML='<span class="legend-head">SCALA CROMATICA ILLUSTRATIVA</span><div class="legend-gradient"></div><div class="legend-ends"><span>MIN</span><span>MAX</span></div><small>Non è un risultato di calcolo</small>';
  parent.append(legend);
  let w=0,h=0,dpr=1,view='structure',yaw=-.68,pitch=.35,time=0,last=0,raf=0,auto=false,visible=true,dragging=false,start=null,pointer=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate=()=>auto&&!reduced.matches&&visible&&!document.hidden;
  const transformed=(p)=>{
    let x=p.x,y=p.y,z=p.z;
    if(view==='deformed'&&p.k>0){
      const t=p.z/4.96;
      x+=Math.pow(t,1.55)*(.22+.11*Math.sin(time*1.2+p.y*.5));
      y+=Math.pow(t,1.4)*(.11+.09*Math.cos(time*.8+p.x*.5));
    }
    const xx=x*Math.cos(yaw)-y*Math.sin(yaw),dd=x*Math.sin(yaw)+y*Math.cos(yaw);
    const yy=-z*Math.cos(pitch)+dd*Math.sin(pitch);
    const depth=dd*Math.cos(pitch)+z*Math.sin(pitch);
    const scale=Math.min(w/9.3,h/7.4)*5.6/(5.6+depth*.13);
    return {x:w*.505+xx*scale,y:h*.76+yy*scale,depth,scale};
  };
  const screenPoints=()=>frame.nodes.map(transformed);
  const segment=(a,b,style,width,alpha=1)=>{
    ctx.globalAlpha=alpha;
    ctx.strokeStyle=style;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;
  };
  // Screen-space projection of solid I-section flanges and web. This is a
  // qualitative 3D presentation, not a fabrication-dimensioned profile.
  function ribbon(a,b,nx,ny,offsetA,offsetB,fill,stroke=null){
    const ux=b.x-a.x,uy=b.y-a.y,ln=Math.hypot(ux,uy)||1;
    const extend=.45,ex=ux/ln*extend,ey=uy/ln*extend;
    ctx.fillStyle=fill;ctx.beginPath();
    ctx.moveTo(a.x+nx*offsetA-ex,a.y+ny*offsetA-ey);
    ctx.lineTo(b.x+nx*offsetA+ex,b.y+ny*offsetA+ey);
    ctx.lineTo(b.x+nx*offsetB+ex,b.y+ny*offsetB+ey);
    ctx.lineTo(a.x+nx*offsetB-ex,a.y+ny*offsetB-ey);
    ctx.closePath();ctx.fill();
    if(stroke){ctx.lineWidth=.55;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function drawIProfile(a,b,width,color){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len,half=width*.53;
    const flangeBand=Math.max(1.1,width*.23),webBand=Math.max(.9,width*.18);
    // Profile face, contrasting web, two visible flanges and light metallic edges.
    ribbon(a,b,nx,ny,-half,half,'rgba(23,53,66,.35)');
    ribbon(a,b,nx,ny,-half,-half+flangeBand,color,'rgba(15,42,56,.25)');
    ribbon(a,b,nx,ny,half-flangeBand,half,color,'rgba(15,42,56,.25)');
    ribbon(a,b,nx,ny,-webBand*.5,webBand*.5,'rgba(227,242,243,.78)');
    ribbon(a,b,nx,ny,-half+flangeBand*.3,-half+flangeBand*.52,'rgba(251,255,255,.66)');
    ctx.strokeStyle='rgba(18,49,60,.48)';ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(a.x+nx*half,a.y+ny*half);ctx.lineTo(b.x+nx*half,b.y+ny*half);
    ctx.moveTo(a.x-nx*half,a.y-ny*half);ctx.lineTo(b.x-nx*half,b.y-ny*half);
    ctx.stroke();
  }
  function drawBrace(a,b,width,color){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len;
    ribbon(a,b,nx,ny,-width*.5,width*.5,color,'rgba(45,50,55,.30)');
    ribbon(a,b,nx,ny,-width*.20,-width*.04,'rgba(255,244,227,.76)');
    // Gusset/connector endpoints keep the diagonal visually attached to nodes.
    for(const p of [a,b]){
      ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2.1,width*.55),0,TAU);
      ctx.fillStyle='rgba(190,113,59,.90)';ctx.fill();
      ctx.lineWidth=.8;ctx.strokeStyle='rgba(41,55,65,.35)';ctx.stroke();
    }
  }
  function backdrop(){
    ctx.clearRect(0,0,w,h);
    const haze=ctx.createRadialGradient(w*.58,h*.45,0,w*.5,h*.44,Math.max(w,h)*.59);
    haze.addColorStop(0,'rgba(48,129,150,.13)');haze.addColorStop(.55,'rgba(99,141,132,.035)');haze.addColorStop(1,'rgba(24,43,59,0)');
    ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
    const s=Math.min(w,h)/7.5,origin={x:w*.5,y:h*.78};
    ctx.lineWidth=.8;ctx.strokeStyle='rgba(64,101,116,.12)';
    for(let i=-7;i<=7;i++){
      ctx.beginPath();ctx.moveTo(origin.x+i*s,origin.y-5*s);ctx.lineTo(origin.x+i*s,origin.y+3*s);ctx.stroke();
      ctx.beginPath();ctx.moveTo(origin.x-7*s,origin.y+i*s);ctx.lineTo(origin.x+7*s,origin.y+i*s);ctx.stroke();
    }
    ctx.save();ctx.font='700 11px Manrope, system-ui, sans-serif';ctx.fillStyle='rgba(46,75,88,.66)';
    ctx.fillText('DÈLGHEM  /  FRAME STUDY',Math.max(15,w*.07),29);
    ctx.font='10px Manrope, system-ui, sans-serif';ctx.fillText('3D · MODELLO DIMOSTRATIVO',Math.max(15,w*.07),47);
    ctx.restore();
  }
  function draw(){
    if(w<1||h<1)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);backdrop();
    const pts=screenPoints();
    const sorted=frame.edges.map((e,i)=>({...e,order:i,depth:(pts[e.a].depth+pts[e.b].depth)/2})).sort((a,b)=>a.depth-b.depth);
    if(view==='deformed'){
      const prev=view;view='structure';const undeformed=screenPoints();view=prev;
      for(const e of sorted)segment(undeformed[e.a],undeformed[e.b],'#98acb2',1.45,.30);
    }
    for(const e of sorted){
      const a=pts[e.a],b=pts[e.b];
      const width=e.kind==='column'?clamp(a.scale*.125,7,15):e.kind==='brace'?clamp(a.scale*.072,3.5,7.2):clamp(a.scale*.108,6.5,12.5);
      const n=clamp(.5+Math.sin(e.level*.85+e.order*.21)*.34+(e.kind==='column'?.13:0),0,1);
      const color=view==='forces'?heat(n):e.kind==='column'?'#277a94':e.kind==='brace'?'#be764d':e.level%2?'#dd925c':'#43a4b2';
      segment(a,b,'rgba(24,48,64,.14)',width+5,.33);
      if(e.kind==='brace')drawBrace(a,b,width,color);
      else drawIProfile(a,b,width,color);
    }
    for(let i=0;i<pts.length;i++){
      const p=pts[i],n=frame.nodes[i],r=clamp(p.scale*.038,2.5,4);
      ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fillStyle=n.k===0?'#203c4a':'#e7f5f3';ctx.fill();
      if(n.k===0){ctx.strokeStyle='#cc9458';ctx.lineWidth=1.15;ctx.stroke();}
    }
    // XYZ reference triad is illustrative only.
    const bx=25,by=h-51;
    for(const [dx,dy,color,label] of [[27,8,'#cd654c','X'],[-19,12,'#3788ba','Y'],[0,-29,'#6f9e72','Z']]){
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+dx,by+dy);ctx.stroke();
      ctx.fillStyle=color;ctx.font='700 10px Manrope, sans-serif';ctx.fillText(label,bx+dx+(dx<0?-9:5),by+dy+(dy<0?-5:4));
    }
  }
  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(ts=>{
      raf=0;
      const delta=clamp((ts-(last||ts))/1000,0,.055);last=ts;
      if(canAnimate()){
        if(!dragging)yaw+=delta*.16;
        time+=delta;draw();schedule();
      }else draw();
    });
  }
  const resize=()=>{
    const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
    draw();
  };
  function setMode(next){
    if(!['structure','deformed','forces'].includes(next))return;
    view=next;controls.forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.modelView===next)));
    legend.hidden=next!=='forces';
    draw();
  }
  controls.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.modelView)));
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    dragging=true;pointer=e.pointerId;start={x:e.clientX,y:e.clientY,yaw,pitch};
    canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==pointer)return;
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    yaw=start.yaw+dx*.008;pitch=clamp(start.pitch+dy*.005,-.30,.95);draw();
  });
  const stop=e=>{if(e.pointerId===pointer){dragging=false;pointer=null;start=null;}};
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
    e.preventDefault();
    if(e.key==='Home'){yaw=-.68;pitch=.35;}
    if(e.key==='ArrowLeft')yaw-=.13;
    if(e.key==='ArrowRight')yaw+=.13;
    if(e.key==='ArrowUp')pitch=clamp(pitch-.1,-.30,.95);
    if(e.key==='ArrowDown')pitch=clamp(pitch+.1,-.30,.95);
    draw();
  });
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(visible)schedule();});
  intersection.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  reduced.addEventListener?.('change',()=>{if(!reduced.matches)schedule();else draw();});
  resize();schedule();
  return {setMotion(value){auto=Boolean(value);if(auto)schedule();else draw();},setView:setMode,destroy(){observer.disconnect();intersection.disconnect();if(raf)cancelAnimationFrame(raf);}};
}
