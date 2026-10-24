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
const model={schema:template.schema,title:'DELGHEM D2 | Studio dimostrativo asimmetrico: acciaio, CA, capriate GL24h, plinti',units:template.units,
  materials:baseMaterials,sections,nodes:[],members:[],shells:[],loadCases:[{id:'G',name:'Scenario dimostrativo senza carichi imposti',loads:[],memberLoads:[],shellLoads:[]}],combinations:[]};
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
function shell(coords,material,thickness,kind){
 const id='F'+(model.shells.length+1);
 model.shells.push({id,nodes:coords.map(p=>node(...p)),material,thickness});
 partKind.set(id,kind);
}
function column(x,y,z1,z2,material,section,kind){
 add([x,y,z1],[x,y,z2],section,material,kind);
 if(z1===0)baseSupports.set(node(x,y,0),{material,x,y});
}
const rows=[0,6,12],cols=[0,6,12,18];
// L-shaped concrete/steel podium. Third storey retires from east wing.
for(const x of cols)for(const y of rows){
 const rc=(x===6||x===12)&&(y===6||y===12),material=rc?'M_RC':'M_STEEL';
 column(x,y,0,3.8,material,rc?S.rc55:S.steelCol,rc?'rc-column':'steel-column');
 column(x,y,3.8,7.6,material,rc?S.rc55:S.steelCol,rc?'rc-column':'steel-column');
 if(x<=12){
  const tiers=y===12?[[7.6,10.2],[10.2,11.35]]:[[7.6,11.35]];
  for(const [z1,z2] of tiers)column(x,y,z1,z2,material,rc?S.rc45:S.steelUpper,rc?'rc-column':'steel-column');
 }
}
const slabs=(z,limit)=>{
  for(let i=0;i<limit;i++)for(let j=0;j<2;j++){
   // Atrium and setbacks are not clad with fictitious opaque floors.
   if(z>10&&(i===1&&j===1))continue;
   if(z===7.6&&i===2&&j===1)continue;
   const x=cols[i],y=rows[j],X=cols[i+1],Y=rows[j+1];
   shell([[x,y,z],[X,y,z],[X,Y,z],[x,Y,z]],'M_RC',.17,z>10?'rc-roof':'rc-floor');
  }
};
for(const level of [3.8,7.6,11.35]){
 const xLim=level>10?2:3;
 for(let i=0;i<=xLim;i++)for(let j=0;j<rows.length;j++){
  if(i<xLim){
   const kind=(i===1&&j>0)?'rc-beam':(level>10?'main-beam':'main-beam');
   add([cols[i],rows[j],level],[cols[i+1],rows[j],level],kind==='rc-beam'?S.rcBeam:(level>10?S.beamUpper:S.beamMain),kind==='rc-beam'?'M_RC':'M_STEEL',kind);
  }
  if(j<rows.length-1)add([cols[i],rows[j],level],[cols[i],rows[j+1],level],S.beamSecondary,'M_STEEL','secondary-beam');
 }
 slabs(level,xLim);
}
// Real shell panels for only the structural core, visibly exposing the framing.
for(const [z0,z1] of [[0,3.8],[3.8,7.6],[7.6,11.35]]){
 shell([[6,6,z0],[6,12,z0],[6,12,z1],[6,6,z1]],'M_RC',.25,'rc-wall');
 shell([[6,6,z0],[12,6,z0],[12,6,z1],[6,6,z1]],'M_RC',.25,'rc-wall');
}
// Two truly unsupported exposed balcony slabs (negative X and Y).
for(const z of [3.8,7.6]){
 for(const y of rows){
  add([0,y,z],[-2.8,y,z],S.beamMain,'M_STEEL','cantilever');
 }
 for(let j=0;j<2;j++){
  add([-2.8,rows[j],z],[-2.8,rows[j+1],z],S.beamSecondary,'M_STEEL','cantilever');
  shell([[-2.8,rows[j],z],[0,rows[j],z],[0,rows[j+1],z],[-2.8,rows[j+1],z]],'M_RC',.16,'rc-balcony');
 }
}
for(const x of [12,18])add([x,0,7.6],[x,-2.4,7.6],S.beamMain,'M_STEEL','cantilever');
add([12,-2.4,7.6],[18,-2.4,7.6],S.beamSecondary,'M_STEEL','cantilever');
shell([[12,-2.4,7.6],[18,-2.4,7.6],[18,0,7.6],[12,0,7.6]],'M_RC',.16,'rc-balcony');
// Steel east wing: 12 m span, 3 offset Pratt-style roof trusses at 9.25/11.9m.
const steelX=[18,25,32],steelY=[3,6,9,12,15],steelTop=[9.25,10.53,11.9,10.53,9.25],steelEave=9.25;
for(const x of steelX)for(const y of [3,15]){
 column(x,y,0,4.65,'M_STEEL',S.steelCol,'steel-column');
 column(x,y,4.65,steelEave,'M_STEEL',S.steelUpper,'steel-column');
}
for(const z of [4.65,steelEave])for(const y of [3,15])
 for(let k=0;k<2;k++)add([steelX[k],y,z],[steelX[k+1],y,z],S.beamUpper,'M_STEEL','main-beam');
