import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import build
import web_rc14_exception as exception
from release_fixture import card, web_archive
from web_identity import build_info


class WebRC14ExceptionTests(unittest.TestCase):
    def meta(self, tag=exception.TAG):
        component, version = tag.split('/v')
        commit = 'c' * 40
        return dict(component=component, version=version, tag=tag, commit=commit,
                    build_number=14, native_version=version.split('-')[0],
                    prerelease=True, release_plan=card(tag, commit, None, 'initial'))

    def unchanged_git(self, command, ref):
        self.assertEqual(command, 'rev-parse')
        return exception.TREES[ref.split(':', 1)[1]]

    def test_exact_candidate_records_incomplete_and_retains_automatic_checks(self):
        def package(component, stage, meta):
            self.assertEqual(component, 'web')
            web_archive(stage / 'web.tar.gz', build_info(meta))
            return {'api_origin': 'same-origin'}
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / 'release'
            with (patch.object(build, 'metadata', return_value=self.meta()),
                  patch.object(exception, 'git', side_effect=self.unchanged_git),
                  patch.object(build, 'run') as run,
                  patch.object(build.package_cloud, 'build', side_effect=package),
                  patch.object(build.check_web, 'check') as identity):
                build.build(exception.TAG, 14, output)
            manifest = json.loads((output / 'manifest.json').read_text())
            self.assertEqual(manifest['owner_exception']['status'], 'incomplete')
            self.assertEqual(manifest['owner_exception']['authorization'], {
                'question': 'call_a44a9b66cf6541fd80108e62530a3742',
                'answer': 'Да, только исключение rc.14 и выкладка',
                'recordedAt': '2026-10-29T12:32:18Z',
            })
            self.assertNotIn('design-acceptance', manifest['checks'])
            self.assertEqual(manifest['checks'], ['release-tooling-tests',
                'web-static-and-unit', 'web-browser', 'artifact-build',
                'web-release-browser-identity'])
            commands = [call.args for call in run.call_args_list]
            self.assertIn(('npm', 'run', 'web:check'), commands)
            self.assertIn(('npm', 'run', 'web:test:e2e'), commands)
            identity.assert_called_once()

    def test_other_tags_keep_the_design_gate(self):
        for tag in ('web/v0.1.0-rc.12', 'web/v0.1.0-rc.16', 'ios/v0.1.0-rc.14', 'android/v0.1.0-rc.14'):
            with self.subTest(tag=tag), tempfile.TemporaryDirectory() as temporary:
                meta = self.meta(tag)
                with (patch.object(build, 'metadata', return_value=meta),
                      patch.object(exception, 'git') as git,
                      patch.object(build, 'api_origin'),
                      patch.object(build.ios, 'require_credentials'),
                      patch.object(build.android, 'require_credentials'),
                      patch.object(build, 'run', side_effect=RuntimeError('design gate failed')) as run):
                    with self.assertRaisesRegex(RuntimeError, 'design gate failed'):
                        build.build(tag, 14, Path(temporary) / 'release')
                self.assertEqual(run.call_args.args,
                    ('npm', 'run', 'design:ready', '--', '--platform', meta['component']))
                git.assert_not_called()
        with patch.object(exception, 'git') as git:
            self.assertIsNone(exception.for_candidate(self.meta('backend/v0.1.0-rc.14')))
            git.assert_not_called()

    def test_any_protected_tree_change_rejects_before_checks_or_packaging(self):
        for changed in exception.TREES:
            with self.subTest(path=changed), tempfile.TemporaryDirectory() as temporary:
                def changed_git(command, ref):
                    return '0' * 40 if ref == f'{"c" * 40}:{changed}' else self.unchanged_git(command, ref)
                with (patch.object(build, 'metadata', return_value=self.meta()),
                      patch.object(exception, 'git', side_effect=changed_git),
                      patch.object(build, 'run') as run,
                      patch.object(build.package_cloud, 'build') as package):
                    output = Path(temporary) / 'release'
                    with self.assertRaisesRegex(ValueError, 'changed product tree'):
                        build.build(exception.TAG, 14, output)
                    self.assertFalse(output.exists())
                run.assert_not_called()
                package.assert_not_called()

    def test_automatic_failure_still_stops_the_candidate(self):
        for failed in ('web:check', 'web:test:e2e'):
            with self.subTest(command=failed), tempfile.TemporaryDirectory() as temporary:
                def run(*args, **_kwargs):
                    if args == ('npm', 'run', failed):
                        raise RuntimeError('automatic check failed')
                with (patch.object(build, 'metadata', return_value=self.meta()),
                      patch.object(exception, 'git', side_effect=self.unchanged_git),
                      patch.object(build, 'run', side_effect=run),
                      patch.object(build.package_cloud, 'build') as package):
                    output = Path(temporary) / 'release'
                    with self.assertRaisesRegex(RuntimeError, 'automatic check failed'):
                        build.build(exception.TAG, 14, output)
                    self.assertFalse(output.exists())
                package.assert_not_called()


if __name__ == '__main__':
    unittest.main()
