import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import babelParser from 'next/dist/compiled/babel/parser.js';
import { UI_ROUTE_MANIFEST } from '../src/lib/uiRouteManifest.mjs';

const canonicalWrapperSource = `import StaticRouteBoundary from '@/components/StaticRouteBoundary';
import ClientPage from './ClientPage';

export default function Page() {
  return (
    <StaticRouteBoundary>
      <ClientPage />
    </StaticRouteBoundary>
  );
}`;

const managementContracts = new Map([
  ['src/app/collection/config/detail/ClientPage.js', { queries: ['id'] }],
  ['src/app/collection/device-types/detail/ClientPage.js', { queries: ['edit', 'id'] }],
  ['src/app/collection/device-types/part-detail/ClientPage.js', { queries: ['edit', 'id'] }],
  ['src/app/collection/devices/detail/ClientPage.js', { queries: ['edit', 'id'], defaults: { id: 'DEV-2026-001' } }],
  ['src/app/collection/qa/detail/ClientPage.js', { queries: ['instanceId', 'tab'] }],
  ['src/app/collection/qa/review/ClientPage.js', { queries: ['instanceId', 'seqId'] }],
  ['src/app/collection/taskbooks/detail/ClientPage.js', { queries: ['id'] }],
  ['src/app/collection/tasks/detail/ClientPage.js', { queries: ['id', 'needCollect', 'type'] }],
  ['src/app/collection/templates/detail/ClientPage.js', { queries: ['id'] }],
]);

const wrappedQueryContracts = new Map([
  ['src/app/collection/collection-tasks/create/ClientPage.js', { queries: ['mode', 'taskId'], component: 'CreateCollectionTaskContent' }],
  ['src/app/collection/taskbooks/create/ClientPage.js', { queries: ['id'], component: 'CreateTaskbookContent' }],
  ['src/app/collection/tasks/create/ClientPage.js', { queries: ['mode', 'taskId'], component: 'CreateTaskContent' }],
  ['src/app/collection/templates/create/ClientPage.js', { queries: ['id'], component: 'TemplateForm' }],
]);

function collectPagePaths(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectPagePaths(entryPath);
    return entry.name === 'page.js' ? [entryPath.replaceAll('\\', '/')] : [];
  });
}

function parse(source) {
  return babelParser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
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

function isClientSearchParamPage(pagePath) {
  const ast = parse(readFileSync(pagePath, 'utf8'));
  const hasClientDirective = ast.program.directives.some(({ value }) => value.value === 'use client');
  let usesSearchParams = false;
  walk(ast, (node) => {
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'useSearchParams') {
      usesSearchParams = true;
    }
  });
  return hasClientDirective && usesSearchParams;
}

const discoveredPages = collectPagePaths('src/app').sort();
const dynamicPages = discoveredPages.filter((pagePath) => pagePath.split('/').some((part) => part.includes('[')));
const clientSearchParamPages = discoveredPages.filter(isClientSearchParamPage);

assert.deepEqual(dynamicPages, [], 'static export must not retain bracket page routes');
assert.deepEqual(clientSearchParamPages, [], 'page.js using useSearchParams must be a Server wrapper');

