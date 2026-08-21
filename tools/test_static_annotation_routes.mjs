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

for (const pagePath of fixedPages) {
  assert.ok(existsSync(pagePath), `固定路由页面必须存在：${pagePath}`);
  const wrapperSource = readFileSync(pagePath, 'utf8');
  assert.match(
    wrapperSource,
    /import StaticRouteBoundary from '@\/components\/StaticRouteBoundary';/,
    `${pagePath} 必须导入 StaticRouteBoundary`,
  );
  assert.match(wrapperSource, /import ClientPage from '\.\/ClientPage';/, `${pagePath} 必须导入 ClientPage`);
  assert.match(
    wrapperSource,
    /<StaticRouteBoundary>\s*<ClientPage \/>\s*<\/StaticRouteBoundary>/,
    `${pagePath} 必须由 StaticRouteBoundary 包裹并渲染 ClientPage`,
  );
}

for (const pagePath of clientPages) {
  assert.ok(existsSync(pagePath), `客户端页面必须存在：${pagePath}`);
  assert.match(readFileSync(pagePath, 'utf8'), /^['\"]use client['\"];/, `${pagePath} 必须是 Client Component`);
}

const detailClientSource = readFileSync('src/app/annotation/audit/detail/ClientPage.js', 'utf8');
assert.match(
  detailClientSource,
  /searchParams\.get\('id'\) \|\| '19884'/,
  '审核详情必须为 id 提供 19884 默认值',
);

const workbenchClientSource = readFileSync('src/app/annotation/audit/workbench/ClientPage.js', 'utf8');
assert.match(
  workbenchClientSource,
  /searchParams\.get\('id'\) \|\| '19884'/,
  '审核工作台必须为 id 提供 19884 默认值',
);
assert.match(
  workbenchClientSource,
  /searchParams\.get\('episodeId'\) \|\| '744108'/,
  '审核工作台必须为 episodeId 提供 744108 默认值',
);

const editorClientSource = readFileSync('src/app/annotation/editor/ClientPage.js', 'utf8');
assert.match(
  editorClientSource,
  /searchParams\.get\('type'\) \|\| 'range'/,
  '标注编辑器必须为 type 提供 range 默认值',
);

const qaDetailSource = readFileSync('src/app/collection/qa/[instanceId]/page.js', 'utf8');
assert.match(
  qaDetailSource,
  /buildStaticHref\(STATIC_ROUTES\.auditWorkbench,\s*\{[\s\S]*?id:\s*instanceId,[\s\S]*?episodeId:\s*r\.id,[\s\S]*?type:\s*r\.annoType,[\s\S]*?mode:\s*'audit',[\s\S]*?\}\)/,
  'QA 到审核工作台的跳转必须以全部参数使用 buildStaticHref',
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
