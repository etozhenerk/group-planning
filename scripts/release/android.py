"""Подписанные Android AAB/APK; keystore существует только на время сборки."""
import base64
import os
from pathlib import Path
import shutil
import tempfile
import zipfile

from common import ROOT, run


def require_credentials():
    required = ('ANDROID_KEYSTORE_BASE64', 'ANDROID_STORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD')
    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise ValueError('Android signing secrets missing: ' + ', '.join(missing))


def build(directory, meta, origin):
    require_credentials()
    with tempfile.TemporaryDirectory(prefix='somewhere-signing-') as temporary:
        keystore = Path(temporary) / 'upload.jks'
        keystore.write_bytes(base64.b64decode(os.environ['ANDROID_KEYSTORE_BASE64'], validate=True))
        keystore.chmod(0o600)
        env = dict(os.environ, ANDROID_KEYSTORE_PATH=str(keystore))
        env.pop('ANDROID_KEYSTORE_BASE64', None)
        run('sh', 'gradlew', '--no-daemon', '--console=plain', 'clean', 'formatCheck',
            'assembleDebug', 'assembleRelease', 'bundleRelease', 'lintDebug', 'lintRelease',
            'testDebugUnitTest', 'testReleaseUnitTest',
            '-PsomewhereStoreRelease=true', f"-PsomewhereReleaseVersion={meta['native_version']}",
            f"-PsomewhereReleaseBuild={meta['build_number']}", f'-PsomewhereApiOrigin={origin}',
            cwd=ROOT / 'frontend/android', env=env)
        outputs = ROOT / 'frontend/android/app/build/outputs'
        shutil.copyfile(outputs / 'bundle/release/app-release.aab', directory / 'somewhere.aab')
        shutil.copyfile(outputs / 'apk/release/app-release.apk', directory / 'somewhere.apk')
        shutil.copyfile(outputs / 'mapping/release/mapping.txt', directory / 'mapping.txt')
        sdk = Path(os.environ.get('ANDROID_SDK_ROOT') or os.environ['ANDROID_HOME'])
        run(str(sdk / 'build-tools/36.0.0/apksigner'), 'verify', '--verbose', str(directory / 'somewhere.apk'))
        # JAR verification alone returns success for an unsigned archive. Require a signer certificate too.
        with zipfile.ZipFile(directory / 'somewhere.aab') as bundle:
            if not any(name.startswith('META-INF/') and name.endswith(('.RSA', '.DSA', '.EC')) for name in bundle.namelist()):
                raise ValueError('AAB has no signing certificate')
        run('jarsigner', '-verify', str(directory / 'somewhere.aab'))
        run('keytool', '-printcert', '-jarfile', str(directory / 'somewhere.aab'))
    return {'api_origin': origin, 'application_id': 'dev.groupplanning.android',
            'signed': True, 'signing': 'upload key; Play App Signing manages the distribution key'}
