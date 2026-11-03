"""Actual shared-VM hot-meeting measurements; receives isolated fixture context."""
import base64
from concurrent.futures import ThreadPoolExecutor
import datetime
import hashlib
import http.client
import json
import itertools
import math
import secrets
import subprocess
import threading
import time
import uuid


def hot_profile(context):
    database = context['database']
    def sql(name, query):
        process = subprocess.run(['runuser', '-u', 'postgres', '--', 'psql', '-X', '-q', '-A', '-t',
            '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=terse', '-d', name], input=query,
            text=True, capture_output=True, timeout=30)
        if process.returncode:
            raise RuntimeError('synthetic SQL: ' + process.stderr[:300])
        return process.stdout.strip()
    literal = base['literal']
    request = context['request']
    base['stop'](context['second'])
    direct, port, _ = context['launch'](0, direct=True)
    context['ready'](direct, port)
    owner = context['user_id']
    meeting = json.loads(request(port, 'GET', '/api/v1/meetings?limit=10')[1])['meetings'][0]['id']
    path = '/api/v1/meetings/' + meeting
    distributed = globals().get('distributed_profile', False)
    meeting_paths = [path]
    send_sequence = itertools.count()
    sockets = []
    measurements = []
    resources = []
    monitor_stop = threading.Event()
    monitor = None
    result = {'topology': 'distributed-20-meetings' if distributed else 'hot-one-meeting', 'database': database, 'database_transport': 'unix-socket-peer-like-production', 'profile': {'connections': 100, 'users': 20, 'baseline_messages_per_second': 5,
              'baseline_seconds': 900, 'burst_messages_per_second': 20, 'burst_seconds': 60}, 'completed': False}

    def send(index):
        identifier = str(uuid.uuid4())
        started = time.perf_counter()
        target = meeting_paths[next(send_sequence) % len(meeting_paths)]
        status, body = request(port, 'POST', target + '/messages',
            {'text': 'Synthetic hot profile ' + str(index), 'client_request_id': identifier}, identifier)
        duration = (time.perf_counter() - started) * 1000
        if status != 201:
            raise RuntimeError('synthetic message failed with status ' + str(status))
        measurements.append({'operation': 'send', 'sample': str(index), 'milliseconds': duration})
        return json.loads(body)['id']

    def guard():
        connection = http.client.HTTPConnection('127.0.0.1', 8080, timeout=3)
        try:
            connection.request('GET', '/readyz')
            response = connection.getresponse()
            assert response.status == 200, 'production readiness guard'
            response.read()
        finally:
            connection.close()
        memory = {line.split(':')[0]: int(line.split()[1]) for line in open('/proc/meminfo')}
        assert memory['MemAvailable'] > 512 * 1024, 'available-memory guard'
        assert not any(client.error for client in sockets), 'test socket disconnected'
        connections = int(sql(database, "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database();"))
        resources.append({'elapsed': round(time.monotonic() - started_profile, 3), 'available_memory_kib': memory['MemAvailable'],
                          'test_db_connections': connections, 'publications': sum(client.publications for client in sockets)})

    try:
        first_message = send('seed')
        next_sequence = int(sql(database, 'SELECT max(sequence)+1 FROM feed_entries WHERE meeting_id=' + literal(meeting)))
        entry_uuid = "overlay(overlay(md5(" + literal(meeting) + "||'-history-'||n) placing '4' from 13 for 1) placing 'a' from 17 for 1)::uuid::text"
        request_uuid = "overlay(overlay(md5('request-'||n) placing '4' from 13 for 1) placing 'a' from 17 for 1)::uuid::text"
        for lower in range(next_sequence, 100001, 1000):
            upper = min(lower + 999, 100000)
            # Copy one real API-created message, changing every identity/position.
            sql(database, 'INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document) '
                'SELECT ' + entry_uuid + ',meeting_id,n,actor_id,' + request_uuid +
                ",document || jsonb_build_object('ID'," + entry_uuid + ",'Sequence',n,'ClientRequestID'," + request_uuid + ') '
                'FROM feed_entries CROSS JOIN generate_series(' + str(lower) + ',' + str(upper) + ') n WHERE id=' + literal(first_message) + ';')
        sql(database, 'ANALYZE feed_entries;')
        result['history_rows_before_profile'] = int(sql(database, 'SELECT count(*) FROM feed_entries WHERE meeting_id=' + literal(meeting)))
        assert result['history_rows_before_profile'] == 100000

        meetings = [meeting]
        if distributed:
            for index in range(1, 20):
                key = str(uuid.uuid4())
                status, response = request(port, 'POST', '/api/v1/meetings',
                    {'title': 'Synthetic distributed ' + str(index),
                     'starts_on': (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).date().isoformat(),
                     'timezone': 'UTC'}, key)
                assert status == 201, 'distributed fixture meeting create'
                target = json.loads(response)['meeting']['id']
                meetings.append(target)
                meeting_paths.append('/api/v1/meetings/' + target)
                size = 1000 if index == 1 else 10000 if index == 2 else 5000
                target_entry = "overlay(overlay(md5(" + literal(target) + "||'-history-'||n) placing '4' from 13 for 1) placing 'a' from 17 for 1)::uuid::text"
                target_request = "overlay(overlay(md5(" + literal(target) + "||'-request-'||n) placing '4' from 13 for 1) placing 'a' from 17 for 1)::uuid::text"
                target_next = int(sql(database, 'SELECT max(sequence)+1 FROM feed_entries WHERE meeting_id=' + literal(target)))
                for lower in range(target_next, size + 1, 1000):
                    upper = min(lower + 999, size)
                    sql(database, 'INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document) '
                        'SELECT ' + target_entry + ',' + literal(target) + ',n,actor_id,' + target_request +
                        ",document || jsonb_build_object('ID'," + target_entry + ",'MeetingID'," + literal(target) +
                        ",'Sequence',n,'ClientRequestID'," + target_request + ') FROM feed_entries CROSS JOIN generate_series(' +
                        str(lower) + ',' + str(upper) + ') n WHERE id=' + literal(first_message) + ';')
            sql(database, 'ANALYZE feed_entries;')
            result['meeting_histories_before_profile'] = json.loads(sql(database,
                "SELECT json_agg(row_to_json(x)) FROM (SELECT meeting_id,count(*) AS rows FROM feed_entries GROUP BY meeting_id ORDER BY count(*)) x;"))

        now = datetime.datetime.now(datetime.timezone.utc)
        expires = (now + datetime.timedelta(hours=2)).isoformat()
        web_tokens = []
        for index in range(20):
            user_id = owner if index == 0 else str(uuid.uuid4())
            target_meeting = meetings[index] if distributed else meeting
            token = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=').decode()
            web_tokens.append(token)
            digest = hashlib.sha256(token.encode()).hexdigest()
            session_id = str(uuid.uuid4())
            statements = 'BEGIN; '
            if index:
                user = {'ID': user_id, 'DisplayName': 'Synthetic hot member ' + str(index), 'CreatedAt': now.isoformat()}
                rsvp = {'MeetingID': target_meeting, 'UserID': user_id, 'Answer': 'going', 'Revision': 1, 'UpdatedAt': now.isoformat()}
                statements += 'INSERT INTO identity_users VALUES(' + literal(user_id) + ',' + literal('hot:' + user_id) + ',' + literal(json.dumps(user)) + '::jsonb); '
                statements += 'INSERT INTO rsvps VALUES(' + literal(target_meeting) + ',' + literal(user_id) + ',' + literal(json.dumps(rsvp)) + '::jsonb); '
                statements += 'INSERT INTO meeting_read_markers VALUES(' + literal(target_meeting) + ',' + literal(user_id) + ',(SELECT max(sequence) FROM feed_entries WHERE meeting_id=' + literal(target_meeting) + '),0,now()); '
            session = {'ID': session_id, 'UserID': user_id, 'SecretHash': digest, 'ClientKind': 'web', 'ExpiresAt': expires}
            statements += 'INSERT INTO identity_sessions VALUES(' + ','.join(map(literal,[digest,session_id,user_id,expires])) + ',' + literal(json.dumps(session)) + '::jsonb); COMMIT;'
            sql(database, statements)
        for index, token in enumerate(web_tokens):
            for _ in range(5):
                sockets.append(HintSocket(port, token, meetings[index] if distributed else meeting))
        assert len(sockets) == 100
        started_profile = time.monotonic()
        print(json.dumps({'stage': '100_websockets_subscribed', 'history_rows': result['history_rows_before_profile']}), flush=True)

        # Deliberate bounded contention in this database only; database OID scopes advisory locks.
        holder = subprocess.Popen(['runuser', '-u', 'postgres', '--', 'psql', '-X', '-q', '-d', database],
            stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True)
        holder.stdin.write('BEGIN; SELECT pg_advisory_xact_lock(19372002); SELECT pg_sleep(1.0); COMMIT;\n')
        holder.stdin.close()
        for _ in range(30):
            granted = sql(database, "SELECT count(*) FROM pg_locks WHERE database=(SELECT oid FROM pg_database WHERE datname=current_database()) AND locktype='advisory' AND objid=19372002 AND granted;")
            if int(granted):
                break
            time.sleep(0.01)
        else:
            raise RuntimeError('test lock not acquired')
        observed = []
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(send, 'contention-' + str(index)) for index in range(20)]
            while not all(future.done() for future in futures):
                value = sql(database, "SELECT coalesce(max(extract(epoch FROM(clock_timestamp()-waitstart))*1000),0) FROM pg_locks WHERE database=(SELECT oid FROM pg_database WHERE datname=current_database()) AND locktype='advisory' AND NOT granted;")
                observed.append(float(value))
                time.sleep(0.01)
            for future in futures:
                future.result()
        assert holder.wait(timeout=5) == 0
        result['deliberate_contention'] = {'hold_seconds': 1.0, 'writers': 20,
            'wait_observations_ms': observed, 'max_observed_wait_ms': max(observed),
            'http_samples': [item for item in measurements if item['sample'].startswith('contention-')]}
        assert max(observed) > 0
        measurements.clear()

        result['samples'] = measurements
        result['resources'] = resources
        result['lock_samples'] = []
        result['warmup_seconds'] = 60
        warmup_started = time.monotonic()
        print(json.dumps({'stage':'fixture_writeback_warmup','seconds':60}), flush=True)
        while time.monotonic() - warmup_started < 60:
            guard()
            time.sleep(min(5, max(0, 60-(time.monotonic()-warmup_started))))

        def monitor_locks():
            statement = """SELECT coalesce(json_agg(json_build_object(
                'waiter',a.pid,'wait_event',a.wait_event,'wait_query',left(a.query,350),
                'advisory_key',(SELECT objid FROM pg_locks WHERE pid=a.pid AND locktype='advisory' AND NOT granted LIMIT 1),
                'wait_ms',extract(epoch FROM(clock_timestamp()-a.query_start))*1000,
                'blocker',b.pid,'blocker_state',b.state,'blocker_query',left(b.query,350),
                'blocker_wait_type',b.wait_event_type,'blocker_wait_event',b.wait_event,
                'blocker_age_ms',extract(epoch FROM(clock_timestamp()-b.xact_start))*1000)), '[]')
                FROM pg_stat_activity a LEFT JOIN pg_stat_activity b ON b.pid=ANY(pg_blocking_pids(a.pid))
                WHERE a.datname=current_database() AND a.wait_event_type='Lock'
                AND b.wait_event_type IS DISTINCT FROM 'Lock'
                AND a.query_start < clock_timestamp()-interval '200 milliseconds';"""
            while not monitor_stop.wait(0.2):
                try:
                    rows = json.loads(sql(database, statement))
                    if rows and len(result['lock_samples']) < 80:
                        result['lock_samples'].append({'elapsed':time.monotonic()-started_profile,'locks':rows})
                except Exception:
                    return

        monitor = threading.Thread(target=monitor_locks, daemon=True)
        monitor.start()
        for phase, rate, duration in [('baseline',5,900),('burst',20,60)]:
            phase_start = time.monotonic()
            before = len(measurements)
            with ThreadPoolExecutor(max_workers=40) as executor:
                futures = []
                for index in range(rate * duration):
                    remaining = phase_start + index / rate - time.monotonic()
                    if remaining > 0:
                        time.sleep(remaining)
                    futures.append(executor.submit(send, phase + '-' + str(index)))
                    if index % (rate * 30) == 0:
                        assert sum(not future.done() for future in futures) <= 100, 'bounded load queue'
                        for future in futures:
                            if future.done():
                                future.result()
                        guard()
                        status, _ = request(port, 'GET', path + '/feed?limit=50')
                        assert status == 200
                        print(json.dumps({'stage': phase, 'submitted': index + 1, 'completed': len(measurements)-before,
                                          'elapsed_seconds': round(time.monotonic()-phase_start, 3),
                                          'publications': sum(client.publications for client in sockets)}), flush=True)
                for future in futures:
                    future.result()
            remaining = phase_start + duration - time.monotonic()
            if remaining > 0:
                time.sleep(remaining)
            values = sorted(item['milliseconds'] for item in measurements[before:])
            result[phase] = {'messages': len(values), 'elapsed_seconds': time.monotonic()-phase_start,
                'p50_ms': values[math.ceil(len(values)*.5)-1], 'p95_ms': values[math.ceil(len(values)*.95)-1],
                'p99_ms': values[math.ceil(len(values)*.99)-1], 'max_ms': max(values)}
            assert result[phase]['p95_ms'] < 1000
        guard()
        assert all(client.publications > 0 for client in sockets)
        result['publications_per_socket'] = [client.publications for client in sockets]
        result['resources'] = resources
        result['samples'] = measurements
        result['completed'] = True
    finally:
        monitor_stop.set()
        if monitor is not None:
            monitor.join(timeout=20)
        result['socket_errors'] = [{'index': index, 'error': client.error, 'close': client.close_info,
                                   'publications': client.publications}
                                  for index, client in enumerate(sockets) if client.error]
        for client in sockets:
            client.close()
        print(json.dumps({'hot_profile_result': result}), flush=True)
