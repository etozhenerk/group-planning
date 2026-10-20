import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const read = (file) => readFileSync(join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const requiredFiles = [
  'AGENTS.md', 'backend/AGENTS.md', 'frontend/web/AGENTS.md',
  'frontend/ios/AGENTS.md', 'frontend/android/AGENTS.md',
  'README.md', 'docs/product/overview.md', 'docs/product/open-questions.md',
  'docs/architecture/decisions.md', 'docs/workflow.md',
  'openspec/config.yaml', '.agents/skills/LICENSE.openspec',
];

function cli(args) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/openspec.mjs'), ...args], {
    cwd: root, encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    const diagnostic = result.error?.message || result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new Error(`OpenSpec ${args.join(' ')}: ${diagnostic}`);
  }
  return result.stdout.trim();
}

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

try {
  for (const file of requiredFiles) {
    const path = join(root, file);
    check(existsSync(path) && statSync(path).isFile() && statSync(path).size > 0,
      `Missing or empty file: ${file}`);
  }
  check(!existsSync(join(root, 'frontend/AGENTS.md')), 'Unexpected frontend/AGENTS.md: use platform instructions.');

  const pkg = json('package.json');
  const lock = json('package-lock.json');
  for (const [name, version] of Object.entries(pkg.devDependencies)) {
    check(lock.packages[''].devDependencies[name] === version, `Lockfile declaration mismatch: ${name}`);
    check(lock.packages[`node_modules/${name}`]?.version === version, `Locked version mismatch: ${name}`);
    check(json(`node_modules/${name}/package.json`).version === version, `Installed version mismatch: ${name}; run npm ci.`);
  }
  const workspaceLinks = new Map();

  for (const workspace of pkg.workspaces ?? []) {
    const literalPath = typeof workspace === 'string' &&
      /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(workspace);
    check(literalPath, `Expected an explicit relative workspace path: ${workspace}`);
    if (!literalPath) continue;

    const manifest = json(`${workspace}/package.json`);
    workspaceLinks.set(`node_modules/${manifest.name}`, workspace);
    check(lock.packages[workspace]?.version === manifest.version,
      `Workspace lockfile mismatch: ${workspace}`);

    for (const group of ['dependencies', 'devDependencies']) {
      for (const [name, version] of Object.entries(manifest[group] ?? {})) {
        check(/^\d+\.\d+\.\d+$/.test(version), `Pin the exact version: ${workspace}: ${name}`);
        check(lock.packages[workspace]?.[group]?.[name] === version,
          `Workspace dependency mismatch: ${workspace}: ${name}`);
        check(json(`node_modules/${name}/package.json`).version === version,
          `Workspace installed version mismatch: ${workspace}: ${name}; run npm ci.`);
      }
    }
  }

  for (const [name, entry] of Object.entries(lock.packages)) {
    if (entry.link) {
      check(workspaceLinks.has(name) && workspaceLinks.get(name) === entry.resolved,
        `Undeclared workspace link in lockfile: ${name}`);
      continue;
    }

    check(!entry.resolved || entry.resolved.startsWith('https://registry.npmjs.org/'),
      `Non-public registry in lockfile: ${name}`);
  }

  const profile = json('scripts/openspec-profile.json');
  const skillNames = {
    explore: 'openspec-explore', propose: 'openspec-propose', update: 'openspec-update-change',
    apply: 'openspec-apply-change', verify: 'openspec-verify-change',
    sync: 'openspec-sync-specs', archive: 'openspec-archive-change',
  };
  check(profile.profile === 'custom' && profile.delivery === 'skills', 'Expected the project custom skills profile.');
  const workflows = Array.isArray(profile.workflows) ? profile.workflows : [];
  check(workflows.length === Object.keys(skillNames).length && Object.keys(skillNames).every((name) => workflows.includes(name)),
    'Expected all seven project workflows, including verification.');
  for (const workflow of workflows) {
    const name = skillNames[workflow];
    check(Boolean(name), `Unknown workflow in profile: ${workflow}`);
    if (!name) continue;
    const path = `.agents/skills/${name}/SKILL.md`;
    if (!existsSync(join(root, path))) {
      failures.push(`Missing skill: ${name}; run npm run agent:setup.`);
      continue;
    }
    const match = read(path).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    check(Boolean(match), `Missing skill frontmatter: ${name}`);
    if (!match) continue;
    const meta = parse(match[1]);
    check(meta.name === name && typeof meta.description === 'string' && meta.description.trim().length > 0,
      `Invalid skill name or description: ${name}`);
    check(String(meta.metadata?.generatedBy) === pkg.devDependencies['@fission-ai/openspec'],
      `Skill version mismatch: ${name}; run npm run agent:update.`);
  }

  const projectSkills = ['product-copy-editor'];
  for (const name of projectSkills) {
    const path = `.agents/skills/${name}/SKILL.md`;
    if (!existsSync(join(root, path))) {
      failures.push(`Missing project skill: ${name}`);
      continue;
    }
    const match = read(path).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    check(Boolean(match), `Missing project skill frontmatter: ${name}`);
    if (!match) continue;
    const meta = parse(match[1]);
    check(meta.name === name && typeof meta.description === 'string' && meta.description.trim().length > 0,
      `Invalid project skill name or description: ${name}`);
  }

  const config = parse(read('openspec/config.yaml'));
  check(config.schema === 'spec-driven' && typeof config.context === 'string', 'Invalid OpenSpec project configuration.');

  const documentation = [
    join(root, 'README.md'), join(root, 'AGENTS.md'),
    ...markdownFiles(join(root, 'docs')),
    ...projectSkills.map((name) => join(root, `.agents/skills/${name}/SKILL.md`)),
    ...['backend', 'frontend/web', 'frontend/ios', 'frontend/android'].map((area) => join(root, area, 'AGENTS.md')),
  ];
  for (const file of documentation.filter(existsSync)) {
    const body = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      check(existsSync(resolve(dirname(file), decodeURIComponent(target))),
        `Broken local link in ${file.slice(root.length + 1)}: ${target}`);
    }
  }

  check(cli(['--version']) === pkg.devDependencies['@fission-ai/openspec'], 'Unexpected OpenSpec CLI version.');
  const changes = JSON.parse(cli(['list', '--json']));
  const specs = JSON.parse(cli(['list', '--specs', '--json']));
  for (const listing of [changes, specs]) {
    check(listing.root?.path && realpathSync(listing.root.path) === root, 'OpenSpec resolved a different project root.');
  }
  if (changes.changes.length || specs.specs.length) {
    cli(['validate', '--all', '--strict']);
    console.log('OpenSpec changes and specs: structurally valid.');
  } else {
    console.log('No active changes or current specs; product scenarios have not been verified.');
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`Agent setup OK: 5 instruction files, ${workflows.length} OpenSpec skills, ${projectSkills.length} project skill, pinned CLI and documentation links.`);
} catch (error) {
  console.error(`Agent setup check failed:\n${error.message}`);
  process.exitCode = 1;
}
