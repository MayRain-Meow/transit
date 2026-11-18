'use strict';
// Broad ocean bends are sampled and checked before acceptance. Every consumer
// (travel, weather, drawing, hit testing and vessel pose) uses the resulting path.
const curvedSeaMemo164=new Map();
function seaGeometry164(points){let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);return {points,length};}
function seaSafe164(points){return points.every(sea16)&&points.slice(1).every((p,i)=>seaSegment16(points[i],p));}
function seaQuadratic164(a,b,c,n=32){return Array.from({length:n+1},(_,i)=>{let t=i/n;return {x:(1-t)**2*a.x+2*(1-t)*t*b.x+t*t*c.x,y:(1-t)**2*a.y+2*(1-t)*t*b.y+t*t*c.y};});}
function roundOcean164(path){
 if(!path||path.points.length<2)return path;
 let raw=path.points;
 if(raw.length===2){let [a,b]=raw,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<30)return path;let best=null,score=-Infinity;
  for(let factor of [1,.6,.3]){for(let sign of [1,-1]){let bend=Math.min(260,len*.22)*factor,mid={x:(a.x+b.x)/2-dy/len*bend*sign,y:(a.y+b.y)/2+dx/len*bend*sign},curve=seaQuadratic164(a,mid,b,48);if(!seaSafe164(curve))continue;let clearance=Math.min(...curve.slice(4,-4).filter((_,i)=>i%4===0).map(p=>shore16(p).d));if(clearance>score){score=clearance;best=curve;}}if(best)break;}return best?seaGeometry164(best):path;
 }
 let pushed=raw.map(p=>({...p}));
 for(let i=1;i<raw.length-1;i++){let p=raw[i],shore=shore16(p),d=Math.hypot(p.x-shore.x,p.y-shore.y);if(d>=140||d<.001)continue;let q={x:shore.x+(p.x-shore.x)/d*140,y:shore.y+(p.y-shore.y)/d*140};if(seaSafe164([pushed[i-1],q,raw[i+1]]))pushed[i]=q;}
 let points=[pushed[0]];
 for(let i=1;i<pushed.length-1;i++){let a=pushed[i-1],b=pushed[i],c=pushed[i+1],ab=Math.hypot(a.x-b.x,a.y-b.y),bc=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(260,ab*.44,bc*.44),accepted=null;
  for(let tries=0;tries<5&&r>3;tries++,r*=.5){let p={x:b.x+(a.x-b.x)*r/ab,y:b.y+(a.y-b.y)*r/ab},q={x:b.x+(c.x-b.x)*r/bc,y:b.y+(c.y-b.y)*r/bc},curve=seaQuadratic164(p,b,q);if(seaSafe164([points.at(-1),...curve,c])){accepted=curve;break;}}
  points.push(...(accepted||[b]));
 }
 points.push(pushed.at(-1));return seaSafe164(points)?seaGeometry164(points):path;
}
const oceanPathBefore164=oceanPath16;
oceanPath16=function(a,b){if(!a?.harbor||!b?.harbor)return null;let reversed=a.id>b.id,aa=reversed?b:a,bb=reversed?a:b,key=[aa.id,bb.id,aa.harbor.x,aa.harbor.y,bb.harbor.x,bb.harbor.y].join('|');if(!curvedSeaMemo164.has(key)){let path=roundOcean164(oceanPathBefore164(aa,bb));if(curvedSeaMemo164.size>=512)curvedSeaMemo164.clear();curvedSeaMemo164.set(key,{forward:path,backward:path&&{...path,points:[...path.points].reverse()}});}let paths=curvedSeaMemo164.get(key);return reversed?paths.backward:paths.forward;};
const clearSeaBefore164=clearMarinePaths16;
clearMarinePaths16=function(...a){curvedSeaMemo164.clear();displaySeaMemo163={owner:null,scale:null,paths:new Map()};return clearSeaBefore164(...a);};
const spawnCasinoBefore164=spawnCity;
spawnCity=function(...a){let r=spawnCasinoBefore164(...a);if(isOcean16())ensureCasino164();return r;};
if(isOcean16()&&ensureCasino164())save();
// Frame the actual marine route, including its offshore bends and port badges.
const selectionPointsBefore164=uxSelectionPoints;
uxSelectionPoints=function(){let l=selected?.type==='line'?S.lines.find(l=>l.id===selected.id):null;if(!l||!isMarine16(l.type))return selectionPointsBefore164();let points=l.stops.map(id=>S.cities[id]).filter(Boolean);for(let i=1;i<l.stops.length;i++){let path=displaySeaPath163(S.cities[l.stops[i-1]],S.cities[l.stops[i]]);if(path)points.push(...path.points);}if(!points.length)return [];let pad=22/Math.max(.15,view.scale),left=Math.min(...points.map(p=>p.x))-pad,right=Math.max(...points.map(p=>p.x))+pad,top=Math.min(...points.map(p=>p.y))-pad,bottom=Math.max(...points.map(p=>p.y))+pad;return [{x:left,y:top},{x:right,y:top},{x:left,y:bottom},{x:right,y:bottom}];};
