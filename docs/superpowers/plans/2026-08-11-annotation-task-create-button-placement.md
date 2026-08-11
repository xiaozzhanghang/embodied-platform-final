# Annotation Task Create Button Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the “新建任务” primary action from the annotation-task page header into the list toolbar, immediately before “批量分派标注员”.

**Architecture:** Keep the existing route and click handler unchanged. Enforce the placement with a source-level page conformance test scoped to the annotation-task page's `PageHeader` and `TableToolbar` blocks.

**Tech Stack:** Next.js 16, React, Ant Design 6, Node.js assertion-based contract tests

## Global Constraints

- Preserve the button copy, primary style, icon, and route `/collection/annotation-tasks/create`.
- Place the create action immediately before the batch assignment action.
- Do not change filtering, selection, assignment, or task data behavior.

---

### Task 1: Move the annotation-task create action

**Files:**
- Modify: `src/app/collection/annotation-tasks/page.js`
- Test: `tools/test_ui_page_conformance.mjs`

**Interfaces:**
- Consumes: `router.push('/collection/annotation-tasks/create')` and `TableToolbar.actions`
- Produces: A primary `create` action immediately followed by the existing `assign` action

- [ ] **Step 1: Write the failing placement test**

```js
const annotationTaskList = await readFile('src/app/collection/annotation-tasks/page.js', 'utf8');
const annotationTaskHeader = annotationTaskList.slice(
  annotationTaskList.indexOf('<PageHeader'),
  annotationTaskList.indexOf('<SpecMarker'),
);
const annotationTaskToolbar = annotationTaskList.slice(
  annotationTaskList.indexOf('<TableToolbar'),
  annotationTaskList.indexOf('<Table\n'),
);
assert.doesNotMatch(annotationTaskHeader, /新建任务/, '标注任务新建入口不应继续占用页头操作区');
assert.match(
  annotationTaskToolbar,
  /key="create"[\s\S]*?新建任务[\s\S]*?key="assign"[\s\S]*?批量分派标注员/,
  '标注任务新建入口应位于批量分派标注员之前',
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tools/test_ui_page_conformance.mjs`

Expected: FAIL with `标注任务新建入口不应继续占用页头操作区`.

- [ ] **Step 3: Move the existing button into the toolbar**

```jsx
<PageHeader
  title="标注任务"
  description="统一管理标注进度、人员分派与质检交付。"
  breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '任务中心' }, { title: '标注任务' }]}
/>

<TableToolbar
  count={filteredData.length}
  selectedCount={selectedRowKeys.length}
  actions={[
    <Button
      key="create"
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => router.push('/collection/annotation-tasks/create')}
    >
      新建任务
    </Button>,
    <Button key="assign">批量分派标注员</Button>,
  ]}
/>
```

- [ ] **Step 4: Run focused and regression verification**

Run: `node tools/test_ui_page_conformance.mjs`

Expected: `UI_PAGE_CONFORMANCE_OK`.

Run: `node tools/test_ui_components.mjs`

Expected: `UI_COMPONENTS_OK`.

Run: `npm run build`

Expected: build succeeds and all static routes generate.

- [ ] **Step 5: Commit the scoped change**

```bash
git add docs/superpowers/plans/2026-08-11-annotation-task-create-button-placement.md \
  src/app/collection/annotation-tasks/page.js \
  tools/test_ui_page_conformance.mjs
git commit -m "fix: move annotation create action into list toolbar"
```
