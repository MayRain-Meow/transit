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
function panTo(x, y) {
  const b = fitBand();
  animateView({ scale: view.scale, x: W / 2 - x * view.scale, y: (b.top + b.bottom) / 2 - y * view.scale });
}
function uxFocusCity(id) {
  const c = S.cities[id]; if (!c) return;
  closeModal(); hideJunction(); selected = { type: 'city', id }; showDetails();
  requestAnimationFrame(() => panTo(c.x, c.y));
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
  const n = uxEl('notice'); if (n && n.textContent.startsWith('城市成长测试版')) n.textContent = '点城市查看任务 · 拖线后在底栏点「建设」';
};

/* ---------- sheets (modals) ---------- */
const uxOpenModal = openModal;
openModal = function (html) {
  html = String(html).split('¥' + S.points).join(money(S.points));
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
  openModal(`<div class="ux-hero"><span class="eyebrow">东岸 · 0.4.1 界面整合版</span><h1>从一条线，带动一座城。</h1>
<p class="ux-lead">从一座城市拖向另一座，修出线路、派出车辆，把乘客送到与他们标记同色同形的城市。完成城市任务拿奖金，看小镇长大。</p></div>
<ul class="ux-points">
<li><i>¥</i><span><b>起步 ¥500</b>大巴 ¥180，拉线另计建设费，报价就在底栏</span></li>
<li><i>↗</i><span><b>任务推动繁荣</b>点城市或「任务」查看阶段目标，奖金自动到账</span></li>
<li><i>♥</i><span><b>别让乘客久等</b>候车超过 180 秒会失去一条生命</span></li>
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
    '候车超过 180 秒会失去一条生命，之后有 45 秒保护。',
    '每座城市有 6 个阶段任务，奖金自动到账；连续类任务中断只重置天数，不扣钱。',
    '新城镇需要拉线接通才会产生乘客，接通后有 45 秒宽限。'])}
${sec('资金与车辆', [
    '大巴 ¥180 · 动车 ¥560 · 高铁 ¥900 · 飞机 ¥1600。新车进库存，在线路详情里点「＋」加车（没有库存会直接购买）。',
    '票款按起终点距离 1 / 2 / 3，乘坐方式加权：动车 ×1.4，高铁 ×1.8，飞机 ×3。',
    '每 10 天补助 ¥100；道路月底收维护费，账本里可看预计支出、拆除闲置道路。',
    '动车、高铁可加车厢（最多 8 节）；车辆可回收后改派其他线路。'])}
${sec('工程与天气', [
    '<b>桥梁</b>：工程 → 拉建公路桥 / 铁路桥，从一岸拖到对岸。',
    '<b>道路升级</b>：线路详情 → 道路升级，施工期间该路段减速 30%。',
    '<b>气象站</b>范围内天气减速减半；<b>交通枢纽</b>候车容量翻倍，全图最多 3 座。',
    '7 月下旬至 9 月可能有台风；第 150 天后有小概率地震，受损路段可在工程里维修。',
    '<b>检修中心</b>：中大城市可建，¥500、半径300，新开工升级和抢修工期最多缩短30%，部分覆盖按长度折算。'])}
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
  uxToast(t);
  uxPlaceToast();
};
// Portrait: float messages just above whatever sheet is at the bottom, inside the thumb zone.
function uxPlaceToast() {
  const el = uxEl('toast'); if (!el) return;
  if (!portraitMode) { el.style.top = el.style.bottom = ''; return; }
  let top = H;
  for (const sel of ['#details', '#routes', '#drawbar', 'footer .dock']) {
    const e = document.querySelector(sel);
    if (!e || e.hidden || typeof getComputedStyle !== 'function' || getComputedStyle(e).display === 'none') continue;
    const r = e.getBoundingClientRect(); if (r.height && r.top > H * 0.35) top = Math.min(top, r.top);
  }
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
<p class="ux-hint">拖端点城市可延长；拖线段经过城市可挂站、摘站。</p>
${vs.length ? `<div class="ux-list"><div class="ux-list-title">车辆与运行方案</div>${vs.map(v => `<div class="ux-row"><span><b>#${v.id}</b> ${uxServiceLabel(v)}<small>${v.people.length}/${vehCap(v)} 人${v.people.length >= vehCap(v) ? ' · <em class="danger">满员</em>' : ''}${isTrain(v.type) ? ' · ' + v.cars + '/8 节' : ''}</small></span><span class="ux-row-actions">${isTrain(v.type) && v.cars < 8 ? `<button onclick="upgradeCar(${v.id})" ${S.points < carPrice(v) ? 'disabled' : ''}>＋车厢 ¥${carPrice(v)}</button>` : ''}<button onclick="setService(${v.id})">方案</button></span></div>`).join('')}</div>` : ''}
<div class="ux-actions-row">${l.type !== 'air' ? `<button onclick="openInfrastructure(${l.id})">道路升级</button>` : ''}<button class="ux-danger" onclick="uxDeleteLine(${l.id})">${uxArmedDelete?.id === l.id && uxArmedDelete.until > performance.now() ? '再点一次确认撤销' : '撤销线路'}</button></div>`;
}
// Two-tap delete instead of the browser's confirm(); the armed state survives sheet refreshes.
let uxArmedDelete = null;
function uxDeleteLine(id) {
  if (uxArmedDelete?.id === id && uxArmedDelete.until > performance.now()) { uxArmedDelete = null; deleteLine(id, true); haptic(20); showDetails(); return; }
  uxArmedDelete = { id, until: performance.now() + 4000 }; haptic(); showDetails();
  setTimeout(() => { if (selected?.type === 'line' && selected.id === id) showDetails(); }, 4100);
}
const uxShowDetails = showDetails;
showDetails = function (rebuild = true) {
  if (selected?.type === 'line') return uxLineSheet(rebuild);
  uxLineSheet.sig = null;
  return uxShowDetails(rebuild);
};

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
    return `<button class="ux-task${c.dormant ? ' is-dormant' : ''}" onclick="uxFocusCity(${c.id})"><span class="ux-task-top"><b>${escapeHTML(c.name)}</b><small>${FEATURES[c.shape].name} · ${LEVELS[c.size]}</small>${spec ? `<em>+¥${spec.reward + (spec.upgrade ? 60 : 0)}</em>` : ''}</span>
<span class="ux-task-title">${c.dormant ? '待接入 · 拉线连通后开始产生乘客' : spec ? `阶段 ${c.mission.step + 1}/6 · ${escapeHTML(spec.title || spec.verb || '')}` : '全部阶段已完成'}</span>
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
  cv.addEventListener('pointermove', e => { ptr = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }; }, { passive: true });
  for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { ptr = null; }, { passive: true });
  function step() {
    try {
      if (ptr && gesture && pointers.size === 1 && ['draft', 'city-edit', 'elastic'].includes(gesture.kind)) {
        const top = (document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8;
        const bar = uxEl('drawbar'), bottom = bar && !bar.hidden ? bar.getBoundingClientRect().top - 8 : H - 8;
        const edge = 44, push = d => 7 * Math.min(1, d / edge);
        let dx = 0, dy = 0;
        if (ptr.clientX < edge) dx = push(edge - ptr.clientX); else if (ptr.clientX > W - edge) dx = -push(ptr.clientX - (W - edge));
        if (ptr.clientY < top + edge) dy = push(top + edge - ptr.clientY); else if (ptr.clientY > bottom - edge) dy = -push(ptr.clientY - (bottom - edge));
        if (dx || dy) { view.x += dx; view.y += dy; movePointer(ptr); }
      }
    } catch {}
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* Re-render surfaces that were drawn before this layer loaded. */
if (modalOpen && uxEl('modal-content').innerHTML.includes('startGame()')) welcome(typeof hadSave !== 'undefined' && hadSave);
updateUI();
