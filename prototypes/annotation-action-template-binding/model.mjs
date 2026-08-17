export const ACTION_UNKNOWN = '__unknown_action__';

const normalizeSchemaKey = episode => episode?.actionSchemaKey || ACTION_UNKNOWN;

const unique = values => [...new Set(values.filter(Boolean))];

export function evaluateEpisodeEligibility(episode) {
  if (!episode || episode.available === false) {
    return { eligible: false, code: 'NOT_AVAILABLE', reason: '数据已被占用' };
  }
  if (!Number.isFinite(episode.frames) || episode.frames <= 0) {
    return { eligible: false, code: 'EMPTY_EPISODE', reason: '帧数为 0' };
  }
  if (episode.qcStatus === 'pending') {
    return { eligible: false, code: 'QC_NOT_PASSED', reason: '质检未完成' };
  }
  if (episode.qcStatus !== 'passed') {
    return { eligible: false, code: 'QC_NOT_PASSED', reason: '质检未通过' };
  }
  return { eligible: true, code: 'READY', reason: '可用于标注' };
}

export function groupEpisodesBySchema(episodes = []) {
  const groups = new Map();

  episodes.forEach(episode => {
    const key = normalizeSchemaKey(episode);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: key === ACTION_UNKNOWN ? '未识别动作' : episode.actionSchemaLabel || key,
        episodeIds: [],
        sourceTaskIds: new Set(),
        eligibleCount: 0,
        totalFrames: 0,
      });
    }

    const group = groups.get(key);
    group.episodeIds.push(episode.id);
    group.sourceTaskIds.add(episode.sourceTaskId);
    group.totalFrames += Number.isFinite(episode.frames) ? episode.frames : 0;
    if (evaluateEpisodeEligibility(episode).eligible) group.eligibleCount += 1;
  });

  return [...groups.values()].map(group => ({
    key: group.key,
    label: group.label,
    count: group.episodeIds.length,
    eligibleCount: group.eligibleCount,
    episodeIds: group.episodeIds,
    sourceTaskCount: group.sourceTaskIds.size,
    totalFrames: group.totalFrames,
  }));
}

export function toggleEpisodeSelection({ episodes = [], selectedIds = [], episodeId }) {
  if (selectedIds.includes(episodeId)) {
    const nextIds = selectedIds.filter(id => id !== episodeId);
    const remaining = episodes.filter(episode => nextIds.includes(episode.id));
    return {
      ok: true,
      action: 'removed',
      selectedIds: nextIds,
      lockedSchemaKey: remaining.length ? normalizeSchemaKey(remaining[0]) : null,
      lockedSchemaLabel: remaining.length ? remaining[0].actionSchemaLabel : null,
    };
  }

  const episode = episodes.find(item => item.id === episodeId);
  if (!episode) {
    return {
      ok: false,
      code: 'EPISODE_NOT_FOUND',
      reason: '未找到该数据',
      selectedIds: [...selectedIds],
    };
  }

  const eligibility = evaluateEpisodeEligibility(episode);
  if (!eligibility.eligible) {
    return {
      ok: false,
      code: eligibility.code,
      reason: eligibility.reason,
      selectedIds: [...selectedIds],
    };
  }

  const selectedEpisodes = episodes.filter(item => selectedIds.includes(item.id));
  const lockedEpisode = selectedEpisodes[0];
  const lockedSchemaKey = lockedEpisode ? normalizeSchemaKey(lockedEpisode) : null;
  const candidateSchemaKey = normalizeSchemaKey(episode);

  if (lockedSchemaKey && lockedSchemaKey !== candidateSchemaKey) {
    return {
      ok: false,
      code: 'MIXED_ACTION_SCHEMA',
      reason: '所选数据属于不同动作，不能共用一个动作模板',
      selectedIds: [...selectedIds],
      lockedSchemaKey,
      lockedSchemaLabel: lockedEpisode.actionSchemaLabel || '未识别动作',
      candidateSchemaKey,
      candidateSchemaLabel: episode.actionSchemaLabel || '未识别动作',
    };
  }

  return {
    ok: true,
    action: 'added',
    selectedIds: [...selectedIds, episodeId],
    lockedSchemaKey: candidateSchemaKey,
    lockedSchemaLabel: episode.actionSchemaLabel || '未识别动作',
  };
}

function templateMatches({ template, schemaKey, deviceTypes, annotationType }) {
  return template.status === 'published'
    && template.actionSchemaKey === schemaKey
    && (template.deviceType === 'any' || deviceTypes.every(device => device === template.deviceType))
    && template.annotationTypes?.includes(annotationType);
}

export function getCompatibleTemplates({
  templates = [],
  episodes = [],
  selectedIds = [],
  annotationType,
  schemaKey: overrideSchemaKey,
} = {}) {
  const selectedEpisodes = episodes.filter(episode => selectedIds.includes(episode.id));
  const schemaKeys = unique(selectedEpisodes.map(normalizeSchemaKey));
  const schemaKey = overrideSchemaKey || (schemaKeys.length === 1 ? schemaKeys[0] : null);
  if (!schemaKey || schemaKey === ACTION_UNKNOWN) return [];

  const deviceTypes = unique(selectedEpisodes.map(episode => episode.deviceType));
  return templates
    .filter(template => templateMatches({ template, schemaKey, deviceTypes, annotationType }))
    .sort((left, right) => Number(Boolean(right.recommended)) - Number(Boolean(left.recommended)));
}

