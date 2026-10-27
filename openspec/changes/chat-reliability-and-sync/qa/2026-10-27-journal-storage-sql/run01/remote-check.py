import json
import os
import pathlib
import subprocess
import sys
import uuid

DATABASE = "somewhere_integration"
OWNER = "somewhere_migrator"
MARKER = "codex-chat-journal-" + uuid.uuid4().hex
BINARY = pathlib.Path(sys.argv[1])
assert BINARY.name == "postgres-journal.test"
assert str(BINARY).startswith("/tmp/codex-chat-journal-")


def command(args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)


def admin_query(sql):
    result = command(
        ["sudo", "-n", "-u", "postgres", "psql", "-XAt", "-d", "postgres",
         "-v", "ON_ERROR_STOP=1", "-c", sql], capture_output=True
    )
    return result.stdout.strip()


if admin_query("SELECT 1 FROM pg_database WHERE datname='somewhere_integration'"):
    raise SystemExit("Existing integration database found; refusing to modify it")

created = False
exit_code = 1
try:
    command(["sudo", "-n", "-u", "postgres", "createdb", "--owner=" + OWNER, DATABASE])
    created = True
    admin_query("COMMENT ON DATABASE somewhere_integration IS '" + MARKER + "'")
    print(json.dumps({"database": DATABASE, "createdForThisRun": True, "marker": MARKER}), flush=True)
    run = subprocess.run(
        ["sudo", "-n", "-u", OWNER, "env", "GOMAXPROCS=1",
         "SOMEWHERE_TEST_DATABASE_URL=host=/var/run/postgresql dbname=" + DATABASE
         + " user=" + OWNER + " sslmode=disable",
         "nice", "-n", "15", str(BINARY), "-test.v", "-test.count=1", "-test.timeout=180s",
         "-test.run=^(TestChat.*Integration|TestFeedWindowIntegration)$"],
        check=False,
    )
    exit_code = run.returncode
finally:
    if created:
        actual = admin_query(
            "SELECT shobj_description(oid,'pg_database') FROM pg_database "
            "WHERE datname='somewhere_integration'"
        )
        if actual != MARKER:
            raise SystemExit("Database ownership marker changed; refusing cleanup")
        # No FORCE: an unexpected concurrent connection prevents cleanup.
        command(["sudo", "-n", "-u", "postgres", "dropdb", DATABASE])
        print(json.dumps({"database": DATABASE, "removedOwnTemporaryDatabase": True}), flush=True)

raise SystemExit(exit_code)
