import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
async function attachAndroid(){
 if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=='android')return;
 window.transitNativeLifecycle13=true;
 // Capacitor Android isActive=false is emitted by Activity.onStop, not temporary onPause/focus loss.
 await App.addListener('appStateChange',s=>{window.transitAndroidBackground13=!s.isActive;if(!s.isActive)window.transitAndroidControl.pause('安卓应用进入后台');else window.transitAndroidControl.resume();});
 await App.addListener('backButton',()=>{if(window.transitAndroidControl.back())App.minimizeApp().catch(e=>console.error('Unable to minimize app',e));});
}
attachAndroid().catch(e=>console.error('Android lifecycle bridge failed',e));
