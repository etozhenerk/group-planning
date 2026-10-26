import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './generate.mjs';
import { registry } from './cli.mjs';
import { readJson } from './files.mjs';
import { reviewStatus } from './review.mjs';

export const stopDecision = async (input, base = root) => {
  if (input.stop_hook_active) return {};
  const { manifests } = await registry(base);
  for (const path of manifests) {
    const manifest = await readJson(`${base}/${path}`);
    if (manifest.phase === 'paused') continue;
    try {
      await reviewStatus(base, path, { ready: manifest.phase === 'review' });
    } catch (error) {
      return {
        decision: 'block',
        reason: `Экран ${manifest.id} ожидает независимый design-review: ${error.message}. Примените .agents/skills/design-review/SKILL.md. Если пользователь явно остановил работу, сохраните phase=paused и сообщите незавершённость.`,
      };
    }
  }
  return {};
};
if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  try {
    const input = JSON.parse(await readFile('/dev/stdin', 'utf8'));
    console.log(JSON.stringify(await stopDecision(input)));
  } catch (error) {
    console.log(
      JSON.stringify({
        systemMessage: `Design hook unavailable: ${error.message}. Проверьте npm run design:check; готовность UI не подтверждена.`,
      }),
    );
  }
}
