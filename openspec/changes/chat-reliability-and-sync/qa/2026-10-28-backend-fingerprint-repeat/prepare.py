import datetime
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path('/Users/misha/Documents/Codex/projects/group-planning')
HERE = Path(__file__).resolve().parent
SNAPSHOT = Path('/tmp/somewhere-backend-fingerprint-20261028')
assert not SNAPSHOT.exists(), 'Use a fresh snapshot; never replace a previous result'
claimed = json.loads((ROOT/'openspec/changes/chat-reliability-and-sync/qa/sql-cleanup-20261028/production-source.json').read_text())
for item in claimed['files']:
    assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']
files = set(subprocess.check_output(['git','ls-files','backend','contracts'],cwd=ROOT,text=True).splitlines())
files.update(['backend/internal/httpapi/cross_platform_provider_test.go','backend/internal/storage/postgres/account_removal_feed.go','backend/internal/storage/postgres/account_removal_feed_test.go'])
for asset in (ROOT/'openspec/changes/meeting-experience-refresh/assets').iterdir():
    if asset.is_file() and asset.suffix in ('.png','.svg','.jpg','.jpeg','.webp'):
        files.add(str(asset.relative_to(ROOT)))
original = []
for name in sorted(files):
    src,dst=ROOT/name,SNAPSHOT/name
    assert not src.is_symlink(), name
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
    original.append({'path':name,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()})
probes=[]
source=ROOT/'openspec/changes/chat-reliability-and-sync/qa/2026-10-28-backend-b973-final/independent/probes'
for src in sorted(source.glob('*.go')):
    package=re.match(r'package (\w+)',src.read_text())[1]
    destpkg={'meetings_test':'meetings','httpapi':'httpapi','postgres':'storage/postgres','memory':'storage/memory','realtime':'realtime'}[package]
    dst=SNAPSHOT/'backend/internal'/destpkg/src.name
    assert not dst.exists(), str(dst)
    shutil.copy2(src,dst)
    saved=HERE/'probes'/src.name
    saved.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,saved)
    probes.append({'path':str(dst.relative_to(SNAPSHOT)),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'evidence':str(saved.relative_to(HERE))})
metadata={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'snapshot':str(SNAPSHOT),'baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'productionSourceSHA256':claimed['sourceSHA256'],'productionInputs':claimed['count'],'productionParity':'all listed production files matched MAIN before copying','originalFiles':original,'probes':probes}
(HERE/'candidate.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
(HERE/'production-source.json').write_text(json.dumps(claimed,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in metadata.items() if k not in ('originalFiles','probes')}))
