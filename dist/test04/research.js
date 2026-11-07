'use strict';
const TRANSPORT_RESEARCH={
 electric_bus:{type:'bus',name:'新能源公交',cost:6000,days:30,speed:.15,maintenance:.20,description:'公交运行速度＋15%，公交道路与公路桥维护费−20%。'},
 emu_traction:{type:'emu',name:'动车高效牵引',cost:9000,days:45,speed:.12,description:'动车运行速度＋12%。'},
 highspeed_control:{type:'rail',name:'高铁运行优化',cost:12000,days:60,speed:.10,description:'高铁运行速度＋10%。'},
 air_navigation:{type:'air',name:'航空航路优化',cost:15000,days:60,speed:.10,description:'航空运行速度＋10%。'},
 bus_capacity:{type:'bus',name:'公交车厢布局',cost:6000,days:30,capacity:.20,description:'公交载客量＋20%，已有和新购公交均生效。'},
 emu_capacity:{type:'emu',name:'动车载客优化',cost:9000,days:45,capacity:.15,description:'动车每节车厢容量＋15%，仍最多8节。'},
 rail_capacity:{type:'rail',name:'高铁载客优化',cost:12000,days:60,capacity:.15,description:'高铁每节车厢容量＋15%，仍最多8节。'},
 air_capacity:{type:'air',name:'航空客舱优化',cost:15000,days:60,capacity:.15,description:'飞机载客量＋15%，已有和新购飞机均生效。'}
};
function researchState(){return S.transportResearch??={version:1,unlockedAt:null,active:null,completed:{}};}
function researchSchoolCount(){return realCities().filter(c=>!c.removed&&!!c.school).length;}
function updateTransportResearch(){
 let state=researchState(),changed=false;
 if(state.unlockedAt===null&&researchSchoolCount()>=8){state.unlockedAt=S.day;changed=true;toast('8所学校已建成 · 交通科研开放，从运营中心进入');}
 let active=state.active;if(active&&S.day+1e-9>=active.end){let tech=TRANSPORT_RESEARCH[active.id];if(tech){state.completed[active.id]={at:active.end,cost:active.cost};state.active=null;changed=true;toast('科研完成 · '+tech.name+' · '+tech.description);}else{state.active=null;changed=true;}}
 if(changed)save();
}
function researchSpeedFactor(type){let state=S.transportResearch;if(!state)return 1;let total=0;for(let [id,result] of Object.entries(state.completed||{})){let tech=TRANSPORT_RESEARCH[id];if(result&&tech?.type===type)total+=tech.speed||0;}return 1+total;}
function researchCapacityBonus(type){let total=0;for(let [id,result] of Object.entries(S.transportResearch?.completed||{})){let tech=TRANSPORT_RESEARCH[id];if(result&&tech?.type===type)total+=tech.capacity||0;}return total;}
function startTransportResearch(id){
 updateTransportResearch();let state=researchState(),tech=TRANSPORT_RESEARCH[id];
 if(!tech)return;
 if(S.lives<=0)return toast('本局已结束');
 if(state.unlockedAt===null)return toast('建成8所学校后解锁交通科研');
 if(state.completed[id])return toast('该项研究已完成');
 if(state.active)return toast('一次只能进行一项研究');
 if(!S.unlocked.includes(tech.type))return toast('先解锁'+TYPES[tech.type].name);
 if(S.points<tech.cost)return toast('科研需要 ¥'+tech.cost);
 spend(tech.cost,'research','科研：'+tech.name);
 state.active={id,start:S.day,end:S.day+tech.days,cost:tech.cost};save();showTransportResearch();updateUI();
}
function researchOverview(){
 let state=researchState(),schools=researchSchoolCount();return `<section class="infra-card research-summary"><div><span class="eyebrow">TRANSPORT RESEARCH</span><h3>交通科研</h3><p>${state.unlockedAt===null?'建成8所学校后开放 · 当前 '+schools+' / 8所':state.active?'正在研究：'+TRANSPORT_RESEARCH[state.active.id].name+' · 剩余'+Math.max(0,Math.ceil(state.active.end-S.day))+'天':'已解锁 · 已完成'+Object.keys(state.completed).length+'项研究'}</p></div><button class="${state.unlockedAt===null?'secondary':'primary'}" onclick="showTransportResearch()">${state.unlockedAt===null?'查看科研条件':'进入科研'}</button></section>`;
}
function showTransportResearch(){
 updateTransportResearch();let state=researchState(),schools=researchSchoolCount(),active=state.active;
 openModal(`<div class="modal-head"><div><span class="eyebrow">SCHOOLS → TRANSPORT RESEARCH</span><h2>交通科研</h2></div><button class="close" onclick="showOperations()" aria-label="返回运营中心">×</button></div><p class="research-intro">${state.unlockedAt===null?'场上建成8所学校后永久解锁，当前 '+schools+' / 8所。':'8校科研体系已解锁。研究完成后永久生效，一次只能研究一项。'} 速度与运载量分别研究。科研按游戏日期推进，暂停期间不计时。容量加成相加、统一向下取整，最高为当前编组基础容量的200%。</p>${active?`<section class="research-progress"><b>${TRANSPORT_RESEARCH[active.id].name} · 研究中</b><progress max="1" value="${Math.max(0,Math.min(1,(S.day-active.start)/(active.end-active.start)))}"></progress><span>剩余 ${Math.max(0,Math.ceil(active.end-S.day))} 天 · 已投入 ${marketMoney(active.cost)}</span><p>关闭面板回到主世界后继续推进研究。</p></section>`:''}<div class="research-grid">${Object.entries(TRANSPORT_RESEARCH).map(([id,tech])=>{let done=!!state.completed[id],busy=active?.id===id,locked=state.unlockedAt===null||!S.unlocked.includes(tech.type),disabled=done||!!active||locked||S.points<tech.cost||S.lives<=0;return `<article class="research-card ${done?'is-complete':''}"><span class="eyebrow">${TYPES[tech.type].name} · ${tech.capacity?'运载量':'速度'} / ${done?'已应用':'TECHNOLOGY'}</span><h3>${tech.name}</h3><p>${tech.description}</p><div class="research-cost"><b>${marketMoney(tech.cost)}</b><span>${tech.days}天</span></div><button class="${done?'secondary':'primary'}" onclick="startTransportResearch('${id}')" ${disabled?'disabled':''}>${done?'研究完成':busy?'研究中':state.unlockedAt===null?'需要8所学校':!S.unlocked.includes(tech.type)?'尚未解锁车型':active?'等待当前研究完成':S.points<tech.cost?'科研资金不足':'开始研究'}</button></article>`;}).join('')}</div><p class="market-muted">速度加成保留天气、施工和列车进出站减速。新能源公交维护减免仅适用于公交道路及公路桥，与学校维护优惠相乘计算；已结算的维护费不追溯重算。</p><div class="ux-actions"><button class="primary" onclick="closeModal()">回到地图</button><button onclick="showOperations()">返回运营中心</button></div>`);
}
const edgeBeforeResearch=edgeTime;
edgeTime=function(a,b,type){return edgeBeforeResearch(a,b,type)/researchSpeedFactor(type);};
const maintenanceBeforeResearch=maintenanceAssets;
maintenanceAssets=function(){
 let assets=maintenanceBeforeResearch();if(!S.transportResearch?.completed?.electric_bus)return assets;
 return assets.map(asset=>{let road=S.infrastructure[asset.key],bridge=asset.key.startsWith('bridge-')?S.bridges.find(b=>b.id===Number(asset.key.slice(7))):null;
  if(road?.type!=='bus'&&bridge?.type!=='bus')return asset;
  let monthly=Math.round(asset.monthly*.8*100)/100;return {...asset,monthly,researchDiscount:.2,researchSaved:Math.round((asset.monthly-monthly)*100)/100};
 });
};
const operationsBeforeResearch=showOperations;
showOperations=function(){updateTransportResearch();operationsBeforeResearch();$('modal-content').innerHTML=researchOverview()+$('modal-content').innerHTML;};
const worldBeforeResearch=updateWorld;
updateWorld=function(...args){updateTransportResearch();return worldBeforeResearch(...args);};
const helpBeforeResearch=help;
help=function(){helpBeforeResearch();$('modal-content').innerHTML+='<section class="infra-card"><h3>8校交通科研</h3><p>建成8所学校后，从运营中心进入科研。支付资金后按游戏天数研究，一次一项；速度、运载量分别研究，完成后对已有与新购车辆永久生效。运载量与卡牌加成相加，最终最高200%，向下取整；列车仍最多8节。新能源公交额外减免20%公交道路及公路桥维护费。</p></section>';};
updateTransportResearch();
const financeBeforeResearch=showFinance;
showFinance=function(){financeBeforeResearch();$('modal-content').innerHTML+=`<section class="infra-card"><h3>科研投入</h3><p>累计支出 ${marketMoney(S.ledger.research||0)} · 已完成${Object.keys(researchState().completed).length}项交通研究。</p><button onclick="showTransportResearch()">查看交通科研</button></section>`;};
