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

function walkWithAncestors(node, visitor, ancestors = []) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walkWithAncestors(item, visitor, ancestors);
    return;
  }
  if (typeof node.type === 'string') visitor(node, ancestors);
  const nextAncestors = [...ancestors, node];
  for (const [key, value] of Object.entries(node)) {
    if (!['loc', 'start', 'end', 'extra'].includes(key)) walkWithAncestors(value, visitor, nextAncestors);
  }
}

function isStringLiteral(node, value) {
  return node?.type === 'StringLiteral' && node.value === value;
}

function hasSearchParamDefault(directDeclarators, name, key, fallback) {
  return directDeclarators
    .filter(({ kind }) => kind === 'const')
    .map(({ node }) => node)
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

function analyzeClientContract(source, defaults) {
  const ast = babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const pageFunction = ast.program.body.find((node) => node.type === 'ExportDefaultDeclaration')?.declaration;
  const hasDefaultPageFunction = pageFunction?.type === 'FunctionDeclaration';
  const directDeclarators = hasDefaultPageFunction
    ? pageFunction.body.body
      .filter((node) => node.type === 'VariableDeclaration')
      .flatMap((declaration) => declaration.declarations.map((node) => ({ node, kind: declaration.kind })))
    : [];
  let useParamsFound = false;
  const allSearchParamsBindings = [];
  let episodeIdQueryReads = 0;
  let episodeIdQueryBindings = 0;
  walk(ast, (node) => {
    if (node.type === 'Identifier' && node.name === 'useParams') useParamsFound = true;
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === 'searchParams') {
      allSearchParamsBindings.push(node);
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
  const directSearchParamsBindings = directDeclarators.filter(({ node }) => (
    node.id?.type === 'Identifier' && node.id.name === 'searchParams'
  ));
  const [searchParamsBinding] = allSearchParamsBindings;
  const hasCanonicalSearchParamsBinding = (
    allSearchParamsBindings.length === 1
    && directSearchParamsBindings.length === 1
    && searchParamsBinding === directSearchParamsBindings[0].node
    && directSearchParamsBindings[0].kind === 'const'
    && searchParamsBinding.init?.type === 'CallExpression'
    && searchParamsBinding.init.callee?.type === 'Identifier'
    && searchParamsBinding.init.callee.name === 'useSearchParams'
    && searchParamsBinding.init.arguments.length === 0
  );
  return {
    hasDefaultPageFunction,
    hasNoUseParams: !useParamsFound,
    hasCanonicalSearchParamsBinding,
    hasRequiredDefaults: defaults.every(({ name, key, fallback }) => (
      hasSearchParamDefault(directDeclarators, name, key, fallback)
    )),
    episodeIdQueryReads,
    episodeIdQueryBindings,
  };
}

function checkClientContract(pagePath, defaults) {
  const contract = analyzeClientContract(readFileSync(pagePath, 'utf8'), defaults);
  assert.ok(contract.hasDefaultPageFunction, `${pagePath} 必须默认导出页面 FunctionDeclaration`);
  assert.ok(contract.hasNoUseParams, `${pagePath} 不得保留 useParams`);
  assert.ok(contract.hasCanonicalSearchParamsBinding, `${pagePath} 唯一的 searchParams 必须是页面直接作用域 const searchParams = useSearchParams()`);
  assert.ok(contract.hasRequiredDefaults, `${pagePath} 必须以完整 const 声明读取要求的默认 URL 参数`);
  if (pagePath.endsWith('/video/ClientPage.js')) {
    assert.equal(contract.episodeIdQueryReads, 1, `${pagePath} 必须且只能读取一个 episodeId 查询参数`);
    assert.equal(contract.episodeIdQueryBindings, 1, `${pagePath} 必须且只能声明一个 episodeId 查询参数绑定`);
  } else {
    assert.equal(contract.episodeIdQueryReads, 0, `${pagePath} 不得读取 episodeId 查询参数`);
    assert.equal(contract.episodeIdQueryBindings, 0, `${pagePath} 不得声明 episodeId 查询参数绑定`);
  }
}

for (const pagePath of clientPages) {
  checkClientContract(pagePath, [{ name: 'taskId', key: 'taskId', fallback: pagePath.includes('/data/') ? 'CT-20250301002' : 'CT-20250301001' }]);
}
checkClientContract('src/app/collection/collect/video/ClientPage.js', [
  { name: 'taskId', key: 'taskId', fallback: 'CT-20250301001' },
  { name: 'episodeId', key: 'episodeId', fallback: 'session_028' },
]);

const detailClientSource = readFileSync('src/app/collection/collect/detail/ClientPage.js', 'utf8');
const nestedSearchParamsMutation = detailClientSource.replace(
  'const searchParams = useSearchParams();',
  'function bait() { const searchParams = useSearchParams(); }',
);
assert.equal(
  analyzeClientContract(nestedSearchParamsMutation, [{ name: 'taskId', key: 'taskId', fallback: 'CT-20250301001' }]).hasCanonicalSearchParamsBinding,
  false,
  '将 searchParams 移入嵌套函数不得通过页面直接作用域契约',
);

function collectJsSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJsSources(entryPath);
    return entry.name.endsWith('.js') ? [readFileSync(entryPath, 'utf8')] : [];
  });
}

