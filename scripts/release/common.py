"""Проверка происхождения и состава независимого релиза somewhere."""
import hashlib
import json
from pathlib import Path
import re
import subprocess

from version_policy import COMPONENTS, parse_tag, read_card, validate_card
from web_identity import verify_web_archive

ROOT = Path(__file__).resolve().parents[2]


def run(*arguments, cwd=ROOT, env=None):
    result = subprocess.run(arguments, cwd=cwd, env=env)
    if result.returncode:
        # Some native signing tools accept passwords in argv. Never include argv in exceptions.
        raise RuntimeError(f'{Path(arguments[0]).name} failed with exit code {result.returncode}')


def git(*arguments):
    return subprocess.check_output(['git', *arguments], cwd=ROOT, text=True).strip()


def metadata(tag, build_number):
    component, version = parse_tag(tag)
    if type(build_number) is not int or not 1 <= build_number <= 9999:
        raise ValueError('Build number must be 1..9999 (shared mobile numbering policy)')
    commit = git('rev-parse', '--verify', f'refs/tags/{tag}^{{commit}}')
    if commit != git('rev-parse', 'HEAD'):
        raise ValueError('Checkout does not match release tag')
    run('git', 'merge-base', '--is-ancestor', commit, 'origin/main')
    if git('status', '--porcelain'):
        raise ValueError('Release must start from a clean checkout')
    return dict(component=component, version=version, tag=tag, commit=commit,
                build_number=build_number, native_version=version.split('-')[0],
                prerelease='-rc.' in version, release_plan=read_card(tag, commit, git))


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def required_files(component):
    return {
        'backend': {'backend-linux-amd64.tar.gz'},
        'web': {'web.tar.gz'},
        'monitoring': {'monitoring-functions.zip'},
        'android': {'somewhere.aab', 'somewhere.apk', 'mapping.txt'},
        'ios': {'Somewhere.xcarchive.zip', 'Somewhere.ipa', 'dSYMs.zip'},
    }[component]


def finalize(directory, meta, checks, details):
    files = sorted(p for p in directory.iterdir() if p.is_file())
    if {p.name for p in files} != required_files(meta['component']):
        raise ValueError('Incomplete or unexpected release artifact set')
    if any(p.is_symlink() or p.stat().st_size == 0 for p in files):
        raise ValueError('Empty or symlinked release artifact')
    manifest = dict(meta, schema_version=2, checks=checks, details=details,
                    artifacts=[dict(name=p.name, size=p.stat().st_size, sha256=digest(p)) for p in files])
    manifest_path = directory / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    files.append(manifest_path)
    (directory / 'SHA256SUMS').write_text(''.join(f'{digest(p)}  {p.name}\n' for p in files))
    verify(directory)


def verify(directory):
    manifest_path = directory / 'manifest.json'
    if manifest_path.is_symlink() or (directory / 'SHA256SUMS').is_symlink():
        raise ValueError('Symlinked manifest')
    manifest = json.loads(manifest_path.read_text())
    if manifest.get('schema_version') != 2:
        raise ValueError('New publication requires release manifest schema 2')
    component, version = parse_tag(manifest['tag'])
    if component != manifest['component'] or version != manifest['version']:
        raise ValueError('Inconsistent release identity')
    if not re.fullmatch(r'[0-9a-f]{40}', manifest['commit']):
        raise ValueError('Invalid release commit')
    number = manifest.get('build_number')
    if type(number) is not int or not 1 <= number <= 9999:
        raise ValueError('Invalid release build number')
    if manifest.get('native_version') != version.split('-')[0] or manifest.get('prerelease') != ('-rc.' in version):
        raise ValueError('Invalid native version or prerelease identity')
    card = manifest.get('release_plan', {})
    if not isinstance(card, dict):
        raise ValueError('Invalid release card')
    validate_card(card, manifest['tag'], manifest['commit'], card.get('previous_version'))
    required = required_files(component)
    if {item['name'] for item in manifest['artifacts']} != required or len(manifest['artifacts']) != len(required):
        raise ValueError('Invalid manifest artifact set')
    expected = {}
    for item in manifest['artifacts']:
        path = directory / item['name']
        if path.is_symlink() or not path.is_file() or path.stat().st_size != item['size'] or digest(path) != item['sha256']:
            raise ValueError('Artifact integrity check failed')
        expected[path.name] = item['sha256']
    expected['manifest.json'] = digest(manifest_path)
    checksums = {}
    for line in (directory / 'SHA256SUMS').read_text().splitlines():
        checksum, name = line.split('  ', 1)
        if name in checksums:
            raise ValueError('Duplicate checksum entry')
        checksums[name] = checksum
    if checksums != expected or {p.name for p in directory.iterdir()} != required | {'manifest.json', 'SHA256SUMS'}:
        raise ValueError('Checksum set or directory contents mismatch')
    if component == 'web':
        verify_web_archive(directory / 'web.tar.gz', manifest)
    return manifest
