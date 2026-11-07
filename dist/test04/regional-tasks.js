'use strict';
// 1.1: gradual frontier growth, formation rewards and regional invitations.
const FRONTIER_RULES={interval:10,rampDays:60,start:.4,mature:1.15,newbornDays:18,newbornStart:.35,crossCardChance:.3};
function initializeRegionalGrowth(){
 for(let r of cityRegions()){
  if(r.id===0||Number.isFinite(r.nextLocalAt))continue;
  // Existing towns keep their old demand; never restart a mature save's ramp.
  r.nextLocalAt=S.day+FRONTIER_RULES.interval;
  r.discoveredAt=S.day;
 }
}
const rateBeforeFrontier=passengerRate;
passengerRate=function(c){
 if(!c.regionalGrowth)return rateBeforeFrontier(c);
 if(c.dormant||c.removed)return 0;
 let r=cityRegions().find(r=>r.id===c.regionId),age=Math.max(0,S.day-(r?.discoveredAt??S.day)),openAge=Math.max(0,S.day-(c.activatedDay??S.day));
 let regional=FRONTIER_RULES.start+(FRONTIER_RULES.mature-FRONTIER_RULES.start)*Math.min(1,age/FRONTIER_RULES.rampDays);
 let newborn=FRONTIER_RULES.newbornStart+(1-FRONTIER_RULES.newbornStart)*Math.min(1,openAge/FRONTIER_RULES.newbornDays);
 let ordinary=.07*Math.pow(1.5,c.stage??c.size)*(BALANCE1.demandStart+Math.min(1,S.day/BALANCE1.demandRamp)*(BALANCE1.demand-BALANCE1.demandStart));
 return ordinary*regional*newborn;
};
const tickBeforeFrontier=tick;
tick=function(dt){initializeRegionalGrowth();tickBeforeFrontier(dt);if(S.lives<=0)return;let cities=realCities().filter(c=>!c.removed);if(cityRegions().some(r=>r.id>0&&S.day>=r.nextLocalAt&&cities.filter(c=>c.regionId===r.id).length<4))spawnCity();};
function secondCircleFormed(){return cityRegions().some(r=>r.id!==0&&realCities().filter(c=>c.regionId===r.id&&!c.dormant&&!c.removed).length>=3);}
function regionalTaskSources(star,host){
 cityRegions();let target=S.cities[host];if(!target)return {local:[],cross:[]};
 let all=activitySources(host),local=all.filter(id=>S.cities[id].regionId===target.regionId),links=star>=4&&S.day>=80&&secondCircleFormed()?regionalNetworkLinks():new Set();
 return {local,cross:all.filter(id=>S.cities[id].regionId!==target.regionId&&links.has(regionPairKey(target.regionId,S.cities[id].regionId)))};
}
const fitBeforeRegionalTask=fitActivity1;
fitActivity1=function(e){
 let pools=regionalTaskSources(e.star,e.host);
 if(!pools.local.length&&!pools.cross.length){
  let hosts=realCities().filter(c=>!c.dormant&&!c.removed).map(c=>({id:c.id,p:regionalTaskSources(e.star,c.id)})).filter(x=>x.p.local.length||x.p.cross.length);
  if(!hosts.length){e.sources=[];e.crossRegion=false;return fitBeforeRegionalTask(e);}
  let x=hosts[Math.floor(Math.random()*hosts.length)];e.host=x.id;e.title=['社区交流日','旅游节','商务峰会','工业展会'][S.cities[e.host].shape];pools=x.p;
 }
 e.crossRegion=!!pools.cross.length&&(!pools.local.length||Math.random()<FRONTIER_RULES.crossCardChance);
 e.sources=e.crossRegion?pools.cross:pools.local;
 return fitBeforeRegionalTask(e);
};
const offersBeforeRegionalTask=generateActivityOffers;
generateActivityOffers=function(){let ok=offersBeforeRegionalTask();if(!ok)return ok;let s=activityState();s.offers=s.offers.filter(e=>e.sources.length);if(!s.offers.length){s.next=S.day+3;save();return false;}save();return true;};
function regionalTaskLabel(e){if(e.crossRegion===undefined)return '城市任务';if(!e.crossRegion)return '本圈任务';let ids=[...new Set(e.sources.map(id=>S.cities[id]?.regionId))],regions=cityRegions();return ids.map(id=>regions.find(r=>r.id===id)?.name||'城圈').join('、')+' → '+(S.cities[e.host]?.name||'目标城市');}
function locateActivityCity(id){
 let s=activityState(),e=s.active?.id===id?s.active:s.offers.find(x=>x.id===id&&x.revealed),c=e&&S.cities[e.host];
 if(!c||c.removed)return toast('请先翻开任务卡，查看任务城市');
 closeModal();S.paused=true;quakeCamera=null;
 let band=fitBand();view.scale=Math.max(.65,Math.min(1.1,view.scale));view.x=W/2-c.x*view.scale;view.y=(band.top+band.bottom)/2-c.y*view.scale;
 openCity(c.id);popStation(c,COLORS[c.color]);save();updateUI();toast('已定位任务城市：'+c.name+' · 主世界已暂停');
}
const cardBeforeRegionalTask=activityCardHTML;
activityCardHTML=function(e,index=0){return cardBeforeRegionalTask(e,index).replace('<p class="card-sources">',`<p class="card-sources"><b>${escapeHTML(regionalTaskLabel(e))}</b><br>`).replace('<button class="primary card-accept"',`<button onclick="locateActivityCity('${e.id}')">定位任务城市</button><button class="primary card-accept"`);};
const showBeforeRegionalTask=showActivityCards;
showActivityCards=function(){showBeforeRegionalTask();let e=activityState().active;if(e)$('modal-content').innerHTML=$('modal-content').innerHTML.replace(`<button onclick="closeModal();openCity(${e.host})">定位举办城市</button>`,`<p>${escapeHTML(regionalTaskLabel(e))}</p><button onclick="locateActivityCity('${e.id}')">定位任务城市</button>`);};
const helpBeforeFrontier=help;
help=function(){helpBeforeFrontier();$('modal-content').innerHTML+='<section class="infra-card"><h3>第二城圈与跨圈任务 · 1.1</h3><p>远端首城出现后，周边随日期逐步刷新城镇。新地图后续每12天一次刷新机会，位置不足则等待，不强行挤城。发现后2.5天自动开放，提前接线可提前开放。新城有18天客流成长，城圈客流在60天内从同级普通城市的40%逐步增至115%。首城没有本圈目的地时，低量客流前往其他城圈。</p><p>从第二圈起，每发现一个新圈增加公交线路2条、动车2条、高铁和航空各1条；未解锁类型稍后补发，旧存档已经领取的奖励不重复发放。</p><p>第80天起且第二圈形成、两圈有可运营交通连接时，4—6星卡可能出现跨圈任务；1—3星只生成本圈任务。翻牌后与承接期间均可定位任务城市，定位后主世界暂停。</p></section>';};
$('help').onclick=()=>help();
initializeRegionalGrowth();save();
