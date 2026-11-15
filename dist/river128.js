'use strict';
// New games save a sampled smooth centreline. Existing saves keep every physical river/bridge coordinate.
function smoothRiver128(pts){if(pts.length<3)return atlasClone(pts);let out=[pts[0]];for(let i=0;i<pts.length-1;i++){let a=pts[Math.max(0,i-1)],b=pts[i],c=pts[i+1],d=pts[Math.min(pts.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/24));for(let j=1;j<=n;j++){let t=j/n,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}}return out;}
function applyRiverPaths128(paths){if(!activeAtlasMap||!paths)return;activeAtlasMap=atlasClone(ATLAS_MAPS[S.mapId]);activeAtlasMap.main=atlasClone(paths[0]);activeAtlasMap.branches=atlasClone(paths.slice(1));mapSpec=activeAtlasMap;riverSegments.length=0;paths.forEach((pts,rid)=>{for(let i=1;i<pts.length;i++)riverSegments.push({rid,index:i-1,a:{x:pts[i-1][0],y:pts[i-1][1]},b:{x:pts[i][0],y:pts[i][1]}});});studyGeomMemo.clear();geometryMemo.clear();crossingCache.clear();terrainCache=null;if(typeof gridCache!=='undefined')gridCache=null;}
const activateBefore128=activateAtlasGeometry;
activateAtlasGeometry=function(id){activateBefore128(id);if(S?.mapId===id&&S.riverPaths128)applyRiverPaths128(S.riverPaths128);};
function initializeRiver128(){if(!activeAtlasMap)return;let raw=ATLAS_MAPS[S.mapId],bounds=raw.bounds;
 function extended(pts,tail){let out=atlasClone(pts);for(let end of tail?[0,1]:[0]){let a=end?out.at(-1):out[0],b=end?out.at(-2):out[1],dx=a[0]-b[0],dy=a[1]-b[1],l=Math.hypot(dx,dy),q=a;for(let step=24;step<5000;step+=24){q=[a[0]+dx/l*step,a[1]+dy/l*step];if(q[0]<bounds.xmin-160||q[0]>bounds.xmax+160||q[1]<bounds.ymin-160||q[1]>bounds.ymax+160)break;}if(end)out.push(q);else out.unshift(q);}return out;}
 let paths=[raw.main,...raw.branches].map((pts,i)=>smoothRiver128(extended(pts,i===0)));
 // Project tributary mouths to the curved trunk, so each junction stays welded.
 for(let p of paths.slice(1)){let mouth=p.at(-1),best=null;for(let i=1;i<paths[0].length;i++){let a=paths[0][i-1],b=paths[0][i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((mouth[0]-a[0])*dx+(mouth[1]-a[1])*dy)/(dx*dx+dy*dy))),q=[a[0]+dx*t,a[1]+dy*t],dist=Math.hypot(q[0]-mouth[0],q[1]-mouth[1]);if(!best||dist<best.dist)best={q,dist};}if(best&&best.dist<90)p[p.length-1]=best.q;}
 S.riverPaths128=paths;S.riverRevision128=2;applyRiverPaths128(paths);configureGrowth();save();}
const resetBefore128=reset;reset=function(){resetBefore128();farmHint128=false;initializeRiver128();};
const startBefore128=startAtlasMap;startAtlasMap=function(...args){startBefore128(...args);if((!S.riverPaths128||S.riverRevision128!==2)&&S.day===0&&S.lines.length===0&&S.bridges.length===0&&realCities().length===3)initializeRiver128();};$('atlas-start').onclick=()=>startAtlasMap();
// Layer-first painting unifies confluences. A branch never paints its bank over the trunk's water.
atlasWater=function(){ctx.save();ctx.lineJoin='round';ctx.lineCap='round';for(let [w,color] of [[33,'#c3d4b4'],[25,'#e2d9b4'],[18,'#619ca5'],[15,'#85bfc0'],[7,'#abd8cd']]){ctx.beginPath();for(let pts of [mapSpec.main,...mapSpec.branches]){pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));}ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();}ctx.restore();};
if(S?.riverPaths128&&activeAtlasMap)applyRiverPaths128(S.riverPaths128);terrainCache=null;
