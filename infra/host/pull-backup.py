#!/usr/bin/env python3
"""Скачать и сверить последнюю age-копию на компьютер владельца, не расшифровывая."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', required=True)
    parser.add_argument('--key', required=True)
    parser.add_argument('--known-hosts', required=True)
    parser.add_argument('--bucket', required=True)
    parser.add_argument('--yc', default='yc')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'[a-zA-Z0-9.@-]+', args.host) or args.host.startswith('-'):
        parser.error('Invalid SSH host')
    if not re.fullmatch(r'[a-z0-9][a-z0-9.-]+[a-z0-9]', args.bucket):
        parser.error('Invalid bucket')
    os.umask(0o077)
    manifest = json.loads(subprocess.check_output([
        'ssh', '-i', args.key, '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
        '-o', 'UserKnownHostsFile=' + args.known_hosts, args.host,
        'sudo cat /var/lib/somewhere-backup/latest.json'], text=True))
    if not re.fullmatch(r'database/\d{8}T\d{6}Z\.dump\.age', manifest['object']):
        raise ValueError('Unexpected object key')
    token = subprocess.check_output([args.yc, 'iam', 'create-token'], text=True).strip()
    request = urllib.request.Request(
        f'https://storage.yandexcloud.net/{args.bucket}/{manifest["object"]}',
        headers={'Authorization': 'Bearer ' + token})
    destination = Path(args.output)
    digest = hashlib.sha256()
    with tempfile.NamedTemporaryFile(dir=destination.parent) as output:
        with urllib.request.urlopen(request, timeout=60) as response:
            for chunk in iter(lambda: response.read(1024 * 1024), b''):
                output.write(chunk)
                digest.update(chunk)
        output.flush()
        os.fsync(output.fileno())
        if digest.hexdigest() != manifest['sha256']:
            raise ValueError('Backup checksum mismatch')
        staged = destination.with_suffix(destination.suffix + '.next')
        staged.unlink(missing_ok=True)
        os.link(output.name, staged)
        staged.replace(destination)
    destination.with_suffix(destination.suffix + '.json').write_text(json.dumps(manifest) + '\n')
    print('Encrypted backup downloaded; SHA256 verified. No decryption performed.')


if __name__ == '__main__':
    main()
