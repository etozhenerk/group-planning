"""Exporter failures must never publish invented zeros or arbitrary labels."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('metrics', Path(__file__).with_name('postgres-metrics.py'))
metrics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metrics)


class BusinessMetricsTests(unittest.TestCase):
    def test_complete_snapshot_and_real_zero(self):
        source = dict.fromkeys(metrics.BUSINESS_FIELDS, 0)
        source['tracking_started_timestamp_seconds'] = 1792920000
        with patch.object(metrics.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(source))) as run:
            values = metrics.collect_business()
        self.assertEqual(values['somewhere_business_collection_success'], 1)
        self.assertEqual(values['somewhere_business_users'], 0)
        self.assertEqual(len(values), 9)
        self.assertEqual(run.call_args.kwargs['timeout'], 3)

    def test_missing_invalid_and_unbounded_values_are_not_exported(self):
        source = dict.fromkeys(metrics.BUSINESS_FIELDS, 1)
        for invalid in [None, {}, [], {**source, 'private_user_id': 12},
                        {**source, 'users': -1}, {**source, 'users': float('nan')},
                        {**source, 'users': True}, {**source, 'users': 'private'}]:
            with self.subTest(invalid=invalid):
                with patch.object(metrics.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(invalid))):
                    self.assertEqual(metrics.collect_business(), {'somewhere_business_collection_success': 0})

    def test_database_failure_omits_business_values(self):
        for failure in [subprocess.TimeoutExpired('psql', 3), subprocess.CalledProcessError(1, 'psql'), OSError()]:
            with patch.object(metrics.subprocess, 'run', side_effect=failure):
                self.assertEqual(metrics.collect_business(), {'somewhere_business_collection_success': 0})


if __name__ == '__main__':
    unittest.main()
