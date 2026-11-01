"""Только синтетические данные отдельного loopback fixture; cookies остаются в памяти."""
import hashlib
import http.cookiejar
import json
from pathlib import Path
import ssl
import struct
import urllib.parse
import urllib.request
import uuid
import zlib

ROOT = Path(__file__).resolve().parent
ORIGIN = 'https://127.0.0.1:8536'
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(
    urllib.request.ProxyHandler({}),
    urllib.request.HTTPSHandler(context=ssl._create_unverified_context()),
    urllib.request.HTTPCookieProcessor(jar),
)
csrf = None


def request(method, path, body=None, content_type='application/json'):
    data = json.dumps(body).encode() if body is not None and content_type == 'application/json' else body
    headers = {'Origin': ORIGIN, 'Content-Type': content_type, 'Idempotency-Key': str(uuid.uuid4())}
    if csrf:
        headers['X-CSRF-Token'] = csrf
    with client.open(urllib.request.Request(ORIGIN + path, data=data, headers=headers, method=method), timeout=15) as response:
        data = response.read()
        return json.loads(data) if response.headers.get('Content-Type', '').startswith('application/json') else data


def png(index):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    width, height = 640, 480
    rows = b''.join(b'\x00' + bytes((35 + index * 60, 80 + y // 4, 170 - index * 40)) * width for y in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')


started = request('POST', '/api/v1/auth/yandex/start', {'client_kind': 'web', 'return_context': {'kind': 'home'}})
state = urllib.parse.parse_qs(urllib.parse.urlparse(started['authorization_url']).query)['state'][0]
request('GET', '/api/v1/auth/yandex/callback?' + urllib.parse.urlencode({'state': state, 'code': 'sasha'}))
csrf = request('GET', '/api/v1/me')['csrf_token']
title = 'Длинное название встречи — суббота без спешки с друзьями, фотографиями и воспоминаниями'
created = request('POST', '/api/v1/meetings', {'title': title, 'starts_at': '2099-10-24T19:00:00+03:00', 'timezone': 'Europe/Moscow'})
meeting = created['meeting']
meeting_id = meeting['id']
request('PATCH', '/api/v1/meetings/' + meeting_id, {'expected_revision': meeting['revision'], 'starts_at': None, 'starts_on': '2026-10-01', 'timezone': 'UTC'})
photos = []
for index in range(3):
    data = png(index)
    key = str(uuid.uuid4())
    uploaded = request('POST', f'/api/v1/meetings/{meeting_id}/media/uploads', {'client_request_id': key, 'file_name': f'QA-{index+1}.png', 'content_type': 'image/png', 'size_bytes': len(data), 'purpose': 'memory'})
    media_id = uploaded['media']['id']
    base = f'/api/v1/meetings/{meeting_id}/media/{media_id}'
    request('PUT', base + '/content', data, 'image/png')
    request('POST', base + '/publish', {})
    original = request('GET', base + '/content')
    photos.append({'id': media_id, 'sha256': hashlib.sha256(original).hexdigest()})
    (ROOT / f'synthetic-{index+1}.png').write_bytes(data)
fixture = {'origin': ORIGIN, 'meetingId': meeting_id, 'title': title, 'photos': photos, 'login': 'Саша (test-only provider)', 'storage': 'isolated memory'}
(ROOT / 'fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'meetingId': meeting_id, 'photos': len(photos)}, ensure_ascii=False))
