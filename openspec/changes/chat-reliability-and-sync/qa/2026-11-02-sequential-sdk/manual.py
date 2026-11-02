import subprocess,pathlib,json,sys,datetime,urllib.parse,urllib.request,ssl,hashlib,uuid,xml.etree.ElementTree as ET
B=pathlib.Path('/tmp/somewhere-sequential-sdk-20261102');E=pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/chat-reliability-and-sync/qa/2026-11-02-sequential-sdk');ADB='/Users/misha/Library/Android/sdk/platform-tools/adb';PKG='dev.groupplanning.android.uitesthost';log=E/'interactions.jsonl'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def record(action,**data):
 with log.open('a') as f:f.write(json.dumps({'at':now(),'action':action,**data},ensure_ascii=False)+'\n')
def adb(*args,input=None,check=True):
 p=subprocess.run([ADB,'-s','emulator-5554',*args],input=input,capture_output=True,timeout=25)
 if check and p.returncode:raise RuntimeError('ADB failed: '+str(args)+' '+p.stderr.decode())
 return p
mode=sys.argv[1]
if mode=='baseline':
 settings={k:adb('shell','settings','get',area,k).stdout.decode().strip() for area,k in [('system','font_scale'),('secure','show_ime_with_hard_keyboard'),('global','window_animation_scale'),('global','transition_animation_scale'),('global','animator_duration_scale')]}
 data={'at':now(),'settings':settings,'locales':adb('shell','cmd','locale','get-app-locales',PKG).stdout.decode().strip(),'reverse':sorted(adb('reverse','--list').stdout.decode().splitlines()),'wmSize':adb('shell','wm','size').stdout.decode().strip(),'wmDensity':adb('shell','wm','density').stdout.decode().strip(),'model':adb('shell','getprop','ro.product.model').stdout.decode().strip(),'os':adb('shell','getprop','ro.build.version.release').stdout.decode().strip(),'sdk':adb('shell','getprop','ro.build.version.sdk').stdout.decode().strip()}
 (B/'device-before.json').write_text(json.dumps(data,indent=2)+'\n');record('baseline',**data);print(json.dumps(data))
elif mode=='configure':
 conf=(B/'connection.json').read_bytes();c=json.loads(conf);port=urllib.parse.urlsplit(c['origin']).port
 for name in ['ui-fixture.json','qa-client-test-namespace']:
  if (B/('original-'+name+'.exists')).exists():continue
  p=adb('exec-out','run-as',PKG,'cat','no_backup/'+name,check=False);target=B/('original-'+name);target.write_bytes(p.stdout if p.returncode==0 else b'');target.chmod(0o600);(B/('original-'+name+'.exists')).write_text(str(p.returncode==0))
 adb('shell','run-as '+PKG+" sh -c 'cat > no_backup/ui-fixture.json'",input=conf)
 ns=('profile-review-'+uuid.uuid4().hex[:16]).encode();adb('shell','run-as '+PKG+" sh -c 'cat > no_backup/qa-client-test-namespace'",input=ns)
 adb('reverse','tcp:'+str(port),'tcp:'+str(port));(B/'port').write_text(str(port));record('configure',fixtureHash=hashlib.sha256(conf).hexdigest(),port=port,package=PKG)
elif mode=='launch':
 scene=sys.argv[2];assert scene in ['calendar','account','account-large','onboarding','design','profile-fields','invite-rsvp'];adb('shell','am','force-stop',PKG);p=adb('shell','am','start','-W','-n',PKG+'/dev.groupplanning.android.MainActivity','--es','scenario',scene);record('launch',scenario=scene,result=p.stdout.decode());print(p.stdout.decode())
