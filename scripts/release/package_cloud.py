"""Сборка отдельных backend/web/monitoring артефактов без развёртывания."""
import gzip
import os
from pathlib import Path
import shutil
import tarfile
import tempfile

from common import ROOT, run


def tar_directory(source, destination):
    with destination.open('wb') as target:
        with gzip.GzipFile(filename='', mode='wb', fileobj=target, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode='w') as archive:
                for path in sorted(source.rglob('*')):
                    if path.is_symlink():
                        raise ValueError('Symlinks are not allowed in cloud artifacts')
                    info = archive.gettarinfo(str(path), str(path.relative_to(source)))
                    info.uid = info.gid = info.mtime = 0
                    info.uname = info.gname = ''
                    if path.is_file():
                        with path.open('rb') as content:
                            archive.addfile(info, content)
                    else:
                        archive.addfile(info)


def build(component, directory):
    if component == 'backend':
        with tempfile.TemporaryDirectory() as temporary:
            stage = Path(temporary)
            run('go', 'build', '-trimpath', '-buildvcs=true', '-o', str(stage / 'somewhere-api'), './cmd/server',
                cwd=ROOT / 'backend', env=dict(os.environ, GOOS='linux', GOARCH='amd64', CGO_ENABLED='0'))
            run('go', 'build', '-trimpath', '-buildvcs=true', '-o', str(stage / 'somewhere-migrate'), './cmd/migrate',
                cwd=ROOT / 'backend', env=dict(os.environ, GOOS='linux', GOARCH='amd64', CGO_ENABLED='0'))
            shutil.copyfile(ROOT / 'scripts/release/templates/somewhere.service', stage / 'somewhere.service')
            shutil.copyfile(ROOT / 'backend/.env.example', stage / 'environment.example')
            migrations = ROOT / 'backend/migrations'
            if migrations.is_dir():
                shutil.copytree(migrations, stage / 'migrations')
            tar_directory(stage, directory / 'backend-linux-amd64.tar.gz')
        return {'platform': 'linux/amd64', 'storage': 'postgres', 'migration': 'somewhere-migrate',
                'note': 'Миграции применяются отдельной ролью перед запуском; runtime проверяет схему.'}
    if component == 'web':
        run('npm', 'run', 'web:build')
        tar_directory(ROOT / 'frontend/web/dist', directory / 'web.tar.gz')
        return {'api_origin': 'same-origin', 'serving': 'static web directory; API released separately'}
    run('sh', 'scripts/package.sh', cwd=ROOT / 'infra/telegram-bot')
    shutil.copyfile(ROOT / 'infra/telegram-bot/build/function.zip', directory / 'monitoring-functions.zip')
    return {'runtime': 'golang123', 'entrypoints': ['handler.Handler', 'probe.Probe'],
            'configuration': 'Injected separately; no tokens or destination IDs in archive'}
