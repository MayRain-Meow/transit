// Regression checks for the 0.4 UX layer (ux.js): line building, line sheet, tasks, balance display.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const nodes = new Map();
const canvas = new Proxy({createLinearGradient: () => ({addColorStop(){}}), measureText: t => ({width:t.length*7})}, {get:(x,k)=>x[k]||(()=>{})});
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, {id, hidden:['details','modal','drawbar','db-types','db-cost','drawundo'].includes(id), style:{}, offsetParent:{}, textContent:'', innerHTML:'', dataset:{},
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on=on??!classes.has(v);on?classes.add(v):classes.delete(v);return on;},contains:v=>classes.has(v)},
      setAttribute(k,v){this[k]=v;}, addEventListener(){}, contains(){return false;}, setPointerCapture(){}, querySelector(){return null;},
      getBoundingClientRect(){return this.rect||{left:0,right:10,top:0,bottom:10};}, getContext:()=>canvas});
  }
  return nodes.get(id);
}
node('header').rect={left:0,right:390,top:0,bottom:62};
node('dock').rect={left:12,right:378,top:776,bottom:834};
node('routes').rect={left:12,right:378,top:610,bottom:766};
const storage = new Map();
const context = {console,document:{getElementById:node,createElement:()=>node('offscreen'),addEventListener(){},activeElement:{tagName:'BODY'},
  querySelector:s=>({'header':node('header'),'footer .dock':node('dock'),'#routes':node('routes'),'#details':node('details')}[s]||null)},
  innerWidth:390,innerHeight:844,devicePixelRatio:1,window:{addEventListener(){}},screen:{},performance:{now:()=>100},addEventListener(){},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>{throw new Error('native confirm() must not be used');}};
vm.createContext(context);
for (const file of ['currency11','game','progression','world','economy','management','ux','events','balance1','market','performance','market-ui','world-upgrade','region-mobility','research','regional-tasks']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);


