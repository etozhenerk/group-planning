"""Создаёт test-only Go overlay для native-входа по реальной fixture-ссылке."""

import difflib
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def digest(data):
    return hashlib.sha256(data).hexdigest()


project = next(
    parent for parent in Path(__file__).resolve().parents
    if (parent / "backend/go.mod").is_file()
)
output = Path(sys.argv[1]).resolve()
output.mkdir(parents=True, exist_ok=False)
replacement = {}
sources = []
for name in ["ios_fixture_test.go", "android_fixture_test.go"]:
    source = project / "backend/internal/httpapi" / name
    original = source.read_text()
    needle = "func(context.Context, string) (bool, error) { return false, nil }"
    if original.count(needle) != 1:
        raise ValueError(f"Unexpected fixture resolver: {name}")
    updated = original.replace('\t"context"\n', '\t"context"\n\t"errors"\n', 1)
    updated = updated.replace("\tstore := memory.New()\n", "", 1)
    updated = updated.replace(
        "\tidentities := memory.NewIdentity()\n",
        "\tstore := memory.New()\n\tidentities := memory.NewIdentity()\n", 1,
    )
    updated = updated.replace(needle, """func(ctx context.Context, token string) (bool, error) {
        _, err := meetings.Preview(ctx, store, token)
        if errors.Is(err, meetings.ErrNotFound) { return false, nil }
        return err == nil, err
    }""")
    target = output / name
    target.write_text(updated)
    subprocess.run(["gofmt", "-w", str(target)], check=True)
    updated = target.read_text()
    replacement[str(source)] = str(target)
    (output / f"{name}.diff").write_text("".join(difflib.unified_diff(
        original.splitlines(True), updated.splitlines(True),
        fromfile=f"original/{name}", tofile=f"overlay/{name}",
    )))
    sources.append({
        "path": str(source.relative_to(project)),
        "originalSha256": digest(source.read_bytes()),
        "overlaySha256": digest(target.read_bytes()),
    })
production = [
    {"path": str(path.relative_to(project)), "sha256": digest(path.read_bytes())}
    for path in sorted((project / "backend").rglob("*.go"))
    if not path.name.endswith("_test.go")
]
(output / "overlay.json").write_text(json.dumps({"Replace": replacement}, indent=2) + "\n")
(output / "provenance.json").write_text(json.dumps({
    "scope": "test-only fixture wiring; production Go files unchanged",
    "sources": sources, "productionFiles": production,
}, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"output": str(output), "productionFiles": len(production)}))
