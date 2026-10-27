import subprocess,pathlib,json,datetime,xml.etree.ElementTree as ET,sys,hashlib
adb='/Users/misha/Library/Android/sdk/platform-tools/adb'
root=pathlib.Path(__file__).resolve().parent/'android'
name=sys.argv[1];out=root/name;out.mkdir(exist_ok=False)
def run(args,binary=False):
 r=subprocess.run([adb,'-s','emulator-5554',*args],capture_output=True,check=True);return r.stdout if binary else r.stdout.decode()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
record={'startedAt':now(),'serial':'emulator-5554','capture':name,'mode':'live manual observation','inputHash':'7281d60a82c41d4dc7fdb8f0427df0771649e255caf7e94ccfc351a8b3da2671'}
avd=run(['emu','avd','name']);assert 'Somewhere_API_36' in avd
foreground='\n'.join(l for l in run(['shell','dumpsys','activity','activities']).splitlines() if 'topResumedActivity' in l or 'mResumedActivity' in l)
assert 'dev.groupplanning.android.uitesthost' in foreground,foreground
record['foreground']=foreground
run(['shell','uiautomator','dump','/data/local/tmp/reviewer-r2-window.xml'])
xml=run(['exec-out','cat','/data/local/tmp/reviewer-r2-window.xml'],True);(out/'hierarchy.xml').write_bytes(xml)
png=run(['exec-out','screencap','-p'],True);(out/'screen.png').write_bytes(png)
record['finishedAt']=now();record['screenshotSha256']=hashlib.sha256(png).hexdigest();record['hierarchySha256']=hashlib.sha256(xml).hexdigest();(out/'capture.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
print(json.dumps(record,ensure_ascii=False))
for n in ET.fromstring(xml).iter('node'):
 a=n.attrib
 if a.get('text') or a.get('content-desc') or a.get('class') in ['android.widget.EditText']:
  print(a.get('class','').split('.')[-1]+' '+a.get('text','')+' | '+a.get('content-desc','')+' '+a.get('bounds','')+' focused='+a.get('focused',''))
