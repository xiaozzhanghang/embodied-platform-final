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
assert.match(modalSource, /<Modal \{\.\.\.modalProps\} centered width=/);

const stateSource = await readFile('src/components/ui/StateView.js', 'utf8');
assert.match(stateSource, /title \|\| defaults\.title/);
assert.match(stateSource, /description \|\| defaults\.description/);
console.log('UI_COMPONENTS_OK');
