import json, pathlib, ssl, urllib.request, urllib.error, uuid, time, hashlib, zipfile, io, datetime, zlib, struct, os, sys, tempfile
ROOT=pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning')
E=ROOT/'openspec/changes/vibe-album-download/qa/2026-11-01-backend-independent'
C=json.loads(pathlib.Path('/private/tmp/somewhere-sdd-vibe-backend-independent/connection.json').read_text())
URL=C['url']; BASE='/api/v1/meetings/'+C['meeting_id']; EXPORTS=BASE+'/memories/exports'
assert URL.startswith('https://127.0.0.1:')
ctx=ssl._create_unverified_context()
log=[]
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(): (E/'http-interactions.json').write_text(json.dumps(log,ensure_ascii=False,indent=2))
def record(kind,**kw):log.append(dict(time=now(),kind=kind,**kw));save()
def req(method,path,role='owner',data=None,key=None,expected=None,csrf=True,headers=None):
    assert path.startswith('/')
    h={};payload=None
    if role:
        h['Cookie']=C['cookie_name']+'='+C[role]['session']
        if method not in ('GET','HEAD'):
            h['Origin']=URL
            if csrf:h['X-CSRF-Token']=C[role]['csrf']
    if data is not None:
        payload=data if isinstance(data,bytes) else json.dumps(data).encode()
        h['Content-Type']='application/octet-stream' if isinstance(data,bytes) else 'application/json'
    if key:h['Idempotency-Key']=key
    if headers:h.update(headers)
    request=urllib.request.Request(URL+path,data=payload,headers=h,method=method)
    try:res=urllib.request.urlopen(request,context=ctx,timeout=20)
    except urllib.error.HTTPError as e:res=e
    body=res.read();status=res.status;rh=dict(res.headers);res.close()
    try:value=json.loads(body)
    except (ValueError,UnicodeDecodeError):value=None
    # Only response headers with no credentials; never store cookies/CSRF.
    safeh={k:v for k,v in rh.items() if k.lower() in ('content-type','content-length','content-disposition','cache-control','retry-after','accept-ranges','x-content-type-options','content-security-policy')}
    response=value if value is not None else {'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()}
    record('http',method=method,path=path,role=role or 'anonymous',request_json=data if isinstance(data,(dict,list)) else None,status=status,response=response,headers=safeh)
    if expected is not None:assert status in ([expected] if isinstance(expected,int) else expected),(method,path,status,response,expected)
    return status,value,body,rh

def ctl(**data):return req('POST','/qa/control',role=None,data=data,expected=204)
def start(role='owner',key=None):return req('POST',EXPORTS,role,{},key or str(uuid.uuid4()),202)[1]
def state(job,role='owner',expected=200):return req('GET',EXPORTS+'/'+job['id'],role,expected=expected)[1]
def cancel(job,role='owner'):return req('DELETE',EXPORTS+'/'+job['id'],role,expected=204)
def ready(job,role='owner'):
    for _ in range(100):
        s=state(job,role)
        if s['state']=='ready':return s
        assert s['state']=='preparing',s
        time.sleep(.05)
    raise AssertionError('ready timeout')
def png(w,h,random=False):
    raw=os.urandom(w*h*3) if random else bytes([255,10,50])*(w*h)
    scan=b''.join(b'\0'+raw[y*w*3:(y+1)*w*3] for y in range(h))
    def ch(k,b):return struct.pack('!I',len(b))+k+b+struct.pack('!I',zlib.crc32(k+b)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('!2I5B',w,h,8,2,0,0,0))+ch(b'IDAT',zlib.compress(scan))+ch(b'IEND',b'')
def upload(data,name='portrait.png',publish=True,purpose='memory'):
    key=str(uuid.uuid4())
    m=req('POST',BASE+'/media/uploads',data={'client_request_id':key,'file_name':name,'content_type':'image/png','size_bytes':len(data),'purpose':purpose},key=key,expected=201)[1]['media']
    req('PUT',BASE+'/media/'+m['id']+'/content',data=data,headers={'Content-Type':'image/png'},expected=200)
    if publish:req('POST',BASE+'/media/'+m['id']+'/publish',data={},key=str(uuid.uuid4()),expected=200)
    return m

def zipcheck(job,expected_hashes,role='owner',filename='archive.zip'):
    status,_,body,h=req('GET',EXPORTS+'/'+job['id']+'/download',role,expected=200)
    assert h['Content-Type']=='application/zip' and h['Cache-Control']=='no-store'
    assert int(h['Content-Length'])==len(body) and h['Content-Disposition'].startswith('attachment;')
    a=zipfile.ZipFile(io.BytesIO(body)); assert a.testzip() is None
    names=a.namelist();assert len(names)==len(expected_hashes) and len(set(names))==len(names)
    assert all('/' not in n and '\\' not in n and not n.startswith('.') and not any(ord(c)<32 for c in n) for n in names)
    actual=[hashlib.sha256(a.read(n)).hexdigest() for n in names]
    assert sorted(actual)==sorted(expected_hashes.values()),'ZIP bytes mismatch'
    record('zip',file=filename,entries=len(names),archive_sha256=hashlib.sha256(body).hexdigest(),bytes=len(body),crc='all passed',member_names=names,member_sha256=actual,byte_preservation='exact SHA256 multiset matches server-original bytes')
    (E/filename).write_bytes(body)
    return body

def disk(job,label):
    matches=list(pathlib.Path(tempfile.gettempdir()).glob('somewhere-album-*/'+job['id']+'.zip'))
    record('disk',label=label,files=[{'directory_mode':oct(p.parent.stat().st_mode&511),'file_mode':oct(p.stat().st_mode&511),'bytes':p.stat().st_size} for p in matches])
    return matches

record('begin',scope='backend only',source_sha256='7620253e80b933d319dae31af81fa07ab9e539a79f8997d4169249635f5e9b73',test_accounts='owner, guest, other; synthetic fixture')
page=req('GET',BASE+'/memories?limit=100',expected=200)[1]
assert len(page['photos'])==100 and page['next_cursor']
snap=req('GET',BASE+'/memories/snapshot',expected=200)[1]
assert len(snap['photos'])==103 and snap['next_cursor'] is None
assert {p['id'] for p in snap['photos']}==set(C['photo_sha256'])
req('GET',BASE+'/memories/snapshot',role=None,expected=401)
req('GET',BASE+'/memories/snapshot?limit=1',expected=400)
req('POST',EXPORTS,data={},key=str(uuid.uuid4()),csrf=False,expected=403)
req('POST',EXPORTS,data={'unexpected':True},key=str(uuid.uuid4()),expected=400)
ctl(paused=True)
key=str(uuid.uuid4());a=start(key=key);assert a['state']=='preparing' and a['count']==103
assert start(key=key)['id']==a['id']
req('POST',EXPORTS,data={},key=str(uuid.uuid4()),expected=429)
req('GET',EXPORTS+'/'+a['id']+'/download',expected=409)
b=start('guest');assert b['state']=='preparing'
req('POST',EXPORTS,'other',{},str(uuid.uuid4()),429)
for method,suffix in [('GET',''),('GET','/download'),('DELETE','')]:req(method,EXPORTS+'/'+a['id']+suffix,'guest',expected=404)
req('GET',EXPORTS+'/'+a['id']+'/download',None,expected=401)
cancel(b,'guest');state(b,'guest',404)
late=upload(png(17,9));pending=upload(png(7,11),publish=False)
snap2=req('GET',BASE+'/memories/snapshot',expected=200)[1]
assert len(snap2['photos'])==104 and late['id'] in [p['id'] for p in snap2['photos']] and pending['id'] not in [p['id'] for p in snap2['photos']]
ctl(paused=False);ready(a);paths=disk(a,'ready')
assert len(paths)==1 and paths[0].stat().st_mode&511==0o600 and paths[0].parent.stat().st_mode&511==0o700
zipcheck(a,C['photo_sha256'],filename='frozen-103.zip');state(a,expected=404);assert not paths[0].exists()
req('GET',EXPORTS+'/'+a['id']+'/download',expected=404)
latebytes=req('GET',BASE+'/media/'+late['id']+'/content',expected=200)[2]
hashes=dict(C['photo_sha256']);hashes[late['id']]=hashlib.sha256(latebytes).hexdigest()
a=start();ready(a);zipcheck(a,hashes,filename='next-104.zip')
ctl(paused=True);a=start();cancel(a);state(a,expected=404);req('GET',EXPORTS+'/'+a['id']+'/download',expected=404)
ctl(paused=False);a=start();ready(a);cancel(a);req('GET',EXPORTS+'/'+a['id']+'/download',expected=404)
# Revocation while source bytes are blocked.
ctl(paused=True);b=start('guest')
req('PUT',BASE+'/rsvp','guest',{'answer':'not_going','expected_revision':'1'},str(uuid.uuid4()),200)
req('GET',EXPORTS+'/'+b['id']+'/download','guest',expected=[403,404]);ctl(paused=False);time.sleep(1.2)
req('POST',EXPORTS,'guest',{},str(uuid.uuid4()),403);req('GET',BASE+'/memories/snapshot','guest',expected=403)
record('phase1-complete',status='passed',checks='frozen snapshot and ZIP; limits; cancellation; revoke preparing')
print('phase1 passed',len(log))
