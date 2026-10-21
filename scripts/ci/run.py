#!/usr/bin/env python3
"""Stream one check, preserve its exit status and retain a bounded text log."""

import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / ".ci-results"
LOG_LIMIT = 2 * 1024 * 1024


def main():
    if len(sys.argv) < 3 or not re.fullmatch(r"[a-z][a-z0-9_-]*", sys.argv[1]):
        sys.exit("Usage: run.py <step-id> <command> [arguments...]")

    step, command = sys.argv[1], sys.argv[2:]
    RESULTS.mkdir(exist_ok=True)
    log_path = RESULTS / f"{step}.log"
    result_path = RESULTS / f"{step}.json"
    result = {"command": shlex.join(command), "exit_code": None}
    result_path.write_text(json.dumps(result), encoding="utf-8")
    started = time.monotonic()

    with log_path.open("wb") as log:
        try:
            with subprocess.Popen(
                command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
            ) as process:
                for line in iter(process.stdout.readline, b""):
                    sys.stdout.buffer.write(line)
                    sys.stdout.buffer.flush()
                    log.write(line)
                code = process.wait()
            code = code if code >= 0 else 128 - code
        except OSError as error:
            message = f"Cannot run {command[0]}: {error}\n".encode()
            sys.stderr.buffer.write(message)
            log.write(message)
            code = 127

    # Full output remains in the Actions console; artifacts contain at most 2 MiB per command.
    if log_path.stat().st_size > LOG_LIMIT:
        with log_path.open("rb") as log:
            log.seek(-LOG_LIMIT, os.SEEK_END)
            tail = log.read()
        log_path.write_bytes(b"[Earlier output is in the Actions step log]\n" + tail)

    result.update(exit_code=code, seconds=round(time.monotonic() - started, 1))
    result_path.write_text(json.dumps(result), encoding="utf-8")
    sys.exit(code)


if __name__ == "__main__":
    main()
