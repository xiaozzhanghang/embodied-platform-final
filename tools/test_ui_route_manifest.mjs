import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { UI_ROUTE_MANIFEST } from '../src/lib/uiRouteManifest.mjs';

async function findPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return findPages(target);
    return entry.name === 'page.js' ? [target.replaceAll('\\\\', '/')] : [];
  }));
  return nested.flat();
}

const discovered = (await findPages('src/app')).sort();
const registered = UI_ROUTE_MANIFEST.map(({ path: pagePath }) => pagePath).sort();
assert.deepEqual(registered, discovered, '每个 page.js 必须登记页面类型与迁移阶段');
assert.equal(new Set(registered).size, registered.length, '路由清单不得重复');
console.log('UI_ROUTE_MANIFEST_OK');
