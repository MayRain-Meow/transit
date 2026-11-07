'use strict';
let mapSpec=activeAtlasMap||ATLAS_MAPS.east;
const studyGeomMemo=new Map(),riverSegments=[];
for(let [rid,pts] of [mapSpec.main,...mapSpec.branches].entries())for(let i=1;i<pts.length;i++)riverSegments.push({rid,index:i-1,a:{x:pts[i-1][0],y:pts[i-1][1]},b:{x:pts[i][0],y:pts[i][1]}});
function nearestRiver(p){let best=null;for(let s of riverSegments){let dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,l2=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/l2)),x=s.a.x+t*dx,y=s.a.y+t*dy,d=Math.hypot(p.x-x,p.y-y);if(!best||d<best.d){let l=Math.sqrt(l2);best={...s,x,y,d,nx:-dy/l,ny:dx/l};}}return best;}
function riverDistance(p){return nearestRiver(p).d;}
function scalarClip(range,u,v,lo,hi){if(Math.abs(v)<1e-12)return u>=lo&&u<=hi?range:null;let a=(lo-u)/v,b=(hi-u)/v;if(a>b)[a,b]=[b,a];let r=[Math.max(range[0],a),Math.min(range[1],b)];return r[1]-r[0]>1e-10?r:null;}
function riverSpans(a,b,width=9){let out=[],dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy;if(!A)return [];
 for(let s of riverSegments){let rx=s.b.x-s.a.x,ry=s.b.y-s.a.y,l2=rx*rx+ry*ry,l=Math.sqrt(l2),qx=a.x-s.a.x,qy=a.y-s.a.y,r=scalarClip([0,1],qx*rx+qy*ry,dx*rx+dy*ry,0,l2);if(r)r=scalarClip(r,qx*ry-qy*rx,dx*ry-dy*rx,-width*l,width*l);if(r)out.push(r);
  for(let p of [s.a,s.b]){let x=a.x-p.x,y=a.y-p.y,B=2*(x*dx+y*dy),C=x*x+y*y-width*width,D=B*B-4*A*C;if(D<=0)continue;let u=Math.max(0,(-B-Math.sqrt(D))/(2*A)),v=Math.min(1,(-B+Math.sqrt(D))/(2*A));if(v-u>1e-10)out.push([u,v]);}
 }out.sort((x,y)=>x[0]-y[0]);let merged=[];for(let r of out){if(merged.length&&r[0]<=merged.at(-1)[1]+1e-8)merged.at(-1)[1]=Math.max(r[1],merged.at(-1)[1]);else merged.push([...r]);}return merged;
}
const atlasLegacy_inRiverValley=inRiverValley;
inRiverValley=function(p){if(!activeAtlasMap)return atlasLegacy_inRiverValley(p);return riverDistance(p)<32;};
const atlasLegacy_mountainCrossings=mountainCrossings;
mountainCrossings=function(a,b){if(!activeAtlasMap)return atlasLegacy_mountainCrossings(a,b);let k=['mountain',a.x,a.y,b.x,b.y].join('|');if(studyGeomMemo.has(k))return studyGeomMemo.get(k);let dx=b.x-a.x,dy=b.y-a.y,cuts=[0,1];
 for(let poly of mountainPolygons)for(let i=0;i<poly.length;i++){let p=poly[i],q=poly[(i+1)%poly.length],ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;let t=((p.x-a.x)*ey-(p.y-a.y)*ex)/den,u=((p.x-a.x)*dy-(p.y-a.y)*dx)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);}
 for(let [u,v] of riverSpans(a,b,32))cuts.push(u,v);cuts.sort((x,y)=>x-y);let spans=[];
 for(let i=1;i<cuts.length;i++){let lo=cuts[i-1],hi=cuts[i];if(hi-lo<1e-7)continue;let t=(lo+hi)/2,p={x:a.x+dx*t,y:a.y+dy*t};if(!inRiverValley(p)&&mountainPolygons.some(poly=>pointInPolygon(p,poly))){if(spans.length&&Math.abs(spans.at(-1)[1]-lo)<1e-6)spans.at(-1)[1]=hi;else spans.push([lo,hi]);}}
 if(studyGeomMemo.size>12000)studyGeomMemo.clear();studyGeomMemo.set(k,spans);return spans;
};
const atlasLegacy_requirements=requirements;
requirements=function(a,b,type){if(!activeAtlasMap)return atlasLegacy_requirements(a,b,type);if(type==='air')return {bridge:0,tunnel:0,hill:0};let k=[type,a.x,a.y,b.x,b.y].join('|');if(studyGeomMemo.has(k))return studyGeomMemo.get(k);let hill=0;for(let i=0;i<=80;i++){let t=i/80,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(hills.some(e=>inEllipse(p,e)))hill++;}let r={bridge:riverSpans(a,b).length,tunnel:mountainCrossings(a,b).length,hill:hill/81};if(studyGeomMemo.size>12000)studyGeomMemo.clear();studyGeomMemo.set(k,r);return r;};
const atlasLegacy_cityBuildable=cityBuildable;
cityBuildable=function(x,y,size=0){if(!activeAtlasMap)return atlasLegacy_cityBuildable(x,y,size);let b=mapSpec.bounds,clearance=[12,17,23][size]+32;return x>=b.xmin+clearance&&x<=b.xmax-clearance&&y>=b.ymin+clearance&&y<=b.ymax-clearance&&riverDistance({x,y})>clearance+9&&mountainDistance({x,y})>clearance;};
const atlasLegacy_snapBank=snapBank;
snapBank=function(p){if(!activeAtlasMap)return atlasLegacy_snapBank(p);let s=nearestRiver(p),side=((p.x-s.x)*s.nx+(p.y-s.y)*s.ny)>=0?1:-1;return {x:s.x+side*19*s.nx,y:s.y+side*19*s.ny,side};};
const atlasLegacy_bridgeTerrainIssue=bridgeTerrainIssue;
bridgeTerrainIssue=function(a,b){if(!activeAtlasMap)return atlasLegacy_bridgeTerrainIssue(a,b);if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite))return '桥头无效';if(Math.hypot(a.x-b.x,a.y-b.y)>260)return '桥过长';if(riverDistance(a)<9||riverDistance(b)<9||riverSpans(a,b).length!==1)return '桥应连接一条河的两岸';if(mountainCrossings(a,b).length)return '桥位穿山';let m=mapSpec.bounds;if([a,b].some(p=>p.x<m.xmin||p.x>m.xmax||p.y<m.ymin||p.y>m.ymax))return '越界';return null;};
// Existing physical bridge nodes and native fares/construction remain; route through any compatible bridge, independent of one-river bank labels.
const atlasLegacy_routeBridgeStops=routeBridgeStops;
routeBridgeStops=function(stops,type){if(!activeAtlasMap)return atlasLegacy_routeBridgeStops(stops,type);let result=[],invalid=null;for(let id of stops){let b=S.cities[id];if(!b||b.removed)continue;if(!result.length){result.push(id);continue;}let a=S.cities[result.at(-1)],direct=bridgeFor(a,b);if(direct){if(!bridgeCompatible(direct,type)||direct.status!=='open')invalid='桥型不符';result.push(id);continue;}if(type==='air'||!requirements(a,b,type).bridge){result.push(id);continue;}
 let bridges=S.bridges.filter(x=>x.status==='open'&&bridgeCompatible(x,type)),nodes=[a,...bridges.flatMap(x=>x.heads.map(id=>S.cities[id])),b],dist=Array(nodes.length).fill(Infinity),prev=Array(nodes.length).fill(-1),done=new Set();dist[0]=0;
 for(let z=0;z<nodes.length;z++){let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u]))break;if(u===nodes.length-1)break;done.add(u);for(let v=1;v<nodes.length;v++){if(v===u||done.has(v))continue;let br=bridgeFor(nodes[u],nodes[v]);if(br?!bridgeCompatible(br,type)||br.status!=='open':requirements(nodes[u],nodes[v],type).bridge>0)continue;let nd=dist[u]+Math.hypot(nodes[u].x-nodes[v].x,nodes[u].y-nodes[v].y);if(nd<dist[v]){dist[v]=nd;prev[v]=u;}}}
 let end=nodes.length-1;if(!Number.isFinite(dist[end])){invalid='跨河需先建桥';result.push(id);}else{let path=[];for(let u=end;u>0;u=prev[u])path.push(nodes[u].id);result.push(...path.reverse());}}
 return {stops:result,invalid};
};

