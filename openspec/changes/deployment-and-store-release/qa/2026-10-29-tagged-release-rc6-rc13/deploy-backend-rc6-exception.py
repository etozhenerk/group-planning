#!/usr/bin/env python3
"""One exact published backend; separate owner exception, never a QA receipt."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request

HOST = '158.160.246.254'
COMMIT = '46cb9f2281489ebf8430a31b8e09f9319ce62a60'
VERSION = '0.1.0-rc.6'
TAG = 'backend/v' + VERSION
BASE = Path('/opt/somewhere/backend')
PREVIOUS = BASE / 'releases/0.1.0-rc.5'
DESTINATION = BASE / 'releases' / VERSION
UNIT = Path('/etc/systemd/system/somewhere.service')
PREVIOUS_MANIFEST = 'e870d84d45b33267f80ede7d45029f1e7dc19034beb6fe90f631bf428ed36abd'
HELPER_HASH = '857fbfe649d54229a0266af7bf511071b03ad25547311b3f870ea882cae9d845'
FILES = {
    'backend-linux-amd64.tar.gz': '4f13ad664a04b3a962a98fc3d943f2377dd03d6191fd8edc1dc4affc02d31cd5',
    'manifest.json': '8b3b2d66d788e2a06855ab2be28713fd7dcf99272f71e4433c76fae93336f425',
    'SHA256SUMS': 'b5df421d342c075146e92c3ab36691fb5b1f7a37f8872c151b0addc8edc6cd5e',
}
SCHEMA = tuple(enumerate([
    '809f8ae09d173ee636c10db5e3bafa8cb0be8583a567ce4765b954b28f06af0e',
    '8e17fc821729556a84df58d743417f04120869a23a364a4a54b54baa836527a2',
    '6a670a2eea9a0aa87af1b6ccd40bba4ab007de13e18ab4d020633b6467df61da',
    '7c5cdad7964c45a5c00861c6032ece5031baf120b9e5e8a8f9f478677cde2971',
    '12494054bbcc22cb9a65b9448d0845e712e1ac79a38874a877c2a8eee7284a5c',
    '4c5ccdc392c4ee93eef7eec050fa1809f1fb81f9a4d9631435cb7027fd1c3777',
    '6b1160c824930a4116d1ee7da6b74b0546b8e63a586be15714c1b5141bae6855',
    '7ee5425d0606c94f97a9a1365d325392aeab3b840fb0de1401d534be1c605216',
], 1))


def digest(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError('Expected regular file: ' + str(path))
    return hashlib.sha256(path.read_bytes()).hexdigest()


def helper():
    path = Path(__file__).with_name('host-deploy-reviewed.py')
    if digest(path) != HELPER_HASH:
        raise ValueError('Reviewed host deployment helper changed')
    spec = importlib.util.spec_from_file_location('reviewed_host_deploy', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify(directory, audit_path, approved):
    if directory.is_symlink() or {p.name for p in directory.iterdir()} != set(FILES):
        raise ValueError('Expected exactly the three published files')
    for name, expected in FILES.items():
        if digest(directory / name) != expected:
            raise ValueError('Published file checksum mismatch: ' + name)
    manifest = json.loads((directory / 'manifest.json').read_text())
    if (manifest['component'], manifest['version'], manifest['tag'], manifest['commit']) != ('backend', VERSION, TAG, COMMIT):
        raise ValueError('Candidate identity mismatch')
    archive = directory / 'backend-linux-amd64.tar.gz'
    if manifest['artifacts'] != [{'name': archive.name, 'size': archive.stat().st_size, 'sha256': FILES[archive.name]}]:
        raise ValueError('Manifest artifact identity mismatch')
    sums = dict(line.split('  ', 1)[::-1] for line in (directory / 'SHA256SUMS').read_text().splitlines())
    if sums != {name: FILES[name] for name in ('backend-linux-amd64.tar.gz', 'manifest.json')}:
        raise ValueError('Invalid SHA256SUMS set')
    digest(audit_path)
    audit = json.loads(audit_path.read_text())
    expected = {
        'schemaVersion': 1, 'kind': 'one-time-owner-exception', 'fullAcceptance': 'incomplete',
        'targetHost': HOST, 'targetName': 'somewhere-mvp', 'component': 'backend', 'tag': TAG,
        'commit': COMMIT, 'files': FILES, 'previousRelease': str(PREVIOUS),
        'expectedSchemaVersions': list(range(1, 9)),
        'scope': {'activatePublishedBackendOnly': True, 'databaseSchemaChanges': False,
                  'configurationChanges': False, 'webChanges': False, 'telegramActions': False},
    }
    if any(audit.get(key) != value for key, value in expected.items()):
        raise ValueError('Owner exception scope or artifact mismatch')
    approval = audit.get('approval', {})
    if approved:
        if approval.get('status') != 'approved' or not isinstance(approval.get('userMessage'), str) or not approval['userMessage'].strip():
            raise ValueError('Owner approval is pending: refusing all production mutations')
        recorded = datetime.fromisoformat(approval.get('recordedAt', '').replace('Z', '+00:00'))
        if recorded.tzinfo is None or recorded > datetime.now(timezone.utc):
            raise ValueError('Invalid recorded approval time')
    elif approval.get('status') not in ('pending', 'approved'):
        raise ValueError('Unknown approval status')
    with tarfile.open(archive) as tar:
        seen = set()
        size = 0
        for entry in tar.getmembers():
            path = PurePosixPath(entry.name)
            if path.is_absolute() or '..' in path.parts or not path.parts or str(path) in seen:
                raise ValueError('Unsafe or duplicate archive path')
            if not (entry.isfile() or entry.isdir()) or entry.mode & 0o7000:
                raise ValueError('Unsafe archive member type or privileges')
            seen.add(str(path))
            size += entry.size
        if size > 512 * 1024 * 1024 or not {'somewhere-api', 'somewhere-migrate', 'somewhere.service'}.issubset(seen):
            raise ValueError('Unexpected expanded archive contents')
    helper()
    return audit


def exact_schema(host):
    if host.schema_identity() != (True, SCHEMA):
        raise ValueError('Schema differs from the reviewed eight migrations; refusing activation/rollback')


def health():
    for path in ('healthz', 'readyz'):
        with urllib.request.urlopen('http://127.0.0.1:8080/' + path, timeout=5) as response:
            if response.status != 200:
                raise RuntimeError('API smoke failed: ' + path)


def activate(directory, audit_path):
    audit = verify(directory, audit_path, True)  # Approval check precedes every host mutation.
    if os.geteuid() != 0:
        raise ValueError('Activation requires root on the explicitly authorized VM')
    host = helper()
    link = BASE / 'current'
    if not link.is_symlink() or link.resolve() != PREVIOUS or digest(PREVIOUS / 'release-manifest.json') != PREVIOUS_MANIFEST:
        raise ValueError('Previous release changed; prepare a new reviewed plan')
    if DESTINATION.exists() or DESTINATION.is_symlink():
        raise ValueError('Immutable release destination already exists')
    exact_schema(host)
    health()
    if shutil.disk_usage(BASE).free < 3 * 1024 * 1024 * 1024:
        raise ValueError('Insufficient free space for release plus bounded album archives')
    web = str(Path('/opt/somewhere/web/current').resolve())
    previous_unit = UNIT.read_bytes()
    state = {'previous': str(PREVIOUS), 'previousManifest': PREVIOUS_MANIFEST,
             'previousBinary': digest(PREVIOUS / 'somewhere-api'),
             'previousUnit': hashlib.sha256(previous_unit).hexdigest(), 'web': web}
    with tempfile.TemporaryDirectory(dir=BASE / 'releases', prefix='.rc6-stage-') as temporary:
        stage = Path(temporary)
        with tarfile.open(directory / 'backend-linux-amd64.tar.gz') as tar:
            tar.extractall(stage, filter='data')
        shutil.copyfile(directory / 'manifest.json', stage / 'release-manifest.json')
        (stage / 'owner-exception.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
        (stage / 'rollback-state.json').write_text(json.dumps(state, indent=2) + '\n')
        (stage / 'rollback-unit.service').write_bytes(previous_unit)
        stage.chmod(0o755)
        stage.rename(DESTINATION)
    # The reviewed helper stops the writer before the idempotent migrator and
    # returns the previous symlink/unit only when before/after schema is equal.
    host.activate_backend(DESTINATION, link, UNIT)
    exact_schema(host)
    health()
    if str(Path('/opt/somewhere/web/current').resolve()) != web:
        raise RuntimeError('Concurrent web release detected; inspect both components')
    result = {'status': 'deployed_with_owner_exception', 'fullAcceptance': 'incomplete',
              'targetHost': HOST, 'tag': TAG, 'commit': COMMIT,
              'manifestHash': FILES['manifest.json'], 'previous': str(PREVIOUS),
              'schemaUnchanged': True, 'webUnchanged': True, 'healthz': 200, 'readyz': 200}
    (DESTINATION / 'owner-deployment-result.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


def rollback(directory, audit_path):
    verify(directory, audit_path, True)
    if os.geteuid() != 0:
        raise ValueError('Rollback requires root on the authorized VM')
    host = helper()
    link = BASE / 'current'
    if not link.is_symlink() or link.resolve() != DESTINATION or digest(DESTINATION / 'release-manifest.json') != FILES['manifest.json']:
        raise ValueError('Current release is not the exact rc6 candidate')
    state = json.loads((DESTINATION / 'rollback-state.json').read_text())
    if (state['previous'] != str(PREVIOUS) or digest(PREVIOUS / 'release-manifest.json') != PREVIOUS_MANIFEST
            or digest(PREVIOUS / 'somewhere-api') != state['previousBinary']
            or digest(DESTINATION / 'rollback-unit.service') != state['previousUnit']):
        raise ValueError('Rollback source changed')
    exact_schema(host)
    host.run('systemctl', 'stop', 'somewhere.service')
    exact_schema(host)  # No old runtime is restarted if schema is unknown/changed.
    shutil.copyfile(DESTINATION / 'rollback-unit.service', UNIT)
    host.run('systemctl', 'daemon-reload')
    host.switch(link, PREVIOUS)
    host.run('systemctl', 'start', 'somewhere.service')
    host.ready()
    health()
    print(json.dumps({'status': 'rolled_back', 'current': str(PREVIOUS), 'schemaUnchanged': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['verify', 'activate', 'rollback'])
    parser.add_argument('--directory', required=True, type=Path)
    parser.add_argument('--exception', required=True, type=Path)
    parser.add_argument('--target-host', required=True, choices=[HOST])
    args = parser.parse_args()
    if args.mode == 'verify':
        audit = verify(args.directory, args.exception, False)
        print(json.dumps({'artifactVerified': True, 'approval': audit['approval']['status'],
                          'productionMutation': False, 'fullAcceptance': 'incomplete'}))
    elif args.mode == 'activate':
        activate(args.directory, args.exception)
    else:
        rollback(args.directory, args.exception)
