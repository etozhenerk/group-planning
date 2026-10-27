"""Schema-aware backend activation without systemd, PostgreSQL or a real host."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('schema_deployer', Path(__file__).with_name('deploy-release.py'))
deployer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployer)

OLD_SCHEMA = (True, ((1, 'a' * 64),))
NEW_SCHEMA = (True, ((1, 'a' * 64), (2, 'b' * 64)))


class SchemaIdentityTests(unittest.TestCase):
    def test_exact_version_checksum_identity(self):
        with patch.object(deployer.subprocess, 'check_output', side_effect=['t\n', json.dumps([[1, 'a' * 64]])]) as query:
            self.assertEqual(deployer.schema_identity(), OLD_SCHEMA)
        for call in query.call_args_list:
            command = call.args[0]
            self.assertIn('-X', command)
            self.assertIn('ON_ERROR_STOP=1', command)
            self.assertEqual(call.kwargs['timeout'], 15)

    def test_absent_table_is_known_and_distinct_from_empty(self):
        with patch.object(deployer.subprocess, 'check_output', return_value='f\n') as query:
            self.assertEqual(deployer.schema_identity(), (False, ()))
            query.assert_called_once()
        with patch.object(deployer.subprocess, 'check_output', side_effect=['t\n', '[]']):
            self.assertEqual(deployer.schema_identity(), (True, ()))

    def test_failed_or_invalid_probe_is_not_an_empty_schema(self):
        for output in ('null', '[[1,"wrong"]]', '[[2,"' + 'a' * 64 + '"]]', '{"version":1}'):
            with self.subTest(output=output), patch.object(deployer.subprocess, 'check_output', side_effect=['t\n', output]):
                with self.assertRaises((ValueError, TypeError)):
                    deployer.schema_identity()
        with patch.object(deployer.subprocess, 'check_output', side_effect=subprocess.CalledProcessError(1, 'psql')):
            with self.assertRaises(subprocess.CalledProcessError):
                deployer.schema_identity()


class ActivationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name).resolve()
        self.previous = self.base / 'old'
        self.candidate = self.base / 'new'
        self.previous.mkdir()
        self.candidate.mkdir()
        self.link = self.base / 'current'
        self.link.symlink_to(self.previous)
        self.unit = self.base / 'somewhere.service'
        self.unit.write_bytes(b'old unit')
        (self.candidate / 'somewhere.service').write_bytes(b'new unit')
        self.events = []

    def command(self, *args):
        self.events.append((args, self.link.resolve(), self.unit.read_bytes() if self.unit.exists() else None))

    def activate(self):
        deployer.activate_backend(self.candidate, self.link, self.unit)

    def restarts(self):
        return [event for event in self.events if event[0] == ('systemctl', 'restart', 'somewhere.service')]

    def test_success_stops_writer_before_ddl(self):
        with patch.object(deployer, 'schema_identity', side_effect=[OLD_SCHEMA, NEW_SCHEMA]), \
                patch.object(deployer, 'run', side_effect=self.command), patch.object(deployer, 'ready'):
            self.activate()
        self.assertEqual(self.events[0][0], ('systemctl', 'stop', 'somewhere.service'))
        self.assertEqual(self.events[1][0][-1], str(self.candidate / 'somewhere-migrate'))
        self.assertEqual(self.link.resolve(), self.candidate)
        self.assertEqual([(event[1], event[2]) for event in self.restarts()], [(self.candidate, b'new unit')])

    def test_unchanged_schema_restores_binary_and_original_unit(self):
        with patch.object(deployer, 'schema_identity', side_effect=[OLD_SCHEMA, OLD_SCHEMA]), \
                patch.object(deployer, 'run', side_effect=self.command), \
                patch.object(deployer, 'ready', side_effect=[RuntimeError('candidate unhealthy'), None]):
            with self.assertRaisesRegex(RuntimeError, 'candidate unhealthy'):
                self.activate()
        self.assertEqual(self.link.resolve(), self.previous)
        self.assertEqual(self.unit.read_bytes(), b'old unit')
        self.assertEqual([event[1] for event in self.restarts()], [self.candidate, self.previous])

    def test_changed_checksum_also_refuses_previous_binary(self):
        changed_checksum = (True, ((1, 'c' * 64),))
        for identity in (NEW_SCHEMA, changed_checksum):
            with self.subTest(identity=identity):
                self.link.unlink()
                self.link.symlink_to(self.previous)
                self.unit.write_bytes(b'old unit')
                self.events.clear()
                with patch.object(deployer, 'schema_identity', side_effect=[OLD_SCHEMA, identity]), \
                        patch.object(deployer, 'run', side_effect=self.command), \
                        patch.object(deployer, 'ready', side_effect=RuntimeError('candidate unhealthy')):
                    with self.assertRaisesRegex(RuntimeError, 'Automatic rollback refused'):
                        self.activate()
                self.assertEqual(self.link.resolve(), self.candidate)
                self.assertEqual([event[1] for event in self.restarts()], [self.candidate])
                self.assertEqual(self.events[-1][0], ('systemctl', 'stop', 'somewhere.service'))

    def test_unknown_after_migration_keeps_candidate_stopped(self):
        with patch.object(deployer, 'schema_identity', side_effect=[OLD_SCHEMA, RuntimeError('database unavailable')]), \
                patch.object(deployer, 'run', side_effect=self.command), patch.object(deployer, 'ready') as ready:
            with self.assertRaisesRegex(RuntimeError, 'schema unknown'):
                self.activate()
        self.assertEqual(self.link.resolve(), self.candidate)
        self.assertEqual(self.restarts(), [])
        ready.assert_not_called()

    def test_failed_migration_only_recovers_if_identity_is_unchanged(self):
        def fail_migration(*args):
            self.command(*args)
            if args[-1] == str(self.candidate / 'somewhere-migrate'):
                raise RuntimeError('migration command failed')
        for identity in (OLD_SCHEMA, NEW_SCHEMA):
            with self.subTest(identity=identity):
                self.link.unlink()
                self.link.symlink_to(self.previous)
                self.events.clear()
                with patch.object(deployer, 'schema_identity', side_effect=[OLD_SCHEMA, identity]), \
                        patch.object(deployer, 'run', side_effect=fail_migration), patch.object(deployer, 'ready'):
                    with self.assertRaises(RuntimeError):
                        self.activate()
                expected = self.previous if identity == OLD_SCHEMA else self.candidate
                self.assertEqual(self.link.resolve(), expected)
                self.assertEqual([event[1] for event in self.restarts()], [self.previous] if identity == OLD_SCHEMA else [])

    def test_failed_preflight_or_stop_never_runs_migration(self):
        with patch.object(deployer, 'schema_identity', side_effect=RuntimeError('no identity')), patch.object(deployer, 'run') as run:
            with self.assertRaisesRegex(RuntimeError, 'no identity'):
                self.activate()
            run.assert_not_called()
        with patch.object(deployer, 'schema_identity', return_value=OLD_SCHEMA), \
                patch.object(deployer, 'run', side_effect=RuntimeError('stop failed')) as run:
            with self.assertRaisesRegex(RuntimeError, 'stop failed'):
                self.activate()
            run.assert_called_once_with('systemctl', 'stop', 'somewhere.service')
        self.assertEqual(self.link.resolve(), self.previous)

    def test_first_install_failure_leaves_candidate_stopped(self):
        self.link.unlink()
        self.unit.unlink()
        with patch.object(deployer, 'schema_identity', side_effect=[(False, ()), NEW_SCHEMA]), \
                patch.object(deployer, 'run', side_effect=self.command), \
                patch.object(deployer, 'ready', side_effect=RuntimeError('unhealthy')):
            with self.assertRaisesRegex(RuntimeError, 'Automatic rollback refused'):
                self.activate()
        self.assertEqual(self.link.resolve(), self.candidate)
        self.assertEqual([event[1] for event in self.restarts()], [self.candidate])
        self.assertEqual(self.events[-1][0], ('systemctl', 'stop', 'somewhere.service'))

    def test_web_failure_preserves_atomic_rollback_without_schema_probe(self):
        with patch.object(deployer, 'schema_identity') as schema, \
                patch.object(deployer, 'run', side_effect=self.command), \
                patch.object(deployer, 'ready', side_effect=RuntimeError('web unhealthy')):
            with self.assertRaisesRegex(RuntimeError, 'web unhealthy'):
                deployer.activate_web(self.candidate, self.link, self.unit)
            schema.assert_not_called()
        self.assertEqual(self.link.resolve(), self.previous)
        self.assertEqual([event[1] for event in self.restarts()], [self.candidate, self.previous])

    def test_acceptance_still_rejects_before_activation(self):
        with patch.object(deployer.os, 'geteuid', return_value=0), \
                patch.object(deployer, 'activate_backend') as backend, patch.object(deployer, 'activate_web') as web:
            with self.assertRaisesRegex(ValueError, 'acceptance receipt'):
                deployer.deploy(self.base, None)
            backend.assert_not_called()
            web.assert_not_called()


if __name__ == '__main__':
    unittest.main()
