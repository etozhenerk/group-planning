"""Отказ до изменений хоста без актуальной функциональной приёмки."""
import importlib.util
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('deployer', Path(__file__).with_name('deploy-release.py'))
deployer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployer)


class AcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'web.tar.gz').write_bytes(b'candidate')
        checksum = hashlib.sha256(b'candidate').hexdigest()
        manifest = {'component': 'web', 'version': '1.0.0', 'artifacts': [{'name': 'web.tar.gz', 'sha256': checksum}]}
        (self.root / 'manifest.json').write_text(json.dumps(manifest))
        manifest_hash = hashlib.sha256((self.root / 'manifest.json').read_bytes()).hexdigest()
        self.receipt = {'schemaVersion': 1, 'status': 'passed', 'createdAt': '2020-01-01T00:00:00Z',
                        'artifact': {'component': 'web', 'version': '1.0.0', 'manifestHash': manifest_hash,
                                     'files': [{'path': 'web.tar.gz', 'sha256': checksum}]},
                        'expected': 2, 'passed': 2, 'suites': 2,
                        'environments': [{'profile': p, 'build': manifest_hash} for p in ('web-desktop', 'web-mobile')],
                        **{key: 'a' * 64 for key in ('planHash', 'runHash', 'sourceHash', 'catalogHash')}}

    def check(self):
        path = self.root / 'receipt.json'
        path.write_text(json.dumps(self.receipt))
        deployer.verify_acceptance(self.root, path)

    def test_valid_receipt(self):
        self.check()

    def test_missing_receipt(self):
        with self.assertRaises(ValueError):
            deployer.verify_acceptance(self.root, None)

    def test_failed_and_incomplete_receipts(self):
        for key, value in [('status', 'failed'), ('passed', 1), ('suites', 0), ('planHash', '')]:
            with self.subTest(key=key):
                old = self.receipt[key]
                self.receipt[key] = value
                with self.assertRaises(ValueError):
                    self.check()
                self.receipt[key] = old

    def test_changed_artifact(self):
        (self.root / 'web.tar.gz').write_bytes(b'other')
        with self.assertRaises(ValueError):
            self.check()

    def test_other_manifest(self):
        self.receipt['artifact']['manifestHash'] = 'b' * 64
        with self.assertRaises(ValueError):
            self.check()

    def test_missing_platform(self):
        self.receipt['environments'].pop()
        with self.assertRaises(ValueError):
            self.check()

    def test_other_runtime_build(self):
        self.receipt['environments'][0]['build'] = 'demo'
        with self.assertRaises(ValueError):
            self.check()


if __name__ == '__main__':
    unittest.main()
