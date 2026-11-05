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

// Rendering must never consume simulation randomness or mutate a saved game.
run('reset();closeModal();terrainCache=null;');
const snapshot=run('JSON.stringify(S)'), geometry=run('JSON.stringify({mountains,mountainPolygons,hills})');
run('Math.random=()=>{throw new Error("terrain consumed simulation RNG")};drawTerrain();');
assert.equal(run('JSON.stringify(S)'),snapshot);
assert.equal(run('JSON.stringify({mountains,mountainPolygons,hills})'),geometry);
assert.equal(run('terrainCache.width'),2400);assert.equal(run('terrainCache.height'),1440);
run('var cacheBefore=terrainCache;var originalPaint=paintTerrain;paintTerrain=()=>{throw new Error("terrain repainted every frame")};for(var frameNo=0;frameNo<60;frameNo++)drawTerrain();');
assert(run('terrainCache===cacheBefore'));
run('paintTerrain=originalPaint;var screenContext=ctx;terrainCache=null;paintTerrain=()=>{throw new Error("paint failure")};try{drawTerrain()}catch(e){}');
assert(run('ctx===screenContext'));assert.equal(run('terrainCache'),null);
console.log('PASS terrain render is state-pure, RNG-independent, bounded, cached and exception-safe');
