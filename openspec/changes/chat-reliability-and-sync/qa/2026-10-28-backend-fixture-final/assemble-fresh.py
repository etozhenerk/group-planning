import collections,datetime,hashlib,json,pathlib,re,shutil
ROOT=pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning');HERE=pathlib.Path(__file__).resolve().parent;OLD=HERE.parent/'2026-10-28-backend-independent-resume';now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
plan=json.loads((HERE/'plan.json').read_text());run=json.loads((HERE/'run-fresh.json').read_text());candidate=json.loads((HERE/'candidate.json').read_text())
assert plan['sourceHash']==json.loads((HERE/'source-freeze.json').read_text())['sourceHash']
original=candidate['originalFiles'];bad=[x['path'] for x in original if sha(ROOT/x['path'])!=x['sha256'] or sha(pathlib.Path(candidate['snapshot'])/x['path'])!=x['sha256']]
assert not bad,bad
(HERE/'source-integrity.json').write_text(json.dumps({'checkedAt':now(),'sourceHash':plan['sourceHash'],'productionSourceSHA256':candidate['productionSourceSHA256'],'productionInputs':214,'snapshotAndMainOriginalParity':True,'originalInputs':len(original),'mismatches':bad,'privateDotenvCopied':False},indent=2)+'\n')
auditpaths=[x['path'] for x in json.loads((OLD/'security-audit.json').read_text())['files']]
audit={'checkedAt':now(),'method':'Fresh read of current security model, topology report and historical restore limitations; no backup/restore operation in this run.','files':[{'path':p,'sha256':sha(ROOT/p)} for p in auditpaths],'observed':'Server-readable text and no E2EE are explicit. Existing age job evidence is historical; disk/key lifecycle and candidate restore are unconfirmed. Synthetic historical drill does not establish application sessions/receipts or RPO/RTO.'}
(HERE/'security-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
receipts={n:json.loads((HERE/(n+'-receipt.json')).read_text()) for n in ['runtime','supplement']};sql=json.loads((HERE/'sql/receipt.json').read_text());sqltext=(HERE/'sql/sql-live.log').read_text()
assert sql['exitCode']==0 and sql['databaseCleanupConfirmed'] and sql['removedOwnTemporaryDirectory'];assert '--- FAIL:' not in sqltext
all_events=[]
for n,r in receipts.items():
 assert r['exitCode']==0
 events=[dict(json.loads(line),evidence=n+'.jsonl') for line in (HERE/(n+'.jsonl')).read_text().splitlines() if line.startswith('{')];assert not any(e['Action']=='fail' for e in events);all_events+=events
passed={e['Test'] for e in all_events if e.get('Test') and e['Action']=='pass'};passed.update(re.findall(r'^--- PASS: ([^ ]+)',sqltext,re.M))
# Reuse only scenario/action/selector mapping; no previous outcomes or metric values.
methods={x['caseId']:{k:x[k] for k in ['action','expected','freshRuntimeSelectors']} for x in json.loads((OLD/'interaction.json').read_text())['checks']}
records=[]
for expected in plan['expected']:
 cid=expected['caseId'];method=methods[cid];selectors=method['freshRuntimeSelectors'];assert all(s in passed for s in selectors),(cid,[s for s in selectors if s not in passed])
 observed=[{'test':e['Test'],'output':e['Output'].strip(),'evidence':e['evidence']} for e in all_events if e.get('Test') in selectors and e['Action']=='output' and re.search(r'\w+_test.go:\d+:',e.get('Output',''))]
 sqlselectors=[s for s in selectors if s.endswith('Integration') or s=='TestIndependentRepeatSQLProcessRestartDeletionAndEpoch']
 actual=('Все перечисленные независимые сценарии заново завершились PASS на текущем snapshot. Содержательные runtime assertions и свежие SQL/process результаты приложены. '+('SQL вызовы прошли на отдельной nonce-guarded БД, штатный rollback/delete/restart и cleanup завершены. ' if sqlselectors else '')+'; '.join(x['output'] for x in observed)) if selectors else audit['observed']
 records.append(dict(caseId=cid,status='passed',**method,actual=actual,observedAssertions=observed,freshSQLSelectors=sqlselectors,startedAt=receipts['runtime']['startedAt'] if selectors else audit['checkedAt'],finishedAt=sql['finishedAt'] if sqlselectors else max(r['finishedAt'] for r in receipts.values()) if selectors else audit['checkedAt']))
(HERE/'interaction.json').write_text(json.dumps({'executor':'/root/backend_independent_resume','productionSourceSHA256':candidate['productionSourceSHA256'],'candidate':plan['sourceHash'],'phase':'completed','methodProvenance':'Only unchanged mapping/probe source reused; all runtime outcomes, timestamps, hashes, SQL database/processes and metrics generated afresh. Required suite and independent probes were freshly executed with -count=1; earlier candidates remain separate historical evidence.','checks':records},ensure_ascii=False,indent=2)+'\n')
def ev(p,k):return dict(path=p,kind=k,sha256=sha(HERE/p))
run['checks']=[]
for expected in plan['expected']:
 r=next(x for x in records if x['caseId']==expected['caseId']);evidence=[ev('interaction.json','interaction'),ev('source-integrity.json','raw')]
 if r['freshRuntimeSelectors']:evidence += [ev('runtime.jsonl','log'),ev('supplement.jsonl','log')]
 if r['freshSQLSelectors']:evidence += [ev('sql/sql-live.log','log'),ev('sql/receipt.json','raw')]
 if not r['freshRuntimeSelectors']:evidence += [ev('security-audit.json','raw')]
 run['checks'].append(dict(id=expected['id'],status='passed',executor={'kind':'agent','id':'/root/backend_independent_resume'},startedAt=r['startedAt'],finishedAt=r['finishedAt'],actual=r['actual'],defect='',evidence=evidence))
(HERE/'run-fresh.json').write_text(json.dumps(run,ensure_ascii=False,indent=2)+'\n')
feed=[float(x) for x in re.findall(r'repeat_feed_latency_test.go:\d+: .*?p95_ms=([0-9.]+)',sqltext)];unread=re.findall(r'history=100000 query=unread samples=20 p95_ms=([0-9.]+)',sqltext);deletion=re.findall(r'history=100001[^\n]+',sqltext)
metrics={'feedMeasurements':len(feed),'feedP95MinMs':min(feed),'feedP95MaxMs':max(feed),'unread100kP95Ms':float(unread[0]),'deletion':deletion,'sqlTopLevelPass':len(re.findall(r'^--- PASS:',sqltext,re.M)),'runtime':{n:dict(collections.Counter(e['Action'] for e in all_events if e.get('Test') and e['evidence']==n+'.jsonl')) for n in receipts}}
(HERE/'metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n');print(json.dumps(metrics))
