"""Небольшие артефакты для проверок обвязки без сборки приложений."""
import io
import json
import tarfile


def card(tag='web/v1.2.3', commit='a' * 40, previous='1.2.2', bump='patch'):
    component, version = tag.split('/v')
    return dict(schema_version=1, tag=tag, component=component, version=version,
                commit=commit, previous_version=previous, bump=bump, reason='Исправление',
                changes=['Исправлена версия'], checks=['Unit checks passed'],
                compatibility='API не меняется', limitations='Тестовый набор',
                action='Создать артефакты')


def web_archive(path, info):
    with tarfile.open(path, 'w:gz') as archive:
        for name, data in {'build-info.json': json.dumps(info).encode(), 'index.html': b'<html></html>'}.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(data)
            archive.addfile(entry, io.BytesIO(data))
