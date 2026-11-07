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



run(`reset();closeModal();S.day=120;S.points=100000;S.spawnDay=1e6;S.unlocked=['bus','emu','rail','air'];S.cityRegions=[{id:0,x:200,y:400,name:'海岸城圈'},{id:1,x:-400,y:400,name:'北麓城圈',discoveredAt:120,nextLocalAt:130}];S.cities=[];for(let i=0;i<9;i++){let c=makeCity(i<6?100+i*40:-400+(i-6)*200,400,0,i%3,i%3);c.regionId=i<6?0:1;c.dormant=i>6;c.openingAt=122.5+(i-6)*10;c.regionalGrowth=i>=6;c.activatedDay=120;S.cities.push(c);}S.regionMobility=null;var limit=S.limits.bus;updateRegionalExpansion();`);
assert.equal(run('S.limits.bus'),run('limit')+2);
run('S.cities[7].dormant=false;updateRegionalExpansion()');assert.equal(run('S.limits.bus'),run('limit')+2);
run('S.cities[8].dormant=false;updateRegionalExpansion();var awarded=JSON.stringify(S.limits);updateRegionalExpansion()');assert.equal(run('S.limits.bus'),run('limit')+2);assert.equal(run('JSON.stringify(S.limits)'),run('awarded'));
run('save();load();updateRegionalExpansion()');assert.equal(run('JSON.stringify(S.limits)'),run('awarded'));
console.log('PASS discovery-time bonus independent of open-city count, one-time bonus and save/reload');
run(`S.day=120;var low=passengerRate(S.cities[6]);S.day=180;var mature=passengerRate(S.cities[6]);var ordinary=.07*2.2;`);assert(Math.abs(run('low/ordinary')-.14)<1e-9);assert(Math.abs(run('mature/ordinary')-1.15)<1e-9);
run(`S.cities=S.cities.filter(c=>c.regionId===0||c.id===6);var origin=S.cities[6];origin.q=[];for(let i=0;i<100;i++)newPassenger(origin);`);assert.equal(run('origin.q.length'),100);assert(run('origin.q.every(p=>p.destRegion===0)'));
console.log('PASS 14% initial / 115% mature demand; lone frontier demand reaches original circle');
run(`S.cities=[];for(let i=0;i<9;i++){let c=makeCity(i<6?100+i*40:-400+(i-6)*40,400,0,i%3,i%3);c.regionId=i<6?0:1;c.dormant=false;S.cities.push(c);}S.lines=[{id:1,type:'bus',color:'#123',stops:S.cities.map(c=>c.id)}];S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,people:[],cars:1}];var originalPlan=plan;plan=(id,p)=>({time:60,target:p.dest});S.day=79;`);
for(let star=1;star<=6;star++){run(`var e=makeActivityCard(${star},0,activitySources(0));`);assert(run('e.sources.every(id=>S.cities[id].regionId===0)'));}
run('S.day=80;var randomBefore=Math.random;Math.random=()=>0;');
for(let star=1;star<=6;star++){run(`var e=makeActivityCard(${star},0,activitySources(0));`);assert.equal(run('e.crossRegion'),star>=4);assert(run(star>=4?'e.sources.every(id=>S.cities[id].regionId===1)':'e.sources.every(id=>S.cities[id].regionId===0)'));}
run(`var reverse=makeActivityCard(6,6,activitySources(6));`);assert(run('reverse.crossRegion&&reverse.sources.every(id=>S.cities[id].regionId===0)'));
run(`S.cities[8].dormant=true;var unformed=makeActivityCard(6,0,activitySources(0));`);assert.equal(run('unformed.crossRegion'),false);
run(`S.cities[8].dormant=false;S.vehicles=[];var disconnected=makeActivityCard(6,0,activitySources(0));`);assert.equal(run('disconnected.crossRegion'),false);
run(`Math.random=randomBefore;plan=originalPlan;S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,people:[],cars:1}];`);
console.log('PASS day80 + formation + staffed connectivity, 1-3 local, 4-6 cross, both directions');
run(`var card={...reverse,id:'test-locate',revealed:false};activityState().offers=[card];S.paused=false;var oldView=JSON.stringify(view);locateActivityCity(card.id);`);assert.equal(run('S.paused'),false);assert.equal(run('JSON.stringify(view)'),run('oldView'));
run(`card.revealed=true;showActivityCards();locateActivityCity(card.id);`);assert.equal(run('S.paused'),true);assert.equal(run('modalOpen'),false);assert.equal(run('selected.id'),6);assert.equal(run('view.x+S.cities[6].x*view.scale'),run('W/2'));assert(run('activityCardHTML(card).includes("定位任务城市")'));
run(`activityState().active={...card,start:80,end:100,spawned:0,delivered:0,good:0};activityState().offers=[];showActivityCards();`);assert(node('modal-content').innerHTML.includes('locateActivityCity'));run('locateActivityCity(card.id)');assert.equal(run('modalOpen'),false);
console.log('PASS concealed/revealed/active location button, real camera centering and pause');
run(`S.cities.forEach(c=>delete c.repairCenter);S.cities[0].repairCenter={built:0};S.cities[0].x=0;S.cities[0].y=0;var full=repairAdjustedQuote({days:10},{x:0,y:0},{x:100,y:0}),half=repairAdjustedQuote({days:10},{x:0,y:0},{x:600,y:0});S.cities[1].repairCenter={built:0};S.cities[1].x=0;S.cities[1].y=0;var overlap=repairAdjustedQuote({days:10},{x:0,y:0},{x:100,y:0});`);assert.equal(run('full.days'),9);assert.equal(run('half.days'),9.5);assert.equal(run('overlap.days'),9);
console.log('PASS 10% full / 5% half coverage, overlap does not stack');
run(`reset();closeModal();S.day=100;S.unlocked=['bus','rail'];S.cities=[];S.cityRegions=[{id:0,x:200,y:400,name:'海岸城圈'},{id:1,x:-400,y:400,name:'北麓城圈',discoveredAt:100,nextLocalAt:110}];for(let i=0;i<7;i++){let c=makeCity(i<6?100+(i%3)*195:-400,i<6?300+Math.floor(i/3)*195:400,0,i%3,i%3);c.regionId=i<6?0:1;c.dormant=false;S.cities.push(c);}S.lines=[];var randomSaved=Math.random;Math.random=marketRng(71237);spawnCity();`);assert.equal(run('realCities().length'),7);
run('S.day=110;spawnCity()');assert.equal(run('realCities().length'),8);assert.equal(run('S.cities[7].regionId'),1);assert.equal(run('S.cities[7].openingAt'),112.5);assert(run('S.cities[7].regionalGrowth'));run('spawnCity()');assert.equal(run('realCities().length'),8);
run('S.cities[7].dormant=false;S.day=120;spawnCity()');assert.equal(run('realCities().length'),9);run('S.cities[8].dormant=false;S.day=130;spawnCity()');assert.equal(run('realCities().length'),10);run('Math.random=randomSaved');
console.log('PASS unconnected remote local spawning at10/20/30 days, opening delay and duplicate prevention');

run(`S.lines=[{id:1,type:'bus',name:'测试公交',color:'#507d70',stops:S.cities.map(c=>c.id)}];S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,people:[],cars:1}];S.day=150;S.unlocked=['bus','emu','rail','air'];for(let c of S.cities)c.dormant=false;for(let i=1;i<S.cities.length;i++){let a=S.cities[i-1],b=S.cities[i];S.infrastructure[key(a,b,'bus')]={type:'bus',a:a.id,b:b.id,level:0};}var nativeCards=[];for(let i=0;i<40;i++){activityState().offers=[];generateActivityOffers();nativeCards.push(...activityState().offers);} `);
assert(run('nativeCards.length===120'));assert(run('nativeCards.every(e=>e.sources.length&&e.sources.every(id=>!!plan(id,{origin:id,eventId:"verify-native",dest:e.host})))'));assert(run('nativeCards.every(e=>e.star>=4||e.sources.every(id=>S.cities[id].regionId===S.cities[e.host].regionId))'));
console.log('PASS 120 cards with native routing and protection wrapper, nonempty reachable sources and low-star region restriction');
