import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  QA_PACKAGES_STORAGE_KEY,
  assignQaer,
  loadQaPackages,
  syncCompletedAnnotationTasks,
} from '../src/lib/annotationQaFlow.mjs';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

const storage = new MemoryStorage();
const baseTask = {
  taskId: 'ANNO-20260415-002',
  sourceTask: 'COLL-20260415-002 (采集完成)',
  taskName: '货架物品多视角3D框标注任务',
  taskBookName: '货架物体3D标注规范 V1.5',
  firstLevel: 'InternalCommercial',
  secondLevel: 'GroceryVLA',
  sceneCategory: 'Supermarket',
  subSceneCategory: 'ShelfArea',
  totalCount: 500,
  finishCount: 500,
  status: '已完成',
  createBy: 'ingest_user',
  annotationVersion: 1,
};

const incomplete = syncCompletedAnnotationTasks(storage, [
  { ...baseTask, taskId: 'ANNO-INCOMPLETE', finishCount: 499, status: '进行中' },
], { submittedAt: '2026-08-07 10:00:00' });
assert.equal(incomplete.packages.length, 0, '未完成任务不得生成质检包');

const firstSync = syncCompletedAnnotationTasks(storage, [baseTask], {
  submittedAt: '2026-08-07 10:00:00',
});
assert.deepEqual(firstSync.createdPackageIds, ['QA-ANNO-20260415-002']);
assert.equal(firstSync.packages.length, 1);
assert.equal(firstSync.packages[0].qcStatus, '待质检');
assert.equal(firstSync.packages[0].annotationTaskId, baseTask.taskId);
assert.equal(firstSync.packages[0].isShelfTask, '是');
assert.equal(firstSync.packages[0].currentRound, 1);
assert.equal(firstSync.packages[0].rounds.length, 1);

const duplicateSync = syncCompletedAnnotationTasks(storage, [baseTask], {
  submittedAt: '2026-08-07 10:05:00',
});
assert.deepEqual(duplicateSync.createdPackageIds, []);
assert.deepEqual(duplicateSync.updatedPackageIds, []);
assert.equal(duplicateSync.packages.length, 1, '相同版本重复同步不得重复建包');
assert.equal(duplicateSync.packages[0].rounds.length, 1, '相同版本不得增加质检轮次');

const metadataSync = syncCompletedAnnotationTasks(storage, [
  { ...baseTask, taskName: '货架物品多视角3D框标注任务（修订名称）' },
], { submittedAt: '2026-08-07 10:10:00' });
assert.deepEqual(metadataSync.updatedPackageIds, [], '同版本元数据同步不属于新质检轮次');
assert.equal(metadataSync.packages[0].rounds.length, 1);
assert.match(metadataSync.packages[0].taskName, /修订名称/, '同版本任务元数据应同步到质检包');

const reworkSync = syncCompletedAnnotationTasks(storage, [
  { ...baseTask, annotationVersion: 2, finishCount: 500, status: '已完成' },
], { submittedAt: '2026-08-07 11:00:00' });
assert.deepEqual(reworkSync.updatedPackageIds, ['QA-ANNO-20260415-002']);
assert.equal(reworkSync.packages.length, 1, '返工重提必须沿用原质检包');
assert.equal(reworkSync.packages[0].currentRound, 2);
assert.equal(reworkSync.packages[0].annotationVersion, 2);
assert.equal(reworkSync.packages[0].rounds.length, 2);
assert.equal(reworkSync.packages[0].qcStatus, '待质检');

const assigned = assignQaer(storage, 'QA-ANNO-20260415-002', '质检员00810');
assert.equal(assigned.qaer, '质检员00810');
assert.equal(loadQaPackages(storage)[0].qaer, '质检员00810', '质检员分配必须持久化');

storage.setItem(QA_PACKAGES_STORAGE_KEY, '{broken json');
assert.deepEqual(loadQaPackages(storage), [], '损坏的本地数据不得导致页面崩溃');

const annotationPageSource = fs.readFileSync('src/app/collection/annotation-tasks/page.js', 'utf8');
assert.match(annotationPageSource, /syncCompletedAnnotationTasks/);
assert.match(annotationPageSource, /查看质检/);

const qaPageSource = fs.readFileSync('src/app/collection/qa/page.js', 'utf8');
assert.match(qaPageSource, /loadQaPackages/);
assert.match(qaPageSource, /assignQaer/);
assert.doesNotMatch(qaPageSource, /Math\.random\(\)/, '质检页服务端与客户端必须生成相同的演示进度');

console.log('ANNOTATION_QA_FLOW_OK');
