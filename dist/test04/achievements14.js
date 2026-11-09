'use strict';
const ACHIEVEMENTS14=[
 ['tutorial','初任调度员','完成全部新手引导（跳过不计）。','bronze','初次建设',1],
 ['tunnel','穿山而行','通过隧道送达一位游客。','silver','初次建设',1],
 ['loop100','绕城一周','单局通过公交环线累计送达100人。','bronze','初次建设',100],
 ['emu','铁路时代','动车首次送达游客。','silver','初次建设',1],
 ['rail','风驰电掣','高铁首次送达游客。','gold','初次建设',1],
 ['air','云端航线','飞机首次送达游客。','gold','初次建设',1],
 ['day30','初具规模','单局存活30天。','bronze','生存挑战',30],
 ['day100','百日经营','单局存活100天。','silver','生存挑战',100],
 ['day180','半年风雨','单局存活180天。','gold','生存挑战',180],
 ['day365','四季通途','单局存活365天。','gold','生存挑战',365],
 ['total1000','千人旅途','加入成就系统后，跨对局累计送达1,000人。','bronze','运输经营',1000],
 ['total10000','万人往来','加入成就系统后，跨对局累计送达10,000人。','silver','运输经营',10000],
 ['transfer','换乘有方','单局完成100次有效换乘。','silver','运输经营',100],
 ['orderly','忙而有序','持续运营30天，城市均未进入满员倒计时。','gold','运输经营',30],
 ['remote','远方来客','将偏远城市出发的游客送达目的地。','bronze','城市探索',1],
 ['region','新城成群','第二城市群达到4城，并有线路实际运营。','silver','城市探索',1],
 ['east','东部经营者','在东部单局存活100天。','silver','城市探索',100],
 ['west','西部经营者','在西部单局存活100天。','silver','城市探索',100],
 ['task','初次赴约','完成第一份翻牌任务。','bronze','城市活动',1],
 ['five','五星之约','成功完成一份五星任务。','gold','城市活动',1],
 ['six','六星盛会','成功完成一份六星任务。','gold','城市活动',1],
 ['quake','重新出发','修复地震受损通道，再经该通道送达游客。','gold','灾后恢复',1],
 ['shareholder','超级大股东','持有任意一只股票总股本的10%。','diamond','金融传奇',10],
 ['loop6','环城巴士','一条公交环线连接至少6座不同城市，并完成一整圈运营。','bronze','交通挑战',1]
].map(([id,name,description,grade,category,target])=>({id,name,description,grade,category,target}));
const ACH_KEY14='transit-achievements-v1';
let achievements14=(()=>{try{let x=JSON.parse(localStorage.getItem(ACH_KEY14));if(x?.version===1)return x;}catch{}return {version:1,nextRun:1,total:0,runs:{},best:{},unlocked:{},seen:{}};})();
let achDirty14=false,achBusy14=false,achClock14=0,achPending14=[],arrivalContext14=null;
function achRun14(){if(!S.achievements14){let n=achievements14.nextRun++;S.achievements14={id:Date.now().toString(36)+'-'+n,baseline:S.delivered||0,transfers:0,loopDelivered:0,repaired:{},lastDelivery:S.day,cleanStart:S.day};achDirty14=true;}let r=S.achievements14;if(!achievements14.runs[r.id]){achievements14.runs[r.id]={delivered:r.baseline};achDirty14=true;}return r;}
function achPersist14(){if(!achDirty14)return;try{localStorage.setItem(ACH_KEY14,JSON.stringify(achievements14));achDirty14=false;}catch{}}
function achProgress14(id,value){if(!Number.isFinite(value)||value<0)return;if(value>(achievements14.best[id]||0)){achievements14.best[id]=value;achDirty14=true;}let a=ACHIEVEMENTS14.find(a=>a.id===id);if(a&&value>=a.target&&!achievements14.unlocked[id]){achievements14.unlocked[id]={at:Date.now(),map:S.mapId,day:Math.floor(S.day)};achDirty14=true;achPending14.push(id);}}
function achSync14(){if(achBusy14||!S||runtimeFault13)return;achBusy14=true;try{let r=achRun14(),saved=achievements14.runs[r.id],delivered=S.delivered||0;if(delivered>saved.delivered){achievements14.total+=delivered-saved.delivered;saved.delivered=delivered;achDirty14=true;}
 let records=atlasBest(),day=Math.floor(S.day);for(let map of ['east','west']){let best=Number(records[map]);if(Number.isFinite(best)&&best>=0){day=Math.max(day,Math.floor(best));achProgress14(map,Math.floor(best));}}for(let id of ['day30','day100','day180','day365'])achProgress14(id,day);if(S.mapId==='east'||S.mapId==='west')achProgress14(S.mapId,Math.floor(S.day));
 if(S.tutorial123?.completed129)achProgress14('tutorial',1);
 achProgress14('total1000',achievements14.total);achProgress14('total10000',achievements14.total);achProgress14('transfer',r.transfers);achProgress14('loop100',r.loopDelivered);
 achProgress14('orderly',Math.floor(Math.max(0,S.day-r.cleanStart)));
 for(let e of S.activityCards?.history||[])if(e.success){achProgress14('task',1);if(e.star===5)achProgress14('five',1);if(e.star===6)achProgress14('six',1);}
 for(let [i,s] of (S.financial?.market?.stocks||[]).entries())if(MARKET_STOCKS[i]?.total>0)achProgress14('shareholder',s.shares/MARKET_STOCKS[i].total*100);
 let regions=S.cityRegions||[];for(let region of regions)if(region.id>0){let members=realCities().filter(c=>!c.dormant&&!c.removed&&!c.outlying&&c.regionId===region.id);if(members.length>=4&&S.lines.some(l=>!l.retiring&&members.some(c=>l.stops.includes(c.id))&&S.vehicles.some(v=>v.line===l.id&&!v.retired)))achProgress14('region',1);}
 achPersist14();achEntry14();
 }finally{achBusy14=false;}}
