'use strict';
// This script runs only after all gameplay, menu, save and layout initialization has completed.
function releaseStartup124(){let menu=document.getElementById('map-selection');if(!menu||menu.hidden||!S||!document.getElementById('atlas-start').textContent.trim()){startupFailure124();return;}requestAnimationFrame(()=>requestAnimationFrame(()=>{document.documentElement.classList.remove('app-booting124');document.getElementById('startup-cover124')?.remove();window.transitStartupReady124=true;}));}
function startupFailure124(){let cover=document.getElementById('startup-cover124');if(cover)cover.innerHTML='<strong>交通线</strong><p>加载未完成，请重试。</p><button onclick="location.reload()">重新加载</button>';}
releaseStartup124();