run(`reset();closeModal();S.paused=false;S.points=10000;S.cities[2].shape=2;S.cities[2].size=2;S.cities[2].dormant=false;buildFinance(2,'bank');buildFinance(2,'broker');tradeStock(0,'buy',10);showFinancialMarket('holdings');`);
assert.equal(run('S.paused'),true);assert(node('modal-content').innerHTML.includes('我的持仓'));assert(node('modal-content').innerHTML.includes('常星存储'));assert(node('modal-content').innerHTML.includes('holding-qty-0'));
run(`tradeStock(0,'sell',3)`);assert.equal(run('financeState().market.stocks[0].shares'),7);assert.equal(run('marketTab'),'holdings');run(`sellHolding(0,true)`);assert.equal(run('financeState().market.stocks[0].shares'),0);assert(node('modal-content').innerHTML.includes('暂未持有股票'));run('closeModal()');assert.equal(run('S.paused'),false);
run('S.day=.375;syncFinancial();maybeDailyMarketReview()');assert.equal(run('S.paused'),true);assert.equal(run('modalOpen'),true);assert(node('modal-content').innerHTML.includes('每日股票简报'));assert(run('financeState().dailyReview.day===0'));run(`showFinancialMarket('holdings');finishDailyMarketReview();maybeDailyMarketReview()`);assert.equal(run('modalOpen'),false);assert.equal(run('S.paused'),false);
run(`openModal('another action');S.day=1.375;syncFinancial();maybeDailyMarketReview()`);assert.equal(node('modal-content').innerHTML,'another action');assert.equal(run('financeState().dailyPending'),1);run(`closeModal();maybeDailyMarketReview()`);assert(node('modal-content').innerHTML.includes('每日股票简报'));run(`modalOpen=false;S.paused=true;maybeDailyMarketReview()`);assert(node('modal-content').innerHTML.includes('每日股票简报'));run('finishDailyMarketReview()');assert.equal(run('S.paused'),false);
run('S.paused=true;S.day=2.375;syncFinancial();maybeDailyMarketReview();finishDailyMarketReview()');assert.equal(run('S.paused'),true);
console.log('PASS holdings partial/all selling, explicit pause/restore, 09:00 once/day, pending/reload and prior pause preserved');
run(`reset();closeModal();S.lines=[{id:1,type:'rail',color:'#123456',stops:[0,1]}];Object.assign(S.cities[0],{x:100,y:400});Object.assign(S.cities[1],{x:400,y:400});var train={id:1,type:'rail',line:1,index:1,dir:1,t:0,dwell:2,cars:4,people:[]};var before=trainCarriagePoses(train,17).map(p=>[p.x,p.y]).sort((a,b)=>a[0]-b[0]);train.dir=-1;var after=trainCarriagePoses(train,17).map(p=>[p.x,p.y]).sort((a,b)=>a[0]-b[0]);`);assert.equal(run('JSON.stringify(before)'),run('JSON.stringify(after)'));assert(run('after.every(p=>p[0]>=100&&p[0]<=400)'));assert.equal(run("bridgeAppearance('bus')"),'road');assert.equal(run("bridgeAppearance('track')"),'rail');assert.equal(run('snapBank({x:0,y:1200}).y'),1200);
console.log('PASS train reversal preserves physical positions, bridge styles distinct, northern river bridge placement');
run(`reset();closeModal();S.day=100;S.unlocked=['bus','rail'];var savedRandom=Math.random;Math.random=marketRng(246810);var positionsBefore=S.cities.map(c=>[c.x,c.y]);for(let i=0;i<45;i++){for(let c of realCities())c.dormant=false;S.lines=[{id:1,type:'rail',stops:realCities().map(c=>c.id)}];spawnCity();S.day+=18;}Math.random=savedRandom;`);
assert(run('cityRegions().length>=4'));assert(run('realCities().length>=25'));assert(run('realCities().length<=48'));assert(run('realCities().some(c=>c.y<0)'));assert(run('realCities().some(c=>c.y>710)'));assert.equal(run('JSON.stringify(positionsBefore)'),run('JSON.stringify(S.cities.slice(0,3).map(c=>[c.x,c.y]))'));assert(run('realCities().every(c=>cityBuildable(c.x,c.y))'));
run(`var regionCount=cityRegions().length;for(let c of realCities())c.dormant=false;S.lines=[];var cityCount=realCities().length;spawnCity()`);assert.equal(run('cityRegions().length'),run('regionCount'));
console.log('PASS multi-direction connected city circles, old coordinates preserved, legal spacing and pending-region gate');
run(`reset();closeModal();S.lines=[{id:1,type:'rail',color:'#123456',stops:[0,1,2]}];S.vehicles=[];triggerQuake();`);assert(run('S.lastEarthquake.edges.length>=1&&S.lastEarthquake.edges.length<=3'));assert(run('S.lastEarthquake.edges.every(k=>S.blockages[k].cause===\'quake\')'));run('showEngineering()');assert(node('modal-content').innerHTML.includes('最近地震'));assert(node('modal-content').innerHTML.includes('自动聚焦震区'));
console.log('PASS earthquake records actual damaged edges and exposes camera toggle/repair summary');
run(`reset();closeModal();S.lines=[{id:1,type:'bus',color:'#123456',stops:[0,1,2]}];S.inventory.bus=3;addVehicle(1,false);var ps=[{origin:0,color:1,shape:0},{origin:1,color:1,shape:0},{origin:0,eventId:'x',dest:2},{origin:0,schoolId:0,dest:1}];var uncached=ps.map(p=>planBeforeMemo(0,p));routingBatch={travel:new Map(),routes:new Map()};var cached=ps.map(p=>plan(0,p));routingBatch=null;`);assert.equal(run('JSON.stringify(cached)'),run('JSON.stringify(uncached)'));
run(`var result1=requirements({x:10,y:300},{x:20,y:300},'bus'),result2=requirements({x:10,y:300},{x:1400,y:300},'bus');`);assert.equal(run('result1.invalid'),undefined);assert.equal(run('result2.invalid'),'线路不能经过海域');run(`S.cities[0].q=[{origin:0,eventId:null,wait:4},{origin:1,wait:5}];beginRatingBatch();var pending0=pendingRatingPassengers(0);ratingPassengers=null;`);assert.equal(run('pending0.length'),1);
console.log('PASS routing equivalence for ordinary/event/student/origin variants, coordinate geometry keys, shared rating index');

