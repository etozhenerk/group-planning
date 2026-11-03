"""Lockbox errors must leave the existing application configuration untouched."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_oauth', Path(__file__).with_name('sync-oauth-config.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class OAuthConfigTests(unittest.TestCase):
    def test_atomic_update_preserves_other_keys_permissions_and_idempotence(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'application.env'
            path.write_text('OTHER=value\nSOMEWHERE_YANDEX_CLIENT_ID=old\nSOMEWHERE_YANDEX_CLIENT_SECRET=old\n')
            path.chmod(0o640)
            values = dict(zip(sync.KEYS, ['new-id', 'test secret $value']))
            self.assertTrue(sync.synchronize(path, values))
            self.assertEqual(path.stat().st_mode & 0o777, 0o640)
            self.assertTrue(path.read_text().startswith('OTHER=value\n'))
            before = path.read_bytes()
            self.assertFalse(sync.synchronize(path, values, check=True))
            self.assertFalse(sync.synchronize(path, values))
            self.assertEqual(path.read_bytes(), before)

    def test_check_and_invalid_file_do_not_replace_configuration(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'application.env'
            values = dict.fromkeys(sync.KEYS, 'new')
            for contents, mode in [
                ('SOMEWHERE_YANDEX_CLIENT_ID=old\nSOMEWHERE_YANDEX_CLIENT_SECRET=old\n', 0o640),
                ('SOMEWHERE_YANDEX_CLIENT_ID=old\n', 0o640),
                ('SOMEWHERE_YANDEX_CLIENT_ID=old\nSOMEWHERE_YANDEX_CLIENT_ID=again\n', 0o640),
                ('SOMEWHERE_YANDEX_CLIENT_ID=old\n', 0o644),
            ]:
                path.write_text(contents)
                path.chmod(mode)
                with self.assertRaises(ValueError):
                    sync.synchronize(path, values, check=True)
                self.assertEqual(path.read_text(), contents)
            link = Path(directory) / 'link'
            link.symlink_to(path)
            with self.assertRaises(ValueError):
                sync.synchronize(link, values)

    def test_missing_duplicate_unknown_and_injected_payload_fail_closed(self):
        valid = [{'key': key, 'textValue': 'value'} for key in sync.KEYS]
        invalid = [[], valid[:1], valid + valid[:1], valid + [{'key': 'OTHER', 'textValue': 'x'}],
                   [{'key': key, 'textValue': 'x\nINJECTED=y'} for key in sync.KEYS]]
        for entries in invalid:
            with self.subTest(entries=entries):
                with patch.object(sync, 'read_json', side_effect=[{'access_token': 'test'}, {'entries': entries}]):
                    with self.assertRaises(ValueError):
                        sync.fetch('synthetic')
        with patch.object(sync, 'read_json', side_effect=[{'access_token': 'test'}, {'entries': valid}]):
            self.assertEqual(sync.fetch('synthetic'), dict.fromkeys(sync.KEYS, 'value'))


if __name__ == '__main__':
    unittest.main()