const captureSource = collectJsSources('src/app/collection/collect').join('\n');
assert.doesNotMatch(captureSource, /\/collection\/collect\/(detail|connection|data|status|video|workspace)\/\$\{/, '采集导航不得保留动态路径模板');

function valueSignature(node) {
  if (node?.type === 'Identifier') return node.name;
  if (
    node?.type === 'MemberExpression'
    && !node.computed
    && node.object?.type === 'Identifier'
    && node.property?.type === 'Identifier'
  ) return `${node.object.name}.${node.property.name}`;
  if (node?.type === 'StringLiteral') return JSON.stringify(node.value);
  return `<${node?.type || 'missing'}>`;
}

function paramsSignature(node) {
  if (node?.type !== 'ObjectExpression') return `<${node?.type || 'missing'}>`;
  return node.properties
    .map((property) => (
      property.type === 'ObjectProperty' && property.key?.type === 'Identifier'
        ? `${property.key.name}=${valueSignature(property.value)}`
        : `<${property.type}>`
    ))
    .sort()
    .join('&');
}

function staticRouteName(node) {
  if (
    node?.type === 'CallExpression'
    && node.callee?.type === 'Identifier'
    && node.callee.name === 'buildStaticHref'
    && node.arguments[0]?.type === 'MemberExpression'
    && node.arguments[0].object?.type === 'Identifier'
    && node.arguments[0].object.name === 'STATIC_ROUTES'
    && node.arguments[0].property?.type === 'Identifier'
  ) return node.arguments[0].property.name;
  return null;
}

function navigationSinkType(node, parent, ancestors) {
  if (parent?.type === 'CallExpression' && parent.arguments[0] === node) {
    const callee = parent.callee;
    if (callee?.type === 'MemberExpression' && !callee.computed) {
      if (callee.object?.type === 'Identifier' && callee.object.name === 'router' && callee.property?.name === 'push') return 'router.push';
      if (callee.object?.type === 'Identifier' && callee.object.name === 'window' && callee.property?.name === 'open') return 'window.open';
    }
  }
  const isBreadcrumbHref = (
    parent?.type === 'ObjectProperty'
    && parent.value === node
    && parent.key?.type === 'Identifier'
    && parent.key.name === 'href'
    && ancestors.some((ancestor) => ancestor.type === 'JSXOpeningElement' && ancestor.name?.name === 'Breadcrumb')
    && ancestors.some((ancestor) => ancestor.type === 'JSXAttribute' && ancestor.name?.name === 'items')
  );
  return isBreadcrumbHref ? 'breadcrumb.href' : null;
}

function collectStaticRouteNavigations(source) {
  const ast = babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const records = [];
  walkWithAncestors(ast, (node, ancestors) => {
    const routeName = staticRouteName(node);
    const parent = ancestors.at(-1);
    const sink = navigationSinkType(node, parent, ancestors);
    if (routeName && sink) records.push({ routeName, sink, params: paramsSignature(node.arguments[1]) });
  });
  return records;
}

function navigationMultiset(records) {
  return records.map(({ routeName, sink, params }) => `${routeName}|${sink}|${params}`).sort();
}

const routeExpectations = new Map([
  ['src/app/collection/collect/page.js', [
    'collectDetail|router.push|taskId=record.taskId',
    'collectWorkspace|window.open|taskId=record.taskId',
  ]],
  ['src/app/collection/collect/detail/ClientPage.js', [
    'collectVideo|window.open|episodeId=epId&taskId=taskId',
    'collectData|window.open|taskId=taskId',
    'collectConnection|window.open|taskId=taskId',
    'qaDetail|router.push|id=text',
    'qaDetail|router.push|id=record.qaBatch',
  ]],
  ['src/app/collection/collect/connection/ClientPage.js', ['collectWorkspace|router.push|taskId=taskId']],
  ['src/app/collection/collect/status/ClientPage.js', [
    'collectConnection|router.push|taskId=taskId',
    'collectWorkspace|window.open|taskId=taskId',
  ]],
  ['src/app/collection/collect/video/ClientPage.js', [
    'collectDetail|breadcrumb.href|taskId=taskId',
    'collectData|window.open|taskId=taskId',
  ]],
  ['src/app/collection/collect/data/ClientPage.js', []],
  ['src/app/collection/collect/workspace/ClientPage.js', []],
]);

for (const [pagePath, expected] of routeExpectations) {
  assert.deepEqual(
    navigationMultiset(collectStaticRouteNavigations(readFileSync(pagePath, 'utf8'))),
    [...expected].sort(),
    `${pagePath} 的受管静态导航必须与完整契约完全一致`,
  );
}

const listSource = readFileSync('src/app/collection/collect/page.js', 'utf8');
const extraNavigationMutation = `${listSource}
router.push(buildStaticHref(STATIC_ROUTES.collectData, { taskId, episodeId: 'bait' }));`;
assert.notDeepEqual(
  navigationMultiset(collectStaticRouteNavigations(extraNavigationMutation)),
  [...routeExpectations.get('src/app/collection/collect/page.js')].sort(),
  '额外的真实静态导航不得通过整页多重集契约',
);
assert.deepEqual(
  navigationMultiset(collectStaticRouteNavigations(`
    const unused = buildStaticHref(STATIC_ROUTES.collectDetail, { taskId: record.taskId });
    const unusedHref = { href: buildStaticHref(STATIC_ROUTES.collectData, { taskId: record.taskId }) };
  `)),
  [],
  '孤立 helper 与未使用对象 href 不得视为导航',
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
