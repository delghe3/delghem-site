/**
 * DÈLGHEM D2 native design-study showcase: generated from real native model,
 * section catalog, material catalog, model validator and foundation system.
 * Writes ONLY into the website repository, NEVER modifies the D2 application.
 * Geometry/soil/sections are conceptual test inputs, NOT verified engineering.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const d2=process.env.DELGHEM_D2_REPO??resolve(homedir(),'Desktop/D2/Progetto');
const moduleAt=async part=>import(pathToFileURL(resolve(d2,part)).href);
const [{validateEditableModel},{configureSoilLayers,upsertFoundationElement},{materialFromLibrary},{PROFILES}]=await Promise.all([
  moduleAt('src/core/model.mjs'),
  moduleAt('src/core/d2-foundation-system.mjs'),
  moduleAt('src/core/material-library.mjs'),
  moduleAt('src/core/catalog.mjs')
]);
const original=readFileSync(resolve(d2,'examples/01_Telaio_spaziale_3_piani.hfm.json'));
const template=JSON.parse(original);
if(template.schema!=='hyperfem-1')throw Error('Unsupported original D2 fixture');
const sha=data=>createHash('sha256').update(data).digest('hex');
const round=x=>Number(x.toFixed(5));
const shapeData=new Map(),partKind=new Map(),baseSupports=new Map();
const baseMaterials=[
  {id:'M_STEEL',...materialFromLibrary('OPEN_S355',{thickness:20})},
  {id:'M_RC',...materialFromLibrary('C30_37')},
  {id:'M_WOOD',...materialFromLibrary('GL_GL24h')}
];
const sections=[];
const addRect=(id,name,b,h,material)=>{
  const a=Math.max(b,h),c=Math.min(b,h);
  const section={id,name,A:b*h,Iy:b*h*h*h/12,Iz:h*b*b*b/12,J:a*c**3*(1/3-0.21*c/a*(1-c**4/(12*a**4)))};
  sections.push(section);shapeData.set(id,{shape:'rect',b,h,material});return id;
};
const addSteel=(id,name)=>{
  const p=PROFILES.find(x=>x.alias===name);
  if(!p)throw Error('D2 standard profile not found: '+name);
  sections.push({id,name:p.alias,A:p.A,Iy:p.Iy,Iz:p.Iz,J:p.J});
  shapeData.set(id,{shape:'i',b:p.b,h:p.h,tw:p.tw,tf:p.tf,material:'steel'});
  return id;
};
const S={
  rc55:addRect('S_RC55','C.A. 550×550 mm',.55,.55,'rc'),
  rc45:addRect('S_RC45','C.A. 450×450 mm',.45,.45,'rc'),
  rcBeam:addRect('S_RCB','C.A. 300×550 mm',.30,.55,'rc'),
  tie:addRect('S_TIE','C.A. cordolo 300×450 mm',.30,.45,'rc'),
  steelCol:addSteel('S_HEB300','HEB300'),
  steelUpper:addSteel('S_HEB260','HEB260'),
  beamMain:addSteel('S_IPE400','IPE400'),
  beamUpper:addSteel('S_IPE330','IPE330'),
  beamSecondary:addSteel('S_IPE240','IPE240'),
  steelChord:addSteel('S_HEA180','HEA180'),
  steelWeb:addSteel('S_HEA140','HEA140'),
  purlin:addSteel('S_IPE200','IPE200'),
  woodPost:addRect('S_GPOST','GL24h 280×420 mm',.28,.42,'wood'),
  woodChord:addRect('S_GCHORD','GL24h 180×320 mm',.18,.32,'wood'),
  woodBottom:addRect('S_GBOTTOM','GL24h 180×280 mm',.18,.28,'wood'),
  woodWeb:addRect('S_GWEB','GL24h 140×180 mm',.14,.18,'wood'),
  woodPurlin:addRect('S_GPURLIN','GL24h 120×200 mm',.12,.20,'wood')
};

S.rc70=addRect('S_RC70','C.A. 700×700 mm',.70,.70,'rc');
S.rc60=addRect('S_RC60','C.A. 600×600 mm',.60,.60,'rc');
S.rcBeamHigh=addRect('S_RCB45','C.A. 300×450 mm',.30,.45,'rc');
S.steelLower=addSteel('S_HEB400','HEB400');
S.steelMid=addSteel('S_HEB340','HEB340');
S.steelRoofPost=addSteel('S_HEA200','HEA200');
S.beamLower=addSteel('S_IPE450','IPE450');
S.beamTop=addSteel('S_IPE360','IPE360');
const model={schema:template.schema,title:'DÈLGHEM D2 | Torre asimmetrica otto piani S355 + CA C30/37 + GL24h, 3 coperture e plinti',units:template.units,
  materials:baseMaterials,sections,nodes:[],members:[],shells:[],laminates:[],loadCases:[{id:'G',name:'Scenario dimostrativo senza carichi imposti',loads:[],memberLoads:[],shellLoads:[]}],combinations:[]};
const nodeIds=new Map(),pairs=new Set();
const fixed=[true,true,true,true,true,true];
const free=[false,false,false,false,false,false];
function node(x,y,z){
 const key=[x,y,z].map(v=>round(v)).join('|');
 if(!nodeIds.has(key)){
  const id='N'+(model.nodes.length+1);
  model.nodes.push({id,x:round(x),y:round(y),z:round(z),fixed:z===0?[...fixed]:[...free]});
  nodeIds.set(key,id);
 }
 return nodeIds.get(key);
}
function orient(a,b){
 const dx=Math.abs(b[0]-a[0]),dy=Math.abs(b[1]-a[1]),dz=Math.abs(b[2]-a[2]);
 if(dz>=dx&&dz>=dy)return [1,0,0];
 if(dx>=dy)return [0,1,0];
 return [1,0,0];
}
function add(a,b,section,material,kind,barType='beam'){
 const from=node(...a),to=node(...b);
 if(from===to)throw Error('Zero-length member '+kind);
 const key=[from,to].sort().join('~');
 if(pairs.has(key))return;
 pairs.add(key);
 const id='B'+(model.members.length+1);
 const member={id,n1:from,n2:to,material,section,type:barType};
 if(barType==='beam')member.orientation=orient(a,b);
 model.members.push(member);partKind.set(id,kind);
}
// Native D2 expressly disallows isotropic wooden shells. Give GL24h
// panel skins a real orthotropic one-ply laminate record, as required by
// validateShells(). Stiffness/density assumptions are demonstrative inputs.
const woodLaminateByThickness=new Map();
function woodLaminate(thickness){
 const key=round(thickness);
 if(woodLaminateByThickness.has(key))return woodLaminateByThickness.get(key);
 const id='LAM_GL24_'+Math.round(key*1000);
 model.laminates.push({
  id,name:'GL24h orthotropic single-ply concept panel '+Math.round(key*1000)+' mm',
  layers:[{thicknessM:key,angleDeg:0,ExMPa:11000,EyMPa:370,EzMPa:370,
   nuxy:.02,nuyz:.2,nuzx:.02,GxyMPa:650,GyzMPa:65,GzxMPa:650,
   densityKgM3:420}]
 });
 woodLaminateByThickness.set(key,id);return id;
}
function shell(coords,material,thickness,kind){
 const id='F'+(model.shells.length+1);
 const panel={id,nodes:coords.map(p=>node(...p)),material,thickness};
 if(material==='M_WOOD')panel.laminate=woodLaminate(thickness);
 model.shells.push(panel);
 partKind.set(id,kind);
}
function column(x,y,z1,z2,material,section,kind){
 add([x,y,z1],[x,y,z2],section,material,kind);
 if(z1===0)baseSupports.set(node(x,y,0),{material,x,y});
}
// Main tower: exactly EIGHT occupied storeys above foundation level 0.
// Steel S355 facade columns taper HE B400 -> HE B340 -> HE B260.
// Central C30/37 reinforced-concrete core stays continuous for all 8 floors.
const STOREY_Z=[0,4.2,7.9,11.55,15.2,18.85,22.5,26.15,29.8];
const ROWS=[0,6,12],COLS=[0,6,12,18];
const FLOOR_COUNT=8;
const FLOOR_TOP=STOREY_Z[FLOOR_COUNT];
const roofHeights=new Set();
function rcCore(x,y){
 return (x===6&&y===6)||(x===12&&y===6)||(x===6&&y===12);
}
function towerColumnSection(storey,rc){
 return rc?(storey<=3?S.rc70:storey<=6?S.rc60:S.rc45):
   (storey<=3?S.steelLower:storey<=6?S.steelMid:S.steelUpper);
}
function beamSection(storey){
 return storey<=3?S.beamLower:storey<=6?S.beamMain:S.beamTop;
}
function floorBeams(z,count,material='M_STEEL',secondary=S.beamSecondary){
 for(let i=0;i<count;i++)for(const y of ROWS){
  const rc=(COLS[i]===6&&COLS[i+1]===12&&y===6&&material==='M_STEEL');
  add([COLS[i],y,z],[COLS[i+1],y,z],rc?(z>22?S.rcBeamHigh:S.rcBeam):beamSection(STOREY_Z.indexOf(z)),
    rc?'M_RC':material,rc?'rc-beam':'main-beam');
 }
 for(let i=0;i<=count;i++)for(let j=0;j<2;j++){
  add([COLS[i],ROWS[j],z],[COLS[i],ROWS[j+1],z],secondary,material,'secondary-beam');
 }
}
function mainSlab(z,storey,count){
 for(let i=0;i<count;i++)for(let j=0;j<2;j++){
  // Deliberate mechanical shaft/atrium opening at level 6–7: omitted
  // slabs are real model voids, never faked by transparent texture.
  if(storey>=6&&storey<=7&&i===1&&j===1)continue;
  shell([[COLS[i],ROWS[j],z],[COLS[i+1],ROWS[j],z],
   [COLS[i+1],ROWS[j+1],z],[COLS[i],ROWS[j+1],z]],
   'M_RC',storey===8?.20:.18,
   storey===8?'rc-roof':'rc-floor');
 }
}
for(const x of COLS)for(const y of ROWS){
 const rc=rcCore(x,y);
 const topStorey=x===18?5:8; // East setback after level five; north/west tower rises to 8.
 for(let n=1;n<=topStorey;n++)
  column(x,y,STOREY_Z[n-1],STOREY_Z[n],rc?'M_RC':'M_STEEL',
   towerColumnSection(n,rc),rc?'rc-column':'steel-column');
}
for(let n=1;n<=FLOOR_COUNT;n++){
 const z=STOREY_Z[n],count=n<=5?3:2;
 floorBeams(z,count);
 mainSlab(z,n,count);
}
// The core has two orthogonal C.A. shear-wall planes for all 8 storeys.
for(let n=1;n<=FLOOR_COUNT;n++){
 const a=STOREY_Z[n-1],b=STOREY_Z[n];
 shell([[6,6,a],[6,12,a],[6,12,b],[6,6,b]],'M_RC',n<=4?.30:.25,'rc-wall');
 shell([[6,6,a],[12,6,a],[12,6,b],[6,6,b]],'M_RC',n<=4?.30:.25,'rc-wall');
}
// West-side exposed balconies with physically native cantilever steel beams.
for(const n of [2,4,6]){
 const z=STOREY_Z[n],tip=-2.6;
 for(const y of ROWS)add([0,y,z],[tip,y,z],S.beamMain,'M_STEEL','cantilever');
 for(let j=0;j<2;j++){
  add([tip,ROWS[j],z],[tip,ROWS[j+1],z],S.beamSecondary,'M_STEEL','cantilever');
  shell([[tip,ROWS[j],z],[0,ROWS[j],z],[0,ROWS[j+1],z],[tip,ROWS[j+1],z]],
   'M_RC',.16,'rc-balcony');
 }
}
// At level seven a shallow northern sky terrace projects out from the core.
{
 const z=STOREY_Z[7],y=14.2;
 for(const x of [0,6,12])add([x,12,z],[x,y,z],S.beamTop,'M_STEEL','cantilever');
 for(const x of [0,6])shell([[x,12,z],[x+6,12,z],[x+6,y,z],[x,y,z]],'M_RC',.16,'rc-balcony');
 add([0,y,z],[6,y,z],S.beamSecondary,'M_STEEL','cantilever');
 add([6,y,z],[12,y,z],S.beamSecondary,'M_STEEL','cantilever');
}
// East annex at three storeys: double-height steel gallery and full pitched
// roof. Physical steel framing is connected at x=18 to tower level three.
const ANNEX_X=[18,24,30],ANNEX_Y=[0,6,12];
for(const x of [24,30])for(const y of ANNEX_Y)for(let n=1;n<=3;n++){
 column(x,y,STOREY_Z[n-1],STOREY_Z[n],'M_STEEL',
  n<=2?S.steelLower:S.steelMid,'steel-column');
}
for(let n=1;n<=3;n++){
 const z=STOREY_Z[n];
 for(let i=0;i<2;i++)for(const y of ANNEX_Y)
  add([ANNEX_X[i],y,z],[ANNEX_X[i+1],y,z],
   n<3?S.beamMain:S.beamUpper,'M_STEEL','main-beam');
 for(const x of ANNEX_X)for(let j=0;j<2;j++)
  add([x,ANNEX_Y[j],z],[x,ANNEX_Y[j+1],z],S.beamSecondary,'M_STEEL','secondary-beam');
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)
  shell([[ANNEX_X[i],ANNEX_Y[j],z],[ANNEX_X[i+1],ANNEX_Y[j],z],
   [ANNEX_X[i+1],ANNEX_Y[j+1],z],[ANNEX_X[i],ANNEX_Y[j+1],z]],
  'M_RC',.16,n===3?'rc-roof':'rc-floor');
}
// East steel gable: three real Pratt roof truss planes in model, purlins,
// real shell roof cladding and a high roof ridge.
const SX=[18,24,30],SY=[0,3,6,9,12],SEAVE=STOREY_Z[3],
 SZ=[SEAVE,SEAVE+1.5,SEAVE+2.9,SEAVE+1.5,SEAVE];
roofHeights.add(SEAVE);roofHeights.add(SEAVE+2.9);
for(const x of SX){
 for(let j=0;j<4;j++){
  add([x,SY[j],SEAVE],[x,SY[j+1],SEAVE],S.steelChord,'M_STEEL','steel-truss','truss');
  add([x,SY[j],SZ[j]],[x,SY[j+1],SZ[j+1]],S.steelChord,'M_STEEL','steel-truss','truss');
 }
 for(let j=1;j<4;j++)add([x,SY[j],SEAVE],[x,SY[j],SZ[j]],S.steelWeb,'M_STEEL','steel-truss','truss');
 for(const [bottom,top] of [[0,1],[1,2],[4,3],[3,2]])
  add([x,SY[bottom],SEAVE],[x,SY[top],SZ[top]],S.steelWeb,'M_STEEL','steel-truss','truss');
}
for(let i=0;i<2;i++)for(let j=0;j<5;j++)
 add([SX[i],SY[j],SZ[j]],[SX[i+1],SY[j],SZ[j]],S.purlin,'M_STEEL','steel-purlin');
for(let i=0;i<2;i++)for(let j=0;j<4;j++)
 shell([[SX[i],SY[j],SZ[j]],[SX[i+1],SY[j],SZ[j]],
  [SX[i+1],SY[j+1],SZ[j+1]],[SX[i],SY[j+1],SZ[j+1]]],
  'M_STEEL',.027,'steel-roof');
// North wing with light GL24h post-and-beam structure on genuine native
// wood shell decks; visually distinct from steel east wing and RC core.
const WX=[0,6,12],WY=[12,18,24];
for(const x of WX)for(const y of [18,24])for(let n=1;n<=3;n++)
 column(x,y,STOREY_Z[n-1],STOREY_Z[n],'M_WOOD',S.woodPost,'wood-post');
for(let n=1;n<=3;n++){
 const z=STOREY_Z[n];
 for(const x of WX)for(let j=0;j<2;j++)
  add([x,WY[j],z],[x,WY[j+1],z],S.woodBottom,'M_WOOD','wood-beam');
 for(let i=0;i<2;i++)for(const y of WY)
  add([WX[i],y,z],[WX[i+1],y,z],S.woodChord,'M_WOOD','wood-beam');
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)
  shell([[WX[i],WY[j],z],[WX[i+1],WY[j],z],
   [WX[i+1],WY[j+1],z],[WX[i],WY[j+1],z]],
   'M_WOOD',.14,n===3?'wood-roof':'wood-deck');
}
// Three glulam gable trusses and four roof panels at 3rd-floor elevation.
const NORTH_TOP=[STOREY_Z[3],STOREY_Z[3]+1.55,STOREY_Z[3]+3.0,STOREY_Z[3]+1.55,STOREY_Z[3]];
const GY=[12,15,18,21,24],N_EAVE=STOREY_Z[3];
roofHeights.add(N_EAVE+3);
for(const x of WX){
 for(let j=0;j<4;j++){
  add([x,GY[j],N_EAVE],[x,GY[j+1],N_EAVE],S.woodBottom,'M_WOOD','wood-truss','truss');
  add([x,GY[j],NORTH_TOP[j]],[x,GY[j+1],NORTH_TOP[j+1]],S.woodChord,'M_WOOD','wood-truss','truss');
 }
 for(let j=1;j<4;j++)add([x,GY[j],N_EAVE],[x,GY[j],NORTH_TOP[j]],S.woodWeb,'M_WOOD','wood-truss','truss');
 for(const [bottom,top] of [[0,1],[1,2],[4,3],[3,2]])
  add([x,GY[bottom],N_EAVE],[x,GY[top],NORTH_TOP[top]],S.woodWeb,'M_WOOD','wood-truss','truss');
}
for(let i=0;i<2;i++)for(let j=0;j<5;j++)
 add([WX[i],GY[j],NORTH_TOP[j]],[WX[i+1],GY[j],NORTH_TOP[j]],S.woodPurlin,'M_WOOD','wood-purlin');
for(let i=0;i<2;i++)for(let j=0;j<4;j++)
 shell([[WX[i],GY[j],NORTH_TOP[j]],[WX[i+1],GY[j],NORTH_TOP[j]],
  [WX[i+1],GY[j+1],NORTH_TOP[j+1]],[WX[i],GY[j+1],NORTH_TOP[j+1]]],
  'M_WOOD',.115,'wood-roof');
// Rooftop glulam landmark above the EIGHTH storey: separate, higher,
// pitched roof over the central tower, visible above its setbacks.
{
 const PX=[0,6,12],PY=[0,3,6,9,12],z=FLOOR_TOP;
 const PZ=[z,z+1.7,z+3.35,z+1.7,z];
 roofHeights.add(z);roofHeights.add(z+3.35);
 for(const x of PX){
  for(let j=0;j<4;j++){
   add([x,PY[j],z],[x,PY[j+1],z],S.woodBottom,'M_WOOD','wood-truss','truss');
   add([x,PY[j],PZ[j]],[x,PY[j+1],PZ[j+1]],S.woodChord,'M_WOOD','wood-truss','truss');
  }
  for(let j=1;j<4;j++)add([x,PY[j],z],[x,PY[j],PZ[j]],S.woodWeb,'M_WOOD','wood-truss','truss');
  for(const [bottom,top] of [[0,1],[1,2],[4,3],[3,2]])
   add([x,PY[bottom],z],[x,PY[top],PZ[top]],S.woodWeb,'M_WOOD','wood-truss','truss');
 }
 for(let i=0;i<2;i++)for(let j=0;j<5;j++)
  add([PX[i],PY[j],PZ[j]],[PX[i+1],PY[j],PZ[j]],S.woodPurlin,'M_WOOD','wood-purlin');
 for(let i=0;i<2;i++)for(let j=0;j<4;j++){
  if(i===1&&j===2)continue; // recessed skylight reveals actual truss interior
  shell([[PX[i],PY[j],PZ[j]],[PX[i+1],PY[j],PZ[j]],
   [PX[i+1],PY[j+1],PZ[j+1]],[PX[i],PY[j+1],PZ[j+1]]],
   'M_WOOD',.105,'wood-roof');
 }
}
// Exposed west and east structural tie-bays carry selected genuine truss
// braces. Keep facade visually clear: only four steel X pairs overall.
const braces=[
 [[0,0,0],[6,0,STOREY_Z[1]]],[[6,0,0],[0,0,STOREY_Z[1]]],
 [[24,0,0],[30,0,STOREY_Z[1]]],[[30,0,0],[24,0,STOREY_Z[1]]],
 [[0,0,STOREY_Z[5]],[6,0,STOREY_Z[6]]],
 [[6,0,STOREY_Z[5]],[0,0,STOREY_Z[6]]],
 [[24,12,STOREY_Z[1]],[30,12,STOREY_Z[2]]],
 [[30,12,STOREY_Z[1]],[24,12,STOREY_Z[2]]]
];
for(const [a,b] of braces)add(a,b,S.steelWeb,'M_STEEL','brace','truss');
// Partial steel roof pergola above level-five setback terrace.
{
 const z=STOREY_Z[5],canopy=z+2.5;
 roofHeights.add(canopy);
 for(const x of [12,18])for(const y of [0,12])
  add([x,y,z],[x,y,canopy],S.steelRoofPost,'M_STEEL','steel-column');
 for(const y of [0,12])
  add([12,y,canopy],[18,y,canopy],S.beamTop,'M_STEEL','main-beam');
 for(const x of [12,18])
  add([x,0,canopy],[x,12,canopy],S.purlin,'M_STEEL','steel-purlin');
 for(const y of [4,8])
  add([12,y,canopy],[18,y,canopy],S.purlin,'M_STEEL','steel-purlin');
 shell([[12,0,canopy],[18,0,canopy],[18,12,canopy],[12,12,canopy]],
  'M_STEEL',.02,'steel-roof');
}
// Native concrete footing tie beams explicitly connect actual ground
// support nodes in the main building and both annexes.
for(const y of ROWS)for(let i=0;i<3;i++)
 add([COLS[i],y,0],[COLS[i+1],y,0],S.tie,'M_RC','foundation-tie');
for(const x of COLS)for(let j=0;j<2;j++)
 add([x,ROWS[j],0],[x,ROWS[j+1],0],S.tie,'M_RC','foundation-tie');
for(const y of ROWS)for(let i=0;i<2;i++)
 add([ANNEX_X[i],y,0],[ANNEX_X[i+1],y,0],S.tie,'M_RC','foundation-tie');
for(const x of ANNEX_X)for(let j=0;j<2;j++)
 add([x,ROWS[j],0],[x,ROWS[j+1],0],S.tie,'M_RC','foundation-tie');
for(const x of WX)for(let j=0;j<2;j++)
 add([x,WY[j],0],[x,WY[j+1],0],S.tie,'M_RC','foundation-tie');
for(const y of WY)for(let i=0;i<2;i++)
 add([WX[i],y,0],[WX[i+1],y,0],S.tie,'M_RC','foundation-tie');
validateEditableModel(model);
// Native D2 foundation engine: generates consistent soil springs and stores
// DIRECT individual footing geometry attached to real node IDs at grade.
const soil=[{type:'sand',zTopM:0,zBottomM:12,gammaKnM3:18,phiDeg:30,EsMPa:25,nu:.3,ksKnM3:18000}];
let finalModel=configureSoilLayers(model,soil);
for(const [id,support] of baseSupports){
 const material=support.material;
 const width=material==='M_RC'?2.6:material==='M_WOOD'?2.0:2.3;
 const length=material==='M_RC'?2.6:material==='M_WOOD'?2.2:2.4;
 finalModel=upsertFoundationElement(finalModel,{
  id:'FD_'+id,type:'direct',nodeId:id,widthM:width,lengthM:length,
  thicknessM:material==='M_RC'?.85:.75,depthM:material==='M_RC'?.85:.75,
  gammaR:1.4,mu:.48
 });
}
validateEditableModel(finalModel);
const nativeJSON=JSON.stringify(finalModel,null,2)+'\n';
const baseDir=resolve(root,'assets/real-d2');
mkdirSync(baseDir,{recursive:true});
writeFileSync(resolve(baseDir,'complex-demonstration.hfm.json'),nativeJSON);
const byNode=new Map(finalModel.nodes.map((n,i)=>[n.id,i]));
const bySection=new Map(finalModel.sections.map((s,i)=>[s.id,i]));
const exportSections=finalModel.sections.map(s=>({id:s.id,name:s.name,...shapeData.get(s.id)}));
const shells=finalModel.shells.map(s=>({id:s.id,nodes:s.nodes.map(id=>byNode.get(id)),kind:partKind.get(s.id),thickness:s.thickness,material:s.material}));
const members=finalModel.members.map(m=>({id:m.id,a:byNode.get(m.n1),b:byNode.get(m.n2),section:bySection.get(m.section),kind:partKind.get(m.id),orientation:m.orientation??null,type:m.type}));
const points=finalModel.nodes.map(n=>[n.x,n.y,n.z]);
const footings=finalModel.foundationSystem.items.filter(f=>f.type==='direct').map(f=>{
 const n=finalModel.nodes[byNode.get(f.nodeId)];
 return {id:f.id,nodeId:f.nodeId,nodeIndex:byNode.get(f.nodeId),x:n.x,y:n.y,z:n.z-f.depthM+f.thicknessM/2,widthM:f.widthM,lengthM:f.lengthM,thicknessM:f.thicknessM,depthM:f.depthM,kind:'rc-footing'};
});
const all=points.concat(footings.flatMap(f=>[[f.x-f.widthM/2,f.y-f.lengthM/2,f.z-f.thicknessM/2],[f.x+f.widthM/2,f.y+f.lengthM/2,f.z+f.thicknessM/2]]));
const bbox={min:[0,1,2].map(i=>Math.min(...all.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...all.map(p=>p[i])))};
const demo={
 source:{
  base:'DÈLGHEM D2 real schema, structural examples and native catalogs',
  baseSha256:sha(original),
  derivedModelSha256:sha(nativeJSON),
  projectFile:'complex-demonstration.hfm.json',
  basis:'Verified by actual DÈLGHEM D2 validateEditableModel() and native foundationSystem upsertFoundationElement()',
  provenance:'New concept structure modeled as native DÈLGHEM beam/truss/shell/direct-footing records, not a fabricated image',
  methodology:'Demonstrative geometry, sections and soil assumptions; no load combination, stability or design verification'
 },
 status:'native_d2_editable_concept_unverified',
 nodes:points,members,shells,footings,sections:exportSections,
 gridX:[-2.6,0,6,12,18,24,30],
 gridY:[0,3,6,9,12,15,18,21,24],
 storeyCount:FLOOR_COUNT,
 levels:STOREY_Z,
 roofLevels:[...roofHeights].sort((a,b)=>a-b),
 bbox,materials:['S355','C30/37','GL24h'],
 qualifications:{solved:false,designed:false,executive:false}
};
writeFileSync(resolve(baseDir,'complex-demo-geometry.mjs'),
 '// Exported from validated native DÈLGHEM D2 structural model; no computed results.\nexport const complexDemo='+JSON.stringify(demo)+';\n');
writeFileSync(resolve(baseDir,'COMPLEX_DEMO_PROVENANCE.txt'),[
 'DÈLGHEM D2 — MODELLO NATIVO DIMOSTRATIVO DI STRUTTURA ASIMMETRICA',
 'Sorgente: '+demo.source.projectFile+' (schema hyperfem-1, file apribile in DÈLGHEM D2).',
 'Validazioni reali: D2 validateEditableModel() e d2-foundation-system upsertFoundationElement().',
 'Cataloghi reali D2: S355 OPEN; C30/37; legno lamellare GL24h; profili IPE, HEA, HEB.',
 'Geometria: torre principale di OTTO piani fuori terra (h=29.80 m), struttura mista con nucleo in C.A. e colonne in acciaio rastremate;',
 'corpo laterale est con copertura a capriate S355; ala nord e copertura sommitale in GL24h; pergolato metallico alla quota 21.35 m; balconi aggettanti su 3 livelli; fondazioni DIRECT.',
 'Dimensioni plinti e suolo SONO IPOTESI DIMOSTRATIVE: non derivano da indagini né dimensionamenti.',
 'Stratigrafia: sabbia assunta per sola validazione del tipo FOUNDATION DIRECT; gamma 18, phi 30, Es 25 MPa, ks 18000 kN/m³.',
 'La fonte degli elementi 3D è esclusivamente il file nativo .hfm.json validato, inclusi i plinti.',
 'I pannelli lignei hanno laminati espliciti MONOSTRATO ortotropi GL24h (Ex 11000 MPa, Ey/Ez 370 MPa, Gxy/Gzx 650 MPa, Gyz 65 MPa, densita 420 kg/m3): valori ipotetici ai soli fini della validazione del formato nativo D2, NON progetto strutturale.',
 'L edificio ha otto impalcati fuori terra a z 4.2, 7.9, 11.55, 15.2, 18.85, 22.5, 26.15 e 29.8 m, con colmo ligneo sommitale a quota 33.15 m.',
 'Il modello include una facciata con pochi controventi e terrazzi: nessuna verifica di stabilita laterale o duttilita eseguita.',
 'La vista web mostra estrusioni con dimensioni di catalogo effettive e pannelli alleggeriti visivamente. Deformata/sollecitazioni sono illustrative, NON risultati D2 calcolati.',
 'L anteprima WebP nasce da un immagine Canvas del modello nativo D2, senza immagini generative: cattura cromatica del browser e composizione sopra un fondo neutro.',

 'NON sono state eseguite analisi, verifiche geotecniche, dimensionamenti, controlli sismici o progetto esecutivo.',
 'Originale esempio D2 SHA256 '+demo.source.baseSha256,
 'Nuovo file nativo SHA256 '+demo.source.derivedModelSha256
 ].join('\n')+'\n');
console.log('D2 native validation successful',{storeys:FLOOR_COUNT,nodes:points.length,members:members.length,shells:shells.length,footings:footings.length,
 steelTruss:members.filter(m=>m.kind==='steel-truss').length,woodTruss:members.filter(m=>m.kind==='wood-truss').length,
 cantilevers:members.filter(m=>m.kind==='cantilever').length,bbox,hash:demo.source.derivedModelSha256});
