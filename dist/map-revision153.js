'use strict';
let sceneryTrees153=null;
const WEST_BOUNDS153={xmin:-1300,xmax:1500,ymin:-450,ymax:1650};
basinWest14.bounds={...WEST_BOUNDS153};
// Extend only the open ends, preserving every existing centreline coordinate and confluence.
function legacyExtendRiver153(points,end,bounds){
 let out=points.map(p=>[...p]),a=end?out.at(-1):out[0],i=end?out.length-2:1,b=out[i];
 while(b&&Math.hypot(a[0]-b[0],a[1]-b[1])<.01){i+=end?-1:1;b=out[i];}if(!b)return out;
 if(a[0]<bounds.xmin||a[0]>bounds.xmax||a[1]<bounds.ymin||a[1]>bounds.ymax)return out;
 let dx=a[0]-b[0],dy=a[1]-b[1],len=Math.hypot(dx,dy);dx/=len;dy/=len;
 let times=[];if(dx>1e-8)times.push((bounds.xmax-a[0])/dx);if(dx< -1e-8)times.push((bounds.xmin-a[0])/dx);if(dy>1e-8)times.push((bounds.ymax-a[1])/dy);if(dy< -1e-8)times.push((bounds.ymin-a[1])/dy);
 let distance=Math.min(...times.filter(t=>t>=0))+180,steps=Math.max(2,Math.ceil(distance/90)),extra=[];for(let i=1;i<=steps;i++){let d=distance*i/steps,bend=24*(1-Math.cos(d/180));extra.push([a[0]+dx*d-dy*bend,a[1]+dy*d+dx*bend]);}if(end)out.push(...extra);else out.unshift(...extra.reverse());return out;
}
// Remove only an exactly recognizable v1.5.3 extrapolation, leaving the saved
// original river samples intact. This also repairs old sessions already saved
// with an inward extension; no city, bridge head or route coordinate is moved.
function stripLegacyExtension153(points,end,bounds){
 for(let count=1;count<=Math.min(180,points.length-2);count++){
  let base=end?points.slice(0,-count):points.slice(count),a=end?base.at(-1):base[0];
  if(a[0]<bounds.xmin||a[0]>bounds.xmax||a[1]<bounds.ymin||a[1]>bounds.ymax)continue;
  let generated=legacyExtendRiver153(base,end,bounds);if(generated.length!==points.length)continue;
  let start=end?base.length:0,stop=end?points.length:count;
  if(generated.slice(start,stop).every((p,j)=>Math.hypot(p[0]-points[start+j][0],p[1]-points[start+j][1])<1e-6))return base;
 }return points;
}
function extendRiver153(points,end,bounds){
 let out=points.map(p=>[...p]),ordered=end?[...points].reverse():points,a=ordered[0];
 if(!a||a[0]<bounds.xmin||a[0]>bounds.xmax||a[1]<bounds.ymin||a[1]>bounds.ymax)return out;
 // Endpoint Catmull-Rom overshoot can reverse the first few tiny samples.
 // Estimate the outward heading over a meaningful length of the old river.
 let b=ordered.slice(1).find(p=>Math.hypot(p[0]-a[0],p[1]-a[1])>=96)||ordered.at(-1);
 let dx=a[0]-b[0],dy=a[1]-b[1],ox=a[0]-(bounds.xmin+bounds.xmax)/2,oy=a[1]-(bounds.ymin+bounds.ymax)/2;
 if(dx*ox+dy*oy<=0){dx=ox;dy=oy;}let length=Math.hypot(dx,dy);if(!length)return out;dx/=length;dy/=length;
 let times=[];if(dx>1e-8)times.push((bounds.xmax-a[0])/dx);if(dx< -1e-8)times.push((bounds.xmin-a[0])/dx);if(dy>1e-8)times.push((bounds.ymax-a[1])/dy);if(dy< -1e-8)times.push((bounds.ymin-a[1])/dy);
 let distance=Math.min(...times.filter(t=>t>=0))+180,steps=Math.max(2,Math.ceil(distance/90)),extra=[];
 for(let i=1;i<=steps;i++){let d=distance*i/steps,bend=24*(1-Math.cos(d/180));extra.push([a[0]+dx*d-dy*bend,a[1]+dy*d+dx*bend]);}
 if(end)out.push(...extra);else out.unshift(...extra.reverse());return out;
}
function applyMapRevision153(){
 if(!activeAtlasMap)return;
 const west=mapSpec.id==='west';activeAtlasMap=atlasClone(mapSpec);mapSpec=activeAtlasMap;
 if(west)mapSpec.bounds={...WEST_BOUNDS153};
 const b=mapSpec.bounds,edge={xmin:b.xmin-850,xmax:b.xmax+850,ymin:b.ymin-850,ymax:b.ymax+850};
 let paths=[mapSpec.main,...mapSpec.branches].map((p,i)=>{let original=stripLegacyExtension153(p,false,edge);if(i===0)original=stripLegacyExtension153(original,true,edge);let out=extendRiver153(original,false,edge);return i===0?extendRiver153(out,true,edge):out;});
 mapSpec.main=paths[0];mapSpec.branches=paths.slice(1);
 riverSegments.length=0;paths.forEach((pts,rid)=>{for(let i=1;i<pts.length;i++)riverSegments.push({rid,index:i-1,a:{x:pts[i-1][0],y:pts[i-1][1]},b:{x:pts[i][0],y:pts[i][1]}});});
 // Geometry saved under the existing key keeps physical bridge locations stable on reload.
 if(S?.mapId===mapSpec.id){S.riverPaths128=atlasClone(paths);S.mapRevision153=1;}
 sceneryTrees153=null;terrainCache=null;gridCache=null;growthStateRef=null;basinGraphWeb=null;basinPathsWeb.clear();studyGeomMemo.clear();geometryMemo.clear();crossingCache.clear();
}
const activateBefore153=activateAtlasGeometry;
activateAtlasGeometry=function(...a){let r=activateBefore153(...a);applyMapRevision153();return r;};
const resetBefore153=reset;
reset=function(...a){let r=resetBefore153(...a);applyMapRevision153();save();return r;};
// Keep travel room on both axes at minimum zoom, even on tall portrait screens.
portraitMinScale=function(width=W,height=H){let b=portraitBounds(),padX=Math.max(70,width*.12),padY=Math.max(120,height*.15);return Math.max((width+padX*2)/(b.xmax-b.xmin),(height+padY*2)/(b.ymax-b.ymin));};
uxClampToMap=function(t){return t?clampPortraitCamera({...t}):t;};
const playViewBefore153=uxApplyPlayView;let playState153=null,playWidth153=null;
uxApplyPlayView=function(...a){if(pointers.size||gesture?.kind==='pan'||gesture?.kind==='pinch')return;if(playState153===S&&playWidth153===W)return;playState153=S;playWidth153=W;return playViewBefore153(...a);};
// Paint the whole visible apron. The old fixed terrain tile supplies unchanged mountains;
// all rivers share this same physical path both inside and outside that tile.
drawPortraitScenery=function(){
 if(!activeAtlasMap)return;let left=-view.x/view.scale-100,right=(W-view.x)/view.scale+100,top=-view.y/view.scale-100,bottom=(H-view.y)/view.scale+100;
 ctx.save();ctx.fillStyle='#e6edda';ctx.fillRect(left,top,right-left,bottom-top);
 if(!sceneryTrees153){sceneryTrees153=[];let b=portraitBounds();for(let y=Math.floor(b.ymin/125)*125;y<=b.ymax;y+=125)for(let x=Math.floor(b.xmin/135)*135;x<=b.xmax;x+=135){if(x>=-1000&&x<=1200&&y>=-300&&y<=1200)continue;if(Math.sin(x*.019+y*.013)+Math.cos(y*.027-x*.011)<1.25||riverDistance({x,y})<55)continue;sceneryTrees153.push({x,y});}}
 for(let {x,y}of sceneryTrees153){if(x<left||x>right||y<top||y>bottom)continue;for(let k=0;k<3;k++)artTree(x+k*9,y+Math.sin(k*4)*6,.65,mapSpec.id==='west');}
 ctx.lineCap='round';ctx.lineJoin='round';for(let [w,color]of [[62,'#dfe8d0'],[33,'#c3d4b4'],[25,'#e2d9b4'],[18,'#619ca5'],[15,'#85bfc0'],[7,'#abd8cd']]){ctx.beginPath();for(let points of [mapSpec.main,...mapSpec.branches])points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineWidth=w;ctx.strokeStyle=color;ctx.stroke();}ctx.restore();
};
function clusterShape153(points){
 if(points.length<3)return {minor:0,ratio:0};let x=points.reduce((n,p)=>n+p.x,0)/points.length,y=points.reduce((n,p)=>n+p.y,0)/points.length,xx=0,yy=0,xy=0;
 for(let p of points){xx+=(p.x-x)**2;yy+=(p.y-y)**2;xy+=(p.x-x)*(p.y-y);}xx/=points.length;yy/=points.length;xy/=points.length;
 let d=Math.hypot(xx-yy,2*xy),minor=Math.max(0,(xx+yy-d)/2),major=(xx+yy+d)/2;return {minor:Math.sqrt(minor),ratio:major?minor/major:0};
}
function clusterFits153(points){let q=clusterShape153(points);return points.length>=5&&q.minor>=80&&q.ratio>=.12;}
const seedPlanCache153=new WeakMap();
const previewBefore153=previewSeedCluster;
previewSeedCluster=function(p){
 let cached=seedPlanCache153.get(growthAvailable);if(!cached){cached=new Map();seedPlanCache153.set(growthAvailable,cached);}let cacheKey=p.x+','+p.y;if(cached.has(cacheKey))return cached.get(cacheKey);const done=plan=>{cached.set(cacheKey,plan);return plan;};
 const original=previewBefore153(p);if(original&&clusterFits153(original))return done(original);
 let regions=cityRegions(),choices=growthAvailable.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<=520&&farEnough(q,p)&&!reservedForOther(q,-1)&&realCities().every(c=>c.removed||Math.hypot(q.x-c.x,q.y-c.y)>=320)&&regions.every(r=>Math.hypot(q.x-r.x,q.y-r.y)>=Math.hypot(q.x-p.x,q.y-p.y)+100));
 if(choices.length<4||clusterShape153([p,...choices]).minor<80)return done(null);
 let plan=[p];for(let i=1;i<8;i++){
  let eligible=choices.filter(q=>plan.some(c=>{let d=Math.hypot(q.x-c.x,q.y-c.y);return d>=195&&d<=330;}));if(!eligible.length)break;
  const score=q=>clusterShape153([...plan,q]).minor*1.8-Math.abs(Math.hypot(q.x-p.x,q.y-p.y)-280)*.15+Math.sin(q.x*.091+q.y*.037)*4;
  let ranked=eligible.map(q=>({q,score:score(q)})).sort((a,b)=>b.score-a.score);let q=ranked[0].q;plan.push(q);choices=choices.filter(v=>farEnough(v,q));
 }let directions=new Set(plan.slice(1).map(q=>(q.x>=p.x?1:0)+(q.y>=p.y?2:0)));return done(clusterFits153(plan)&&(mapSpec.id!=='east'||(plan.length>=8&&directions.size>=3))?plan:null);
};
const findLocalBefore153=findLocal;
findLocal=function(r){
 if(r.id===0)return findLocalBefore153(r);
 let candidates=growthAvailable.filter(p=>localAllowed(p,r));if(!candidates.length)return null;let members=clusterMembers(r);
 const score=p=>{let s=clusterShape153([...members,p]);return s.minor*2-Math.hypot(p.x-r.x,p.y-r.y)*.1;};
 candidates.sort((a,b)=>score(b)-score(a));let best=score(candidates[0]);return pick(candidates.filter(p=>score(p)>=best-8));
};
const thumbBefore153=atlasThumbnail;
atlasThumbnail=function(id){let h=thumbBefore153(id);if(id==='west')h=h.replace('viewBox="-1000 -300 2200 1500"','viewBox="-1300 -450 2800 2100"').replace('x="-1000" y="-300" width="2200" height="1500"','x="-1300" y="-450" width="2800" height="2100"');return h;};
applyMapRevision153();let westThumb153=$('atlas-card-west')?.querySelector('.atlas-terrain');if(westThumb153)westThumb153.innerHTML=atlasThumbnail('west');
let intro153=document.querySelector('.atlas-heading p');if(intro153)intro153.textContent='左右滑动，选择你的下一段旅程。';

// Passing through a station centre attaches it immediately. The wider touch halo
// retains the old dwell guard to avoid accidental neighbouring-station catches.
const addBefore153=addDraftCity;
addDraftCity=function(c,force=false){let p=draft?.pointer;if(!force&&gesture?.kind==='draft'&&p&&c?.kind!=='bridgehead'&&Math.hypot(p.x-c.x,p.y-c.y)*view.scale<=Math.max(14,radius(c)*view.scale+5))force=true;return addBefore153(c,force);};
