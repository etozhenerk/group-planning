"""Measure production metadata/read SQL in the owned live profile fixture."""
import json
import math
import subprocess
import sys

bundle = json.load(sys.stdin)
database, marker = bundle['database'], bundle['marker']
assert database.startswith('somewhere_sdd_endpoint_') and database.replace('_', '').isalnum()


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def query(statement):
    process = subprocess.run(['runuser', '-u', 'somewhere', '--', 'psql', '-X', '-q', '-A', '-t',
        '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=terse', '-d', database], input=statement,
        text=True, capture_output=True, timeout=25)
    assert process.returncode == 0, 'isolated SQL failed: ' + process.stderr[:300]
    return process.stdout.strip()


assert query("SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=current_database();") == marker
histories = json.loads(query("SELECT json_agg(row_to_json(x)) FROM (SELECT meeting_id,count(*) AS rows FROM feed_entries GROUP BY meeting_id) x;"))
selected = [min(histories, key=lambda item: abs(item['rows'] - size)) for size in [1000, 10000, 100000]]
assert len({item['meeting_id'] for item in selected}) == 3
results = []
for history in selected:
    meeting = history['meeting_id']
    owner = query('SELECT organizer_id FROM meetings WHERE id=' + literal(meeting))
    ids = json.loads(query("SELECT json_agg(id) FROM (SELECT id FROM feed_entries WHERE meeting_id=" + literal(meeting) + " AND actor_id=" + literal(owner) + " AND document->>'Kind'='message' ORDER BY sequence DESC LIMIT 100) x;"))
    assert len(ids) == 100
    parameters = {
        'metadata': [literal(meeting)],
        'unread': [literal(meeting), literal('0'), literal(owner)],
        'receipts': [literal(meeting), literal(owner), 'ARRAY[' + ','.join(map(literal, ids)) + ']::text[]'],
    }
    for name, values in parameters.items():
        statement = bundle['queries'][name]
        for index in reversed(range(len(values))):
            statement = statement.replace('$' + str(index + 1), values[index])
        output = query(('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) ' + statement + ';\n') * 20)
        decoder = json.JSONDecoder()
        plans = []
        while output.strip():
            parsed, length = decoder.raw_decode(output.lstrip())
            plans.append(parsed[0])
            output = output.lstrip()[length:]
        assert len(plans) == 20
        durations = sorted(plan['Execution Time'] + plan['Planning Time'] for plan in plans)
        visits = []
        def inspect(plan):
            if plan.get('Relation Name') == 'feed_entries':
                assert plan['Node Type'] != 'Seq Scan', 'full feed scan in ' + name
                visits.append((plan.get('Actual Rows', 0) + plan.get('Rows Removed by Filter', 0)) * plan.get('Actual Loops', 1))
            for child in plan.get('Plans', []):
                inspect(child)
        for plan in plans:
            inspect(plan['Plan'])
        if name == 'metadata':
            assert not visits, 'metadata loaded feed'
        if name == 'receipts':
            assert visits and max(visits) <= 100
        p95 = durations[math.ceil(len(durations) * .95)-1]
        assert p95 <= 100, (history, name, p95)
        results.append({'query': name, 'meeting': meeting, 'history_rows': history['rows'],
            'samples': 20, 'p95_planning_execution_ms': p95,
            'maximum_feed_rows_examined': max(visits, default=0), 'plans': plans})
print(json.dumps({'database': database, 'histories': selected, 'queries': results, 'result': 'passed'}))
