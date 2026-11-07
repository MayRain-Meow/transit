'use strict';
// Deletion means pulling back along the existing route past the preceding town.
// Pulling into empty space alone never removes a town or a segment.
function cityEdit125(p){let g=gesture;if(!draft||!g?.baseStops||!g.c)return false;let base=g.baseStops,origin=g.c,target=hitCity(p),terminal=g.cityIndex===0||g.cityIndex===base.length-1;draft.stops=[...base];draft.pointer=null;delete draft.stopRemoval;delete draft.extensionPointer;
 if(target?.id===origin.id){g.trimKeep125=null;g.trimTouched125=null;draftBar();$('drawtext').textContent='回到原位 · 松手不修改线路';return true;}
 if(target&&!base.includes(target.id)&&target.kind!=='bridgehead'){let slot=g.cityIndex===0?0:g.cityIndex+1;draft.stops.splice(slot,0,target.id);g.trimKeep125=null;draftBar();$('drawtext').textContent='接入 '+target.name+' · 确认后应用';return true;}
 if(!terminal){draftBar();$('drawtext').textContent='延伸请拖向新城市；删末段请沿末端回拉超过上一站';return true;}
 let reverse=g.cityIndex===0,ordered=reverse?[...base].reverse():[...base],keep=g.trimKeep125??ordered.length-1;
 while(keep>0){let prior=keep-1;while(prior>=0&&S.cities[ordered[prior]].kind==='bridgehead')prior--;if(prior<0||ordered.slice(0,prior+1).filter(id=>S.cities[id].kind!=='bridgehead').length<2)break;let b=S.cities[ordered[prior]],a=S.cities[ordered[prior+1]],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)break;let beyond=((p.x-b.x)*dx+(p.y-b.y)*dy)/len*view.scale,lateral=Math.abs((p.x-b.x)*dy-(p.y-b.y)*dx)/len*view.scale;if(Math.hypot(p.x-b.x,p.y-b.y)*view.scale<=Math.max(20,radius(b)*view.scale+4))g.trimTouched125=b.id;let straight=beyond>=8&&lateral<=Math.max(24,radius(b)*view.scale+8),turn=false,next=S.cities[ordered[prior-1]];if(g.trimTouched125===b.id&&next){let nx=next.x-b.x,ny=next.y-b.y,nl=Math.hypot(nx,ny);turn=nl>0&&((p.x-b.x)*nx+(p.y-b.y)*ny)/nl*view.scale>=8&&Math.abs((p.x-b.x)*ny-(p.y-b.y)*nx)/nl*view.scale<=Math.max(24,radius(b)*view.scale+8);}if(!straight&&!turn)break;keep=prior;g.trimTouched125=null;}
 if(keep<ordered.length-1){g.trimKeep125=keep;let shortened=ordered.slice(0,keep+1);draft.stops=reverse?shortened.reverse():shortened;draft.stopRemoval={before:[...base],name:origin.name,endRemoval:true,backtrack125:true,removedId:origin.id};draftBar();$('drawtext').textContent='已回拉越过上一站 · 虚影路段将移除，点应用修改确认';}
 else{draft.extensionPointer={city:origin.id,p};draft.pointer=p;draftBar();$('drawtext').textContent='拖向新城市延伸；沿原线回拉越过上一站，预览删路';}return true;
}
// Old helper can no longer apply the former drag-away deletion behavior.
endpointDrag124=cityEdit125;
function syncTutorial125(){let t=S.tutorial123;if(!t||t.stage==='done')return;if(t.stage==='view'&&draft)t.stage='build';if(['view','build'].includes(t.stage)&&!draft){let l=S.lines.find(l=>!l.retiring&&l.stops.filter(id=>S.cities[id]?.kind!=='bridgehead').length>=3);if(l){t.line=l.id;t.end=l.stops.at(-1);t.stage='trim-end';S.paused=true;}}}
const uiBefore125=tutorialUI123;
tutorialUI123=function(){syncTutorial125();uiBefore125();let t=S.tutorial123,s=t?.stage;if(!t||s==='done'||atlasMenuOpen||modalOpen)return;
 let title,text;if(s==='build'){let n=draft?.stops.filter(id=>S.cities[id]?.kind!=='bridgehead').length||0,cost=draft&&draftCost();if(n>=2&&!cost.invalid){title='核对报价，确认建设';text=(n<3?'已连接两城，可继续拖向第三城；':'三城已连接。')+'核对下方报价，点圈出的“建设”按钮。';}else{title='拖动连接城市';text='从一座城市拖到另一座，再接入第三座。圈与移动圆点会示范拉线方向。';}}
 else if(s==='trim-end'){title=draft?.stopRemoval?.backtrack125?'确认删除预览':'沿原线回拉，越过上一站';text=draft?.stopRemoval?.backtrack125?'虚影部分是将删除的路段。点下方圈出的“应用修改”，原线路才会改变。':'按住末端沿已有线路往回拖，经过上一座城市后再继续拉过一点。拖向空白处不会删路。';}
 if(title){guide123.hidden=false;guide123.innerHTML='<b>'+title+'</b><p>'+text+'</p><button onclick="skipTutorial123()">跳过引导</button>';}
 // One active cue: once a quote is ready, the button replaces the city ring.
 document.documentElement.classList.toggle('tutorial-quote125',!!draft&&!$('drawdone').disabled);
};
const draftBefore125=draftBar;
draftBar=function(){draftBefore125();tutorialUI123();};
// Replace the former outward tutorial arrow with a route-following demonstration.
const renderBefore125=render;
render=function(){let t=S.tutorial123,s=t?.stage;let ready=!!draft&&!$('drawdone').disabled;
 // Previous cue renderers share tutorialStage123; suppress only their visual cue, not game state.
 const originalStage=tutorialStage123;tutorialStage123=function(){let stage=originalStage();return stage==='trim-end'||ready&&['view','build'].includes(stage)?null:stage;};
 try{renderBefore125();}finally{tutorialStage123=originalStage;}cueButton124();
 if(s!=='trim-end'||draft?.stopRemoval?.backtrack125||atlasMenuOpen||modalOpen)return;let l=S.lines.find(l=>l.id===t.line);if(!l)return;let cities=l.stops.map(id=>S.cities[id]).filter(c=>c.kind!=='bridgehead'),a=cities.at(-1),b=cities.at(-2);if(!a||!b)return;let older=cities.at(-3),dx=older?older.x-b.x:b.x-a.x,dy=older?older.y-b.y:b.y-a.y,len=Math.hypot(dx,dy),beyond={x:b.x+dx/len*24/view.scale,y:b.y+dy/len*24/view.scale},points=[a,b,beyond];ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#c2943a';ctx.fillStyle='#c2943a';ctx.lineWidth=2.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(view.x+a.x*view.scale,view.y+a.y*view.scale,26,0,Math.PI*2);ctx.stroke();ctx.beginPath();for(let [i,c] of points.entries())i?ctx.lineTo(view.x+c.x*view.scale,view.y+c.y*view.scale):ctx.moveTo(view.x+c.x*view.scale,view.y+c.y*view.scale);ctx.stroke();ctx.setLineDash([]);let u=(performance.now()%2000)/2000,c=u<.85?{x:a.x+(b.x-a.x)*u/.85,y:a.y+(b.y-a.y)*u/.85}:{x:b.x+(beyond.x-b.x)*(u-.85)/.15,y:b.y+(beyond.y-b.y)*(u-.85)/.15};ctx.beginPath();ctx.arc(view.x+c.x*view.scale,view.y+c.y*view.scale,6,0,Math.PI*2);ctx.fill();ctx.restore();};
const startBefore125=startAtlasMap;
startAtlasMap=function(){startBefore125();syncTutorial125();tutorialUI123();};$('atlas-start').onclick=()=>{atlasRestart=false;startAtlasMap();};
syncTutorial125();tutorialUI123();
