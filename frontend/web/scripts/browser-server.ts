import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const executable = process.env.GO_BIN ?? 'go';
const child = spawn(
  executable,
  [
    'test',
    '-count=1',
    '-timeout=0',
    '-run',
    '^TestBrowserFixture$',
    '-v',
    './internal/httpapi',
  ],
  {
    cwd: path.join(root, 'backend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      SOMEWHERE_BROWSER_FIXTURE: '1',
      SOMEWHERE_BROWSER_DIST: path.join(root, '.cache/web-demo'),
      SOMEWHERE_BROWSER_ADDR: process.env.SOMEWHERE_BROWSER_ADDR ?? '127.0.0.1:8443',
    },
  },
);

const stop = () => {
  child.kill('SIGTERM');
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
