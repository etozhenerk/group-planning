import pathlib,json,urllib.request,urllib.error,ssl,uuid,datetime,time,hashlib,sys,subprocess
B=pathlib.Path('/tmp/somewhere-sequential-sdk-20261102');E=pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/chat-reliability-and-sync/qa/2026-11-02-sequential-sdk');C=json.loads((B/'connection.json').read_text());L=E/'interactions.jsonl';STATE=B/'state.json'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def record(action,**data):
 with L.open('a')as f:f.write(json.dumps({'at':now(),'action':action,**data},ensure_ascii=False)+'\n')
def request(actor,path,method='GET',body=None,expected=None):
 url=C['origin']+'/api/v1/'+path;headers={'Content-Type':'application/json','Idempotency-Key':str(uuid.uuid4())}
 if actor:headers['Authorization']='Bearer '+C['cases'][actor]['token']
 if body and 'client_request_id'in body:headers['Idempotency-Key']=body['client_request_id']
 start=time.monotonic();req=urllib.request.Request(url,data=json.dumps(body).encode()if body is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,context=ssl._create_unverified_context(),timeout=20)as r:status=r.status;raw=r.read()
 except urllib.error.HTTPError as r:status=r.code;raw=r.read()
 safe=path
 if safe.startswith('invitations/'):safe='invitations/:token/'+safe.rsplit('/',1)[-1]
 record('http-controller',actor=actor,path=safe.split('?')[0],method=method,status=status,elapsedMs=round((time.monotonic()-start)*1000,3),responseSha256=hashlib.sha256(raw).hexdigest())
 if expected is not None:assert status in ([expected]if isinstance(expected,int)else expected),(status,safe.split('?')[0],raw[:100])
 try:value=json.loads(raw)
 except json.JSONDecodeError:value={'unparsed':len(raw)}
 return status,value

def control(op,**kw):return request(None,'qa-control','POST',{'op':op,**kw},200)[1]
def settings(**updates):
 data=request(None,'qa-control',expected=200)[1]['settings'];data.update(updates);control('configure',settings=data);return data

def state():return json.loads(STATE.read_text())
def save(s):STATE.write_text(json.dumps(s,indent=2)+'\n');STATE.chmod(0o600)
def events():return request(None,'qa-control',expected=200)[1]['events']
def message(actor,mid,text):return request(actor,'meetings/'+mid+'/messages','POST',{'text':text,'client_request_id':str(uuid.uuid4())},201)[1]
def scene(mode='design'):
 subprocess.run(['python3',str(E/'manual.py'),'launch',mode],check=True,stdout=subprocess.DEVNULL);record('launch-current-qa',scenario=mode)

def capture(name):subprocess.run(['python3',str(E/'manual.py'),'capture',name],check=True,stdout=subprocess.DEVNULL)

def open_meeting():
 s=state();scene(s.get('actor','design'));time.sleep(1.5)
 for attempt in range(6):
  capture('sdk-list-'+str(attempt));xml=(E/('sdk-list-'+str(attempt)+'.xml')).read_text()
  if s['title']in xml:
   subprocess.run(['python3',str(E/'manual.py'),'taptext','^'+s['title']+' '],check=True);record('open-own-sdk-meeting',id=s['meeting']);return
  subprocess.run(['python3',str(E/'manual.py'),'swipe','350','1250','350','400','400'],check=True)
 raise AssertionError('Own SDK meeting not reachable in list')

mode=sys.argv[1]
if mode=='setup-v2':
 _,created=request('design','meetings','POST',{'title':'SDKv2 '+uuid.uuid4().hex[:6],'starts_on':'2026-11-10','timezone':'Europe/Moscow'},201);mid=created['meeting']['id'];inv=created['invitation_url'].rsplit('/i/',1)[1];request('invite-rsvp','invitations/'+inv+'/rsvp','PUT',{'answer':'going','expected_revision':'0'},200);baseline=message('design',mid,'V2 baseline');s={'meeting':mid,'title':created['meeting']['title'],'actor':'design','invitationToken':inv,'baselineId':baseline['id']};save(s);settings(wire_delay_ms=75);subprocess.run(['python3',str(E/'manual.py'),'configure'],check=True,stdout=subprocess.DEVNULL);open_meeting();time.sleep(1);capture('v2-baseline-current');_,snapshot=request('design','meetings/'+mid+'/sync',expected=200);s['hostCursor']=snapshot['change_cursor'];s['hostEpoch']=snapshot['stream_epoch'];save(s);print('Own v2 meeting ready')
