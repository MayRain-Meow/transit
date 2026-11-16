import { fileURLToPath } from 'node:url';
// Late-network touch rules (user 2026-11-15, 拉线打架): real CDP touch drags on the heavy late scene.
// usage: node gestures.mjs [WxH]   (env: URL, SETUP — default setupLate.js+setupHeavy.js)
//  1 drag from a shared station, nothing selected → a new line starts there (no line picker)
//  2 drag on a stretch of line, nothing selected → the map pans, no draft
//  3 drag on the selected line → that line is pulled (elastic draft of it)
//  4 fast stroke across a town → that town is not attached;  5 slow stroke → attached
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [size = '390x844'] = process.argv.slice(2);
const url = process.env.URL || 'http://127.0.0.1:8791/';
const port = 9334 + Math.floor(Math.random() * 400);
const profile = (process.env.VERIFY_TMP || fileURLToPath(new URL('../../../.verify-tmp', import.meta.url))) + '/cdp_gest_' + port;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=' + profile, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') console.log('PAGE-ERROR', (m.params.exceptionDetails.exception?.description || '').slice(0, 300)); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const run = async code => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true }); return r.result?.exceptionDetails ? { error: r.result.exceptionDetails.exception?.description } : r.result?.result?.value; };
const [w, h] = size.split('x').map(Number);
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true }); await send('Runtime.enable');
const setup = (process.env.SETUP || 'setupLate.js+setupHeavy.js').split('+').filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
const tp = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts });
async function stroke(a, b, steps, gap) { await tp('touchStart', [{ ...a, id: 1 }]); await wait(60); for (let i = 1; i <= steps; i++) { await tp('touchMove', [{ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps, id: 1 }]); await wait(gap); } }
const lift = async () => { await tp('touchEnd', []); await wait(300); };
async function fresh() {
  await send('Page.navigate', { url });
  for (let i = 0; i < 60; i++) { await wait(250); if (await run("return typeof S!=='undefined'&&!!S&&typeof uxVisibleRect==='function'&&document.readyState==='complete'")) break; }
  await run(setup + `\ntry { const st = activityState(); st.offers = []; st.next = 1e9; } catch (e) {} closeModal(); clearSelection(); S.paused = true; updateUI(); await new Promise(r => setTimeout(r, 900)); closeModal(); return 1;`);
}
const results = []; const step = (n, ok, info) => { results.push(ok); console.log((ok ? 'ok  ' : 'FAIL') + ' ' + n + '  ' + JSON.stringify(info).slice(0, 300)); };
const state = () => run(`return { draft: !!draft, stops: draft?.stops?.map(i => S.cities[i].name.split('·')[0]), original: draft?.original ?? null, kind: gesture?.kind ?? null, picker: !document.getElementById('junction-picker').hidden, view: [Math.round(view.x), Math.round(view.y)] }`);
// 1: a station on several lines, nothing selected
await fresh();
let p = await run(`const c = realCities().filter(c => cityLines(c.id).length > 1).map(c => ({ c, q: toScreen(c) })).filter(({ q }) => q.x > 60 && q.x < innerWidth - 60 && q.y > 160 && q.y < innerHeight * .55)[0]; return c ? { x: c.q.x, y: c.q.y, name: c.c.name, lines: cityLines(c.c.id).length } : null`);
await stroke(p, { x: p.x + 40, y: p.y + 90 }, 10, 20); let s = await state(); await lift(); await run('if (draft) cancelDraft(false); clearSelection(); closeModal(); return 1');
step('1 shared station drag → new line', s.draft && !s.original && s.stops?.[0] === p.name.split('·')[0] && !s.picker, { from: p.name, lines: p.lines, ...s });
// 2: a stretch of line far from towns, nothing selected
const seg = await run(`let best = null; const cz = realCities(); for (const l of S.lines) for (let i = 1; i < l.stops.length; i++) { const q = toScreen(lanePoint(S.cities[l.stops[i - 1]], S.cities[l.stops[i]], l, .5)); const d = Math.min(...cz.map(c => { const r = toScreen(c); return Math.hypot(r.x - q.x, r.y - q.y); })); if (q.x > 40 && q.x < innerWidth - 40 && q.y > 160 && q.y < innerHeight * .55 && (!best || d > best.d) && routeHit(toWorld({ clientX: q.x, clientY: q.y }))?.l?.id === l.id) best = { x: q.x, y: q.y, d, line: l.id, name: l.name }; } return best;`);
const v0 = (await state()).view; await stroke(seg, { x: seg.x + 60, y: seg.y + 80 }, 10, 20); s = await state(); await lift();
step('2 unselected line drag → pan', !s.draft && (s.view[0] !== v0[0] || s.view[1] !== v0[1]), { line: seg.name, ...s, v0 });
// 3: the same stretch with its line selected
await run(`if (draft) cancelDraft(false); selectLine(${seg.line}); return 1`); await wait(900);
const seg3 = await run(`const l = S.lines.find(l => l.id === ${seg.line}); let best = null; for (let i = 1; i < l.stops.length; i++) { const q = toScreen(lanePoint(S.cities[l.stops[i - 1]], S.cities[l.stops[i]], l, .5)); const d = document.getElementById('details').getBoundingClientRect().top; if (q.y < d - 30 && q.y > 140 && routeHit(toWorld({ clientX: q.x, clientY: q.y }))?.l?.id === l.id) best = { x: q.x, y: q.y }; } return best;`);
if (seg3) { await stroke(seg3, { x: seg3.x + 50, y: seg3.y - 60 }, 10, 20); s = await state(); await lift(); step('3 selected line drag → edit it', s.draft && s.original === seg.line, { ...s }); }
else step('3 selected line drag → edit it', false, { reason: 'no grabbable stretch above the sheet' });
// 4/5: a straight stroke between two towns with a third town right on the way (new line from a town without lines)
await fresh();
const trio = await run(`const cz = realCities().map(c => ({ c, q: toScreen(c) })).filter(({ q }) => q.x > 30 && q.x < innerWidth - 30 && q.y > 150 && q.y < innerHeight * .6); let best = null;
  for (const a of cz) for (const b of cz) for (const m of cz) { if (a === b || m === a || m === b) continue; const L = Math.hypot(b.q.x - a.q.x, b.q.y - a.q.y); if (L < 160) continue; const t = ((m.q.x - a.q.x) * (b.q.x - a.q.x) + (m.q.y - a.q.y) * (b.q.y - a.q.y)) / (L * L); if (t < .3 || t > .7) continue; const px = a.q.x + (b.q.x - a.q.x) * t, py = a.q.y + (b.q.y - a.q.y) * t, off = Math.hypot(m.q.x - px, m.q.y - py); if (off < 6 && (!best || off < best.off)) best = { a: { x: a.q.x, y: a.q.y, name: a.c.name.split('·')[0] }, b: { x: b.q.x, y: b.q.y, name: b.c.name.split('·')[0] }, m: m.c.name.split('·')[0], off, mx: m.q.x, my: m.q.y }; }
  return best;`);
if (!trio) { step('4 fast stroke skips a town', false, { reason: 'no aligned trio on screen' }); step('5 slow stroke attaches it', false, {}); }
else {
  const end = { x: trio.a.x + (trio.b.x - trio.a.x) * .97, y: trio.a.y + (trio.b.y - trio.a.y) * .97 };
  await stroke(trio.a, end, 8, 12); s = await state(); await lift(); await run('if (draft) cancelDraft(false); clearSelection(); closeModal(); return 1');
  step('4 fast stroke skips a town', s.draft && !s.stops.includes(trio.m), { via: trio.m, off: +trio.off.toFixed(1), stops: s.stops });
  await stroke(trio.a, end, 60, 30); s = await state(); await lift(); await run('if (draft) cancelDraft(false); return 1');
  step('5 slow stroke attaches it', s.draft && s.stops.includes(trio.m), { via: trio.m, stops: s.stops });
}
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch {} } process.exit(0);
