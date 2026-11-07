from pathlib import Path
import os,subprocess,urllib.parse,sys
root=Path(__file__).resolve().parent.parent
env=os.environ.copy()
if not env.get('ANDROID_HOME'):raise SystemExit('Set ANDROID_HOME to an installed Android SDK.')
proxy=urllib.parse.urlparse(env.get('HTTPS_PROXY',env.get('https_proxy','')))
opts=[]
if proxy.hostname:
 for proto in ['http','https']:opts+=['-D'+proto+'.proxyHost='+proxy.hostname,'-D'+proto+'.proxyPort='+str(proxy.port or 80)]
if env.get('JAVA_TRUST_STORE'):opts+=['-Djavax.net.ssl.trustStore='+env['JAVA_TRUST_STORE']]
env['GRADLE_OPTS']=env.get('GRADLE_OPTS','')+' '+' '.join(opts)
log=root/'validation/build.log';log.parent.mkdir(exist_ok=True)
with log.open('w') as f:r=subprocess.run(['./gradlew','--no-daemon','--console=plain','--max-workers=2','assembleDebug','lintDebug'],cwd=root/'android',env=env,stdout=f,stderr=subprocess.STDOUT)
print('Android build exit',r.returncode);print(log.read_text()[-5000:]);sys.exit(r.returncode)
