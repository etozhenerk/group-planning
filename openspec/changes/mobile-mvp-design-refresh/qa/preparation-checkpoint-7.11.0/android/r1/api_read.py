import json,ssl,base64,urllib.request
from adb_visual import OUT
c=json.load(open('/private/tmp/preparation-checkpoint711-r1-config.json'))
ctx=ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(base64.b64decode(c['certificate'])))
def read(actor,path):
 req=urllib.request.Request(c['origin']+'/api/v1/'+path,headers={'Authorization':'Bearer '+c['cases'][actor]['token'],'X-Somewhere-Test-Scenario':'read-state-device'})
 with urllib.request.urlopen(req,context=ctx) as r:return json.load(r)
def task(actor,suffix,name):
 mid='d3c70000-0000-4000-8000-'+suffix.zfill(12);feed=read(actor,'meetings/'+mid+'/feed?limit=50');created=[e for e in feed['entries'] if e['kind']=='preparation_task_created'];tid=created[-1]['payload']['task_id'];j=read(actor,'meetings/'+mid+'/preparation-tasks/'+tid);(OUT/(name+'.json')).write_text(json.dumps({'feed':feed,'task':j},ensure_ascii=False,indent=2));return j