const allClientContracts = new Map([...managementContracts, ...wrappedQueryContracts]);
for (const clientPath of allClientContracts.keys()) {
  const wrapperPath = clientPath.replace('/ClientPage.js', '/page.js');
  assert.ok(existsSync(clientPath), `客户端页面必须存在：${clientPath}`);
  assert.ok(existsSync(wrapperPath), `固定 Server wrapper 必须存在：${wrapperPath}`);
  assert.equal(
    readFileSync(wrapperPath, 'utf8').trim(),
    canonicalWrapperSource,
    `${wrapperPath} 必须使用标准 StaticRouteBoundary → ClientPage 包裹`,
  );
  assert.match(readFileSync(clientPath, 'utf8'), /^['"]use client['"];/, `${clientPath} 必须是 Client Component`);
}

const removedPages = [
  'src/app/collection/config/detail/[id]/page.js',
  'src/app/collection/device-types/detail/[id]/page.js',
  'src/app/collection/device-types/part-detail/[id]/page.js',
  'src/app/collection/devices/detail/[id]/page.js',
  'src/app/collection/qa/[instanceId]/[seqId]/page.js',
  'src/app/collection/qa/[instanceId]/page.js',
  'src/app/collection/taskbooks/detail/[id]/page.js',
  'src/app/collection/tasks/[id]/page.js',
  'src/app/collection/tasks/detail/[taskId]/page.js',
  'src/app/collection/templates/detail/[id]/page.js',
];
for (const pagePath of removedPages) {
  assert.ok(!existsSync(pagePath), `旧动态或重复详情页不得保留：${pagePath}`);
}

function literalValue(node) {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'BooleanLiteral') return node.value;
  return undefined;
}

function directComponentDeclarators(ast, componentName) {
  const defaultExport = ast.program.body.find((node) => node.type === 'ExportDefaultDeclaration')?.declaration;
  assert.equal(defaultExport?.type, 'FunctionDeclaration', 'ClientPage 必须默认导出 FunctionDeclaration');
  const component = componentName
    ? ast.program.body.find((node) => node.type === 'FunctionDeclaration' && node.id?.name === componentName)
    : defaultExport;
  assert.equal(component?.type, 'FunctionDeclaration', `ClientPage 必须声明查询组件 ${componentName || 'default export'}`);
  if (componentName) {
    let renderedByDefaultExport = false;
    walk(defaultExport, (node) => {
      if (node.type === 'JSXIdentifier' && node.name === componentName) renderedByDefaultExport = true;
    });
    assert.ok(renderedByDefaultExport, `默认导出必须实际渲染查询组件 ${componentName}`);
  }
  return component.body.body
    .filter((node) => node.type === 'VariableDeclaration')
    .flatMap((declaration) => declaration.declarations.map((node) => ({ node, kind: declaration.kind })));
}

function searchGetKey(node) {
  if (
    node?.type === 'CallExpression'
    && node.callee?.type === 'MemberExpression'
    && !node.callee.computed
    && node.callee.object?.type === 'Identifier'
    && node.callee.object.name === 'searchParams'
    && node.callee.property?.type === 'Identifier'
    && node.callee.property.name === 'get'
    && node.arguments.length === 1
    && node.arguments[0]?.type === 'StringLiteral'
  ) return node.arguments[0].value;
  return null;
}

function analyzeClientContract(source, componentName) {
  const ast = parse(source);
  const declarators = directComponentDeclarators(ast, componentName);
  const allSearchParamsBindings = [];
  const queryReads = [];
  const defaults = new Map();
  let useParamsFound = false;
  let redundantUriDecodeFound = false;
  walk(ast, (node) => {
    if (node.type === 'Identifier' && node.name === 'useParams') useParamsFound = true;
    if (
      node.type === 'CallExpression'
      && node.callee?.type === 'Identifier'
      && node.callee.name === 'decodeURIComponent'
    ) redundantUriDecodeFound = true;
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === 'searchParams') {
      allSearchParamsBindings.push(node);
    }
    const queryKey = searchGetKey(node);
    if (queryKey !== null) queryReads.push(queryKey);
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'Identifier'
      && node.init?.type === 'LogicalExpression'
      && node.init.operator === '||'
    ) {
      const key = searchGetKey(node.init.left);
      const fallback = literalValue(node.init.right);
      if (key !== null && fallback !== undefined) defaults.set(node.id.name, { key, fallback });
    }
  });
  const directSearchParamsBindings = declarators.filter(({ node }) => node.id?.type === 'Identifier' && node.id.name === 'searchParams');
  const binding = allSearchParamsBindings[0];
  return {
    ast,
    hasNoUseParams: !useParamsFound,
    hasNoRedundantUriDecode: !redundantUriDecodeFound,
    hasCanonicalSearchParamsBinding: (
      allSearchParamsBindings.length === 1
      && directSearchParamsBindings.length === 1
      && binding === directSearchParamsBindings[0].node
      && directSearchParamsBindings[0].kind === 'const'
      && binding.init?.type === 'CallExpression'
      && binding.init.callee?.type === 'Identifier'
      && binding.init.callee.name === 'useSearchParams'
      && binding.init.arguments.length === 0
    ),
    queryReads: queryReads.sort(),
    defaults,
  };
}

