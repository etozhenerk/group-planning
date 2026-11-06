import urllib.request, urllib.error, urllib.parse, ssl, http.cookiejar, json, uuid, pathlib, datetime
root=pathlib.Path(__file__).parent
out=root/'evidence'
origin='https://127.0.0.1:9150'
log=[]
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

def client():
    return urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl._create_unverified_context()), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),NoRedirect())

def req(c, method, path, expected, body=None, headers=None, label=None):
    hs=headers or {}
    if body is not None: hs={**hs,'Content-Type':'application/json'}
    r=urllib.request.Request(origin+path, data=None if body is None else json.dumps(body).encode(), headers=hs, method=method)
    try: response=c.open(r,timeout=20)
    except urllib.error.HTTPError as e: response=e
    raw=response.read()
    log.append({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':method,'route':label or path,'status':response.status,'expected':expected})
    assert response.status==expected,(label or path,response.status,raw)
    return (json.loads(raw) if raw else None), response.headers

def login(c,code):
    start,_=req(c,'POST','/api/v1/auth/yandex/start',200,{'client_kind':'web','return_context':{'kind':'home'}},{'Origin':origin})
    state=urllib.parse.parse_qs(urllib.parse.urlsplit(start['authorization_url']).query)['state'][0]
    req(c,'GET','/api/v1/auth/yandex/callback?'+urllib.parse.urlencode({'state':state,'code':code}),303,label='/api/v1/auth/yandex/callback?[redacted]')
    me,_=req(c,'GET','/api/v1/me',200)
    return me

started=datetime.datetime.now(datetime.timezone.utc).isoformat()
owner,guest,anon=client(),client(),client()
try:
    a=login(owner,'profile-fields-full'); b=login(guest,'misha')
    private,_=req(owner,'GET','/api/v1/me/profile',200)
    assert all(private.get(k) for k in ['email','phone','first_name','last_name']), 'fixture must carry private contacts'
    before,_=req(guest,'GET','/api/v1/invitations',200)
    created,_=req(owner,'POST','/api/v1/meetings',201,{'title':'QA public organizer '+str(uuid.uuid4())[:8],'starts_at':'2099-10-24T19:00:00+03:00','timezone':'Europe/Moscow','description':'Public-only description','place':'Тестовое место'},{'Origin':origin,'X-CSRF-Token':a['csrf_token'],'Idempotency-Key':str(uuid.uuid4())})
    meeting=created['meeting']['id']; token=urllib.parse.urlsplit(created['invitation_url']).path.rsplit('/',1)[1]
    path='/api/v1/invitations/'+token
    feed_before,_=req(owner,'GET','/api/v1/meetings/'+meeting+'/feed',200)
    public,_=req(anon,'GET',path,200,label='/api/v1/invitations/[own-token]')
    signed,_=req(guest,'GET',path,200,label='/api/v1/invitations/[own-token]')
    again,_=req(guest,'GET',path,200,label='/api/v1/invitations/[own-token]')
    for preview in (public,signed,again):
        org=preview['organizer']
        assert set(org)=={'id','display_name','avatar_url'},set(org)
        assert org=={k:a['user'][k] for k in ('id','display_name','avatar_url')}
        assert preview['my_rsvp'] is None and preview['my_rsvp_revision']=='0'
        deny=('email','phone','login','birthday','sex','first_name','last_name','participants','entries','messages','organizer_id')
        def keys(value):
            if isinstance(value,dict):
                for k,v in value.items():
                    yield k
                    yield from keys(v)
            elif isinstance(value,list):
                for v in value: yield from keys(v)
        assert not set(deny).intersection(keys(preview))
    assert public==signed==again
    req(guest,'GET','/api/v1/meetings/'+meeting+'/feed',403)
    req(guest,'GET','/api/v1/meetings/'+meeting+'/participants',403)
    req(guest,'GET','/api/v1/meetings/'+meeting,403)
    feed_after,_=req(owner,'GET','/api/v1/meetings/'+meeting+'/feed',200)
    assert feed_before==feed_after,'preview changed feed'
    roster,_=req(owner,'GET','/api/v1/meetings/'+meeting+'/participants',200)
    assert len(roster['participants'])==1 and roster['participants'][0]['user']['id']==a['user']['id']
    after,_=req(guest,'GET','/api/v1/invitations',200)
    assert before==after,'preview saved invitation'
    invalid,_=req(anon,'GET','/api/v1/invitations/0000000000000000000000',404)
    assert 'organizer' not in json.dumps(invalid) and a['user']['display_name'] not in json.dumps(invalid)
    (out/'public-preview.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n')
    (out/'signed-preview.json').write_text(json.dumps(signed,ensure_ascii=False,indent=2)+'\n')
    (out/'invalid-preview.json').write_text(json.dumps(invalid,ensure_ascii=False,indent=2)+'\n')
    (out/'public-summary.json').write_text(json.dumps({'startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'assertions':'same real public id/name/avatar; exact organizer whitelist; no private fields; null RSVP revision0; protected resources403; roster1 organizer; unchanged feed/saved list; invalid link404 no identity','fixturePrivateFieldsPresent':True,'previewReads':3,'profileSnapshots':'session/contacts/CSRF/cookies not persisted','cleanup':'Only own new QA meeting in independently-owned transient memory fixture; no delete-meeting API. Both created sessions logged out; reviewer stops fixture after assertions.'},ensure_ascii=False,indent=2)+'\n')
finally:
    for c,me in ((owner,locals().get('a')),(guest,locals().get('b'))):
        if me:
            req(c,'POST','/api/v1/auth/logout',204,{}, {'Origin':origin,'X-CSRF-Token':me['csrf_token']})
    (out/'interaction.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n')
print('PASS live HTTP public identity/privacy/no-RSVP/rights/invalid-link')
