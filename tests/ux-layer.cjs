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
for (const file of ['game','progression','world','economy','ux']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
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
test('deleting a line needs two taps and never calls confirm()',()=>{
  const id=run('S.lines[0].id');run(`uxDeleteLine(${id})`);
  assert.equal(run(`!!S.lines.find(l=>l.id===${id}).retiring`),false);assert.match(node('details').innerHTML,/再点一次确认撤销/);
  run(`uxDeleteLine(${id})`);assert.equal(run(`S.lines.find(l=>l.id===${id})?.retiring??true`),true);
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
console.log(JSON.stringify(checks,null,2));
if(checks.some(x=>!x.passed))process.exitCode=1;
