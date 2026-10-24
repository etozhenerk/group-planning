import ngrok from '@ngrok/ngrok';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const environmentPath = fileURLToPath(new URL('../.env.ngrok.local', import.meta.url));
const settings = existsSync(environmentPath) ? parseEnv(readFileSync(environmentPath, 'utf8')) : {};
const token = process.env.NGROK_AUTHTOKEN || settings.NGROK_AUTHTOKEN;
let stopping = false;
let connected = false;

const stop = async () => {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(0), 3000);
  try {
    await ngrok.disconnect();
  } finally {
    clearTimeout(timeout);
    process.exit(0);
  }
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
process.once('disconnect', stop);

try {
  if (!token) throw new Error('Заполните NGROK_AUTHTOKEN в .env.ngrok.local по шаблону .env.ngrok.example.');
  const listener = await ngrok.forward({
    addr: 'http://127.0.0.1:8080',
    authtoken: token,
    onStatusChange: status => {
      if (status === 'closed' && connected && !stopping) {
        console.error('Соединение ngrok завершено. Перезапустите npm run auth:local.');
        process.exit(1);
      }
    },
  });
  connected = true;
  process.send?.({ origin: listener.url() });
  // forward() owns the forwarding task; the parent IPC channel keeps this process alive.
  process.channel?.ref();
} catch (error) {
  console.error(String(error.message).replaceAll(token || '\0', '[скрыто]'));
  process.exit(1);
}
