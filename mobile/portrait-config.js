'use strict';
window.TRANSIT_PORTRAIT_LAYOUT=true;
document.documentElement.classList.add('portrait-shell');

// A failed initialization keeps the game hidden and exposes an explicit retry.
setTimeout(()=>{if(!document.documentElement.classList.contains('app-booting124'))return;let cover=document.getElementById('startup-cover124');if(cover)cover.innerHTML='<strong>交通线</strong><p>加载未完成，请重试。</p><button onclick="location.reload()">重新加载</button>';},8000);