function achEntry14(){let b=$('achievements-entry14');if(!b)return;let n=Object.keys(achievements14.unlocked).length,txt=n+' / '+ACHIEVEMENTS14.length;let small=b.querySelector('small');if(!small)return;if(small.textContent!==txt)small.textContent=txt;b.classList.toggle('has-new',Object.keys(achievements14.unlocked).some(id=>!achievements14.seen[id]));}
function achBadge14(grade){let p=grade==='diamond'?'M24 3 43 19 24 49 5 19Z': 'M24 3 42 12 39 34 24 49 9 34 6 12Z';return '<svg class="ach-badge14 '+grade+'" viewBox="0 0 48 54" aria-hidden="true"><path d="'+p+'" fill="currentColor" opacity=".17"/><path d="'+p+'" fill="none" stroke="currentColor" stroke-width="2"/>'+(grade==='diamond'?'<path d="M5 19H43M15 19 24 49 33 19 24 3Z" fill="none" stroke="currentColor"/>':'<path d="m24 13 3.5 7 8 1-6 6 1.5 8-7-4-7 4 1.5-8-6-6 8-1Z" fill="currentColor"/>')+'</svg>';}
function showAchievements14(){achSync14();for(let id of Object.keys(achievements14.unlocked))achievements14.seen[id]=true;achDirty14=true;achPersist14();achEntry14();let html='<button id="ach-close14" onclick="closeModal()" aria-label="关闭成就">×</button><div class="modal-head"><div><span class="eyebrow">旅途荣誉</span><h2>成就</h2></div><button class="close" onclick="closeModal()" aria-label="关闭成就">×</button></div><div class="ach-total14">'+Object.keys(achievements14.unlocked).length+' / '+ACHIEVEMENTS14.length+'</div><p class="ach-intro14">跨对局保留 · 重新开始不清空。铜、银、金奖章，以及唯一钻石成就「超级大股东」。成就不提供现金或运力奖励。</p>';for(let category of new Set(ACHIEVEMENTS14.map(a=>a.category))){html+='<h3 class="ach-category14">'+category+'</h3><div class="ach-list14">';for(let a of ACHIEVEMENTS14.filter(a=>a.category===category)){let u=achievements14.unlocked[a.id],v=Math.min(a.target,achievements14.best[a.id]||0);html+='<section class="ach-row14 '+(u?'unlocked':'locked')+(a.grade==='diamond'?' diamond-row':'')+'">'+achBadge14(a.grade)+'<div><h3>'+a.name+'</h3><p>'+a.description+'</p><small>'+({bronze:'铜牌',silver:'银牌',gold:'金牌',diamond:'唯一钻石牌'}[a.grade])+' · '+(u?'已解锁':a.target===1?'未解锁':(a.id==='shareholder'?(Math.floor(v*10000)/10000).toFixed(4):Math.floor(v))+' / '+a.target+(a.id==='shareholder'?'%':''))+'</small><div class="ach-progress14"><i style="width:'+Math.min(100,v/a.target*100)+'%"></i></div></div></section>';}html+='</div>';}document.body.classList.add('achievements-open14');openModal(html);document.body.classList.add('achievements-open14');}
const achCloseBefore14=closeModal;closeModal=function(...args){let r=achCloseBefore14(...args);document.body.classList.remove('achievements-open14');return r;};
const achSaveBefore14=save;save=function(...args){achSync14();return achSaveBefore14(...args);};
const achTripBefore14=completeTrip;
completeTrip=function(p,dest){let fresh=!p.achievementSettled14;p.achievementSettled14=true;let r=achTripBefore14(p,dest);if(fresh){let a=achRun14();a.lastDelivery=S.day;let l=arrivalContext14;if(l){if(['emu','rail','air'].includes(l.type))achProgress14(l.type,1);if(isLoop130(l))a.loopDelivered++;}if(p.achTunnel14)achProgress14('tunnel',1);if(p.achRepaired14)achProgress14('quake',1);if(S.cities[p.origin]?.remote||S.cities[p.origin]?.outlying)achProgress14('remote',1);}return r;};
const achSegmentBefore14=recordSegment;recordSegment=function(p,a,b,type){let r=achSegmentBefore14(p,a,b,type);if(type!=='air'&&mountainCrossings(a,b).length)p.achTunnel14=true;if(achRun14().repaired[key(a,b,type)])p.achRepaired14=true;return r;};
function achCircuit14(v,l){if(l.type!=='bus'||!isLoop130(l)||v.recall||v.retired||l.retiring||v.stops)return;let ids=l.stops.slice(0,-1),n=ids.length,i=v.index%n,signature=l.stops.join(','),a=v.achCircuit14;if(!a||a.signature!==signature||a.dir!==v.dir){v.achCircuit14={signature,dir:v.dir,start:i,last:i,edges:0};return;}if(i===a.last)return;if(i!==(a.last+v.dir+n)%n){v.achCircuit14={signature,dir:v.dir,start:i,last:i,edges:0};return;}a.last=i;a.edges++;if(i===a.start&&a.edges>=n){a.edges=0;if(new Set(ids.filter(id=>S.cities[id]?.kind!=='bridgehead'&&!S.cities[id]?.removed)).size>=6)achProgress14('loop6',1);}}
const achArrivalBefore14=arrival;arrival=function(v,l){let prior=arrivalContext14;arrivalContext14=l;for(let p of v.people)if(Object.keys(p.legs||{}).length)p.achRidden14=l.id;achCircuit14(v,l);try{let r=achArrivalBefore14(v,l);for(let p of v.people){if(p.achRidden14!=null&&p.achRidden14!==l.id&&p.achBoard14!==l.id)achRun14().transfers++;p.achBoard14=l.id;}return r;}finally{arrivalContext14=prior;}};
const closuresBefore14=settleClosures;settleClosures=function(...args){let due=Object.entries(S.blockages).filter(([,b])=>b.cause==='quake'&&b.status==='repairing'&&S.day>=b.until).map(([k])=>k),r=closuresBefore14(...args);for(let k of due)if(!S.blockages[k])achRun14().repaired[k]=true;return r;};
const achTickBefore14=tick;tick=function(dt){let r=achRun14();if(realCities().some(c=>!c.dormant&&c.warning>0)||!S.vehicles.some(v=>!v.retired)||S.day-r.lastDelivery>3)r.cleanStart=S.day;let result=achTickBefore14(dt);if(realCities().some(c=>!c.dormant&&c.warning>0))r.cleanStart=S.day;achClock14+=dt;if(achClock14>=1){achClock14=0;achSync14();if(achPending14.length&&!atlasMenuOpen&&!modalOpen&&!draft&&!bridgeDraft&&!pointers.size&&!$('toast').classList.contains('show')){let id=achPending14.shift();toast('成就解锁 · '+ACHIEVEMENTS14.find(a=>a.id===id).name);}}return result;};
const achResetBefore14=reset;reset=function(...args){let r=achResetBefore14(...args);achClock14=0;achSync14();return r;};
$('atlas-back')?.remove();for(let el of document.querySelectorAll('.atlas-medal'))el.remove();
let achButton14=document.createElement('button');achButton14.id='achievements-entry14';achButton14.type='button';achButton14.setAttribute('aria-label','查看成就');achButton14.innerHTML=achBadge14('gold')+'<span>成就</span><small>0 / 24</small>';achButton14.onclick=showAchievements14;document.querySelector('.atlas-heading')?.appendChild(achButton14);achSync14();
