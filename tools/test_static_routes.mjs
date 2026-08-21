import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const modulePath = 'src/lib/staticRoutes.mjs';
assert.ok(existsSync(modulePath), 'staticRoutes.mjs must exist');

const { STATIC_ROUTES, buildStaticHref } = await import(pathToFileURL(modulePath));

assert.equal(STATIC_ROUTES.auditWorkbench, '/annotation/audit/workbench');
assert.equal(STATIC_ROUTES.collectDetail, '/collection/collect/detail');
assert.equal(STATIC_ROUTES.qaDetail, '/collection/qa/detail');
assert.equal(STATIC_ROUTES.taskDetail, '/collection/tasks/detail');
assert.ok(Object.values(STATIC_ROUTES).every((route) => !route.includes('[')));

assert.equal(
  buildStaticHref(STATIC_ROUTES.auditWorkbench, {
    id: '任务 A',
    episodeId: 'EP/1',
    mode: undefined,
  }),
  '/annotation/audit/workbench?id=%E4%BB%BB%E5%8A%A1+A&episodeId=EP%2F1',
);
assert.equal(buildStaticHref('/collection/qa/detail', { instanceId: '' }), '/collection/qa/detail');
assert.throws(() => buildStaticHref('', { id: 1 }), /non-empty path/);

console.log('STATIC_ROUTES_OK');
