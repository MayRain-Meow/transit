from pathlib import Path
import os,subprocess,hashlib,json,zipfile,re,xml.etree.ElementTree as E
root=Path(__file__).resolve().parent.parent
sdk=Path(os.environ.get('ANDROID_HOME','/workspace/scratch/7efee825b3fe/android-sdk'));bt=sdk/'build-tools/36.0.0'
apk=root/'android/app/build/outputs/apk/debug/app-debug.apk';v=root/'validation';v.mkdir(exist_ok=True)
sig=subprocess.check_output([str(bt/'apksigner'),'verify','--verbose','--print-certs',str(apk)],text=True);assert 'Verifies' in sig
meta=subprocess.check_output([str(bt/'aapt'),'dump','badging',str(apk)],text=True)
(v/'signature.txt').write_text(sig);(v/'apk-metadata.txt').write_text(meta)
assert "versionCode='12008'" in meta and "versionName='1.2.7-playtest'" in meta
manifest=subprocess.check_output([str(bt/'aapt'),'dump','xmltree',str(apk),'AndroidManifest.xml'],text=True)
assert re.search(r'android:screenOrientation.*0x1\b',manifest), 'APK must lock portrait'
assert re.search(r'android:windowSoftInputMode.*0x10\b',manifest), 'APK must resize for keyboard'
(v/'manifest-tree.txt').write_text(manifest)
files=0
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None
 for p in (root/'www').rglob('*'):
  if p.is_file():assert z.read('assets/public/'+str(p.relative_to(root/'www')))==p.read_bytes(),str(p);files+=1
 cfg=json.loads(z.read('assets/capacitor.config.json'));assert 'url' not in cfg['server'];assert cfg['android']['minWebViewVersion']==108
 assert cfg['plugins']['SystemBars']['insetsHandling']=='css'
 assert b'com.capacitorjs.plugins.app.AppPlugin' in z.read('assets/capacitor.plugins.json')
 assert any(b'AppPlugin' in z.read(n) for n in z.namelist() if re.fullmatch('classes[0-9]*.dex',n))
 assert b'function showNativeReleaseNotes' in z.read('assets/public/native-controls.js')
 assert b'if(!window.TRANSIT_PORTRAIT_LAYOUT&&S&&!modalOpen)' in z.read('assets/public/world.js')
 assert b'fonts.googleapis.com' not in z.read('assets/public/style.css')
 assert b'display=swap' not in z.read('assets/public/style.css')
 assert b':root{\n  --ink:#263b42' in z.read('assets/public/style.css')
 assert b'drawClimate=function(){climateBeforeRegions();drawQuakeEffect();};' in z.read('assets/public/world-upgrade.js')
 assert b'portraitAskRestart' in z.read('assets/public/portrait-layout.js')
 assert b'tutorialSet123' in z.read('assets/public/update123.js')
 assert b"if(l.type!='bus'" not in z.read('assets/public/game.js') # exact patch uses !==
 assert b"if(l.type!=='bus'&&v.people.length>=vehCap(v))" in z.read('assets/public/game.js')
 assert b'quote-compact' in z.read('assets/public/update123.css')
 assert b'bridgeWalk124' in z.read('assets/public/update124.js')
 assert b'app-booting124' in z.read('assets/public/index.html')
 assert b'releaseStartup124' in z.read('assets/public/startup124.js')
 assert b'backtrack125' in z.read('assets/public/update125.js')
 assert b'grid-template-columns:minmax(0,1fr) 44px 58px' in z.read('assets/public/update125.css')
issues=E.parse(root/'android/app/build/reports/lint-results-debug.xml').getroot().findall('issue')
summary={'version':'1.2.7-playtest','package':'com.transitatlas.playtest','versionCode':12008,'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'signerSha256':re.search('certificate SHA-256 digest: (\\w+)',sig)[1],'apkSignature':'v2 verified','orientation':'portrait','keyboard':'adjustResize','systemInsets':'css','embeddedWebFilesByteMatched':files,'androidMinSdk':24,'targetSdk':36,'minWebView':108,'appLintErrors':sum(x.get('severity')=='Error' for x in issues),'appLintWarnings':sum(x.get('severity')=='Warning' for x in issues),'warningTypes':sorted({x.get('id') for x in issues}),'androidDeviceTested':False,'emulatorTested':False,'githubUploaded':False,'websiteChanged':False,'sourceBaseCommit':'fe78b05a3e55617c02385919ffb8feedfa31e915'}
assert summary['appLintErrors']==0
assert summary['signerSha256']=='66fc76cb93344626a1dd0ca7de5ea34ba8a7520361ec8c28eedf88c1f2753261'
(v/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False,indent=2))
