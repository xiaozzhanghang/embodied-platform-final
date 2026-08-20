'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Card, Tag, Divider, Row, Col, 
  Tooltip, Radio, Tabs, Slider, Progress, Badge, Alert, App,
  InputNumber, Modal, Table
} from 'antd';
import { 
  PlayCircleOutlined, PauseOutlined, StepBackwardOutlined, 
  StepForwardOutlined, CopyOutlined, ThunderboltOutlined,
  BranchesOutlined, VideoCameraOutlined, CheckCircleOutlined,
  ClockCircleOutlined, RocketOutlined, ReloadOutlined,
  PlusOutlined, DeleteOutlined, SwapOutlined, ArrowRightOutlined,
  SettingOutlined, CodeOutlined, FireOutlined, EyeOutlined,
  FullscreenOutlined, UndoOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;

// Preset SOP Template steps for demonstration
const SOP_CYCLE_TEMPLATE = [
  { id: 'step_1', name: '展开纸箱并封底', skill: '折叠', arm: '双手', object: '纸箱', defaultDuration: 300 },
  { id: 'step_2', name: '放入工厂核心部件', skill: '抓取放置', arm: '右手', object: '核心部件', defaultDuration: 400 },
  { id: 'step_3', name: '放入顶部泡沫缓冲垫', skill: '抓取放置', arm: '左手', object: '泡沫垫', defaultDuration: 250 },
  { id: 'step_4', name: '顶部折盖并胶带封箱', skill: '封盖', arm: '双手', object: '纸箱盖', defaultDuration: 350 },
];

const TOTAL_VIDEO_FRAMES = 108000; // 1 hour @ 30 FPS = 108,000 frames

export default function LongVideoWorkbenchPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // Active comparison solution: 'solution_1' | 'solution_2' | 'solution_3'
  const [activeSolution, setActiveSolution] = useState('solution_2');

  // Video playback simulation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(14400); // 8 minutes in (14400 frames)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTimerRef = useRef(null);

  // Synchronized simulation of playback
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= TOTAL_VIDEO_FRAMES) {
            setIsPlaying(false);
            return TOTAL_VIDEO_FRAMES;
          }
          return Math.min(TOTAL_VIDEO_FRAMES, prev + Math.floor(15 * playbackSpeed));
        });
      }, 100);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // ==========================================
  // STATE FOR SOLUTION 1: 整组循环复制与智能吸附
  // ==========================================
  const [s1Cycles, setS1Cycles] = useState([
    {
      cycleId: 1,
      name: '第 1 轮装箱循环',
      startFrame: 0,
      endFrame: 1300,
      steps: [
        { key: '1-1', name: '展开纸箱并封底', skill: '折叠', arm: '双手', object: '纸箱', start: 0, end: 300 },
        { key: '1-2', name: '放入工厂核心部件', skill: '抓取放置', arm: '右手', object: '核心部件', start: 301, end: 700 },
        { key: '1-3', name: '放入顶部泡沫缓冲垫', skill: '抓取放置', arm: '左手', object: '泡沫垫', start: 701, end: 950 },
        { key: '1-4', name: '顶部折盖并胶带封箱', skill: '封盖', arm: '双手', object: '纸箱盖', start: 951, end: 1300 }
      ]
    },
    {
      cycleId: 2,
      name: '第 2 轮装箱循环',
      startFrame: 1400,
      endFrame: 2700,
      steps: [
        { key: '2-1', name: '展开纸箱并封底', skill: '折叠', arm: '双手', object: '纸箱', start: 1400, end: 1700 },
        { key: '2-2', name: '放入工厂核心部件', skill: '抓取放置', arm: '右手', object: '核心部件', start: 1701, end: 2100 },
        { key: '2-3', name: '放入顶部泡沫缓冲垫', skill: '抓取放置', arm: '左手', object: '泡沫垫', start: 2101, end: 2350 },
        { key: '2-4', name: '顶部折盖并胶带封箱', skill: '封盖', arm: '双手', object: '纸箱盖', start: 2351, end: 2700 }
      ]
    }
  ]);

  const handleS1DuplicateCycle = () => {
    const nextCycleNum = s1Cycles.length + 1;
    const baseStart = currentFrame;
    let runningStart = baseStart;

    const newSteps = SOP_CYCLE_TEMPLATE.map((tpl, idx) => {
      const stepStart = runningStart;
      const stepEnd = stepStart + tpl.defaultDuration;
      runningStart = stepEnd + 1;
      return {
        key: `${nextCycleNum}-${idx + 1}`,
        name: tpl.name,
        skill: tpl.skill,
        arm: tpl.arm,
        object: tpl.object,
        start: stepStart,
        end: stepEnd
      };
    });

    const newCycle = {
      cycleId: nextCycleNum,
      name: `第 ${nextCycleNum} 轮装箱循环`,
      startFrame: baseStart,
      endFrame: runningStart - 1,
      steps: newSteps
    };

    setS1Cycles([...s1Cycles, newCycle]);
    message.success(`✨ 已成功复制第 ${nextCycleNum} 轮循环，起始帧已自动锚定至当前播放点 [${baseStart} 帧]`);
  };

  // ==========================================
  // STATE FOR SOLUTION 2: 实时流式快捷键打点 (节拍器)
  // ==========================================
  const [s2CurrentStepIdx, setS2CurrentStepIdx] = useState(0); // 0 to 3 in SOP_CYCLE_TEMPLATE
  const [s2CycleCount, setS2CycleCount] = useState(1);
  const [s2StepStartFrame, setS2StepStartFrame] = useState(14100);
  const [s2LoggedSteps, setS2LoggedSteps] = useState([
    { cycle: 1, step: '展开纸箱并封底', arm: '双手', start: 13200, end: 13500 },
    { cycle: 1, step: '放入工厂核心部件', arm: '右手', start: 13501, end: 13900 },
    { cycle: 1, step: '放入顶部泡沫缓冲垫', arm: '左手', start: 13901, end: 14100 },
  ]);

  const handleS2StampCut = () => {
    const currentTpl = SOP_CYCLE_TEMPLATE[s2CurrentStepIdx];
    const stampedEnd = currentFrame;

    if (stampedEnd <= s2StepStartFrame) {
      message.warning('当前切断帧必须大于起始帧，请先让视频播放或快进几秒！');
      return;
    }

    const newLogItem = {
      cycle: s2CycleCount,
      step: currentTpl.name,
      arm: currentTpl.arm,
      start: s2StepStartFrame,
      end: stampedEnd
    };

    setS2LoggedSteps([newLogItem, ...s2LoggedSteps]);

    // Advance to next step
    const nextIdx = (s2CurrentStepIdx + 1) % SOP_CYCLE_TEMPLATE.length;
    if (nextIdx === 0) {
      setS2CycleCount(c => c + 1);
      message.success(`🎉 恭喜！已完成第 ${s2CycleCount} 轮完整循环打点，自动无缝开启第 ${s2CycleCount + 1} 轮！`);
    } else {
      message.info(`已完成「${currentTpl.name}」[${s2StepStartFrame} - ${stampedEnd} 帧]，进入下一动作「${SOP_CYCLE_TEMPLATE[nextIdx].name}」`);
    }

    setS2CurrentStepIdx(nextIdx);
    setS2StepStartFrame(stampedEnd + 1);
  };

  // ==========================================
  // STATE FOR SOLUTION 3: 大循环层级拆解与批量模版套用
  // ==========================================
  const [s3Episodes, setS3Episodes] = useState([
    { id: 'ep_1', name: 'Episode 01', range: [0, 5400], status: '已注入模版(4步骤)' },
    { id: 'ep_2', name: 'Episode 02', range: [5401, 10800], status: '已注入模版(4步骤)' },
    { id: 'ep_3', name: 'Episode 03', range: [10801, 16200], status: '已注入模版(4步骤)' },
    { id: 'ep_4', name: 'Episode 04', range: [16201, 21600], status: '已注入模版(4步骤)' },
    { id: 'ep_5', name: 'Episode 05', range: [21601, 27000], status: '待细分步骤' },
    { id: 'ep_6', name: 'Episode 06', range: [27001, 32400], status: '待细分步骤' },
    { id: 'ep_7', name: 'Episode 07', range: [32401, 37800], status: '待细分步骤' },
    { id: 'ep_8', name: 'Episode 08', range: [37801, 43200], status: '待细分步骤' }
  ]);
  const [s3SelectedEp, setS3SelectedEp] = useState('ep_3');

  const handleS3BatchApplyTemplate = () => {
    setS3Episodes(s3Episodes.map(ep => ({ ...ep, status: '已注入模版(4步骤)' })));
    message.success('🚀 已成功将【工业装箱 SOP 模版】批量均分注入到 1 小时长视频的全部 20 个大循环 Episode 中！');
  };

  // Helpers
  const formatTime = (frame) => {
    const sec = Math.floor(frame / 30);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <MainLayout>
      <div className="ui-page" style={{ paddingBottom: 40, background: '#f8fafc' }}>
        {/* Page Header */}
        <PageHeader
          title="长视频循环标注交互方案对比原型"
          description="针对 1 小时连续重复同一 SOP 模版作业的长时序视频，提供 3 种不同交互维度的极速打点/复制解决方案演示。"
          breadcrumbs={[{ title: '首页' }, { title: '数据标注' }, { title: '长视频标注方案对比' }]}
          extra={
            <Space>
              <Button onClick={() => router.push('/annotation/audit')}>返回审核列表</Button>
              <Button type="primary" icon={<CodeOutlined />} onClick={() => router.push('/collection/templates')}>
                查看动作模版中心
              </Button>
            </Space>
          }
        />

        {/* Global Metadata Bar (Light Mode) */}
        <Card 
          style={{ 
            marginBottom: 16, 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div>
                <Text style={{ color: '#64748b', fontSize: 12 }}>当前演示视频</Text>
                <div style={{ color: '#0f172a', fontSize: 15, fontWeight: 600 }}>📹 LongHorizon_Packing_1h_0819.mp4</div>
              </div>
              <Divider type="vertical" style={{ borderColor: '#e2e8f0', height: 32 }} />
              <div>
                <Text style={{ color: '#64748b', fontSize: 12 }}>总视频规格</Text>
                <div style={{ color: '#0284c7', fontSize: 14, fontWeight: 600 }}>
                  01:00:00 (108,000 帧 / 30 FPS / 4 路相机)
                </div>
              </div>
              <Divider type="vertical" style={{ borderColor: '#e2e8f0', height: 32 }} />
              <div>
                <Text style={{ color: '#64748b', fontSize: 12 }}>预设 SOP 模版</Text>
                <div style={{ color: '#7c3aed', fontSize: 14, fontWeight: 600 }}>
                  📦 工业纸箱打包封装与装箱模版 (4 动作/循环)
                </div>
              </div>
            </div>

            {/* Solution Switcher (Light Theme) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 10px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>切换演示方案：</span>
              <Radio.Group 
                value={activeSolution} 
                onChange={e => setActiveSolution(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="solution_1">
                  <Space size={4}><CopyOutlined /> 方案一：整组循环复制</Space>
                </Radio.Button>
                <Radio.Button value="solution_2">
                  <Space size={4}><ThunderboltOutlined style={{ color: '#ca8a04' }} /> 方案二：流式快捷打点(最推荐)</Space>
                </Radio.Button>
                <Radio.Button value="solution_3">
                  <Space size={4}><BranchesOutlined /> 方案三：大循环层级拆解</Space>
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </Card>

        {/* Top Solution Highlights Alert (Light Theme) */}
        {activeSolution === 'solution_1' && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8, background: '#eff6ff', borderColor: '#bfdbfe' }}
            message={<span style={{ fontWeight: 600, color: '#1e40af' }}>方案一【模版整组复制 (Cycle Duplicate & Snap)】设计逻辑</span>}
            description="标注员完成第 1 轮标注后，后续重复循环无需再一个个新建步骤。点击「复制此循环组」，系统自动将整套 SOP 结构克隆，并自动将起始帧吸附在当前播放游标位置，标注员只需拖动滑块做少量微调。"
          />
        )}
        {activeSolution === 'solution_2' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8, background: '#fefce8', borderColor: '#fef08a' }}
            message={<span style={{ fontWeight: 600, color: '#854d0e' }}>方案二【流式快捷键打点接龙 (Metronome Snap)】设计逻辑（效率最高，像打节拍器）</span>}
            description="无需点鼠标，无需输入任何数字！导入模版后让视频 1.5x/2x 倍速播放，标注员目视画面，每当一个动作完成时按一下【空格键 (Space)】，系统自动切断上一动作并无缝开启下一动作；4 个动作完成后自动开启下一轮循环，1 小时视频 20 分钟轻松切完！"
          />
        )}
        {activeSolution === 'solution_3' && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8, background: '#f0fdf4', borderColor: '#bbf7d0' }}
            message={<span style={{ fontWeight: 600, color: '#166534' }}>方案三【大循环层级拆解与批量注入 (2-Tier Hierarchy)】设计逻辑</span>}
            description="采用两级时间轴结构：先在 1 小时宏观时间轴上标记出 20 个大 Episode 断点，再点击「一键向所有大循环批量注入模版」，系统自动按比例细分所有子步骤，最终可一键导出解耦为 20 个标准数据集 Episode 包。"
          />
        )}

        {/* Workspace Main 2-Column Grid */}
        <Row gutter={16}>
          {/* LEFT 16 COLUMNS: Video Player + Active Solution Interaction Arena */}
          <Col span={16}>
            {/* 1. Synchronized 4-Camera Video View (Light Mode) */}
            <Card 
              styles={{ body: { padding: 14, background: '#ffffff', borderRadius: 12 } }} 
              style={{ borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 2px' }}>
                <Space>
                  <VideoCameraOutlined style={{ color: '#0284c7' }} />
                  <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: 600 }}>4路同步相机视口矩阵</Text>
                  <Tag color="blue" style={{ fontSize: 11 }}>30 FPS 同步锁相</Tag>
                </Space>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  播放进度: <span style={{ color: '#0284c7', fontWeight: 600 }}>{formatTime(currentFrame)}</span> / 01:00:00 
                  <span style={{ marginLeft: 8, color: '#94a3b8' }}>[ 帧数: {currentFrame.toLocaleString()} / 108,000 ]</span>
                </div>
              </div>

              {/* 4 Camera Matrix (Light Canvas) */}
              <Row gutter={[10, 10]}>
                {[
                  { name: 'CAM 01: 主俯视视角 (Top Head)', color: '#0284c7', badge: 'RGB-D', bg: '#f0f9ff' },
                  { name: 'CAM 02: 左手腕部视角 (Wrist L)', color: '#7c3aed', badge: 'Wrist Left', bg: '#f5f3ff' },
                  { name: 'CAM 03: 右手腕部视角 (Wrist R)', color: '#059669', badge: 'Wrist Right', bg: '#ecfdf5' },
                  { name: 'CAM 04: 正向斜侧全景 (Front View)', color: '#d97706', badge: 'Wide Angle', bg: '#fffbeb' },
                ].map((cam, idx) => (
                  <Col span={12} key={idx}>
                    <div style={{
                      height: 145,
                      background: cam.bg,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute', top: 8, left: 8, zIndex: 2,
                        fontSize: 11, color: '#1e293b', background: 'rgba(255,255,255,0.92)',
                        padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6,
                        border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cam.color }}></span>
                        {cam.name}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 8, right: 8, zIndex: 2,
                        fontSize: 10, color: '#475569', background: 'rgba(255,255,255,0.92)',
                        padding: '1px 6px', borderRadius: 4, border: '1px solid #cbd5e1'
                      }}>
                        {cam.badge}
                      </div>

                      {/* Simulated Video Canvas */}
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <PlayCircleOutlined style={{ fontSize: 32, opacity: 0.5, color: cam.color, marginBottom: 4 }} />
                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                          机械臂装箱实况 (当前帧: {currentFrame.toLocaleString()})
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Video Playback Scrubber & Control Bar */}
              <div style={{ marginTop: 14, padding: '4px 6px' }}>
                <Slider
                  min={0}
                  max={TOTAL_VIDEO_FRAMES}
                  value={currentFrame}
                  onChange={val => setCurrentFrame(val)}
                  tooltip={{ formatter: val => `${formatTime(val)} (${val} 帧)` }}
                  styles={{
                    track: { background: '#2563eb' },
                    rail: { background: '#e2e8f0' }
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Space size={8}>
                    <Button 
                      type={isPlaying ? "default" : "primary"}
                      icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{ background: isPlaying ? '#f1f5f9' : '#2563eb', borderColor: isPlaying ? '#cbd5e1' : '#2563eb', color: isPlaying ? '#334155' : '#fff' }}
                    >
                      {isPlaying ? '暂停 (Space)' : '播放 (Space)'}
                    </Button>
                    <Button 
                      icon={<StepBackwardOutlined />} 
                      onClick={() => setCurrentFrame(prev => Math.max(0, prev - 30))}
                      style={{ background: '#fff', borderColor: '#cbd5e1', color: '#334155' }}
                    >
                      -1秒
                    </Button>
                    <Button 
                      icon={<StepForwardOutlined />} 
                      onClick={() => setCurrentFrame(prev => Math.min(TOTAL_VIDEO_FRAMES, prev + 30))}
                      style={{ background: '#fff', borderColor: '#cbd5e1', color: '#334155' }}
                    >
                      +1秒
                    </Button>
                    <Button 
                      onClick={() => setCurrentFrame(prev => Math.min(TOTAL_VIDEO_FRAMES, prev + 300))}
                      style={{ background: '#fff', borderColor: '#cbd5e1', color: '#334155' }}
                    >
                      +10秒快进
                    </Button>
                  </Space>

                  <Space size={8}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>播放倍速:</span>
                    {[1.0, 1.5, 2.0, 4.0].map(spd => (
                      <Button
                        key={spd}
                        size="small"
                        type={playbackSpeed === spd ? 'primary' : 'default'}
                        onClick={() => setPlaybackSpeed(spd)}
                        style={{
                          fontSize: 11,
                          background: playbackSpeed === spd ? '#2563eb' : '#fff',
                          borderColor: playbackSpeed === spd ? '#2563eb' : '#cbd5e1',
                          color: playbackSpeed === spd ? '#fff' : '#334155'
                        }}
                      >
                        {spd}x
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
            </Card>

            {/* 2. DEDICATED INTERACTIVE ARENA PER SOLUTION */}

            {/* ========================================================================= */}
            {/* SOLUTION 1 ARENA: 整组循环复制与智能吸附 */}
            {/* ========================================================================= */}
            {activeSolution === 'solution_1' && (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CopyOutlined style={{ color: '#2563eb' }} />
                      <Text strong style={{ fontSize: 15 }}>方案一工作台：整组循环一键复制与智能吸附</Text>
                      <Tag color="blue">当前已标注 {s1Cycles.length} 轮循环</Tag>
                    </Space>
                    <Button 
                      type="primary" 
                      icon={<CopyOutlined />}
                      onClick={handleS1DuplicateCycle}
                      style={{ background: '#2563eb' }}
                    >
                      ✨ 复制整组循环至当前播放点 ({formatTime(currentFrame)} / {currentFrame}帧)
                    </Button>
                  </div>
                }
                style={{ borderRadius: 12, border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {s1Cycles.map((cycle, cIdx) => (
                    <div 
                      key={cycle.cycleId}
                      style={{
                        background: '#f8fafc',
                        padding: 14,
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Space>
                          <Badge count={cIdx + 1} style={{ backgroundColor: '#2563eb' }} />
                          <Text strong style={{ fontSize: 14, color: '#1e293b' }}>{cycle.name}</Text>
                          <Tag color="purple">总区间: {cycle.startFrame} - {cycle.endFrame} 帧 ({formatTime(cycle.startFrame)} - {formatTime(cycle.endFrame)})</Tag>
                          <Tag color="cyan">步骤数: {cycle.steps.length}</Tag>
                        </Space>
                        <Space>
                          <Button 
                            size="small" 
                            icon={<CopyOutlined />}
                            onClick={() => {
                              setCurrentFrame(cycle.endFrame + 100);
                              handleS1DuplicateCycle();
                            }}
                          >
                            以此组为基准克隆下一组
                          </Button>
                          {s1Cycles.length > 1 && (
                            <Button 
                              size="small" 
                              danger 
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                setS1Cycles(s1Cycles.filter(c => c.cycleId !== cycle.cycleId));
                                message.success(`已删除 ${cycle.name}`);
                              }}
                            />
                          )}
                        </Space>
                      </div>

                      {/* Steps Timeline Grid */}
                      <Row gutter={[8, 8]}>
                        {cycle.steps.map((st, sIdx) => (
                          <Col span={6} key={st.key}>
                            <div style={{
                              background: '#fff',
                              padding: 10,
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              borderLeft: '4px solid #2563eb',
                              height: '100%'
                            }}>
                              <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>步骤 {sIdx + 1}</span>
                                <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>{st.arm}</Tag>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', margin: '4px 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <InputNumber 
                                  size="small" 
                                  value={st.start} 
                                  style={{ width: '48%', fontSize: 11 }} 
                                  onChange={v => {
                                    st.start = v;
                                    setS1Cycles([...s1Cycles]);
                                  }}
                                />
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>-</span>
                                <InputNumber 
                                  size="small" 
                                  value={st.end} 
                                  style={{ width: '48%', fontSize: 11 }} 
                                  onChange={v => {
                                    st.end = v;
                                    setS1Cycles([...s1Cycles]);
                                  }}
                                />
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ========================================================================= */}
            {/* SOLUTION 2 ARENA: 实时流式快捷键打点接龙 (节拍器) (Light Mode) */}
            {/* ========================================================================= */}
            {activeSolution === 'solution_2' && (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <ThunderboltOutlined style={{ color: '#ca8a04' }} />
                      <Text strong style={{ fontSize: 15 }}>方案二工作台：实时流式快捷键打点接龙 (节拍器模式)</Text>
                    </Space>
                    <Tag color="gold" style={{ fontSize: 12, padding: '2px 8px' }}>
                      🔥 效率倍增器 · 全程无需点选输入
                    </Tag>
                  </div>
                }
                style={{ borderRadius: 12, border: '1px solid #fde047', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              >
                {/* Metronome Live HUD (Light Mode) */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: 16,
                  color: '#0f172a',
                  marginBottom: 16,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>当前循环进度</span>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>
                        第 {s2CycleCount} 轮装箱循环 · 步骤 {s2CurrentStepIdx + 1} / {SOP_CYCLE_TEMPLATE.length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>当前打点起止追踪</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0284c7' }}>
                        [{s2StepStartFrame} 帧] &rarr; [当前指针: {currentFrame} 帧]
                        <span style={{ marginLeft: 6, fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>
                          (已持续 {Math.max(0, currentFrame - s2StepStartFrame)} 帧)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Step Glowing Banner (Light Mode) */}
                  <div style={{
                    background: '#eff6ff',
                    border: '2px dashed #3b82f6',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
                        🔴 RECORDING CURRENT ACTION (正在录制当前动作)
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                        {SOP_CYCLE_TEMPLATE[s2CurrentStepIdx].name}
                        <Tag color="cyan" style={{ marginLeft: 8 }}>{SOP_CYCLE_TEMPLATE[s2CurrentStepIdx].arm}</Tag>
                        <Tag color="blue">{SOP_CYCLE_TEMPLATE[s2CurrentStepIdx].skill}</Tag>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>即将接龙的下一个动作:</div>
                      <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                        {SOP_CYCLE_TEMPLATE[(s2CurrentStepIdx + 1) % SOP_CYCLE_TEMPLATE.length].name}
                      </div>
                    </div>
                  </div>

                  {/* Big Hotkey Punch Button */}
                  <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={handleS2StampCut}
                      style={{
                        flex: 2,
                        height: 50,
                        fontSize: 15,
                        fontWeight: 700,
                        background: '#2563eb',
                        borderColor: '#1d4ed8',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      ⚡ [ 按空格键 Space 打点切断并接龙下一步 ]
                    </Button>
                    <Button 
                      size="large"
                      onClick={() => {
                        setS2StepStartFrame(currentFrame);
                        message.info(`已标记空闲等待间隙，下一动作起始帧重设为 [${currentFrame} 帧]`);
                      }}
                      style={{
                        flex: 1,
                        height: 50,
                        background: '#fff',
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        fontSize: 13
                      }}
                    >
                      ⏭️ [ Enter 标记空闲间隙 ]
                    </Button>
                  </div>
                </div>

                {/* Stream Stamped Step History Table */}
                <div>
                  <Text strong style={{ fontSize: 13, color: '#334155', marginBottom: 8, display: 'block' }}>
                    📝 实时打点生成历史队列（自动生成时序断点）：
                  </Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {s2LoggedSteps.map((log, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0'
                      }}>
                        <Space>
                          <Tag color="blue">第 {log.cycle} 轮循环</Tag>
                          <Text strong style={{ color: '#1e293b' }}>{log.step}</Text>
                          <Tag>{log.arm}</Tag>
                        </Space>
                        <Space>
                          <Tag color="green" style={{ fontWeight: 600 }}>
                            {log.start} - {log.end} 帧
                          </Tag>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            ({formatTime(log.start)} - {formatTime(log.end)})
                          </span>
                        </Space>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* ========================================================================= */}
            {/* SOLUTION 3 ARENA: 大循环层级拆解与批量模版套用 */}
            {/* ========================================================================= */}
            {activeSolution === 'solution_3' && (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <BranchesOutlined style={{ color: '#16a34a' }} />
                      <Text strong style={{ fontSize: 15 }}>方案三工作台：两级时间轴（先切大循环 Episode，后批量注模版）</Text>
                    </Space>
                    <Button 
                      type="primary" 
                      icon={<RocketOutlined />}
                      onClick={handleS3BatchApplyTemplate}
                      style={{ background: '#16a34a', borderColor: '#16a34a' }}
                    >
                      🚀 批量向所有 20 个大循环注入 SOP 模版
                    </Button>
                  </div>
                }
                style={{ borderRadius: 12, border: '1px solid #86efac', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              >
                {/* Level 1: Macro Timeline Track */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                      一级宏观时间轴：1 小时连续录制划分的大循环 (Episodes)
                    </Text>
                    <Button size="small" icon={<PlusOutlined />}>添加大循环切分点</Button>
                  </div>

                  {/* Horizontal Macro Blocks */}
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '6px 2px' }}>
                    {s3Episodes.map((ep) => {
                      const isSelected = s3SelectedEp === ep.id;
                      return (
                        <div
                          key={ep.id}
                          onClick={() => setS3SelectedEp(ep.id)}
                          style={{
                            minWidth: 140,
                            padding: '10px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: isSelected ? '#dcfce7' : '#f8fafc',
                            border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? '#166534' : '#1e293b' }}>
                            {ep.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', margin: '2px 0' }}>
                            {formatTime(ep.range[0])} - {formatTime(ep.range[1])}
                          </div>
                          <Tag color={ep.status.includes('已注入') ? 'green' : 'orange'} style={{ fontSize: 10, margin: 0 }}>
                            {ep.status}
                          </Tag>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Divider style={{ margin: '14px 0' }} />

                {/* Level 2: Micro Sub-goals within selected Episode */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text strong style={{ fontSize: 13, color: '#166534' }}>
                      二级微观时序展开：当前选中「{s3Episodes.find(e => e.id === s3SelectedEp)?.name}」内部原子技能分解
                    </Text>
                    <Tag color="cyan">已自动按模版 4 个原子步骤均分排布</Tag>
                  </div>

                  <Row gutter={[10, 10]}>
                    {SOP_CYCLE_TEMPLATE.map((st, idx) => (
                      <Col span={6} key={idx}>
                        <div style={{
                          background: '#f0fdf4',
                          padding: 12,
                          borderRadius: 8,
                          border: '1px solid #bbf7d0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#166534', fontWeight: 600 }}>
                            <span>子步骤 {idx + 1}</span>
                            <span>{st.arm}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#14532d', margin: '6px 0' }}>
                            {st.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#475569' }}>
                            预估区间: {idx * 1350} - {(idx + 1) * 1350} 帧
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Card>
            )}
          </Col>

          {/* RIGHT 8 COLUMNS: Real-time Data Inspector & Solution Comparison Matrix */}
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <CodeOutlined style={{ color: '#2563eb' }} />
                  <Text strong style={{ fontSize: 14 }}>实时数据集生成与方案决策看板</Text>
                </Space>
              }
              styles={{ body: { padding: 14 } }}
              style={{ borderRadius: 12, border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            >
              <Tabs
                defaultActiveKey="json"
                items={[
                  {
                    key: 'json',
                    label: '📄 实时 taskinfo.json 输出',
                    children: (
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                          不论使用哪种交互方案，最终都将自动编译为具身智能标准的结构化时序标注产物：
                        </div>
                        <pre style={{
                          background: '#f8fafc',
                          color: '#0f172a',
                          border: '1px solid #e2e8f0',
                          padding: 12,
                          borderRadius: 8,
                          fontSize: 11,
                          lineHeight: 1.45,
                          maxHeight: 380,
                          overflowY: 'auto',
                          fontFamily: 'monospace'
                        }}>
{JSON.stringify({
  task_name: "工业纸箱打包封装与装箱任务",
  total_duration_frames: TOTAL_VIDEO_FRAMES,
  fps: 30,
  active_solution: activeSolution === 'solution_1' ? "Cycle_Replicate_Snap" : activeSolution === 'solution_2' ? "Realtime_Metronome_Stamp" : "2Tier_Hierarchy_Batch",
  annotated_cycles_count: activeSolution === 'solution_1' ? s1Cycles.length : activeSolution === 'solution_2' ? s2CycleCount : s3Episodes.length,
  sub_goals: activeSolution === 'solution_1' 
    ? s1Cycles.map(c => ({ cycle: c.name, range: [c.startFrame, c.endFrame], steps: c.steps.length }))
    : activeSolution === 'solution_2'
      ? s2LoggedSteps.slice(0, 4)
      : s3Episodes.slice(0, 3)
}, null, 2)}
                        </pre>
                        <Button 
                          block 
                          type="primary" 
                          style={{ marginTop: 12 }}
                          onClick={() => message.success('已导出标准训练集 taskinfo.json 元数据')}
                        >
                          一键导出当前标注数据包
                        </Button>
                      </div>
                    )
                  },
                  {
                    key: 'matrix',
                    label: '📊 三套方案深度对比表',
                    children: (
                      <div style={{ fontSize: 12 }}>
                        <Table
                          size="small"
                          pagination={false}
                          columns={[
                            { title: '维度', dataIndex: 'dim', width: 70, render: v => <Text strong>{v}</Text> },
                            { title: '方案一: 整组复制', dataIndex: 's1' },
                            { title: '方案二: 流式打点', dataIndex: 's2' },
                            { title: '方案三: 两级拆解', dataIndex: 's3' },
                          ]}
                          dataSource={[
                            { key: '1', dim: '操作形式', s1: '点击复制整组SOP', s2: '键盘空格键实时打点', s3: '先切大块再批量注入' },
                            { key: '2', dim: '标完耗时', s1: '约 15 分钟', s2: '约 5~8 分钟(最快)', s3: '约 10 分钟' },
                            { key: '3', dim: '输入负担', s1: '极少(微调滑块)', s2: '零敲击/纯按键', s3: '极少(宏观把控)' },
                            { key: '4', dim: '适用场景', s1: '每轮耗时基本固定的流水线', s2: '节奏多变/手部动作连贯场景', s3: '长视频需要解耦切成独立包' },
                          ]}
                        />
                        <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', fontSize: 11 }}>
                          💡 <b>综合建议</b>：方案二（快捷键流式打点）是目前特斯拉 Optimus 及顶级大厂具身标注团队公认效率最高的方案，配合 1.5x 倍速播放，标注员可以像打节拍器一样极速完成全天数百小时的切片！
                        </div>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
