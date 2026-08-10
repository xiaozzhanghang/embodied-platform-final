# 全站 UI 组件与显示样式统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有全部业务路由统一到 Ant Design 蓝色后台视觉体系，同时保持现有业务数据、路由、接口和操作流程不变。

**Architecture:** 先通过 `ConfigProvider` 和全局 CSS 建立单一主题来源，再新增无业务状态的公共 UI 组件，最后按页面类型分批替换重复结构和内联样式。业务页面继续拥有数据与事件处理，公共组件只负责布局、显示和基础交互；每一批迁移都通过源代码契约测试、构建和浏览器抽查独立验收。

**Tech Stack:** Next.js 16.1.6 App Router、React 19.2.3、Ant Design 6.3.1、原生 CSS、Node.js `assert` 测试脚本。

## Global Constraints

- 主色固定为 `#1677FF`，页面背景固定为 `#F5F7FA`，卡片背景固定为 `#FFFFFF`。
- 默认卡片圆角为 `8px`，默认控件高度为 `32px`，基础间距阶梯为 `4/8/12/16/24/32px`。
- 创建、编辑和配置操作使用居中弹窗；抽屉不用于创建或编辑流程。
- 不修改业务字段、数据模型、接口、权限逻辑、路由和核心流程。
- 不引入新的 UI 组件库、CSS 框架或主题运行时依赖。
- 保留当前工作区中的用户修改；尤其不得覆盖 `src/app/collection/annotation-tasks/create/page.js` 中已完成的数据池流程调整。
- 主要浏览器验收宽度为 `1440px` 和 `1920px`，并保证 `1280px` 下主要操作可用。
- Ant Design 主题配置遵循 `ConfigProvider theme.token` 与 `theme.components`；Next.js 全局 CSS 继续由根布局导入，客户端 Provider 继续隔离在 `AntdRegistry`。

---

## 文件结构

### 新建文件

- `src/theme/antdTheme.js`：全站 Ant Design token 与组件 token 的唯一配置源。
- `src/components/ui/PageHeader.js`：页面标题、说明、返回和右侧操作。
- `src/components/ui/FilterPanel.js`：统一筛选卡片和展开逻辑。
- `src/components/ui/TableToolbar.js`：结果统计、批量操作和主要操作。
- `src/components/ui/StatusTag.js`：业务状态到视觉语义的映射。
- `src/components/ui/FormSection.js`：长表单分区。
- `src/components/ui/ActionFooter.js`：页面式表单底部操作区。
- `src/components/ui/AppModal.js`：居中弹窗尺寸、滚动和未保存确认入口。
- `src/components/ui/StateView.js`：加载、空数据、无结果、无权限和失败状态。
- `src/components/ui/index.js`：公共 UI 组件出口。
- `src/lib/uiRouteManifest.mjs`：全路由页面类型与迁移阶段清单。
- `tools/test_ui_theme.mjs`：主题和全局 token 契约测试。
- `tools/test_ui_components.mjs`：公共组件接口与语义测试。
- `tools/test_ui_route_manifest.mjs`：路由清单完整性测试。
- `tools/test_ui_page_conformance.mjs`：迁移页面的公共结构与禁用样式检查。

### 主要修改文件

- `src/components/AntdRegistry.js`
- `src/components/MainLayout.js`
- `src/app/globals.css`
- `src/app/layout.js`
- `src/app/page.js`
- `src/app/**/page.js` 下全部业务页面。

---

### Task 1: 建立主题契约与路由清单

**Files:**
- Create: `src/theme/antdTheme.js`
- Create: `src/lib/uiRouteManifest.mjs`
- Create: `tools/test_ui_theme.mjs`
- Create: `tools/test_ui_route_manifest.mjs`
- Modify: `src/components/AntdRegistry.js`

**Interfaces:**
- Produces: `antdTheme` 对象，供 `AntdRegistry` 使用。
- Produces: `UI_ROUTE_MANIFEST` 数组，元素结构为 `{ path: string, type: 'list' | 'form' | 'detail' | 'workspace' | 'login' | 'redirect', phase: 2 | 3 }`。
- Consumes: 无。

- [ ] **Step 1: 编写失败的主题契约测试**

