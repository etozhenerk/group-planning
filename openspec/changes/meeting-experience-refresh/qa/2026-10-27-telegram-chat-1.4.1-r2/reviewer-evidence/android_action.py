import subprocess,pathlib,json,datetime,sys
root=pathlib.Path(__file__).resolve().parent;adb='/Users/misha/Library/Android/sdk/platform-tools/adb'
step,before,reason=sys.argv[1:4];args=sys.argv[4:];assert args[0] in ['tap','keyevent','text','swipe']
xml=(root/'android'/before/'hierarchy.xml');assert xml.exists()
r=subprocess.run([adb,'-s','emulator-5554','shell','dumpsys','activity','activities'],capture_output=True,text=True,check=True)
foreground='\n'.join(l for l in r.stdout.splitlines() if 'topResumedActivity' in l or 'mResumedActivity' in l);assert 'dev.groupplanning.android.uitesthost' in foreground,foreground
record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'step':step,'before':before,'reason':reason,'foreground':foreground,'command':[adb,'-s','emulator-5554','shell','input',*args]}
r=subprocess.run(record['command'],capture_output=True,text=True);record.update({'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr})
with (root/'android/interactions.jsonl').open('a') as f:f.write(json.dumps(record,ensure_ascii=False)+'\n')
if r.returncode:raise SystemExit(r.returncode)
subprocess.run([sys.executable,str(root/'android_capture.py'),step],check=True)
