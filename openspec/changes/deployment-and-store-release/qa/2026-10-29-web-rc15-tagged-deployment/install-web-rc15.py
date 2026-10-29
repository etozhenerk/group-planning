#!/usr/bin/env python3
"""Одноразовая установка опубликованного web rc15 с разрешением владельца."""
import argparse
import fcntl
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'verifier'))
from common import digest, verify
from web_identity import build_info
from web_rc15_exception import BASELINE, TREES

TAG = 'web/v0.1.0-rc.15'
VERSION = '0.1.0-rc.15'
COMMIT = 'dd9ab2863439e872e716bc1ba811578e5c8cbf07'
RUN_ID = 40906556659
TARGET = '158.160.246.254'
REPOSITORY = 'etozhenerk/group-planning'
PREVIOUS = Path('/opt/somewhere/web/releases/0.1.0-rc.14')
BACKEND = Path('/opt/somewhere/backend/releases/0.1.0-rc.6')
BASE = Path('/opt/somewhere/web')
DESTINATION = BASE / 'releases' / VERSION
FILES = {'web.tar.gz', 'manifest.json', 'SHA256SUMS'}
CHECKS = ['release-tooling-tests', 'web-static-and-unit', 'web-browser',
          'artifact-build', 'web-release-browser-identity']
