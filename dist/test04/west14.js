'use strict';
// New expeditions use enclosed terrain; existing expeditions keep their exact footprints.
const legacyWest14=atlasClone(ATLAS_MAPS.west),basinWest14=atlasClone(legacyWest14);
basinWest14.terrainRevision14=1;
basinWest14.start=[[100,750],[265,670],[305,850]];
basinWest14.main=[[-250,-450],[-300,-100],[-200,150],[-320,400],[-200,650],[-250,900],[-220,1400]];
basinWest14.branches=[[[1300,50],[900,80],[640,160],[240,210],[-200,150]],[[-1250,550],[-880,540],[-600,600],[-200,650]]];
basinWest14.mountains=[];
for(let i=0;i<44;i++){let a=i/44*Math.PI*2; // One narrow eastern land pass. River valleys cut their own exact openings.
 if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.24)continue;
 basinWest14.mountains.push({x:80+900*Math.cos(a)*(1+.045*Math.sin(3*a)+.025*Math.cos(5*a)),y:450+650*Math.sin(a)*(1+.035*Math.sin(4*a)),rx:118,ry:92});
}
basinWest14.hills=[{x:-510,y:990,rx:190,ry:40},{x:670,y:-30,rx:170,ry:45}];
ATLAS_MAPS.west=basinWest14;
let creatingTerrain14=false;
const activateBefore14=activateAtlasGeometry;
activateAtlasGeometry=function(id){let original=ATLAS_MAPS.west,chosen=basinWest14;
 if(id==='west'&&!creatingTerrain14&&S?.mapId===id&&!S.westTerrain14)chosen=legacyWest14;
 else if(id==='west'&&S?.mapId===id&&S.westTerrain14&&!creatingTerrain14)chosen={...basinWest14,...atlasClone(S.westTerrain14)};
 let natural=typeof naturalMaps123!=='undefined'?naturalMaps123.west:null,old=typeof originalMaps123!=='undefined'?originalMaps123.west:null;
 ATLAS_MAPS.west=atlasClone(chosen);if(id==='west'){if(natural)naturalMaps123.west=atlasClone(chosen);if(old)originalMaps123.west=atlasClone(chosen);}
 try{return activateBefore14(id);}finally{ATLAS_MAPS.west=original;if(natural)naturalMaps123.west=natural;if(old)originalMaps123.west=old;}
};
const resetTerrainBefore14=reset;
reset=function(...args){creatingTerrain14=true;try{let id=activeAtlasMap?.id;if(id==='west')activateAtlasGeometry(id);let r=resetTerrainBefore14(...args);if(id==='west'){S.westTerrain14={terrainRevision14:1,mountains:atlasClone(mountains),hills:atlasClone(hills)};save();}return r;}finally{creatingTerrain14=false;}};
function mountainUnionPath14(){ctx.beginPath();for(let poly of mountainPolygons){poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}}
const terrainBefore14=paintTerrain;
paintTerrain=function(){if(mapSpec.id!=='west'||!mapSpec.terrainRevision14)return terrainBefore14();let b=mapSpec.bounds;ctx.save();ctx.fillStyle='#e6edda';ctx.fillRect(b.xmin,b.ymin,b.xmax-b.xmin,b.ymax-b.ymin);
 let wash=ctx.createLinearGradient(0,b.ymin,0,b.ymax);wash.addColorStop(0,'#e5e9d6');wash.addColorStop(.55,'#edf0d8');wash.addColorStop(1,'#e3ebd3');ctx.fillStyle=wash;ctx.fillRect(b.xmin,b.ymin,2200,1500);
 for(let y=b.ymin+65;y<b.ymax;y+=90)for(let x=b.xmin+65;x<b.xmax;x+=105)if(Math.sin(x*.014+y*.021)+Math.cos(y*.017-x*.009)>1.35&&riverDistance({x,y})>45&&mountainDistance({x,y})>45){for(let i=0;i<3;i++)artTree(x+i*10,y+Math.sin(i*4)*6,.7,true);}
 const layer=document.createElement('canvas');layer.width=2640;layer.height=1800;let live=ctx;
 try{ctx=layer.getContext('2d');ctx.scale(1.2,1.2);ctx.translate(1000,300);mountainUnionPath14();ctx.fillStyle='#b8c5ac';ctx.fill();ctx.save();ctx.clip();
 let mountainWash=ctx.createLinearGradient(-800,-200,900,1100);mountainWash.addColorStop(0,'#bac7ac');mountainWash.addColorStop(.5,'#9fb59d');mountainWash.addColorStop(1,'#b8c5a8');ctx.fillStyle=mountainWash;ctx.fillRect(-1000,-300,2200,1500);
 // Irregular crests, clipped to the joined physical footprint; no ring-shaped road.
 ctx.beginPath();let previous=null;for(let [i,e] of mountains.entries()){let x=e.x+Math.sin(i*2.1)*20,y=e.y-10+Math.cos(i*1.9)*18;if(!previous||Math.hypot(e.x-previous.x,e.y-previous.y)>210)ctx.moveTo(x,y);else ctx.lineTo(x,y);previous=e;}ctx.strokeStyle='#829d83';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
 for(let [i,e] of mountains.entries()){let a={x:e.x-35,y:e.y+26},peak={x:e.x+Math.sin(i)*18,y:e.y-24},b={x:e.x+43,y:e.y+30};terrainPolygon([a,peak,{x:peak.x+5,y:e.y+37}],'#a1b79d');terrainPolygon([peak,b,{x:peak.x+5,y:e.y+37}],'#cbd3b6');}
 ctx.restore();
 ctx.globalCompositeOperation='destination-out';ctx.lineWidth=64;ctx.lineJoin='round';ctx.lineCap='round';for(let pts of [mapSpec.main,...mapSpec.branches]){atlasRiverPath(pts);ctx.stroke();}
 }finally{ctx=live;}ctx.drawImage(layer,-1000,-300,2200,1500);layer.width=1;layer.height=1;atlasWater();text('西 部 盆 地',400,400,14,'#9caa8d');ctx.restore();};
const thumbBefore14=atlasThumbnail;
atlasThumbnail=function(id){if(id!=='west')return thumbBefore14(id);let m=basinWest14,s='<svg viewBox="-1000 -300 2200 1500" role="img" aria-label="西部：四周山脉围合的盆地"><rect x="-1000" y="-300" width="2200" height="1500" fill="#e6edda"/>';
 for(let e of m.mountains){let pts=Array.from({length:80},(_,i)=>{let a=i/80*Math.PI*2,r=terrainRadius(a,e);return [e.x+Math.cos(a)*e.rx*r,e.y+Math.sin(a)*e.ry*r].join(',');});s+='<polygon points="'+pts.join(' ')+'" fill="#a9b99d"/>';}
 for(let pts of [m.main,...m.branches])s+='<polyline points="'+smoothRiver128(pts).map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#85b9b5" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>';return s+'</svg>';};
const westPreview14=$('atlas-card-west')?.querySelector('.atlas-terrain');if(westPreview14)westPreview14.innerHTML=atlasThumbnail('west');
if(S?.mapId==='west')activateAtlasGeometry('west');terrainCache=null;
