#!/usr/bin/env python3
"""Согласованный pg_dump → age → приватный S3; секреты только в памяти."""
import datetime
import fcntl
import hashlib
import http.client
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request


def main():
    os.umask(0o077)
    config = json.loads(Path('/etc/somewhere-backup/config.json').read_text())
    directory = Path('/var/lib/somewhere-backup')
    with (directory / 'backup.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with tempfile.NamedTemporaryFile(dir=directory, suffix='.age') as output:
            dump = subprocess.Popen(['pg_dump', '-Fc', '--dbname=somewhere'], stdout=subprocess.PIPE)
            try:
                encrypted = subprocess.run(['age', '-r', config['recipient']], stdin=dump.stdout, stdout=output, timeout=900)
                dump.stdout.close()
                if encrypted.returncode or dump.wait(timeout=30):
                    raise RuntimeError('dump or encryption failed')
            finally:
                if dump.poll() is None:
                    dump.kill()
                    dump.wait()
            output.flush()
            os.fsync(output.fileno())
            output.seek(0)
            digest = hashlib.file_digest(output, 'sha256').hexdigest()
            output.seek(0)
            metadata = urllib.request.Request(
                'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',
                headers={'Metadata-Flavor': 'Google'})
            with urllib.request.urlopen(metadata, timeout=5) as response:
                token = json.load(response)['access_token']
            stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
            object_key = f'database/{stamp}.dump.age'
            connection = http.client.HTTPSConnection('storage.yandexcloud.net', timeout=60)
            try:
                connection.putrequest('PUT', f'/{config["bucket"]}/{object_key}')
                connection.putheader('Authorization', 'Bearer ' + token)
                connection.putheader('Content-Length', str(os.fstat(output.fileno()).st_size))
                connection.putheader('Content-Type', 'application/octet-stream')
                connection.putheader('X-Amz-Meta-Sha256', digest)
                connection.endheaders()
                for chunk in iter(lambda: output.read(1024 * 1024), b''):
                    connection.send(chunk)
                response = connection.getresponse()
                if response.status != 200:
                    raise RuntimeError(f'backup upload returned HTTP {response.status}')
                response.read()
            finally:
                connection.close()
            # Предыдущая локальная копия заменяется только после успешной загрузки.
            latest = directory / 'latest.dump.age'
            staged = directory / 'latest.next.age'
            staged.unlink(missing_ok=True)
            os.link(output.name, staged)
            staged.replace(latest)
            manifest = {'object': object_key, 'sha256': digest, 'completed_at': int(time.time())}
            temporary = directory / 'latest.next.json'
            temporary.write_text(json.dumps(manifest) + '\n')
            temporary.chmod(0o640)
            temporary.replace(directory / 'latest.json')
            print(json.dumps(manifest))


if __name__ == '__main__':
    main()
