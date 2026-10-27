import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()],
  resolve: { alias: {
    '@': fileURLToPath(new URL('../../frontend/web/src', import.meta.url)),
    '@spike': fileURLToPath(new URL('./', import.meta.url)),
  } },
});
