import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveStatusSemantic } from '../src/lib/statusSemantics.mjs';

const exportsSource = await readFile('src/components/ui/index.js', 'utf8');
for (const name of [
  'PageHeader', 'FilterPanel', 'TableToolbar', 'StatusTag',
  'FormSection', 'ActionFooter', 'AppModal', 'StateView',
]) assert.match(exportsSource, new RegExp(`export \\{ default as ${name} \\}`));

const statusSource = await readFile('src/components/ui/StatusTag.js', 'utf8');
for (const [status, semantic] of [
  ['采集中', 'processing'],
  ['处理中', 'processing'],
  ['标注审核中', 'processing'],
  ['质检中', 'processing'],
  ['审核中', 'processing'],
  ['待采集', 'warning'],
  ['已通过', 'success'],
  ['完成', 'success'],
  ['通过', 'success'],
  ['未通过', 'error'],
  ['失败', 'error'],
  ['驳回', 'error'],
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
  ['采集完成', 'success'],
  ['已认证', 'success'],
  ['取消', 'default'],
  ['已取消', 'default'],
]) {
  assert.equal(resolveStatusSemantic(status), semantic, `${status} 应使用 ${semantic} 状态色`);
}
for (const status of ['运行中']) {
  assert.equal(resolveStatusSemantic(status), 'default', `${status} 的未知全局语义应回退为 default`);
}
assert.match(statusSource, /import \{ resolveStatusSemantic \} from ['"]@\/lib\/statusSemantics\.mjs['"]/);
assert.match(statusSource, /color=\{resolveStatusSemantic\(status\)\}/, 'StatusTag 必须通过单一语义适配层解析颜色');
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
assert.doesNotMatch(modalSource, /dirty\s*=\s*false/, '省略 dirty 必须开启自动脏状态保护，不得默认为 false');
assert.match(modalSource, /const autoDirtyEnabled = dirty === undefined;/, 'dirty undefined 必须显式开启自动保护');
assert.match(
  modalSource,
  /const effectiveDirty = autoDirtyEnabled \? autoDirty : dirty;/,
  'dirty={false} 必须明确覆盖内部 autoDirty，以关闭自动保护',
);
for (const selector of [
  '.ant-select:not(.ant-select-disabled)',
  '.ant-picker:not(.ant-picker-disabled)',
  '.ant-checkbox-wrapper:not(.ant-checkbox-wrapper-disabled)',
  '.ant-radio-wrapper:not(.ant-radio-wrapper-disabled)',
  '.ant-upload:not(.ant-upload-disabled)',
  '.ant-input-number:not(.ant-input-number-disabled)',
]) {
  assert.ok(modalSource.includes(`'${selector}'`), `AppModal 缺少可编辑控件选择器 ${selector}`);
}
assert.match(
  modalSource,
  /const markAutoDirtyFromInput = \(event\) => \{\s*if \(autoDirtyEnabled && event\.target\?\.matches\?\.\(EDITABLE_NATIVE_SELECTOR\)\) \{\s*setAutoDirty\(true\);\s*\}\s*\};/,
  'input/change capture 必须仅在真实可编辑原生控件上标脏',
);
assert.match(
  modalSource,
  /const markAutoDirtyFromClick = \(event\) => \{\s*if \(autoDirtyEnabled && event\.target\?\.closest\?\.\(EDITABLE_ANT_CLICK_SELECTOR\)\) \{\s*setAutoDirty\(true\);\s*\}\s*\};/,
  'Ant Select/DatePicker/checkbox/radio/upload/input-number 必须通过 modalRender 内的精确点击选择器标脏',
);
assert.match(
  modalSource,
  /useEffect\(\(\) => \{\s*setAutoDirty\(false\);\s*\}, \[open\]\);/,
  '打开或真正关闭弹窗时必须重置内部脏状态',
);
assert.match(
  modalSource,
  /onOk: \(\) => \{\s*setAutoDirty\(false\);\s*onCancel\?\.\(event\);\s*\},/,
  '确认放弃后必须重置内部脏状态再执行调用方关闭',
);
assert.match(
  modalSource,
  /const renderedModal = modalRender \? modalRender\(modalNode\) : modalNode;/,
  '内部 modalRender 必须保留并调用调用方 modalRender',
);
assert.match(modalSource, /onInputCapture=\{markAutoDirtyFromInput\}/, 'AppModal 必须捕获原生 input 交互');
assert.match(modalSource, /onChangeCapture=\{markAutoDirtyFromInput\}/, 'AppModal 必须捕获原生 change 交互');
assert.match(modalSource, /onClickCapture=\{markAutoDirtyFromClick\}/, 'AppModal 必须捕获 Ant 编辑控件点击');
assert.match(modalSource, /if \(!effectiveDirty\) \{\s*onCancel\?\.\(event\);\s*return;\s*\}/, '未交互的只读 AppModal 应直接关闭');

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
