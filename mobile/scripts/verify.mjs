import {transform} from 'esbuild';
import assert from 'node:assert/strict';
import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'www');
const cfg=JSON.parse(await readFile(path.join(root,'capacitor.config.json'),'utf8'));
assert.equal(cfg.webDir,'www');assert(!cfg.server.url);assert.equal(cfg.android.minWebViewVersion,108);assert.equal(cfg.android.allowMixedContent,false);
const css=await readFile(path.join(out,'style.css'),'utf8');
const parsedCss=await transform(css,{loader:'css',minify:true});
assert.equal(parsedCss.warnings.length,0,'packaged stylesheet must parse cleanly');
assert(parsedCss.code.includes(':root{--ink:#263b42;'),'root palette must survive font removal');
assert(!css.includes('display=swap'),'font URL tail must be fully removed');
assert((await readFile(path.join(out,'portrait-layout.css'),'utf8')).includes('background:#263b42!important;color:#fff!important'),'build action must have explicit contrast');
console.log('PASS packaged CSS parses without warnings; root palette and build contrast retained');
let checked=0,hashes={};
for(const name of await readdir(out)){
 if(!/\.(html|css|js)$/.test(name))continue;
 const s=await readFile(path.join(out,name),'utf8');hashes[name]=createHash('sha256').update(s).digest('hex');
 if(name.endsWith('.css'))assert(!/@import\s+url\(['"]https?:/.test(s),'online font import: '+name);
 if(name.endsWith('.html'))for(const m of s.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const ref=m[1].split('?')[0];if(/^(data:|https?:|mailto:)/.test(ref))continue;
  const f=path.resolve(out,ref);assert(f.startsWith(out+path.sep));assert((await stat(f)).isFile(),name+' missing '+ref);checked++;
 }
}
const nativeCfg=JSON.parse(await readFile(path.join(root,'android/app/src/main/assets/capacitor.config.json'),'utf8'));assert.equal(nativeCfg.appId,cfg.appId);assert(!nativeCfg.server.url);
const plugins=JSON.parse(await readFile(path.join(root,'android/app/src/main/assets/capacitor.plugins.json'),'utf8'));assert(plugins.some(p=>p.classpath==='com.capacitorjs.plugins.app.AppPlugin'));
const data=JSON.parse(await readFile(path.join(root,'package-lock.json'),'utf8'));assert.equal(data.packages['node_modules/@capacitor/app'].version,'8.1.2');
await mkdir(path.join(root,'validation'),{recursive:true});await writeFile(path.join(root,'validation/assets.json'),JSON.stringify({checkedLocalReferences:checked,remoteGameServer:false,externalFonts:false,hashes},null,2));console.log('PASS',checked,'local asset references; no remote game server/font; Android App plugin registered');
