from pathlib import Path
import subprocess,json,datetime
B=Path('/tmp/somewhere-sequential-sdk-20261102');E=Path(__file__).parent;ADB='/Users/misha/Library/Android/sdk/platform-tools/adb';PKG='dev.groupplanning.android.uitesthost'
def adb(*args,input=None):
 p=subprocess.run([ADB,'-s','emulator-5554',*args],input=input,capture_output=True,timeout=40);assert p.returncode==0,(args,p.stderr.decode());return p.stdout.decode().strip()
before=json.loads((B/'device-before.json').read_text());adb('shell','am','force-stop',PKG)
for name in ['ui-fixture.json','qa-client-test-namespace']:
 if(B/('original-'+name+'.exists')).read_text()=='True':adb('shell','run-as '+PKG+" sh -c 'cat > no_backup/"+name+"'",input=(B/('original-'+name)).read_bytes())
 else:adb('shell','run-as',PKG,'rm','-f','no_backup/'+name)
port=(B/'port').read_text()
if not any(('tcp:'+port)in x.split()[1:2]for x in before['reverse']):adb('reverse','--remove','tcp:'+port)
areas={'font_scale':'system','show_ime_with_hard_keyboard':'secure','window_animation_scale':'global','transition_animation_scale':'global','animator_duration_scale':'global'}
for k,v in before['settings'].items():
 if v=='null':adb('shell','settings','delete',areas[k],k)
 else:adb('shell','settings','put',areas[k],k,v)
adb('shell','cmd','locale','set-app-locales',PKG,'--locales',before['locales'].split('are [')[-1].rstrip(']'))
after={'settings':{k:adb('shell','settings','get',v,k)for k,v in areas.items()},'locales':adb('shell','cmd','locale','get-app-locales',PKG),'reverse':sorted(subprocess.run([ADB,'-s','emulator-5554','reverse','--list'],capture_output=True,check=True).stdout.decode().splitlines())};delta={k:{'before':before[k],'after':after[k]}for k in after if before[k]!=after[k]};(E/'cleanup.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'after':after,'baselineDelta':delta,'qaConfigAndNamespaceRestored':True,'qaAppForceStopped':True},indent=2)+'\n');print({'baselineDelta':delta});assert not delta
