'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  HolderOutlined, CheckSquareOutlined, BookOutlined,
  InfoCircleOutlined, FileTextOutlined, CodeOutlined,
  VideoCameraOutlined, FieldTimeOutlined, ThunderboltOutlined,
  CloseOutlined, SettingOutlined, UndoOutlined,
  AimOutlined, RobotOutlined, CheckCircleOutlined,
  SlidersOutlined, NodeIndexOutlined, EditOutlined, BulbOutlined,
  CloudOutlined, FolderOpenOutlined, SafetyCertificateOutlined,
  ExperimentOutlined, ExportOutlined
} from '@ant-design/icons';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Text, Title } = Typography;

// 结构化元数据字典配置
const ARM_OPTIONS = [
  { value: '双手 (Dual Arms)', label: '👐 双手 (Dual Arms)', color: '#7c3aed' },
  { value: '右手 (Right Arm)', label: '👉 右手 (Right Arm)', color: '#9333ea' },
  { value: '左手 (Left Arm)', label: '👈 左手 (Left Arm)', color: '#a855f7' },
  { value: '底盘 (Base)', label: '🚗 底盘 (Base)', color: '#6366f1' },
  { value: '头部相机 (Head Cam)', label: '📷 头部相机 (Head Cam)', color: '#4f46e5' },
];

const SKILL_OPTIONS = [
  { value: '抓取与定位', label: '🤏 抓取与定位 (Grasp & Orient)' },
  { value: '取物放置', label: '📥 取物放置 (Pick & Place)' },
  { value: '精密装配', label: '🧩 精密装配 (Precision Assemble)' },
  { value: '合拢封箱', label: '📦 合拢封箱 (Fold & Seal)' },
  { value: '避障接近', label: '🚀 避障接近 (Approach)' },
  { value: '旋转调整', label: '🔄 旋转调整 (Rotate / Align)' },
  { value: '松开释放', label: '🖐️ 松开释放 (Release / Drop)' },
  { value: '推拉操作', label: '🚪 推拉操作 (Push / Pull)' },
];

const OBJECT_OPTIONS = [
  { value: '瓦楞纸箱', label: '📦 瓦楞纸箱' },
  { value: '底部泡沫垫', label: '🧽 底部泡沫垫' },
  { value: '核心金属支架', label: '🔩 核心金属支架' },
  { value: '瓦楞纸箱盖', label: '📑 瓦楞纸箱盖' },
  { value: '螺栓紧固件', label: '🔧 螺栓紧固件' },
  { value: '物料周转托盘', label: '🍱 物料周转托盘' },
  { value: '电源线缆', label: '🔌 电源线缆' },
  { value: '仪器控制面板', label: '🎛️ 仪器控制面板' },
];

const GOAL_OPTIONS = [
  { value: '开箱定位完成 (Visual Match)', label: '🎯 开箱定位完成 (Visual Match)' },
  { value: '平稳入箱 (Safe Placement)', label: '🎯 平稳入箱 (Safe Placement)' },
  { value: '卡槽对准牢固 (Torque Align)', label: '🎯 卡槽对准牢固 (Torque Align)' },
  { value: '完全闭合锁死 (Closed Sealed)', label: '🎯 完全闭合锁死 (Closed Sealed)' },
  { value: '接近到位 (<2cm)', label: '🎯 接近到位 (<2cm)' },
  { value: '旋转90度锁定', label: '🎯 旋转90度锁定' },
  { value: '安全释手 (Zero Torque)', label: '🎯 安全释手 (Zero Torque)' },
];

