import { readFile } from 'node:fs/promises';
import StyleDictionary from 'style-dictionary';

const types = new Set([
  'color',
  'dimension',
  'duration',
  'number',
  'fontFamily',
  'fontWeight',
  'cubicBezier',
]);
const finite = (value) => typeof value === 'number' && Number.isFinite(value);

export const validateTokens = (source) => {
  const tokens = new Map();
  const walk = (node, path = []) => {
    if (!node || typeof node !== 'object' || Array.isArray(node))
      throw new Error(`Invalid group: ${path.join('.')}`);
    if ('$value' in node) {
      if (!types.has(node.$type)) throw new Error(`Unsupported type: ${path.join('.')}`);
      if (typeof node.$description !== 'string' || !node.$description.trim())
        throw new Error(`Missing description: ${path.join('.')}`);
      if (Object.keys(node).some((key) => !['$value', '$type', '$description'].includes(key)))
        throw new Error(`Unsupported token property: ${path.join('.')}`);
      tokens.set(path.join('.'), node);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) throw new Error(`Invalid token name: ${key}`);
      walk(value, [...path, key]);
    }
  };
  walk(source);
  const resolve = (name, seen = new Set()) => {
    if (seen.has(name)) throw new Error(`Token cycle: ${name}`);
    const token = tokens.get(name);
    if (!token) throw new Error(`Unknown token: ${name}`);
    const alias = typeof token.$value === 'string' && token.$value.match(/^\{([^{}]+)\}$/);
    if (alias) {
      const target = tokens.get(alias[1]);
      if (!target) throw new Error(`Unknown token: ${alias[1]}`);
      if (target.$type !== token.$type) throw new Error(`Alias type mismatch: ${name}`);
      return resolve(alias[1], new Set([...seen, name]));
    }
    return token.$value;
  };
  for (const [name, token] of tokens) {
    const v = resolve(name);
    let valid = false;
    switch (token.$type) {
      case 'color':
        valid =
          v?.colorSpace === 'srgb' &&
          v.components?.length === 3 &&
          v.components.every((x) => finite(x) && x >= 0 && x <= 1) &&
          finite(v.alpha) &&
          v.alpha >= 0 &&
          v.alpha <= 1;
        break;
      case 'dimension':
        valid = v?.unit === 'px' && finite(v.value) && v.value >= 0;
        break;
      case 'duration':
        valid = v?.unit === 'ms' && finite(v.value) && v.value >= 0;
        break;
      case 'number':
        valid = finite(v);
        break;
      case 'fontWeight':
        valid = finite(v) && v >= 1 && v <= 1000;
        break;
      case 'fontFamily':
        valid =
          (typeof v === 'string' && v.length > 0) ||
          (Array.isArray(v) &&
            v.length > 0 &&
            v.every((x) => typeof x === 'string' && x.length > 0));
        break;
      case 'cubicBezier':
        valid =
          Array.isArray(v) &&
          v.length === 4 &&
          v.every(finite) &&
          v[0] >= 0 &&
          v[0] <= 1 &&
          v[2] >= 0 &&
          v[2] <= 1;
        break;
    }
    if (!valid) throw new Error(`Invalid ${token.$type}: ${name}`);
  }
  if (!tokens.size) throw new Error('Empty token source');
  return tokens;
};

export const resolveTokens = async (source) => {
  validateTokens(source);
  const dictionary = new StyleDictionary({
    tokens: source,
    usesDtcg: true,
    log: { verbosity: 'silent' },
    platforms: { shared: { transforms: [] } },
  });
  const { allTokens } = await dictionary.getPlatformTokens('shared');
  return allTokens
    .filter((t) => t.path[0] !== 'palette')
    .sort((a, b) => a.path.join('.').localeCompare(b.path.join('.'), 'en'));
};

export const loadTokens = async (root) =>
  resolveTokens(JSON.parse(await readFile(`${root}/design-system/tokens.json`, 'utf8')));
