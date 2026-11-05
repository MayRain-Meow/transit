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
for (const file of ['game','progression','world','economy','management','ux','events']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);
const checks = [];
function test(name,fn){try{fn();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});}}
const fresh = () => run('reset();closeModal();clearSelection();S.points=500;updateUI()');

test('new route starts drawing directly, without a type dialog',()=>{
  fresh();run('chooseType()');
  assert(run('!!draft'),'a draft is started');assert.equal(node('modal').hidden,true);assert.equal(node('drawbar').hidden,false);
});
test('drawing bar shows an itemised quote and a priced build button',()=>{
  run('draft.stops=[0,1];draftBar()');
  const cost=run('draftCost()');
  assert.equal(node('drawdone').textContent,'建设 ¥'+cost.cash);assert.equal(node('db-cost').hidden,false);
  assert.match(node('db-cost').innerHTML,/线路 ¥\d+/);assert.match(node('db-cost').innerHTML,/首辆大巴 ¥180/);
});
test('undo removes only the last stop',()=>{
  run('draft.stops=[0,1,2];draftBar()');node('drawundo').onclick();assert.equal(run('JSON.stringify(draft.stops)'),'[0,1]');
});
test('build commits from the bar without a confirmation dialog',()=>{
  const cost=run('draftCost().cash');node('drawdone').onclick();
  assert.equal(run('S.lines.length'),1);assert.equal(run('S.points'),500-cost);assert.equal(node('modal').hidden,true);assert.equal(run('!!draft'),false);
});
test('line sheet renders the fleet stepper and route chips once per change',()=>{
  run('selectLine(S.lines[0].id)');const html=node('details').innerHTML;
  assert.match(html,/ux-stepper/);assert.equal((html.match(/class="ux-stop"/g)||[]).length,2);
  run('for(let i=0;i<5;i++)showDetails(false)');assert.equal(node('details').innerHTML,html);
});
test('fleet plus buys when stock is empty and minus returns a vehicle to stock',()=>{
  run('S.points=1000');const n=run('S.vehicles.length');
  run('uxFleetPlus(S.lines[0].id)');assert.equal(run('S.vehicles.length'),n+1);assert.equal(run('S.points'),820);
  run('uxFleetMinus(S.lines[0].id)');assert.equal(run('S.vehicles.length'),n);assert.equal(run('S.inventory.bus'),1);
});
test('line cancellation shows recovery quote and requires explicit confirmation',()=>{
  const id=run('S.lines[0].id');run(`uxDeleteLine(${id})`);
  assert.equal(run(`S.lines.find(l=>l.id===${id}).retiring`),undefined);
  assert.match(node('modal-content').innerHTML,/取消并回收/);
  run(`confirmLineCancellation(${id},false)`);assert.equal(run(`S.lines.find(l=>l.id===${id})?.retiring??true`),true);
});

