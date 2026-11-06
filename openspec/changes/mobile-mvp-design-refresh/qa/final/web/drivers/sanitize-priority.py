from pathlib import Path
import json,re,hashlib,datetime
base=Path('openspec/changes/mobile-mvp-design-refresh/qa/final/web');run=json.loads((base/'run.json').read_text());safe=base/'publication-safe';safe.mkdir(exist_ok=True);(safe/'run.before-sanitization.local-only.json').write_bytes((base/'run.json').read_bytes());sources=[s['evidence'][0]['path'] for s in run['suites']]+['manual/priority-extensions/observations.json','manual/priority-extensions-wide/observations.json'];mapping={};records=[];credential_names={'csrf_token','session_token','access_token','refresh_token','id_token','oauth_token'}
def digest(x):return hashlib.sha256(x if isinstance(x,bytes) else x.encode()).hexdigest()
def placeholder(value):return '[REDACTED fixture credential sha256:'+digest(value)+']'
for rel in sources:
 raw=(base/rel).read_bytes();text=raw.decode();counts={};values=set()
 def add(kind,v):
  counts[kind]=counts.get(kind,0)+1
  if len(v)>=16:values.add(v)
  return placeholder(v)
 if rel.endswith('.json'):
  data=json.loads(text)
  def walk(x):
   if isinstance(x,dict):return {k:add(k,v) if k.lower() in credential_names and isinstance(v,str) else walk(v) for k,v in x.items()}
   if isinstance(x,list):return [walk(v) for v in x]
   return x
  text=json.dumps(walk(data),ensure_ascii=False,indent=2)+'\n'
 else:
  def cookie(m):
   prefix,value=m.groups();pieces=value.split(';');result=[]
   for piece in pieces:
    if '=' in piece:
     name,val=piece.split('=',1)
     # Set-Cookie attributes are validation evidence; redact cookie values only.
     if name.strip().lower() in ['path','domain','expires','max-age','samesite']:result.append(piece)
     else:result.append(name+'='+add('cookie',val))
    else:result.append(piece)
   return prefix+';'.join(result)
  text=re.sub(r'(?im)(\b(?:set-cookie|cookie):\s*)([^\r\n]+)',cookie,text)
  text=re.sub(r'(?im)(\bx-csrf-token:\s*)([^\r\n]+)',lambda m:m[1]+add('csrf-header',m[2]),text)
  text=re.sub(r'(?im)(\bauthorization:\s*)([^\r\n]+)',lambda m:m[1]+add('authorization',m[2]),text)
  text=re.sub(r'(?i)([?&](?:state|code|access_token|refresh_token|id_token|csrf_token)=)([^&\s"\'<>]+)',lambda m:m[1]+add('oauth-query',m[2]),text)
  text=re.sub(r'(?i)("(?:csrf_token|session_token|access_token|refresh_token|id_token|oauth_token)"\s*:\s*")([^"\r\n]+)(")',lambda m:m[1]+add('json-credential',m[2])+m[3],text)
 # Hide repeated long credentials wherever a debug diagnostic echoed the same value.
 for value in sorted(values,key=len,reverse=True):
  # Do not alter the hexadecimal proof in an already-created placeholder.
  text=text.replace(value,placeholder(value))
 destination='publication-safe/'+rel;target=base/destination;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(text);mapping[rel]={'path':destination,'sha256':digest(target.read_bytes())};records.append({'originalPath':rel,'originalSha256':digest(raw),'safePath':destination,'safeSha256':mapping[rel]['sha256'],'redactions':counts,'originalRetainedLocally':True})
for result in run['checks']+run['suites']:
 for e in result['evidence']:
  if e['path'] in mapping:e.update(mapping[e['path']])
(base/'run.json').write_text(json.dumps(run,ensure_ascii=False,indent=2)+'\n')
step=base/'priority-step-mapping.json';original=step.read_bytes();(safe/'step-mapping.before-sanitization.local-only.json').write_bytes(original);data=original.decode()
for old,new in mapping.items():data=data.replace('"'+old+'"','"'+new['path']+'"')
step.write_text(data)
provenance={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'purpose':'Publication-safe projections of actual R6 evidence; no changed verdict/action/status/intent/body/idempotency assertions. Raw originals retained locally and excluded from publication. All credential values are one-way SHA placeholders. Canonical memory servers have stopped. No product/test/case changes.','files':records,'runBeforeSha256':digest((safe/'run.before-sanitization.local-only.json').read_bytes()),'runAfterSha256':digest((base/'run.json').read_bytes()),'stepMappingOriginalSha256':digest(original),'stepMappingSafeSha256':digest(step.read_bytes()),'designReportsChanged':False};(safe/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'files':len(records),'runSha256':provenance['runAfterSha256'],'redactions':[{k:v for k,v in r.items() if k in ['originalPath','redactions']} for r in records]}))
