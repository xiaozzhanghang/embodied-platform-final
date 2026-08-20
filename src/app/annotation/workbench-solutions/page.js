'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Tag, Space, Typography, App, Divider, Select, 
  Input, Row, Col, Progress, Tooltip, InputNumber, Slider, Checkbox
} from 'antd';
import { 
  LeftOutlined, RightOutlined, PlayCircleOutlined, PauseOutlined, 
  StepBackwardOutlined, StepForwardOutlined, DeleteOutlined, 
  PlusOutlined, CopyOutlined, CheckOutlined,
  HolderOutlined, CheckSquareOutlined
} from '@ant-design/icons';

function WorkbenchSolutionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const instanceId = searchParams.get('instanceId') || '19884';
  const episodeId = searchParams.get('episodeId') || '744108';
  const annoType = searchParams.get('type') || '范围标注';

  // Video playback & Timecode state (标准单轮 900 帧 / 30秒)
  const totalFrames = 900; 
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(120);
  const [redLineFrame, setRedLineFrame] = useState(120);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTimerRef = useRef(null);
  const timelineRef = useRef(null);

  // =========================================================================
  // STATE: 动作步骤 (支持单步复制 & 多选批量复制 & 鼠标拖拽换位 & 时间轴联动)
  // =========================================================================
  const [shortSteps, setShortSteps] = useState([
    { id: 1, text: '双手抓取纸箱并开箱定位', startFrame: 0, endFrame: 200, color: '#13c2c2', arm: '双手' },
    { id: 2, text: '右手取底部泡沫垫并放入纸箱', startFrame: 201, endFrame: 400, color: '#722ed1', arm: '右手' },
    { id: 3, text: '右手抓取核心金属支架入箱', startFrame: 401, endFrame: 600, color: '#1890ff', arm: '右手' },
    { id: 4, text: '双手折叠合拢箱盖并封箱', startFrame: 601, endFrame: 750, color: '#52c41a', arm: '双手' },
  ]);
  const [shortSelectedId, setShortSelectedId] = useState(1);
  const [draggedStepIdx, setDraggedStepIdx] = useState(null);
  const [dragOverStepIdx, setDragOverStepIdx] = useState(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]); // 多选勾选的步骤 IDs
  const [activeTabKey, setActiveTabKey] = useState('1');

  // Live Step Recording State (点击开始[Q]后开启实时延展录制，点击标记[R]结束)
  const [isRecordingStepId, setIsRecordingStepId] = useState(null);
  const isRecordingStepIdRef = useRef(null);

  // Red Line Playhead State & Mouse Dragging Handlers
  const isDraggingRedLineRef = useRef(false);
  const [isDraggingRedLine, setIsDraggingRedLine] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRedLineRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const frame = Math.round(pct * totalFrames);
        setRedLineFrame(frame);
        setCurrentFrame(frame);

        // 鼠标拖动红线时，自动选中光标所在区间的步骤
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

  // Playback timer simulation (30 FPS, 33ms interval)
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

          // 核心反应：如果正在录制当前步骤，时间轴上的步骤色块伴随红线动态向右实时伸展！
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

  // Multi-select Batch Handlers (多选步骤批量复制 / 批量删除)
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

    // 检查剩余帧数是否足够
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
        id: shortSteps.length + idx + 1,
        text: `${step.text} (批量复制)`,
        startFrame: start,
        endFrame: end,
        color: step.color,
        arm: step.arm
      };
    });

    const updated = [...shortSteps, ...clonedSteps];
    const reindexed = updated.map((s, idx) => ({ ...s, id: idx + 1 }));
    setShortSteps(reindexed);
    setSelectedBatchIds([]);
    setShortSelectedId(shortSteps.length + 1);
    message.success(`✨ 批量复制成功：已追加 ${stepsToCopy.length} 个步骤（开始帧为上一步结束帧+1，帧总数一致）！`);
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

  // Copy Single Step (单步复制: 帧总数为复制步骤的帧总数，开始帧为上一步结束帧+1)
  const handleCopySingleStep = (step) => {
    const dur = Math.max(1, step.endFrame - step.startFrame);
    const currentTotalSpan = shortSteps.reduce((sum, s) => sum + Math.max(1, s.endFrame - s.startFrame), 0);

    // 检查剩余帧数是否足够
    if (currentTotalSpan + dur > totalFrames) {
      message.warning(`⚠️ 视频剩余帧数不足（当前已占用 ${currentTotalSpan} 帧 / 总上限 ${totalFrames} 帧，复制需要 ${dur} 帧），帧数不够不可以复制！`);
      return;
    }

    const targetIdx = shortSteps.findIndex(s => s.id === step.id);
    const newStart = step.endFrame + 1;
    const newEnd = newStart + dur;
    const newStep = {
      id: Date.now(),
      text: `${step.text} (复制)`,
      startFrame: newStart,
      endFrame: newEnd,
      color: step.color,
      arm: step.arm
    };
    const updated = [...shortSteps];
    updated.splice(targetIdx + 1, 0, newStep);
    const reindexed = updated.map((s, idx) => ({ ...s, id: idx + 1 }));
    const synced = realignStepTimeframes(reindexed, shortSteps[0]?.startFrame || 0);
    setShortSteps(synced);
    setShortSelectedId(targetIdx + 2);
    message.success(`📄 已就地复制单步「${step.text}」，开始帧为 [${newStart}]，帧总数为 [${dur}]！`);

    // 自动平滑滚动定位到新增加的步骤
    setTimeout(() => {
      const el = document.getElementById(`step-card-${targetIdx + 2}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Helper: 按步骤时长顺序顺延对齐帧数区间，确保时间轴色块同步换位，每步开始帧为上一步结束帧+1，帧总数严格保持
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

  // Start [Q] & End/Mark [R] Frame Handlers
  const handleSetStartFrame = () => {
    if (!shortSelectedId) {
      message.warning('请先在右侧点击选中一个动作步骤');
      return;
    }
    const currentStep = shortSteps.find(s => s.id === shortSelectedId);
    if (!currentStep) return;

    // 开启实时录制模式
    isRecordingStepIdRef.current = shortSelectedId;
    setIsRecordingStepId(shortSelectedId);

    const updated = shortSteps.map(s => 
      s.id === shortSelectedId ? { ...s, startFrame: currentFrame, endFrame: Math.max(currentFrame + 1, currentFrame + 5) } : s
    );
    setShortSteps(updated);
    
    // 如果播放已到末尾，重置到起始帧并自动开启流畅播放
    if (currentFrame >= totalFrames) {
      setCurrentFrame(0);
      setRedLineFrame(0);
    }
    setIsPlaying(true);
    message.success(`🔵 步骤 #${shortSelectedId}「${currentStep.text}」已在 [${currentFrame} 帧] 开始实时录制！时间轴色块正在随播放动态延展...`);
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

    // 结束实时录制模式并暂停视频
    isRecordingStepIdRef.current = null;
    setIsRecordingStepId(null);
    setIsPlaying(false);

    const updated = shortSteps.map(s => 
      s.id === shortSelectedId ? { ...s, endFrame: currentFrame } : s
    );
    setShortSteps(updated);
    message.success(`✅ 步骤 #${shortSelectedId}「${currentStep.text}」录制完成！区间已锁定为 [${currentStep.startFrame} - ${currentFrame} 帧]（总计: ${currentFrame - currentStep.startFrame} 帧）`);
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentFrame >= totalFrames) {
      setCurrentFrame(0);
      setRedLineFrame(0);
    }
    setIsPlaying(p => !p);
  };

  // Keyboard shortcut listener (Q: 开始, R: 结束/标记, T: 完成标注, Space: 播放/暂停)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.match(/INPUT|TEXTAREA/)) return;

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleSetStartFrame();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSetEndFrame();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        message.success('🎉 恭喜！数据序号 744108 标注完成并已提交！');
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrame, shortSelectedId, shortSteps, isPlaying]);

  // Drag & Drop Step Handlers (鼠标按住直接拖拽换位，时间轴同步联动换位)
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

    // 同步重算起始帧，让底部时间轴色块瞬间完成换位
    const synced = realignStepTimeframes(updated, shortSteps[0]?.startFrame || 0);
    setShortSteps(synced);
    setShortSelectedId(targetIdx + 1);
    setDraggedStepIdx(null);
    message.success(`🎯 拖拽调换成功：时间轴上「${draggedItem.text}」已同步移至第 ${targetIdx + 1} 区段！`);
  };

  const formatTime = (frame) => {
    const sec = Math.floor(frame / 30);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const ms = Math.floor((frame % 30) * 33.33);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  // Render camera video viewport canvas
  const renderGridContent = (camKey) => {
    const camNames = {
      camera_head_left_color: { title: '主视角 RGB (Top Head)', color: '#0284c7', bg: '#f0f9ff' },
      camera_head_right_color: { title: '辅助右视 (Head Right)', color: '#7c3aed', bg: '#f5f3ff' },
      camera_hand_left_color: { title: '左机械臂腕部 (Wrist L)', color: '#059669', bg: '#ecfdf5' },
      camera_hand_right_color: { title: '右机械臂腕部 (Wrist R)', color: '#d97706', bg: '#fffbeb' }
    };
    const info = camNames[camKey] || { title: camKey, color: '#0284c7', bg: '#f8fafc' };

    // Dynamic bounding box motion simulation
    const motionX = 30 + ((currentFrame * 7) % 40);
    const motionY = 35 + ((currentFrame * 5) % 30);

    return (
      <div style={{ flex: 1, background: info.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
        {/* Dynamic Scan/Grid Overlay when playing */}
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

        {/* Live Tracking Crosshair Box */}
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

        {/* Center Playhead Status */}
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

        {/* Top Status Tag */}
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
        
        {/* ========================================================================= */}
        {/* TOP HEADER: CLEAN WORKBENCH TITLE & TASK METADATA */}
        {/* ========================================================================= */}
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
              onClick={() => router.push('/annotation/audit')}
            >
              返回列表
            </Button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
              test_job_{annoType} (标注工作台)
            </span>
            <Divider orientation="vertical" style={{ height: 16, borderColor: '#cbd5e1' }} />
            <Space size={12} style={{ fontSize: 12, color: '#64748b' }}>
              <span>任务ID: <strong style={{ color: '#0f172a' }}>8751</strong></span>
              <span>实例ID: <strong style={{ color: '#0f172a' }}>{instanceId}</strong></span>
              <span>数据序号: <strong style={{ color: '#0f172a' }}>{episodeId}</strong></span>
            </Space>
          </Space>

          <Space size={8}>
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => message.success('工作进度已保存')}>
              保存标注
            </Button>
          </Space>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: LEFT 4-CAMERAS (1.5) + RIGHT ACTION PANELS (1.0) */}
        {/* ========================================================================= */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '10px 14px', gap: 12 }}>
          
          {/* LEFT 4-CAMERA VIEWPORT */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8 }}>
              {/* Grid 1 */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#0284c7' }}>● camera_head_left_color (主视角)</span>
                  <Tag color="blue" style={{ fontSize: 9, margin: 0 }}>CAM 01</Tag>
                </div>
                {renderGridContent('camera_head_left_color')}
              </div>

              {/* Grid 2 */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>● camera_head_right_color (辅助视)</span>
                  <Tag color="purple" style={{ fontSize: 9, margin: 0 }}>CAM 02</Tag>
                </div>
                {renderGridContent('camera_head_right_color')}
              </div>

              {/* Grid 3 */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>● camera_hand_left_color (左机械臂)</span>
                  <Tag color="green" style={{ fontSize: 9, margin: 0 }}>CAM 03</Tag>
                </div>
                {renderGridContent('camera_hand_left_color')}
              </div>

              {/* Grid 4 */}
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
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
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

                {/* Header: Add Step & Batch Select */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>
                      动作模版步骤 ({shortSteps.length})
                    </span>
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
                  </div>

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
                        text: '新自定义动作步骤',
                        startFrame: currentFrame,
                        endFrame: Math.min(totalFrames, currentFrame + 100),
                        color: '#eab308',
                        arm: '双手'
                      };
                      setShortSteps([...shortSteps, newStep]);
                      setShortSelectedId(newStep.id);
                      message.success('已新增动作步骤');
                    }}
                    style={{ fontSize: 11 }}
                  >
                    增加步骤
                  </Button>
                </div>

                {/* STICKY BATCH ACTIONS BAR (当勾选步骤时浮现) */}
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

                {/* Steps List with [📄 复制单步] & [📋 多选批量复制] & [⠿ 拖拽换位] feature */}
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
                          borderTop: isDragOver ? '3px solid #2563eb' : undefined,
                          borderRadius: 8,
                          background: isDragOver ? '#eff6ff' : isBatchChecked ? '#f0f9ff' : isSelected ? '#f8faff' : '#ffffff',
                          opacity: 1,
                          padding: '8px 10px',
                          cursor: 'grab',
                          transform: isDragOver ? 'scale(1.01)' : 'none',
                          boxShadow: isDragOver ? '0 4px 12px rgba(37, 99, 235, 0.2)' : isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Title + Action Toolbar: Checkbox, Drag Grip, Copy Single Step & Delete */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                            {/* ☑️ MULTI-SELECT CHECKBOX */}
                            <Checkbox 
                              checked={isBatchChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleBatchSelect(step.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />

                            {/* ⠿ DRAG HANDLE */}
                            <Tooltip title="按住拖动可直接调换步骤位置">
                              <HolderOutlined style={{ color: isSelected ? '#2563eb' : '#94a3b8', cursor: 'grab', fontSize: 13 }} />
                            </Tooltip>

                            <span style={{ fontSize: 11, fontWeight: 'bold', color: isSelected ? '#1d4ed8' : '#64748b', background: isSelected ? '#dbeafe' : '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <Input 
                              size="small"
                              value={step.text}
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={e => {
                                const updated = shortSteps.map(s => s.id === step.id ? { ...s, text: e.target.value } : s);
                                setShortSteps(updated);
                              }}
                              style={{ fontSize: 11, fontWeight: isSelected ? 600 : 400, background: '#fff', color: '#0f172a' }}
                            />
                          </div>
                          <Space size={3} style={{ flexShrink: 0, marginLeft: 6 }}>
                            {/* 📄 COPY SINGLE STEP BUTTON */}
                            <Tooltip title="复制此单步：在下方立即克隆一个相同动作，方便重试或多次调整">
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
                            </Tooltip>

                            {/* 🗑️ DELETE STEP BUTTON */}
                            <Tooltip title="删除步骤">
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
                            </Tooltip>
                          </Space>
                        </div>

                        {/* Numeric Inputs */}
                        <Row gutter={6}>
                          <Col span={8}>
                            <div style={{ fontSize: 9, color: '#64748b' }}>起始帧</div>
                            <InputNumber 
                              size="small" 
                              value={step.startFrame} 
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{ width: '100%', fontSize: 11 }}
                              onChange={val => {
                                const updated = shortSteps.map(s => s.id === step.id ? { ...s, startFrame: val } : s);
                                setShortSteps(updated);
                              }}
                            />
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: 9, color: '#64748b' }}>结束帧</div>
                            <InputNumber 
                              size="small" 
                              value={step.endFrame} 
                              style={{ width: '100%', fontSize: 11 }}
                              onChange={val => {
                                const updated = shortSteps.map(s => s.id === step.id ? { ...s, endFrame: val } : s);
                                setShortSteps(updated);
                              }}
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
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM TIMELINE & PLAYBAR */}
        {/* ========================================================================= */}
        <div className="ui-action-footer" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '8px 20px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          
          {/* Dedicated Playback Axis (播放轴) */}
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

          {/* Live Recording HUD Banner (点击开始[Q]后实时展现醒目科技蓝反应) */}
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
                  🔵 步骤 #{isRecordingStepId}「{shortSteps.find(s => s.id === isRecordingStepId)?.text}」正在实时录制
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
                  title={`${String(step.id).padStart(2, '0')}. ${step.text} [${step.startFrame} - ${step.endFrame} 帧] (点击选中并定位)`}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isRecording ? (
                      <>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                        <span>🔵 REC #{step.id} ({step.endFrame - step.startFrame}f)</span>
                      </>
                    ) : (
                      <span>{String(step.id).padStart(2, '0')}. {step.text}</span>
                    )}
                  </span>
                </div>
              );
            })}

            {/* Ultra-Prominent Glowing Red Playhead line & top frame pin (支持鼠标按住随意左右拖动) */}
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
              title={`🔴 标注游标: ${redLineFrame} 帧 (在时间轴上点击或按住鼠标可左右自由拖动)`}
            >
              {/* Top Frame Tag */}
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

              {/* Triangle Pin */}
              <div style={{ 
                width: 0, 
                height: 0, 
                borderLeft: '6px solid transparent', 
                borderRight: '6px solid transparent', 
                borderTop: '8px solid #ff1e1e', 
                filter: 'drop-shadow(0 2px 4px rgba(255,30,30,0.9))', 
                cursor: isDraggingRedLine ? 'grabbing' : 'grab' 
              }} />

              {/* Super-Visible 3px Solid Red Glowing Laser Line */}
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

          {/* Bottom Player Controller Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <Space size={14} align="center">
              <Button type="text" icon={<LeftOutlined />} onClick={() => { setCurrentFrame(0); setRedLineFrame(0); }} title="跳至首帧" />
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' }}>
                ⏱️ {formatTime(currentFrame)} / 00:00:30.000
              </div>
              <Button type="text" icon={<RightOutlined />} onClick={() => { setCurrentFrame(totalFrames); setRedLineFrame(totalFrames); }} title="跳至尾帧" />
            </Space>

            {/* Play/Pause & Speed Controller */}
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

            {/* Right: Action Buttons (完成标注 & 质检/抽检操作) */}
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
                onClick={() => message.success('🎉 恭喜！数据序号 744108 标注完成并已提交！')}
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

      </div>
  );
}

export default function WorkbenchSolutionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>加载具身智能标注工作台中...</div>}>
      <WorkbenchSolutionsContent />
    </Suspense>
  );
}
