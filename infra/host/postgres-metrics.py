#!/usr/bin/env python3
"""Закрытый exporter: только агрегаты PostgreSQL и возраст копии, без запросов/PII."""
import http.server
import json
import math
from pathlib import Path
import subprocess
import time


BUSINESS_FIELDS = frozenset({
    'users', 'meetings', 'chats', 'chats_with_messages', 'messages',
    'logins_total', 'logins_today', 'tracking_started_timestamp_seconds',
})


def collect_business():
    """Read only the aggregate view; missing data must not turn into zero users."""
    values = {'somewhere_business_collection_success': 0}
    try:
        result = subprocess.run(
            ['psql', '-XAt', '-d', 'somewhere', '-v', 'ON_ERROR_STOP=1', '-c',
             'SELECT json_object_agg(metric, value) FROM observability.business_metrics'],
            capture_output=True, text=True, timeout=3, check=True)
        metrics = json.loads(result.stdout)
        if not isinstance(metrics, dict) or set(metrics) != BUSINESS_FIELDS:
            return values
        if any(type(value) not in (int, float) or not math.isfinite(value) or value < 0
               for value in metrics.values()):
            return values
        values.update({f'somewhere_business_{name}': value for name, value in metrics.items()})
        values['somewhere_business_collection_success'] = 1
    except (subprocess.SubprocessError, ValueError, OSError):
        pass
    return values


def collect():
    values = {'somewhere_postgres_up': 0, 'somewhere_backup_last_success_timestamp': 0}
    try:
        result = subprocess.run(
            ['psql', '-XAt', '-d', 'somewhere', '-v', 'ON_ERROR_STOP=1', '-c',
             "SELECT json_build_object('somewhere_postgres_connections', (SELECT count(*) FROM pg_stat_activity), "
             "'somewhere_postgres_database_bytes', pg_database_size(current_database()), "
             "'somewhere_postgres_deadlocks_total', deadlocks, "
             "'somewhere_postgres_commits_total', xact_commit, "
             "'somewhere_postgres_rollbacks_total', xact_rollback) "
             'FROM pg_stat_database WHERE datname=current_database()'],
            capture_output=True, text=True, timeout=3, check=True)
        values.update(json.loads(result.stdout))
        values['somewhere_postgres_up'] = 1
    except (subprocess.SubprocessError, ValueError, OSError):
        pass
    values.update(collect_business())
    try:
        manifest = json.loads(Path('/var/lib/somewhere-backup/latest.json').read_text())
        values['somewhere_backup_last_success_timestamp'] = manifest['completed_at']
        values['somewhere_backup_age_seconds'] = max(0, time.time() - manifest['completed_at'])
    except (ValueError, OSError, KeyError):
        values['somewhere_backup_age_seconds'] = 1000000000
    return ''.join(f'# TYPE {name} {"counter" if name.endswith("_total") else "gauge"}\n{name} {value}\n'
                   for name, value in values.items()).encode()


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/metrics':
            self.send_error(404)
            return
        body = collect()
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; version=0.0.4')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass


if __name__ == '__main__':
    http.server.HTTPServer(('127.0.0.1', 9108), Handler).serve_forever()
