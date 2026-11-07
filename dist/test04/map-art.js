'use strict';
// Presentation only. Water and mountain edges use the construction geometry.
// A fixed-size cache keeps decoration independent of simulation state and DPR.
const MAP_ART={land:'#e6edda',water:'#7db9bd',shore:'#eddfb5',forest:'#5f8e73'};
function artCurve(kind,top,bottom,offset=0){ctx.beginPath();for(let y=top;y<=bottom+4;y+=4){let x=(kind==='river'?river(y):coast(y))+offset;if(y===top)ctx.moveTo(x,y);else ctx.lineTo(x,y);}}
function artWater(top,bottom,right){
 artCurve('coast',top,bottom);ctx.lineTo(right,bottom+4);ctx.lineTo(right,top);ctx.closePath();let g=ctx.createLinearGradient(970,0,1510,0);g.addColorStop(0,'#9acdc7');g.addColorStop(.3,'#80bcc0');g.addColorStop(1,'#65a5b4');ctx.fillStyle=g;ctx.fill();
 ctx.save();ctx.clip();for(let [off,w,c] of [[9,25,'#b3dcd1'],[30,20,'#a6d5cb'],[51,1,'#c9e7db88']]){artCurve('coast',top,bottom,off);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();}ctx.restore();
 artCurve('coast',top,bottom,-3);ctx.strokeStyle=MAP_ART.shore;ctx.lineWidth=9;ctx.stroke();artCurve('coast',top,bottom);ctx.strokeStyle='#fcf0cc';ctx.lineWidth=2;ctx.stroke();
 // The navigable channel stays 18 world units wide. Wider layers are dry banks.
 artCurve('river',top,bottom);for(let [w,c] of [[34,'#bed3aa'],[25,'#e1d9af'],[19,'#508e96'],[16,'#76b3b6'],[10,'#94ceca']]){ctx.lineWidth=w;ctx.strokeStyle=c;ctx.stroke();}
 artCurve('river',top,bottom,-5.5);ctx.lineWidth=1.3;ctx.strokeStyle='#d1e6d5';ctx.stroke();
}
function artLandClip(){coastPath();ctx.lineTo(-300,1100);ctx.lineTo(-300,-300);ctx.closePath();ctx.clip();}
function artTree(x,y,s=1,pine=false){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse({x:2,y:2,rx:5.5,ry:2.4},'#4d745725');ctx.fillStyle='#8d8260';ctx.fillRect(-.65,-5,1.3,7);
 if(pine){terrainPolygon([{x:-5,y:-2},{x:0,y:-16},{x:5,y:-2}],'#527d67');terrainPolygon([{x:0,y:-16},{x:0,y:-2},{x:5,y:-2}],'#3d685a');terrainPolygon([{x:-3.6,y:-7},{x:0,y:-17},{x:0,y:-7}],'#78a085');}
 else{ellipse({x:0,y:-7,rx:5.2,ry:6.2},'#648d6e');ellipse({x:-1.7,y:-9,rx:3.8,ry:4.5},'#86a87e');ellipse({x:2.3,y:-6,rx:2.7,ry:3.8},'#527d66');}ctx.restore();
}
function artMeadow(x,y,rx,ry,color,phase=0){ctx.beginPath();for(let i=0;i<=72;i++){let a=i*Math.PI/36,r=1+.09*Math.sin(a*3+phase)+.04*Math.cos(a*7+phase);let px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=color;ctx.fill();}
paintTerrain=function(){
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.fillStyle=MAP_ART.land;ctx.fillRect(-300,-300,2000,1400);
 ctx.save();artLandClip();
 // Connected meadows, not isolated hatching or a scattering of tiny parcels.
 for(let [x,y,rx,ry,c,p] of [[160,320,210,136,'#d8e5c9',1],[420,415,155,180,'#edf0d8',2],[870,330,235,170,'#d7e5cb',3],[100,690,235,110,'#d5e3c5',2],[770,705,240,110,'#dbe6c9',4]])artMeadow(x,y,rx,ry,c,p);
 for(let e of hills){contourPath(e);ctx.fillStyle='#b9cca0';ctx.fill();ctx.save();ctx.clip();for(let k=0;k<5;k++){contourPath(e,1-k*.17,-k*3,-k*8);ctx.fillStyle=['#c5d5ad','#cfdcb8','#d9e2c1','#e2e8cd','#e9edd8'][k];ctx.fill();}ctx.restore();}
 // Agricultural parcels stay in small districts with broad quiet ground between.
 for(let district of [{x:90,y:360},{x:360,y:480},{x:825,y:380}]){ctx.save();ctx.translate(district.x,district.y);ctx.rotate(-.12);for(let row=0;row<3;row++)for(let col=0;col<3;col++){let x=col*24,y=row*15;ctx.fillStyle=['#d2d5a0','#dce0b0','#c5d1a1','#e1d9a5'][(row*3+col)%4];ctx.fillRect(x,y,21,12);ctx.strokeStyle='#eef0d3';ctx.lineWidth=.65;for(let dy=3;dy<12;dy+=3){ctx.beginPath();ctx.moveTo(x+1,y+dy);ctx.lineTo(x+20,y+dy);ctx.stroke();}}ctx.restore();}
 // Groves are deterministic scenery and create no construction obstacles.
 for(let cluster of [{x:125,y:241,rx:88,ry:23},{x:347,y:218,rx:48,ry:21},{x:487,y:208,rx:44,ry:20},{x:846,y:263,rx:135,ry:24},{x:92,y:530,rx:46,ry:36},{x:925,y:605,rx:40,ry:24}]){
 artMeadow(cluster.x,cluster.y,cluster.rx+6,cluster.ry+5,'#b8cea6',cluster.x);
 for(let row=0;row<6;row++)for(let col=0;col<20;col++){let x=cluster.x-cluster.rx+col*cluster.rx/9.5+6*Math.sin(row*9+col*17),y=cluster.y-cluster.ry+row*cluster.ry/2.5+4*Math.cos(col*8+row*11);if(((x-cluster.x)/cluster.rx)**2+((y-cluster.y)/cluster.ry)**2>1||(Math.sin(col*37+row*91)>.64)||Math.abs(x-river(y))<40||x>coast(y)-25||mountainPolygons.some(poly=>pointInPolygon({x,y},poly)))continue;artTree(x,y,.65+.18*(1+Math.sin(col*17+row*9)),row%3!==0);}
 }
 ctx.restore();
 // Exact mountain footprints, with north-lit ridges and shaded south slopes.
 ctx.save();clipMountainValley();for(let [id,e] of mountains.entries()){
 contourPath(e);ctx.fillStyle='#9aafa0';ctx.fill();ctx.save();ctx.clip();
 const ridge=[[-1.1,.12],[-.72,-.2],[-.36,-.71],[.02,-.31],[.34,-.64],[.65,-.18],[1.12,.12]].map(([x,y])=>({x:e.x+x*e.rx,y:e.y+y*e.ry}));
 for(let i=0;i<ridge.length-1;i++){
 let a=ridge[i],b=ridge[i+1],north={x:(a.x+b.x)/2-12,y:e.y-e.ry*1.3},south={x:(a.x+b.x)/2+e.rx*.15*Math.sin(i*2.3+id),y:e.y+e.ry*(.8+.4*Math.abs(Math.sin(i*3.7+id)))};
 terrainPolygon([a,b,north],['#c5cdb8','#d8dcc6','#bac7b3','#cbd3bd','#c0cbb6','#d5dac3'][i]);
 terrainPolygon([a,b,south],['#9eb09c','#809b8d','#98ad99','#739285','#92aa95','#a6b6a0'][i]);
 terrainPolygon([a,south,{x:south.x+e.rx*.27,y:south.y+12}],'#76938355');
 }
 for(let i of [2,4]){let peak=ridge[i],a=ridge[i-1],b=ridge[i+1],left={x:peak.x+(a.x-peak.x)*.23,y:peak.y+(a.y-peak.y)*.23},right={x:peak.x+(b.x-peak.x)*.26,y:peak.y+(b.y-peak.y)*.26};terrainPolygon([left,peak,right,{x:peak.x+5,y:peak.y+13},{x:peak.x+1,y:peak.y+9},{x:peak.x-4,y:peak.y+12}],'#eef0df');}
 ctx.restore();contourPath(e);ctx.strokeStyle='#73917a';ctx.lineWidth=.7;ctx.stroke();}
 ctx.restore();artWater(-300,1100,1900);
 // Small water highlights, no screen-wide sketch lines or decorative roads.
 ctx.save();coastPath();ctx.lineTo(1900,1100);ctx.lineTo(1900,-300);ctx.closePath();ctx.clip();for(let i=0;i<60;i++){let y=-100+(i*61)%1050,x=coast(y)+90+(i*97)%420;terrainStroke([{x,y},{x:x+6,y:y-1},{x:x+16,y}],'#d2e7df55',.9);}ctx.restore();
 for(let i=0;i<30;i++){let y=235+i*13.3,x=river(y);terrainStroke([{x:x-3,y},{x:x+3,y:y-1}],'#d4e9db99',.8);}
 for(let [label,x,y,size,color] of [['北 岭 山 脉',475,48,11,'#657f6d'],['西 原',130,427,10,'#8fa184'],['东 岸 平 原',876,478,11,'#819b7c'],['南 部 丘 陵',395,664,10,'#8a9c73'],['东 海',1140,355,20,'#437b8a'],['E A S T   S E A',1140,377,7,'#598e99']])text(label,x,y,size,color);
 ctx.save();ctx.translate(river(460)+29,460);ctx.rotate(-1.4);text('澄 江',0,0,10,'#588781');ctx.restore();
 ctx.restore();
};
// Match the cached region outside its bounds as the city network grows.
drawTerrain=function(){let left=-view.x/view.scale-20,top=-view.y/view.scale-20,right=(W-view.x)/view.scale+20,bottom=(H-view.y)/view.scale+20;ctx.save();ctx.fillStyle=MAP_ART.land;ctx.fillRect(left,top,right-left,bottom-top);artWater(top,bottom,right);ctx.restore();if(!terrainCache){let cache=document.createElement('canvas');cache.width=2400;cache.height=1440;let live=ctx;try{ctx=cache.getContext('2d');ctx.scale(1.2,1.2);ctx.translate(300,200);paintTerrain();terrainCache=cache;}finally{ctx=live;}}ctx.drawImage(terrainCache,-300,-200,2000,1200);};
terrainCache=null;
