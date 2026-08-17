import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svgPath = 'output/flowcharts/embodied-data-flowchart-redraw.svg';
const pngPath = 'output/flowcharts/embodied-data-flowchart-redraw.png';
const svg = await readFile(svgPath, 'utf8');

assert.match(svg, /<svg[^>]+width="1440"[^>]+height="2000"/);

for (const id of [
  'start',
  'create-collection-task',
  'collection-type-decision',
  'collection-package',
  'asset-package',
  'collector-entry',
  'auto-submit',
  'qa-center',
  'qa-decision',
  'qa-reject',
  'qualified-pool',
  'create-annotation-task',
  'annotation-workbench',
  'annotation-submit',
  'audit-decision',
  'audit-reject',
  'audit-pass',
  'archive',
]) {
  assert.match(svg, new RegExp(`id="${id}"`), `缺少节点 ${id}`);
}

for (const text of [
  '开始：具身数据采集需求',
  '新建数据采集任务',
  '任务类型是否为采集计划？',
  '配置分包数量 + 分配采集员与质检员',
  '配置分包数量 + 分配质检员',
  '采集员录入并完成数据采集',
  '分包数据自动打包并送检',
  '数据质检中心',
  '质检是否通过？',
  '标记为【未通过】标签',
  '流程终止/无需重采',
  '标记合格 · 进入待标注数据池',
  '新建数据标注任务',
  '指派标注员+审核员',
  '下发至标注工作台',
  '标注员完成标注并提交',
  '数据审核是否通过？',
  '弹窗填写不通过理由',
  '打回重新标注',
  '审核通过 · 验收合格',
  '高质量具身数据集正式归档入库',
]) {
  assert.ok(svg.includes(text), `缺少文案：${text}`);
}

for (const edge of [
  'edge-collection-yes',
  'edge-collection-no',
  'edge-qa-no',
  'edge-qa-yes',
  'edge-audit-no',
  'edge-audit-return',
  'edge-audit-yes',
]) {
  assert.match(svg, new RegExp(`id="${edge}"`), `缺少连线 ${edge}`);
}

const png = await sharp(pngPath).metadata();
assert.equal(png.width, 1440);
assert.equal(png.height, 2000);
assert.equal(png.format, 'png');

console.log('EMBODIED_FLOWCHART_REDRAW_OK');
