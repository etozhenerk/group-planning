#!/usr/bin/env python3
"""Write job and workflow summaries without hiding failed or skipped steps."""

import html
import json
import os
from pathlib import Path
import re
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / ".ci-results"
ICONS = {"success": "✅", "failure": "❌", "cancelled": "⏹", "skipped": "⏭"}


def cell(value):
    return html.escape(str(value)).replace("|", "&#124;").replace("\n", " ")


def diagnostic(log):
    lines = log.read_text(errors="replace").splitlines()
    error = re.compile(r"error:|\berror\b|failed|failure|caused by|what went wrong", re.I)
    selected = set(range(max(0, len(lines) - 20), len(lines)))
    for index, line in enumerate(lines):
        if error.search(line):
            selected.update(range(max(0, index - 1), min(len(lines), index + 3)))
            if len(selected) >= 55:
                break
    return "\n".join(lines[index] for index in sorted(selected))[-6000:]


def stage_report(stage, steps):
    rows = [
        f"## {cell(stage)}", "", "| Шаг | Результат | Время |", "| --- | --- | --- |"
    ]
    failures = []
    for name, step in steps.items():
        status = step["outcome"]
        path = RESULTS / f"{name}.json"
        result = json.loads(path.read_text()) if path.exists() else {}
        duration = f"{result['seconds']} s" if "seconds" in result else "—"
        rows.append(
            f"| {cell(name)} | {ICONS.get(status, '❔')} {cell(status)} | {duration} |"
        )
        if status not in ("failure", "cancelled"):
            continue
        code = result.get("exit_code")
        detail = f"### {cell(name)}" + (f" · exit {code}" if code is not None else "")
        log = RESULTS / f"{name}.log"
        if log.exists():
            detail += f"\n\n<pre>{html.escape(diagnostic(log))}</pre>"
        else:
            detail += "\n\nОшибка подготовки окружения; подробности — в логе шага Actions."
        failures.append(detail)

    details = "\n\n".join(failures)
    report = "\n".join(rows) + "\n\n" + details
    report += "\n\nПолный вывод — в шагах Actions. Текстовые логи — в артефакте этого этапа.\n"
    return report, details


def workflow_report(needs):
    rows = ["## Итоги прогона", "", "| Этап | Результат |", "| --- | --- |"]
    failures = []
    for name, job in needs.items():
        status = job["result"]
        rows.append(f"| {cell(name)} | {ICONS.get(status, '❔')} {cell(status)} |")
        details = job.get("outputs", {}).get("failures", "")
        if details:
            failures.append(f"## {cell(name)}\n\n{details}")
        elif status in ("failure", "cancelled"):
            failures.append(
                f"## {cell(name)}\n\nСм. лог job: ошибка до формирования отчёта "
                "или при его публикации."
            )
    return "\n".join(rows) + "\n\n" + "\n\n".join(failures) + "\n"


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "stage":
        report, failures = stage_report(sys.argv[2], json.loads(os.environ["STEPS_JSON"]))
        RESULTS.mkdir(exist_ok=True)
        (RESULTS / "summary.md").write_text(report, encoding="utf-8")
        if os.environ.get("GITHUB_OUTPUT"):
            delimiter = uuid.uuid4().hex
            with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
                output.write(f"failures<<{delimiter}\n{failures}\n{delimiter}\n")
    elif sys.argv[1:] == ["workflow"]:
        report = workflow_report(json.loads(os.environ["NEEDS_JSON"]))
    else:
        sys.exit("Usage: report.py stage <name> | workflow")

    print(report)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
            summary.write(report)


if __name__ == "__main__":
    main()
