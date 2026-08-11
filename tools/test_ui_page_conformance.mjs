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
assert.match(
  dashboard,
  /import\s*{[^}]*\bStatusTag\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
  '首页未导入统一状态标签',
);
assert.match(dashboard, /render:\s*\(s\) => <StatusTag status=\{s\}>\{s\}<\/StatusTag>/, '首页任务状态必须保留原文案并走单一适配层');
assert.doesNotMatch(dashboard, /const statusMap\s*=/, '首页不应保留局部状态颜色映射');

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

const collectionQaListSource = await readFile('src/app/collection/qa/page.js', 'utf8');
assert.match(
  collectionQaListSource,
  /import\s*{[^}]*\bStateView\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
  '数据质检列表未导入 StateView',
);
assert.doesNotMatch(collectionQaListSource, /import\s*{[^}]*\bAlert\b[^}]*}\s*from\s*['"]antd['"]/s, '数据质检列表不应继续导入 Alert');

const qaPackageLoaderSource = collectionQaListSource.match(
  /const loadGeneratedPackages = React\.useCallback\(\(\) => \{[\s\S]*?\n  \}, \[\]\);/,
)?.[0] || '';
assert.ok(qaPackageLoaderSource, '未找到可重试的质检包加载函数');
assert.match(qaPackageLoaderSource, /readQaPackages\(window\.localStorage\)/, '质检包加载函数未执行存储读取');
assert.match(
  qaPackageLoaderSource,
  /setTableData\(\[\s*\.\.\.generatedPackages,\s*\.\.\.instanceMockData\.filter/,
  '存储读取失败时必须保留 instanceMockData 表格回退',
);

const qaStorageErrorBranch = collectionQaListSource.match(
  /\{storageError && \(\s*<StateView[\s\S]*?\s*\/\>\s*\)\}/,
)?.[0] || '';
assert.ok(qaStorageErrorBranch, '存储读取错误分支未使用独立状态视图');
assert.match(qaStorageErrorBranch, /type="error"/, '存储读取错误分支必须使用 error StateView');
assert.match(qaStorageErrorBranch, /description=\{storageError\}/, '存储读取错误分支未显示实际错误文案');
assert.match(qaStorageErrorBranch, /onRetry=\{loadGeneratedPackages\}/, '存储读取错误分支的重试未连接可执行加载函数');

const qaTableSource = collectionQaListSource.match(
  /<Table\s+rowSelection=\{rowSelection\}[\s\S]*?\n        \/>/,
)?.[0] || '';
assert.ok(qaTableSource, '未找到数据质检主表格');
assert.match(qaTableSource, /dataSource=\{filteredData\}/, '数据质检主表格未使用筛选结果');
assert.match(
  qaTableSource,
  /locale=\{\{\s*emptyText:\s*<StateView\s+type="no-result"[\s\S]*?\/>\s*\}\}/,
  '数据质检筛选无结果时必须在表格 emptyText 中展示 no-result StateView',
);

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
  /<StatusTag status=\{s\}>\{s\}<\/StatusTag>/,
  '采集分包必须保留原状态文案并直接走单一语义适配层',
);
assert.doesNotMatch(collectColumnsSource, /s === '待分配' \? '未开始'/, '待分配不得被强制改写为未开始');
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

const collectionExecutionDetail = await readFile('src/app/collection/collect/detail/[taskId]/page.js', 'utf8');
for (const component of ['PageHeader', 'StatusTag']) {
  assert.match(
    collectionExecutionDetail,
    new RegExp(`<${component}(?:\\s|\\/|>)`),
    `src/app/collection/collect/detail/[taskId]/page.js 未使用 ${component}`,
  );
}
for (const className of ['ui-page', 'ui-detail-page', 'ui-table-card']) {
  assert.match(
    collectionExecutionDetail,
    new RegExp(`className=["'][^"']*\\b${className}\\b[^"']*["']`),
    `src/app/collection/collect/detail/[taskId]/page.js 缺少 ${className} 语义类`,
  );
}

const collectionExecutionWorkspaces = [
  'src/app/collection/collect/connection/[taskId]/page.js',
  'src/app/collection/collect/data/[taskId]/page.js',
  'src/app/collection/collect/status/[taskId]/page.js',
  'src/app/collection/collect/video/[taskId]/[episodeId]/page.js',
  'src/app/collection/collect/workspace/[taskId]/page.js',
];

for (const pagePath of collectionExecutionWorkspaces) {
  const source = await readFile(pagePath, 'utf8');
  assert.equal(source.includes('message='), false, `${pagePath} 不应继续使用 Ant Design 6 已弃用的 Alert message`);
  assert.match(source, /className=["'][^"']*\bui-workspace\b[^"']*["']/, `${pagePath} 多面板工作台缺少 ui-workspace`);
  assert.match(source, /className=["'][^"']*\bui-toolbar\b[^"']*["']/, `${pagePath} 顶部工具条缺少 ui-toolbar`);
  assert.match(source, /className=["'][^"']*\bui-table-card\b[^"']*["']/, `${pagePath} 内容面板缺少 ui-table-card`);
  assert.match(source, /<StatusTag(?:\s|\/|>)/, `${pagePath} 未使用统一状态标签`);
}

const collectionRecordingWorkspace = await readFile('src/app/collection/collect/workspace/[taskId]/page.js', 'utf8');
assert.match(
  collectionRecordingWorkspace,
  /className=["'][^"']*\bui-action-footer\b[^"']*["']/,
  '采集录制工作台底部控制条缺少 ui-action-footer',
);

const collectionDataWorkspace = await readFile('src/app/collection/collect/data/[taskId]/page.js', 'utf8');
for (const [sourceStatus, canonicalStatus, text] of [
  ['已入库质检池', '已完成', '数据已就绪'],
  ['等待解析', '进行中', '等待解析'],
  ['废弃', '失败', '序列已废弃'],
]) {
  assert.match(
    collectionDataWorkspace,
    new RegExp(`'${sourceStatus}':\\s*\\{\\s*status:\\s*'${canonicalStatus}',\\s*text:\\s*'${text}'\\s*\\}`),
    `数据工作台未正确归一 ${sourceStatus} 状态`,
  );
}
assert.match(
  collectionDataWorkspace,
  /const \[loadingEpisodeId, setLoadingEpisodeId\] = useState\(null\);/,
  '真实数据加载态必须记录正在加载的序列身份',
);
assert.match(collectionDataWorkspace, /const \[realDataError, setRealDataError\] = useState\(null\);/, '真实数据请求必须有可视错误态');
assert.match(collectionDataWorkspace, /const \[loadAttempt, setLoadAttempt\] = useState\(0\);/, '真实数据请求必须有可触发重试的 token');
assert.doesNotMatch(
  collectionDataWorkspace,
  /loadingRealData|setLoadingRealData/,
  '真实数据加载态不应继续使用全局布尔值',
);
const realDataLoadingEffect = collectionDataWorkspace.match(
  /useEffect\(\(\) => \{[\s\S]*?fetch\('\/api\/luming\?type=report'\)[\s\S]*?\n  \}, \[selectedEpisode, loadAttempt\]\);/,
)?.[0] || '';
assert.ok(realDataLoadingEffect, '未找到 session_028 真实数据加载 effect');
assert.match(
  realDataLoadingEffect,
  /if \(selectedEpisode\?\.episodeId !== 'session_028'\) \{[\s\S]*?return undefined;\s*\}\s*const episodeId = selectedEpisode\.episodeId;/,
  '加载身份只能在 session_028 请求分支中设置',
);
assert.match(
  realDataLoadingEffect,
  /const episodeId = selectedEpisode\.episodeId;\s*let cancelled = false;\s*setLoadingEpisodeId\(episodeId\);/,
  'session_028 请求启动时必须绑定当前序列身份',
);
assert.match(
  realDataLoadingEffect,
  /\.then\(\(\[report, leftTraj, rightTraj\]\) => \{\s*if \(cancelled\) return;/,
  '已取消的 session_028 请求不应写回报告或轨迹',
);
assert.match(
  realDataLoadingEffect,
  /\.catch\(err => \{\s*if \(cancelled\) return;\s*setRealDataError\(\{\s*episodeId,\s*message:/,
  '已取消的 session_028 请求不应写回错误，错误必须绑定序列身份',
);
assert.match(
  realDataLoadingEffect,
  /\.finally\(\(\) => \{\s*if \(!cancelled\) \{\s*setLoadingEpisodeId\(current => current === episodeId \? null : current\);\s*\}\s*\}\);/,
  'session_028 请求结束时必须仅清理自身加载身份',
);
assert.match(
  realDataLoadingEffect,
  /return \(\) => \{\s*cancelled = true;\s*setLoadingEpisodeId\(current => current === episodeId \? null : current\);\s*\};/,
  '切换序列时必须取消写回并清理对应加载身份',
);
assert.match(
  collectionDataWorkspace,
  /const isSelectedEpisodeLoading = loadingEpisodeId === selectedEpisode\?\.episodeId;\s*const toolbarStatus = resolveEpisodeToolbarStatus\(selectedEpisode, isSelectedEpisodeLoading\);/,
  '数据工作台加载提示必须与当前选中序列身份相关联',
);
assert.match(
  collectionDataWorkspace,
  /const selectedEpisodeError = realDataError\?\.episodeId === selectedEpisode\?\.episodeId \? realDataError : null;/,
  '数据工作台错误提示必须与当前选中序列身份相关联',
);
assert.match(
  collectionDataWorkspace,
  /const retryRealData = \(\) => \{\s*if \(selectedEpisode\?\.episodeId === 'session_028'\) \{\s*setLoadAttempt\(current => current \+ 1\);\s*\}\s*\};/,
  '重试动作必须更新 effect 依赖的 token，且只重试当前 session_028',
);
assert.match(
  collectionDataWorkspace,
  /if \(isLoading\) return \{ status: '处理中', text: '数据解析中' \};/,
  '数据工作台加载态应使用 processing 色义',
);
assert.match(
  collectionDataWorkspace,
  /if \(!episode\) return \{ status: '待处理', text: '待选择序列' \};/,
  '数据工作台未选择序列时应保持 warning 色义',
);
assert.match(
  collectionDataWorkspace,
  /\|\| \{ status: '未开始', text: '状态待确认' \}/,
  '数据工作台未知状态不应被误报为已就绪',
);
assert.match(
  collectionDataWorkspace,
  /<StatusTag status=\{toolbarStatus\.status\}>\{toolbarStatus\.text\}<\/StatusTag>/,
  '数据工作台顶部状态未使用解析后的状态与文案',
);
assert.match(
  collectionDataWorkspace,
  /\{isSelectedEpisodeLoading \? \(\s*<StateView\s+type="loading"[\s\S]*?\) : selectedEpisodeError \? \(\s*<StateView\s+type="error"[\s\S]*?description=\{selectedEpisodeError\.message\}[\s\S]*?onRetry=\{retryRealData\}[\s\S]*?\) : selectedEpisode \? \(/,
  '数据工作台必须以互斥条件分支展示 loading/error/成功内容，并连接可执行重试',
);

const collectionQaReportSource = collectionDataWorkspace.match(/自动质检诊断分析报告[\s\S]*?\{\/\* Action Timeline \*\//)?.[0] || '';
assert.ok(collectionQaReportSource, '未找到数据工作台自动质检报告片段');
assert.doesNotMatch(collectionQaReportSource, /<Tag(?:\s|\/|>)/, '自动质检报告中的结果状态应统一使用 StatusTag');
assert.match(
  collectionQaReportSource,
  /<StatusTag status="已通过"[^>]*>所有检查通过 \(PASS\)<\/StatusTag>/,
  '质检报告总结论应保留 success 色义',
);
assert.match(
  collectionQaReportSource,
  /record\.leftStatus === 'pass' \? <StatusTag status="已通过" size="small">通过<\/StatusTag> : <StatusTag status="未通过" size="small">超标<\/StatusTag>/,
  '左臂质检结果未保留 success/error 色义',
);
assert.match(
  collectionQaReportSource,
  /record\.rightStatus === 'pass' \? <StatusTag status="已通过" size="small">通过<\/StatusTag> : <StatusTag status="待处理" size="small">警告<\/StatusTag>/,
  '右臂质检警告未保留 warning 色义',
);

const humanoidRecordStatusSource = collectionRecordingWorkspace.match(/已采记录 \(\$\{completedEpisodes\.length\}\/50\)[\s\S]*?\]\}/)?.[0] || '';
assert.match(
  humanoidRecordStatusSource,
  /<StatusTag status="已完成">\{ep\.status\}<\/StatusTag>/,
  '通用采集器的已上传记录应使用 success 状态芯片',
);

const lumosDeviceCardSource = collectionRecordingWorkspace.match(/离线物理终端设备模拟[\s\S]*?<\/Card>/)?.[0] || '';
assert.match(
  lumosDeviceCardSource,
  /<StatusTag status=\{lumosState === 'SERVICE_STOPPED' \? '未开始' : '已完成'\}>\{lumosState === 'SERVICE_STOPPED' \? '未启动' : '已就绪'\}<\/StatusTag>/,
  'Lumos 物理终端状态未保留 default/success 色义',
);

const galbotDaemonSource = collectionRecordingWorkspace.match(/双端系统服务管理器[\s\S]*?\{\/\* 3D Kinematic Twin SVG \*\//)?.[0] || '';
assert.ok(galbotDaemonSource, '未找到 Galbot 双端系统服务管理器片段');
assert.doesNotMatch(galbotDaemonSource, /<Badge\s+status=/, 'Galbot 守护进程文本状态应统一使用 StatusTag');
assert.match(
  galbotDaemonSource,
  /<StatusTag status=\{galbotState === 'SERVICE_STOPPED' \? '未开始' : galbotState === 'BOOTING' \? '进行中' : '已完成'\}>\{galbotState === 'SERVICE_STOPPED' \? '已停止' : '已就绪'\}<\/StatusTag>/,
  'Galbot 守护进程状态未保留 default/processing/success 色义',
);

const collectionDeviceStatusWorkspace = await readFile('src/app/collection/collect/status/[taskId]/page.js', 'utf8');
assert.doesNotMatch(
  collectionDeviceStatusWorkspace,
  /<Tag(?:\s|\/|>)/,
  '设备状态工作台的状态芯片应统一使用 StatusTag',
);
assert.doesNotMatch(
  collectionDeviceStatusWorkspace,
  /<Badge\s+status=/,
  '设备状态工作台不应使用 Badge 承载文本状态',
);

const dataAdministrationPages = [
  'src/app/data/catalog/page.js',
  'src/app/data/datasets/page.js',
  'src/app/data/download/page.js',
  'src/app/data/raw/page.js',
  'src/app/data/reports/page.js',
  'src/app/accounts/list/page.js',
  'src/app/accounts/teams/page.js',
  'src/app/accounts/vendors/page.js',
  'src/app/projects/page.js',
  'src/app/workflow/list/page.js',
  'src/app/workflow/nodes/page.js',
  'src/app/workflow/tasks/page.js',
];

for (const pagePath of dataAdministrationPages) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bPageHeader\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${pagePath} 未从公共 UI 入口导入 PageHeader`,
  );
  assert.match(source, /<PageHeader(?:\s|\/|>)/, `${pagePath} 未使用统一页头`);
  assert.match(
    source,
    /className=["'][^"']*\bui-page\b[^"']*["']/,
    `${pagePath} 缺少 ui-page 语义类`,
  );
  assert.equal(source.includes('destroyOnClose'), false, `${pagePath} 不应继续使用 Ant Design 6 已弃用的 destroyOnClose`);
}

const dataAdministrationListPages = [
  'src/app/data/catalog/page.js',
  'src/app/data/datasets/page.js',
  'src/app/data/download/page.js',
  'src/app/data/raw/page.js',
  'src/app/data/reports/page.js',
  'src/app/accounts/list/page.js',
  'src/app/accounts/teams/page.js',
  'src/app/accounts/vendors/page.js',
  'src/app/projects/page.js',
  'src/app/workflow/list/page.js',
  'src/app/workflow/nodes/page.js',
  'src/app/workflow/tasks/page.js',
];

for (const pagePath of dataAdministrationListPages) {
  const source = await readFile(pagePath, 'utf8');
  for (const component of ['FilterPanel', 'TableToolbar']) {
    assert.match(
      source,
      new RegExp(`<${component}(?:\\s|\\/|>)`),
      `${pagePath} 列表结构未使用 ${component}`,
    );
  }
  assert.match(
    source,
    /className=["'][^"']*\bui-table-card\b[^"']*["']/,
    `${pagePath} 列表内容缺少 ui-table-card 语义类`,
  );
}

const dataCatalogSource = await readFile('src/app/data/catalog/page.js', 'utf8');
assert.match(
  dataCatalogSource,
  /import\s*{[^}]*\bStateView\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
  '数据资产目录未导入 StateView',
);
assert.match(
  dataCatalogSource,
  /\{filteredCards\.length > 0 \? \([\s\S]*?\) : \(\s*<StateView type="no-result" title="暂无符合条件的数据资产" \/>\s*\)\}/,
  '数据资产目录的筛选无结果分支必须使用 no-result StateView',
);

for (const pagePath of [
  'src/app/collection/annotation-tasks/create/page.js',
  'src/app/collection/tasks/create/page.js',
  'src/app/collection/templates/create/page.js',
  'src/app/collection/collection-tasks/create/page.js',
]) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bStateView\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${pagePath} 未导入 StateView`,
  );
  assert.match(source, /<Suspense fallback=\{<StateView type="loading" \/>\}>/, `${pagePath} 的 Suspense fallback 必须使用 loading StateView`);
  assert.doesNotMatch(source, /<Suspense fallback=\{<div[^>]*>Loading\.\.\.<\/div>\}>/, `${pagePath} 不应保留裸 Loading 文字`);
}

const appModalTitleContracts = {
  'src/app/data/datasets/page.js': ['发布数据集新版本', '新建数据集', '新建子集'],
  'src/app/data/raw/page.js': ['上传数据', '数据解析'],
  'src/app/accounts/list/page.js': ['添加成员', '编辑账号', '修改密码'],
  'src/app/accounts/teams/page.js': ['新建团队', '编辑团队', '添加成员'],
  'src/app/accounts/vendors/page.js': ['添加服务商'],
  'src/app/projects/page.js': ['新建项目', '项目配置'],
  'src/app/workflow/list/page.js': ['新建工作流', '工作流编辑器', '运行工作流'],
  'src/app/workflow/nodes/page.js': ['新增工具节点'],
};

for (const [pagePath, modalTitles] of Object.entries(appModalTitleContracts)) {
  const source = await readFile(pagePath, 'utf8');
  assert.match(
    source,
    /import\s*{[^}]*\bAppModal\b[^}]*}\s*from\s*['"]@\/components\/ui['"]/s,
    `${pagePath} 未从公共 UI 入口导入 AppModal`,
  );
  for (const title of modalTitles) {
    assert.match(
      source,
      new RegExp(`<AppModal\\s+title=["']${title}["']`),
      `${pagePath} 的“${title}”弹窗未由 AppModal 承载`,
    );
    assert.doesNotMatch(
      source,
      new RegExp(`<Modal\\s+title=["']${title}["']`),
      `${pagePath} 的“${title}”弹窗不应回退为原生 Modal`,
    );
  }
}

const workflowTaskSource = await readFile('src/app/workflow/tasks/page.js', 'utf8');
assert.match(workflowTaskSource, /<Modal\s+title="任务运行详情"/, '只读任务运行详情应保留原生 Modal');
assert.doesNotMatch(workflowTaskSource, /<AppModal\s+title="任务运行详情"/, '只读任务运行详情不应被创建类弹窗契约误收');

const datasetPageSource = await readFile('src/app/data/datasets/page.js', 'utf8');
assert.match(datasetPageSource, /<Drawer[\s\S]*?title="数据集版本历史"/, '只读数据集版本历史应保留 Drawer');

const accountListSource = await readFile('src/app/accounts/list/page.js', 'utf8');
assert.match(
  accountListSource,
  /<Popconfirm[\s\S]*?title="确认重置密码？"[\s\S]*?onConfirm=/,
  '重置密码等确认类交互应保留轻量二次确认',
);
assert.doesNotMatch(accountListSource, /resetOpen|setResetOpen/, '重置密码不应继续占用通用表单弹窗状态');
for (const [key, label] of [
  ['change-password', '修改密码'],
  ['edit-account', '编辑'],
  ['delete-account', '删除'],
]) {
  assert.match(
    accountListSource,
    new RegExp(`key:\\s*'${key}'[\\s\\S]*?label:\\s*'${label}'`),
    `用户更多菜单缺少“${label}”动作`,
  );
}
assert.match(
  accountListSource,
  /<Dropdown[\s\S]*?menu=\{\{\s*items:\s*accountMoreMenuItems,\s*onClick:\s*handleAccountMoreAction\s*\}\}[\s\S]*?>/,
  '用户操作列未使用受控 Dropdown 更多菜单',
);
assert.match(
  accountListSource,
  /const handleAccountMoreAction = \(\{ key, domEvent \}\) => \{\s*domEvent\?\.stopPropagation\(\);/,
  '更多菜单动作应阻止事件继续传播，避免触发行级交互',
);
assert.match(accountListSource, /if \(key === 'change-password'\) \{\s*setChangeOpen\(true\);\s*\}/, '修改密码菜单动作未路由到原 handler');
assert.match(accountListSource, /if \(key === 'edit-account'\) \{\s*setEditOpen\(true\);\s*\}/, '编辑菜单动作未路由到原 handler');
assert.match(
  accountListSource,
  /if \(key === 'delete-account'\) \{[\s\S]*?Modal\.confirm\(\{[\s\S]*?title:\s*'确定删除此账号？'[\s\S]*?onOk:\s*\(\) => message\.success\('已删除'\)[\s\S]*?\}\);[\s\S]*?\}/,
  '删除菜单动作必须单独路由到 Modal.confirm 二次确认',
);
const accountActionColumnSource = accountListSource.match(/title:\s*'操作'[\s\S]*?\n\s*},\n\s*];/)?.[0] || '';
assert.ok(accountActionColumnSource, '未找到用户操作列');
assert.match(accountActionColumnSource, /width:\s*220/, '用户操作列应显著收窄');
assert.match(accountActionColumnSource, /whiteSpace:\s*'nowrap'/, '用户操作列应保持单行');
for (const label of ['修改密码', '编辑', '删除']) {
  assert.doesNotMatch(
    accountActionColumnSource,
    new RegExp(`<Button[^>]*>${label}<\\/Button>`),
    `用户操作列不应直显低频动作“${label}”`,
  );
}

const findModalBlocksByOpenState = (source, openState) => {
  const marker = `open={${openState}}`;
  const blocks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const markerIndex = source.indexOf(marker, cursor);
    if (markerIndex === -1) break;

    const appModalStart = source.lastIndexOf('<AppModal', markerIndex);
    const nativeModalStart = source.lastIndexOf('<Modal', markerIndex);
    const start = Math.max(appModalStart, nativeModalStart);
    const component = start === appModalStart ? 'AppModal' : 'Modal';
    const closeMarker = `</${component}>`;
    const end = source.indexOf(closeMarker, markerIndex);

    assert.ok(start >= 0 && end >= 0, `无法解析 open={${openState}} 的弹窗结构`);
    blocks.push({
      component,
      source: source.slice(start, end + closeMarker.length),
    });
    cursor = markerIndex + marker.length;
  }

  return blocks;
};

const assertEditableModalContract = ({ source, pagePath, openState, titlePattern, widthPattern, expectedCount = 1 }) => {
  const blocks = findModalBlocksByOpenState(source, openState);
  assert.equal(blocks.length, expectedCount, `${pagePath} 中 open={${openState}} 的弹窗数量异常`);

  for (const block of blocks) {
    assert.equal(block.component, 'AppModal', `${pagePath} 中 open={${openState}} 的编辑弹窗不得回退为原生 Modal`);
    assert.match(block.source, titlePattern, `${pagePath} 中 open={${openState}} 的标题语义不正确`);
    assert.match(block.source, widthPattern, `${pagePath} 中 open={${openState}} 的宽度契约不正确`);
  }

  return blocks;
};

const projectsSource = await readFile('src/app/projects/page.js', 'utf8');
for (const contract of [
  { openState: 'createOpen', dirtyState: 'createDirty', formName: 'createForm', closeHandler: 'closeCreateModal' },
  { openState: 'editOpen', dirtyState: 'editDirty', formName: 'editForm', closeHandler: 'closeEditModal' },
]) {
  const [block] = assertEditableModalContract({
    source: projectsSource,
    pagePath: 'src/app/projects/page.js',
    openState: contract.openState,
    titlePattern: contract.openState === 'createOpen' ? /title="新建项目"/ : /title="项目配置"/,
    widthPattern: /widthSize="medium"/,
  });
  assert.match(block.source, new RegExp(`dirty=\\{${contract.dirtyState}\\}`), `${contract.openState} 未连接 dirty 状态`);
  assert.match(block.source, new RegExp(`onCancel=\\{${contract.closeHandler}\\}`), `${contract.openState} 未连接统一关闭清理 handler`);
  assert.match(block.source, new RegExp(`<Form[\\s\\S]*?form=\\{${contract.formName}\\}[\\s\\S]*?onValuesChange=\\{\\(\\) => set${contract.dirtyState === 'createDirty' ? 'CreateDirty' : 'EditDirty'}\\(true\\)\\}`), `${contract.openState} 的 Form 未在值变化时标记 dirty`);
  assert.match(block.source, /forceRender/, `${contract.openState} 应预渲染 Form，确保打开前 resetFields 已连接表单实例`);
}
const [createProjectModal] = findModalBlocksByOpenState(projectsSource, 'createOpen');
for (const fieldName of ['projectName', 'englishName', 'remark']) {
  assert.match(
    createProjectModal.source,
    new RegExp(`<Form\\.Item[^>]*name=["']${fieldName}["']`),
    `新建项目字段 ${fieldName} 必须注册到 Form，才能触发 dirty 跟踪`,
  );
}
assert.match(
  projectsSource,
  /const closeCreateModal = \(\) => \{\s*setCreateOpen\(false\);\s*createForm\.resetFields\(\);\s*setCreateDirty\(false\);\s*\};/,
  '新建项目在保存或确认关闭后必须重置表单与 dirty 状态',
);
assert.match(
  projectsSource,
  /const closeEditModal = \(\) => \{\s*setEditOpen\(false\);\s*editForm\.resetFields\(\);\s*setEditDirty\(false\);\s*\};/,
  '项目配置在保存或确认关闭后必须重置表单与 dirty 状态',
);

const collectionTaskCreateSource = await readFile('src/app/collection/tasks/create/page.js', 'utf8');
const [dynamicCreateModal] = assertEditableModalContract({
  source: collectionTaskCreateSource,
  pagePath: 'src/app/collection/tasks/create/page.js',
  openState: 'modalVisible',
  titlePattern: /title=\{`新建\$\{currentField \? fieldLabels\[currentField\] : ''\}`\}/,
  widthPattern: /width=\{currentField === 'sop' \? 800 : 520\}/,
});
assert.match(dynamicCreateModal.source, /onOk=\{handleCreateOption\}/, '动态新建弹窗必须保留创建 handler');

const taskDetailModalSource = await readFile('src/app/collection/tasks/[id]/page.js', 'utf8');
const [addPackModal] = assertEditableModalContract({
  source: taskDetailModalSource,
  pagePath: 'src/app/collection/tasks/[id]/page.js',
  openState: 'isAddPackVisible',
  titlePattern: /<span>新建任务分包<\/span>/,
  widthPattern: /width=\{560\}/,
});
assert.match(addPackModal.source, /form=\{addPackForm\}/, '新建任务分包必须保留原表单实例');
const [addAnnotationModal] = assertEditableModalContract({
  source: taskDetailModalSource,
  pagePath: 'src/app/collection/tasks/[id]/page.js',
  openState: 'isAddAnnoVisible',
  titlePattern: />分配标注任务<\/div>/,
  widthPattern: /width=\{680\}/,
});
assert.match(addAnnotationModal.source, /form=\{annoForm\}/, '分配标注任务必须保留原表单实例');
const [pauseTaskModal] = findModalBlocksByOpenState(taskDetailModalSource, 'isPauseTaskVisible');
assert.equal(pauseTaskModal.component, 'Modal', '暂停确认属于确认类弹窗，应保留原生 Modal');
assert.match(pauseTaskModal.source, /确认暂停采集任务/, '暂停确认弹窗标题不得改变');

const annotationEpisodeSource = await readFile('src/app/annotation/audit/[id]/[episodeId]/page.js', 'utf8');
const saveTemplateModals = assertEditableModalContract({
  source: annotationEpisodeSource,
  pagePath: 'src/app/annotation/audit/[id]/[episodeId]/page.js',
  openState: 'isSaveTplModalOpen',
  titlePattern: />💾 生成并保存标注模版<\/span>/,
  widthPattern: /width=\{580\}/,
  expectedCount: 2,
});
for (const block of saveTemplateModals) {
  assert.match(block.source, /onOk=\{handleSaveTemplate\}/, '保存标注模版必须保留保存 handler');
}
for (const exception of [
  { openState: 'isAddModalOpen', titlePattern: />添加标注<\/span>/, reason: '复杂标注编辑器' },
  { openState: 'isApplyTplModalOpen', titlePattern: />🚀 批量标注 - 复用标注模版<\/span>/, reason: '复杂模版预览与套用' },
]) {
  const [block] = findModalBlocksByOpenState(annotationEpisodeSource, exception.openState);
  assert.equal(block.component, 'Modal', `${exception.reason}明确列入原生 Modal 白名单`);
  assert.match(block.source, exception.titlePattern, `${exception.reason}白名单标题不匹配`);
}

for (const loginPage of [
  'src/app/login/page.js',
  'src/app/qa-login/page.js',
  'src/app/collector-login/page.js',
]) {
  const source = await readFile(loginPage, 'utf8');
  assert.equal(source.includes('<ConfigProvider'), false, `${loginPage} 不得创建私有主题`);
  assert.ok(source.includes('ui-login'), `${loginPage} 必须使用统一登录外壳`);
}

const annotationAuditDetailSource = await readFile('src/app/annotation/audit/[id]/page.js', 'utf8');
assert.doesNotMatch(
  annotationAuditDetailSource,
  /\bmaskClosable=/,
  'Ant Design 6 Modal 应使用 mask.closable，不能继续传入已弃用的 maskClosable',
);
assert.doesNotMatch(
  annotationAuditDetailSource,
  /\bdestroyOnClose\b/,
  'Ant Design 6 Modal 应使用 destroyOnHidden，不能继续传入已弃用的 destroyOnClose',
);

assert.ok(UI_ROUTE_MANIFEST.length > 60, '路由清单数量异常');
console.log('UI_PAGE_CONFORMANCE_OK');
