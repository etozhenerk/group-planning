import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ranks: Record<string, number> = {
  app: 6,
  pages: 5,
  widgets: 4,
  features: 3,
  entities: 2,
  shared: 1,
};

const sliced = new Set(['pages', 'widgets', 'features', 'entities']);

export const analyzeSource = (name: string, source: string): string[] => {
  const failures: string[] = [];
  const file = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const own = name
    .replaceAll('\\', '/')
    .replace(/^.*?src\//, '')
    .split('/');

  const fail = (message: string) => {
    failures.push(`${name}: ${message}`);
  };

  const inspectImport = (value: string) => {
    if (value.startsWith('.')) {
      fail('use an alias for internal imports');

      return;
    }

    if (!value.startsWith('@/')) {
      return;
    }

    const target = value.slice(2).split('/');
    const from = ranks[own[0] ?? ''];
    const to = ranks[target[0] ?? ''];

    if (from === undefined || to === undefined) {
      fail('unknown FSD layer');

      return;
    }

    const same =
      own[0] === target[0] && (!sliced.has(own[0] ?? '') || own[1] === target[1]);

    if (!same && to >= from) {
      fail('cross-slice or upward dependency');
    }

    if (!same && sliced.has(target[0] ?? '') && target.length !== 2) {
      fail('use the public API of a slice');
    }

    if (
      !same &&
      target[0] === 'shared' &&
      target.length !== 3 &&
      !(target.length === 2 && ['api', 'config'].includes(target[1] ?? ''))
    ) {
      fail('use the public API of a shared module');
    }

    if (same && sliced.has(target[0] ?? '') && target.length === 2) {
      fail('do not import your own public API');
    }
  };

  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      inspectImport(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const argument = node.arguments[0];

      if (argument && ts.isStringLiteral(argument)) {
        inspectImport(argument.text);
      }
    }

    if (ts.isExportDeclaration(node) && !node.exportClause) {
      fail('explicit exports required');
    }

    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      fail('any is forbidden');
    }

    if (ts.isAsExpression(node) && ts.isAsExpression(node.expression)) {
      fail('double assertions are forbidden');
    }

    ts.forEachChild(node, visit);
  };

  visit(file);

  if (/@ts-(ignore|nocheck)/.test(source)) {
    fail('type-check suppressions are forbidden');
  }

  if (name.endsWith('.tsx')) {
    const components: string[] = [];

    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement)) {
        continue;
      }

      if (
        ts.isVariableStatement(statement) &&
        (statement.declarationList.flags & ts.NodeFlags.Const) !== 0 &&
        statement.declarationList.declarations.length === 1
      ) {
        const declaration = statement.declarationList.declarations[0];

        if (
          declaration &&
          ts.isIdentifier(declaration.name) &&
          /^[A-Z]/.test(declaration.name.text) &&
          declaration.initializer &&
          ts.isArrowFunction(declaration.initializer)
        ) {
          components.push(declaration.name.text);
          continue;
        }
      }

      if (ts.isTypeAliasDeclaration(statement) && /Props$/.test(statement.name.text)) {
        continue;
      }

      fail(
        'component files contain only imports, one const arrow component and its Props',
      );
    }

    const expected = components[0];

    if (expected) {
      if (path.basename(name, '.tsx') !== expected) {
        fail('file and component names must match');
      }

      for (const statement of file.statements) {
        if (
          ts.isTypeAliasDeclaration(statement) &&
          statement.name.text !== `${expected}Props`
        ) {
          fail('only the component own Props type is allowed');
        }
      }
    }

    if (components.length !== 1) {
      fail('exactly one component required');
    }

    const meaningful = source
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('//')).length;

    if (meaningful > 100) {
      fail(`component exceeds 100 content lines (${meaningful})`);
    }
  }

  if (source.split('\n').length > 230) {
    fail('module exceeds 230 lines; split by responsibility');
  }

  return failures;
};

const files = (directory: string): string[] => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    if (
      ['node_modules', 'dist', 'test-results', 'playwright-report'].includes(item.name)
    ) {
      return [];
    }

    const name = path.join(directory, item.name);

    return item.isDirectory() ? files(name) : [name];
  });
};

export const checkProject = (directory: string): string[] => {
  const failures: string[] = [];

  for (const file of files(directory)) {
    if (/\.(js|jsx|mjs|cjs)$/.test(file)) {
      failures.push(`${file}: authored JavaScript is forbidden`);
    }

    if (/\.(ts|tsx)$/.test(file)) {
      const source = fs.readFileSync(file, 'utf8');

      if (file.includes(`${path.sep}src${path.sep}`)) {
        failures.push(...analyzeSource(file, source));
      } else {
        const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);

        for (const statement of parsed.statements) {
          if (
            (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
            statement.moduleSpecifier &&
            ts.isStringLiteral(statement.moduleSpecifier) &&
            statement.moduleSpecifier.text.startsWith('.')
          ) {
            failures.push(`${file}: use aliases`);
          }
        }
      }
    }
  }

  return failures;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const failures = checkProject(root);

  if (failures.length) {
    process.stderr.write(`${failures.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      'FSD, public API, aliases, TypeScript-only and component boundaries: OK\n',
    );
  }
}
