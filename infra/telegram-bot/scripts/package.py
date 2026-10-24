"""Собрать воспроизводимый source archive Cloud Functions без конфигурации/тестов."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'build' / 'function.zip'
output.parent.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='somewhere-bot-') as temporary:
    staging = Path(temporary)
    paths = [root / name for name in ['go.mod', 'go.sum', 'handler.go', 'probe.go']]
    paths += [p for p in (root / 'internal').rglob('*')
              if p.is_file() and p.suffix in {'.go', '.json'} and not p.name.endswith('_test.go')]
    for source in paths:
        target = staging / source.relative_to(root)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    subprocess.run(['go', 'mod', 'vendor'], cwd=staging, check=True)
    environment = dict(os.environ, GOOS='linux', GOARCH='amd64', CGO_ENABLED='0')
    subprocess.run(['go', 'build', '-mod=vendor', './...'], cwd=staging, env=environment, check=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(staging.rglob('*')):
            if not path.is_file():
                continue
            info = zipfile.ZipInfo(str(path.relative_to(staging)), date_time=(2026, 10, 25, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes())
print('Archive:', output)
print('SHA256:', hashlib.sha256(output.read_bytes()).hexdigest())
