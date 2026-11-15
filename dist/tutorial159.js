'use strict';
// Sample the same rounded, lane-offset geometry that the player sees and touches.
function tutorialRoadPoints159(a,b,line){
 const length=Math.hypot(b.x-a.x,b.y-a.y)*view.scale,steps=Math.max(12,Math.min(180,Math.ceil(length/4)));
 return Array.from({length:steps+1},(_,i)=>lanePoint(a,b,line,i/steps));
}
function tutorialTrimPath159(line){
 const ids=line.stops.filter(id=>S.cities[id]?.kind!=='bridgehead');
 if(ids.length<3)return [];
 const a=S.cities[ids.at(-1)],b=S.cities[ids.at(-2)],c=S.cities[ids.at(-3)];
 const first=tutorialRoadPoints159(a,b,line),next=tutorialRoadPoints159(b,c,line);
 let travelled=0;const points=[...first];
 for(let i=1;i<next.length;i++){
  const u=next[i-1],v=next[i],length=Math.hypot(v.x-u.x,v.y-u.y)*view.scale;
  if(travelled+length>=24){let t=(24-travelled)/Math.max(.001,length);points.push({x:u.x+(v.x-u.x)*t,y:u.y+(v.y-u.y)*t});break;}
  points.push(v);travelled+=length;
 }
 return points;
}
function tutorialRestorePoint159(line,target){
 let best=null,distance=Infinity;
 for(let i=1;i<line.stops.length;i++){
  const a=S.cities[line.stops[i-1]],b=S.cities[line.stops[i]];
  if(!a||!b)continue;
  const points=tutorialRoadPoints159(a,b,line);
  for(const p of points){
   // The ring must be on a draggable section, outside either city's hit area.
   if([a,b].some(c=>Math.hypot(p.x-c.x,p.y-c.y)*view.scale<Math.max(42,radius(c)*view.scale+12)))continue;
   const d=Math.hypot(p.x-target.x,p.y-target.y);
   if(d<distance){distance=d;best=p;}
  }
 }
 return best;
}
function tutorialDrawPath159(path,ring){
 if(!path.length||!ring)return;
 const points=path.map(toScreen),r=toScreen(ring);
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#c2943a';ctx.fillStyle='#c2943a';ctx.lineWidth=2.5;ctx.setLineDash([5,5]);
 ctx.beginPath();ctx.arc(r.x,r.y,26,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);
 let travel=(performance.now()%2200)/2200*total;
 for(let i=0;i<lengths.length;i++){
  if(travel>lengths[i]){travel-=lengths[i];continue;}
  const a=points[i],b=points[i+1],t=travel/Math.max(.001,lengths[i]);
  ctx.setLineDash([]);ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,6,0,Math.PI*2);ctx.fill();break;
 }
 ctx.restore();
}
