'use strict';
// Terrain tiles contain land only. Rivers are painted exactly once, afterwards,
// from the same active centerlines that produced riverSegments and saved bridges.
let terrainOnly154=false,terrainRiverKey154=null;
const waterBefore154=atlasWater;
atlasWater=function(...args){if(!terrainOnly154)return waterBefore154(...args);};
// The apron supplies the ground and cached trees; water belongs to the final pass.
drawPortraitScenery=function(){
 if(!activeAtlasMap)return;
 let left=-view.x/view.scale-100,right=(W-view.x)/view.scale+100,top=-view.y/view.scale-100,bottom=(H-view.y)/view.scale+100;
 ctx.save();ctx.fillStyle='#e6edda';ctx.fillRect(left,top,right-left,bottom-top);
 if(!sceneryTrees153){sceneryTrees153=[];let b=portraitBounds();for(let y=Math.floor(b.ymin/125)*125;y<=b.ymax;y+=125)for(let x=Math.floor(b.xmin/135)*135;x<=b.xmax;x+=135){if(x>=-1000&&x<=1200&&y>=-300&&y<=1200)continue;if(Math.sin(x*.019+y*.013)+Math.cos(y*.027-x*.011)<1.25||riverDistance({x,y})<55)continue;sceneryTrees153.push({x,y});}}
 for(let {x,y}of sceneryTrees153){if(x<left||x>right||y<top||y>bottom)continue;for(let k=0;k<3;k++)artTree(x+k*9,y+Math.sin(k*4)*6,.65,mapSpec.id==='west');}ctx.restore();
};
function riverGeometryKey154(){return JSON.stringify([mapSpec.id,mapSpec.bounds,mapSpec.main,mapSpec.branches]);}
function drawRiverNetwork154(){
 let paths=[mapSpec.main,...mapSpec.branches];ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Each branch starts a separate subpath. Banks are painted layer-first so no
 // tributary bank draws across the water at a confluence.
 for(let [width,color]of [[62,'#dfe8d0'],[33,'#c3d4b4'],[25,'#e2d9b4'],[18,'#619ca5'],[15,'#85bfc0'],[7,'#abd8cd']]){
  ctx.beginPath();for(let points of paths){if(!points.length)continue;ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);}
  ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
 }ctx.restore();
}
const drawBefore154=drawTerrain;
drawTerrain=function(){
 if(!activeAtlasMap)return drawBefore154();
 let key=riverGeometryKey154();if(key!==terrainRiverKey154){terrainCache=null;sceneryTrees153=null;terrainRiverKey154=key;}
 drawPortraitScenery();
 if(!terrainCache){let cache=document.createElement('canvas');cache.width=2640;cache.height=1800;let live=ctx;
  try{terrainOnly154=true;ctx=cache.getContext('2d');ctx.scale(1.2,1.2);ctx.translate(1000,300);paintTerrain();terrainCache=cache;}
  finally{ctx=live;terrainOnly154=false;}
 }
 ctx.drawImage(terrainCache,-1000,-300,2200,1500);drawRiverNetwork154();
};
terrainCache=null;
