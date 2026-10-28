import datetime,hashlib,json,os,pathlib,subprocess
ROOT=pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning');HERE=pathlib.Path(__file__).resolve().parent;OLD=HERE.parent/'2026-10-28-backend-independent-resume';SNAPSHOT=pathlib.Path('/tmp/somewhere-backend-fingerprint-20261028');GO='/Users/misha/.local/share/somewhere/go-1.27.2/bin/go'
env=dict(os.environ,GOMAXPROCS='1',GOFLAGS='-p=1',GOCACHE='/tmp/chat-bounded-go-cache');now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
for name in ['runtime','supplement']:
 command=json.loads((OLD/(name+'-receipt.json')).read_text())['command'];started=now()
 with (HERE/(name+'.jsonl')).open('wb') as log:r=subprocess.run(command,cwd=SNAPSHOT/'backend',env=env,stdout=log,stderr=subprocess.STDOUT)
 receipt=dict(startedAt=started,finishedAt=now(),command=command,exitCode=r.returncode,logSHA256=hashlib.sha256((HERE/(name+'.jsonl')).read_bytes()).hexdigest());(HERE/(name+'-receipt.json')).write_text(json.dumps(receipt,indent=2)+'\n');print(name,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
build=[]
for filename,package in [('postgres-read.test','./internal/storage/postgres'),('repeat-realtime.test','./internal/realtime')]:
 command=[GO,'test','-c','-o',str(SNAPSHOT/filename),package];started=now();r=subprocess.run(command,cwd=SNAPSHOT/'backend',env=dict(env,GOOS='linux',GOARCH='amd64',CGO_ENABLED='0'),stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(HERE/(filename+'.build.log')).write_bytes(r.stdout)
 receipt=dict(startedAt=started,finishedAt=now(),command=command,exitCode=r.returncode,sha256=hashlib.sha256((SNAPSHOT/filename).read_bytes()).hexdigest() if not r.returncode else None);build.append(receipt)
 if r.returncode:raise SystemExit(r.returncode)
(HERE/'sql-build.json').write_text(json.dumps(build,indent=2)+'\n');(HERE/'sql').mkdir()
s=(OLD/'sql/run.py').read_text().replace('/tmp/somewhere-backend-independent-20261028','/tmp/somewhere-backend-fingerprint-20261028').replace('09720ae65f9f4f18da3b7269dcf7ac83dfcc95717c665a934883e9b533713361',build[0]['sha256']).replace('25c9a5f21949f33c60e93fdd4a5ecb69031abc93713210a9e8b8f774e22b2bff',build[1]['sha256'])
(HERE/'sql/run.py').write_text(s);(HERE/'sql/remote-check.py').write_bytes((OLD/'sql/remote-check.py').read_bytes());print('Linux binaries and guarded SQL runner ready',flush=True)
