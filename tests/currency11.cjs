// 1.1 transport currency scaling and legacy save migration regression checks.
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
for (const file of ['currency11','game','progression','world','economy','management','ux','events','balance1','market']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);

run('reset();closeModal();S.points=1000000;S.unlocked=["bus","emu","rail","air"];S.inventory={bus:0,emu:0,rail:0,air:0,bridge:0,tunnel:0};');
let base={};base.initial=run('fresh().points');base.vehicles=run('Object.fromEntries(Object.entries(TYPES).map(([t,v])=>[t,v.vehicle]))');base.cars=run('Object.fromEntries(["emu","rail"].map(t=>[t,carPrice({type:t,cars:2})]))');base.school=run('SCHOOL_COST');base.center=run('REPAIR_CENTER_COST');base.station=run('stationQuote(S.cities[0]).price');base.bridge=run('bridgePrice({x:0,y:0},{x:38,y:0},"bus")');base.mission=run('missionSpec(S.cities[0]).reward');base.fare=run('tripFare({origin:0,legs:{}},S.cities[1])');base.cards=run('CARD1_BONUS.slice()');base.contract=run('S.day=20;acceptContract(0);S.contract.reward');
run('S.contract=null;beginDraft("bus");draft.stops=[0,1];var cost=draftCost();commitDraft(true);');base.route=run('cost.cash');base.maintenance=run('maintenanceAssets()[0].monthly');base.upgrade=run('upgradeQuote(Object.keys(S.infrastructure)[0]).price');base.repair=run('repairQuote(Object.keys(S.infrastructure)[0]).price');
run('S.cities[2].shape=3;S.cities[2].size=1;');base.discountBus=run('TYPES.bus.vehicle');base.discountUpgrade=run('upgradeQuote(Object.keys(S.infrastructure)[0]).price');
const old=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/economy1-baseline.json'),'utf8'));function compare(a,b,p=''){for(const key of Object.keys(a)){let name=p+'.'+key;if(a[key]&&typeof a[key]==='object')compare(a[key],b[key],name);else assert(Math.abs(a[key]-b[key]*10)<.000001,name+': '+a[key]+' vs '+b[key]*10);}}compare(base,old);console.log('PASS every sampled transport price, fare, award, discounted quote and maintenance is exactly10x');

// Conversion covers pending obligations and preserves finance as an opaque account.
const legacy={version:1,economyVersion:6,points:177,day:19,delivered:38,ledger:{fares:40,construction:230,financialBuildings:100,financialInvestment:52,financialRedemptions:8},history:[{label:'道路建设',amount:-230},{label:'东岸建设银行',amount:-100},{label:'买入东岸银行 2股',amount:-52},{label:'理财赎回',amount:8}],infrastructure:{road:{investment:230}},vehicles:[{investment:160,people:[1,2]}],stockAssets:{bus:[{investment:152}]},bridges:[{price:151}],maintenance:{accrued:1.25,debt:8,months:[{bill:6.87,paid:5,education:120,debt:1.87}]},cities:[{school:{lastSubsidy:120},financeBuildings:{bank:1,broker:1}}],contract:{reward:100},event:{cost:20,share:30,bonus:80},eventArchive:[{bonus:40}],activityCards:{debt:30,active:{bonus:180,fine:60},offers:[{bonus:300}],history:[{penalty:20}]},financial:{wealthLots:[{principal:52,units:51}],deposited:52,market:{stocks:[{price:26,shares:2,cost:52}],seed:123}}};
context.oldSave=JSON.stringify(legacy);
run('var migrated=migrateEconomy11(JSON.parse(oldSave));');
const converted=JSON.parse(run('JSON.stringify(migrated)'));
assert.equal(converted.points,1770);assert.equal(converted.day,19);assert.equal(converted.delivered,38);
assert.equal(converted.ledger.construction,2300);assert.equal(converted.history[0].amount,-2300);
for(const category of ['financialBuildings','financialInvestment','financialRedemptions'])assert.equal(converted.ledger[category],legacy.ledger[category]);
assert.deepEqual(converted.history.slice(1),legacy.history.slice(1));assert.deepEqual(converted.financial,legacy.financial);assert.deepEqual(converted.cities[0].financeBuildings,legacy.cities[0].financeBuildings);
assert.equal(converted.infrastructure.road.investment,2300);assert.equal(converted.vehicles[0].investment,1600);assert.equal(converted.stockAssets.bus[0].investment,1520);assert.equal(converted.bridges[0].price,1510);
assert.equal(converted.maintenance.accrued,12.5);assert.equal(converted.maintenance.debt,80);assert.equal(converted.maintenance.months[0].education,1200);assert.equal(converted.contract.reward,1000);assert.equal(converted.event.bonus,800);assert.equal(converted.activityCards.debt,300);assert.equal(converted.activityCards.active.fine,600);assert.equal(converted.activityCards.history[0].penalty,200);
assert.equal(run('JSON.stringify(migrateEconomy11(migrated))'),JSON.stringify(converted));
console.log('PASS old transport amounts migrate once; financial assets, transactions, counts and progress are preserved');
// Use a complete valid old save to exercise the real load/back-up chain.
run('var oldComplete=fresh();delete oldComplete.moneyScale;oldComplete.points=177;oldComplete.release="1.0";localStorage.setItem("transit-atlas-v1",JSON.stringify(oldComplete));');
assert.equal(run('load()'),true);assert.equal(run('S.points'),1770);assert.equal(run('S.moneyScale'),10);assert.equal(run('S.release'),'1.2');
assert.equal(JSON.parse(storage.get('transit-atlas-before-1.1')).points,177);
assert.equal(run('load()'),true);assert.equal(run('S.points'),1770);assert.equal(JSON.parse(storage.get('transit-atlas-before-1.1')).points,177);
console.log('PASS real loading backs up the original save and persists the conversion without repeat multiplication');
