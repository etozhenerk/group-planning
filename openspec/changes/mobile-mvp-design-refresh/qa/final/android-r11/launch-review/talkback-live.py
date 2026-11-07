import subprocess as sp,json,pathlib,os,signal,datetime,tarfile
out=pathlib.Path(__file__).resolve().parent
adb='/Users/misha/Library/Android/sdk/platform-tools/adb';pkg='dev.groupplanning.android.uitesthost'
def call(*args):return sp.check_output([adb,'-s','emulator-5554',*args])
def shell(*args):return call('shell',*args).decode().strip()
fixture=pathlib.Path('/private/tmp/android-final-r10-manual/config.json');c=json.loads(fixture.read_text());port=c['origin'].rsplit(':',1)[-1];pid=int(pathlib.Path('/private/tmp/android-final-r10-manual/pid').read_text())
keys=['system/font_scale','global/animator_duration_scale','global/transition_animation_scale','global/window_animation_scale'];saved={k:shell('settings','get',*k.split('/')) for k in keys};size=shell('wm','size');paused=False
try:
 call('install','-r','/private/tmp/android-final-r11-entry-probe/probe.apk');call('reverse','tcp:'+port,'tcp:'+port);call('push',str(fixture),'/data/local/tmp/somewhere-android-ui-7100051.json')
 shell('wm','size','640x1136');shell('settings','put','system','font_scale','2.0')
 for k in keys[1:]:shell('settings','put',*k.split('/'),'0')
 os.kill(pid,signal.SIGSTOP);paused=True
 r=call('shell','am','instrument','-w','-r','-e','mode','launch','-e','talkback','true','-e','label','launch-reduced','-e','outputPrefix','launch-final-r11','-e','fixturePath','/data/local/tmp/somewhere-android-ui-7100051.json','dev.groupplanning.android.authprobe/dev.groupplanning.android.authprobe.AuthProbe')
 (out/'talkback-runtime.log').write_bytes(r)
 if b'error=' in r or b'actualTalkBack=true' not in r:raise RuntimeError('TalkBack launch probe did not pass; inspect retained raw')
 os.kill(pid,signal.SIGCONT);paused=False
 raw=call('exec-out','run-as',pkg,'tar','-C','files/launch-final-r11-launch-reduced','-cf','-','.');p=out/'talkback-actual';p.mkdir(exist_ok=True);archive=out/'talkback-actual.tar';archive.write_bytes(raw)
 with tarfile.open(archive) as t:
  for m in t.getmembers():
   assert not pathlib.PurePosixPath(m.name).is_absolute() and '..' not in pathlib.PurePosixPath(m.name).parts and not m.issym() and not m.islnk()
  t.extractall(p)
 archive.unlink()
finally:
 if paused:os.kill(pid,signal.SIGCONT)
 shell('am','force-stop',pkg)
 for k,v in saved.items():shell('settings','delete',*k.split('/')) if v=='null' else shell('settings','put',*k.split('/'),v)
 override=next((s.split(':',1)[1].strip() for s in size.splitlines() if s.startswith('Override size:')),'reset');shell('wm','size',override)
 call('reverse','--remove','tcp:'+port);shell('rm','-f','/data/local/tmp/somewhere-android-ui-7100051.json')
 (out/'talkback-setup.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalSettings':saved,'originalSize':size,'restoredSettings':{k:shell('settings','get',*k.split('/')) for k in keys},'restoredSize':shell('wm','size'),'device':'emulator-5554'},indent=2))
