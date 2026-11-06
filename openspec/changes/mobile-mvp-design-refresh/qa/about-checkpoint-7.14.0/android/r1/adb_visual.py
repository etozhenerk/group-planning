import subprocess, pathlib, xml.etree.ElementTree as ET, re, json, datetime
OUT=pathlib.Path(__file__).parent
BASE=['/Users/misha/Library/Android/sdk/platform-tools/adb','-s','emulator-5554']
def adb(*args):return subprocess.check_output(BASE+list(args))
def state(name):
 adb('shell','uiautomator','dump','/data/local/tmp/vibe-r1.xml')
 raw=adb('exec-out','cat','/data/local/tmp/vibe-r1.xml');(OUT/(name+'.xml')).write_bytes(raw)
 return ET.fromstring(raw)
def items(root):
 return [{'text':n.get('text'),'description':n.get('content-desc'),'class':n.get('class'),'bounds':n.get('bounds')} for n in root.iter('node') if n.get('text') or n.get('content-desc')]
def tap(node):
 x1,y1,x2,y2=map(int,re.findall(r'\d+',node.get('bounds')));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
def screenshot(name):
 (OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
def record(action):
 p=OUT/'actions.json';j=json.loads(p.read_text()) if p.exists() else [];j.append({'action':action,'at':datetime.datetime.now(datetime.timezone.utc).isoformat()});p.write_text(json.dumps(j,ensure_ascii=False,indent=2))
if __name__=='__main__':print(json.dumps(items(state('home')),ensure_ascii=False))
