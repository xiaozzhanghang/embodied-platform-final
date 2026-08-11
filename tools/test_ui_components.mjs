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
assert.match(statusSource, /'标注审核中':\s*'purple'/, '标注审核中应保留 purple 业务色');
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
  ['正常运行', 'success'],
  ['在线', 'success'],
  ['离线', 'error'],
  ['维护中', 'warning'],
  ['正常', 'success'],
  ['已连接', 'success'],
]) {
  assert.match(
    statusSource,
    new RegExp(`'${status}':\\s*'${semantic}'`),
    `${status} 应使用 ${semantic} 状态色`,
  );
}
for (const status of ['运行中', '已认证']) {
  assert.doesNotMatch(
    statusSource,
    new RegExp(`'${status}':\\s*'`),
    `${status} 的颜色语义依赖业务上下文，不应写入全局状态映射`,
  );
}
assert.match(statusSource, /className=\{mergeClassNames\('ui-status-tag', className\)\}/);
assert.match(statusSource, /rootClassName=\{mergeClassNames\('ui-status-tag', rootClassName\)\}/);
assert.match(statusSource, /\{children \?\? status\}/, 'children={0} 必须保留 0，而不是回退到 status');
assert.doesNotMatch(statusSource, /\{children \|\| status\}/, '状态标签不得把 0 或空字符串误判为空值');

const modalSource = await readFile('src/components/ui/AppModal.js', 'utf8');
assert.ok(modalSource.includes('520'));
assert.ok(modalSource.includes('720'));
assert.ok(modalSource.includes('960'));
assert.ok(modalSource.includes('centered'));
assert.match(
  modalSource,
  /const DEFAULT_MODAL_STYLES = \{\s*body: \{\s*maxHeight: 'calc\(100vh - 220px\)',\s*overflowY: 'auto',\s*\},\s*\};/,
  'AppModal 默认应限制内容区高度并仅滚动 body',
);
assert.match(
  modalSource,
  /const mergeModalStyles = \(styles\) => \{[\s\S]*?if \(typeof styles === 'function'\) \{[\s\S]*?return \(\.\.\.args\) => mergeModalStyleObject\(styles\(\.\.\.args\)\);[\s\S]*?\}[\s\S]*?return mergeModalStyleObject\(styles\);[\s\S]*?\};/,
  'AppModal 必须兼容 object 与 function 两种 styles，并合并默认 body 样式',
);
assert.match(
  modalSource,
  /body: \{\s*\.\.\.DEFAULT_MODAL_STYLES\.body,\s*\.\.\.\(styles\?\.body \|\| \{\}\),\s*\}/,
  '调用方 body 样式应覆盖默认值，其他 semantic styles 应保留',
);
assert.match(modalSource, /width,\s*styles,/, 'AppModal 应显式接收 width 与 styles');
assert.match(modalSource, /centered\s+width=\{width \?\? MODAL_WIDTHS\[widthSize\] \?\? MODAL_WIDTHS\.medium\}/, '显式 width 应优先于 widthSize');
assert.match(modalSource, /styles=\{mergeModalStyles\(styles\)\}/, '合并后的 semantic styles 必须传递给 Modal');
assert.match(modalSource, /className=\{mergeClassNames\('ui-app-modal', className\)\}/);
assert.match(modalSource, /rootClassName=\{mergeClassNames\('ui-app-modal', rootClassName\)\}/);

const filterSource = await readFile('src/components/ui/FilterPanel.js', 'utf8');
assert.match(filterSource, /const isExpanded = !collapsible \|\| expanded;/);
assert.match(filterSource, /\{isExpanded \? children : null\}/);

const stateSource = await readFile('src/components/ui/StateView.js', 'utf8');
assert.match(stateSource, /title \|\| defaults\.title/);
assert.match(stateSource, /description \|\| defaults\.description/);

const designSource = await readFile('docs/superpowers/specs/2026-08-10-ui-system-unification-design.md', 'utf8');
assert.ok(designSource.endsWith('\n'), '设计说明文件必须以换行结尾');
assert.ok(!designSource.endsWith('\n\n'), '设计说明文件 EOF 不得保留多余空行');
console.log('UI_COMPONENTS_OK');
