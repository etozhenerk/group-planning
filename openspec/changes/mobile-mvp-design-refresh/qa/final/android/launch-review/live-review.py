import subprocess as sp, json, time, pathlib, hashlib, os, signal, datetime
out=pathlib.Path(__file__).resolve().parent
adb='/Users/misha/Library/Android/sdk/platform-tools/adb'
pkg='dev.groupplanning.android.uitesthost'; activity=pkg+'/dev.groupplanning.android.MainActivity'
fixture=pathlib.Path('/private/tmp/android-final-r9-launch/config.json')
config=json.loads(fixture.read_text()); port=config['origin'].split(':')[-1]
fixture_pid=int(pathlib.Path('/private/tmp/android-final-r9-launch/pid').read_text())
entries=[]
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def call(*args, data=None):
 r=sp.run([adb,'-s','emulator-5554',*args],input=data,stdout=sp.PIPE,stderr=sp.PIPE,check=True)
 return r.stdout

def shell(*args):return call('shell',*args).decode().strip()
def log(action,**kw):
 e={'at':now(),'action':action,**kw};entries.append(e);(out/'interactions.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2))
 print(action,flush=True)
def shot(name):
 (out/(name+'.png')).write_bytes(call('exec-out','screencap','-p'));log('screenshot',file=name+'.png')
def frames(name,duration):
 start=time.monotonic();idx=0
 while time.monotonic()-start<duration:
  shot(name+f'-{idx:02d}');idx+=1;time.sleep(.04)
def start():
 log('cold-start',scenario='calendar');call('shell','am','start','-n',activity,'--es','scenario','calendar')
def stop():call('shell','am','force-stop',pkg)
settings={k:shell('settings','get',*k.split('/')) for k in ['system/font_scale','global/animator_duration_scale','global/transition_animation_scale','global/window_animation_scale','secure/accelerometer_rotation','system/user_rotation']}
env={'at':now(),'fixtureSha256':hashlib.sha256(fixture.read_bytes()).hexdigest(),'originalSettings':settings,'originalSize':shell('wm','size'),'originalDensity':shell('wm','density'),'os':shell('getprop','ro.build.version.release'),'sdk':shell('getprop','ro.build.version.sdk'),'model':shell('getprop','ro.product.model'),'locale':shell('getprop','persist.sys.locale'),'timezone':shell('getprop','persist.sys.timezone'),'apkSha256':hashlib.sha256(pathlib.Path('/private/tmp/mobile-final-android-r9/app-qa.apk').read_bytes()).hexdigest()}
(out/'environment.json').write_text(json.dumps(env,indent=2));log('environment-recorded')
paused=False
try:
 call('reverse','tcp:'+port,'tcp:'+port);call('push',str(fixture),'/data/local/tmp/somewhere-android-ui-6386901.json')
 call('shell','run-as',pkg,'mkdir','-p','no_backup')
 call('shell',f"run-as {pkg} sh -c 'cat > no_backup/ui-fixture.json'",data=fixture.read_bytes())
 for key in settings:
  if 'scale' in key:shell('settings','put',*key.split('/'),'1')
 for size,px in [('small-phone','640x1136'),('standard-phone','720x1600')]:
  stop();shell('wm','size',px);time.sleep(.6);log('viewport',name=size,px=px,density=320)
  os.kill(fixture_pid,signal.SIGSTOP);paused=True;log('fixture-paused',reason='controlled restore >1200ms; original loopback API unchanged')
  start();frames(size+'-cold',3.2)
  call('shell','uiautomator','dump','/data/local/tmp/somewhere-launch-window.xml')
  (out/(size+'-launch-hierarchy.xml')).write_bytes(call('exec-out','cat','/data/local/tmp/somewhere-launch-window.xml'))
  shot(size+'-restore-long');time.sleep(1);shot(size+'-restore-long-later')
  os.kill(fixture_pid,signal.SIGCONT);paused=False;log('fixture-resumed');time.sleep(2);shot(size+'-ready')
  call('shell','input','keyevent','3');log('press-home');time.sleep(.5)
  call('shell','am','start','-n',activity);log('resume-same-activity');frames(size+'-resume',1.7)
  shell('settings','put','system','font_scale','1.1');log('configuration-change',fontScale=1.1)
  time.sleep(.5);shot(size+'-recreation');shell('settings','put','system','font_scale','1');time.sleep(.5)
  # Existing instrumentation exercises ActivityScenario.recreate and verifies the same ViewModel/finished intro.
  res=call('shell','am','instrument','-w','-r','-e','fixturePath','/data/local/tmp/somewhere-android-ui-6386901.json','-e','class','dev.groupplanning.android.EntryUiTests#launchCompletesOnceAcrossRecreationAndBackground',pkg+'.test/androidx.test.runner.AndroidJUnitRunner')
  (out/(size+'-recreation-instrumentation.txt')).write_bytes(res);log('existing-live-recreation-test',result=res.decode()[-400:])
  stop();start();frames(size+'-fast',2.5);shot(size+'-fast-ready')
  for key in ['animator_duration_scale','transition_animation_scale','window_animation_scale']:shell('settings','put','global',key,'0')
  stop();os.kill(fixture_pid,signal.SIGSTOP);paused=True;start();frames(size+'-disabled',2.4);shot(size+'-disabled-static')
  os.kill(fixture_pid,signal.SIGCONT);paused=False;time.sleep(1);shot(size+'-disabled-ready')
  for key in ['animator_duration_scale','transition_animation_scale','window_animation_scale']:shell('settings','put','global',key,'1')
  shell('settings','put','system','font_scale','1.8');stop();os.kill(fixture_pid,signal.SIGSTOP);paused=True;start();time.sleep(1.8);shot(size+'-large-text');os.kill(fixture_pid,signal.SIGCONT);paused=False;time.sleep(.3);shell('settings','put','system','font_scale','1')
finally:
 if paused:os.kill(fixture_pid,signal.SIGCONT)
 stop()
 for key,value in settings.items():
  if value=='null':shell('settings','delete',*key.split('/'))
  else:shell('settings','put',*key.split('/'),value)
 # Restore exact original wm override.
 old=env['originalSize'];override=next((l.split(': ')[1] for l in old.splitlines() if l.startswith('Override size:')),None)
 shell('wm','size',override or 'reset')
 call('reverse','--remove','tcp:'+port)
 call('shell','rm','-f','/data/local/tmp/somewhere-android-ui-6386901.json','/data/local/tmp/somewhere-launch-window.xml')
 log('cleanup',settings={k:shell('settings','get',*k.split('/')) for k in settings},size=shell('wm','size'),density=shell('wm','density'))
