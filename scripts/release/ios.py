"""Archive/export для App Store Connect с временным keychain и profile."""
import base64
from contextlib import contextmanager
from datetime import datetime, timezone
import os
from pathlib import Path
import plistlib
import secrets
import shlex
import shutil
import subprocess
import tempfile
import zipfile

from common import ROOT, run

BUNDLE_ID = 'dev.groupplanning.ios'


def require_credentials():
    required = ('IOS_CERTIFICATE_P12_BASE64', 'IOS_CERTIFICATE_PASSWORD', 'IOS_PROVISION_PROFILE_BASE64', 'IOS_TEAM_ID')
    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise ValueError('iOS distribution certificate/settings missing: ' + ', '.join(missing))


@contextmanager
def signing():
    require_credentials()
    with tempfile.TemporaryDirectory(prefix='somewhere-signing-') as temporary:
        temp = Path(temporary)
        certificate = temp / 'certificate.p12'
        profile = temp / 'profile.mobileprovision'
        for path, key in ((certificate, 'IOS_CERTIFICATE_P12_BASE64'), (profile, 'IOS_PROVISION_PROFILE_BASE64')):
            path.write_bytes(base64.b64decode(os.environ[key], validate=True))
            path.chmod(0o600)
        decoded = subprocess.check_output(['security', 'cms', '-D', '-i', str(profile)])
        data = plistlib.loads(decoded)
        team = os.environ['IOS_TEAM_ID']
        if data['ExpirationDate'].replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
            raise ValueError('Provisioning profile has expired')
        if data['TeamIdentifier'] != [team] or data['Entitlements'].get('application-identifier') != f'{team}.{BUNDLE_ID}':
            raise ValueError('Profile team/application identifier does not match this application')
        if data['Entitlements'].get('get-task-allow') or data.get('ProvisionedDevices') or data.get('ProvisionsAllDevices'):
            raise ValueError('An App Store distribution profile is required')
        # Xcode 16+ stores downloaded profiles here. A unique filename avoids replacing an existing profile.
        profiles = Path.home() / 'Library/Developer/Xcode/UserData/Provisioning Profiles'
        profiles.mkdir(parents=True, exist_ok=True)
        installed = profiles / f'somewhere-release-{secrets.token_hex(12)}.mobileprovision'
        keychain = temp / 'signing.keychain-db'
        password = secrets.token_urlsafe(32)
        created = False
        search_list = shlex.split(subprocess.check_output(['security', 'list-keychains', '-d', 'user'], text=True))
        changed_search = False
        try:
            shutil.copyfile(profile, installed)
            run('security', 'create-keychain', '-p', password, str(keychain))
            created = True
            run('security', 'set-keychain-settings', '-lut', '21600', str(keychain))
            run('security', 'unlock-keychain', '-p', password, str(keychain))
            run('security', 'import', str(certificate), '-P', os.environ['IOS_CERTIFICATE_PASSWORD'],
                '-t', 'cert', '-f', 'pkcs12', '-k', str(keychain), '-T', '/usr/bin/codesign', '-T', '/usr/bin/security')
            run('security', 'set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-k', password, str(keychain))
            run('security', 'list-keychains', '-d', 'user', '-s', str(keychain), *search_list)
            changed_search = True
            yield keychain, data['UUID'], team
        finally:
            installed.unlink(missing_ok=True)
            try:
                if changed_search:
                    run('security', 'list-keychains', '-d', 'user', '-s', *search_list)
            finally:
                if created:
                    run('security', 'delete-keychain', str(keychain))


def build(directory, meta, origin):
    with signing() as (keychain, profile, team), tempfile.TemporaryDirectory(prefix='somewhere-archive-') as temporary:
        temp = Path(temporary)
        archive = temp / 'Somewhere.xcarchive'
        export = temp / 'export'
        options = temp / 'ExportOptions.plist'
        options.write_bytes(plistlib.dumps(dict(method='app-store-connect', destination='export',
            signingStyle='manual', teamID=team, signingCertificate='Apple Distribution',
            provisioningProfiles={BUNDLE_ID: profile}, manageAppVersionAndBuildNumber=False,
            stripSwiftSymbols=True, uploadSymbols=False)))
        run('xcodebuild', '-project', 'Somewhere.xcodeproj', '-scheme', 'Somewhere',
            '-configuration', 'Release', '-destination', 'generic/platform=iOS', '-jobs', '2',
            '-archivePath', str(archive), 'archive', 'CODE_SIGN_STYLE=Manual',
            'CODE_SIGN_IDENTITY=Apple Distribution', f'DEVELOPMENT_TEAM={team}',
            f'PROVISIONING_PROFILE_SPECIFIER={profile}', f'OTHER_CODE_SIGN_FLAGS=--keychain {keychain}',
            f"MARKETING_VERSION={meta['native_version']}", f"CURRENT_PROJECT_VERSION={meta['build_number']}",
            f'SOMEWHERE_API_ORIGIN={origin}', cwd=ROOT / 'frontend/ios')
        app = archive / 'Products/Applications/Somewhere.app'
        run('codesign', '--verify', '--deep', '--strict', str(app))
        info = plistlib.loads((app / 'Info.plist').read_bytes())
        if info.get('SomewhereAPIOrigin') != origin:
            raise ValueError('Archive API origin mismatch')
        if info['CFBundleIdentifier'] != BUNDLE_ID or info['CFBundleShortVersionString'] != meta['native_version'] or str(info['CFBundleVersion']) != str(meta['build_number']):
            raise ValueError('Archive version or application identifier mismatch')
        run('xcodebuild', '-exportArchive', '-archivePath', str(archive), '-exportPath', str(export),
            '-exportOptionsPlist', str(options), f'OTHER_CODE_SIGN_FLAGS=--keychain {keychain}')
        ipas = list(export.glob('*.ipa'))
        if len(ipas) != 1:
            raise ValueError('Expected exactly one exported IPA')
        shutil.copyfile(ipas[0], directory / 'Somewhere.ipa')
        unpacked = temp / 'ipa-check'
        run('ditto', '-x', '-k', str(ipas[0]), str(unpacked))
        run('codesign', '--verify', '--deep', '--strict', str(unpacked / 'Payload/Somewhere.app'))
        with zipfile.ZipFile(ipas[0]) as ipa:
            exported = plistlib.loads(ipa.read('Payload/Somewhere.app/Info.plist'))
            for field in ('CFBundleIdentifier', 'CFBundleShortVersionString', 'CFBundleVersion'):
                if exported[field] != info[field]:
                    raise ValueError('Export unexpectedly changed archive metadata')
        if not list((archive / 'dSYMs').glob('*.dSYM')):
            raise ValueError('Archive lacks debug symbols')
        run('ditto', '-c', '-k', '--keepParent', str(archive), str(directory / 'Somewhere.xcarchive.zip'))
        run('ditto', '-c', '-k', '--keepParent', str(archive / 'dSYMs'), str(directory / 'dSYMs.zip'))
    return {'api_origin': origin, 'application_id': BUNDLE_ID, 'signed': True, 'export_method': 'app-store-connect'}
