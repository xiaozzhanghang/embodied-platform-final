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
  SlidersOutlined, NodeIndexOutlined, EditOutlined, BulbOutlined
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

  const instanceId = searchParams.get('id') || '19884';
  const episodeId = searchParams.get('episodeId') || '744108';
  const annoType = searchParams.get('type') || '范围标注';
  const workMode = searchParams.get('mode') || 'annotate';

  const effectiveInstanceId = searchParams.get('instanceId') || instanceId;

  // Video playback & Timecode state (标准单轮 900 帧 / 30秒)
  const totalFrames = 900;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(120);
  const [redLineFrame, setRedLineFrame] = useState(120);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTimerRef = useRef(null);
  const timelineRef = useRef(null);

  // =========================================================================
  // STATE: 严格二选一互斥步骤展示模式 ('structured' 结构化步骤 | 'natural' 自然语言)
  // =========================================================================
  const [stepDisplayMode, setStepDisplayMode] = useState('structured');

  // =========================================================================
  // STATE: 动作步骤数据
  // =========================================================================
  const [shortSteps, setShortSteps] = useState([
    {
      id: 1,
      text: '双手抓取纸箱并开箱定位',
      arm: '双手 (Dual Arms)',
      skill: '抓取与定位',
      object: '瓦楞纸箱',
      goal: '开箱定位完成 (Visual Match)',
      startFrame: 0,
      endFrame: 200,
      color: '#13c2c2',
      graspType: '平行双指夹持',
      speedProfile: '平稳匀速 (0.3m/s)',
      confidence: '99.2%',
      torqueLimit: '15.0 N·m',
      vlaToken: 'ACTION_BOX_GRASP_OPEN'
    },
    {
      id: 2,
      text: '右手取底部泡沫垫并放入纸箱',
      arm: '右手 (Right Arm)',
      skill: '取物放置',
      object: '底部泡沫垫',
      goal: '平稳入箱 (Safe Placement)',
      startFrame: 201,
      endFrame: 400,
      color: '#722ed1',
      graspType: '真空吸盘吸附',
      speedProfile: '快速接近 (0.6m/s)',
      confidence: '98.7%',
      torqueLimit: '5.2 N·m',
      vlaToken: 'ACTION_FOAM_INSERT'
    },
    {
      id: 3,
      text: '右手抓取核心金属支架入箱',
      arm: '右手 (Right Arm)',
      skill: '精密装配',
      object: '核心金属支架',
      goal: '卡槽对准牢固 (Torque Align)',
      startFrame: 401,
      endFrame: 600,
      color: '#1890ff',
      graspType: '五指灵巧手抓握',
      speedProfile: '高精度慢速 (0.1m/s)',
      confidence: '99.5%',
      torqueLimit: '28.5 N·m',
      vlaToken: 'ACTION_CORE_BRACKET_ASSEMBLY'
    },
    {
      id: 4,
      text: '双手折叠合拢箱盖并封箱',
      arm: '双手 (Dual Arms)',
      skill: '合拢封箱',
      object: '瓦楞纸箱盖',
      goal: '完全闭合锁死 (Closed Sealed)',
      startFrame: 601,
      endFrame: 750,
      color: '#52c41a',
      graspType: '双手压合',
      speedProfile: '标准操作 (0.4m/s)',
      confidence: '99.0%',
      torqueLimit: '18.0 N·m',
      vlaToken: 'ACTION_BOX_CLOSE_SEAL'
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

      {/* TOP HEADER */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <Space size={14} align="center">
          <Button
            size="small"
            icon={<LeftOutlined />}
            onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditDetail, { id: effectiveInstanceId }))}
          >
            返回列表
          </Button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
            test_job_{annoType} (标注工作台)
          </span>
          <Divider orientation="vertical" style={{ height: 16, borderColor: '#cbd5e1' }} />
          <Space size={12} style={{ fontSize: 12, color: '#64748b' }}>
            <span>任务ID: <strong style={{ color: '#0f172a' }}>8751</strong></span>
            <span>实例ID: <strong style={{ color: '#0f172a' }}>{effectiveInstanceId}</strong></span>
            <span>数据序号: <strong style={{ color: '#0f172a' }}>{episodeId}</strong></span>
          </Space>
        </Space>

        <Space size={8}>
          <Button
            icon={<BookOutlined style={{ color: '#2563eb' }} />}
            onClick={() => { setPrdActiveTab('structured_steps'); setIsPrdOpen(true); }}
            style={{
              fontWeight: 600,
              borderColor: '#3b82f6',
              color: '#1d4ed8',
              background: '#eff6ff',
              boxShadow: '0 1px 2px rgba(37,99,235,0.1)'
            }}
          >
            📋 功能需求说明书 (PRD)
          </Button>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => message.success('工作进度已保存')}>
            保存标注
          </Button>
        </Space>
      </div>

      {/* MAIN WORKSPACE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '10px 14px', gap: 12 }}>

        {/* LEFT 4-CAMERA VIEWPORT */}
        <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0284c7' }}>● camera_head_left_color (主视角)</span>
                <Tag color="blue" style={{ fontSize: 9, margin: 0 }}>CAM 01</Tag>
              </div>
              {renderGridContent('camera_head_left_color')}
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>● camera_head_right_color (辅助视)</span>
                <Tag color="purple" style={{ fontSize: 9, margin: 0 }}>CAM 02</Tag>
              </div>
              {renderGridContent('camera_head_right_color')}
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>● camera_hand_left_color (左机械臂)</span>
                <Tag color="green" style={{ fontSize: 9, margin: 0 }}>CAM 03</Tag>
              </div>
              {renderGridContent('camera_hand_left_color')}
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>● camera_hand_right_color (右机械臂)</span>
                <Tag color="gold" style={{ fontSize: 9, margin: 0 }}>CAM 04</Tag>
              </div>
              {renderGridContent('camera_hand_right_color')}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DYNAMIC ACTION PANELS */}
        <div style={{ flex: 1.2, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header Tabs */}
          <div className="ui-toolbar" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-start', minHeight: 0, padding: '0 8px' }}>
            {['动作步骤', '区域段管理', 'VLA', '错误帧管理'].map((tab, idx) => (
              <div
                key={tab}
                onClick={() => setActiveTabKey(String(idx + 1))}
                style={{
                  padding: '10px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: activeTabKey === String(idx + 1) ? 700 : 500,
                  color: activeTabKey === String(idx + 1) ? '#1677ff' : '#64748b',
                  borderBottom: activeTabKey === String(idx + 1) ? '2px solid #1677ff' : '2px solid transparent'
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* TAB 1: ACTION STEPS WORKSPACE */}
          <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
            <div>
              {/* Standard Q/R handle recording */}
              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 'bold', color: '#334155' }}>操作手柄录制：</span>
                  <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>已选步骤 #{shortSelectedId}</Tag>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="primary"
                    style={{ flex: 1, height: 32, fontSize: 12, background: '#2563eb', fontWeight: 600 }}
                    onClick={handleSetStartFrame}
                  >
                    开始 [Q] ({currentFrame}f)
                  </Button>
                  <Button
                    type="primary"
                    style={{ flex: 1, height: 32, fontSize: 12, background: '#f97316', borderColor: '#f97316', fontWeight: 600 }}
                    onClick={handleSetEndFrame}
                  >
                    标记 [R] ({currentFrame}f)
                  </Button>
                </div>
              </div>

              {/* Header: Mutually Exclusive Mode Switcher (结构化步骤 vs 自然语言) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>
                    动作步骤 ({shortSteps.length})
                  </span>

                  {/* 严格二选一互斥模式选择器 */}
                  <Radio.Group
                    size="small"
                    value={stepDisplayMode}
                    onChange={e => setStepDisplayMode(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="structured">🧩 结构化步骤</Radio.Button>
                    <Radio.Button value="natural">📝 自然语言</Radio.Button>
                  </Radio.Group>
                </div>

                <Space size={6}>
                  <Tooltip title="一键全选或取消全选">
                    <Button
                      size="small"
                      icon={<CheckSquareOutlined />}
                      onClick={handleSelectAllBatch}
                      style={{ fontSize: 10, padding: '0 6px', height: 22, color: selectedBatchIds.length === shortSteps.length ? '#2563eb' : '#475569' }}
                    >
                      {selectedBatchIds.length === shortSteps.length ? '取消全选' : '全选'}
                    </Button>
                  </Tooltip>

                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const currentTotalSpan = shortSteps.reduce((sum, s) => sum + Math.max(1, s.endFrame - s.startFrame), 0);
                      if (currentTotalSpan + 100 > totalFrames) {
                        message.warning(`⚠️ 视频总帧数 (${totalFrames} 帧) 已被完全占用，剩余帧数不足，无法增加步骤！`);
                        return;
                      }
                      const newStep = {
                        id: shortSteps.length + 1,
                        text: '新自定义动作步骤描述',
                        arm: '双手 (Dual Arms)',
                        skill: '抓取与定位',
                        object: '瓦楞纸箱',
                        goal: '开箱定位完成 (Visual Match)',
                        startFrame: currentFrame,
                        endFrame: Math.min(totalFrames, currentFrame + 100),
                        color: '#eab308',
                        graspType: '平行双指夹持',
                        speedProfile: '平稳匀速 (0.3m/s)',
                        confidence: '99.0%',
                        torqueLimit: '12.0 N·m',
                        vlaToken: 'ACTION_CUSTOM_STEP'
                      };
                      setShortSteps([...shortSteps, newStep]);
                      setShortSelectedId(newStep.id);
                      message.success('已新增动作步骤');
                    }}
                    style={{ fontSize: 11 }}
                  >
                    增加步骤
                  </Button>
                </Space>
              </div>

              {/* 结构化语义图例 (仅结构化模式显示) */}
              {stepDisplayMode === 'structured' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 8px',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 6,
                  marginBottom: 10,
                  fontSize: 10,
                  color: '#64748b'
                }}>
                  <span style={{ fontWeight: 600 }}>结构化字段：</span>
                  <span style={{ color: '#7c3aed', fontWeight: 600 }}>🟣 执行末端</span>
                  <span>➔</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>🟢 原子技能</span>
                  <span>➔</span>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>🔵 操作对象</span>
                  <span>➔</span>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>🟠 阶段目标</span>
                </div>
              )}

              {/* STICKY BATCH ACTIONS BAR */}
              {selectedBatchIds.length > 0 && (
                <div style={{
                  marginBottom: 10,
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  color: '#fff'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    已勾选 <span style={{ color: '#fde047', fontSize: 14 }}>{selectedBatchIds.length}</span> 项步骤
                  </div>
                  <Space size={6}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={handleBatchCopySelected}
                      style={{ background: '#fff', color: '#1e40af', fontWeight: 700, borderColor: '#fff' }}
                    >
                      📋 批量复制所选 ({selectedBatchIds.length}) 步
                    </Button>
                    <Button
                      size="small"
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      onClick={handleBatchDeleteSelected}
                      style={{ fontWeight: 600 }}
                    >
                      删除
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => setSelectedBatchIds([])}
                      style={{ color: '#bfdbfe', fontSize: 11 }}
                    >
                      取消
                    </Button>
                  </Space>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 1: PURE STRUCTURED STEPS (纯结构化步骤卡片，不混入自然语言文本框) */}
              {/* ========================================================================= */}
              {stepDisplayMode === 'structured' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {shortSteps.map((step, idx) => {
                    const isSelected = shortSelectedId === step.id;
                    const isBatchChecked = selectedBatchIds.includes(step.id);
                    const isDragged = draggedStepIdx === idx;
                    const isDragOver = dragOverStepIdx === idx;

                    return (
                      <div
                        key={step.id}
                        id={`step-card-${step.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={() => {
                          setDraggedStepIdx(null);
                          setDragOverStepIdx(null);
                        }}
                        onClick={() => setShortSelectedId(step.id)}
                        style={{
                          border: isDragOver ? '2px dashed #2563eb' : isBatchChecked ? '2px solid #3b82f6' : isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          borderLeft: `5px solid ${step.color}`,
                          borderRadius: 8,
                          background: isDragOver ? '#eff6ff' : isBatchChecked ? '#f0f9ff' : isSelected ? '#f8faff' : '#ffffff',
                          padding: '10px 12px',
                          cursor: 'grab',
                          boxShadow: isDragOver ? '0 4px 12px rgba(37, 99, 235, 0.2)' : isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Step Card Header: Checkbox + Drag Handle + Badges + Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox
                              checked={isBatchChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleBatchSelect(step.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />

                            <Tooltip title="按住拖动可直接调换步骤位置">
                              <HolderOutlined style={{ color: isSelected ? '#2563eb' : '#94a3b8', cursor: 'grab', fontSize: 13 }} />
                            </Tooltip>

                            <span style={{ fontSize: 11, fontWeight: 'bold', color: isSelected ? '#1d4ed8' : '#64748b', background: isSelected ? '#dbeafe' : '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                              步骤 #{String(idx + 1).padStart(2, '0')}
                            </span>

                            <Tag color="purple" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                              {step.arm.split(' ')[0]}
                            </Tag>
                            <Tag color="green" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                              {step.skill}
                            </Tag>
                          </div>

                          <Space size={4} style={{ flexShrink: 0 }}>
                            <Tooltip title="配置机器人深度参数 (3D位姿 / 力矩 / 抓取方式)">
                              <Button
                                size="small"
                                icon={<SlidersOutlined style={{ color: '#2563eb' }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailModalStep(step);
                                }}
                                style={{ fontSize: 10, padding: '0 6px', height: 22 }}
                              >
                                参数
                              </Button>
                            </Tooltip>

                            <Tooltip title="就地复制此结构化单步">
                              <Button
                                size="small"
                                icon={<CopyOutlined style={{ color: '#059669' }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopySingleStep(step);
                                }}
                                style={{ fontSize: 10, padding: '0 6px', height: 22 }}
                              >
                                复制
                              </Button>
                            </Tooltip>

                            <Tooltip title="删除步骤">
                              <DeleteOutlined
                                style={{ color: '#ef4444', fontSize: 13, cursor: 'pointer', padding: '0 4px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const filtered = shortSteps.filter(s => s.id !== step.id);
                                  const reindexed = filtered.map((s, i) => ({ ...s, id: i + 1 }));
                                  const synced = realignStepTimeframes(reindexed, reindexed[0]?.startFrame || 0);
                                  setShortSteps(synced);
                                  message.info(`已删除步骤 #${idx + 1}`);
                                }}
                              />
                            </Tooltip>
                          </Space>
                        </div>

                        {/* 4-Dimension Pure Structured Selectors Grid */}
                        <div style={{
                          background: '#f8fafc',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          marginBottom: 8
                        }}>
                          <Row gutter={[8, 8]}>
                            {/* 1. 执行末端 */}
                            <Col span={12}>
                              <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, marginBottom: 2 }}>
                                🟣 执行末端 (Arm)
                              </div>
                              <Select
                                size="small"
                                value={step.arm}
                                onChange={val => handleUpdateStepField(step.id, 'arm', val)}
                                style={{ width: '100%', fontSize: 11 }}
                                options={ARM_OPTIONS}
                              />
                            </Col>

                            {/* 2. 原子技能 */}
                            <Col span={12}>
                              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginBottom: 2 }}>
                                🟢 原子技能 (Skill)
                              </div>
                              <Select
                                size="small"
                                value={step.skill}
                                onChange={val => handleUpdateStepField(step.id, 'skill', val)}
                                style={{ width: '100%', fontSize: 11 }}
                                options={SKILL_OPTIONS}
                              />
                            </Col>

                            {/* 3. 操作对象 */}
                            <Col span={12}>
                              <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, marginBottom: 2 }}>
                                🔵 操作对象 (Object)
                              </div>
                              <Select
                                size="small"
                                value={step.object}
                                onChange={val => handleUpdateStepField(step.id, 'object', val)}
                                style={{ width: '100%', fontSize: 11 }}
                                options={OBJECT_OPTIONS}
                              />
                            </Col>

                            {/* 4. 阶段目标 / 判据 */}
                            <Col span={12}>
                              <div style={{ fontSize: 10, color: '#d97706', fontWeight: 700, marginBottom: 2 }}>
                                🟠 阶段目标 (Goal)
                              </div>
                              <Select
                                size="small"
                                value={step.goal}
                                onChange={val => handleUpdateStepField(step.id, 'goal', val)}
                                style={{ width: '100%', fontSize: 11 }}
                                options={GOAL_OPTIONS}
                              />
                            </Col>
                          </Row>
                        </div>

                        {/* Numeric Frame Bounds + VLA Token tag */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10, color: '#64748b' }}>起始帧:</span>
                              <InputNumber
                                size="small"
                                value={step.startFrame}
                                onChange={val => handleUpdateStepField(step.id, 'startFrame', val)}
                                style={{ width: 62, fontSize: 11 }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10, color: '#64748b' }}>结束帧:</span>
                              <InputNumber
                                size="small"
                                value={step.endFrame}
                                onChange={val => handleUpdateStepField(step.id, 'endFrame', val)}
                                style={{ width: 62, fontSize: 11 }}
                              />
                            </div>
                            <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '20px' }}>
                              总跨度: {step.endFrame - step.startFrame} 帧 ({formatTime(step.endFrame - step.startFrame)})
                            </Tag>
                          </div>

                          <Tag color="cyan" style={{ margin: 0, fontSize: 9, fontFamily: 'monospace' }}>
                            {step.vlaToken}
                          </Tag>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 2: PURE NATURAL LANGUAGE STEPS (纯自然语言卡片，不混入结构化下拉) */}
              {/* ========================================================================= */}
              {stepDisplayMode === 'natural' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {shortSteps.map((step, idx) => {
                    const isSelected = shortSelectedId === step.id;
                    const isBatchChecked = selectedBatchIds.includes(step.id);
                    const isDragged = draggedStepIdx === idx;
                    const isDragOver = dragOverStepIdx === idx;
                    return (
                      <div
                        key={step.id}
                        id={`step-card-${step.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={() => {
                          setDraggedStepIdx(null);
                          setDragOverStepIdx(null);
                        }}
                        onClick={() => setShortSelectedId(step.id)}
                        style={{
                          border: isDragOver ? '2px dashed #2563eb' : isBatchChecked ? '2px solid #3b82f6' : isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          borderLeft: `5px solid ${step.color}`,
                          borderRadius: 8,
                          background: isDragOver ? '#eff6ff' : isBatchChecked ? '#f0f9ff' : isSelected ? '#f8faff' : '#ffffff',
                          padding: '8px 10px',
                          cursor: 'grab',
                          boxShadow: isDragOver ? '0 4px 12px rgba(37, 99, 235, 0.2)' : isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                            <Checkbox
                              checked={isBatchChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleBatchSelect(step.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Tooltip title="按住拖动可直接调换步骤位置">
                              <HolderOutlined style={{ color: isSelected ? '#2563eb' : '#94a3b8', cursor: 'grab', fontSize: 13 }} />
                            </Tooltip>
                            <span style={{ fontSize: 11, fontWeight: 'bold', color: isSelected ? '#1d4ed8' : '#64748b', background: isSelected ? '#dbeafe' : '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <Input
                              size="small"
                              value={step.text}
                              placeholder="请输入动作自然语言描述，如：双手抓取纸箱并开箱定位"
                              onChange={e => handleUpdateStepField(step.id, 'text', e.target.value)}
                              style={{ fontSize: 11, fontWeight: isSelected ? 600 : 400, background: '#fff', color: '#0f172a' }}
                            />
                          </div>
                          <Space size={3} style={{ flexShrink: 0, marginLeft: 6 }}>
                            <Button
                              size="small"
                              icon={<CopyOutlined style={{ color: '#2563eb' }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySingleStep(step);
                              }}
                              style={{ fontSize: 10, padding: '0 6px', height: 22 }}
                            >
                              复制单步
                            </Button>
                            <DeleteOutlined
                              style={{ color: '#ef4444', fontSize: 13, cursor: 'pointer', padding: '0 4px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = shortSteps.filter(s => s.id !== step.id);
                                const reindexed = filtered.map((s, i) => ({ ...s, id: i + 1 }));
                                const synced = realignStepTimeframes(reindexed, reindexed[0]?.startFrame || 0);
                                setShortSteps(synced);
                                message.info(`已删除步骤「${step.text}」`);
                              }}
                            />
                          </Space>
                        </div>

                        <Row gutter={6}>
                          <Col span={8}>
                            <div style={{ fontSize: 9, color: '#64748b' }}>起始帧</div>
                            <InputNumber
                              size="small"
                              value={step.startFrame}
                              style={{ width: '100%', fontSize: 11 }}
                              onChange={val => handleUpdateStepField(step.id, 'startFrame', val)}
                            />
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: 9, color: '#64748b' }}>结束帧</div>
                            <InputNumber
                              size="small"
                              value={step.endFrame}
                              style={{ width: '100%', fontSize: 11 }}
                              onChange={val => handleUpdateStepField(step.id, 'endFrame', val)}
                            />
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: 9, color: '#64748b' }}>帧总数</div>
                            <InputNumber size="small" disabled value={step.endFrame - step.startFrame} style={{ width: '100%', fontSize: 11 }} />
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TIMELINE & PLAYBAR */}
      <div className="ui-action-footer" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '8px 20px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>

        {/* Dedicated Playback Axis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', fontFamily: 'monospace', minWidth: 65 }}>
            ▶ 播放轴
          </span>
          <div style={{ flex: 1, position: 'relative' }}>
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
                track: { background: '#2563eb', height: 6 },
                rail: { background: '#cbd5e1', height: 6 },
                handle: { borderColor: '#2563eb', width: 14, height: 14 }
              }}
              style={{ margin: '0' }}
            />
          </div>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', minWidth: 120, textAlign: 'right' }}>
            {currentFrame.toLocaleString()} / {totalFrames.toLocaleString()} 帧
          </span>
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
            padding: '4px 12px',
            marginBottom: 6,
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'inline-block',
                boxShadow: '0 0 10px #2563eb'
              }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1e40af' }}>
                🔵 步骤 #{isRecordingStepId}「{stepDisplayMode === 'structured' ? `${shortSteps.find(s => s.id === isRecordingStepId)?.arm.split(' ')[0]} - ${shortSteps.find(s => s.id === isRecordingStepId)?.skill}` : shortSteps.find(s => s.id === isRecordingStepId)?.text}」正在实时录制
              </span>
              <Tag color="processing" style={{ margin: 0, fontWeight: 700, fontSize: 11, background: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }}>
                起始: {shortSteps.find(s => s.id === isRecordingStepId)?.startFrame}f ➔ 实时: {currentFrame}f (+{Math.max(0, currentFrame - (shortSteps.find(s => s.id === isRecordingStepId)?.startFrame || 0))} 帧)
              </Tag>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>播放随帧实时延展中</span>
              <Button
                size="small"
                type="primary"
                style={{ height: 22, fontSize: 11, fontWeight: 700, padding: '0 10px', borderRadius: 4, background: '#2563eb' }}
                onClick={handleSetEndFrame}
              >
                按 [R] 结束标记
              </Button>
            </div>
          </div>
        )}

        {/* Action Steps Multi-Color Temporal Track */}
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
              if (matched) {
                setShortSelectedId(matched.id);
              }
            }
          }}
          onTouchStart={(e) => {
            if (timelineRef.current && e.touches.length > 0) {
              isDraggingRedLineRef.current = true;
              setIsDraggingRedLine(true);
              const rect = timelineRef.current.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
              const target = Math.round(pct * totalFrames);
              setRedLineFrame(target);
              setCurrentFrame(target);
              const matched = shortSteps.find(s => target >= s.startFrame && target <= s.endFrame);
              if (matched) {
                setShortSelectedId(matched.id);
              }
            }
          }}
          style={{
            position: 'relative',
            height: 30,
            background: '#e2e8f0',
            borderRadius: 4,
            cursor: isDraggingRedLine ? 'grabbing' : 'pointer',
            overflow: 'visible',
            userSelect: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
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
                  if (timelineRef.current) {
                    const rect = timelineRef.current.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const clickedFrame = Math.round(pct * totalFrames);
                    setRedLineFrame(clickedFrame);
                    setCurrentFrame(clickedFrame);
                  } else {
                    setRedLineFrame(step.startFrame);
                    setCurrentFrame(step.startFrame);
                  }
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
                    ? '0 0 16px rgba(37, 99, 235, 0.95), inset 0 0 8px rgba(255,255,255,0.6)'
                    : isSelected
                    ? '0 0 12px rgba(0,0,0,0.45), inset 0 0 4px rgba(255,255,255,0.4)'
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
                  transform: isRecording || isSelected ? 'scaleY(1.1)' : 'scaleY(1)',
                  transition: isRecording ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                title={`${String(step.id).padStart(2, '0')}. ${displayLabel} [${step.startFrame} - ${step.endFrame} 帧] (点击选中并定位)`}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isRecording ? (
                    <>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                      <span>🔵 REC #{step.id} ({step.endFrame - step.startFrame}f)</span>
                    </>
                  ) : (
                    <span>{String(step.id).padStart(2, '0')}. {displayLabel}</span>
                  )}
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
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              isDraggingRedLineRef.current = true;
              setIsDraggingRedLine(true);
            }}
            style={{
              position: 'absolute',
              left: `${(redLineFrame / totalFrames) * 100}%`,
              top: -12,
              height: '48px',
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
              padding: '0 5px',
              borderRadius: '3px',
              boxShadow: isRecordingStepId !== null
                ? '0 0 12px rgba(255, 30, 30, 1), 0 0 0 1.5px #fff'
                : '0 2px 6px rgba(255, 30, 30, 0.85), 0 0 0 1px #fff',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              lineHeight: '13px',
              pointerEvents: 'none',
              letterSpacing: '0.5px'
            }}>
              {isRecordingStepId !== null ? `🔴 REC ${redLineFrame}f` : `${redLineFrame}f`}
            </div>

            <div style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid #ff1e1e',
              filter: 'drop-shadow(0 2px 4px rgba(255,30,30,0.9))',
              cursor: isDraggingRedLine ? 'grabbing' : 'grab'
            }} />

            <div style={{
              width: 3,
              flex: 1,
              background: '#ff1e1e',
              boxShadow: isRecordingStepId !== null
                ? '0 0 14px 2px rgba(255, 30, 30, 1), 0 0 4px rgba(255, 255, 255, 1)'
                : '0 0 10px 1.5px rgba(255, 30, 30, 0.95), 0 0 2px rgba(255, 255, 255, 0.9)',
              borderRadius: 1
            }} />
          </div>
        </div>

        {/* Player Controller Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Space size={14} align="center">
            <Button type="text" icon={<LeftOutlined />} onClick={() => { setCurrentFrame(0); setRedLineFrame(0); }} title="跳至首帧" />
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' }}>
              ⏱️ {formatTime(currentFrame)} / 00:00:30.000
            </div>
            <Button type="text" icon={<RightOutlined />} onClick={() => { setCurrentFrame(totalFrames); setRedLineFrame(totalFrames); }} title="跳至尾帧" />
          </Space>

          {/* Play/Pause & Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 20, padding: '2px 12px', border: '1px solid #e2e8f0' }}>
            <Button type="text" icon={<StepBackwardOutlined />} onClick={() => {
              const prev = Math.max(0, currentFrame - 10);
              setCurrentFrame(prev);
              setRedLineFrame(prev);
            }} title="后退10帧" />

            <Button
              type="primary"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={handleTogglePlay}
              style={{
                borderRadius: '50%',
                width: 32,
                height: 32,
                minWidth: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2563eb'
              }}
            />

            <Button type="text" icon={<StepForwardOutlined />} onClick={() => {
              const next = Math.min(totalFrames, currentFrame + 10);
              setCurrentFrame(next);
              setRedLineFrame(next);
            }} title="前进10帧" />

            <Divider orientation="vertical" style={{ height: 14, margin: '0 4px' }} />

            <Select
              value={playbackSpeed}
              onChange={setPlaybackSpeed}
              size="small"
              variant="borderless"
              style={{ width: 65, fontSize: 11 }}
              options={[
                { value: 0.5, label: '0.5x' },
                { value: 1.0, label: '1.0x' },
                { value: 1.5, label: '1.5x' },
                { value: 2.0, label: '2.0x' },
              ]}
            />
          </div>

          <Space size={6} style={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              style={{
                background: '#f9f0ff',
                borderColor: '#d3adf7',
                color: '#722ed1',
                borderRadius: 4,
                fontSize: 12
              }}
              onClick={() => message.success('📋 已根据当前步骤生成动作模版！')}
            >
              生成标注模版
            </Button>
            <Button
              size="small"
              type="primary"
              style={{ borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#2563eb' }}
              onClick={() => message.success(`🎉 恭喜！数据序号 ${episodeId} 标注完成并已提交！`)}
            >
              完成标注(T)
            </Button>
            <Button
              size="small"
              style={{
                background: '#fff2e8',
                borderColor: '#ffbb96',
                color: '#d48806',
                borderRadius: 4,
                fontSize: 12
              }}
              onClick={() => message.warning('⚠️ 已标记为质检不合格')}
            >
              质检不合格
            </Button>
            <Button
              size="small"
              style={{
                background: '#f6ffed',
                borderColor: '#b7eb8f',
                color: '#52c41a',
                borderRadius: 4,
                fontSize: 12
              }}
              onClick={() => message.success('✅ 抽检通过')}
            >
              抽检通过
            </Button>
            <Button
              size="small"
              danger
              style={{ borderRadius: 4, fontSize: 12 }}
              onClick={() => message.error('❌ 抽检不通过')}
            >
              抽检不通过
            </Button>
          </Space>
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
                      <li><strong>左侧（flex: 1.3）</strong>：四相机多视角视频矩阵同步播放区。</li>
                      <li><strong>右侧（flex: 1.2）</strong>：动作步骤管理、操作手柄录制、多选批量操作区。</li>
                      <li><strong>底部（固定高度）</strong>：动态录制 HUD 横幅 + 播放进度条 + 多彩动作时序轴 + 播放控制器。</li>
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
            }
          ]}
        />
      </Drawer>

    </div>
  );
}
