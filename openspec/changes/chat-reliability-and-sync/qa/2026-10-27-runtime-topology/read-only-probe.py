import subprocess,json,pathlib,hashlib,datetime

def cmd(*args):
 p=subprocess.run(args,text=True,capture_output=True,timeout=20)
 return {'exitCode':p.returncode,'stdout':p.stdout.strip(),'stderr':p.stderr.strip()}
result={'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
result['service']=cmd('systemctl','show','somewhere.service','-p','ActiveState','-p','SubState','-p','MainPID','-p','NRestarts','-p','FragmentPath')
result['backendRelease']=cmd('readlink','-f','/opt/somewhere/backend/current')
result['backupTimer']=cmd('systemctl','show','somewhere-backup.timer','-p','ActiveState','-p','LastTriggerUSec','-p','NextElapseUSecRealtime')
result['backupLastRun']=cmd('systemctl','show','somewhere-backup.service','-p','Result','-p','ExecMainStatus','-p','ExecMainExitTimestamp')
p=pathlib.Path('/var/lib/somewhere-backup/latest.json')
if p.exists():
 x=json.loads(p.read_text()); result['backupManifest']={k:x[k] for k in ['completed_at','sha256'] if k in x}
for k,path in [('backupScript','/usr/local/lib/somewhere/backup.py'),('deployer','/usr/local/lib/somewhere/deploy-release.py')]:
 p=pathlib.Path(path); result[k]={'exists':p.exists(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None}
c=pathlib.Path('/etc/caddy/Caddyfile').read_text()
result['caddyProxyTargets']=[line.strip() for line in c.splitlines() if 'reverse_proxy ' in line]
result['tcpListeners']=cmd('ss','-ltn')
result['disk']=cmd('lsblk','-o','NAME,TYPE,FSTYPE,MOUNTPOINTS','--json')
result['dbConfig']=cmd('sudo','-u','postgres','psql','-XAt','-d','somewhere','-c',"SELECT name||'='||setting FROM pg_settings WHERE name IN ('listen_addresses','ssl'); SELECT rolname||':super='||rolsuper||',createdb='||rolcreatedb||',createrole='||rolcreaterole FROM pg_roles WHERE rolname IN ('somewhere','somewhere_migrator');")
result['readiness']=cmd('curl','--fail','--silent','--show-error','--max-time','10','http://127.0.0.1:8080/readyz')
print(json.dumps(result,indent=2))

