"""Проверить UI из распакованного релизного архива без live API."""
import argparse
import os
from pathlib import Path
import shutil
import tarfile
import tempfile

from common import ROOT, run, verify


def unpack(directory, target):
    verify(directory)
    target.mkdir(parents=True)
    with tarfile.open(directory / 'web.tar.gz') as archive:
        for entry in archive.getmembers():
            if entry.name.startswith('/') or '..' in Path(entry.name).parts or not (entry.isfile() or entry.isdir()):
                raise ValueError('Unsafe web test archive')
        # Keep Python 3.9 compatibility; only copy prevalidated regular entries.
        for entry in archive.getmembers():
            destination = target / entry.name
            if entry.isdir():
                destination.mkdir(parents=True, exist_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(entry) as source, destination.open('xb') as output:
                    shutil.copyfileobj(source, output)


def check(directory):
    with tempfile.TemporaryDirectory(prefix='somewhere-release-ui-') as temporary:
        root = Path(temporary)
        unpack(directory, root / 'candidate/dist')
        run('npm', 'run', 'test:release', '--workspace', '@somewhere/web', cwd=ROOT,
            env=dict(os.environ, SOMEWHERE_RELEASE_PREVIEW_ROOT=str(root)))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', required=True, type=Path)
    check(parser.parse_args().directory.resolve())
