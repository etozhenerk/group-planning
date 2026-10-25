"""Подготовить карточку выпуска без создания тега или публикации."""
import argparse
import json
from pathlib import Path

from common import git, run
from version_policy import history, parse_tag, validate_card


def prepare(tag, bump, reason, changes, checks, compatibility, limitations, action):
    component, version = parse_tag(tag)
    if git('status', '--porcelain'):
        raise ValueError('Prepare a release from a clean checkout')
    commit = git('rev-parse', 'HEAD')
    run('git', 'merge-base', '--is-ancestor', commit, 'origin/main')
    previous = history(tag, git('tag', '--list').splitlines())
    card = dict(schema_version=1, component=component, version=version, tag=tag,
                commit=commit, previous_version=previous, bump=bump, reason=reason,
                changes=changes, checks=checks, compatibility=compatibility,
                limitations=limitations, action=action)
    return validate_card(card, tag, commit, previous)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--bump', choices=['initial', 'patch', 'minor', 'major'], required=True)
    parser.add_argument('--reason', required=True)
    parser.add_argument('--change', action='append', required=True)
    parser.add_argument('--check', action='append', required=True)
    parser.add_argument('--compatibility', required=True)
    parser.add_argument('--limitations', required=True)
    parser.add_argument('--action', default='Создать артефакты')
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    card = prepare(args.tag, args.bump, args.reason, args.change, args.check,
                   args.compatibility, args.limitations, args.action)
    with args.output.open('x') as destination:
        destination.write(json.dumps(card, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(card, ensure_ascii=False, indent=2))
    print('Карточка подготовлена. Проверьте состав и решение владельца до создания тега.')
