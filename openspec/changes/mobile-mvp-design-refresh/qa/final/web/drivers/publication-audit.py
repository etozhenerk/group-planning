from pathlib import Path
import json,hashlib,re,datetime,collections
root=Path.cwd();base=root/'openspec/changes/mobile-mvp-design-refresh/qa/final/web';out=base/'publication-safe';H=lambda b:hashlib.sha256(b).hexdigest(); load=lambda p:json.loads(p.read_text());run=load(base/'run.json');prov=load(out/'provenance.json');files={};errors=[]
def add(p,why):
 p=Path(p);p=p if p.is_absolute() else root/p
 if not p.is_file():errors.append({'missing':str(p)});return
 rel=str(p.relative_to(root));files.setdefault(rel,set()).add(why)
def evidence(e,origin,why):
 p=Path(e['path']);p=root/p if str(p).startswith('openspec/') else origin/p
 if not p.exists() or H(p.read_bytes())!=e['sha256']:errors.append({'hashMismatch':str(p)})
 add(p,why)
for c in run['checks']:
 for e in c['evidence']:evidence(e,base,'manual-case:'+str(c['id']))
for s in run['suites']:
 for e in s['evidence']:evidence(e,base,'required-suite:'+s['id'])
reports=['mobile-mvp-entry-web','shared-rsvp-routing-web']
for rid in reports:
 p=base.parent/'design'/rid/'design-review.json';d=load(p);add(p,'schema-valid independent design report')
 for c in d['checks']:
  for e in c['evidence']:evidence(e,p.parent,'design:'+rid)
 add(base/'design-contexts-current'/f'{rid}.json','fresh design context')
for name in ['plan.json','run.json','candidate.json','selected-cases.json','design-contexts.json','binding-before.json','binding-priority-after.json','design-check.log','entry-report-inspect.log','entry-design-ready.log','rsvp-report-inspect.log','rsvp-design-ready.log','priority-task-ready.log','priority-step-mapping.json','publication-safe/provenance.json','manual/desktop-control/baseline-published-binding.json','manual/desktop-control/closed-baseline-published-binding.json']:
 add(base/name,'identity/schema/gate/provenance')
# Retain action-linked screenshots including the complete scope/boundary route samples.
for folder in ['onboarding','entry-complete','entry-css-zoom','rsvp','rsvp-wide','rsvp-extra','priority-extensions','priority-extensions-wide','first-decline','scope-routes','scope-surfaces','scope-surfaces-wide']:
 for p in (base/'manual'/folder).glob('*.png'):
  if folder=='scope-routes' and any(x in p.name for x in ['info-','settings-']):continue # immediate animation captures replaced by settled surfaces
  if not p.name.startswith('review-'):add(p,'supporting actual/reference action/boundary screenshot')
# Reusable tooling only; no certificates, environment configs, binaries, or data-token files.
for name in ['binding-before.mjs','binding-priority-after.mjs','onboarding-pages.mjs','onboarding-interactions.mjs','onboarding-access-boundary.mjs','entry-complete.mjs','entry-css-zoom.mjs','rsvp-core.mjs','rsvp-wide.mjs','rsvp-extra.mjs','rsvp-extra-remaining.mjs','priority-case-extensions.mjs','priority-case-wide.mjs','first-decline.mjs','scope-routes.mjs','scope-surfaces.mjs','scope-surfaces-wide.mjs','run-priority-r6.mjs','write-priority-reports.mjs','write-priority-casechecks.mjs','add-scope-check.mjs','sanitize-priority.py','publication-audit.py']:
 add(base/'drivers'/name,'QA driver provenance; not a pass')
