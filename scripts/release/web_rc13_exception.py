"""Однократный допуск владельца для неизменного продукта web rc13."""
from common import git

TAG = 'web/v0.1.0-rc.13'
BASELINE = 'e813f45e5c126b062b528e51fb1e826e33c873aa'
TREES = {
    'frontend/web': '645d9e5da46077dbfb0e064c5f7732ef0218ec20',
    'backend': '3101230e49c9403f312a5ee1287f87619f4e0056',
    'contracts': '23946d2bd632af4a3983528348add7323ed36acb',
    'design-system': 'b543a2c008bac558dd9fa0eb1e4b4192c05daba6',
    'docs/design': 'dcf191331784d29c61d400dc69cd73475679ca69',
}


def for_candidate(meta):
    if meta['component'] != 'web' or meta['tag'] != TAG:
        return None
    for path, expected in TREES.items():
        if (git('rev-parse', f'{BASELINE}:{path}') != expected
                or git('rev-parse', f'{meta["commit"]}:{path}') != expected):
            raise ValueError(f'Web rc13 owner exception does not cover changed product tree: {path}')
    return {
        'kind': 'single-release-owner-exception',
        'status': 'incomplete',
        'tag': TAG,
        'scope': ['design:ready', 'full-manual-acceptance'],
        'authorization': {
            'question': 'call_2a2f63af01c644578b31221353c38006',
            'answer': 'Да, выпустить web с этим исключением',
            'recordedAt': '2026-10-29T11:24:07Z',
        },
        'product_source': {'baseline': BASELINE, 'trees': dict(TREES)},
        'note': 'Приёмка design 4.1 и полный ручной проход не завершены. '
                'Обязательные автопроверки и идентичность артефакта сохраняются; '
                'это не passed acceptance receipt.',
    }
