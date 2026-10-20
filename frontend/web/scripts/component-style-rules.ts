import fs from 'node:fs';
import postcss from 'postcss';
import ts from 'typescript';

export const checkGlobalStyles = (file: string, source: string): string[] => {
  const failures: string[] = [];
  const vendorReset = new Set(['g-button', 'g-text-input__control']);
  postcss.parse(source, { from: file }).walkRules((rule) => {
    if (
      [...rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].some(
        (match) => !vendorReset.has(match[1] ?? ''),
      )
    ) {
      failures.push(`${file}: global styles cannot contain component classes`);
    }
  });

  return failures;
};

export const checkStyleReferences = (
  source: ts.SourceFile,
  stylesheet: string,
): string[] => {
  const names = new Set<string>();
  const failures: string[] = [];

  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.endsWith('.module.css') &&
      statement.importClause?.name
    ) {
      names.add(statement.importClause.name.text);
    }
  }

  if (names.size === 0) {
    return [];
  }

  if (!fs.existsSync(stylesheet)) {
    return [`${source.fileName}: own CSS Module does not exist`];
  }

  const classes = new Set<string>();
  postcss.parse(fs.readFileSync(stylesheet, 'utf8')).walkRules((rule) => {
    const local = rule.selector.replace(/:global\([^)]+\)/g, '');

    for (const match of local.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
      if (match[1]) {
        classes.add(match[1]);
      }
    }
  });

  const visit = (node: ts.Node) => {
    let property: string | undefined;
    let owner: ts.Expression | undefined;

    if (ts.isPropertyAccessExpression(node)) {
      owner = node.expression;
      property = node.name.text;
    } else if (
      ts.isElementAccessExpression(node) &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      owner = node.expression;
      property = node.argumentExpression.text;
    }

    if (
      owner &&
      ts.isIdentifier(owner) &&
      names.has(owner.text) &&
      property &&
      !classes.has(property)
    ) {
      failures.push(`${source.fileName}: CSS Module has no local class ${property}`);
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  return failures;
};
