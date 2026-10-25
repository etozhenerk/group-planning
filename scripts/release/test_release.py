import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import android
import common
import ios
from publish import publish
from release_fixture import card, web_archive
from web_identity import build_info


class Releases(unittest.TestCase):
    def test_tags(self):
        for component in common.COMPONENTS:
            self.assertEqual(common.parse_tag(f'{component}/v1.2.3-rc.1'), (component, '1.2.3-rc.1'))
        for tag in ('v1.0.0', 'api/v1.0.0', 'web/v01.2.3', 'web/v1.2.3\n', 'web/v1.2.3;echo x', 'web/v1.2.3-rc.0'):
            with self.assertRaises(ValueError):
                common.parse_tag(tag)

    def artifact(self, directory, component='web'):
        for name in common.required_files(component):
            (directory / name).write_bytes(b'fixture artifact')
        meta = dict(tag=f'{component}/v1.2.3', component=component, version='1.2.3',
                    commit='a' * 40, build_number=42, native_version='1.2.3', prerelease=False)
        meta['release_plan'] = card(meta['tag'])
        if component == 'web':
            web_archive(directory / 'web.tar.gz', build_info(meta))
        common.finalize(directory, meta, ['fixture-only'], {})

    def test_complete_and_tampered_artifacts(self):
        for component in common.COMPONENTS:
            with tempfile.TemporaryDirectory() as temporary:
                directory = Path(temporary)
                self.artifact(directory, component)
                self.assertEqual(common.verify(directory)['component'], component)
                next(directory.glob(next(iter(common.required_files(component))))).write_bytes(b'changed')
                with self.assertRaises(ValueError):
                    common.verify(directory)

    def test_missing_and_extra_artifacts(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            with self.assertRaises(ValueError):
                common.finalize(directory, {'component': 'android'}, [], {})
            self.artifact(directory)
            (directory / 'secret.txt').write_text('must not publish')
            with self.assertRaises(ValueError):
                common.verify(directory)

    def test_duplicate_or_traversal_manifest(self):
        for name in ('../outside', 'web.tar.gz'):
            with tempfile.TemporaryDirectory() as temporary:
                directory = Path(temporary)
                self.artifact(directory)
                manifest = json.loads((directory / 'manifest.json').read_text())
                manifest['artifacts'].append(dict(name=name, sha256='x', size=1))
                (directory / 'manifest.json').write_text(json.dumps(manifest))
                with self.assertRaises(ValueError):
                    common.verify(directory)

    def test_tag_commit_ancestry_and_clean_checkout(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            def git(*args):
                subprocess.run(['git', *args], cwd=root, check=True, capture_output=True)
            git('init', '-b', 'main')
            git('config', 'user.name', 'Release Test')
            git('config', 'user.email', 'release@example.invalid')
            git('commit', '--allow-empty', '-m', 'base')
            git('update-ref', 'refs/remotes/origin/main', 'HEAD')
            commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
            git('tag', 'web/v1.2.2')
            git('tag', '-a', 'web/v1.2.3', '-m', json.dumps(card(commit=commit)))
            with patch.object(common, 'ROOT', root), patch.object(common, 'run', lambda *args: subprocess.run(args, cwd=root, check=True, capture_output=True)):
                self.assertEqual(common.metadata('web/v1.2.3', 1)['component'], 'web')
                (root / 'dirty').write_text('uncommitted')
                with self.assertRaises(ValueError):
                    common.metadata('web/v1.2.3', 1)
                (root / 'dirty').unlink()
                git('commit', '--allow-empty', '-m', 'ahead')
                with self.assertRaises(ValueError):
                    common.metadata('web/v1.2.3', 1)
                git('tag', 'web/v1.2.4')
                with self.assertRaises(subprocess.CalledProcessError):
                    common.metadata('web/v1.2.4', 1)
            for number in (0, 10000):
                with self.assertRaises(ValueError):
                    common.metadata('web/v1.2.3', number)

    def test_unsigned_releases_fail_before_build(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, 'signing secrets'):
                android.build(Path('/unused'), {}, 'https://example.invalid')
            with self.assertRaisesRegex(ValueError, 'distribution certificate'):
                with ios.signing():
                    self.fail('Signing cannot succeed without keys')

    def test_existing_release_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.artifact(directory)
            with patch('publish.git', return_value='a' * 40), patch('publish.read_card', return_value=card()), patch('publish.subprocess.run') as command:
                command.return_value.returncode = 0
                with self.assertRaisesRegex(ValueError, 'already exists'):
                    publish(directory, 'owner/repo')
                self.assertEqual(command.call_count, 1)
                self.assertEqual(command.call_args[0][0][:3], ['gh', 'release', 'view'])

    def test_changed_card_stops_before_any_publication_command(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.artifact(directory)
            with patch('publish.git', return_value='a' * 40), patch('publish.read_card', return_value=card() | {'reason': 'Изменено после сборки'}), patch('publish.subprocess.run') as command:
                with self.assertRaisesRegex(ValueError, 'card changed'):
                    publish(directory, 'owner/repo')
                command.assert_not_called()

    def test_secret_arguments_are_not_in_errors(self):
        with patch('common.subprocess.run') as command:
            command.return_value.returncode = 1
            with self.assertRaisesRegex(RuntimeError, '^security failed with exit code 1$'):
                common.run('security', 'import', '-P', 'sensitive-password')


if __name__ == '__main__':
    unittest.main()
