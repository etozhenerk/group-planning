"""Prepare synthetic identities for an already-owned QA DB; never runs SQL.

Outputs are private and must stay outside Git. Real OAuth is not exercised.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import uuid


def quote(value):
    return "'" + value.replace("'", "''") + "'"


def write_private(path, value):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as stream:
        stream.write(value)


def prepare(directory, nonce):
    if not re.fullmatch(r'codex-backend-release-[a-f0-9]{32}', nonce):
        raise ValueError('Expected own database ownership nonce')
    if not directory.is_absolute() or directory.exists():
        raise ValueError('Use a fresh absolute private directory')
    directory.mkdir(mode=0o700)
    now = datetime.datetime.now(datetime.timezone.utc)
    expiry = (now + datetime.timedelta(hours=6)).isoformat().replace('+00:00', 'Z')
    sql = [
        'BEGIN;',
        'DO $guard$ BEGIN',
        "IF current_database() <> 'somewhere_integration' THEN RAISE EXCEPTION 'Not QA database'; END IF;",
        "IF (SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=current_database()) IS DISTINCT FROM "
        + quote(nonce) + " THEN RAISE EXCEPTION 'QA ownership mismatch'; END IF;",
        "IF EXISTS (SELECT 1 FROM identity_users) THEN RAISE EXCEPTION 'QA identities not empty'; END IF;",
        'END $guard$;',
    ]
    profiles = []
    for name in ['QA Организатор', 'QA Участник', 'QA Наблюдатель']:
        user_id = str(uuid.uuid4())
        user = {'ID': user_id, 'DisplayName': name, 'CreatedAt': now.isoformat().replace('+00:00', 'Z')}
        subject = nonce + ':' + user_id
        sql.append('INSERT INTO identity_users(id,provider_subject,document) VALUES('
                   + ','.join(map(quote, [user_id, subject, json.dumps(user, ensure_ascii=False)])) + ');')
        profile = {'id': user_id, 'name': name, 'sessions': {}}
        for kind in ['web', 'ios', 'android']:
            token = secrets.token_urlsafe(32)
            digest = hashlib.sha256(token.encode()).hexdigest()
            session_id = str(uuid.uuid4())
            session = {'ID': session_id, 'UserID': user_id, 'SecretHash': digest,
                       'ClientKind': kind, 'ExpiresAt': expiry}
            sql.append('INSERT INTO identity_sessions(secret_hash,id,user_id,expires_at,document) VALUES('
                       + ','.join(map(quote, [digest, session_id, user_id, expiry, json.dumps(session)])) + ');')
            profile['sessions'][kind] = {'secret': token, 'expiresAt': expiry}
        profiles.append(profile)
    sql.append('COMMIT;')
    write_private(directory / 'seed.sql', '\n'.join(sql) + '\n')
    write_private(directory / 'sessions.json', json.dumps({'databaseNonce': nonce, 'profiles': profiles}, ensure_ascii=False, indent=2) + '\n')
    return {'users': len(profiles), 'sessions': len(profiles) * 3,
            'expiresAt': expiry, 'directory': str(directory),
            'databaseModified': False, 'realOAuthExercised': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--database-nonce', required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(args.directory, args.database_nonce)))
