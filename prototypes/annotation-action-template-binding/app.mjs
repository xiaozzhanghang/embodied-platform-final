import {
  ACTION_UNKNOWN,
  buildSplitPlan,
  evaluateEpisodeEligibility,
  getCompatibleTemplates,
  groupEpisodesBySchema,
  toggleEpisodeSelection,
  validateAnnotationTask,
} from './model.mjs';

const EPISODES = [
  {
    id: '2087770203948301',
    sourceTaskId: 'COLL-208771-01',
    sourceTaskName: '366666',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    actionCode: 'AS-03',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1840,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204074131',
    sourceTaskId: 'ASSET-208769-04',
    sourceTaskName: '打螺丝装配-资产',
    sourceType: '导入数据集',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    actionCode: 'AS-03',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 2024,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204141240',
    sourceTaskId: 'COLL-208771-01',
    sourceTaskName: '366666',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    actionCode: 'AS-03',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1768,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204259077',
    sourceTaskId: 'ASSET-208769-04',
    sourceTaskName: '打螺丝装配-资产',
    sourceType: '导入数据集',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    actionCode: 'AS-03',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1512,
    qcStatus: 'passed',
    available: false,
  },
  {
    id: '2087770204386602',
    sourceTaskId: 'COLL-208772-02',
    sourceTaskName: '4',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'cable-routing:v2',
    actionSchemaLabel: '线缆整理归位',
    actionCode: 'AS-07',
    sopSnapshot: 'SOP-DA-CABLE-V2.1',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1610,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204419935',
    sourceTaskId: 'COLL-208772-02',
    sourceTaskName: '4',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'cable-routing:v2',
    actionSchemaLabel: '线缆整理归位',
    actionCode: 'AS-07',
    sopSnapshot: 'SOP-DA-CABLE-V2.1',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1486,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204560028',
    sourceTaskId: 'COLL-208773-03',
    sourceTaskName: '采集测试0806',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'surface-clean:v1',
    actionSchemaLabel: '台面清洁整理',
    actionCode: 'AS-11',
    sopSnapshot: 'SOP-DA-CLEAN-V1.4',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1328,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204695542',
    sourceTaskId: 'COLL-208773-03',
    sourceTaskName: '采集测试0806',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'surface-clean:v1',
    actionSchemaLabel: '台面清洁整理',
    actionCode: 'AS-11',
    sopSnapshot: 'SOP-DA-CLEAN-V1.4',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1180,
    qcStatus: 'pending',
    available: true,
  },
  {
    id: '2087770204780619',
    sourceTaskId: 'COLL-208771-01',
    sourceTaskName: '366666',
    sourceType: '采集计划',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: 'screw-assembly:v3',
    actionSchemaLabel: '打螺丝装配',
    actionCode: 'AS-03',
    sopSnapshot: 'SOP-DA-SCREW-V3.2',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 0,
    qcStatus: 'passed',
    available: true,
  },
  {
    id: '2087770204899021',
    sourceTaskId: 'ASSET-208769-04',
    sourceTaskName: '打螺丝装配-资产',
    sourceType: '导入数据集',
    scene: '真实数据',
    subScene: '天奇新动力',
    actionSchemaKey: ACTION_UNKNOWN,
    actionSchemaLabel: '未识别动作',
    actionCode: 'UNKNOWN',
    sopSnapshot: '未携带 SOP 快照',
    deviceType: 'dual-arm',
    annotationType: 'action-segment',
    frames: 1450,
    qcStatus: 'passed',
    available: true,
  },
];

