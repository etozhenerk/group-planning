import { spawn } from 'node:child_process';
import { chmodSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const stateDirectory = resolve(root, '.cache/local-auth');
const environmentPath = resolve(root, 'backend/.env.yandex.local');
const registrationPath = resolve(stateDirectory, 'registration.json');
const serverPort = 8080;
const children = [];
let stopping = false;
let ownsRegistration = false;

const stop = () => {
  if (stopping) return;
  stopping = true;
  if (ownsRegistration) rmSync(registrationPath, { force: true });
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

const run = (command, args, cwd = root) => new Promise((accept, reject) => {
  const logPath = resolve(stateDirectory, `${command}-build.log`);
  const log = openSync(logPath, 'w', 0o600);
  const child = spawn(command, args, { cwd, stdio: ['ignore', log, log] });
  closeSync(log);
  children.push(child);
  child.once('error', reject);
  child.once('exit', code => code === 0 ? accept() : reject(new Error(`${command}: exit ${code}; журнал: ${logPath}`)));
});

const requireFreePort = port => new Promise((accept, reject) => {
  const listener = createServer();
  listener.once('error', () => reject(new Error(`Порт 127.0.0.1:${port} уже занят. Остановите прежний локальный запуск.`)));
  listener.listen(port, '127.0.0.1', () => listener.close(accept));
});

const start = (command, args, name, options = {}) => {
  const { ipc = false, ...spawnOptions } = options;
  const log = openSync(resolve(stateDirectory, `${name}.log`), 'w', 0o600);
  const stdio = ipc ? ['ignore', log, log, 'ipc'] : ['ignore', log, log];
  const child = spawn(command, args, { cwd: root, stdio, ...spawnOptions });
  closeSync(log);
  children.push(child);
  child.once('error', error => {
    console.error(`${name}: ${error.code ?? 'не удалось запустить'}`);
    process.exitCode = 1;
    stop();
  });
  child.once('exit', () => {
    if (!stopping) {
      console.error(`${name} остановлен. Журнал: .cache/local-auth/${name}.log`);
      process.exitCode = 1;
      stop();
    }
  });
  return child;
};

const waitFor = async (url, extract) => {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (stopping) throw new Error('Локальный запуск остановлен.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const value = await extract(response);
        if (value) return value;
      }
    } catch {
      // The child may still be starting; bounded retries do not change trust or origin.
    }
    await delay(250);
  }
  throw new Error(`Локальный сервис не запустился: ${url}. Проверьте .cache/local-auth/*.log.`);
};

const updateSetting = (path, key, value, separator = '=') => {
  const content = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = content.split('\n').filter(line => line.split('=', 1)[0].trim() !== key);
  while (lines.at(-1) === '') lines.pop();
  writeFileSync(path, `${lines.join('\n')}\n${key}${separator}${value}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
};

const startTunnel = () => new Promise((accept, reject) => {
  // Isolate the SDK so startup has a deadline and shutdown can terminate its connection.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('SOMEWHERE_')));
  const child = start(process.execPath, [resolve(root, 'scripts/local-auth-tunnel.mjs')], 'tunnel', {
    env, ipc: true,
  });
  const timeout = setTimeout(() => reject(new Error('ngrok не подключился за 45 секунд. Проверьте .cache/local-auth/tunnel.log.')), 45000);
  const fail = () => reject(new Error('ngrok не запустился. Проверьте .cache/local-auth/tunnel.log.'));
  child.once('error', fail);
  child.once('exit', fail);
  child.once('message', message => {
    try {
      const url = new URL(message.origin);
      if (url.protocol !== 'https:' || url.origin !== message.origin) throw new Error('Некорректный origin ngrok.');
      accept(url.origin);
    } catch (error) {
      reject(error);
    }
  });
  child.once('message', () => clearTimeout(timeout));
  child.once('exit', () => clearTimeout(timeout));
  child.once('error', () => clearTimeout(timeout));
});

const main = async () => {
  if (!existsSync(environmentPath)) throw new Error('Создайте backend/.env.yandex.local по шаблону .env.yandex.example.');
  const settings = parseEnv(readFileSync(environmentPath, 'utf8'));
  if (!settings.SOMEWHERE_YANDEX_CLIENT_ID || !settings.SOMEWHERE_YANDEX_CLIENT_SECRET) {
    throw new Error('Заполните Client ID и Secret в backend/.env.yandex.local.');
  }
  mkdirSync(stateDirectory, { recursive: true });
  await requireFreePort(serverPort);
  ownsRegistration = true;
  rmSync(registrationPath, { force: true });
  console.log('Подключение ngrok к локальному серверу на 127.0.0.1:8080…');
  const origin = await startTunnel();
  if (stopping) return;
  console.log('Сборка web и локального Go-сервера…');
  await run('npm', ['run', 'web:build']);
  await run('go', ['build', '-o', resolve(stateDirectory, 'server'), './cmd/server'], resolve(root, 'backend'));
  if (stopping) return;
  for (const key of ['SOMEWHERE_PUBLIC_ORIGIN', 'SOMEWHERE_WEB_ORIGIN']) {
    settings[key] = origin;
    updateSetting(environmentPath, key, origin);
  }
  settings.SOMEWHERE_AUTH_ENABLED = 'true';
  settings.SOMEWHERE_HTTP_ADDR = `127.0.0.1:${serverPort}`;
  settings.SOMEWHERE_STORAGE = 'memory';
  settings.SOMEWHERE_WEB_DIST = resolve(root, 'frontend/web/dist');
  updateSetting(resolve(root, 'frontend/ios/Config/Local.xcconfig'), 'SOMEWHERE_API_ORIGIN', origin.replace('://', ':/$()/'), ' = ');
  updateSetting(resolve(root, 'frontend/android/local.properties'), 'somewhere.api.origin', origin);
  const serverEnvironment = { ...process.env, ...settings };
  delete serverEnvironment.NGROK_AUTHTOKEN;
  start(resolve(stateDirectory, 'server'), [], 'server', { env: serverEnvironment });
  await waitFor(`http://127.0.0.1:${serverPort}/healthz`, async () => true);
  await waitFor(`${origin}/healthz`, async response => (await response.json()).status === 'ok');
  const registration = { origin, redirectUri: `${origin}/api/v1/auth/yandex/callback` };
  writeFileSync(registrationPath, `${JSON.stringify(registration, null, 2)}\n`, { mode: 0o600 });
  console.log(`\nЛокальный web и API: ${origin}`);
  console.log(`Яндекс OAuth → Redirect URI: ${registration.redirectUri}`);
  console.log(`Яндекс OAuth → хост страницы: ${origin}`);
  console.log('Адрес записан в локальное окружение сервера, iOS Local.xcconfig и Android local.properties.');
  console.log('Пересоберите мобильные приложения. Секрет остаётся только на сервере.');
  console.log('Остановка: Ctrl+C. ngrok использует dev-домен вашего аккаунта; сверяйте URL при запуске.');
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  stop();
}