const atlasLegacyGeometry={mountains:[{x:190,y:155,rx:155,ry:55},{x:540,y:130,rx:125,ry:57},{x:825,y:170,rx:150,ry:65}],hills:[{x:320,y:555,rx:200,ry:85},{x:745,y:570,rx:165,ry:90}]};
function activateAtlasGeometry(id){
 activeAtlasMap=ATLAS_MAPS[id]||null;mapSpec=activeAtlasMap||ATLAS_MAPS.east;
 let geom=activeAtlasMap||atlasLegacyGeometry;
 mountains.splice(0,mountains.length,...atlasClone(geom.mountains));hills.splice(0,hills.length,...atlasClone(geom.hills));
 mountainPolygons.splice(0,mountainPolygons.length,...mountains.map(e=>Array.from({length:160},(_,i)=>{let a=i/160*Math.PI*2,r=terrainRadius(a,e);return{x:e.x+Math.cos(a)*e.rx*r,y:e.y+Math.sin(a)*e.ry*r};})));
 riverSegments.length=0;for(let [rid,pts] of [mapSpec.main,...mapSpec.branches].entries())for(let i=1;i<pts.length;i++)riverSegments.push({rid,index:i-1,a:{x:pts[i-1][0],y:pts[i-1][1]},b:{x:pts[i][0],y:pts[i][1]}});
 studyGeomMemo.clear();geometryMemo.clear();crossingCache.clear();terrainCache=null;
 if(typeof gridCache!=='undefined')gridCache=null;if(typeof growthStateRef!=='undefined')growthStateRef=null;
}
const resetBeforeAtlas=reset;
reset=function(){if(typeof clearAtlasTransient==='function')clearAtlasTransient();resetBeforeAtlas();if(activeAtlasMap){S.mapId=activeAtlasMap.id;S.mapRevision=1;for(let [i,p] of activeAtlasMap.start.entries())Object.assign(S.cities[i],{x:p[0],y:p[1],regionId:0});S.cityRegions=[{id:0,x:activeAtlasMap.start[0][0],y:activeAtlasMap.start[0][1],name:'起始城市圈',discoveredAt:0,nextLocalAt:Infinity}];delete S.atlasGrowth;}terrainCache=null;fit();updateUI();};
