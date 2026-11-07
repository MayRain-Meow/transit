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
for (const file of ['currency11','game','progression','world','economy','management','ux','events','balance1','market']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);


const crypto=require('node:crypto');
for(const f of require('./fixtures/stock-v4-paths.json'))assert.equal(crypto.createHash('sha256').update(run('JSON.stringify(generateMarketYear('+f.seed+','+f.year+').returns)')).digest('hex'),f.sha256);
console.log('PASS 20 production paths match frozen fitted model');
run('reset();S.points=20000000;S.cities[2].shape=2;S.cities[2].size=2;S.cities[2].dormant=false;buildFinance(2,"bank");buildFinance(2,"broker");tradeStock(0,"buy",10);buyWealth(200);closeModal();S.day=9.375;syncFinancial();var legacy=JSON.parse(JSON.stringify(S));delete legacy.stockPathRevision;legacy.financial.market.plan={year:0,returns:Array.from({length:15},()=>Array(365).fill(1.001))};var oldEncoded=JSON.stringify(legacy);');
storage.clear();storage.set('transit-atlas-v1',run('oldEncoded'));
run('load();var m=financeState().market;var oldPositions=JSON.stringify(m.stocks),oldHistory=JSON.stringify(m.history),oldWealth=JSON.stringify(financeState().wealthLots),oldCurve=JSON.stringify(financeState().curve),oldCash=S.points;syncFinancial()');
assert.equal(storage.get('transit-atlas-before-stock-v4'),run('oldEncoded'));
for(const [a,b] of [['JSON.stringify(m.stocks)','oldPositions'],['JSON.stringify(m.history)','oldHistory'],['JSON.stringify(financeState().wealthLots)','oldWealth'],['JSON.stringify(financeState().curve)','oldCurve'],['S.points','oldCash']])assert.equal(run(a),run(b));
run('var index=m.days%365,previous=m.stocks[0].price;var expected=generateMarketYear(financeState().seed,0).returns[0][index];S.day=m.nextAt;syncFinancial()');
assert(Math.abs(run('m.stocks[0].price/previous-expected'))<1e-12);assert.equal(run('m.plan.pathModel'),'regime-news-v4');assert.equal(run('m.stocks[0].shares'),10);assert.equal(run('JSON.stringify(m.history.slice(0,-1))'),run('oldHistory'));
run('save();var saved=JSON.stringify(financeState());load();syncFinancial()');assert.equal(run('JSON.stringify(financeState())'),run('saved'));assert.equal(storage.get('transit-atlas-before-stock-v4'),run('oldEncoded'));
console.log('PASS legacy save backup, next-quote switch, holdings/history and reload stability');
run('m=financeState().market;m.days=365;m.plan.year=0;var p=m.stocks[0].price,expected=generateMarketYear(financeState().seed,1).returns[0][0];settleStockDay()');assert.equal(run('m.plan.year'),1);assert(Math.abs(run('m.stocks[0].price/p-expected'))<1e-12);
run('reset()');assert.equal(run('S.release'),'1.2');assert.equal(run('S.points'),5000);assert.equal(run('S.moneyScale'),10);assert.equal(run('CARD1_POWER.join()'),'1,1,1,1.15,1.25,1.5');assert.equal(run('S.stockPathRevision'),4);
console.log('PASS continuous year rollover and unchanged 1.1 economy');