for (const [clientPath, contract] of allClientContracts) {
  const analysis = analyzeClientContract(readFileSync(clientPath, 'utf8'), contract.component);
  assert.ok(analysis.hasNoUseParams, `${clientPath} 不得保留 useParams`);
  assert.ok(analysis.hasNoRedundantUriDecode, `${clientPath} 不得二次解码 useSearchParams 已解码的查询值`);
  assert.ok(analysis.hasCanonicalSearchParamsBinding, `${clientPath} 必须在页面直接作用域唯一声明 const searchParams = useSearchParams()`);
  assert.deepEqual(analysis.queryReads, [...contract.queries].sort(), `${clientPath} 必须且只能读取 canonical 查询参数`);
  for (const [bindingName, fallback] of Object.entries(contract.defaults || {})) {
    assert.deepEqual(
      analysis.defaults.get(bindingName),
      { key: bindingName, fallback },
      `${clientPath} 必须保留 ${bindingName} 的关键默认值 ${fallback}`,
    );
  }
}

const deviceClientSource = readFileSync('src/app/collection/devices/detail/ClientPage.js', 'utf8');
assert.equal(
  analyzeClientContract(deviceClientSource.replace(
    'const searchParams = useSearchParams();',
    'function bait() { const searchParams = useSearchParams(); }',
  )).hasCanonicalSearchParamsBinding,
  false,
  '把 searchParams 移入嵌套函数不得通过页面作用域契约',
);

const taskbookClientSource = readFileSync('src/app/collection/taskbooks/detail/ClientPage.js', 'utf8');
const redundantDecodeMutation = taskbookClientSource.replace(
  "const id = searchParams.get('id') || '';",
  "const id = decodeURIComponent(searchParams.get('id') || '');",
);
assert.notEqual(redundantDecodeMutation, taskbookClientSource, '二次解码 mutation 必须实际修改任务书详情页');
assert.equal(
  analyzeClientContract(redundantDecodeMutation).hasNoRedundantUriDecode,
  false,
  '任务书详情页重新加入 decodeURIComponent 必须被拒绝',
);

function expressionSignature(node) {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'StringLiteral') return JSON.stringify(node.value);
  if (node?.type === 'BooleanLiteral') return String(node.value);
  if (node?.type === 'UnaryExpression' && node.operator === '!' && node.argument?.type === 'Identifier') {
    return `!${node.argument.name}`;
  }
  if (
    node?.type === 'MemberExpression'
    && !node.computed
    && node.object?.type === 'Identifier'
    && node.property?.type === 'Identifier'
  ) return `${node.object.name}.${node.property.name}`;
  if (
    node?.type === 'ConditionalExpression'
    && node.consequent?.type === 'MemberExpression'
    && node.consequent.object?.name === 'STATIC_ROUTES'
    && node.alternate?.type === 'MemberExpression'
    && node.alternate.object?.name === 'STATIC_ROUTES'
  ) return `${expressionSignature(node.test)}?${node.consequent.property.name}:${node.alternate.property.name}`;
  return `<${node?.type || 'missing'}>`;
}

function paramsSignature(node) {
  if (node?.type !== 'ObjectExpression') return `<${node?.type || 'missing'}>`;
  return node.properties.map((property) => {
    if (property.type !== 'ObjectProperty') return `<${property.type}>`;
    const key = property.key?.type === 'Identifier' ? property.key.name : expressionSignature(property.key);
    return `${key}=${expressionSignature(property.value)}`;
  }).sort().join('&');
}

