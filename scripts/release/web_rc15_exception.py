"""Однократный допуск владельца для неизменного продукта web rc15."""
from common import git

TAG = 'web/v0.1.0-rc.15'
BASELINE = '17fb80e897f79d0230f17e955dce631d90ca530e'
TREES = {
    'frontend/web': '2e3b35c110f22db77a754b548cec059f8a8623f8',
    'backend': '3101230e49c9403f312a5ee1287f87619f4e0056',
    'contracts': '23946d2bd632af4a3983528348add7323ed36acb',
    'design-system': '34ca32a757e585cfdfe019737b941ea80ff7db54',
    'docs/design': '46f6e8775dc31df7bd5c6842f26a03b92b4d1d38',
}


def for_candidate(meta):
    if meta['component'] != 'web' or meta['tag'] != TAG:
        return None
    for path, expected in TREES.items():
        if (git('rev-parse', f'{BASELINE}:{path}') != expected
                or git('rev-parse', f'{meta["commit"]}:{path}') != expected):
            raise ValueError(f'Web rc15 owner exception does not cover changed product tree: {path}')
    return {
        'kind': 'single-release-owner-exception',
        'status': 'incomplete',
        'tag': TAG,
        'scope': ['design:ready', 'full-manual-acceptance'],
        'authorization': {
            'source': 'direct-user-messages-2026-10-29',
            'answer': 'просто запуасти, я все окаю; дизайн ок; отметь дизайн ок',
            'recordedAt': '2026-10-29T15:52:33Z',
        },
        'product_source': {'baseline': BASELINE, 'trees': dict(TREES)},
        'note': 'Владелец принял дизайн5.0.0 и разрешил выпуск; полный независимый проход не завершён. '
                'Обязательные автопроверки и идентичность артефакта сохраняются; '
                'это не passed acceptance receipt.',
    }