const TEMPLATES = [
  {
    id: 'TPL-SCREW-032',
    name: '双臂打螺丝装配模板',
    version: 'V3.2',
    actionSchemaKey: 'screw-assembly:v3',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'published',
    recommended: true,
    steps: ['定位螺丝孔', '抓取螺丝', '预装配', '旋拧锁紧', '结果确认'],
  },
  {
    id: 'TPL-SCREW-030',
    name: '双臂螺丝装配通用模板',
    version: 'V3.0',
    actionSchemaKey: 'screw-assembly:v3',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'published',
    recommended: false,
    steps: ['目标确认', '螺丝抓取', '孔位对齐', '旋拧', '完成检查'],
  },
  {
    id: 'TPL-CABLE-021',
    name: '双臂线缆整理归位模板',
    version: 'V2.1',
    actionSchemaKey: 'cable-routing:v2',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'published',
    recommended: true,
    steps: ['识别线缆', '分离缠绕', '调整走线', '压入卡槽', '归位确认'],
  },
  {
    id: 'TPL-CLEAN-014',
    name: '台面清洁整理模板',
    version: 'V1.4',
    actionSchemaKey: 'surface-clean:v1',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'published',
    recommended: true,
    steps: ['识别杂物', '移除杂物', '擦拭台面', '工具归位', '清洁确认'],
  },
  {
    id: 'TPL-SCREW-OLD',
    name: '旧版打螺丝模板',
    version: 'V2.0',
    actionSchemaKey: 'screw-assembly:v3',
    deviceType: 'dual-arm',
    annotationTypes: ['action-segment'],
    status: 'archived',
    recommended: false,
    steps: [],
  },
];

const state = {
  selectedIds: [],
  activeGroupKey: null,
  filteredEpisodes: [...EPISODES],
  appliedFilters: {
    scene: '真实数据',
    subScene: '天奇新动力',
    sourceTaskName: '',
    keyword: '',
  },
  templateId: null,
  unknownHandling: null,
  manualSchemaKey: '',
  manualTemplateId: null,
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const formatNumber = value => new Intl.NumberFormat('zh-CN').format(value);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function selectedEpisodes() {
  return EPISODES.filter(episode => state.selectedIds.includes(episode.id));
}

function lockedEpisode() {
  return selectedEpisodes()[0] || null;
}

function visibleEpisodes() {
  if (!state.activeGroupKey) return state.filteredEpisodes;
  return state.filteredEpisodes.filter(episode => episode.actionSchemaKey === state.activeGroupKey);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function queryEpisodes(filters) {
  const keyword = filters.keyword.trim().toLowerCase();
  return EPISODES.filter(episode => {
    if (filters.scene && episode.scene !== filters.scene) return false;
    if (filters.subScene && episode.subScene !== filters.subScene) return false;
    if (filters.sourceTaskName && episode.sourceTaskName !== filters.sourceTaskName) return false;
    if (keyword && !`${episode.id} ${episode.sourceTaskName}`.toLowerCase().includes(keyword)) return false;
    return true;
  });
}

function getTemplateForId(templateId) {
  return TEMPLATES.find(template => template.id === templateId) || null;
}

function refreshTemplateRecommendation() {
  const episodes = selectedEpisodes();
  if (!episodes.length || episodes[0].actionSchemaKey === ACTION_UNKNOWN) {
    state.templateId = null;
    return;
  }

  const compatible = getCompatibleTemplates({
    templates: TEMPLATES,
    episodes: EPISODES,
    selectedIds: state.selectedIds,
    annotationType: $('#annotation-type').value,
  });
  if (!compatible.some(template => template.id === state.templateId)) {
    state.templateId = compatible[0]?.id || null;
  }
}

function resetAssemblyState() {
  state.selectedIds = [];
  state.templateId = null;
  state.unknownHandling = null;
  state.manualSchemaKey = '';
  state.manualTemplateId = null;
  $$('input[name="unknown-handling"]').forEach(input => { input.checked = false; });
}

function renderQuerySummary() {
  const groups = groupEpisodesBySchema(state.filteredEpisodes);
  const taskCount = unique(state.filteredEpisodes.map(episode => episode.sourceTaskId)).length;
  const readyCount = state.filteredEpisodes.filter(episode => evaluateEpisodeEligibility(episode).eligible).length;
  const { scene, subScene, sourceTaskName } = state.appliedFilters;

  $('#metric-episodes').textContent = state.filteredEpisodes.length;
  $('#metric-tasks').textContent = taskCount;
  $('#metric-actions').textContent = groups.length;
  $('#metric-ready').textContent = readyCount;

  if (sourceTaskName) {
    $('#query-status-title').textContent = `已限定采集任务：${sourceTaskName}`;
  } else {
    $('#query-status-title').textContent = `采集任务未指定 · 已汇总 ${taskCount} 个来源`;
  }

  const scope = [scene || '全部场景', subScene || '全部子场景'].join(' / ');
  $('#query-status-detail').textContent = `查询范围：${scope}；数据不会自动勾选`;
}

function renderGroups() {
  const groups = groupEpisodesBySchema(state.filteredEpisodes);
  const container = $('#group-grid');

  if (!groups.length) {
    container.innerHTML = '<div class="table-empty">当前查询条件下没有可用动作分组</div>';
    return;
  }

  container.innerHTML = groups.map(group => {
    const active = state.activeGroupKey === group.key;
    const unknown = group.key === ACTION_UNKNOWN;
    const code = unknown
      ? 'ACTION / UNKNOWN'
      : state.filteredEpisodes.find(episode => episode.actionSchemaKey === group.key)?.actionCode || 'ACTION';
    return `
      <button
        class="group-card ${active ? 'is-active' : ''} ${unknown ? 'is-unknown' : ''}"
        type="button"
        role="listitem"
        data-schema-key="${escapeHtml(group.key)}"
        data-testid="action-group"
        aria-pressed="${active}"
      >
        <span>
          <span class="group-code">${escapeHtml(code)}</span>
          <strong>${escapeHtml(group.label)}</strong>
          <p>${group.sourceTaskCount} 个来源任务 · ${group.eligibleCount}/${group.count} 条可选</p>
        </span>
        <span class="group-count">${group.count}</span>
      </button>
    `;
  }).join('');

  $$('#group-grid [data-schema-key]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.schemaKey;
      state.activeGroupKey = state.activeGroupKey === key ? null : key;
      renderAll();
    });
  });
}

