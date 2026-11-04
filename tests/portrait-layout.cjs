// Focused regression checks for the 0.4 portrait layout and camera.
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
    nodes.set(id, {id, hidden:['details','modal','drawbar'].includes(id), style:{}, offsetParent:{}, textContent:'', innerHTML:'',
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on=on??!classes.has(v);on?classes.add(v):classes.delete(v);return on;},contains:v=>classes.has(v)},
      setAttribute(k,v){this[k]=v;}, addEventListener(){}, contains(){return false;}, setPointerCapture(){},
      getBoundingClientRect(){return this.rect||{left:0,right:10,top:0,bottom:10};}, getContext:()=>canvas});
  }
  return nodes.get(id);
}
node('header').rect={left:0,right:390,top:0,bottom:112};
node('dock').rect={left:12,right:378,top:778,bottom:834};
node('routes').rect={left:12,right:378,top:610,bottom:768};
const storage = new Map();
const context = {console,document:{getElementById:node,createElement:()=>node('offscreen'),addEventListener(){},activeElement:{tagName:'BODY'},
  querySelector:s=>({'header':node('header'),'footer .dock':node('dock'),'#routes':node('routes'),'#details':node('details')}[s]||null)},
  innerWidth:390,innerHeight:844,devicePixelRatio:1,window:{addEventListener(){}},screen:{},performance:{now:()=>100},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>true};
vm.createContext(context);
for (const file of ['game','progression','world','economy']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);
const checks = [];
function test(name,fn){try{fn();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});}}
function assertCitiesVisible(){
  const {band,points} = run('({band:fitBand(),points:realCities().map(c=>({x:c.x*view.scale+view.x,y:c.y*view.scale+view.y}))})');
  for(const p of points){assert(p.x>=12&&p.x<=378,`city x=${p.x} outside viewport`);assert(p.y>=band.top&&p.y<=band.bottom,`city y=${p.y} outside usable map`);}
}
test('opening cities fit above the route sheet',()=>{run('reset();fit()');assertCitiesVisible();});
test('portrait overview includes western and northern/southern far cities',()=>{
  run('reset();S.cities.push(makeCity(-650,-200));S.cities.push(makeCity(-500,920));fit()');assertCitiesVisible();
});
test('zoom-out floor permits the overview scale without changing the camera',()=>{
  const before=run('JSON.stringify(view)');assert(run('minScale()<=view.scale'), 'zoom floor clips the whole-map view');assert.equal(run('JSON.stringify(view)'),before);
});
test('rotation fits the map above an open details sheet',()=>{
  node('details').hidden=false;node('details').rect={left:12,right:378,top:390,bottom:768};node('routes').offsetParent=null;
  run('fit()');assert.equal(run('fitBand().bottom'),380);assertCitiesVisible();
  node('details').hidden=true;node('routes').offsetParent={};
});
test('collapsed route sheet keeps new route available and exposes expanded state',()=>{
  node('collapse').onclick();assert(node('routes').classList.contains('collapsed'));assert.equal(node('collapse')['aria-expanded'],'false');assert.equal(node('newroute').hidden,false);
  node('collapse').onclick();assert.equal(node('collapse')['aria-expanded'],'true');
});
test('dismissed intro notice stays dismissed across UI updates',()=>{
  run('reset();updateUI()');node('notice-close').onclick();run('updateUI()');assert.equal(node('notice').textContent,'');
});
test('empty-fleet route details do not append repeated service sections',()=>{
  run('reset();S.lines=[{id:1,name:"大巴1线",type:"bus",color:"#d36951",stops:[0,1]}];selectLine(1);for(let i=0;i<8;i++)showDetails(false)');
  assert.equal((node('details').innerHTML.match(/class="service-list"/g)||[]).length,1);
});
test('ledger is a real button containing the displayed balance',()=>{
  const html=fs.readFileSync(path.join(root,'dist/test04/index.html'),'utf8');
  const button=html.match(/<button\b[^>]*id="finance"[^>]*>([\s\S]*?)<\/button>/);
  assert(button, 'ledger button is present');
  assert.match(button[1],/<b id="points">/);
});
console.log(JSON.stringify(checks,null,2));
if(checks.some(x=>!x.passed))process.exitCode=1;
