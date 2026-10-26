import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { safePath, sha256 } from '../design/files.mjs';
import { writeNewJson } from './results.mjs';

const markdown = (s) => s.replaceAll('|', '\\|').replaceAll('\n', ' ');
export const exportReport = async (plan, run, evidenceDirectory, outputDirectory, cases = []) => {
  await mkdir(outputDirectory, { recursive: false });
  const allure = resolve(outputDirectory, 'allure-results');
  await mkdir(allure);
  const rows = [];
  const entries = [...plan.expected.map((expected) => ({ expected, result: run.checks.find((r) => r.id === expected.id) })),
    ...plan.suites.map((id) => ({ expected: { id, caseId: id, environment: "Обязательные наборы", mode: "suite" }, result: run.suites.find((s) => s.id === id) }))];
  for (const { expected, result } of entries) {
    const title = cases.find((c) => c.id === expected.caseId)?.title ?? expected.id;
    const state = result?.status ?? 'not_run';
    rows.push(`| ${markdown(title)} (${markdown(expected.id)}) | ${state} | ${markdown(result?.actual ?? 'Не выполнялся')} |`);
    const attachments = [];
    for (const item of result?.evidence ?? []) {
      const source = await safePath(evidenceDirectory, item.path);
      if (sha256(await readFile(source)) !== item.sha256) throw new Error('Evidence changed during export');
      const name = `${item.sha256}${extname(source)}`;
      await copyFile(source, resolve(allure, name));
      attachments.push({ name: item.kind, source: name, type: item.kind === 'screenshot' ? (extname(source) === '.png' ? 'image/png' : 'image/jpeg') : 'text/plain' });
    }
    const uuid = sha256(`${plan.id}:${expected.id}`);
    const status = ({ passed: 'passed', failed: 'failed', blocked: 'broken', skipped: 'skipped', not_run: 'skipped', running: 'broken' })[state];
    await writeNewJson(resolve(allure, `${uuid}-result.json`), {
      uuid, historyId: sha256(expected.id), testCaseId: expected.caseId, fullName: expected.id, name: title,
      status, stage: 'finished', statusDetails: { message: result?.actual ?? 'Не выполнялся' },
      start: Date.parse(result?.startedAt ?? plan.createdAt), stop: Date.parse(result?.finishedAt ?? plan.createdAt),
      labels: [{ name: 'suite', value: expected.environment }, { name: 'tag', value: expected.mode }], attachments,
    });
  }
  const lines = [`# Прогон ${plan.id}`, '', `Цель: ${plan.purpose}. Каталог: ${plan.catalogHash}.`, '',
    '| Кейс / окружение / способ | Результат | Наблюдение |', '| --- | --- | --- |', ...rows, '',
    '## Обязательные автоматические наборы', '', ...plan.suites.map((id) => `- ${id}: ${run.suites.find((s) => s.id === id)?.status ?? 'not_run'}`), '',
    'Наличие отчёта не означает готовности. Выполните qa:ready / qa:release-ready.', ''];
  await writeFile(resolve(outputDirectory, 'report.md'), lines.join('\n'), { flag: 'wx' });
};