function qcTag(episode) {
  if (episode.qcStatus === 'passed') return '<span class="status-tag pass">✓ 质检通过</span>';
  if (episode.qcStatus === 'pending') return '<span class="status-tag pending">… 待质检</span>';
  return '<span class="status-tag block">× 质检失败</span>';
}

function compatibilityForEpisode(episode) {
  const eligibility = evaluateEpisodeEligibility(episode);
  if (!eligibility.eligible) {
    return { className: 'block', label: eligibility.reason };
  }

  const lock = lockedEpisode();
  if (!lock) {
    if (episode.actionSchemaKey === ACTION_UNKNOWN) {
      return { className: 'unknown', label: '需人工确认动作' };
    }
    return { className: 'neutral', label: '选择后匹配模板' };
  }
  if (lock.actionSchemaKey === episode.actionSchemaKey) {
    return { className: 'match', label: '同动作，可合并' };
  }
  return { className: 'block', label: '动作不一致' };
}

function renderSchemaLock() {
  const lock = lockedEpisode();
  const element = $('#schema-lock');
  if (!lock) {
    element.classList.add('is-empty');
    element.innerHTML = `
      <div class="lock-symbol" aria-hidden="true">◎</div>
      <div><strong>尚未锁定动作</strong><p>勾选第一条数据后，本任务将锁定到该动作 Schema。</p></div>
    `;
    return;
  }

  element.classList.remove('is-empty');
  const sourceTaskCount = unique(selectedEpisodes().map(episode => episode.sourceTaskId)).length;
  element.innerHTML = `
    <div class="lock-symbol" aria-hidden="true">✓</div>
    <div>
      <strong>本任务已锁定：${escapeHtml(lock.actionSchemaLabel)}</strong>
      <p>${escapeHtml(lock.sopSnapshot)} · 已跨 ${sourceTaskCount} 个来源任务选择 ${state.selectedIds.length} 条数据</p>
    </div>
  `;
}

