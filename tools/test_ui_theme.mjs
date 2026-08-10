import assert from 'node:assert/strict';
import { antdTheme } from '../src/theme/antdTheme.js';

assert.equal(antdTheme.token.colorPrimary, '#1677ff');
assert.equal(antdTheme.token.colorBgLayout, '#f5f7fa');
assert.equal(antdTheme.token.colorBgContainer, '#ffffff');
assert.equal(antdTheme.token.borderRadius, 8);
assert.equal(antdTheme.token.controlHeight, 32);
assert.equal(antdTheme.components.Table.headerBg, '#fafafa');
assert.equal(antdTheme.components.Table.cellPaddingBlock, 12);
assert.equal(antdTheme.components.Modal.titleFontSize, 16);
console.log('UI_THEME_OK');
