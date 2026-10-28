import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const binary = process.env.SOMEWHERE_CHAT_FIXTURE_BIN;
const child = spawn(
  binary ?? process.env.GO_BIN ?? 'go',
  binary
    ? ['-test.run', '^TestBrowserFixture$', '-test.timeout', '0']
    : [
        'test',
        '-p',
        '2',
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
      GOMAXPROCS: '2',
      SOMEWHERE_BROWSER_FIXTURE: '1',
      SOMEWHERE_BROWSER_CHAT_REALTIME: process.env.SOMEWHERE_BROWSER_CHAT_REALTIME ?? '1',
      SOMEWHERE_BROWSER_DIST:
        process.env.SOMEWHERE_BROWSER_DIST ?? path.join(root, '.cache/web-demo'),
      SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8458',
    },
  },
);

const stop = () => {
  child.kill('SIGTERM');
};

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
