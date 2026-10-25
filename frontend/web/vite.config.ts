import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { buildIdentityPlugin, readBuildIdentity } from '#build-identity';

export default defineConfig(({ mode }) => {
  const identity = readBuildIdentity(mode, process.env);

  return {
    plugins: [react(), buildIdentityPlugin(identity)],
    define: {
      'import.meta.env.VITE_BUILD_IDENTITY': JSON.stringify(identity),
    },
    build: {
      outDir: mode === 'demo' ? '../../.cache/web-demo' : 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
        '@tools': fileURLToPath(new URL('./scripts', import.meta.url)),
      },
    },
    server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
    test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
  };
});
