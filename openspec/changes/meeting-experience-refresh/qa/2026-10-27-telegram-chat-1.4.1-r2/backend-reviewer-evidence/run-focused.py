from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import sys

root = Path.cwd()
evidence = Path(__file__).resolve().parent
run = evidence / sys.argv[1]
run.mkdir()
command = ["go", "test", "-overlay=" + str(evidence / "overlay.json"), "-p", "1", "-race", "-count=1", "-run", "^TestIndependent", "-json", "./internal/httpapi"]
metadata = {"command": command, "cwd": "backend", "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "GOMAXPROCS": "2", "sources": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in evidence.glob("*_test.go")}}
(run / "command.json").write_text(json.dumps(metadata, indent=2) + "\n")
environment = dict(os.environ, GOMAXPROCS="2", INDEPENDENT_REVIEW_OUTPUT=str(run))
with (run / "raw.jsonl").open("wb") as output:
    result = subprocess.run(command, cwd=root / "backend", env=environment, stdout=output, stderr=subprocess.STDOUT)
metadata.update(finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), exitCode=result.returncode)
(run / "command.json").write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps(metadata, indent=2))
for line in (run / "raw.jsonl").read_text().splitlines():
    try:
        event = json.loads(line)
        if event.get("Action") in ["fail", "pass"] and "/" not in event.get("Test", ""):
            print(json.dumps(event, ensure_ascii=False))
        if event.get("Action") == "output" and ("build failed" in event.get("Output", "") or "undefined:" in event.get("Output", "")):
            print(event["Output"])
    except ValueError:
        print(line)
sys.exit(result.returncode)
