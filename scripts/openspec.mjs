import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 19)) {
  console.error('OpenSpec requires Node.js >=20.19.0. Run nvm use, then npm ci.');
  process.exit(1);
}

const cli = join(root, 'node_modules/@fission-ai/openspec/bin/openspec.js');
if (!existsSync(cli)) {
  console.error('OpenSpec is not installed. Run npm ci in the repository root.');
  process.exit(1);
}

// The upstream workflow profile is machine-global. Give this child process
// a repository-local config and data directory so setup is reproducible.
const configHome = join(root, '.cache/openspec/config');
const dataHome = join(root, '.cache/openspec/data');
const profile = readFileSync(join(root, 'scripts/openspec-profile.json'), 'utf8');
const configPath = join(configHome, 'openspec/config.json');
mkdirSync(dirname(configPath), { recursive: true });
mkdirSync(dataHome, { recursive: true });
if (!existsSync(configPath) || readFileSync(configPath, 'utf8') !== profile) {
  writeFileSync(configPath, profile);
}

const child = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    XDG_CONFIG_HOME: configHome,
    XDG_DATA_HOME: dataHome,
    OPENSPEC_TELEMETRY: '0',
    OPENSPEC_NO_UPDATE_CHECK: '1',
  },
});
if (child.error) {
  console.error(child.error.message);
}
process.exit(child.status ?? 1);
