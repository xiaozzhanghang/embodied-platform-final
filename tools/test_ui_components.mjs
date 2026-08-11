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
assert.match(statusSource, /'已发布':\s*'success'/, '已发布应使用 success 状态色');
assert.match(statusSource, /'审核中':\s*'processing'/, '审核中应使用 processing 状态色');
assert.match(statusSource, /'机检通过':\s*'success'/, '机检通过迁移到 StatusTag 后应保留 success 状态色');
assert.match(statusSource, /'已标注':\s*'success'/, '已标注应使用 success 状态色');
for (const [status, semantic] of [
  ['质检中', 'processing'],
  ['已通过', 'success'],
  ['未通过', 'error'],
  ['标注中', 'processing'],
  ['待校验', 'warning'],
  ['校验中', 'processing'],
  ['可领取', 'processing'],
  ['即将完成', 'warning'],
  ['已结算', 'success'],
  ['待结算', 'warning'],
  ['待标注', 'warning'],
  ['暂停', 'default'],
  ['待分配', 'warning'],
  ['已领满', 'default'],
]) {
  assert.match(
    statusSource,
    new RegExp(`'${status}':\\s*'${semantic}'`),
    `${status} 应使用 ${semantic} 状态色`,
  );
}
assert.match(statusSource, /className=\{mergeClassNames\('ui-status-tag', className\)\}/);
assert.match(statusSource, /rootClassName=\{mergeClassNames\('ui-status-tag', rootClassName\)\}/);

const modalSource = await readFile('src/components/ui/AppModal.js', 'utf8');
assert.ok(modalSource.includes('520'));
assert.ok(modalSource.includes('720'));
assert.ok(modalSource.includes('960'));
assert.ok(modalSource.includes('centered'));
assert.match(modalSource, /<Modal \{\.\.\.modalProps\} centered width=/);
assert.match(modalSource, /className=\{mergeClassNames\('ui-app-modal', className\)\}/);
assert.match(modalSource, /rootClassName=\{mergeClassNames\('ui-app-modal', rootClassName\)\}/);

const filterSource = await readFile('src/components/ui/FilterPanel.js', 'utf8');
assert.match(filterSource, /const isExpanded = !collapsible \|\| expanded;/);
assert.match(filterSource, /\{isExpanded \? children : null\}/);

const stateSource = await readFile('src/components/ui/StateView.js', 'utf8');
assert.match(stateSource, /title \|\| defaults\.title/);
assert.match(stateSource, /description \|\| defaults\.description/);
console.log('UI_COMPONENTS_OK');
