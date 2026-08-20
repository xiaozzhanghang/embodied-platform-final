'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Tag, Space, Typography, App, Badge, Divider, Select, 
  Input, Row, Col, Progress, Switch, Tooltip, Radio, Card, List, Form, Modal, InputNumber, Slider, Alert
} from 'antd';
import { 
  CloseOutlined, CloseCircleOutlined, SearchOutlined, ReloadOutlined, AuditOutlined, EyeOutlined,
  CheckCircleOutlined, CheckCircleFilled, FullscreenOutlined, FullscreenExitOutlined, PlayCircleOutlined, 
  CheckOutlined, InfoCircleOutlined, VideoCameraOutlined, LeftOutlined, RightOutlined, PauseOutlined, 
  StepBackwardOutlined, StepForwardOutlined, UndoOutlined, DeleteOutlined, SettingOutlined, 
  ClockCircleOutlined, NodeIndexOutlined, PlusOutlined, EditOutlined, ArrowRightOutlined, 
  SlidersOutlined, DoubleLeftOutlined, DoubleRightOutlined, CopyOutlined, ThunderboltOutlined,
  BranchesOutlined, RocketOutlined, CodeOutlined, FireOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { StatusTag } from '@/components/ui';

const { Text, Paragraph } = Typography;
const { Option } = Select;

// Standard SOP steps
const SOP_CYCLE_TEMPLATE = [
  { text: '双手抓取纸箱并开箱定位', arm: '双手', skill: '折叠定位', defaultDur: 300, color: '#13c2c2' },
  { text: '右手取底部泡沫垫并放入纸箱', arm: '右手', skill: '抓取放置', defaultDur: 300, color: '#722ed1' },
  { text: '右手抓取核心金属支架入箱', arm: '右手', skill: '精密装配', defaultDur: 350, color: '#1890ff' },
  { text: '双手折叠合拢箱盖并封箱', arm: '双手', skill: '封盖封箱', defaultDur: 250, color: '#52c41a' },
];

function WorkbenchSolutionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const instanceId = searchParams.get('instanceId') || '19884';
  const episodeId = searchParams.get('episodeId') || '744108';
  const annoType = searchParams.get('type') || '范围标注';
  const workMode = searchParams.get('mode') || 'annotate';

  // 3 Interactive Solution Switcher: 'solution_1' | 'solution_2' | 'solution_3'
  const [activeSolution, setActiveSolution] = useState('solution_2');

  // Video playback & Timecode state
  const totalFrames = 108000; // 1 hour @ 30 FPS = 108,000 frames
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(14400); // 8 minutes (14400 frames)
  const [redLineFrame, setRedLineFrame] = useState(14400);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTimerRef = useRef(null);
  const timelineRef = useRef(null);

  // Playback timer simulation
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= totalFrames) {
            setIsPlaying(false);
            return totalFrames;
          }
          const next = Math.min(totalFrames, prev + Math.floor(15 * playbackSpeed));
          setRedLineFrame(next);
          return next;
        });
      }, 100);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Viewport camera grid state
  const [gridCameras, setGridCameras] = useState({
    grid1: 'camera_head_left_color',
    grid2: 'camera_head_right_color',
    grid3: 'camera_hand_left_color',
    grid4: 'camera_hand_right_color'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenCamera, setFullscreenCamera] = useState('camera_head_left_color');
  const [activeTabKey, setActiveTabKey] = useState('1');

  // ==========================================
  // STATE FOR SOLUTION 1: 整组循环复制与智能吸附
  // ==========================================
  const [s1Steps, setS1Steps] = useState([
    { id: 1, cycle: 1, text: '双手抓取纸箱并开箱定位', startFrame: 0, endFrame: 300, color: '#13c2c2' },
    { id: 2, cycle: 1, text: '右手取底部泡沫垫并放入纸箱', startFrame: 301, endFrame: 600, color: '#722ed1' },
    { id: 3, cycle: 1, text: '右手抓取核心金属支架入箱', startFrame: 601, endFrame: 950, color: '#1890ff' },
    { id: 4, cycle: 1, text: '双手折叠合拢箱盖并封箱', startFrame: 951, endFrame: 1200, color: '#52c41a' },
    { id: 5, cycle: 2, text: '双手抓取纸箱并开箱定位', startFrame: 1300, endFrame: 1600, color: '#13c2c2' },
    { id: 6, cycle: 2, text: '右手取底部泡沫垫并放入纸箱', startFrame: 1601, endFrame: 1900, color: '#722ed1' },
    { id: 7, cycle: 2, text: '右手抓取核心金属支架入箱', startFrame: 1901, endFrame: 2250, color: '#1890ff' },
    { id: 8, cycle: 2, text: '双手折叠合拢箱盖并封箱', startFrame: 2251, endFrame: 2500, color: '#52c41a' },
  ]);
  const [s1SelectedId, setS1SelectedId] = useState(1);

  const handleS1DuplicateCycle = () => {
    const currentMaxCycle = Math.max(...s1Steps.map(s => s.cycle || 1), 1);
    const nextCycle = currentMaxCycle + 1;
    const baseStart = redLineFrame || currentFrame;
    let runningStart = baseStart;

    const newCycleSteps = SOP_CYCLE_TEMPLATE.map((tpl, idx) => {
      const stepStart = runningStart;
      const stepEnd = stepStart + tpl.defaultDur;
      runningStart = stepEnd + 1;
      return {
        id: s1Steps.length + idx + 1,
        cycle: nextCycle,
        text: tpl.text,
        startFrame: stepStart,
        endFrame: stepEnd,
        color: tpl.color
      };
    });

    setS1Steps([...s1Steps, ...newCycleSteps]);
    setS1SelectedId(s1Steps.length + 1);
    message.success(`✨ 已成功复制第 ${nextCycle} 轮循环组 (4个动作步骤)，起始帧已吸附至 [${baseStart} 帧]！`);
  };

  // ==========================================
  // STATE FOR SOLUTION 2: 实时流式快捷键打点接龙 (节拍器)
  // ==========================================
  const [s2Steps, setS2Steps] = useState([
    { id: 1, cycle: 1, text: '双手抓取纸箱并开箱定位', startFrame: 13200, endFrame: 13500, color: '#13c2c2' },
    { id: 2, cycle: 1, text: '右手取底部泡沫垫并放入纸箱', startFrame: 13501, endFrame: 13800, color: '#722ed1' },
    { id: 3, cycle: 1, text: '右手抓取核心金属支架入箱', startFrame: 13801, endFrame: 14100, color: '#1890ff' },
  ]);
  const [s2CurrentStepIdx, setS2CurrentStepIdx] = useState(3); // currently recording step 4
  const [s2CycleCount, setS2CycleCount] = useState(1);
  const [s2StepStartFrame, setS2StepStartFrame] = useState(14101);

  const handleS2StampCut = () => {
    const currentTpl = SOP_CYCLE_TEMPLATE[s2CurrentStepIdx];
    const stampedEnd = currentFrame;

    if (stampedEnd <= s2StepStartFrame) {
      message.warning('当前切断帧必须大于起始帧，请先让视频播放或快进几秒！');
      return;
    }

    const newStepItem = {
      id: s2Steps.length + 1,
      cycle: s2CycleCount,
      text: currentTpl.text,
      startFrame: s2StepStartFrame,
      endFrame: stampedEnd,
      color: currentTpl.color
    };

    setS2Steps([...s2Steps, newStepItem]);

    // Advance to next step
    const nextIdx = (s2CurrentStepIdx + 1) % SOP_CYCLE_TEMPLATE.length;
    if (nextIdx === 0) {
      setS2CycleCount(c => c + 1);
      message.success(`🎉 恭喜！第 ${s2CycleCount} 轮完整循环打点封口，自动无缝开启第 ${s2CycleCount + 1} 轮！`);
    } else {
      message.info(`已打点完成「${currentTpl.text}」[${s2StepStartFrame} - ${stampedEnd} 帧]，接龙下一动作「${SOP_CYCLE_TEMPLATE[nextIdx].text}」`);
    }

    setS2CurrentStepIdx(nextIdx);
    setS2StepStartFrame(stampedEnd + 1);
  };

  // Keyboard shortcut listener for Solution 2
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeSolution === 'solution_2') {
        if (e.code === 'Space' && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
          e.preventDefault();
          handleS2StampCut();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSolution, currentFrame, s2StepStartFrame, s2CurrentStepIdx, s2CycleCount, s2Steps]);

  // ==========================================
  // STATE FOR SOLUTION 3: 大循环两级拆解与批量注入
  // ==========================================
  const [s3MacroEpisodes, setS3MacroEpisodes] = useState([
    { id: 'ep_1', name: 'Episode 01', range: [0, 5400], status: '已注入模版' },
    { id: 'ep_2', name: 'Episode 02', range: [5401, 10800], status: '已注入模版' },
    { id: 'ep_3', name: 'Episode 03', range: [10801, 16200], status: '已注入模版' },
    { id: 'ep_4', name: 'Episode 04', range: [16201, 21600], status: '待注入' },
    { id: 'ep_5', name: 'Episode 05', range: [21601, 27000], status: '待注入' },
  ]);
  const [s3SelectedEp, setS3SelectedEp] = useState('ep_3');

  const handleS3BatchApply = () => {
    setS3MacroEpisodes(s3MacroEpisodes.map(ep => ({ ...ep, status: '已注入模版' })));
    message.success('🚀 已成功向 1 小时长视频的全部大循环 Episode 注入 4 动作 SOP 模版！');
  };

  // Active steps list based on selected solution
  const currentDisplayedSteps = activeSolution === 'solution_1' ? s1Steps : activeSolution === 'solution_2' ? s2Steps : SOP_CYCLE_TEMPLATE.map((st, i) => ({
    id: i + 1,
    cycle: 3,
    text: st.text,
    startFrame: 10801 + i * 1350,
    endFrame: 10801 + (i + 1) * 1350 - 1,
    color: st.color
  }));

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
      camera_hand_right_color: { title: '右机械臂腕部 (Wrist R)', color: '#d97706', bg: '#fffbeb' },
      joints: { title: '3D 关节仿真 (Joints Model)', color: '#2563eb', bg: '#eff6ff' }
    };
    const info = camNames[camKey] || { title: camKey, color: '#0284c7', bg: '#f8fafc' };

    return (
      <div style={{ flex: 1, background: info.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <PlayCircleOutlined style={{ fontSize: 32, opacity: 0.45, color: info.color, marginBottom: 4 }} />
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
          {info.title} (帧: {currentFrame})
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
        
        {/* ========================================================================= */}
        {/* TOP HEADER (Exact match with /annotation/audit/[id]/[episodeId] + Solution Switcher) */}
        {/* ========================================================================= */}
        <div style={{ 
          background: '#fff', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '10px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space size={16} align="center" style={{ flexWrap: 'wrap' }}>
              <Button 
                size="small" 
                icon={<LeftOutlined />} 
                onClick={() => router.push('/annotation/audit')}
              >
                返回列表
              </Button>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
                test_job_{annoType} (长视频循环标注交互方案演示)
              </span>
              <Divider orientation="vertical" style={{ height: 16, borderColor: '#cbd5e1' }} />
              
              {/* Status Badges */}
              <Space size={8}>
                <span style={{ fontSize: 11, color: '#64748b' }}>解析状态</span>
                <StatusTag status="已完成">解析完成</StatusTag>
                
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>质检状态</span>
                <StatusTag status="已通过">优秀</StatusTag>
              </Space>
            </Space>

            {/* THREE SOLUTIONS SWITCHER IN HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '4px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>切换交互方案：</span>
              <Radio.Group 
                value={activeSolution} 
                onChange={e => setActiveSolution(e.target.value)}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="solution_1">
                  <Space size={4}><CopyOutlined /> 方案一：整组循环复制</Space>
                </Radio.Button>
                <Radio.Button value="solution_2">
                  <Space size={4}><ThunderboltOutlined style={{ color: '#ca8a04' }} /> 方案二：流式快捷打点(最推荐)</Space>
                </Radio.Button>
                <Radio.Button value="solution_3">
                  <Space size={4}><BranchesOutlined /> 方案三：大循环两级拆解</Space>
                </Radio.Button>
              </Radio.Group>
            </div>

            {/* Action buttons */}
            <Space>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => message.success('标注工作进度已保存')}>
                保存标注
              </Button>
            </Space>
          </div>

          {/* Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b' }}>
            <Space size={20}>
              <span>任务ID: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>8751</strong></span>
              <span>实例ID: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{instanceId}</strong></span>
              <span>数据序号: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{episodeId}</strong></span>
              <span>总视频规格: <strong style={{ color: '#0284c7' }}>01:00:00 (108,000 帧 / 30 FPS / 4 路相机)</strong></span>
            </Space>
          </div>

          {/* Interactive Step-by-Step Operation Guide Bar */}
          <div style={{ 
            marginTop: 4, 
            background: activeSolution === 'solution_1' ? '#eff6ff' : activeSolution === 'solution_2' ? '#fefce8' : '#f0fdf4',
            border: `1px solid ${activeSolution === 'solution_1' ? '#bfdbfe' : activeSolution === 'solution_2' ? '#fef08a' : '#bbf7d0'}`,
            borderRadius: 6, 
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12
          }}>
            {activeSolution === 'solution_1' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1e40af', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>📋【方案一·操作三步法】：</span>
                <span><strong>第①步：</strong>拖动下方播放轴或点击时间轴，将游标移到下一轮动作起点 (如 14400 帧)</span>
                <span>&rarr; <strong>第②步：</strong>点击右侧栏蓝色按钮 <strong>「✨ 复制整组循环至当前游标」</strong></span>
                <span>&rarr; <strong>第③步：</strong>瞬间自动生成 4 个步骤，自动继承手爪/技能，无需新建！</span>
              </div>
            )}
            {activeSolution === 'solution_2' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#854d0e', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>⚡【方案二·操作三步法 (最推荐)】：</span>
                <span><strong>第①步：</strong>点击底部「播放」视频 (可开 1.5x 倍速)</span>
                <span>&rarr; <strong>第②步：</strong>眼睛看视频，当看到当前动作做完的瞬间，<strong>敲一下键盘【空格键 Space】</strong> (或点右侧大按钮)</span>
                <span>&rarr; <strong>第③步：</strong>系统自动把当前帧切断作为上一动作终点，并自动开启下一步，全程 0 敲字！</span>
              </div>
            )}
            {activeSolution === 'solution_3' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#166534', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>🌳【方案三·操作三步法】：</span>
                <span><strong>第①步：</strong>在 1 小时长视频宏观轴上标记出 20 次大循环的大断点 (Episode 1~20)</span>
                <span>&rarr; <strong>第②步：</strong>点击右侧绿色 <strong>「🚀 批量向所有大循环注入 SOP 模版」</strong> 按钮</span>
                <span>&rarr; <strong>第③步：</strong>全量 20 个大循环内部的 80 个原子步骤自动等比例全部生成！</span>
              </div>
            )}
            <Tag color={activeSolution === 'solution_1' ? 'blue' : activeSolution === 'solution_2' ? 'gold' : 'green'} style={{ margin: 0, fontWeight: 600 }}>
              {activeSolution === 'solution_1' ? '复制模式' : activeSolution === 'solution_2' ? '节拍器打点模式' : '大循环拆解模式'}
            </Tag>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: LEFT VIEWPORT (1.6) + RIGHT PANELS (1.0) */}
        {/* ========================================================================= */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '10px 14px', gap: 12 }}>
          
          {/* LEFT 4-CAMERA VIEWPORT */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 10 }}>
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

          {/* RIGHT COLUMN: INTERACTIVE PANELS WITH THE 3 SOLUTIONS */}
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

            {/* TAB 1 CONTENT: DYNAMIC PER SOLUTION */}
            <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
              
              {/* ========================================================================= */}
              {/* SOLUTION 1 RIGHT PANEL: 整组循环一键复制 */}
              {/* ========================================================================= */}
              {activeSolution === 'solution_1' && (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12, padding: '6px 10px', fontSize: 11 }}
                    message={<span style={{ fontWeight: 600 }}>方案一：点击「✨ 复制当前循环组」克隆整组 4 动作 SOP</span>}
                    description="新循环步骤自动生成，且起始帧自动吸附对齐当前播放器指针 [14,400 帧]，免去每次新建 4 个步骤的繁琐操作。"
                  />

                  {/* Duplicate Cycle Action Toolbar */}
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>SOP循环批处理</span>
                      <div style={{ fontSize: 11, color: '#3b82f6' }}>已标注 {Math.max(...s1Steps.map(s => s.cycle || 1))} 轮循环</div>
                    </div>
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={handleS1DuplicateCycle}
                      style={{ background: '#2563eb', fontWeight: 600, fontSize: 12 }}
                    >
                      ✨ 复制整组循环至当前游标
                    </Button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>
                      动作步骤明细 ({s1Steps.length})
                    </span>
                    <Space size={6}>
                      <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => message.info('添加单个自定义步骤')}>
                        加单步
                      </Button>
                    </Space>
                  </div>

                  {/* S1 Steps List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                    {s1Steps.map((step) => {
                      const isSelected = s1SelectedId === step.id;
                      return (
                        <div
                          key={step.id}
                          onClick={() => setS1SelectedId(step.id)}
                          style={{
                            border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            borderLeft: `5px solid ${step.color}`,
                            borderRadius: 6,
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            padding: '8px 10px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Space size={6}>
                              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>第 {step.cycle || 1} 轮</Tag>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{String(step.id).padStart(2, '0')}. {step.text}</span>
                            </Space>
                            <Tag color="default" style={{ margin: 0, fontSize: 10 }}>
                              {step.startFrame} - {step.endFrame} 帧
                            </Tag>
                          </div>
                          <Row gutter={6}>
                            <Col span={12}>
                              <InputNumber size="small" value={step.startFrame} style={{ width: '100%', fontSize: 11 }} />
                            </Col>
                            <Col span={12}>
                              <InputNumber size="small" value={step.endFrame} style={{ width: '100%', fontSize: 11 }} />
                            </Col>
                          </Row>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SOLUTION 2 RIGHT PANEL: 流式快捷键打点接龙 (节拍器) */}
              {/* ========================================================================= */}
              {activeSolution === 'solution_2' && (
                <div>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12, padding: '6px 10px', fontSize: 11 }}
                    message={<span style={{ fontWeight: 600 }}>方案二：播放视频时按【空格键 Space】实时打点切断并接龙</span>}
                    description="无需手动输入任何数字！看视频播放，每个动作完成时按一下空格，自动记录起止并切换到下一动作，循环无限接龙。"
                  />

                  {/* Metronome Live Punch HUD */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #e2e8f0',
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>实时追踪节拍</span>
                      <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>第 {s2CycleCount} 轮循环 · 步骤 {s2CurrentStepIdx + 1}/4</Tag>
                    </div>

                    {/* Active Step Glow */}
                    <div style={{
                      background: '#eff6ff',
                      border: '2px dashed #3b82f6',
                      borderRadius: 6,
                      padding: '10px 12px',
                      marginBottom: 10
                    }}>
                      <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700 }}>
                        🔴 RECORDING (正在录制)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                        {SOP_CYCLE_TEMPLATE[s2CurrentStepIdx].text}
                      </div>
                      <div style={{ fontSize: 11, color: '#0284c7', marginTop: 4 }}>
                        起始: <strong>{s2StepStartFrame} 帧</strong> &rarr; 当前游标: <strong>{currentFrame} 帧</strong>
                      </div>
                    </div>

                    {/* Big Spacebar Punch Button */}
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleS2StampCut}
                      style={{
                        height: 44,
                        fontSize: 14,
                        fontWeight: 700,
                        background: '#2563eb',
                        borderColor: '#1d4ed8',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      ⚡ [ 按空格 Space 打点切断并接龙下一步 ]
                    </Button>
                  </div>

                  {/* History Stamped Log */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>
                      已打点生成队列 ({s2Steps.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                    {s2Steps.map((step) => (
                      <div key={step.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${step.color}`
                      }}>
                        <span style={{ fontSize: 11, color: '#1e293b', fontWeight: 500 }}>
                          {String(step.id).padStart(2, '0')}. {step.text}
                        </span>
                        <Tag color="green" style={{ margin: 0, fontSize: 10 }}>
                          {step.startFrame} - {step.endFrame} 帧
                        </Tag>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SOLUTION 3 RIGHT PANEL: 大循环两级拆解与批量模版套用 */}
              {/* ========================================================================= */}
              {activeSolution === 'solution_3' && (
                <div>
                  <Alert
                    type="success"
                    showIcon
                    style={{ marginBottom: 12, padding: '6px 10px', fontSize: 11 }}
                    message={<span style={{ fontWeight: 600 }}>方案三：宏观切大循环 Episode + 批量模版注入</span>}
                    description="先将 1 小时长视频切出若干个大循环，点击「批量注入 SOP 模版」即可自动生成全量内部子步骤。"
                  />

                  <Button
                    type="primary"
                    block
                    icon={<RocketOutlined />}
                    onClick={handleS3BatchApply}
                    style={{ background: '#16a34a', borderColor: '#16a34a', marginBottom: 12, height: 38, fontWeight: 600 }}
                  >
                    🚀 批量向所有大循环注入 SOP 模版
                  </Button>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                    大循环 (Episodes) 列表：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', marginBottom: 12 }}>
                    {s3MacroEpisodes.map(ep => (
                      <div
                        key={ep.id}
                        onClick={() => setS3SelectedEp(ep.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: s3SelectedEp === ep.id ? '#dcfce7' : '#f8fafc',
                          border: s3SelectedEp === ep.id ? '2px solid #16a34a' : '1px solid #e2e8f0'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 12, color: '#166534' }}>{ep.name}</strong>
                          <span style={{ marginLeft: 8, fontSize: 11, color: '#64748b' }}>[{ep.range[0]} - {ep.range[1]} 帧]</span>
                        </div>
                        <Tag color={ep.status.includes('已注入') ? 'green' : 'orange'} style={{ margin: 0, fontSize: 10 }}>
                          {ep.status}
                        </Tag>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    当前选中 Episode 内部 4 个子步骤分解：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SOP_CYCLE_TEMPLATE.map((st, i) => (
                      <div key={i} style={{ padding: '6px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{i + 1}. {st.text}</span>
                        <Tag color="cyan" style={{ margin: 0, fontSize: 9 }}>{st.arm}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM TIMELINE & PLAYBAR (Exact reproduction with multi-track display) */}
        {/* ========================================================================= */}
        <div className="ui-action-footer" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          
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

          {/* Action Steps Multi-Color Temporal Track */}
          <div 
            ref={timelineRef}
            style={{ position: 'relative', height: 26, background: '#e2e8f0', borderRadius: 4, cursor: 'pointer', overflow: 'visible' }}
            onClick={(e) => {
              if (timelineRef.current) {
                const rect = timelineRef.current.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                const target = Math.max(0, Math.min(totalFrames, Math.round(pct * totalFrames)));
                setRedLineFrame(target);
                setCurrentFrame(target);
              }
            }}
          >
            {currentDisplayedSteps.map((step) => {
              const isSelected = activeSolution === 'solution_1' ? s1SelectedId === step.id : false;
              const leftPct = (step.startFrame / totalFrames) * 100;
              const widthPct = Math.max(0.2, ((step.endFrame - step.startFrame) / totalFrames) * 100);

              return (
                <div
                  key={step.id}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: '100%',
                    top: 0,
                    background: step.color || '#2563eb',
                    opacity: isSelected ? 1 : 0.85,
                    borderRadius: 2,
                    border: isSelected ? '2px solid #0f172a' : 'none',
                    zIndex: isSelected ? 10 : 2,
                    boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                  title={`${step.text} [${step.startFrame} - ${step.endFrame} 帧]`}
                />
              );
            })}

            {/* Red Playhead line & cursor */}
            <div 
              style={{ 
                position: 'absolute', 
                left: `${(redLineFrame / totalFrames) * 100}%`, 
                top: -8, 
                height: '40px', 
                zIndex: 40, 
                cursor: 'grab', 
                transform: 'translateX(-50%)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            >
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #ef4444', filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.6))' }} />
              <div style={{ width: 2, flex: 1, background: '#ef4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }} />
            </div>
          </div>

          {/* Bottom Player Controller Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <Space size={14} align="center">
              <Button type="text" icon={<LeftOutlined />} onClick={() => { setCurrentFrame(0); setRedLineFrame(0); }} title="跳至首帧" />
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' }}>
                ⏱️ {formatTime(currentFrame)} / 01:00:00.000
              </div>
              <Button type="text" icon={<RightOutlined />} onClick={() => { setCurrentFrame(totalFrames); setRedLineFrame(totalFrames); }} title="跳至尾帧" />
            </Space>

            {/* Center Play/Pause & Speed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 20, padding: '4px 14px', border: '1px solid #e2e8f0' }}>
              <Button type="text" icon={<StepBackwardOutlined />} onClick={() => setCurrentFrame(Math.max(0, currentFrame - 30))} />
              <Button
                type="primary"
                icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ borderRadius: '50%', width: 34, height: 34, minWidth: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb' }}
              />
              <Button type="text" icon={<StepForwardOutlined />} onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 30))} />
              <Divider orientation="vertical" style={{ height: 16, margin: '0 4px' }} />
              <Select value={playbackSpeed} size="small" variant="borderless" style={{ width: 65 }} onChange={setPlaybackSpeed}>
                <Option value={1}>1.0x</Option>
                <Option value={1.5}>1.5x</Option>
                <Option value={2}>2.0x</Option>
                <Option value={4}>4.0x</Option>
              </Select>
            </div>

            <Space size={8}>
              <Tag color="cyan" style={{ fontSize: 11 }}>4路相机锁相同步</Tag>
              <Tag color="blue" style={{ fontSize: 11 }}>当前方案: {activeSolution === 'solution_1' ? '整组复制' : activeSolution === 'solution_2' ? '流式打点(推荐)' : '两级拆解'}</Tag>
            </Space>
          </div>

        </div>

      </div>
    </MainLayout>
  );
}

export default function WorkbenchSolutionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>正在加载工作台解决方案...</div>}>
      <WorkbenchSolutionsContent />
    </Suspense>
  );
}
