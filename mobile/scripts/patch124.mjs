import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';
export async function patch124(out){let p=path.join(out,'game.js'),s=await readFile(p,'utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing game patch: '+a.slice(0,65));s=s.replace(a,b);}
replace("function commitDraft(skipCostConfirmation=false){if(!draft", "function commitDraft(skipCostConfirmation=false){let wasEdit124=!!draft?.original;if(!draft");
replace("selected={type:'line',id};showDetails();updateUI();save();if(removal", "if(wasEdit124){selected=null;$('details').hidden=true;}else{selected={type:'line',id};showDetails();}updateUI();save();if(removal");
replace("if(gesture.kind==='draft'&&draft){draft.pointer=p;", "bridgeWalk124(p);if(gesture.kind==='draft'&&draft){draft.pointer=p;");
replace("draft.extensionPointer={city:origin.id,p};draft.pointer=p;draftBar();$('drawtext').textContent='继续拖到新城市延伸线路 · 松到空白处不改变线路';", "endpointDrag124(p);");
replace("toast(cost.invalid||'资金不足，本次拖动未生效');cancelDraft(false);", "toast(cost.invalid||'资金不足，请调整预览');draftBar();");
for(let [event,fn] of [['pointerdown','beginPointer'],['pointermove','movePointer'],['pointerup','finishPointer'],['pointercancel','finishPointer']])replace("cv.addEventListener('"+event+"',"+fn+")","cv.addEventListener('"+event+"',e=>"+fn+"(e))");
replace("gesture.kind='draft';gesture.moved=true;}let p=", "gesture.kind='draft';gesture.moved=true;if(draft&&!draft.stops.length&&gesture.c)addCityDraft123(gesture.c);}let p=");
await writeFile(p,s);
}
