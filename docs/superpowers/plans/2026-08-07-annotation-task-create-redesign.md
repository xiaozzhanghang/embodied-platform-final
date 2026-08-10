# 新建标注任务页面改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重做新建标注任务页面，使采集任务和模板都不再成为创建任务的强制依赖。

**Architecture:** 将纯业务状态与展示数据抽到 `annotationTaskCreateModel.mjs`，页面组件负责 Ant Design 表单、筛选和选择交互。通过 Node 测试验证默认模式、筛选行为和发布资格，再在 Next.js 页面中接入。

**Tech Stack:** Next.js 16、React 19、Ant Design 6、Node.js 内置测试断言

## Global Constraints

- 不新增依赖。
- 不修改其它业务页面。
- 保留现有路由 `/collection/annotation-tasks/create`。
- 动作模板和标注样例模板均为选填。
- 数据来源筛选不得强制先选择采集任务。

---

### Task 1: 创建页面业务模型

**Files:**
- Create: `src/lib/annotationTaskCreateModel.mjs`
- Create: `tools/test_annotation_task_create_model.mjs`

**Interfaces:**
- Produces: `filterEpisodes(episodes, filters)`、`getTemplateField(mode)`、`canPublishTask(state)`。

- [ ] **Step 1: Write the failing test**

测试以下行为：空筛选返回全部数据；资产来源不需要采集任务；不同模板模式返回对应字段；发布资格只依赖名称、类型和数据选择。

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/test_annotation_task_create_model.mjs`

Expected: FAIL，因为 `src/lib/annotationTaskCreateModel.mjs` 尚不存在。

- [ ] **Step 3: Write minimal implementation**

实现三个无副作用函数，保持页面逻辑可独立测试。

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/test_annotation_task_create_model.mjs`

Expected: 输出 `annotation task create model: all checks passed`，退出码为 0。

### Task 2: 重做页面

**Files:**
- Modify: `src/app/collection/annotation-tasks/create/page.js`

**Interfaces:**
- Consumes: `filterEpisodes`、`getTemplateField`、`canPublishTask`。

- [ ] **Step 1: Implement page sections**

实现任务信息、可标注数据池、可选加速配置和底部发布栏；数据筛选默认不设条件，模板默认无模板。

- [ ] **Step 2: Wire interactions**

来源类型、场景和关键词筛选更新 Episode 表；模板卡片控制对应选择框；表格复选框控制发布按钮状态。

- [ ] **Step 3: Run focused model test**

Run: `node tools/test_annotation_task_create_model.mjs`

Expected: PASS。

### Task 3: 构建和视觉验证

**Files:**
- Verify: `src/app/collection/annotation-tasks/create/page.js`

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: Next.js build exits with code 0。

- [ ] **Step 2: Open the page and verify interactions**

访问 `http://localhost:3000/collection/annotation-tasks/create`，确认默认无模板、切换模板模式和表格选择均正常。

- [ ] **Step 3: Capture the reviewed page**

保存一张完整页面截图并在交付前检查布局和文案。
