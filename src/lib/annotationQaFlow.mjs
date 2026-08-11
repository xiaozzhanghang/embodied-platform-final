export const QA_PACKAGES_STORAGE_KEY = 'embodied_qa_packages';

const padDatePart = value => String(value).padStart(2, '0');

export function formatLocalDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date supplied to formatLocalDateTime');
  }
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-') + ' ' + [
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join(':');
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function sourceTaskId(sourceTask) {
  const match = String(sourceTask || '').match(/COLL-[A-Za-z0-9-]+/);
  return match?.[0] || String(sourceTask || '-');
}

function textValue(value, fallback = '-') {
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return fallback;
}

function normalizeQaPackage(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const qaPackageId = textValue(
    item.qaPackageId,
    textValue(item.instanceId, `QA-RECOVERED-${index + 1}`),
  );
  const dataCount = positiveNumber(item.dataCount);
  const rounds = Array.isArray(item.rounds)
    ? item.rounds
      .filter(round => round && typeof round === 'object' && !Array.isArray(round))
      .map((round, roundIndex) => ({
        ...round,
        round: Math.max(1, positiveNumber(round.round, roundIndex + 1)),
        annotationVersion: Math.max(1, positiveNumber(round.annotationVersion, 1)),
        status: textValue(round.status, '待质检'),
        submittedAt: textValue(round.submittedAt, '-'),
      }))
    : [];

  return {
    ...item,
    key: textValue(item.key, qaPackageId),
    qaPackageId,
    instanceId: textValue(item.instanceId, qaPackageId),
    annotationTaskId: textValue(item.annotationTaskId),
    annotationVersion: Math.max(1, positiveNumber(item.annotationVersion, 1)),
    currentRound: Math.max(1, positiveNumber(item.currentRound, rounds.length || 1)),
    rounds,
    generatedBy: textValue(item.generatedBy),
    project: textValue(item.project),
    secondLevel: textValue(item.secondLevel),
    taskbook: textValue(item.taskbook),
    annoId: textValue(item.annoId),
    taskId: textValue(item.taskId),
    taskName: textValue(item.taskName),
    taskNameEn: textValue(item.taskNameEn, ''),
    annoTaskName: textValue(item.annoTaskName),
    dataCount,
    dataMinutes: textValue(item.dataMinutes, '0.0'),
    qcStatus: textValue(item.qcStatus, '待质检'),
    isShelfTask: textValue(item.isShelfTask, '否'),
    rowCol: textValue(item.rowCol),
    deviceSN: textValue(item.deviceSN),
    deviceType: textValue(item.deviceType),
    qaer: textValue(item.qaer, '待分配'),
    annotator: textValue(item.annotator),
    auditor: textValue(item.auditor),
    collector: textValue(item.collector),
    qcPassCount: positiveNumber(item.qcPassCount),
    qcFailCount: positiveNumber(item.qcFailCount),
    qcTotal: positiveNumber(item.qcTotal, dataCount),
    qcProgress: Math.min(100, positiveNumber(item.qcProgress)),
    annoType: textValue(item.annoType, '范围标注'),
    taskDesc: textValue(item.taskDesc),
    creator: textValue(item.creator),
    createTime: textValue(item.createTime),
    submittedAt: textValue(item.submittedAt),
  };
}

export function readQaPackages(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { packages: [], error: null };
  }
  try {
    const rawValue = storage.getItem(QA_PACKAGES_STORAGE_KEY);
    if (!rawValue) return { packages: [], error: null };
    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch (error) {
      return { packages: [], error };
    }
    if (!Array.isArray(parsed)) {
      return { packages: [], error: new TypeError('Stored QA packages must be an array') };
    }
    return {
      packages: parsed.map(normalizeQaPackage).filter(Boolean),
      error: null,
    };
  } catch (error) {
    return { packages: [], error };
  }
}

export function loadQaPackages(storage) {
  return readQaPackages(storage).packages;
}

