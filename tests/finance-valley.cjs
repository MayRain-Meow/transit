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


run('reset();closeModal();updateUI()');assert.equal(node('market').hidden,false);assert.equal(node('market').disabled,false);run('showFinancialMarket()');assert(node('modal-content').innerHTML.includes('金融市场尚未解锁'));assert(node('modal-content').innerHTML.includes('银行尚未建设'));assert(node('modal-content').innerHTML.includes('证券公司尚未建设'));assert(node('modal-content').innerHTML.includes('圆环内菱形'));assert(node('modal-content').innerHTML.includes('中层级'));assert(node('modal-content').innerHTML.includes('高层级'));assert(!node('modal-content').innerHTML.includes('market-stock-list'));
run('showFinancialMarket();S.day=100;syncFinancial();openStockMarket()');assert.equal(run('financeState().market'),null);assert.equal(run('financeState().wealthNav'),1);assert.equal(run('financeState().curve.length'),0);
run('S.points=10000;S.cities[2].shape=2;S.cities[2].size=2;S.cities[2].dormant=false;buildFinance(2,"broker")');assert.equal(run('financeBuildingCount("broker")'),0);
run('showCityEconomy(2)');assert(node('modal-content').innerHTML.includes('建设银行 ¥100'));
run('buildFinance(2,"bank");closeModal();updateUI()');assert.equal(node('market').hidden,false);assert.equal(run('financeUnlocked("broker")'),false);
run('showFinancialMarket("stocks")');assert.equal(run('marketTab'),'wealth');assert(node('modal-content').innerHTML.includes('股票市场尚未解锁'));assert(node('modal-content').innerHTML.includes('银行已建设'));assert(!node('modal-content').innerHTML.includes('market-stock-list'));assert.equal(run('financeState().market'),null);
run('S.day=150;syncFinancial();buildFinance(2,"broker")');assert.equal(run('financeState().market.days'),0);assert.equal(run('financeState().market.openedAt'),150);
run('S.day=150.375;syncFinancial()');assert.equal(run('financeState().market.days'),1);
run('showFinancialMarket("stocks")');assert(node('modal-content').innerHTML.includes('相对开市涨跌幅'));assert(node('modal-content').innerHTML.includes('持仓收益率'));assert(!node('modal-content').innerHTML.includes('每日倍率'));
run('buyWealth(100);S.day=151.375;syncFinancial();showFinancialMarket("wealth")');assert(node('modal-content').innerHTML.includes('−5%～+10%'));assert(node('modal-content').innerHTML.includes('收益率'));
run('var rateReport=JSON.stringify(financeState().lastReport);buyWealth(100);showFinancialMarket("portfolio")');assert.equal(run('JSON.stringify(financeState().lastReport)'),run('rateReport'));assert(node('modal-content').innerHTML.includes('累计投资收益率'));
assert.equal(run('marketPercent(null)'),'—');assert.equal(run('marketPercent(.05)'),'+5.00%');
console.log('PASS bank gates entry, brokerage gates stock UI/clock, no pre-opening backfill, percent returns and immutable reports');
run('reset();closeModal();S.points=20000');
for(let y=50;y<=650;y+=5){run(`var p={x:river(${y})-19,y:${y},side:-1},q={x:river(${y})+19,y:${y},side:1}`);assert.equal(run('bridgeTerrainIssue(p,q)'),null,'cross-river at '+y);assert.equal(run('mountainCrossings(p,q).length'),0);}
run('var p={x:river(130)-19,y:130,side:-1},q={x:river(130)+19,y:130,side:1};bridgeDraft={type:"bus",a:p,b:q};var initialCash=S.points;createBridge()');assert.equal(run('S.bridges.length'),1);assert(run('S.points<initialCash'));assert.equal(run('mountainCrossings(S.cities[S.bridges[0].heads[0]],S.cities[S.bridges[0].heads[1]]).length'),0);
assert(run('mountainCrossings({x:100,y:155},{x:300,y:155}).length>0'));
run('var p={x:540,y:130,side:-1},q={x:river(130)+19,y:130,side:1};bridgeDraft={type:"bus",a:p,b:q};var cashBefore=S.points;var bridgesBefore=S.bridges.length;updateBridgeBar();createBridge()');
assert(run('bridgeTerrainIssue(p,q).includes("山体")'));assert.equal(node('drawdone').disabled,true);assert.equal(run('S.points'),run('cashBefore'));assert.equal(run('S.bridges.length'),run('bridgesBefore'));
console.log('PASS 121 river positions incl. mountain overlap, actual build, rock tunnel retained, invalid bridge preview/commit no charge');
