import sys,json,pathlib,urllib.request,urllib.parse,ssl,uuid
mode,origin=sys.argv[1:3]
u=urllib.parse.urlsplit(origin)
assert u.scheme=='https' and u.hostname=='127.0.0.1' and u.port and u.path in ('','/')
root=pathlib.Path('/tmp/somewhere-sdd-epoch-overlay')
if mode=='epoch':
 meeting,old,new=sys.argv[3:6];path='/__test/chat-epoch';payload={'meeting_id':meeting,'expected_epoch':old,'next_epoch':new}
elif mode=='expiry':path='/__test/identity-clock';payload={'advance_seconds':7200}
else:raise ValueError('mode')
req=urllib.request.Request(origin+path,data=json.dumps(payload).encode(),method='POST',headers={'Content-Type':'application/json','X-Somewhere-QA-Epoch-Control':(root/'control-token').read_text()})
with urllib.request.urlopen(req,context=ssl._create_unverified_context(),timeout=10) as response:
 assert response.status==200;result=json.load(response)
p=root/('control-'+str(uuid.uuid4())+'.json');p.write_text(json.dumps({'action':mode,'request':payload,'result':result},indent=2)+'\n');p.chmod(0o600)
print(json.dumps({'status':200,'action':mode}))
