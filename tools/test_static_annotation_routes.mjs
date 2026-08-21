import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import babelParser from 'next/dist/compiled/babel/parser.js';
import path from 'node:path';

const fixedPages = [
  'src/app/annotation/audit/detail/page.js',
  'src/app/annotation/audit/workbench/page.js',
  'src/app/annotation/editor/page.js',
  'src/app/annotation/review-list/page.js',
  'src/app/annotation/workbench-solutions/page.js',
];

const clientPages = [
  'src/app/annotation/audit/detail/ClientPage.js',
  'src/app/annotation/audit/workbench/ClientPage.js',
  'src/app/annotation/editor/ClientPage.js',
  'src/app/annotation/review-list/ClientPage.js',
  'src/app/annotation/workbench-solutions/ClientPage.js',
];

const oldBracketPages = [
  'src/app/annotation/audit/[id]/page.js',
  'src/app/annotation/audit/[id]/[episodeId]/page.js',
  'src/app/annotation/editor/[type]/page.js',
];

const canonicalWrapperSource = `import StaticRouteBoundary from '@/components/StaticRouteBoundary';
import ClientPage from './ClientPage';

export default function Page() {
  return (
    <StaticRouteBoundary>
      <ClientPage />
    </StaticRouteBoundary>
  );
}`;

for (const pagePath of fixedPages) {
  assert.ok(existsSync(pagePath), `固定路由页面必须存在：${pagePath}`);
  assert.equal(
    readFileSync(pagePath, 'utf8').trim(),
    canonicalWrapperSource,
    `${pagePath} 必须使用完整的 StaticRouteBoundary → ClientPage 包裹契约`,
  );
}

for (const pagePath of clientPages) {
  assert.ok(existsSync(pagePath), `客户端页面必须存在：${pagePath}`);
  assert.match(readFileSync(pagePath, 'utf8'), /^['\"]use client['\"];/, `${pagePath} 必须是 Client Component`);
}

function walk(node, visitor, parent = null) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visitor, parent);
    return;
  }
  if (typeof node.type === 'string') visitor(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (key !== 'loc' && key !== 'start' && key !== 'end' && key !== 'extra') {
      walk(value, visitor, node);
    }
  }
}

function isStringLiteral(node, value) {
  return node?.type === 'StringLiteral' && node.value === value;
}

function isSearchParamDefault(initializer, key, fallback) {
  if (initializer?.type !== 'LogicalExpression' || initializer.operator !== '||') return false;
  const getCall = initializer.left;
  return (
    getCall?.type === 'CallExpression'
    && getCall.callee?.type === 'MemberExpression'
    && !getCall.callee.computed
    && getCall.callee.object?.type === 'Identifier'
    && getCall.callee.object.name === 'searchParams'
    && getCall.callee.property?.type === 'Identifier'
    && getCall.callee.property.name === 'get'
    && getCall.arguments.length === 1
    && isStringLiteral(getCall.arguments[0], key)
    && isStringLiteral(initializer.right, fallback)
  );
}

function checkClientRouteContract(source, defaults) {
  const ast = babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const defaultExports = ast.program.body.filter((node) => node.type === 'ExportDefaultDeclaration');
  const pageFunction = defaultExports.length === 1 ? defaultExports[0].declaration : null;
  const hasDefaultPageFunction = pageFunction?.type === 'FunctionDeclaration';
  const pageDeclarations = hasDefaultPageFunction
    ? pageFunction.body.body
      .filter((node) => node.type === 'VariableDeclaration')
      .flatMap((declaration) => declaration.declarations.map((node) => ({ node, kind: declaration.kind })))
    : [];
  const allSearchParamsBindings = [];
  let hasUseParamsIdentifier = false;

  walk(ast, (node) => {
    if (node.type === 'VariableDeclarator') {
      if (node.id?.type === 'Identifier' && node.id.name === 'searchParams') allSearchParamsBindings.push(node);
    }
    if (node.type === 'Identifier' && node.name === 'useParams') hasUseParamsIdentifier = true;
  });

  const [searchParamsBinding] = allSearchParamsBindings;
  const hasTopLevelSearchParamsBinding = (
    allSearchParamsBindings.length === 1
    && pageDeclarations.some(({ node, kind }) => (
      node === searchParamsBinding
      && kind === 'const'
      && node.init?.type === 'CallExpression'
      && node.init.callee?.type === 'Identifier'
      && node.init.callee.name === 'useSearchParams'
      && node.init.arguments.length === 0
    ))
  );

  return {
    hasDefaultPageFunction,
    hasRequiredDefaults: defaults.every(({ name, key, fallback }) => pageDeclarations.some(({ node, kind }) => (
      kind === 'const'
      && node.id?.type === 'Identifier'
      && node.id.name === name
      && isSearchParamDefault(node.init, key, fallback)
    ))),
    hasOneSearchParamsBinding: allSearchParamsBindings.length === 1,
    hasTopLevelSearchParamsBinding,
    hasNoUseParams: !hasUseParamsIdentifier,
  };
}

