import subprocess as sp,json,pathlib,datetime,tarfile,re,hashlib
out=pathlib.Path(__file__).resolve().parent;adb='/Users/misha/Library/Android/sdk/platform-tools/adb';pkg='dev.groupplanning.android.uitesthost'
def call(*args):return sp.check_output([adb,'-s','emulator-5554',*args],stderr=sp.STDOUT)
def shell(*args):return call('shell',*args).decode().strip()
fixture=pathlib.Path('/private/tmp/android-r11-auth-overlay/config.json');config=json.loads(fixture.read_text());port=config['origin'].rsplit(':',1)[-1];remote='/data/local/tmp/somewhere-android-ui-7100061.json'
keys=['system/font_scale','global/animator_duration_scale','global/transition_animation_scale','global/window_animation_scale'];saved={k:shell('settings','get',*k.split('/')) for k in keys};originalSize=shell('wm','size');a11ySaved={k:shell('settings','get','secure',k) for k in ['enabled_accessibility_services','accessibility_enabled']};events=[]
def log(action,**kw):events.append({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'action':action,**kw});(out/'runtime-actions.json').write_text(json.dumps(events,ensure_ascii=False,indent=2));print(action,kw,flush=True)
modes=[('navigation-standard','navigation','720x1600','1.0','1',False),('navigation-small','navigation','640x1136','1.0','1',False),('auth-settled-standard','auth','720x1600','1.0','1',False),('auth-settled-small','auth','640x1136','1.0','1',False),('invitation-settled-success','invitation','720x1600','1.0','1',False),('invitation-settled-success-small','invitation','640x1136','1.0','1',False),('reduced-small','navigation','640x1136','1.0','0',False),('reduced-standard','navigation','720x1600','1.0','0',False),('large-standard','navigation','720x1600','1.8','1',False),('talkback-small','navigation','640x1136','1.8','0',True)]
try:
 call('reverse','tcp:'+port,'tcp:'+port);call('push',str(fixture),remote)
 for label,mode,size,font,motion,talkback in modes:
  shell('am','force-stop',pkg);shell('wm','size',size);shell('settings','put','system','font_scale',font)
  for k in keys[1:]:shell('settings','put',*k.split('/'),motion)
  log('start isolated current exact-primary entry flow',label=label,mode=mode,sizePx=size,fontScale=font,animationScales=motion,talkback=talkback)
  args=['shell','am','instrument','-w','-r','-e','mode',mode,'-e','label',label,'-e','outputPrefix','entry-final-r11','-e','fixturePath',remote]
  if talkback:args+=['-e','talkback','true']
  result=call(*args,'dev.groupplanning.android.authprobe/dev.groupplanning.android.authprobe.AuthProbe');(out/(label+'.log')).write_bytes(result)
  directory='entry-final-r11-'+label;raw=call('exec-out','run-as',pkg,'tar','-C','files/'+directory,'-cf','-','.');archive=out/(label+'.tar');archive.write_bytes(raw);dest=out/'probe-captures/files'/directory;dest.mkdir(parents=True,exist_ok=True)
  with tarfile.open(archive) as t:
   for m in t.getmembers():assert not pathlib.PurePosixPath(m.name).is_absolute() and '..' not in pathlib.PurePosixPath(m.name).parts and not m.issym() and not m.islnk()
   t.extractall(dest)
  archive.unlink();ok=b'INSTRUMENTATION_CODE: -1' in result and b'error=' not in result
  if mode=='auth':
   required=[b'busyEffectiveControlEnabled=false',b'busyButtonBoundsStable=true',b'busySetProgressAccepted=false',b'busyBackRetainsLastPage=true',b'cancelRetainsLastPage=true',b'cancelNoInlineFailure=true',b'successHomeProfileVisible=true',b'requestsAfterRapidNext=[]']
   ok=ok and all(v in result for v in required)
  log('flow finished',label=label,instrumentationResultOk=ok)
  if not ok:log('negative flow preserved; independent remaining flows continue',label=label)
finally:
 shell('am','force-stop',pkg)
 for k,v in saved.items():shell('settings','delete',*k.split('/')) if v=='null' else shell('settings','put',*k.split('/'),v)
 for k,v in a11ySaved.items():shell('settings','delete','secure',k) if v=='null' else shell('settings','put','secure',k,v)
 override=next((s.split(':',1)[1].strip() for s in originalSize.splitlines() if s.startswith('Override size:')),'reset');shell('wm','size',override)
 call('reverse','--remove','tcp:'+port);shell('rm','-f',remote)
 log('cleanup',restoredSettings={k:shell('settings','get',*k.split('/')) for k in keys},restoredSize=shell('wm','size'))
 (out/'runtime-setup.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalSettings':saved,'originalSize':originalSize,'originalAccessibility':a11ySaved,'fixtureConfigSha256':hashlib.sha256(fixture.read_bytes()).hexdigest(),'primaryArtifactSha256':hashlib.sha256(pathlib.Path('/private/tmp/mobile-final-android-r11/app-qa.apk').read_bytes()).hexdigest()},indent=2))
