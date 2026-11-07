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


const fixture=`reset();closeModal();S.day=0;S.points=100000;S.spawnDay=1e6;S.farOffered=true;S.cityRegions=[{id:0,x:200,y:400,name:'海岸城圈'},{id:1,x:-400,y:400,name:'北麓城圈'}];S.cities=[];for(let i=0;i<12;i++){let c=makeCity(i<6?100+i*40:-400+(i-6)*40,400,0,i%3,i%3);c.regionId=i<6?0:1;c.dormant=false;S.cities.push(c);}S.lines=[];S.vehicles=[];var baseBusLimit=S.limits.bus;`;
run(fixture+`updateRegionalExpansion();var initialLimits=JSON.stringify(S.limits);updateRegionalExpansion();`);
assert.equal(run('S.limits.bus'),run('baseBusLimit')+2);assert.equal(run('JSON.stringify(S.limits)'),run('initialLimits'));assert.deepEqual(JSON.parse(run('JSON.stringify(S.unlocked)')),['bus']);
run(`S.day=500;S.delivered=9999;for(let c of S.cities)c.size=1;checkUnlocks();var afterUnlock=JSON.stringify(S.limits);checkUnlocks();`);assert.equal(run('S.limits.emu'),5);assert.equal(run('S.limits.rail'),4);assert.equal(run('S.limits.air'),3);assert.equal(run('JSON.stringify(S.limits)'),run('afterUnlock'));
run(`save();var savedMobility=JSON.parse(localStorage.getItem('transit-atlas-v1')).regionMobility;S.regionMobility=JSON.parse(JSON.stringify(savedMobility));updateRegionalExpansion();`);assert.equal(run('JSON.stringify(S.limits)'),run('afterUnlock'));
console.log('PASS second-circle line bonus once, no forced unlock, deferred bonuses survive unlock and save');
run(fixture+`updateRegionalRelations(true);S.day=90;updateRegionalRelations(true);`);assert.equal(run('regionPair(0,1).operatingDays'),0);assert.equal(run('regionPairShare(0,1)'),.03);
run(`S.lines=[{id:1,type:'bus',color:'#123456',stops:[0,6]}];S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,people:[],cars:1}];updateRegionalRelations(true);S.day=120;updateRegionalRelations(true);`);assert.equal(run('regionPair(0,1).operatingDays'),30);assert(Math.abs(run('regionPairShare(0,1)')-.075)<1e-9);
run(`S.vehicles=[];updateRegionalRelations(true);S.day=180;updateRegionalRelations(true);`);assert.equal(run('regionPair(0,1).operatingDays'),30);
run(`S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,people:[],cars:1}];updateRegionalRelations(true);S.day=380;updateRegionalRelations(true);`);assert.equal(run('regionPairShare(0,1)'),.3);
run(`S.blockages[key(S.cities[0],S.cities[6],'bus')]={status:'broken',cause:'quake',allowed:[]};updateRegionalRelations(true);S.day=410;updateRegionalRelations(true);`);assert.equal(run('regionPair(0,1).operatingDays'),230);
console.log('PASS relation clock advances only with staffed connected service, stops on closure, caps at30%');
run(fixture+`S.cityRegions.push({id:2,x:-800,y:400,name:'西原城圈'});S.cities[8].regionId=2;S.lines=[{id:1,type:'bus',stops:[0,6,1]},{id:2,type:'bus',stops:[6,8]}];S.vehicles=[{id:1,line:1,type:'bus',index:0,service:{mode:'express',skip:[6]}},{id:2,line:2,type:'bus',index:0}];var links=regionalNetworkLinks();`);assert.equal(run("links.has('0:1')"),false);assert.equal(run("links.has('0:2')"),false);assert.equal(run("links.has('1:2')"),true);
console.log('PASS skipped express stops do not manufacture transfer connectivity between regions');
run(fixture+`function sampleTrips(days,seed,n=15000){regionPair(0,1).operatingDays=days;let randomBefore=Math.random;Math.random=marketRng(seed);let c=S.cities[0],cross=0;for(let i=0;i<n;i++){newPassenger(c);let p=c.q.pop();if(p.destRegion!==0)cross++;if(i%100===0)cityService(c).records=[];}Math.random=randomBefore;return cross/n;}var shares=[sampleTrips(0,40201),sampleTrips(90,40202),sampleTrips(180,40203)];`);
const shares=JSON.parse(run('JSON.stringify(shares)'));assert(Math.abs(shares[0]-.03)<.006);assert(Math.abs(shares[1]-.165)<.012);assert(Math.abs(shares[2]-.3)<.012);console.log('PASS 45000 sampled ordinary trips, cross-region shares:',shares.map(x=>(x*100).toFixed(2)+'%').join(', '));
run(`var pLocal={origin:0,color:S.cities[1].color,shape:S.cities[1].shape,destRegion:0},pCross={...pLocal,destRegion:1};`);assert(run('matchesDestination(S.cities[1],pLocal)'));assert.equal(run('matchesDestination(S.cities[7],pLocal)'),false);assert(run('matchesDestination(S.cities[7],pCross)'));assert.equal(run('matchesDestination(S.cities[1],pCross)'),false);assert(run('matchesDestination(S.cities[1],{origin:0,schoolId:0,dest:1,destRegion:1})'));assert(run('matchesDestination(S.cities[1],{origin:0,eventId:"e",dest:1,destRegion:1})'));
run(`S.lines=[{id:1,type:'bus',stops:[0,1,6,7]}];S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,cars:1,people:[]}];routingBatch={routes:new Map(),travel:new Map()};var a=plan(0,pLocal),b=plan(0,pCross);routingBatch=null;`);assert.equal(run('a.target'),1);assert.equal(run('b.target'),7);
run(`S.cities[0].q=[pLocal,pCross];selected={type:'city',id:0};showDetails();`);assert.equal((node('details').innerHTML.match(/destination-row/g)||[]).length,2);run(`focusPassenger('normal',7,pCross.color,pCross.shape,1)`);assert.equal(run('selected.regionId'),1);assert(run('passengerLabel(pCross).includes("北麓城圈")'));
console.log('PASS region-bound matching, routing memo separation, queue grouping and destination focus; school/event rules retained');
run(fixture+`for(let c of S.cities.slice(0,7))c.school={built:0};updateTransportResearch();var cashBefore=S.points;startTransportResearch('electric_bus');`);assert.equal(run('researchState().unlockedAt'),null);assert.equal(run('S.points'),run('cashBefore'));run(`S.cities[7].school={built:0};updateTransportResearch();S.points=1000;startTransportResearch('electric_bus');`);assert.equal(run('researchState().unlockedAt'),0);assert.equal(run('researchState().active'),null);assert.equal(run('S.points'),1000);
run(`S.points=100000;S.unlocked=['bus','emu','rail','air'];var oldTime=edgeTime(S.cities[0],S.cities[1],'bus');startTransportResearch('electric_bus');var paid=S.points;startTransportResearch('emu_traction');`);assert.equal(run('S.points'),94000);assert.equal(run('S.points'),run('paid'));assert.equal(run('researchState().active.id'),'electric_bus');run(`S.day=29.999;updateTransportResearch()`);assert.equal(run('researchState().completed.electric_bus'),undefined);run(`S.day=30;updateTransportResearch();updateTransportResearch();startTransportResearch('electric_bus');`);assert.equal(run('S.points'),94000);assert.equal(run('researchSpeedFactor("bus")'),1.15);assert(Math.abs(run('edgeTime(S.cities[0],S.cities[1],"bus")')-run('oldTime')/1.15)<1e-9);assert.equal(run('researchSpeedFactor("rail")'),1);
run(`for(let c of S.cities)c.school=null;updateTransportResearch();save();var researchSave=JSON.parse(localStorage.getItem('transit-atlas-v1')).transportResearch;S.transportResearch=JSON.parse(JSON.stringify(researchSave));`);assert.equal(run('researchState().unlockedAt'),0);assert.equal(run('researchSpeedFactor("bus")'),1.15);
console.log('PASS 7/8-school gate, funds, one active project, day-boundary completion, permanent speed effect and reload');
run(`S.infrastructure={'bus-0-1':{type:'bus',a:0,b:1,level:0},'track-0-1':{type:'track',a:0,b:1,level:0}};S.bridges=[{id:1,type:'bus',heads:[2,3],status:'open',level:0},{id:2,type:'track',heads:[4,5],status:'open',level:0}];var maintenanceBase=maintenanceBeforeResearch(),maintenanceAfter=maintenanceAssets();`);
const base=JSON.parse(run('JSON.stringify(maintenanceBase)')),after=JSON.parse(run('JSON.stringify(maintenanceAfter)'));for(let asset of base){let out=after.find(x=>x.key===asset.key),expected=asset.key==='bus-0-1'||asset.key==='bridge-1'?Math.round(asset.monthly*.8*100)/100:asset.monthly;assert.equal(out.monthly,expected,asset.key);}
run(`var vehicle={type:'bus',index:0,dir:1,t:.25},line={type:'bus',stops:[0,1]};var advanced=advanceVehicleProgress(vehicle,line,S.cities[0],S.cities[1],.01);`);assert(run('advanced>.25'));run(`showOperations()`);assert(node('modal-content').innerHTML.includes('进入科研'));run('showTransportResearch()');assert(node('modal-content').innerHTML.includes('新能源公交'));assert(node('modal-content').innerHTML.includes('研究完成'));run('showFinance()');assert(node('modal-content').innerHTML.includes('科研投入'));
console.log('PASS electric-bus maintenance discounts road/road bridge only, real movement and research UI/ledger render');
run(fixture+`S.cityRegions.push({id:2,x:-900,y:400,name:'西原城圈'});for(let i=12;i<18;i++){let c=makeCity(-900+(i-12)*40,400,0,i%3,i%3);c.regionId=2;c.dormant=false;S.cities.push(c);}for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)regionPair(a,b).operatingDays=180;var threeShare=sampleTrips(180,40204);`);assert(Math.abs(run('threeShare')-.3)<.012);
run(`S.cities=S.cities.filter(c=>c.regionId!==2||c.id===12);S.regionMobility=null;var generated=0;var priorRandom=Math.random;Math.random=marketRng(40205);var frontier=S.cities[12];for(let i=0;i<15000;i++){newPassenger(frontier);if(frontier.q.pop())generated++;if(i%100===0)cityService(frontier).records=[];}Math.random=priorRandom;`);assert(run('generated===15000'));
console.log('PASS three mature regions share one30% outward limit; isolated one-city frontier sends its ramped demand outward');
run(fixture+`researchState().completed.electric_bus={at:S.day};var vMotion={type:'bus',index:0,dir:1,t:.25},lMotion={type:'bus',stops:[0,1]};var improved=advanceVehicleProgress(vMotion,lMotion,S.cities[0],S.cities[1],.01);delete researchState().completed.electric_bus;var ordinary=advanceVehicleProgress(vMotion,lMotion,S.cities[0],S.cities[1],.01);`);assert(Math.abs(run('(improved-.25)/(ordinary-.25)')-1.15)<1e-8);console.log('PASS electric-bus research improves actual movement by15%, not only the displayed quote');