function assertClientRouteContract(pagePath, source, defaults) {
  const contract = checkClientRouteContract(source, defaults);
  assert.ok(contract.hasDefaultPageFunction, `${pagePath} 必须只默认导出一个页面 FunctionDeclaration`);
  assert.ok(contract.hasRequiredDefaults, `${pagePath} 必须以完整 const 声明读取要求的默认 URL 参数`);
  assert.ok(contract.hasOneSearchParamsBinding, `${pagePath} 的全 AST 只能有一个 searchParams 绑定`);
  assert.ok(contract.hasTopLevelSearchParamsBinding, `${pagePath} 的唯一 searchParams 必须是页面顶层 const searchParams = useSearchParams()`);
  assert.ok(contract.hasNoUseParams, `${pagePath} 不得保留真实 useParams import、调用或标识符`);
}

const detailClientSource = readFileSync('src/app/annotation/audit/detail/ClientPage.js', 'utf8');
const workbenchClientSource = readFileSync('src/app/annotation/audit/workbench/ClientPage.js', 'utf8');
const editorClientSource = readFileSync('src/app/annotation/editor/ClientPage.js', 'utf8');
const detailDefaults = [{ name: 'instanceId', key: 'id', fallback: '19884' }];
const workbenchDefaults = [
  { name: 'instanceId', key: 'id', fallback: '19884' },
  { name: 'episodeId', key: 'episodeId', fallback: '744108' },
];
const editorDefaults = [{ name: 'type', key: 'type', fallback: 'range' }];

assertClientRouteContract('src/app/annotation/audit/detail/ClientPage.js', detailClientSource, detailDefaults);
assertClientRouteContract('src/app/annotation/audit/workbench/ClientPage.js', workbenchClientSource, workbenchDefaults);
assertClientRouteContract('src/app/annotation/editor/ClientPage.js', editorClientSource, editorDefaults);

const incorrectDefaultWithComment = `${detailClientSource.replace(
  "const instanceId = searchParams.get('id') || '19884';",
  "const instanceId = searchParams.get('id') || 'wrong-default';",
)}\n// const instanceId = searchParams.get('id') || '19884';`;
assert.equal(
  checkClientRouteContract(incorrectDefaultWithComment, detailDefaults).hasRequiredDefaults,
  false,
  '真实默认值改错后，注释中的 canonical 声明不得通过',
);

const renamedBindingWithComment = `${workbenchClientSource.replace(
  "const episodeId = searchParams.get('episodeId') || '744108';",
  "const currentEpisodeId = searchParams.get('episodeId') || '744108';",
)}\n// const episodeId = searchParams.get('episodeId') || '744108';`;
assert.equal(
  checkClientRouteContract(renamedBindingWithComment, workbenchDefaults).hasRequiredDefaults,
  false,
  '真实绑定改名后，注释中的 canonical 声明不得通过',
);

assert.deepEqual(
  checkClientRouteContract(`${editorClientSource}\n// migrated away from useParams`, editorDefaults),
  checkClientRouteContract(editorClientSource, editorDefaults),
  '仅添加 useParams 文本注释不得改变 AST 路由契约',
);

assert.equal(
  checkClientRouteContract(`${detailClientSource}\nfunction bait() { const searchParams = getOtherParams(); }`, detailDefaults)
    .hasOneSearchParamsBinding,
  false,
  '未使用函数中的 searchParams 绑定不得绕过全 AST 唯一性契约',
);

const nestedCanonicalDefaultBait = `${detailClientSource.replace(
  "const instanceId = searchParams.get('id') || '19884';",
  "const instanceId = searchParams.get('id') || 'wrong-default';",
)}\nfunction bait() { const instanceId = searchParams.get('id') || '19884'; }`;
assert.equal(
  checkClientRouteContract(nestedCanonicalDefaultBait, detailDefaults).hasRequiredDefaults,
  false,
  '页面真实默认值改错后，嵌套函数中的 canonical 默认声明不得通过',
);

function normalizeSource(source) {
  return source.replace(/\s+/g, ' ').trim();
}

