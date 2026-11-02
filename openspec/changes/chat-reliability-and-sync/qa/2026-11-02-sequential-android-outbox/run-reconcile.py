from pathlib import Path
import subprocess, json, datetime, os, shutil, hashlib
R=Path('/Users/misha/Documents/Codex/projects/group-planning')
E=Path(__file__).parent/'reconcile';E.mkdir(exist_ok=True)
D=E.parent
P=Path('/tmp/somewhere-android-after-commit-20261102');P.mkdir(mode=0o700,exist_ok=True)
ADB='/Users/misha/Library/Android/sdk/platform-tools/adb';PKG='dev.groupplanning.android.uitesthost'
areas={'font_scale':'system','show_ime_with_hard_keyboard':'secure','window_animation_scale':'global','transition_animation_scale':'global','animator_duration_scale':'global'}
def adb(*args,input=None,check=True):
 p=subprocess.run([ADB,'-s','emulator-5554',*args],input=input,capture_output=True,timeout=60)
 if check:assert p.returncode==0,(args,p.stderr.decode())
 return p
def snapshot():return {'settings':{k:adb('shell','settings','get',a,k).stdout.decode().strip()for k,a in areas.items()},'appLocale':adb('shell','cmd','locale','get-app-locales',PKG).stdout.decode().strip(),'reverse':sorted(adb('reverse','--list').stdout.decode().splitlines())}
baseline=snapshot();(E/'full-device-before.json').write_text(json.dumps(baseline,indent=2)+'\n')
for name in ['ui-fixture.json','qa-client-test-namespace']:
 p=adb('exec-out','run-as',PKG,'cat','no_backup/'+name,check=False);(P/name).write_bytes(p.stdout if p.returncode==0 else b'');(P/name).chmod(0o600);(P/(name+'.exists')).write_text(str(p.returncode==0))
output=R/'frontend/android/app/build/outputs/ui';previous=set(output.iterdir())if output.exists()else set()
command=['python3',str(Path(__file__).parent/'stand.py')]
meta={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':command,'sourceHash':'15eb11ff9bb145caba5cdae0a0dee475fad1489d45b83adf383ee3625d8b12a2','mainExpected':0,'separateProcessDeathExpected':2}
(E/'full-start.json').write_text(json.dumps(meta,indent=2)+'\n')
env=os.environ.copy();env.pop('ANDROID_USER_HOME',None);env.pop('ANDROID_SDK_HOME',None);env.update(JAVA_HOME='/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home',ANDROID_HOME='/Users/misha/Library/Android/sdk',ANDROID_SERIAL='emulator-5554')
env.pop('GOFLAGS',None)
result=None
try:
 adb('shell','settings','put','secure','show_ime_with_hard_keyboard','1')
 with(E/'full-command.log').open('wb')as log:result=subprocess.run(command,cwd=R/'frontend/android',env=env,stdout=log,stderr=subprocess.STDOUT,timeout=1800)
finally:
 adb('shell','am','force-stop',PKG)
 for name in ['ui-fixture.json','qa-client-test-namespace']:
  if(P/(name+'.exists')).read_text()=='True':adb('shell','run-as '+PKG+" sh -c 'cat > no_backup/"+name+"'",input=(P/name).read_bytes())
  else:adb('shell','run-as',PKG,'rm','-f','no_backup/'+name)
 for k,v in baseline['settings'].items():
  if v=='null':adb('shell','settings','delete',areas[k],k)
  else:adb('shell','settings','put',areas[k],k,v)
 locales=baseline['appLocale'].split('are [')[-1].rstrip(']');adb('shell','cmd','locale','set-app-locales',PKG,'--locales',locales)
 after=snapshot();(E/'full-device-after.json').write_text(json.dumps(after,indent=2)+'\n');meta['baselineDelta']={k:{'before':baseline[k],'after':after[k]}for k in baseline if baseline[k]!=after[k]}
 new=sorted(set(output.iterdir())-previous)if output.exists()else[]
 for path in new:shutil.copytree(path,E/'full-ui-evidence'/path.name,dirs_exist_ok=True)
 meta.update(finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),exitCode=None if result is None else result.returncode,outputDirectories=[p.name for p in new])
 (E/'full-result.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta),flush=True)
raise SystemExit(0 if result is not None and result.returncode==0 and not meta['baselineDelta']else 1)
