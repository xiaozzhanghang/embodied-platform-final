import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UI_ROUTE_MANIFEST } from '../src/lib/uiRouteManifest.mjs';

const css = await readFile('src/app/globals.css', 'utf8');

for (const token of [
  '--ui-primary: #1677ff',
  '--ui-bg-layout: #f5f7fa',
  '--ui-radius-card: 8px',
  '--ui-control-height: 32px',
]) assert.ok(css.includes(token), `缺少全局 token: ${token}`);

for (const className of [
  '.ui-page', '.ui-page-header', '.ui-filter-panel', '.ui-table-card',
  '.ui-toolbar', '.ui-form-section', '.ui-action-footer', '.ui-workspace',
  '.ui-state-view',
]) assert.ok(css.includes(className), `缺少语义样式: ${className}`);

const mainLayout = await readFile('src/components/MainLayout.js', 'utf8');
assert.ok(mainLayout.includes('className="main-layout"'), '主布局未使用 main-layout 语义类');
assert.ok(mainLayout.includes('className="header-bar"'), '主布局未使用 header-bar 语义类');
assert.ok(mainLayout.includes('className="content-wrapper"'), '主布局未使用 content-wrapper 语义类');
assert.equal(mainLayout.includes("background: '#f0f2f5'"), false, '主内容区仍使用旧的硬编码背景');

const dashboard = await readFile('src/app/dashboard/page.js', 'utf8');
assert.match(
  dashboard,
  /import\s*{[^}]*\bPageHeader\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
  '首页未从公共 UI 入口导入 PageHeader',
);
assert.match(dashboard, /<PageHeader(?:\s|\/|>)/, '首页未使用 PageHeader');

const coreTaskPages = [
  { path: 'src/app/collection/annotation-tasks/page.js', type: 'list' },
  { path: 'src/app/collection/annotation-tasks/create/page.js', type: 'create' },
  { path: 'src/app/collection/collection-tasks/page.js', type: 'list' },
  { path: 'src/app/collection/collection-tasks/create/page.js', type: 'create' },
  { path: 'src/app/collection/projects/page.js', type: 'list' },
  { path: 'src/app/collection/taskbooks/page.js', type: 'list' },
  { path: 'src/app/collection/taskbooks/create/page.js', type: 'create' },
  { path: 'src/app/collection/taskbooks/detail/[id]/page.js', type: 'detail' },
  { path: 'src/app/collection/templates/page.js', type: 'list' },
  { path: 'src/app/collection/templates/create/page.js', type: 'create' },
  { path: 'src/app/collection/templates/action/create/page.js', type: 'create' },
  { path: 'src/app/collection/templates/detail/[id]/page.js', type: 'detail' },
];

for (const page of coreTaskPages) {
  const source = await readFile(page.path, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bPageHeader\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${page.path} 未从公共 UI 入口导入 PageHeader`,
  );
  assert.match(source, /<PageHeader(?:\s|\/|>)/, `${page.path} 未使用统一页头`);
  assert.equal(source.includes('destroyOnClose'), false, `${page.path} 不应继续使用 Ant Design 6 已弃用的 destroyOnClose`);

  if (page.type === 'list') {
    assert.match(source, /<TableToolbar(?:\s|\/|>)/, `${page.path} 列表页未使用 TableToolbar`);
  } else {
    assert.ok(
      source.includes('<FormSection') || source.includes('className="ui-detail-page"'),
      `${page.path} 创建/详情页未使用 FormSection 或标准详情类`,
    );
  }
}

for (const pagePath of [
  'src/app/collection/taskbooks/page.js',
  'src/app/collection/collection-tasks/create/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bStatusTag\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${pagePath} 未从公共 UI 入口导入 StatusTag`,
  );
  assert.match(source, /<StatusTag(?:\s|\/|>)/, `${pagePath} 未使用统一状态标签`);
}

for (const pagePath of [
  'src/app/collection/annotation-tasks/page.js',
  'src/app/collection/projects/page.js',
  'src/app/collection/templates/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bAppModal\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${pagePath} 未从公共 UI 入口导入 AppModal`,
  );
  assert.match(source, /<AppModal(?:\s|\/|>)/, `${pagePath} 覆盖式创建/编辑/配置弹窗未使用 AppModal`);
}

