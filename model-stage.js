/**
 * DÈLGHEM home FEM illustration.
 * This is NOT a calculation result. The normalized, qualitative colour field is
 * a visual demonstration only; the real application screenshots are elsewhere
 * on the page and explicitly marked as such.
 * Native Canvas 2D, no libraries, trackers or external requests.
 */
export function initModelStage() {
  const canvas = document.querySelector('#structure-canvas');
  if (!canvas) return { setMotion() {} };
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { setMotion() {} };
  const controls = Array.from(document.querySelectorAll('[data-model-view]'));
  let mode = 'structure';
  let yaw = -0.62;
  let altitude = 0.39;
  let spin = false;
  let dragging = false;
  let lastPointer = 0;
  let frame = 0;
  let prev = 0;
  let visible = true;
  let width = 640, height = 520;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const orange = [238, 132, 57];
  const stops = [
    [0.00, [20, 56, 112]],
    [0.19, [18, 112, 184]],
    [0.39, [23, 182, 193]],
    [0.58, [224, 219, 75]],
    [0.78, [244, 141, 47]],
    [1.00, [224, 52, 70]]
  ];
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function colour(value, alpha = 1) {
    const t = clamp(value, 0, 1);
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i + 1][0]) {
        a = stops[i]; b = stops[i + 1]; break;
      }
    }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const rgb = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }
  function sample(x, y, z) {
    if (mode === 'structure') {
      return clamp(0.18 + z * .13 + .22 * Math.sin(x * 1.3 + .6) ** 2 + .14 * Math.sin(y * 1.1) ** 2, 0, 1);
    }
    if (mode === 'deformed') {
      return clamp(.10 + z * .17 + .26 * Math.sin(x * .94 + y * .46) ** 2, 0, 1);
    }
    return clamp(0.12 + .52 * Math.exp(-((x - 2) ** 2 + (y - 1.5) ** 2) / 3.2) + .12 * z + .18 * Math.sin(x * 2.15 + z) ** 2, 0, 1);
  }
  function displaced(x, y, z) {
    if (mode !== 'deformed') return { x, y, z };
    const u = z / 3.15;
    return { x: x + .20 * u * u + .028 * Math.sin(y * 1.8) * u, y: y + .14 * u * u, z: z - .05 * u * u };
  }
  function projected(x, y, z) {
    const p = displaced(x, y, z);
    const dx = p.x - 2, dy = p.y - 1.5;
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    const cr = dx * cy - dy * sy;
    const depth = dx * sy + dy * cy;
    const s = Math.min(width / 8.9, height / 7.2);
    return { x: width * .53 + cr * s, y: height * .54 + depth * Math.sin(altitude) * s - (p.z - 1.5) * Math.cos(altitude) * s, depth };
  }
  function strokeSegment(ax, ay, az, bx, by, bz, thickness = 3.1, alpha = 1, slices = 7) {
    for (let i = 0; i < slices; i++) {
      const a = i / slices, b = (i + 1) / slices;
      const s1 = projected(ax + (bx - ax) * a, ay + (by - ay) * a, az + (bz - az) * a);
      const s2 = projected(ax + (bx - ax) * b, ay + (by - ay) * b, az + (bz - az) * b);
      const value = sample(ax + (bx - ax) * ((a + b) / 2), ay + (by - ay) * ((a + b) / 2), az + (bz - az) * ((a + b) / 2));
      ctx.strokeStyle = colour(value, alpha);
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    }
  }
  function polygon(points, fill, stroke = null) {
    ctx.beginPath();
    points.forEach((p, index) => index ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function grid() {
    ctx.save();
    ctx.globalAlpha = .45;
    ctx.strokeStyle = '#b6ccd1'; ctx.lineWidth = .65;
    for (let x = -5; x < 6; x++) {
      const a = projected(x, -4.8, -.10), b = projected(x, 7.8, -.10);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let y = -4; y < 7; y++) {
      const a = projected(-5.8, y, -.10), b = projected(9, y, -.10);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }
  function drawSlab(z) {
    // A square plate mesh and a continuous qualitative colour field.
    const segments = 10;
    for (let i = 0; i < segments; i++) for (let j = 0; j < segments; j++) {
      const x = i * 4 / segments, y = j * 3 / segments;
      const dx = 4 / segments, dy = 3 / segments;
      const pts = [projected(x, y, z),projected(x+dx,y,z),projected(x+dx,y+dy,z),projected(x,y+dy,z)];
      const v = sample(x+dx/2,y+dy/2,z);
      polygon(pts, colour(v,mode === 'forces' ? .37 : .20), 'rgba(29,80,104,.13)');
    }
    for(let i=0;i<=4;i++) strokeSegment(i,0,z,i,3,z,1.25,.64,6);
    for(let j=0;j<=3;j++) strokeSegment(0,j,z,4,j,z,1.25,.64,6);
  }
  function drawColumn(x,y) {
    for(let level=0;level<3;level++) strokeSegment(x,y,level*1.05,x,y,(level+1)*1.05,4.1,.95,8);
    const p=projected(x,y,0);
    ctx.fillStyle='#273a4d'; ctx.strokeStyle='#618195';ctx.lineWidth=.9;
    ctx.fillRect(p.x-6,p.y-2,12,5);ctx.strokeRect(p.x-6,p.y-2,12,5);
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    grid();
    // Sorted render along depth for coherent occlusion, entirely deterministic.
    const slabs = [1.05,2.10,3.15];
    for (const z of slabs) drawSlab(z);
    const columns=[];
    for(let x=0;x<=4;x++) for(let y=0;y<=3;y++) columns.push({x,y,depth:projected(x,y,0).depth});
    columns.sort((a,b)=>b.depth-a.depth);
    ctx.save();ctx.shadowColor='#247ea450';ctx.shadowBlur=7;
    for(const p of columns) drawColumn(p.x,p.y);
    for(const z of slabs){
      for(let x=0;x<=4;x++) for(let y=0;y<3;y++) strokeSegment(x,y,z,x,y+1,z,3.4,1);
      for(let y=0;y<=3;y++) for(let x=0;x<4;x++) strokeSegment(x,y,z,x+1,y,z,3.4,1);
    }
    ctx.restore();
    // A few visible node joints to clarify finite elements.
    for(const z of slabs)for(let x=0;x<=4;x++)for(let y=0;y<=3;y++){
      const p=projected(x,y,z);
      ctx.fillStyle='#183f60';ctx.strokeStyle='#e8f6f6';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(p.x,p.y,2.25,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    if(mode==='forces') {
      ctx.save();ctx.strokeStyle='#df6845';ctx.lineWidth=2;
      for(const a of [[1,1],[2,2],[3,1]]){
        const p=projected(a[0],a[1],3.6),e=projected(a[0],a[1],3.28);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(e.x,e.y);ctx.stroke();
        ctx.beginPath();ctx.moveTo(e.x-4,e.y-8);ctx.lineTo(e.x,e.y);ctx.lineTo(e.x+4,e.y-8);ctx.stroke();
      }
      ctx.restore();
    }
    // Spatial coordinate triad.
    const a={x:72,y:height-64};
    for(const [dx,dy,label,col] of [[38,0,'X','#c7534c'],[-17,-21,'Y','#249b8c'],[0,-40,'Z','#2d70be']]){
      ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+dx,a.y+dy);ctx.stroke();
      ctx.font='700 11px system-ui';ctx.fillText(label,a.x+dx+3,a.y+dy+2);
    }
  }
  function resize() {
    const b=canvas.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    canvas.width=Math.max(1,Math.round(width*DPR));
    canvas.height=Math.max(1,Math.round(height*DPR));
    ctx.setTransform(DPR,0,0,DPR,0,0);
    draw();
  }
  function animate(ms) {
    frame=0;
    if(!spin || !visible || !canvas.isConnected)return;
    const dt=prev ? Math.min(65,ms-prev):16; prev=ms;
    if(!dragging){yaw += dt*.000095;draw();}
    frame=requestAnimationFrame(animate);
  }
  function setMotion(enabled) {
    spin=!!enabled;
    if(!spin){cancelAnimationFrame(frame);frame=0;prev=0;draw();}
    else if(!frame && visible) {prev=0;frame=requestAnimationFrame(animate);}
  }
  function setView(next) {
    mode=next;controls.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modelView===next)));
    draw();
  }
  controls.forEach(b=>b.addEventListener('click',()=>setView(b.dataset.modelView)));
  canvas.addEventListener('pointerdown',event=>{
    dragging=true;lastPointer=event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const dx=event.clientX-lastPointer;lastPointer=event.clientX;
    yaw+=dx*.0075;draw();
  });
  const stop=()=>{dragging=false;};
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home'){yaw=-.62;altitude=.39;}
    if(event.key==='ArrowLeft')yaw-=.12;
    if(event.key==='ArrowRight')yaw+=.12;
    if(event.key==='ArrowUp')altitude=clamp(altitude+.06,.16,1.05);
    if(event.key==='ArrowDown')altitude=clamp(altitude-.06,.16,1.05);
    draw();
  });
  if('ResizeObserver' in window){new ResizeObserver(resize).observe(canvas);}else window.addEventListener('resize',resize,{passive:true});
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(!visible){cancelAnimationFrame(frame);frame=0;}else if(spin&&!frame){prev=0;frame=requestAnimationFrame(animate);}}).observe(canvas);}
  resize();
  return { setMotion };
}
