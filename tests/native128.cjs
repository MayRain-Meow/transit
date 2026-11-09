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
    nodes.set(id, {id, hidden:['details','modal','drawbar','db-types','db-cost','drawundo'].includes(id), style:{getPropertyValue(k){return this[k]||"";},setProperty(k,v){this[k]=v;}}, offsetParent:{}, textContent:'', innerHTML:'', dataset:{},
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on=on??!classes.has(v);on?classes.add(v):classes.delete(v);return on;},contains:v=>classes.has(v)},
      appendChild(){},remove(){this.removed=true;},setAttribute(k,v){this[k]=v;}, addEventListener(){}, contains(){return false;}, setPointerCapture(){}, querySelector(){return null;},
      getBoundingClientRect(){return this.rect||{left:0,right:10,top:0,bottom:10};}, getContext:()=>canvas});
  }
  return nodes.get(id);
}
node('header').rect={left:0,right:390,top:0,bottom:62};
node('dock').rect={left:12,right:378,top:776,bottom:834};
node('routes').rect={left:12,right:378,top:610,bottom:766};
const storage = new Map(),listeners={window:{},document:{}};
function listen(target,type,fn,capture){(listeners[target][type]??=[]).push({fn,capture:!!capture});}
function fire(target,type,event={}){event.target??={tagName:'BODY'};event.preventDefault??=()=>{};let stopped=false;event.stopImmediatePropagation=()=>{stopped=true;};for(const x of [...(listeners[target][type]||[])].sort((a,b)=>b.capture-a.capture)){x.fn(event);if(stopped)break;}}
const context = {console,document:{hidden:false,visibilityState:'visible',hasFocus:()=>context.focused,getElementById:node,createElement:()=>node('offscreen'+nodes.size),addEventListener:(t,f,c)=>listen('document',t,f,c),activeElement:{tagName:'BODY'},
  querySelectorAll:()=>[],querySelector:s=>({'header':node('header'),'footer':node('dock'),'footer .dock':node('dock'),'#routes':node('routes'),'#details':node('details')}[s]||null)},
  innerWidth:390,innerHeight:844,devicePixelRatio:1,focused:true,window:{addEventListener:(t,f,c)=>listen('window',t,f,c)},screen:{},performance:{now:()=>100},addEventListener(){},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null},requestAnimationFrame(){},cancelAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>{throw new Error('native confirm() must not be used');}};
context.document.body=node('body');context.document.body.appendChild=()=>{};context.document.documentElement=node('html');context.navigator={};
vm.createContext(context);
const html=fs.readFileSync(path.join(root,'mobile/www/index.html'),'utf8');
for(const match of html.matchAll(/<script src="([^"?]+)(?:[^"]*)"/g))vm.runInContext(fs.readFileSync(path.join(root,'mobile/www',match[1]),'utf8'),context,{filename:match[1]});
const run = code => vm.runInContext(code,context);





