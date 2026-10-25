#!/usr/bin/env python3
"""Установить проверенный backend/web release на подготовленной ВМ (sudo)."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile
import time
import urllib.request


def run(*args):
    subprocess.run(args, check=True)


def switch(link, target):
    temporary = link.with_name('current.next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    temporary.replace(link)


def ready():
    for _ in range(30):
        try:
            with urllib.request.urlopen('http://127.0.0.1:8080/readyz', timeout=2) as response:
                if response.status == 200:
                    return
        except OSError:
            pass
        time.sleep(1)
    raise RuntimeError('Backend readiness failed')


def deploy(directory):
    if os.geteuid() != 0:
        raise RuntimeError('Run on the VM as root')
    manifest = json.loads((directory / 'manifest.json').read_text())
    component, version = manifest['component'], manifest['version']
    if component not in ('backend', 'web') or not re.fullmatch(r'\d+\.\d+\.\d+(?:-rc\.\d+)?', version):
        raise ValueError('Unsupported release identity')
    if manifest['tag'] != f'{component}/v{version}' or not re.fullmatch(r'[0-9a-f]{40}', manifest['commit']):
        raise ValueError('Invalid manifest provenance')
    archive_name = 'backend-linux-amd64.tar.gz' if component == 'backend' else 'web.tar.gz'
    expected = {archive_name, 'manifest.json'}
    actual = set()
    for line in (directory / 'SHA256SUMS').read_text().splitlines():
        checksum, name = line.split('  ', 1)
        if name not in expected or name in actual or not re.fullmatch('[0-9a-f]{64}', checksum):
            raise ValueError('Unexpected checksum entry')
        source = directory / name
        if source.is_symlink() or hashlib.sha256(source.read_bytes()).hexdigest() != checksum:
            raise ValueError('Checksum mismatch')
        actual.add(name)
    if actual != expected:
        raise ValueError('Incomplete release')
    artifact = manifest['artifacts']
    if len(artifact) != 1 or artifact[0]['name'] != archive_name or artifact[0]['sha256'] != hashlib.sha256((directory / archive_name).read_bytes()).hexdigest():
        raise ValueError('Manifest artifact mismatch')
    base = Path('/opt/somewhere') / component
    releases = base / 'releases'
    releases.mkdir(parents=True, exist_ok=True)
    destination = releases / version
    if destination.exists():
        raise ValueError('Immutable release already installed')
    with tempfile.TemporaryDirectory(dir=releases, prefix='.stage-') as temporary:
        stage = Path(temporary)
        with tarfile.open(directory / archive_name) as archive:
            for entry in archive.getmembers():
                if entry.name.startswith('/') or '..' in Path(entry.name).parts or not (entry.isfile() or entry.isdir()):
                    raise ValueError('Unsafe archive member')
                if entry.mode & 0o7000:
                    raise ValueError('Privileged archive permissions')
            archive.extractall(stage, filter='data')
        required = ['somewhere-api', 'somewhere-migrate', 'somewhere.service'] if component == 'backend' else ['index.html']
        if any(not (stage / name).is_file() for name in required):
            raise ValueError('Missing runtime files')
        shutil.copyfile(directory / 'manifest.json', stage / 'release-manifest.json')
        stage.chmod(0o755)
        stage.rename(destination)
    if component == 'backend':
        run('sudo', '-u', 'somewhere_migrator', 'env',
            'SOMEWHERE_DATABASE_URL=host=/var/run/postgresql dbname=somewhere user=somewhere_migrator sslmode=disable',
            str(destination / 'somewhere-migrate'))
        run('sudo', '-u', 'somewhere_migrator', 'psql', '-d', 'somewhere', '-v', 'ON_ERROR_STOP=1', '-c',
            'REVOKE INSERT, UPDATE, DELETE ON schema_migrations FROM somewhere; GRANT SELECT ON schema_migrations TO somewhere;')
        shutil.copyfile(destination / 'somewhere.service', '/etc/systemd/system/somewhere.service')
        run('systemctl', 'daemon-reload')
    link = base / 'current'
    previous = link.resolve() if link.is_symlink() else None
    switch(link, destination)
    installed = Path('/etc/systemd/system/somewhere.service').exists()
    try:
        if installed:
            run('systemctl', 'enable', 'somewhere.service')
            run('systemctl', 'restart', 'somewhere.service')
            ready()
    except Exception:
        if previous:
            switch(link, previous)
            run('systemctl', 'restart', 'somewhere.service')
        else:
            run('systemctl', 'stop', 'somewhere.service')
            link.unlink(missing_ok=True)
        raise
    print(f'Installed {manifest["tag"]} at {manifest["commit"]}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    deploy(parser.parse_args().directory.resolve())
