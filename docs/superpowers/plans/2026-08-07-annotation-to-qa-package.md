# 标注完成自动生成质检包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 标注任务全部完成后自动、幂等地生成关联质检包，并在标注任务与数据质检页面形成可见、可跳转、可刷新恢复的闭环。

**Architecture:** 新增一个与 React 解耦的纯 JavaScript 流程模块，负责质检包创建、版本轮次、存取和质检员更新。标注任务页负责触发同步和展示关联结果，数据质检页负责读取并合并自动生成的记录。

**Tech Stack:** Next.js 16 App Router、React 19、Ant Design 6、浏览器 localStorage、Node.js 内置测试运行器。

## Global Constraints

- 同一标注任务只有一个稳定质检包ID。
- 同一标注版本重复同步必须幂等。
- 更高标注版本沿用原质检包并新增轮次。
- 未完成标注任务不得生成质检包。
- 现有演示数据和页面结构必须保留。

---

### Task 1: 质检包流程模块

**Files:**
- Create: `src/lib/annotationQaFlow.mjs`
- Create: `tools/test_annotation_qa_flow.mjs`

**Interfaces:**
- Produces: `loadQaPackages(storage)`、`syncCompletedAnnotationTasks(storage, tasks, options)`、`assignQaer(storage, qaPackageId, qaer)`。

- [ ] **Step 1: Write the failing test**

测试未完成不生成、完成后生成、相同版本幂等、新版本新增轮次、质检员分配持久化。

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/test_annotation_qa_flow.mjs`

Expected: FAIL because `src/lib/annotationQaFlow.mjs` does not exist.

- [ ] **Step 3: Write minimal implementation**

实现稳定ID、输入校验、localStorage安全读写、创建/更新轮次和质检员更新。

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/test_annotation_qa_flow.mjs`

Expected: `ANNOTATION_QA_FLOW_OK` and exit code 0.

### Task 2: 标注任务页面触发和反馈

**Files:**
- Modify: `src/app/collection/annotation-tasks/page.js`

**Interfaces:**
- Consumes: `syncCompletedAnnotationTasks(storage, tasks)`。
- Produces: “质检包”列、自动生成提示和“查看质检”入口。

- [ ] **Step 1: Add a source-level failing integration assertion**

在测试中读取页面源文件，断言页面调用同步函数并渲染质检包入口。

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/test_annotation_qa_flow.mjs`

Expected: FAIL because page integration is missing.

- [ ] **Step 3: Implement page integration**

页面挂载时同步全部完成任务，并将任务ID映射到质检包；首次创建时提示，重复进入不提示。

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/test_annotation_qa_flow.mjs`

Expected: `ANNOTATION_QA_FLOW_OK`.

### Task 3: 数据质检列表读取自动生成记录

**Files:**
- Modify: `src/app/collection/qa/page.js`

**Interfaces:**
- Consumes: `loadQaPackages(storage)`、`assignQaer(storage, qaPackageId, qaer)`。
- Produces: 自动生成记录置顶、质检员分配刷新持久化。

- [ ] **Step 1: Add a source-level failing integration assertion**

断言质检页加载本地质检包并在分配质检员时写回存储。

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/test_annotation_qa_flow.mjs`

Expected: FAIL because QA page integration is missing.

- [ ] **Step 3: Implement QA list integration**

页面挂载时合并自动生成记录与演示数据，按质检包ID去重；重新分配质检员后更新本地存储。

- [ ] **Step 4: Run unit test and production build**

Run: `node tools/test_annotation_qa_flow.mjs && npm run build`

Expected: test prints `ANNOTATION_QA_FLOW_OK`; Next.js build exits 0.

### Task 4: 本地页面闭环验证

**Files:**
- No source changes expected.

**Interfaces:**
- Verifies: 标注任务页自动生成、质检列表显示、详情可进入、刷新可恢复。

- [ ] **Step 1: Start the existing development server**

Run: `npm run dev`

Expected: local server is available on port 3000.

- [ ] **Step 2: Verify annotation task page**

Open `/collection/annotation-tasks`; confirm the completed task shows a `QA-ANNO-...` package and “查看质检”.

- [ ] **Step 3: Verify QA list and refresh persistence**

Open `/collection/qa`; confirm the same package appears at the top as “待质检”, assign a QAer, refresh, and confirm the assignment remains.

- [ ] **Step 4: Re-run final checks**

Run: `node tools/test_annotation_qa_flow.mjs && npm run build`

Expected: all commands exit 0 with no new build errors.