```js
// tools/test_ui_theme.mjs
import assert from 'node:assert/strict';
import { antdTheme } from '../src/theme/antdTheme.js';

assert.equal(antdTheme.token.colorPrimary, '#1677ff');
assert.equal(antdTheme.token.colorBgLayout, '#f5f7fa');
assert.equal(antdTheme.token.colorBgContainer, '#ffffff');
assert.equal(antdTheme.token.borderRadius, 8);
assert.equal(antdTheme.token.controlHeight, 32);
assert.equal(antdTheme.components.Table.headerBg, '#fafafa');
assert.equal(antdTheme.components.Table.cellPaddingBlock, 12);
assert.equal(antdTheme.components.Modal.titleFontSize, 16);
console.log('UI_THEME_OK');
```

- [ ] **Step 2: 运行测试并确认因主题模块不存在而失败**

Run: `node tools/test_ui_theme.mjs`

Expected: FAIL，错误包含 `Cannot find module`。

- [ ] **Step 3: 实现主题配置并接入现有 Provider**

```js
// src/theme/antdTheme.js
export const antdTheme = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorBgLayout: '#f5f7fa',
    colorBgContainer: '#ffffff',
    colorText: '#1f2329',
    colorTextSecondary: '#646a73',
    colorBorder: '#e5e6eb',
    colorBorderSecondary: '#f0f0f0',
    borderRadius: 8,
    controlHeight: 32,
    fontSize: 14,
  },
  components: {
    Button: { borderRadius: 6, fontWeight: 500 },
    Card: { headerFontSize: 16 },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#1f2329',
      rowHoverBg: '#f5f9ff',
      borderColor: '#e5e6eb',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Modal: { titleFontSize: 16 },
    Form: { itemMarginBottom: 20, labelColor: '#1f2329' },
    Tabs: { itemSelectedColor: '#1677ff', inkBarColor: '#1677ff' },
  },
};
```

Update `AntdRegistry` to import `antdTheme` and pass `theme={antdTheme}` while keeping `zhCN` and `<App>` unchanged.

- [ ] **Step 4: 编写并运行完整路由清单测试**

```js
// tools/test_ui_route_manifest.mjs
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { UI_ROUTE_MANIFEST } from '../src/lib/uiRouteManifest.mjs';

async function findPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return findPages(target);
    return entry.name === 'page.js' ? [target.replaceAll('\\\\', '/')] : [];
  }));
  return nested.flat();
}

const discovered = (await findPages('src/app')).sort();
const registered = UI_ROUTE_MANIFEST.map(({ path: pagePath }) => pagePath).sort();
assert.deepEqual(registered, discovered, '每个 page.js 必须登记页面类型与迁移阶段');
assert.equal(new Set(registered).size, registered.length, '路由清单不得重复');
console.log('UI_ROUTE_MANIFEST_OK');
```

Populate `UI_ROUTE_MANIFEST` with every `page.js` currently returned by `find src/app -name 'page.js'`, including dynamic route filenames exactly as stored on disk.

- [ ] **Step 5: 运行 Task 1 验证**

Run: `node tools/test_ui_theme.mjs && node tools/test_ui_route_manifest.mjs`

Expected: prints `UI_THEME_OK` and `UI_ROUTE_MANIFEST_OK`.

- [ ] **Step 6: 提交主题契约**

```bash
git add src/theme/antdTheme.js src/lib/uiRouteManifest.mjs src/components/AntdRegistry.js tools/test_ui_theme.mjs tools/test_ui_route_manifest.mjs
git commit -m "feat: establish unified UI theme contract"
```

---

### Task 2: 整理全局样式与页面布局基础

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.js`
- Create: `tools/test_ui_page_conformance.mjs`

**Interfaces:**
- Consumes: `antdTheme` 的颜色和尺寸约束。
- Produces: `.ui-page`、`.ui-page-header`、`.ui-filter-panel`、`.ui-table-card`、`.ui-toolbar`、`.ui-form-section`、`.ui-action-footer`、`.ui-workspace`、`.ui-state-view` 语义类。

- [ ] **Step 1: 编写失败的全局样式契约测试**

```js
// tools/test_ui_page_conformance.mjs
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
  '.ui-toolbar', '.ui-form-section', '.ui-action-footer', '.ui-state-view',
]) assert.ok(css.includes(className), `缺少语义样式: ${className}`);