function saveQaPackages(storage, packages) {
  if (!storage || typeof storage.setItem !== 'function') {
    return { ok: false, error: new TypeError('QA package storage is unavailable') };
  }
  try {
    storage.setItem(QA_PACKAGES_STORAGE_KEY, JSON.stringify(packages));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

export function isCompletedAnnotationTask(task) {
  const totalCount = positiveNumber(task?.totalCount);
  const finishCount = positiveNumber(task?.finishCount);
  return Boolean(task?.taskId)
    && totalCount > 0
    && finishCount >= totalCount
    && task?.status === '已完成';
}

function buildQaPackage(task, submittedAt) {
  const qaPackageId = `QA-${task.taskId}`;
  const dataCount = positiveNumber(task.totalCount);
  const annotationVersion = Math.max(1, positiveNumber(task.annotationVersion, 1));
  const round = {
    round: 1,
    annotationVersion,
    status: '待质检',
    submittedAt,
  };

  return {
    key: qaPackageId,
    qaPackageId,
    instanceId: qaPackageId,
    annotationTaskId: task.taskId,
    annotationVersion,
    currentRound: 1,
    rounds: [round],
    generatedBy: 'annotation-completed',
    project: task.firstLevel || '-',
    secondLevel: task.secondLevel || '-',
    taskbook: task.taskBookName || '-',
    annoId: task.taskId,
    taskId: sourceTaskId(task.sourceTask),
    taskName: `${task.taskName || task.taskId} · 质检包`,
    taskNameEn: task.taskNameEn || '',
    annoTaskName: task.taskName || task.taskId,
    dataCount,
    dataMinutes: (dataCount * 0.5 / 60).toFixed(1),
    qcStatus: '待质检',
    isShelfTask: task.sceneCategory === 'ShelfArea' || task.subSceneCategory === 'ShelfArea' ? '是' : '否',
    rowCol: '-',
    deviceSN: task.deviceSN || '-',
    deviceType: task.deviceType || '-',
    qaer: '待分配',
    annotator: task.annotator || task.createBy || '-',
    auditor: task.auditor || '-',
    collector: task.collector || '-',
    qcPassCount: 0,
    qcFailCount: 0,
    qcTotal: dataCount,
    qcProgress: 0,
    annoType: task.annoType || '范围标注',
    taskDesc: `${task.taskName || task.taskId}标注结果质量检查`,
    creator: task.createBy || '-',
    createTime: submittedAt,
    submittedAt,
  };
}

function refreshQaPackage(existing, task, submittedAt) {
  const nextVersion = Math.max(1, positiveNumber(task.annotationVersion, 1));
  const dataCount = positiveNumber(task.totalCount);
  const metadata = {
    ...existing,
    project: task.firstLevel || '-',
    secondLevel: task.secondLevel || '-',
    taskbook: task.taskBookName || '-',
    taskId: sourceTaskId(task.sourceTask),
    taskName: `${task.taskName || task.taskId} · 质检包`,
    taskNameEn: task.taskNameEn || '',
    annoTaskName: task.taskName || task.taskId,
    dataCount,
    dataMinutes: (dataCount * 0.5 / 60).toFixed(1),
    qcTotal: dataCount,
    isShelfTask: task.sceneCategory === 'ShelfArea' || task.subSceneCategory === 'ShelfArea' ? '是' : '否',
    annoType: task.annoType || existing.annoType || '范围标注',
    taskDesc: `${task.taskName || task.taskId}标注结果质量检查`,
  };
  const metadataChanged = JSON.stringify(metadata) !== JSON.stringify(existing);
  if (nextVersion <= existing.annotationVersion) {
    return { package: metadata, updated: false, changed: metadataChanged };
  }

  const nextRound = positiveNumber(existing.currentRound) + 1;
  const refreshed = {
    ...metadata,
    annotationVersion: nextVersion,
    currentRound: nextRound,
    rounds: [
      ...(Array.isArray(existing.rounds) ? existing.rounds : []),
      {
        round: nextRound,
        annotationVersion: nextVersion,
        status: '待质检',
        submittedAt,
      },
    ],
    qcStatus: '待质检',
    qcPassCount: 0,
    qcFailCount: 0,
    qcProgress: 0,
    submittedAt,
  };
  return { package: refreshed, updated: true, changed: true };
}

export function syncCompletedAnnotationTasks(storage, tasks, options = {}) {
  const submittedAt = options.submittedAt || formatLocalDateTime(options.now || new Date());
  const readResult = readQaPackages(storage);
  if (readResult.error) {
    return {
      packages: readResult.packages,
      createdPackageIds: [],
      updatedPackageIds: [],
      persisted: false,
      error: readResult.error,
    };
  }
  const storedPackages = readResult.packages;
  let packages = storedPackages;
  const createdPackageIds = [];
  const updatedPackageIds = [];
  let metadataChanged = false;

  for (const task of Array.isArray(tasks) ? tasks : []) {
    if (!isCompletedAnnotationTask(task)) continue;

    const qaPackageId = `QA-${task.taskId}`;
    const existingIndex = packages.findIndex(item => item.qaPackageId === qaPackageId);
    if (existingIndex < 0) {
      packages = [buildQaPackage(task, submittedAt), ...packages];
      createdPackageIds.push(qaPackageId);
      continue;
    }

    const refreshed = refreshQaPackage(packages[existingIndex], task, submittedAt);
    if (refreshed.changed) {
      packages = packages.map((item, index) => index === existingIndex ? refreshed.package : item);
      metadataChanged = true;
    }
    if (refreshed.updated) {
      updatedPackageIds.push(qaPackageId);
    }
  }

  let persistence = { ok: true, error: null };
  if (createdPackageIds.length > 0 || updatedPackageIds.length > 0 || metadataChanged) {
    persistence = saveQaPackages(storage, packages);
  }

  if (!persistence.ok) {
    return {
      packages: storedPackages,
      createdPackageIds: [],
      updatedPackageIds: [],
      persisted: false,
      error: persistence.error,
    };
  }

  return {
    packages,
    createdPackageIds,
    updatedPackageIds,
    persisted: persistence.ok,
    error: persistence.error,
  };
}

export function assignQaerResult(storage, qaPackageId, qaer) {
  const readResult = readQaPackages(storage);
  if (readResult.error) {
    return {
      package: null,
      persisted: false,
      error: readResult.error,
    };
  }
  const packages = readResult.packages;
  let assigned = null;
  const updated = packages.map(item => {
    if (item.qaPackageId !== qaPackageId) return item;
    assigned = { ...item, qaer };
    return assigned;
  });
  if (!assigned) {
    return { package: null, persisted: false, error: null };
  }
  const persistence = saveQaPackages(storage, updated);
  return {
    package: persistence.ok ? assigned : null,
    persisted: persistence.ok,
    error: persistence.error,
  };
}

export function assignQaer(storage, qaPackageId, qaer) {
  const result = assignQaerResult(storage, qaPackageId, qaer);
  return result.persisted ? result.package : null;
}
