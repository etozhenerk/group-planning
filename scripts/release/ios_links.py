"""Проверки публичной связи подписанного iOS-приложения с доменом."""
import re
from urllib.parse import urlsplit

BUNDLE_ID = 'dev.groupplanning.ios'
DOMAINS = 'com.apple.developer.associated-domains'


def invitation_host(origin):
    parsed = urlsplit(origin)
    if (parsed.scheme != 'https' or not parsed.hostname or parsed.netloc != parsed.hostname
            or parsed.path or parsed.query or parsed.fragment):
        raise ValueError('Universal Links release requires an HTTPS origin without a port or path')
    if not re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', parsed.hostname):
        raise ValueError('Invalid invitation domain')
    return parsed.hostname


def profile_application_id(profile, team, host):
    entitlements = profile.get('Entitlements', {})
    identifier = entitlements.get('application-identifier', '')
    prefix, separator, bundle = identifier.partition('.')
    if (profile.get('TeamIdentifier') != [team] or not separator or bundle != BUNDLE_ID
            or not re.fullmatch(r'[A-Z0-9]{10}', prefix)
            or prefix not in profile.get('ApplicationIdentifierPrefix', [])):
        raise ValueError('Profile team/application identifier does not match this application')
    domains = entitlements.get(DOMAINS, [])
    if not isinstance(domains, list) or ('*' not in domains and f'applinks:{host}' not in domains):
        raise ValueError('Distribution profile does not enable Associated Domains for this host')
    return identifier


def verify_signed_entitlements(entitlements, identifier, host):
    if entitlements.get('application-identifier') != identifier:
        raise ValueError('Signed application identifier differs from the provisioning profile')
    domains = entitlements.get(DOMAINS, [])
    if not isinstance(domains, list) or f'applinks:{host}' not in domains:
        raise ValueError('Signed application lacks its invitation Associated Domain')