assert.ok(UI_ROUTE_MANIFEST.length > 60, '路由清单数量异常');
console.log('UI_PAGE_CONFORMANCE_OK');
```

- [ ] **Step 2: 运行测试并确认缺少新 token**

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL，首个错误为缺少 `--ui-primary`。

- [ ] **Step 3: 重组全局 CSS**

At the top of `globals.css`, define the canonical variables and map existing variable names to them so unmigrated pages remain usable:

```css
:root {
  --ui-primary: #1677ff;
  --ui-primary-hover: #4096ff;
  --ui-primary-active: #0958d9;
  --ui-success: #52c41a;
  --ui-warning: #faad14;
  --ui-error: #ff4d4f;
  --ui-bg-layout: #f5f7fa;
  --ui-bg-container: #ffffff;
  --ui-text-primary: #1f2329;
  --ui-text-secondary: #646a73;
  --ui-text-tertiary: #8f959e;
  --ui-border: #e5e6eb;
  --ui-radius-control: 6px;
  --ui-radius-card: 8px;
  --ui-control-height: 32px;
  --ui-space-1: 4px;
  --ui-space-2: 8px;
  --ui-space-3: 12px;
  --ui-space-4: 16px;
  --ui-space-6: 24px;
  --ui-space-8: 32px;
  --primary-color: var(--ui-primary);
  --body-bg: var(--ui-bg-layout);
  --card-bg: var(--ui-bg-container);
}
```

Define the semantic classes listed in the interface. Remove duplicated global selectors only after confirming that an equivalent semantic selector exists. Keep media rules for 1280px and mobile login/collector pages.

- [ ] **Step 4: 保持根布局职责清晰**

Keep `src/app/layout.js` as a server component that imports `globals.css` and wraps children with the existing client `AntdRegistry`. Do not move page state or browser APIs into the root layout.

- [ ] **Step 5: 运行契约测试与构建**

Run: `node tools/test_ui_theme.mjs && node tools/test_ui_page_conformance.mjs && npm run build`

Expected: both scripts print their `_OK` markers; Next.js build exits with code 0.

- [ ] **Step 6: 提交全局基础样式**

```bash
git add src/app/globals.css src/app/layout.js tools/test_ui_page_conformance.mjs
git commit -m "feat: unify global layout and style tokens"
```

---

### Task 3: 实现公共 UI 组件

**Files:**
- Create: `src/components/ui/PageHeader.js`
- Create: `src/components/ui/FilterPanel.js`
- Create: `src/components/ui/TableToolbar.js`
- Create: `src/components/ui/StatusTag.js`
- Create: `src/components/ui/FormSection.js`
- Create: `src/components/ui/ActionFooter.js`
- Create: `src/components/ui/AppModal.js`
- Create: `src/components/ui/StateView.js`
- Create: `src/components/ui/index.js`
- Create: `tools/test_ui_components.mjs`

**Interfaces:**
- Produces: `PageHeader({ title, description, breadcrumbs, back, extra })`.
- Produces: `FilterPanel({ children, actions, collapsible, defaultExpanded })`.
- Produces: `TableToolbar({ title, count, selectedCount, actions })`.
- Produces: `StatusTag({ status, children })`.
- Produces: `FormSection({ title, description, children })`.
- Produces: `ActionFooter({ children })`.
- Produces: `AppModal({ widthSize, dirty, onCancel, ...modalProps })` with `widthSize` values `small | medium | large` mapped to `520 | 720 | 960`.
- Produces: `StateView({ type, title, description, onRetry })` with `type` values `loading | empty | no-result | forbidden | error`.

- [ ] **Step 1: 编写失败的公共组件出口测试**

```js
// tools/test_ui_components.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const exportsSource = await readFile('src/components/ui/index.js', 'utf8');
for (const name of [
  'PageHeader', 'FilterPanel', 'TableToolbar', 'StatusTag',
  'FormSection', 'ActionFooter', 'AppModal', 'StateView',
]) assert.match(exportsSource, new RegExp(`export \\{ default as ${name} \\}`));

const statusSource = await readFile('src/components/ui/StatusTag.js', 'utf8');
for (const status of ['进行中', '已完成', '待审核', '失败', '已取消']) {
  assert.ok(statusSource.includes(status), `缺少状态映射: ${status}`);
}

