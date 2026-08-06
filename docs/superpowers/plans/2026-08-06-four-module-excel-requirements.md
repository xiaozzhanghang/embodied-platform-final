# Four-Module Excel Requirements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and visually verify one Excel workbook that documents the full-stack requirements for 数据采集、数据标注、标注工作台、模版中心 under a one-owner-per-module delivery model.

**Architecture:** A single JavaScript builder will contain the normalized requirement records, validate them before workbook creation, create six worksheets with a shared schema, add cross-sheet summary formulas and editable validations, render every sheet for visual QA, scan for formula errors, and export one final `.xlsx`. The reference workbook is read-only and is never overwritten.

**Tech Stack:** Bundled Node.js, `@oai/artifact-tool` 2.8.6+, Excel `.xlsx`, JavaScript ES modules.

## Global Constraints

- Source workbook: `/Users/zhangxiaozhang/Desktop/任务管理.xlsx`.
- Design spec: `docs/superpowers/specs/2026-08-06-excel-requirements-design.md`.
- Final workbook: `outputs/019fd4cf-a109-7030-b121-706b12ba373d/具身智能平台_四板块需求开发文档.xlsx`.
- Do not overwrite the source workbook.
- Use exactly six worksheets: `使用说明`, `开发总览`, `数据采集`, `数据标注`, `标注工作台`, `模版中心`.
- Use one owner role per module; do not recreate separate frontend/backend/platform owner columns.
- Default every requirement to `待开始` and `未测试`; visible prototype UI is not completion evidence.
- Use only the bundled runtime and `@oai/artifact-tool` for workbook authoring.
- Render and inspect every worksheet before delivery.

---

### Task 1: Build and validate the normalized requirement data

**Files:**
- Create: `tools/build_four_module_requirements.mjs`

**Interfaces:**
- Consumes: the approved module scope and field schema from the design spec.
- Produces: `MODULES`, `COLUMNS`, `requirementsByModule`, and `validateRequirements()` used by workbook creation.

- [ ] **Step 1: Create the shared schema and owner configuration**

Define the 22 column names in this exact order:

```js
const COLUMNS = [
  "需求ID", "一级板块", "页面/功能域", "功能点", "需求描述",
  "前端与交互要求", "后端/API与数据要求", "业务规则与状态流",
  "异常、权限与边界", "验收标准", "依赖项", "优先级", "模块负责人",
  "预估工时(h)", "已投入工时(h)", "开发阶段", "开始日期",
  "计划完成日期", "实际完成日期", "测试结果", "对应页面/原型", "备注",
];

const MODULES = [
  { name: "数据采集", prefix: "COL", owner: "数据采集负责人" },
  { name: "数据标注", prefix: "ANN", owner: "数据标注负责人" },
  { name: "标注工作台", prefix: "WB", owner: "标注工作台负责人" },
  { name: "模版中心", prefix: "TPL", owner: "模版中心负责人" },
];
```

- [ ] **Step 2: Add atomic requirement records for all four modules**

Use one record per independently testable function. Each record must contain all 22 fields. Populate the module arrays with these exact functional groups:

```text
数据采集: 列表检索, 状态页签, 列表操作, 双模式新建, 基础信息联动,
设备与采集参数, 外部数据关联, SOP导入, SOP编排, 任务详情统计,
分包新增编辑, 人员配给, 批量添加标注, 批量完成校验, 删除保护,
采集完成流转, 权限审计与刷新恢复

数据标注: 列表检索, 状态页签与进度, 列表操作, 批量人员分派,
关联采集数据新建, 基础信息联动, Episode筛选, 数量勾选双向联动,
标注类型与SOP, 任务详情与数据包, 人员与进度汇总, 冲突和权限保护

标注工作台: Episode明细列表, 多视角同步, 标注模式, 播放控制,
播放轴与红线游标解耦, 红线点击拖拽, 步骤卡片管理, 起止帧双向联动,
结构化与自然语言动作, 动作模版导入, 保存暂存与恢复, 标注模版生成,
标注模版复用, 快捷键连续作业, 完成和质检结论, 覆盖率错误帧与审计

模版中心: 三类模版页签, 搜索筛选与空状态, 任务模版卡片和详情,
任务模版新建编辑, 任务模版克隆删除和使用, 动作模版双模式,
动作步骤和帧推算, 标注模版生成来源, 标注模版预览复用删除,
引用保护与持久化验证
```

