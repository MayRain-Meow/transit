/* First playable casino opening: once per run, persisted before displaying. */
function firstCasinoNotice165(){
 if(!isOcean16()||atlasMenuOpen||modalOpen||draft||bridgeDraft||gesture||pointers.size||interruptionPending()||!canResumeInterface()||S.lives<=0||runtimeFault13)return false;
 let s=casinoState16();if(s.firstNoticeSeen165)return false;
 if(s.session||s.last){s.firstNoticeSeen165=true;save();return false;}
 if(!casinoDue16())return false;
 s.firstNoticeSeen165=true;save();
 openModal(`<section class="casino-first165"><div class="modal-head"><h2>拉斯维加斯首次开放</h2><button class="close" onclick="closeModal()" aria-label="关闭提示">×</button></div><div class="casino-first-icon165" aria-hidden="true">🎰</div><h2>赌城今天开放了</h2><p>拉斯维加斯的拉杆机现已可以进入。<br>每10天开放1天，是否参加由你选择。</p><p>进入前自行填写带入金额，每场最多拉10次，<br>可以提前退出并带走剩余余额。</p><small>后续开放会用小提示提醒。</small><div class="ux-actions"><button class="primary" onclick="showCasino16()">前往赌城</button><button onclick="closeModal()">稍后再去</button></div></section>`);return true;
}
const casinoUIBefore165=updateUI;
updateUI=function(...a){let r=casinoUIBefore165(...a);firstCasinoNotice165();return r;};