elif mode=='setup-gap':
 _,created=request('design','meetings','POST',{'title':'SDK '+uuid.uuid4().hex[:6],'starts_on':'2026-11-10','timezone':'Europe/Moscow'},201);mid=created['meeting']['id'];inv=created['invitation_url'].rsplit('/i/',1)[1]
 request('invite-rsvp','invitations/'+inv+'/rsvp','PUT',{'answer':'going','expected_revision':'0'},200)
 base=message('design',mid,'SDK baseline');s={'meeting':mid,'title':created['meeting']['title'],'baselineId':base['id'],'baselineSequence':base['sequence']};save(s)
 settings(hold_subscribe=True,drop_hints=True,wire_delay_ms=75)
 record('gap-prepared',meeting=mid,title=s['title']);print(json.dumps({'meeting':mid,'title':s['title']}))
 open_meeting()
 deadline=time.monotonic()+12
 while time.monotonic()<deadline:
  es=events()
  if any(e.get('event')=='sdk-subscribe-held'for e in es):break
  time.sleep(.1)
 else:raise AssertionError('Real SDK subscribe did not reach the controlled gate')
 s=state();entry=message('invite-rsvp',s['meeting'],'SDK gap without hint');s['gapEntry']=entry['id'];save(s);record('gap-message-committed-no-hint',entryId=entry['id'],sequence=entry['sequence']);settings(hold_subscribe=False)
 time.sleep(1);capture('sdk-gap-catchup-current');print('Gap released; inspect actual UI/trace')
