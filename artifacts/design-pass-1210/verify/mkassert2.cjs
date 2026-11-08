// Browser assertions for the 2026-11-08 design pass. Writes scenA_E.json (early game), scenA_F.json (fresh game),
// scenA_L.json (late network). Each probe acts through the page's own controls and returns {ok, ...details}.
const fs = require('fs');
const W = ms => `await new Promise(r => setTimeout(r, ${ms}));`;
const P = {
  stock_tab: `uxOpenHub('money', 3); ${W(300)}
const on = [...document.querySelectorAll('.ux-hub-tabs button')].filter(b => b.classList.contains('on') || b.getAttribute('aria-selected') === 'true').map(b => b.textContent);
return { ok: on.length === 1 && on[0] === '股票', on };`,
  trade: `let f = financeState(); f.everBank = true; f.everBroker = true; S.cities[__com].size = 2; S.points = 1e6;
try { buildFinance(__com, 'bank'); } catch (e) {} try { buildFinance(__com, 'broker'); } catch (e) {} closeModal();
uxOpenHub('money', 3); ${W(400)}
const m = document.getElementById('modal-content'), q = document.getElementById('stock-quantity');
q.scrollIntoView({ block: 'center' }); ${W(100)} const top = m.scrollTop;
q.value = '5'; q.dispatchEvent(new Event('input', { bubbles: true }));
const buy = [...m.querySelectorAll('button')].find(b => /买入/.test(b.textContent) && /tradeStock/.test(b.getAttribute('onclick') || ''));
const cash0 = S.points; buy.click(); ${W(300)}
const m2 = document.getElementById('modal-content'), q2 = document.getElementById('stock-quantity');
return { ok: top > 100 && Math.abs(m2.scrollTop - top) < 4 && q2.value === '5' && S.points < cash0, top, after: m2.scrollTop, qty: q2.value, spent: Math.round(cash0 - S.points) };`,
  research: `uxOpenHub('money', 0); ${W(200)} showTransportResearch(); ${W(200)}
const back = !!document.querySelector('#modal-content .ux-back');
document.querySelector('#modal-content .modal-head .close').click(); ${W(200)}
return { ok: back && !modalOpen, back, modalOpen };`,
  // name AND colour, through each exit: 取消 and × keep both as they were; 保存设置 keeps both edits
  rename: `const l = S.lines[0], name0 = l.name, color0 = l.color, out = {};
const edit = async () => { renameLine(l.id); ${W(200)} document.getElementById('linename').value = '改了一半';
  const sw = [...document.querySelectorAll('#modal-content .colors button')].find(b => !(b.getAttribute('onclick') || '').includes("'" + l.color + "'")); sw.click(); ${W(100)}
  return /'(#[0-9a-f]+)'/i.exec(sw.getAttribute('onclick'))[1]; };
let picked = await edit(); out.preview = l.color === picked;
[...document.querySelectorAll('#modal-content button')].find(b => b.textContent.trim() === '取消').click(); ${W(200)}
out.cancel = !modalOpen && l.name === name0 && l.color === color0;
picked = await edit(); document.querySelector('#modal-content .modal-head .close').click(); ${W(200)}
out.close = !modalOpen && l.name === name0 && l.color === color0;
picked = await edit(); document.querySelector('#modal-content button.primary[onclick^="applyName"]').click(); ${W(200)}
out.save = !modalOpen && l.name === '改了一半' && l.color === picked;
l.name = name0; l.color = color0; updateUI();
return { ok: out.preview && out.cancel && out.close && out.save, ...out };`,
  quake: `uxOpenHub('build', 0); ${W(200)}
const q = document.querySelector('#modal-content .quake-summary'); return { ok: !!q && q.classList.contains('is-idle') && q.getBoundingClientRect().height < 70, h: q && Math.round(q.getBoundingClientRect().height) };`,
  peek: `if (!portraitMode) return { ok: true, skipped: 'peek is a portrait sheet state' };
openCity(__com); ${W(600)} const d = document.getElementById('details');
const bar = d.querySelector('.ux-peekbar'), vis = !!bar && getComputedStyle(bar).display !== 'none' && d.classList.contains('is-peek');
bar.click(); ${W(400)} const full1 = d.classList.contains('is-full');
uxSheetSet('peek'); ${W(400)}
d.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); ${W(300)}
return { ok: vis && full1 && d.classList.contains('is-full'), peekbar: vis, click: full1, wheel: d.classList.contains('is-full') };`,
  facstrip: `openCity(__com); ${W(600)} const d = document.getElementById('details');
const strip = d.querySelector('.ux-fac-strip'); if (!strip) return { ok: false, strip: false };
const r = strip.getBoundingClientRect(), dr = d.getBoundingClientRect(), inView = r.bottom <= dr.bottom - (portraitMode ? 40 : 0);
strip.querySelector('button[data-i]').click(); ${W(900)}
const tile = d.querySelector('.ux-fac-tile').getBoundingClientRect(), d2 = d.getBoundingClientRect();
return { ok: inView && (!portraitMode || d.classList.contains('is-full')) && tile.top >= d2.top - 1 && tile.bottom <= d2.bottom + 2, inView };`,
  cards: `S.day = 40; const st = activityState(); st.offers = []; st.active = null; st.next = 0; generateActivityOffers();
${W(100)} closeModal(); uxOpenHub('goal', 1); ${W(500)}
document.querySelector('#modal-content .activity-back')?.click(); ${W(900)} document.getAnimations().forEach(a => a.finish());
const c = document.querySelector('#modal-content .card-content128'), h = c ? c.getBoundingClientRect().height : 0;
const tools = [...document.querySelectorAll('.deck-tools128 button')].every(b => b.getBoundingClientRect().bottom <= innerHeight);
return { ok: h >= 120 && tools, contentH: Math.round(h), tools };`,
  coach: `const c = document.getElementById('ux-coach'), before = !c.hidden;
openCity(realCities()[1].id); ${W(500)} uxSheetSet('full'); ${W(700)}
const during = !document.getElementById('ux-coach').hidden;
clearSelection(); ${W(700)}
return { ok: before && !during && !document.getElementById('ux-coach').hidden && !document.getElementById('notice').textContent, before, during };`,
  tray: `const p = document.getElementById('routes'), rows = [...p.querySelectorAll('.route-row')], pr = p.getBoundingClientRect();
const allIn = rows.every(r => { const b = r.getBoundingClientRect(); return b.top >= pr.top && b.bottom <= pr.bottom + 1 && b.left >= pr.left - 1 && b.right <= pr.right + 1; });
document.getElementById('collapse').click(); ${W(200)}
// a swatch counts only if the point at its centre really hits it (catches clipping by any ancestor, overlap, off-screen)
const hit = b => { const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; return r.width >= 12 && x > 0 && x < innerWidth && y > 0 && y < innerHeight && b.contains(document.elementFromPoint(x, y)); };
const sws = [...p.querySelectorAll('.ux-swatches button')], sw = sws.filter(hit).length, h = p.getBoundingClientRect().height;
const newC = document.getElementById('route-new130'), newOk = hit(newC), colOk = hit(document.getElementById('collapse'));
const last = sws.at(-1); last.click(); ${W(300)} const picked = selected?.type === 'line' && selected.id === S.lines.at(-1).id; clearSelection(); ${W(300)}
document.getElementById('collapse').click(); ${W(100)}
const nb = document.getElementById('route-new130').getBoundingClientRect(), fits = nb.right <= p.getBoundingClientRect().right + 1;
return { ok: rows.length === S.lines.length && allIn && sw === S.lines.length && picked && newOk && colOk && fits && (!portraitMode || h < 100), rows: rows.length, allIn, swatches: sw + '/' + sws.length, tapLast: picked, newBtn: newOk, collapsedH: Math.round(h) };`,
  wait: `openCity(window.__hub); ${W(600)} const d = document.getElementById('details');
const rows = [...d.querySelectorAll('.ux-wait-row')].map(r => +r.querySelector('b').textContent), groups = d.querySelectorAll('.ux-wait-group').length;
const load = d.querySelector('.ux-load em')?.textContent || '';
return { ok: rows.length >= 5 && groups >= 1 && rows[0] >= rows[1] && /超出/.test(load), rows: rows.slice(0, 5), groups, load };`,
  junction: `showJunction(window.__hub); ${W(900)}
const em = document.querySelector('#junction-picker .junction-city-task em'), c = toScreen(S.cities[window.__hub]), p = document.getElementById('junction-picker').getBoundingClientRect();
const visible = c.y > 40 && c.y < innerHeight && (portraitMode ? c.y < p.top - 10 : !(c.x > p.left && c.x < p.right && c.y > p.top && c.y < p.bottom));
return { ok: !!em && em.classList.contains('is-over') && visible, pill: em?.textContent, visible };`,
  ended: `${W(2800)} S.lives = 0; updateUI(); toast('已回到游戏 · 当前暂停，点 ▶ 继续');
let opened = false; const go = gameover; gameover = () => { opened = true; }; document.getElementById('pause').click(); gameover = go;
return { ok: document.getElementById('pause').textContent === '结算' && /本局已结束/.test(document.getElementById('toast').textContent) && opened };`,
};
const mk = (file, names) => fs.writeFileSync(file, JSON.stringify(names.map(n => ({ name: 'a_' + n, js: P[n], wait: 300 }))));
mk('scenA_E.json', ['stock_tab', 'trade', 'research', 'rename', 'quake', 'peek', 'facstrip', 'cards']);
mk('scenA_F.json', ['coach']);
mk('scenA_L.json', ['tray', 'wait', 'junction', 'ended']);
console.log('built');