function findJsxAttributeExpressions(source, attributeName) {
  const isIdentifierChar = (char) => /[\w$]/.test(char || '');
  const expressions = [];

  function skipQuotedLiteral(index) {
    const quote = source[index];
    index += 1;
    while (index < source.length) {
      if (source[index] === '\\') {
        index += 2;
      } else if (source[index] === quote) {
        return index + 1;
      } else {
        index += 1;
      }
    }
    return index;
  }

  function skipComment(index) {
    if (source[index + 1] === '/') {
      const lineEnd = source.indexOf('\n', index + 2);
      return lineEnd === -1 ? source.length : lineEnd + 1;
    }
    const blockEnd = source.indexOf('*/', index + 2);
    return blockEnd === -1 ? source.length : blockEnd + 2;
  }

  function readBracedExpression(index) {
    const start = index + 1;
    let depth = 1;
    index = start;
    while (index < source.length && depth > 0) {
      if (source[index] === '/' && (source[index + 1] === '/' || source[index + 1] === '*')) {
        index = skipComment(index);
      } else if (source[index] === '\'' || source[index] === '"' || source[index] === '`') {
        index = skipQuotedLiteral(index);
      } else if (source[index] === '{') {
        depth += 1;
        index += 1;
      } else if (source[index] === '}') {
        depth -= 1;
        index += 1;
      } else {
        index += 1;
      }
    }
    return { expression: source.slice(start, index - 1), nextIndex: index };
  }

  for (let index = 0; index < source.length;) {
    if (source[index] === '/' && (source[index + 1] === '/' || source[index + 1] === '*')) {
      index = skipComment(index);
      continue;
    }
    if (source[index] === '\'' || source[index] === '"' || source[index] === '`') {
      index = skipQuotedLiteral(index);
      continue;
    }
    if (
      source.startsWith(attributeName, index)
      && !isIdentifierChar(source[index - 1])
      && !isIdentifierChar(source[index + attributeName.length])
    ) {
      let valueStart = index + attributeName.length;
      while (/\s/.test(source[valueStart] || '')) valueStart += 1;
      if (source[valueStart] === '=') {
        valueStart += 1;
        while (/\s/.test(source[valueStart] || '')) valueStart += 1;
        if (source[valueStart] === '{') {
          const { expression, nextIndex } = readBracedExpression(valueStart);
          expressions.push(expression);
          index = nextIndex;
          continue;
        }
      }
    }
    index += 1;
  }

  return expressions;
}

const qaDetailSource = readFileSync('src/app/collection/qa/[instanceId]/page.js', 'utf8');
const canonicalQaAuditHandler = normalizeSource(`
  () => router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
    id: instanceId,
    episodeId: r.id,
    type: r.annoType,
    mode: 'audit',
  }))
`);
const hasCanonicalQaAuditNavigation = (source) => findJsxAttributeExpressions(source, 'onClick')
  .some((expression) => normalizeSource(expression) === canonicalQaAuditHandler);

assert.ok(
  hasCanonicalQaAuditNavigation(qaDetailSource),
  'QA 到审核工作台必须在 onClick 中以完整参数调用 buildStaticHref(STATIC_ROUTES.auditWorkbench, ...)',
);
assert.doesNotMatch(
  qaDetailSource,
  /`\/annotation\/audit\/\$\{/,
  'QA 到审核工作台不得保留旧动态 URL 模板',
);

const qaAuditHandler = findJsxAttributeExpressions(qaDetailSource, 'onClick')
  .find((expression) => normalizeSource(expression) === canonicalQaAuditHandler);
const mutatedQaSource = qaDetailSource.replace(
  qaAuditHandler,
  "() => router.push('/annotation/review-list')",
);
assert.ok(!hasCanonicalQaAuditNavigation(mutatedQaSource), '变异后的无关跳转不得通过 QA 路由契约');
assert.ok(
  !hasCanonicalQaAuditNavigation(`${mutatedQaSource}\nconst unusedAuditHandler = ${canonicalQaAuditHandler};\n/* onClick={${canonicalQaAuditHandler}} */`),
  '未使用 helper 或注释中的诱饵导航不得通过 QA 路由契约',
);

for (const pagePath of oldBracketPages) {
  assert.ok(!existsSync(pagePath), `旧动态路由页面不得保留：${pagePath}`);
}

function readAnnotationSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readAnnotationSources(entryPath);
    return entry.name.endsWith('.js') ? [readFileSync(entryPath, 'utf8')] : [];
  });
}

const annotationSource = readAnnotationSources('src/app/annotation').join('\n');
const forbidden = [
  /`\/annotation\/audit\/\$\{/,
  /`\/annotation\/audit\/\$\{[^}]+\}\/\$\{/,
  /\/annotation\/editor\/\$\{/,
];

for (const pattern of forbidden) {
  assert.doesNotMatch(annotationSource, pattern, `标注导航不得保留动态路径模板：${pattern}`);
}

console.log('STATIC_ANNOTATION_ROUTES_OK');
