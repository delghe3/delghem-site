/**
 * DÈLGHEM D2 portal renderer.
 * Uses the actual four native D2 nodes, three members and catalogue I-profiles.
 * The diagonal viscous cylinder is a conceptual equivalent-SDOF overlay,
 * NOT a fourth native D2 member or verified geometric device connection.
 */
const TOL=1e-7;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const close=(a,b)=>Math.abs(a-b)<TOL;
const add=(a,b,k=1)=>a.map((x,i)=>x+k*b[i]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const length=a=>Math.hypot(...a);
const unit=a=>a.map(x=>x/(length(a)||1));
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const check=(ok,why)=>{if(!ok)throw Error('DÈLGHEM D2 native steel geometry: '+why);};
const solid=(member,part,bounds,widthM,thicknessM)=>({
 id:member.id+':'+part,sourceMemberId:member.id,part,
 profile:member.profile,sectionId:member.section,widthM,thicknessM,bounds
});
export function buildNativePortalScene(native,geometry){
 check(native?.schema==='hyperfem-1','invalid source schema');
 check(native.nodes?.length===4&&native.members?.length===3,'source must have 4 nodes and 3 members');
 check(native.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.z)&&n.y===0),'source is only an XZ planar frame');
 check(native.sections?.length===2,'unexpected D2 cross-sections');
 check(geometry?.sectionShapes&&geometry.nodes?.length===4&&geometry.beams?.length===3,'missing D2 geometry and catalogue dimensions');
 const nodes=native.nodes.map(n=>({...n,fixed:[...n.fixed]})),nodeMap=new Map(nodes.map(n=>[n.id,n]));
 const sections=new Map(native.sections.map(s=>[s.id,s]));
 const solids=[],columns=[],beams=[];
 for(const nativeMember of native.members){
  const a=nodeMap.get(nativeMember.n1),b=nodeMap.get(nativeMember.n2);
  const profile=sections.get(nativeMember.section),dims=geometry.sectionShapes[nativeMember.section];
  check(a&&b&&profile&&dims,'unknown member/node/section: '+nativeMember.id);
  check(dims.source==='D2/src/core/catalog.mjs','cross-sections must be native catalogue values');
  const {h,tf,tw}=dims,width=dims.b;
  check([h,tf,tw,width].every(Number.isFinite)&&h>2*tf&&width>tw&&tw>0&&tf>0,'invalid I-section thicknesses');
  check(nativeMember.type==='beam'&&nativeMember.material==='M_STEEL','member must be native steel frame beam');
  const member={
   id:nativeMember.id,profile:profile.name,section:nativeMember.section,
   start:[a.x,a.y,a.z],end:[b.x,b.y,b.z],material:nativeMember.material
  };
  if(close(a.x,b.x)&&b.z>a.z){
   check(profile.name==='HEB260','column must use real HEB260');
   columns.push(member);
   const x=a.x,z0=a.z,z1=b.z;
   solids.push(solid(member,'flange-near',[x-h/2,x-h/2+tf,-width/2,width/2,z0,z1],width,tf));
   solids.push(solid(member,'flange-far',[x+h/2-tf,x+h/2,-width/2,width/2,z0,z1],width,tf));
   solids.push(solid(member,'web',[x-h/2+tf,x+h/2-tf,-tw/2,tw/2,z0,z1],h-2*tf,tw));
  }else if(close(a.z,b.z)&&b.x>a.x){
   check(profile.name==='IPE330','roof beam must use real IPE330');
   beams.push(member);
   const z=a.z,x0=a.x,x1=b.x;
   solids.push(solid(member,'flange-near',[x0,x1,-width/2,width/2,z-h/2,z-h/2+tf],width,tf));
   solids.push(solid(member,'flange-far',[x0,x1,-width/2,width/2,z+h/2-tf,z+h/2],width,tf));
   solids.push(solid(member,'web',[x0,x1,-tw/2,tw/2,z-h/2+tf,z+h/2-tf],h-2*tf,tw));
  }else{
   throw Error('Native D2 portal has an unexpected non-vertical/non-horizontal member');
  }
  const published=geometry.beams.find(e=>e.id===nativeMember.id);
  check(published?.a===nativeMember.n1&&published?.b===nativeMember.n2,'numerical input and native steel member connectivity differ');
 }
 check(columns.length===2&&beams.length===1,'not a genuine two-column, one-beam D2 portal');
 const boundaryRestraints=nodes.filter(n=>n.fixed?.length===6&&n.fixed.every(Boolean));
 check(boundaryRestraints.length===2&&boundaryRestraints.every(n=>n.z===0),'two fixed base nodes required');
 for(const n of nodes){
  const other=geometry.nodes.find(e=>e.id===n.id);
  check(other&&close(other.x,n.x)&&close(other.z,n.z),'native D2 and dynamic node positions disagree: '+n.id);
 }
 check(nodeMap.has(geometry.damper.from)&&nodeMap.has(geometry.damper.to),'D2 source lacks conceptual damper endpoints');
 return {
  nodeIds:nodes.map(n=>n.id),memberIds:native.members.map(m=>m.id),nodes,
  sourceNodeCount:nodes.length,sourceMemberCount:native.members.length,
  columns,beams,solids,boundaryRestraints,fictitiousExtrusionMembers:0,
  damperAnchors:[geometry.damper.from,geometry.damper.to],
  numericalDimension:'2D / equivalent-SDOF',plane:'XZ',
  bayWidthM:geometry.bayWidthM,heightM:geometry.heightM
 };
}
const corners=([a,b,c,d,e,f])=>[
 [a,c,e],[b,c,e],[b,d,e],[a,d,e],
 [a,c,f],[b,c,f],[b,d,f],[a,d,f]
];
const BOX_FACES=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
export function projectPortalScene(scene,{
 width=800,height=430,yaw=-.53,pitch=.47,driftMM=0,exaggeration=12,withDamper=true
}={}){
 check(scene?.sourceMemberCount===3,'scene not built from D2 three-member model');
 check([width,height,yaw,pitch,driftMM,exaggeration].every(Number.isFinite)&&width>10&&height>10,'invalid viewport or time');
 const driftM=driftMM/1000*exaggeration;
 const moved=p=>[p[0]+driftM*clamp(p[2]/scene.heightM,0,1),p[1],p[2]];
 const nodePositions=Object.fromEntries(scene.nodes.map(n=>[n.id,moved([n.x,n.y,n.z])]));
 const east=[Math.cos(yaw),-Math.sin(yaw),0];
 const up=[-Math.sin(yaw)*Math.sin(pitch),-Math.cos(yaw)*Math.sin(pitch),Math.cos(pitch)];
 const towards=[Math.sin(yaw)*Math.cos(pitch),Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch)];
 const rotate=p=>({x:dot(p,east),y:dot(p,up),depth:dot(p,towards)});
 const xs=[],ys=[];
 for(const n of scene.nodes){
  for(const extra of [-1.25,0,1.25]){
   const p=rotate([n.x+(n.z>0?extra:0),n.y,n.z]);
   xs.push(p.x);ys.push(p.y);
  }
 }
 for(const point of [[-1,-1,0],[7,1,0]]){
  const a=rotate(point);xs.push(a.x);ys.push(a.y);
 }
 const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
 const scale=Math.min(width*.78/Math.max(1,hiX-loX),height*.73/Math.max(1,hiY-loY));
 const midX=(loX+hiX)/2,midY=(loY+hiY)/2;
 const project=p=>{
  const q=rotate(p);
  return {x:width*.5+(q.x-midX)*scale,y:height*.50-(q.y-midY)*scale,depth:q.depth};
 };
 const structuralFaces=[];
 for(const b of scene.solids){
  const v=corners(b.bounds).map(moved);
  for(const indices of BOX_FACES){
   const world=indices.map(i=>v[i]),points=world.map(project);
   const normal=unit(cross(sub(world[1],world[0]),sub(world[2],world[0])));
   structuralFaces.push({
    sourceMemberId:b.sourceMemberId,part:b.part,world,points,normal,
    depth:points.reduce((sum,p)=>sum+p.depth,0)/points.length
   });
  }
 }
 structuralFaces.sort((a,b)=>a.depth-b.depth);
 const damper=withDamper?(()=>{
  const start=nodePositions[scene.damperAnchors[0]],end=nodePositions[scene.damperAnchors[1]];
  const displacement=sub(end,start),lengthM=length(displacement),direction=unit(displacement);
  const bodyStart=add(start,direction,Math.min(lengthM*.5,3.65));
  const bodyEnd=add(bodyStart,direction,Math.min(lengthM*.19,1.16));
  return {connectedTo:[...scene.damperAnchors],start,end,bodyStart,bodyEnd,
   lengthM,direction,cylinderIsCoaxial:true,from:project(start),to:project(end)};
 })():null;
 return {
  viewport:{width,height,scale},project,nodePositions,
  projectedNodes:Object.fromEntries(Object.entries(nodePositions).map(([id,p])=>[id,project(p)])),
  portalMembers:[...scene.columns,...scene.beams],
  columnMemberCount:scene.columns.length,sourceMemberCount:scene.sourceMemberCount,
  structuralFaces,damper,deflectedRoofM:driftM
 };
}

