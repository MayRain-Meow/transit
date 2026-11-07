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
for (const file of ['currency11','game','progression','world','economy','management','ux','events','balance1','market','performance','market-ui','world-upgrade','region-mobility','research','regional-tasks','map-art','farms']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);


// Real integration harness: all release scripts, including the market pause layer.
function setup(){run('reset();closeModal();S.points=5000;S.seed=7;S.cities[0].shape=0;S.cities[1].shape=0;S.cities[0].dormant=S.cities[1].dormant=false;S.paused=true;');}
setup();assert.equal(run('S.release'),'1.2');assert.equal(run('farmEligible(S.cities[2])'),false);
run('plantFarm(2)');assert.equal(run('S.points'),5000);run('S.cities[0].dormant=true;plantFarm(0)');assert.equal(run('S.points'),5000);run('S.cities[0].dormant=false;S.points=799;plantFarm(0)');assert.equal(run('!!S.cities[0].farm'),false);
setup();run('plantFarm(0);closeModal();plantFarm(0);closeModal();');assert.equal(run('S.points'),4200);assert.equal(run('S.cities[0].farm.round'),1);assert.equal(run('farmTotals().pending'),800);assert.equal(run('farmTotals().profit'),0);assert.equal(run('S.cities[0].farm.crop.due'),9.5);
run('S.day=9.5-1e-7;settleFarms()');assert.equal(run('agricultureState().completed'),0);assert.equal(run('S.points'),4200);
console.log('PASS residence eligibility, single crop, exact debit, unfinished investment and noon boundary');
setup();run('var seed=0;while(!(farmRoundPayout(seed,0,1)===1000&&farmRoundPayout(seed,1,1)===650))seed++;S.seed=seed;plantFarm(0);closeModal();plantFarm(1);closeModal();S.day=9.5;S.paused=false;tick(.08);');assert.equal(run('S.day'),9.5);assert.equal(run('S.points'),5050);assert.equal(run('agricultureState().pending.rows.length'),2);assert.equal(run('agricultureState().completed'),2);assert.equal(run('agricultureState().profit'),50);assert.equal(run('farmTotals().pending'),0);assert.equal(run('S.ledger.agricultureInvestment'),1600);assert.equal(run('S.ledger.agricultureIncome'),1650);assert.equal(run('S.paused'),true);assert.equal(run('modalOpen'),true);assert(node('modal-content').innerHTML.includes('本批 2块田'));assert(node('modal-content').innerHTML.includes('polyline'));
run('var stable=()=>JSON.stringify({a:S.agriculture,cash:S.points,farms:S.cities.map(c=>c.farm),day:S.day,vehicles:S.vehicles});var before=stable();for(let i=0;i<5;i++){settleFarms();render();tick(20);}');assert.equal(run('stable()'),run('before'));run('finishFarmHarvest()');assert.equal(run('S.paused'),false);assert.equal(run('agricultureState().pending'),null);assert.equal(run('S.cities[0].farm.crop'),null);assert.equal(run('S.cities[0].farm.round'),1);
console.log('PASS merged win/loss payout, chart, no auto-replant and whole-world pause without duplicate payment');
setup();run('S.points=20000;beginDraft("bus");draft.stops=[0,1];commitDraft(true);plantFarm(0);closeModal();S.day=9.49;S.paused=false;S.spawnDay=1e9;tick(12);');assert(Math.abs(run('S.day')-9.5)<1e-10);assert.equal(run('S.paused'),true);assert.equal(run('agricultureState().completed'),1);
run('var frozenDay=S.day,frozenVehicles=JSON.stringify(S.vehicles);frame(200);frame(300);');assert.equal(run('S.day'),run('frozenDay'));assert.equal(run('JSON.stringify(S.vehicles)'),run('frozenVehicles'));
console.log('PASS actual tick stops at harvest noon and real frames cannot advance while review is open');
run('var paid=S.points;save();load();modalOpen=false;welcome(true);maybeFarmHarvest()');assert(node('modal-content').innerHTML.includes('连接城市'));assert.equal(run('S.points'),run('paid'));run('closeModal();maybeFarmHarvest()');assert(node('modal-content').innerHTML.includes('农田收获'));assert.equal(run('agricultureState().pending.rows.length'),1);assert.equal(run('S.points'),run('paid'));run('finishFarmHarvest();save();load();modalOpen=false;maybeFarmHarvest()');assert.equal(run('agricultureState().pending'),null);assert.equal(run('modalOpen'),false);assert.equal(run('S.points'),run('paid'));
console.log('PASS saved pending report survives reload; acknowledged report and payouts never repeat');
setup();run('plantFarm(0);closeModal();S.day=9.5;S.paused=true;settleFarms();maybeFarmHarvest();finishFarmHarvest()');assert.equal(run('S.paused'),true);
run('var a=agricultureState(),payout=S.cities[0].farm.lastHarvest.income;plantFarm(0);closeModal()');assert.equal(run('S.cities[0].farm.round'),2);assert.equal(run('farmTotals().investment'),1600);assert.equal(run('farmTotals().profit'),run('payout-800'));assert.equal(run('farmTotals().pending'),800);
run('var simState=JSON.stringify(S),oldRandom=Math.random;Math.random=()=>{throw Error("simulation RNG used")};drawFarm(S.cities[0]);drawTerrain();Math.random=oldRandom;');assert.equal(run('JSON.stringify(S)'),run('simState'));
console.log('PASS already-paused state preserved, manual next round and pure terrain/crop rendering');
let wins=run('Array.from({length:20000},(_,seed)=>farmRoundPayout(seed,1,1)).filter(x=>x===1000).length');assert(Math.abs(wins/20000-.52)<.012);assert.equal(run('farmRoundPayout(88,1,2)'),run('farmRoundPayout(88,1,2)'));run('save();var p=S.cities[0].farm.crop.payout;load()');assert.equal(run('S.cities[0].farm.crop.payout'),run('p'));
console.log('PASS deterministic outcome persistence and 20000-seed distribution: '+(wins/200).toFixed(2)+'% wins');
run('showOperations()');assert(node('modal-content').innerHTML.includes('农田与盈亏记录'));run('showFinance()');assert(node('modal-content').innerHTML.includes('农业经营'));run('closeModal();openCity(0)');assert(node('details').innerHTML.includes('showFarm(0)'));run('showAgriculture()');assert(node('modal-content').innerHTML.includes('种植中投入'));
console.log('PASS city, operations and ledger entries expose farm history and statistics');

setup();run('plantFarm(0);closeModal()');for(let [day,stage] of [[0,0],[3,1],[6,2],[9,3]]){run('S.day='+day);assert.equal(run('farmStage(S.cities[0])'),stage);}assert(run('!!farmPosition(S.cities[0])'));assert.equal(run('farmPosition(S.cities[0])===farmPosition(S.cities[0])'),true);
console.log('PASS soil, seedling, growing and mature stages, with cached terrain-safe placement');
