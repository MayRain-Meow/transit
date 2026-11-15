'use strict';
// One short, local connection effect. Music is deferred to a separate release.
const effectsKey156 = 'transit-effects-v1';
let effectsPrefs156 = { enabled: true, volume: 0.5 };
try {
  const saved = JSON.parse(localStorage.getItem(effectsKey156) || 'null');
  if (typeof saved?.enabled === 'boolean') effectsPrefs156.enabled = saved.enabled;
  if (Number.isFinite(saved?.volume)) effectsPrefs156.volume = Math.max(0, Math.min(1, saved.volume));
} catch (_) {}
let effect156 = null, effectsAway156 = false;
function stopEffect156() { try { effect156?.pause(); } catch (_) {} }
function playConnect156() {
  if (!effectsPrefs156.enabled || !effectsPrefs156.volume || effectsAway156 || document.hidden || window.transitAndroidBackground13) return;
  try {
    if (!effect156) { effect156 = new Audio('audio/connect.wav'); effect156.preload = 'auto'; effect156.id = 'connect-effect156'; effect156.hidden = true; document.body.appendChild(effect156); }
    effect156.pause(); effect156.currentTime = 0; effect156.volume = effectsPrefs156.volume;
    Promise.resolve(effect156.play()).then(() => {
      if (!effectsPrefs156.enabled || effectsAway156 || document.hidden || window.transitAndroidBackground13) stopEffect156();
    }).catch(() => {});
  } catch (_) {}
}
function setEffects156(key, value) {
  if (key === 'enabled') effectsPrefs156.enabled = !!value;
  else if (key === 'volume') effectsPrefs156.volume = Math.max(0, Math.min(1, Number(value) || 0));
  else return;
  try { localStorage.setItem(effectsKey156, JSON.stringify(effectsPrefs156)); } catch (_) {}
  if (!effectsPrefs156.enabled || !effectsPrefs156.volume) stopEffect156();
  renderEffects156();
}
function renderEffects156() {
  const button = $('effects-on156'), volume = $('effects-volume156');
  if (button) { button.textContent = effectsPrefs156.enabled ? '开启' : '关闭'; button.setAttribute('aria-pressed', String(effectsPrefs156.enabled)); }
  if (volume && document.activeElement !== volume) volume.value = Math.round(effectsPrefs156.volume * 100);
}
function openEffects156() {
  openModal('<div class="effects-sheet156"><div class="modal-head"><h2>音效</h2><button class="close" onclick="closeModal()" aria-label="关闭音效设置">×</button></div><div class="effects-row156"><label for="effects-on156">连接城市音效</label><button id="effects-on156" onclick="setEffects156(\'enabled\',!effectsPrefs156.enabled)"></button></div><label class="effects-volume156" for="effects-volume156">音量<input id="effects-volume156" type="range" min="0" max="100" step="5" oninput="setEffects156(\'volume\',this.value/100)"></label><p>线路建设成功时，轻轻响一声。</p><button onclick="playConnect156()">试听</button><button class="primary" onclick="closeModal()">完成</button></div>');
  renderEffects156();
}
for (const parent of [document.querySelector('header .controls'), document.querySelector('.atlas-top')]) {
  if (!parent) continue;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'ctl effects-button156'; button.textContent = '♪';
  button.title = '音效'; button.setAttribute('aria-label', '音效设置'); button.onclick = openEffects156;
  parent.appendChild(button);
}
// Preview and rejection leave the draft intact. Only a committed connection sounds.
const commitBeforeEffects156 = commitDraft;
commitDraft = function (...args) {
  const pending = draft;
  const previous = pending?.original ? S.lines.find(line => line.id === pending.original)?.stops || [] : [];
  const added = pending?.stops.filter(id => !previous.includes(id) && S.cities[id]?.kind !== 'bridgehead') || [];
  const result = commitBeforeEffects156(...args);
  if (pending && !draft && pending.stops.length >= 2 && added.length) playConnect156();
  return result;
};
document.addEventListener('visibilitychange', () => { if (document.hidden) stopEffect156(); });
window.addEventListener('pagehide', () => { effectsAway156 = true; stopEffect156(); });
window.addEventListener('pageshow', () => { effectsAway156 = false; });
// The native bridge uses interruptGame even when WebView visibility does not change.
const interruptBeforeEffects156 = interruptGame;
interruptGame = function (...args) { stopEffect156(); return interruptBeforeEffects156(...args); };
