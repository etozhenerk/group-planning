import pathlib,json,uuid,ssl,urllib.request,base64,subprocess,hashlib,datetime
from adb_visual import *
c=json.load(open('/private/tmp/preparation-checkpoint711-r1-config.json'))
ctx=ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(base64.b64decode(c['certificate'])))
def api(path,method='GET',body=None):
 req=urllib.request.Request(c['origin']+'/api/v1/'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+c['cases']['task-owner']['token'],'Content-Type':'application/json','Idempotency-Key':str(uuid.uuid4()),'X-Somewhere-Test-Scenario':'read-state-device'})
 with urllib.request.urlopen(req,context=ctx) as r:return json.load(r)
token=base64.urlsafe_b64encode(f'{7100:016}'.encode()).decode().rstrip('=')
m={'meeting':{'id':'d3c70000-0000-4000-8000-000000000100'},'invitation_url':c['origin']+'/i/'+token}
(OUT/'meeting.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));print('meeting keys',m.keys())
settings=['wm size','wm density','settings get system font_scale','settings get global animator_duration_scale','settings get global transition_animation_scale','settings get global window_animation_scale','settings get system user_rotation','settings get system accelerometer_rotation']
b={q:adb('shell',*q.split()).decode().strip() for q in settings};b['port']=c['origin'].rsplit(':',1)[1];(OUT/'device-before.json').write_text(json.dumps(b,indent=2))
artifact='/private/tmp/meetings-checkpoint-7.5-android-U41s5e/app-qa.apk';assert hashlib.sha256(pathlib.Path(artifact).read_bytes()).hexdigest()=='86ec04d1e41267161c87f1b520145721360c51aa7d2a732891f292988964d336'
adb('reverse','tcp:'+b['port'],'tcp:'+b['port']);adb('install','-r','-t',artifact)
remote='/data/local/tmp/somewhere-android-ui-711831.json';adb('push','/private/tmp/preparation-checkpoint711-r1-config.json',remote);adb('shell','run-as','dev.groupplanning.android.uitesthost','cp',remote,'no_backup/ui-fixture.json')
marker=pathlib.Path('/private/tmp/preparation-r1-namespace.txt');marker.write_text('preparation-r1-'+str(uuid.uuid4()));adb('push',str(marker),'/data/local/tmp/preparation-r1-namespace.txt');adb('shell','run-as','dev.groupplanning.android.uitesthost','cp','/data/local/tmp/preparation-r1-namespace.txt','no_backup/qa-client-test-namespace')
print('configured')

adb('shell','am','start','-S','-f','0x10008000','-n','dev.groupplanning.android.uitesthost/dev.groupplanning.android.MainActivity','--es','scenario','task-owner','-d','group-planning-android-qa://i/'+token)
