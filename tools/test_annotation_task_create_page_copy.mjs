import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageSource = await readFile(
  new URL('../src/app/collection/annotation-tasks/create/page.js', import.meta.url),
  'utf8',
);

assert.equal(pageSource.includes('<Segmented'), false, '统一数据池页面不应再显示原始来源切换条');
assert.equal(pageSource.includes('<Tabs'), false, '统一数据池页面不应再显示原始来源标签页');
assert.equal(pageSource.includes('const [sourceType'), false, '页面不应再维护来源类型筛选状态');
assert.equal(pageSource.includes('原始来源名称'), true, '表格应继续保留原始来源追溯字段');
assert.equal(
  pageSource.includes("publishable ? '任务已具备发布条件' : '请完善必填信息并至少选择一条 Episode'"),
  true,
  '页脚资格文案必须与 publishable 状态一致',
);
assert.equal(pageSource.includes('disabled={!publishable}'), true, '发布按钮必须与 publishable 状态一致');

console.log('annotation task create page copy: all checks passed');