const modalSource = await readFile('src/components/ui/AppModal.js', 'utf8');
assert.ok(modalSource.includes('520'));
assert.ok(modalSource.includes('720'));
assert.ok(modalSource.includes('960'));
assert.ok(modalSource.includes('centered'));
console.log('UI_COMPONENTS_OK');
```

- [ ] **Step 2: 运行测试并确认公共组件目录不存在**

Run: `node tools/test_ui_components.mjs`

Expected: FAIL，错误包含 `ENOENT`。

- [ ] **Step 3: 实现无业务状态的公共组件**

All files that use Ant Design components or React state begin with `'use client';`. Components render semantic `.ui-*` classes and pass through documented Ant Design props. `StatusTag` uses one mapping:

```js
const STATUS_COLORS = {
  '进行中': 'processing',
  '处理中': 'processing',
  '已完成': 'success',
  '通过': 'success',
  '待处理': 'warning',
  '待审核': 'warning',
  '待质检': 'warning',
  '失败': 'error',
  '驳回': 'error',
  '未开始': 'default',
  '停用': 'default',
  '已取消': 'default',
};
```

`AppModal` must not own form submission. When `dirty` is true, `onCancel` opens `Modal.confirm`; otherwise it invokes `onCancel` directly.

- [ ] **Step 4: 运行组件测试与构建**

Run: `node tools/test_ui_components.mjs && npm run build`

Expected: prints `UI_COMPONENTS_OK`; build exits with code 0.

- [ ] **Step 5: 提交公共组件**

```bash
git add src/components/ui tools/test_ui_components.mjs
git commit -m "feat: add reusable admin UI components"
```

---

### Task 4: 统一主布局、导航与首页

**Files:**
- Modify: `src/components/MainLayout.js`
- Modify: `src/app/dashboard/page.js`
- Modify: `src/app/page.js`

**Interfaces:**
- Consumes: global `.ui-*` classes and `PageHeader`.
- Produces: all authenticated pages share one sidebar, 56px header and 24px content padding.

- [ ] **Step 1: 扩展页面一致性测试**

Add assertions to `tools/test_ui_page_conformance.mjs`:

```js
const mainLayout = await readFile('src/components/MainLayout.js', 'utf8');
assert.ok(mainLayout.includes('className="main-layout"'));
assert.ok(mainLayout.includes('className="header-bar"'));
assert.ok(mainLayout.includes('className="content-wrapper"'));
assert.equal(mainLayout.includes("background: '#f0f2f5'"), false);

const dashboard = await readFile('src/app/dashboard/page.js', 'utf8');
assert.ok(dashboard.includes('<PageHeader'));
```

- [ ] **Step 2: 运行测试并确认旧背景断言失败**

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL because `MainLayout` still contains `#f0f2f5` or dashboard lacks `PageHeader`.

- [ ] **Step 3: 迁移布局与首页**

Move repeated header/sidebar visual values from inline styles to existing semantic classes. Preserve menu keys, role switching, requirement annotation switch, login redirects and responsive sidebar behavior. Replace dashboard title and section wrappers with `PageHeader` and standard cards. Keep statistics and chart data unchanged.

- [ ] **Step 4: 验证布局**

Run: `node tools/test_ui_page_conformance.mjs && npm run build`

Expected: test prints `UI_PAGE_CONFORMANCE_OK`; build exits with code 0.

Browser check: open `/dashboard` at 1440x900 and 1920x1080; verify sidebar, header, page padding, statistic cards and tables align without horizontal overflow.

- [ ] **Step 5: 提交布局改造**

```bash
git add src/components/MainLayout.js src/app/dashboard/page.js src/app/page.js tools/test_ui_page_conformance.mjs
git commit -m "feat: unify application shell and dashboard"
```

---

### Task 5: 迁移核心任务列表、创建页与模板中心

