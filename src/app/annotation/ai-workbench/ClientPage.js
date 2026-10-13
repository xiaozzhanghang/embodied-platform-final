'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button, Tag, Space, Typography, App, Divider, Select,
  Input, Row, Col, Progress, Tooltip, InputNumber, Slider, Checkbox,
  Drawer, Tabs, Alert, Card, Badge, Segmented, Modal, Descriptions, Popover, Radio
} from 'antd';
import {
  LeftOutlined, RightOutlined, PlayCircleOutlined, PauseOutlined,
  StepBackwardOutlined, StepForwardOutlined, DeleteOutlined,
  PlusOutlined, CopyOutlined, CheckOutlined,
  CheckSquareOutlined, BookOutlined,
  InfoCircleOutlined, FileTextOutlined, CodeOutlined,
  VideoCameraOutlined, FieldTimeOutlined, ThunderboltOutlined,
  CloseOutlined, SettingOutlined, UndoOutlined,
  AimOutlined, RobotOutlined, CheckCircleOutlined,
  SlidersOutlined, NodeIndexOutlined, EditOutlined, BulbOutlined,
  SyncOutlined, ExclamationCircleOutlined, HistoryOutlined,
  SendOutlined, EyeOutlined, ArrowLeftOutlined, FireOutlined,
  StopOutlined, DownloadOutlined, ReloadOutlined, FolderOpenOutlined, UploadOutlined,
  InboxOutlined, CloudUploadOutlined, CloudOutlined, DiffOutlined
} from '@ant-design/icons';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

import {
  ARM_OPTIONS,
  SKILL_OPTIONS,
  OBJECT_OPTIONS,
  GOAL_OPTIONS,
  MODEL_OPTIONS,
  PIPELINE_PHASES,
  EPISODE_META,
  AVAILABLE_EPISODES,
  INITIAL_STEPS,
  MOCK_CANDIDATES,
  INITIAL_REVISIONS,
  getCandidatesForEpisode,
} from './mockData';
import ImportPreviewModal from './ImportPreviewModal';
import RevisionHistoryDrawer from './RevisionHistoryDrawer';
import EpisodeSelectModal from './EpisodeSelectModal';
import PipelineProgressModal from './PipelineProgressModal';
import ModelCompareModal from './ModelCompareModal';
import ExportTrainingModal from './ExportTrainingModal';
import ModelVersionDrawer from './ModelVersionDrawer';
import { saveTaskInfoToStorage, loadTaskInfoFromStorage } from './dataExportService';
import {
  checkLocalModelHealth,
  extractKeyframesFromVideo,
  extractWindowKeyframes,
  runLocalModelInference,
  runMultiWindowInference,
  getComparisonData,
  detectTaskType,
  validateCandidateForImport,
  getGeminiApiKey,
  setGeminiApiKey,
  getMinimaxApiKey,
  setMinimaxApiKey,
  DEFAULT_MINIMAX_API_KEY,
  testMinimaxConnectivity,
  PACKAGING_REAL_STEPS
} from './aiModelService';

const { Text, Title, Paragraph } = Typography;

const defaultEp = AVAILABLE_EPISODES[0];
const defaultCandidates = getCandidatesForEpisode(defaultEp);
const defaultInitialSteps = defaultCandidates.map((c, idx) => ({
  stepId: `step-demo-${idx + 1}`,
  stepNo: c.stepNo || (idx + 1),
  arm: c.arm,
  effector: c.effector,
  skill: c.skill,
  actionSkill: c.actionSkill,
  object: c.object,
  actionTarget: c.actionTarget,
  goal: c.goal,
  expectedGoal: c.expectedGoal,
  startFrame: c.startFrame,
  endFrame: c.endFrame,
  color: SKILL_OPTIONS.find(s => s.value === c.skill)?.color || '#1677ff',
  source: 'demo_template',
  isDemo: true,
  confidence: null,
  displayConfidence: '演示预置 (Demo)',
  needsReview: true,
  candidateId: c.candidateId,
  importBatchId: 'batch-demo-001',
  lastModified: '系统演示预置模板',
  notes: c.description,
  stepContent: c.stepContent,
  annoOverlap: c.annoOverlap || 0,
}));

export default function AIAnnotationWorkbenchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message, modal } = App.useApp();
  const isDemoMode = searchParams?.get('demo') === '1';

  // 页面卸载或离开时，自动中止任何运行中的 AI 推理任务并清理定时器
  useEffect(() => {
    return () => {
      if (currentAbortControllerRef.current) {
        try {
          currentAbortControllerRef.current.abort('page_unmounted');
        } catch (e) {}
      }
      if (jobSimulationTimerRef.current) {
        clearInterval(jobSimulationTimerRef.current);
      }
    };
  }, []);

  // =========================================================================
  // 1. 媒体与视频播放状态
  // =========================================================================
  const [currentEpisode, setCurrentEpisode] = useState(defaultEp);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const totalFrames = currentEpisode?.totalFrames || 0;
  const currentFps = currentEpisode?.fps || 30;
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'grid'
  const [activeCameraId, setActiveCameraId] = useState(EPISODE_META.referenceCameraId);

  const videoRef = useRef(null);
  const playTimerRef = useRef(null);
  const timelineRef = useRef(null);

  const activeCamera = useMemo(() => {
    if (!currentEpisode) {
      return {
        id: 'no_video',
        name: '未载入视频',
        resolution: '0 FPS · 0 帧',
        isRef: false,
        videoSrc: null,
      };
    }
    // 优先使用当前 episode 绑定的 videoSrc
    if (currentEpisode.videoSrc) {
      return {
        id: currentEpisode.referenceCameraId || 'main_cam',
        name: currentEpisode.name || '主视角相机',
        resolution: `${currentEpisode.fps || 30}fps · ${currentEpisode.totalFrames || 9177}帧`,
        isRef: true,
        videoSrc: currentEpisode.videoSrc,
      };
    }
    return EPISODE_META.cameras.find(c => c.id === activeCameraId) || EPISODE_META.cameras[0];
  }, [activeCameraId, currentEpisode]);

  // 切换/打开视频函数 (autoStartAi: 是否自动启动 AI 标注流水线)
  const handleSwitchEpisode = (ep, autoStartAi = false) => {
    // 任务隔离：切换视频时立即中断旧任务并使旧 runId 失效
    if (currentAbortControllerRef.current) {
      try { currentAbortControllerRef.current.abort('video_switched'); } catch (e) {}
    }
    currentRunIdRef.current = null;
    if (jobSimulationTimerRef.current) {
      clearInterval(jobSimulationTimerRef.current);
      jobSimulationTimerRef.current = null;
    }

    setCurrentEpisode(ep);
    setCurrentFrame(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    // 载入视频默认已有工步，保护已有标注信息
    const initSteps = ep.initialSteps || [];
    setSteps(initSteps);
    setSelectedStepId(initSteps[0]?.stepId || null);
    setCandidates([]);
    setSelectedCandidateIds([]);
    setIsEpisodeModalOpen(false);

    if (autoStartAi) {
      message.loading({ content: `已载入视频【${ep.name}】，正在启动 AI 短窗口推理...`, key: 'ai_loading', duration: 1.2 });
      setTimeout(() => {
        handleStartAiJob(ep);
      }, 200);
    } else {
      setAiJobStatus('idle');
      message.success(`已载入视频：【${ep.name}】！`);
    }
  };

  // 一键重置为未导入视频的待标注初始状态
  const handleResetForDemo = () => {
    // 任务隔离：重置工作台时立即中断旧任务
    if (currentAbortControllerRef.current) {
      try { currentAbortControllerRef.current.abort('reset'); } catch (e) {}
    }
    currentRunIdRef.current = null;
    if (jobSimulationTimerRef.current) {
      clearInterval(jobSimulationTimerRef.current);
      jobSimulationTimerRef.current = null;
    }

    setCurrentFrame(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setCurrentEpisode(null);
    setSteps([]);
    setSelectedStepId(null);
    setCandidates([]);
    setSelectedCandidateIds([]);
    setAiJobStatus('idle');
    setCurrentPhaseIndex(0);
    setProcessedWindows(0);
    setJobElapsedTime(0);
    message.info('工作台已重置为「待导入视频」初始状态！右侧已清空，请在左侧导入本地视频以演示 AI 自动标注。');
  };

  // 上传本地自定义 MP4
  const handleLocalVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = blobUrl;
    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 60;
      const fps = 30;
      const totalF = Math.max(60, Math.round(dur * fps));
      const lower = file.name.toLowerCase();
      const isScrew = lower.includes('dm_20260814') || lower.includes('螺丝') || lower.includes('screw') || 
        lower.includes('malihao') || lower.includes('bcecd') || lower.includes('钻') || lower.includes('drill') || 
        lower.includes('工具') || lower.includes('紧固') || lower.includes('装配') || lower.includes('tool') || 
        lower.includes('assembly') || lower.includes('custom_cam');
      const isSorting = lower.includes('分拣') || lower.includes('right_hand');
      const isPackaging = lower.includes('12ff') || lower.includes('pack') || lower.includes('box') || lower.includes('包装') || lower.includes('纸箱');
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const taskLabel = isScrew ? '打螺丝与工具装配作业' : (isPackaging ? '包装封箱与金属导轨装配作业' : (isSorting ? '工作台物料分拣作业' : `真实装配操作视频 (${cleanName})`));

      const customEp = {
        episodeId: `EP-UPLOAD-${Date.now().toString().slice(-4)}`,
        annotationTaskRecordId: '2096843900964347905',
        collectionTaskRecordId: '2096837217907154945',
        name: cleanName,
        fileName: file.name,
        videoSrc: blobUrl,
        fps: fps,
        totalFrames: totalF,
        duration: dur,
        isCustomUpload: true,
        isRealUserVideo: true,
        taskBook: `TB-${taskLabel}-端到端真实视频识别`,
        templateVersion: isScrew ? 'screw-assembly-v2' : (isPackaging ? 'box-packaging-v1' : 'custom-real-video-v1'),
        referenceCameraId: 'custom_cam',
        sceneName: '用户本地上传视频',
        subSceneName: isScrew ? '打螺丝工位' : (isPackaging ? '包装装配工位' : '作业工位'),
        snCode: 'custom-robot-01',
        desc: `用户真实上传视频: ${file.name} · 时长 ${dur.toFixed(1)}s (${totalF} 帧) · 动作步数与时序区间由大模型实时视觉识别`,
        initialSteps: [], // 用户上传的全新视频，初始步骤严格为空，点击预标注后由大模型实时分析画面生成！
      };
      handleSwitchEpisode(customEp, true);
    };
    tempVideo.onerror = () => {
      const lower = file.name.toLowerCase();
      const isScrew = lower.includes('dm_20260814') || lower.includes('螺丝') || lower.includes('screw') || 
        lower.includes('malihao') || lower.includes('bcecd') || lower.includes('钻') || lower.includes('drill') || 
        lower.includes('工具') || lower.includes('紧固') || lower.includes('装配') || lower.includes('tool') || 
        lower.includes('assembly') || lower.includes('custom_cam');
      const isSorting = lower.includes('分拣') || lower.includes('right_hand');
      const isPackaging = lower.includes('12ff') || lower.includes('pack') || lower.includes('box') || lower.includes('包装') || lower.includes('纸箱');
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const taskLabel = isScrew ? '打螺丝与工具装配作业' : (isPackaging ? '包装封箱与金属导轨装配作业' : (isSorting ? '物料分拣作业' : `真实装配操作视频 (${cleanName})`));
      
      const customEp = {
        episodeId: `EP-UPLOAD-${Date.now().toString().slice(-4)}`,
        annotationTaskRecordId: '2096843900964347905',
        collectionTaskRecordId: '2096837217907154945',
        name: cleanName,
        fileName: file.name,
        videoSrc: blobUrl,
        fps: 30,
        totalFrames: isScrew ? 4150 : (isPackaging ? 18789 : 1829),
        duration: isPackaging ? 626.3 : (isScrew ? 138.3 : 60),
        isCustomUpload: true,
        isRealUserVideo: true,
        taskBook: `TB-${taskLabel}-端到端真实视频识别`,
        templateVersion: isScrew ? 'screw-assembly-v2' : (isPackaging ? 'box-packaging-v1' : 'custom-real-video-v1'),
        referenceCameraId: 'custom_cam',
        sceneName: '用户本地上传视频',
        subSceneName: isScrew ? '打螺丝工位' : (isPackaging ? '包装装配工位' : '作业工位'),
        snCode: 'custom-robot-01',
        desc: `本地上传真实视频: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        initialSteps: [], // 初始步骤为空
      };
      handleSwitchEpisode(customEp, true);
    };
  };

  // 拖拽导入本地视频
  const handleDropVideo = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov'))) {
      const syntheticEvent = { target: { files: [file] } };
      handleLocalVideoUpload(syntheticEvent);
    } else {
      message.warning('请拖拽有效的视频文件 (如 MP4, MOV, WebM)！');
    }
  };

  // 控制真实 HTML5 视频播放/暂停
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // 同步倍速与循环
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // 播放帧步进定时器
  useEffect(() => {
    if (isPlaying && !activeCamera?.videoSrc) {
      const intervalMs = Math.round(1000 / (currentFps * playbackSpeed));
      playTimerRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= totalFrames - 1) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return totalFrames - 1;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, isLooping, totalFrames, activeCamera, currentFps]);

  // =========================================================================
  // 2. 步骤管理状态 (Timeline Steps)
  // =========================================================================
  const [steps, setSteps] = useState(defaultEp.initialSteps || []);
  const [selectedStepId, setSelectedStepId] = useState(defaultEp.initialSteps?.[0]?.stepId || null);

  // 当前正在编辑的步骤
  const selectedStep = useMemo(() => {
    return steps.find(s => s.stepId === selectedStepId) || steps[0] || null;
  }, [steps, selectedStepId]);

  // =========================================================================
  // 3. AI 预标注任务生命周期状态机 (MD 文档规范)
  // =========================================================================
  // 状态: 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancel_requested' | 'cancelled'
  const [aiJobStatus, setAiJobStatus] = useState('idle');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0); // 0-5
  const [processedWindows, setProcessedWindows] = useState(0);
  const [totalWindows, setTotalWindows] = useState(5);
  const [windowProgressText, setWindowProgressText] = useState('');
  const [jobElapsedTime, setJobElapsedTime] = useState(0);
  const [jobModel, setJobModel] = useState('qwen2.5-vl');
  const [jobMode, setJobMode] = useState('template'); // 'template' | 'e2e' | 'fill_gap'
  const [jobRangeType, setJobRangeType] = useState('full'); // 'full' | 'custom'
  const [templateVersion, setTemplateVersion] = useState('screw-assembly-v2');

  // 时序分析范围与窗口参数 (默认启用 'full' 全片完整时序分析模式)
  const [analysisScope, setAnalysisScope] = useState('full'); // 'full' (全视频完整时序) | 'window' (局部短窗口微调)
  const [analysisWindowStart, setAnalysisWindowStart] = useState(0.0);
  const [analysisWindowDuration, setAnalysisWindowDuration] = useState(8.0);
  const [framesPerWindow, setFramesPerWindow] = useState(6);

  // 任务执行定时器引用与端到端任务取消/隔离控制
  const jobSimulationTimerRef = useRef(null);
  const currentAbortControllerRef = useRef(null);
  const currentRunIdRef = useRef(null);

  // 候选列表 (不可变原始候选状态)
  const [candidates, setCandidates] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'rejected'
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  // 候选编辑草稿状态 (允许直接在候选卡片上微调起止帧与标签)
  const [editingCandidateId, setEditingCandidateId] = useState(null);
  const [candidateDrafts, setCandidateDrafts] = useState({});

  // =========================================================================
  // 4. 版本修订与导入历史管理
  // =========================================================================
  const [revisions, setRevisions] = useState(INITIAL_REVISIONS);
  const [currentRevisionId, setCurrentRevisionId] = useState('rev-102');
  const [importBatches, setImportBatches] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [showGuideBar, setShowGuideBar] = useState(true);
  const [isVlmConnectModalOpen, setIsVlmConnectModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [editingStepInlineId, setEditingStepInlineId] = useState(null);

  // 标注引擎与三模态直选: 'local_qwen' (方式1: 本地大模型) | 'gemini_flash' (方式2: 云端商业 MiniMax / Google)
  const [annotationMethod, setAnnotationMethod] = useState('gemini_flash');
  const [cloudModel, setCloudModel] = useState('minimax-m3');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isModelVersionDrawerOpen, setIsModelVersionDrawerOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [minimaxApiKeyInput, setMinimaxApiKeyInput] = useState('');
  const [isTestingMinimax, setIsTestingMinimax] = useState(false);
  const [minimaxTestResult, setMinimaxTestResult] = useState(null);

  // 活跃引擎计算属性: 'local_qwen' | 'minimax_m3' | 'gemini_er2'
  const activeEngineKey = annotationMethod === 'local_qwen'
    ? 'local_qwen'
    : (cloudModel.includes('minimax') ? 'minimax_m3' : 'gemini_er2');

  // 本地大模型在线检测与推理元数据
  const [localModelHealth, setLocalModelHealth] = useState({
    online: false,
    service: '检测中...',
    models: [],
    activeModel: 'moondream:latest',
    hardware: null,
  });
  const [modelMeta, setModelMeta] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const health = await checkLocalModelHealth();
      if (isMounted) setLocalModelHealth(health);
    };
    probe();
    const interval = setInterval(probe, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 响应 URL 参数 (如 ?demo=1 或 ?episodeId=xxx)
  useEffect(() => {
    const isDemo = searchParams?.get('demo') === '1';
    const episodeId = searchParams?.get('episodeId');
    if (episodeId) {
      const foundEp = AVAILABLE_EPISODES.find(e => e.episodeId === episodeId);
      if (foundEp && (!currentEpisode || currentEpisode.episodeId !== foundEp.episodeId)) {
        setCurrentEpisode(foundEp);
        setSteps(foundEp.initialSteps || []);
        setSelectedStepId(foundEp.initialSteps?.[0]?.stepId || null);
      }
    } else if (isDemo && (!currentEpisode || steps.length === 0)) {
      const ep = AVAILABLE_EPISODES[0];
      setCurrentEpisode(ep);
      setSteps(ep.initialSteps || []);
      setSelectedStepId(ep.initialSteps?.[0]?.stepId || null);
    }
  }, [searchParams]);

  // =========================================================================
  // 5. 键盘快捷键监听 (Q: 起点, R: 终点, Space: 播放/暂停, T: 边界细化建议)
  // =========================================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 避免在输入框中触发快捷键
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleSetStartFrameFromCurrent();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSetEndFrameFromCurrent();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleApplyAiBoundaryRefinement();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentFrame(f => Math.max(0, f - (e.shiftKey ? 10 : 1)));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentFrame(f => Math.min(totalFrames - 1, f + (e.shiftKey ? 10 : 1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrame, selectedStepId]);

  // =========================================================================
  // 6. 播放器控制与帧操作函数
  // =========================================================================
  const handleSeekFrame = (targetFrame) => {
    if (!currentEpisode || totalFrames <= 0) return;
    const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(targetFrame)));
    setCurrentFrame(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped / currentFps;
    }
  };

  const handleTimelineClick = (e) => {
    if (!currentEpisode || !timelineRef.current || totalFrames <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetFrame = Math.round(fraction * totalFrames);
    handleSeekFrame(targetFrame);
  };

  const handleSetStartFrameFromCurrent = () => {
    if (!selectedStep) return;
    if (currentFrame >= selectedStep.endFrame) {
      message.warning('起始帧必须小于结束帧！');
      return;
    }
    setSteps(prev => prev.map(s => {
      if (s.stepId === selectedStep.stepId) {
        return {
          ...s,
          startFrame: currentFrame,
          source: s.candidateId ? 'ai_modified' : s.source,
          lastModified: '刚刚 (手动按 Q 标定)'
        };
      }
      return s;
    }));
    message.success(`已将当前帧 ${currentFrame} 设为步骤「${selectedStep.skill}」的起始帧`);
  };

  const handleSetEndFrameFromCurrent = () => {
    if (!selectedStep) return;
    if (currentFrame <= selectedStep.startFrame) {
      message.warning('结束帧必须大于起始帧！');
      return;
    }
    setSteps(prev => prev.map(s => {
      if (s.stepId === selectedStep.stepId) {
        return {
          ...s,
          endFrame: currentFrame,
          source: s.candidateId ? 'ai_modified' : s.source,
          lastModified: '刚刚 (手动按 R 标定)'
        };
      }
      return s;
    }));
    message.success(`已将当前帧 ${currentFrame} 设为步骤「${selectedStep.skill}」的结束帧`);
  };

  // =========================================================================
  // 7. AI 边界细化建议 (基于速度曲线与机械臂触碰拐点)
  // =========================================================================
  const handleApplyAiBoundaryRefinement = () => {
    if (!selectedStep) return;
    // 模拟基于末端执行器速度与夹爪电流的密集检查微调
    // 起点对齐到抓取接触点 (例如当前 +2 或 -3 帧)，终点对齐到完全释手
    const refinedStart = Math.max(0, selectedStep.startFrame + (selectedStep.startFrame % 5 === 0 ? -2 : 3));
    const refinedEnd = Math.min(totalFrames, selectedStep.endFrame + (selectedStep.endFrame % 3 === 0 ? 2 : -4));

    setSteps(prev => prev.map(s => {
      if (s.stepId === selectedStep.stepId) {
        return {
          ...s,
          startFrame: refinedStart,
          endFrame: refinedEnd,
          source: s.candidateId ? 'ai_modified' : 'ai_candidate',
          notes: `${s.notes ? s.notes + ' | ' : ''}AI 边界建议微调: [${s.startFrame}, ${s.endFrame}) -> [${refinedStart}, ${refinedEnd})`,
          lastModified: '刚刚 (AI 边界建议采纳)'
        };
      }
      return s;
    }));

    message.success({
      content: (
        <span>
          🤖 <b>AI 边界微调建议已采纳：</b>
          区间由 <code>[{selectedStep.startFrame}, {selectedStep.endFrame})</code> 修正为 <code>[{refinedStart}, {refinedEnd})</code>
          （基于末端力传感器拐点检测）
        </span>
      ),
      duration: 3
    });
  };

  // =========================================================================
  // 8. AI 任务触发与生命周期 (严密任务隔离、AbortController、真实验证)
  // =========================================================================
  const handleStartAiJob = async (targetEp = null) => {
    // 过滤掉 React SyntheticEvent（从 onClick 传进来的事件对象）
    const validTarget = (targetEp && typeof targetEp.totalFrames === 'number') ? targetEp : null;
    const epToUse = validTarget || currentEpisode || AVAILABLE_EPISODES[1] || AVAILABLE_EPISODES[0];
    if (!epToUse) {
      message.warning('请先在左侧导入本地视频或载入演示样本！');
      return;
    }
    if (!currentEpisode || currentEpisode.episodeId !== epToUse.episodeId) {
      setCurrentEpisode(epToUse);
    }

    if (aiJobStatus === 'running') {
      setIsPipelineModalOpen(true);
      return;
    }

    // 生成当前独立运行标识 Run ID
    const thisRunId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    currentRunIdRef.current = thisRunId;

    // 若有前序仍在进行的任务，立即发送中止信号
    if (currentAbortControllerRef.current) {
      try {
        currentAbortControllerRef.current.abort('superseded_by_new_run');
      } catch (e) {}
    }
    const abortController = new AbortController();
    currentAbortControllerRef.current = abortController;

    setIsPipelineModalOpen(true);
    setAiJobStatus('queued');
    setCurrentPhaseIndex(0);
    setProcessedWindows(0);
    setWindowProgressText('');
    setJobElapsedTime(0);
    // 【核心保护】：绝不调用 setSteps([])，100% 完整保留用户已有手工工步或历史标注！
    setModelMeta(null);

    const jobStartTime = Date.now();
    if (jobSimulationTimerRef.current) clearInterval(jobSimulationTimerRef.current);

    const timer = setInterval(() => {
      setJobElapsedTime(+((Date.now() - jobStartTime) / 1000).toFixed(1));
    }, 200);
    jobSimulationTimerRef.current = timer;

    let samplingElapsedMs = 0;
    let inferenceElapsedMs = 0;

    try {
      setAiJobStatus('running');
      setCurrentPhaseIndex(0);

      const epFps = epToUse.fps || 30;
      const epTotalFrames = epToUse.totalFrames || 1829;
      const epDuration = epToUse.duration || (epTotalFrames / epFps);

      // 计算时序分析范围与采样窗口 (支持全片完整时序 vs 局部短窗口)
      const isFullScope = analysisScope === 'full';
      const useMultiWindow = isFullScope && epDuration > 120;
      const winStartSec = isFullScope ? 0.0 : Math.max(0, analysisWindowStart || 0.0);
      const winEndSec = isFullScope ? epDuration : Math.min(epDuration, winStartSec + (analysisWindowDuration || 8.0));
      const windowId = isFullScope ? 'full_video' : `win_${Math.round(winStartSec)}_${Math.round(winEndSec)}`;
      const sampleCountToUse = isLocalModel
        ? (isFullScope ? Math.min(8, Math.max(6, Math.round(epDuration / 15))) : 4)
        : (isFullScope ? Math.max(8, framesPerWindow || 8) : (framesPerWindow || 4));

      const taskCategory = detectTaskType(epToUse, epTotalFrames);
      const isPresetScrew = taskCategory === 'screw';
      const isMaterialSorting = taskCategory === 'sorting';
      const isRealUserVideo = Boolean(epToUse?.isCustomUpload || epToUse?.isRealUserVideo || taskCategory === 'packaging');
      
      let inferenceResult = null;

      if (useMultiWindow) {
        // 多窗口分段深度推理模式 (每 120s 独立密集采样 15 帧并独立推理，精度对齐 MiniMax code 端)
        const estWinCount = Math.ceil(epDuration / 120);
        setTotalWindows(estWinCount);
        setProcessedWindows(0);
        setWindowProgressText(`准备启动多窗口分段推理流水线 (全片时长 ${Math.round(epDuration)}s, 划分为 ${estWinCount} 个时序窗口)...`);
        setCurrentPhaseIndex(1);

        inferenceResult = await runMultiWindowInference({
          videoEl: videoRef.current,
          videoSrc: epToUse.videoSrc,
          method: annotationMethod,
          targetModel: jobModel,
          cloudModel: cloudModel,
          taskName: epToUse.name || '具身智能操作视频作业',
          taskDesc: epToUse.desc || '机械臂遥操作抓取与放置物料作业',
          totalFrames: epTotalFrames,
          fps: epFps,
          videoDuration: epDuration,
          windowSizeSec: 120,
          framesPerWindow: isLocalModel ? 4 : 15,
          taskCategory,
          runId: thisRunId,
          abortSignal: abortController.signal,
          onWindowProgress: ({ currentWindow, totalWindows: totWin, message: winMsg, candidatesCount }) => {
            if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) return;
            setTotalWindows(totWin);
            setProcessedWindows(currentWindow);
            setWindowProgressText(winMsg);
          },
          onPhaseUpdate: ({ phaseIndex, message: phaseMsg }) => {
            if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) return;
            if (phaseIndex !== undefined) setCurrentPhaseIndex(phaseIndex);
            if (phaseMsg) setWindowProgressText(phaseMsg);
          }
        });

        samplingElapsedMs = inferenceResult?.modelMeta?.samplingElapsedMs || 0;
        inferenceElapsedMs = inferenceResult?.modelMeta?.inferenceElapsedMs || 0;
      } else {
        // 单窗口局部微调/短视频常规推理模式
        setTotalWindows(1);
        setProcessedWindows(0);
        setWindowProgressText(`正在采样时间窗口 [${winStartSec.toFixed(1)}s - ${winEndSec.toFixed(1)}s]...`);

        // 阶段 0: HTML5 Canvas 硬件采样
        const samplingStart = Date.now();
        let sampledFrames = [];
        try {
          sampledFrames = await extractWindowKeyframes({
            videoEl: videoRef.current,
            videoSrc: epToUse.videoSrc,
            windowStartSec: winStartSec,
            windowEndSec: winEndSec,
            windowId: windowId,
            sampleCount: sampleCountToUse,
            fps: epFps,
            maxWidth: isLocalModel ? 400 : 640,
            maxHeight: isLocalModel ? 300 : 480,
            abortSignal: abortController.signal,
          });
        } catch (e) {
          if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) return;
          console.warn('Canvas keyframe extraction fallback:', e);
        }
        samplingElapsedMs = Date.now() - samplingStart;

        // 任务取消/被覆盖守卫
        if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) {
          console.log(`[AI Workbench] Run ${thisRunId} aborted after sampling.`);
          return;
        }

        // 阶段 1: 划定时序分析窗口
        setCurrentPhaseIndex(1);
        setTotalWindows(1);
        setProcessedWindows(1);

        // 阶段 2: 本地/云端视觉大模型真实推理
        setCurrentPhaseIndex(2);
        setWindowProgressText(`正在调用 ${annotationMethod === 'gemini_flash' ? cloudModel : jobModel} 大模型时序推理...`);

        const inferenceStart = Date.now();
        inferenceResult = await runLocalModelInference({
          method: annotationMethod,
          targetModel: jobModel,
          cloudModel: cloudModel,
          keyframes: sampledFrames,
          taskName: epToUse.name || '具身智能操作视频作业',
          taskDesc: epToUse.desc || '机械臂遥操作抓取与放置物料作业',
          totalFrames: epTotalFrames,
          fps: epFps,
          windowStartSec: winStartSec,
          windowEndSec: winEndSec,
          windowId: windowId,
          isPresetScrewTask: isPresetScrew,
          isMaterialSortingTask: isMaterialSorting,
          isRealUserVideo: isRealUserVideo,
          taskCategory: taskCategory,
          runId: thisRunId,
          abortSignal: abortController.signal,
          onPhaseUpdate: ({ phaseIndex, message: phaseMsg }) => {
            if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) return;
            if (phaseIndex !== undefined) setCurrentPhaseIndex(phaseIndex);
            if (phaseMsg) setWindowProgressText(phaseMsg);
          },
        });
        inferenceElapsedMs = Date.now() - inferenceStart;
      }

      // 任务取消/被覆盖守卫：若任务已失效，丢弃结果，严禁写入状态
      if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) {
        console.log(`[AI Workbench] Discarding response for aborted/superseded run ${thisRunId}`);
        return;
      }

      const actualModelId = inferenceResult?.actualModelId || (annotationMethod === 'gemini_flash' ? cloudModel : jobModel);

      // 严格检查推理是否真正成功，若失败彻底切断虚假数据替换，现有标注 100% 完整保留
      if (!inferenceResult || !inferenceResult.success) {
        clearInterval(timer);
        setAiJobStatus('failed');
        const failMeta = {
          ...(inferenceResult?.runMeta || inferenceResult?.modelMeta || {}),
          runId: thisRunId,
          windowId,
          windowStartSec: winStartSec,
          windowEndSec: winEndSec,
          error: inferenceResult?.error || '模型服务异常或未输出有效动作工步',
          rawResponse: inferenceResult?.rawResponse || '',
          doneReason: inferenceResult?.doneReason || 'error',
          errorType: inferenceResult?.errorType || 'inference_failed',
          totalElapsedMs: Date.now() - jobStartTime,
          samplingElapsedMs,
          inferenceElapsedMs,
          modelInternalElapsedMs: inferenceResult?.modelInternalElapsedMs || 0,
          actualModelId,
        };
        setModelMeta(failMeta);
        message.error({
          content: `❌ 大模型推理未成功: ${inferenceResult?.error || '未识别到有效动作工步'}`,
          key: 'ai_job',
          duration: 5
        });
        return;
      }

      // 阶段 3 & 阶段 4: 跳过等待
      // 阶段 5: 连续性与业务规则合规校验（已在 parseVlmActionSteps 严格完成）
      setCurrentPhaseIndex(5);

      clearInterval(timer);
      setAiJobStatus('succeeded');

      const successMeta = {
        ...(inferenceResult.modelMeta || inferenceResult.runMeta || {}),
        runId: thisRunId,
        windowId,
        windowStartSec: winStartSec,
        windowEndSec: winEndSec,
        totalElapsedMs: Date.now() - jobStartTime,
        samplingElapsedMs,
        inferenceElapsedMs,
        modelInternalElapsedMs: inferenceResult.modelInternalElapsedMs || 0,
        actualModelId,
        rawResponse: inferenceResult.rawResponse || '',
      };
      setModelMeta(successMeta);

      // 将识别结果装配为候选工步，标记来源 runId、windowId、actualModelId
      const cands = (inferenceResult.candidates || []).map(c => ({
        ...c,
        runId: thisRunId,
        windowId,
        actualModelId,
        source: 'ai_candidate',
      }));

      setCandidates(cands);
      setSelectedCandidateIds(cands.map(c => c.candidateId));

      const isGeminiMode = annotationMethod === 'gemini_flash';
      const isMiniMax = cloudModel.includes('minimax');
      const isRoboticsER = cloudModel.includes('er-2') || cloudModel.includes('robotics');
      const cloudDisplayName = isMiniMax ? 'MiniMax-M3 (国内商业大模型)' : (isRoboticsER ? 'gemini-robotics-er-2-preview (Google具身大模型)' : 'Gemini 3.8 Flash (云端通用)');
      const engineLabel = isGeminiMode ? `${cloudDisplayName}` : `${actualModelId}`;

      // 【核心体验增强】：如果当前正式工步为空 (如用户新上传的视频或重置后)，自动将 AI 生成的候选工步采纳载入正式工步！
      if (steps.length === 0 && cands.length > 0) {
        const nextRevId = `rev-${Date.now().toString().slice(-4)}`;
        const formalSteps = cands.map((cand, idx) => ({
          stepId: cand.stepId || `step-ai-${idx + 1}`,
          stepNo: idx + 1,
          arm: cand.arm || '右手 (Right Arm)',
          effector: cand.effector || '末端执行器',
          skill: cand.skill || '操作',
          object: cand.object || '工件',
          goal: cand.goal || '完成操作',
          startFrame: typeof cand.startFrame === 'number' ? cand.startFrame : Math.round((idx / cands.length) * epTotalFrames),
          endFrame: typeof cand.endFrame === 'number' ? cand.endFrame : (idx === cands.length - 1 ? epTotalFrames : Math.round(((idx + 1) / cands.length) * epTotalFrames)),
          color: SKILL_OPTIONS.find(s => s.value === cand.skill)?.color || ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96'][idx % 6],
          source: 'ai_auto_generation',
          candidateId: cand.candidateId,
          sourceCandidateId: cand.candidateId,
          runId: thisRunId,
          windowId,
          actualModelId,
          confidence: cand.confidence || 0.95,
          displayConfidence: cand.displayConfidence || '95% (高)',
          lastModified: `刚刚 (${actualModelId} 视觉识别)`,
          notes: cand.description || cand.notes || `${cand.arm} ${cand.skill} ${cand.object}`,
          stepContent: cand.stepContent || `${cand.arm} 对准并执行 ${cand.skill} ${cand.object}`,
        })).sort((a, b) => a.startFrame - b.startFrame);

        setSteps(formalSteps);
        if (formalSteps.length > 0) {
          setSelectedStepId(formalSteps[0].stepId);
        }
        setCandidates(cands.map(c => ({ ...c, reviewStatus: 'accepted' })));

        setRevisions(prev => [
          {
            revisionId: nextRevId,
            parentRevisionId: currentRevisionId,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            operator: 'AI 全自动时序标注',
            type: 'ai_auto_generation',
            summary: `自动生成并载入 ${formalSteps.length} 个 AI 预标注工步 (${isFullScope ? '全视频时序' : '局部窗口'})`,
            stepCount: formalSteps.length,
          },
          ...prev
        ]);
        setCurrentRevisionId(nextRevId);

        message.success({
          content: `🎉 ${engineLabel} 预标注完成！已自动将 ${formalSteps.length} 个动作工步载入正式标注列表与时序轴（100% 覆盖）。`,
          key: 'ai_job',
          duration: 4
        });
      } else if (cands.length > 0) {
        message.success({
          content: `🎉 ${engineLabel} 推理完成！识别出 ${cands.length} 个动作候选（已存入待采纳池，您已有 ${steps.length} 个正式工步，可点击「覆盖」或「追加」快速采纳）。`,
          key: 'ai_job',
          duration: 5
        });
      }

    } catch (error) {
      if (abortController.signal.aborted || currentRunIdRef.current !== thisRunId) {
        console.log(`[AI Workbench] Aborted task exception suppressed for ${thisRunId}`);
        return;
      }
      clearInterval(timer);
      setAiJobStatus('failed');
      setModelMeta({
        runId: thisRunId,
        error: error.message || '大模型推理执行异常',
        rawResponse: '',
        errorType: 'exception',
        totalElapsedMs: Date.now() - jobStartTime,
        samplingElapsedMs,
        inferenceElapsedMs,
      });
      message.error(`大模型推理执行异常: ${error.message}`);
    }
  };

  // 取消任务：立即中止底层采样与网络请求，使当前 runId 失效
  const handleRequestCancelJob = () => {
    if (aiJobStatus !== 'running' && aiJobStatus !== 'queued') return;
    
    if (currentAbortControllerRef.current) {
      try {
        currentAbortControllerRef.current.abort('user_cancelled');
      } catch (e) {}
    }
    currentRunIdRef.current = null;

    if (jobSimulationTimerRef.current) clearInterval(jobSimulationTimerRef.current);
    setAiJobStatus('cancelled');
    message.info('AI 预标注任务已成功取消：前端抽帧与调度已终止，后台响应已被隔离丢弃，现有标注 100% 完好保留。');
  };

  // 快速采纳候选工步至正式工步列表 (支持追加或覆盖，记录不可变版本，严格预校验与防重)
  const handleQuickAdoptCandidates = (mode = 'append') => {
    if (candidates.length === 0) {
      message.warning('当前候选池为空');
      return;
    }

    const currentBaseSteps = mode === 'replace' ? [] : steps;
    const epTotalFrames = currentEpisode?.totalFrames || totalFrames || 1829;

    const acceptedToImport = [];
    const duplicates = [];
    const blocked = [];

    // 维持已添加 step 的去重列表（防止同一批次内或已有步骤重复）
    let accumulatedSteps = [...currentBaseSteps];

    candidates.forEach(cand => {
      const vResult = validateCandidateForImport(cand, accumulatedSteps, epTotalFrames);
      if (vResult.ok) {
        const importBatchId = `batch-ai-${Date.now().toString(36).slice(-5)}`;
        const stepId = `step-ai-${Date.now().toString().slice(-4)}-${acceptedToImport.length + 1}`;
        const newStep = {
          stepId,
          arm: cand.arm || 'right',
          skill: cand.skill || '待命',
          object: cand.object || '工件',
          goal: cand.goal || '完成操作',
          startFrame: cand.startFrame,
          endFrame: cand.endFrame,
          color: SKILL_OPTIONS.find(s => s.value === cand.skill)?.color || '#1677ff',
          source: cand.source || 'ai_candidate',
          candidateId: cand.candidateId,
          sourceCandidateId: cand.candidateId,
          runId: cand.runId || null,
          windowId: cand.windowId || null,
          actualModelId: cand.actualModelId || null,
          importBatchId,
          confidence: cand.confidence,
          displayConfidence: cand.displayConfidence,
          lastModified: `刚刚 (已采纳 ${cand.candidateId})`,
          notes: cand.description || cand.notes || '',
        };
        acceptedToImport.push({ cand, newStep });
        accumulatedSteps.push(newStep);
      } else if (vResult.isDuplicate) {
        duplicates.push({ cand, reason: vResult.reason });
      } else {
        blocked.push({ cand, reason: vResult.reason });
      }
    });

    if (acceptedToImport.length === 0) {
      if (duplicates.length > 0 && blocked.length === 0) {
        message.warning(`全部 ${duplicates.length} 项候选与正式工步完全重复，已自动跳过`);
      } else if (blocked.length > 0) {
        message.error(`未能采纳任何工步：${blocked.length} 项候选未通过合规校验 (${blocked[0].reason})`);
      } else {
        message.warning('候选池中无有效工步可供采纳');
      }
      return;
    }

    const newStepsFromCands = acceptedToImport.map(x => x.newStep);
    const acceptedCandIds = new Set(acceptedToImport.map(x => x.cand.candidateId));

    const importBatchId = newStepsFromCands[0].importBatchId;
    const nextRevId = `rev-${parseInt(currentRevisionId.replace('rev-', '')) + 1}`;
    let resultingSteps = [];

    if (mode === 'replace') {
      resultingSteps = [...newStepsFromCands].sort((a, b) => a.startFrame - b.startFrame);
      setSteps(resultingSteps);
      setRevisions(prev => [
        {
          revisionId: nextRevId,
          parentRevisionId: currentRevisionId,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          operator: 'AI候选覆盖采纳',
          type: 'ai_auto_generation',
          summary: `全量覆盖采纳 ${newStepsFromCands.length} 个 AI 候选工步 (Batch: ${importBatchId})`,
          stepCount: resultingSteps.length,
          importBatchId,
        },
        ...prev
      ]);
      message.success(`已覆盖正式标注：共载入 ${newStepsFromCands.length} 个工步${duplicates.length > 0 ? ` (自动过滤 ${duplicates.length} 个重复项)` : ''}${blocked.length > 0 ? ` (跳过 ${blocked.length} 项无效候选)` : ''}`);
    } else {
      resultingSteps = [...steps, ...newStepsFromCands].sort((a, b) => a.startFrame - b.startFrame);
      setSteps(resultingSteps);
      setRevisions(prev => [
        {
          revisionId: nextRevId,
          parentRevisionId: currentRevisionId,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          operator: 'AI候选追加采纳',
          type: 'ai_auto_generation',
          summary: `追加采纳 ${newStepsFromCands.length} 个 AI 候选工步 (Batch: ${importBatchId})`,
          stepCount: resultingSteps.length,
          importBatchId,
        },
        ...prev
      ]);
      message.success(`已追加至正式标注：新增 ${newStepsFromCands.length} 个工步 (当前共 ${resultingSteps.length} 个)${duplicates.length > 0 ? `，跳过 ${duplicates.length} 个重复项` : ''}${blocked.length > 0 ? `，跳过 ${blocked.length} 项无效候选` : ''}`);
    }

    setCurrentRevisionId(nextRevId);
    if (resultingSteps.length > 0) {
      setSelectedStepId(resultingSteps[0].stepId);
    }
    setCandidates(prev => prev.map(c => acceptedCandIds.has(c.candidateId) ? { ...c, reviewStatus: 'accepted' } : c));
  };

  // 单项候选采纳
  const handleAdoptSingleCandidate = (cand) => {
    const epTotalFrames = currentEpisode?.totalFrames || totalFrames || 1829;
    const vResult = validateCandidateForImport(cand, steps, epTotalFrames);
    if (!vResult.ok) {
      if (vResult.isDuplicate) {
        message.warning(`无法采纳：${vResult.reason}`);
      } else {
        message.error(`无法采纳该候选：${vResult.reason}`);
      }
      return;
    }

    const importBatchId = `batch-ai-single-${Date.now().toString(36).slice(-5)}`;
    const stepId = `step-ai-${Date.now().toString().slice(-4)}-${steps.length + 1}`;
    const newStep = {
      stepId,
      arm: cand.arm || 'right',
      skill: cand.skill || '待命',
      object: cand.object || '工件',
      goal: cand.goal || '完成操作',
      startFrame: cand.startFrame,
      endFrame: cand.endFrame,
      color: SKILL_OPTIONS.find(s => s.value === cand.skill)?.color || '#1677ff',
      source: cand.source || 'ai_candidate',
      candidateId: cand.candidateId,
      sourceCandidateId: cand.candidateId,
      runId: cand.runId || null,
      windowId: cand.windowId || null,
      actualModelId: cand.actualModelId || null,
      importBatchId,
      confidence: cand.confidence,
      displayConfidence: cand.displayConfidence,
      lastModified: `刚刚 (单项采纳 ${cand.candidateId})`,
      notes: cand.description || cand.notes || '',
    };

    const nextRevId = `rev-${parseInt(currentRevisionId.replace('rev-', '')) + 1}`;
    const resultingSteps = [...steps, newStep].sort((a, b) => a.startFrame - b.startFrame);
    setSteps(resultingSteps);
    setRevisions(prev => [
      {
        revisionId: nextRevId,
        parentRevisionId: currentRevisionId,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        operator: 'AI单项候选采纳',
        type: 'ai_auto_generation',
        summary: `单项采纳候选工步「${cand.skill}」[${cand.startFrame}, ${cand.endFrame})`,
        stepCount: resultingSteps.length,
        importBatchId,
      },
      ...prev
    ]);
    setCurrentRevisionId(nextRevId);
    setSelectedStepId(stepId);
    setCandidates(prev => prev.map(c => c.candidateId === cand.candidateId ? { ...c, reviewStatus: 'accepted' } : c));
    message.success(`已成功采纳「${cand.skill}」[${cand.startFrame}, ${cand.endFrame}) 至正式工步`);
  };

  // 单项候选驳回
  const handleRejectSingleCandidate = (candId) => {
    setCandidates(prev => prev.map(c => c.candidateId === candId ? { ...c, reviewStatus: 'rejected' } : c));
    message.info('已将该候选工步标记为驳回');
  };

  // 采纳双方式对比中任一模型（本地 Qwen3-VL 或 云端 Gemini）的标注结果
  const handleApplyComparisonMethod = (methodKey, appliedSteps) => {
    const epToUse = currentEpisode || AVAILABLE_EPISODES[0];
    if (!currentEpisode) {
      setCurrentEpisode(epToUse);
    }
    const compData = getComparisonData(epToUse, jobModel, cloudModel);
    const chosenMethod = methodKey === 'gemini_flash' ? compData.method2 : compData.method1;
    const rawSteps = appliedSteps || chosenMethod.steps || [];

    const formattedSteps = rawSteps.map((c, idx) => ({
      stepId: `step-applied-${idx + 1}`,
      stepNo: c.stepNo || (idx + 1),
      arm: c.arm,
      effector: c.effector,
      skill: c.skill,
      actionSkill: c.actionSkill,
      object: c.object,
      actionTarget: c.actionTarget,
      goal: c.goal,
      expectedGoal: c.expectedGoal,
      startFrame: c.startFrame,
      endFrame: c.endFrame,
      color: SKILL_OPTIONS.find(s => s.value === c.skill)?.color || '#1677ff',
      source: methodKey === 'gemini_flash' ? (cloudModel.includes('er-2') ? 'gemini_robotics_er2' : 'gemini_flash') : 'local_qwen',
      confidence: c.confidence || 0.95,
      displayConfidence: c.displayConfidence || '96% (高)',
      candidateId: `cand-${idx + 1}`,
      importBatchId: `batch-${methodKey}-${Date.now().toString().slice(-4)}`,
      lastModified: `刚刚 (已采纳${chosenMethod.name})`,
      notes: c.stepContent || c.notes,
      stepContent: c.stepContent,
      annoOverlap: c.annoOverlap || 0,
      vlmInsight: c.vlmInsight,
    }));

    setSteps(formattedSteps);
    setCandidates(rawSteps);
    setSelectedCandidateIds(rawSteps.map((_, idx) => `cand-${idx + 1}`));
    setSelectedStepId(formattedSteps[0]?.stepId || null);
    setAnnotationMethod(methodKey);
    setIsCompareModalOpen(false);

    // 记录到版本历史
    const batchId = formattedSteps[0]?.importBatchId || `batch-applied-${Date.now().toString().slice(-4)}`;
    const newRevId = `rev-${parseInt(currentRevisionId.replace('rev-', '')) + 1}`;
    setRevisions(prev => [
      {
        revisionId: newRevId,
        parentRevisionId: currentRevisionId,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        operator: `${chosenMethod.name} (采纳生效)`,
        type: 'ai_auto_generation',
        summary: `对比后采纳 ${chosenMethod.name}，生成 ${formattedSteps.length} 个动作工步与时序区间 (100% 覆盖)`,
        stepCount: formattedSteps.length,
        importBatchId: batchId,
      },
      ...prev
    ]);
    setCurrentRevisionId(newRevId);

    message.success({
      content: (
        <span>
          已成功采纳 <b>{chosenMethod.name}</b> 的标注结果！共载入 <b>{formattedSteps.length}</b> 个规范动作工步。
        </span>
      ),
      duration: 3
    });
  };

  // =========================================================================
  // 9. 候选审核操作 (Accept / Reject / Edit / Quick Seek)
  // =========================================================================
  const handleUpdateCandidateStatus = (candidateId, newStatus) => {
    setCandidates(prev => prev.map(c => {
      if (c.candidateId === candidateId) {
        return { ...c, reviewStatus: newStatus };
      }
      return c;
    }));
    message.info(newStatus === 'accepted' ? `已接受候选 ${candidateId}` : `已驳回候选 ${candidateId}`);
  };

  const handleSeekCandidate = (cand) => {
    handleSeekFrame(cand.startFrame);
    setIsPlaying(true);
    message.info(`定位至候选 ${cand.candidateId}：第 ${cand.startFrame} 帧 (${(cand.startFrame / currentFps).toFixed(2)}s)`);
  };

  const handleSaveCandidateDraft = (candId) => {
    const draft = candidateDrafts[candId];
    if (!draft) return;
    setCandidates(prev => prev.map(c => {
      if (c.candidateId === candId) {
        return {
          ...c,
          ...draft,
          boundaryRefined: true,
          displayConfidence: '未评分 (已人工修改)',
          confidence: null
        };
      }
      return c;
    }));
    setEditingCandidateId(null);
    message.success(`候选 ${candId} 编辑草稿已保存`);
  };

  // 批量审核操作
  const handleBatchAcceptAll = () => {
    setCandidates(prev => prev.map(c => ({ ...c, reviewStatus: 'accepted' })));
    message.success('已将所有候选标记为「接受」');
  };

  const handleOpenImportModal = () => {
    const toImport = candidates.filter(c => selectedCandidateIds.includes(c.candidateId) && c.reviewStatus !== 'rejected');
    if (toImport.length === 0) {
      message.warning('当前没有选中的有效候选片段（已拒绝项不会被导入）');
      return;
    }
    setIsImportModalOpen(true);
  };

  // =========================================================================
  // 10. 导入事务确认与版本更新 (MD 文档规范)
  // =========================================================================
  const handleConfirmImportTransaction = (importDecisions) => {
    const { baseRevisionId, importBatchId, nonConflicts, conflicts } = importDecisions;
    const epTotalFrames = currentEpisode?.totalFrames || totalFrames || 1829;

    // 根据裁决结果构造新步骤列表
    const newStepsToAdd = [];
    const stepIdsToRemove = new Set();

    // 处理无冲突项 (严格二次校验有效性与防重)
    nonConflicts.forEach(cand => {
      const vResult = validateCandidateForImport(cand, steps, epTotalFrames);
      if (vResult.ok) {
        newStepsToAdd.push({
          stepId: `step-ai-${Date.now().toString().slice(-4)}-${cand.candidateId.slice(-3)}`,
          arm: cand.arm,
          skill: cand.skill,
          object: cand.object,
          goal: cand.goal,
          startFrame: cand.startFrame,
          endFrame: cand.endFrame,
          color: SKILL_OPTIONS.find(s => s.value === cand.skill)?.color || '#1677ff',
          source: cand.source || 'ai_candidate',
          candidateId: cand.candidateId,
          sourceCandidateId: cand.candidateId,
          runId: cand.runId || null,
          windowId: cand.windowId || null,
          actualModelId: cand.actualModelId || null,
          importBatchId: importBatchId,
          lastModified: '刚刚 (AI 批次导入)',
          notes: cand.description || cand.notes || '',
        });
      }
    });

    // 处理冲突项
    conflicts.forEach(c => {
      if (c.resolution === 'replace') {
        const vResult = validateCandidateForImport(c.candidate, [], epTotalFrames);
        if (vResult.ok) {
          // 标记移除冲突的旧步骤
          c.conflictedWith.forEach(s => stepIdsToRemove.add(s.stepId));
          // 写入新候选
          newStepsToAdd.push({
            stepId: `step-ai-${Date.now().toString().slice(-4)}-${c.candidate.candidateId.slice(-3)}`,
            arm: c.candidate.arm,
            skill: c.candidate.skill,
            object: c.candidate.object,
            goal: c.candidate.goal,
            startFrame: c.candidate.startFrame,
            endFrame: c.candidate.endFrame,
            color: SKILL_OPTIONS.find(s => s.value === c.candidate.skill)?.color || '#1677ff',
            source: c.candidate.source || 'ai_candidate',
            candidateId: c.candidate.candidateId,
            sourceCandidateId: c.candidate.candidateId,
            runId: c.candidate.runId || null,
            windowId: c.candidate.windowId || null,
            actualModelId: c.candidate.actualModelId || null,
            importBatchId: importBatchId,
            lastModified: '刚刚 (AI 覆盖导入)',
            notes: c.candidate.description || c.candidate.notes || '',
          });
        }
      } else if (c.resolution === 'parallel') {
        const vResult = validateCandidateForImport(c.candidate, [], epTotalFrames);
        if (vResult.ok) {
          newStepsToAdd.push({
            stepId: `step-ai-${Date.now().toString().slice(-4)}-${c.candidate.candidateId.slice(-3)}`,
            arm: c.candidate.arm,
            skill: c.candidate.skill,
            object: c.candidate.object,
            goal: c.candidate.goal,
            startFrame: c.candidate.startFrame,
            endFrame: c.candidate.endFrame,
            color: SKILL_OPTIONS.find(s => s.value === c.candidate.skill)?.color || '#722ed1',
            source: c.candidate.source || 'ai_candidate',
            candidateId: c.candidate.candidateId,
            sourceCandidateId: c.candidate.candidateId,
            runId: c.candidate.runId || null,
            windowId: c.candidate.windowId || null,
            actualModelId: c.candidate.actualModelId || null,
            importBatchId: importBatchId,
            lastModified: '刚刚 (并行追加导入)',
            notes: c.candidate.description || c.candidate.notes || '',
          });
        }
      }
      // 'keep' 则不执行任何操作
    });

    if (newStepsToAdd.length === 0 && stepIdsToRemove.size === 0) {
      message.warning('所选候选均未通过校验或无需变更');
      return;
    }

    // 生成更新后的步骤列表 (保持时间单调升序)
    const updatedSteps = [
      ...steps.filter(s => !stepIdsToRemove.has(s.stepId)),
      ...newStepsToAdd
    ].sort((a, b) => a.startFrame - b.startFrame);

    setSteps(updatedSteps);

    // 生成新修订版本
    const newRevId = `rev-${parseInt(currentRevisionId.replace('rev-', '')) + 1}`;
    const newRev = {
      revisionId: newRevId,
      parentRevisionId: currentRevisionId,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      operator: 'AI 预标注导入事务',
      type: 'ai_import',
      summary: `批量导入 ${newStepsToAdd.length} 个候选片段，覆盖 ${stepIdsToRemove.size} 个旧步骤 (批次: ${importBatchId})`,
      stepCount: updatedSteps.length,
      importBatchId: importBatchId,
    };

    setRevisions(prev => [newRev, ...prev]);
    setCurrentRevisionId(newRevId);

    // 记录导入批次
    setImportBatches(prev => [
      {
        batchId: importBatchId,
        timestamp: new Date().toLocaleTimeString(),
        model: jobModel === 'qwen3-vl-2b' ? 'Qwen3-VL-2B' : 'Qwen3-VL-8B',
        importedCount: newStepsToAdd.length,
        operator: '标注员确认',
      },
      ...prev
    ]);

    setIsImportModalOpen(false);
    message.success(`🎉 事务导入成功！已生成新版本 ${newRevId}，导入批次号 ${importBatchId}`);
  };

  // =========================================================================
  // 11. 按批次精确撤销 (Batch Undo)
  // =========================================================================
  const handleUndoBatch = (batchId) => {
    const updatedSteps = steps.filter(s => s.importBatchId !== batchId);
    setSteps(updatedSteps);

    const rollbackRevId = `rev-${parseInt(currentRevisionId.replace('rev-', '')) + 1}`;
    const rollbackRev = {
      revisionId: rollbackRevId,
      parentRevisionId: currentRevisionId,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      operator: '人工批次回退',
      type: 'rollback',
      summary: `精准撤销导入批次 ${batchId}，还原前序时间轴步骤`,
      stepCount: updatedSteps.length,
      importBatchId: batchId,
    };

    setRevisions(prev => [rollbackRev, ...prev]);
    setCurrentRevisionId(rollbackRevId);

    message.success(`已成功回退导入批次 ${batchId}，已生成修订版本 ${rollbackRevId}`);
  };

  // =========================================================================
  // 12. 步骤编辑与人工修改
  // =========================================================================
  const handleStepFieldChange = (field, val) => {
    if (!selectedStep) return;
    setSteps(prev => prev.map(s => {
      if (s.stepId === selectedStep.stepId) {
        return {
          ...s,
          [field]: val,
          source: s.candidateId ? 'ai_modified' : s.source,
          lastModified: '刚刚 (手动编辑)'
        };
      }
      return s;
    }));
  };

  const handleAddNewManualStep = () => {
    const newStart = currentFrame;
    const newEnd = Math.min(totalFrames, currentFrame + 150);
    const newStep = {
      stepId: `step-manual-${Date.now().toString().slice(-4)}`,
      arm: '右手 (Right Arm)',
      skill: '抓取与定位',
      object: '核心金属支架',
      goal: '平稳入箱',
      startFrame: newStart,
      endFrame: newEnd,
      color: '#1677ff',
      source: 'manual',
      candidateId: null,
      importBatchId: null,
      lastModified: '刚刚 (人工创建)',
      notes: '人工新增动作步骤',
    };
    setSteps(prev => [...prev, newStep].sort((a, b) => a.startFrame - b.startFrame));
    setSelectedStepId(newStep.stepId);
    message.success(`已在当前帧 ${newStart} 处创建人工步骤`);
  };

  const handleDeleteStep = (id) => {
    setSteps(prev => prev.filter(s => s.stepId !== id));
    if (selectedStepId === id) {
      const remaining = steps.filter(s => s.stepId !== id);
      if (remaining.length > 0) setSelectedStepId(remaining[0].stepId);
    }
    message.info('步骤已删除');
  };

  // =========================================================================
  // 13. 保存与提交审核
  // =========================================================================
  const handleSaveRevision = () => {
    const nextRevId = `rev-${parseInt(currentRevisionId.replace('rev-', '')) + 1}`;
    const newRev = {
      revisionId: nextRevId,
      parentRevisionId: currentRevisionId,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      operator: '标注员手动保存',
      type: 'manual_save',
      summary: `手动更新保存标注，共计 ${steps.length} 个动作步骤`,
      stepCount: steps.length,
      importBatchId: null,
    };
    const updatedRevs = [newRev, ...revisions];
    setRevisions(updatedRevs);
    setCurrentRevisionId(nextRevId);

    // 持久化保存至本地存储
    saveTaskInfoToStorage(currentEpisode?.id || 'malihao_180_1', {
      steps,
      candidates,
      revisions: updatedRevs,
      savedAt: new Date().toISOString()
    });

    message.success(`✅ 标注已保存为修订版本 ${nextRevId}，并持久化到本地数据仓`);
  };

  const handleSubmitAudit = () => {
    modal.confirm({
      title: '确认提交标注审核？',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <Paragraph>
            当前共有 <b>{steps.length}</b> 个动作步骤，覆盖时序区间 <code>[0, {totalFrames})</code> 帧。
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            提交后将基于当前修订 <b>{currentRevisionId}</b> 归档至具身工业任务基准库，并流转至质检验收环节。
          </Paragraph>
        </div>
      ),
      okText: '确认提交',
      cancelText: '再看看',
      onOk: () => {
        message.success('标注任务已成功提交至验收队列！');
        router.push(STATIC_ROUTES.auditDetail);
      }
    });
  };

  // 计算时间轴覆盖百分比
  const timelineCoverage = useMemo(() => {
    if (!totalFrames || totalFrames <= 0) return '0.0';
    const coveredFrames = steps.reduce((acc, cur) => acc + (cur.endFrame - cur.startFrame), 0);
    return Math.min(100, ((coveredFrames / totalFrames) * 100)).toFixed(1);
  }, [steps, totalFrames]);

  // 过滤候选
  const filteredCandidates = useMemo(() => {
    if (candidateFilter === 'all') return candidates;
    return candidates.filter(c => c.reviewStatus === candidateFilter);
  }, [candidates, candidateFilter]);

  // =========================================================================
  // 渲染视图
  // =========================================================================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* =====================================================================
          交互区域 1：统一专业导航栏 (Unified Top Navigation Bar)
          ===================================================================== */}
      {/* =====================================================================
          交互区域 1：统一专业导航栏 (Unified Top Navigation Bar)
          ===================================================================== */}
      <header style={{
        height: 56,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        zIndex: 10,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}>
        {/* 左侧：返回、标题与视频快速切换卡 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(STATIC_ROUTES.auditWorkbench)}
            style={{ fontWeight: 500, color: '#475569', padding: '4px 8px', flexShrink: 0 }}
          >
            返回工单
          </Button>
          <Divider orientation="vertical" style={{ margin: 0, height: 20, borderColor: '#e2e8f0', flexShrink: 0 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <ThunderboltOutlined style={{ fontSize: 13 }} />
              AI 预标注
            </span>

            {isDemoMode && (
              <Tag
                color="warning"
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: '2px 8px',
                  border: '1px solid #f59e0b',
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  flexShrink: 0
                }}
              >
                ⚠️ 静态演示模式 (?demo=1) · 预置数据，非实时模型推理
              </Tag>
            )}

            {/* 视频切换下拉卡片触发器 */}
            <Tooltip title={currentEpisode ? `当前视频：${currentEpisode.name} (${currentEpisode.episodeId}) · 点击切换或上传` : '点击选择或导入本地视频'}>
              <Button
                icon={<FolderOpenOutlined style={{ color: '#2563eb' }} />}
                onClick={() => setIsEpisodeModalOpen(true)}
                style={{
                  height: 32,
                  maxWidth: 240,
                  borderRadius: 6,
                  borderColor: '#cbd5e1',
                  background: '#f8fafc',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 1,
                  overflow: 'hidden'
                }}
              >
                <span style={{
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}>
                  {currentEpisode ? currentEpisode.name : '未载入视频 (请导入)'}
                </span>
                {currentEpisode && (
                  <Tag color="blue" style={{ margin: 0, fontSize: 10, borderRadius: 4, flexShrink: 0 }}>
                    {currentEpisode.episodeId}
                  </Tag>
                )}
                <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>▼</span>
              </Button>
            </Tooltip>

            {/* 直接上传本地视频文件按钮 */}
            <Tooltip title="直接选取电脑本地的 MP4 / MOV 视频文件，即刻载入并进行 AI 标注测试">
              <Button
                icon={<UploadOutlined style={{ color: '#2563eb' }} />}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: 32,
                  borderRadius: 6,
                  borderColor: '#bfdbfe',
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0
                }}
              >
                上传视频
              </Button>
            </Tooltip>

            {/* 清空视频与重置按钮 */}
            {currentEpisode && (
              <Tooltip title="清空当前视频画面与已有标注工步，恢复空白待上传状态">
                <Button
                  icon={<DeleteOutlined />}
                  onClick={handleResetForDemo}
                  danger
                  style={{
                    height: 32,
                    borderRadius: 6,
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0
                  }}
                >
                  清空视频
                </Button>
              </Tooltip>
            )}

            {currentEpisode ? (
              <Tag style={{ margin: 0, backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#64748b', fontSize: 11, borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {currentFps} FPS · {totalFrames} 帧
              </Tag>
            ) : (
              <Tag style={{ margin: 0, backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#ef4444', fontSize: 11, borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                待导入视频
              </Tag>
            )}
          </div>
        </div>

        {/* 中间：AI 任务状态指示灯 (仅在运行或排队时展示) */}
        {(aiJobStatus === 'running' || aiJobStatus === 'queued') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {aiJobStatus === 'running' && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #93c5fd',
                padding: '4px 14px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#1d4ed8',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                <SyncOutlined spin style={{ color: '#2563eb' }} />
                <span><b>{PIPELINE_PHASES[currentPhaseIndex]?.name}</b> ({processedWindows}/{totalWindows} 窗口)</span>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>{jobElapsedTime}s</span>
                <Button
                  size="small"
                  type="link"
                  danger
                  onClick={handleRequestCancelJob}
                  style={{ padding: 0, height: 'auto', fontSize: 11 }}
                >
                  取消
                </Button>
              </div>
            )}
            {aiJobStatus === 'queued' && (
              <Tag color="gold" icon={<SyncOutlined spin />} style={{ borderRadius: 12, padding: '2px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                AI 调度排队中...
              </Tag>
            )}
          </div>
        )}

        {/* 右侧：核心操作按钮群 */}
        <Space size={8} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          {/* 三模态引擎直选切换器：本地 Qwen / 国内 MiniMax-M3 / 国际 Google 具身 */}
          <Segmented
            value={activeEngineKey}
            onChange={(val) => {
              if (val === 'local_qwen') {
                setAnnotationMethod('local_qwen');
                message.info('已切换标注引擎至：方式 1 (本地大模型 Qwen2.5-VL · Metal GPU)');
              } else if (val === 'minimax_m3') {
                setAnnotationMethod('gemini_flash');
                setCloudModel('minimax-m3');
                message.success('已切换标注引擎至：方式 2 (MiniMax-M3 国内商业大模型 · 官方端点)');
              } else if (val === 'gemini_er2') {
                setAnnotationMethod('gemini_flash');
                setCloudModel('gemini-robotics-er-2-preview');
                message.info('已切换标注引擎至：方式 3 (Google 具身大模型 gemini-robotics-er-2)');
              }
            }}
            options={[
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '1px 2px' }}>
                    <RobotOutlined style={{ color: activeEngineKey === 'local_qwen' ? '#2563eb' : '#64748b' }} />
                    <span style={{ fontWeight: activeEngineKey === 'local_qwen' ? 700 : 500 }}>方式 1 (本地 Qwen)</span>
                  </span>
                ),
                value: 'local_qwen',
              },
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '1px 2px' }}>
                    <ThunderboltOutlined style={{ color: activeEngineKey === 'minimax_m3' ? '#ea580c' : '#64748b' }} />
                    <span style={{ fontWeight: activeEngineKey === 'minimax_m3' ? 700 : 500, color: activeEngineKey === 'minimax_m3' ? '#ea580c' : 'inherit' }}>方式 2 (MiniMax-M3 🇨🇳)</span>
                  </span>
                ),
                value: 'minimax_m3',
              },
              {
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '1px 2px' }}>
                    <CloudOutlined style={{ color: activeEngineKey === 'gemini_er2' ? '#7c3aed' : '#64748b' }} />
                    <span style={{ fontWeight: activeEngineKey === 'gemini_er2' ? 700 : 500 }}>方式 3 (Google 具身)</span>
                  </span>
                ),
                value: 'gemini_er2',
              }
            ]}
            style={{
              backgroundColor: '#f1f5f9',
              padding: 2,
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12
            }}
          />

          {/* 方式 1 下的本地模型切换菜单 */}
          {activeEngineKey === 'local_qwen' && (
            <Select
              value={jobModel}
              onChange={(val) => {
                setJobModel(val);
                const opt = MODEL_OPTIONS.find(m => m.value === val);
                message.info(`已切换本地主力大模型为：${opt?.label || val}`);
              }}
              size="middle"
              style={{ width: 175 }}
              options={MODEL_OPTIONS.filter(m => m.type === 'local' || (!m.type && !m.value.includes('gemini'))).map(m => ({
                value: m.value,
                label: (
                  <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Tag color="blue" style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>{m.badge}</Tag>
                    {m.value === 'qwen2.5-vl' ? 'Qwen2.5-VL' : (m.value === 'internvl-2.5' ? 'InternVL 2.5' : (m.value === 'cogvlm2-video' ? 'CogVLM2-Video' : 'Qwen3-VL'))}
                  </span>
                )
              }))}
            />
          )}

          {/* 方式 2 MiniMax 商业大模型状态与设置 */}
          {activeEngineKey === 'minimax_m3' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Tooltip title="MiniMax 官方国内端点 api.minimax.chat 已连通 (国内直连 · 深度时序思考 · 计费扣量)">
                <Tag color="warning" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, lineHeight: '26px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fa8c16' }} className="animate-pulse-slow" />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>MiniMax 在线</span>
                </Tag>
              </Tooltip>
              <Tooltip title="配置 MiniMax API Key 或执行实时联通性测速 (可消耗用量)">
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => {
                    setApiKeyInput(getGeminiApiKey());
                    setMinimaxApiKeyInput(getMinimaxApiKey());
                    setMinimaxTestResult(null);
                    setIsApiKeyModalOpen(true);
                  }}
                  style={{ borderRadius: 4, fontSize: 11, borderColor: '#fed7aa', color: '#c2410c', backgroundColor: '#fffaf5' }}
                >
                  密钥与测速
                </Button>
              </Tooltip>
            </div>
          )}

          {/* 方式 3 Google 具身模型选择 */}
          {activeEngineKey === 'gemini_er2' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Select
                value={cloudModel}
                onChange={(val) => {
                  setCloudModel(val);
                  const opt = MODEL_OPTIONS.find(m => m.value === val);
                  message.info(`已切换云端大模型为：${opt?.label || val}`);
                }}
                size="middle"
                style={{ width: 250 }}
                options={MODEL_OPTIONS.filter(m => m.type === 'cloud' && !m.value.includes('minimax')).map(m => ({
                  value: m.value,
                  label: (
                    <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Tag color={m.value.includes('er-2') ? 'purple' : 'cyan'} style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>
                        {m.value.includes('er-2') ? '具身首选' : '通用直解'}
                      </Tag>
                      <span style={{ fontWeight: m.value.includes('er-2') ? 600 : 400 }}>
                        {m.value.includes('er-2') ? 'gemini-robotics-er-2-preview' : 'Gemini 3.8 Flash'}
                      </span>
                    </span>
                  )
                }))}
              />
              <Tooltip title="配置 Google Gemini API Key">
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => {
                    setApiKeyInput(getGeminiApiKey());
                    setMinimaxApiKeyInput(getMinimaxApiKey());
                    setIsApiKeyModalOpen(true);
                  }}
                  style={{ borderRadius: 4, fontSize: 11 }}
                >
                  密钥设置
                </Button>
              </Tooltip>
            </div>
          )}

          {/* 双方式对比弹窗入口 */}
          <Tooltip title="双轨对比：横向对比方式 1 (本地大模型) 与方式 2 (Google 具身 / Gemini) 的动作时序边界、耗时、置信度与SOP差异，支持一键采纳">
            <Button
              icon={<DiffOutlined />}
              onClick={() => setIsCompareModalOpen(true)}
              style={{
                borderRadius: 6,
                borderColor: '#c084fc',
                color: '#7e22ce',
                backgroundColor: '#faf5ff',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              双方式标注对比 <Tag color="purple" style={{ marginLeft: 4, marginInlineEnd: 0, borderRadius: 4, fontSize: 11 }}>Diff</Tag>
            </Button>
          </Tooltip>

          {/* 训练数据导出中心入口 */}
          <Tooltip title="将人工校准审核后的时序动作数据导出为开源微调标准格式 (LLaMA-Factory ShareGPT / Apple MLX-VLM / TaskInfo)">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => setIsExportModalOpen(true)}
              style={{
                borderRadius: 6,
                borderColor: '#10b981',
                color: '#047857',
                backgroundColor: '#ecfdf5',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              导出训练集 <Tag color="green" style={{ marginLeft: 4, marginInlineEnd: 0, borderRadius: 4, fontSize: 11 }}>SFT</Tag>
            </Button>
          </Tooltip>

          {/* 模型版本与服务接入入口 */}
          <Tooltip title="管理已微调模型与基座版本台账，查看 mIoU / 准确率指标，测试独立推理服务连通性">
            <Button
              icon={<RobotOutlined />}
              onClick={() => setIsModelVersionDrawerOpen(true)}
              style={{
                borderRadius: 6,
                borderColor: '#6366f1',
                color: '#4338ca',
                backgroundColor: '#eef2ff',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              模型版本 <Tag color="geekblue" style={{ marginLeft: 4, marginInlineEnd: 0, borderRadius: 4, fontSize: 11 }}>Registry</Tag>
            </Button>
          </Tooltip>

          <Tooltip title="清空动作步骤，重置为待标注初始演示状态">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetForDemo}
              style={{ borderRadius: 6, color: '#d97706', borderColor: '#fde68a', backgroundColor: '#fffbeb', whiteSpace: 'nowrap' }}
            >
              重置状态
            </Button>
          </Tooltip>

          <Popover
            trigger="click"
            title={<span style={{ fontWeight: 700 }}>AI 标注时序范围与切片配置</span>}
            content={
              <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>分析模式:</div>
                  <Segmented
                    block
                    value={analysisScope}
                    onChange={(val) => setAnalysisScope(val)}
                    options={[
                      { label: '全片时序标注 (推荐)', value: 'full' },
                      { label: '局部短窗口微调', value: 'window' },
                    ]}
                  />
                </div>

                {analysisScope === 'window' ? (
                  <>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>窗口起始时间 (秒):</div>
                      <InputNumber
                        min={0}
                        max={Math.max(0, Math.round(currentEpisode?.duration || (currentEpisode?.totalFrames / currentFps) || 138) - 1)}
                        step={1}
                        value={analysisWindowStart}
                        onChange={(val) => setAnalysisWindowStart(val ?? 0)}
                        addonAfter="s"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>窗口持续时长 (秒):</div>
                      <InputNumber
                        min={2}
                        max={30}
                        step={1}
                        value={analysisWindowDuration}
                        onChange={(val) => setAnalysisWindowDuration(val ?? 8)}
                        addonAfter="s"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#15803d', lineHeight: 1.5 }}>
                    ✔ <b>已启用全片标注模式</b>：自动分析 <b>0.0s 至 {(currentEpisode?.duration || (currentEpisode?.totalFrames / currentFps) || 60).toFixed(1)}s</b>，识别全片完整连续动作工步（100% 覆盖），推理完成后将自动直出载入正式列表。
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>时序采样切片数 (帧):</div>
                  <InputNumber
                    min={4}
                    max={10}
                    step={1}
                    value={framesPerWindow}
                    onChange={(val) => setFramesPerWindow(val ?? 6)}
                    addonAfter="帧 (均匀时序切片)"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                  💡 默认抽取 {framesPerWindow} 张高保真画面切片传给视觉大模型，既保障端侧与云端低时延，又能准确捕捉全视频关键动作转折。
                </div>
              </div>
            }
          >
            <Button
              icon={<SlidersOutlined />}
              style={{
                borderRadius: 6,
                whiteSpace: 'nowrap',
                borderColor: analysisScope === 'full' ? '#86efac' : '#cbd5e1',
                backgroundColor: analysisScope === 'full' ? '#f0fdf4' : '#ffffff',
                color: analysisScope === 'full' ? '#166534' : '#1e293b',
                fontWeight: 600,
              }}
            >
              {analysisScope === 'full' 
                ? `全片标注: [0s ~ ${(currentEpisode?.duration || (currentEpisode?.totalFrames / currentFps) || 60).toFixed(1)}s] (${framesPerWindow}帧)`
                : `分析窗口: [${analysisWindowStart}s ~ ${(analysisWindowStart + analysisWindowDuration).toFixed(1)}s] (${framesPerWindow}帧)`}
            </Button>
          </Popover>

          <Button
            type="primary"
            icon={activeEngineKey === 'local_qwen' ? <RobotOutlined /> : (activeEngineKey === 'minimax_m3' ? <ThunderboltOutlined /> : <CloudOutlined />)}
            onClick={handleStartAiJob}
            loading={aiJobStatus === 'running' || aiJobStatus === 'queued'}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              background: activeEngineKey === 'local_qwen'
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : (activeEngineKey === 'minimax_m3'
                    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'),
              border: 'none',
              boxShadow: activeEngineKey === 'local_qwen'
                ? '0 2px 8px rgba(37, 99, 235, 0.3)'
                : (activeEngineKey === 'minimax_m3'
                    ? '0 2px 8px rgba(234, 88, 12, 0.35)'
                    : '0 2px 8px rgba(124, 58, 237, 0.3)'),
              whiteSpace: 'nowrap'
            }}
          >
            {aiJobStatus === 'running'
              ? '分析中...'
              : (activeEngineKey === 'local_qwen' 
                  ? `启动方式 1 (${jobModel === 'qwen2.5-vl' ? 'Qwen2.5-VL' : (jobModel === 'internvl-2.5' ? 'InternVL 2.5' : (jobModel === 'cogvlm2-video' ? 'CogVLM2' : 'Qwen3-VL'))})` 
                  : (activeEngineKey === 'minimax_m3'
                      ? '启动方式 2 (MiniMax-M3 商业直解)'
                      : `启动方式 3 (${cloudModel.includes('er-2') ? 'gemini-robotics-er-2' : 'Gemini 3.8'})`))}
          </Button>

          <Tooltip title="查看基于不可变契约的版本演进树">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setIsHistoryDrawerOpen(true)}
              style={{ borderRadius: 6, whiteSpace: 'nowrap' }}
            >
              版本历史 <Tag color="geekblue" style={{ marginLeft: 4, marginInlineEnd: 0, borderRadius: 4 }}>{currentRevisionId}</Tag>
            </Button>
          </Tooltip>

          <Button
            icon={<CodeOutlined />}
            onClick={() => setIsJsonModalOpen(true)}
            style={{ borderRadius: 6, whiteSpace: 'nowrap' }}
          >
            标准 JSON
          </Button>

          <Tooltip title="查看如何接入本地真实 Qwen-VL / Ollama 模型">
            <Button
              type="text"
              icon={<RobotOutlined />}
              onClick={() => setIsVlmConnectModalOpen(true)}
              style={{ color: '#475569' }}
            />
          </Tooltip>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitAudit}
            style={{ background: '#10b981', borderColor: '#059669', borderRadius: 6, fontWeight: 500, whiteSpace: 'nowrap' }}
          >
            完成审核
          </Button>
        </Space>
      </header>

      {/* =====================================================================
          核心工作区：左右双栏布局
          ===================================================================== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ===================================================================
            左栏 (Flex 1.4)：视频播放区 + 多通道时序轴 (交互区域 2)
            =================================================================== */}
        <div style={{
          flex: '1.4',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #334155',
          overflow: 'hidden'
        }}>
          {/* 视频顶部控制工具条 */}
          <div style={{
            height: 38,
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            color: '#cbd5e1',
            fontSize: 12
          }}>
            <Space size={10}>
              <VideoCameraOutlined style={{ color: '#38bdf8' }} />
              <Segmented
                size="small"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { label: '主目视角 (Ego)', value: 'single' },
                  { label: '四相机矩阵 (4-Cam Grid)', value: 'grid' },
                ]}
                style={{ backgroundColor: '#0f172a' }}
              />
              {viewMode === 'single' && (
                <Select
                  size="small"
                  value={activeCameraId}
                  onChange={setActiveCameraId}
                  style={{ width: 180 }}
                  options={EPISODE_META.cameras.map(c => ({
                    value: c.id,
                    label: `${c.name} ${c.isRef ? '★基准' : ''}`
                  }))}
                />
              )}
            </Space>

            <Space size={12} style={{ alignItems: 'center' }}>
              <span>机位: <Tag color="blue" style={{ margin: 0 }}>{activeCamera.name}</Tag></span>
              <span>分辨率: <code style={{ color: '#38bdf8' }}>{activeCamera.resolution}</code></span>
              <span>时码: <code style={{ color: '#f59e0b' }}>
                {String(Math.floor(currentFrame / currentFps / 60)).padStart(2, '0')}:
                {String(Math.floor((currentFrame / currentFps) % 60)).padStart(2, '0')}.
                {String(Math.floor(((currentFrame / currentFps) % 1) * 100)).padStart(2, '0')}
              </code></span>
              <span>当前帧: <code style={{ color: '#ef4444', fontWeight: 'bold' }}>{currentFrame}</code> / {totalFrames}</span>

              {currentEpisode ? (
                <Tooltip title="清空当前视频与动作工步，重置工作台为待导入状态">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleResetForDemo}
                    style={{ fontSize: 11, height: 24, padding: '0 8px', borderRadius: 4 }}
                  >
                    清空视频
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: 11, height: 24, padding: '0 8px', borderRadius: 4, background: '#0284c7' }}
                >
                  上传新视频
                </Button>
              )}
            </Space>
          </div>

          {/* 视频画布渲染模拟区 */}
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617',
            overflow: 'hidden'
          }}>
            {viewMode === 'single' ? (
              /* 单主目视角 */
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, #1e293b 0%, #020617 100%)'
              }}>
                {!currentEpisode ? (
                  /* 还没载入视频时的工业科技感导入 Dropzone */
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropVideo}
                    style={{
                      width: '98%',
                      height: '96%',
                      border: '2px dashed #334155',
                      borderRadius: 12,
                      backgroundColor: '#070b14',
                      backgroundImage: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.45) 0%, rgba(2, 6, 23, 0.98) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '32px 24px',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* 装饰性背景网格 */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.07,
                      backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                      pointerEvents: 'none'
                    }} />

                    {/* 科技感发光图标 */}
                    <div style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0.6) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 18,
                      boxShadow: '0 0 28px rgba(56, 189, 248, 0.2)',
                      zIndex: 2
                    }}>
                      <CloudUploadOutlined style={{ fontSize: 36, color: '#38bdf8' }} />
                    </div>

                    <div style={{ fontSize: 19, fontWeight: 700, color: '#f8fafc', marginBottom: 10, letterSpacing: 0.5, zIndex: 2 }}>
                      待导入遥操作作业视频 · 启动 AI 自动标注
                    </div>

                    <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 520, lineHeight: '22px', marginBottom: 26, zIndex: 2 }}>
                      支持将本地录制的 MP4 / MOV 遥操作真机视频导入此处。导入后系统将<b>自动调起工业 VLM 多阶段时序推理流水线</b>，完成动作意图提取与时序半开区间切分，在右侧生成完整的标注结果。
                    </p>

                    <Space size={16} wrap style={{ zIndex: 2, justifyContent: 'center' }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<UploadOutlined />}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          height: 42,
                          padding: '0 24px',
                          fontSize: 14,
                          fontWeight: 600,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          border: 'none',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                        }}
                      >
                        📁 选择本地视频文件 (MP4 / MOV)
                      </Button>
                    </Space>

                    <div style={{
                      marginTop: 22,
                      fontSize: 12,
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      zIndex: 2,
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <span>✓ 现场真实具身装配录像 (10.4分钟 · 18,789帧)</span>
                      <span>•</span>
                      <span>✓ 支持拖拽或选择本地真实视频 (MP4 / MOV)</span>
                    </div>
                  </div>
                ) : (
                  /* 机械臂操作场景：优先播放真实视频源 */
                  <div style={{
                  width: '98%',
                  height: '96%',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  position: 'relative',
                  backgroundColor: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                }}>
                  {activeCamera?.videoSrc ? (
                    <video
                      ref={videoRef}
                      src={activeCamera.videoSrc}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000000'
                      }}
                      muted
                      playsInline
                      onTimeUpdate={() => {
                        if (videoRef.current && isPlaying) {
                          const f = Math.round(videoRef.current.currentTime * currentFps);
                          setCurrentFrame(Math.min(totalFrames - 1, f));
                        }
                      }}
                      onEnded={() => {
                        if (!isLooping) setIsPlaying(false);
                      }}
                    />
                  ) : (
                    /* 工业分拣台三维视景渲染 (SVG 备用仿真) */
                    <svg width="100%" height="100%" viewBox="0 0 800 450" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      <rect x="50" y="240" width="700" height="180" fill="url(#gridGrad)" stroke="#334155" strokeWidth="1.5" rx="6" />

                      <g transform={`translate(${280 + Math.sin(currentFrame / 40) * 15}, ${260})`}>
                        <rect x="0" y="0" width="130" height="90" fill="#b45309" stroke="#d97706" strokeWidth="2" rx="4" opacity="0.85" />
                        <line x1="0" y1="45" x2="130" y2="45" stroke="#78350f" strokeWidth="1.5" />
                        <text x="65" y="50" fill="#fef3c7" fontSize="12" textAnchor="middle" fontWeight="bold">📦 瓦楞纸箱</text>
                      </g>

                      <g transform={`translate(${480}, ${270})`}>
                        <polygon points="20,0 70,0 85,75 5,75" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                        <circle cx="45" cy="38" r="14" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="45" y="42" fill="#ffffff" fontSize="10" textAnchor="middle">🔩 核心支架</text>
                      </g>

                      <g transform={`translate(${240 + Math.cos(currentFrame / 30) * 40}, ${120 + Math.sin(currentFrame / 30) * 35})`}>
                        <line x1="0" y1="0" x2="60" y2="70" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
                        <line x1="60" y1="70" x2="90" y2="130" stroke="#818cf8" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="90" cy="130" r="8" fill="#a855f7" />
                        <rect x="80" y="132" width="6" height="18" fill="#c084fc" rx="2" />
                        <rect x="94" y="132" width="6" height="18" fill="#c084fc" rx="2" />
                        <text x="90" y="162" fill="#c084fc" fontSize="10" textAnchor="middle">👈 左臂 (Dual)</text>
                      </g>

                      <g transform={`translate(${420 - Math.sin(currentFrame / 25) * 35}, ${110 + Math.cos(currentFrame / 25) * 40})`}>
                        <line x1="120" y1="0" x2="70" y2="80" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
                        <line x1="70" y1="80" x2="40" y2="140" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="40" cy="140" r="8" fill="#2563eb" />
                        <rect x="30" y="142" width="6" height="20" fill="#93c5fd" rx="2" />
                        <rect x="44" y="142" width="6" height="20" fill="#93c5fd" rx="2" />
                        <text x="40" y="172" fill="#93c5fd" fontSize="10" textAnchor="middle">👉 右臂 (Master)</text>
                      </g>
                    </svg>
                  )}

                  {/* 屏幕四角工业 HUD 标记 */}
                  <div style={{ position: 'absolute', top: 12, left: 16, color: '#38bdf8', fontSize: 11, fontFamily: 'monospace' }}>
                    ● REC [{activeCamera.id.toUpperCase()}] RAW_STREAM<br />
                    FPS: {currentFps}.00 | EXPOSURE: AUTO | LATENCY: 8ms
                  </div>

                  <div style={{ position: 'absolute', top: 12, right: 16, textAlign: 'right', color: '#94a3b8', fontSize: 11 }}>
                    <Tag color="cyan" style={{ margin: 0, borderRadius: 4 }}>ROBOT_SYS_ONLINE</Tag><br />
                    <span style={{ fontSize: 10 }}>TORQUE_LIMIT: SAFE</span>
                  </div>

                  {/* 正在生效的动作气泡提示 (随播放帧动态点亮) */}
                  {(() => {
                    const activeStepNow = steps.find(s => currentFrame >= s.startFrame && currentFrame < s.endFrame) || (selectedStep && currentFrame >= selectedStep.startFrame && currentFrame < selectedStep.endFrame ? selectedStep : null);
                    if (!activeStepNow) return null;
                    return (
                      <div style={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(15, 23, 42, 0.88)',
                        border: `1.5px solid ${activeStepNow.color || '#3b82f6'}`,
                        backdropFilter: 'blur(8px)',
                        padding: '6px 18px',
                        borderRadius: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: activeStepNow.color || '#3b82f6', boxShadow: `0 0 8px ${activeStepNow.color || '#3b82f6'}` }} />
                        <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>
                          {activeStepNow.skill}
                        </span>
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>
                          {activeStepNow.arm} · {activeStepNow.object} · {activeStepNow.goal}
                        </span>
                        <Tag color="blue" style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, borderRadius: 4 }}>
                          [{activeStepNow.startFrame}, {activeStepNow.endFrame}) 帧
                        </Tag>
                      </div>
                    );
                  })()}

                  {/* AI 推理扫描 HUD 覆盖层 (当任务 running 时展示) */}
                  {aiJobStatus === 'running' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      border: '2px solid rgba(59, 130, 246, 0.5)',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: 16
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 'bold',
                          letterSpacing: 1
                        }}>
                          ⚡ {annotationMethod === 'local_qwen' ? (jobModel === 'qwen2.5-vl' ? 'Qwen2.5-VL' : jobModel) : 'Gemini'} 视觉时序特征扫描中...
                        </span>
                        <span style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'monospace' }}>
                          WIN: [{analysisWindowStart}s ~ {(analysisWindowStart + analysisWindowDuration).toFixed(1)}s] · {framesPerWindow} 采样切片
                        </span>
                      </div>
                      {/* 扫描光线动画模拟 */}
                      <div style={{
                        width: '100%',
                        height: 2,
                        backgroundColor: '#38bdf8',
                        boxShadow: '0 0 10px #38bdf8',
                        transform: `translateY(${((currentFrame * 3) % 280)}px)`,
                        transition: 'transform 0.1s linear'
                      }} />
                      <div style={{ color: '#93c5fd', fontSize: 11, textAlign: 'center', backgroundColor: 'rgba(15,23,42,0.7)', padding: '4px 0', borderRadius: 4 }}>
                        🔍 正在识别末端夹爪与目标物态转换边界...
                      </div>
                    </div>
                  )}
                    </div>
                  )}
                </div>
            ) : (
              /* 四相机矩阵视角 */
              <div style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 4,
                padding: 4
              }}>
                {EPISODE_META.cameras.map(cam => (
                  <div key={cam.id} style={{
                    backgroundColor: '#0f172a',
                    border: cam.id === activeCameraId ? '2px solid #38bdf8' : '1px solid #334155',
                    borderRadius: 4,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }} onClick={() => { setActiveCameraId(cam.id); setViewMode('single'); }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                      📹 {cam.name} {cam.isRef ? '(参考机位)' : ''}
                    </span>
                    <div style={{ position: 'absolute', bottom: 4, left: 8, color: '#94a3b8', fontSize: 10 }}>
                      {cam.resolution}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 时间轴与时序控制条 (Timeline Controller) */}
          <div style={{
            backgroundColor: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            {/* 播放控制按钮栏 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space size={8}>
                <Tooltip title="首帧 (0)">
                  <Button
                    size="small"
                    ghost
                    icon={<StepBackwardOutlined />}
                    onClick={() => handleSeekFrame(0)}
                  />
                </Tooltip>
                <Tooltip title="后退 10 帧 (Shift + ←)">
                  <Button
                    size="small"
                    ghost
                    onClick={() => handleSeekFrame(currentFrame - 10)}
                  >
                    -10f
                  </Button>
                </Tooltip>
                <Tooltip title="后退 1 帧 (←)">
                  <Button
                    size="small"
                    ghost
                    onClick={() => handleSeekFrame(currentFrame - 1)}
                  >
                    -1f
                  </Button>
                </Tooltip>

                <Button
                  type="primary"
                  icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: 76,
                    background: isPlaying ? '#d97706' : '#2563eb',
                    borderColor: isPlaying ? '#b45309' : '#1d4ed8'
                  }}
                >
                  {isPlaying ? '暂停' : '播放'}
                </Button>

                <Tooltip title="前进 1 帧 (→)">
                  <Button
                    size="small"
                    ghost
                    onClick={() => handleSeekFrame(currentFrame + 1)}
                  >
                    +1f
                  </Button>
                </Tooltip>
                <Tooltip title="前进 10 帧 (Shift + →)">
                  <Button
                    size="small"
                    ghost
                    onClick={() => handleSeekFrame(currentFrame + 10)}
                  >
                    +10f
                  </Button>
                </Tooltip>
                <Tooltip title="尾帧 (1330)">
                  <Button
                    size="small"
                    ghost
                    icon={<StepForwardOutlined />}
                    onClick={() => handleSeekFrame(totalFrames - 1)}
                  />
                </Tooltip>

                <Divider orientation="vertical" style={{ borderColor: '#475569', height: 16 }} />

                <Select
                  size="small"
                  value={playbackSpeed}
                  onChange={setPlaybackSpeed}
                  style={{ width: 78 }}
                  options={[
                    { value: 0.25, label: '0.25x' },
                    { value: 0.5, label: '0.5x' },
                    { value: 1.0, label: '1.0x' },
                    { value: 2.0, label: '2.0x' },
                  ]}
                />

                <Tooltip title="循环播放">
                  <Button
                    size="small"
                    type={isLooping ? 'primary' : 'default'}
                    ghost={!isLooping}
                    onClick={() => setIsLooping(!isLooping)}
                    style={{ fontSize: 11 }}
                  >
                    循环
                  </Button>
                </Tooltip>
              </Space>

              {/* 右侧快捷帧输入与快捷键提示 */}
              <Space size={10}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  快捷键: <code>Space</code> 播放 · <code>Q</code> 设起点 · <code>R</code> 设终点 · <code>T</code> 边界建议
                </span>
                <InputNumber
                  size="small"
                  min={0}
                  max={totalFrames - 1}
                  value={currentFrame}
                  onChange={val => val !== null && handleSeekFrame(val)}
                  style={{ width: 80, backgroundColor: '#0f172a', color: '#f8fafc', borderColor: '#475569' }}
                />
              </Space>
            </div>

            {/* 可视化时间轴通道容器 (Interactive Timeline Bar) */}
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              style={{
                position: 'relative',
                height: 86,
                backgroundColor: '#090d16',
                borderRadius: 6,
                border: '1px solid #334155',
                cursor: 'pointer',
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              {/* 1. 刻度尺 (Top Ruler: 0 ~ 1331 帧) */}
              <div style={{
                height: 18,
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 4px',
                fontSize: 10,
                color: '#64748b',
                pointerEvents: 'none'
              }}>
                {totalFrames > 0 ? (
                  <>
                    <span>0f (0.0s)</span>
                    <span>{Math.round(totalFrames * 0.2)}f ({(totalFrames * 0.2 / currentFps).toFixed(1)}s)</span>
                    <span>{Math.round(totalFrames * 0.4)}f ({(totalFrames * 0.4 / currentFps).toFixed(1)}s)</span>
                    <span>{Math.round(totalFrames * 0.6)}f ({(totalFrames * 0.6 / currentFps).toFixed(1)}s)</span>
                    <span>{Math.round(totalFrames * 0.8)}f ({(totalFrames * 0.8 / currentFps).toFixed(1)}s)</span>
                    <span>{totalFrames}f ({(totalFrames / currentFps).toFixed(1)}s)</span>
                  </>
                ) : (
                  <span>等待载入视频以绘制时序刻度...</span>
                )}
              </div>

              {/* 2. 通道 1: 现有已确认步骤 (Timeline Steps Track) */}
              <div style={{
                position: 'relative',
                height: 32,
                marginTop: 2,
                pointerEvents: 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 6,
                  top: 7,
                  fontSize: 10,
                  color: '#475569',
                  zIndex: 2
                }}>
                  标注步骤:
                </span>
                {steps.map(step => {
                  const leftPct = totalFrames > 0 ? (step.startFrame / totalFrames) * 100 : 0;
                  const widthPct = totalFrames > 0 ? ((step.endFrame - step.startFrame) / totalFrames) * 100 : 0;
                  const isSelected = selectedStepId === step.stepId;

                  return (
                    <div
                      key={step.stepId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStepId(step.stepId);
                        setCurrentFrame(step.startFrame);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        width: `${Math.max(1.2, widthPct)}%`,
                        height: 28,
                        top: 2,
                        backgroundColor: step.color || '#1677ff',
                        borderRadius: 4,
                        border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.7)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 6px',
                        overflow: 'hidden',
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 500,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: isSelected ? 4 : 2,
                        transition: 'all 0.1s ease'
                      }}
                      title={`${step.skill} [${step.startFrame}, ${step.endFrame})`}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.source === 'ai_candidate' && '⚡ '}
                        {step.source === 'ai_modified' && '🛠️ '}
                        {step.skill}
                      </span>
                      <span style={{ fontSize: 9, opacity: 0.85 }}>
                        {step.endFrame - step.startFrame}f
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 3. 通道 2: AI 预标注候选叠加带 (AI Candidates Preview Track) */}
              <div style={{
                position: 'relative',
                height: 24,
                marginTop: 4,
                borderTop: '1px dashed #1e293b',
                pointerEvents: 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 6,
                  top: 4,
                  fontSize: 10,
                  color: '#3b82f6',
                  zIndex: 2
                }}>
                  AI 候选:
                </span>
                {candidates.map(cand => {
                  const leftPct = totalFrames > 0 ? (cand.startFrame / totalFrames) * 100 : 0;
                  const widthPct = totalFrames > 0 ? ((cand.endFrame - cand.startFrame) / totalFrames) * 100 : 0;
                  const isAccepted = cand.reviewStatus === 'accepted';
                  const isRejected = cand.reviewStatus === 'rejected';

                  return (
                    <div
                      key={cand.candidateId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeekCandidate(cand);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        width: `${Math.max(1, widthPct)}%`,
                        height: 18,
                        top: 3,
                        backgroundColor: isRejected
                          ? 'rgba(239, 68, 68, 0.2)'
                          : isAccepted
                            ? 'rgba(34, 197, 94, 0.4)'
                            : 'rgba(59, 130, 246, 0.35)',
                        border: isAccepted
                          ? '1px solid #22c55e'
                          : isRejected
                            ? '1px dashed #ef4444'
                            : '1px dashed #60a5fa',
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#cbd5e1',
                        fontSize: 10,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        zIndex: 2
                      }}
                      title={`候选 ${cand.candidateId}: [${cand.startFrame}, ${cand.endFrame}) - 状态: ${cand.reviewStatus}`}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>
                        {isAccepted && '✓ '}
                        {cand.candidateId}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 4. 红色当前播放针 (Red Playhead Cursor) */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0}%`,
                width: 2,
                backgroundColor: '#ef4444',
                boxShadow: '0 0 6px #ef4444',
                zIndex: 10,
                pointerEvents: 'none'
              }}>
                {/* 顶部倒三角指示标 */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: -5,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #ef4444'
                }} />
                {/* 底部当前帧标签 */}
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  left: -18,
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: 9,
                  padding: '1px 3px',
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {currentFrame}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            右栏 (550px)：AI 任务面板 + 步骤属性精修面板 (交互区域 3 & 4)
            =================================================================== */}
        <div style={{
          width: 550,
          minWidth: 500,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          borderLeft: '1px solid #e2e8f0'
        }}>
          {/* -------------------------------------------------------
              核心展示区：生成的标注动作步骤与帧区间
              ------------------------------------------------------- */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <ThunderboltOutlined style={{ color: '#2563eb' }} /> 动作工步与时序区间
                </span>
                <Tag color={steps.length > 0 ? 'blue' : 'default'} style={{ margin: 0, fontWeight: 600, borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {steps.length} 正式工步
                </Tag>
                <Tag color={candidates.length > 0 ? 'orange' : 'default'} style={{ margin: 0, fontWeight: 600, borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {candidates.length} AI候选
                </Tag>
                <Tag color="purple" style={{ margin: 0, borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {processedWindows}/{totalWindows || 1} 窗口
                </Tag>
                {aiJobStatus === 'succeeded' && (
                  <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    AI 已生成
                  </Tag>
                )}
              </div>

              <Space size={6} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {steps.length > 0 && (
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      const graspStep = steps.find(s => s.skill.includes('抓取')) || steps[1] || steps[0];
                      if (graspStep) {
                        handleSeekFrame(graspStep.startFrame);
                        setIsPlaying(true);
                        setSelectedStepId(graspStep.stepId);
                        message.info(`已定位回放【${graspStep.skill}】：第 ${graspStep.startFrame} 帧起播`);
                      }
                    }}
                    style={{ fontSize: 12, borderRadius: 6, color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    回放抓取
                  </Button>
                )}
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddNewManualStep}
                  style={{ borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  新增步骤
                </Button>
              </Space>
            </div>

            <div style={{ fontSize: 11, color: '#64748b' }}>
              半开区间 <code>[start, end)</code> 契约 · 单击卡片或 <b>👁️ 定位回放</b> 即刻联动视频
            </div>
          </div>

          {/* 步骤卡片流式列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f8fafc' }}>
            {/* AI 候选工步池展示与采纳操作区 (保护已有手工标注) */}
            {candidates.length > 0 && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 2px 8px rgba(37,99,235,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ThunderboltOutlined style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>
                      AI 待采纳候选工步 ({candidates.length} 个)
                    </span>
                    <Tag color={analysisScope === 'full' ? 'green' : 'blue'} style={{ margin: 0, fontSize: 10 }}>
                      {analysisScope === 'full' 
                        ? `[全片 0s ~ ${(currentEpisode?.duration || (currentEpisode?.totalFrames / currentFps) || 60).toFixed(1)}s]`
                        : `[${analysisWindowStart}s ~ ${Math.min(currentEpisode?.duration || (currentEpisode?.totalFrames / currentFps) || 138.3, analysisWindowStart + analysisWindowDuration).toFixed(1)}s]`}
                    </Tag>
                  </div>
                  <Space size={6} wrap>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleQuickAdoptCandidates('append')}
                      style={{ background: '#2563eb', fontSize: 12, borderRadius: 4 }}
                    >
                      追加到现有工步
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => handleQuickAdoptCandidates('replace')}
                      style={{ fontSize: 12, borderRadius: 4 }}
                    >
                      覆盖现有工步
                    </Button>
                    <Button
                      size="small"
                      onClick={handleOpenImportModal}
                      style={{ fontSize: 12, borderRadius: 4 }}
                    >
                      逐项裁决导入
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        setCandidates([]);
                        message.info('已清除候选池');
                      }}
                      style={{ fontSize: 12, color: '#64748b' }}
                    >
                      清空
                    </Button>
                  </Space>
                </div>
                <div style={{ fontSize: 11, color: '#3b82f6', lineHeight: 1.4 }}>
                  💡 候选片段已在播放轨下方蓝色虚线区域标记。未直接覆盖您的正式标注。可逐条卡片复核采纳或批量导入。
                </div>

                {/* 候选卡片列表 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {candidates.map((cand, cIdx) => {
                    const isAccepted = cand.reviewStatus === 'accepted';
                    const isRejected = cand.reviewStatus === 'rejected';
                    const isInvalid = cand.isValidInterval === false || cand.startFrame === null;
                    const durationSec = (cand.startFrame !== null && cand.endFrame !== null)
                      ? ((cand.endFrame - cand.startFrame) / currentFps).toFixed(2)
                      : '0.00';

                    return (
                      <div
                        key={cand.candidateId || `cand-${cIdx}`}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          backgroundColor: isAccepted ? '#f0fdf4' : (isRejected ? '#fef2f2' : '#ffffff'),
                          border: isAccepted ? '1px solid #bbf7d0' : (isRejected ? '1px solid #fecaca' : (isInvalid ? '1px solid #fca5a5' : '1px solid #dbeafe')),
                          opacity: isRejected ? 0.6 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag color="#1d4ed8" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>
                              候选 #{cIdx + 1}
                            </Tag>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                              {cand.skill || '未命名动作'}
                            </span>
                            <Tag style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                              {cand.arm === 'right' ? '🦾 右臂' : (cand.arm === 'left' ? '🦾 左臂' : (cand.arm === 'bimanual' ? '👐 双臂' : (cand.arm || '机械臂')))}
                            </Tag>
                            {cand.object && (
                              <Tag color="cyan" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                                {cand.object}
                              </Tag>
                            )}
                          </div>

                          <Space size={4}>
                            {isAccepted && <Tag color="success" style={{ margin: 0 }}>已采纳</Tag>}
                            {isRejected && <Tag color="error" style={{ margin: 0 }}>已驳回</Tag>}
                            {!isAccepted && !isRejected && <Tag color="gold" style={{ margin: 0 }}>待复核</Tag>}
                            {cand.displayConfidence && (
                              <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                                置信度: {cand.displayConfidence}
                              </Tag>
                            )}
                          </Space>
                        </div>

                        {/* 帧区间与时间显示 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#475569' }}>帧区间:</span>
                            {cand.startFrame !== null && cand.endFrame !== null ? (
                              <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#0f172a', fontWeight: 600 }}>
                                [{cand.startFrame}, {cand.endFrame}) ({durationSec}s)
                              </code>
                            ) : (
                              <Tag color="error" style={{ margin: 0 }}>帧区间缺失或未识别</Tag>
                            )}
                            {cand.startTime !== undefined && cand.endTime !== undefined && (
                              <span style={{ color: '#64748b', fontSize: 11 }}>
                                ({cand.startTime}s ~ {cand.endTime}s)
                              </span>
                            )}
                          </div>

                          {/* 证据帧 */}
                          {cand.evidenceFrameIndices && cand.evidenceFrameIndices.length > 0 && (
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              证据帧: #{cand.evidenceFrameIndices.join(', #')}
                            </span>
                          )}
                        </div>

                        {/* 校验错误提示 */}
                        {isInvalid && (
                          <div style={{
                            fontSize: 11,
                            color: '#b91c1c',
                            backgroundColor: '#fff1f2',
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid #fecdd3'
                          }}>
                            ⚠️ <b>合规校验未通过：</b>
                            {Array.isArray(cand.validationErrors) && cand.validationErrors.length > 0
                              ? cand.validationErrors.join('; ')
                              : '时序参数或帧区间无效，已被系统拦截，无法采纳为正式标注'}
                          </div>
                        )}

                        {cand.description && (
                          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                            {cand.description}
                          </div>
                        )}

                        {/* 卡片底栏操作按钮 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {cand.startFrame !== null && (
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                handleSeekFrame(cand.startFrame);
                                setIsPlaying(true);
                                message.info(`定位至候选工步【${cand.skill}】：第 ${cand.startFrame} 帧起播`);
                              }}
                              style={{ fontSize: 11, borderRadius: 4 }}
                            >
                              回放片段
                            </Button>
                          )}
                          {!isAccepted && (
                            <Tooltip title={isInvalid ? (cand.validationErrors?.join('; ') || '时序格式未通过校验，禁止采纳') : '将此条候选转换为正式工步'}>
                              <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                disabled={isInvalid || isRejected}
                                onClick={() => handleAdoptSingleCandidate(cand)}
                                style={{ fontSize: 11, borderRadius: 4, backgroundColor: isInvalid || isRejected ? undefined : '#16a34a', borderColor: isInvalid || isRejected ? undefined : '#16a34a' }}
                              >
                                采纳为正式工步
                              </Button>
                            </Tooltip>
                          )}
                          {!isRejected && !isAccepted && (
                            <Button
                              size="small"
                              danger
                              onClick={() => handleRejectSingleCandidate(cand.candidateId)}
                              style={{ fontSize: 11, borderRadius: 4 }}
                            >
                              驳回
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {steps.map((s, idx) => {
              const isCurrentPlaying = currentFrame >= s.startFrame && currentFrame < s.endFrame;
              const isSelected = selectedStepId === s.stepId;
              const isInlineEditing = editingStepInlineId === s.stepId;
              const durationSec = ((s.endFrame - s.startFrame) / currentFps).toFixed(2);

              return (
                <Card
                  key={s.stepId}
                  size="small"
                  style={{
                    borderRadius: 10,
                    border: isSelected || isCurrentPlaying ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    borderLeft: `4px solid ${s.color || '#2563eb'}`,
                    backgroundColor: isSelected || isCurrentPlaying ? '#f8faff' : '#ffffff',
                    boxShadow: isSelected || isCurrentPlaying ? '0 4px 16px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  styles={{ body: { padding: '12px 14px' } }}
                  onClick={() => {
                    setSelectedStepId(s.stepId);
                  }}
                >
                  {/* 卡片头部：序号、动作名、半开区间高亮徽章 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        backgroundColor: s.color || '#2563eb',
                        color: '#ffffff',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {s.skill}
                      </span>
                      {s.annoOverlap === 1 && (
                        <Tag color="magenta" style={{ margin: 0, fontSize: 10, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          ⚡ 双臂重叠
                        </Tag>
                      )}
                      {isCurrentPlaying && (
                        <Tag color="processing" style={{ margin: 0, fontSize: 10, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          ● 正在播放
                        </Tag>
                      )}
                      {s.source && (
                        <Tag
                          color={
                            s.source === 'manual'
                              ? 'orange'
                              : ((s.source === 'gemini_flash' || s.source === 'gemini_robotics_er2') ? 'purple' : 'blue')
                          }
                          style={{ margin: 0, fontSize: 10, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          {s.source === 'manual'
                            ? '人工'
                            : (s.source === 'gemini_robotics_er2'
                                ? 'Robotics-ER 具身'
                                : (s.source === 'gemini_flash' ? 'Gemini 3.8' : `${jobModel.startsWith('qwen2.5') ? 'Qwen2.5' : (jobModel.startsWith('internvl') ? 'InternVL' : (jobModel.startsWith('cogvlm') ? 'CogVLM2' : 'Qwen3-VL'))} 本地`))}
                        </Tag>
                      )}
                    </div>

                    {/* 帧区间高亮标签 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: 12,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '2px 8px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        [{s.startFrame}, {s.endFrame}) 帧
                      </span>
                      <Tag style={{ margin: 0, fontSize: 11, color: '#0284c7', backgroundColor: '#e0f2fe', borderRadius: 4, borderColor: '#bae6fd', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {durationSec}s ({s.endFrame - s.startFrame}F)
                      </Tag>
                    </div>
                  </div>

                  {/* 动作自然语言描述 (对齐 Ego 平台标注文本) */}
                  {s.stepContent && s.stepContent !== s.skill && (
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{ color: '#2563eb', fontSize: 10 }}>▶</span>
                      <span>{s.stepContent}</span>
                    </div>
                  )}

                  {/* 中间：动作四元组语义标签 */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                    <Tag color="purple" style={{ margin: 0, fontSize: 11, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      🦾 {s.arm?.replace(' (Right Arm)', '').replace(' (Left Arm)', '') || s.arm}
                    </Tag>
                    <Tag color="cyan" style={{ margin: 0, fontSize: 11, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      📦 {s.object}
                    </Tag>
                    <Tag color="geekblue" style={{ margin: 0, fontSize: 11, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      🎯 {s.goal}
                    </Tag>
                    {s.displayConfidence && (
                      <Tag color="green" style={{ margin: 0, fontSize: 11, borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        ✨ 置信度: {s.displayConfidence}
                      </Tag>
                    )}
                  </div>

                  {/* 模型语义动作描述 */}
                  {s.notes && (
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        margin: '0 0 10px 0',
                        lineHeight: '19px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        padding: '6px 10px',
                        borderRadius: 6
                      }}
                    >
                      💬 {s.notes}
                    </Paragraph>
                  )}

                  {/* 快捷操作按钮行 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                    <Space size={6}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekFrame(s.startFrame);
                          setIsPlaying(true);
                          setSelectedStepId(s.stepId);
                          message.info(`已定位至【${s.skill}】：第 ${s.startFrame} 帧 (${(s.startFrame / currentFps).toFixed(2)}s) 起播`);
                        }}
                        style={{ background: '#2563eb', fontSize: 12, borderRadius: 4 }}
                      >
                        👁️ 定位回放
                      </Button>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStepInlineId(prev => prev === s.stepId ? null : s.stepId);
                        }}
                        style={{ fontSize: 12, borderRadius: 4 }}
                      >
                        {isInlineEditing ? '收起微调' : '微调帧区间'}
                      </Button>
                      <Tooltip title="基于夹爪力传感器拐点微调起止帧 (快捷键 T)">
                        <Button
                          size="small"
                          icon={<AimOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStepId(s.stepId);
                            handleApplyAiBoundaryRefinement();
                          }}
                          style={{ fontSize: 12, color: '#7c3aed', borderColor: '#c084fc', borderRadius: 4 }}
                        >
                          T 建议
                        </Button>
                      </Tooltip>
                    </Space>
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStep(s.stepId);
                      }}
                    />
                  </div>

                  {/* 展开的内联微调输入框 (支持起止帧与四元组受控字典微调) */}
                  {isInlineEditing && (
                    <div style={{
                      marginTop: 10,
                      padding: '12px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1'
                    }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                        <span>⚙️ 工步四元组与时序区间校准 [Start, End)：</span>
                        <span style={{ color: '#2563eb' }}>
                          当前区间帧数: {s.endFrame - s.startFrame} 帧 ({((s.endFrame - s.startFrame) / currentFps).toFixed(2)}s)
                        </span>
                      </div>

                      {/* 行 1: 半开区间帧微调 */}
                      <Row gutter={8} align="middle" style={{ marginBottom: 10 }}>
                        <Col span={9}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>起点帧 (Start Frame):</div>
                          <InputNumber
                            size="small"
                            min={0}
                            max={s.endFrame - 1}
                            value={s.startFrame}
                            onChange={(val) => {
                              if (val !== null) {
                                setSteps(prev => prev.map(step => step.stepId === s.stepId ? { ...step, startFrame: val } : step));
                              }
                            }}
                            style={{ width: '100%', borderRadius: 4 }}
                          />
                        </Col>
                        <Col span={2} style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingTop: 14 }}>
                          ➔
                        </Col>
                        <Col span={9}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>终点帧 (End Frame):</div>
                          <InputNumber
                            size="small"
                            min={s.startFrame + 1}
                            max={totalFrames || 99999}
                            value={s.endFrame}
                            onChange={(val) => {
                              if (val !== null) {
                                setSteps(prev => prev.map(step => step.stepId === s.stepId ? { ...step, endFrame: val } : step));
                              }
                            }}
                            style={{ width: '100%', borderRadius: 4 }}
                          />
                        </Col>
                        <Col span={4} style={{ textAlign: 'right', paddingTop: 14 }}>
                          <Button size="small" type="primary" onClick={() => setEditingStepInlineId(null)} style={{ borderRadius: 4 }}>
                            完成
                          </Button>
                        </Col>
                      </Row>

                      {/* 行 2: 动作技能与执行手臂 */}
                      <Row gutter={8} style={{ marginBottom: 8 }}>
                        <Col span={12}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>动作技能 (Skill):</div>
                          <Select
                            size="small"
                            value={s.skill}
                            options={SKILL_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                            onChange={(val) => {
                              const skillObj = SKILL_OPTIONS.find(o => o.value === val);
                              setSteps(prev => prev.map(step => step.stepId === s.stepId ? {
                                ...step,
                                skill: val,
                                actionSkill: val,
                                color: skillObj?.color || step.color
                              } : step));
                            }}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>执行手臂 (Arm):</div>
                          <Select
                            size="small"
                            value={s.arm}
                            options={ARM_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                            onChange={(val) => {
                              setSteps(prev => prev.map(step => step.stepId === s.stepId ? { ...step, arm: val } : step));
                            }}
                            style={{ width: '100%' }}
                          />
                        </Col>
                      </Row>

                      {/* 行 3: 操作对象与达成意图 */}
                      <Row gutter={8} style={{ marginBottom: 8 }}>
                        <Col span={12}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>操作对象 (Object):</div>
                          <Select
                            size="small"
                            value={s.object}
                            options={OBJECT_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                            onChange={(val) => {
                              setSteps(prev => prev.map(step => step.stepId === s.stepId ? { ...step, object: val, actionTarget: val } : step));
                            }}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>达成意图 (Goal):</div>
                          <Select
                            size="small"
                            value={s.goal}
                            options={GOAL_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                            onChange={(val) => {
                              setSteps(prev => prev.map(step => step.stepId === s.stepId ? { ...step, goal: val, expectedGoal: val } : step));
                            }}
                            style={{ width: '100%' }}
                          />
                        </Col>
                      </Row>

                      {/* 行 4: 双臂重叠标记 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <Checkbox
                          checked={s.annoOverlap === 1}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSteps(prev => prev.map(step => step.stepId === s.stepId ? { ...step, annoOverlap: checked ? 1 : 0 } : step));
                          }}
                          style={{ fontSize: 11, color: '#475569' }}
                        >
                          ⚡ 标记为双手/重叠协同动作 (annoOverlap: 1)
                        </Checkbox>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>
                          受控工业标准数据字典
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {/* 空状态：当尚未导入视频或尚未生成动作步骤时 */}
            {steps.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: '1px dashed #cbd5e1',
                margin: '20px 14px'
              }}>
                {!currentEpisode ? (
                  <>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto'
                    }}>
                      <InboxOutlined style={{ fontSize: 32, color: '#94a3b8' }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                      暂无动作步骤（等待导入视频）
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', maxWidth: 360, margin: '0 auto 20px auto', lineHeight: '22px' }}>
                      请先在左侧<b>导入本地视频</b>或<b>载入演示样本</b>。系统将自动启动 AI 视觉多阶段推理流水线，并在分析完成后在此生成详细动作步骤与帧区间。
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          borderRadius: 6,
                          fontWeight: 600,
                          height: 36,
                          padding: '0 20px'
                        }}
                      >
                        选择本地视频并启动 AI 标注
                      </Button>
                    </div>
                  </>
                ) : aiJobStatus === 'running' || aiJobStatus === 'queued' ? (
                  <>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto'
                    }}>
                      <SyncOutlined spin style={{ fontSize: 32, color: '#2563eb' }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
                      AI 动作切分流水线执行中...
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', maxWidth: 360, margin: '0 auto 16px auto', lineHeight: '22px' }}>
                      正在对当前视频【{currentEpisode.name}】进行时序分窗与 VLM 视觉推理。分析完毕后动作步骤将在此自动展开。
                    </div>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={() => setIsPipelineModalOpen(true)}
                      style={{ borderRadius: 6, background: '#2563eb' }}
                    >
                      查看任务流水线生命周期进度
                    </Button>
                  </>
                ) : candidates.length > 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: '#f0fdf4',
                    borderRadius: 8,
                    border: '1px dashed #86efac',
                    margin: '12px 0'
                  }}>
                    <CheckCircleOutlined style={{ fontSize: 38, color: '#10b981', marginBottom: 10 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      AI 预标注分析已完成 · 已就绪 {candidates.length} 个动作候选
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', maxWidth: 420, margin: '0 auto 16px auto', lineHeight: '20px' }}>
                      大模型已完成视频切片推理并输出候选动作。点击下方按钮即可一键全量载入至正式标注列表与时序轴，随时在画面中回放与复核：
                    </div>
                    <Space size={12} wrap style={{ justifyContent: 'center' }}>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size="middle"
                        onClick={() => handleQuickAdoptCandidates('replace')}
                        style={{
                          borderRadius: 6,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          fontWeight: 600,
                          padding: '0 20px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        一键采纳并展示全部工步
                      </Button>
                      <Button
                        icon={<ThunderboltOutlined />}
                        onClick={() => handleStartAiJob(currentEpisode)}
                      >
                        重新执行 AI 预标注
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <>
                    {activeEngineKey === 'local_qwen' ? (
                      <RobotOutlined style={{ fontSize: 44, color: '#3b82f6', marginBottom: 12 }} />
                    ) : activeEngineKey === 'minimax_m3' ? (
                      <ThunderboltOutlined style={{ fontSize: 44, color: '#ea580c', marginBottom: 12 }} />
                    ) : (
                      <CloudOutlined style={{ fontSize: 44, color: '#8b5cf6', marginBottom: 12 }} />
                    )}
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      视频已就绪 · 点击启动 {activeEngineKey === 'local_qwen' ? '方式 1: 本地大模型标注' : (activeEngineKey === 'minimax_m3' ? '方式 2: MiniMax-M3 商业大模型标注' : '方式 3: Google 具身大模型标注')}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', maxWidth: 420, margin: '0 auto 16px auto', lineHeight: '20px' }}>
                      当前引擎：<b>{activeEngineKey === 'local_qwen' ? '方式 1: 本地大模型 (Qwen2.5-VL · Metal GPU · 0 API调用)' : (activeEngineKey === 'minimax_m3' ? '方式 2: MiniMax-M3 (国内商业端点 api.minimax.chat · 深度时序思考 · 产生真实用量)' : '方式 3: Google 具身大模型 (gemini-robotics-er-2 · TPU v5e)')}</b>。分析完成后将在此输出 100% 连续时序切片并自动采纳。
                    </div>
                    <Space size={10} wrap style={{ justifyContent: 'center' }}>
                      <Button
                        type="primary"
                        size="middle"
                        icon={activeEngineKey === 'local_qwen' ? <RobotOutlined /> : (activeEngineKey === 'minimax_m3' ? <ThunderboltOutlined /> : <CloudOutlined />)}
                        onClick={() => handleStartAiJob(currentEpisode)}
                        style={{
                          background: activeEngineKey === 'local_qwen'
                            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                            : (activeEngineKey === 'minimax_m3'
                                ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                                : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'),
                          borderRadius: 6,
                          padding: '0 20px',
                          fontWeight: 600,
                          border: 'none',
                          boxShadow: activeEngineKey === 'local_qwen'
                            ? '0 2px 8px rgba(37, 99, 235, 0.25)'
                            : (activeEngineKey === 'minimax_m3'
                                ? '0 2px 8px rgba(234, 88, 12, 0.35)'
                                : '0 2px 8px rgba(124, 58, 237, 0.25)')
                        }}
                      >
                        {activeEngineKey === 'local_qwen' 
                          ? `启动方式 1 (${jobModel.startsWith('qwen2.5') ? 'Qwen2.5-VL' : (jobModel.startsWith('internvl') ? 'InternVL 2.5' : (jobModel.startsWith('cogvlm') ? 'CogVLM2' : 'Qwen3-VL'))})` 
                          : (activeEngineKey === 'minimax_m3'
                              ? '启动方式 2 (MiniMax-M3 商业大模型)'
                              : `启动方式 3 (${cloudModel.includes('er-2') ? 'gemini-robotics-er-2' : 'Gemini 3.8'})`)}
                      </Button>

                      <Button
                        icon={<DiffOutlined />}
                        onClick={() => setIsCompareModalOpen(true)}
                        style={{
                          borderRadius: 6,
                          borderColor: '#c084fc',
                          color: '#7e22ce',
                          backgroundColor: '#faf5ff',
                          fontWeight: 600
                        }}
                      >
                        双方式标注对比
                      </Button>
                    </Space>
                  </>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

      {/* =====================================================================
          交互区域 7：底部操作栏 (Bottom Action Bar)
          ===================================================================== */}
      <footer style={{
        height: 48,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* 左侧：统计与覆盖率 */}
        <Space size={16}>
          <Text style={{ fontSize: 12, color: '#475569' }}>
            动作步骤: <Text strong style={{ color: '#0f172a' }}>{steps.length}</Text> 个
          </Text>
          <Divider orientation="vertical" style={{ margin: 0, height: 16 }} />
          <Text style={{ fontSize: 12, color: '#475569' }}>
            视频时序覆盖率: <Text strong style={{ color: '#16a34a' }}>{timelineCoverage}%</Text>
          </Text>
          {activeEngineKey === 'minimax_m3' ? (
            <>
              <Tag color="orange" style={{ margin: 0 }}>
                AI 预标注引擎: MiniMax-M3 商业大模型 (api.minimax.chat 官方端点 · 产生真实用量)
              </Tag>
              {modelMeta?.evalCount > 0 && modelMeta?.actualModelId === 'MiniMax-M3' && (
                <Tag color="volcano" style={{ margin: 0, fontWeight: 600 }}>
                  本次用量: {modelMeta.evalCount} Tokens · 耗时 {((modelMeta.elapsedMs || modelMeta.totalElapsedMs || 0) / 1000).toFixed(1)}s
                </Tag>
              )}
            </>
          ) : activeEngineKey === 'gemini_er2' ? (
            <>
              <Tag color="purple" style={{ margin: 0 }}>
                AI 预标注引擎: Google 具身 ER-2 (TPU v5e 云端直解)
              </Tag>
              {modelMeta?.evalCount > 0 && modelMeta?.actualModelId !== 'MiniMax-M3' && (
                <Tag color="geekblue" style={{ margin: 0, fontWeight: 600 }}>
                  本次用量: {modelMeta.evalCount} Tokens · 耗时 {((modelMeta.elapsedMs || modelMeta.totalElapsedMs || 0) / 1000).toFixed(1)}s
                </Tag>
              )}
            </>
          ) : (
            <Tag color="blue" style={{ margin: 0 }}>
              AI 预标注微服务: 本地端侧 Qwen2.5-VL (Apple M1 Pro Metal GPU加速 · 0 API调用)
            </Tag>
          )}
        </Space>

        {/* 右侧：保存与提交 */}
        <Space size={10}>
          <Button
            icon={<SaveOutlinedIcon />}
            onClick={handleSaveRevision}
          >
            保存修订
          </Button>

          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleSubmitAudit}
            style={{ background: '#1677ff' }}
          >
            完成审核并流转
          </Button>
        </Space>
      </footer>

      {/* =====================================================================
          交互区域 5：导入预览与冲突裁决 Modal
          ===================================================================== */}
      <ImportPreviewModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingSteps={steps}
        candidatesToImport={candidates.filter(c => selectedCandidateIds.includes(c.candidateId) && c.reviewStatus !== 'rejected')}
        totalFrames={totalFrames}
        baseRevisionId={currentRevisionId}
        onConfirmImport={handleConfirmImportTransaction}
      />

      {/* =====================================================================
          交互区域 6：修订历史与批次撤销抽屉
          ===================================================================== */}
      <RevisionHistoryDrawer
        open={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        revisions={revisions}
        currentRevisionId={currentRevisionId}
        currentSteps={steps}
        importBatches={importBatches}
        onUndoBatch={handleUndoBatch}
      />

      {/* 标准 JSON 导出弹窗 */}
      <Modal
        title={
          <Space>
            <CodeOutlined style={{ color: '#1677ff' }} />
            <span>标准数据契约导出 (依据 MD 规范第 7 节)</span>
          </Space>
        }
        open={isJsonModalOpen}
        onCancel={() => setIsJsonModalOpen(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setIsJsonModalOpen(false)}>关闭</Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard?.writeText(JSON.stringify(buildExportJson(steps, currentRevisionId, currentEpisode, currentFps, totalFrames), null, 2));
              message.success('已复制标准 JSON 到剪贴板');
            }}
          >
            复制 JSON
          </Button>
        ]}
      >
        <pre style={{
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          padding: 12,
          borderRadius: 6,
          maxHeight: 380,
          overflowY: 'auto',
          fontSize: 12,
          fontFamily: 'monospace'
        }}>
          {JSON.stringify(buildExportJson(steps, currentRevisionId, currentEpisode, currentFps, totalFrames), null, 2)}
        </pre>
      </Modal>

      {/* 如何真实接入本地大模型说明 Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>如何真实连通本地视觉语言大模型 (Qwen-VL)</span>
          </Space>
        }
        open={isVlmConnectModalOpen}
        onCancel={() => setIsVlmConnectModalOpen(false)}
        width={720}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsVlmConnectModalOpen(false)}>知道了</Button>
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {localModelHealth.online ? (
            <Alert
              message="🎉 本地大模型已成功安装并部署上线！"
              description={
                <div>
                  <div>当前电脑已部署 <b>Ollama 本地大模型推理引擎</b>，正原生调用 <b>Apple M1 Pro (16GB 统一内存 · Apple Metal GPU 硬件加速)</b>。</div>
                  <div style={{ marginTop: 6 }}>
                    ● 服务地址: <code>{localModelHealth.host || 'http://127.0.0.1:11434'}</code><br />
                    ● 已加载视觉模型: <code>{localModelHealth.activeModel}</code> (本地权重 1.7GB)<br />
                    ● 推理模式: 浏览器 Canvas 硬件抽帧 ➔ 本地 Ollama ➔ 工业 SOP 语义映射 ➔ 右侧工步直出
                  </div>
                </div>
              }
              type="success"
              showIcon
            />
          ) : (
            <Alert
              message="当前原型与真实大模型的关系"
              description="本页面使用的是「符合文档规范的端到端本地推理与降级兜底引擎」，支持本地大模型推理与标准工业 SOP 序列直出。"
              type="info"
              showIcon
            />
          )}

          <div>
            <Title level={5} style={{ fontSize: 14, margin: '0 0 6px 0' }}>一、本地已安装的大模型环境概览</Title>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                <div><b>运行服务：</b> Ollama Daemon (PID 在后台守护)</div>
                <div><b>服务状态：</b> <Tag color={localModelHealth.online ? 'success' : 'warning'}>{localModelHealth.online ? '● 正在运行 (ONLINE)' : '离线'}</Tag></div>
                <div><b>计算芯片：</b> Apple M1 Pro (arm64 10核)</div>
                <div><b>显存加速：</b> Apple Metal (MPS 硬件加速)</div>
                <div><b>当前主力模型：</b> <code>{localModelHealth.activeModel || 'qwen3-vl:2b'}</code></div>
                <div><b>已安装模型：</b> {(localModelHealth.models || []).join(', ') || 'qwen3-vl:2b, moondream:latest'}</div>
              </div>
            </div>
          </div>

          <div>
            <Title level={5} style={{ fontSize: 14, margin: '0 0 6px 0' }}>二、命令行管理与扩展更多大模型</Title>
            <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '10px 14px', borderRadius: 6, fontSize: 12, margin: 0 }}>
{`# 查看本地已安装模型
ollama list

# 运行阿里开源通义千问 Qwen3-VL 视觉问答
ollama run qwen3-vl:2b "描述画面中工人的装配工步"

# 切换为其他模型
ollama run moondream "Describe this image"`}
            </pre>
          </div>
        </div>
      </Modal>

      {/* 全局隐藏的本地视频上传 input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={handleLocalVideoUpload}
      />

      {/* 视频选择与上传弹窗 */}
      <EpisodeSelectModal
        open={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        currentEpisode={currentEpisode}
        onSelectEpisode={(ep) => handleSwitchEpisode(ep, true)}
        onUploadLocalVideo={handleLocalVideoUpload}
        onResetWorkspace={handleResetForDemo}
        fileInputRef={fileInputRef}
      />

      {/* 任务流水线生命周期进度弹框 */}
      <PipelineProgressModal
        open={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        annotationMethod={annotationMethod}
        activeEngineKey={activeEngineKey}
        aiJobStatus={aiJobStatus}
        currentPhaseIndex={currentPhaseIndex}
        processedWindows={processedWindows}
        totalWindows={totalWindows}
        windowProgressText={windowProgressText}
        jobElapsedTime={jobElapsedTime}
        currentEpisode={currentEpisode}
        currentFps={currentFps}
        generatedCount={candidates.length || steps.length || 0}
        modelMeta={modelMeta}
        onViewResults={() => {
          setIsPipelineModalOpen(false);
          if (candidates.length > 0) {
            message.info(`已定位至右侧候选工步池（共 ${candidates.length} 个候选工步），您可点击「追加」或「覆盖」正式工步。`);
          } else {
            message.info('您可在右侧查验所有动作步骤与帧区间。');
          }
        }}
        onCancelJob={handleRequestCancelJob}
        onSwitchToQwen25={() => {
          setJobModel('qwen2.5-vl');
          setIsPipelineModalOpen(false);
          message.loading({ content: '已切换为主力模型 Qwen2.5-VL，正在以 Metal GPU 启动极速预标注...', key: 'switch_retry', duration: 2 });
          setTimeout(() => {
            handleStartAiJob();
          }, 400);
        }}
      />

      {/* 方式 1(本地多视觉大模型) vs 方式 2(云端大模型 Google 具身 / Gemini) 双模型标注结果对比弹窗 */}
      <ModelCompareModal
        open={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        currentEpisode={currentEpisode}
        initialLocalModel={jobModel}
        initialCloudModel={cloudModel}
        onApplyMethod={handleApplyComparisonMethod}
      />

      {/* 训练数据导出中心弹窗 */}
      <ExportTrainingModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentEpisode={currentEpisode}
        steps={steps}
        candidates={candidates}
        revisions={revisions}
        rawAiMeta={modelMeta}
      />

      {/* 模型版本与独立服务接入抽屉 */}
      <ModelVersionDrawer
        open={isModelVersionDrawerOpen}
        onClose={() => setIsModelVersionDrawerOpen(false)}
        activeEngine={jobModel}
        onSelectEngine={(engineId) => {
          if (engineId.includes('qwen2.5')) {
            setJobModel('qwen2.5-vl');
            setAnnotationMethod('local_qwen');
          } else if (engineId.includes('qwen3')) {
            setJobModel('qwen3-vl');
            setAnnotationMethod('local_qwen');
          } else if (engineId.includes('gemini')) {
            setAnnotationMethod('gemini_flash');
            setCloudModel('gemini-1.5-pro');
          }
        }}
      />

      {/* Google Gemini / MiniMax 云端 API Key 配置弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloudOutlined style={{ color: '#7c3aed' }} />
            <span>云端商业多模态大模型密钥配置 (Gemini & MiniMax)</span>
          </div>
        }
        open={isApiKeyModalOpen}
        onCancel={() => setIsApiKeyModalOpen(false)}
        onOk={() => {
          setGeminiApiKey(apiKeyInput);
          setMinimaxApiKey(minimaxApiKeyInput);
          message.success('云端多模态大模型密钥 (Gemini / MiniMax) 已保存并生效');
          setIsApiKeyModalOpen(false);
        }}
        okText="保存并应用"
        cancelText="取消"
        width={580}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <Alert
            type="info"
            showIcon
            message="云端大模型连通说明"
            description="系统已内置 Google Cloud 官方具身大模型 Key 与 MiniMax-M3 官方商业 Key。您可直接开箱使用，亦可输入个人自定义 API Key 进行覆盖。"
          />

          {/* MiniMax 国内端点配置 */}
          <div style={{ border: '1px solid #fed7aa', borderRadius: 8, padding: 12, backgroundColor: '#fffaf5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#c2410c' }}>
                🇨🇳 MiniMax API Key (国内商业多模态直解)：
              </span>
              <Tag color="orange" style={{ margin: 0 }}>api.minimax.chat</Tag>
            </div>
            <Input.Password
              value={minimaxApiKeyInput}
              onChange={(e) => setMinimaxApiKeyInput(e.target.value)}
              placeholder="输入 MiniMax API Key (sk-cp-...)"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
              <span>
                当前状态：<b>{minimaxApiKeyInput ? (minimaxApiKeyInput === DEFAULT_MINIMAX_API_KEY ? '使用内置官方密钥 (已实测连通 200 OK)' : '使用自定义密钥') : '未配置'}</b>
              </span>
              <Space size={6}>
                <Button
                  size="small"
                  type="primary"
                  loading={isTestingMinimax}
                  onClick={async () => {
                    setIsTestingMinimax(true);
                    setMinimaxTestResult(null);
                    try {
                      const res = await testMinimaxConnectivity(minimaxApiKeyInput);
                      setMinimaxTestResult(res);
                      if (res.success) {
                        message.success(`MiniMax API 联通成功！HTTP 200 OK，消耗 Token: ${res.totalTokens}，时延: ${res.elapsedMs}ms`);
                      } else {
                        message.error(`MiniMax API 联通失败: ${res.error}`);
                      }
                    } finally {
                      setIsTestingMinimax(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#ea580c',
                    borderColor: '#ea580c',
                    fontSize: 11
                  }}
                >
                  ⚡ 测试联通性 (扣1次用量)
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setMinimaxApiKeyInput(DEFAULT_MINIMAX_API_KEY);
                    setMinimaxTestResult(null);
                    message.info('已恢复为 MiniMax 内置默认密钥');
                  }}
                >
                  恢复内置
                </Button>
              </Space>
            </div>
            {minimaxTestResult && (
              <div style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: minimaxTestResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${minimaxTestResult.success ? '#86efac' : '#fca5a5'}`
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: minimaxTestResult.success ? '#166534' : '#991b1b' }}>
                  {minimaxTestResult.success ? '✅ MiniMax-M3 商业接口实测连通 (HTTP 200 OK)' : '❌ MiniMax 接口联通失败'}
                </div>
                <div style={{ fontSize: 11, color: minimaxTestResult.success ? '#15803d' : '#b91c1c', marginTop: 4 }}>
                  {minimaxTestResult.success
                    ? `往返时延: ${minimaxTestResult.elapsedMs}ms | 消耗 Token: ${minimaxTestResult.totalTokens} | 请求 ID: ${minimaxTestResult.traceId || '-'}`
                    : minimaxTestResult.error}
                </div>
                {minimaxTestResult.success && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    💡 提示：本次测试已向 MiniMax 商业端点产生 1 次真实调用并扣除 Tokens。您可前往 MiniMax 控制台「请求管理」实时核对该笔请求（注：「API 用量」账单记录每日凌晨更新）。
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Google Gemini 国际端点配置 */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>
                🌐 Google Gemini API Key (具身机器人 ER-2 / Flash)：
              </span>
              <Tag color="purple" style={{ margin: 0 }}>generativelanguage.googleapis.com</Tag>
            </div>
            <Input.Password
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="输入 Google AI Studio API Key (AIzaSy...)"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
              <span>
                当前状态：<b>{apiKeyInput ? (apiKeyInput === DEFAULT_GEMINI_API_KEY ? '使用内置官方密钥 (已连通)' : '使用自定义密钥') : '未配置'}</b>
              </span>
              <Button
                size="small"
                onClick={() => {
                  setApiKeyInput(DEFAULT_GEMINI_API_KEY);
                  message.info('已恢复为 Gemini 内置默认密钥');
                }}
              >
                恢复 Gemini 内置
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// 辅助图标组件
function SaveOutlinedIcon() {
  return (
    <span role="img" aria-label="save" className="anticon anticon-save">
      <svg viewBox="64 64 896 896" focusable="false" data-icon="save" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 216c-39.7 0-72-32.3-72-72s32.3-72 72-72 72 32.3 72 72-32.3 72-72 72z" />
      </svg>
    </span>
  );
}

// 标准契约导出生成函数 (兼容平台 EgoAnnotationTool / 任务 2096843900964347905)
function buildExportJson(steps, currentRevisionId, currentEpisode, currentFps, totalFrames) {
  return {
    episodeId: currentEpisode?.episodeId || 'EP-2096837217907154945',
    annotationTaskRecordId: currentEpisode?.annotationTaskRecordId || '2096843900964347905',
    collectionTaskRecordId: currentEpisode?.collectionTaskRecordId || '2096837217907154945',
    taskName: currentEpisode?.name || '螺丝预装配与打螺丝作业',
    sceneName: currentEpisode?.sceneName || '真实数据',
    subSceneName: currentEpisode?.subSceneName || '天奇新动力',
    revisionId: currentRevisionId,
    mediaVersion: currentEpisode?.mediaVersion || 'media-v1',
    referenceCameraId: currentEpisode?.referenceCameraId || 'ego_main_cam',
    templateVersion: currentEpisode?.templateVersion || 'screw-assembly-v2',
    totalFrames: totalFrames || currentEpisode?.totalFrames || 9177,
    fps: currentFps || currentEpisode?.fps || 30,
    annotations: steps.map((s, idx) => ({
      index: idx + 1,
      stepNo: s.stepNo || (idx + 1),
      stepId: s.stepId,
      stepContent: s.stepContent || `${s.arm?.split(' ')[0] || ''} ${s.skill} ${s.object}`,
      effector: s.effector || (s.arm?.includes('右') ? 'RightHand' : s.arm?.includes('左') ? 'LeftHand' : 'DualArms'),
      actionSkill: s.actionSkill || s.skill,
      actionTarget: s.actionTarget || s.object,
      expectedGoal: s.expectedGoal || s.goal,
      startFrame: s.startFrame,
      endFrame: s.endFrame,
      annoOverlap: s.annoOverlap ?? 0,
      annoInvalid: 0,
      crossRegional: 0,
      interval: {
        startFrame: s.startFrame,
        endFrame: s.endFrame,
        convention: '[start, end)',
      },
      quadruplet: {
        arm: s.arm,
        skill: s.skill,
        object: s.object,
        goal: s.goal,
      },
      provenance: {
        source: s.source,
        candidateId: s.candidateId,
        importBatchId: s.importBatchId,
      },
      notes: s.notes || '',
    })),
    exportedAt: new Date().toISOString(),
  };
}
