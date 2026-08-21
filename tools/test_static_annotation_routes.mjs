import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

const detailClientSource = readFileSync('src/app/annotation/audit/detail/ClientPage.js', 'utf8');
assert.match(
  detailClientSource,
  /const instanceId = searchParams\.get\('id'\) \|\| '19884';/,
  '审核详情必须为 id 提供 19884 默认值',
);

const workbenchClientSource = readFileSync('src/app/annotation/audit/workbench/ClientPage.js', 'utf8');
assert.match(
  workbenchClientSource,
  /const instanceId = searchParams\.get\('id'\) \|\| '19884';/,
  '审核工作台必须为 id 提供 19884 默认值',
);
assert.match(
  workbenchClientSource,
  /const episodeId = searchParams\.get\('episodeId'\) \|\| '744108';/,
  '审核工作台必须为 episodeId 提供 744108 默认值',
);

const editorClientSource = readFileSync('src/app/annotation/editor/ClientPage.js', 'utf8');
assert.match(
  editorClientSource,
  /const type = searchParams\.get\('type'\) \|\| 'range';/,
  '标注编辑器必须为 type 提供 range 默认值',
);

for (const [pagePath, source] of [
  ['src/app/annotation/audit/detail/ClientPage.js', detailClientSource],
  ['src/app/annotation/audit/workbench/ClientPage.js', workbenchClientSource],
  ['src/app/annotation/editor/ClientPage.js', editorClientSource],
]) {
  assert.doesNotMatch(source, /\buseParams\b/, `${pagePath} 不得保留 useParams import 或调用`);
  assert.equal(
    (source.match(/const searchParams = useSearchParams\(\);/g) || []).length,
    1,
    `${pagePath} 必须且只能声明一个 searchParams`,
  );
}

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
