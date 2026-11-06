/* 0.4 体验层 — loaded last, after economy.js.
   Interface only: no changes to economy parameters, save keys or simulation rules.
   Sections: helpers · header · sheets · welcome/help · line building · line sheet · tasks · shop · camera/touch. */

/* ---------- helpers ---------- */
const UX_COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer:coarse)').matches;
globalThis.HIT_PX = UX_COARSE ? 30 : 21;      // city hit radius in screen px (game.js hitCity)
globalThis.ROUTE_PX = UX_COARSE ? 18 : 12;    // route hit tolerance in screen px (game.js routeHit)
let uxLastType = null;

function money(n) { return '¥' + Math.floor((+n || 0) + 1e-6); }
function haptic(ms = 8) { try { if (UX_COARSE) navigator.vibrate?.(ms); } catch {} }
function uxEl(id) { return document.getElementById(id); }
// Centre a world point in the usable map band (works with the portrait rotation).
function panTo(x, y, scale = view.scale) {
  const b = fitBand(), cx = W / 2, cy = (b.top + b.bottom) / 2;
  animateView(view.rot ? { scale, x: cx + y * scale, y: cy - x * scale } : { scale, x: cx - x * scale, y: cy - y * scale });
}
function uxFocusCity(id) {
  const c = S.cities[id]; if (!c) return;
  closeModal(); hideJunction(); selected = { type: 'city', id }; showDetails();
  // Portrait: the sheet framing (uxFrameSelection) places the city and remembers the prior view for close.
  if (!portraitMode) requestAnimationFrame(() => panTo(c.x, c.y));
}
function uxTypes() { return ['bus', 'emu', 'rail', 'air'].filter(t => TYPES[t]); }
function uxFreeSlots(t) { return S.limits[t] - S.lines.filter(l => l.type === t && !l.retiring).length; }
function uxServiceLabel(v) {
  return (v.pendingService ? '交接中' : v.service?.mode === 'interval' ? '区间车' : v.service?.mode === 'express' ? '快车' : '全程')
    + (v.parked ? ' · 停在端点' : '') + (v.recall ? ' · 待回收' : '');
}

/* ---------- header: whole-yuan balance ---------- */
const uxUpdateUI = updateUI;
updateUI = function () {
  uxUpdateUI();
  const p = uxEl('points'); if (p) p.textContent = money(S.points);
  const n = uxEl('notice'); if (n && n.textContent.startsWith('城市成长测试版')) n.textContent = uxCoachActive() ? '' : '点城市查看任务 · 拖线后在底栏点「建设」';
  if (n && /运营中心|工程采购|交通采购|收支账本/.test(n.textContent)) n.textContent = uxRename(n.textContent);
};

/* ---------- line palette: distinct on small screens, away from the passenger destination hues ---------- */
// Old palette had three near-identical blues/purples and hues next to passenger colours (blue, gold, purple).
// The first four are the most distinct. Only new lines use it; saved lines keep their stored colour.
if (typeof LINECOL !== 'undefined') LINECOL.splice(0, LINECOL.length, '#d36951', '#2f8a78', '#3f5a9e', '#8a9a2e', '#b4487e', '#8a5a3c', '#4f9a4f', '#5f6f78');

/* ---------- retired entry names in upstream texts → the three hubs ---------- */
const UX_RENAMES = [['运营中心选择', '点「目标」选择'], ['交通采购', '建造·车辆'], ['工程采购', '建造'], ['收支账本', '资金·收支'], ['运营中心', '目标']];
function uxRename(t) { t = String(t); for (const [a, b] of UX_RENAMES) t = t.split(a).join(b); return t; }

/* ---------- sheets (modals) ---------- */
const uxOpenModal = openModal;
openModal = function (html) {
  html = uxRename(S ? String(html).split('¥' + S.points).join(money(S.points)) : String(html));
  uxOpenModal(html);
  const m = uxEl('modal-content'); m.scrollTop = 0; m.style.transform = '';
};
function uxDismissModal() {
  const close = uxEl('modal-content').querySelector('.modal-head .close, .close');
  if (close) close.click();
}
(function sheetGestures() {
  const overlay = uxEl('modal'), sheet = uxEl('modal-content');
  overlay.addEventListener('click', e => { if (e.target === overlay) uxDismissModal(); });
  // Swipe the sheet down from its top to dismiss (phones in portrait).
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', e => {
    if (!portraitMode || sheet.scrollTop > 0 || !sheet.querySelector('.close')) return;
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (y0 === null) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 0 && sheet.scrollTop <= 0) { sheet.style.transition = 'none'; sheet.style.transform = `translateY(${dy}px)`; }
    else { y0 = null; sheet.style.transform = ''; }
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 === null) return;
    sheet.style.transition = ''; y0 = null;
    if (dy > 90) { sheet.style.transform = 'translateY(100%)'; setTimeout(uxDismissModal, 150); }
    else sheet.style.transform = '';
  });
})();

/* ---------- welcome & help ---------- */
welcome = function (hasSave) {
  openModal(`<div class="ux-hero"><span class="eyebrow">东岸 · 0.5 城市活动版</span><h1>从一条线，带动一座城。</h1>
<p class="ux-lead">从一座城市拖向另一座，修出线路、派出车辆，把乘客送到与他们标记同色同形的城市。完成城市任务拿奖金，看小镇长大。</p></div>
<ul class="ux-points">
<li><i>¥</i><span><b>起步资金有限</b>大巴 ¥${TYPES.bus.vehicle}，拉线另计建设费，报价就在底栏</span></li>
<li><i>↗</i><span><b>任务推动繁荣</b>点城市或「任务」查看阶段目标，奖金自动到账</span></li>
<li><i>♥</i><span><b>别让乘客久等</b>候客厅持续满员才会失去生命</span></li>
</ul>
<div class="ux-actions"><button class="primary ux-wide" onclick="startGame()">${hasSave ? '继续游戏' : '开始游戏'}</button>${hasSave ? '<button id="ux-new" class="ux-ghost" onclick="uxConfirmNew(this)">重新开始</button>' : ''}</div>
<p class="ux-foot">独立测试存档，不影响正式版 · 每游戏日 12 秒 · <a href="../updates/index.html">更新说明</a> · <a href="../">正式版</a></p>`);
};
function uxConfirmNew(btn) {
  if (btn.dataset.armed) { newGame(); return; }
  btn.dataset.armed = '1'; btn.textContent = '再点一次：清空存档并重开'; btn.classList.add('ux-danger');
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = '重新开始'; btn.classList.remove('ux-danger'); } }, 4000);
}

help = function () {
  const sec = (title, items, open) => `<details class="ux-help"${open ? ' open' : ''}><summary>${title}</summary><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></details>`;
  openModal(`<div class="modal-head"><div><h2>玩法速查</h2><small>点标题展开</small></div><button class="close" onclick="closeModal()">×</button></div>
${sec('基本操作', [
    '<b>建线</b>：从城市拖到下一座城市，可连续经过多座；松手后在底栏选交通方式、看报价，点「建设」。',
    '<b>撤销一站</b>：拉线时点 ↶ 去掉最后一站。',
    '<b>延长</b>：选中线路后，从端点城市拖到新城市。',
    '<b>挂站 / 摘站</b>：拖动线路上的线段经过城市；也可在线路详情里点站名旁的 ×，8 秒内可撤销。',
    '<b>地图</b>：单指拖动平移，双指缩放，⌖ 回到全图；拉线到屏幕边缘时地图会自动跟随。',
    '<b>电脑</b>：空格暂停，滚轮缩放，Esc 取消或关闭。'], true)}
${sec('乘客与任务', [
    '乘客头上的小方块是目的地：<b>颜色＋形状</b>相同的城市都能接收。点城市候车列表可在地图标出目标。',
    '候客厅满员累计180秒才扣生命（旅游城市225秒），最后8秒警告；低于容量逐渐恢复，降到80%以下加快恢复。个人等待只影响服务质量。',
    '每座城市有 6 个阶段任务，奖金自动到账；连续类任务中断只重置天数，不扣钱。',
    '新城镇需要拉线接通才会产生乘客，接通后有 45 秒宽限。'])}
${sec('资金与车辆', [
    uxTypes().map(t => TYPES[t].name + ' ¥' + TYPES[t].vehicle).join(' · ') + '。新车进库存，在线路详情里点「＋」加车（没有库存会直接购买）。',
    '票款按起终点距离 1 / 2 / 3，乘坐方式加权：动车 ×1.4，高铁 ×1.8，飞机 ×3。',
    '每 10 天固定补助；道路月底收维护费，账本里可看预计支出、拆除闲置道路。',
    '动车、高铁可加车厢（最多8节），回库存后保留编组。取消线路可保留资产，或回收闲置道路50%、车辆车厢70%。',
    '刚完成建线、改线、建桥或升级后，20秒内可点右上「撤回」全额退款；已载客、被共用或开始后续付费建设时不适用。'])}
${sec('工程与天气', [
    '<b>桥梁</b>：工程 → 拉建公路桥 / 铁路桥，从一岸拖到对岸。',
    '<b>道路升级</b>：线路详情 → 道路升级，施工期间该路段减速 30%。',
    '<b>气象站</b>范围内天气减速减半；<b>交通枢纽</b>候车容量翻倍，基础最多 3 座，六星活动可增加名额；换乘准备−30%，附近进站提速15%。',
    '7 月下旬至 9 月可能有台风；第 150 天后有小概率地震，受损路段可在工程里维修。',
    '<b>检修中心</b>：中大城市可建，¥' + (typeof REPAIR_CENTER_COST === 'number' ? REPAIR_CENTER_COST : '') + '、半径300，新开工升级和抢修工期最多缩短30%，部分覆盖按长度折算。'])}
${sec('运营与解锁', [
    '<b>商演</b>：运营 → 筹办，观众带音符，前往举办城市后再返程。',
    '<b>服务合同</b>：10 天内完成指定城市的有效运输，达标得奖金，未达标不扣钱。',
    '<b>城市服务与学校</b>：长期差评会让城市降级，改善后可恢复。学校正常招生、评价优或良时，连接本城设施维护费−10%。',
    '<b>解锁</b>：动车 第25天＋送达60人；高铁 第65天＋250人＋3座小城；飞机 第120天＋600人。'])}
<p class="ux-foot"><a href="../updates/index.html">完整更新说明</a></p>`);
};