const fillRgb=v=>'rgb('+v.map(x=>Math.round(x)).join(',')+')';
const mix=(a,b,t)=>a.map((x,i)=>x*(1-t)+b[i]*t);
const light=unit([-.34,-.62,.73]);
function drawFace(ctx,points,fill,stroke='#294652',edge=.7){
 ctx.beginPath();
 points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();
 ctx.strokeStyle=stroke;ctx.lineWidth=edge;ctx.stroke();
}
function line(ctx,a,b,color='#75a9b8',width=1){
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function caption(ctx,value,x,y,{size=10,color='#285d6b',weight=800,align='left'}={}){
 ctx.font=weight+' '+size+'px system-ui,-apple-system,sans-serif';
 ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y);
}
function cylinderGeometry(start,end,radius,n=12){
 const direction=unit(sub(end,start));
 const radialX=unit([-direction[2],0,direction[0]]),radialY=[0,1,0];
 const point=(center,t)=>add(add(center,radialX,Math.cos(t)*radius),radialY,Math.sin(t)*radius);
 const out=[];
 for(let i=0;i<n;i++){
  const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
  out.push({
   kind:'side',index:i,
   world:[point(start,a),point(start,b),point(end,b),point(end,a)]
  });
 }
 out.push({kind:'end',index:0,world:Array.from({length:n},(_,i)=>point(start,i*2*Math.PI/n))});
 out.push({kind:'end',index:n/2,world:Array.from({length:n},(_,i)=>point(end,i*2*Math.PI/n))});
 return out;
}
function paintCylinder(ctx,draw,a,b,radius,paint='rod'){
 const colors=paint==='housing'?
  {dark:[106,58,41],lit:[246,177,118],edge:'#84503b'}:
  paint==='collar'?
  {dark:[52,81,89],lit:[166,195,199],edge:'#455c69'}:
  {dark:[42,72,82],lit:[127,167,176],edge:'#365869'};
 const polys=cylinderGeometry(a,b,radius).map(part=>{
  const points=part.world.map(draw.project);
  return {...part,points,depth:points.reduce((s,p)=>s+p.depth,0)/points.length};
 });
 polys.sort((l,r)=>l.depth-r.depth);
 for(const poly of polys){
  const diffuse=poly.kind==='end'?.38:.42+.39*Math.cos(poly.index/12*Math.PI*2);
  const colour=fillRgb(mix(colors.dark,colors.lit,clamp(diffuse,.09,.94)));
  drawFace(ctx,poly.points,colour,colors.edge,.7);
 }
}
function nodeCircle(ctx,p,selected=false){
 const r=selected?4.7:3.8;
 ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
 ctx.fillStyle=selected?'#c7dfdf':'#174e64';ctx.fill();
 ctx.lineWidth=1.5;ctx.strokeStyle=selected?'#995e3f':'#65b3b8';ctx.stroke();
}
function sourceGrid(ctx,draw){
 // Exactly a DÈLGHEM CAD reference grid — not additional frame/slabs.
 const floorZ=-.08;
 for(let x=-2;x<=8;x+=.5){
  line(ctx,draw.project([x,-2,floorZ]),draw.project([x,2,floorZ]),
   Number.isInteger(x)?'#bed6cf':'#d7e6e0',Number.isInteger(x)?1:.5);
 }
 for(let y=-2;y<=2;y+=.5){
  line(ctx,draw.project([-2,y,floorZ]),draw.project([8,y,floorZ]),
   Number.isInteger(y)?'#bed6cf':'#d7e6e0',Number.isInteger(y)?1:.5);
 }
}
function steelShade(face){
 const intensity=clamp(.54+.43*dot(face.normal,light),.26,.94);
 const base=face.part==='web'?[39,91,106]:[86,151,170];
 return fillRgb(mix([14,48,65],base,intensity));
}

