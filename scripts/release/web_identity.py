"""Проверить метаданные внутри web-архива без распаковки."""
import json
import tarfile

IDENTITY_FIELDS = ('component', 'version', 'tag', 'commit', 'build_number')


def build_info(meta):
    return dict(schema_version=1, **{key: meta[key] for key in IDENTITY_FIELDS})


def verify_web_archive(path, meta):
    with tarfile.open(path, 'r:gz') as archive:
        matches = [item for item in archive.getmembers() if item.name in ('build-info.json', './build-info.json')]
        if len(matches) != 1 or not matches[0].isfile() or not 0 < matches[0].size <= 16000:
            raise ValueError('Web archive requires one regular build-info.json')
        stream = archive.extractfile(matches[0])
        if stream is None:
            raise ValueError('Missing web build identity')
        with stream:
            value = json.load(stream)
    expected = build_info(meta)
    if value != expected or any(type(value[key]) is not type(expected[key]) for key in expected):
        raise ValueError('Web build identity does not match release manifest')
