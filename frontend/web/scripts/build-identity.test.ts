import { describe, expect, it } from 'vitest';
import { readBuildIdentity } from '@tools/build-identity';
import { describeBuild } from '@/shared/config/buildInfo';

const info = {
  schema_version: 1,
  component: 'web',
  version: '0.1.0-rc.3',
  tag: 'web/v0.1.0-rc.3',
  commit: 'a'.repeat(40),
  build_number: 42,
};

const releaseEnv = (value: unknown) => ({
  SOMEWHERE_RELEASE_BUILD: '1',
  SOMEWHERE_BUILD_INFO: JSON.stringify(value),
  VITE_APP_VERSION: '9.9.9',
});

describe('release identity', () => {
  it('preserves the complete RC from authoritative metadata', () => {
    const identity = readBuildIdentity('production', releaseEnv(info));

    expect(identity).toEqual({ mode: 'release', info });
    expect(describeBuild(identity)).toEqual({
      label: 'Версия 0.1.0-rc.3',
      number: 42,
      version: '0.1.0-rc.3',
    });
  });

  it('fails closed for missing, inconsistent and non-web release metadata', () => {
    const invalid: unknown[] = [
      undefined,
      {},
      { ...info, version: '0.0.0' },
      { ...info, component: 'backend' },
      { ...info, commit: '' },
      { ...info, build_number: 0 },
      { ...info, secret: 'must-not-be-embedded' },
      { ...info, version: '01.2.3', tag: 'web/v01.2.3' },
    ];

    for (const value of invalid) {
      expect(() => readBuildIdentity('production', releaseEnv(value))).toThrow();
    }

    expect(() => readBuildIdentity('demo', releaseEnv(info))).toThrow();
    expect(() =>
      readBuildIdentity('production', { SOMEWHERE_RELEASE_BUILD: 'yes' }),
    ).toThrow();
  });

  it('keeps local and demo builds available without a tag or fake release fallback', () => {
    expect(
      describeBuild(readBuildIdentity('development', { VITE_APP_VERSION: '1.0.0' }))
        .label,
    ).toBe('Локальная сборка');
    expect(describeBuild(readBuildIdentity('demo', {})).label).toBe('Демо');
    expect(describeBuild(readBuildIdentity('production', {})).number).toBeNull();
    expect(describeBuild(undefined).label).toBe('Версия недоступна');
  });

  it('keeps patch versions distinct and build number separate', () => {
    for (const version of ['0.1.0', '0.1.1']) {
      const identity = readBuildIdentity(
        'production',
        releaseEnv({ ...info, version, tag: `web/v${version}` }),
      );

      expect(describeBuild(identity).label).toBe(`Версия ${version}`);
      expect(describeBuild(identity).number).toBe(42);
    }
  });
});
