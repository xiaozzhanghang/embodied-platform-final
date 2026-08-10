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

assert.ok(UI_ROUTE_MANIFEST.length > 60, '路由清单数量异常');
console.log('UI_PAGE_CONFORMANCE_OK');
