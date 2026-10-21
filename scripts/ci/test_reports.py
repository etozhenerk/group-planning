import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("report", SOURCE / "report.py")
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)


class ReportingTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.scripts = self.root / "scripts" / "ci"
        self.scripts.mkdir(parents=True)
        shutil.copy(SOURCE / "run.py", self.scripts)
        shutil.copy(SOURCE / "report.py", self.scripts)
        self.results = self.root / ".ci-results"

    def run_check(self, *command):
        return subprocess.run(
            [sys.executable, str(self.scripts / "run.py"), "check", *command],
            cwd=self.root,
            capture_output=True,
        )

    def test_failure_keeps_exit_code_and_both_output_streams(self):
        result = self.run_check(sys.executable, "-c", "import sys; print('out'); print('err', file=sys.stderr); sys.exit(23)")
        self.assertEqual(result.returncode, 23)
        self.assertIn(b"out", result.stdout)
        self.assertIn(b"err", result.stdout)
        self.assertEqual(json.loads((self.results / "check.json").read_text())["exit_code"], 23)
        self.assertEqual((self.results / "check.log").read_bytes(), result.stdout)

    def test_success_does_not_interpret_arguments_as_shell(self):
        literal = "$(touch unexpected); `touch other`"
        result = self.run_check(sys.executable, "-c", "import sys; print(sys.argv[1])", literal)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.decode().strip(), literal)
        self.assertFalse((self.root / "unexpected").exists())

    def test_missing_command_fails_and_records_diagnostic(self):
        result = self.run_check(str(self.root / "missing"))
        self.assertEqual(result.returncode, 127)
        self.assertIn("Cannot run", (self.results / "check.log").read_text())

    def test_signal_is_not_reported_as_success(self):
        result = self.run_check(sys.executable, "-c", "import os, signal; os.kill(os.getpid(), signal.SIGTERM)")
        self.assertEqual(result.returncode, 143)

    def test_artifact_is_bounded_and_keeps_failure_at_end(self):
        result = self.run_check(sys.executable, "-c", "print('x' * (3 * 1024 * 1024)); print('FAILURE AT END'); exit(1)")
        self.assertEqual(result.returncode, 1)
        log = (self.results / "check.log").read_bytes()
        self.assertLess(len(log), 2 * 1024 * 1024 + 100)
        self.assertTrue(log.endswith(b"FAILURE AT END\n"))

    def test_failure_summary_escapes_log_markup_and_retains_exit_code(self):
        self.run_check(sys.executable, "-c", "print('<script>bad</script>'); exit(7)")
        with patch.object(report, "RESULTS", self.results):
            summary, failures = report.stage_report("tests", {"check": {"outcome": "failure"}})
        self.assertIn("❌ failure", summary)
        self.assertIn("exit 7", failures)
        self.assertIn("&lt;script&gt;", failures)
        self.assertNotIn("<script>", failures)

    def test_setup_failure_does_not_turn_skipped_tests_green(self):
        summary, failures = report.stage_report("tests", {
            "node": {"outcome": "failure"}, "unit": {"outcome": "skipped"},
        })
        self.assertIn("Ошибка подготовки окружения", failures)
        self.assertIn("⏭ skipped", summary)
        self.assertNotIn("✅", summary)

    def test_summary_keeps_error_followed_by_verbose_cleanup(self):
        self.run_check(sys.executable, "-c", "print('error: assertion failed'); print('cleanup\\n' * 100)")
        excerpt = report.diagnostic(self.results / "check.log")
        self.assertIn("error: assertion failed", excerpt)
        self.assertIn("cleanup", excerpt)

    def test_workflow_preserves_failed_cancelled_and_skipped_jobs(self):
        summary = report.workflow_report({
            "build": {"result": "success"},
            "checkers": {"result": "failure", "outputs": {"failures": "lint diagnostic"}},
            "tests": {"result": "cancelled"},
            "optional": {"result": "skipped"},
        })
        for value in ("❌ failure", "⏹ cancelled", "⏭ skipped", "lint diagnostic"):
            self.assertIn(value, summary)

    def test_cli_writes_github_summary_and_multiline_output(self):
        summary = self.root / "summary.md"
        output = self.root / "output"
        result = subprocess.run(
            [sys.executable, str(self.scripts / "report.py"), "stage", "tests"],
            env={**os.environ, "STEPS_JSON": '{"ready":{"outcome":"failure"}}',
                 "GITHUB_STEP_SUMMARY": str(summary), "GITHUB_OUTPUT": str(output)},
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("❌ failure", summary.read_text())
        lines = output.read_text().splitlines()
        self.assertEqual(lines[0].split("<<")[1], lines[-1])


if __name__ == "__main__":
    unittest.main()
