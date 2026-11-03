#!/usr/bin/env python3
"""Получение OAuth из Lockbox в существующий закрытый EnvironmentFile."""
import argparse
import json
import os
from pathlib import Path
import shlex
import stat
import sys
import tempfile
import urllib.request


KEYS = ('SOMEWHERE_YANDEX_CLIENT_ID', 'SOMEWHERE_YANDEX_CLIENT_SECRET')


def read_json(request):
    with urllib.request.urlopen(request, timeout=10) as response:
        body = response.read(65537)
    if len(body) > 65536:
        raise ValueError('oversized configuration')
    return json.loads(body)


def fetch(secret_id):
    metadata = urllib.request.Request(
        'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',
        headers={'Metadata-Flavor': 'Google'})
    token = read_json(metadata)['access_token']
    request = urllib.request.Request(
        'https://payload.lockbox.api.cloud.yandex.net/lockbox/v1/secrets/' + secret_id + '/payload',
        headers={'Authorization': 'Bearer ' + token})
    entries = read_json(request).get('entries', [])
    values = {}
    for entry in entries:
        key = entry.get('key')
        value = entry.get('textValue')
        if key not in KEYS or key in values or not isinstance(value, str) or not value:
            raise ValueError('invalid configuration entries')
        if any(character in value for character in '\r\n\x00'):
            raise ValueError('invalid configuration value')
        values[key] = value
    if set(values) != set(KEYS):
        raise ValueError('incomplete configuration')
    return values


def synchronize(path, values, check=False):
    metadata = path.lstat()
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_mode & 0o027:
        raise ValueError('configuration must be a private regular file')
    lines = path.read_text().splitlines(keepends=True)
    found = set()
    changed = False
    for index, line in enumerate(lines):
        key, separator, value = line.partition('=')
        if not separator or key not in KEYS:
            continue
        if key in found:
            raise ValueError('duplicate configuration key')
        found.add(key)
        if shlex.split(value, comments=True) != [values[key]]:
            changed = True
            lines[index] = key + '=' + shlex.quote(values[key]) + '\n'
    if found != set(KEYS):
        raise ValueError('configuration keys missing')
    if check:
        if changed:
            raise ValueError('configuration differs')
        return False
    if not changed:
        return False
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as output:
            temporary = Path(output.name)
            os.fchown(output.fileno(), metadata.st_uid, metadata.st_gid)
            os.fchmod(output.fileno(), stat.S_IMODE(metadata.st_mode))
            output.write(''.join(lines))
            output.flush()
            os.fsync(output.fileno())
        temporary.replace(path)
        temporary = None
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--secret-id', required=True)
    parser.add_argument('--environment', required=True, type=Path)
    parser.add_argument('--check', action='store_true')
    arguments = parser.parse_args()
    if not arguments.secret_id.isalnum():
        raise ValueError('invalid secret identifier')
    changed = synchronize(arguments.environment, fetch(arguments.secret_id), arguments.check)
    print(json.dumps({'verified_keys': len(KEYS), 'changed': changed}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # URL/HTTP/JSON/file exceptions can contain credentials or private content.
        print('OAuth configuration sync failed: ' + type(error).__name__, file=sys.stderr)
        raise SystemExit(1) from None