export function buildSplitPlan({ episodes = [], selectedIds = [], templates = [], annotationType } = {}) {
  const selectedEpisodes = episodes.filter(episode => selectedIds.includes(episode.id));
  const groups = groupEpisodesBySchema(selectedEpisodes);

  return groups.map(group => {
    const groupEpisodes = selectedEpisodes.filter(episode => normalizeSchemaKey(episode) === group.key);
    const groupIds = groupEpisodes.map(episode => episode.id);
    const compatibleTemplates = getCompatibleTemplates({
      templates,
      episodes: groupEpisodes,
      selectedIds: groupIds,
      annotationType,
    });

    return {
      actionSchemaKey: group.key,
      actionSchemaLabel: group.label,
      episodeIds: groupIds,
      episodeCount: groupIds.length,
      sourceTaskCount: unique(groupEpisodes.map(episode => episode.sourceTaskId)).length,
      totalFrames: groupEpisodes.reduce((total, episode) => total + (episode.frames || 0), 0),
      recommendedTemplateId: compatibleTemplates[0]?.id || null,
      recommendedTemplateName: compatibleTemplates[0]?.name || null,
      requiresManualHandling: group.key === ACTION_UNKNOWN,
    };
  });
}

export function validateAnnotationTask({
  name,
  annotationType,
  episodes = [],
  selectedIds = [],
  templates = [],
  templateId,
  unknownHandling,
  manualSchemaKey,
} = {}) {
  const errors = [];
  const selectedEpisodes = episodes.filter(episode => selectedIds.includes(episode.id));

  if (!name?.trim()) {
    errors.push({ code: 'NAME_REQUIRED', message: '请填写标注任务名称' });
  }
  if (!annotationType) {
    errors.push({ code: 'ANNOTATION_TYPE_REQUIRED', message: '请选择标注类型' });
  }
  if (!selectedIds.length) {
    errors.push({ code: 'EPISODE_REQUIRED', message: '请至少选择一条可标注数据' });
  }
  if (selectedEpisodes.length !== selectedIds.length) {
    errors.push({ code: 'EPISODE_NOT_FOUND', message: '部分所选数据已不存在，请重新查询' });
  }

  selectedEpisodes.forEach(episode => {
    const eligibility = evaluateEpisodeEligibility(episode);
    if (!eligibility.eligible) {
      errors.push({
        code: eligibility.code,
        episodeId: episode.id,
        message: `${episode.id}：${eligibility.reason}`,
      });
    }
  });

  const schemaKeys = unique(selectedEpisodes.map(normalizeSchemaKey));
  if (schemaKeys.length > 1) {
    errors.push({ code: 'MIXED_ACTION_SCHEMA', message: '所选数据包含多个动作，请按动作拆分任务' });
  }

  if (schemaKeys.length === 1 && annotationType) {
    const schemaKey = schemaKeys[0];
    if (schemaKey === ACTION_UNKNOWN) {
      if (unknownHandling === 'manual-no-template') {
        if (templateId) {
          errors.push({ code: 'UNKNOWN_TEMPLATE_CONFLICT', message: '无模板人工标注模式不能同时绑定动作模板' });
        }
      } else if (unknownHandling === 'bind-template') {
        if (!manualSchemaKey || !templateId) {
          errors.push({ code: 'MANUAL_BINDING_REQUIRED', message: '请先补充动作分类并选择对应模板' });
        } else {
          const compatible = getCompatibleTemplates({
            templates,
            episodes: selectedEpisodes,
            selectedIds,
            annotationType,
            schemaKey: manualSchemaKey,
          });
          if (!compatible.some(template => template.id === templateId)) {
            errors.push({ code: 'TEMPLATE_INCOMPATIBLE', message: '所选模板与人工补充的动作分类不兼容' });
          }
        }
      } else {
        errors.push({ code: 'UNKNOWN_ACTION_UNRESOLVED', message: '未识别动作必须明确选择人工无模板或补充动作分类' });
      }
    } else if (!templateId) {
      errors.push({ code: 'TEMPLATE_REQUIRED', message: '已识别动作必须绑定一个兼容动作模板' });
    } else {
      const compatible = getCompatibleTemplates({
        templates,
        episodes: selectedEpisodes,
        selectedIds,
        annotationType,
      });
      if (!compatible.some(template => template.id === templateId)) {
        errors.push({ code: 'TEMPLATE_INCOMPATIBLE', message: '所选动作模板与数据动作、设备或标注类型不兼容' });
      }
    }
  }

  const sourceTaskIds = unique(selectedEpisodes.map(episode => episode.sourceTaskId));
  const totalFrames = selectedEpisodes.reduce((total, episode) => total + (episode.frames || 0), 0);
  const schemaKey = schemaKeys.length === 1 ? schemaKeys[0] : null;
  const schemaEpisode = selectedEpisodes.find(episode => normalizeSchemaKey(episode) === schemaKey);

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      episodeCount: selectedEpisodes.length,
      sourceTaskCount: sourceTaskIds.length,
      schemaCount: schemaKeys.length,
      totalFrames,
      schemaKey,
      schemaLabel: schemaEpisode?.actionSchemaLabel || null,
      templateId: templateId || null,
    },
  };
}