AUTHORIZATION = {
    'source': 'direct-user-messages-2026-10-29',
    'answer': 'просто запуасти, я все окаю; дизайн ок; отметь дизайн ок',
    'recordedAt': '2026-10-29T15:52:33Z',
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    require(path.is_file() and not path.is_symlink(), f'Regular JSON required: {path.name}')
    return json.loads(path.read_text())


def hex_value(value, length):
    return isinstance(value, str) and re.fullmatch(f'[0-9a-f]{{{length}}}', value) is not None


def positive(value):
    return type(value) is int and value > 0


def validate_archive(path):
    seen = set()
    with tarfile.open(path, 'r:gz') as archive:
        for entry in archive.getmembers():
            name = PurePosixPath(entry.name)
            require(not name.is_absolute() and '..' not in name.parts and
                    (entry.isfile() or entry.isdir()) and not entry.mode & 0o7000,
                    'Unsafe archive member or permissions')
            normalized = str(name)
            require(normalized not in seen, 'Duplicate archive member')
            seen.add(normalized)
            require(normalized not in {'acceptance.json', 'owner-exception.json',
                                       'release-manifest.json', 'deployment-provenance'},
                    'Archive collides with deployment provenance')
        require('index.html' in seen and 'build-info.json' in seen, 'Missing runtime files')


def verify_inputs(directory, approval):
    owner = read_json(approval)
    require(owner.get('schemaVersion') == 1 and
            owner.get('kind') == 'single-release-owner-exception' and
            owner.get('acceptanceStatus') == 'incomplete' and
            owner.get('tag') == TAG and owner.get('version') == VERSION and
            owner.get('sourceCommit') == COMMIT and owner.get('targetHost') == TARGET and
            owner.get('previousWeb') == str(PREVIOUS) and
            owner.get('requiredBackend') == str(BACKEND) and
            owner.get('authorization') == AUTHORIZATION and
            owner.get('scope') == ['design:ready', 'full-manual-acceptance'],
            'Owner exception does not match the fixed one-release scope')
    publication = owner.get('publication', {})
    require(positive(publication.get('releaseId')) and
            hex_value(publication.get('annotatedTagObject'), 40) and
            publication.get('workflowRunId') == RUN_ID,
            'Publication placeholders must be filled after successful CI and publication')
    pins = publication.get('files', {})
    require(set(pins) == FILES, 'Exact three published asset pins are required')
    for name, pin in pins.items():
        require(hex_value(pin.get('sha256'), 64) and positive(pin.get('size')) and
                positive(pin.get('assetId')), f'Unfilled published asset pin: {name}')
    require(directory.is_dir() and not directory.is_symlink(), 'Regular artifact directory required')
    require({p.name for p in directory.iterdir()} == FILES, 'Expected exactly three published files')
    for name, pin in pins.items():
        path = directory / name
        require(path.is_file() and not path.is_symlink() and
                path.stat().st_size == pin['size'] and digest(path) == pin['sha256'],
                f'Published bytes mismatch: {name}')
    manifest = verify(directory)
    require(manifest['component'] == 'web' and manifest['version'] == VERSION and
            manifest['tag'] == TAG and manifest['commit'] == COMMIT and
            manifest['checks'] == CHECKS, 'Unexpected candidate or mandatory CI checks')
    exception = manifest.get('owner_exception', {})
    require(exception.get('kind') == 'single-release-owner-exception' and
            exception.get('status') == 'incomplete' and exception.get('tag') == TAG and
            exception.get('scope') == owner['scope'] and
            exception.get('authorization') == AUTHORIZATION and
            exception.get('product_source') == {'baseline': BASELINE, 'trees': TREES},
            'Published owner exception provenance differs')
    evidence = approval.parent
    release = read_json(evidence / 'published-release.json')
    require(release.get('id') == publication['releaseId'] and release.get('tag_name') == TAG and
            release.get('draft') is False and release.get('prerelease') is True and
            bool(release.get('published_at')) and
            release.get('url') == f'https://api.github.com/repos/{REPOSITORY}/releases/{release["id"]}',
            'GitHub release snapshot is not the published candidate')
    assets = release.get('assets', [])
    require(len(assets) == 3 and {a.get('name') for a in assets} == FILES,
            'Published release must contain exactly three assets')
    for asset in assets:
        pin = pins[asset['name']]
        require(asset.get('id') == pin['assetId'] and asset.get('size') == pin['size'] and
                asset.get('state') == 'uploaded' and asset.get('digest') == 'sha256:' + pin['sha256'] and
                asset.get('url') == f'https://api.github.com/repos/{REPOSITORY}/releases/assets/{pin["assetId"]}',
                'GitHub asset snapshot differs from pinned bytes')
    tag = read_json(evidence / 'published-tag.json')
    require(tag.get('sha') == publication['annotatedTagObject'] and tag.get('tag') == TAG and
            tag.get('object', {}).get('type') == 'commit' and
            tag['object'].get('sha') == COMMIT and json.loads(tag.get('message', 'null')) == manifest['release_plan'],
            'Annotated GitHub tag/source/card mismatch')
    workflow = read_json(evidence / 'published-workflow-run.json')
    require(workflow.get('id') == RUN_ID and workflow.get('head_sha') == COMMIT and
            workflow.get('status') == 'completed' and workflow.get('conclusion') == 'success' and
            workflow.get('repository', {}).get('full_name') == REPOSITORY and
            workflow.get('path') == '.github/workflows/releases.yaml' and
            workflow.get('run_number') == manifest['build_number'],
            'Exact release workflow has not completed successfully')
    validate_archive(directory / 'web.tar.gz')
    return manifest, owner


def run(*args):
    subprocess.run(args, check=True)


def ready():
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for _ in range(30):
        try:
            with opener.open('http://127.0.0.1:8080/readyz', timeout=2) as response:
                if response.status == 200:
                    return
        except OSError:
            pass
        time.sleep(1)
    raise RuntimeError('Backend readiness failed')


def host_preflight():
    require(os.geteuid() == 0, 'Activation requires root on the pinned target host')
    link = BASE / 'current'
    require(link.is_symlink() and link.resolve(strict=True) == PREVIOUS and
            PREVIOUS.is_dir() and not PREVIOUS.is_symlink() and (PREVIOUS / 'index.html').is_file(),
            'Current web must be the existing immutable rc14 rollback directory')
    backend = Path('/opt/somewhere/backend/current')
    require(backend.is_symlink() and backend.resolve(strict=True) == BACKEND and
            BACKEND.is_dir() and not BACKEND.is_symlink(), 'Current backend must be rc6')
    meta = read_json(BACKEND / 'release-manifest.json')
    require(meta.get('component') == 'backend' and meta.get('version') == '0.1.0-rc.6' and
            meta.get('tag') == 'backend/v0.1.0-rc.6', 'Installed backend identity differs')
    require(Path('/etc/systemd/system/somewhere.service').is_file(), 'Service unit is required')
    require(not DESTINATION.exists() and not DESTINATION.is_symlink(), 'Immutable rc15 already exists')
    run('systemctl', 'is-active', '--quiet', 'somewhere.service')
    ready()


def switch(target):
    temporary = BASE / 'current.owner-rc15.next'
    require(not temporary.exists() and not temporary.is_symlink(), 'Pending switch exists; inspect it')
    temporary.symlink_to(target)
    temporary.replace(BASE / 'current')


def activate_web(manifest):
    try:
        switch(DESTINATION)
        run('systemctl', 'enable', 'somewhere.service')
        run('systemctl', 'restart', 'somewhere.service')
        ready()
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open('http://127.0.0.1:8080/build-info.json', timeout=5) as response:
            require(response.status == 200 and json.load(response) == build_info(manifest),
                    'Served web identity differs from published rc15')
    except BaseException as failure:
        try:
            switch(PREVIOUS)
            run('systemctl', 'restart', 'somewhere.service')
            ready()
        except BaseException as rollback_failure:
            raise RuntimeError('rc15 activation failed; rc14 rollback/readiness also failed; inspect service') from rollback_failure
        raise RuntimeError('rc15 activation failed; rc14 restored and readiness passed; rc15 directory retained') from failure


def deploy(directory, approval, manifest):
    host_preflight()
    with (BASE / '.owner-rc15-deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        host_preflight()
        # Revalidate copied bytes before any release-directory mutation.
        verify_inputs(directory, approval)
        with tempfile.TemporaryDirectory(dir=BASE / 'releases', prefix='.stage-rc15-') as temporary:
            stage = Path(temporary)
            with tarfile.open(directory / 'web.tar.gz', 'r:gz') as archive:
                archive.extractall(stage, filter='data')
            require((stage / 'index.html').is_file() and (stage / 'build-info.json').is_file(),
                    'Missing extracted runtime files')
            shutil.copyfile(directory / 'manifest.json', stage / 'release-manifest.json')
            shutil.copyfile(approval, stage / 'owner-exception.json')
            provenance = stage / 'deployment-provenance'
            provenance.mkdir()
            for name in ('published-release.json', 'published-tag.json', 'published-workflow-run.json'):
                shutil.copyfile(approval.parent / name, provenance / name)
            stage.chmod(0o755)
            stage.rename(DESTINATION)
        activate_web(manifest)
    print(f'Installed {TAG} at {COMMIT}; owner exception recorded; acceptance remains incomplete')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path, help='Exactly three original GitHub release assets')
    parser.add_argument('--owner-exception', type=Path, default=ROOT / 'owner-exception.json')
    parser.add_argument('--activate', action='store_true', help='Run ONLY on 158.160.246.254 via pinned SSH')
    args = parser.parse_args()
    manifest, _ = verify_inputs(args.directory.absolute(), args.owner_exception.absolute())
    if args.activate:
        deploy(args.directory.absolute(), args.owner_exception.absolute(), manifest)
    else:
        print(f'Verified published {TAG} at {COMMIT}; no host operations performed')
