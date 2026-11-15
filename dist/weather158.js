'use strict';
// Weather effects use simulation time, so pause/background and reload do not
// advance their animation. No simulation random values are consumed by drawing.
function weatherPhase158() { return S.day * 80; }
function drawWeatherParticles158(event, center) {
  if (!['fog','rain'].includes(event.type)) return;
  const r=event.radius, p=toScreen(center), pixels=r*view.scale;
  if(p.x+pixels<0||p.x-pixels>W||p.y+pixels<0||p.y-pixels>H)return;
  const time=weatherPhase158(), scale=Math.max(.08,view.scale);
  ctx.save();ctx.setLineDash([]);ctx.beginPath();ctx.arc(center.x,center.y,r,0,Math.PI*2);ctx.clip();
  if(event.type==='fog') {
    for(let i=0;i<6;i++) {
      const angle=i*2.399+Math.sin(time*.025+i)*.2;
      const radius=r*(.18+.38*((i*17%7)/7));
      const x=center.x+Math.cos(angle)*radius+Math.sin(time*.08+i)*r*.09;
      const y=center.y+Math.sin(angle)*radius*.8, size=r*(event.strong?.67:.5);
      const gradient=ctx.createRadialGradient(x,y,0,x,y,size);
      gradient.addColorStop(0,event.strong?'#eef2f04a':'#eef2f031');gradient.addColorStop(1,'#eef2f000');
      ctx.fillStyle=gradient;ctx.fillRect(x-size,y-size,size*2,size*2);
    }
  } else {
    const count=event.strong?72:42;
    ctx.strokeStyle=event.strong?'#608b9e85':'#739aaa66';ctx.lineWidth=1/scale;
    ctx.beginPath();
    for(let i=0;i<count;i++) {
      const u=((i*.61803398875)%1),phase=(time*.6+i*.371)%1;
      const x=center.x+(u*2-1)*r-phase*r*.18,y=center.y+(phase*2-1)*r;
      ctx.moveTo(x,y);ctx.lineTo(x-3/scale,y+9/scale);
    }
    ctx.stroke();
    for(let i=0;i<7;i++) {
      const phase=(time*.35+i*.173)%1,x=center.x+Math.sin(i*71)*r*.75,y=center.y+Math.cos(i*49)*r*.7;
      ctx.globalAlpha=(1-phase)*.18;ctx.strokeStyle='#719aa9';ctx.lineWidth=.8/scale;
      ctx.beginPath();ctx.ellipse(x,y,(2+phase*5)/scale,(1+phase*2)/scale,0,0,Math.PI*2);ctx.stroke();
    }
  }
  ctx.restore();
}
// Remove old scheduled/active typhoons when continuing a western save too.
const loadBeforeWeather158=load;
load=function(...args){const result=loadBeforeWeather158(...args);if(result&&S.mapId==='west')ensureTyphoonSeason(Math.floor(S.day/360));return result;};
if(S.mapId==='west')ensureTyphoonSeason(Math.floor(S.day/360));

const refreshCardsBefore158=atlasRefreshCards;
atlasRefreshCards=function(...args){let result=refreshCardsBefore158(...args);const saved=atlasSaved('west'),note=$('atlas-save-west');if(saved&&saved.basinTerrain158!==3&&note)note.textContent+=' · 旧地形，重新开始体验山脉相连的盆地';return result;};
atlasRefreshCards();
