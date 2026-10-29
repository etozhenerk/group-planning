"""Однократный допуск владельца для неизменного продукта web rc14."""
from common import git

TAG = 'web/v0.1.0-rc.14'
BASELINE = 'b072fc0e8685b82655bcc7a3e29b59f92c2fc2be'
TREES = {
    'frontend/web': '18c353640d37f3342f05f397141d90c6591e899d',
    'backend': '3101230e49c9403f312a5ee1287f87619f4e0056',
    'contracts': '23946d2bd632af4a3983528348add7323ed36acb',
    'design-system': '0e197874cb56d176cc599db59559a96739feb94f',
    'docs/design': '6a9af7bc142e49570e81a65451bb4337923b9a4c',
}


def for_candidate(meta):
    if meta['component'] != 'web' or meta['tag'] != TAG:
        return None
    for path, expected in TREES.items():
        if (git('rev-parse', f'{BASELINE}:{path}') != expected
                or git('rev-parse', f'{meta["commit"]}:{path}') != expected):
            raise ValueError(f'Web rc14 owner exception does not cover changed product tree: {path}')
    return {
        'kind': 'single-release-owner-exception',
        'status': 'incomplete',
        'tag': TAG,
        'scope': ['design:ready', 'full-manual-acceptance'],
        'authorization': {
            'question': 'call_a44a9b66cf6541fd80108e62530a3742',
            'answer': 'Да, только исключение rc.14 и выкладка',
            'recordedAt': '2026-10-29T12:32:18Z',
        },
        'product_source': {'baseline': BASELINE, 'trees': dict(TREES)},
        'note': 'Приёмка design 4.1.1 и полный ручной проход не завершены. '
                'Обязательные автопроверки и идентичность артефакта сохраняются; '
                'это не passed acceptance receipt.',
    }