// The complete deployed script order, including the final web revision.
run('activateAtlasGeometry("east");reset();closeModal();atlasMenuOpen=false;selected=null;');
assert.equal(run('window.TRANSIT_PORTRAIT_LAYOUT'),true);assert(run('S.riverPaths128.length>1'));assert(run('S.cities.every(c=>cityBuildable(c.x,c.y,2))'));
let riverSave=run('JSON.stringify(S.riverPaths128)');run('save();load();');assert.equal(run('JSON.stringify(S.riverPaths128)'),riverSave);assert.equal(run('JSON.stringify([mapSpec.main,...mapSpec.branches])'),riverSave);
for(let i=1;i<run('S.riverPaths128.length');i++)assert(run(`riverDistance({x:S.riverPaths128[${i}].at(-1)[0],y:S.riverPaths128[${i}].at(-1)[1]})<1e-7`));
run('var drawing128=ctx,strokes128=0,moves128=0;ctx=new Proxy({save(){},restore(){},beginPath(){},moveTo(){moves128++},lineTo(){},stroke(){strokes128++}},{get:(o,k)=>o[k]||(()=>{})});var state128=JSON.stringify(S);atlasWater();ctx=drawing128;');assert.equal(run('strokes128'),5);assert.equal(run('moves128'),run('S.riverPaths128.length*5'));assert.equal(run('JSON.stringify(S)'),run('state128'));
run('delete S.riverPaths128;activateAtlasGeometry("east");');assert.equal(run('JSON.stringify(mapSpec.main)'),run('JSON.stringify(ATLAS_MAPS.east.main)'));
run('reset();S.points=20000;var chosen128=riverSegments.find(s=>s.a.y>100&&s.a.y<800&&s.a.x>-900&&s.a.x<1000),mx128=(chosen128.a.x+chosen128.b.x)/2,my128=(chosen128.a.y+chosen128.b.y)/2,nr128=nearestRiver({x:mx128,y:my128});bridgeDraft={type:"bus",a:snapBank({x:mx128+nr128.nx*50,y:my128+nr128.ny*50}),b:snapBank({x:mx128-nr128.nx*50,y:my128-nr128.ny*50})};createBridge();');assert.equal(run('S.bridges.length'),1);let heads128=run('JSON.stringify(S.bridges[0].heads.map(id=>[S.cities[id].x,S.cities[id].y]))');run('save();load();');assert.equal(run('JSON.stringify(S.bridges[0].heads.map(id=>[S.cities[id].x,S.cities[id].y]))'),heads128);
run('reset();delete S.riverPaths128;activateAtlasGeometry("east");S.day=0;atlasSelected="east";atlasRestart=false;startAtlasMap();');assert(run('S.riverPaths128?.length>1'));assert.equal(run('atlasMenuOpen'),false);
console.log('PASS portrait stays unrotated; new smooth rivers persist; old geometry retained; confluences painted in 5 unified layers without mutating state');
run('reset();closeModal();atlasMenuOpen=false;S.cities.forEach(c=>c.dormant=false);activityState().offers=[1,5,6].map((star,i)=>({id:"offer128-"+i,star,host:1,sources:[0,2],title:"城市交流",prepare:3,goal:12,duration:10,total:15,bonus:100,fine:80,revealed:false}));showActivityCards();');
assert.equal((nodes.get('modal-content').innerHTML.match(/class="activity-slot /g)||[]).length,1);assert(nodes.get('modal-content').innerHTML.includes('deck-pager128'));assert(nodes.get('modal-content').innerHTML.includes('1<span> / 3'));
run('var offerIds128=activityState().offers.map(e=>e.id);revealActivity(offerIds128[0]);changeCard128(1);');assert.equal(run('activityState().active'),null);assert(nodes.get('modal-content').innerHTML.includes('2<span> / 3'));assert.equal((nodes.get('modal-content').innerHTML.match(/class="activity-slot /g)||[]).length,1);
run('changeCard128(-1);');assert.equal(run('activityState().offers[0].revealed'),true);assert(nodes.get('modal-content').innerHTML.includes('is-revealed'));run('changeCard128(-1);');assert.equal(run('deckPage128'),0);run('changeCard128(100);');assert.equal(run('deckPage128'),2);run('revealAllActivities();');assert(run('activityState().offers.every(e=>e.revealed)'));assert.equal(run('activityState().active'),null);
console.log('PASS exactly one mounted card, visible page controls, bounded navigation and persistent reveal states; navigation/reveal never accepts a task');
run('closeModal();reset();atlasMenuOpen=false;S.financial=null;var f128=financeState();f128.everBank=true;f128.everBroker=true;openStockMarket();marketReviewState();S.day=1.375;financialDailyReport(S.day);var price128=f128.market.stocks[0].price;syncFinancial();');assert.equal(run('f128.dailyPending'),null);assert(run('f128.market.days>=1'));run('maybeDailyMarketReview();');assert.equal(run('modalOpen'),false);
run('f128.wealthLots=[{units:100,cost:100,start:0}];S.day=2.375;financialDailyReport(S.day);');assert.notEqual(run('f128.dailyPending'),null);run('S.paused=false;maybeDailyMarketReview();');assert.equal(run('modalOpen'),true);assert.equal(run('S.paused'),true);assert.equal(run('marketTab'),'wealth');assert(nodes.get('modal-content').innerHTML.includes('持仓收益简报'));
run('closeModal();f128.wealthLots=[];f128.dailyPending=3;maybeDailyMarketReview();');assert.equal(run('modalOpen'),false);assert.equal(run('f128.dailyPending'),null);
run('f128.market.stocks[0].shares=1;S.day=3.375;financialDailyReport(S.day);maybeDailyMarketReview();');assert.equal(run('modalOpen'),true);assert.equal(run('marketTab'),'stocks');
run('closeModal();reset();atlasMenuOpen=false;S.cities.forEach(c=>{c.size=0;c.dormant=false;});var cash128=S.points;plantFarm(1);');assert.equal(run('S.points'),run('cash128'));assert.equal(run('S.cities[1].farm'),undefined);run('S.cities[1].size=1;plantFarm(1);');assert.equal(run('S.points'),run('cash128')-800);assert(run('S.cities[1].farm.crop'));run('closeModal();');
console.log('PASS no-position markets continue prices without popups; wealth-only and stock holders get the proper daily tab; small towns cannot plant, medium towns can');
run('reset();closeModal();atlasMenuOpen=false;S.points=20000;beginDraft("bus");draft.stops=[0,1];commitDraft(true);S.vehicles=[];var l128=S.lines[0],k128=key(S.cities[0],S.cities[1],"bus");requestClosure(k128,"quake");beginDraft("bus",l128.id);var draft128=draft,stops128=l128.stops.join(","),cashRepair128=S.points,q128=repairQuote(k128);draftBar();');assert.equal(run('draftDamage128().length'),1);assert(run('repairMarkup128().includes("维修 ¥")'));assert.equal(run('S.points'),run('cashRepair128'));
assert.equal(run('repairInDraft128(k128)'),true);assert.equal(run('S.points'),run('cashRepair128-q128.price'));assert.equal(run('S.blockages[k128].status'),'repairing');assert(run('draft===draft128'));assert.equal(run('l128.stops.join(",")'),run('stops128'));assert.equal(run('modalOpen'),false);assert.equal(run('repairInDraft128(k128)'),false);assert.equal(run('S.points'),run('cashRepair128-q128.price'));
run('S.blockages[k128].status="broken";S.points=0;');assert(run('repairMarkup128().includes("资金不足")'));assert.equal(run('repairInDraft128(k128)'),false);run('S.blockages[k128].status="pending";');assert(run('repairMarkup128().includes("等待在途车辆")'));assert.equal(run('repairInDraft128(k128)'),false);
console.log('PASS contextual repairs quote without spending; pay once without applying route or opening engineering; pending/repairing/insufficient-funds states explicit');
