# Embodied Data Flowchart Redraw Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an editable SVG and a 1440 × 2000 PNG that accurately redraw the supplied embodied-data collection, quality-inspection, annotation, and audit flowchart.

**Architecture:** Author the diagram deterministically as native SVG so every Chinese label remains exact and editable. Use the already-installed `sharp` package only to rasterize the finished SVG, and use a Node assertion script to validate dimensions, required labels, node identities, and branch routes.

**Tech Stack:** SVG 1.1, Node.js ES modules, Sharp, `node:assert`

## Global Constraints

- Preserve every business label, decision branch, and return path from the approved design.
- Preserve the portrait 18:25 layout, blue step nodes, purple decision diamonds, orange start/end nodes, and low-contrast grid background.
- Do not overwrite or edit `/Users/zhangxiaozhang/Desktop/embodied_flowchart_qa_audit_rules_1786953788281.jpg`.
- Keep SVG text as live text using `PingFang SC`, `Microsoft YaHei`, `Noto Sans CJK SC`, and sans-serif fallbacks.
- Save outputs as `output/flowcharts/embodied-data-flowchart-redraw.svg` and `output/flowcharts/embodied-data-flowchart-redraw.png`.

---

### Task 1: Draw and verify the flowchart

**Files:**
- Create: `tools/test_embodied_flowchart_redraw.mjs`
- Create: `output/flowcharts/embodied-data-flowchart-redraw.svg`
- Create: `output/flowcharts/embodied-data-flowchart-redraw.png`

**Interfaces:**
- Consumes: the approved copy and layout in `docs/superpowers/specs/2026-08-17-embodied-data-flowchart-redraw-design.md`
- Produces: an editable 1440 × 2000 SVG and a raster PNG with identical content

- [ ] **Step 1: Write the failing artifact contract**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svgPath = 'output/flowcharts/embodied-data-flowchart-redraw.svg';
const pngPath = 'output/flowcharts/embodied-data-flowchart-redraw.png';
const svg = await readFile(svgPath, 'utf8');

assert.match(svg, /<svg[^>]+width="1440"[^>]+height="2000"/);
for (const id of [
  'start', 'create-collection-task', 'collection-type-decision',
  'collection-package', 'asset-package', 'collector-entry', 'auto-submit',
  'qa-center', 'qa-decision', 'qa-reject', 'qualified-pool',
  'create-annotation-task', 'annotation-workbench', 'annotation-submit',
  'audit-decision', 'audit-reject', 'audit-pass', 'archive',
]) assert.match(svg, new RegExp(`id="${id}"`), `缺少节点 ${id}`);

for (const text of [
  '开始：具身数据采集需求', '新建数据采集任务', '任务类型是否为采集计划？',
  '配置分包数量 + 分配采集员与质检员', '配置分包数量 + 分配质检员',
  '采集员录入并完成数据采集', '分包数据自动打包并送检', '数据质检中心',
  '质检是否通过？', '标记为【未通过】标签', '流程终止/无需重采',
  '标记合格 · 进入待标注数据池', '新建数据标注任务', '指派标注员+审核员',
  '下发至标注工作台', '标注员完成标注并提交', '数据审核是否通过？',
  '弹窗填写不通过理由', '打回重新标注', '审核通过 · 验收合格',
  '高质量具身数据集正式归档入库',
]) assert.ok(svg.includes(text), `缺少文案：${text}`);

for (const edge of ['edge-collection-yes', 'edge-collection-no', 'edge-qa-no', 'edge-qa-yes', 'edge-audit-no', 'edge-audit-return', 'edge-audit-yes']) {
  assert.match(svg, new RegExp(`id="${edge}"`), `缺少连线 ${edge}`);
}

const png = await sharp(pngPath).metadata();
assert.equal(png.width, 1440);
assert.equal(png.height, 2000);
assert.equal(png.format, 'png');
console.log('EMBODIED_FLOWCHART_REDRAW_OK');
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node tools/test_embodied_flowchart_redraw.mjs`

Expected: FAIL with `ENOENT` for `output/flowcharts/embodied-data-flowchart-redraw.svg`.

- [ ] **Step 3: Author the SVG using the approved coordinate map**

Create a `1440 × 2000` SVG with `viewBox="0 0 1440 2000"`, a 20-pixel minor grid and 100-pixel major grid, reusable arrow marker and shadow filter. Use these exact node bounds, where `(x, y, width, height)` is in SVG pixels:

| id | shape | bounds |
|---|---|---|
| `start` | capsule | `410,55,620,82` |
| `create-collection-task` | rectangle | `425,180,590,72` |
| `collection-type-decision` | diamond | center `720,365`, radii `300,95` |
| `collection-package` | rectangle | `110,500,565,104` |
| `asset-package` | rectangle | `800,500,530,104` |
| `collector-entry` | rectangle | `110,655,565,72` |
| `auto-submit` | rectangle | `430,805,580,72` |
| `qa-center` | rectangle | `530,930,380,72` |
| `qa-decision` | diamond | center `720,1110`, radii `240,82` |
| `qa-reject` | rectangle | `70,1050,450,110` |
| `qualified-pool` | rectangle | `410,1230,620,72` |
| `create-annotation-task` | rectangle | `430,1350,580,104` |
| `annotation-workbench` | rectangle | `500,1500,440,72` |
| `annotation-submit` | rectangle | `430,1620,580,72` |
| `audit-decision` | diamond | center `720,1790`, radii `270,85` |
| `audit-reject` | parallelogram | `70,1715,430,110` |
| `audit-pass` | rectangle | `480,1905,480,72` |
| `archive` | capsule | `390,2025,660,82` |

Scale the vertical coordinate map uniformly to fit the 2000-pixel canvas while retaining 50-pixel top and bottom margins; this maps the listed design height of 2157 to the output height without changing horizontal coordinates. Draw main-flow connectors first, then branch connectors, so node fills remain visually clean. Use `#0874d1`/`#005fb8` blue gradients, `#7d92ea`/`#6478d5` purple gradients, `#ff765d`/`#f46045` orange gradients, `#151515` connector lines, and `#ffffff` node text.

- [ ] **Step 4: Rasterize the SVG**

Run:

```bash
node -e "import('sharp').then(({default:sharp}) => sharp('output/flowcharts/embodied-data-flowchart-redraw.svg', {density: 144}).resize(1440, 2000, {fit:'fill'}).png().toFile('output/flowcharts/embodied-data-flowchart-redraw.png'))"
```

Expected: `output/flowcharts/embodied-data-flowchart-redraw.png` exists and is 1440 × 2000.

- [ ] **Step 5: Run automated and visual verification**

Run: `node tools/test_embodied_flowchart_redraw.mjs`

Expected: `EMBODIED_FLOWCHART_REDRAW_OK`.

Run: `git diff --check`

Expected: exit code 0.

Inspect the PNG at full frame and confirm: all 18 nodes are visible; no text clips; the collection, QA, and audit branches point in the correct direction; and the audit rejection return line reconnects to `下发至标注工作台`.

- [ ] **Step 6: Commit the artifacts**

```bash
git add docs/superpowers/plans/2026-08-17-embodied-data-flowchart-redraw.md \
  tools/test_embodied_flowchart_redraw.mjs \
  output/flowcharts/embodied-data-flowchart-redraw.svg \
  output/flowcharts/embodied-data-flowchart-redraw.png
git commit -m "feat: redraw embodied data flowchart"
```