**Files:**
- Modify: `src/app/collection/annotation-tasks/page.js`
- Modify: `src/app/collection/annotation-tasks/create/page.js`
- Modify: `src/app/collection/collection-tasks/page.js`
- Modify: `src/app/collection/collection-tasks/create/page.js`
- Modify: `src/app/collection/projects/page.js`
- Modify: `src/app/collection/taskbooks/page.js`
- Modify: `src/app/collection/taskbooks/create/page.js`
- Modify: `src/app/collection/taskbooks/detail/[id]/page.js`
- Modify: `src/app/collection/templates/page.js`
- Modify: `src/app/collection/templates/create/page.js`
- Modify: `src/app/collection/templates/action/create/page.js`
- Modify: `src/app/collection/templates/detail/[id]/page.js`

**Interfaces:**
- Consumes: `PageHeader`, `FilterPanel`, `TableToolbar`, `StatusTag`, `FormSection`, `ActionFooter`, `AppModal`, `StateView`.
- Preserves: annotation task unified completed-data-pool selection and original-source traceability.

- [ ] **Step 1: 添加核心页面迁移断言**

In `tools/test_ui_page_conformance.mjs`, define `coreTaskPages` with the 12 exact paths above. For each list page assert `PageHeader` and `TableToolbar`; for each create/detail page assert `PageHeader` plus `FormSection` or standard detail class. Add the existing annotation copy test to the verification command.

```js
const source = await readFile(pagePath, 'utf8');
assert.ok(source.includes('PageHeader'), `${pagePath} 未使用统一页头`);
assert.equal(source.includes('<Segmented'), false, `${pagePath} 不应恢复来源切换条`);
```

- [ ] **Step 2: 运行测试并确认页面尚未迁移**

Run: `node tools/test_ui_page_conformance.mjs && node tools/test_annotation_task_create_page_copy.mjs`

Expected: conformance test fails on the first missing public component; annotation copy test remains passing.

- [ ] **Step 3: 迁移核心页面**

Replace only display wrappers and component styling. Keep each page's arrays, localStorage keys, query parameters, navigation targets and handlers unchanged. Remove duplicated source tabs from annotation task creation. Use `StatusTag` in status columns and standard `AppModal` for create/edit/config dialogs. Use page forms for long multi-section create flows.

- [ ] **Step 4: 验证核心页面**

Run:

```bash
node tools/test_ui_components.mjs
node tools/test_ui_page_conformance.mjs
node tools/test_annotation_task_create_model.mjs
node tools/test_annotation_task_create_page_copy.mjs
npm run build
```

Expected: all scripts print success markers; build exits with code 0.

Browser check at 1440x900 and 1920x1080:

- `/collection/collection-tasks`
- `/collection/collection-tasks/create`
- `/collection/annotation-tasks`
- `/collection/annotation-tasks/create`
- `/collection/taskbooks`
- `/collection/templates`

Verify title hierarchy, filter alignment, primary-button placement, table density, form section spacing and absence of the removed source switch.

- [ ] **Step 5: 提交核心任务与模板页面**

```bash
git add src/app/collection/annotation-tasks src/app/collection/collection-tasks src/app/collection/projects src/app/collection/taskbooks src/app/collection/templates tools/test_ui_page_conformance.mjs
git commit -m "feat: unify task and template interfaces"
```

---

### Task 6: 迁移数据标注与数据质检页面

**Files:**
- Modify: `src/app/annotation/acceptance/page.js`
- Modify: `src/app/annotation/answer/page.js`
- Modify: `src/app/annotation/audit/page.js`
- Modify: `src/app/annotation/audit/create/page.js`
- Modify: `src/app/annotation/audit/[id]/page.js`
- Modify: `src/app/annotation/audit/[id]/[episodeId]/page.js`
- Modify: `src/app/annotation/editor/[type]/page.js`
- Modify: `src/app/annotation/marketplace/page.js`
- Modify: `src/app/annotation/projects/page.js`
- Modify: `src/app/annotation/projects/create/page.js`
- Modify: `src/app/annotation/review-list/page.js`
- Modify: `src/app/annotation/stats/page.js`
- Modify: `src/app/collection/qa/page.js`
- Modify: `src/app/collection/qa/[instanceId]/page.js`
- Modify: `src/app/collection/qa/[instanceId]/[seqId]/page.js`

**Interfaces:**
- Consumes: all shared UI components; workspace pages use `.ui-workspace` and may keep multi-panel structure.
- Preserves: `annotationQaFlow.mjs` automatic QA package generation, idempotency, rework rounds and QA assignee persistence.

