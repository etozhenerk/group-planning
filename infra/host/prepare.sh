#!/bin/bash
# Запускать от root на выделенной Ubuntu 24.04 после cloud-init.
set -euo pipefail
test "$(id -u)" -eq 0
test "$(. /etc/os-release; echo "$VERSION_ID")" = 24.04
# Не перезаписывать Caddy и не перезапускать БД у уже выпущенного приложения.
if systemctl cat somewhere.service >/dev/null 2>&1; then
    echo 'Обнаружен релиз приложения: используйте отдельный план обновления.' >&2
    exit 1
fi
cloud-init status --wait
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y postgresql-16 postgresql-client-16 caddy python3 age

id somewhere_migrator >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin somewhere_migrator
install -d -m 0755 /etc/postgresql/16/main/conf.d
cat > /etc/postgresql/16/main/conf.d/somewhere.conf <<'EOF'
listen_addresses = ''
max_connections = 30
shared_buffers = '256MB'
work_mem = '4MB'
maintenance_work_mem = '64MB'
max_wal_size = '256MB'
min_wal_size = '80MB'
temp_file_limit = '256MB'
password_encryption = 'scram-sha-256'
log_statement = 'none'
log_min_error_statement = 'panic'
log_parameter_max_length_on_error = 0
EOF
systemctl restart postgresql@16-main
runuser -u postgres -- psql -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'CREATE ROLE somewhere_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE'
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname='somewhere_migrator') \gexec
SELECT 'CREATE ROLE somewhere LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE'
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname='somewhere') \gexec
SELECT 'CREATE DATABASE somewhere OWNER somewhere_migrator'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='somewhere') \gexec
REVOKE ALL ON DATABASE somewhere FROM PUBLIC;
GRANT CONNECT ON DATABASE somewhere TO somewhere;
ALTER ROLE somewhere SET statement_timeout = '5s';
ALTER ROLE somewhere SET lock_timeout = '3s';
ALTER ROLE somewhere SET idle_in_transaction_session_timeout = '30s';
\connect somewhere
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO somewhere;
ALTER DEFAULT PRIVILEGES FOR ROLE somewhere_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO somewhere;
ALTER DEFAULT PRIVILEGES FOR ROLE somewhere_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO somewhere;
SQL

# До production-релиза и покупки домена наружу отдаётся только 503.
cat > /etc/caddy/Caddyfile <<'EOF'
:80 {
    header Retry-After "3600"
    respond "Service is being configured.\n" 503
}
EOF
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl enable --now caddy postgresql
systemctl reload caddy
install -d -m 0750 -o postgres -g postgres /var/lib/somewhere-backup
install -d -m 0755 /var/lib/somewhere-metrics
apt-get clean
runuser -u somewhere -- psql -d somewhere -Atc 'SELECT current_user, version()'
df -h /
