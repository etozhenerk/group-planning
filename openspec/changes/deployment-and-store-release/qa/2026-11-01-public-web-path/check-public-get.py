from pathlib import Path
import urllib.request, urllib.error, urllib.parse, json, hashlib, re, datetime, html.parser, os

origin = 'https://smwhere.ru'
token = os.environ['INVITATION_TOKEN']
base = Path('/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/qa/2026-11-01-public-web-path')
base.mkdir(parents=True, exist_ok=True)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

op = urllib.request.build_opener(NoRedirect)

def get(path, label):
    req = urllib.request.Request(origin + path, method='GET', headers={'User-Agent': 'somewhere-readonly-qa/4.1', 'Accept': '*/*'})
    try:
        with op.open(req, timeout=25) as response:
            data, status, headers = response.read(), response.status, response.headers
    except urllib.error.HTTPError as error:
        data, status, headers = error.read(), error.code, error.headers
    result = {'label': label, 'method': 'GET', 'timeUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'status': status, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'headers': {key: headers.get(key) for key in ['Content-Type', 'Cache-Control', 'Referrer-Policy', 'X-Content-Type-Options', 'X-Robots-Tag', 'Server'] if headers.get(key)}, 'setCookiePresent': bool(headers.get('Set-Cookie'))}
    return data, headers, result

class Parse(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.assets, self.scripts, self.inline, self.in_script = {}, [], [], [], False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.meta[attrs.get('property', attrs.get('name', ''))] = attrs.get('content', '')
        if tag == 'script':
            self.scripts.append(attrs)
            self.in_script = True
        if tag in ['script', 'link']:
            address = attrs.get('src', attrs.get('href', ''))
            if address.startswith('/assets/'):
                self.assets.append(address)
    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
    def handle_data(self, data):
        if self.in_script and data.strip():
            self.inline.append(data)

rows, home = [], None
paths = [('/build-info.json', 'build-info'), ('/', 'home'), ('/about', 'about-deep'), ('/meetings', 'meetings-anonymous'), ('/qa-route-not-found-20261101', 'unknown-route'), ('/assets/qa-missing-20261101.js', 'missing-asset'), ('/i/invalid', 'invalid-invitation'), ('/i/' + token, 'given-invitation'), ('/invitations/' + token + '?auth_error=cancelled', 'legacy-invitation'), ('/api/v1/me', 'anonymous-api-me')]
for path, label in paths:
    data, headers, result = get(path, label)
    if label == 'build-info':
        result['identity'] = json.loads(data)
        (base / 'public-build-info.json').write_bytes(data)
    if label == 'legacy-invitation':
        result['redirectToCanonicalPreservingQuery'] = headers.get('Location') == '/i/' + token + '?auth_error=cancelled'
    if 'text/html' in headers.get('Content-Type', ''):
        body = data.decode()
        parser = Parse()
        parser.feed(body)
        result['html'] = {'rootEmpty': bool(re.search(r'<div\s+id=["\x27]root["\x27]\s*>\s*</div>', body)), 'inlineScriptCount': len(parser.inline), 'externalScripts': [{key: value for key, value in attrs.items() if key in ['type', 'src', 'crossorigin']} for attrs in parser.scripts], 'metaNames': sorted(parser.meta), 'privateSerializationIndicators': re.findall(r'(?i)__INITIAL_STATE__|__NEXT_DATA__|access_token|refresh_token|csrf_token|session_id|client_request_id|read_through_sequence|data-entry-id', body), 'emailLikeCount': len(re.findall(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', body))}
        if label == 'home':
            home = parser
            (base / 'home-nojs.html').write_bytes(data)
        if label == 'given-invitation':
            result['html'].update({'ogRequiredPresent': all(parser.meta.get(key) for key in ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']), 'ogCanonicalMatchesGiven': parser.meta.get('og:url') == origin + '/i/' + token, 'ogTitleSha256': hashlib.sha256(parser.meta.get('og:title', '').encode()).hexdigest(), 'ogDescriptionSha256': hashlib.sha256(parser.meta.get('og:description', '').encode()).hexdigest(), 'ogImageSameOrigin': urllib.parse.urlsplit(parser.meta.get('og:image', '')).netloc == 'smwhere.ru', 'titleMetadataPresentBeforeJS': bool(re.search(r'<title>[^<]+</title>', body))})
            image_url = urllib.parse.urlsplit(parser.meta.get('og:image', ''))
            if image_url.netloc == 'smwhere.ru':
                _, _, image_result = get(image_url.path + ('?' + image_url.query if image_url.query else ''), 'invitation-og-image')
                rows.append(image_result)
    rows.append(result)
if home:
    for path in sorted(set(home.assets)):
        _, _, result = get(path, 'asset:' + path)
        result['sameOrigin'] = True
        rows.append(result)
result = {'origin': origin, 'invitationTokenSha256': hashlib.sha256(token.encode()).hexdigest(), 'requests': rows, 'constraint': 'GET only; no cookies/auth supplied; invitation HTML/content/complete URL not persisted'}
serialized = json.dumps(result, indent=2, ensure_ascii=False)
assert token not in serialized
(base / 'http-assertions.json').write_text(serialized)
print([(row['label'], row['status'], row['bytes']) for row in rows])
