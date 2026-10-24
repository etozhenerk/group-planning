"""Проверить существующий release tag и записать безопасные outputs GitHub Actions."""
import argparse
import json
from pathlib import Path

from common import metadata

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--tag', required=True)
parser.add_argument('--build-number', required=True, type=int)
parser.add_argument('--output', required=True)
parser.add_argument('--github-output')
args = parser.parse_args()
value = metadata(args.tag, args.build_number)
path = Path(args.output)
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(value, indent=2) + '\n')
if args.github_output:
    with open(args.github_output, 'a') as destination:
        for key in ['component', 'version', 'tag', 'commit']:
            destination.write(f'{key}={value[key]}\n')
        destination.write('runner=' + ('xcode-27' if value['component'] == 'ios' else 'ubuntu-24.04') + '\n')
print('Validated release:', value['tag'], value['commit'])
