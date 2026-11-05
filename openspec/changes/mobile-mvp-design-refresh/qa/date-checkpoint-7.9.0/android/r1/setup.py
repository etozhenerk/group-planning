import pathlib,json,uuid,ssl,urllib.request,base64,subprocess,hashlib,datetime
from adb_visual import *
c=json.load(open('/private/tmp/date-checkpoint79-r1-config.json'))
ctx=ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(base64.b64decode(c['certificate'])))
def api(path,method='GET',body=None):
 req=urllib.request.Request(c['origin']+'/api/v1/'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+c['cases']['poll-owner']['token'],'Content-Type':'application/json','Idempotency-Key':str(uuid.uuid4()),'X-Somewhere-Test-Scenario':'read-state-device'})
 with urllib.request.urlopen(req,context=ctx) as r:return json.load(r)
m=api('meetings','POST',{'title':'QA date checkpoint','starts_on':(datetime.date.today()+datetime.timedelta(days=7)).isoformat(),'timezone':'Europe/Moscow'})
(OUT/'meeting.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));print('meeting keys',m.keys())
settings=['wm size','wm density','settings get system font_scale','settings get global animator_duration_scale','settings get global transition_animation_scale','settings get global window_animation_scale','settings get system user_rotation','settings get system accelerometer_rotation']
b={q:adb('shell',*q.split()).decode().strip() for q in settings};b['port']=c['origin'].rsplit(':',1)[1];(OUT/'device-before.json').write_text(json.dumps(b,indent=2))
artifact='/private/tmp/meetings-checkpoint-7.5-android-OXlIeU/app-qa.apk';assert hashlib.sha256(pathlib.Path(artifact).read_bytes()).hexdigest()=='e31e69f78630ca854aec59f69858c37b68046335bdc8c31a18b6be4aeac5594a'
adb('reverse','tcp:'+b['port'],'tcp:'+b['port']);adb('install','-r','-t',artifact)
remote='/data/local/tmp/somewhere-android-ui-79971.json';adb('push','/private/tmp/date-checkpoint79-r1-config.json',remote);adb('shell','run-as','dev.groupplanning.android.uitesthost','cp',remote,'no_backup/ui-fixture.json')
marker=pathlib.Path('/private/tmp/date-r1-namespace.txt');marker.write_text('date-r1-'+str(uuid.uuid4()));adb('push',str(marker),'/data/local/tmp/date-r1-namespace.txt');adb('shell','run-as','dev.groupplanning.android.uitesthost','cp','/data/local/tmp/date-r1-namespace.txt','no_backup/qa-client-test-namespace')
print('configured')
