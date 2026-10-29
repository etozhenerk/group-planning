"""Проверить и собрать один релиз из существующего тега без деплоя."""
import argparse
import os
from pathlib import Path
import re
import tempfile

import android
import ios
import package_cloud
import check_web
import web_rc13_exception
from common import ROOT, finalize, metadata, run


def api_origin():
    origin = os.environ.get('SOMEWHERE_API_ORIGIN', '')
    if not re.fullmatch(r'https://[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[1-9][0-9]{0,4})?', origin):
        raise ValueError('SOMEWHERE_API_ORIGIN must be an explicit HTTPS origin without path')
    return origin


def build(tag, number, destination):
    meta = metadata(tag, number)
    component = meta['component']
    if destination.exists():
        raise ValueError('Output directory already exists; use a fresh directory')
    if component in ('android', 'ios'):
        api_origin()
        (android if component == 'android' else ios).require_credentials()
    checks = []

    def check(name, *command, cwd=ROOT, env=None):
        run(*command, cwd=cwd, env=env)
        checks.append(name)

    if component in ('web', 'ios', 'android'):
        exception = web_rc13_exception.for_candidate(meta)
        if exception is None:
            check('design-acceptance', 'npm', 'run', 'design:ready', '--', '--platform', component)
        else:
            meta['owner_exception'] = exception
            print('Owner-approved web rc13 exception: design/full manual acceptance INCOMPLETE')

    check('release-tooling-tests', 'python3', '-m', 'unittest', 'discover', '-s', 'scripts/release', '-p', 'test_*.py')
    if component in ('backend', 'monitoring'):
        folder = ROOT / ('backend' if component == 'backend' else 'infra/telegram-bot')
        check('go-format', 'sh', 'scripts/format.sh', '--check', cwd=folder)
        check('go-vet', 'go', 'vet', './...', cwd=folder)
        check('go-race', 'go', 'test', '-race', './...', cwd=folder)
        if component == 'backend':
            check('host-metrics-tests', 'python3', '-m', 'unittest', 'discover', '-s', 'infra/host', '-p', 'test_*.py')
            check('dependency-boundaries', 'go', 'run', './cmd/check-dependencies', cwd=folder)
            check('api-contract', 'npm', 'run', 'api:test')
        else:
            check('cloud-runtime-go1.23', 'go', 'test', './...', cwd=folder, env=dict(os.environ, GOTOOLCHAIN='go1.23.12'))
    elif component == 'web':
        check('web-static-and-unit', 'npm', 'run', 'web:check')
        check('web-browser', 'npm', 'run', 'web:test:e2e')
    elif component == 'ios':
        check('swift-format', 'sh', 'scripts/format.sh', '--check', cwd=ROOT / 'frontend/ios')
        check('simulator-release-build-analyze', 'sh', 'scripts/build.sh', 'Release', cwd=ROOT / 'frontend/ios')
        check('ios-unit', 'sh', 'scripts/test.sh', cwd=ROOT / 'frontend/ios')
    else:
        check('android-toolchain', 'sh', 'scripts/check-toolchain.sh', cwd=ROOT / 'frontend/android')
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Failed builds never leave a directory that looks like a complete release.
    with tempfile.TemporaryDirectory(prefix='.release-', dir=destination.parent) as temporary:
        stage = Path(temporary) / 'artifacts'
        stage.mkdir()
        if component == 'android':
            details = android.build(stage, meta, api_origin())
            checks.extend(['ktlint', 'debug-release-build', 'debug-release-lint', 'debug-release-unit', 'apk-aab-signatures'])
        elif component == 'ios':
            details = ios.build(stage, meta, api_origin())
            checks.extend(['distribution-archive', 'codesign', 'ipa-export-and-version', 'dsym'])
        else:
            details = package_cloud.build(component, stage, meta)
            checks.append('artifact-build')
        finalize(stage, meta, checks, details)
        if component == 'web':
            check_web.check(stage)
            checks.append('web-release-browser-identity')
            # The archive is unchanged; regenerate metadata after the artifact smoke check.
            (stage / 'manifest.json').unlink()
            (stage / 'SHA256SUMS').unlink()
            finalize(stage, meta, checks, details)
        stage.rename(destination)
    print('Release artifacts:', destination)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--build-number', required=True, type=int)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    build(args.tag, args.build_number, args.output.resolve())