export default function AnnotationAuditWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const instanceId = searchParams?.get('id') || '19884';
  const episodeId = searchParams?.get('episodeId') || '744108';
  const annoType = searchParams?.get('type') || '范围标注';
  const workMode = searchParams?.get('mode') || 'annotate';

  const effectiveInstanceId = searchParams?.get('instanceId') || instanceId;

  // View mode: 'single' (Ego camera matching screenshot) or 'grid' (4 cameras)
  const [viewMode, setViewMode] = useState('single');

  // Video playback & Timecode state (标准 1331 帧 / ~44.3秒)
  const totalFrames = 1331;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(45);
  const [redLineFrame, setRedLineFrame] = useState(45);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTimerRef = useRef(null);
  const timelineRef = useRef(null);

  // =========================================================================
  // STATE: 严格二选一互斥步骤展示模式 ('structured' 结构化步骤 | 'natural' 自然语言)
  // =========================================================================
  const [stepDisplayMode, setStepDisplayMode] = useState('natural');

  // =========================================================================
  // STATE: 动作步骤数据
  // =========================================================================
  const [shortSteps, setShortSteps] = useState([
    {
      id: 1,
      text: '拾取并归集台面杂物',
      arm: '右手 (Right Arm)',
      skill: '取物放置',
      object: '杂物',
      goal: '归集到位',
      startFrame: 0,
      endFrame: 276,
      color: '#1677ff',
      graspType: '平行双指夹持',
      speedProfile: '平稳匀速 (0.3m/s)',
      confidence: '99.2%',
      torqueLimit: '15.0 N·m',
      vlaToken: 'ACTION_PICK_COLLECT_DEBRIS'
    },
    {
      id: 2,
      text: '将垃圾投入指定垃圾桶',
      arm: '右手 (Right Arm)',
      skill: '松开释放',
      object: '垃圾桶',
      goal: '精准投入',
      startFrame: 276,
      endFrame: 551,
      color: '#52c41a',
      graspType: '真空吸盘吸附',
      speedProfile: '快速接近 (0.6m/s)',
      confidence: '98.7%',
      torqueLimit: '5.2 N·m',
      vlaToken: 'ACTION_DISPOSE_TRASH'
    },
    {
      id: 3,
      text: '擦拭台面并复位清洁工具',
      arm: '双手 (Dual Arms)',
      skill: '推拉操作',
      object: '清洁抹布',
      goal: '台面洁净',
      startFrame: 552,
      endFrame: 827,
      color: '#fa8c16',
      graspType: '五指灵巧手抓握',
      speedProfile: '标准操作 (0.4m/s)',
      confidence: '99.5%',
      torqueLimit: '18.5 N·m',
      vlaToken: 'ACTION_WIPE_RESET_TOOL_1'
    },
    {
      id: 4,
      text: '擦拭台面并复位清洁工具',
      arm: '双手 (Dual Arms)',
      skill: '推拉操作',
      object: '清洁抹布',
      goal: '完全归位',
      startFrame: 828,
      endFrame: 1102,
      color: '#722ed1',
      graspType: '双手压合',
      speedProfile: '标准操作 (0.4m/s)',
      confidence: '99.0%',
      torqueLimit: '18.0 N·m',
      vlaToken: 'ACTION_WIPE_RESET_TOOL_2'
    },
  ]);

  const [shortSelectedId, setShortSelectedId] = useState(1);
  const [draggedStepIdx, setDraggedStepIdx] = useState(null);
  const [dragOverStepIdx, setDragOverStepIdx] = useState(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState('1');

  // 结构化详细参数 Inspector 弹窗
  const [detailModalStep, setDetailModalStep] = useState(null);

  // Live Step Recording State
  const [isRecordingStepId, setIsRecordingStepId] = useState(null);
  const isRecordingStepIdRef = useRef(null);

  // Red Line Playhead State & Mouse Dragging Handlers
  const isDraggingRedLineRef = useRef(false);
  const [isDraggingRedLine, setIsDraggingRedLine] = useState(false);

  // PRD Drawer State
  const [isPrdOpen, setIsPrdOpen] = useState(false);
  const [prdActiveTab, setPrdActiveTab] = useState('structured_steps');

  // =========================================================================
  // STATE: AI 自动标注与人机协同交互
  // =========================================================================
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInferenceStep, setAiInferenceStep] = useState('config'); // 'config' | 'inferring' | 'review'
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressStage, setAiProgressStage] = useState('');
  const [aiModel, setAiModel] = useState('local_qwen'); // 'local_qwen' | 'minimax_m3' | 'gemini_er2'
  const [aiMode, setAiMode] = useState('full_segmentation'); // 'full_segmentation' | 'window_sliding' | 'template_align'
  const [aiFramesPerWindow, setAiFramesPerWindow] = useState(6);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(85);
  const [aiStrategy, setAiStrategy] = useState('append'); // 'append' | 'replace' | 'conflict_detect'
  const [aiCandidateSteps, setAiCandidateSteps] = useState([]);
  const [aiSelectedCandidateIds, setAiSelectedCandidateIds] = useState([]);
  const [aiHistorySnapshot, setAiHistorySnapshot] = useState(null);
  const [isAiScanningActive, setIsAiScanningActive] = useState(false);
  const [lastAiCount, setLastAiCount] = useState(0);

  const handleUpdateStepField = (stepId, field, value) => {
    setShortSteps(curr => curr.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, [field]: value };
    }));
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRedLineRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const frame = Math.round(pct * totalFrames);
        setRedLineFrame(frame);
        setCurrentFrame(frame);

        const matched = shortSteps.find(s => frame >= s.startFrame && frame <= s.endFrame);
        if (matched) {
          setShortSelectedId(matched.id);
        }
      }
    };
    const handleMouseUp = () => {
      if (isDraggingRedLineRef.current) {
        isDraggingRedLineRef.current = false;
        setIsDraggingRedLine(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [totalFrames, shortSteps]);

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= totalFrames) {
            setIsPlaying(false);
            setIsRecordingStepId(null);
            isRecordingStepIdRef.current = null;
            return totalFrames;
          }
          const stepSize = Math.max(1, Math.round(1 * playbackSpeed));
          const next = Math.min(totalFrames, prev + stepSize);
          setRedLineFrame(next);

          if (isRecordingStepIdRef.current !== null) {
            setShortSteps(currSteps => currSteps.map(s =>
              s.id === isRecordingStepIdRef.current ? { ...s, endFrame: next } : s
            ));
          }

          return next;
        });
      }, 33);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalFrames]);

  const handleToggleBatchSelect = (stepId) => {
    setSelectedBatchIds(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  const handleSelectAllBatch = () => {
    if (selectedBatchIds.length === shortSteps.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(shortSteps.map(s => s.id));
    }
  };

  const handleBatchCopySelected = () => {
    if (selectedBatchIds.length === 0) {
      message.warning('请先勾选需要批量复制的步骤');
      return;
    }
    const stepsToCopy = shortSteps.filter(s => selectedBatchIds.includes(s.id));
    const totalBatchDur = stepsToCopy.reduce((sum, s) => sum + Math.max(1, s.endFrame - s.startFrame), 0);
    const currentTotalSpan = shortSteps.reduce((sum, s) => sum + Math.max(1, s.endFrame - s.startFrame), 0);

    if (currentTotalSpan + totalBatchDur > totalFrames) {
      message.warning(`⚠️ 视频剩余帧数不足（当前已占用 ${currentTotalSpan} 帧 / 总上限 ${totalFrames} 帧，批量复制需要 ${totalBatchDur} 帧），帧数不够不可以复制！`);
      return;
    }

    const lastEndFrame = shortSteps.length > 0 ? shortSteps[shortSteps.length - 1].endFrame : currentFrame;
    let runningStart = lastEndFrame + 1;

    const clonedSteps = stepsToCopy.map((step, idx) => {
      const dur = Math.max(1, step.endFrame - step.startFrame);
      const start = runningStart;
      const end = start + dur;
      runningStart = end + 1;
      return {
        ...step,
        id: shortSteps.length + idx + 1,
        text: `${step.text} (批量复制)`,
        startFrame: start,
        endFrame: end,
      };
    });

    const updated = [...shortSteps, ...clonedSteps];
    const reindexed = updated.map((s, idx) => ({ ...s, id: idx + 1 }));
    setShortSteps(reindexed);
    setSelectedBatchIds([]);
    setShortSelectedId(shortSteps.length + 1);
    message.success(`✨ 批量复制成功：已追加 ${stepsToCopy.length} 个步骤！`);
  };

  const handleBatchDeleteSelected = () => {
    if (selectedBatchIds.length === 0) return;
    const remaining = shortSteps.filter(s => !selectedBatchIds.includes(s.id));
    const reindexed = remaining.map((s, idx) => ({ ...s, id: idx + 1 }));
    const synced = realignStepTimeframes(reindexed, reindexed[0]?.startFrame || 0);
    setShortSteps(synced);
    setSelectedBatchIds([]);
    message.success(`🗑️ 批量删除成功：已移除已选步骤！`);
  };

  const handleCopySingleStep = (step) => {
    const dur = Math.max(1, step.endFrame - step.startFrame);
    const currentTotalSpan = shortSteps.reduce((sum, s) => sum + Math.max(1, s.endFrame - s.startFrame), 0);

    if (currentTotalSpan + dur > totalFrames) {
      message.warning(`⚠️ 视频剩余帧数不足（当前已占用 ${currentTotalSpan} 帧 / 总上限 ${totalFrames} 帧，复制需要 ${dur} 帧），帧数不够不可以复制！`);
      return;
    }

    const targetIdx = shortSteps.findIndex(s => s.id === step.id);
    const newStart = step.endFrame + 1;
    const newEnd = newStart + dur;
    const newStep = {
      ...step,
      id: Date.now(),
      text: `${step.text} (复制)`,
      startFrame: newStart,
      endFrame: newEnd,
    };
    const updated = [...shortSteps];
    updated.splice(targetIdx + 1, 0, newStep);
    const reindexed = updated.map((s, idx) => ({ ...s, id: idx + 1 }));
    const synced = realignStepTimeframes(reindexed, shortSteps[0]?.startFrame || 0);
    setShortSteps(synced);
    setShortSelectedId(targetIdx + 2);
    message.success(`📄 已就地复制单步，开始帧为 [${newStart}]！`);

    setTimeout(() => {
      const el = document.getElementById(`step-card-${targetIdx + 2}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const realignStepTimeframes = (stepsList, baseStart = 0) => {
    let current = baseStart;
    return stepsList.map((step, idx) => {
      const dur = Math.max(1, step.endFrame - step.startFrame);
      const start = current;
      const end = start + dur;
      current = end + 1;
      return {
        ...step,
        id: idx + 1,
        startFrame: start,
        endFrame: end
      };
    });
  };

  const handleSetStartFrame = () => {
    if (!shortSelectedId) {
      message.warning('请先在右侧点击选中一个动作步骤');
      return;
    }
    const currentStep = shortSteps.find(s => s.id === shortSelectedId);
    if (!currentStep) return;

    isRecordingStepIdRef.current = shortSelectedId;
    setIsRecordingStepId(shortSelectedId);

    const updated = shortSteps.map(s =>
      s.id === shortSelectedId ? { ...s, startFrame: currentFrame, endFrame: Math.max(currentFrame + 1, currentFrame + 5) } : s
    );
    setShortSteps(updated);

    if (currentFrame >= totalFrames) {
      setCurrentFrame(0);
      setRedLineFrame(0);
    }
    setIsPlaying(true);
    const stepLabel = stepDisplayMode === 'structured' ? `${currentStep.arm.split(' ')[0]} - ${currentStep.skill}` : currentStep.text;
    message.success(`🔵 步骤 #${shortSelectedId}「${stepLabel}」已在 [${currentFrame} 帧] 开始实时录制！时间轴色块正在随播放动态延展...`);
  };

  const handleSetEndFrame = () => {
    if (!shortSelectedId) {
      message.warning('请先在右侧点击选中一个动作步骤');
      return;
    }
    const currentStep = shortSteps.find(s => s.id === shortSelectedId);
    if (!currentStep) return;

    if (currentFrame <= currentStep.startFrame) {
      message.warning(`⚠️ 结束帧 (${currentFrame}f) 必须大于起始帧 (${currentStep.startFrame}f)，请先播放或快进游标！`);
      return;
    }

    isRecordingStepIdRef.current = null;
    setIsRecordingStepId(null);
    setIsPlaying(false);

    const updated = shortSteps.map(s =>
      s.id === shortSelectedId ? { ...s, endFrame: currentFrame } : s
    );
    setShortSteps(updated);
    const stepLabel = stepDisplayMode === 'structured' ? `${currentStep.arm.split(' ')[0]} - ${currentStep.skill}` : currentStep.text;
    message.success(`✅ 步骤 #${shortSelectedId}「${stepLabel}」录制完成！区间已锁定为 [${currentStep.startFrame} - ${currentFrame} 帧]（总计: ${currentFrame - currentStep.startFrame} 帧）`);
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentFrame >= totalFrames) {
      setCurrentFrame(0);
      setRedLineFrame(0);
    }
    setIsPlaying(p => !p);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.match(/INPUT|TEXTAREA|SELECT/)) return;

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleSetStartFrame();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSetEndFrame();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        message.success(`🎉 恭喜！数据序号 ${episodeId} 标注完成并已提交！`);
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrame, shortSelectedId, shortSteps, isPlaying, episodeId, stepDisplayMode]);

  const handleDragStart = (e, idx) => {
    setDraggedStepIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStepIdx !== idx) {
      setDragOverStepIdx(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverStepIdx(null);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    setDragOverStepIdx(null);
    if (draggedStepIdx === null || draggedStepIdx === targetIdx) return;

    const updated = [...shortSteps];
    const [draggedItem] = updated.splice(draggedStepIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    const synced = realignStepTimeframes(updated, shortSteps[0]?.startFrame || 0);
    setShortSteps(synced);
    setShortSelectedId(targetIdx + 1);
    setDraggedStepIdx(null);
    message.success(`🎯 拖拽调换成功：已同步移至第 ${targetIdx + 1} 步骤！`);
  };

  const formatTime = (frame) => {
    const sec = Math.floor(frame / 30);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const ms = Math.floor((frame % 30) * 33.33);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const renderGridContent = (camKey) => {
    const camNames = {
      camera_head_left_color: { title: '主视角 RGB (Top Head)', color: '#0284c7', bg: '#f0f9ff' },
      camera_head_right_color: { title: '辅助右视 (Head Right)', color: '#7c3aed', bg: '#f5f3ff' },
      camera_hand_left_color: { title: '左机械臂腕部 (Wrist L)', color: '#059669', bg: '#ecfdf5' },
      camera_hand_right_color: { title: '右机械臂腕部 (Wrist R)', color: '#d97706', bg: '#fffbeb' }
    };
    const info = camNames[camKey] || { title: camKey, color: '#0284c7', bg: '#f8fafc' };

    const motionX = 30 + ((currentFrame * 7) % 40);
    const motionY = 35 + ((currentFrame * 5) % 30);

    return (
      <div style={{ flex: 1, background: info.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
        {isPlaying && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            pointerEvents: 'none'
          }} />
        )}

        {isPlaying && (
          <div style={{
            position: 'absolute',
            left: `${motionX}%`,
            top: `${motionY}%`,
            width: 80,
            height: 60,
            border: `2px dashed ${info.color}`,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.4)',
            boxShadow: `0 0 10px ${info.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: info.color,
            fontWeight: 700,
            pointerEvents: 'none'
          }}>
            🎯 机械爪跟踪
          </div>
        )}

        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isPlaying ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.85)', padding: '4px 10px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>播放中 {formatTime(currentFrame)}</span>
            </div>
          ) : (
            <PlayCircleOutlined style={{ fontSize: 32, opacity: 0.45, color: info.color, marginBottom: 4 }} />
          )}
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            {info.title} · <strong style={{ color: '#0f172a' }}>{currentFrame} 帧</strong>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 3 }}>
          {isPlaying ? (
            <Tag color="red" style={{ margin: 0, fontSize: 10, fontWeight: 700, lineHeight: '18px' }}>● REC 30FPS</Tag>
          ) : (
            <Tag color="default" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>已暂停</Tag>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // AI 自动标注处理函数 (推理、导入、撤销、单步智能吸附)
  // =========================================================================
  const handleStartAiInference = () => {
    setAiInferenceStep('inferring');
    setAiProgress(10);
    setAiProgressStage(`阶段 1/6: Canvas 硬件截帧与视频抽帧采样 (提取 ${aiFramesPerWindow || 6} 帧关键画面切片)...`);
    setIsAiScanningActive(true);

    setTimeout(() => {
      setAiProgress(32);
      setAiProgressStage('阶段 2/6: 多模态 VLM 时序特征编码 (提取双手骨骼、工具与工件接触位姿)...');
    }, 600);

    setTimeout(() => {
      setAiProgress(58);
      setAiProgressStage('阶段 3/6: 动作物理接触与边界语义切分 (毫秒级定位起止帧，生成紧密贴合工步)...');
    }, 1200);

    setTimeout(() => {
      setAiProgress(80);
      setAiProgressStage('阶段 4/6: 工业动作语义四元组推导 (根据标准数据字典抽取 执行末端/技能/目标/期望)...');
    }, 1800);

    setTimeout(() => {
      setAiProgress(94);
      setAiProgressStage('阶段 5/6: 置信度评分与时序拓扑合规校验 (防重叠、无空隙、时序连贯性校验)...');
    }, 2300);

    setTimeout(() => {
      setAiProgress(100);
      const modelNameText = aiModel === 'local_qwen' ? '本地 Qwen2.5-VL (Apple M1 Pro GPU)' : (aiModel === 'minimax_m3' ? 'MiniMax-M3 商业大模型' : 'Google 具身 ER-2 (TPU v5e)');
      setAiProgressStage(`阶段 6/6: 🎉 ${modelNameText} 预标注完成！生成 5 个高置信度动作候选区间`);
      
      const candidates = [
        {
          id: 101,
          text: '右手拿起电钻并移至电池包工位',
          arm: '右手 (Right Arm)',
          skill: '取物放置',
          object: '电动螺丝刀',
          goal: '工具转移到位',
          startFrame: 0,
          endFrame: 276,
          color: '#2563eb',
          graspType: '平行双指夹持',
          speedProfile: '平稳匀速 (0.3m/s)',
          confidence: '99.4%',
          torqueLimit: '14.5 N·m',
          vlaToken: 'ACTION_PICK_TOOL_SCREWDRIVER',
          isAiGenerated: true,
        },
        {
          id: 102,
          text: '右手用电钻拧紧第1颗螺栓并定扭',
          arm: '右手 (Right Arm)',
          skill: '精密装配',
          object: '固定螺栓 #1',
          goal: '螺栓定扭紧固完成',
          startFrame: 277,
          endFrame: 551,
          color: '#16a34a',
          graspType: '平行双指夹持',
          speedProfile: '快速接近 (0.6m/s)',
          confidence: '99.1%',
          torqueLimit: '12.0 N·m',
          vlaToken: 'ACTION_FASTEN_SCREW_1',
          isAiGenerated: true,
        },
        {
          id: 103,
          text: '左手辅助压紧电池包基座边缘',
          arm: '左手 (Left Arm)',
          skill: '抓取与定位',
          object: '电池包基座',
          goal: '基座定位稳定',
          startFrame: 552,
          endFrame: 827,
          color: '#7c3aed',
          graspType: '五指灵巧手抓握',
          speedProfile: '高精度慢速 (0.1m/s)',
          confidence: '98.7%',
          torqueLimit: '18.2 N·m',
          vlaToken: 'ACTION_HOLD_BATTERY_PACK',
          isAiGenerated: true,
        },
        {
          id: 104,
          text: '右手用电钻拧紧第2颗固定螺栓',
          arm: '右手 (Right Arm)',
          skill: '精密装配',
          object: '固定螺栓 #2',
          goal: '卡槽对准牢固 (Torque Align)',
          startFrame: 828,
          endFrame: 1102,
          color: '#ea580c',
          graspType: '包络力矩抓取',
          speedProfile: '标准操作 (0.4m/s)',
          confidence: '98.3%',
          torqueLimit: '22.0 N·m',
          vlaToken: 'ACTION_FASTEN_SCREW_2',
          isAiGenerated: true,
        },
        {
          id: 105,
          text: '左手拾取正极绝缘保护帽扣在极柱',
          arm: '左手 (Left Arm)',
          skill: '合拢封箱',
          object: '绝缘保护帽',
          goal: '完全闭合锁死 (Closed Sealed)',
          startFrame: 1103,
          endFrame: 1330,
          color: '#0284c7',
          graspType: '平行双指夹持',
          speedProfile: '平稳匀速 (0.3m/s)',
          confidence: '97.8%',
          torqueLimit: '2.0 N·m',
          vlaToken: 'ACTION_CAP_POSITIVE_TERMINAL',
          isAiGenerated: true,
        },
      ];

      setAiCandidateSteps(candidates);
      setAiSelectedCandidateIds(candidates.map(c => c.id));
      setIsAiScanningActive(false);
      setAiInferenceStep('review');
    }, 2800);
  };

  const handleApplyAiSteps = () => {
    const selected = aiCandidateSteps.filter(s => aiSelectedCandidateIds.includes(s.id));
    if (selected.length === 0) {
      message.warning('请至少勾选一个 AI 识别步骤');
      return;
    }

    setAiHistorySnapshot([...shortSteps]);

    let merged;
    if (aiStrategy === 'replace') {
      merged = selected.map((s, idx) => ({ ...s, id: idx + 1 }));
    } else {
      const maxExistingEnd = shortSteps.length > 0 ? shortSteps[shortSteps.length - 1].endFrame : 0;
      let curStart = Math.min(totalFrames - 1, maxExistingEnd + 1);
      const adapted = selected.map((s, idx) => {
        const dur = Math.max(1, s.endFrame - s.startFrame);
        const st = curStart;
        const et = Math.min(totalFrames, st + dur);
        curStart = et + 1;
        return {
          ...s,
          id: shortSteps.length + idx + 1,
          startFrame: st,
          endFrame: et,
        };
      });
      merged = [...shortSteps, ...adapted].map((s, idx) => ({ ...s, id: idx + 1 }));
    }

    setShortSteps(merged);
    setLastAiCount(selected.length);
    setIsAiModalOpen(false);
    setAiInferenceStep('config');
    setShortSelectedId(merged[0]?.id || 1);
    message.success(`✨ AI 自动标注成功！已导入 ${selected.length} 个动作步骤，原有标注能力不受影响，可随时微调或撤销`);
  };

  const handleUndoAiAnnotation = () => {
    if (aiHistorySnapshot) {
      setShortSteps(aiHistorySnapshot);
      setAiHistorySnapshot(null);
      setLastAiCount(0);
      message.info('↩️ 已撤销本次 AI 自动标注，恢复至原有标注数据');
    }
  };

  const handleAiSnapStep = (stepId) => {
    const step = shortSteps.find(s => s.id === stepId);
    if (!step) {
      message.warning('请先选择一个动作步骤');
      return;
    }
    const newStart = Math.max(0, step.startFrame - 4);
    const newEnd = Math.min(totalFrames, step.endFrame + 6);
    setShortSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      startFrame: newStart,
      endFrame: newEnd,
      confidence: '99.6%',
      isAiAdjusted: true
    } : s));
    message.success(`⚡ AI 边界吸附已就绪：步骤 #${step.id} 匹配到接触力临界点，帧区间已优化为 [${newStart} - ${newEnd} 帧]`);
  };

  const currentSelectedStep = shortSteps.find(s => s.id === shortSelectedId) || shortSteps[0] || { startFrame: 0, endFrame: 0, id: 1 };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

      {/* TOP HEADER */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <Space size={10} align="center">
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            3333
          </span>
          <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>Ego 视角</Tag>
          <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>未标注</Tag>
          <Divider orientation="vertical" style={{ height: 16, borderColor: '#cbd5e1' }} />
          <Space size={14} style={{ fontSize: 12, color: '#64748b' }}>
            <span>任务ID: <strong style={{ color: '#0f172a' }}>2090698966142951426</strong></span>
            <span>实例ID: <strong style={{ color: '#0f172a' }}>4165895</strong></span>
            <span>场景: <strong style={{ color: '#0f172a' }}>仿真数据</strong></span>
            <span>数据帧数: <strong style={{ color: '#0f172a' }}>{totalFrames}</strong></span>
            <span>设备类型: <strong style={{ color: '#0f172a' }}>银河v2.2</strong></span>
          </Space>
        </Space>

        <Space size={8}>
          <Button
            icon={<RobotOutlined style={{ color: '#7c3aed' }} />}
            onClick={() => {
              setAiInferenceStep('config');
              setIsAiModalOpen(true);
            }}
            size="small"
            style={{
              fontWeight: 700,
              borderColor: '#c4b5fd',
              color: '#6d28d9',
              background: '#f5f3ff',
              boxShadow: '0 1px 3px rgba(124, 58, 237, 0.12)'
            }}
          >
            AI 智能预标注
          </Button>

          <Button
            icon={<ExportOutlined style={{ color: '#0284c7' }} />}
            onClick={() => window.open(STATIC_ROUTES.aiWorkbench || '/annotation/ai-workbench/', '_blank')}
            size="small"
            style={{
              fontWeight: 600,
              borderColor: '#bae6fd',
              color: '#0369a1',
              background: '#f0f9ff',
            }}
            title="新窗口打开 AI 多模态标注工作台 (上传本地视频 / 多模型深度对比 / 训练集导出)"
          >
            AI 独立工作台 ↗
          </Button>

          <Radio.Group
            size="small"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="single">单视角 (Ego)</Radio.Button>
            <Radio.Button value="grid">四相机矩阵</Radio.Button>
          </Radio.Group>

          <Button
            icon={<BookOutlined style={{ color: '#2563eb' }} />}
            onClick={() => { setPrdActiveTab('structured_steps'); setIsPrdOpen(true); }}
            size="small"
            style={{
              fontWeight: 600,
              borderColor: '#3b82f6',
              color: '#1d4ed8',
              background: '#eff6ff',
            }}
          >
            PRD
          </Button>
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 14, color: '#64748b' }} />}
            onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditDetail, { id: effectiveInstanceId }))}
            title="关闭返回"
          />
        </Space>
      </div>

      {/* MAIN WORKSPACE: 左右两栏并排 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '10px 14px', gap: 12 }}>

        {/* LEFT COLUMN: VIDEO VIEWPORT + ATTACHED TIMELINE & PLAYBAR (宽度严格与视频100%对齐) */}
        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          
          {/* Top: Video Display Canvas Area */}
          <div style={{ flex: 1, background: '#000', borderRadius: 8, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {viewMode === 'single' ? (
              <div style={{ flex: 1, background: '#090d16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
                <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 10 }}>
                  <Tag color="default" style={{ margin: 0, background: '#1e293b', color: '#f8fafc', borderColor: '#334155', fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                    ego_cam1
                  </Tag>
                </div>

                {/* AI 推理扫描动效 HUD */}
                {isAiScanningActive && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: '2px dashed #8b5cf6',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(6px)',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                    }}>
                      <Space>
                        <RobotOutlined style={{ fontSize: 18, color: '#c084fc' }} spin />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Embodied-VLA-X 时序动作多模态解析中</span>
                      </Space>
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>{aiProgressStage}</span>
                      <Progress percent={aiProgress} size="small" strokeColor={{ '0%': '#6366f1', '100%': '#d946ef' }} style={{ width: 220 }} />
                    </div>
                  </div>
                )}

                {/* Simulated Canvas Background & Object Motion box */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(2, 6, 23, 0.95) 100%)',
                  pointerEvents: 'none'
                }} />
                {isPlaying && (
                  <div style={{
                    position: 'absolute',
                    left: `${35 + ((currentFrame * 5) % 30)}%`,
                    top: `${30 + ((currentFrame * 3) % 25)}%`,
                    width: 120,
                    height: 90,
                    border: '2px dashed #22c55e',
                    borderRadius: 8,
                    background: 'rgba(34, 197, 94, 0.12)',
                    boxShadow: '0 0 16px rgba(34, 197, 94, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#4ade80',
                    fontWeight: 700,
                    pointerEvents: 'none'
                  }}>
                    <span>🎯 机械臂末端夹爪</span>
                    <span style={{ fontSize: 9, opacity: 0.8 }}>Tracker Active</span>
                  </div>
                )}
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={handleTogglePlay}>
                  <PlayCircleOutlined style={{ fontSize: 52, opacity: isPlaying ? 0.2 : 0.6, color: '#3b82f6', marginBottom: 6, transition: 'all 0.2s' }} />
                  {!isPlaying && (
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>点击播放 / 空格键切换</span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, padding: 6, background: '#0f172a' }}>
                <div style={{ background: '#fff', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 6px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#0284c7' }}>● camera_head_left_color</span>
                    <Tag color="blue" style={{ fontSize: 8, margin: 0 }}>CAM 01</Tag>
                  </div>
                  {renderGridContent('camera_head_left_color')}
                </div>
                <div style={{ background: '#fff', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 6px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed' }}>● camera_head_right_color</span>
                    <Tag color="purple" style={{ fontSize: 8, margin: 0 }}>CAM 02</Tag>
                  </div>
                  {renderGridContent('camera_head_right_color')}
                </div>
                <div style={{ background: '#fff', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 6px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>● camera_hand_left_color</span>
                    <Tag color="green" style={{ fontSize: 8, margin: 0 }}>CAM 03</Tag>
                  </div>
                  {renderGridContent('camera_hand_left_color')}
                </div>
                <div style={{ background: '#fff', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 6px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#d97706' }}>● camera_hand_right_color</span>
                    <Tag color="gold" style={{ fontSize: 8, margin: 0 }}>CAM 04</Tag>
                  </div>
                  {renderGridContent('camera_hand_right_color')}
                </div>
              </div>
            )}
          </div>

          {/* Bottom of Left Column: ATTACHED TIMELINE & PLAYBACK CONTROLLER (宽度严格与视频容器对齐) */}
          <div style={{
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>

            {/* Line 1: Status & Step Info Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                <span>视频时长: <strong style={{ color: '#0f172a' }}>00:44</strong></span>
                <Divider orientation="vertical" style={{ margin: 0, height: 12 }} />
                <span>帧 <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{currentFrame}</strong> / {totalFrames}</span>
                <Divider orientation="vertical" style={{ margin: 0, height: 12 }} />
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                  步骤 {currentSelectedStep.id}: {currentSelectedStep.startFrame} - {currentSelectedStep.endFrame} 帧 (共 {currentSelectedStep.endFrame - currentSelectedStep.startFrame} 帧)
                </span>
              </div>
              <Tag color="processing" style={{ margin: 0, fontSize: 11, fontFamily: 'monospace' }}>
                ⏱️ {formatTime(currentFrame)}
              </Tag>
            </div>

            {/* Live Recording HUD Banner */}
            {isRecordingStepId !== null && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
                border: '1.5px solid #3b82f6',
                borderRadius: 6,
                padding: '3px 10px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af' }}>
                    🔵 步骤 #{isRecordingStepId} 正在录制中
                  </span>
                  <Tag color="processing" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                    起始: {shortSteps.find(s => s.id === isRecordingStepId)?.startFrame}f ➔ 实时: {currentFrame}f
                  </Tag>
                </div>
                <Button
                  size="small"
                  type="primary"
                  style={{ height: 20, fontSize: 10, fontWeight: 700, padding: '0 8px', borderRadius: 4, background: '#2563eb' }}
                  onClick={handleSetEndFrame}
                >
                  按 [R] 结束
                </Button>
              </div>
            )}

            {/* Line 2: Multi-Color Action Steps Temporal Track (严格贴合视频宽度) */}
            <div
              ref={timelineRef}
              onMouseDown={(e) => {
                if (timelineRef.current) {
                  isDraggingRedLineRef.current = true;
                  setIsDraggingRedLine(true);
                  const rect = timelineRef.current.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const target = Math.round(pct * totalFrames);
                  setRedLineFrame(target);
                  setCurrentFrame(target);
                  const matched = shortSteps.find(s => target >= s.startFrame && target <= s.endFrame);
                  if (matched) setShortSelectedId(matched.id);
                }
              }}
              style={{
                position: 'relative',
                height: 28,
                background: '#e2e8f0',
                borderRadius: 4,
                cursor: isDraggingRedLine ? 'grabbing' : 'pointer',
                overflow: 'visible',
                userSelect: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              {shortSteps.map((step) => {
                const isSelected = shortSelectedId === step.id;
                const isRecording = isRecordingStepId === step.id;
                const leftPct = (step.startFrame / totalFrames) * 100;
                const widthPct = Math.max(0.3, ((step.endFrame - step.startFrame) / totalFrames) * 100);

                const displayLabel = stepDisplayMode === 'structured'
                  ? `${step.arm.split(' ')[0]}·${step.skill}`
                  : step.text;

                return (
                  <div
                    key={step.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShortSelectedId(step.id);
                      setRedLineFrame(step.startFrame);
                      setCurrentFrame(step.startFrame);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      height: '100%',
                      top: 0,
                      background: isRecording
                        ? `repeating-linear-gradient(-45deg, ${step.color}, ${step.color} 8px, #2563eb 8px, #2563eb 16px)`
                        : step.color || '#2563eb',
                      opacity: isSelected || isRecording ? 1 : 0.85,
                      borderRadius: 3,
                      border: isRecording ? '2.5px solid #2563eb' : isSelected ? '2.5px solid #0f172a' : '1px solid rgba(255,255,255,0.4)',
                      zIndex: isRecording ? 20 : isSelected ? 15 : 2,
                      boxShadow: isRecording
                        ? '0 0 12px rgba(37, 99, 235, 0.9), inset 0 0 6px rgba(255,255,255,0.6)'
                        : isSelected
                        ? '0 0 10px rgba(0,0,0,0.4), inset 0 0 4px rgba(255,255,255,0.4)'
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '0 4px',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      transform: isRecording || isSelected ? 'scaleY(1.08)' : 'scaleY(1)',
                      transition: isRecording ? 'none' : 'all 0.15s ease'
                    }}
                    title={`${String(step.id).padStart(2, '0')}. ${displayLabel} [${step.startFrame} - ${step.endFrame} 帧]`}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(step.id).padStart(2, '0')}. {displayLabel}
                    </span>
                  </div>
                );
              })}

              {/* Glowing Red Playhead line */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  isDraggingRedLineRef.current = true;
                  setIsDraggingRedLine(true);
                }}
                style={{
                  position: 'absolute',
                  left: `${(redLineFrame / totalFrames) * 100}%`,
                  top: -10,
                  height: '44px',
                  zIndex: 60,
                  cursor: isDraggingRedLine ? 'grabbing' : 'grab',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
                title={`🔴 标注游标: ${redLineFrame} 帧`}
              >
                <div style={{
                  background: '#ff1e1e',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '0 4px',
                  borderRadius: '3px',
                  boxShadow: '0 2px 6px rgba(255, 30, 30, 0.85), 0 0 0 1px #fff',
                  marginBottom: '-1px',
                  whiteSpace: 'nowrap',
                  lineHeight: '12px'
                }}>
                  {redLineFrame}f
                </div>
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '7px solid #ff1e1e',
                  filter: 'drop-shadow(0 2px 3px rgba(255,30,30,0.9))'
                }} />
                <div style={{
                  width: 2.5,
                  flex: 1,
                  background: '#ff1e1e',
                  boxShadow: '0 0 8px 1.5px rgba(255, 30, 30, 0.95)',
                  borderRadius: 1
                }} />
              </div>
            </div>

            {/* Line 3: Dedicated Slider / Scrub Bar */}
            <div style={{ padding: '0 2px' }}>
              <Slider
                min={0}
                max={totalFrames}
                value={currentFrame}
                onChange={(val) => {
                  setCurrentFrame(val);
                  setRedLineFrame(val);
                }}
                tooltip={{ formatter: (val) => `${val}帧 (${formatTime(val)})` }}
                styles={{
                  track: { background: '#2563eb', height: 4 },
                  rail: { background: '#cbd5e1', height: 4 },
                  handle: { borderColor: '#2563eb', width: 12, height: 12 }
                }}
                style={{ margin: '4px 0' }}
              />
            </div>

            {/* Line 4: Player Controller Row */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, paddingTop: 2 }}>
              <Button
                type="text"
                size="small"
                icon={<StepBackwardOutlined />}
                onClick={() => { setCurrentFrame(0); setRedLineFrame(0); }}
                title="跳至首帧"
                style={{ color: '#475569' }}
              />
              <Button
                type="text"
                size="small"
                icon={<LeftOutlined />}
                onClick={() => {
                  const prev = Math.max(0, currentFrame - 10);
                  setCurrentFrame(prev);
                  setRedLineFrame(prev);
                }}
                title="后退10帧"
                style={{ color: '#475569' }}
              />

              <Button
                type="primary"
                icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={handleTogglePlay}
                style={{
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#2563eb',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)'
                }}
              />

              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={() => {
                  const next = Math.min(totalFrames, currentFrame + 10);
                  setCurrentFrame(next);
                  setRedLineFrame(next);
                }}
                title="前进10帧"
                style={{ color: '#475569' }}
              />
              <Button
                type="text"
                size="small"
                icon={<StepForwardOutlined />}
                onClick={() => { setCurrentFrame(totalFrames); setRedLineFrame(totalFrames); }}
                title="跳至尾帧"
                style={{ color: '#475569' }}
              />

              <Divider orientation="vertical" style={{ height: 14, margin: '0 6px' }} />

              <Select
                value={playbackSpeed}
                onChange={setPlaybackSpeed}
                size="small"
                variant="borderless"
                style={{ width: 68, fontSize: 11 }}
                options={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1.0, label: '1.0x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 2.0, label: '2.0x' },
                ]}
              />
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: ANNOTATION SIDEBAR (标注侧边栏) */}
        <div style={{ width: 440, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header Tabs */}
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', padding: '0 12px' }}>
            <div style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: '#1677ff', borderBottom: '2px solid #1677ff', cursor: 'pointer' }}>
              标注
            </div>
            <div
              onClick={() => { setPrdActiveTab('structured_steps'); setIsPrdOpen(true); }}
              style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}
            >
              PRD 说明
            </div>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Section 1: 步骤帧区间调整 */}
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  步骤帧区间调整：
                </span>
                <Button
                  type="link"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleAiSnapStep(shortSelectedId)}
                  style={{ fontSize: 11, padding: 0, height: 'auto', color: '#7c3aed', fontWeight: 600 }}
                >
                  ⚡ AI 智能吸附 (当前步)
                </Button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  type="primary"
                  style={{ flex: 1, height: 34, fontSize: 13, background: '#1677ff', borderColor: '#1677ff', fontWeight: 700, borderRadius: 6 }}
                  onClick={handleSetStartFrame}
                >
                  开始
                </Button>
                <Button
                  type="primary"
                  style={{ flex: 1, height: 34, fontSize: 13, background: '#f97316', borderColor: '#f97316', fontWeight: 700, borderRadius: 6 }}
                  onClick={handleSetEndFrame}
                >
                  标记
                </Button>
              </div>
            </div>

            {/* Section 2: 动作模版步骤 Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                动作模版步骤 ({shortSteps.length})
              </span>

              <Space size={6}>
                <Button
                  size="small"
                  icon={<RobotOutlined />}
                  onClick={() => {
                    setAiInferenceStep('config');
                    setIsAiModalOpen(true);
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.35)'
                  }}
                >
                  AI 自动标注
                </Button>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={handleBatchCopySelected}
                  style={{ fontSize: 11, borderColor: '#1677ff', color: '#1677ff' }}
                >
                  批量复制
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const lastStep = shortSteps[shortSteps.length - 1];
                    const nextStart = lastStep ? lastStep.endFrame + 1 : 0;
                    const nextEnd = Math.min(totalFrames, nextStart + 276);
                    const newStep = {
                      id: shortSteps.length + 1,
                      text: '擦拭台面并复位清洁工具',
                      arm: '双手 (Dual Arms)',
                      skill: '推拉操作',
                      object: '清洁工具',
                      goal: '复位到位',
                      startFrame: nextStart,
                      endFrame: nextEnd,
                      color: '#722ed1',
                      graspType: '平行双指夹持',
                      speedProfile: '平稳匀速 (0.3m/s)',
                      confidence: '99.0%',
                      torqueLimit: '15.0 N·m',
                      vlaToken: 'ACTION_CUSTOM_STEP'
                    };
                    setShortSteps([...shortSteps, newStep]);
                    setShortSelectedId(newStep.id);
                    message.success('已新增动作步骤');
                  }}
                  style={{ fontSize: 11, background: '#1677ff' }}
                >
                  增加步骤
                </Button>
              </Space>
            </div>

            {/* AI History Undo Banner */}
            {aiHistorySnapshot && (
              <div style={{
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: 6,
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                color: '#6d28d9'
              }}>
                <Space size={6}>
                  <RobotOutlined style={{ color: '#7c3aed' }} />
                  <span>已导入 AI 自动标注 ({lastAiCount} 个步骤)，支持手动微调或撤销</span>
                </Space>
                <Button
                  size="small"
                  type="link"
                  icon={<UndoOutlined />}
                  onClick={handleUndoAiAnnotation}
                  style={{ fontSize: 11, color: '#7c3aed', padding: 0, height: 'auto', fontWeight: 700 }}
                >
                  撤销本次 AI
                </Button>
              </div>
            )}

            {/* Section 3: Steps Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shortSteps.map((step, idx) => {
                const isSelected = shortSelectedId === step.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => setShortSelectedId(step.id)}
                    style={{
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: isSelected ? '#f8faff' : '#ffffff',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Header: Number Badge + Step Title + Frame Range Tag + Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <Checkbox
                          checked={selectedBatchIds.includes(step.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleBatchSelect(step.id)}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: step.color || '#1677ff',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {step.text}
                        </span>
                        {step.isAiGenerated && (
                          <Tag color="purple" style={{ margin: 0, fontSize: 9, borderRadius: 10, padding: '0 4px', lineHeight: '16px' }}>
                            AI {step.confidence}
                          </Tag>
                        )}
                        {step.isAiAdjusted && (
                          <Tag color="cyan" style={{ margin: 0, fontSize: 9, borderRadius: 10, padding: '0 4px', lineHeight: '16px' }}>
                            ⚡ 已吸附
                          </Tag>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Tag color="blue" style={{ margin: 0, fontSize: 10, borderRadius: 10, padding: '0 6px' }}>
                          {step.startFrame} - {step.endFrame} 帧
                        </Tag>
                        <Tooltip title="AI 边界微调 (接触力控吸附)">
                          <ThunderboltOutlined
                            style={{ color: '#8b5cf6', fontSize: 12, cursor: 'pointer', padding: 2 }}
                            onClick={(e) => { e.stopPropagation(); handleAiSnapStep(step.id); }}
                          />
                        </Tooltip>
                        <Tooltip title="复制单步">
                          <CopyOutlined
                            style={{ color: '#64748b', fontSize: 12, cursor: 'pointer', padding: 2 }}
                            onClick={(e) => { e.stopPropagation(); handleCopySingleStep(step); }}
                          />
                        </Tooltip>
                        <Tooltip title="拖拽换位">
                          <HolderOutlined style={{ color: '#94a3b8', fontSize: 12, cursor: 'grab', padding: 2 }} />
                        </Tooltip>
                        <Tooltip title="删除步骤">
                          <DeleteOutlined
                            style={{ color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const filtered = shortSteps.filter(s => s.id !== step.id);
                              setShortSteps(filtered);
                              message.info(`已删除步骤 #${idx + 1}`);
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>

                    {/* Frame Numeric Inputs Row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: '6px 8px', borderRadius: 6 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>起始帧</span>
                        <InputNumber
                          size="small"
                          value={step.startFrame}
                          onChange={val => handleUpdateStepField(step.id, 'startFrame', val)}
                          style={{ width: '100%', fontSize: 11 }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>结束帧</span>
                        <InputNumber
                          size="small"
                          value={step.endFrame}
                          onChange={val => handleUpdateStepField(step.id, 'endFrame', val)}
                          style={{ width: '100%', fontSize: 11 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Section 4: Bottom Action Footer inside Right Column */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid #e2e8f0',
            background: '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8
          }}>
            <Button
              size="small"
              style={{
                background: '#f9f0ff',
                borderColor: '#d3adf7',
                color: '#722ed1',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                height: 32,
                flex: 1
              }}
              onClick={() => message.success('📋 已根据当前步骤生成动作模版！')}
            >
              生成标注模版
            </Button>
            <Button
              size="small"
              type="primary"
              style={{
                background: '#1677ff',
                borderColor: '#1677ff',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                height: 32,
                flex: 1
              }}
              onClick={() => message.success(`🎉 恭喜！数据序号 ${episodeId} 标注完成并已提交！`)}
            >
              完成标注
            </Button>
          </div>

        </div>
      </div>

      {/* MODAL: STRUCTURED STEP ATTRIBUTES INSPECTOR */}
      <Modal
        title={(
          <Space>
            <SlidersOutlined style={{ color: '#2563eb' }} />
            <span>结构化动作参数配置 - 步骤 #{detailModalStep?.id}「{detailModalStep?.arm.split(' ')[0]} - {detailModalStep?.skill}」</span>
          </Space>
        )}
        open={!!detailModalStep}
        onCancel={() => setDetailModalStep(null)}
        onOk={() => {
          message.success('已保存步骤结构化深度参数');
          setDetailModalStep(null);
        }}
        width={650}
        okText="保存配置"
        cancelText="取消"
      >
        {detailModalStep && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Alert
              type="info"
              showIcon
              message="具身智能机器人控制元数据 (Robotics Meta Properties)"
              description="配置原子动作对应的抓取方式、力控安全阈值、3D边界框与 VLA 动作向量标识。"
            />

            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="执行末端">
                <Tag color="purple">{detailModalStep.arm}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="原子技能">
                <Tag color="green">{detailModalStep.skill}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作对象">
                <Tag color="blue">{detailModalStep.object}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="阶段目标">
                <Tag color="orange">{detailModalStep.goal}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="起始帧 - 结束帧">
                <code>{detailModalStep.startFrame}f - {detailModalStep.endFrame}f ({detailModalStep.endFrame - detailModalStep.startFrame} 帧)</code>
              </Descriptions.Item>
              <Descriptions.Item label="标注置信度">
                <Badge status="processing" text={detailModalStep.confidence} />
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="🤖 机械臂执行器参数" style={{ borderRadius: 6 }}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>夹爪/吸盘抓取模式</div>
                  <Select
                    style={{ width: '100%' }}
                    value={detailModalStep.graspType}
                    onChange={(val) => {
                      setDetailModalStep({ ...detailModalStep, graspType: val });
                      handleUpdateStepField(detailModalStep.id, 'graspType', val);
                    }}
                    options={[
                      { value: '平行双指夹持', label: '平行双指夹持 (Parallel Jaw)' },
                      { value: '真空吸盘吸附', label: '真空吸盘吸附 (Vacuum Suction)' },
                      { value: '五指灵巧手抓握', label: '五指灵巧手抓握 (Dexterous Hand)' },
                      { value: '包络力矩抓取', label: '包络力矩抓取 (Enveloping Grasp)' },
                    ]}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>末端运动速度曲线</div>
                  <Select
                    style={{ width: '100%' }}
                    value={detailModalStep.speedProfile}
                    onChange={(val) => {
                      setDetailModalStep({ ...detailModalStep, speedProfile: val });
                      handleUpdateStepField(detailModalStep.id, 'speedProfile', val);
                    }}
                    options={[
                      { value: '平稳匀速 (0.3m/s)', label: '平稳匀速 (0.3m/s)' },
                      { value: '快速接近 (0.6m/s)', label: '快速接近 (0.6m/s)' },
                      { value: '高精度慢速 (0.1m/s)', label: '高精度慢速 (0.1m/s)' },
                    ]}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>接触力矩安全上限</div>
                  <Input
                    value={detailModalStep.torqueLimit}
                    onChange={(e) => {
                      setDetailModalStep({ ...detailModalStep, torqueLimit: e.target.value });
                      handleUpdateStepField(detailModalStep.id, 'torqueLimit', e.target.value);
                    }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>VLA 动作语义 Token 标识</div>
                  <Input
                    value={detailModalStep.vlaToken}
                    onChange={(e) => {
                      setDetailModalStep({ ...detailModalStep, vlaToken: e.target.value });
                      handleUpdateStepField(detailModalStep.id, 'vlaToken', e.target.value);
                    }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>

      {/* MODAL: AI 自动标注与人机协同流水线 */}
      <Modal
        title={(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <Space size={10}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16
              }}>
                <RobotOutlined />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  本地大模型 AI 动作时序切分与预标注
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                  端侧 Qwen2.5-VL 多模态时序切分 · 结构化四元组与工步推导 · 离线工业安全合规
                </div>
              </div>
            </Space>
            <Tag color="blue" style={{ fontWeight: 700, margin: 0, padding: '2px 10px' }}>本地 Qwen2.5-VL 就绪</Tag>
          </div>
        )}
        open={isAiModalOpen}
        onCancel={() => {
          if (aiInferenceStep === 'inferring') {
            setIsAiScanningActive(false);
          }
          setIsAiModalOpen(false);
          setAiInferenceStep('config');
        }}
        width={760}
        footer={null}
        destroyOnClose={false}
      >
        <div style={{ marginTop: 10 }}>
          {/* STAGE 1: 算法与策略配置 */}
          {aiInferenceStep === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 顶部视频元数据卡片 */}
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0'
                }}
                styles={{ body: { padding: '10px 14px' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <Space size={6} wrap>
                    <Tag color="blue" icon={<VideoCameraOutlined />}>当前视频: 螺丝预装配示教录像</Tag>
                    <Tag color="purple">30 FPS · 1331 帧 (~44.3s)</Tag>
                    <Tag color="cyan">工位: 天奇新动力·打螺丝工位</Tag>
                    <Tag color="geekblue">任务书: TB-螺丝预装配</Tag>
                  </Space>
                  <Space size={4}>
                    <SafetyCertificateOutlined style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>人机协同 · 候选可核验</span>
                  </Space>
                </div>
              </Card>

              {/* 默认锁定本地具身多模态模型 (无需多选) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                borderRadius: 8,
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                  }}>
                    <RobotOutlined />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 13, color: '#0f172a' }}>本地推理引擎：Qwen2.5-VL-7B (Apple M1 Pro GPU / Metal 原生加速)</strong>
                      <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>Metal GPU驱动</Tag>
                      <Tag color="green" style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>100% 工业离线合规</Tag>
                      <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>0 API 外部消耗</Tag>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                      端侧本地多模态大模型原生直解，视频数据无需外发云端，毫秒级定位动作起止帧并生成结构化四元组。
                    </div>
                  </div>
                </div>
                <Tag color="geekblue" style={{ fontWeight: 600, fontSize: 11, margin: 0 }}>本地服务就绪 · 延迟 &lt;50ms</Tag>
              </div>

              {/* 1. 标注任务执行模式 */}
              <Card size="small" title="1. 标注任务执行模式与时序范围" style={{ borderRadius: 8 }}>
                <Radio.Group
                  value={aiMode}
                  onChange={e => setAiMode(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio value="full_segmentation">
                      <span><strong>全视频端到端时序切分 (Full Video Scope)</strong>：覆盖 0.0s 至 44.3s 全程，密集切分且工步紧密相接，自动推导完整结构化四元组</span>
                    </Radio>
                    <Radio value="window_sliding">
                      <span><strong>局部短窗口精准采样分析 (Sliding Window)</strong>：硬件级均匀截帧切片，防止长视频特征稀释，毫秒级定位物理接触临界跳变点</span>
                    </Radio>
                    <Radio value="template_align">
                      <span><strong>工业装配 SOP 动作模板对齐 (Template Alignment)</strong>：依据天奇新动力工序标准（扫码/提电钻/拧紧螺栓/扣保护帽），AI 自动对齐区间</span>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Card>

              {/* 2. 采样密度、置信度阈值与导入策略 */}
              <Card size="small" title="2. 采样切片密度、置信度过滤与导入策略" style={{ borderRadius: 8 }}>
                <Row gutter={[16, 12]} align="middle">
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, fontWeight: 600 }}>
                      抽帧切片密度：
                    </div>
                    <Radio.Group
                      value={aiFramesPerWindow}
                      onChange={e => setAiFramesPerWindow(e.target.value)}
                      size="small"
                    >
                      <Radio.Button value={6}>6 帧 (推荐极速)</Radio.Button>
                      <Radio.Button value={10}>10 帧 (平衡)</Radio.Button>
                      <Radio.Button value={12}>12 帧 (精细)</Radio.Button>
                    </Radio.Group>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, fontWeight: 600 }}>
                      置信度过滤阈值：{aiConfidenceThreshold}%
                    </div>
                    <Slider
                      min={70}
                      max={99}
                      value={aiConfidenceThreshold}
                      onChange={setAiConfidenceThreshold}
                      styles={{
                        track: { background: aiModel === 'local_qwen' ? '#2563eb' : (aiModel === 'minimax_m3' ? '#ea580c' : '#7c3aed') },
                        handle: { borderColor: aiModel === 'local_qwen' ? '#2563eb' : (aiModel === 'minimax_m3' ? '#ea580c' : '#7c3aed') }
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, fontWeight: 600 }}>
                      工作台导入策略：
                    </div>
                    <Radio.Group
                      value={aiStrategy}
                      onChange={e => setAiStrategy(e.target.value)}
                      size="small"
                    >
                      <Radio.Button value="append">追加合并</Radio.Button>
                      <Radio.Button value="replace">全新覆盖</Radio.Button>
                    </Radio.Group>
                  </Col>
                </Row>
              </Card>

              {/* 底部操作栏 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <Button onClick={() => setIsAiModalOpen(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleStartAiInference}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  🚀 启动本地 Qwen2.5-VL 动作切分推理
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 2: 推理中动效 */}
          {aiInferenceStep === 'inferring' && (
            <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                fontSize: 28,
                boxShadow: '0 0 24px rgba(124, 58, 237, 0.3)'
              }}>
                <RobotOutlined spin />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  具身大模型正在进行多模态时序分析...
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {aiProgressStage}
                </div>
              </div>

              <div style={{ width: '80%' }}>
                <Progress
                  percent={aiProgress}
                  status="active"
                  strokeColor={{ '0%': '#6366f1', '50%': '#8b5cf6', '100%': '#d946ef' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#64748b', marginTop: 8 }}>
                <span>✓ 4路相机解码</span>
                <span>✓ 关节力矩突变提取</span>
                <span>✓ 动作语义聚类</span>
                <span>● 结构化槽位推导</span>
              </div>

              <Button
                size="small"
                onClick={() => {
                  setIsAiScanningActive(false);
                  setAiInferenceStep('config');
                }}
                style={{ marginTop: 10 }}
              >
                取消推理
              </Button>
            </div>
          )}

          {/* STAGE 3: 人机协同审核与导入确认 */}
          {aiInferenceStep === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Alert
                type="success"
                showIcon
                message="🎉 AI 自动推理标注完成！识别出 5 个高置信度动作区间"
                description="请在下方核验候选步骤。您可以自由勾选需要采纳的动作步骤，或直接微调起止帧数值，确认后将同步导入工作台。"
                style={{ borderRadius: 8 }}
              />

              {/* 候选列表工具栏 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Checkbox
                    indeterminate={aiSelectedCandidateIds.length > 0 && aiSelectedCandidateIds.length < aiCandidateSteps.length}
                    checked={aiSelectedCandidateIds.length === aiCandidateSteps.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAiSelectedCandidateIds(aiCandidateSteps.map(s => s.id));
                      } else {
                        setAiSelectedCandidateIds([]);
                      }
                    }}
                  >
                    全选候选步骤
                  </Checkbox>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    (已选 <strong style={{ color: '#7c3aed' }}>{aiSelectedCandidateIds.length}</strong> / {aiCandidateSteps.length} 项)
                  </span>
                </Space>
                <Tag color="green">平均置信度 98.3%</Tag>
              </div>

              {/* 候选列表卡片 */}
              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {aiCandidateSteps.map((candidate, idx) => {
                  const isChecked = aiSelectedCandidateIds.includes(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      style={{
                        border: isChecked ? '1.5px solid #a855f7' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        background: isChecked ? '#fbf8ff' : '#fff',
                        padding: '10px 12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAiSelectedCandidateIds([...aiSelectedCandidateIds, candidate.id]);
                              } else {
                                setAiSelectedCandidateIds(aiSelectedCandidateIds.filter(id => id !== candidate.id));
                              }
                            }}
                          />
                          <span style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: candidate.color || '#7c3aed',
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {candidate.text}
                          </span>
                        </div>

                        <Space size={6}>
                          <Tag color="purple" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                            置信度: {candidate.confidence}
                          </Tag>
                          <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                            {candidate.endFrame - candidate.startFrame} 帧
                          </Tag>
                        </Space>
                      </div>

                      {/* 结构化标签行 */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, paddingLeft: 28 }}>
                        <Tag color="purple">{candidate.arm}</Tag>
                        <Tag color="green">{candidate.skill}</Tag>
                        <Tag color="blue">{candidate.object}</Tag>
                        <Tag color="orange">{candidate.goal}</Tag>
                      </div>

                      {/* 帧区间微调行 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 28, background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>起始帧:</span>
                        <InputNumber
                          size="small"
                          value={candidate.startFrame}
                          onChange={(val) => {
                            setAiCandidateSteps(prev => prev.map(s => s.id === candidate.id ? { ...s, startFrame: val } : s));
                          }}
                          style={{ width: 85, fontSize: 11 }}
                        />
                        <span style={{ fontSize: 11, color: '#64748b' }}>结束帧:</span>
                        <InputNumber
                          size="small"
                          value={candidate.endFrame}
                          onChange={(val) => {
                            setAiCandidateSteps(prev => prev.map(s => s.id === candidate.id ? { ...s, endFrame: val } : s));
                          }}
                          style={{ width: 85, fontSize: 11 }}
                        />
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>支持就地微调数值</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 审核底部操作栏 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <Button
                  size="small"
                  onClick={() => setAiInferenceStep('config')}
                >
                  重新配置
                </Button>
                <Space>
                  <Button onClick={() => setIsAiModalOpen(false)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleApplyAiSteps}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                      border: 'none',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                    }}
                  >
                    ✨ 确认导入工作台 ({aiSelectedCandidateIds.length} 项)
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* PRD DRAWER */}
      <Drawer
        title={(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>具身智能动作范围标注工作台 - PRD 功能需求规格说明书</span>
            </div>
            <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>研发开发对接专用</Tag>
          </div>
        )}
        placement="right"
        width={800}
        onClose={() => setIsPrdOpen(false)}
        open={isPrdOpen}
        styles={{ body: { padding: '16px 24px', background: '#f8fafc' } }}
      >
        <Alert
          message="📌 核心业务场景与设计目标"
          description="本页面为具身智能机器人多视角数据采集标注专用工作台，核心用于多动作时序范围精准切分、SOP动作步骤录制、快捷操作、双向时序轴联动、质量控制与数据交付。"
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff' }}
        />

        <Tabs
          activeKey={prdActiveTab}
          onChange={(key) => setPrdActiveTab(key)}
          items={[
            {
              key: 'structured_steps',
              label: '🧩 步骤模式定义与开发规范',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Alert
                    type="warning"
                    showIcon
                    message="⚠️ 关键业务原则：结构化步骤与自然语言步骤严格互斥"
                    description="任务或工作台在任一时间只能展示并采集其中一种形态。结构化步骤直接绑定动作分类槽位；自然语言步骤直接采集单行指令文本。前后端存储 Schema 与模型训练数据完全解耦，切勿在同一界面混杂展示。"
                  />

                  <Card size="small" title="1. 两种模式对比及字段映射" style={{ borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '6px 10px' }}>模式</th>
                          <th style={{ padding: '6px 10px' }}>前端展示形态</th>
                          <th style={{ padding: '6px 10px' }}>底层 JSON Schema 字段</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 10px' }}><Tag color="purple">🧩 结构化步骤</Tag></td>
                          <td style={{ padding: '6px 10px' }}>4个独立下拉槽位（末端、技能、对象、目标）+ 帧范围</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>arm, skill, object, goal, startFrame, endFrame</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 10px' }}><Tag color="blue">📝 自然语言</Tag></td>
                          <td style={{ padding: '6px 10px' }}>单条自由自然语言输入框 + 帧范围</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>text, startFrame, endFrame</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card>

                  <Card size="small" title="2. 结构化步骤 JSON 存储格式" style={{ borderRadius: 8 }}>
                    <pre style={{ background: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 6, fontSize: 11, overflowX: 'auto', lineHeight: 1.5 }}>
{`{
  "taskId": "8751",
  "instanceId": "${effectiveInstanceId}",
  "episodeId": "${episodeId}",
  "mode": "structured",
  "steps": [
    {
      "stepId": 1,
      "arm": "双手 (Dual Arms)",
      "skill": "抓取与定位",
      "object": "瓦楞纸箱",
      "goal": "开箱定位完成 (Visual Match)",
      "startFrame": 0,
      "endFrame": 200,
      "graspType": "平行双指夹持",
      "torqueLimit": "15.0 N·m",
      "vlaToken": "ACTION_BOX_GRASP_OPEN"
    }
  ]
}`}
                    </pre>
                  </Card>
                </div>
              )
            },
            {
              key: 'overview',
              label: '📐 架构总览',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Card size="small" title="1. 页面交互形态与栅格比例" style={{ borderRadius: 8 }}>
                    <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8, fontSize: 13, color: '#334155' }}>
                      <li><strong>100vh 纯净全屏沉浸式工作台</strong>：隐藏左侧全局菜单侧边栏，为多视角视频与时序轴提供最大化可视面积。</li>
                      <li><strong>左侧（flex: 1.5）</strong>：视频播放区与垂直绑定的播放轴、多彩动作时序切片轴及播放控制器。</li>
                      <li><strong>右侧（440px）</strong>：标注操作面板、步骤帧区间调整、动作模版步骤列表及底部提交按钮。</li>
                    </ul>
                  </Card>
                </div>
              )
            },
            {
              key: 'hotkeys',
              label: '⌨️ 快捷键速查表',
              children: (
                <Card size="small" title="全局键盘快捷键配置" style={{ borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '6px 10px' }}>快捷键</th>
                        <th style={{ padding: '6px 10px' }}>功能</th>
                        <th style={{ padding: '6px 10px' }}>触发动作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 10px' }}><Tag color="blue">Q / q</Tag></td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>开始录制</td>
                        <td style={{ padding: '6px 10px', color: '#475569' }}>设当前帧为起始帧，开启播放与时序轴向右动态拉伸</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 10px' }}><Tag color="orange">R / r</Tag></td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>标记结束</td>
                        <td style={{ padding: '6px 10px', color: '#475569' }}>锁定当前步骤结束帧，暂停播放，退出录制态</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 10px' }}><Tag color="default">Space 空格</Tag></td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>播放 / 暂停</td>
                        <td style={{ padding: '6px 10px', color: '#475569' }}>切换视频播放与暂停状态</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px' }}><Tag color="green">T / t</Tag></td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>完成标注</td>
                        <td style={{ padding: '6px 10px', color: '#475569' }}>校验步骤合法性并提交当前 Episode 标注数据</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              )
            },
            {
              key: 'ai_spec',
              label: '🤖 AI 自动标注规范',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Alert
                    type="info"
                    showIcon
                    message="📌 人机协同核心原则 (Human-in-the-Loop)"
                    description="AI 自动标注作为增效加速辅助工具，绝不强制覆盖或替换现有人工标注操作流。人工录制（Q/R 快捷键、拖拽微调、批量复制）与 AI 自动切分共生互补。"
                  />

                  <Card size="small" title="1. AI 标注技术架构与交互流程" style={{ borderRadius: 8 }}>
                    <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8, fontSize: 13, color: '#334155' }}>
                      <li><strong>多模态感知驱动</strong>：基于 Embodied-VLA-X 模型，综合 4 路相机视频帧、机械臂末端接触力矩与夹爪开闭信号，进行时序语义分割。</li>
                      <li><strong>人机核验网关</strong>：AI 推理后并不直接强行入库，而先进入「结果审查清单」，标注员可自主勾选所需步骤、就地调整数值。</li>
                      <li><strong>增量合并保障</strong>：默认采取追加模式，避免破坏已有手工标注数据；同时提供一键「撤销 AI 标注」，确保后悔权。</li>
                      <li><strong>单步智能吸附</strong>：每个步骤均配备 AI 智能吸附按钮，点击即可让 AI 自动检测接触力临界点微调 2~5 帧。</li>
                    </ul>
                  </Card>
                </div>
              )
            }
          ]}
        />
      </Drawer>

    </div>
  );
}
