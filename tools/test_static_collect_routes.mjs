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

function collectPagePaths(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectPagePaths(entryPath);
    return entry.name === 'page.js' ? [entryPath.replaceAll('\\', '/')] : [];
  });
}

function assertNoBracketCapturePages(pagePaths) {
  for (const pagePath of pagePaths) {
    assert.ok(!pagePath.includes('['), `采集路由页面不得保留动态目录：${pagePath}`);
  }
}

assertNoBracketCapturePages(collectPagePaths('src/app/collection/collect'));
assert.throws(
  () => assertNoBracketCapturePages(['src/app/collection/collect/detail/[taskId]/page.js']),
  /不得保留动态目录/,
  '伪造的 bracket page 路径必须被递归路由检查拒绝',
);

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
  let episodeIdQueryReads = 0;
  let episodeIdQueryBindings = 0;
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
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'MemberExpression'
      && node.callee.object?.type === 'Identifier'
      && node.callee.object.name === 'searchParams'
      && node.callee.property?.type === 'Identifier'
      && node.callee.property.name === 'get'
      && isStringLiteral(node.arguments[0], 'episodeId')
    ) episodeIdQueryReads += 1;
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'Identifier'
      && node.id.name === 'episodeId'
      && node.init?.type === 'LogicalExpression'
      && node.init.operator === '||'
      && node.init.left?.type === 'CallExpression'
      && node.init.left.callee?.type === 'MemberExpression'
      && node.init.left.callee.object?.type === 'Identifier'
      && node.init.left.callee.object.name === 'searchParams'
      && node.init.left.callee.property?.type === 'Identifier'
      && node.init.left.callee.property.name === 'get'
      && isStringLiteral(node.init.left.arguments[0], 'episodeId')
    ) episodeIdQueryBindings += 1;
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
  if (pagePath.endsWith('/video/ClientPage.js')) {
    assert.equal(episodeIdQueryReads, 1, `${pagePath} 必须且只能读取一个 episodeId 查询参数`);
    assert.equal(episodeIdQueryBindings, 1, `${pagePath} 必须且只能声明一个 episodeId 查询参数绑定`);
  } else {
    assert.equal(episodeIdQueryReads, 0, `${pagePath} 不得读取 episodeId 查询参数`);
    assert.equal(episodeIdQueryBindings, 0, `${pagePath} 不得声明 episodeId 查询参数绑定`);
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

function isExpectedValue(node, expected) {
  if (expected.type === 'identifier') return node?.type === 'Identifier' && node.name === expected.name;
  return (
    node?.type === 'MemberExpression'
    && !node.computed
    && node.object?.type === 'Identifier'
    && node.object.name === expected.object
    && node.property?.type === 'Identifier'
    && node.property.name === expected.property
  );
}

function hasExactParams(node, expectedParams) {
  if (node?.type !== 'ObjectExpression' || node.properties.length !== expectedParams.length) return false;
  return expectedParams.every(({ key, value }) => node.properties.some((property) => (
    property.type === 'ObjectProperty'
    && property.key?.type === 'Identifier'
    && property.key.name === key
    && isExpectedValue(property.value, value)
  )));
}

function isStaticRouteCall(node, routeName, expectedParams) {
  return (
    node?.type === 'CallExpression'
    && node.callee?.type === 'Identifier'
    && node.callee.name === 'buildStaticHref'
    && node.arguments[0]?.type === 'MemberExpression'
    && node.arguments[0].object?.type === 'Identifier'
    && node.arguments[0].object.name === 'STATIC_ROUTES'
    && node.arguments[0].property?.type === 'Identifier'
    && node.arguments[0].property.name === routeName
    && hasExactParams(node.arguments[1], expectedParams)
  );
}

function isNavigationSink(node, parent) {
  if (parent?.type === 'CallExpression' && parent.arguments[0] === node) {
    const callee = parent.callee;
    return (
      callee?.type === 'MemberExpression'
      && !callee.computed
      && ((callee.object?.type === 'Identifier' && callee.object.name === 'router' && callee.property?.name === 'push')
        || (callee.object?.type === 'Identifier' && callee.object.name === 'window' && callee.property?.name === 'open'))
    );
  }
  return (
    parent?.type === 'ObjectProperty'
    && parent.value === node
    && parent.key?.type === 'Identifier'
    && parent.key.name === 'href'
  );
}

function hasStaticRouteNavigation(source, routeName, expectedParams) {
  const ast = babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  let found = false;
  walk(ast, (node, parent) => {
    if (isStaticRouteCall(node, routeName, expectedParams) && isNavigationSink(node, parent)) found = true;
  });
  return found;
}

const routeExpectations = [
  ['src/app/collection/collect/page.js', 'collectDetail', [{ key: 'taskId', value: { type: 'member', object: 'record', property: 'taskId' } }]],
  ['src/app/collection/collect/page.js', 'collectWorkspace', [{ key: 'taskId', value: { type: 'member', object: 'record', property: 'taskId' } }]],
  ['src/app/collection/collect/detail/ClientPage.js', 'collectVideo', [
    { key: 'taskId', value: { type: 'identifier', name: 'taskId' } },
    { key: 'episodeId', value: { type: 'identifier', name: 'epId' } },
  ]],
  ['src/app/collection/collect/detail/ClientPage.js', 'collectData', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
  ['src/app/collection/collect/detail/ClientPage.js', 'collectConnection', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
  ['src/app/collection/collect/detail/ClientPage.js', 'qaDetail', [{ key: 'id', value: { type: 'identifier', name: 'text' } }]],
  ['src/app/collection/collect/detail/ClientPage.js', 'qaDetail', [{ key: 'id', value: { type: 'member', object: 'record', property: 'qaBatch' } }]],
  ['src/app/collection/collect/connection/ClientPage.js', 'collectWorkspace', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
  ['src/app/collection/collect/status/ClientPage.js', 'collectConnection', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
  ['src/app/collection/collect/status/ClientPage.js', 'collectWorkspace', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
  ['src/app/collection/collect/video/ClientPage.js', 'collectDetail', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
  ['src/app/collection/collect/video/ClientPage.js', 'collectData', [{ key: 'taskId', value: { type: 'identifier', name: 'taskId' } }]],
];

for (const [pagePath, routeName, expectedParams] of routeExpectations) {
  const source = readFileSync(pagePath, 'utf8');
  assert.ok(
    hasStaticRouteNavigation(source, routeName, expectedParams),
    `${pagePath} 必须以要求的查询参数调用 buildStaticHref(STATIC_ROUTES.${routeName}, ...)`,
  );
}

const listSource = readFileSync('src/app/collection/collect/page.js', 'utf8');
const extraEpisodeIdMutation = listSource.replace(
  'buildStaticHref(STATIC_ROUTES.collectDetail, { taskId: record.taskId })',
  'buildStaticHref(STATIC_ROUTES.collectDetail, { taskId: record.taskId, episodeId: \'bait\' })',
);
assert.equal(
  hasStaticRouteNavigation(extraEpisodeIdMutation, 'collectDetail', [{ key: 'taskId', value: { type: 'member', object: 'record', property: 'taskId' } }]),
  false,
  '额外 episodeId 参数不得通过精确参数导航契约',
);
assert.equal(
  hasStaticRouteNavigation(
    'const unused = buildStaticHref(STATIC_ROUTES.collectDetail, { taskId: record.taskId });',
    'collectDetail',
    [{ key: 'taskId', value: { type: 'member', object: 'record', property: 'taskId' } }],
  ),
  false,
  '孤立未使用的 buildStaticHref 调用不得视为导航',
);

const workspaceSource = readFileSync('src/app/collection/collect/workspace/ClientPage.js', 'utf8');
const workspaceAst = babelParser.parse(workspaceSource, { sourceType: 'module', plugins: ['jsx'] });
const workspaceComponentNames = ['HumanoidWorkspace', 'LumosWorkspace', 'Galbot116Workspace'];
const workspaceFunctions = new Map();
const workspaceCalls = new Map();
let workspaceParamsIdentifiers = 0;

walk(workspaceAst, (node) => {
  if (node.type === 'Identifier' && node.name === 'params') workspaceParamsIdentifiers += 1;
  if (node.type === 'FunctionDeclaration' && workspaceComponentNames.includes(node.id?.name)) {
    workspaceFunctions.set(node.id.name, node);
  }
  if (node.type === 'JSXOpeningElement' && workspaceComponentNames.includes(node.name?.name)) {
    workspaceCalls.set(node.name.name, node);
  }
});

assert.equal(workspaceParamsIdentifiers, 0, 'workspace 迁移后不得保留真实未绑定的 params 标识符');
for (const componentName of workspaceComponentNames) {
  const component = workspaceFunctions.get(componentName);
  assert.ok(component, `workspace 必须保留 ${componentName} 子组件`);
  assert.ok(
    component.params.every((parameter) => (
      parameter.type !== 'ObjectPattern'
      || !parameter.properties.some((property) => property.key?.type === 'Identifier' && property.key.name === 'params')
    )),
    `${componentName} 的函数签名不得解构 params`,
  );
  const call = workspaceCalls.get(componentName);
  assert.ok(call, `workspace 必须渲染 ${componentName} 子组件`);
  assert.ok(
    !call.attributes.some((attribute) => attribute.type === 'JSXAttribute' && attribute.name?.name === 'params'),
    `${componentName} 调用不得传递 params prop`,
  );
}

console.log('STATIC_COLLECT_ROUTES_OK');
