import { defineConfig } from 'vitest/config';
export default defineConfig({
 resolve: {alias: {'@': '/Users/misha/Documents/Codex/projects/group-planning/frontend/web/src'}},
 test: {environment: 'node', include: ['openspec/changes/chat-reliability-and-sync/qa/2026-10-27-cursor-independent/source/independent.test.ts'], maxWorkers: 1, fileParallelism: false}
});