/**
 * Draw physical HEB/IPE solid sections from D2 on an engineering CAD-like
 * grid. Returns the exact node/member mapping used to render the scene.
 */
export function renderNativeSteelPortal(ctx,{
 width,height,scene,yaw=-.53,pitch=.47,driftMM=0,amplification=12,
 timeS=0,withDamper=true,showThickness=true,
 italian=true,format=(n,d)=>Number(n).toFixed(d??1)
}){
 const draw=projectPortalScene(scene,{
  width,height,yaw,pitch,driftMM,
  exaggeration:amplification,withDamper
 });
 const bg=ctx.createLinearGradient(0,0,width,height);
 bg.addColorStop(0,'#f8fcf8');bg.addColorStop(1,'#e8f3f0');
 ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 sourceGrid(ctx,draw);
 // Both drawing modes use exactly the THREE genuine D2 source members.
 // "Spessori ON" uses true catalogue flange/web dimensions; OFF shows
 // native member centre lines, as in the actual DÈLGHEM viewer.
 if(showThickness){
  for(const face of draw.structuralFaces){
   drawFace(ctx,face.points,steelShade(face),'#203f51',.6);
  }
 }else{
  const move=q=>[q[0]+draw.deflectedRoofM*clamp(q[2]/scene.heightM,0,1),q[1],q[2]];
  for(const member of draw.portalMembers){
   line(ctx,draw.project(move(member.start)),draw.project(move(member.end)),
    member.profile==='HEB260'?'#235f77':'#227d96',Math.max(2.4,draw.viewport.scale*.038));
  }
 }
 // True fixed node restraints; these hatch symbols are not fake pad footings.
 for(const node of scene.boundaryRestraints){
  const pt=draw.projectedNodes[node.id],size=clamp(draw.viewport.scale*.17,6,14);
  line(ctx,{x:pt.x-size,y:pt.y+6},{x:pt.x+size,y:pt.y+6},'#215e71',2);
  for(let s=-size+3;s<size;s+=5)
   line(ctx,{x:pt.x+s,y:pt.y+6},{x:pt.x+s-4,y:pt.y+10},'#7ca2a7',1);
 }
 if(withDamper&&draw.damper){
  const device=draw.damper;
  // Device is a separate physical-looking schematic overlay placed
  // coaxially between existing BL and TR nodes (never added to the D2 mesh).
  paintCylinder(ctx,draw,device.start,device.end,.019,'rod');
  paintCylinder(ctx,draw,device.bodyStart,device.bodyEnd,.092,'housing');
  const d=unit(sub(device.bodyEnd,device.bodyStart));
  paintCylinder(ctx,draw,add(device.bodyStart,d,-.055),device.bodyStart,.104,'collar');
  paintCylinder(ctx,draw,device.bodyEnd,add(device.bodyEnd,d,.055),.104,'collar');
  nodeCircle(ctx,device.from,true);nodeCircle(ctx,device.to,true);
  // A separate technical callout stays CLEAR of the physical cylinder,
  // not text painted on top of the piston or a fictional connection plate.
  if(width>410){
   const middle=add(device.bodyStart,sub(device.bodyEnd,device.bodyStart),.5);
   const mark=draw.project(middle);
   const label=italian?'VISCOSO · Ceq':'VISCOUS · Ceq';
   const font=clamp(width/70,9,11);
   ctx.font='890 '+font+'px system-ui,-apple-system,sans-serif';
   const tw=ctx.measureText(label).width;
   const labelX=clamp(mark.x+28,15,width-tw-15);
   const labelY=clamp(mark.y-39,72,height-42);
   ctx.fillStyle='rgba(255,251,245,.97)';
   ctx.strokeStyle='#d6a982';
   ctx.lineWidth=1;
   ctx.beginPath();
   ctx.roundRect(labelX-7,labelY-15,tw+14,23,5);
   ctx.fill();ctx.stroke();
   line(ctx,{x:labelX+3,y:labelY+8},mark,'#c18d69',.9);
   caption(ctx,label,labelX,labelY,{size:font,color:'#9d5130',weight:890});
  }
 }
 for(const node of scene.nodes)nodeCircle(ctx,draw.projectedNodes[node.id]);
 if(width>370){
  for(const node of scene.nodes){
   const p=draw.projectedNodes[node.id];
   caption(ctx,node.id,p.x+(node.x===0?-10:10),p.y-10,{
    size:clamp(width/72,8,10),weight:880,color:'#1c5265',
    align:node.x===0?'right':'left'
   });
  }
  const c=draw.project([0,0,scene.heightM*.53]);
  const b=draw.project([scene.bayWidthM*.5,0,scene.heightM]);
  caption(ctx,'HEB260',c.x-18,c.y-4,{size:clamp(width/75,8,10),color:'#286378'});
  caption(ctx,'IPE330',b.x,b.y-17,{size:clamp(width/75,8,10),color:'#286378',align:'center'});
 }
 const pad=clamp(width*.027,9,15);
 caption(ctx,'DÈLGHEM D2 · XZ',pad,21,{
  size:clamp(width/44,10,13),color:'#173f55',weight:940
 });
 caption(ctx,italian?'2 HEB260 + 1 IPE330 · sezioni I':'2 HEB260 + 1 IPE330 · I sections',
  pad,38,{size:clamp(width/73,8,10),color:'#517783',weight:770});
 caption(ctx,'u = '+format(driftMM,1)+' mm',width-pad,21,{
  size:clamp(width/62,9,12),color:'#22667a',weight:870,align:'right'
 });
 caption(ctx,'t = '+format(timeS,2)+' s',width-pad,38,{
  size:clamp(width/76,8,10),color:'#557b87',weight:780,align:'right'
 });
 caption(ctx,italian?'4 NODI · 3 ASTE NATIVE':'4 NODES · 3 NATIVE MEMBERS',
  pad,height-16,{size:clamp(width/80,8,10),color:'#3a6875',weight:880});
 caption(ctx,withDamper
   ?(italian?'DISPOSITIVO EQ. / NON FEM 3D':'EQUIV. DEVICE / NOT 3D FEM')
   :(italian?'SENZA VISCOSO':'NO VISCOUS DEVICE'),
  width-pad,height-16,{
   size:clamp(width/87,7,10),color:withDamper?'#a75c3c':'#3a7792',
   weight:880,align:'right'
  });
 // Right-handed Cartesian triad matches the XZ D2 portal plane.
 const origin={x:width*.12,y:height*.89},radius=clamp(draw.viewport.scale*.43,11,18);
 line(ctx,origin,{x:origin.x+radius,y:origin.y+radius*.15},'#ba6159',2);
 line(ctx,origin,{x:origin.x-radius*.3,y:origin.y-radius*.37},'#4da078',2);
 line(ctx,origin,{x:origin.x,y:origin.y-radius},'#307ca8',2);
 caption(ctx,'X',origin.x+radius+4,origin.y+radius*.15+4,{size:9,color:'#ba6159'});
 caption(ctx,'Y',origin.x-radius*.52,origin.y-radius*.45,{size:9,color:'#4da078'});
 caption(ctx,'Z',origin.x+4,origin.y-radius-3,{size:9,color:'#307ca8'});
 return draw;
}