function renderTable() {
  const rows = visibleEpisodes();
  const lock = lockedEpisode();
  $('#table-result-count').textContent = `共 ${rows.length} 条，已选 ${state.selectedIds.length} 条`;
  $('#select-current-group').disabled = !state.activeGroupKey;

  if (!rows.length) {
    $('#episode-table-body').innerHTML = '<tr><td class="table-empty" colspan="7">当前筛选下没有 Episode，请调整查询条件</td></tr>';
    return;
  }

  $('#episode-table-body').innerHTML = rows.map(episode => {
    const selected = state.selectedIds.includes(episode.id);
    const eligibility = evaluateEpisodeEligibility(episode);
    const incompatible = lock && lock.actionSchemaKey !== episode.actionSchemaKey && eligibility.eligible;
    const compatibility = compatibilityForEpisode(episode);
    const rowClasses = [
      selected ? 'is-selected' : '',
      incompatible ? 'is-incompatible' : '',
      !eligibility.eligible ? 'is-ineligible' : '',
    ].filter(Boolean).join(' ');

    return `
      <tr class="${rowClasses}" data-row-id="${escapeHtml(episode.id)}">
        <td class="check-cell">
          <input
            class="row-checkbox"
            type="checkbox"
            data-episode-id="${escapeHtml(episode.id)}"
            aria-label="选择 Episode ${escapeHtml(episode.id)}"
            ${selected ? 'checked' : ''}
            ${!eligibility.eligible ? 'disabled' : ''}
          />
        </td>
        <td><span class="mono">${escapeHtml(episode.id)}</span></td>
        <td>
          <span class="source-name" title="${escapeHtml(episode.sourceTaskName)}">${escapeHtml(episode.sourceTaskName)}</span>
          <span class="source-type">${escapeHtml(episode.sourceType)}</span>
        </td>
        <td class="action-cell">
          <strong>${escapeHtml(episode.actionSchemaLabel)}</strong>
          <span>${escapeHtml(episode.sopSnapshot)}</span>
        </td>
        <td class="number-cell">${formatNumber(episode.frames)}</td>
        <td>
          ${qcTag(episode)}
          ${!episode.available ? '<span class="ineligible-reason">已被其他任务占用</span>' : ''}
          ${episode.frames <= 0 ? '<span class="ineligible-reason">无有效帧数据</span>' : ''}
        </td>
        <td><span class="compatibility-tag ${compatibility.className}">${escapeHtml(compatibility.label)}</span></td>
      </tr>
    `;
  }).join('');

  $$('.row-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => handleEpisodeToggle(checkbox.dataset.episodeId));
  });
}

function showConflict(result) {
  $('#conflict-current').textContent = result.lockedSchemaLabel;
  $('#conflict-candidate').textContent = result.candidateSchemaLabel;
  $('#conflict-description').textContent = `当前任务已经按“${result.lockedSchemaLabel}”匹配模板；“${result.candidateSchemaLabel}”需要另一套动作步骤。`;
  openModal('#conflict-modal');
}

function handleEpisodeToggle(episodeId) {
  const result = toggleEpisodeSelection({
    episodes: EPISODES,
    selectedIds: state.selectedIds,
    episodeId,
  });

  if (!result.ok) {
    if (result.code === 'MIXED_ACTION_SCHEMA') showConflict(result);
    else showToast(result.reason || '该数据当前不可选择', true);
    renderAll();
    return;
  }

  state.selectedIds = result.selectedIds;
  if (!state.selectedIds.length) resetAssemblyState();
  else {
    const lock = lockedEpisode();
    if (lock?.actionSchemaKey !== ACTION_UNKNOWN) {
      state.unknownHandling = null;
      state.manualSchemaKey = '';
      state.manualTemplateId = null;
    }
    refreshTemplateRecommendation();
  }
  renderAll();
}

function renderTemplateOptions(templates) {
  const select = $('#template-select');
  if (!templates.length) {
    select.innerHTML = '<option value="">没有兼容的已发布模板</option>';
    select.value = '';
    return;
  }

  select.innerHTML = templates.map((template, index) => `
    <option value="${escapeHtml(template.id)}" ${template.id === state.templateId ? 'selected' : ''}>
      ${index === 0 && template.recommended ? '推荐 · ' : ''}${escapeHtml(template.name)} ${escapeHtml(template.version)}
    </option>
  `).join('');
  select.value = state.templateId || '';
}

function renderSopPreview(template) {
  const container = $('#sop-preview');
  if (!template) {
    container.innerHTML = '<strong>没有可预览的模板步骤</strong>';
    return;
  }
  container.innerHTML = `
    <strong>进入工作台后预置 ${template.steps.length} 个动作步骤</strong>
    <ol class="sop-steps">${template.steps.map((step, index) => `<li>${index + 1}. ${escapeHtml(step)}</li>`).join('')}</ol>
  `;
}