Each requirement must include concrete UI behavior, API/data behavior, state rules, failures/permissions, numbered acceptance criteria, dependencies, priority, owner, numeric estimate, default status, default test result, and a current project route.

- [ ] **Step 3: Add structural validation**

Implement `validateRequirements()` with Node assertions:

```js
function validateRequirements(requirementsByModule) {
  const seen = new Set();
  for (const module of MODULES) {
    const rows = requirementsByModule[module.name];
    assert.ok(Array.isArray(rows) && rows.length >= 10, `${module.name} rows missing`);
    rows.forEach((row, index) => {
      assert.equal(row.length, COLUMNS.length, `${module.name} row ${index + 1} column mismatch`);
      assert.match(row[0], new RegExp(`^${module.prefix}-\\d{3}$`));
      assert.equal(row[1], module.name);
      assert.equal(row[12], module.owner);
      assert.ok(["P0", "P1", "P2"].includes(row[11]));
      assert.equal(row[15], "待开始");
      assert.equal(row[19], "未测试");
      assert.ok(typeof row[13] === "number" && row[13] > 0);
      assert.ok(!seen.has(row[0]), `duplicate id ${row[0]}`);
      seen.add(row[0]);
    });
  }
}
```

- [ ] **Step 4: Run the data validation checkpoint**

Run:

```bash
/Users/zhangxiaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tools/build_four_module_requirements.mjs --validate-data
```

Expected output contains:

```text
DATA_VALIDATION_OK
```

### Task 2: Create the six-sheet workbook

**Files:**
- Modify: `tools/build_four_module_requirements.mjs`
- Create: `outputs/019fd4cf-a109-7030-b121-706b12ba373d/具身智能平台_四板块需求开发文档.xlsx`

**Interfaces:**
- Consumes: `MODULES`, `COLUMNS`, `requirementsByModule`, and `validateRequirements()` from Task 1.
- Produces: a six-sheet workbook with formulas, formatting, filters, validations, and conditional formatting.

- [ ] **Step 1: Create the workbook and all six worksheets before formulas**

Use:

```js
const workbook = Workbook.create();
const instructionsSheet = workbook.worksheets.add("使用说明");
const overviewSheet = workbook.worksheets.add("开发总览");
for (const module of MODULES) workbook.worksheets.add(module.name);
```

- [ ] **Step 2: Build the 使用说明 sheet**

Create a title band, purpose block, responsibility rules, field dictionary, development-stage flow, priority definitions, and test-result definitions. Set gridlines off, apply readable widths, wrap long descriptions, and freeze the title/header area.

- [ ] **Step 3: Build the four module requirement sheets**

For each module:

1. Write a merged title band and a short ownership note.
2. Write `COLUMNS` as the table header.
3. Write all module records beginning on row 5.
4. Add an Excel table with a unique name such as `CollectionRequirements`.
5. Freeze the header rows and first four columns.
6. Set widths by semantic group: short identifiers 12-18, descriptive fields 28-48, dates 13, owner/status 16-20.
7. Wrap text in descriptive columns and set compact but readable row heights.
8. Add list validation to priority, owner, development-stage, and test-result columns.
9. Add conditional formatting for P0/P1/P2, development stages, and test results.
10. Apply `yyyy-mm-dd`, `0.0`, and `0%` number formats where required.

- [ ] **Step 4: Build the 开发总览 sheet with formulas**

Use bounded ranges matching each module's populated rows. For each module row, write formulas equivalent to:

