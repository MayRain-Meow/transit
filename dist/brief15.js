'use strict';
// Saved reports and a single, nonblocking, wall-clock presentation slot.
let briefOwner15=null,briefDeadline15=0;
function briefState15(){return S.briefs15??={version:1,history:[],pending:null,unread:false};}
function queueBrief15(kind,profit,day=S.day,count=1){
 if(!Number.isFinite(profit)||Math.abs(profit)<.005)return;
 let b=briefState15();b.history.push({kind,profit,day,count});b.history=b.history.slice(-80);b.unread=true;
 let p=b.pending??={profit:0,investment:0,farms:0,from:day,to:day};p.profit+=profit;p[kind==='farm'?'farms':'investment']+=count;p.from=Math.min(p.from,day);p.to=Math.max(p.to,day);
}
const reportBefore15=financialDailyReport;
financialDailyReport=function(day){let f=financeState(),before=f.lastReportDay,oldMoneyUnread=notices130().unread.money;reportBefore15(day);notices130().unread.money=oldMoneyUnread;f.dailyPending=null;delete f.dailyReview;let held=financialParticipation128();if(f.lastReportDay!==before&&(held.wealth||held.stocks)){queueBrief15('investment',f.lastReport?.profit||0,day);save();}};
// Old pending review markers are data to migrate, never a reason to stop traffic.
maybeDailyMarketReview=function(){let f=S?.financial;if(f){if(f.dailyPending!=null||f.dailyReview){let held=financialParticipation128();if(held.wealth||held.stocks)queueBrief15('investment',f.lastReport?.profit||0,f.lastReport?.day??S.day);}f.dailyPending=null;delete f.dailyReview;}dailyReviewVisible=false;};
maybeFarmHarvest=function(){let a=S?.agriculture;if(!a?.pending)return;let rows=a.pending.rows||[];a.pending=null;farmReviewVisible=false;if(rows.length)queueBrief15('farm',rows.reduce((n,r)=>n+r.profit,0),Math.max(...rows.map(r=>r.day)),rows.length);save();};
showFarmHarvest=function(){maybeFarmHarvest();showAgriculture();};
function briefBlocked15(){return atlasMenuOpen||modalOpen||!!draft||!!bridgeDraft||pointers.size>0||!!gesture||S.lives<=0;}
function briefLabel15(p){return p.investment&&p.farms?'投资与农田':p.farms?'农田收获':'投资日报';}
function briefDescription15(p){return p.farms&&!p.investment?p.farms+'块收获':p.investment>1?'近'+p.investment+'日累计':'昨日';}
function renderBrief15(){
 const b=briefState15();if(briefOwner15!==S){briefOwner15=S;briefDeadline15=0;}
 let el=$('earnings-brief15');if(!el){el=document.createElement('aside');el.id='earnings-brief15';el.setAttribute('role','status');el.hidden=true;el.innerHTML='<div><b></b><span></span></div><button type="button" onclick="openBrief15()" aria-label="查看经营简报">查看 ›</button>';document.body.append(el);}
 const dot=$('hub-money')?.querySelector('.notice-dot130');if(dot&&b.unread)dot.hidden=false;
 if(briefBlocked15()){el.hidden=true;briefDeadline15=0;return;}
 const p=b.pending;if(!p){el.hidden=true;return;}
 const routes=$('routes'),footer=document.querySelector('footer');let top=routes&&!routes.hidden?routes.getBoundingClientRect().top:footer.getBoundingClientRect().top;
 if(top<155){el.hidden=true;briefDeadline15=0;return;}
 const now=performance.now();if(!briefDeadline15)briefDeadline15=now+4000;
 if(now>=briefDeadline15){b.pending=null;briefDeadline15=0;el.hidden=true;return;}
 el.style.bottom=Math.max(8,innerHeight-top+8)+'px';el.querySelector('b').textContent=briefLabel15(p);el.querySelector('span').textContent=briefDescription15(p)+' '+farmMoney(p.profit);el.dataset.tone=p.profit>=0?'positive':'negative';el.hidden=false;
}
function briefHistoryPanel15(){let rows=briefState15().history.slice(-30).reverse();return '<section class="brief-history15"><h3>投资与农田简报</h3>'+(rows.length?'<ul>'+rows.map(r=>'<li><span>第'+(Math.floor(r.day)+1)+'天 · '+(r.kind==='farm'?'农田收获':'投资收益')+'</span><b>'+farmMoney(r.profit)+'</b></li>').join('')+'</ul>':'<p>有实际盈亏后，会在这里留下记录。</p>')+'</section>';}
function markBriefRead15(){let b=briefState15();b.unread=false;b.pending=null;briefDeadline15=0;let el=$('earnings-brief15');if(el)el.hidden=true;}
function openBrief15(){let wasRunning=!S.paused;markBriefRead15();openModal('<div class="brief-sheet15"><div class="modal-head"><h2>经营简报</h2><button class="close" onclick="closeModal()" aria-label="关闭简报">×</button></div>'+briefHistoryPanel15()+'<button class="primary" onclick="showFinancialMarket(\'portfolio\')">投资收益记录</button><button onclick="showAgriculture()">农田与盈亏</button><button onclick="closeModal()">返回游戏</button></div>');S.paused=true;S.briefReview15={wasRunning};save();updateUI();}
const closeBefore15=closeModal;
closeModal=function(...args){let review=S?.briefReview15;if(review)delete S.briefReview15;let r=closeBefore15(...args);if(review&&S.lives>0&&!interruptionPending()){S.paused=!review.wasRunning;save();updateUI();}return r;};
const financeBefore15=showFinance;
showFinance=function(...args){markBriefRead15();let r=financeBefore15(...args);$('modal-content').insertAdjacentHTML('beforeend',briefHistoryPanel15());return r;};
const renderBefore15=render;
render=function(...args){maybeDailyMarketReview();maybeFarmHarvest();let r=renderBefore15(...args);renderBrief15();return r;};
maybeDailyMarketReview();maybeFarmHarvest();if(S?.briefReview15)delete S.briefReview15;
