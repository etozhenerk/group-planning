#!/usr/bin/env python3
"""Сформировать JSON для редактора Monium; не вызывает облачный API."""
import argparse
import json
from pathlib import Path
import re
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--folder-id', required=True)
parser.add_argument('--instance-id', required=True)
parser.add_argument('--output-dir', required=True)
args = parser.parse_args()
for value in [args.folder_id, args.instance_id]:
    if not re.fullmatch(r'[a-z0-9]+', value):
        parser.error('Cloud IDs must contain only lowercase letters and digits')
source = Path(__file__).with_name('dashboards.json').read_text()
catalog = json.loads(source.replace('__FOLDER_ID__', args.folder_id).replace('__INSTANCE_ID__', args.instance_id))
destination = Path(args.output_dir)
destination.mkdir(parents=True, exist_ok=True)
for key, definition in catalog.items():
    widgets = []
    for index, chart in enumerate(definition['charts']):
        source_id = str(uuid.uuid5(uuid.NAMESPACE_URL, 'somewhere/' + key + '/' + str(index)))
        widgets.append({
            'position': {'x': (index % 2) * 18, 'y': (index // 2) * 8, 'w': 18, 'h': 8},
            'multiSourceChart': {
                'id': str(uuid.uuid5(uuid.NAMESPACE_URL, source_id)),
                'title': chart['title'],
                'dataSources': [{'id': source_id, 'type': 'monitoring', 'downsampling': {
                    'gridAggregation': 'GRID_AGGREGATION_UNSPECIFIED',
                    'gapFilling': 'GAP_FILLING_NULL', 'gridInterval': 60000}}],
                'targets': [{'type': 'monitoring', 'dataSourceId': source_id, 'query': query,
                             'textMode': True, 'hidden': False, 'growDown': False, 'name': chr(65 + n)}
                            for n, query in enumerate(chart['queries'])],
                'seriesOverrides': [],
                'visualizationSettings': {'type': 'VISUALIZATION_TYPE_LINE',
                                          'interpolate': 'INTERPOLATE_UNSPECIFIED',
                                          'yaxisSettings': {'left': {'type': 'YAXIS_TYPE_LINEAR'},
                                                            'right': {'type': 'YAXIS_TYPE_LINEAR'}},
                                          'colorSchemeSettings': {'automatic': {}}}
            }})
    payload = {'title': definition['title'], 'description': definition['description'],
               'parametrization': None, 'eventSources': None, 'widgets': widgets, 'presetItems': []}
    (destination / (key + '.json')).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
print(f'Rendered {len(catalog)} Monium dashboard JSON files.')
