"""Порядок независимых SemVer и проверяемая карточка аннотированного тега."""
import json
import re

COMPONENTS = ('backend', 'web', 'monitoring', 'android', 'ios')
NUMBER = r'(?:0|[1-9][0-9]*)'
VERSION = re.compile(rf'^({NUMBER})\.({NUMBER})\.({NUMBER})(?:-rc\.([1-9][0-9]*))?$')
TAG = re.compile(r'^(backend|web|monitoring|android|ios)/v(.+)$')


def version_key(version):
    match = VERSION.fullmatch(version)
    if not match:
        raise ValueError('Expected X.Y.Z or X.Y.Z-rc.N')
    major, minor, patch, rc = match.groups()
    return int(major), int(minor), int(patch), rc is None, int(rc or 0)


def parse_tag(tag):
    match = TAG.fullmatch(tag)
    if not match or len(tag) > 100:
        raise ValueError('Expected component/vX.Y.Z or component/vX.Y.Z-rc.N')
    component, version = match.groups()
    version_key(version)
    return component, version


def history(tag, tags, *, existing=False):
    component, version = parse_tag(tag)
    if (tag in tags) != existing:
        raise ValueError('Expected an existing tag' if existing else 'Version is already reserved by a tag')
    previous = []
    for other in tags:
        if other != tag and other.startswith(f'{component}/v'):
            _, candidate = parse_tag(other)
            previous.append(candidate)
    if previous and version_key(version) <= max(map(version_key, previous)):
        raise ValueError('Version must follow all reserved versions of this component')
    stable = [item for item in previous if '-rc.' not in item]
    return max(stable, key=version_key) if stable else None


def check_bump(version, previous, bump):
    base = version_key(version)[:3]
    if previous is None:
        if bump != 'initial' or base != (0, 1, 0):
            raise ValueError('The first release line must use initial and 0.1.0')
        return
    major, minor, patch = version_key(previous)[:3]
    expected = {
        'patch': (major, minor, patch + 1),
        'minor': (major, minor + 1, 0),
        'major': (major + 1, 0, 0),
    }
    if not isinstance(bump, str) or bump not in expected or base != expected[bump]:
        raise ValueError('Version does not match the declared bump from the previous stable tag')


def validate_card(card, tag, commit, previous):
    component, version = parse_tag(tag)
    if not isinstance(card, dict) or type(card.get('schema_version')) is not int or card['schema_version'] != 1:
        raise ValueError('Invalid release card schema')
    if len(json.dumps(card, ensure_ascii=False, indent=2)) + 1 > 64000:
        raise ValueError('Release card is too large')
    identity = dict(component=component, version=version, tag=tag, commit=commit,
                    previous_version=previous)
    if any(card.get(key) != value for key, value in identity.items()):
        raise ValueError('Release card identity or previous version does not match')
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise ValueError('Invalid release card commit')
    for key in ('reason', 'compatibility', 'limitations', 'action'):
        value = card.get(key)
        if not isinstance(value, str) or not value.strip() or len(value) > 4000:
            raise ValueError(f'Release card requires {key}')
    for key in ('changes', 'checks'):
        values = card.get(key)
        if not isinstance(values, list) or not 1 <= len(values) <= 50:
            raise ValueError(f'Release card requires {key}')
        if any(not isinstance(item, str) or not item.strip() or len(item) > 4000 for item in values):
            raise ValueError(f'Invalid release card {key}')
    check_bump(version, previous, card.get('bump'))
    return card


def read_card(tag, commit, git):
    previous = history(tag, git('tag', '--list').splitlines(), existing=True)
    if git('cat-file', '-t', f'refs/tags/{tag}') != 'tag':
        raise ValueError('Release requires an annotated tag with a prepared JSON card')
    contents = git('for-each-ref', '--format=%(contents)', f'refs/tags/{tag}')
    if len(contents) > 64000:
        raise ValueError('Release card is too large')
    try:
        card = json.loads(contents)
    except json.JSONDecodeError as error:
        raise ValueError('Tag annotation must contain the prepared JSON release card') from error
    return validate_card(card, tag, commit, previous)


def release_notes(manifest):
    card = manifest['release_plan']
    bullets = lambda items: '\n'.join(f'- {item}' for item in items)
    artifacts = [f"`{item['name']}` — {item['size']} байт." for item in manifest['artifacts']]
    artifacts += ['`manifest.json` — состав, версия, коммит, сборка и проверки.',
                  '`SHA256SUMS` — контрольные суммы файлов, включая manifest.']
    sections = [f"Компонент: **{manifest['component']}** · Версия: **{manifest['version']}**",
        f"Предыдущая окончательная версия: {card['previous_version'] or 'нет'}\n\n"
        f"Причина повышения: **{card['bump']}** — {card['reason']}\n\n"
        f"Коммит: `{manifest['commit']}` · Сборка: {manifest['build_number']}",
        '## Изменения', bullets(card['changes']), '## Совместимость', card['compatibility'],
        '## Проверки', 'До создания тега:\n\n' + bullets(card['checks']),
        'Проверки артефакта в CI:\n\n' + bullets(manifest['checks']),
        '## Ограничения', card['limitations'], '## Артефакты', bullets(artifacts),
        'Публикация артефактов не выполняет деплой и не загружает приложение в стор.']
    return '\n\n'.join(sections) + '\n'
