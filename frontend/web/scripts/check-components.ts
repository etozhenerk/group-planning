import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import ts from 'typescript';
import { checkGlobalStyles, checkStyleReferences } from '@tools/component-style-rules';

const globalStyles = new Set([
  'app/styles/base.css',
  'app/styles/tokens.css',
  'app/styles/design-tokens.css',
]);

const privateDirectories = new Set(['hooks', 'lib', 'utils']);

const walk = (directory: string): string[] => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);

    return entry.isDirectory() ? walk(name) : [name];
  });
};

const checkBarrel = (file: string, alias: string, component: string): string[] => {
  const failures: string[] = [];

  if (!fs.existsSync(file)) {
    return [`${file}: component index.ts is required`];
  }

  const parsed = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  let exportsComponent = false;

  for (const statement of parsed.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== alias ||
      !statement.exportClause ||
      !ts.isNamedExports(statement.exportClause)
    ) {
      failures.push(`${file}: index.ts only re-exports its own component and Props`);
      continue;
    }

    for (const item of statement.exportClause.elements) {
      if (
        item.propertyName ||
        ![component, `${component}Props`].includes(item.name.text)
      ) {
        failures.push(`${file}: unexpected component export`);
      }

      if (item.name.text === component && !statement.isTypeOnly && !item.isTypeOnly) {
        exportsComponent = true;
      }
    }
  }

  if (!exportsComponent) {
    failures.push(`${file}: component re-export is required`);
  }

  return failures;
};

export const checkComponentStyles = (file: string, source: string): string[] => {
  const failures: string[] = [];
  const root = postcss.parse(source, { from: file });

  root.walkAtRules('import', () => {
    failures.push(`${file}: component styles cannot import another stylesheet`);
  });

  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) {
      return;
    }

    for (const selector of rule.selectors) {
      const globalReferences = [...selector.matchAll(/:global\(([^)]+)\)/g)];

      if (
        globalReferences.some((reference) => !/^\.g-[\w-]+$/.test(reference[1] ?? ''))
      ) {
        failures.push(`${file}: :global is limited to Gravity UI classes`);
      }

      const local = selector.replace(/:global\([^)]+\)/g, '');

      if (!/\.[A-Za-z_][\w-]*/.test(local)) {
        failures.push(`${file}: every selector must be scoped to a local class`);
      }
    }
  });

  return failures;
};

export const checkComponentDirectories = (sourceRoot: string): string[] => {
  const failures: string[] = [];

  for (const file of walk(sourceRoot)) {
    const relative = path.relative(sourceRoot, file).split(path.sep).join('/');

    if (file.endsWith('.css')) {
      if (globalStyles.has(relative)) {
        failures.push(...checkGlobalStyles(file, fs.readFileSync(file, 'utf8')));
        continue;
      }

      const directory = path.dirname(file);
      const component = path.basename(directory);

      if (
        path.basename(file) !== `${component}.module.css` ||
        !fs.existsSync(path.join(directory, `${component}.tsx`))
      ) {
        failures.push(`${file}: stylesheet must share its component directory and name`);
      }

      failures.push(...checkComponentStyles(file, fs.readFileSync(file, 'utf8')));
    }

    if (!file.endsWith('.tsx')) {
      continue;
    }

    const directory = path.dirname(file);
    const component = path.basename(file, '.tsx');

    if (path.basename(directory) !== component) {
      failures.push(`${file}: directory and component names must match`);
    }

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const allowed = entry.isDirectory()
        ? privateDirectories.has(entry.name)
        : [component + '.tsx', component + '.module.css', 'index.ts'].includes(
            entry.name,
          );

      if (!allowed) {
        failures.push(
          `${directory}/${entry.name}: only the component, its styles, index.ts and private hooks/lib/utils are allowed`,
        );
      }
    }

    const alias = '@/' + relative.replace(/\.tsx$/, '');
    failures.push(...checkBarrel(path.join(directory, 'index.ts'), alias, component));
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    const visit = (node: ts.Node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.endsWith('.css')
      ) {
        if (node.moduleSpecifier.text !== alias + '.module.css') {
          failures.push(`${file}: import only this component's CSS Module`);
        }
      }

      if (
        ts.isJsxAttribute(node) &&
        ['className', 'popupClassName', 'rootClassName'].includes(
          node.name.getText(source),
        ) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        failures.push(
          `${file}: use CSS Module classes instead of literal global class names`,
        );
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
    failures.push(
      ...checkStyleReferences(source, path.join(directory, `${component}.module.css`)),
    );
  }

  return failures;
};