const annotationCreate = await readFile('src/app/collection/annotation-tasks/create/page.js', 'utf8');
assert.equal(annotationCreate.includes('<Segmented'), false, '标注任务创建页不应恢复来源切换条');
assert.equal(annotationCreate.includes('message='), false, '标注任务创建页不应使用 Ant Design 6 已弃用的 Alert message');
assert.equal(annotationCreate.includes('bordered={false}'), false, '标注任务创建页不应使用 Ant Design 6 已弃用的 Tag bordered');

const annotationQaListPages = [
  { path: 'src/app/annotation/acceptance/page.js', filters: true },
  { path: 'src/app/annotation/audit/page.js', filters: true },
  { path: 'src/app/annotation/marketplace/page.js', filters: true },
  { path: 'src/app/annotation/projects/page.js', filters: true },
  { path: 'src/app/annotation/review-list/page.js', filters: true },
  { path: 'src/app/annotation/stats/page.js', filters: false },
  { path: 'src/app/collection/qa/page.js', filters: true },
];

for (const page of annotationQaListPages) {
  const source = await readFile(page.path, 'utf8');
  for (const component of ['PageHeader', 'TableToolbar', 'StatusTag']) {
    assert.match(
      source,
      new RegExp(`<${component}(?:\\s|\\/|>)`),
      `${page.path} 未使用 ${component}`,
    );
  }
  if (page.filters) {
    assert.match(source, /<FilterPanel(?:\s|\/|>)/, `${page.path} 筛选区未使用 FilterPanel`);
  }
}

for (const pagePath of [
  'src/app/annotation/audit/create/page.js',
  'src/app/annotation/projects/create/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  for (const component of ['PageHeader', 'FormSection', 'ActionFooter']) {
    assert.match(
      source,
      new RegExp(`<${component}(?:\\s|\\/|>)`),
      `${pagePath} 页面式表单未使用 ${component}`,
    );
  }
}