run(`reset();closeModal();S.unlocked=['bus','rail'];var oldRandom=Math.random;Math.random=marketRng(246810);while(realCities().length<6){for(let c of realCities())c.dormant=false;S.lines=[{id:1,type:'rail',stops:realCities().map(c=>c.id)}];spawnCity();}for(let c of realCities())c.dormant=false;S.lines=[{id:1,type:'rail',stops:realCities().map(c=>c.id)}];spawnCity();var pendingCount=realCities().length;var pendingRegions=cityRegions().length;for(let i=0;i<5;i++){for(let c of realCities())c.dormant=false;spawnCity();}Math.random=oldRandom;`);assert.equal(run('pendingCount'),7);assert.equal(run('realCities().length'),7);assert.equal(run('cityRegions().length'),run('pendingRegions'));console.log('PASS unconnected new regional seed cannot spawn another isolated circle');
run(`reset();closeModal();S.lines=[{id:1,type:'bus',color:'#123456',stops:[0,1,2]}];S.inventory.bus=3;addVehicle(1,false);var l=S.lines[0],v=S.vehicles[0];v.index=1;v.dir=-1;var traveler={origin:1,color:S.cities[0].color,shape:S.cities[0].shape,wait:0,ready:0,journey:0};S.cities[1].q=[traveler];arrival(v,l);`);assert(run('v.people.includes(traveler)'));
run(`v.people=[];S.cities[1].q=[traveler];v.pendingService={mode:'interval',start:1,end:2};arrival(v,l);`);assert.equal(run('v.people.includes(traveler)'),false);assert(run('S.cities[1].q.includes(traveler)'));run(`v.service={mode:'all'};S.blockages[key(S.cities[0],S.cities[1],'bus')]={cause:'quake',status:'broken',allowed:[]};arrival(v,l);`);assert.equal(run('v.people.includes(traveler)'),false);assert.equal(run('routingBatch'),null);
console.log('PASS actual arrival cache resets when pending service changes and a quake closes the target edge');
run(`reset();closeModal();S.points=10000;S.cities[2].shape=2;S.cities[2].size=2;buildFinance(2,'bank');buildFinance(2,'broker');closeModal();S.lines=[{id:1,type:'bus',color:'#123456',stops:[0,1]}];S.inventory.bus=3;addVehicle(1,false);S.vehicles[0].t=.3;S.paused=false;showFinancialMarket('holdings');var frozenDay=S.day,frozenT=S.vehicles[0].t;frame(1000);frame(2000);`);assert.equal(run('S.day'),run('frozenDay'));assert.equal(run('S.vehicles[0].t'),run('frozenT'));run('closeModal()');assert.equal(run('S.paused'),false);
run(`S.day=.375;syncFinancial();maybeDailyMarketReview();dailyReviewVisible=false;modalOpen=true;$('modal-content').innerHTML='reload welcome';closeModal();`);assert(run('!!financeState().dailyReview'));run('maybeDailyMarketReview()');assert(node('modal-content').innerHTML.includes('每日股票简报'));run('finishDailyMarketReview()');assert.equal(run('financeState().dailyReview'),undefined);
console.log('PASS real frame leaves day/vehicle frozen in market and reload welcome does not acknowledge an unseen daily review');

run(`showFinancialMarket('holdings')`);assert.equal((node('modal-content').innerHTML.match(/aria-pressed="true"/g)||[]).length,1);console.log('PASS holdings navigation has exactly one selected tab');
