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
  assert.match(
    readFileSync(pagePath, 'utf8'),
    /import StaticRouteBoundary from '@\/components\/StaticRouteBoundary';/,
    `${pagePath} 必须导入 StaticRouteBoundary`,
  );
}

for (const pagePath of clientPages) {
  assert.ok(existsSync(pagePath), `客户端页面必须存在：${pagePath}`);
  assert.match(readFileSync(pagePath, 'utf8'), /^['\"]use client['\"];/, `${pagePath} 必须是 Client Component`);
}

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
