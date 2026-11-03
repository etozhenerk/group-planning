import base from '/Users/misha/Documents/Codex/projects/group-planning/frontend/web/playwright.config';
export default {
  ...base,
  testDir: '/Users/misha/Documents/Codex/projects/group-planning/frontend/web/tests',
  outputDir: '/tmp/somewhere-20261103-vibe-web-output',
  use: { ...base.use, baseURL: 'https://127.0.0.1:8472' },
  webServer: {
    ...base.webServer,
    cwd: '/Users/misha/Documents/Codex/projects/group-planning/frontend/web',
    env: { SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8472', GO_BIN: '/Users/misha/.local/share/somewhere/go-1.27.2/bin/go' },
    url: 'https://127.0.0.1:8472/healthz',
  },
};
