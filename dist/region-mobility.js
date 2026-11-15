'use strict';
const REGION_MOBILITY={start:.03,max:.30,matureDays:180,bonus:{bus:2,emu:2,rail:1,air:1}};
function regionMobilityState(){
 return S.regionMobility??={version:1,lastSync:S.day,pairs:{},expansionEarned:false,applied:{bus:0,emu:0,rail:0,air:0}};
}
function regionPairKey(a,b){return [a,b].sort((x,y)=>x-y).join(':');}
function regionPair(a,b){let state=regionMobilityState(),key=regionPairKey(a,b);return state.pairs[key]??={a:Math.min(a,b),b:Math.max(a,b),operatingDays:0,connected:false,delivered:0};}
function regionPairShare(a,b){let pair=regionPair(a,b),u=Math.max(0,Math.min(1,pair.operatingDays/REGION_MOBILITY.matureDays));return Math.min(REGION_MOBILITY.max,REGION_MOBILITY.start+(REGION_MOBILITY.max-REGION_MOBILITY.start)*u);}
function regionalNetworkLinks(){
 const parents=new Map(),regions=cityRegions();
 const root=id=>{if(!parents.has(id))parents.set(id,id);let p=parents.get(id);if(p!==id)parents.set(id,root(p));return parents.get(id);};
 const join=(a,b)=>parents.set(root(a),root(b));
 const fleet=new Map();for(let v of S.vehicles){if(v.retired||v.recall)continue;if(!fleet.has(v.line))fleet.set(v.line,[]);fleet.get(v.line).push(v);}
 for(let l of S.lines){if(l.retiring)continue;for(let v of fleet.get(l.id)||[]){
  let {lo,hi}=serviceRange(v,l),previous=null;
  for(let i=lo;i<=hi;i++){
   let c=S.cities[l.stops[i]];if(!c){previous=null;continue;}
   if(i>lo){let a=S.cities[l.stops[i-1]];if(!a||!canEnter(a,c,l.type)||l.type==='air'&&(weatherFactor(a,'air')===0||weatherFactor(c,'air')===0))previous=null;}
   if(c.dormant||c.removed||!serves(v,l,i)||!sameComponent(v,l,i))continue;
   root(c.id);if(previous!==null)join(previous,c.id);previous=c.id;
  }
 }}
 const components=new Map();for(let c of realCities()){if(c.dormant||c.removed||!parents.has(c.id))continue;let key=root(c.id);if(!components.has(key))components.set(key,new Set());components.get(key).add(c.regionId);}
 const links=new Set();for(let ids of components.values())for(let a of ids)for(let b of ids)if(a<b)links.add(regionPairKey(a,b));
 // Create new pair clocks only after both region records exist.
 for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++)regionPair(regions[i].id,regions[j].id);
 return links;
}
function updateRegionalRelations(force=false){
 let state=regionMobilityState(),elapsed=S.day-state.lastSync;
 if(!force&&elapsed>=0&&elapsed<1/24)return;
 // Credit the previously sampled service state, never a newly built connection
 // for days in which it did not exist. Sampling resolution: one game hour.
 if(elapsed>0)for(let p of Object.values(state.pairs))if(p.connected)p.operatingDays+=elapsed;
 let links=regionalNetworkLinks();for(let [key,p] of Object.entries(state.pairs))p.connected=links.has(key);state.lastSync=S.day;
}
function updateRegionalExpansion(){
 let state=regionMobilityState();state.circleAwards??={};let count=0,newAwards=0;
 for(let r of cityRegions())if(r.id>0){count++;if(!state.circleAwards[r.id]){state.circleAwards[r.id]=true;newAwards++;}}
 state.expansionEarned=count>0;let changed=false;
 for(let [type,mult] of Object.entries(REGION_MOBILITY.bonus))if(S.unlocked.includes(type)){
  let target=count*mult,add=target-(state.applied[type]||0);if(add>0){S.limits[type]=(S.limits[type]||0)+add;state.applied[type]=target;changed=true;}
 }
 if(newAwards)toast('新城市圈 · 公交＋2、动车＋2、高铁＋1、航空＋1，未解锁类型稍后补发');
 if(changed||newAwards)save();
}
function weightedRegionDestination(choices,origin){
 let weights=choices.map(d=>Math.pow(1.45,d.stage??d.size)*(origin.shape===0?(d.shape===2||d.shape===3?2.6:1):d.shape===1?1.9:d.shape===2?1.4:1));
 let roll=Math.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<choices.length;i++){roll-=weights[i];if(roll<=0)return choices[i];}return choices.at(-1);
}
const ordinaryPassengerBeforeRegions=newPassenger;
newPassenger=function(c){
 if(c.dormant||c.removed||c.kind==='bridgehead')return;let regions=cityRegions();
 if(regions.length<2)return ordinaryPassengerBeforeRegions(c);
 let choices=realCities().filter(d=>!d.dormant&&!d.removed&&d.id!==c.id&&(d.color!==c.color||d.shape!==c.shape));
 if(!choices.length)return;
 let local=choices.filter(d=>d.regionId===c.regionId),byRegion=new Map();
 for(let d of choices){if(d.regionId===c.regionId)continue;if(!byRegion.has(d.regionId))byRegion.set(d.regionId,[]);byRegion.get(d.regionId).push(d);}
 let foreign=[...byRegion.keys()],share=foreign.length?Math.max(...foreign.map(id=>regionPairShare(c.regionId,id))):0,targetRegion=c.regionId,pool=local;
 if(foreign.length&&(!local.length||Math.random()<share)){
  let weights=foreign.map(id=>regionPairShare(c.regionId,id)),roll=Math.random()*weights.reduce((a,b)=>a+b,0);targetRegion=foreign.at(-1);
  for(let i=0;i<foreign.length;i++){roll-=weights[i];if(roll<=0){targetRegion=foreign[i];break;}}
  pool=byRegion.get(targetRegion);
 }
 // A lone frontier sends its small, ramped demand to existing circles.
 if(!pool.length)return;
 let d=weightedRegionDestination(pool,c),p={id:S.nextP++,origin:c.id,originRegion:c.regionId,dest:d.id,destRegion:targetRegion,color:d.color,shape:d.shape,wait:0,ready:0,journey:0,legs:{}};
 c.q.push(p);registerServicePassenger(p);
};
const matchingBeforeRegions=matchesDestination;
matchesDestination=function(c,p){if(p.destRegion!==undefined&&p.schoolId===undefined&&!p.eventId&&!p.cardId&&c.regionId!==p.destRegion)return false;return matchingBeforeRegions(c,p);};
const labelBeforeRegions=passengerLabel;
passengerLabel=function(p){let base=labelBeforeRegions(p);if(p.destRegion===undefined||p.schoolId!==undefined||p.eventId||p.cardId)return base;let r=cityRegions().find(r=>r.id===p.destRegion);return (p.originRegion===p.destRegion?'本圈 · ':'跨圈 → ')+escapeHTML(r?.name||'城圈')+' · '+base;};
const focusBeforeRegions=focusPassenger;
focusPassenger=function(kind,id,color,shape,regionId=null){
 if(kind!=='normal'||regionId===null)return focusBeforeRegions(kind,id,color,shape);
 let target=realCities().find(c=>!c.dormant&&!c.removed&&c.regionId===regionId&&c.color===color&&c.shape===shape);
 if(!target)return toast('当前目标城圈没有开放的同类目的地');
 selected={type:'demand',id:target.id,color,shape,regionId};showDetails();toast('已标记目标城圈 · 圈内同色同形城市均可接收');
};
const completedBeforeRegions=completeTrip;
completeTrip=function(p,destination){completedBeforeRegions(p,destination);if(p.destRegion!==undefined&&p.originRegion!==p.destRegion)regionPair(p.originRegion,p.destRegion).delivered++;};
const unlockBeforeRegions=checkUnlocks;
checkUnlocks=function(){unlockBeforeRegions();updateRegionalExpansion();};
const tickBeforeRelations=tick;
tick=function(dt){updateRegionalExpansion();updateRegionalRelations();tickBeforeRelations(dt);updateRegionalExpansion();};
function regionalRelationsPanel(){
 let state=regionMobilityState(),regions=cityRegions();return `<section class="infra-card"><h3>城圈往来 · 逐步建立联系</h3><p>普通出行以本圈为主；单城外围圈尚无本圈目的地时，低量客流前往其他圈。两圈初期跨圈意向约3%，有车、可通达的运营时间累计后逐渐增加，180天达到30%；多个目标圈共享对外比例，不随城圈数量无限叠加。交通中断时停止累计。</p>${Object.values(state.pairs).map(p=>{let a=regions.find(r=>r.id===p.a),b=regions.find(r=>r.id===p.b);return `<div class="quote-row"><span>${escapeHTML(a?.name||'城圈')} ↔ ${escapeHTML(b?.name||'城圈')}<small>已累计运营 ${Math.floor(p.operatingDays)}天 · 跨圈送达 ${p.delivered||0}人</small></span><b>${Math.round(regionPairShare(p.a,p.b)*100)}% · ${p.connected?'已通达':'待接通'}</b></div>`;}).join('')||'<p>发现第二个城圈后开始建立跨圈联系。</p>'}<p class="market-muted">从第二圈起，每发现一个新圈增加公交线路2条、动车2条、高铁及航空各1条；未解锁车型解锁后补发，车辆和建设仍需自行购买。</p></section>`;
}
const operationsBeforeRelations=showOperations;
showOperations=function(){updateRegionalRelations(true);updateRegionalExpansion();operationsBeforeRelations();$('modal-content').innerHTML=$('modal-content').innerHTML.replace('普通乘客按颜色＋形状匹配。','普通乘客在目标城圈内按颜色＋形状匹配。')+regionalRelationsPanel();};
const helpBeforeRelations=help;
help=function(){helpBeforeRelations();$('modal-content').innerHTML+='<section class="infra-card"><h3>跨城圈出行</h3><p>有本圈目的地后，对外普通出行意向初始约3%；孤立首城的低量客流前往已有圈。接通并配车后，按实际可通达的运营时间逐渐增长，180天最多30%；先建设本圈网络，再扩充跨圈运力。活动和学生仍按原定的指定城市任务出行。</p><p>从第二圈起，每个新圈增加公交线路＋2、动车＋2、高铁＋1、航空＋1，每圈仅发放一次；未解锁车型解锁时补发。</p></section>';};
updateRegionalExpansion();updateRegionalRelations(true);
