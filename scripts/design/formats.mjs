export const camel = (path) =>
  path.map((p, i) => (i ? p[0].toUpperCase() + p.slice(1) : p)).join('');
const kebab = (path) => path.join('-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const channel = (x) =>
  Math.round(x * 255)
    .toString(16)
    .padStart(2, '0');
export const hex = (v) =>
  '#' + [...v.components, ...(v.alpha === 1 ? [] : [v.alpha])].map(channel).join('');
export const cssValue = (t) => {
  const v = t.$value;
  if (t.$type === 'color') return hex(v);
  if (t.$type === 'dimension' || t.$type === 'duration') return `${v.value}${v.unit}`;
  if (t.$type === 'fontFamily')
    return (Array.isArray(v) ? v : [v])
      .map((x) => (x.includes(' ') ? JSON.stringify(x) : x))
      .join(', ');
  if (t.$type === 'cubicBezier') return `cubic-bezier(${v.join(', ')})`;
  return String(v);
};
const swiftValue = (t) => {
  const v = t.$value;
  if (t.$type === 'color')
    return `Color(.sRGB, red: ${v.components[0]}, green: ${v.components[1]}, blue: ${v.components[2]}, opacity: ${v.alpha})`;
  if (t.$type === 'dimension') return `CGFloat(${v.value})`;
  if (t.$type === 'duration') return String(v.value / 1000);
  if (t.$type === 'fontFamily')
    return JSON.stringify(Array.isArray(v) ? v.join(', ') : v);
  if (t.$type === 'cubicBezier') return `[${v.join(', ')}]`;
  return String(v);
};
const kotlinValue = (t) => {
  const v = t.$value;
  if (t.$type === 'color')
    return `Color(0x${channel(v.alpha)}${v.components.map(channel).join('')})`;
  if (t.$type === 'dimension')
    return `${v.value}.${t.path[0] === 'typography' ? 'sp' : 'dp'}`;
  if (t.$type === 'duration') return String(v.value);
  if (t.$type === 'fontFamily')
    return JSON.stringify(Array.isArray(v) ? v.join(', ') : v);
  if (t.$type === 'cubicBezier') return `listOf(${v.map((x) => `${x}f`).join(', ')})`;
  return `${v}f`;
};
const webRoutingBreakpoints = new Set(['breakpoint.mobile', 'breakpoint.tablet']);
const nativeToken = (token, platform) =>
  !webRoutingBreakpoints.has(token.path.join('.')) &&
  (token.$type !== 'fontFamily' || token.path.at(-1) === platform);
const chatComponent = (token) => token.path[0] === 'component' &&
  ['chatComposer', 'chatActionDialog', 'mobileChat', 'messageDelivery'].includes(token.path[1]);

export const renderTokens = (tokens, version) => {
  const header = `Generated from design-system/tokens.json · ${version}. Do not edit.`;
  const files = {
    'frontend/web/src/app/styles/design-tokens.css': `/* ${header} */\n\n:root {\n${tokens.map((t) => `  --ds-${kebab(t.path)}: ${cssValue(t)};`).join('\n')}\n}\n`,
    'frontend/web/src/shared/config/design-tokens/tokens.ts': `// ${header}\nimport { foundationTokens } from '@/shared/config/design-tokens/foundations';\nimport { componentTokens } from '@/shared/config/design-tokens/components';\nimport { chatComponentTokens } from '@/shared/config/design-tokens/chat-components';\n\nexport const designTokens = { ...foundationTokens, ...componentTokens, ...chatComponentTokens } as const;\n`,
    'frontend/web/src/shared/config/design-tokens/foundations.ts': `// ${header}\nexport const foundationTokens = {\n${tokens
      .filter((t) => t.path[0] !== 'component')
      .map((t) => `  ${camel(t.path)}: ${JSON.stringify(cssValue(t))},`)
      .join('\n')}\n} as const;\n`,
    'frontend/web/src/shared/config/design-tokens/components.ts': `// ${header}\nexport const componentTokens = {\n${tokens
      .filter((t) => t.path[0] === 'component' && !chatComponent(t))
      .map((t) => `  ${camel(t.path)}: ${JSON.stringify(cssValue(t))},`)
      .join('\n')}\n} as const;\n`,
    'frontend/web/src/shared/config/design-tokens/chat-components.ts': `// ${header}\nexport const chatComponentTokens = {\n${tokens
      .filter(chatComponent)
      .map((t) => `  ${camel(t.path)}: ${JSON.stringify(cssValue(t))},`)
      .join('\n')}\n} as const;\n`,
    'frontend/ios/Somewhere/UI/DesignTokens.swift': `// ${header}\nimport SwiftUI\n\nenum DesignTokens {\n${tokens
      .filter((t) => nativeToken(t, 'ios'))
      .map((t) => `    static let ${camel(t.path)} = ${swiftValue(t)}`)
      .join('\n')}\n}\n`,
    'frontend/android/app/src/main/java/dev/groupplanning/android/ui/theme/DesignTokens.kt': `// ${header}\npackage dev.groupplanning.android.ui.theme\n\nimport androidx.compose.ui.graphics.Color\nimport androidx.compose.ui.unit.dp\nimport androidx.compose.ui.unit.sp\n\ninternal object DesignTokens {\n${tokens
      .filter((t) => nativeToken(t, 'android'))
      .map((t) => `    val ${camel(t.path)} = ${kotlinValue(t)}`)
      .join('\n')}\n}\n`,
    'design-system/catalog.md': `# Токены somewhere · ${version}\n\nГенерируется из [tokens.json](tokens.json); ручные правки будут перезаписаны.\nВ коде используйте смысловые роли. px → CSS px / iOS pt / Android dp;\nтипографические размеры Android → sp. Длительность Swift → секунды.\n\n| Роль | Тип | Значение | Назначение |\n| --- | --- | --- | --- |\n${tokens.map((t) => `| ${t.path.join('.')} | ${t.$type} | ${cssValue(t)} | ${t.$description} |`).join('\n')}\n`,
  };
  const androidColors = {
    background: 'background',
    surface: 'surface',
    message: 'surface',
    accent: 'accent',
    border: 'borderStrong',
    foreground: 'text',
    muted: 'muted',
    action: 'action',
    action_text: 'actionText',
    error: 'error',
    own_message: 'ownMessage',
    selected_segment: 'selectedSegment',
    navigation: 'navigation',
  };
  const colorFor = (name) =>
    hex(tokens.find((t) => t.path.join('.') === `color.${name}`).$value);
  files['frontend/android/app/src/main/res/values/colors.xml'] =
    `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${header} -->\n<resources>\n${Object.entries(
      androidColors,
    )
      .map(([name, role]) => `    <color name="${name}">${colorFor(role)}</color>`)
      .join('\n')}\n</resources>\n`;
  return files;
};