elif mode in ['capture','capture-lite']:
 name=sys.argv[2];assert name.replace('-','').isalnum();p=E/(name+'.png');remote='/data/local/tmp/somewhere-sdk-review.xml';p.write_bytes(adb('exec-out','screencap','-p').stdout);stamp=now();dump=adb('shell','uiautomator','dump',remote,check=False) if mode=='capture' else subprocess.CompletedProcess([],0,b'capture-lite: screenshot only',b'');xml=adb('exec-out','cat',remote,check=False).stdout if mode=='capture' else b'screenshot-only; AX unavailable';adb('shell','rm','-f',remote,check=False);(E/(name+'.xml')).write_bytes(xml)
 try:
  nodes=[{'text':n.get('text'),'desc':n.get('content-desc'),'bounds':n.get('bounds'),'clickable':n.get('clickable')}for n in ET.fromstring(xml).iter('node')if n.get('text')or n.get('content-desc')];xmlValid=True
 except ET.ParseError:
  nodes=[];xmlValid=False
 record('capture',name=name,pngSha=hashlib.sha256(p.read_bytes()).hexdigest(),capturedAt=stamp,xmlValid=xmlValid,dumpStdout=dump.stdout.decode(errors='replace'),fontScale=adb('shell','settings','get','system','font_scale').stdout.decode().strip());print(json.dumps({'nodes':nodes,'xmlValid':xmlValid},ensure_ascii=False))
elif mode in ['taptext','holdtext']:
 import re
 remote='/data/local/tmp/somewhere-current-ui.xml';adb('shell','uiautomator','dump',remote);xml=adb('exec-out','cat',remote).stdout;adb('shell','rm','-f',remote);pattern=sys.argv[2];nodes=[n for n in ET.fromstring(xml).iter('node') if re.search(pattern,n.get('text','')+' '+n.get('content-desc',''))];assert len(nodes)==1,[(n.get('text'),n.get('content-desc'),n.get('bounds')) for n in nodes];n=nodes[0];nums=list(map(int,re.findall(r'\d+',n.get('bounds'))));x=(nums[0]+nums[2])//2;y=(nums[1]+nums[3])//2;adb('shell','input','swipe',str(x),str(y),str(x),str(y),'900') if mode=='holdtext' else adb('shell','input','tap',str(x),str(y));record(mode,pattern=pattern,x=x,y=y)
elif mode=='tap':
 x,y=map(int,sys.argv[2:4]);adb('shell','input','tap',str(x),str(y));record('tap',x=x,y=y)
elif mode=='swipe':
 vals=sys.argv[2:];assert len(vals)==5;adb('shell','input','swipe',*vals);record('swipe',coordinates=vals)
elif mode=='back':adb('shell','input','keyevent','4');record('back')
elif mode=='scale':
 scale=sys.argv[2];assert scale in ['1.0','1.8','2.0'];adb('shell','settings','put','system','font_scale',scale);record('scale',value=scale)
elif mode=='api-fingerprint':
 c=json.loads((B/'connection.json').read_text());creds=c['cases']['calendar'];headers={'Authorization':'Bearer '+creds['token']};res={}
 for route in ['/api/v1/me','/api/v1/meetings']:
  req=urllib.request.Request(c['origin']+route,headers=headers)
  with urllib.request.urlopen(req,context=ssl._create_unverified_context(),timeout=10) as response:body=response.read();res[route]={'status':response.status,'sha256':hashlib.sha256(body).hexdigest()}
 tag=sys.argv[2];(B/('api-'+tag+'.json')).write_text(json.dumps({'at':now(),'responses':res},indent=2)+'\n');record('api-fingerprint',tag=tag,responses=res);print(json.dumps(res))
elif mode=='text':
 value=sys.argv[2];adb('shell','input','text',value.replace(' ','%s'));record('text',value=value)
elif mode=='key':
 keys=sys.argv[2:];adb('shell','input','keyevent',*keys);record('key',keys=keys)
elif mode=='combo':
 keys=sys.argv[2:];adb('shell','input','keycombination',*keys);record('keycombination',keys=keys)
else:raise ValueError(mode)