const answerWorkspace = await readFile('src/app/annotation/answer/page.js', 'utf8');
for (const component of ['PageHeader', 'FilterPanel', 'TableToolbar', 'StatusTag']) {
  assert.match(
    answerWorkspace,
    new RegExp(`<${component}(?:\\s|\\/|>)`),
    `src/app/annotation/answer/page.js 外层任务列表未使用 ${component}`,
  );
}
assert.match(answerWorkspace, /className=["']ui-workspace["']/, '标注作业工作台缺少 ui-workspace');

const annotationEditor = await readFile('src/app/annotation/editor/[type]/page.js', 'utf8');
assert.match(annotationEditor, /className=["']ui-workspace["']/, '标注编辑器缺少 ui-workspace');
assert.match(annotationEditor, /<StatusTag(?:\s|\/|>)/, '标注编辑器未使用统一状态标签');

for (const pagePath of [
  'src/app/annotation/audit/[id]/page.js',
  'src/app/collection/qa/[instanceId]/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  for (const component of ['PageHeader', 'StatusTag']) {
    assert.match(
      source,
      new RegExp(`<${component}(?:\\s|\\/|>)`),
      `${pagePath} 详情外壳未使用 ${component}`,
    );
  }
  assert.match(
    source,
    /className=["'][^"']*\bui-detail-page\b[^"']*["']/,
    `${pagePath} 缺少标准详情页语义类`,
  );
  assert.match(
    source,
    /className=["'][^"']*\bui-table-card\b[^"']*["']/,
    `${pagePath} 数据列表未使用统一内容卡片`,
  );
}

for (const pagePath of [
  'src/app/annotation/audit/[id]/[episodeId]/page.js',
  'src/app/collection/qa/[instanceId]/[seqId]/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /className=["'][^"']*\bui-workspace\b[^"']*["']/,
    `${pagePath} 多面板工作台缺少 ui-workspace`,
  );
  assert.match(source, /<StatusTag(?:\s|\/|>)/, `${pagePath} 顶部任务状态未使用 StatusTag`);
  assert.match(
    source,
    /className=["'][^"']*\bui-toolbar\b[^"']*["']/,
    `${pagePath} 工具栏未使用统一语义类`,
  );
  assert.match(
    source,
    /className=["'][^"']*\bui-action-footer\b[^"']*["']/,
    `${pagePath} 底部操作区未使用统一语义类`,
  );
}

for (const pagePath of [
  'src/app/annotation/audit/page.js',
  'src/app/annotation/projects/page.js',
  'src/app/collection/qa/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /<AppModal(?:\s|\/|>)/, `${pagePath} 配置弹窗未使用 AppModal`);
}

const collectionConfigurationPages = [
  { path: 'src/app/collection/components/page.js', type: 'list' },
  { path: 'src/app/collection/components/create/page.js', type: 'form' },
  { path: 'src/app/collection/config/page.js', type: 'list' },
  { path: 'src/app/collection/config/create/page.js', type: 'form' },
  { path: 'src/app/collection/config/detail/[id]/page.js', type: 'detail' },
  { path: 'src/app/collection/device-types/page.js', type: 'list' },
  { path: 'src/app/collection/device-types/add/page.js', type: 'form' },
  { path: 'src/app/collection/device-types/detail/[id]/page.js', type: 'detail' },
  { path: 'src/app/collection/device-types/part-detail/[id]/page.js', type: 'detail' },
  { path: 'src/app/collection/devices/page.js', type: 'list' },
  { path: 'src/app/collection/devices/detail/[id]/page.js', type: 'detail' },
  { path: 'src/app/collection/object-labels/page.js', type: 'list' },
  { path: 'src/app/collection/objects/page.js', type: 'list' },
  { path: 'src/app/collection/objects/create/page.js', type: 'form' },
];

for (const page of collectionConfigurationPages) {
  const source = await readFile(page.path, 'utf8');

  if (page.type === 'form') {
    for (const component of ['PageHeader', 'FormSection', 'ActionFooter']) {
      assert.match(
        source,
        new RegExp(`<${component}(?:\\s|\\/|>)`),
        `${page.path} 页面式表单未使用 ${component}`,
      );
    }
    continue;
  }

  assert.match(source, /<PageHeader(?:\s|\/|>)/, `${page.path} 未使用统一页头`);

  if (page.type === 'list') {
    assert.ok(
      /<(?:FilterPanel|TableToolbar)(?:\s|\/|>)/.test(source),
      `${page.path} 列表页未使用 FilterPanel 或 TableToolbar`,
    );
  } else {
    assert.match(
      source,
      /className=["'][^"']*\bui-detail-grid\b[^"']*["']/,
      `${page.path} 详情页缺少 ui-detail-grid`,
    );
  }
}

for (const pagePath of [
  'src/app/collection/device-types/detail/[id]/page.js',
  'src/app/collection/devices/detail/[id]/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  const pageHeaderSource = source.match(/<PageHeader[\s\S]*?\/>/)?.[0] || '';
  assert.ok(pageHeaderSource, `${pagePath} 缺少 PageHeader`);
  assert.equal(pageHeaderSource.includes('title={<Space'), false, `${pagePath} 页头标题不应将块级 Space 放入标题元素`);
  assert.match(pageHeaderSource, /title=\{<span(?:\s|>)/, `${pagePath} 页头复合标题应使用内联 span 容器`);
}

const deviceDetailSource = await readFile('src/app/collection/devices/detail/[id]/page.js', 'utf8');
for (const label of [
  '运行中',
  'remote_ctrl_record.target (Active)',
  'Supervisor Daemon (Active)',
  'galbot_upper_bridge (Active)',
]) {
  assert.ok(
    deviceDetailSource.includes(`<StatusTag status="已完成">${label}</StatusTag>`),
    `设备详情中 ${label} 应保留 success 色义`,
  );
}
assert.ok(
  deviceDetailSource.includes('<StatusTag status="进行中">已认证</StatusTag>'),
  '设备详情中已认证应保留 processing 色义',
);

for (const pagePath of [
  'src/app/collection/config/page.js',
  'src/app/collection/device-types/page.js',
  'src/app/collection/devices/page.js',
  'src/app/collection/object-labels/page.js',
  'src/app/collection/objects/page.js',
  'src/app/collection/objects/create/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bAppModal\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${pagePath} 未从公共 UI 入口导入 AppModal`,
  );
  assert.match(source, /<AppModal(?:\s|\/|>)/, `${pagePath} 覆盖式新增/编辑弹窗未使用 AppModal`);
}

const collectionExecutionPages = [
  {
    path: 'src/app/collection/collect-home/page.js',
    components: ['PageHeader', 'StatusTag'],
    classNames: ['ui-page'],
  },
  {
    path: 'src/app/collection/collect/page.js',
    components: ['PageHeader', 'FilterPanel', 'TableToolbar', 'StatusTag'],
    classNames: ['ui-page', 'ui-table-card'],
  },
  {
    path: 'src/app/collection/tasks/page.js',
    components: ['PageHeader'],
    classNames: ['ui-page'],
  },
  {
    path: 'src/app/collection/tasks/[id]/page.js',
    components: ['PageHeader', 'FilterPanel', 'TableToolbar', 'StatusTag'],
    classNames: ['ui-page', 'ui-detail-page', 'ui-table-card'],
  },
  {
    path: 'src/app/collection/tasks/create/page.js',
    components: ['PageHeader', 'FormSection', 'ActionFooter'],
    classNames: ['ui-page'],
  },
  {
    path: 'src/app/collection/tasks/detail/[taskId]/page.js',
    components: ['PageHeader', 'FormSection', 'StatusTag'],
    classNames: ['ui-page', 'ui-detail-page'],
  },
];

for (const page of collectionExecutionPages) {
  const source = await readFile(page.path, 'utf8');
  assert.equal(source.includes('bordered={false}'), false, `${page.path} 不应继续使用 Ant Design 6 已弃用的 bordered={false}`);
  assert.equal(source.includes('message='), false, `${page.path} 不应继续使用 Ant Design 6 已弃用的 Alert message`);
  for (const component of page.components) {
    assert.match(
      source,
      new RegExp(`<${component}(?:\\s|\\/|>)`),
      `${page.path} 未使用 ${component}`,
    );
  }
  for (const className of page.classNames) {
    assert.match(
      source,
      new RegExp(`className=["'][^"']*\\b${className}\\b[^"']*["']`),
      `${page.path} 缺少 ${className} 语义类`,
    );
  }
}

const collectionTasksRedirect = await readFile('src/app/collection/tasks/page.js', 'utf8');
assert.ok(
  collectionTasksRedirect.includes("router.replace('/collection/collection-tasks')"),
  '采集任务兼容入口必须保持重定向到 /collection/collection-tasks',
);

const collectionTaskDetailSource = await readFile('src/app/collection/tasks/[id]/page.js', 'utf8');
const collectColumnsSource = collectionTaskDetailSource.match(/const columnsCollect = \[[\s\S]*?const columnsAsset = \[/)?.[0] || '';
const assetColumnsSource = collectionTaskDetailSource.match(/const columnsAsset = \[[\s\S]*?const mockInstancesNoCollect = \[/)?.[0] || '';
assert.match(
  collectColumnsSource,
  /<StatusTag status=\{s === '采集中' \? '进行中' : s === '待分配' \? '未开始' : s\}>\{s\}<\/StatusTag>/,
  '采集分包的待分配必须在调用处归一为默认灰色，并保留显示文案',
);
assert.match(
  assetColumnsSource,
  /<StatusTag status=\{s\}>\{s\}<\/StatusTag>/,
  '关联资产分包必须将标注审核中原始状态传入 StatusTag',
);
assert.doesNotMatch(
  assetColumnsSource,
  /s === '标注审核中' \? '审核中'/,
  '标注审核中不应在调用处被改写为审核中',
);

assert.ok(UI_ROUTE_MANIFEST.length > 60, '路由清单数量异常');
console.log('UI_PAGE_CONFORMANCE_OK');
