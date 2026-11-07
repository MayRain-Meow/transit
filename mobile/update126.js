'use strict';
// One introduction per map save. Defer while another interaction needs attention.
function maybeFarmIntro126(){
 if(!S||atlasMenuOpen||modalOpen||draft||bridgeDraft||selected||pointers.size||S.lives<=0||interruptionPending())return false;
 const stage=S.tutorial123?.stage;if(stage&&stage!=='done')return false;
 const a=agricultureState();if(a.introduced126)return false;
 // Existing growers already know this feature; do not interrupt upgraded saves.
 if(a.planted>0||S.cities.some(c=>c.farm)){a.introduced126=true;save();return false;}
 if(a.pending||S.points<FARM_COST)return false;
 const c=S.cities.find(c=>farmEligible(c)&&c.size>=1&&!c.dormant);if(!c)return false;
 a.introduced126=true;S.paused=true;
 openModal(`<div class="modal-head"><h2>农田已可种植</h2></div><p>${escapeHTML(c.name)}已接通，可以开始经营农田。</p><p>中级及以上居住城市各有一块农田，每轮投入 ¥800，第10天中午12:00收获。丰收52%：收回 ¥1000；歉收48%：收回 ¥650。收获后可自行决定是否续种。</p><p>游戏已暂停。以后可点击居住城市，或从运营中的农业经营进入。</p><div class="ux-actions"><button class="primary" onclick="showFarm(${c.id})">查看农田</button><button onclick="closeModal()">知道了</button></div>`);
 save();updateUI();return true;
}
const renderBefore126=render;render=function(){maybeFarmIntro126();return renderBefore126();};