- [ ] **Step 1: 添加标注与质检契约测试**

Register the 15 files as migrated in `test_ui_page_conformance.mjs`. List pages must use `PageHeader` and `StatusTag`. Workspace pages must include `ui-workspace`; create pages must use `FormSection`. Add this exact existing behavior command to the task gate:

```bash
node tools/test_annotation_qa_flow.mjs
```

- [ ] **Step 2: 运行测试并确认 UI 断言失败、业务流测试通过**

Run:

```bash
node tools/test_ui_page_conformance.mjs
node tools/test_annotation_qa_flow.mjs
```

Expected: first command fails on missing UI contract; second prints `ANNOTATION_QA_FLOW_OK`.

- [ ] **Step 3: 迁移普通页面和创建页**

Use list/form/detail templates without renaming routes or data fields. Consolidate create/edit/config overlays into `AppModal`; leave full-screen annotation tasks as pages. Do not replace specialized canvas/video controls with generic forms.

- [ ] **Step 4: 迁移标注与质检工作台**

For the three largest audit/workspace files, keep their data and editor logic in place. Replace outer background, top task information, side-panel headers, toolbars, status tags, bottom actions and feedback containers with shared classes/components. Inline styles that encode coordinates, canvas sizes, timeline positions or media overlays remain local because they are functional geometry rather than design-system styling.

- [ ] **Step 5: 验证标注到质检链路与构建**

Run:

```bash
node tools/test_annotation_qa_flow.mjs
node tools/test_ui_page_conformance.mjs
npm run build
```

Expected: all pass.

Browser check:

- `/collection/annotation-tasks`
- `/collection/qa`
- one QA package detail route from the rendered list
- `/annotation/audit`
- one annotation audit detail and episode workspace route

Verify completed annotation tasks still create one QA package, the package can be assigned, and workspace save/submit/audit actions remain visible and distinct.

- [ ] **Step 6: 提交标注与质检页面**

```bash
git add src/app/annotation src/app/collection/qa tools/test_ui_page_conformance.mjs
git commit -m "feat: unify annotation and quality interfaces"
```

---

### Task 7: 迁移采集配置、设备与对象管理页面

**Files:**
- Modify: `src/app/collection/components/page.js`
- Modify: `src/app/collection/components/create/page.js`
- Modify: `src/app/collection/config/page.js`
- Modify: `src/app/collection/config/create/page.js`
- Modify: `src/app/collection/config/detail/[id]/page.js`
- Modify: `src/app/collection/device-types/page.js`
- Modify: `src/app/collection/device-types/add/page.js`
- Modify: `src/app/collection/device-types/detail/[id]/page.js`
- Modify: `src/app/collection/device-types/part-detail/[id]/page.js`
- Modify: `src/app/collection/devices/page.js`
- Modify: `src/app/collection/devices/detail/[id]/page.js`
- Modify: `src/app/collection/object-labels/page.js`
- Modify: `src/app/collection/objects/page.js`
- Modify: `src/app/collection/objects/create/page.js`

**Interfaces:**
- Consumes: list、form、detail shared templates.
- Preserves: existing configuration builders, object relations, device state and navigation.

- [ ] **Step 1: 将 14 个页面加入一致性断言并运行失败测试**

List pages require `PageHeader` and either `FilterPanel` or `TableToolbar`; create/add pages require `FormSection`; detail pages require `PageHeader` and `.ui-detail-grid`.

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL on the first page not yet migrated.

- [ ] **Step 2: 分类型迁移页面**

Migrate list pages first, then create/add forms, then detail pages. Convert visual status tags to `StatusTag`; keep visual editors and topology-specific layout local. Replace create/edit drawers with `AppModal` where the current flow is an overlay; retain standalone routes where they already exist.

- [ ] **Step 3: 验证设备和对象页面**

Run: `node tools/test_ui_page_conformance.mjs && npm run build`

Expected: passes.

Browser check `/collection/device-types`, `/collection/devices`, `/collection/objects`, `/collection/config` and one detail page. Verify filters do not wrap incorrectly at 1280px and tables scroll rather than clipping operations.

- [ ] **Step 4: 提交采集配置页面**

