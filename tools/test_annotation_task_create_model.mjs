import assert from 'node:assert/strict';

import {
  canPublishTask,
  filterEpisodes,
  summarizeReadyPool,
} from '../src/lib/annotationTaskCreateModel.mjs';

const episodes = [
  {
    id: 'EP-001',
    sourceType: 'collection',
    sourceName: '桌面整理实采任务',
    scene: '厨房',
    subScene: '操作台',
  },
  {
    id: 'EP-002',
    sourceType: 'asset',
    sourceName: '历史双臂整理资产包',
    scene: '客厅',
    subScene: '餐桌',
  },
];

assert.deepEqual(filterEpisodes(episodes, {}), episodes);
assert.deepEqual(
  filterEpisodes(episodes, { sourceType: 'asset' }).map(item => item.id),
  ['EP-002'],
);
assert.deepEqual(
  filterEpisodes(episodes, { scene: '厨房', keyword: '实采' }).map(item => item.id),
  ['EP-001'],
);

assert.deepEqual(summarizeReadyPool(episodes), {
  total: 2,
  collection: 1,
  asset: 1,
  simulation: 0,
});

assert.equal(canPublishTask({ name: '', annotationType: 'action', selectedEpisodeIds: ['EP-001'] }), false);
assert.equal(canPublishTask({ name: '桌面整理标注', annotationType: '', selectedEpisodeIds: ['EP-001'] }), false);
assert.equal(canPublishTask({ name: '桌面整理标注', annotationType: 'action', selectedEpisodeIds: [] }), false);
assert.equal(canPublishTask({ name: '桌面整理标注', annotationType: 'action', selectedEpisodeIds: ['EP-001'] }), true);

console.log('annotation task create model: all checks passed');
