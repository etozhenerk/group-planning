import datetime, hashlib, json, os, re, secrets, subprocess, time
from pathlib import Path

root = Path('/Users/misha/Documents/Codex/projects/group-planning')
private = root/'infra/local/sdd-restore-20261101'
private.mkdir(mode=0o700, exist_ok=True)
os.umask(0o077)
backup = root/'infra/local/sdd-restore-20261101.dump.age'
manifest = json.loads(backup.with_suffix(backup.suffix+'.json').read_text())
digest = hashlib.sha256()
with backup.open('rb') as stream:
    for chunk in iter(lambda: stream.read(1024*1024), b''):
        digest.update(chunk)
assert digest.hexdigest() == manifest['sha256']
ssh = ['ssh','-i',str(root/'infra/local/somewhere-admin'),'-o','IdentitiesOnly=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(root/'infra/local/known_hosts'),'-o','BatchMode=yes','-o','ConnectTimeout=10','somewhere-admin@158.160.246.254']
name = 'somewhere_restore_sdd_1101_'+secrets.token_hex(4)
marker = 'somewhere_sdd_restore_20261101_'+secrets.token_hex(8)
assert re.fullmatch('[a-z0-9_]+',name) and name != 'somewhere'
receipt = {'database':name,'marker':marker,'backup':manifest,'encrypted_bytes':backup.stat().st_size,'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'steps':[]}
(private/'resource.json').write_text(json.dumps(receipt,indent=2)+'\n')
start = time.monotonic()
def remote(script,label):
    result = subprocess.run(ssh+['bash','-s'], input=script, text=True, capture_output=True, timeout=120)
    (private/(label+'.stdout')).write_text(result.stdout)
    (private/(label+'.stderr')).write_text(result.stderr)
    receipt['steps'].append({'id':label,'exit':result.returncode})
    if result.returncode: raise RuntimeError(label+' failed; private raw retained')
    return result.stdout

def guard():
    return f'''actual=$(sudo -n -u postgres psql -X -At -d postgres -c "SELECT datname||'|'||pg_get_userbyid(datdba)||'|'||coalesce(shobj_description(oid,'pg_database'),'') FROM pg_database WHERE datname='{name}'")
[ "$actual" = '{name}|somewhere_migrator|{marker}' ] || exit 73
'''
created=False
try:
    remote(f'''set -eu
free=$(df -B1 --output=avail /var/lib/postgresql | tail -1)
[ "$free" -gt 1073741824 ] || exit 71
exists=$(sudo -n -u postgres psql -X -At -d postgres -c "SELECT count(*) FROM pg_database WHERE datname='{name}'")
[ "$exists" = 0 ] || exit 72
systemctl show somewhere.service caddy.service postgresql@16-main.service -p Id -p ActiveState -p SubState -p NRestarts -p MainPID
sudo -n -u postgres createdb -T template0 -O somewhere_migrator '{name}'
sudo -n -u postgres psql -X -v ON_ERROR_STOP=1 -d postgres -c "COMMENT ON DATABASE {name} IS '{marker}'" -c "REVOKE CONNECT ON DATABASE {name} FROM PUBLIC" -c "GRANT CONNECT ON DATABASE {name} TO somewhere,somewhere_migrator"
''','create')
    created=True
    remote('set -eu\n'+guard(),'guard-before-restore')
    with (private/'decrypt.stderr').open('wb') as decrypt_error, (private/'restore.stdout').open('wb') as restore_out, (private/'restore.stderr').open('wb') as restore_error:
        decrypt = subprocess.Popen([str(root/'.cache/deploy-tools/age/age'),'--decrypt','-i',str(root/'infra/local/backup.agekey'),str(backup)],stdout=subprocess.PIPE,stderr=decrypt_error)
        restore = subprocess.Popen(ssh+[f"sudo -n -u postgres pg_restore --exit-on-error --dbname={name}"],stdin=decrypt.stdout,stdout=restore_out,stderr=restore_error)
        decrypt.stdout.close()
        restored = restore.wait(timeout=120)
        decrypted = decrypt.wait(timeout=30)
    receipt['steps'].append({'id':'decrypt-pipe-restore','decrypt_exit':decrypted,'restore_exit':restored,'plaintext_file_created':False,'key_transferred':False})
    if decrypted or restored: raise RuntimeError('decrypt/restore failed; private raw retained')
    remote('set -eu\n'+guard(),'guard-after-restore')
    inventory = '''import hashlib,json,subprocess

def query(db,sql):
    return subprocess.check_output(['sudo','-n','-u','postgres','psql','-X','-At','-v','ON_ERROR_STOP=1','-d',db,'-c',sql],text=True).strip()
result={}
for db in (RESTORE_DATABASE,'somewhere'):
    tables=query(db,"SELECT schemaname||'.'||tablename FROM pg_tables WHERE schemaname NOT LIKE 'pg_%' AND schemaname<>'information_schema' ORDER BY 1").splitlines()
    data={}
    for table in tables:
        assert all(part.replace('_','').isalnum() for part in table.split('.'))
        sql="SET statement_timeout='10s';SET default_transaction_read_only=on;SELECT count(*)::text||'|'||md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY md5(row_to_json(t)::text)),'')) FROM "+table+' t'
        raw=query(db,sql).splitlines()[-1].split('|')
        data[table]={'rows':int(raw[0]),'digest':raw[1]}
    result[db]={'tables':data,'unvalidated_foreign_keys':int(query(db,"SELECT count(*) FROM pg_constraint WHERE contype='f' AND NOT convalidated")),'runtime_migration_write':query(db,"SELECT has_table_privilege('somewhere','public.schema_migrations','INSERT,UPDATE,DELETE')"),'role_flags':query(db,"SELECT rolname||'|'||rolsuper||'|'||rolcreatedb FROM pg_roles WHERE rolname IN ('somewhere','somewhere_migrator') ORDER BY rolname"),'migration_checksums':query(db,"SELECT version::text||'|'||checksum FROM schema_migrations ORDER BY version").splitlines(),'runtime_table_acl':query(db,"SELECT schemaname||'.'||tablename||'|'||tableowner||'|'||has_table_privilege('somewhere',quote_ident(schemaname)||'.'||quote_ident(tablename),'SELECT') FROM pg_tables WHERE schemaname NOT LIKE 'pg_%' AND schemaname<>'information_schema' ORDER BY 1").splitlines()}
print(json.dumps(result,sort_keys=True))
'''.replace('RESTORE_DATABASE',repr(name))
    output = remote("set -eu\n"+guard()+"python3 - <<'PY_REMOTE'\n"+inventory+'\nPY_REMOTE\n','inventory')
    observed=json.loads(output)
    restored=observed[name]; live=observed['somewhere']
    receipt['verification']={'restored':restored,'live':live,'equal_table_hashes':[t for t,v in restored['tables'].items() if live['tables'].get(t)==v],'changed_since_backup':[t for t,v in restored['tables'].items() if live['tables'].get(t)!=v]}
    assert restored['unvalidated_foreign_keys']==0
    assert restored['migration_checksums']==live['migration_checksums']
    assert restored['runtime_migration_write']=='f'
    receipt['restore_verified_at']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    receipt['restore_and_verify_seconds']=round(time.monotonic()-start,3)
    receipt['backup_age_seconds_at_start']=round(datetime.datetime.fromisoformat(receipt['started_at']).timestamp()-manifest['completed_at'],3)
finally:
    if created:
        try:
            remote('set -eu\n'+guard()+f"sudo -n -u somewhere_migrator dropdb --maintenance-db=postgres '{name}'\nsudo -n -u postgres psql -X -At -d postgres -c \"SELECT 'remaining_own_restore_db='||count(*) FROM pg_database WHERE datname='{name}'\"\nsystemctl show somewhere.service caddy.service postgresql@16-main.service -p Id -p ActiveState -p SubState -p NRestarts -p MainPID\ncurl -fsS --max-time 10 https://smwhere.ru/healthz\ncurl -fsS --max-time 10 https://smwhere.ru/readyz\n",'cleanup')
            receipt['cleanup']='passed'
        except Exception:
            receipt['cleanup']='blocked; private raw retained'
            raise
        finally:
            (private/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    else:
        (private/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'restore_verified': 'verification' in receipt,'cleanup':receipt.get('cleanup'),'seconds':receipt.get('restore_and_verify_seconds'),'equal_tables':len(receipt.get('verification',{}).get('equal_table_hashes',[])),'changed_tables':receipt.get('verification',{}).get('changed_since_backup',[])},ensure_ascii=False))
