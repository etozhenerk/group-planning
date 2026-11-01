from common import *
from PIL import Image,ImageOps
import http.client,socket
# Idle expiry with no intervening product request.
a=start();r=ready(a);paths=disk(a,'idle ready before expiry');temp_root=paths[0].parent
ctl(advance_seconds=601);time.sleep(1.3)
assert not paths[0].exists(),'idle expiry did not delete file'
state(a,expected=404);req('GET',EXPORTS+'/'+a['id']+'/download',expected=404)
record('idle-expiry',status='passed',files_remaining=len(list(temp_root.iterdir())))
# Exclude message media and retain normalized orientation/quality.
msg=upload(png(19,7),name='chat-only.png',purpose='message')
original=Image.new('RGB',(60,30),(20,30,240))
for x in range(30):
    for y in range(30):original.putpixel((x,y),(240,20,30))
exif=Image.Exif();exif[274]=6
buffer=io.BytesIO();original.save(buffer,'JPEG',quality=95,exif=exif);data=buffer.getvalue();key=str(uuid.uuid4())
m=req('POST',BASE+'/media/uploads',data={'client_request_id':key,'file_name':'portrait:*?<>|.jpg','content_type':'image/jpeg','size_bytes':len(data),'purpose':'memory'},key=key,expected=201)[1]['media']
req('PUT',BASE+'/media/'+m['id']+'/content',data=data,headers={'Content-Type':'image/jpeg'},expected=200)
req('POST',BASE+'/media/'+m['id']+'/publish',data={},key=str(uuid.uuid4()),expected=200)
snap=req('GET',BASE+'/memories/snapshot',expected=200)[1]
assert len(snap['photos'])==105 and msg['id'] not in [p['id'] for p in snap['photos']]
server_jpeg=req('GET',BASE+'/media/'+m['id']+'/content',expected=200)[2]
img=Image.open(io.BytesIO(server_jpeg));assert img.size==(30,60)
assert img.getpixel((15,10))[0]>200 and img.getpixel((15,50))[2]>200
hashes={p['id']:C['photo_sha256'].get(p['id']) for p in snap['photos']}
for p in snap['photos']:
    if hashes[p['id']] is None:hashes[p['id']]=hashlib.sha256(req('GET',p['download_url'],expected=200)[2]).hexdigest()
a=start();ready(a);zipcheck(a,hashes,filename='oriented-105.zip')
record('orientation',input_dimensions=[60,30],input_exif_orientation=6,server_dimensions=list(img.size),pixel_top='red',pixel_bottom='blue',export_byte_preservation='exact',message_media_excluded=True)
# Range is not a resume API: response is a whole archive and consumes lease.
a=start();ready(a);status,_,body,h=req('GET',EXPORTS+'/'+a['id']+'/download',headers={'Range':'bytes=0-0'},expected=200)
assert len(body)>1 and int(h['Content-Length'])==len(body) and len(zipfile.ZipFile(io.BytesIO(body)).infolist())==105
state(a,expected=404)
# Source image creates an archive larger than local socket buffers.
big=upload(png(2048,1024,random=True),name='large.png')
record('large-fixture',source_dimensions=[2048,1024],declared_bytes=big['size_bytes'])

def slow(job,role,cause,action):
    ready(job,role);paths=disk(job,'active '+cause)
    hostport=URL.removeprefix('https://')
    conn=http.client.HTTPSConnection(hostport,context=ctx,timeout=12)
    conn.connect();conn.sock.setsockopt(socket.SOL_SOCKET,socket.SO_RCVBUF,1024)
    conn.request('GET',EXPORTS+'/'+job['id']+'/download',headers={'Cookie':C['cookie_name']+'='+C[role]['session']})
    response=conn.getresponse();assert response.status==200
    total=int(response.getheader('Content-Length'));assert total>6000000
    first=response.read(1);assert first
    req('GET',EXPORTS+'/'+job['id']+'/download',role,expected=404)
    action()
    time.sleep(1.3)
    read=len(first);err=None
    try:
        while True:
            chunk=response.read(65536)
            if not chunk:break
            read+=len(chunk)
    except Exception as e:err=type(e).__name__
    conn.close()
    record('active-transfer',cause=cause,status=response.status,content_length=total,received_bytes=read,error=err,archive_truncated=read<total,temp_removed=not paths[0].exists())
    assert read<total,'revoked transfer completed';assert not paths[0].exists(),'revoked file retained'

slow(start(),'owner','cancel',lambda: cancel_current()) if False else None
a=start();slow(a,'owner','cancel',lambda:cancel(a));state(a,expected=404)
a=start();slow(a,'owner','TTL',lambda:ctl(advance_seconds=601));state(a,expected=404)
b=start('other');slow(b,'other','membership',lambda:req('PUT',BASE+'/rsvp','other',{'answer':'not_going','expected_revision':'1'},str(uuid.uuid4()),200))
req('POST',EXPORTS,'other',{},str(uuid.uuid4()),403)
a=start();slow(a,'owner','logout',lambda:req('POST','/api/v1/auth/logout','owner',expected=204))
req('GET',EXPORTS+'/'+a['id']+'/download','owner',expected=401)
record('phase2-complete',status='passed',checks='idle TTL; EXIF orientation exact bytes; message exclusion; Range returns whole ZIP; active transfer cancel/TTL/membership/logout; duplicate download rejected; temp cleanup')
(E/'fixture-temp-root.txt').write_text(str(temp_root)+'\n')
ctl(stop=True)
time.sleep(.7)
record('cleanup',connection_file_exists=pathlib.Path('/private/tmp/somewhere-sdd-vibe-backend-independent/connection.json').exists(),fixture_temp_root_exists=temp_root.exists())
assert not temp_root.exists()
print('phase2 passed',len(log),'interactions')
