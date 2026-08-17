import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTION_UNKNOWN,
  buildSplitPlan,
  evaluateEpisodeEligibility,
  getCompatibleTemplates,
  groupEpisodesBySchema,
  toggleEpisodeSelection,
  validateAnnotationTask,
} from './model.mjs';

const episodes = [
  {
    id: 'EP-SCREW-001',
    sourceTaskId: 'TASK-A',
    sourceTaskName: '366666',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1840,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: 'EP-SCREW-002',
    sourceTaskId: 'TASK-B',
    sourceTaskName: '采集测试0806',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 2024,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: 'EP-CABLE-001',
    sourceTaskId: 'TASK-C',
    sourceTaskName: '线缆整理采集',
    actionSchemaKey: 'cable-routing:v2',
    actionSchemaLabel: '线缆整理归位',
    sopSnapshot: 'SOP-DA-CABLE-V2.1',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1610,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: 'EP-PENDING-001',
    sourceTaskId: 'TASK-A',
    sourceTaskName: '366666',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 900,
    qcStatus: 'pending',
    available: true,
  },
  {
    id: 'EP-EMPTY-001',
    sourceTaskId: 'TASK-A',
    sourceTaskName: '366666',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 0,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: 'EP-UNKNOWN-001',
    sourceTaskId: 'IMPORT-01',
    sourceTaskName: '外部导入-0820',
    actionSchemaKey: ACTION_UNKNOWN,
    actionSchemaLabel: '未识别动作',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1450,
    qcStatus: 'passed',
    available: true,
  },
];

const templates = [
  {
    id: 'TPL-SCREW-032',
    name: '双臂打螺丝装配模板',
    version: 'V3.2',
    actionSchemaKey: 'screw-assembly:v3',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'published',
    recommended: true,
  },
  {
    id: 'TPL-SCREW-OLD',
    name: '旧版打螺丝模板',
    version: 'V2.0',
    actionSchemaKey: 'screw-assembly:v3',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'archived',
  },
  {
    id: 'TPL-CABLE-021',
    name: '双臂线缆整理模板',
    version: 'V2.1',
    actionSchemaKey: 'cable-routing:v2',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'published',
    recommended: true,
  },
];

test('groups query results by normalized action schema instead of source task', () => {
  const groups = groupEpisodesBySchema(episodes);

  assert.equal(groups.find(group => group.key === 'screw-assembly:v3').count, 4);
  assert.equal(groups.find(group => group.key === 'screw-assembly:v3').sourceTaskCount, 2);
  assert.equal(groups.find(group => group.key === ACTION_UNKNOWN).label, '未识别动作');
});

test('allows data from different source tasks when their action schema matches', () => {
  const first = toggleEpisodeSelection({ episodes, selectedIds: [], episodeId: 'EP-SCREW-001' });
  const second = toggleEpisodeSelection({ episodes, selectedIds: first.selectedIds, episodeId: 'EP-SCREW-002' });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(second.selectedIds, ['EP-SCREW-001', 'EP-SCREW-002']);
  assert.equal(second.lockedSchemaKey, 'screw-assembly:v3');
});

test('rejects a different action schema and recommends splitting the task', () => {
  const result = toggleEpisodeSelection({
    episodes,
    selectedIds: ['EP-SCREW-001'],
    episodeId: 'EP-CABLE-001',
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'MIXED_ACTION_SCHEMA');
  assert.equal(result.lockedSchemaLabel, '打螺丝装配');
  assert.equal(result.candidateSchemaLabel, '线缆整理归位');
  assert.deepEqual(result.selectedIds, ['EP-SCREW-001']);
});

test('blocks pending-quality and zero-frame episodes before selection', () => {
  assert.deepEqual(evaluateEpisodeEligibility(episodes[3]), {
    eligible: false,
    code: 'QC_NOT_PASSED',
    reason: '质检未完成',
  });
  assert.deepEqual(evaluateEpisodeEligibility(episodes[4]), {
    eligible: false,
    code: 'EMPTY_EPISODE',
    reason: '帧数为 0',
  });
});

test('filters templates by action schema, device, annotation type, and publish state', () => {
  const compatible = getCompatibleTemplates({
    templates,
    episodes,
    selectedIds: ['EP-SCREW-001', 'EP-SCREW-002'],
    annotationType: 'action-segment',
  });

  assert.deepEqual(compatible.map(template => template.id), ['TPL-SCREW-032']);
});

test('builds one proposed annotation task per action schema', () => {
  const plan = buildSplitPlan({
    episodes,
    selectedIds: ['EP-SCREW-001', 'EP-SCREW-002', 'EP-CABLE-001'],
    templates,
    annotationType: 'action-segment',
  });

  assert.equal(plan.length, 2);
  assert.deepEqual(plan.map(group => group.episodeCount), [2, 1]);
  assert.equal(plan[0].sourceTaskCount, 2);
  assert.equal(plan[0].recommendedTemplateId, 'TPL-SCREW-032');
  assert.equal(plan[1].recommendedTemplateId, 'TPL-CABLE-021');
});

test('requires one compatible template for known action data', () => {
  const missingTemplate = validateAnnotationTask({
    name: '装配动作标注任务',
    annotationType: 'action-segment',
    episodes,
    selectedIds: ['EP-SCREW-001', 'EP-SCREW-002'],
    templates,
  });
  const wrongTemplate = validateAnnotationTask({
    name: '装配动作标注任务',
    annotationType: 'action-segment',
    episodes,
    selectedIds: ['EP-SCREW-001'],
    templates,
    templateId: 'TPL-CABLE-021',
  });
  const valid = validateAnnotationTask({
    name: '装配动作标注任务',
    annotationType: 'action-segment',
    episodes,
    selectedIds: ['EP-SCREW-001', 'EP-SCREW-002'],
    templates,
    templateId: 'TPL-SCREW-032',
  });

  assert.ok(missingTemplate.errors.some(error => error.code === 'TEMPLATE_REQUIRED'));
  assert.ok(wrongTemplate.errors.some(error => error.code === 'TEMPLATE_INCOMPATIBLE'));
  assert.equal(valid.ok, true);
  assert.equal(valid.summary.sourceTaskCount, 2);
  assert.equal(valid.summary.schemaCount, 1);
});

test('requires an explicit manual path for imported data with unknown action', () => {
  const unresolved = validateAnnotationTask({
    name: '外部数据人工标注任务',
    annotationType: 'action-segment',
    episodes,
    selectedIds: ['EP-UNKNOWN-001'],
    templates,
  });
  const manual = validateAnnotationTask({
    name: '外部数据人工标注任务',
    annotationType: 'action-segment',
    episodes,
    selectedIds: ['EP-UNKNOWN-001'],
    templates,
    unknownHandling: 'manual-no-template',
  });

  assert.ok(unresolved.errors.some(error => error.code === 'UNKNOWN_ACTION_UNRESOLVED'));
  assert.equal(manual.ok, true);
});
