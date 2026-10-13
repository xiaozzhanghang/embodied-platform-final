/**
 * dataExportService.js
 * 具身智能视频标注训练数据导出与时序标准化服务
 * 
 * 支持两种主流开源训练框架标准协议：
 * 1. LLaMA-Factory (ShareGPT 格式 + dataset_info.json)
 * 2. Apple MLX-VLM (多图时序 JSONL 格式)
 * 3. 具身工业基准 taskinfo.json 标准归档
 */

/**
 * 校验标注步骤的时序合法性
 * @param {Array} steps - 动作步骤数组
 * @param {number} totalFrames - 视频总帧数
 * @returns {Object} 校验结果
 */
export function validateAnnotationSteps(steps = [], totalFrames = 3457) {
  const issues = [];
  if (!steps || steps.length === 0) {
    return {
      isValid: false,
      issues: ['未包含任何动作步骤，无法导出训练集'],
      coverageRatio: 0,
      totalDurationSec: 0,
      stepCount: 0
    };
  }

  let totalCoveredFrames = 0;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.startFrame == null || s.endFrame == null || s.startFrame >= s.endFrame) {
      issues.push(`步骤 #${s.stepNo || i + 1} (${s.skill || '未知'}) 帧区间异常: [${s.startFrame}, ${s.endFrame}]`);
    }
    if (s.endFrame > totalFrames) {
      issues.push(`步骤 #${s.stepNo || i + 1} 结束帧 ${s.endFrame} 超出视频总帧数 ${totalFrames}`);
    }
    // 检查与上一步骤重叠
    if (i > 0) {
      const prev = steps[i - 1];
      if (s.startFrame < prev.endFrame) {
        issues.push(`步骤 #${prev.stepNo || i} 与步骤 #${s.stepNo || i + 1} 存在时序交叠 (${prev.endFrame} > ${s.startFrame})`);
      }
    }
    totalCoveredFrames += Math.max(0, (s.endFrame || 0) - (s.startFrame || 0));
  }

  const coverageRatio = totalFrames > 0 ? Math.min(1, totalCoveredFrames / totalFrames) : 0;
  const fps = 30;
  const totalDurationSec = Number((totalCoveredFrames / fps).toFixed(2));

  return {
    isValid: issues.length === 0,
    issues,
    coverageRatio: Number((coverageRatio * 100).toFixed(1)),
    totalDurationSec,
    stepCount: steps.length
  };
}

/**
 * 构建 LLaMA-Factory 规范的 dataset_info.json 配置片段
 */
export function generateLlamaFactoryDatasetInfo(datasetKey = 'embodied_assembly_sft') {
  return {
    [datasetKey]: {
      file_name: `${datasetKey}.json`,
      formatting: 'sharegpt',
      columns: {
        messages: 'messages',
        videos: 'videos'
      },
      tags: {
        role_tag: 'from',
        content_tag: 'value',
        user_tag: 'human',
        assistant_tag: 'gpt'
      }
    }
  };
}

/**
 * 转换步骤为相对时间戳 (用于 VLM 局部切片微调)
 */
export function normalizeToRelativeTime(steps, windowStartSec = 0, fps = 30) {
  return steps.map(s => {
    const absStartSec = Number((s.startFrame / fps).toFixed(2));
    const absEndSec = Number((s.endFrame / fps).toFixed(2));
    const relStartSec = Math.max(0, Number((absStartSec - windowStartSec).toFixed(2)));
    const relEndSec = Math.max(relStartSec, Number((absEndSec - windowStartSec).toFixed(2)));
    return {
      ...s,
      relTimeRange: [relStartSec, relEndSec],
      absTimeRange: [absStartSec, absEndSec]
    };
  });
}

/**
 * 导出 LLaMA-Factory 标准多模态 ShareGPT 训练数据集
 */
