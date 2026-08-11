import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  QA_PACKAGES_STORAGE_KEY,
  assignQaer,
  assignQaerResult,
  formatLocalDateTime,
  loadQaPackages,
  readQaPackages,
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

class ThrowingGetStorage {
  getItem() {
    throw new Error('storage read denied');
  }

  setItem() {
    throw new Error('storage should not be overwritten after a read failure');
  }
}

class ThrowingSetStorage {
  constructor(value = '[]') {
    this.value = value;
  }

  getItem() {
    return this.value;
  }

  setItem() {
    throw new Error('storage quota exceeded');
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

const fixedLocalNow = new Date(2026, 7, 7, 10, 5, 6);
assert.equal(formatLocalDateTime(fixedLocalNow), '2026-08-07 10:05:06');
const clockStorage = new MemoryStorage();
const defaultClockSync = syncCompletedAnnotationTasks(clockStorage, [baseTask], {
  now: fixedLocalNow,
});
assert.equal(
  defaultClockSync.packages[0].submittedAt,
  '2026-08-07 10:05:06',
  '默认提交时间必须使用注入时钟的本地年月日时分秒，而不是 UTC 字符串',
);
assert.equal(defaultClockSync.persisted, true);

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
assert.equal(assigned.qaer, '质检员00810', '旧 API 成功时必须直接返回已分配对象');
assert.equal(loadQaPackages(storage)[0].qaer, '质检员00810', '质检员分配必须持久化');
assert.equal(assignQaer(storage, 'QA-NOT-FOUND', '质检员00000'), null, '旧 API 未找到质检包时必须返回 null');

const resultAssignment = assignQaerResult(storage, 'QA-ANNO-20260415-002', '质检员00811');
assert.equal(resultAssignment.persisted, true);
assert.equal(resultAssignment.error, null);
assert.equal(resultAssignment.package.qaer, '质检员00811');
assert.equal(loadQaPackages(storage)[0].qaer, '质检员00811', '结果型 API 成功时也必须持久化');
const missingResultAssignment = assignQaerResult(storage, 'QA-NOT-FOUND', '质检员00000');
assert.deepEqual(
  missingResultAssignment,
  { package: null, persisted: false, error: null },
  '结果型 API 未找到时必须保持明确的 null 语义',
);

storage.setItem(QA_PACKAGES_STORAGE_KEY, '{broken json');
assert.deepEqual(loadQaPackages(storage), [], '损坏的本地数据不得导致页面崩溃');

const throwingRead = readQaPackages(new ThrowingGetStorage());
assert.deepEqual(throwingRead.packages, [], 'storage.getItem 抛错时应返回可用空集合');
assert.match(throwingRead.error?.message || '', /storage read denied/);
assert.deepEqual(loadQaPackages(new ThrowingGetStorage()), [], '兼容读取 API 不得向页面抛错');
const failedReadSync = syncCompletedAnnotationTasks(new ThrowingGetStorage(), [baseTask], {
  submittedAt: '2026-08-07 12:00:00',
});
assert.equal(failedReadSync.persisted, false);
assert.match(failedReadSync.error?.message || '', /storage read denied/);
assert.deepEqual(failedReadSync.createdPackageIds, [], '读取失败后不得覆盖未知的原存储内容');

const malformedStorage = new MemoryStorage();
malformedStorage.setItem(QA_PACKAGES_STORAGE_KEY, JSON.stringify([
  {},
  {
    qaPackageId: 42,
    instanceId: null,
    project: 17,
    taskbook: false,
    taskName: ['bad'],
    qcStatus: {},
    annoType: null,
    qaer: 8,
    dataCount: 'not-a-number',
    rounds: 'not-an-array',
  },
  null,
]));
const malformedRead = readQaPackages(malformedStorage);
assert.equal(malformedRead.error, null, '合法 JSON 中的畸形字段应被归一化而不是整包报错');
assert.equal(malformedRead.packages.length, 2, '非对象项应丢弃，对象项应保留并归一化');
for (const qaPackage of malformedRead.packages) {
  assert.equal(typeof qaPackage.project, 'string');
  assert.equal(typeof qaPackage.taskbook, 'string');
  assert.equal(typeof qaPackage.taskName, 'string');
  assert.equal(typeof qaPackage.qcStatus, 'string');
  assert.equal(typeof qaPackage.annoType, 'string');
  assert.equal(typeof qaPackage.qaer, 'string');
  assert.doesNotThrow(() => qaPackage.project.includes('x'));
  assert.doesNotThrow(() => qaPackage.taskName.includes('x'));
}

const failedWriteSync = syncCompletedAnnotationTasks(new ThrowingSetStorage(), [baseTask], {
  submittedAt: '2026-08-07 12:30:00',
});
assert.equal(failedWriteSync.persisted, false, '同步写失败必须可由调用者判断');
assert.match(failedWriteSync.error?.message || '', /storage quota exceeded/);
assert.deepEqual(failedWriteSync.createdPackageIds, [], '写失败不得触发调用页面的“已生成”成功提示');
assert.deepEqual(failedWriteSync.packages, [], '写失败不得把尚未持久化的质检包作为当前数据返回');

const assignSourcePackage = firstSync.packages[0];
const failedAssignmentStorage = new ThrowingSetStorage(JSON.stringify([assignSourcePackage]));
const failedAssignmentStoredValue = failedAssignmentStorage.getItem(QA_PACKAGES_STORAGE_KEY);
const failedAssignment = assignQaerResult(
  failedAssignmentStorage,
  assignSourcePackage.qaPackageId,
  '不会落库的质检员',
);
assert.equal(failedAssignment.persisted, false, '分配写失败必须可由调用者判断');
assert.match(failedAssignment.error?.message || '', /storage quota exceeded/);
assert.equal(failedAssignment.package, null, '写失败不得把未持久化对象作为成功结果返回');
assert.equal(
  failedAssignmentStorage.getItem(QA_PACKAGES_STORAGE_KEY),
  failedAssignmentStoredValue,
  '写失败不得改变原存储内容',
);
assert.equal(
  assignQaer(failedAssignmentStorage, assignSourcePackage.qaPackageId, '仍不会落库'),
  null,
  '旧 API 写失败时不得返回看似成功的对象',
);

const annotationPageSource = fs.readFileSync('src/app/collection/annotation-tasks/page.js', 'utf8');
assert.match(annotationPageSource, /syncCompletedAnnotationTasks/);
assert.match(annotationPageSource, /查看质检/);

const qaPageSource = fs.readFileSync('src/app/collection/qa/page.js', 'utf8');
assert.match(qaPageSource, /readQaPackages/);
assert.match(qaPageSource, /assignQaerResult/);
assert.match(qaPageSource, /storageError/);
assert.match(qaPageSource, /重试/);
assert.match(qaPageSource, /message\.error/);
assert.match(qaPageSource, /if \(!assignResult\.persisted\)/, '写失败时必须在表格更新前退出');
assert.match(qaPageSource, /const assignResult = assignQaerResult[\s\S]*?if \(!assignResult\.persisted\)[\s\S]*?return;[\s\S]*?setTableData/);
assert.doesNotMatch(qaPageSource, /Math\.random\(\)/, '质检页服务端与客户端必须生成相同的演示进度');

console.log('ANNOTATION_QA_FLOW_OK');