elif mode=='settings':print(json.dumps(settings(**json.loads(sys.argv[2]))))
elif mode=='status':
 d=request(None,'qa-control',expected=200)[1];(E/'status-current.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({'settings':d['settings'],'recent':d['events'][-8:]}))
elif mode=='capture':capture(sys.argv[2])
elif mode=='short-break':
 s=state();settings(drop_hints=False,hold_subscribe=False,block_realtime=True);control('disconnect');entry=message('invite-rsvp',s['meeting'],'SDK short recovery');s['shortEntry']=entry['id'];save(s);time.sleep(1);record('short-transport-restored');settings(block_realtime=False);time.sleep(2);capture('sdk-short-recovery-current')
elif mode=='start-long-break':
 s=state();settings(drop_hints=False,block_realtime=True,hold_subscribe=False,hold_sync=True);control('disconnect');s['longStartedAt']=now();s['longStartedMonotonic']=time.monotonic();s['longEntries']=[];save(s)
 for i in range(100):
  entry=message('invite-rsvp',s['meeting'],'SDK gap item '+str(i+1));s['longEntries'].append({'id':entry['id'],'sequence':entry['sequence']})
 save(s);record('long-gap-100-commits',count=len(s['longEntries']),startedAt=s['longStartedAt']);print(json.dumps({'startedAt':s['longStartedAt'],'count':len(s['longEntries']),'elapsed':time.monotonic()-s['longStartedMonotonic']}))
elif mode=='release-long-break':
 s=state();elapsed=(datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(s['longStartedAt'])).total_seconds();assert elapsed>=300,elapsed;record('long-transport-restored',gapSeconds=elapsed);s['restoredAt']=now();s['restoredMonotonic']=time.monotonic();save(s);settings(block_realtime=False,hold_sync=False);print('Released after',elapsed)
elif mode=='host-cursor-probe':
 s=state();mid=s['meeting'];_,snapshot=request('design','meetings/'+mid+'/sync',expected=200);s['hostCursor']=snapshot['change_cursor'];s['hostEpoch']=snapshot['stream_epoch'];save(s)
 status,error=request('design','meetings/'+mid+'/sync?cursor=forged',expected=400);assert error['error']['code']=='invalid_sync_cursor';(E/'malformed-cursor-current.json').write_text(json.dumps({'status':status,'problem':error,'snapshotEpoch':s['hostEpoch'],'snapshotEntryCount':len(snapshot['entries']),'snapshotCursorSha256':hashlib.sha256(s['hostCursor'].encode()).hexdigest()},indent=2)+'\n');print('Canonical forged cursor rejected 400 invalid_sync_cursor')
elif mode=='v2-reset-replay':
 s=state();before=len(events());settings(capture_sync=True,replay_sync=False);control('hint',meeting=s['meeting'],epoch=s['hostEpoch']);deadline=time.monotonic()+12
 while time.monotonic()<deadline:
  if any(r.get('event')=='captured-sync-for-replay'for r in events()[before:]):break
  time.sleep(.1)
 else:raise AssertionError('No actual old epoch sync captured')
 settings(capture_sync=False);_,meeting=request('design','meetings/'+s['meeting'],expected=200);title='New epoch '+s['title'];request('design','meetings/'+s['meeting'],'PATCH',{'expected_revision':meeting['revision'],'title':title},200);epoch=str(uuid.uuid4());control('reset_epoch',meeting=s['meeting'],epoch=epoch);control('hint',meeting=s['meeting'],epoch=epoch);time.sleep(1);capture('v2-reset-outbox-draft-current');settings(replay_sync=True);control('hint',meeting=s['meeting'],epoch=s['hostEpoch']);time.sleep(1);capture('v2-old-epoch-replayed-current');settings(replay_sync=False);control('hint',meeting=s['meeting'],epoch=epoch);time.sleep(.6);capture('v2-old-epoch-recovered-current');s['title']=title;s['resetEpoch']=epoch;save(s);print('Exact old response replayed after fresh epoch snapshot; inspect draft/outbox/newtitle and trace')
elif mode=='rollback':
 s=state();settings(capabilities='',sync_status=0,rollback=False,hold_sync=False,block_realtime=False);subprocess.run(['python3',str(E/'manual.py'),'configure'],check=True,stdout=subprocess.DEVNULL);open_meeting();time.sleep(1);_,snapshot=request('design','meetings/'+s['meeting']+'/sync',expected=200);s['hostCursor']=snapshot['change_cursor'];s['hostEpoch']=snapshot['stream_epoch'];save(s);settings(rollback=True);entry=message('invite-rsvp',s['meeting'],'SDK rollback writer preserved');settings(rollback=False);epoch=str(uuid.uuid4());control('reset_epoch',meeting=s['meeting'],epoch=epoch);control('hint',meeting=s['meeting'],epoch=epoch);time.sleep(1.5);capture('sdk-rollback-new-epoch-current');_,feed=request('design','meetings/'+s['meeting']+'/feed',expected=200);assert sum(e['id']==entry['id']for e in feed['entries'])==1;(E/'rollback-current.json').write_text(json.dumps({'rollbackEntryId':entry['id'],'sequence':entry['sequence'],'beforeEpoch':s['hostEpoch'],'afterEpoch':epoch,'canonicalFeedContainsOnce':True},indent=2)+'\n');s['resetEpoch']=epoch;save(s);print('Rollback writer commit retained across fresh epoch; inspect UI+trace')
elif mode=='security-revoke':
 s=state();settings(capabilities='',sync_status=0,hold_sync=False,block_realtime=False,drop_hints=False);subprocess.run(['python3',str(E/'manual.py'),'configure'],check=True,stdout=subprocess.DEVNULL);open_meeting();time.sleep(1);settings(hold_sync=True);control('hint',meeting=s['meeting'],epoch=s.get('resetEpoch',s['hostEpoch']));time.sleep(.5);record('actual-server-logout-start',actor='design');control('logout',token=C['cases']['design']['token']);time.sleep(2);capture('sdk-session-revoked-current');settings(hold_sync=False);control('hint',meeting=s['meeting'],epoch=s.get('resetEpoch',s['hostEpoch']));control('disconnect');time.sleep(3);capture('sdk-session-revoked-late-hint-current');request('design','me',expected=401);record('revoked-client-relaunch');scene();time.sleep(2);capture('sdk-session-revoked-relaunch-current');print('Actual logout + held callback + late hint + reconnect/relaunch attempted; inspect UI and trace')
elif mode=='security-expiry':
 previous=state();(B/'state-before-expiry.json').write_text(json.dumps(previous));_,created=request('calendar','meetings','POST',{'title':'Expiry '+uuid.uuid4().hex[:6],'starts_on':'2026-11-10','timezone':'Europe/Moscow'},201);s={'meeting':created['meeting']['id'],'title':created['meeting']['title'],'actor':'calendar'};save(s);message('calendar',s['meeting'],'Expiry protected baseline');settings(capabilities='',sync_status=0,hold_sync=False,clock_offset_seconds=0,block_realtime=False,drop_hints=False);subprocess.run(['python3',str(E/'manual.py'),'configure'],check=True,stdout=subprocess.DEVNULL);open_meeting();time.sleep(1);capture('sdk-expiry-subscribed-current');before=len(events());settings(hold_sync=True);control('hint',meeting=s['meeting'],epoch='synthetic');deadline=time.monotonic()+12
 while time.monotonic()<deadline:
  if any(r.get('event')=='http-sync-held'and r.get('response_epoch')for r in events()[before:]):break
  time.sleep(.1)
 else:raise AssertionError('No authorized old sync held before expiry')
 record('expiry-clock-advanced-start',offsetSeconds=32400);settings(clock_offset_seconds=32400);print('Expiry clock advanced; subscription checking and old sync held. Capture within60s, then release held/late hint/relaunch, restoreclock')
elif mode=='expiry-finish':
 s=state();capture('sdk-expired-session-current');settings(hold_sync=False);control('hint',meeting=s['meeting'],epoch='synthetic-late');control('disconnect');time.sleep(2);capture('sdk-expired-late-hint-current');request('calendar','me',expected=401);scene('calendar');time.sleep(2);capture('sdk-expired-relaunch-current');settings(clock_offset_seconds=0);save(json.loads((B/'state-before-expiry.json').read_text()));print('Expiry late hint/reconnect/relaunch attempted; fixtureclock restored')
elif mode=='terminal':
 status=int(sys.argv[2]);assert status in [401,403,404];settings(capabilities='',sync_status=status,hold_sync=False,block_realtime=False,drop_hints=False);subprocess.run(['python3',str(E/'manual.py'),'configure'],check=True,stdout=subprocess.DEVNULL);record('terminal-guard-start',status=status);open_meeting();time.sleep(2);capture('sdk-terminal-'+str(status)+'-early');time.sleep(10);capture('sdk-terminal-'+str(status)+'-later');rows=[r for r in events()if r.get('event')=='http'and r.get('scenario')=='design'and r.get('path','').endswith('/sync')and r.get('status')==status];(E/('terminal-'+str(status)+'-counts.json')).write_text(json.dumps({'status':status,'requests':rows,'observationSeconds':12},indent=2)+'\n');print('Terminal',status,'sync count',len(rows))
elif mode=='caps-prepare':
 cap=sys.argv[2];assert cap in ['404','disabled'];settings(capabilities=cap,sync_status=0,hold_sync=False,block_realtime=False,rollback=False);subprocess.run(['python3',str(E/'manual.py'),'configure'],check=True,stdout=subprocess.DEVNULL);open_meeting();time.sleep(1);capture('sdk-caps-'+cap+'-feed-current');print('Capability mode prepared; inspect actual feed/read absence and perform UI send/retry')
elif mode=='legacy-http':
 s=state();mid=s['meeting'];key=str(uuid.uuid4());body={'text':'SDK legacy DTO '+key[:6],'client_request_id':key};_,one=request('invite-rsvp','meetings/'+mid+'/messages','POST',body,201);_,two=request('invite-rsvp','meetings/'+mid+'/messages','POST',body,[200,201]);assert one['id']==two['id'] and one['sequence']==two['sequence'];_,feed=request('invite-rsvp','meetings/'+mid+'/feed',expected=200);assert any(e['id']==one['id']for e in feed['entries']);(E/'legacy-http-current.json').write_text(json.dumps({'client':'HTTP-only caller; fixed former feed/messages DTO; no sync/realtime/read API','idempotentRetrySameId':one['id']==two['id'],'entryId':one['id'],'sequence':one['sequence'],'feedContainsEntry':True,'entryKeys':sorted(one)},indent=2)+'\n');print('Legacy HTTP feed/send/retry preserved same ID and sequence')
elif mode=='epoch-reset':
 import urllib.parse
 s=state();epoch=str(uuid.uuid4());settings(drop_hints=False);control('reset_epoch',meeting=s['meeting'],epoch=epoch);s['resetEpoch']=epoch;save(s);status,error=request('design','meetings/'+s['meeting']+'/sync?cursor='+urllib.parse.quote(s['hostCursor'],safe=''),expected=410);assert error['error']['code']=='sync_reset_required';control('hint',meeting=s['meeting'],epoch=epoch);time.sleep(1.5);capture('sdk-epoch-reset-current');(E/'epoch-reset-api-current.json').write_text(json.dumps({'status':status,'error':error,'previousEpoch':s['hostEpoch'],'newEpoch':epoch},indent=2)+'\n');print('Canonical old cursor410; UI capture and trace need inspection')
elif mode=='measure-release':
 s=state();elapsed=(datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(s['longStartedAt'])).total_seconds();assert elapsed>=300,elapsed
 record('long-transport-restored-measure-start',gapSeconds=elapsed)
 start=time.monotonic();s['restoredAt']=now();s['restoredMonotonic']=start;save(s);settings(block_realtime=False,hold_sync=False)
 frames=[]
 for i in range(14):
  before=time.monotonic();raw=subprocess.run(['/Users/misha/Library/Android/sdk/platform-tools/adb','-s','emulator-5554','exec-out','screencap','-p'],capture_output=True,check=True).stdout;after=time.monotonic();path=E/('recovery-frame-%02d.png'%i);path.write_bytes(raw)
  frames.append({'path':path.name,'startedMs':round((before-start)*1000,3),'completedMs':round((after-start)*1000,3),'sha256':hashlib.sha256(raw).hexdigest()});time.sleep(.06)
 (E/'recovery-frame-timing.json').write_text(json.dumps({'gapSeconds':elapsed,'restoredAt':s['restoredAt'],'frames':frames},indent=2)+'\n');capture('sdk-long-recovery-current');print(json.dumps(frames))
elif mode=='open':open_meeting()
else:raise ValueError(mode)
