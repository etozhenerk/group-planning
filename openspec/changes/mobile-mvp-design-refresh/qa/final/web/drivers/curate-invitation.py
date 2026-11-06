from pathlib import Path
import json,hashlib,re,datetime
root=Path.cwd();b=root/'openspec/changes/mobile-mvp-design-refresh/qa/final/web';h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text());old=load(b/'publication-safe/staging-files.json');known={x['path']:x['sha256'] for x in old['files']};run=load(b/'run.json');prior=load(b/'run.before-invitation.safe.json');assert run['checks'][:13]==prior['checks'] and run['suites']==prior['suites'];assert h(b/'run.before-invitation.safe.json')=='6e873d4eb5c6515e4f39991336631e53721e8f8532c20275a1b0a37c0a3fff3b';out=b/'invitation-publication';out.mkdir(exist_ok=True);included={};errors=[]
def add(p,purpose,expected=None):
 p=Path(p);p=p if p.is_absolute() else root/p
 if not p.is_file():errors.append({'missing':str(p)});return
 if expected and h(p)!=expected:errors.append({'hashMismatch':str(p)})
 rel=str(p.relative_to(root));included.setdefault(rel,set()).add(purpose)
for c in run['checks'][13:]:
 for e in c['evidence']:add(b/e['path'],'new independent case:'+c['id'].split('/')[0],e['sha256'])
rp=b.parent/'design/mobile-mvp-invitation-web/design-review.json';report=load(rp);add(rp,'64-state independent design report')
for c in report['checks']:
 for e in c['evidence']:add(e['path'],'design:'+c['state'],e['sha256'])
for name in ['run.json','run.before-invitation.safe.json','invitation-casechecks.json','invitation-step-mapping.json','binding-invitation-after.json','invitation-design-check-before.log','invitation-report-inspect.log','invitation-design-ready.log','invitation-task-ready.log','design-contexts-current/mobile-mvp-invitation-web.json']:
 add(b/name,'identity/current gate/schema/previous safe run')
for name in ['invitation-capture.mjs','invitation-access.mjs','invitation-boundaries.mjs','invitation-cutoff-remaining.mjs','invitation-proof-screens.mjs','map-invitation-canonical.mjs','write-invitation-report.mjs','write-invitation-checks.mjs','link-invitation-screens.mjs','binding-invitation-after.mjs','legacy43.mjs','curate-invitation.py']:
 add(b/'drivers'/name,'QA tooling provenance')
for p in (b/'manual/invitation-canonical').glob('*.txt'):add(p,'Exact executed canonical assertion source snapshot')
for p in (b/'manual/legacy43/provenance').iterdir():
 if p.is_file() and p.suffix not in ['.test','.pem','.key']:add(p,'Additive alternate legacy43 QA data fixture provenance; public synthetic token, no release/native claim')
add(b/'manual/legacy43/legacy43-guest.png','actual old-path public guest')
# Preserve original failed driver histories that explain the corrected tooling, without turning them into suite passes.
for p in (b/'manual/invitation-boundaries').glob('observations.*.json'):add(p,'Original QA driver setup/navigation/DTO assertion diagnostics preserved')
for e in run['checks'][:13]+run['suites']:
 for proof in e['evidence']:
  p=b/proof['path'];assert h(p)==proof['sha256']
# Safety: new publication contains no literal session/OAuth/CSRF fields/private keys. Idempotency and public invitation capability data intentionally remain.
violations=[];texts=0
for rel in included:
 p=root/rel
 if p.suffix.lower() in ['.png','.jpg','.jpeg','.webp']:continue
 texts+=1;t=p.read_text()
 if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',t):violations.append({'path':rel,'kind':'privateKey'})
 if p.suffix=='.json':
  def inspect(x):
   if isinstance(x,dict):
    for k,v in x.items():
     if k.lower() in ['csrf_token','session_token','access_token','refresh_token','id_token','oauth_token'] and isinstance(v,str) and not v.startswith('[REDACTED '):violations.append({'path':rel,'key':k})
     inspect(v)
   elif isinstance(x,list):
    for v in x:inspect(v)
  inspect(load(p))
errors+=violations
proof={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'valid':not errors,'sourceHash':load(b/'plan.json')['sourceHash'],'artifactHash':load(b/'candidate.json')['artifactHash'],'runBeforeSha256':h(b/'run.before-invitation.safe.json'),'runAfterSha256':h(b/'run.json'),'prior13ChecksUnchanged':True,'sixSuitesUnchanged':True,'publishedPriorCommit':'1403a977','priorAllowlistSha256':h(b/'publication-safe/staging-files.json'),'designReportSha256':h(rp),'newChecks':33,'taskExpected':40,'taskChecked':40,'designStates':64,'bindingRuntimeFiles':260,'bindingValid':load(b/'binding-invitation-after.json')['valid'],'credentialFieldViolations':violations,'textFilesScanned':texts,'errors':errors,'limits':['Whole305/other8designmanifests not passed.','Legacy43 additive isolated seed ran9163; same frozen product/API; original source/overlay/binary provenance retained; stopped. Primary9153 not restarted.','CSSzoom200 is rendering stress, not OS/browser chrome zoom; short viewport has no editable IME field.','Canonical source snapshots tied to explicit passed title/project/loglines, not exit0.','Initial own QA-driver errors preserved and classified, not product failures. Existing409 join_closed contract checked directly.','Raw original suites and credential-bearing observations remain local; already-published safe suite dependencies unchanged.']};(out/'safety-and-provenance.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');add(out/'safety-and-provenance.json','safety/hash-chain/scope record')
if errors:print(json.dumps(errors));raise SystemExit(1)
files=[];deps=[]
for rel,purposes in sorted(included.items()):
 p=root/rel;item={'path':rel,'sha256':h(p),'bytes':p.stat().st_size,'purpose':sorted(purposes)}
 (deps if known.get(rel)==item['sha256'] else files).append(item)
a={'schemaVersion':1,'createdAt':proof['at'],'scopeTasks':['8.7','8.10'],'policy':'Stage only files plus this allowlist and its sha256 sidecar. Dependencies already published in1403a977 with identical hashes. No app/tests/tasks/Git edits. Excludes binaries/certs/config/env, raw auth logs/credential observations, unrelated checkpoints, redundant contactsheets. Public legacy43/22 invitation tokens are isolated synthetic QA data required by compatibility assertions.','runSha256':proof['runAfterSha256'],'files':files,'dependenciesAlreadyPublished':deps,'totalFiles':len(files),'totalBytes':sum(x['bytes'] for x in files),'dependencyFiles':len(deps),'previousPublication':{'commit':'1403a977','allowlist':'openspec/changes/mobile-mvp-design-refresh/qa/final/web/publication-safe/staging-files.json','allowlistSha256':proof['priorAllowlistSha256'],'previousRunSnapshot':'openspec/changes/mobile-mvp-design-refresh/qa/final/web/run.before-invitation.safe.json','previousRunSha256':proof['runBeforeSha256']}}
p=out/'staging-files.json';p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n');(out/'staging-files.sha256').write_text(h(p)+'  '+str(p.relative_to(root))+'\n');print(json.dumps({'valid':True,'files':len(files),'bytes':a['totalBytes'],'alreadyPublishedDependencies':len(deps),'allowlistSha256':h(p),'safetySha256':h(out/'safety-and-provenance.json'),'runSha256':a['runSha256']}))