for(const x of steelX){
 for(let i=0;i<4;i++){
  add([x,steelY[i],steelEave],[x,steelY[i+1],steelEave],S.steelChord,'M_STEEL','steel-truss','truss');
  add([x,steelY[i],steelTop[i]],[x,steelY[i+1],steelTop[i+1]],S.steelChord,'M_STEEL','steel-truss','truss');
 }
 for(let i=1;i<4;i++)add([x,steelY[i],steelEave],[x,steelY[i],steelTop[i]],S.steelWeb,'M_STEEL','steel-truss','truss');
 for(const [bottom,top] of [[0,1],[1,2],[3,2],[4,3]])
  add([x,steelY[bottom],steelEave],[x,steelY[top],steelTop[top]],S.steelWeb,'M_STEEL','steel-truss','truss');
}
for(let k=0;k<2;k++)for(let i=0;i<5;i++){
 add([steelX[k],steelY[i],steelTop[i]],[steelX[k+1],steelY[i],steelTop[i]],S.purlin,'M_STEEL','steel-purlin');
}
// Timber north wing: GL24h Howe/Fink trusses, offset ridge at 12.65m.
const woodX=[0,6,12],woodY=[12,15,18,21,24],woodTop=[10.2,11.43,12.65,11.43,10.2],woodEave=10.2;
for(const x of woodX){
 column(x,24,0,4,'M_WOOD',S.woodPost,'wood-post');
 column(x,24,4,8,'M_WOOD',S.woodPost,'wood-post');
 column(x,24,8,woodEave,'M_WOOD',S.woodPost,'wood-post');
}
for(const x of woodX){
 for(let i=0;i<4;i++){
  add([x,woodY[i],woodEave],[x,woodY[i+1],woodEave],S.woodBottom,'M_WOOD','wood-truss','truss');
  add([x,woodY[i],woodTop[i]],[x,woodY[i+1],woodTop[i+1]],S.woodChord,'M_WOOD','wood-truss','truss');
 }
 for(let i=1;i<4;i++)add([x,woodY[i],woodEave],[x,woodY[i],woodTop[i]],S.woodWeb,'M_WOOD','wood-truss','truss');
 for(const [bottom,top] of [[0,1],[1,2],[3,2],[4,3]])
  add([x,woodY[bottom],woodEave],[x,woodY[top],woodTop[top]],S.woodWeb,'M_WOOD','wood-truss','truss');
}
for(let k=0;k<2;k++)for(let i=0;i<5;i++){
 add([woodX[k],woodY[i],woodTop[i]],[woodX[k+1],woodY[i],woodTop[i]],S.woodPurlin,'M_WOOD','wood-purlin');
}
for(let k=0;k<2;k++)add([woodX[k],24,4],[woodX[k+1],24,4],S.woodBottom,'M_WOOD','wood-beam');
// Few lateral steel braces, concentrated in realistic facade bays.
const braces=[
 [[0,0,0],[6,0,3.8]],[[6,0,0],[0,0,3.8]],
 [[25,3,0],[32,3,4.65]],[[32,3,0],[25,3,4.65]]
];
for(const [a,b] of braces)add(a,b,S.steelWeb,'M_STEEL','brace','truss');
// Grade beams join the foundations; visually and structurally native beam records.
for(const y of [0,6,12])for(let i=0;i<3;i++)
 add([cols[i],y,0],[cols[i+1],y,0],S.tie,'M_RC','foundation-tie');
for(const x of [0,6,12])for(let j=0;j<2;j++)
 add([x,rows[j],0],[x,rows[j+1],0],S.tie,'M_RC','foundation-tie');
for(let i=0;i<2;i++)for(const y of [3,15])add([steelX[i],y,0],[steelX[i+1],y,0],S.tie,'M_RC','foundation-tie');
for(const x of woodX)add([x,12,0],[x,24,0],S.tie,'M_RC','foundation-tie');

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
 gridX:[-2.8,0,6,12,18,25,32],
 gridY:[-2.4,0,3,6,9,12,15,18,24],
 levels:[0,3.8,4.65,7.6,9.25,10.2,11.35,11.9,12.65],
 roofLevels:[7.6,9.25,10.2,11.35,11.9,12.65],
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
 'Geometria: corpo principale a C.A. e acciaio su quote diverse; 2 corpi laterali, capriate legno GL24h e capriate acciaio S355;',
 'due gruppi di sbalzi liberi, fondazioni superficiali DIRECT con archivio foundationSystem e travi di collegamento.',
 'Dimensioni plinti e suolo SONO IPOTESI DIMOSTRATIVE: non derivano da indagini né dimensionamenti.',
 'Stratigrafia: sabbia assunta per sola validazione del tipo FOUNDATION DIRECT; gamma 18, phi 30, Es 25 MPa, ks 18000 kN/m³.',
 'La fonte degli elementi 3D è esclusivamente il file nativo .hfm.json validato, inclusi i plinti.',
 'NON sono state eseguite analisi, verifiche geotecniche, dimensionamenti, controlli sismici o progetto esecutivo.',
 'Originale esempio D2 SHA256 '+demo.source.baseSha256,
 'Nuovo file nativo SHA256 '+demo.source.derivedModelSha256
 ].join('\n')+'\n');
console.log('D2 native validation successful',{nodes:points.length,members:members.length,shells:shells.length,footings:footings.length,
 steelTruss:members.filter(m=>m.kind==='steel-truss').length,woodTruss:members.filter(m=>m.kind==='wood-truss').length,
 cantilevers:members.filter(m=>m.kind==='cantilever').length,bbox,hash:demo.source.derivedModelSha256});
