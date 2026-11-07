import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
async function attachAndroid(){
 if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=='android')return;
 await App.addListener('pause',()=>window.transitAndroidControl.pause('安卓应用进入后台'));
 await App.addListener('appStateChange',s=>{if(!s.isActive)window.transitAndroidControl.pause('安卓应用失去活动状态');else window.transitAndroidControl.resume();});
 await App.addListener('resume',()=>window.transitAndroidControl.resume());
 await App.addListener('backButton',()=>{if(window.transitAndroidControl.back())App.minimizeApp().catch(e=>console.error('Unable to minimize app',e));});
}
attachAndroid().catch(e=>console.error('Android lifecycle bridge failed',e));
