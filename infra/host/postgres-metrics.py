#!/usr/bin/env python3
"""Закрытый exporter: только агрегаты PostgreSQL и возраст копии, без запросов/PII."""
import http.server
import json
from pathlib import Path
import subprocess
import time


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