```bash
git add src/app/collection/components src/app/collection/config src/app/collection/device-types src/app/collection/devices src/app/collection/object-labels src/app/collection/objects tools/test_ui_page_conformance.mjs
git commit -m "feat: unify collection configuration interfaces"
```

---

### Task 8: 迁移采集执行与任务详情工作台

**Files:**
- Modify: `src/app/collection/collect-home/page.js`
- Modify: `src/app/collection/collect/page.js`
- Modify: `src/app/collection/collect/connection/[taskId]/page.js`
- Modify: `src/app/collection/collect/data/[taskId]/page.js`
- Modify: `src/app/collection/collect/detail/[taskId]/page.js`
- Modify: `src/app/collection/collect/status/[taskId]/page.js`
- Modify: `src/app/collection/collect/video/[taskId]/[episodeId]/page.js`
- Modify: `src/app/collection/collect/workspace/[taskId]/page.js`
- Modify: `src/app/collection/tasks/page.js`
- Modify: `src/app/collection/tasks/[id]/page.js`
- Modify: `src/app/collection/tasks/create/page.js`
- Modify: `src/app/collection/tasks/detail/[taskId]/page.js`

**Interfaces:**
- Consumes: shared page components and `.ui-workspace`.
- Preserves: collector-specific header mode, task assignment, collection connection, recording, upload, status and media controls.

- [ ] **Step 1: 添加采集工作台一致性断言**

Require `PageHeader` on normal list/form/detail pages and `ui-workspace` on connection, data, status, video and workspace pages. Exempt local inline styles for video surfaces, absolute overlays, progress geometry and device diagrams.

- [ ] **Step 2: 运行失败测试**

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL on the first unconverted collection workbench.

- [ ] **Step 3: 迁移普通任务页**

Apply list/form/detail templates to task list, create and detail pages. Preserve all query parameters and route transitions.

- [ ] **Step 4: 迁移采集工作台外壳**

Unify top bars, status chips, side panels, section headers and action buttons. Keep device connection, video, timeline and recording geometry unchanged. Collector pages may use compact navigation, but colors, controls and feedback must come from the shared theme.

- [ ] **Step 5: 验证采集流程**

Run: `node tools/test_ui_page_conformance.mjs && npm run build`

Expected: passes.

Browser check `/collection/collect-home`, `/collection/collect`, one task detail, connection, data, status and workspace route. Confirm the primary collection action remains obvious and no fixed footer covers content.

- [ ] **Step 6: 提交采集执行页面**

```bash
git add src/app/collection/collect-home src/app/collection/collect src/app/collection/tasks tools/test_ui_page_conformance.mjs
git commit -m "feat: unify collection execution workspaces"
```

---

### Task 9: 迁移数据资产、账号、项目与工作流页面

**Files:**
- Modify: `src/app/data/catalog/page.js`
- Modify: `src/app/data/datasets/page.js`
- Modify: `src/app/data/download/page.js`
- Modify: `src/app/data/raw/page.js`
- Modify: `src/app/data/reports/page.js`
- Modify: `src/app/accounts/list/page.js`
- Modify: `src/app/accounts/teams/page.js`
- Modify: `src/app/accounts/vendors/page.js`
- Modify: `src/app/projects/page.js`
- Modify: `src/app/workflow/list/page.js`
- Modify: `src/app/workflow/nodes/page.js`
- Modify: `src/app/workflow/tasks/page.js`

**Interfaces:**
- Consumes: shared list/detail/modal components.
- Preserves: charts may retain semantic extension colors; buttons and selected states must use primary blue.

- [ ] **Step 1: 添加辅助模块一致性断言并运行失败测试**

Require `PageHeader` on all 12 pages. Require `FilterPanel` and `TableToolbar` on data and account lists. Require `AppModal` wherever the current page creates or edits an item in an overlay.

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL on the first missing component.

- [ ] **Step 2: 迁移页面并收敛图表容器**

Apply standard page structure. Keep chart series colors when they encode separate data series, but remove purple from primary actions and selected navigation. Convert all generic create/edit/config `Modal` usages to `AppModal`; keep destructive confirmations as `Popconfirm` or `Modal.confirm`.

- [ ] **Step 3: 验证辅助模块**

Run: `node tools/test_ui_page_conformance.mjs && npm run build`

Expected: passes.

