import pathlib,json,uuid,ssl,urllib.request,base64,subprocess,hashlib,datetime
from adb_visual import *
c=json.load(open('/private/tmp/place-checkpoint710-r2-config.json'))
ctx=ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(base64.b64decode(c['certificate'])))
def api(path,method='GET',body=None):
 req=urllib.request.Request(c['origin']+'/api/v1/'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+c['cases']['place-owner']['token'],'Content-Type':'application/json','Idempotency-Key':str(uuid.uuid4()),'X-Somewhere-Test-Scenario':'read-state-device'})
 with urllib.request.urlopen(req,context=ctx) as r:return json.load(r)
m=api('meetings','POST',{'title':'QA place checkpoint','starts_on':(datetime.date.today()+datetime.timedelta(days=7)).isoformat(),'timezone':'Europe/Moscow','place':'Original venue'})
(OUT/'meeting.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));print('meeting keys',m.keys())
settings=['wm size','wm density','settings get system font_scale','settings get global animator_duration_scale','settings get global transition_animation_scale','settings get global window_animation_scale','settings get system user_rotation','settings get system accelerometer_rotation']
b={q:adb('shell',*q.split()).decode().strip() for q in settings};b['port']=c['origin'].rsplit(':',1)[1];(OUT/'device-before.json').write_text(json.dumps(b,indent=2))
artifact='/private/tmp/meetings-checkpoint-7.5-android-cMZYzI/app-qa.apk';assert hashlib.sha256(pathlib.Path(artifact).read_bytes()).hexdigest()=='28d6fc5d1eb451385d924fdf304ba2cd2c7371c3e9e9b196aa67911d19bebbfa'
adb('reverse','tcp:'+b['port'],'tcp:'+b['port']);adb('install','-r','-t',artifact)
remote='/data/local/tmp/somewhere-android-ui-710782.json';adb('push','/private/tmp/place-checkpoint710-r2-config.json',remote);adb('shell','run-as','dev.groupplanning.android.uitesthost','cp',remote,'no_backup/ui-fixture.json')
marker=pathlib.Path('/private/tmp/place-r2-namespace.txt');marker.write_text('place-r2-'+str(uuid.uuid4()));adb('push',str(marker),'/data/local/tmp/place-r2-namespace.txt');adb('shell','run-as','dev.groupplanning.android.uitesthost','cp','/data/local/tmp/place-r2-namespace.txt','no_backup/qa-client-test-namespace')
print('configured')

poll=api('meetings/'+m['meeting']['id']+'/place-polls','POST',{'place':'New venue','explanation':'Quiet room for everyone','closes_at':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat().replace('+00:00','Z')})
selected=api('meetings/'+m['meeting']['id']+'/place-polls/'+poll['id']+'/vote','PUT',{'answer':'for','expected_revision':poll['my_vote_revision']})
(OUT/'seed-selected.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2))
adb('shell','am','start','-S','-f','0x10008000','-n','dev.groupplanning.android.uitesthost/dev.groupplanning.android.MainActivity','--es','scenario','place-owner','-d','group-planning-android-qa://i/'+m['invitation_url'].rsplit('/',1)[1])