/* ---------- line building: no type dialog, inline quote, one-tap build ---------- */
chooseType = function () {
  if (draft) return;
  const free = uxTypes().filter(t => S.unlocked.includes(t) && uxFreeSlots(t) > 0);
  if (!free.length) return toast('线路名额已满：撤销一条线路，或等待解锁新的交通方式');
  beginDraft(free.includes(uxLastType) ? uxLastType : free[0]);
};
function uxSetType(t) {
  if (!draft || draft.original || !S.unlocked.includes(t) || uxFreeSlots(t) <= 0) return;
  draft.type = t; uxLastType = t;
  draft.name = TYPES[t].name + (S.lines.filter(l => l.type === t).length + 1) + '线';
  haptic(); draftBar();
}
function uxUndoStop() {
  if (!draft || draft.original || !draft.stops.length) return;
  draft.stops.pop(); haptic(); draftBar();
}
const uxDraftBar = draftBar;
draftBar = function () {
  uxDraftBar();
  const bar = uxEl('drawbar'), types = uxEl('db-types'), cost = uxEl('db-cost'), undo = uxEl('drawundo'), done = uxEl('drawdone');
  if (!bar) return;
  if (bridgeDraft || !draft) { uxResetDrawExtras(); return; }
  bar.classList.add('db-line');
  const c = draftCost(), isNew = !draft.original;
  const open = uxTypes().filter(t => S.unlocked.includes(t));
  types.hidden = !isNew || open.length < 2;
  if (!types.hidden) types.innerHTML = open.map(t => {
    const free = uxFreeSlots(t);
    return `<button class="${t === draft.type ? 'on' : ''}" ${free <= 0 ? 'disabled' : ''} onclick="uxSetType('${t}')">${TYPES[t].name}<small>${free <= 0 ? '已满' : '余' + free}</small></button>`;
  }).join('');
  const names = draft.stops.filter(id => S.cities[id] && S.cities[id].kind !== 'bridgehead').map(id => escapeHTML(S.cities[id].name));
  uxEl('drawtext').innerHTML = !names.length ? `<b>${escapeHTML(draft.name)}</b> · 从一座城市拖到另一座`
    : names.length === 1 ? `<b>${names[0]}</b> → 继续拖到下一座城市`
    : names.join(' <i>→</i> ');
  undo.hidden = !(isNew && draft.stops.length > 0);
  cost.hidden = draft.stops.length < 2;
  if (!cost.hidden) {
    const line = c.cash - c.works - c.vehicle, parts = [];
    if (c.invalid) parts.push(`<span class="bad">${escapeHTML(c.invalid)}</span>`);
    else {
      parts.push(`<span>线路 ¥${line}</span>`);
      if (c.works || c.bridge || c.tunnel) parts.push(`<span>桥隧 ¥${c.works}${c.tunnel ? ' · 隧' + c.tunnel : ''}${c.bridge ? ' · 桥' + c.bridge : ''}</span>`);
      if (c.reused) parts.push(`<span>复用桥 ×${c.reused}</span>`);
      if (c.vehicle) parts.push(`<span>首辆${TYPES[draft.type].name} ¥${c.vehicle}</span>`);
      else if (isNew) parts.push(`<span>用库存车辆</span>`);
      parts.push(c.cash > S.points ? `<span class="bad">资金不足 · 差 ${money(c.cash - S.points)}</span>` : `<span class="muted">建成后余 ${money(S.points - c.cash)}</span>`);
    }
    cost.innerHTML = parts.join('');
  }
  for (const e of [cost, uxEl('drawtext')]) if (e && /运营中心|工程采购|交通采购|收支账本/.test(e.innerHTML)) e.innerHTML = uxRename(e.innerHTML);
  done.textContent = draft.stops.length < 2 ? '建设' : c.cash ? '建设 ¥' + c.cash : isNew ? '建设' : '应用修改';
};
uxEl('drawundo').onclick = uxUndoStop;
// Build straight from the bar: the price is on the button, so no second confirmation dialog.
uxEl('drawdone').onclick = () => bridgeDraft ? createBridge() : commitDraft(true);
const uxCommit = commitDraft;
commitDraft = function (skip = false) {
  const type = draft && !draft.original ? draft.type : null;
  uxCommit(skip);
  if (type && !draft) { uxLastType = type; haptic(15); }
};
const uxToast = toast;
toast = function (t) {
  t = String(t).replace('点击查看报价后确认建设', '核对底栏报价后点「建设」').replace('；查看报价确认建设', '，然后点底栏「建设」');
  if (uxCoachActive() && /拖到|线路已规划|报价后|核对底栏/.test(t)) return;   // the coach already says this
  uxToast(uxRename(t));
  uxPlaceToast();
};
// Portrait: float messages just above whatever sheet is at the bottom, inside the thumb zone.
function uxPlaceToast() {
  const el = uxEl('toast'); if (!el) return;
  if (!portraitMode) { el.style.top = el.style.bottom = ''; return; }
  let top = H;
  for (const sel of ['#ux-coach', '#details', '#routes', '#drawbar', 'footer .dock']) {
    const e = document.querySelector(sel);
    if (!e || e.hidden || typeof getComputedStyle !== 'function' || getComputedStyle(e).display === 'none') continue;
    const r = e.getBoundingClientRect(); if (r.height && r.top > H * 0.35) top = Math.min(top, r.top);
  }
  // A sheet that fills most of the screen leaves no room above it: use the top of the map instead.
  const sheet = uxEl('details'), tall = !!sheet && !sheet.hidden && sheet.getBoundingClientRect().top < H * .35;
  if (tall) { el.style.bottom = 'auto'; el.style.top = ((document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8) + 'px'; return; }
  el.style.top = 'auto'; el.style.bottom = (H - top + 10) + 'px';
}
const uxStopUndo = offerStopUndo;
offerStopUndo = function (...args) { uxStopUndo(...args); uxPlaceToast(); };
const uxAddDraftCity = addDraftCity;
addDraftCity = function (c) { const n = draft?.stops.length; uxAddDraftCity(c); if (draft && draft.stops.length > n) haptic(); };
const uxPop = popStation;
popStation = function (c, color) { uxPop(c, color); haptic(); };

/* ---------- line sheet ---------- */
function uxFleetPlus(id) {
  const l = S.lines.find(x => x.id === id); if (!l || l.retiring) return;
  if (S.inventory[l.type] > 0) addVehicle(id); else buyAndAdd(id);
  haptic(); updateUI();
}
function uxFleetMinus(id) {
  const vs = S.vehicles.filter(v => v.line === id && !v.recall); if (!vs.length) return;
  const v = vs.find(v => !v.people.length) || vs[vs.length - 1];
  removeVehicle(v.id); haptic(); showDetails(); updateUI();
}
function uxLineSheet(rebuild) {
  const el = uxEl('details'), l = S.lines.find(x => x.id === selected.id);
  if (!l) { selected = null; el.hidden = true; return; }
  if (el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  const vs = S.vehicles.filter(v => v.line === l.id), T = TYPES[l.type], inv = S.inventory[l.type];
  const seats = vs.reduce((n, v) => n + vehCap(v), 0), load = vs.reduce((n, v) => n + v.people.length, 0);
  const blocked = l.stops.some((id, i) => i && S.blockages[key(S.cities[l.stops[i - 1]], S.cities[id], l.type)]);
  const stops = l.stops.filter(id => S.cities[id] && !S.cities[id].removed && S.cities[id].kind !== 'bridgehead');
  const sig = JSON.stringify([l.id, l.name, l.color, l.stops, l.retiring, inv, S.points >= T.vehicle, blocked,
    vs.map(v => [v.id, v.cars, v.people.length, uxServiceLabel(v), isTrain(v.type) && v.cars < 8 && S.points >= carPrice(v)])]);
  if (!rebuild && sig === uxLineSheet.sig && !el.hidden) return;
  uxLineSheet.sig = sig; el.hidden = false;
  const canAdd = !l.retiring && (inv > 0 || S.points >= T.vehicle);
  el.innerHTML = `<div class="ux-sheet-head"><i class="ux-swatch" style="background:${l.color}"></i>
<div class="ux-title"><h3>${escapeHTML(l.name)}</h3><small>${T.name} · ${stops.length} 站 · 终点折返${l.retiring ? ' · 撤出中' : ''}</small></div>
<button class="ux-icon" onclick="renameLine(${l.id})" title="名称 / 颜色" aria-label="修改名称或颜色">✎</button><button class="close" onclick="clearSelection()" aria-label="关闭">×</button></div>
${blocked ? '<p class="ux-alert">部分路段停止接入，两侧车辆分段运行。可在「工程」里维修，或重新接桥改线。</p>' : ''}
${!vs.length && !l.retiring ? '<p class="ux-alert">还没有车辆，乘客不会使用这条线路。点「＋」加一辆。</p>' : ''}
<div class="ux-fleet"><div><small>车辆</small><b>${vs.length}<span> 辆</span></b></div><div><small>载客</small><b>${load}<span> / ${seats}</span></b></div>
<div class="ux-stepper"><button onclick="uxFleetMinus(${l.id})" ${!vs.some(v => !v.recall) ? 'disabled' : ''} aria-label="回收一辆">−</button><button class="primary" onclick="uxFleetPlus(${l.id})" ${canAdd ? '' : 'disabled'}>＋ ${inv > 0 ? '库存 ' + inv : '¥' + T.vehicle}</button></div></div>
<div class="ux-route">${stops.map(id => `<span class="ux-stop">${escapeHTML(S.cities[id].name)}${stops.length > 2 && !l.retiring ? `<button onclick="prepareRemoveStop(${l.id},${id})" aria-label="移除${escapeHTML(S.cities[id].name)}这一站">×</button>` : ''}</span>`).join('<i>→</i>')}</div>

${vs.length ? `<div class="ux-list"><div class="ux-list-title">车辆与运行方案</div>${vs.map(v => `<div class="ux-row"><span><b>#${v.id}</b> ${uxServiceLabel(v)}<small>${v.people.length}/${vehCap(v)} 人${v.people.length >= vehCap(v) ? ' · <em class="danger">满员</em>' : ''}${isTrain(v.type) ? ' · ' + v.cars + '/8 节' : ''}</small></span><span class="ux-row-actions">${isTrain(v.type) && v.cars < 8 ? `<button onclick="upgradeCar(${v.id})" ${S.points < carPrice(v) ? 'disabled' : ''}>＋车厢 ¥${carPrice(v)}</button>` : ''}<button onclick="setService(${v.id})">方案</button></span></div>`).join('')}</div>` : ''}
<div class="ux-actions-row">${l.type !== 'air' ? `<button onclick="openInfrastructure(${l.id})">道路升级</button>` : ''}<button class="ux-danger" onclick="uxDeleteLine(${l.id})">${uxArmedDelete?.id === l.id && uxArmedDelete.until > performance.now() ? '再点一次确认撤销' : '取消线路'}</button></div>`;
}
// Cancellation opens an itemised recovery quote before any assets are retired.
let uxArmedDelete = null;
function uxDeleteLine(id) { showLineCancellation(id); }

const uxShowDetails = showDetails;
showDetails = function (rebuild = true) {
  if (selected?.type === 'line') return uxLineSheet(rebuild);
  uxLineSheet.sig = null;
  const r = uxShowDetails(rebuild);
  try { uxTidyCitySheet(); } catch {}
  return r;
};

/* ---------- city sheet: numbers, goal, demand, facilities — no paragraphs ---------- */
// Four script layers append to the city sheet. Instead of re-implementing them, re-arrange what they render:
// waiting destinations become a row of chips, and every facility entry (weather station, hub, school/service,
// repair centre, finance…) becomes one tile in an icon grid that says what it is for and what it costs.
// Buttons keep their own onclick and disabled state, so upstream rules stay authoritative.
const UX_FACILITIES = [
  { on: /^buildMeteo|^previewMeteo/, name: '气象站', why: '范围内雨雾减速减半', icon: '<path d="M7 17h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1.5A3.5 3.5 0 0 0 7 17z"/>' },
  { on: /^buildHub/, name: '交通枢纽', why: '候车容量翻倍，换乘更快', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>' },
  { on: /^showCityEconomy/, name: '服务与学校', why: '评价好可建学校，学生带来票款', icon: '<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>' },
  { on: /^buildRepairCenter|^previewRepairCenter/, name: '检修中心', why: '附近施工与抢修工期最多−30%', icon: '<path d="M14 6a4 4 0 0 0-5 5l-5 5 3 3 5-5a4 4 0 0 0 5-5l-2 2-3-3 2-2z"/>' },
  { on: /^buildFinance|^showFinanceConstruction|^openStockMarket|^showFinancialMarket/, name: '金融设施', why: '银行理财、证券交易', icon: '<path d="M3 20h18M5 16v-5M10 16V8M15 16V5M20 16v-8"/>' },
];
function uxTidyCitySheet() {
  const el = uxEl('details');
  if (!el || el.hidden || !selected || !['city', 'stop'].includes(selected.type) || el.querySelector('.ux-fac')) return;
  // demand: chips instead of a captioned list
  const rows = [...el.querySelectorAll(':scope > .destination-row')];
  if (rows.length) {
    const box = document.createElement('div'); box.className = 'ux-demand';
    box.innerHTML = '<span class="ux-demand-label">等车去</span>';
    rows[0].before(box);
    for (const b of rows) {
      const [who, meta] = [b.children[0], b.children[1]];
      const n = (meta?.textContent || '').match(/(\d+)人/)?.[1] || '', wait = +((meta?.textContent || '').match(/·\s*(\d+)/)?.[1] || 0);
      b.className = 'ux-chip' + (wait > 120 ? ' is-late' : '');
      b.innerHTML = `<span style="color:${who?.style.color || ''}">${who?.innerHTML || ''}</span><b>${n}</b>${wait > 60 ? `<small>${wait}s</small>` : ''}`;
      b.dataset.wait = wait; b.dataset.n = n;
    }
    // most urgent first: longest wait, then most people
    rows.sort((x, y) => (+y.dataset.wait - +x.dataset.wait) || (+y.dataset.n - +x.dataset.n)).forEach(b => box.appendChild(b));
    for (const p of el.querySelectorAll(':scope > p.detail-sub')) if (/候车目的地|没有旅客/.test(p.textContent) && !/没有旅客/.test(p.textContent)) p.remove();
  }
  // facilities: every known entry button becomes a tile
  const tiles = [];
  for (const b of [...el.querySelectorAll('button[onclick]')]) {
    const call = b.getAttribute('onclick') || '', f = UX_FACILITIES.find(x => x.on.test(call));
    if (!f || b.closest('.ux-fac')) continue;
    const host = b.closest('.city-mission, .detail-actions');
    const label = b.textContent.replace(/\s+/g, ' ').trim(), price = label.match(/¥[\d,]+/)?.[0] || '';
    const state = f.name === '服务与学校' ? (host?.querySelector('b')?.textContent.split('·')[1]?.trim() || '') : (label.match(/\d+\/\d+/)?.[0] || (/已建|覆盖|查看/.test(label) ? '已建' : ''));
    const tile = document.createElement('button');
    tile.className = 'ux-fac-tile'; tile.setAttribute('onclick', call); tile.disabled = b.disabled; tile.title = label;
    tile.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${f.icon}</svg><span><b>${f.name}</b><small>${f.why}</small></span><em>${price || state || '›'}</em>`;
    tiles.push(tile);
    b.remove();
    if (host && !host.querySelector('button')) host.remove();
  }
  if (tiles.length) {
    const grid = document.createElement('div'); grid.className = 'ux-fac';
    grid.innerHTML = '<div class="ux-list-title">城市设施</div>';
    tiles.forEach(t => grid.appendChild(t));
    el.appendChild(grid);
  }
  for (const n of el.querySelectorAll(':scope > .detail-actions')) if (!n.querySelector('button')) n.remove();
}

/* ---------- tasks ---------- */
function uxMissionDetail(c, spec) {
  const m = c.mission;
  if (spec.mode === 'dual') return `出发 ${m.out || 0}/12 · 到达 ${m.in || 0}/12`;
  if (spec.mode === 'streak') return `连续 ${m.streak || 0}/${spec.goal} 天 · 今日 ${m.dayTrips || 0}/${m.step === 5 ? 2 : 1} 人`;
  if (spec.mode === 'window') return `${m.records.filter(x => x.day > S.day - 12).length}/${spec.goal} 人 · 合格 ${Math.round(m.records.length ? m.records.filter(x => x.good).length / m.records.length * 100 : 0)}%`;
  return `${m.progress}/${spec.goal} ${spec.mode === 'reach' ? '类别' : '人'}`;
}
showTasks = function () {
  const cs = realCities().slice().sort((a, b) => (a.dormant - b.dormant) || ((missionSpec(b) ? 1 : 0) - (missionSpec(a) ? 1 : 0)) || (b.mission.progress - a.mission.progress));
  const done = S.cities.reduce((n, c) => n + (c.mission?.completed || 0), 0);
  openModal(`<div class="modal-head"><div><h2>城市任务</h2><small>已完成 ${done} 项 · 点城市在地图上定位</small></div><button class="close" onclick="closeModal()">×</button></div>
<div class="ux-tasks">${cs.map(c => {
    const spec = c.dormant ? null : missionSpec(c), pct = spec ? Math.min(100, c.mission.progress / spec.goal * 100) : 0;
    return `<button class="ux-task${c.dormant ? ' is-dormant' : ''}" onclick="uxFocusCity(${c.id})"><span class="ux-task-top"><b>${escapeHTML(c.name)}</b><small>${FEATURES[c.shape].name} · ${LEVELS[c.size]}</small>${spec ? `<em>+¥${spec.reward + (spec.upgrade ? 600 : 0)}</em>` : ''}</span>
<span class="ux-task-title">${c.dormant ? '待接入 · '+cityOpeningRemaining(c)+'秒后自动开放' : spec ? `阶段 ${c.mission.step + 1}/6 · ${escapeHTML(spec.title || spec.verb || '')}` : '全部阶段已完成'}</span>
${spec ? `<span class="ux-bar"><i style="width:${pct}%"></i></span><small class="ux-task-meta">${uxMissionDetail(c, spec)}${spec.upgrade ? ' · 完成后升级' : ''}</small>` : ''}</button>`;
  }).join('')}</div>`);
};
openCity = function (id) { uxFocusCity(id); };

/* ---------- shop ---------- */
shop = function () {
  openModal(`<div class="modal-head"><div><h2>交通采购</h2><small>余额 ${money(S.points)} · 新车进入库存，在线路详情点「＋」派车</small></div><button class="close" onclick="closeModal()">×</button></div>
<div class="ux-list">${uxTypes().map(t => {
    const on = S.unlocked.includes(t), T = TYPES[t];
    return `<div class="ux-product${on ? '' : ' is-locked'}">${transportIcon(t)}<div><b>${T.name}</b><small>${isTrain(t) ? '初始 2 节，最多 8 节' : T.cap + ' 人'} · 票价 ×${T.fare ?? 1}${on ? ' · 库存 ' + S.inventory[t] : ''}</small>${on ? '' : `<small class="ux-lock">解锁：${unlockText(t)}</small>`}</div><button class="${on ? 'primary' : ''}" onclick="purchase('v-${t}')" ${!on || S.points < T.vehicle ? 'disabled' : ''}>¥${T.vehicle}</button></div>`;
  }).join('')}</div>
${shopTrainCarsHTML()}
<div class="ux-links"><button onclick="showEngineering()"><span>工程</span><small>桥梁 · 道路升级 · 气象站 · 枢纽 · 检修中心</small><i>›</i></button><button onclick="showFinance()"><span>收支账本</span><small>收入、支出与月底维护</small><i>›</i></button></div>`);
};

/* ---------- dock & camera on touch ---------- */
uxEl('dock-tasks').onclick = () => showTasks();
// game.js bound these by reference before this layer loaded.
uxEl('tasks').onclick = () => showTasks();
uxEl('newroute').onclick = () => chooseType();
// Clear the line-only parts of the bar (types, quote, undo) whenever a line draft ends or a bridge draft starts,
// so the bridge bar never shows a stale route quote.
function uxResetDrawExtras() {
  const bar = uxEl('drawbar'); if (!bar) return;
  bar.classList.remove('db-line');
  for (const id of ['db-types', 'db-cost']) { const e = uxEl(id); if (e) { e.hidden = true; e.innerHTML = ''; } }
  const undo = uxEl('drawundo'); if (undo) undo.hidden = true;
}
const uxCancelDraft = cancelDraft;
cancelDraft = function (...args) { uxCancelDraft(...args); uxResetDrawExtras(); };
const uxBeginBridge = beginBridge;
beginBridge = function (...args) { uxBeginBridge(...args); uxResetDrawExtras(); };
const uxBridgeBar = updateBridgeBar;
updateBridgeBar = function () { uxResetDrawExtras(); uxBridgeBar(); };
// While drawing near a screen edge, scroll the map so far cities stay reachable on a phone.
(function edgeScroll() {
  let ptr = null;
  cv.addEventListener('pointermove', e => { ptr = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }; }, { passive: true, capture: true });
  for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { ptr = null; }, { passive: true, capture: true });
  function step() {
    try {
      const extending = ptr && uxExt && ptr.pointerId === uxExt.id;
      // Only after the finger has travelled: grabbing a tab or city that already sits near an edge must not scroll the map.
      const start = extending ? { x: uxExt.x0, y: uxExt.y0 } : gesture?.start, travelled = !ptr || !start || Math.hypot(ptr.clientX - start.x, ptr.clientY - start.y) > 24;
      if (travelled && (extending || ptr && gesture && pointers.size === 1 && ['draft', 'city-edit', 'elastic'].includes(gesture.kind))) {
        const top = (document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8;
        const bar = uxEl('drawbar'), bottom = bar && !bar.hidden ? bar.getBoundingClientRect().top - 8 : H - 8;
        const edge = 44, push = d => 7 * Math.min(1, d / edge);
        let dx = 0, dy = 0;
        if (ptr.clientX < edge) dx = push(edge - ptr.clientX); else if (ptr.clientX > W - edge) dx = -push(ptr.clientX - (W - edge));
        if (ptr.clientY < top + edge) dy = push(top + edge - ptr.clientY); else if (ptr.clientY > bottom - edge) dy = -push(ptr.clientY - (bottom - edge));
        if (dx || dy) { view.x += dx; view.y += dy; if (extending) uxExtMove(ptr); else movePointer(ptr); }
      }
    } catch {}
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* ---------- line-end handles: grab the end of any line and keep stringing cities ---------- */
// A knob sits just beyond each terminus. Dragging it extends that end; passing more cities chains them,
// sliding back over a city just added takes it off again. Works for lines that share a city, without a picker.
let uxExt = null;
// Browsing is quiet: no extension controls on the map. Selecting a line shows an "extend" tab at each of its ends:
// a short lead in the line colour coming out of the end city, ending in a round tab with a plus. The tab sits a
// fixed distance outside the end city's node on screen; its touch target is 22px in radius (about 44×44 CSS px),
// but a press on the city node itself still belongs to the city. Hidden tabs are never hit-tested.
const UX_TAB_GAP = 30, UX_TAB_R = 10, UX_HANDLE_HIT = 22;
let uxTabSince = { line: null, at: 0 };
function uxHandleFocus() { return selected?.type === 'line' ? selected.id : selected?.type === 'stop' ? selected.line : null; }
function uxNodePx(c) { return radius(c) * view.scale * (globalThis.CITY_GLYPH?.() ?? 1); }
function uxHandles() {
  const out = [];
  if (draft || bridgeDraft || !S?.lines) return out;
  for (const l of S.lines) {
    if (l.retiring || l.stops.length < 2) continue;
    for (const end of ['head', 'tail']) {
      const e = S.cities[end === 'tail' ? l.stops.at(-1) : l.stops[0]], n = S.cities[end === 'tail' ? l.stops.at(-2) : l.stops[1]];
      if (!e || !n) continue;
      const dx = e.x - n.x, dy = e.y - n.y, len = Math.hypot(dx, dy) || 1, p = uxTabPlace(e, dx / len, dy / len);
      out.push({ line: l, end, city: e, x: e.x + p.ux * p.reach, y: e.y + p.uy * p.reach, ux: p.ux, uy: p.uy });
    }
  }
  return out;
}
// Screen distance from the city centre to the tab. Starts just outside the node and slides further out along the
// line if it would sit on the waiting squares (drawn upright to the node's right, up to two rows).
// Returns the tab's world direction and distance for an end city whose line arrives along (ux, uy).
function uxTabPlace(c, ux, uy) {
  const s = view.scale, g = globalThis.CITY_GLYPH?.() ?? 1, r = radius(c), base = uxNodePx(c) + UX_TAB_GAP;
  const n = Math.min(c.q?.length || 0, globalThis.QUEUE_SHOWN || 30);
  const o = toScreen(c), t = toScreen({ x: c.x + ux, y: c.y + uy }), dl = Math.hypot(t.x - o.x, t.y - o.y) || 1, sx = (t.x - o.x) / dl, sy = (t.y - o.y) / dl;
  const rows = Math.ceil(Math.min(Math.max(n, 1), 30) / 6), pad = UX_TAB_R + 4;
  const box = { l: (r + 15) * s * g - pad, r: (r + 15 + 6 * 11) * s * g + pad + 22, t: -r * s * g - pad, b: (-r + rows * 12) * s * g + pad };
  const hits = (x, y) => n && x >= box.l && x <= box.r && y >= box.t && y <= box.b;
  for (const deg of [0, -40, 40, -80, 80, -120, 120]) {
    const q = deg * Math.PI / 180, dx = sx * Math.cos(q) - sy * Math.sin(q), dy = sx * Math.sin(q) + sy * Math.cos(q);
    if (!hits(dx * base, dy * base)) {
      const w = toWorld({ clientX: o.x + dx * base, clientY: o.y + dy * base }), wx = w.x - c.x, wy = w.y - c.y, wl = Math.hypot(wx, wy) || 1;
      return { ux: wx / wl, uy: wy / wl, reach: base / view.scale };
    }
  }
  return { ux, uy, reach: base / view.scale };
}
// Hit-testing and drawing share this list. Nothing selected → no tabs at all.
function uxVisibleHandles() { const f = uxHandleFocus(); return f === null ? [] : uxHandles().filter(h => h.line.id === f); }
function uxHandleAt(sx, sy) {
  let best = null, d = Infinity;
  for (const h of uxVisibleHandles()) {
    const c = toScreen(h.city);
    if (Math.hypot(c.x - sx, c.y - sy) <= uxNodePx(h.city) + 8) continue;   // the city node keeps its own taps
    const p = toScreen(h), dd = Math.hypot(p.x - sx, p.y - sy);
    if (dd < UX_HANDLE_HIT && dd <= d + 3) { best = h; d = Math.min(d, dd); }
  }
  return best;
}
function uxDrawHandles() {
  const focus = uxHandleFocus(); if (focus === null) { uxTabSince.line = null; return; }
  if (uxTabSince.line !== focus) uxTabSince = { line: focus, at: performance.now() };
  const k = 1 / view.scale, age = (performance.now() - uxTabSince.at) / 1400;
  for (const h of uxVisibleHandles()) {
    const col = h.line.color, start = (uxNodePx(h.city) + 3) * k, stop = (UX_TAB_GAP - UX_TAB_R + 1) * k;
    ctx.save(); ctx.lineCap = 'round';
    // lead: the line continues a little past its end city
    ctx.globalAlpha = .9; ctx.strokeStyle = col; ctx.lineWidth = 3.2 * k; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(h.city.x + h.ux * start, h.city.y + h.uy * start);
    ctx.lineTo(h.city.x + h.ux * (start + stop), h.city.y + h.uy * (start + stop)); ctx.stroke();
    // a brief invitation pulse right after selecting the line
    if (age < 1) { ctx.globalAlpha = .35 * (1 - age); ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(h.x, h.y, (UX_TAB_R + 3 + 10 * age) * k, 0, Math.PI * 2); ctx.stroke(); }
    // tab: white rim, line-coloured disc, white plus
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(h.x, h.y, (UX_TAB_R + 2.5) * k, 0, Math.PI * 2); ctx.fillStyle = '#fffef9'; ctx.fill();
    ctx.beginPath(); ctx.arc(h.x, h.y, UX_TAB_R * k, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2 * k; ctx.beginPath();
    ctx.moveTo(h.x - 4.5 * k, h.y); ctx.lineTo(h.x + 4.5 * k, h.y); ctx.moveTo(h.x, h.y - 4.5 * k); ctx.lineTo(h.x, h.y + 4.5 * k); ctx.stroke();
    ctx.restore();
  }
}
function uxExtStops() { return uxExt.end === 'tail' ? [...uxExt.base, ...uxExt.added] : [...uxExt.added.slice().reverse(), ...uxExt.base]; }
function uxExtMove(e) {
  if (!uxExt || !draft) return;
  const p = toWorld(e), c = hitCity(p), endId = uxExt.end === 'tail' ? uxExt.base.at(-1) : uxExt.base[0];
  if (c) {
    const i = uxExt.added.indexOf(c.id);
    if (c.id === endId) uxExt.added = [];
    else if (i >= 0) uxExt.added = uxExt.added.slice(0, i + 1);
    else if (!uxExt.base.includes(c.id)) { uxExt.added.push(c.id); popStation(c, draft.color); }
  }
  draft.stops = uxExtStops();
  draft.extensionPointer = { city: uxExt.added.at(-1) ?? endId, p }; draft.pointer = null;
  draftBar();
  uxEl('drawtext').innerHTML = uxExt.added.length ? `延长 <b>+${uxExt.added.length}</b> 站 · ${uxExt.added.map(id => escapeHTML(S.cities[id].name)).join(' → ')}` : '拖到城市上连接 · 回到原端点取消';
}
function uxExtFinish(cancelled) {
  const ext = uxExt; uxExt = null; if (!ext || !draft) return;
  draft.extensionPointer = null;
  if (cancelled || !ext.added.length) { cancelDraft(false); if (!ext.moved) { selectLine(ext.line); if (!cancelled) toast('按住 ＋ 拖向城市即可延长，可连续经过多座'); } return; }
  const c = draftCost();
  if (c.invalid || c.cash > S.points) { toast(c.invalid || '资金不足：延长需要 ' + money(c.cash)); cancelDraft(false); selectLine(ext.line); return; }
  if (c.cash || c.bridge || c.tunnel) { draftBar(); haptic(); } else commitDraft(true);
}
cv.addEventListener('pointerdown', e => {
  if (uxExt || draft || bridgeDraft || pointers.size || modalOpen) return;
  const h = uxHandleAt(e.clientX, e.clientY); if (!h) return;
  e.stopImmediatePropagation(); e.preventDefault();
  try { cv.setPointerCapture(e.pointerId); } catch {}
  hideJunction(); beginDraft(h.line.type, h.line.id);
  uxExt = { id: e.pointerId, line: h.line.id, end: h.end, base: [...h.line.stops], added: [], x0: e.clientX, y0: e.clientY, moved: false };
  haptic(); uxExtMove(e);
}, { capture: true });
cv.addEventListener('pointermove', e => {
  if (!uxExt || e.pointerId !== uxExt.id) return;
  e.stopImmediatePropagation();
  if (Math.hypot(e.clientX - uxExt.x0, e.clientY - uxExt.y0) > 8) uxExt.moved = true;
  uxExtMove(e);
}, { capture: true });
for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, e => {
  if (!uxExt || e.pointerId !== uxExt.id) return;
  e.stopImmediatePropagation(); uxExtFinish(t === 'pointercancel');
}, { capture: true });

/* ---------- edge pointers: cities that need you but sit off-screen ---------- */
// New towns (with their opening countdown) and towns about to lose a life get a pill on the screen edge.
// Tapping it glides there and opens the town; nothing moves the camera on its own.
(function edgePointers() {
  if (!document.body?.appendChild) return;
  const layer = document.createElement('div'); layer.id = 'ux-edge'; document.body.appendChild(layer);
  const pills = new Map();
  // Pills take taps. A drag that starts on a pill belongs to the map: hand the pointer to the canvas (pointer capture)
  // so panning, pinching and line drawing work even when a pill happens to sit under the finger.
  let press = null, dragged = false;
  layer.addEventListener('pointerdown', e => { if (e.target.closest('[data-city]')) { press = { id: e.pointerId, x: e.clientX, y: e.clientY }; dragged = false; } });
  layer.addEventListener('pointermove', e => {
    if (!press || e.pointerId !== press.id || Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8) return;
    const start = { pointerId: press.id, clientX: press.x, clientY: press.y, type: 'pointerdown', preventDefault() {}, stopPropagation() {} };
    press = null; dragged = true;
    try { beginPointer(start); movePointer(e); } catch {}
  });
  layer.addEventListener('pointerup', () => { press = null; });
  layer.addEventListener('click', e => { const b = e.target.closest('[data-city]'); if (dragged) { dragged = false; return; } if (b) { haptic(); uxFocusCity(+b.dataset.city); } });
  function update() {
    try {
      const keep = new Set();
      if (S && !modalOpen && !draft && !bridgeDraft) {
        const band = fitBand();
        // Stay below the notices and the construction-undo pill so a pointer is never covered.
        for (const sel of ['.top-stack', '.undo-build']) { const e = document.querySelector(sel); if (!e || e.hidden) continue; const r = e.getBoundingClientRect(); if (r.height) band.top = Math.max(band.top, r.bottom + 4); }
        const cx = W / 2, cy = (band.top + band.bottom) / 2;
        for (const c of realCities()) {
          const urgent = !c.dormant && c.warning > 0, fresh = c.dormant;
          if (!urgent && !fresh) continue;
          const p = toScreen(c);
          // A city the player can see (anywhere below the header, outside the dock) needs no pointer.
          const headerB = document.querySelector('header')?.getBoundingClientRect().bottom || 60, dockT = document.querySelector('footer .dock')?.getBoundingClientRect().top || H;
          if (p.x > 8 && p.x < W - 8 && p.y > headerB && p.y < dockT - 8) continue;
          const dx = p.x - cx, dy = p.y - cy, sx = (W / 2 - 64) / Math.abs(dx || 1e-6), sy = ((band.bottom - band.top) / 2 - 22) / Math.abs(dy || 1e-6), k = Math.min(sx, sy, 1);
          let el = pills.get(c.id);
          if (!el) { el = document.createElement('button'); el.dataset.city = c.id; layer.appendChild(el); pills.set(c.id, el); }
          const secs = urgent ? Math.ceil(c.warning) : typeof cityOpeningRemaining === 'function' ? cityOpeningRemaining(c) : null;
          el.className = 'ux-edge-pill' + (urgent ? ' is-urgent' : '');
          el.innerHTML = `<i style="transform:rotate(${Math.atan2(dy, dx)}rad)">➜</i><span>${urgent ? '告急 ' : '新城 '}${escapeHTML(c.name)}</span>${secs !== null ? `<small>${secs}s</small>` : ''}`;
          // Never cover a city that is on screen (a tap meant for it would fly the camera away): slide the pill along
          // its edge — vertically on the left/right edges, horizontally on the top/bottom — until it is clear.
          let px = cx + dx * k, py = cy + dy * k;
          const halfW = (el.offsetWidth || 120) / 2 + 10, halfH = (el.offsetHeight || 34) / 2 + 10, alongY = sx <= sy;
          const nodes = realCities().map(o => toScreen(o)).filter(q => q.x > 0 && q.x < W && q.y > band.top && q.y < band.bottom);
          const covers = (x, y) => nodes.some(q => Math.abs(q.x - x) < halfW + 14 && Math.abs(q.y - y) < halfH + 14);
          let clear = false;
          for (const off of [0, 40, -40, 80, -80, 120, -120, 160, -160]) {
            const x = alongY ? px : Math.min(W - halfW, Math.max(halfW, px + off)), y = alongY ? Math.min(band.bottom - halfH, Math.max(band.top + halfH, py + off)) : py;
            if (!covers(x, y)) { px = x; py = y; clear = true; break; }
          }
          // No free spot along this edge: the city wins, the pointer waits until the map moves.
          el.hidden = !clear;
          el.style.left = px + 'px'; el.style.top = py + 'px';
          el.setAttribute('aria-label', (urgent ? '告急城市 ' : '新城镇 ') + c.name + '，点击前往');
          keep.add(c.id);
        }
      }
      for (const [id, el] of pills) if (!keep.has(id)) { el.remove(); pills.delete(id); }
    } catch {}
    if (uxEl('toast')?.classList.contains('show')) uxPlaceToast();
    setTimeout(update, 150);
  }
  update();
})();

/* ---------- portrait rotation: keep city-attached labels upright and in place ---------- */
// Badges, markers and icons are drawn at "city + offset". When the map is rotated, turn each one around the
// city it belongs to, so "above the city" stays above on screen. Cities are at least 145 apart vertically.
function uxLabelCity(x, y) {
  let best = null, d = 80;
  for (const c of realCities()) { const dd = Math.hypot(c.x - x, c.y - y); if (dd < d) { d = dd; best = c; } }
  if (best) return best;
  d = 151;
  for (const c of realCities()) { const dy = c.y - y; if (Math.abs(c.x - x) < 75 && dy >= 0 && dy < d) { d = dy; best = c; } }
  return best;
}
function uxCityUpright(fn) {
  return function (...args) {
    if (!view.rot) return fn.apply(this, args);
    const t0 = text, r0 = roundBody;
    const around = (c, draw) => { if (!c) return draw(); ctx.save(); uprightAround(c.x, c.y); draw(); ctx.restore(); };
    text = (t, x, y, ...rest) => around(uxLabelCity(x, y), () => t0(t, x, y, ...rest));
    roundBody = (x, y, w, h, ...rest) => around(uxLabelCity(x + w / 2, y + h / 2), () => r0(x, y, w, h, ...rest));
    try { return fn.apply(this, args); } finally { text = t0; roundBody = r0; }
  };
}
function uxWrapLateDrawers() {
  for (const name of ['drawMissionBadges', 'drawEventMarkers', 'drawCityEconomy', 'drawRouteGhosts'])
    if (typeof globalThis[name] === 'function' && !globalThis[name].uxUpright) { const f = uxCityUpright(globalThis[name]); f.uxUpright = true; globalThis[name] = f; }
  if (typeof drawCityOpening === 'function' && !drawCityOpening.uxUpright) {
    const open = drawCityOpening;
    drawCityOpening = function (c) { ctx.save(); uprightAround(c.x, c.y); try { open(c); } finally { ctx.restore(); } };
    drawCityOpening.uxUpright = true;
  }
  if (!drawCityEconomy.uxHandles) { const dce = drawCityEconomy; drawCityEconomy = function (...a) { dce.apply(this, a); uxDrawHandles(); uxDrawCoach(); }; drawCityEconomy.uxHandles = true; }
}
/* ---------- tidy sheets that later scripts extend ---------- */
// Later layers append sections by string. These passes keep one header on top, drop entries that already have a
// home elsewhere (tasks and ledger have their own buttons), and move per-city builds to the city sheet.
function uxAfter(name, tidy) {
  const f = globalThis[name]; if (typeof f !== 'function') return;
  if (f.uxTidies) { f.uxTidies.push(tidy); return; }
  const list = [tidy];
  const g = function (...a) { const r = f.apply(this, a); for (const t of list) { try { t(uxEl('modal-content')); } catch {} } return r; };
  g.uxTidy = true; g.uxTidies = list; globalThis[name] = g;
}
function uxHeadFirst(m) { const head = m.querySelector('.modal-head'); if (head && m.firstElementChild !== head) m.prepend(head); }
const UX_HELP_TOPICS = [[/开局|一条命|补助/, '资金与生命'], [/候客|满员|拥堵|扣命/, '等待与扣命'], [/任务|成长|维护费|欠费/, '任务、收入与维护'], [/解锁|名额|每\d+天/, '交通方式与名额'], [/学校|检修/, '学校与检修中心'], [/金融|银行|证券|股票|理财/, '金融市场'], [/活动|邀请|卡/, '城市活动']];
function uxFoldRules(m) {
  if (m.querySelector('.ux-rules')) return;
  // Stand-alone rule paragraphs fold away; a short line inside a feature card says what the feature is for and stays.
  const long = [...m.querySelectorAll(':scope > p')].filter(p => p.textContent.trim().length > 30 && !p.querySelector('button, input'));
  if (!long.length) return;
  const d = document.createElement('details'); d.className = 'ux-rules'; d.innerHTML = '<summary>规则说明</summary>';
  long[0].before(d); long.forEach(p => d.appendChild(p));
}
function uxHowToPlay(m) {
  const head = m.querySelector('.modal-head'); if (head?.querySelector('h2')) head.querySelector('h2').textContent = '怎么玩';
  const steps = document.createElement('ol'); steps.className = 'ux-steps';
  steps.innerHTML = [
    ['连线', '从一座城市拖到另一座，看底栏报价，点「建设」。'],
    ['配车', '点线路，用「＋」加车；拖线路两端的「＋」延长。'],
    ['送客', '乘客的色块就是目的地，送到同色同形的城市。候车太久会扣命。'],
    ['成长', '完成城市任务拿奖金、城市升级；每 10 天补助，月底付维护。'],
  ].map(([t, d], i) => `<li><i>${i + 1}</i><span><b>${t}</b>${d}</span></li>`).join('');
  (head || m.firstChild)?.after(steps);
  // upstream rule paragraphs → topics (first one open)
  const paras = [...m.querySelectorAll(':scope > p, :scope > section.infra-card')];
  const groups = new Map();
  for (const p of paras) {
    const t = p.textContent, title = (UX_HELP_TOPICS.find(([re]) => re.test(t)) || [, '更多规则'])[1];
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(p);
  }
  let anchor = steps;
  for (const [title, ps] of groups) {
    const d = document.createElement('details'); d.className = 'ux-help';
    d.innerHTML = `<summary>${title}</summary>`;
    const body = document.createElement('div'); body.className = 'ux-help-body'; ps.forEach(p => body.appendChild(p)); d.appendChild(body);
    anchor.after(d); anchor = d;
  }
  // remaining buttons/links (ledger, market, changelog) stay at the end as a quiet row
  const tail = [...m.querySelectorAll(':scope > button, :scope > a')];
  if (tail.length) { const row = document.createElement('div'); row.className = 'ux-help-links'; tail.forEach(x => row.appendChild(x)); m.appendChild(row); }
}
function uxWrapLatePanels() {
  uxAfter('showOperations', m => {
    uxHeadFirst(m);
    m.querySelectorAll('button[onclick^="showTasks"],button[onclick^="showFinance"],button[onclick^="closeModal();showTasks"]').forEach(b => b.remove());
    m.querySelectorAll('.tabs').forEach(t => { if (!t.querySelector('button')) t.remove(); });
    uxFoldRules(m);
  });
  for (const name of ['showFinance', 'shop', 'showMaintenance', 'showWeather', 'chooseContract', 'showEngineering']) uxAfter(name, m => uxFoldRules(m));
  // Finance market (1.0): the "build another bank/broker" box moves to the end once one exists, and long rule lines fold.
  uxAfter('showFinancialMarket', m => {
    const fm = m.querySelector('.financial-market') || m;
    for (const b of [...fm.querySelectorAll('.market-build')]) {
      if (!/已有/.test(b.textContent)) continue;
      const d = document.createElement('details'); d.className = 'ux-rules ux-market-build';
      d.innerHTML = '<summary>' + ((b.querySelector('b, strong, h3')?.textContent || '设施建设').trim() + ' · 再建一座') + '</summary>';
      fm.appendChild(d); d.appendChild(b);
    }
    const rules = [...fm.querySelectorAll('p')].filter(p => !p.id && !p.closest('.ux-rules') && p.textContent.trim().length > 30 && !p.querySelector('button, input, b[id], span[id]'));
    if (rules.length) { const d = document.createElement('details'); d.className = 'ux-rules'; d.innerHTML = '<summary>规则说明</summary>'; fm.appendChild(d); rules.forEach(p => d.appendChild(p)); }
  });
  uxAfter('showEngineering', m => {
    uxHeadFirst(m);
    const lists = [...m.querySelectorAll('.task-cities')];
    if (!lists.length) return;
    lists.forEach(list => { const h = list.previousElementSibling; if (h?.tagName === 'H3') h.remove(); list.remove(); });
    const cs = realCities().filter(c => !c.dormant);
    const note = document.createElement('section'); note.className = 'infra-card';
    note.innerHTML = `<h3>城市设施</h3><p>气象站 ${cs.filter(c => c.meteo).length} 座 · 交通枢纽 ${S.hubCount}/3 · 检修中心 ${cs.filter(c => c.repairCenter).length} 座<br>点地图上的城市，在城市详情里建设并预览覆盖范围。</p>`;
    m.appendChild(note);
  });
  uxAfter('help', m => {
    if (!m.querySelector('.ux-steps')) uxHowToPlay(m);
    const last = [...m.querySelectorAll('details.ux-help')].at(-1); if (!last) return;
    const extra = []; for (let n = last.nextElementSibling; n; n = n.nextElementSibling) if (!n.classList.contains('ux-foot')) extra.push(n);
    if (!extra.length) return;
    const d = document.createElement('details'); d.className = 'ux-help';
    d.innerHTML = '<summary>更新说明</summary>';
    const body = document.createElement('div'); body.className = 'ux-help-body'; extra.forEach(n => body.appendChild(n)); d.appendChild(body);
    last.after(d);
  });
}
/* ---------- three hubs: 目标 / 建造 / 资金 ---------- */
// Players think "what should I do", "how do I grow", "how is my money". Every global sheet now belongs to one hub,
// opened from the dock, with a fixed row of tabs on top so each page does a single job. Pages are still rendered
// by the upstream functions; the hub only adds the tab row, the hub title, and removes links that the tabs replace.
// Per-object actions stay on the object (city facilities in the city sheet, fleet and upgrades in the line sheet).
const UX_HUBS = {
  goal: { name: '目标', tabs: [['城市任务', 'showTasks'], ['城市活动', 'showActivityCards'], ['服务合同', 'uxContractPage']] },
  build: { name: '建造', tabs: [['桥梁与道路', 'showEngineering'], ['车辆', 'shop'], ['天气', 'showWeather']] },
  money: { name: '资金', tabs: [['收支', 'showFinance'], ['维护', 'showMaintenance'], ['理财', 'uxMarketWealth'], ['股票', 'uxMarketStocks']] },
};
function uxMarketWealth() { showFinancialMarket(marketTab === 'portfolio' ? 'portfolio' : 'wealth'); }
function uxMarketStocks() { showFinancialMarket('stocks'); }
function uxOpenHub(key, i = 0) { haptic(); globalThis[UX_HUBS[key].tabs[i][1]](); }
function uxContractPage() {
  const c = S.contract, open = !c && S.day >= 20 && S.day >= (S.contractCooldown || 0);
  if (open) { chooseContract(); return; }
  let body;
  if (c) {
    const rate = c.count ? Math.round(c.good / c.count * 100) : 100, pct = Math.min(100, c.count / c.goal * 100);
    body = `<section class="ux-contract"><b>${escapeHTML(S.cities[c.city]?.name || '')}</b><span>剩余 ${Math.max(0, c.end - S.day).toFixed(1)} 天 · 奖励 ¥${c.reward}</span>
<span class="ux-bar"><i style="width:${pct}%"></i></span><small>有效运输 ${c.count}/${c.goal} · 候车合格 ${rate}%（需 ≥80%）</small></section>`;
  } else body = S.day < 20 ? '<p class="ux-empty">第 20 天开放：在 10 天内为一座城市完成运输量，候车不超时就拿奖金，未达标不扣钱。</p>'
    : `<p class="ux-empty">冷却中，还需 ${Math.ceil(S.contractCooldown - S.day)} 天可再接合同。</p>`;
  openModal(`<div class="modal-head"><h2>服务合同</h2><button class="close" onclick="closeModal()">×</button></div>${body}`);
}
function uxHubBar(key, idx, m) {
  const hub = UX_HUBS[key];
  if (!m || m.hidden === true || m.querySelector('.ux-hub-tabs')) return;
  let head = m.querySelector('.modal-head');
  if (!head) { head = document.createElement('div'); head.className = 'modal-head'; head.innerHTML = '<h2></h2><button class="close" onclick="closeModal()">×</button>'; m.prepend(head); }
  uxHeadFirst(m);
  let h2 = head.querySelector('h2'); if (!h2) { h2 = document.createElement('h2'); head.prepend(h2); }
  h2.textContent = hub.name;
  head.querySelectorAll('.close').forEach(b => b.setAttribute('onclick', 'closeModal()'));
  const nav = document.createElement('nav'); nav.className = 'ux-hub-tabs'; nav.setAttribute('role', 'tablist');
  nav.innerHTML = hub.tabs.map(([label], i) => `<button role="tab" aria-selected="${i === idx}" class="${i === idx ? 'on' : ''}" onclick="uxOpenHub('${key}',${i})">${label}</button>`).join('');
  head.classList.add('has-hub'); head.appendChild(nav);   // tabs live in the sticky header so they stay reachable while scrolling
  // links the tabs replace
  m.querySelectorAll('.ux-links, .market-tabs').forEach(n => { const keep = n.querySelector('[onclick*="portfolio"]'); if (keep && n.classList.contains('market-tabs')) { const row = document.createElement('div'); row.className = 'ux-help-links'; row.appendChild(keep); n.replaceWith(row); } else n.remove(); });
  m.querySelectorAll('button[onclick^="showOperations"], button[onclick^="showMaintenance"], button[onclick^="showFinance()"], button[onclick^="showWeather"], button[onclick^="showEngineering"], button[onclick^="shop()"]').forEach(b => { if (!b.closest('.ux-hub-tabs')) b.remove(); });
  m.querySelectorAll('.tabs').forEach(t => { if (!t.querySelector('button')) t.remove(); });
  m.scrollTop = 0;
}
/* ---------- 建造 · 桥梁与道路: actions first, empty sections gone ---------- */
// Upstream renders headings with placeholder text ("还没有桥梁", "暂无受损路段"). Rebuild as: two bridge actions with a
// starting price, then only sections that have content — existing bridges, damaged roads, per-line upgrades as rows.
function uxEngineeringPage(m) {
  if (m.querySelector('.ux-eng')) return;
  const sections = new Map(); let cur = null;
  for (const n of [...m.children]) {
    if (n.tagName === 'H3') { cur = n.textContent; sections.set(cur, []); n.remove(); continue; }
    if (cur) { sections.get(cur).push(n); n.remove(); }
  }
  const pick = re => [...sections.entries()].find(([k]) => re.test(k))?.[1] || [];
  const hasContent = nodes => nodes.some(n => n.querySelector?.('button') || n.classList?.contains('quote-row'));
  const wrap = document.createElement('div'); wrap.className = 'ux-eng';
  // bridges
  const from = t => { try { return bridgePrice({ x: 0, y: 0 }, { x: 38, y: 0 }, t); } catch { return ''; } };
  const old = m.querySelector(':scope > .tabs'); if (old && old.querySelector('[onclick^="beginBridge"]')) old.remove();
  wrap.insertAdjacentHTML('beforeend', `<div class="ux-eng-title">建桥 <small>从一岸拖到对岸，跨河线路才能通过</small></div>
<div class="ux-eng-actions"><button onclick="beginBridge('bus')"><b>公路桥</b><small>大巴使用 · ¥${from('bus')} 起</small></button><button onclick="beginBridge('track')"><b>铁路桥</b><small>动车 / 高铁 · ¥${from('track')} 起</small></button></div>`);
  const addSection = (title, nodes, note) => {
    if (!hasContent(nodes)) return;
    const d = document.createElement('section'); d.className = 'ux-eng-sec';
    d.innerHTML = `<div class="ux-eng-title">${title}${note ? ` <small>${note}</small>` : ''}</div>`;
    nodes.forEach(n => d.appendChild(n)); wrap.appendChild(d);
  };
  addSection('已有桥梁', pick(/已有桥梁/), '拓宽提速或拆除');
  addSection('受损路段', pick(/断线|维修/), '抢修后恢复通行');
  // line upgrades: one row per line with its colour
  const upg = pick(/道路升级|铁路改造/).flatMap(n => [...(n.querySelectorAll?.('button[onclick^="openInfrastructure"]') || [])]);
  if (upg.length) {
    const d = document.createElement('section'); d.className = 'ux-eng-sec';
    d.innerHTML = '<div class="ux-eng-title">线路提速 <small>拓宽道路、改造铁路，施工期间减速</small></div>';
    for (const b of upg) {
      const id = +(b.getAttribute('onclick').match(/\d+/) || [])[0], l = S.lines.find(x => x.id === id);
      const row = document.createElement('button'); row.className = 'ux-eng-row'; row.setAttribute('onclick', b.getAttribute('onclick'));
      row.innerHTML = `<i style="background:${l?.color || '#999'}"></i><span>${escapeHTML(l?.name || b.textContent)}</span><small>${l ? TYPES[l.type].name + ' · ' + l.stops.length + ' 站' : ''}</small><em>›</em>`;
      d.appendChild(row);
    }
    wrap.appendChild(d);
  }
  for (const [k, nodes] of sections) if (!/已有桥梁|断线|维修|道路升级|铁路改造/.test(k)) addSection(k, nodes);
  const rules = m.querySelector(':scope > .ux-rules');
  const facilities = m.querySelector(':scope > section.infra-card');
  (m.querySelector(':scope > .modal-head') || m.firstChild).after(wrap);
  if (facilities) { facilities.className = 'ux-eng-foot'; wrap.appendChild(facilities); }
  if (rules) m.appendChild(rules);
}
/* ---------- welcome: returning players get a one-tap continue card ---------- */
// A new game keeps the upstream introduction. With a save, the intro is replaced by where you left off and one button.
function uxWrapWelcome() {
  const w = welcome;
  welcome = function (hasSave) {
    if (!hasSave || !S?.cities) return w.apply(this, arguments);
    const d = formatDate(), lines = S.lines.filter(l => !l.retiring).length, open = realCities().filter(c => !c.dormant).length;
    openModal(`<div class="ux-hero"><span class="eyebrow">东岸 · 继续经营</span><h1>第${d.year}年 ${d.month}月${d.day}日</h1></div>
<div class="ux-resume"><div><small>资金</small><b>${money(S.points)}</b></div><div><small>线路</small><b>${lines}</b></div><div><small>城市</small><b>${open}</b></div><div><small>已送达</small><b>${S.delivered}</b></div></div>
<div class="ux-actions"><button class="primary ux-wide" onclick="startGame()">继续</button></div>
<div class="ux-resume-links"><button onclick="help()">怎么玩</button><button id="ux-new" class="ux-ghost" onclick="uxConfirmNew(this)">重新开始</button></div>`);
  };
  if (modalOpen && uxEl('modal-content').innerHTML.includes('startGame()')) welcome(typeof hadSave !== 'undefined' && hadSave);
}
/* ---------- 资金·收支: income vs spending first, every line item folded below ---------- */
const UX_LEDGER = {
  in: [['fares', '票款'], ['tasks', '城市任务'], ['subsidy', '补助'], ['events', '活动收入'], ['contracts', '服务合同'], ['education', '教育补贴'], ['refunds', '撤回返还']],
  out: [['construction', '建设'], ['vehicles', '车辆'], ['maintenance', '维护'], ['activityFines', '活动罚款'], ['financialBuildings', '金融设施']],
};
// progression.js hard-codes the 0.x starting cash (500) in the ledger; a 1.1 save (moneyScale 10) started with 10×.
function uxFixStartingCash(m) {
  const k = +S?.moneyScale || 1; if (k === 1) return;
  for (const sp of m.querySelectorAll('.finance-summary span')) {
    const b = sp.querySelector('b'); if (!b || !/^初始资金/.test(sp.textContent.trim())) continue;
    if (b.textContent.trim() === '+500') b.textContent = '+' + 500 * k;
  }
}
function uxLedgerOverview(m) {
  if (m.querySelector('.ux-ledger') || !S?.ledger) return;
  uxFixStartingCash(m);
  const L = S.ledger, sum = list => list.map(([k, n]) => [n, Math.max(0, +L[k] || 0)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const ins = sum(UX_LEDGER.in), outs = sum(UX_LEDGER.out), tin = ins.reduce((n, x) => n + x[1], 0), tout = outs.reduce((n, x) => n + x[1], 0);
  const max = Math.max(tin, tout, 1), fmt = v => '¥' + Math.round(v).toLocaleString('en-US');
  const rows = (list, cls) => list.slice(0, 4).map(([n, v]) => `<div class="ux-ledger-row ${cls}"><span>${n}</span><i style="width:${Math.max(3, v / max * 100)}%"></i><b>${fmt(v)}</b></div>`).join('');
  const box = document.createElement('section'); box.className = 'ux-ledger';
  box.innerHTML = `<div class="ux-ledger-head"><div><small>累计收入</small><b class="in">${fmt(tin)}</b></div><div><small>累计支出</small><b class="out">${fmt(tout)}</b></div><div><small>经营结余</small><b class="${tin >= tout ? 'in' : 'out'}">${tin >= tout ? '+' : '−'}${fmt(Math.abs(tin - tout))}</b></div></div>
${rows(ins, 'in')}${rows(outs, 'out')}
<div class="ux-ledger-note">本月维护预计 ${typeof maintenanceForecast === 'function' ? fmt(maintenanceForecast()) : '—'} · 月底扣款</div>`;
  const head = m.querySelector('.modal-head'); (head || m.firstChild).after(box);
  // everything upstream rendered below the overview goes into one "全部明细" fold, links stay outside
  const d = document.createElement('details'); d.className = 'ux-rules ux-ledger-all'; d.innerHTML = '<summary>全部明细与流水</summary>';
  for (const n of [...m.children]) if (n !== head && n !== box && !n.classList.contains('ux-hub-tabs') && !n.matches('details.ux-rules:not(.ux-ledger-all)') && !(n.tagName === 'SECTION' && /投资账户/.test(n.textContent))) d.appendChild(n);
  box.after(d);
}
function uxWrapHubs() {
  uxAfter('showFinance', m => uxLedgerOverview(m));
  // 建造·车辆: the train-car shop repeats the per-train "+车厢" in each line sheet; fold it into one summary row.
  uxAfter('shop', m => {
    const sec = m.querySelector('section.car-shop'); if (!sec || sec.closest('details')) return;
    const n = sec.querySelectorAll('button[onclick^="purchaseTrainCar"]:not([disabled])').length;
    const d = document.createElement('details'); d.className = 'ux-rules ux-car-fold';
    d.innerHTML = `<summary>列车扩编 · ${n ? n + ' 列可加车厢' : '暂无可扩容列车'}<small>线路详情里也能逐车加</small></summary>`;
    sec.before(d); d.appendChild(sec);
    sec.querySelectorAll(':scope > p').forEach(p => { if (p.textContent.trim().length > 30) p.remove(); });
  });
  // Activity cards (0.5): the deck actions (reveal all / skip) sit right under the tabs so they are always in reach.
  uxAfter('showActivityCards', m => {
    const grid = m.querySelector('.activity-grid'), acts = m.querySelector('.activity-deck-actions');
    if (grid && acts && acts.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING) return;   // already above
    if (grid && acts) grid.before(acts);
  });
  uxAfter('showEngineering', m => uxEngineeringPage(m));
  for (const [key, hub] of Object.entries(UX_HUBS)) hub.tabs.forEach(([, fn], i) => {
    if (fn === 'uxMarketWealth' || fn === 'uxMarketStocks') return;
    uxAfter(fn, m => uxHubBar(key, i, m));
  });
  // Contract list: 1.1 scaled the reward in acceptContract (1000+600×size) but not the text in chooseContract
  // (100+60×size). Only a number that still matches the stale formula is corrected, so an upstream fix wins.
  uxAfter('chooseContract', m => {
    for (const sec of m.querySelectorAll('section')) {
      const id = +((sec.querySelector('button[onclick^="acceptContract"]')?.getAttribute('onclick') || '').match(/\d+/) || [NaN])[0], c = S.cities[id];
      if (!c) continue;
      const p = sec.querySelector('p'); if (p) p.innerHTML = p.innerHTML.replace('奖金 ¥' + (100 + c.size * 60), '奖金 ¥' + (1000 + c.size * 600));
    }
  });
  uxAfter('chooseContract', m => uxHubBar('goal', 2, m));
  uxAfter('showFinancialMarket', m => uxHubBar('money', marketTab === 'stocks' ? 3 : 2, m));
  uxAfter('showFinanceLock', m => uxHubBar('money', /证券|券商/.test(m.textContent) && !/银行尚未/.test(m.textContent) ? 3 : 2, m));
  // the old operations centre is retired: its callers ("返回" buttons, accepting a contract) land in the goal hub
  showOperations = function () { uxOpenHub('goal', S.contract ? 2 : 1); };
  // dock + header entries
  for (const key of ['goal', 'build', 'money']) { const b = uxEl('hub-' + key); if (b) b.onclick = () => uxOpenHub(key); }
}
// events.js loads after this file and redefines some drawers and sheets, so wrap once every script has run.
function uxLate() {
  if (uxLate.done) return;   // wrapping twice would stack every layer; done only once the last layer (events.js) is loaded
  if (typeof activityState === 'function') uxLate.done = true;
  uxWrapLateDrawers(); uxWrapLatePanels(); uxWrapHubs(); uxWrapWelcome();
  // later layers set the notice text inside their own updateUI; rename after all of them
  const ui = updateUI; updateUI = function (...a) { const r = ui.apply(this, a); const n = uxEl('notice'); if (n && /运营中心|工程采购|交通采购|收支账本/.test(n.textContent)) n.textContent = uxRename(n.textContent); return r; };
  // New activity invitations no longer pop a full-screen sheet in the middle of play: the game loop's automatic
  // showActivityCards() right after generateActivityOffers() becomes a badge on 目标 plus a tappable notice.
  if (typeof generateActivityOffers === 'function' && typeof showActivityCards === 'function') {
    let quiet = false;
    const gen = generateActivityOffers;
    generateActivityOffers = function (...a) { const r = gen.apply(this, a); if (r) { quiet = true; Promise.resolve().then(() => { quiet = false; }); } return r; };
    const show = showActivityCards;
    showActivityCards = function (...a) {
      if (quiet) { quiet = false; toast('三张城市活动邀请已送达 · 点「目标」查看'); updateUI(); return; }
      return show.apply(this, a);
    };
    showActivityCards.uxTidy = show.uxTidy; showActivityCards.uxTidies = show.uxTidies;   // a player's tap (hub tab, notice) still opens it
  }
  const ui2 = updateUI; updateUI = function (...a) {
    const r = ui2.apply(this, a);
    const b = uxEl('hub-goal')?.querySelector?.('.dock-badge'), s = typeof activityState === 'function' ? activityState() : null;
    if (b) b.hidden = !(s && s.offers?.length && !s.active);
    return r;
  };
  uxEl('notice')?.closest?.('.notice-wrap')?.addEventListener('click', e => { if (e.target.closest('#notice-close')) return; if (/活动邀请/.test(uxEl('notice').textContent)) uxOpenHub('goal', 1); });
  updateUI();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uxLate); else uxLate();

const uxText = text;
text = function (t, x, y, size = 12, color, align) {
  globalThis.uxHaloOK = size >= 9;
  if (ctx.canvas === cv) {
    const m = ctx.getTransform?.(), k = m ? Math.hypot(m.a, m.b) / (dpr || 1) : view.scale;
    if (k < .85) size *= Math.min(1.35, .85 / k);
  }
  try { return uxText(t, x, y, size, color, align); } finally { globalThis.uxHaloOK = true; }
};

/* ---------- detail sheet: peek first, expand on demand, keep the subject in view ---------- */
// Phones in portrait: a new selection opens as a short "peek" (title, numbers, main actions) so the map stays
// usable. Swipe up or tap the grip for everything; swipe down to go back to peek, then to close.
// Whatever the sheet covers, the selected city or line (or a range preview) is framed in the space above it.
function uxViewFor(p, cx, cy, s) { return view.rot ? { x: cx + p.y * s, y: cy - p.x * s, scale: s } : { x: cx - p.x * s, y: cy - p.y * s, scale: s }; }
function uxVisibleRect() {
  const header = (document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8;
  // Panels are cut first against the header alone; notices and the undo pill are overlays applied afterwards.
  const overlays = Math.max(0, ...['.top-stack', '.undo-build'].map(q => { const e = document.querySelector(q); const r = e && !e.hidden && e.getBoundingClientRect(); return r && r.height ? r.bottom + 12 : 0; }));
  const rect = { l: 14, r: W - 14, b: H - 12, t: header };
  // Panels can sit at the bottom (portrait sheets, docks) or at a side (landscape details, route list).
  // For each one that overlaps the map, trim whichever edge keeps the larger usable area.
  for (const q of ['#details', '#routes', 'footer .dock', '#drawbar']) {
    const e = document.querySelector(q); if (!e || e.hidden || typeof getComputedStyle === 'function' && getComputedStyle(e).display === 'none') continue;
    const p = e.getBoundingClientRect();
    if (!(p.bottom > p.top && p.right > p.left) || p.right <= rect.l || p.left >= rect.r || p.bottom <= rect.t || p.top >= rect.b) continue;
    const options = [{ ...rect, b: Math.min(rect.b, p.top - 12) }, { ...rect, t: Math.max(rect.t, p.bottom + 12) },
      { ...rect, r: Math.min(rect.r, p.left - 12) }, { ...rect, l: Math.max(rect.l, p.right + 12) }]
      .filter(o => o.r - o.l >= 60 && o.b - o.t >= 40);
    if (!options.length) continue;
    Object.assign(rect, options.reduce((x, y) => (y.r - y.l) * (y.b - y.t) > (x.r - x.l) * (x.b - x.t) ? y : x));
  }
  // Keep clear of the notices only when that still leaves real room (a fully expanded portrait sheet does not):
  // overlays may be overlapped, panels may not.
  if (rect.b - Math.max(rect.t, overlays) >= 80) rect.t = Math.max(rect.t, overlays);
  return rect;
}
// Move (and only if needed, zoom out) so every world point plus its padding sits inside the visible rect.
function uxFrame(points, pad = 60) {
  if (!points.length) return;
  const rect = uxVisibleRect(), sp = points.map(p => toScreen(p)), padPx = pad * view.scale;
  const box = { l: Math.min(...sp.map(p => p.x)) - padPx, r: Math.max(...sp.map(p => p.x)) + padPx, t: Math.min(...sp.map(p => p.y)) - padPx, b: Math.max(...sp.map(p => p.y)) + padPx };
  if (box.l >= rect.l && box.r <= rect.r && box.t >= rect.t && box.b <= rect.b) return;
  const fit = Math.min(1, (rect.r - rect.l) / (box.r - box.l), (rect.b - rect.t) / (box.b - box.t));
  const s = Math.max(minScale(), view.scale * fit);
  const cx = points.reduce((n, p) => n + p.x, 0) / points.length, cy = points.reduce((n, p) => n + p.y, 0) / points.length;
  animateView(uxViewFor({ x: cx, y: cy }, (rect.l + rect.r) / 2, (rect.t + rect.b) / 2, s), 300);
}
function uxSelectionPoints() {
  if (!selected) return [];
  if (selected.type === 'line') return [...(S.lines.find(l => l.id === selected.id)?.stops || []).map(i => S.cities[i]).filter(Boolean), ...uxHandles().filter(h => h.line.id === selected.id)];
  if (['city', 'stop', 'junction'].includes(selected.type)) return [S.cities[selected.id]].filter(Boolean);
  if (selected.type === 'vehicle') { const v = S.vehicles.find(x => x.id === selected.id), p = v && vehiclePose(v); return p ? [p] : []; }
  return [];
}
let uxPreviewFrame = null;   // {c, radius} while a range preview is shown
function uxFrameSelection() {
  if (uxPreviewFrame) { const { c, radius: r } = uxPreviewFrame; uxFrame([{ x: c.x - r, y: c.y - r }, { x: c.x + r, y: c.y + r }], 10); return; }
  const full = uxEl('details')?.classList.contains('is-full');
  uxFrame(uxSelectionPoints(), selected?.type === 'line' ? (full ? 30 : 50) : (full ? 36 : 90));
}
function uxSheetSet(state) {
  const d = uxEl('details'); if (!d) return;
  d.classList.toggle('is-peek', state === 'peek'); d.classList.toggle('is-full', state === 'full');
  if (state === 'peek') d.scrollTop = 0;
  setTimeout(() => requestAnimationFrame(uxFrameSelection), 240);   // after the height transition
}
(function sheetStates() {
  const d = uxEl('details'); if (!d?.getBoundingClientRect || typeof MutationObserver === 'undefined') return;
  let lastKey = '';
  new MutationObserver(() => {
    if (d.hidden || !selected) { lastKey = ''; uxPreviewFrame = null; d.classList.remove('is-peek', 'is-full'); return; }
    const k = selected.type + ':' + selected.id;
    if (k !== lastKey) { lastKey = k; uxSheetSet('peek'); }
  }).observe(d, { attributes: true, attributeFilter: ['hidden'], childList: true });
  let y0 = null, top0 = 0;
  d.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; top0 = d.scrollTop; }, { passive: true });
  d.addEventListener('touchend', e => {
    if (y0 === null || !portraitMode) return;
    const dy = e.changedTouches[0].clientY - y0, full = d.classList.contains('is-full'); y0 = null;
    if (dy < -40 && !full) { uxSheetSet('full'); haptic(); }
    else if (dy > 50 && top0 <= 0) { if (full) uxSheetSet('peek'); else clearSelection(); haptic(); }
  }, { passive: true });
  d.addEventListener('click', e => { // a tap on the grip strip toggles; taps fire click on touch screens too
    if (portraitMode && e.clientY - d.getBoundingClientRect().top < 30 && !e.target.closest('button')) uxSheetSet(d.classList.contains('is-full') ? 'peek' : 'full'); });
})();
// Range previews: shrink the sheet and fit the whole circle above it.
for (const [name, radius] of [['previewMeteo', c => meteoPreview?.radius || 240], ['previewRepairCenter', () => typeof REPAIR_CENTER_RADIUS === 'number' ? REPAIR_CENTER_RADIUS : 300]]) {
  const f = globalThis[name]; if (typeof f !== 'function') continue;
  globalThis[name] = function (id, ...rest) {
    const r = f.call(this, id, ...rest), c = S.cities[id];
    if (c) { uxPreviewFrame = { c, radius: radius(c) }; uxSheetSet('peek'); }
    return r;
  };
}

/* ---------- map legibility: halos, fewer squares, quiet decorations while you work ---------- */
globalThis.TEXT_HALO = '#fffef9e6';   // soft outline keeps labels readable over lines and buildings
globalThis.QUEUE_SHOWN = 12;           // two rows of waiting squares, then "+n"
globalThis.TIMERS_BELOW = true;        // countdowns sit under the name, not on the buildings
globalThis.SUBTITLE_MIN_SCALE = .8;    // "旅游 · 小镇" only when zoomed in (or the city is selected)
(function quietArt() {
  const art = drawCityArt;
  drawCityArt = function (c) {
    const busy = draft || bridgeDraft || selected?.type === 'line';
    globalThis.ART_ALPHA = busy ? .42 : 1;
    try { return art(c); } finally { globalThis.ART_ALPHA = 1; }
  };
})();
// Mission badges: show progress that means something; a row of "0/20" at overview zoom is noise.
drawMissionBadges = function () {
  for (const c of realCities()) {
    if (c.dormant) { if (typeof drawCityOpening === 'function') drawCityOpening(c); continue; }
    const spec = missionSpec(c), rewarded = c.rewardUntil > S.day, label = rewarded ? '奖金已到账' : spec ? c.mission.progress + '/' + spec.goal : '繁荣';
    const focus = selected && ['city', 'stop', 'junction'].includes(selected.type) && selected.id === c.id;
    if (!rewarded && !focus && view.scale < .9 && (!spec || c.mission.progress === 0)) continue;
    roundBody(c.x - 28, c.y - 85 - c.size * 9, 56, 17, 5, rewarded ? '#e5efda' : '#fffdf6', '#e1e6d8', .8);
    text(label, c.x, c.y - 73 - c.size * 9, 8, rewarded ? '#577942' : '#879274');
  }
};

/* ---------- readable portrait: play view, size floors, no creeping zoom ---------- */
// The default camera frames the cities you are playing with at a readable scale instead of squeezing the whole
// world into a thumbnail. ⌖ toggles between this play view and the full overview. When the map is zoomed out,
// the things you act on (city nodes, names, waiting squares, lines) keep a minimum on-screen size; buildings
// and scenery do not, so the hierarchy reads at a glance.
const PLAY_MIN_SCALE = .66;
const UX_FIT_PAD = { l: 34, r: 86, t: 44, b: 58 };
globalThis.CITY_GLYPH = () => ctx.canvas === cv ? Math.max(1, Math.min(1.45, .85 / view.scale)) : 1;
(function lineFloor() {
  const style = lineStyle;
  lineStyle = function (...a) { style.apply(this, a); if (ctx.canvas === cv) ctx.lineWidth *= Math.max(1, Math.min(1.4, .85 / view.scale)); };
})();
function uxScreenFor(v, p) { return v.rot ? { x: v.x - p.y * v.scale, y: v.y + p.x * v.scale } : { x: v.x + p.x * v.scale, y: v.y + p.y * v.scale }; }
// Phones: portrait, or a short landscape screen (the side route list and dock leave a small map window).
function uxCompact() { return portraitMode || H <= 500; }
const PLAY_MIN_SCALE_LAND = .6;
function uxPlayTarget() {
  const all = fitTarget();
  if (!uxCompact()) return all;
  if (portraitMode && all.scale >= PLAY_MIN_SCALE) return all;
  const active = realCities().filter(c => !c.dormant); if (!active.length) return all;
  const rot = view.rot; let s, box;
  if (portraitMode) {
    const band = fitBand(); s = PLAY_MIN_SCALE;
    box = { l: band.side + UX_FIT_PAD.l, r: W - band.side - UX_FIT_PAD.r, t: band.top + UX_FIT_PAD.t, b: band.bottom - UX_FIT_PAD.b };
  } else {
    // landscape phone: the free map window is what remains after the route list (left) and the dock (bottom)
    const r = uxVisibleRect(); box = { l: r.l + 20, r: r.r - 70, t: r.t + 26, b: r.b - 34 };
    const xs = active.map(c => c.x), ys = active.map(c => c.y);
    s = Math.max(PLAY_MIN_SCALE_LAND, Math.min(1.1, (box.r - box.l) / Math.max(1, Math.max(...xs) - Math.min(...xs)), (box.b - box.t) / Math.max(1, Math.max(...ys) - Math.min(...ys))));
  }
  const cx = (box.l + box.r) / 2, cy = (box.t + box.b) / 2;
  const mean = { x: active.reduce((n, c) => n + c.x, 0) / active.length, y: active.reduce((n, c) => n + c.y, 0) / active.length };
  let best = null;
  for (const p of [mean, ...active]) {
    const v = { rot, scale: s, ...uxViewFor(p, cx, cy, s) };
    let score = 0;
    for (const c of active) { const q = uxScreenFor(v, c); if (q.x >= box.l && q.x <= box.r && q.y >= box.t && q.y <= box.b) score += cityHasRoute?.(c) ? 2 : 1; }
    score -= Math.hypot(p.x - mean.x, p.y - mean.y) / 1e4;   // tie-break: stay near the middle of the network
    if (!best || score > best.score) best = { score, v };
  }
  return { x: best.v.x, y: best.v.y, scale: s };
}
let uxOverviewOn = false;
function uxApplyPlayView(animate) {
  if (!uxCompact() || !S?.cities) return;
  const t = uxPlayTarget(); uxOverviewOn = false; uxSyncOverviewButton();
  if (animate) animateView(t); else Object.assign(view, t);
}
function uxSyncOverviewButton() { const b = uxEl('overview'); if (b) { b.title = uxOverviewOn ? '回到游玩视图' : '查看全图'; b.setAttribute('aria-label', b.title); b.classList.toggle('is-on', uxOverviewOn); } }
uxEl('overview').onclick = () => {
  if (!uxCompact()) { animateFit(); return; }
  uxOverviewOn = !uxOverviewOn; uxSyncOverviewButton();
  animateView(uxOverviewOn ? fitTarget() : uxPlayTarget()); haptic();
};
addEventListener('resize', () => uxApplyPlayView(false));
(function () { const start = startGame; startGame = function (...a) { const r = start.apply(this, a); uxApplyPlayView(false); return r; }; })();
// Framing for an open sheet may zoom out; closing the sheet brings the earlier view back, unless the player
// moved the map in between. Repeated open/close therefore never ratchets the scale down.
let uxFrameRestore = null;   // { from: view before the first automatic framing, to: view after the latest one }
// Remember the end state of every camera animation, so "is the view still where our framing put it?" needs no timers.
let uxLastViewTarget = null;
(function () { const anim = animateView; animateView = function (t, ms) { uxLastViewTarget = { x: t.x, y: t.y, scale: t.scale }; return anim(t, ms); }; animateView.id = anim.id; Object.defineProperty(animateView, 'id', { get: () => anim.id, set: v => { anim.id = v; } }); })();
(function () {
  const frame = uxFrame, near = (p, q) => q && Math.abs(p.scale - q.scale) < 1e-3 && Math.abs(p.x - q.x) < 3 && Math.abs(p.y - q.y) < 3;
  uxFrame = function (points, pad) {
    const before = { x: view.x, y: view.y, scale: view.scale }, id0 = animateView.id;
    frame(points, pad);
    if (animateView.id === id0) return;              // nothing moved
    if (!uxFrameRestore) uxFrameRestore = { from: before, to: null };
    uxFrameRestore.to = uxLastViewTarget;           // where our own framing ends up
  };
  const d = uxEl('details');
  if (d?.getBoundingClientRect && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    if (!d.hidden || !uxFrameRestore) return;
    const r = uxFrameRestore; uxFrameRestore = null;
    // The sheet also hides when a line edit starts: the map must stay put under the finger.
    if (draft || uxExt || bridgeDraft) return;
    // Only undo our own framing: if the player panned or zoomed after it, their view stays.
    if (near(view, r.to)) animateView(r.from, 280);
  }).observe(d, { attributes: true, attributeFilter: ['hidden'] });
})();

/* ---------- first-game coach: follows what the player does, then retires ---------- */
// No modal, no arrows over controls: one quiet hint above the bottom bar and, before the first line, a pulsing
// dashed suggestion between the two closest open cities. Stored once finished or dismissed (per browser).
const UX_COACH_KEY = 'transit-ux-coach-done';
let uxCoach = { done: false, step: '', firstLineAt: 0 };
try { uxCoach.done = localStorage.getItem(UX_COACH_KEY) === '1'; } catch {}
// hoisted, so early callers (before the let above is initialised) get false instead of a TDZ error
function uxCoachActive() { try { return !uxCoach.done; } catch { return false; } }
function uxCoachShowing() { try { return !!uxCoach.step; } catch { return false; } }
function uxCoachFinish() { uxCoach.done = true; try { localStorage.setItem(UX_COACH_KEY, '1'); } catch {} uxCoachRender(); }
function uxCoachPair() {
  const cs = realCities().filter(c => !c.dormant); let best = null;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const d = Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y); if (!best || d < best.d) best = { a: cs[i], b: cs[j], d }; }
  return best;
}
function uxCoachStep() {
  if (uxCoach.done || !S?.lines || S.day > 6) return '';
  if (draft && !draft.original) return draft.stops.length < 2 ? 'next' : 'build';
  if (!S.lines.length) return 'start';
  if (!uxCoach.firstLineAt) uxCoach.firstLineAt = performance.now();
  return performance.now() - uxCoach.firstLineAt < 9000 ? 'deliver' : (uxCoachFinish(), '');
}
const UX_COACH_TEXT = {
  start: '<b>第一步</b>从一座城市拖到另一座，修出第一条线路',
  next: '<b>继续拖</b>到下一座城市，可以连续经过多座',
  build: '<b>核对报价</b>，点底栏「建设」完成',
  deliver: '<b>开通了！</b>乘客头上的色块是目的地，送到同色同形的城市；点城市看任务',
};
function uxCoachRender() {
  let el = uxEl('ux-coach');
  if (!el && document.body?.appendChild) {
    el = document.createElement('div'); el.id = 'ux-coach'; el.setAttribute('role', 'status');
    el.innerHTML = '<span></span><button aria-label="关闭引导">×</button>';
    el.querySelector('button').onclick = uxCoachFinish;
    document.body.appendChild(el);
  }
  if (!el) return;
  const step = modalOpen ? '' : uxCoachStep();
  el.hidden = !step;
  if (step && step !== uxCoach.step) el.querySelector('span').innerHTML = UX_COACH_TEXT[step];
  uxCoach.step = step;
  if (step) { // float just above whatever sits at the bottom (route strip, draw bar, sheet)
    let top = H;
    for (const q of ['#drawbar', '#details', '#routes', 'footer .dock']) { const e = document.querySelector(q); if (!e || e.hidden || getComputedStyle(e).display === 'none') continue; const r = e.getBoundingClientRect(); if (r.height && r.top > H * .4) top = Math.min(top, r.top); }
    el.style.bottom = (H - top + 10) + 'px';
  }
}
if (typeof setInterval === "function") setInterval(() => { try { uxCoachRender(); } catch {} }, 300);
function uxDrawCoach() {
  if (uxCoach.done || uxCoach.step !== 'start') return;
  const p = uxCoachPair(); if (!p) return;
  const k = 1 / view.scale, t = (performance.now() % 1600) / 1600;
  ctx.save(); ctx.strokeStyle = '#c56544'; ctx.lineWidth = 3 * k; ctx.lineCap = 'round';
  ctx.setLineDash([2 * k, 9 * k]); ctx.lineDashOffset = -t * 22 * k; ctx.globalAlpha = .85;
  ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(p.b.x, p.b.y); ctx.stroke(); ctx.setLineDash([]);
  for (const c of [p.a, p.b]) { ctx.globalAlpha = .55 * (1 - t); ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(c.x, c.y, (radius(c) * (globalThis.CITY_GLYPH?.() ?? 1) + 8 + 16 * t) , 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

/* Re-render surfaces that were drawn before this layer loaded. */
if (modalOpen && uxEl('modal-content').innerHTML.includes('startGame()')) welcome(typeof hadSave !== 'undefined' && hadSave);
updateUI();
