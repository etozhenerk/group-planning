#!/bin/bash
# После prepare.sh и install-metrics.sh; аргументы не содержат секретов.
set -euo pipefail
test "$(id -u)" -eq 0
bucket=${1:?Pass private backup bucket name}
recipient=${2:?Pass public age recipient, never private identity}
[[ "$bucket" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]]
[[ "$recipient" =~ ^age1[a-z0-9]+$ ]]
source_dir=$(cd -- "$(dirname -- "$0")" && pwd)

id somewhere_metrics >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin somewhere_metrics
runuser -u postgres -- psql -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'CREATE ROLE somewhere_metrics LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE'
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname='somewhere_metrics') \gexec
GRANT pg_monitor TO somewhere_metrics;
GRANT CONNECT ON DATABASE somewhere TO somewhere_metrics;
SQL

install -d -m 0755 /usr/local/lib/somewhere
install -m 0755 "$source_dir/backup.py" "$source_dir/postgres-metrics.py" /usr/local/lib/somewhere/
install -d -m 0750 -o root -g postgres /etc/somewhere-backup
python3 - "$bucket" "$recipient" <<'PY'
import json
import os
from pathlib import Path
import sys
os.umask(0o077)
Path('/etc/somewhere-backup/config.json').write_text(
    json.dumps({'bucket': sys.argv[1], 'recipient': sys.argv[2]}) + '\n')
PY
chown root:postgres /etc/somewhere-backup/config.json
chmod 0640 /etc/somewhere-backup/config.json
install -d -m 0750 -o postgres -g postgres /var/lib/somewhere-backup
install -m 0644 "$source_dir/somewhere-backup.service" "$source_dir/somewhere-backup.timer" \
    "$source_dir/somewhere-postgres-metrics.service" /etc/systemd/system/
install -d -m 0755 /etc/yandex/unified_agent/conf.d
install -m 0644 "$source_dir/postgres-metrics.yml" /etc/yandex/unified_agent/conf.d/
systemctl daemon-reload
systemctl enable --now somewhere-backup.timer somewhere-postgres-metrics.service
systemctl restart somewhere-postgres-metrics.service unified-agent
systemctl is-active somewhere-backup.timer somewhere-postgres-metrics.service unified-agent
