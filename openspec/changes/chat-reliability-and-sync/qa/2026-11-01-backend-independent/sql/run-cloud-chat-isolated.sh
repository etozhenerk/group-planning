#!/bin/sh
# Executed through pinned SSH. Only this marked disposable database may be changed.
set -u
sdd_database=somewhere_integration
sdd_owner=somewhere_migrator
sdd_marker=somewhere_sdd_chat_20261101_d47cdf4b667ff594
sdd_dsn='host=/var/run/postgresql dbname=somewhere_integration user=somewhere_migrator sslmode=disable'
sdd_overall=0
sdd_guard() {
    sdd_actual=$(sudo -n -u "$sdd_owner" psql -X -At -d postgres -c "SELECT datname||'|'||pg_get_userbyid(datdba)||'|'||coalesce(shobj_description(oid,'pg_database'),'') FROM pg_database WHERE datname='$sdd_database'") || return 70
    if [ "$sdd_actual" != "$sdd_database|$sdd_owner|$sdd_marker" ]; then
        printf 'PG_MARKER_GUARD_FAIL actual=%s\n' "$sdd_actual"
        return 71
    fi
    printf 'PG_MARKER_GUARD_OK %s\n' "$sdd_actual"
}
sdd_cleanup() {
    sdd_status=$?
    trap - EXIT
    printf 'PG_CLEANUP_BEGIN %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    if sdd_guard; then
        if sudo -n -u "$sdd_owner" dropdb --maintenance-db=postgres "$sdd_database"; then
            printf 'PG_DROP_OWN_DATABASE_OK\n'
        else
            printf 'PG_DROP_OWN_DATABASE_FAIL\n'
            sdd_status=72
        fi
    else
        printf 'PG_CLEANUP_BLOCKED_MARKER_MISMATCH\n'
        sdd_status=73
    fi
    sudo -n -u "$sdd_owner" psql -X -At -d postgres -c "SELECT 'remaining_test_databases='||count(*) FROM pg_database WHERE datname='$sdd_database'"
    df -B1 /var/lib/postgresql
    systemctl show somewhere.service postgresql.service caddy.service -p Id -p ActiveState -p SubState -p NRestarts -p MainPID
    curl --connect-timeout 10 --max-time 20 -fsS -w '\nhealth_status=%{http_code}\n' https://smwhere.ru/healthz || sdd_status=74
    curl --connect-timeout 10 --max-time 20 -fsS -w '\nready_status=%{http_code}\n' https://smwhere.ru/readyz || sdd_status=74
    printf 'PG_CLEANUP_END exit=%s at=%s\n' "$sdd_status" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    exit "$sdd_status"
}
printf 'PG_ISOLATED_RETRY_PRECHECK %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
systemctl show somewhere.service postgresql.service caddy.service -p Id -p ActiveState -p SubState -p NRestarts -p MainPID
curl --connect-timeout 10 --max-time 20 -fsS -w '\nhealth_status=%{http_code}\n' https://smwhere.ru/healthz || exit 76
curl --connect-timeout 10 --max-time 20 -fsS -w '\nready_status=%{http_code}\n' https://smwhere.ru/readyz || exit 76
sdd_exists=$(sudo -n -u "$sdd_owner" psql -X -At -d postgres -c "SELECT count(*) FROM pg_database WHERE datname='$sdd_database'") || exit 77
[ "$sdd_exists" = 0 ] || { printf 'PG_CREATE_REFUSED_ALREADY_EXISTS\n'; exit 78; }
sudo -n -u postgres createdb --owner="$sdd_owner" "$sdd_database" || exit 79
sudo -n -u "$sdd_owner" psql -X -v ON_ERROR_STOP=1 -d postgres -c "COMMENT ON DATABASE $sdd_database IS '$sdd_marker'" || exit 80
sdd_guard || exit 70
sudo -n -u "$sdd_owner" psql -X -At -d "$sdd_database" -c "SELECT 'initial_user_tables='||count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'"
sudo -n -u "$sdd_owner" psql -X -At -d postgres -c "SELECT 'role='||rolname||' super='||rolsuper||' createdb='||rolcreatedb FROM pg_roles WHERE rolname='$sdd_owner'"
sdd_actual_sha=$(sha256sum "/tmp/somewhere-sdd-chat-postgres-20261101.test" | cut -d " " -f 1)
[ "$sdd_actual_sha" = "6b7fc87b048a59d706ffd8078b6379d0f5ca04deb1be3fb7bb1273f2dd69dff4" ] || exit 75
printf "PG_BINARY_SHA_OK %s %s\n" "/tmp/somewhere-sdd-chat-postgres-20261101.test" "$sdd_actual_sha"
sdd_actual_sha=$(sha256sum "/tmp/somewhere-sdd-chat-realtime-20261101.test" | cut -d " " -f 1)
[ "$sdd_actual_sha" = "1a780c90d820d98fd6f462632c395938fecc96e9d488ba0e60dee59cbcdafc66" ] || exit 75
printf "PG_BINARY_SHA_OK %s %s\n" "/tmp/somewhere-sdd-chat-realtime-20261101.test" "$sdd_actual_sha"
trap sdd_cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
sdd_guard || exit 70
sdd_started=$(date +%s%N)
printf 'PG_PHASE_BEGIN phase=page-p95 at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sudo -n -u "$sdd_owner" env -u SOMEWHERE_SUPPORT_TEST_PHASE -u SOMEWHERE_QA_PROCESS_PHASE SOMEWHERE_TEST_DATABASE_URL="$sdd_dsn" "/tmp/somewhere-sdd-chat-postgres-20261101.test" -test.v -test.run '^TestIndependentRepeatFeedSQLLatencyIntegration$' -test.count=1 -test.timeout=10m
sdd_exit=$?
sdd_finished=$(date +%s%N)
printf 'PG_PHASE_END phase=page-p95 exit=%s elapsed_ns=%s at=%s\n' "$sdd_exit" "$((sdd_finished-sdd_started))" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ "$sdd_exit" -ne 0 ]; then sdd_overall=1; fi
sdd_guard || exit 70
sdd_started=$(date +%s%N)
printf 'PG_PHASE_BEGIN phase=process-recovery-epoch at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sudo -n -u "$sdd_owner" env -u SOMEWHERE_SUPPORT_TEST_PHASE -u SOMEWHERE_QA_PROCESS_PHASE SOMEWHERE_TEST_DATABASE_URL="$sdd_dsn" "/tmp/somewhere-sdd-chat-realtime-20261101.test" -test.v -test.run '^TestIndependentRepeatSQLProcessRestartDeletionAndEpoch$' -test.count=1 -test.timeout=10m
sdd_exit=$?
sdd_finished=$(date +%s%N)
printf 'PG_PHASE_END phase=process-recovery-epoch exit=%s elapsed_ns=%s at=%s\n' "$sdd_exit" "$((sdd_finished-sdd_started))" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ "$sdd_exit" -ne 0 ]; then sdd_overall=1; fi
sdd_guard || exit 70
sudo -n -u "$sdd_owner" psql -X -At -d "$sdd_database" <<'SQL'
SELECT 'migration='||version||'|'||checksum FROM schema_migrations ORDER BY version;
SELECT 'database_size_bytes='||pg_database_size(current_database());
SELECT 'table='||schemaname||'.'||tablename FROM pg_tables WHERE schemaname NOT LIKE 'pg_%' AND schemaname<>'information_schema' ORDER BY schemaname,tablename;
SQL
exit "$sdd_overall"