export function generateLlamaFactoryShareGpt(steps = [], episode = {}, options = {}) {
  const {
    relativeTime = false,
    windowStartSec = 0,
    fps = 30,
    videoPath = `videos/${episode.id || 'malihao_180_1'}.mp4`
  } = options;

  const normalized = normalizeToRelativeTime(steps, relativeTime ? windowStartSec : 0, fps);

  // 构造标准 GPT 响应 JSON 字符串
  const targetOutput = normalized.map((s, idx) => ({
    stepNo: s.stepNo || (idx + 1),
    time_range_sec: relativeTime ? s.relTimeRange : s.absTimeRange,
    start_frame: s.startFrame,
    end_frame: s.endFrame,
    skill: s.skill || s.actionSkill || '未知动作',
    object: s.object || s.actionTarget || '作业工件',
    arm: s.arm || '双臂协作',
    goal: s.goal || s.expectedGoal || '状态达成'
  }));

  const sample = {
    id: `embodied_${episode.id || 'task'}_win${Math.round(windowStartSec)}`,
    videos: [videoPath],
    messages: [
      {
        from: 'human',
        value: '<video>\n请对具身机器人作业视频进行动作语义与时间戳分解，输出标准四元组（时间区间、操作动作、目标工件、预期状态）的结构化 JSON。'
      },
      {
        from: 'gpt',
        value: JSON.stringify(targetOutput, null, 2)
      }
    ]
  };

  return [sample];
}

/**
 * 导出 Apple MLX-VLM 格式 (多图关键帧序列 JSONL)
 */
export function generateMlxVlmDataset(steps = [], episode = {}, options = {}) {
  const {
    relativeTime = false,
    windowStartSec = 0,
    fps = 30,
    keyframeFilenames = [
      'frames/frame_0000.jpg',
      'frames/frame_0475.jpg',
      'frames/frame_1071.jpg',
      'frames/frame_1546.jpg',
      'frames/frame_2328.jpg',
      'frames/frame_3456.jpg'
    ]
  } = options;

  const normalized = normalizeToRelativeTime(steps, relativeTime ? windowStartSec : 0, fps);

  const targetSteps = normalized.map((s, idx) => ({
    step_id: s.stepId || `step-${idx + 1}`,
    step_no: s.stepNo || (idx + 1),
    time_range: relativeTime ? s.relTimeRange : s.absTimeRange,
    skill: s.skill || s.actionSkill,
    object: s.object || s.actionTarget,
    arm: s.arm,
    goal: s.goal
  }));

  const record = {
    images: keyframeFilenames,
    messages: [
      {
        role: 'user',
        content: '输入为具身装配机器人操作视频的关键帧序列。请按装配工艺时序输出结构化动作步骤与起止相对时间戳。'
      },
      {
        role: 'assistant',
        content: '```json\n' + JSON.stringify(targetSteps, null, 2) + '\n```'
      }
    ]
  };

  return JSON.stringify(record);
}

/**
 * 具身工业基准 taskinfo.json 标准归档格式
 */
export function generateTaskInfoArchive(steps = [], episode = {}, revisions = [], rawAiMeta = {}) {
  const fps = 30;
  const totalFrames = episode.totalFrames || 3457;

  return {
    schema_version: '2.1.0',
    exported_at: new Date().toISOString(),
    task_info: {
      task_id: episode.id || 'malihao_180_1',
      task_name: episode.title || '工件锁付装配操作',
      operator: '具身质检专家 (Auditor)',
      audit_status: 'approved',
      station: '工业装配工位-03',
    },
    video_meta: {
      filename: episode.videoName || 'ego_cam1.MP4',
      fps,
      total_frames: totalFrames,
      duration_sec: Number((totalFrames / fps).toFixed(2)),
      resolution: '1920x1080',
      codec: 'H.264/AVC'
    },
    ground_truth_steps: steps.map((s, idx) => ({
      step_no: s.stepNo || (idx + 1),
      skill: s.skill || s.actionSkill,
      object: s.object || s.actionTarget,
      arm: s.arm,
      goal: s.goal,
      start_frame: s.startFrame,
      end_frame: s.endFrame,
      start_sec: Number((s.startFrame / fps).toFixed(2)),
      end_sec: Number((s.endFrame / fps).toFixed(2)),
      confidence: s.confidence ?? 1.0,
      verified_by_human: true,
      last_modified: s.lastModified || '人工终审修正'
    })),
    raw_ai_candidate_snapshot: rawAiMeta.candidates || [],
    raw_ai_response_text: rawAiMeta.rawText || '',
    revision_history: revisions || []
  };
}

/**
 * 本地持久化保存与读取 (使用 localStorage)
 */
const STORAGE_PREFIX = 'embodied_platform_taskinfo_';

export function saveTaskInfoToStorage(episodeId, data) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${episodeId}`,
        JSON.stringify({ data, savedAt: new Date().toISOString() })
      );
      return true;
    }
  } catch (err) {
    console.error('saveTaskInfoToStorage error:', err);
  }
  return false;
}

export function loadTaskInfoFromStorage(episodeId) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${episodeId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.error('loadTaskInfoFromStorage error:', err);
  }
  return null;
}
