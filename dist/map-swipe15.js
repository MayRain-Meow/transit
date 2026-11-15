'use strict';
(function(){
 const rail=$('atlas-rail');if(!rail)return;
 let drag=null,blockClickUntil=0,lastTouch=-Infinity;
 function begin(id,x,y,target,touch=false){
  if(target.closest('button,a,input,select'))return false;
  if(drag)finish(true);
  const card=target.closest('.atlas-card');
  drag={id,x,y,left:rail.scrollLeft,index:atlasSelected==='west'?1:0,dx:0,axis:null,touch,card,top:card?.scrollTop||0,snap:rail.style.scrollSnapType,behavior:rail.style.scrollBehavior};return true;
 }
 function move(x,y,e){
  const d=drag;if(!d)return;const dx=x-d.x,dy=y-d.y;
  if(!d.axis){if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;d.axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
   if(d.axis==='x'){rail.style.scrollSnapType='none';rail.style.scrollBehavior='auto';if(!d.touch)try{rail.setPointerCapture(d.id);}catch{}}
  }
  e.preventDefault();if(d.axis==='y'){if(d.card)d.card.scrollTop=d.top-dy;return;}
  d.dx=dx;rail.scrollLeft=d.left-dx;
 }
 function finish(cancelled=false){
  const d=drag;if(!d)return;drag=null;rail.style.scrollSnapType=d.snap;rail.style.scrollBehavior=d.behavior;
  if(d.touch||d.axis)blockClickUntil=performance.now()+450;
  if(d.axis==='x'){
   const threshold=Math.max(32,Math.min(64,rail.clientWidth*.14));
   const next=cancelled?d.index:Math.abs(d.dx)>=threshold?Math.max(0,Math.min(1,d.index+(d.dx<0?1:-1))):d.index;
   atlasSelect(['east','west'][next]);
  }else if(d.touch&&!d.axis&&!cancelled&&d.card)atlasSelect(d.card.dataset.map);
  if(!d.touch)try{rail.releasePointerCapture(d.id);}catch{}
 }
 // Touch has its own event stream: preventing the browser gesture from its start
 // avoids pointercancel on nested vertical card scrollers during a diagonal swipe.
 rail.addEventListener('touchstart',e=>{
  lastTouch=performance.now();if(e.touches.length!==1){finish(true);return;}
  const t=e.touches[0];if(begin(t.identifier,t.clientX,t.clientY,e.target,true))e.preventDefault();
 },{passive:false});
 rail.addEventListener('touchmove',e=>{if(!drag?.touch)return;if(e.touches.length!==1){finish(true);return;}const t=[...e.touches].find(t=>t.identifier===drag.id);if(t)move(t.clientX,t.clientY,e);},{passive:false});
 rail.addEventListener('touchend',e=>{if(!drag?.touch)return;const t=[...e.changedTouches].find(t=>t.identifier===drag.id);if(t){e.preventDefault();finish(false);}},{passive:false});
 rail.addEventListener('touchcancel',()=>{if(drag?.touch)finish(true);});
 rail.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'&&(typeof TouchEvent!=='undefined'||performance.now()-lastTouch<800))return;
  if(e.isPrimary===false){finish(true);return;}if(e.button!=null&&e.button!==0)return;
  begin(e.pointerId,e.clientX,e.clientY,e.target);
 });
 rail.addEventListener('pointermove',e=>{if(drag&&!drag.touch&&e.pointerId===drag.id)move(e.clientX,e.clientY,e);},{passive:false});
 rail.addEventListener('pointerup',e=>{if(drag&&!drag.touch&&e.pointerId===drag.id)finish(false);});
 for(const type of ['pointercancel','lostpointercapture'])rail.addEventListener(type,e=>{if(drag&&!drag.touch&&drag.id===e.pointerId)finish(true);});
 rail.addEventListener('click',e=>{if(drag?.axis||performance.now()<blockClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 rail.addEventListener('dragstart',e=>e.preventDefault());
})();