function validationItems(result, unknown) {
  const errorCodes = new Set(result.errors.map(error => error.code));
  const dataCodes = ['EPISODE_REQUIRED', 'EPISODE_NOT_FOUND', 'NOT_AVAILABLE', 'EMPTY_EPISODE', 'QC_NOT_PASSED'];
  const templateCodes = unknown
    ? ['UNKNOWN_ACTION_UNRESOLVED', 'UNKNOWN_TEMPLATE_CONFLICT', 'MANUAL_BINDING_REQUIRED', 'TEMPLATE_INCOMPATIBLE']
    : ['TEMPLATE_REQUIRED', 'TEMPLATE_INCOMPATIBLE'];

  return [
    {
      ok: !errorCodes.has('NAME_REQUIRED'),
      label: errorCodes.has('NAME_REQUIRED') ? '任务名称未填写' : '任务名称已填写',
    },
    {
      ok: !dataCodes.some(code => errorCodes.has(code)),
      label: dataCodes.some(code => errorCodes.has(code)) ? '数据为空或不满足入池条件' : '所选数据均满足帧数、质检与占用校验',
    },
    {
      ok: !errorCodes.has('MIXED_ACTION_SCHEMA'),
      label: errorCodes.has('MIXED_ACTION_SCHEMA') ? '包含多个动作 Schema' : '动作 Schema 唯一，可共用同一套步骤',
    },
    {
      ok: !templateCodes.some(code => errorCodes.has(code)),
      label: templateCodes.some(code => errorCodes.has(code))
        ? (unknown ? '请选择未知动作的处理方式' : '未绑定兼容的已发布模板')
        : (unknown ? '未知动作已明确人工处理方式' : '模板与动作、设备、标注类型匹配'),
    },
  ];
}

function currentValidation() {
  const lock = lockedEpisode();
  const unknown = lock?.actionSchemaKey === ACTION_UNKNOWN;
  return validateAnnotationTask({
    name: $('#task-name').value,
    annotationType: $('#annotation-type').value,
    episodes: EPISODES,
    selectedIds: state.selectedIds,
    templates: TEMPLATES,
    templateId: unknown && state.unknownHandling === 'bind-template'
      ? state.manualTemplateId
      : state.templateId,
    unknownHandling: state.unknownHandling,
    manualSchemaKey: state.manualSchemaKey,
  });
}

