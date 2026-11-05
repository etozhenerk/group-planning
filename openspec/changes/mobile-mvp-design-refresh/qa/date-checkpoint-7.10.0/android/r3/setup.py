import pathlib,json,uuid,ssl,urllib.request,base64,subprocess,hashlib,datetime
from adb_visual import *
c=json.load(open('/private/tmp/date-checkpoint710-r3-config.json'))
ctx=ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(base64.b64decode(c['certificate'])))
def api(path,method='GET',body=None):
 req=urllib.request.Request(c['origin']+'/api/v1/'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+c['cases']['poll-owner']['token'],'Content-Type':'application/json','Idempotency-Key':str(uuid.uuid4()),'X-Somewhere-Test-Scenario':'read-state-device'})
 with urllib.request.urlopen(req,context=ctx) as r:return json.load(r)
m=api('meetings','POST',{'title':'QA date checkpoint','starts_on':(datetime.date.today()+datetime.timedelta(days=7)).isoformat(),'timezone':'Europe/Moscow'})
(OUT/'meeting.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));print('meeting keys',m.keys())
settings=['wm size','wm density','settings get system font_scale','settings get global animator_duration_scale','settings get global transition_animation_scale','settings get global window_animation_scale','settings get system user_rotation','settings get system accelerometer_rotation']
b={q:adb('shell',*q.split()).decode().strip() for q in settings};b['port']=c['origin'].rsplit(':',1)[1];(OUT/'device-before.json').write_text(json.dumps(b,indent=2))
artifact='/private/tmp/meetings-checkpoint-7.5-android-4rXhia/app-qa.apk';assert hashlib.sha256(pathlib.Path(artifact).read_bytes()).hexdigest()=='20aaa0e35c98c47cd76d3eb72891e3c6021dc2abde9f8ffcd3d61a0196dc2f64'
adb('reverse','tcp:'+b['port'],'tcp:'+b['port']);adb('install','-r','-t',artifact)
remote='/data/local/tmp/somewhere-android-ui-710973.json';adb('push','/private/tmp/date-checkpoint710-r3-config.json',remote);adb('shell','run-as','dev.groupplanning.android.uitesthost','cp',remote,'no_backup/ui-fixture.json')
marker=pathlib.Path('/private/tmp/date-r3-namespace.txt');marker.write_text('date-r3-'+str(uuid.uuid4()));adb('push',str(marker),'/data/local/tmp/date-r3-namespace.txt');adb('shell','run-as','dev.groupplanning.android.uitesthost','cp','/data/local/tmp/date-r3-namespace.txt','no_backup/qa-client-test-namespace')
print('configured')

poll=api('meetings/'+m['meeting']['id']+'/date-polls','POST',{'dates':[(datetime.date.today()+datetime.timedelta(days=n)).isoformat() for n in [7,8]],'closes_at':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat().replace('+00:00','Z'),'settings':{'multiple_answers':True,'allow_revoting':True,'allow_new_options':True,'anonymous':False,'hide_results':False}})
(OUT/'seed-poll.json').write_text(json.dumps(poll,ensure_ascii=False,indent=2))
adb('shell','am','start','-S','-f','0x10008000','-n','dev.groupplanning.android.uitesthost/dev.groupplanning.android.MainActivity','--es','scenario','poll-owner','-d','group-planning-android-qa://i/'+m['invitation_url'].rsplit('/',1)[1])