```excel
=COUNTA('数据采集'!$A$5:$A$21)
=COUNTIFS('数据采集'!$P$5:$P$21,"已完成",'数据采集'!$T$5:$T$21,"通过")
=COUNTIFS('数据采集'!$P$5:$P$21,"<>待开始",'数据采集'!$P$5:$P$21,"<>已完成",'数据采集'!$P$5:$P$21,"<>已阻塞")
=COUNTIF('数据采集'!$P$5:$P$21,"已阻塞")
=IF(C5=0,0,D5/C5)
=COUNTIF('数据采集'!$L$5:$L$21,"P0")
=COUNTIF('数据采集'!$L$5:$L$21,"P1")
=SUM('数据采集'!$N$5:$N$21)
=SUM('数据采集'!$O$5:$O$21)
```

Adjust each end row to the actual module record count. Apply percent and numeric formats. The current phase should be formula-driven from counts, and the risk/next-step field should explain that names and dates remain editable.

- [ ] **Step 5: Export the workbook**

Run the builder so it creates the output directory and exports exactly one final workbook.

Expected output contains:

```text
WORKBOOK_EXPORTED
```

### Task 3: Inspect formulas, values, and workbook structure

**Files:**
- Modify: `tools/build_four_module_requirements.mjs`
- Verify: `outputs/019fd4cf-a109-7030-b121-706b12ba373d/具身智能平台_四板块需求开发文档.xlsx`

**Interfaces:**
- Consumes: the exported workbook from Task 2.
- Produces: compact inspection evidence and six PNG previews in `/tmp/codex-four-module-excel-preview/`.

- [ ] **Step 1: Re-import the exported workbook and inspect sheet names**

Assert that sheet count is six and names match the required order.

- [ ] **Step 2: Inspect key ranges**

Inspect:

```text
使用说明!A1:H30
开发总览!A1:M10
数据采集!A1:V12
数据标注!A1:V12
标注工作台!A1:V12
模版中心!A1:V12
```

Check representative values and formulas, including every module's first and last requirement ID.

- [ ] **Step 3: Scan formula errors**

Use a regex scan for:

```text
#REF!|#DIV/0!|#VALUE!|#NAME\?|#N/A
```

Expected result: zero matches.

- [ ] **Step 4: Render all six worksheets**

Render each worksheet with `autoCrop: "all"`, `scale: 1`, and PNG output under `/tmp/codex-four-module-excel-preview/`.

Expected output contains:

```text
RENDERED 使用说明
RENDERED 开发总览
RENDERED 数据采集
RENDERED 数据标注
RENDERED 标注工作台
RENDERED 模版中心
```

### Task 4: Visual repair and final verification

**Files:**
- Modify: `tools/build_four_module_requirements.mjs` only if a visual defect is found.
- Verify: `outputs/019fd4cf-a109-7030-b121-706b12ba373d/具身智能平台_四板块需求开发文档.xlsx`

**Interfaces:**
- Consumes: six PNG previews and compact inspection output.
- Produces: the final verified workbook.

- [ ] **Step 1: Inspect every preview**

Reject and repair any preview with clipped headers, unreadable wrapped text, blank sheets, broken summary formulas, excessively tall rows, or content outside the visible used range.

- [ ] **Step 2: Rebuild after targeted fixes**

Patch only the affected widths, heights, fills, borders, wrapping, freeze panes, formulas, or validation ranges. Re-run the same builder instead of creating a second variant.

- [ ] **Step 3: Run final verification**

Run:

```bash
/Users/zhangxiaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tools/build_four_module_requirements.mjs
```

Expected final markers:

```text
DATA_VALIDATION_OK
WORKBOOK_EXPORTED
FORMULA_ERROR_COUNT 0
VISUAL_VERIFICATION_READY
```

- [ ] **Step 4: Confirm output scope**

Verify that the source workbook is unchanged and that only one final `.xlsx` exists in the requested output directory.
