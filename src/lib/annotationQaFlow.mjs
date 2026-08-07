export const QA_PACKAGES_STORAGE_KEY = 'embodied_qa_packages';

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function nowText() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function sourceTaskId(sourceTask) {
  const match = String(sourceTask || '').match(/COLL-[A-Za-z0-9-]+/);
  return match?.[0] || String(sourceTask || '-');
}

export function loadQaPackages(storage) {
  if (!storage || typeof storage.getItem !== 'function') return [];
  const value = safeParse(storage.getItem(QA_PACKAGES_STORAGE_KEY), []);
  return Array.isArray(value) ? value : [];
}

function saveQaPackages(storage, packages) {
  if (!storage || typeof storage.setItem !== 'function') return;
  storage.setItem(QA_PACKAGES_STORAGE_KEY, JSON.stringify(packages));
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
  const submittedAt = options.submittedAt || nowText();
  let packages = loadQaPackages(storage);
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

  if (createdPackageIds.length > 0 || updatedPackageIds.length > 0 || metadataChanged) {
    saveQaPackages(storage, packages);
  }

  return { packages, createdPackageIds, updatedPackageIds };
}

export function assignQaer(storage, qaPackageId, qaer) {
  const packages = loadQaPackages(storage);
  let assigned = null;
  const updated = packages.map(item => {
    if (item.qaPackageId !== qaPackageId) return item;
    assigned = { ...item, qaer };
    return assigned;
  });
  if (assigned) saveQaPackages(storage, updated);
  return assigned;
}
