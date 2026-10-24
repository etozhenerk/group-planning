"""Собрать воспроизводимый source archive Cloud Functions без конфигурации/тестов."""
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'build' / 'function.zip'
output.parent.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='somewhere-bot-') as temporary:
    staging = Path(temporary)
    paths = [root / name for name in ['go.mod', 'go.sum', 'handler.go', 'probe.go', 'main.go']]
    paths += [p for p in (root / 'internal').rglob('*')
              if p.is_file() and p.suffix in {'.go', '.json'} and not p.name.endswith('_test.go')]
    for source in paths:
        target = staging / source.relative_to(root)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    subprocess.run(['go', 'mod', 'vendor'], cwd=staging, check=True)
    # The cloud builder runs go get, which ignores vendor and needs the module
    # graph. Bundle the selected packages as local replacement modules instead.
    vendor = staging / 'vendor'
    modules = re.findall(r'^# (\S+) (v\S+)$', (vendor / 'modules.txt').read_text(), re.M)
    bundled = staging / 'bundled'
    for module, _version in modules:
        target = bundled / module
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(vendor / module), target)
        (target / 'go.mod').write_text(f'module {module}\n\ngo 1.18\n')
    shutil.rmtree(vendor)
    module_name = re.search(r'^module (\S+)', (root / 'go.mod').read_text(), re.M).group(1)
    deployment_mod = f'module {module_name}\n\n'
    deployment_mod += ''.join(f'require {module} {version}\n' for module, version in modules)
    deployment_mod += '\n' + ''.join(
        f'replace {module} => ./bundled/{module}\n' for module, _version in modules)
    # Yandex sets the plugin's Go version; the uploaded root must not pin it.
    (staging / 'go.mod').write_text(deployment_mod)
    go_binary = Path(subprocess.check_output(['go', 'env', 'GOROOT'], text=True).strip()) / 'bin/go'
    environment = dict(os.environ, GOOS='linux', GOARCH='amd64', CGO_ENABLED='0',
                       GOPROXY='off', GOSUMDB='off', GOTOOLCHAIN='local',
                       GOMODCACHE=str(staging / '.module-cache'))
    subprocess.run([go_binary, 'get', '-d', './...'], cwd=staging, env=environment, check=True)
    subprocess.run([go_binary, 'build', '-mod=mod', './...'], cwd=staging, env=environment, check=True)
    plugin_environment = dict(environment, CGO_ENABLED='1')
    plugin_environment.pop('GOOS')
    plugin_environment.pop('GOARCH')
    plugin = staging / 'validation.so'
    subprocess.run([go_binary, 'build', '-mod=mod', '-tags=ycf', '-buildmode=plugin',
                    '-o', str(plugin), '.'], cwd=staging, env=plugin_environment, check=True)
    plugin.unlink()
    (staging / 'go.mod').write_text(deployment_mod)
    shutil.rmtree(staging / '.module-cache', ignore_errors=True)
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
