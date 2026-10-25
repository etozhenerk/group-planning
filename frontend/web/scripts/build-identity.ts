import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';
import { buildInfoSchema } from '#build-info';
import type { BuildIdentity } from '#build-info';

export const readBuildIdentity = (
  mode: string,
  env: Record<string, string | undefined>,
): BuildIdentity => {
  const release = env.SOMEWHERE_RELEASE_BUILD;

  if (release === undefined || release === '0') {
    return { mode: mode === 'demo' ? 'demo' : 'local' };
  }

  if (release !== '1' || mode !== 'production') {
    throw new Error('Release identity requires production mode and release flag 1');
  }

  const raw = env.SOMEWHERE_BUILD_INFO;

  if (!raw || raw.length > 16000) {
    throw new Error('Release build requires SOMEWHERE_BUILD_INFO');
  }

  const value: unknown = JSON.parse(raw);

  return { mode: 'release', info: buildInfoSchema.parse(value) };
};

export const buildIdentityPlugin = (identity: BuildIdentity): Plugin => ({
  name: 'somewhere-build-identity',
  writeBundle: async (options) => {
    if (identity.mode === 'release') {
      if (!options.dir) {
        throw new Error('Web release requires an output directory');
      }

      await writeFile(
        path.join(options.dir, 'build-info.json'),
        `${JSON.stringify(identity.info, null, 2)}\n`,
      );
    }
  },
});
