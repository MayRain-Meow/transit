'use strict';
function syncTutorial127(){
 const t=S?.tutorial123;if(!t||draft)return;
 const l=S.lines.find(l=>l.id===t.line&&!l.retiring);if(!l)return;
 const real=ids=>ids.filter(id=>S.cities[id]&&S.cities[id].kind!=='bridgehead');
 if(t.stage==='trim-end'){
  const baseline=t.stops127||S.cities.slice(0,3).filter(c=>c.kind!=='bridgehead').map(c=>c.id);
  const missing=real(baseline).filter(id=>!l.stops.includes(id));
  if(missing.length&&real(l.stops).length>=2){t.end=missing[0];t.stage='restore-end';S.paused=true;save();}
  else if(!t.stops127)t.stops127=[...l.stops];
 }else if(t.stage==='restore-end'&&l.stops.includes(t.end)&&real(l.stops).length>=3){t.stage='wait';S.paused=interruptionPending();save();}
}
const commitBefore127=commitDraft;
commitDraft=function(...args){
 const t=S.tutorial123,stage=t?.stage,line=t&&S.lines.find(l=>l.id===t.line),before=line&&[...line.stops],d=draft;
 commitBefore127(...args);
 if(d&&!draft&&t&&stage==='trim-end'&&d.original===t.line){
  const after=S.lines.find(l=>l.id===t.line),missing=before?.filter(id=>S.cities[id]?.kind!=='bridgehead'&&!after?.stops.includes(id));
  if(after&&!after.retiring&&after.stops.filter(id=>S.cities[id]?.kind!=='bridgehead').length>=2&&missing?.length){t.end=missing[0];t.stage='restore-end';S.paused=true;}
 }
 syncTutorial127();tutorialUI123();save();
};
const uiBefore127=tutorialUI123;
tutorialUI123=function(){syncTutorial127();uiBefore127();const t=S?.tutorial123;if(t?.stage==='restore-end'&&!atlasMenuOpen&&!modalOpen){const c=S.cities[t.end];guide123.innerHTML='<b>把刚移除的城市接回线路</b><p>按住现有线段，拉到'+escapeHTML(c?.name||'刚移除的城市')+'，让它重新成为停靠点，再点下方“应用修改”。如果删的是末站，也可以从线路端点拉回该城市。</p><button onclick="skipTutorial123()">跳过引导</button>';}};
function saveContinue127(){if(!manualSave123())return false;closeModal();S.paused=exitWasPaused123||interruptionPending();last=performance.now();updateUI();save();return true;}
// Old planted fields remain accessible for harvest/history, but cannot be replanted below medium size.
farmEligible=function(c){return !!c&&!c.removed&&c.kind!=='bridgehead'&&c.shape===0&&(c.size>=1||!!c.farm);};
const plantBefore127=plantFarm;
plantFarm=function(id){const c=S.cities[id];if(c&&c.size<1)return toast('农田需要中级及以上居住城市');return plantBefore127(id);};
// Reconnection demonstration starts on the segment, matching the user's video.
const renderBefore127=render;
render=function(){
 const t=S?.tutorial123,restore=t?.stage==='restore-end',stageFn=tutorialStage123;
 if(restore)tutorialStage123=function(){const s=stageFn();return s==='restore-end'?null:s;};
 try{renderBefore127();}finally{tutorialStage123=stageFn;}
 if(!restore||draft||atlasMenuOpen||modalOpen)return;
 const l=S.lines.find(l=>l.id===t.line),c=S.cities[t.end];if(!l||!c)return;
 let best=null,d=Infinity;for(let i=1;i<l.stops.length;i++){const a=S.cities[l.stops[i-1]],b=S.cities[l.stops[i]],dist=segDist(c,a,b);if(dist<d){d=dist;best={x:(a.x+b.x)/2,y:(a.y+b.y)/2};}}
 if(!best)return;const a={x:view.x+best.x*view.scale,y:view.y+best.y*view.scale},b={x:view.x+c.x*view.scale,y:view.y+c.y*view.scale};
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#c2943a';ctx.fillStyle='#c2943a';ctx.lineWidth=2.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(a.x,a.y,24,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);const u=(performance.now()%1800)/1800;ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,6,0,Math.PI*2);ctx.fill();ctx.restore();
};
syncTutorial127();tutorialUI123();