function renderManualTemplateOptions() {
  const select = $('#manual-template-select');
  if (!state.manualSchemaKey) {
    select.innerHTML = '<option value="">请先选择动作分类</option>';
    state.manualTemplateId = null;
    return;
  }

  const compatible = getCompatibleTemplates({
    templates: TEMPLATES,
    episodes: EPISODES,
    selectedIds: state.selectedIds,
    annotationType: $('#annotation-type').value,
    schemaKey: state.manualSchemaKey,
  });
  if (!compatible.some(template => template.id === state.manualTemplateId)) {
    state.manualTemplateId = compatible[0]?.id || null;
  }
  select.innerHTML = compatible.length
    ? compatible.map(template => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)} ${escapeHtml(template.version)}</option>`).join('')
    : '<option value="">没有兼容的已发布模板</option>';
  select.value = state.manualTemplateId || '';
}

function renderAssembly() {
  const episodes = selectedEpisodes();
  const lock = episodes[0] || null;
  const sourceTaskCount = unique(episodes.map(episode => episode.sourceTaskId)).length;
  const schemaCount = unique(episodes.map(episode => episode.actionSchemaKey)).length;

  $('#selected-count').textContent = episodes.length;
  $('#selected-task-count').textContent = sourceTaskCount;
  $('#selected-schema-count').textContent = schemaCount;
  $('#assembly-empty').hidden = Boolean(lock);
  $('#assembly-content').hidden = !lock;

  if (!lock) {
    $('#publish-task').disabled = true;
    $('#publish-hint').classList.remove('is-ready');
    $('#publish-hint').textContent = '请先选择数据';
    return;
  }

  const unknown = lock.actionSchemaKey === ACTION_UNKNOWN;
  $('#selected-action-code').textContent = lock.actionCode;
  $('#selected-action-label').textContent = lock.actionSchemaLabel;
  $('#selected-action-sop').textContent = lock.sopSnapshot;
  $('#known-action-config').hidden = unknown;
  $('#unknown-action-config').hidden = !unknown;

  if (!unknown) {
    const compatible = getCompatibleTemplates({
      templates: TEMPLATES,
      episodes: EPISODES,
      selectedIds: state.selectedIds,
      annotationType: $('#annotation-type').value,
    });
    renderTemplateOptions(compatible);
    const template = getTemplateForId(state.templateId);
    $('#template-why').textContent = template
      ? `✓ 匹配 ${lock.actionSchemaLabel} + 双臂设备 + 当前标注类型 + 已发布版本`
      : '× 没有同时满足动作、设备、标注类型和发布状态的模板';
    renderSopPreview(template);
  } else {
    $$('input[name="unknown-handling"]').forEach(input => {
      input.checked = input.value === state.unknownHandling;
    });
    $('#manual-binding-fields').hidden = state.unknownHandling !== 'bind-template';
    $('#manual-schema-select').value = state.manualSchemaKey;
    renderManualTemplateOptions();
  }

  const result = currentValidation();
  const items = validationItems(result, unknown);
  $('#validation-list').innerHTML = items.map(item => `
    <li class="${item.ok ? '' : 'is-error'}">${escapeHtml(item.label)}</li>
  `).join('');

  $('#publish-task').disabled = !result.ok;
  $('#publish-hint').classList.toggle('is-ready', result.ok);
  $('#publish-hint').textContent = result.ok
    ? `已通过 ${items.length} 项校验，可创建 1 个标注任务`
    : result.errors[0]?.message || '请完善发布条件';
}

function renderAll() {
  renderQuerySummary();
  renderGroups();
  renderSchemaLock();
  renderTable();
  renderAssembly();
  window.__annotationPrototype = {
    selectedIds: [...state.selectedIds],
    activeGroupKey: state.activeGroupKey,
    templateId: state.templateId,
    validation: currentValidation(),
  };
}

function openModal(selector) {
  $$('.modal-backdrop').forEach(modal => { modal.hidden = true; });
  const modal = $(selector);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  const focusTarget = modal.querySelector('button, input, select');
  focusTarget?.focus();
}

function closeModal(modal) {
  modal.hidden = true;
  if ($$('.modal-backdrop').every(item => item.hidden)) document.body.style.overflow = '';
}

let toastTimer;
function showToast(message, isError = false) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
}

function openSplitPreview() {
  const eligibleIds = state.filteredEpisodes
    .filter(episode => evaluateEpisodeEligibility(episode).eligible)
    .map(episode => episode.id);
  const plan = buildSplitPlan({
    episodes: EPISODES,
    selectedIds: eligibleIds,
    templates: TEMPLATES,
    annotationType: $('#annotation-type').value,
  });

  $('#split-plan').innerHTML = plan.map((item, index) => `
    <article class="split-item ${item.requiresManualHandling ? 'is-unknown' : ''}">
      <div class="split-item-head">
        <div>
          <span>${escapeHtml(item.actionSchemaKey)}</span>
          <strong>${escapeHtml(item.actionSchemaLabel)}标注任务</strong>
        </div>
        <div class="split-index">${String(index + 1).padStart(2, '0')}</div>
      </div>
      <dl>
        <div><dt>数据量</dt><dd>${item.episodeCount} 条</dd></div>
        <div><dt>来源任务</dt><dd>${item.sourceTaskCount} 个</dd></div>
        <div><dt>总帧数</dt><dd>${formatNumber(item.totalFrames)}</dd></div>
      </dl>
      <div class="split-template ${item.requiresManualHandling ? 'needs-action' : ''}">
        ${item.recommendedTemplateName
          ? `推荐模板：${escapeHtml(item.recommendedTemplateName)}`
          : '待处理：选择人工无模板或补充动作分类'}
      </div>
    </article>
  `).join('');
  $('#split-summary').textContent = `查询结果中 ${eligibleIds.length} 条可用数据将被拆成 ${plan.length} 个动作任务；不会把不同动作强行套入同一模板。`;
  openModal('#split-modal');
}

function handleQuery() {
  const filters = {
    scene: $('#scene-filter').value,
    subScene: $('#subscene-filter').value,
    sourceTaskName: $('#source-task-filter').value,
    keyword: $('#keyword-filter').value,
  };
  state.appliedFilters = filters;
  state.filteredEpisodes = queryEpisodes(filters);
  state.activeGroupKey = null;
  resetAssemblyState();
  renderAll();
  showToast(`查询完成：${state.filteredEpisodes.length} 条数据，默认未勾选`);
}

function selectCurrentGroup() {
  if (!state.activeGroupKey) {
    showToast('请先点击一个动作分组', true);
    return;
  }

  const candidates = state.filteredEpisodes.filter(episode =>
    episode.actionSchemaKey === state.activeGroupKey && evaluateEpisodeEligibility(episode).eligible,
  );
  const lock = lockedEpisode();
  const candidate = candidates[0];
  if (lock && candidate && lock.actionSchemaKey !== candidate.actionSchemaKey) {
    showConflict({
      lockedSchemaLabel: lock.actionSchemaLabel,
      candidateSchemaLabel: candidate.actionSchemaLabel,
    });
    return;
  }

  state.selectedIds = unique([...state.selectedIds, ...candidates.map(episode => episode.id)]);
  refreshTemplateRecommendation();
  renderAll();
  showToast(`已选择“${candidate?.actionSchemaLabel || '当前动作'}”分组中的 ${candidates.length} 条可用数据`);
}

function publishTask() {
  const result = currentValidation();
  if (!result.ok) {
    showToast(result.errors[0]?.message || '发布校验未通过', true);
    return;
  }

  const lock = lockedEpisode();
  const unknown = lock.actionSchemaKey === ACTION_UNKNOWN;
  const template = unknown
    ? getTemplateForId(state.manualTemplateId)
    : getTemplateForId(state.templateId);
  const templateText = unknown && state.unknownHandling === 'manual-no-template'
    ? '无模板人工标注'
    : `${template?.name || '—'} ${template?.version || ''}`.trim();

  $('#success-description').textContent = '这是原型演示，不会向真实平台写入数据。以下信息已通过前端规则校验，提交时后端还应再次复核。';
  $('#success-receipt').innerHTML = `
    <div><span>数据量</span><strong>${result.summary.episodeCount} 条 Episode</strong></div>
    <div><span>来源任务</span><strong>${result.summary.sourceTaskCount} 个采集任务</strong></div>
    <div><span>动作 Schema</span><strong>${escapeHtml(lock.actionSchemaLabel)}</strong></div>
    <div><span>动作模板</span><strong>${escapeHtml(templateText)}</strong></div>
  `;
  openModal('#success-modal');
}

function initEvents() {
  $('#run-query').addEventListener('click', handleQuery);
  $('#reset-filters').addEventListener('click', () => {
    $('#scene-filter').value = '';
    $('#subscene-filter').value = '';
    $('#source-task-filter').value = '';
    $('#keyword-filter').value = '';
    handleQuery();
  });
  $('#clear-selection').addEventListener('click', () => {
    resetAssemblyState();
    renderAll();
    showToast('已清空选择，动作与模板锁定已解除');
  });
  $('#select-current-group').addEventListener('click', selectCurrentGroup);
  $('#preview-split').addEventListener('click', openSplitPreview);
  $('#conflict-open-split').addEventListener('click', openSplitPreview);
  $('#open-rule-dialog').addEventListener('click', () => openModal('#rule-modal'));
  $('#create-split-drafts').addEventListener('click', () => {
    closeModal($('#split-modal'));
    showToast('已模拟生成动作任务草稿；真实提交时需后端逐条校验');
  });
  $('#task-name').addEventListener('input', renderAssembly);
  $('#annotation-type').addEventListener('change', () => {
    refreshTemplateRecommendation();
    renderAssembly();
  });
  $('#template-select').addEventListener('change', event => {
    state.templateId = event.target.value || null;
    renderAssembly();
  });
  $$('input[name="unknown-handling"]').forEach(input => {
    input.addEventListener('change', event => {
      state.unknownHandling = event.target.value;
      if (state.unknownHandling === 'manual-no-template') {
        state.manualSchemaKey = '';
        state.manualTemplateId = null;
      }
      renderAssembly();
    });
  });
  $('#manual-schema-select').addEventListener('change', event => {
    state.manualSchemaKey = event.target.value;
    state.manualTemplateId = null;
    renderAssembly();
  });
  $('#manual-template-select').addEventListener('change', event => {
    state.manualTemplateId = event.target.value || null;
    renderAssembly();
  });
  $('#publish-task').addEventListener('click', publishTask);

  $$('[data-close-modal]').forEach(button => {
    button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop')));
  });
  $$('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal);
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = $$('.modal-backdrop').find(modal => !modal.hidden);
    if (open) closeModal(open);
  });
}

initEvents();
renderAll();
