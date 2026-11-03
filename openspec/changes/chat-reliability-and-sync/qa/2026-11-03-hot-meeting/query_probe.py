"""Read-only production SQL plans on the live isolated hot-meeting database."""
import json
import math
import subprocess
import sys
import time


bundle = json.load(sys.stdin)
database, marker = bundle['database'], bundle['marker']
assert database.startswith('somewhere_sdd_endpoint_') and database.replace('_', '').isalnum()


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def query(statement, user='somewhere'):
    process = subprocess.run(['runuser', '-u', user, '--', 'psql', '-X', '-q', '-A', '-t',
        '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=terse', '-d', database], input=statement,
        text=True, capture_output=True, timeout=20)
    assert process.returncode == 0, 'isolated SQL query failed'
    return process.stdout.strip()


actual = query("SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=current_database();")
assert actual == marker
metadata = json.loads(query("SELECT json_build_object('meeting',meeting_id,'entry',id,'actor',actor_id,'request',client_request_id) FROM feed_entries WHERE sequence=50000;"))
count = int(query('SELECT count(*) FROM feed_entries;'))
assert count >= 100000
values = {
    'feedInitialSQL': [metadata['meeting'], 51],
    'feedAfterSQL': [metadata['meeting'], '50000', 51],
    'feedBeforeSQL': [metadata['meeting'], '50000', 51],
    'feedTailSQL': [metadata['meeting']],
    'feedEntrySQL': [metadata['meeting'], metadata['entry']],
    'feedRequestSQL': [metadata['meeting'], metadata['actor'], metadata['request']],
}
if bundle.get('empty'):
    values = {'feedAfterSQL': [metadata['meeting'], '18446744073709551615', 51]}
results = []
for name, parameters in values.items():
    sql = bundle['queries'][name]
    for index in reversed(range(len(parameters))):
        sql = sql.replace('$' + str(index + 1), literal(parameters[index]))
    text = query(('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' + sql + ';\n') * 20)
    decoder = json.JSONDecoder()
    plans = []
    while text.strip():
        parsed, length = decoder.raw_decode(text.lstrip())
        plans.append(parsed[0])
        text = text.lstrip()[length:]
    assert len(plans) == 20
    durations = sorted(plan['Execution Time'] + plan['Planning Time'] for plan in plans)
    rows = []
    def inspect(plan):
        if plan.get('Relation Name') == 'feed_entries':
            assert plan['Node Type'] != 'Seq Scan'
            rows.append((plan.get('Actual Rows', 0) + plan.get('Rows Removed by Filter', 0)) * plan.get('Actual Loops', 1))
        for child in plan.get('Plans', []):
            inspect(child)
    for plan in plans:
        inspect(plan['Plan'])
    budget = 0 if bundle.get('empty') else 51 if name in ['feedInitialSQL', 'feedAfterSQL', 'feedBeforeSQL'] else 1
    assert rows and max(rows) <= budget
    p95 = durations[math.ceil(len(durations) * .95) - 1]
    assert p95 < 100
    results.append({'query': name, 'samples': len(durations), 'p95_planning_execution_ms': p95,
        'maximum_feed_rows_examined': max(rows), 'row_budget': budget, 'plans': plans})
print(json.dumps({'database': database, 'condition': 'empty-after-max-u64' if bundle.get('empty') else 'bounded-page-lookup', 'history_at_start': count,
    'history_at_finish': int(query('SELECT count(*) FROM feed_entries;')), 'queries': results, 'result': 'passed'}))
