#!/usr/bin/env python3
"""Disposable cloud-VM check; never stop production or use its database."""
import base64
import datetime
import hashlib
import http.client
import json
import multiprocessing
import os
from pathlib import Path
import pwd
import secrets
import select
import signal
import socket
import ssl
import struct
import subprocess
import tempfile
import threading
import time
import uuid


def command(arguments, **kwargs):
    result = subprocess.run(arguments, capture_output=True, text=True, timeout=30, **kwargs)
    if result.returncode:
        raise RuntimeError('command failed: ' + arguments[0])
    return result.stdout.strip()


def sql(database, query, user='postgres'):
    return command(['runuser', '-u', user, '--', 'psql', '-X', '-q', '-A', '-t',
                    '-v', 'ON_ERROR_STOP=1', '-d', database], input=query)


def literal(value):
    return "'" + value.replace("'", "''") + "'"


def available_port():
    with socket.socket() as connection:
        connection.bind(('127.0.0.1', 0))
        return connection.getsockname()[1]


def proxy(control, paused, directory, uid, gid):
    os.setgroups([])
    os.setgid(gid)
    os.setuid(uid)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(str(directory / 'server.crt'), str(directory / 'server.key'))
    connections = set()
    lock = threading.Lock()

    def handle(client):
        backend = None
        try:
            client.settimeout(5)
            request = b''
            while len(request) < 8:
                part = client.recv(8 - len(request))
                if not part:
                    return
                request += part
            if request != struct.pack('!II', 8, 80877103):
                return
            client.sendall(b'S')
            client = context.wrap_socket(client, server_side=True)
            backend = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            backend.connect('/var/run/postgresql/.s.PGSQL.5432')
            with lock:
                connections.update([client, backend])
            while not paused.is_set():
                readable, _, _ = select.select([client, backend], [], [], 0.1)
                for source in readable:
                    data = source.recv(65536)
                    if not data:
                        return
                    (backend if source is client else client).sendall(data)
        except (OSError, ssl.SSLError):
            pass
        finally:
            with lock:
                connections.discard(client)
                connections.discard(backend)
            client.close()
            if backend is not None:
                backend.close()

    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        listener.listen(20)
        listener.settimeout(0.1)
        control.send(listener.getsockname()[1])
        while True:
            if paused.is_set():
                with lock:
                    for connection in list(connections):
                        try:
                            connection.shutdown(socket.SHUT_RDWR)
                        except OSError:
                            pass
            try:
                client, _ = listener.accept()
            except socket.timeout:
                continue
            if paused.is_set():
                client.close()
            else:
                threading.Thread(target=handle, args=(client,), daemon=True).start()


def stop(process):
    if process.poll() is None:
        process.send_signal(signal.SIGTERM)
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


