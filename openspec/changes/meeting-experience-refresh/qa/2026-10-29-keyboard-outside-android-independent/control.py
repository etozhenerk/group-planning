import subprocess, pathlib, datetime, json, sys, time, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parent
ADB=['adb','-s','emulator-5554']
def adb(*a):
    return subprocess.run(ADB+list(a),check=True,capture_output=True).stdout
op=sys.argv[1]
args=sys.argv[2:]
if op=='tap': adb('shell','input','tap',*args)
elif op=='swipe': adb('shell','input','swipe',*args)
elif op=='text': adb('shell','input','text',*args)
elif op=='combo': adb('shell','input','keycombination',*args)
elif op=='slow':
    for c in args[0]:
        if c=='\n': adb('shell','input','keyevent','66')
        else: adb('shell','input','text','%s' if c==' ' else c)
        time.sleep(0.08)
elif op=='key': adb('shell','input','keyevent',*args)
elif op=='snap':
    name=args[0]
    adb('shell','uiautomator','dump','/sdcard/keyboard-review.xml')
    (ROOT/'actual'/f'{name}.png').write_bytes(adb('exec-out','screencap','-p'))
    xml=adb('shell','cat','/sdcard/keyboard-review.xml')
    (ROOT/'actual'/f'{name}.xml').write_bytes(xml)
    ime=adb('shell','dumpsys','input_method').decode()
    focus='\n'.join(x.strip() for x in ime.splitlines() if any(y in x for y in ['mInputShown=','mServedInputConnection=','mImeWindowVis=','mCurFocusedWindow=']))
    (ROOT/'actual'/f'{name}-ime.txt').write_text(focus+'\n')
    print(focus)
    for e in ET.fromstring(xml).iter('node'):
        a=e.attrib
        if a.get('text') or a.get('content-desc') or a.get('class')=='android.widget.EditText':
            print(json.dumps({k:a.get(k) for k in ['text','content-desc','class','bounds','focused','selected','clickable','long-clickable']},ensure_ascii=False))
else: raise ValueError(op)
with (ROOT/'actions.jsonl').open('a') as f:
    f.write(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'op':op,'args':args},ensure_ascii=False)+'\n')