# Preserve all mapping references that actually name proof files.
def walkmap(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k=='evidence' and isinstance(v,list):
    for rel in v:
     if isinstance(rel,str):add(base/rel,'exact case-step evidence mapping')
   else:walkmap(v)
 elif isinstance(x,list):
  for v in x:walkmap(v)
walkmap(load(base/'priority-step-mapping.json'))
# Source raw remains local and is excluded from the publication set. Verify provenance unchanged.
credentials=set();redactions=collections.Counter();semantic=[]
for rec in prov['files']:
 raw=base/rec['originalPath'];safe=base/rec['safePath'];a=raw.read_text();b=safe.read_text()
 for p,expected in [(raw,rec['originalSha256']),(safe,rec['safeSha256'])]:
  if H(p.read_bytes())!=expected:errors.append({'provenanceMismatch':str(p)})
 if str(raw.relative_to(root)) in files:errors.append({'rawIncluded':str(raw)})
 redactions.update(rec['redactions'])
 if raw.suffix=='.json':
  def compare(x,y):
   if isinstance(x,dict):
    if x.keys()!=y.keys():errors.append({'jsonKeysChanged':str(raw)})
    for k,v in x.items():
     if k.lower() in ['csrf_token','session_token','access_token','refresh_token','id_token','oauth_token'] and isinstance(v,str):
      credentials.add(v)
      if y[k]!='[REDACTED fixture credential sha256:'+H(v.encode())+']':errors.append({'incorrectPlaceholder':str(raw)})
     else:compare(v,y[k])
   elif isinstance(x,list):
    if len(x)!=len(y):errors.append({'jsonLengthChanged':str(raw)})
    for v,w in zip(x,y):compare(v,w)
   elif x!=y:errors.append({'jsonNoncredentialChanged':str(raw)})
  compare(json.loads(a),json.loads(b));semantic.append({'file':rec['safePath'],'nonCredentialJsonIdentical':True})
 else:
  for m in re.finditer(r'(?im)\b(?:set-cookie|cookie):\s*([^\r\n]+)',a):
   for part in m[1].split(';'):
    if '=' in part:
     name,val=part.split('=',1)
     if name.strip().lower() not in ['path','domain','expires','max-age','samesite']:credentials.add(val)
  for pattern in [r'(?im)\bx-csrf-token:\s*([^\r\n]+)',r'(?im)\bauthorization:\s*([^\r\n]+)',r'''(?i)[?&](?:state|code|access_token|refresh_token|id_token|csrf_token)=([^&\s"'<>]+)''',r'''(?i)"(?:csrf_token|session_token|access_token|refresh_token|id_token|oauth_token)"\s*:\s*"([^"\r\n]+)"''']:
   credentials.update(m[1] for m in re.finditer(pattern,a))
  # Structured HTTP evidence stays intact; credential-bearing auth-query lines are intentionally projected.
  def facts(t):return {'methods':collections.Counter(re.findall(r'\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b',t)),'httpStatusLines':collections.Counter(re.findall(r'HTTP/[0-9.]+ [1-5][0-9]{2}[^\r\n]*',t)),'idempotencyLines':[l for l in t.splitlines() if re.search(r'(?i)(idempotency|client_request_id)',l)]}
  fa,fb=facts(a),facts(b)
  if fa!=fb:errors.append({'httpIntentStatusIdempotencyChanged':str(raw),'methodsSame':fa['methods']==fb['methods'],'statusSame':fa['httpStatusLines']==fb['httpStatusLines'],'idempotencySame':fa['idempotencyLines']==fb['idempotencyLines']})
  semantic.append({'file':rec['safePath'],'methodCountsStatusLinesIdempotencyIdentical':fa==fb,'lineCountIdentical':len(a.splitlines())==len(b.splitlines())})
# No original credential literal in any text file in the curated publication set.
scanned=0;credentialViolations=[];generic=[]
for rel in list(files):
 p=root/rel
 if p.suffix.lower() in ['.png','.jpg','.jpeg','.webp']:continue
 t=p.read_text();scanned+=1
 for value in credentials:
  if len(value)>=16 and value in t:credentialViolations.append({'path':rel,'credentialSha256':H(value.encode())})
 if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',t):generic.append({'path':rel,'type':'private-key'})
 if p.suffix=='.json':
  def checkkeys(x):
   if isinstance(x,dict):
    for k,v in x.items():
     if k.lower() in ['csrf_token','session_token','access_token','refresh_token','id_token','oauth_token'] and isinstance(v,str) and not v.startswith('[REDACTED '):generic.append({'path':rel,'type':'credential-json-key','key':k})
     checkkeys(v)
   elif isinstance(x,list):
    for v in x:checkkeys(v)
  checkkeys(json.loads(t))
errors+=credentialViolations+generic
if H((base/'run.json').read_bytes())!=prov['runAfterSha256']:errors.append({'runChangedAfterSanitization':True})
expectedReports={'mobile-mvp-entry-web':'a0ede2fd0f1e552bd9f203ebb237880497b522e69f88645a390c3ee5f54d63ea','shared-rsvp-routing-web':'1778ba997efe277e5154aa05413399a48901aace00f871438d7da73afb5109b1'}
for rid,h in expectedReports.items():
 if H((base.parent/'design'/rid/'design-review.json').read_bytes())!=h:errors.append({'reportChanged':rid})
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'valid':not errors,'files':len(files),'textFilesScanned':scanned,'credentialLiteralCount':len(credentials),'credentialLiteralViolations':len(credentialViolations),'redactionCounts':dict(redactions),'evidenceHashClosureVerified':True,'designReportsUnchanged':True,'semantics':semantic,'errors':errors,'runSha256':H((base/'run.json').read_bytes()),'provenanceSha256':H((out/'provenance.json').read_bytes()),'scope':'Only 13 executed priority cases, 52 entry+144 RSVP design states, six required suites. Whole 305-case/11-manifest acceptance is not declared.'}
(out/'safety-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');add(out/'safety-review.json','publication credential and hash audit')
if errors:
 print(json.dumps({'valid':False,'errors':errors[:20],'errorCount':len(errors)}));raise SystemExit(1)
allow={'schemaVersion':1,'createdAt':result['at'],'scopeTasks':['3.5','3.10','15.2','15.5'],'planId':load(base/'plan.json')['id'],'sourceHash':load(base/'plan.json')['sourceHash'],'artifactHash':load(base/'candidate.json')['artifactHash'],'runSha256':result['runSha256'],'policy':'Only listed paths may be staged. Raw originals/local-only backups, other checkpoints/history, unrelated manual flows, credentials/config/certs/token files/binaries/APKs, canonical traces/test-results and duplicate console logs are excluded. Public invitation URLs in evidence are isolated synthetic QA capabilities, not production credentials. No Git operations performed.','files':[{'path':rel,'sha256':H((root/rel).read_bytes()),'bytes':(root/rel).stat().st_size,'purpose':sorted(why)} for rel,why in sorted(files.items())]};allow['totalFiles']=len(allow['files']);allow['totalBytes']=sum(x['bytes'] for x in allow['files']);p=out/'staging-files.json';p.write_text(json.dumps(allow,ensure_ascii=False,indent=2)+'\n');(out/'staging-files.sha256').write_text(H(p.read_bytes())+'  '+str(p.relative_to(root))+'\n');print(json.dumps({'valid':True,'files':allow['totalFiles'],'bytes':allow['totalBytes'],'allowlistSha256':H(p.read_bytes()),'runSha256':result['runSha256'],'textScanned':scanned,'credentialLiterals':len(credentials)}))