test('switching transport type only offers unlocked types with free slots',()=>{
  fresh();run('S.unlocked=["bus","emu"];S.limits.emu=1;chooseType();uxSetType("emu")');assert.equal(run('draft.type'),'emu');
  run('uxSetType("air")');assert.equal(run('draft.type'),'emu');run('cancelDraft(false)');
});
test('balance in the header is shown in whole yuan',()=>{
  run('S.points=12345.67;updateUI()');assert.equal(node('points').textContent,'¥12345');
});
test('tasks list every real city as a tappable row',()=>{
  fresh();run('showTasks()');
  assert.equal((node('modal-content').innerHTML.match(/class="ux-task( is-dormant)?"/g)||[]).length,run('realCities().length'));
});
test('bridge bar does not keep the previous route quote, types or undo',()=>{
  fresh();run('S.unlocked=["bus","emu"];S.limits.emu=1;chooseType();draft.stops=[0,1];draftBar()');
  assert.equal(node('db-cost').hidden,false);assert.equal(node('db-types').hidden,false);assert.equal(node('drawundo').hidden,false);
  run('beginBridge("bus")');
  assert.equal(node('db-cost').hidden,true);assert.equal(node('db-cost').innerHTML,'');assert.equal(node('db-types').hidden,true);
  assert.equal(node('drawundo').hidden,true);assert.equal(node('drawbar').classList.contains('db-line'),false);
  assert.equal(node('drawdone').textContent,'确认桥梁');
  run('bridgeDraft=null;cancelDraft(false)');
});
test('add-carriage button follows the balance on passive refreshes',()=>{
  fresh();run('S.unlocked=["bus","emu"];S.limits.emu=1;S.points=5000;S.inventory.emu=1;draft={type:"emu",name:"动车1线",color:"#4f86a8",stops:[0,1]};commitDraft(true);selectLine(S.lines.at(-1).id)');
  const price=run('carPrice(S.vehicles.find(v=>v.type==="emu"))');
  const button=()=>node('details').innerHTML.match(/<button onclick="upgradeCar\(\d+\)"([^>]*)>/)[1];
  run(`S.points=${price}-1;showDetails(false)`);assert.match(button(),/disabled/);
  run(`S.points=${price};showDetails(false)`);assert.doesNotMatch(button(),/disabled/);
});
test('UX shop keeps upstream train-car purchasing and refreshes its quote',()=>{
  fresh();run('shop()');assert.match(node('modal-content').innerHTML,/暂无可扩容列车/);
  run('S.unlocked=["bus","emu","rail"];S.limits.emu=S.limits.rail=2;S.points=20000;beginDraft("emu");draft.stops=[0,1];commitDraft(true);beginDraft("rail");draft.stops=[1,2];commitDraft(true);shop()');
  const id=run('S.vehicles.find(v=>v.type==="emu").id'), before=run('S.points');
  assert.match(node('modal-content').innerHTML,new RegExp(`purchaseTrainCar\\(${id},2\\)`));
  assert.match(node('modal-content').innerHTML,/动车 \/ 高铁 · 增加车厢/);
  run(`purchaseTrainCar(${id},2)`);
  assert.equal(run('S.points'),before-70);assert.equal(run(`S.vehicles.find(v=>v.id===${id}).cars`),3);
  assert.equal(run('S.vehicles.find(v=>v.type==="rail").cars'),2);
  assert.match(node('modal-content').innerHTML,new RegExp(`purchaseTrainCar\\(${id},3\\)`));
  assert.match(node('modal-content').innerHTML,/＋1节车厢 · ¥90/);
});
test('merged UX keeps school maintenance and repair-centre controls and effects',()=>{
  fresh();run('S.points=20000;S.cities[0].size=1;confirmSchool(0);cityService(S.cities[0]).rating="良";beginDraft("bus");draft.stops=[0,1];commitDraft(true);showCityEconomy(0)');
  assert.match(node('modal-content').innerHTML,/维护减免生效/);assert.match(node('modal-content').innerHTML,/检修中心/);
  assert(run('maintenanceAssets().some(a=>a.schoolDiscount===.1)'));
  run('var roadKey=Object.keys(S.infrastructure)[0],before=upgradeQuote(roadKey).days;confirmRepairCenter(0);showEngineering()');
  assert.match(node('modal-content').innerHTML,/查看范围/);assert(run('upgradeQuote(roadKey).days<before'));
  run('previewRepairCenter(0);render();showMaintenance()');assert.match(node('modal-content').innerHTML,/学校−10%/);
});
test('new help explains both school savings and repair centres',()=>{fresh();run('help()');assert.match(node('modal-content').innerHTML,/检修中心/);assert.match(node('modal-content').innerHTML,/维护费−10%/);});
test('portrait rotates the map and screen↔world conversions are inverse',()=>{
  run('resize()');assert.equal(run('view.rot'),1);
  const err=run('(()=>{let p={x:313.5,y:-87.25},q=toScreen(p),w=toWorld({clientX:q.x,clientY:q.y});return Math.hypot(w.x-p.x,w.y-p.y)})()');
  assert(err<1e-9,'round trip error '+err);
  run('fit()');const cities=run('JSON.stringify(realCities().map(c=>toScreen(c)))');const band=run('fitBand()');
  for(const p of JSON.parse(cities)){assert(p.x>=12&&p.x<=378,'x '+p.x);assert(p.y>=band.top&&p.y<=band.bottom,'y '+p.y);}
});
test('dragging a line-end handle chains cities and backs off when retraced',()=>{
  fresh();run('S.points=5000;draft={type:"bus",name:"大巴1线",color:"#c56544",stops:[0,1]};commitDraft(true);clearSelection();resize()');
  const tail=run('JSON.stringify(uxHandles().find(h=>h.end==="tail"))');assert(tail,'tail handle exists');
  const at=i=>run(`(()=>{let q=toScreen(S.cities[${i}]);return {clientX:q.x,clientY:q.y}})()`);
  run('beginDraft("bus",S.lines[0].id);uxExt={id:1,line:S.lines[0].id,end:"tail",base:[...S.lines[0].stops],added:[],moved:true}');
  run(`uxExtMove(${JSON.stringify(at(2))})`);assert.equal(run('JSON.stringify(draft.stops)'),'[0,1,2]');
  run(`uxExtMove(${JSON.stringify(at(1))})`);assert.equal(run('JSON.stringify(draft.stops)'),'[0,1]');
  run(`uxExtMove(${JSON.stringify(at(2))})`);run('uxExtFinish(false)');
  const built=run('JSON.stringify(S.lines[0].stops)'),pending=run('draft&&JSON.stringify(draft.stops)');
  assert(built==='[0,1,2]'||pending==='[0,1,2]','extension committed or waiting on the priced build button');
  run('if(draft)cancelDraft(false)');
});
test('extending from the head prepends in travel order',()=>{
  fresh();run('S.points=5000;draft={type:"bus",name:"大巴1线",color:"#c56544",stops:[1,2]};commitDraft(true);clearSelection();resize()');
  const at=run('(()=>{let q=toScreen(S.cities[0]);return {clientX:q.x,clientY:q.y}})()');
  run('beginDraft("bus",S.lines[0].id);uxExt={id:1,line:S.lines[0].id,end:"head",base:[...S.lines[0].stops],added:[],moved:true}');
  run(`uxExtMove(${JSON.stringify(at)})`);assert.equal(run('JSON.stringify(draft.stops)'),'[0,1,2]');
  run('uxExt=null;cancelDraft(false)');
});
console.log(JSON.stringify(checks,null,2));
if(checks.some(x=>!x.passed))process.exitCode=1;