function routeSignature(node) {
  if (node?.type === 'MemberExpression' && node.object?.name === 'STATIC_ROUTES' && node.property?.type === 'Identifier') {
    return node.property.name;
  }
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'ConditionalExpression') return expressionSignature(node);
  return `<${node?.type || 'missing'}>`;
}

function navigationSink(node, parent, ancestors) {
  if (parent?.type === 'CallExpression' && parent.arguments[0] === node) {
    const callee = parent.callee;
    if (callee?.type === 'MemberExpression' && !callee.computed) {
      if (callee.object?.type === 'Identifier' && callee.object.name === 'router' && ['push', 'replace'].includes(callee.property?.name)) {
        return `router.${callee.property.name}`;
      }
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

function collectBuiltNavigations(source) {
  const records = [];
  walkWithAncestors(parse(source), (node, ancestors) => {
    if (node.type !== 'CallExpression' || node.callee?.type !== 'Identifier' || node.callee.name !== 'buildStaticHref') return;
    const parent = ancestors.at(-1);
    const sink = navigationSink(node, parent, ancestors);
    if (sink) records.push(`${routeSignature(node.arguments[0])}|${sink}|${paramsSignature(node.arguments[1])}`);
  });
  return records.sort();
}

function navigationCallSink(node) {
  if (node?.type !== 'CallExpression') return null;
  const callee = node.callee;
  if (callee?.type !== 'MemberExpression' || callee.computed) return null;
  if (
    callee.object?.type === 'Identifier'
    && callee.object.name === 'router'
    && ['push', 'replace'].includes(callee.property?.name)
  ) return `router.${callee.property.name}`;
  if (
    callee.object?.type === 'Identifier'
    && callee.object.name === 'window'
    && callee.property?.name === 'open'
  ) return 'window.open';
  return null;
}

function collectNavigationSinkArguments(source) {
  const records = [];
  walk(parse(source), (node) => {
    const sink = navigationCallSink(node);
    if (!sink) return;
    const argument = node.arguments[0];
    records.push({
      sink,
      argument,
      expression: argument ? source.slice(argument.start, argument.end) : '<missing>',
    });
  });
  return records;
}

function isDirectStaticHrefCall(node) {
  return (
    node?.type === 'CallExpression'
    && node.callee?.type === 'Identifier'
    && node.callee.name === 'buildStaticHref'
  );
}

function staticLiteralPath(node) {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw;
  }
  return null;
}

function collectUnsafeNavigationSinks(source) {
  return collectNavigationSinkArguments(source).flatMap(({ sink, argument, expression }) => {
    if (isDirectStaticHrefCall(argument)) return [];
    const literalPath = staticLiteralPath(argument);
    if (typeof literalPath === 'string' && literalPath.startsWith('/') && !literalPath.includes('?')) return [];
    return [{ sink, argumentType: argument?.type || 'missing', expression }];
  });
}

const navigationContracts = new Map([
  ['src/app/collection/collection-tasks/page.js', [
    'taskDetail|router.push|id=record.taskId&needCollect=needCollect',
    '/collection/tasks/create|router.push|mode="copy"&taskId=record.taskId',
    '/collection/tasks/create|router.push|mode="edit"&taskId=record.taskId',
  ]],
  ['src/app/collection/annotation-tasks/page.js', [
    'qaDetail|router.push|instanceId=qaPackage.qaPackageId',
    'taskDetail|router.push|id=record.taskId&type="asset"',
    '/collection/tasks/create|router.push|mode="copy"&taskId=record.taskId',
    '/collection/tasks/create|router.push|mode="edit"&taskId=record.taskId',
  ]],
  ['src/app/collection/qa/page.js', ['qaDetail|router.push|instanceId=r.instanceId']],
  ['src/app/collection/qa-dual-view/page.js', [
    'qaDetail|router.push|instanceId=id',
    'qaDetail|router.push|instanceId=pkgId',
    'qaDetail|router.push|instanceId=r.instanceId',
  ]],
  ['src/app/collection/taskbooks/page.js', [
    'taskbookDetail|router.push|id=id',
    'taskbookDetail|router.push|id=record.id',
    '/collection/collection-tasks/create|router.push|taskbook=record.id',
    '/collection/taskbooks/create|router.push|id=record.id&mode="edit"',
  ]],
  ['src/app/collection/taskbooks/detail/ClientPage.js', [
    'taskDetail|router.push|id=plan.id',
    '/collection/collection-tasks/create|router.push|taskbook=taskbook.id',
    '/collection/taskbooks/create|router.push|id=taskbook.id&mode="edit"',
  ]],
  ['src/app/collection/templates/page.js', ['/collection/templates/create|router.push|id=tpl.key']],
  ['src/app/collection/templates/detail/ClientPage.js', ['/collection/templates/create|router.push|id=template.id']],
  ['src/app/collection/device-types/page.js', [
    'isRobot?deviceTypeDetail:devicePartDetail|router.push|id=record.key',
    'isRobot?deviceTypeDetail:devicePartDetail|router.push|edit="true"&id=record.key',
  ]],
  ['src/app/collection/devices/page.js', [
    'deviceDetail|router.push|id=newKey',
    'deviceDetail|router.push|id=record.key',
    'deviceDetail|router.push|edit="true"&id=record.key',
  ]],
  ['src/app/collection/devices/detail/ClientPage.js', [
    'deviceDetail|router.push|id=id',
    'deviceDetail|router.push|id=id',
  ]],
  ['src/app/collection/collect/detail/ClientPage.js', [
    'collectConnection|window.open|taskId=taskId',
    'collectData|window.open|taskId=taskId',
    'collectVideo|window.open|episodeId=epId&taskId=taskId',
    'qaDetail|router.push|instanceId=record.qaBatch',
    'qaDetail|router.push|instanceId=text',
  ]],
  ['src/app/annotation/audit/workbench/ClientPage.js', [
    'auditDetail|router.push|id=instanceId',
    'auditDetail|router.push|id=instanceId',
    'auditDetail|router.push|id=instanceId&tab="annotated"',
    'auditWorkbench|router.push|episodeId=nextEp.id&id=instanceId&mode="audit"&type=nextEp.annoType',
    'auditWorkbench|router.push|episodeId=nextEp.id&id=instanceId&mode="audit"&type=nextEp.annoType',
    'auditWorkbench|router.push|episodeId=nextEp.id&id=instanceId&mode="annotate"&type=nextEp.annoType',
    'qaDetail|router.push|instanceId=instanceId',
    '/annotation/review-list|router.push|instanceId=instanceId',
    '/annotation/workbench-solutions|router.push|episodeId=episodeId&instanceId=instanceId&mode=workMode&type=annoType',
  ]],
]);

for (const [pagePath, expected] of navigationContracts) {
  const source = readFileSync(pagePath, 'utf8');
  assert.deepEqual(
    collectUnsafeNavigationSinks(source),
    [],
    `${pagePath} 的所有真实导航 sink 必须直接使用 buildStaticHref 或无查询的静态路径 literal`,
  );
  assert.deepEqual(
    collectBuiltNavigations(source),
    [...expected].sort(),
    `${pagePath} 的所有 buildStaticHref 导航必须与完整多重集契约一致`,
  );
}

const navigationProbeSource = readFileSync('src/app/collection/qa/page.js', 'utf8');
assert.notDeepEqual(
  collectBuiltNavigations(`${navigationProbeSource}\nrouter.push(buildStaticHref(STATIC_ROUTES.qaDetail, { id: r.instanceId }));`),
  [...navigationContracts.get('src/app/collection/qa/page.js')].sort(),
  '新增漏参或错误参数的真实导航不得通过完整多重集契约',
);
assert.deepEqual(
  collectBuiltNavigations(`
    const unused = buildStaticHref(STATIC_ROUTES.qaDetail, { instanceId });
    const unusedObject = { href: buildStaticHref(STATIC_ROUTES.qaDetail, { instanceId }) };
    /* router.push(buildStaticHref(STATIC_ROUTES.qaDetail, { id: 'bait' })); */
  `),
  [],
  '未使用 helper、普通对象 href 与注释诱饵不得视为真实导航',
);

const unsafeNavigationMutations = [
  {
    label: '任务编辑 raw query 模板',
    sourcePath: 'src/app/collection/collection-tasks/page.js',
    badSink: 'router.push(`/collection/tasks/create?mode=edit&taskId=${record.taskId}`);',
  },
  {
    label: '任务书编辑 raw query 模板',
    sourcePath: 'src/app/collection/taskbooks/page.js',
    badSink: 'router.push(`/collection/taskbooks/create?mode=edit&id=${record.id}`);',
  },
  {
    label: '任务书发起采集 raw query 模板',
    sourcePath: 'src/app/collection/taskbooks/page.js',
    badSink: 'router.push(`/collection/collection-tasks/create?taskbook=${record.id}`);',
  },
  {
    label: '模板编辑 raw query 模板',
    sourcePath: 'src/app/collection/templates/page.js',
    badSink: 'router.push(`/collection/templates/create?id=${tpl.key}`);',
  },
  {
    label: '旧详情 BinaryExpression 拼接',
    sourcePath: 'src/app/collection/collection-tasks/page.js',
    badSink: "router.push('/collection/tasks/detail/' + record.taskId);",
  },
];

for (const { label, sourcePath, badSink } of unsafeNavigationMutations) {
  const source = `${readFileSync(sourcePath, 'utf8')}\n${badSink}`;
  assert.deepEqual(
    collectUnsafeNavigationSinks(source),
    [{
      sink: 'router.push',
      argumentType: label.includes('BinaryExpression') ? 'BinaryExpression' : 'TemplateLiteral',
      expression: badSink.slice('router.push('.length, -2),
    }],
    `${label} 必须被完整真实 sink 清单拒绝`,
  );
}

assert.deepEqual(
  collectUnsafeNavigationSinks("router.push('/collection/taskbooks/create');"),
  [],
  '无查询、无表达式的纯静态管理路径必须继续允许',
);

const dynamicManagementPrefixes = [
  '/collection/config/detail/',
  '/collection/device-types/detail/',
  '/collection/device-types/part-detail/',
  '/collection/devices/detail/',
  '/collection/qa/',
  '/collection/taskbooks/detail/',
  '/collection/tasks/',
  '/collection/tasks/detail/',
  '/collection/templates/detail/',
];

for (const sourcePath of [
  ...collectPagePaths('src/app/collection'),
  ...collectPagePaths('src/app/annotation'),
  ...[...allClientContracts.keys()],
  ...['src/app/collection/collect/detail/ClientPage.js', 'src/app/annotation/audit/workbench/ClientPage.js'],
]) {
  const ast = parse(readFileSync(sourcePath, 'utf8'));
  walkWithAncestors(ast, (node, ancestors) => {
    if (node.type !== 'TemplateLiteral') return;
    const parent = ancestors.at(-1);
    const sink = navigationSink(node, parent, ancestors);
    if (!sink) return;
    const value = node.quasis.map((quasi) => quasi.value.raw).join('${}');
    for (const prefix of dynamicManagementPrefixes) {
      assert.ok(!value.startsWith(prefix), `${sourcePath} 的真实 ${sink} 不得保留旧管理动态路径：${value}`);
    }
  });
}

const registeredPages = UI_ROUTE_MANIFEST.map(({ path: pagePath }) => pagePath).sort();
assert.deepEqual(registeredPages, discoveredPages, 'manifest 集合必须与递归发现的 page.js 精确一致');
assert.equal(new Set(registeredPages).size, registeredPages.length, 'manifest 不得重复登记 page.js');
assert.ok(registeredPages.every((pagePath) => !pagePath.includes('[')), 'manifest 不得保留 bracket 路由');

console.log('STATIC_MANAGEMENT_ROUTES_OK');
