import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import babelParser from 'next/dist/compiled/babel/parser.js';
import path from 'node:path';

const fixedPages = [
  'src/app/collection/collect/detail/page.js',
  'src/app/collection/collect/connection/page.js',
  'src/app/collection/collect/data/page.js',
  'src/app/collection/collect/status/page.js',
  'src/app/collection/collect/video/page.js',
  'src/app/collection/collect/workspace/page.js',
];

const clientPages = fixedPages.map((pagePath) => pagePath.replace('/page.js', '/ClientPage.js'));
const oldBracketPages = [
  'src/app/collection/collect/detail/[taskId]/page.js',
  'src/app/collection/collect/connection/[taskId]/page.js',
  'src/app/collection/collect/data/[taskId]/page.js',
  'src/app/collection/collect/status/[taskId]/page.js',
  'src/app/collection/collect/video/[taskId]/[episodeId]/page.js',
  'src/app/collection/collect/workspace/[taskId]/page.js',
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
  assert.equal(readFileSync(pagePath, 'utf8').trim(), canonicalWrapperSource, `${pagePath} 必须使用标准 StaticRouteBoundary 包裹`);
}

for (const pagePath of clientPages) {
  assert.ok(existsSync(pagePath), `客户端页面必须存在：${pagePath}`);
  assert.match(readFileSync(pagePath, 'utf8'), /^['\"]use client['\"];/, `${pagePath} 必须是 Client Component`);
}

for (const pagePath of oldBracketPages) {
  assert.ok(!existsSync(pagePath), `旧动态路由页面不得保留：${pagePath}`);
}

function walk(node, visitor, parent = null) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visitor, parent);
    return;
  }
  if (typeof node.type === 'string') visitor(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (!['loc', 'start', 'end', 'extra'].includes(key)) walk(value, visitor, node);
  }
}

function isStringLiteral(node, value) {
  return node?.type === 'StringLiteral' && node.value === value;
}

function hasSearchParamDefault(pageFunction, name, key, fallback) {
  return pageFunction.body.body
    .filter((node) => node.type === 'VariableDeclaration' && node.kind === 'const')
    .flatMap((node) => node.declarations)
    .some((node) => {
      if (node.id?.type !== 'Identifier' || node.id.name !== name) return false;
    const init = node.init;
    if (
      init?.type === 'LogicalExpression'
      && init.operator === '||'
      && init.left?.type === 'CallExpression'
      && init.left.callee?.type === 'MemberExpression'
      && init.left.callee.object?.type === 'Identifier'
      && init.left.callee.object.name === 'searchParams'
      && init.left.callee.property?.type === 'Identifier'
      && init.left.callee.property.name === 'get'
      && isStringLiteral(init.left.arguments[0], key)
      && isStringLiteral(init.right, fallback)
    ) return true;
      return false;
    });
}

function checkClientContract(pagePath, defaults) {
  const source = readFileSync(pagePath, 'utf8');
  const ast = babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const pageFunction = ast.program.body.find((node) => node.type === 'ExportDefaultDeclaration')?.declaration;
  assert.equal(pageFunction?.type, 'FunctionDeclaration', `${pagePath} 必须默认导出页面 FunctionDeclaration`);
  let useParamsFound = false;
  let searchParamsBindings = 0;
  let hasTopLevelSearchParams = false;
  walk(ast, (node, parent) => {
    if (node.type === 'Identifier' && node.name === 'useParams') useParamsFound = true;
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === 'searchParams') {
      searchParamsBindings += 1;
      hasTopLevelSearchParams ||= (
        parent?.type === 'VariableDeclaration'
        && parent.kind === 'const'
        && node.init?.type === 'CallExpression'
        && node.init.callee?.type === 'Identifier'
        && node.init.callee.name === 'useSearchParams'
        && node.init.arguments.length === 0
      );
    }
  });
  assert.equal(useParamsFound, false, `${pagePath} 不得保留 useParams`);
  assert.equal(searchParamsBindings, 1, `${pagePath} 必须只有一个 searchParams 绑定`);
  assert.ok(hasTopLevelSearchParams, `${pagePath} 必须以 const searchParams = useSearchParams() 读取参数`);
  for (const requirement of defaults) {
    assert.ok(
      hasSearchParamDefault(pageFunction, requirement.name, requirement.key, requirement.fallback),
      `${pagePath} 必须读取 ${requirement.name} 的默认值 ${requirement.fallback}`,
    );
  }
}

for (const pagePath of clientPages) {
  checkClientContract(pagePath, [{ name: 'taskId', key: 'taskId', fallback: pagePath.includes('/data/') ? 'CT-20250301002' : 'CT-20250301001' }]);
}
checkClientContract('src/app/collection/collect/video/ClientPage.js', [
  { name: 'taskId', key: 'taskId', fallback: 'CT-20250301001' },
  { name: 'episodeId', key: 'episodeId', fallback: 'session_028' },
]);

function collectJsSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJsSources(entryPath);
    return entry.name.endsWith('.js') ? [readFileSync(entryPath, 'utf8')] : [];
  });
}

const captureSource = collectJsSources('src/app/collection/collect').join('\n');
assert.doesNotMatch(captureSource, /\/collection\/collect\/(detail|connection|data|status|video|workspace)\/\$\{/, '采集导航不得保留动态路径模板');

function hasStaticRouteNavigation(pagePath, routeName, parameterKeys) {
  const source = readFileSync(pagePath, 'utf8');
  const ast = babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  let found = false;
  walk(ast, (node) => {
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'Identifier'
      && node.callee.name === 'buildStaticHref'
      && node.arguments[0]?.type === 'MemberExpression'
      && node.arguments[0].object?.type === 'Identifier'
      && node.arguments[0].object.name === 'STATIC_ROUTES'
      && node.arguments[0].property?.type === 'Identifier'
      && node.arguments[0].property.name === routeName
      && node.arguments[1]?.type === 'ObjectExpression'
      && parameterKeys.every((key) => node.arguments[1].properties.some((property) => (
        property.type === 'ObjectProperty'
        && property.key?.type === 'Identifier'
        && property.key.name === key
      )))
    ) found = true;
  });
  return found;
}

const routeExpectations = [
  ['src/app/collection/collect/page.js', 'collectDetail', ['taskId']],
  ['src/app/collection/collect/page.js', 'collectWorkspace', ['taskId']],
  ['src/app/collection/collect/detail/ClientPage.js', 'collectVideo', ['taskId', 'episodeId']],
  ['src/app/collection/collect/detail/ClientPage.js', 'collectData', ['taskId']],
  ['src/app/collection/collect/detail/ClientPage.js', 'collectConnection', ['taskId']],
  ['src/app/collection/collect/detail/ClientPage.js', 'qaDetail', ['id']],
  ['src/app/collection/collect/connection/ClientPage.js', 'collectWorkspace', ['taskId']],
  ['src/app/collection/collect/status/ClientPage.js', 'collectConnection', ['taskId']],
  ['src/app/collection/collect/status/ClientPage.js', 'collectWorkspace', ['taskId']],
  ['src/app/collection/collect/video/ClientPage.js', 'collectData', ['taskId']],
];

for (const [pagePath, routeName, parameterKeys] of routeExpectations) {
  assert.ok(
    hasStaticRouteNavigation(pagePath, routeName, parameterKeys),
    `${pagePath} 必须以要求的查询参数调用 buildStaticHref(STATIC_ROUTES.${routeName}, ...)`,
  );
}

console.log('STATIC_COLLECT_ROUTES_OK');
