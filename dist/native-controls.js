'use strict';
// Native bridge entry points; gameplay source and browser deployment are untouched.
window.transitAndroidControl={
 pause(reason){interruptGame(reason||'安卓应用中断');},
 resume(){retainInterruptionPause();},
 back(){let quoting=!!draft||!!bridgeDraft;interruptGame('安卓返回键');if(quoting)return false;if(modalOpen){closeModal();return false;}if(selected){clearSelection();return false;}if(!atlasMenuOpen){showAtlasMaps(false);return false;}return true;}
};

// Keep release notes inside the game document so Android Back/lifecycle stay attached.
function showNativeReleaseNotes(){openModal('<div class="modal-head"><h2>更新说明</h2><button class="close" onclick="closeModal()" aria-label="关闭更新说明">×</button></div><iframe src="updates/index.html" title="本地更新说明" sandbox="" style="width:100%;height:65vh;border:0;background:#f4f5ed"></iframe>');}
document.addEventListener('click',e=>{let a=e.target?.closest?.('a[href]');if(a&&/^updates(?:\/|$)/.test(a.getAttribute('href'))){e.preventDefault();e.stopPropagation();showNativeReleaseNotes();}},true);
