import { fileURLToPath } from 'node:url';
// Late-game drawing performance: a real touch drag (CDP Input) from one city to another while the CPU profiler runs.
// usage: SETUP=setupLate.js node dragperf.mjs WxH [from] [to]   (env: URL, STEPS, MOUSE=1 for a mouse drag)
// Prints the wall time of each input dispatch (handler cost), frame gaps measured in the page and the functions
// with the most self time during the drag.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [size = '461x709', from = '青浦', to = '锦州'] = process.argv.slice(2);
const url = process.env.URL || 'http://127.0.0.1:8791/';
const port = 9334 + Math.floor(Math.random() * 400);
const profile = (process.env.VERIFY_TMP || fileURLToPath(new URL('../../../.verify-tmp', import.meta.url))) + '/cdp_perf_' + port;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=' + profile, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') console.log('PAGE-ERROR', (m.params.exceptionDetails.exception?.description || '').slice(0, 300)); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const run = async code => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true }); return r.result?.exceptionDetails ? { error: r.result.exceptionDetails.exception?.description } : r.result?.result?.value; };
const [w, h] = size.split('x').map(Number), mouse = !!process.env.MOUSE;
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: +(process.env.DSF || 1), mobile: !mouse });
await send('Emulation.setTouchEmulationEnabled', { enabled: !mouse });
await send('Runtime.enable');
await send('Page.navigate', { url });
for (let i = 0; i < 60; i++) { await wait(250); if (await run("return typeof S!=='undefined'&&!!S&&typeof uxVisibleRect==='function'&&document.readyState==='complete'")) break; }
// SETUP may list several files joined with + (e.g. setupLate.js+setupHeavy.js); they run in order
const setup = (process.env.SETUP || 'setupLate.js').split('+').filter(f => f && fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
console.log('setup', JSON.stringify(await run(setup + `\ntry { const st = activityState(); st.offers = []; st.next = 1e9; } catch (e) {} closeModal(); clearSelection(); updateUI(); S.paused = false; await new Promise(r => setTimeout(r, 1500)); return { lines: S.lines.length, cities: realCities().length };`)));
// MODE: pan (drag empty map), new (＋新建线路, then drag city → city), extend (select a line, drag its ＋ tab to a city)
const mode = process.env.MODE || 'new';
const pts = await run(`closeModal(); const cz = realCities(), a = cz.find(c => c.name.startsWith(${JSON.stringify(from)})) || cz[0], b = cz.find(c => c.name.startsWith(${JSON.stringify(to)})) || cz.at(-1);
  const mode = ${JSON.stringify(mode)}; let pa = toScreen(a), pb = toScreen(b);
  if (mode === 'pan') { let best = null; for (let x = 60; x < innerWidth - 60; x += 20) for (let y = 140; y < innerHeight * .55; y += 20) { const d = Math.min(...cz.map(c => { const q = toScreen(c); return Math.hypot(q.x - x, q.y - y); })); if (!best || d > best.d) best = { x, y, d }; } pa = { x: best.x, y: best.y }; pb = { x: best.x + 90, y: best.y + 120 }; }
  if (mode === 'grab') { let best = null; for (const l of S.lines) for (let i = 1; i < l.stops.length; i++) { const p = toScreen(lanePoint(S.cities[l.stops[i - 1]], S.cities[l.stops[i]], l, .5)); const d = Math.min(...cz.map(c => { const q = toScreen(c); return Math.hypot(q.x - p.x, q.y - p.y); })); if (p.x > 30 && p.x < innerWidth - 30 && p.y > 140 && p.y < innerHeight * .6 && (!best || d > best.d)) best = { ...p, d, line: l.name }; } pa = { x: best.x, y: best.y }; pb = { x: best.x + 70, y: best.y + 90 }; }
  if (mode === 'new') { document.getElementById('newroute')?.click(); await new Promise(r => setTimeout(r, 300)); }
  if (mode === 'extend') { const l = S.lines.find(l => l.stops[0] === a.id || l.stops.at(-1) === a.id) || S.lines[0]; selectLine(l.id); await new Promise(r => setTimeout(r, 900)); const hd = uxVisibleHandles().sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0]; pa = toScreen(hd); }
  return { a: a.name, b: b.name, pa, pb, mode, newMode: typeof drawMode !== 'undefined' ? drawMode : null };`);
console.log('drag', JSON.stringify(pts));
await run(`window.__fr = []; let last = performance.now(); const tick = t => { __fr.push(t - last); last = t; if (!window.__stop) requestAnimationFrame(tick); }; requestAnimationFrame(tick);`);
await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start');
const steps = +(process.env.STEPS || 40), times = [];
const touch = async (type, x, y) => { const t0 = performance.now(); if (mouse) await send('Input.dispatchMouseEvent', { type: type === 'touchStart' ? 'mousePressed' : type === 'touchEnd' ? 'mouseReleased' : 'mouseMoved', x, y, button: 'left', buttons: type === 'touchEnd' ? 0 : 1, clickCount: 1 }); else await send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); times.push(performance.now() - t0); };
await touch('touchStart', pts.pa.x, pts.pa.y); await wait(120);
if (process.env.DEBUG) console.log('after start', JSON.stringify(await run(`return { gesture: gesture && gesture.kind, moved: gesture?.moved, pointers: pointers.size, sel: selected, modal: modalOpen, paused: S.paused, hit: hitCity(toWorld({ clientX: ${pts.pa.x}, clientY: ${pts.pa.y} }))?.name, picker: !document.getElementById('junction-picker').hidden, top: document.elementFromPoint(${pts.pa.x}, ${pts.pa.y})?.id || document.elementFromPoint(${pts.pa.x}, ${pts.pa.y})?.className }`)));
for (let i = 1; i <= steps; i++) { await touch('touchMove', pts.pa.x + (pts.pb.x - pts.pa.x) * i / steps, pts.pa.y + (pts.pb.y - pts.pa.y) * i / steps); await wait(16); }
const mid = await run(`return { draft: !!draft, stops: draft?.stops?.map(i => S.cities[i].name), gesture: gesture?.kind, bridge: !!bridgeDraft, sel: selected?.type, cam: [view.x|0, view.y|0, +view.scale.toFixed(2)] };`);
await touch('touchEnd', pts.pb.x, pts.pb.y); await wait(500);
const prof = (await send('Profiler.stop')).result.profile;
const fr = await run(`window.__stop = true; return __fr;`);
const self = new Map(), byId = new Map(prof.nodes.map(n => [n.id, n]));
const dt = prof.timeDeltas; prof.samples.forEach((s, i) => { const n = byId.get(s), cf = n.callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000); });
const top = [...self].filter(([k]) => !/^\(idle\)|^\(program\)|^\(garbage/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 18));
const st = [...times].sort((a, b) => b - a), sf = [...fr].sort((a, b) => b - a);
console.log('mid-drag', JSON.stringify(mid));
console.log('input ms: max', st[0].toFixed(0), 'top5', st.slice(0, 5).map(v => v.toFixed(0)).join(','), 'sum', times.reduce((a, b) => a + b, 0).toFixed(0));
console.log('frames:', fr.length, 'max gap', sf[0]?.toFixed(0), 'top5', sf.slice(0, 5).map(v => v.toFixed(0)).join(','));
console.log('self time (ms):'); for (const [k, v] of top) console.log('  ' + v.toFixed(0).padStart(6) + '  ' + k);
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch {} } process.exit(0);
