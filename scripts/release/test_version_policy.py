import json
import io
from pathlib import Path
import tempfile
import unittest
import subprocess
import tarfile
from unittest.mock import patch

import common
import check_web
import package_cloud
import prepare
from release_fixture import card, web_archive
from version_policy import check_bump, history, read_card, release_notes, validate_card
from web_identity import build_info, verify_web_archive


class VersionPolicyTests(unittest.TestCase):
    def test_mobile_rc_final_and_retry_keep_native_version_and_build_number(self):
        for component in ('android', 'ios'):
            with tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                def git(*args):
                    return subprocess.check_output(['git', *args], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
                git('init', '-b', 'main')
                git('config', 'user.name', 'Release Test')
                git('config', 'user.email', 'release@example.invalid')
                git('commit', '--allow-empty', '-m', 'baseline')
                git('update-ref', 'refs/remotes/origin/main', 'HEAD')
                for version, number in [('0.1.0-rc.1', 1), ('0.1.0-rc.2', 2), ('0.1.0', 9999)]:
                    tag = f'{component}/v{version}'
                    value = card(tag, git('rev-parse', 'HEAD'), None, 'initial')
                    git('tag', '-a', tag, '-m', json.dumps(value))
                    with patch.object(common, 'ROOT', root), patch.object(common, 'run', lambda *args: git(*args[1:])):
                        meta = common.metadata(tag, number)
                        self.assertEqual(meta['native_version'], '0.1.0')
                        self.assertEqual(meta['version'], version)
                        self.assertEqual(meta['prerelease'], '-rc.' in version)
                        self.assertEqual(meta['build_number'], number)
                        self.assertEqual(common.metadata(tag, number), meta)
                for number in (0, 10000, True):
                    with self.assertRaises(ValueError):
                        common.metadata(tag, number)

    def test_prepare_card_then_read_annotated_tag_in_clean_repository(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
            git('init', '-b', 'main')
            git('config', 'user.name', 'Release Test')
            git('config', 'user.email', 'release@example.invalid')
            git('commit', '--allow-empty', '-m', 'baseline')
            git('update-ref', 'refs/remotes/origin/main', 'HEAD')
            git('tag', 'web/v0.1.0-rc.2')
            with patch.object(prepare, 'git', git), patch.object(prepare, 'run', lambda *args: git(*args[1:])):
                value = prepare.prepare('web/v0.1.0-rc.3', 'initial', 'Первый выпуск',
                    ['Полная версия'], ['Проверено'], 'API прежний', 'Подписи mobile отдельно', 'Артефакты')
                self.assertNotIn(value['tag'], git('tag', '--list'))
                git('tag', '-a', value['tag'], '-m', json.dumps(value))
                self.assertEqual(read_card(value['tag'], git('rev-parse', 'HEAD'), git), value)
                with patch.object(common, 'ROOT', root), patch.object(common, 'run', lambda *args: git(*args[1:])):
                    self.assertEqual(common.metadata(value['tag'], 42)['native_version'], '0.1.0')
                    self.assertEqual(common.metadata(value['tag'], 42)['build_number'], 42)
                with self.assertRaises(ValueError):
                    prepare.prepare(value['tag'], 'initial', 'Повтор', ['x'], ['x'], 'x', 'x', 'x')

    def test_numeric_order_and_component_isolation(self):
        tags = ['web/v0.1.0-rc.9', 'backend/v9.0.0']
        self.assertIsNone(history('web/v0.1.0-rc.10', tags))
        self.assertIsNone(history('web/v0.1.0', tags))
        for target in ['web/v0.1.0-rc.8', 'web/v0.1.0-rc.9']:
            with self.assertRaises(ValueError):
                history(target, tags)

    def test_current_tag_is_expected_only_in_ci(self):
        tags = ['web/v0.1.0', 'web/v0.1.1-rc.1']
        self.assertEqual(history(tags[-1], tags, existing=True), '0.1.0')
        with self.assertRaises(ValueError):
            history(tags[-1], tags)
        with self.assertRaises(ValueError):
            history('web/v0.1.1', tags, existing=True)

    def test_closed_base_and_old_release_line_are_rejected(self):
        for target in ['web/v0.1.0-rc.100', 'web/v0.0.9', 'web/v0.1.1-rc.1']:
            with self.assertRaises(ValueError):
                history(target, ['web/v0.1.0', 'web/v0.2.0-rc.1'])

    def test_bump_matches_base_and_pre_one_policy(self):
        for version, previous, bump in [('0.1.0-rc.2', None, 'initial'),
                ('0.1.1', '0.1.0', 'patch'), ('0.2.0-rc.1', '0.1.9', 'minor'),
                ('1.0.0', '0.8.2', 'major'), ('2.0.0', '1.9.2', 'major')]:
            check_bump(version, previous, bump)
        for version, previous, bump in [('0.3.0', '0.1.0', 'minor'), ('0.1.1', None, 'initial'),
                ('1.2.3', '1.2.2', 'minor'), ('1.2.3', '1.2.2', [])]:
            with self.assertRaises(ValueError):
                check_bump(version, previous, bump)

    def test_card_is_bound_to_commit_and_declared_changes(self):
        value = card()
        self.assertEqual(validate_card(value, value['tag'], value['commit'], '1.2.2'), value)
        for alteration in [{'commit': 'b' * 40}, {'changes': []}, {'checks': []},
                           {'reason': ''}, {'version': '1.2.4'}, {'previous_version': '1.2.1'}]:
            with self.assertRaises(ValueError):
                validate_card(value | alteration, value['tag'], value['commit'], '1.2.2')

    def test_lightweight_or_non_json_tags_are_rejected(self):
        def fake_git(*args):
            if args[0] == 'tag':
                return 'web/v1.2.2\nweb/v1.2.3'
            return 'commit'
        with self.assertRaisesRegex(ValueError, 'annotated'):
            read_card('web/v1.2.3', 'a' * 40, fake_git)
        def malformed_git(*args):
            return {'tag': 'web/v1.2.2\nweb/v1.2.3', 'cat-file': 'tag', 'for-each-ref': 'plain text'}[args[0]]
        with self.assertRaisesRegex(ValueError, 'JSON'):
            read_card('web/v1.2.3', 'a' * 40, malformed_git)

    def test_web_preview_unpack_rejects_paths_and_links_before_copying(self):
        meta = dict(component='web', version='1.2.3', tag='web/v1.2.3', commit='a' * 40,
                    build_number=42, native_version='1.2.3', prerelease=False, release_plan=card())
        for name, kind in [('../outside', tarfile.REGTYPE), ('link', tarfile.SYMTYPE)]:
            with tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                artifacts = root / 'artifacts'
                artifacts.mkdir()
                payload = json.dumps(build_info(meta)).encode()
                with tarfile.open(artifacts / 'web.tar.gz', 'w:gz') as archive:
                    identity = tarfile.TarInfo('build-info.json')
                    identity.size = len(payload)
                    archive.addfile(identity, io.BytesIO(payload))
                    invalid = tarfile.TarInfo(name)
                    invalid.type = kind
                    invalid.linkname = '../outside'
                    archive.addfile(invalid)
                common.finalize(artifacts, meta, ['fixture-only'], {})
                with self.assertRaisesRegex(ValueError, 'Unsafe'):
                    check_web.unpack(artifacts, root / 'dist')
                self.assertEqual(list((root / 'dist').iterdir()), [])
                self.assertFalse((root / 'outside').exists())

    def test_web_identity_cannot_be_replaced_with_valid_checksums(self):
        meta = dict(component='web', version='1.2.3', tag='web/v1.2.3', commit='a' * 40,
                    build_number=42, native_version='1.2.3', prerelease=False, release_plan=card())
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            web_archive(directory / 'web.tar.gz', build_info(meta))
            common.finalize(directory, meta, ['test'], {})
            web_archive(directory / 'web.tar.gz', build_info(meta) | {'version': '1.2.4'})
            # Recalculate both manifest and SHA256SUMS: provenance still must fail.
            (directory / 'manifest.json').unlink()
            (directory / 'SHA256SUMS').unlink()
            with self.assertRaisesRegex(ValueError, 'identity'):
                common.finalize(directory, meta, ['test'], {})

    def test_missing_identity_and_legacy_manifest_cannot_be_new_releases(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'web.tar.gz'
            web_archive(path, {})
            with self.assertRaises(ValueError):
                verify_web_archive(path, dict(component='web', version='0.1.0',
                    tag='web/v0.1.0', commit='a' * 40, build_number=1))
            (Path(temporary) / 'manifest.json').write_text('{"schema_version": 1}')
            with self.assertRaisesRegex(ValueError, 'schema 2'):
                common.verify(Path(temporary))

    def test_boolean_is_not_an_identity_schema_number(self):
        meta = dict(component='web', version='0.1.0', tag='web/v0.1.0',
                    commit='a' * 40, build_number=1)
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'web.tar.gz'
            web_archive(path, build_info(meta) | {'schema_version': True})
            with self.assertRaisesRegex(ValueError, 'identity'):
                verify_web_archive(path, meta)

    def test_packager_passes_authoritative_metadata(self):
        meta = dict(component='web', version='0.1.0-rc.3', tag='web/v0.1.0-rc.3',
                    commit='a' * 40, build_number=42)
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'frontend/web/dist').mkdir(parents=True)
            with patch.object(package_cloud, 'ROOT', root), patch.object(package_cloud, 'run') as run:
                package_cloud.build('web', root, meta)
                env = run.call_args.kwargs['env']
                self.assertEqual(env['SOMEWHERE_RELEASE_BUILD'], '1')
                self.assertEqual(json.loads(env['SOMEWHERE_BUILD_INFO']), build_info(meta))

    def test_release_notes_include_reason_and_both_check_stages(self):
        notes = release_notes(dict(component='web', version='1.2.3', commit='a' * 40,
            build_number=42, artifacts=[dict(name='web.tar.gz', size=1024)],
            release_plan=card(), checks=['web-browser']))
        for text in ('1.2.2', 'patch', 'Исправлена версия', 'Unit checks passed', 'web-browser'):
            self.assertIn(text, notes)
        for section in ('Изменения', 'Совместимость', 'Проверки', 'Ограничения', 'Артефакты'):
            self.assertIn(f'## {section}\n\n', notes)
        self.assertIn('`web.tar.gz` — 1024 байт.', notes)
