"""Локальные тестовые сборки UI: кандидат, предыдущая версия и длинный RC.

Не создаёт теги, не публикует и не развёртывает приложение.
"""
import argparse
import json
import os
from pathlib import Path

from common import ROOT, finalize, git, run
from package_cloud import tar_directory
from check_web import unpack
from release_fixture import card
from web_identity import build_info


def validate(output):
    output.mkdir(parents=True, exist_ok=False)
    commit = git('rev-parse', 'HEAD')
    variants = [('candidate', '0.1.0-rc.3', None, 'initial'),
                ('previous', '0.1.0-rc.2', None, 'initial'),
                ('long', '0.12.34-rc.123', '0.12.33', 'patch')]
    for index, (name, version, previous, bump) in enumerate(variants, 42):
        parent = output / name
        artifacts = parent / 'artifacts'
        artifacts.mkdir(parents=True)
        meta = dict(component='web', version=version, tag=f'web/v{version}', commit=commit,
                    build_number=index, native_version=version.split('-')[0], prerelease=True)
        meta['release_plan'] = card(meta['tag'], commit, previous, bump)
        compiled = parent / 'compiled'
        run('npm', 'run', 'build', '--workspace', '@somewhere/web', '--', '--outDir', str(compiled),
            env=dict(os.environ, SOMEWHERE_RELEASE_BUILD='1', SOMEWHERE_BUILD_INFO=json.dumps(build_info(meta))))
        tar_directory(compiled, artifacts / 'web.tar.gz')
        finalize(artifacts, meta, ['fixture-build'], {'fixture_only': True, 'not_for_publication': True})
        unpack(artifacts, parent / 'dist')
    run('npm', 'run', 'test:release', '--workspace', '@somewhere/web', cwd=ROOT,
        env=dict(os.environ, SOMEWHERE_RELEASE_PREVIEW_ROOT=str(output)))
    print(f'Local artifact comparison passed: {output}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    validate(parser.parse_args().output.resolve())
