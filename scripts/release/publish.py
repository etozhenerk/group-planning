"""Опубликовать полный проверенный набор без создания/перемещения тега."""
import argparse
import os
from pathlib import Path
import re
import subprocess
import tempfile

from common import git, verify
from version_policy import read_card, release_notes


def publish(directory, repository):
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise ValueError('Invalid repository')
    manifest = verify(directory)
    tag = manifest['tag']
    if git('rev-parse', f'refs/tags/{tag}^{{commit}}') != manifest['commit']:
        raise ValueError('Tag no longer matches artifact commit')
    if read_card(tag, manifest['commit'], git) != manifest['release_plan']:
        raise ValueError('Release card changed since the build')
    existing = subprocess.run(['gh', 'release', 'view', tag, '--repo', repository], capture_output=True)
    if existing.returncode == 0:
        raise ValueError('Release already exists; never overwrite published or partial releases')
    # Verify API access separately: an auth failure is not proof that a release is absent.
    subprocess.run(['gh', 'api', f'repos/{repository}', '--silent'], check=True)
    with tempfile.TemporaryDirectory() as temporary:
        notes = Path(temporary) / 'notes.md'
        notes.write_text(release_notes(manifest))
        command = ['gh', 'release', 'create', tag, '--repo', repository, '--verify-tag',
                   '--title', tag, '--notes-file', str(notes), '--latest=false']
        if manifest['prerelease']:
            command.append('--prerelease')
        command.extend(str(path) for path in sorted(directory.iterdir()))
        subprocess.run(command, check=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', required=True, type=Path)
    args = parser.parse_args()
    publish(args.directory, os.environ['GITHUB_REPOSITORY'])
