#!/usr/bin/env python3
"""Isolated QA preconditions. Never prints config credentials or invitation capabilities."""
import base64, datetime, hashlib, json, pathlib, ssl, sys, urllib.request, uuid
config = json.loads(pathlib.Path(sys.argv[1]).read_text())
output = pathlib.Path(sys.argv[2])
origin = config['origin']
assert origin.startswith('https://127.0.0.1:')
context = ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(base64.b64decode(config['certificate'])))
def request(path, method='GET', body=None, data=None):
    headers = {'Authorization': 'Bearer ' + config['cases']['design']['token'], 'X-Somewhere-Test-Scenario': 'chat-counterpart'}
    if body is not None:
        data = json.dumps(body).encode(); headers['Content-Type'] = 'application/json'
    if data is not None:
        headers['Idempotency-Key'] = str(uuid.uuid4())
        if body is None: headers['Content-Type'] = 'image/png'
    req = urllib.request.Request(origin + '/api/v1/' + path, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, context=context, timeout=20) as response:
        return json.load(response)
day = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).date().isoformat()
ids = {}
for name in ['empty', 'single']:
    receipt = request('meetings', 'POST', {'title':'QA vibe ' + name, 'starts_on':day, 'starts_at':None, 'timezone':'Europe/Moscow'})
    ids[name] = receipt['meeting']['id']
photo = pathlib.Path('openspec/changes/mobile-mvp-design-refresh/assets/vibe-r3/boardgame.png').read_bytes()
key = str(uuid.uuid4()); root = 'meetings/' + ids['single']
prepared = request(root + '/media/uploads', 'POST', {'client_request_id':key,'file_name':'qa-vibe-single.png','content_type':'image/png','size_bytes':len(photo),'purpose':'memory'})['media']
request(root + '/media/' + prepared['id'] + '/content', 'PUT', data=photo)
request(root + '/media/' + prepared['id'] + '/publish', 'POST', {})
counts = {name:len(request('meetings/' + mid + '/memories')['photos']) for name,mid in ids.items()}
assert counts == {'empty':0, 'single':1}
ids['multiple'] = 'deb00000-0000-4000-8000-000000000004'
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({'meetings':ids,'counts':counts,'singlePhotoSHA256':hashlib.sha256(photo).hexdigest(),'note':'real API QA preconditions; capabilities omitted'},indent=2)+'\n')
print('Own empty/single albums prepared: counts0/1')