def main():
    assert os.geteuid() == 0
    os.umask(0o077)
    account = pwd.getpwnam('somewhere')
    nonce = uuid.uuid4().hex
    database = 'somewhere_sdd_endpoint_' + nonce[:12]
    marker = 'somewhere-sdd-endpoint:' + nonce
    binary = Path('/opt/somewhere/backend/current/somewhere-api').resolve()
    migrator = Path('/opt/somewhere/backend/current/somewhere-migrate').resolve()
    receipt = {'started_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'binary': str(binary), 'binary_sha256': hashlib.sha256(binary.read_bytes()).hexdigest(),
               'database': database, 'checks': [], 'cleanup': {}}
    before = command(['systemctl', 'show', 'somewhere.service', '--property=MainPID,ActiveState'])
    print(json.dumps({'test_database': database, 'test_marker': marker}), flush=True)
    processes = []
    proxies = []
    logs = []
    created = False

    def checked(name, **details):
        receipt['checks'].append({'check': name, 'result': 'passed', **details})
        print(json.dumps(receipt['checks'][-1]), flush=True)

    try:
        assert not sql('postgres', 'SELECT 1 FROM pg_database WHERE datname=' + literal(database))
        sql('postgres', 'CREATE DATABASE ' + database + ' OWNER somewhere_migrator;')
        created = True
        sql('postgres', 'COMMENT ON DATABASE ' + database + ' IS ' + literal(marker) +
            '; REVOKE CONNECT ON DATABASE ' + database + ' FROM PUBLIC; GRANT CONNECT ON DATABASE ' +
            database + ' TO somewhere,somewhere_migrator;')
        with tempfile.TemporaryDirectory(prefix='somewhere-sdd-endpoint-') as temporary:
            directory = Path(temporary)
            os.chown(directory, account.pw_uid, account.pw_gid)
            for name, address in [('server', 'IP:127.0.0.1'), ('wrong', 'DNS:wrong.invalid')]:
                command(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
                         '-subj', '/CN=sdd.invalid', '-addext', 'subjectAltName=' + address,
                         '-keyout', str(directory / (name + '.key')), '-out', str(directory / (name + '.crt'))])
            for path in directory.iterdir():
                os.chown(path, account.pw_uid, account.pw_gid)
                path.chmod(0o600)
            dsn = 'host=/var/run/postgresql dbname=' + database + ' user=somewhere_migrator sslmode=disable'
            command(['runuser', '-u', 'somewhere_migrator', '--', 'env', '-i',
                     'PATH=/usr/bin:/bin', 'SOMEWHERE_DATABASE_URL=' + dsn, str(migrator)])
            sql(database, 'GRANT USAGE ON SCHEMA public TO somewhere; '
                'GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO somewhere; '
                'REVOKE INSERT,UPDATE,DELETE ON schema_migrations FROM somewhere;')
            version = sql(database, 'SHOW server_version;')
            privileges = json.loads(sql(database, "SELECT json_build_object('superuser',rolsuper,"
                "'createdb',rolcreatedb,'createrole',rolcreaterole) FROM pg_roles WHERE rolname=current_user;",
                user='somewhere'))
            assert not any(privileges.values())
            assert sql(database, 'SELECT extname FROM pg_extension ORDER BY extname;') == 'plpgsql'
            checked('separate_migrations_nonprivileged_runtime', postgres_version=version, flags=privileges,
                    extensions=['plpgsql'], migrations=sql(database, 'SELECT count(*) FROM schema_migrations;'))

            token = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=').decode()
            digest = hashlib.sha256(token.encode()).hexdigest()
            user_id, session_id = str(uuid.uuid4()), str(uuid.uuid4())
            now = datetime.datetime.now(datetime.timezone.utc)
            expires = (now + datetime.timedelta(hours=2)).isoformat()
            user = {'ID': user_id, 'DisplayName': 'Synthetic endpoint check', 'CreatedAt': now.isoformat()}
            session = {'ID': session_id, 'UserID': user_id, 'SecretHash': digest,
                       'ClientKind': 'ios', 'ExpiresAt': expires}
            sql(database, 'BEGIN; INSERT INTO identity_users VALUES(' + literal(user_id) + ',' +
                literal('sdd:' + nonce) + ',' + literal(json.dumps(user)) + '::jsonb); '
                'INSERT INTO identity_sessions VALUES(' + ','.join(map(literal, [digest, session_id, user_id, expires])) +
                ',' + literal(json.dumps(session)) + '::jsonb); COMMIT;')

            endpoints = []
            for _ in range(2):
                parent, child = multiprocessing.Pipe()
                paused = multiprocessing.Event()
                worker = multiprocessing.Process(target=proxy, args=(child, paused, directory, account.pw_uid, account.pw_gid))
                worker.start()
                proxies.append(worker)
                assert parent.poll(10)
                endpoints.append((parent.recv(), paused))

            def launch(endpoint, ca='server.crt'):
                http_port = available_port()
                database_url = ('host=127.0.0.1 port=' + str(endpoint) + ' dbname=' + database +
                    ' user=somewhere sslmode=verify-full sslrootcert=' + str(directory / ca))
                environment = ['PATH=/usr/bin:/bin', 'SOMEWHERE_STORAGE=postgres', 'SOMEWHERE_DATABASE_URL=' + database_url,
                    'SOMEWHERE_HTTP_ADDR=127.0.0.1:' + str(http_port), 'SOMEWHERE_AUTH_ENABLED=true',
                    'SOMEWHERE_PUBLIC_ORIGIN=https://sdd.invalid', 'SOMEWHERE_YANDEX_CLIENT_ID=' + '0' * 32,
                    'SOMEWHERE_YANDEX_CLIENT_SECRET=synthetic-provider-secret']
                log = tempfile.TemporaryFile(mode='w+t')
                logs.append(log)
                process = subprocess.Popen(['runuser', '-u', 'somewhere', '--', 'env', '-i', *environment, str(binary)],
                    stdout=log, stderr=log, start_new_session=True)
                processes.append(process)
                return process, http_port, log

            def request(port, method, path, payload=None, key=None, unread=False):
                connection = http.client.HTTPConnection('127.0.0.1', port, timeout=8)
                headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
                if key:
                    headers['Idempotency-Key'] = key
                try:
                    connection.request(method, path, None if payload is None else json.dumps(payload), headers)
                    response = connection.getresponse()
                    body = b'' if unread else response.read()
                    assert token.encode() not in body
                    return response.status, body
                finally:
                    connection.close()

            def ready(process, port):
                for _ in range(60):
                    if process.poll() is not None:
                        raise RuntimeError('test API exited before readiness')
                    try:
                        if request(port, 'GET', '/readyz')[0] == 200:
                            return
                    except (OSError, http.client.HTTPException):
                        pass
                    time.sleep(0.15)
                raise RuntimeError('test API readiness timeout')

            bad, _, _ = launch(endpoints[0][0], 'wrong.crt')
            assert bad.wait(timeout=20) != 0
            checked('untrusted_ca_rejected')

            first, http_port, _ = launch(endpoints[0][0])
            ready(first, http_port)
            assert request(http_port, 'GET', '/api/v1/me')[0] == 200
            checked('verified_tls_authenticated_api')
            key = str(uuid.uuid4())
            body = {'title': 'Synthetic endpoint portability', 'starts_on': (now + datetime.timedelta(days=1)).date().isoformat(),
                    'timezone': 'UTC'}
            assert request(http_port, 'POST', '/api/v1/meetings', body, key, unread=True)[0] == 201
            assert sql(database, 'SELECT count(*) FROM meetings;') == '1'
            checked('committed_response_body_discarded')

            endpoints[0][1].set()
            time.sleep(0.3)
            assert request(http_port, 'GET', '/healthz')[0] == 200
            assert request(http_port, 'GET', '/readyz')[0] == 503
            failed_status, _ = request(http_port, 'POST', '/api/v1/meetings', body, str(uuid.uuid4()))
            assert failed_status >= 500
            assert sql(database, 'SELECT count(*) FROM meetings;') == '1'
            endpoints[0][1].clear()
            ready(first, http_port)
            assert first.poll() is None
            assert request(http_port, 'GET', '/api/v1/me')[0] == 200
            checked('pool_recovers_without_api_restart', failure_http_status=failed_status, api_launcher_pid=first.pid)

            stop(first)
            second, next_http_port, _ = launch(endpoints[1][0])
            ready(second, next_http_port)
            assert request(next_http_port, 'GET', '/api/v1/me')[0] == 200
            status, response = request(next_http_port, 'POST', '/api/v1/meetings', body, key)
            assert status == 201
            assert json.loads(response)['meeting']['title'] == body['title']
            assert sql(database, 'SELECT count(*) FROM meetings;') == '1'
            checked('dsn_endpoint_switch_and_idempotent_retry', old_database_port=endpoints[0][0],
                    new_database_port=endpoints[1][0], meetings=1)
            stop(second)
            for log in logs:
                log.seek(0)
                content = log.read()
                assert token not in content and 'synthetic-provider-secret' not in content
            checked('no_credentials_in_application_logs')
            receipt['result'] = 'passed'
    finally:
        for process in processes:
            stop(process)
        for worker in proxies:
            if worker.is_alive():
                worker.terminate()
            worker.join(timeout=5)
        for log in logs:
            log.close()
        if created:
            assert sql('postgres', "SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=" + literal(database)) == marker
            sql('postgres', 'DROP DATABASE ' + database + ';')
            assert not sql('postgres', 'SELECT 1 FROM pg_database WHERE datname=' + literal(database))
            receipt['cleanup']['own_database_removed'] = True
        receipt['cleanup']['production_service_unchanged'] = before == command([
            'systemctl', 'show', 'somewhere.service', '--property=MainPID,ActiveState'])
        receipt['finished_utc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        print(json.dumps(receipt), flush=True)


if __name__ == '__main__':
    main()