Browser check `/data/catalog`, `/data/reports`, `/accounts/list`, `/projects`, `/workflow/list`. Verify charts remain legible and dialog footers use consistent action ordering.

- [ ] **Step 4: 提交辅助模块**

```bash
git add src/app/data src/app/accounts src/app/projects src/app/workflow tools/test_ui_page_conformance.mjs
git commit -m "feat: unify data and administration interfaces"
```

---

### Task 10: 统一登录入口并完成全路由清理

**Files:**
- Modify: `src/app/login/page.js`
- Modify: `src/app/qa-login/page.js`
- Modify: `src/app/collector-login/page.js`
- Modify: `src/app/globals.css`
- Modify: `src/lib/uiRouteManifest.mjs`
- Modify: `tools/test_ui_page_conformance.mjs`

**Interfaces:**
- Consumes: global theme and form controls.
- Produces: three login入口共用一套输入、按钮、校验、主色和响应式规则。

- [ ] **Step 1: 添加登录页契约断言**

```js
for (const loginPage of [
  'src/app/login/page.js',
  'src/app/qa-login/page.js',
  'src/app/collector-login/page.js',
]) {
  const source = await readFile(loginPage, 'utf8');
  assert.equal(source.includes('<ConfigProvider'), false, `${loginPage} 不得创建私有主题`);
  assert.ok(source.includes('ui-login'), `${loginPage} 必须使用统一登录外壳`);
}
```

- [ ] **Step 2: 运行测试并确认私有主题导致失败**

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL because login pages still contain local `ConfigProvider` or lack `ui-login`.

- [ ] **Step 3: 迁移三类登录页**

Remove page-local theme providers and purple primary treatment. Retain portal-specific titles, descriptions, icons and login destinations. Use one responsive split layout at desktop width and a single centered form card on mobile. Preserve demo credentials and submit handlers without logging secrets.

- [ ] **Step 4: 清理重复全局样式**

Remove old login selectors, duplicate comments, superseded `.page-header`/`.search-form` overrides and unused custom gradients only after `rg` confirms no remaining consumer. Keep compatibility aliases still referenced by functional workbench geometry.

- [ ] **Step 5: 运行全量自动验证**

Run:

```bash
node tools/test_ui_theme.mjs
node tools/test_ui_components.mjs
node tools/test_ui_route_manifest.mjs
node tools/test_ui_page_conformance.mjs
node tools/test_annotation_task_create_model.mjs
node tools/test_annotation_task_create_page_copy.mjs
node tools/test_annotation_qa_flow.mjs
npm run build
```

Expected: every script exits 0 and prints its success marker; Next.js build exits 0 with all routes compiled.

- [ ] **Step 6: 完成浏览器回归矩阵**

At 1440x900 and 1920x1080, capture and inspect one route from each manifest type and every core module. At 1280x800, inspect one list, one long form and one workspace. Verify:

- no clipped primary action, overlapping field label or unreadable table column;
- modal remains within the viewport and scrolls internally;
- status colors match the single semantic mapping;
- loading, empty, no-result and error feedback use `StateView`;
- no create/edit drawer remains;
- annotation-to-QA and collection workspace actions still work.

- [ ] **Step 7: 检查工作区只包含预期变更**

Run: `git status --short` and `git diff --check`.

Expected: no whitespace errors; unrelated pre-existing user files remain untouched and unstaged.

- [ ] **Step 8: 提交登录和最终清理**

```bash
git add src/app/login/page.js src/app/qa-login/page.js src/app/collector-login/page.js src/app/globals.css src/lib/uiRouteManifest.mjs tools/test_ui_page_conformance.mjs
git commit -m "feat: complete unified UI migration"
```

---

## 最终验收证据

实施完成后交付以下证据：

1. 全量测试与 `npm run build` 的成功输出。
2. `UI_ROUTE_MANIFEST` 与实际 `page.js` 一致的检查结果。
3. 核心五个模块在 1440px 和 1920px 下的代表性截图。
4. 1280px 下列表、表单和工作台无阻断性布局问题的截图。
5. 数据标注完成后自动生成单一质检包、返工复用原质检包的回归结果。
6. 未覆盖或刻意保留的功能性内联样式清单，仅允许画布、视频、时间轴、坐标和设备图等几何样式。
