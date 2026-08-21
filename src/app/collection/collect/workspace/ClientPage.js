'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, 
  Typography, 
  Space, 
  Switch, 
  Upload, 
  Progress, 
  Card, 
  Statistic, 
  Divider, 
  Input, 
  Tooltip, 
  App, 
  ConfigProvider, 
  theme, 
  Tag,
  Tabs,
  Dropdown
} from 'antd';
import { 
  CaretDownOutlined, 
  ExpandOutlined, 
  CompressOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  CloseCircleOutlined, 
  PlusOutlined, 
  SyncOutlined, 
  VideoCameraOutlined, 
  InfoCircleOutlined, 
  ApiOutlined, 
  DashboardOutlined, 
  HddOutlined, 
  CheckCircleFilled, 
  WarningFilled, 
  RobotOutlined, 
  MonitorOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  EditOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
  DeploymentUnitOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { StatusTag } from '@/components/ui';
import StaticVideoPlaceholder from '@/components/StaticVideoPlaceholder';

const { Title, Text } = Typography;

// ==================== HUMANOID WORKSPACE (ORIGINAL) ====================
function HumanoidWorkspace({ taskId, router }) {
  const { message } = App.useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState(null);
  const [stepRecords, setStepRecords] = useState({});
  const [completedEpisodes, setCompletedEpisodes] = useState([]);
  const elapsedRef = useRef(0);

  const steps = [
    {
      title: '右手拿起桌面上的筷子',
      description: '右手拿起桌面上的筷子',
      actionGoal: '用右手拇指、食指和中指捏住一根筷子，从桌面垂直拿起，离开桌面约 5cm。',
      precautions: ['不要触碰其他餐具', '筷子保持水平', '动作轻稳，避免抖动'],
      referenceImage: '/assets/images/robot_schematic.png',
    },
    {
      title: '右手将筷子放置在厨具盒中',
      description: '右手将筷子放置在厨具盒中',
      actionGoal: '保持筷子垂直，将筷子放入厨具盒的指定槽位中。',
      precautions: ['轻放避免碰撞', '确认筷子已放稳'],
      referenceImage: '/assets/images/robot_schematic.png',
    },
    {
      title: '左手拿起桌面上的餐叉',
      description: '左手拿起桌面上的餐叉',
      actionGoal: '用左手拇指、食指和中指捏住餐叉，从桌面拿起。',
      precautions: ['餐叉齿部朝上', '避免戳到其他餐具'],
      referenceImage: '/assets/images/robot_schematic.png',
    },
    {
      title: '左手将餐叉放置在厨具盒中',
      description: '左手将餐叉放置在厨具盒中',
      actionGoal: '将餐叉放入厨具盒的指定槽位。',
      precautions: ['确认餐叉已放稳'],
      referenceImage: '/assets/images/robot_schematic.png',
    },
    {
      title: '右手拿起桌面上的勺子',
      description: '右手拿起桌面上的勺子',
      actionGoal: '用右手捏住勺子柄部，从桌面拿起。',
      precautions: ['勺子凹面朝上', '避免溅出残留物'],
      referenceImage: '/assets/images/robot_schematic.png',
    },
    {
      title: '右手将勺子放置在厨具盒中',
      description: '右手将勺子放置在厨具盒中',
      actionGoal: '将勺子放入厨具盒的指定槽位。',
      precautions: ['轻放避免碰撞'],
      referenceImage: '/assets/images/robot_schematic.png',
    },
  ];

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    message.success({ content: '✅ 设备网关检查通过，所有设备均已就绪，可开始采集！', duration: 3, style: { marginTop: '10vh' } });
  }, [message]);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setElapsed(e => e + 1), 100);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRecording(prev => !prev);
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        setStepRecords(prev => {
           if (!isRecording) { message.warning('请先按 Space 开始全局录制'); return prev; }
           message.success(`已记录步骤 ${activeStep + 1} 起点`);
           return { ...prev, [activeStep]: { ...prev[activeStep], start: elapsedRef.current * 3 } };
        });
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        setStepRecords(prev => {
           if (!prev[activeStep]?.start) { message.warning('请先记录起点'); return prev; }
           message.success(`步骤 ${activeStep + 1} 完成`);
           if (activeStep < steps.length - 1) setActiveStep(s => s + 1);
           return { ...prev, [activeStep]: { ...prev[activeStep], end: elapsedRef.current * 3 } };
        });
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (elapsedRef.current === 0) {
           message.warning('当前无数据录制，无法保存');
           return;
        }
        setCompletedEpisodes(prev => [...prev, {
            id: `EP_${String(prev.length + 1).padStart(3, '0')}`,
            time: (elapsedRef.current / 10).toFixed(1),
            frames: elapsedRef.current * 3,
            status: '已上传云端'
        }]);
        message.success(`当前 Episode (${(elapsedRef.current / 10).toFixed(1)}s) 动作序列已打包，成功保存至云端！`);
        setIsRecording(false);
        setElapsed(0);
        setActiveStep(0);
        setStepRecords({});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, activeStep, steps.length, message]);

  const viewOptions = [
    { key: 'head_left', label: '头部左目视角' },
    { key: 'head_right', label: '头部右目视角' },
    { key: 'hand_left', label: '左手-腕部视角' },
    { key: 'hand_right', label: '右手-腕部视角' },
  ];

  const [fullscreenId, setFullscreenId] = useState(null);
  const [videoLayout, setVideoLayout] = useState('focus'); // 'focus' | 'equal' | 'stack'
  const toggleFullscreen = (id) => {
    setFullscreenId(prev => prev === id ? null : id);
  };

  const PanelHeader = ({ id, title }) => (
    <div style={{ height: 28, background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between' }}>
      <Dropdown menu={{ items: viewOptions }} trigger={['click']}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333', fontSize: 12, fontWeight: 500 }}>
          <div style={{ width: 3, height: 12, background: '#1890ff', marginRight: 6 }}></div>
          {title} <CaretDownOutlined style={{ marginLeft: 4, fontSize: 10, color: '#8c8c8c' }} />
        </div>
      </Dropdown>
      {fullscreenId === id ? 
        <CompressOutlined onClick={() => toggleFullscreen(id)} style={{ color: '#8c8c8c', cursor: 'pointer' }} /> :
        <ExpandOutlined onClick={() => toggleFullscreen(id)} style={{ color: '#8c8c8c', cursor: 'pointer' }} />
      }
    </div>
  );

  return (
    <div className="ui-workspace" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      
      {/* Top Header */}
      <div className="ui-toolbar" style={{ height: 36, borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 12, color: '#595959', background: '#fafafa' }}>
        <Space size="large" separator={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <Space size="small">
            <ApiOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 500 }}>主从臂设备:</span>
            <StatusTag status="已连接" />
          </Space>
          
          <Space size="small">
            <MonitorOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 500 }}>VR设备:</span>
            <StatusTag status="在线" />
          </Space>

          <Space size="small">
            <RobotOutlined style={{ color: '#eb2f96' }} />
            <span style={{ fontWeight: 500 }}>机器人本体:</span>
            <StatusTag status="正常">通信正常</StatusTag>
          </Space>

          <Space size="small">
            <HddOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#faad14' }}>存储: 128GB (12%)</span>
          </Space>
          
          <Space size="small">
            <span>录制: {isRecording ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>🔴 录制中</span> : <span style={{ color: '#52c41a' }}>Ready</span>}</span>
          </Space>
        </Space>
        
        <Space size="middle" style={{ color: '#8c8c8c' }}>
          <span style={{ marginRight: 8, color: '#8c8c8c' }}>视频布局:</span>
          <Button.Group size="small">
            <Button type={videoLayout === 'focus' ? 'primary' : 'default'} onClick={() => setVideoLayout('focus')}>主视角</Button>
            <Button type={videoLayout === 'equal' ? 'primary' : 'default'} onClick={() => setVideoLayout('equal')}>三栏等分</Button>
            <Button type={videoLayout === 'stack' ? 'primary' : 'default'} onClick={() => setVideoLayout('stack')}>品字堆叠</Button>
          </Button.Group>
          <span style={{ marginLeft: 8, borderLeft: '1px solid #d9d9d9', paddingLeft: 8 }}><kbd style={{ padding: '0 4px', border: '1px solid #d9d9d9', borderRadius: 2 }}>Space</kbd> 录制/暂停</span>
          <span><kbd style={{ padding: '0 4px', border: '1px solid #d9d9d9', borderRadius: 2 }}>R</kbd> 作废当前</span>
          <span><kbd style={{ padding: '0 4px', border: '1px solid #d9d9d9', borderRadius: 2 }}>Enter</kbd> 提交并下一段</span>
          <Button size="small" type="primary" danger ghost icon={<CloseCircleOutlined />} onClick={() => window.close()}>退出工作台</Button>
        </Space>
      </div>

      {/* Main Grid Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        minHeight: 0,
        boxShadow: isRecording ? 'inset 0 0 0 4px #ff4d4f' : 'none',
        transition: 'box-shadow 0.3s ease-in-out',
        position: 'relative'
      }}>
        {isRecording && <div style={{ position: 'absolute', top: 16, right: 310, zIndex: 10, background: '#ff4d4f', color: '#fff', padding: '4px 12px', borderRadius: 4, fontWeight: 'bold', fontSize: 12, animation: 'blink 1s infinite' }}>● REC</div>}
        
        {/* Video Grid Wrapper */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: '#fff', padding: '16px', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
          
          {/* Full height/width grid */}
          <div style={{
            width: '100%',
            height: '100%',
            display: fullscreenId ? 'block' : 'grid',
            gridTemplateColumns: videoLayout === 'equal' ? 'repeat(3, 1fr)' : '2fr 1fr',
            gridTemplateRows: videoLayout === 'equal' ? '1fr auto' : '1fr 1fr',
            gap: '12px',
            alignItems: 'stretch',
          }}>

            {/* 头部视角 - 左侧大屏 (主视角) / 第一个 (三等分) */}
            {(!fullscreenId || fullscreenId === 'cam3') && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e8e8e8',
                backgroundColor: '#fff',
                gridColumn: videoLayout === 'equal' ? '1' : '1',
                gridRow: videoLayout === 'equal' ? '1' : '1 / 3',
                height: '100%',
              }}>
                <PanelHeader id="cam3" title="头部左目视角" />
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  background: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <StaticVideoPlaceholder label="头部左目视角静态演示" />
                  <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', fontSize: 10, borderRadius: 4, textAlign: 'right' }}>
                    <div>Fps: 30</div>
                    <div>Resolution: 848*480</div>
                    <div>Live Stream</div>
                  </div>
                </div>
              </div>
            )}

            {/* 左手-腕部视角 - 右上 (主视角) / 第二个 (三等分) */}
            {(!fullscreenId || fullscreenId === 'cam1') && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e8e8e8',
                backgroundColor: '#fff',
                gridColumn: videoLayout === 'equal' ? '2' : '2',
                gridRow: videoLayout === 'equal' ? '1' : '1',
                height: '100%',
              }}>
                <PanelHeader id="cam1" title="左手-腕部视角" />
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  background: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <StaticVideoPlaceholder label="左手腕视角静态演示" />
                  <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', fontSize: 10, borderRadius: 4, textAlign: 'right' }}>
                    <div>Fps: 30</div>
                    <div>Resolution: 848*480</div>
                    <div>Live Stream</div>
                  </div>
                </div>
              </div>
            )}

            {/* 右手-腕部视角 - 右下 (主视角) / 第三个 (三等分) */}
            {(!fullscreenId || fullscreenId === 'cam2') && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e8e8e8',
                backgroundColor: '#fff',
                gridColumn: videoLayout === 'equal' ? '3' : '2',
                gridRow: videoLayout === 'equal' ? '1' : '2',
                height: '100%',
              }}>
                <PanelHeader id="cam2" title="右手-腕部视角" />
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  background: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <StaticVideoPlaceholder label="右手腕视角静态演示" />
                  <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', fontSize: 10, borderRadius: 4, textAlign: 'right' }}>
                    <div>Fps: 30</div>
                    <div>Resolution: 848*480</div>
                    <div>Live Stream</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Right 采集进度 Panel - 非三等分模式时显示 */}
            {(!fullscreenId || fullscreenId === 'cam4') && videoLayout !== 'equal' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e8e8e8',
                backgroundColor: '#fff',
                gridColumn: '1',
                gridRow: '1',
                padding: '16px',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 14, color: '#333' }}>
                    <div style={{ width: 4, height: 14, background: '#1677ff', marginRight: 8, borderRadius: 2 }}></div>
                    数据采集控制台
                  </div>
                  <span style={{ fontSize: 12, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a', display: 'inline-block' }}></span>
                    空闲就绪
                  </span>
                </div>

                {/* Progress Block */}
                <div style={{ background: '#f6f5f1', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  {/* Ring Progress */}
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e8e8e8" strokeWidth="5"/>
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#1677ff" strokeWidth="5"
                      strokeDasharray={`${(completedEpisodes.length / 50) * 151} 151`}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                      style={{ transition: 'stroke-dasharray 0.3s ease' }}
                    />
                    <text x="28" y="32" textAnchor="middle" fontSize="15" fontWeight="500" fill="#333">{completedEpisodes.length}</text>
                  </svg>

                  {/* Progress Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 7 }}>当前批次采集进度</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#333' }}>{completedEpisodes.length} / 50</span>
                      <span style={{ fontSize: 13.5, color: '#1677ff', fontWeight: 500 }}>{Math.round((completedEpisodes.length / 50) * 100)}%</span>
                    </div>
                    <div style={{ height: 5, background: '#e8e8e8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(completedEpisodes.length / 50) * 100}%`, background: '#1677ff', borderRadius: 3, transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                </div>

                {/* Episode List Preview */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 9, letterSpacing: 0.3 }}>最近采集记录</div>
                  {completedEpisodes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#bfbfbf', padding: 20 }}>暂无已完成的采集记录</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {completedEpisodes.slice(0, 3).map((ep, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fafafa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#1677ff' }}>{ep.id}</span>
                          <span style={{ fontSize: 11, color: '#8c8c8c' }}>{ep.time}s · {ep.frames}帧</span>
                          <span style={{ fontSize: 11, color: '#52c41a' }}>{ep.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 任务步骤面板 - 只在三栏等分模式显示，占满整行 */}
            {videoLayout === 'equal' && (
              <div style={{
                gridColumn: '1 / 4',
                gridRow: '2',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ddd8cc',
                borderRadius: 12,
                background: '#fff',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 0 5px #f5f2eb',
              }}>
                {/* 标题行 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 22px',
                  height: 54,
                  borderBottom: '1px solid #ddd8cc',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 650 }}>采集步骤</span>
                  <span style={{ color: '#949ca7', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em' }}>当前步骤 {activeStep + 1}/{steps.length}</span>
                </div>

                {/* 步骤列表 - 三栏卡片排列 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  padding: 16,
                }}>
                  {steps.map((step, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 8,
                      border: idx === activeStep ? '2px solid #e7531b' : '1px solid #e8e8e8',
                      background: '#fff',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}>
                      {/* 卡片头部 */}
                      <div style={{
                        padding: '8px 12px',
                        background: idx === activeStep ? '#fff7f5' : '#fafafa',
                        borderBottom: '1px solid #e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: idx === activeStep ? '#e7531b' : '#333',
                        }}>
                          Image #{idx + 1}
                        </span>
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: idx === activeStep ? '2px solid #e7531b' : '1px solid #e8e8e8',
                          color: idx === activeStep ? '#e7531b' : '#999',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                        }}>
                          {idx + 1}
                        </span>
                      </div>
                      {/* 视频画面占位 */}
                      <div style={{
                        height: 100,
                        background: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}>
                        <img
                          src={step.referenceImage}
                          alt={step.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                        />
                      </div>
                      {/* 步骤描述 + 可折叠详情 */}
                      <div style={{
                        background: '#fff',
                      }}>
                        <div style={{
                          padding: '10px 12px',
                          borderBottom: expandedStep === idx ? '1px solid #e8e8e8' : 'none',
                        }}>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#333',
                            marginBottom: 4,
                          }}>
                            {step.title}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: '#7a7469',
                            lineHeight: 1.4,
                          }}>
                            {step.description}
                          </div>
                        </div>

                        {/* 可折叠详情区域 */}
                        <div
                          style={{
                            borderTop: '1px solid #e8e8e8',
                            background: '#fafafa',
                          }}
                        >
                          {/* 折叠时的可点击标题 */}
                          <div
                            onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                            style={{
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              color: '#1677ff',
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            <span>查看详细操作说明</span>
                            <span style={{
                              transition: 'transform 0.2s',
                              transform: expandedStep === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}>
                              ▼
                            </span>
                          </div>

                          {/* 展开时的详情内容 */}
                          {expandedStep === idx && (
                            <div style={{ padding: '0 12px 12px' }}>
                              {/* 动作目标 */}
                              <div style={{ marginBottom: 10 }}>
                                <div style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#30363d',
                                  marginBottom: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  <i className="ti ti-target-arrow" style={{ fontSize: 13 }}></i>
                                  动作目标
                                </div>
                                <div style={{
                                  fontSize: 11,
                                  color: '#6b6f73',
                                  lineHeight: 1.5,
                                }}>
                                  {step.actionGoal}
                                </div>
                              </div>

                              {/* 注意事项 */}
                              <div style={{ marginBottom: 10 }}>
                                <div style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#b36e19',
                                  marginBottom: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  <i className="ti ti-alert-triangle" style={{ fontSize: 13 }}></i>
                                  注意事项
                                </div>
                                <ul style={{
                                  margin: 0,
                                  paddingLeft: 16,
                                  fontSize: 11,
                                  color: '#6b6f73',
                                  lineHeight: 1.6,
                                }}>
                                  {step.precautions?.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* 参考图 */}
                              <div>
                                <div style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#30363d',
                                  marginBottom: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  <i className="ti ti-photo" style={{ fontSize: 13 }}></i>
                                  参考示意
                                </div>
                                <div style={{
                                  height: 60,
                                  borderRadius: 6,
                                  overflow: 'hidden',
                                  background: '#eee8dd',
                                }}>
                                  <img
                                    src={step.referenceImage}
                                    alt="参考示意"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部提示 */}
                <div style={{
                  padding: '8px 22px',
                  borderTop: '1px solid #ddd8cc',
                  fontSize: 11,
                  color: '#949ca7',
                }}>
                  点击步骤可切换至该步骤
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - 1 part */}
        <div style={{ flex: 1, minWidth: 300, maxWidth: 400, display: 'flex', flexDirection: 'column', background: '#fafafa', borderLeft: '1px solid #e8e8e8', minHeight: 0 }}>
           
           {/* 数据采集控制台 Section (Fixed at top) */}
           <div style={{ padding: 16, background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                 <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: 14, color: '#333' }}>
                    <div style={{ width: 4, height: 14, background: '#1677ff', marginRight: 8, borderRadius: 2 }}></div>
                    数据采集控制台
                 </div>
                 <span style={{ fontSize: 12, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a', display: 'inline-block' }}></span>
                    空闲就绪
                 </span>
              </div>

              {/* Progress Block */}
              <div style={{ background: '#f6f5f1', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                {/* Ring Progress */}
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e8e8e8" strokeWidth="5"/>
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#1677ff" strokeWidth="5"
                    strokeDasharray={`${(completedEpisodes.length / 50) * 151} 151`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                  <text x="28" y="32" textAnchor="middle" fontSize="15" fontWeight="500" fill="#333">{completedEpisodes.length}</text>
                </svg>

                {/* Progress Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 7 }}>当前批次采集进度</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: '#333' }}>{completedEpisodes.length} / 50</span>
                    <span style={{ fontSize: 13.5, color: '#1677ff', fontWeight: 500 }}>{Math.round((completedEpisodes.length / 50) * 100)}%</span>
                  </div>
                  <div style={{ height: 5, background: '#e8e8e8', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(completedEpisodes.length / 50) * 100}%`, background: '#1677ff', borderRadius: 3, transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
              </div>
           </div>

           <Tabs 
              defaultActiveKey="1" 
              centered 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              items={[
                {
                   key: '1',
                   label: <span><InfoCircleOutlined /> 任务详情</span>,
                   children: (
                      <div style={{ overflowY: 'auto', padding: '0 16px 16px 16px', height: '100%' }}>
                         {/* Current Job Section */}
                         <div className="ui-table-card" style={{ border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, background: '#fff' }}>
                            <div style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 'bold', marginBottom: 4 }}>CURRENT JOB</div>
                            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#141414', marginBottom: 24 }}>餐具整理_job</div>
                            
                            <div style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 'bold', marginBottom: 16 }}>WORKFLOW STEPS</div>
                            
                            {steps.map((step, idx) => (
                               <div key={idx} style={{ padding: '8px 0', marginBottom: 4 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 500, color: '#333' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0f0f0', color: '#8c8c8c', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12, fontSize: 12, flexShrink: 0 }}>
                                      {idx + 1}
                                    </div>
                                    <div>{step.title}</div>
                                 </div>
                               </div>
                            ))}

                            {/* 开始采集按钮 */}
                            <div style={{ marginTop: 16 }}>
                              {!isRecording ? (
                                <Button type="primary" danger shape="round" icon={<PlayCircleOutlined />} onClick={() => setIsRecording(true)} style={{ width: '100%', fontWeight: 'bold' }}>
                                  开始采集
                                </Button>
                              ) : (
                                <Button shape="round" icon={<PauseCircleOutlined />} onClick={() => setIsRecording(false)} style={{ width: '100%', fontWeight: 'bold', background: '#f5f5f5' }}>
                                  停止采集
                                </Button>
                              )}
                            </div>
                         </div>
                      </div>
                   )
                },
                {
                   key: '2',
                   label: `已采记录 (${completedEpisodes.length}/50)`,
                   children: (
                      <div style={{ overflowY: 'auto', padding: '0 12px', height: '100%' }}>
                         {completedEpisodes.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: 40 }}>暂无已完成的采集记录</div>
                         ) : (
                            completedEpisodes.map((ep, i) => (
                               <div key={i} style={{ border: '1px solid #e8e8e8', background: '#fff', padding: 12, borderRadius: 4, marginBottom: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                     <span style={{ fontWeight: 'bold', color: '#1677ff' }}>{ep.id}</span>
                                     <StatusTag status="已完成">{ep.status}</StatusTag>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#595959' }}>
                                     <span>时长: {ep.time}s</span>
                                     <span>总帧数: {ep.frames}</span>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>
                   )
                }
              ]}
           />
        </div>
      </div>

      <style jsx global>{`
        @keyframes blink-text {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ==================== LUMOS WORKSPACE (HIGH-FIDELITY DARK MODE) ====================
const defaultLumosTasksConfig = {
  task_id: "CT-20250301001",
  task_name: "Lumos 双手整理筷子与勺子",
  rgb_frame_number: 450,
  depth_frame_number: 225,
  save_path: "/home/lumos/FastUMI_Data_Collection-Data_Collection_evaluation/data_collector_opt/Data/",
  if_quality_check: true,
  camera_sync_alignment: true,
  total_count: 50,
  audio_volume: 8,
  min_distance_barrier_m: 0.15
};

const defaultCompletedEpisodes = [
  { id: 'EP_001', time: '15.0', frames: 450, status: '已保存' },
  { id: 'EP_002', time: '14.8', frames: 444, status: '已保存' },
  { id: 'EP_003', time: '15.1', frames: 453, status: '已隔离' },
];

function LumosWorkspace({ taskId, router }) {
  const { message } = App.useApp();
  
  // Lumos State Machine States:
  // 'SERVICE_STOPPED' (initial - requires clicking blue power key to start background scripts)
  // 'SELF_CHECKING' (checking and pairing 3s)
  // 'READY' (paired and waiting for left gripper calibration command)
  // 'CALIBRATION' (waiting 3s aligned origin reset)
  // 'COLLECTING' (recording - auto runs frame progress)
  // 'COMPLETE' (episode ends, waiting for save (L) or isolate (R) command)
  // 'EPISODE_SAVED' (episode saved successfully, voice played, counts incremented)
  // 'EPISODE_ISOLATED' (episode isolated successfully, logged)
  // 'EPISODE_FINISHED_ASK' (finished single collection sequence, left gripper to continue, right to exit)
  const [lumosState, setLumosState] = useState('SERVICE_STOPPED');
  const [voiceLogs, setVoiceLogs] = useState([
    { time: '8:00:00 AM', text: '硬件已供电，等待开启服务。请点击物理［蓝光启动按钮］启动程序。' }
  ]);
  const [isMuted, setIsMuted] = useState(false);
  const [tasksConfig, setTasksConfig] = useState(defaultLumosTasksConfig);
  const [configEditorOpen, setConfigEditorOpen] = useState(false);
  const [configJsonStr, setConfigJsonStr] = useState(JSON.stringify(defaultLumosTasksConfig, null, 2));
  
  // Simulated Gripper States (Value 0 to 100 representing hold progress)
  const [leftGripperHold, setLeftGripperHold] = useState(0);
  const [rightGripperHold, setRightGripperHold] = useState(0);
  const [leftHoldActive, setLeftHoldActive] = useState(false);
  const [rightHoldActive, setRightHoldActive] = useState(false);

  // Recording variables
  const [recordedCount, setRecordedCount] = useState(3);
  const [completedEpisodes, setCompletedEpisodes] = useState(defaultCompletedEpisodes);
  const [collectionFrameCount, setCollectionFrameCount] = useState(0);
  const [collectionTime, setCollectionTime] = useState(0.0);
  const [calibrationCountdown, setCalibrationCountdown] = useState(3);

  // Voice synthesis helpers
  const speakText = (text) => {
    // Write text to visual voice logs
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setVoiceLogs(prev => [{ time: timeStr, text }, ...prev.slice(0, 19)]);

    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Stop ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard simulator listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'l' || e.key === 'L') {
        setLeftHoldActive(true);
      }
      if (e.key === 'r' || e.key === 'R') {
        setRightHoldActive(true);
      }
      
      // Space for Pause/Resume if in COLLECTING state
      if (e.code === 'Space') {
        e.preventDefault();
        if (lumosState === 'COLLECTING') {
          speakText('采集暂停。如需恢复请继续操作。');
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'l' || e.key === 'L') {
        setLeftHoldActive(false);
        setLeftGripperHold(0);
      }
      if (e.key === 'r' || e.key === 'R') {
        setRightHoldActive(false);
        setRightGripperHold(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [lumosState, isMuted]);

  // Handle Gripper Hold accumulators (Interval ticks)
  useEffect(() => {
    let holdInterval;
    if (leftHoldActive || rightHoldActive) {
      holdInterval = setInterval(() => {
        if (leftHoldActive && leftGripperHold < 100) {
          setLeftGripperHold(prev => {
            const next = prev + 10;
            if (next >= 100) {
              triggerStateL();
              return 0; // Reset after trigger
            }
            return next;
          });
        }
        if (rightHoldActive && rightGripperHold < 100) {
          setRightGripperHold(prev => {
            const next = prev + 10;
            if (next >= 100) {
              triggerStateR();
              return 0; // Reset after trigger
            }
            return next;
          });
        }
      }, 150); // 1.5 seconds to full trigger
    }
    return () => clearInterval(holdInterval);
  }, [leftHoldActive, rightHoldActive, leftGripperHold, rightGripperHold, lumosState]);

  // State flow logic for Left Gripper (L Trigger)
  const triggerStateL = () => {
    if (lumosState === 'SERVICE_STOPPED') {
      message.warning('请先点击物理按钮启动数采主机服务！');
      return;
    }
    
    if (lumosState === 'SELF_CHECKING') {
      speakText('设备自检配对中，请继续抓握左侧夹爪，直至指示灯变为常绿。');
      return;
    }

    if (lumosState === 'READY') {
      // Go to Calibration
      setLumosState('CALIBRATION');
      setCalibrationCountdown(3);
      speakText('开始进入平行原点重置。请将左右手夹爪水平平行放置。3，2，1，开始！');
    }

    if (lumosState === 'COMPLETE') {
      // L triggers Save action
      const duration = (tasksConfig.rgb_frame_number / 30).toFixed(1);
      const newEp = {
        id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
        time: duration,
        frames: tasksConfig.rgb_frame_number,
        status: '已保存'
      };
      setCompletedEpisodes(prev => [newEp, ...prev]);
      setRecordedCount(prev => prev + 1);
      setLumosState('EPISODE_FINISHED_ASK');
      speakText(`当前第 ${completedEpisodes.length + 1} 录制段落保存成功。请确认，左爪闭合继续采集下一段，右爪闭合退出工作台。`);
    }

    if (lumosState === 'EPISODE_FINISHED_ASK') {
      // Go back to ready
      setLumosState('READY');
      speakText('已准备就绪，请闭合左手夹爪启动平行原点校准。');
    }
  };

  // State flow logic for Right Gripper (R Trigger)
  const triggerStateR = () => {
    if (lumosState === 'COMPLETE') {
      // R triggers Isolate/Discard action
      const duration = (tasksConfig.rgb_frame_number / 30).toFixed(1);
      const newEp = {
        id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
        time: duration,
        frames: tasksConfig.rgb_frame_number,
        status: '已隔离'
      };
      setCompletedEpisodes(prev => [newEp, ...prev]);
      setLumosState('EPISODE_FINISHED_ASK');
      speakText(`警告，当前录制段落已标记为隔离垃圾数据，不会作为清洗语料。左爪继续采集，右爪退出。`);
    }

    if (lumosState === 'EPISODE_FINISHED_ASK') {
      speakText('退出工作台。');
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  };

  // Handle countdown animation and recording frame loop
  useEffect(() => {
    let countdownTimer;
    if (lumosState === 'CALIBRATION') {
      countdownTimer = setInterval(() => {
        setCalibrationCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            setLumosState('COLLECTING');
            setCollectionFrameCount(0);
            setCollectionTime(0.0);
            speakText('录制开启。系统正在收集关节轨迹，请正常移动双侧执行器。');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [lumosState]);

  // Frame ticking logic during collecting
  useEffect(() => {
    let collectTimer;
    if (lumosState === 'COLLECTING') {
      collectTimer = setInterval(() => {
        setCollectionFrameCount(prev => {
          const next = prev + 5; // increment frames
          const totalTarget = tasksConfig.rgb_frame_number;
          
          // Speeches at 50% and 80%
          if (next === Math.floor(totalTarget * 0.5)) {
            speakText('采集进度已达百分之五十，请稳定控力，抓取器保持视距内。');
          }
          if (next === Math.floor(totalTarget * 0.8)) {
            speakText('已达百分之八十。准备平稳释出，准备进入存弃分发状态。');
          }
          
          if (next >= totalTarget) {
            clearInterval(collectTimer);
            setLumosState('COMPLETE');
            speakText('录制终点到达。音频反馈：长按左侧夹爪 3 秒打包保存该段动作数据，长按右侧夹爪 3 秒隔离废弃。');
            return totalTarget;
          }
          return next;
        });
        setCollectionTime(t => parseFloat((t + 0.166).toFixed(2)));
      }, 166); // Roughly 30 fps speedup
    }
    return () => clearInterval(collectTimer);
  }, [lumosState, tasksConfig.rgb_frame_number]);

  // Manual trigger for service start
  const handlePhysicalStart = () => {
    setLumosState('SELF_CHECKING');
    speakText('正在检查连接。正在握手夹爪端口以及相机流。请稍候。');
    
    setTimeout(() => {
      setLumosState('READY');
      speakText('自检及双臂绑定成功！耳机指示正常，HDMI已就绪。长按左夹爪 3 秒进行原点重置。');
    }, 3000);
  };

  // Configuration JSON Save
  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(configJsonStr);
      setTasksConfig(parsed);
      setConfigEditorOpen(false);
      message.success('本地数采配置文件 tasks_config.json 保存成功，已动态重载参数！');
      speakText('配置文件已修改，单段数据采集帧数及限制已动态调校。');
    } catch(e) {
      message.error('JSON 格式有误，请检查语法！');
    }
  };

  return (
    <div className="ui-workspace" style={{
      height: '100vh', 
      background: '#f8fafc', 
      color: '#0f172a',
      fontFamily: 'SFMono-Regular, Consolas, Courier New, monospace',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {/* 1. TOP HEADER - DIAGNOSTICS */}
      <div className="ui-toolbar" style={{
        height: 48, 
        borderBottom: '1px solid #e2e8f0', 
        background: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 16px',
        fontSize: 12
      }}>
        <Space size="large">
          <Space size="small">
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Lumos FastUMI Go</span>
            <StatusTag status="待处理" style={{ fontSize: 10, margin: 0 }}>OFFLINE CLIENT</StatusTag>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>静态IP:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>192.168.54.53</span>
          </Space>
          
          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>背包主机:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>192.168.54.110</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>耳机监听:</span>
            <span style={{ color: '#10b981' }}>已连接</span>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>HDMI模拟器:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>ACTIVE</span>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>边缘存储:</span>
            <span style={{ color: '#ea580c' }}>105GB可用</span>
          </Space>
          
          <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>按住模拟: L (左夹爪) | R (右夹爪) | Space (采集暂停)</span>
        </Space>

        <Space size="middle">
          <Button 
            size="small" 
            type={isMuted ? "default" : "primary"} 
            danger={!isMuted}
            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => {
              setIsMuted(!isMuted);
              message.info(isMuted ? '语音助理开启' : '语音助理已静音');
            }}
          >
            语音: {isMuted ? 'OFF' : 'ON'}
          </Button>
          <Button size="small" type="primary" danger ghost icon={<CloseCircleOutlined />} onClick={() => router.push('/collection/collect')}>退出工作台</Button>
        </Space>
      </div>

      {/* 2. MAIN LAYOUT: VIDEOS + SIDEBAR */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Left: 4-Grid Camera View */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, padding: 16, background: '#f1f5f9', overflow: 'hidden' }}>
          
          {/* Top Left: Left Wrist Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>
              | 左手-腕部视角 [WRIST_CAM_L]
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/left_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="left arm" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400"; }} />
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>设备尚未配对联通</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              ● 640x360 | 30 FPS
            </div>
          </div>

          {/* Top Right: Right Wrist Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>
              | 右手-腕部视角 [WRIST_CAM_R]
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/right_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="right arm" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=400"; }} />
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>设备尚未配对联通</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              ● 640x360 | 30 FPS
            </div>
          </div>

          {/* Bottom Left: Head Left Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>
              | 头部左目视角 [HEAD_LEFT_EYE]
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="head camera" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400"; }} />
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>设备尚未配对联通</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              ● 640x480 | 30 FPS
            </div>
          </div>

          {/* Bottom Right: Real-time Joint Twin schematic */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>
              | 三维关节真值实时孪生 [joints_telemetry.json]
            </div>
            <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Draw a stylized humanoid twin arm schematic */}
              <svg width="220" height="220" viewBox="0 0 100 100" style={{ zIndex: 1, opacity: lumosState === 'SERVICE_STOPPED' ? 0.2 : 1 }}>
                <line x1="50" y1="90" x2="50" y2="40" stroke="#475569" strokeWidth="2" />
                
                {/* Simulated twin kinematic arm movements */}
                <line x1="50" y1="40" x2="30" y2="25" stroke="#f59e0b" strokeWidth="3" />
                <line x1="30" y1="25" x2="20" y2="15" stroke="#10b981" strokeWidth="3" />
                
                <line x1="50" y1="40" x2="70" y2="25" stroke="#3b82f6" strokeWidth="3" />
                <line x1="70" y1="25" x2="80" y2="15" stroke="#06b6d4" strokeWidth="3" />

                <circle cx="50" cy="40" r="4" fill="#3b82f6" />
                <circle cx="30" cy="25" r="3" fill="#f59e0b" />
                <circle cx="70" cy="25" r="3" fill="#3b82f6" />
                <circle cx="20" cy="15" r="3.5" fill="#10b981" />
                <circle cx="80" cy="15" r="3.5" fill="#06b6d4" />
                <circle cx="50" cy="90" r="3" fill="#475569" />
              </svg>
              {lumosState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>设备尚未配对联通</span>}
              <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                <Tag color="cyan" style={{ fontSize: 9, margin: 0, fontFamily: 'monospace' }}>IMMEDIATE EVALUATION ON</Tag>
              </div>
              <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', fontFamily: 'monospace' }}>
                JOINT_0: 12.4° / JOINT_1: -45.1° / JOINT_2: 98.8°
              </div>
            </div>
          </div>

        </div>

        {/* Center: Main Controller Simulation & Voice Log */}
        <div style={{ width: 440, borderLeft: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', padding: 20, gap: 20 }}>
          
          {/* Audio Synthesizer sound waves logs */}
          <Card className="ui-table-card"
            title={
              <div style={{ fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                Lumos 语音导引助理
              </div>
            }
            size="small"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            styles={{ body: { padding: 12 } }}
            extra={
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 16 }}>
                <span style={{ display: 'inline-block', width: 2, height: 8, background: '#10b981', animation: 'eq-wave 0.8s infinite alternate' }}></span>
                <span style={{ display: 'inline-block', width: 2, height: 14, background: '#10b981', animation: 'eq-wave 1.1s infinite alternate 0.2s' }}></span>
                <span style={{ display: 'inline-block', width: 2, height: 6, background: '#10b981', animation: 'eq-wave 0.7s infinite alternate 0.1s' }}></span>
                <span style={{ display: 'inline-block', width: 2, height: 12, background: '#10b981', animation: 'eq-wave 0.9s infinite alternate 0.3s' }}></span>
              </div>
            }
          >
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', minHeight: 70, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>🔊</span>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(15, 23, 42, 0.45)', textTransform: 'uppercase', marginBottom: 2 }}>语音广播:</div>
                  <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.5 }}>
                    {voiceLogs[0]?.text || '待机中...'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: 'rgba(15, 23, 42, 0.45)', marginBottom: 6 }}>广播历史日志 (近5条)</div>
            <div style={{ height: 90, overflowY: 'auto', fontSize: 11, color: 'rgba(15, 23, 42, 0.6)' }}>
              {voiceLogs.slice(1, 6).map((log, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  <span style={{ color: 'rgba(15, 23, 42, 0.3)' }}>[{log.time}]</span> {log.text}
                </div>
              ))}
            </div>
          </Card>

          {/* Physical Device Controller Simulator */}
          <Card className="ui-table-card"
            title={<span style={{ fontSize: 13, color: '#0f172a' }}>离线物理终端设备模拟</span>}
            size="small"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            styles={{ body: { padding: 16 } }}
            extra={<StatusTag status={lumosState === 'SERVICE_STOPPED' ? '未开始' : '已完成'}>{lumosState === 'SERVICE_STOPPED' ? '未启动' : '已就绪'}</StatusTag>}
          >
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 'bold' }}>数采背包物理启动键 (蓝光按键)</div>
                <div style={{ fontSize: 10, color: 'rgba(15, 23, 42, 0.45)', marginTop: 2 }}>单击启动/关闭系统后台服务</div>
              </div>
              <Button 
                type="primary"
                shape="circle"
                style={{ 
                  width: 40, height: 40, background: '#1e3a8a', border: '2px solid #3b82f6', 
                  boxShadow: lumosState === 'SERVICE_STOPPED' ? 'none' : '0 0 15px #3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={handlePhysicalStart}
              >
                ⚡
              </Button>
            </div>

            <div style={{ background: 'rgba(255, 173, 20, 0.05)', border: '1px solid rgba(255, 173, 20, 0.15)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#faad14', fontWeight: 'bold' }}>当前流程状态指示:</div>
              <div style={{ fontSize: 12, color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔌</span>
                <span>
                  {lumosState === 'SERVICE_STOPPED' && '请按物理启动按钮开启服务'}
                  {lumosState === 'SELF_CHECKING' && '请继续长按 L 键（左侧夹爪） 3 秒完成绑定自检...'}
                  {lumosState === 'READY' && '已就绪。长按 L 键（左侧夹爪）3秒启动原点校准...'}
                  {lumosState === 'CALIBRATION' && `平行对齐中... 倒计时 ${calibrationCountdown} 秒`}
                  {lumosState === 'COLLECTING' && `轨迹循环录制中... (${collectionFrameCount} 帧)`}
                  {lumosState === 'COMPLETE' && '单段数据采集完成。请分配：左爪3秒打包保存，右爪3秒隔离丢弃'}
                  {lumosState === 'EPISODE_FINISHED_ASK' && '采集段落完成分发。左爪3s继续下一段，右爪3s退出程序'}
                </span>
              </div>
            </div>

            {/* Grippers triggers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#10b981' }}>左夹爪 (标定/启动/保存)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(15, 23, 42, 0.45)', margin: '8px 0' }}>
                  <span>手势状态:</span>
                  <span>{leftHoldActive ? '闭合' : '松开'}</span>
                </div>
                <Progress percent={leftGripperHold} size="small" status="active" showInfo={false} strokeColor="#10b981" />
                <Button 
                  size="small" type="dashed" style={{ marginTop: 8, fontSize: 10, width: '100%', borderColor: '#10b981', color: '#10b981', background: 'transparent' }}
                  onMouseDown={() => setLeftHoldActive(true)}
                  onMouseUp={() => { setLeftHoldActive(false); setLeftGripperHold(0); }}
                >
                  长按模拟 (Key L)
                </Button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#ef4444' }}>右夹爪 (隔离/退出)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(15, 23, 42, 0.45)', margin: '8px 0' }}>
                  <span>手势状态:</span>
                  <span>{rightHoldActive ? '闭合' : '松开'}</span>
                </div>
                <Progress percent={rightGripperHold} size="small" status="active" showInfo={false} strokeColor="#ef4444" />
                <Button 
                  size="small" type="dashed" style={{ marginTop: 8, fontSize: 10, width: '100%', borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}
                  onMouseDown={() => setRightHoldActive(true)}
                  onMouseUp={() => { setRightHoldActive(false); setRightGripperHold(0); }}
                >
                  长按模拟 (Key R)
                </Button>
              </div>
            </div>

          </Card>

        </div>

        {/* Right Sidebar: Configs json + Completed lists */}
        <div style={{ width: 380, borderLeft: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header config selector */}
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚙️ 本地任务配置 tasks_config.json
            </span>
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setConfigEditorOpen(true)}>编辑</Button>
          </div>

          <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Visual configuration details */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>任务ID (task_id):</span>
                <span style={{ color: '#0f172a' }}>{taskId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>中文描述:</span>
                <span style={{ color: '#0f172a' }}>Lumos 双手整理筷子与勺子</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>单段限制 (帧数):</span>
                <span style={{ color: '#faad14', fontWeight: 'bold' }}>{tasksConfig.rgb_frame_number} 帧 ({(tasksConfig.rgb_frame_number / 30).toFixed(1)}s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>目标段数 (total_count):</span>
                <span style={{ color: '#0f172a' }}>{tasksConfig.total_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>即时质检评估 (if_quality_check):</span>
                <span style={{ color: tasksConfig.if_quality_check ? '#10b981' : '#ef4444' }}>{tasksConfig.if_quality_check ? '已开启' : '已关闭'}</span>
              </div>
            </div>

            {/* List of episodes */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>当前批次已采记录 ({recordedCount} / {tasksConfig.total_count})</span>
                <span style={{ color: '#10b981', fontSize: 10 }}>成功率: {Math.floor((completedEpisodes.filter(e => e.status === '已保存').length / Math.max(1, completedEpisodes.length)) * 100)}%</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 280, overflowY: 'auto' }}>
                {completedEpisodes.map((ep, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}>{ep.id}</span>
                      <StatusTag status={ep.status === '已保存' ? '已完成' : '失败'} style={{ fontSize: 9, margin: 0 }}>{ep.status}</StatusTag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15, 23, 42, 0.45)' }}>
                      <span>时长: {ep.time}s</span>
                      <span>总帧数: {ep.frames}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. FOOTER TIMELINE & REALTIME STATE */}
      <div className="ui-action-footer" style={{ height: 60, borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'rgba(15, 23, 42, 0.45)' }}>
          单段采集耗时: <span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 13 }}>{collectionTime}s</span> / 15.0s &nbsp;|&nbsp;
          采集数据帧率: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>30 FPS</span> &nbsp;|&nbsp;
          当前帧计数: <span style={{ color: '#faad14', fontWeight: 'bold', fontSize: 13 }}>{collectionFrameCount}帧</span> / 450帧
        </div>

        {/* Live progress slider */}
        <div style={{ width: '40%', padding: '0 16px' }}>
          <Progress 
            percent={Math.floor((collectionFrameCount / tasksConfig.rgb_frame_number) * 100)} 
            strokeColor={{
              '0%': '#10b981',
              '100%': '#3b82f6',
            }}
            trailColor="rgba(0,0,0,0.05)"
            status={lumosState === 'COLLECTING' ? 'active' : 'normal'}
            showInfo={false}
          />
        </div>

        <div style={{ fontSize: 11, color: 'rgba(15, 23, 42, 0.45)' }}>
          {lumosState === 'SERVICE_STOPPED' && '服务尚未启动'}
          {lumosState === 'SELF_CHECKING' && '设备自检通信中...'}
          {lumosState === 'READY' && <span style={{ color: '#10b981' }}>● 系统空闲就绪</span>}
          {lumosState === 'CALIBRATION' && <span style={{ color: '#faad14' }}>● 正在重置关节零位...</span>}
          {lumosState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● 正在采集轨迹数据...</span>}
          {lumosState === 'COMPLETE' && <span style={{ color: '#faad14' }}>● 数据暂存，等待分发</span>}
          {lumosState === 'EPISODE_FINISHED_ASK' && <span style={{ color: '#3b82f6' }}>● 采集完毕，等待下一环指令</span>}
        </div>
      </div>

      {/* JSON CONFIG DRAWER / MODAL */}
      <ConfigProvider>
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: configEditorOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <Card 
            title="编辑本地 tasks_config.json 配置文件" 
            style={{ width: 600, background: '#ffffff', border: '1px solid #e2e8f0' }}
            extra={
              <Space>
                <Button size="small" onClick={() => setConfigEditorOpen(false)}>取消</Button>
                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveConfig}>保存修改</Button>
              </Space>
            }
          >
            <div style={{ fontSize: 11, color: 'rgba(15, 23, 42, 0.45)', marginBottom: 8 }}>
              系统已检测到宿主机配置文件路径: `/home/lumos/FastUMI_Data_Collection-Data_Collection_evaluation/config/tasks_config.json`
            </div>
            <Input.TextArea 
              rows={12} 
              value={configJsonStr} 
              onChange={(e) => setConfigJsonStr(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 12, background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }} 
            />
          </Card>
        </div>
      </ConfigProvider>

      <style jsx>{`
        @keyframes eq-wave {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.3); }
        }
        @keyframes blink-dot {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ==================== GALBOT 1.16 WORKSPACE (HIGH-FIDELITY DUAL-CORE) ====================
const defaultGalbotTasksConfig = {
  task_id: "GB-20260605001",
  task_name: "Galbot 1.16 双臂精细整理作业",
  rgb_frame_number: 450,
  depth_frame_number: 225,
  save_path: "/userdata/user_config/data_collection/data/",
  if_quality_check: true,
  camera_sync_alignment: true,
  ptp_sync_limit_ms: 0.2,
  total_count: 50,
  audio_volume: 8,
};

const defaultGalbotEpisodes = [
  { id: 'EP_001', time: '15.0', frames: 450, status: '已保存' },
  { id: 'EP_002', time: '14.8', frames: 444, status: '已保存' },
];

function Galbot116Workspace({ taskId, router }) {
  const { message } = App.useApp();
  const [galbotState, setGalbotState] = useState('SERVICE_STOPPED'); // SERVICE_STOPPED, BOOTING, READY, COLLECTING, COMPLETE
  const [voiceLogs, setVoiceLogs] = useState([
    { time: '17:33:00', text: '双端硬件连通，服务未开启。请点击右侧［一键启动双端服务］以拉起底座控制与上位机桥接。' }
  ]);
  const [isMuted, setIsMuted] = useState(false);
  const [tasksConfig, setTasksConfig] = useState(defaultGalbotTasksConfig);
  const [configEditorOpen, setConfigEditorOpen] = useState(false);
  const [configJsonStr, setConfigJsonStr] = useState(JSON.stringify(defaultGalbotTasksConfig, null, 2));

  const [collectionFrameCount, setCollectionFrameCount] = useState(0);
  const [collectionTime, setCollectionTime] = useState(0.0);
  const [ptpDeviation, setPtpDeviation] = useState(0.0);
  const [angleOffset, setAngleOffset] = useState(0);
  const [completedEpisodes, setCompletedEpisodes] = useState(defaultGalbotEpisodes);
  const [recordedCount, setRecordedCount] = useState(2);

  const [bootLogs, setBootLogs] = useState([]);

  const speakText = (text) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setVoiceLogs(prev => [{ time: timeStr, text }, ...prev.slice(0, 19)]);

    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Simulated system daemon boots
  const startBooting = () => {
    if (galbotState !== 'SERVICE_STOPPED') return;
    setGalbotState('BOOTING');
    setBootLogs([]);
    speakText('正在建立 SSH 连接，尝试拉起 XCU 底座运动控制服务和 HPU 守护进程...');

    const simulatedTerminalSteps = [
      { t: 0, log: 'Connecting to root@192.168.1.66...' },
      { t: 300, log: '[XCU] SSH Authenticated (Password: 12345678)' },
      { t: 600, log: '[XCU] Executing: systemctl start remote_ctrl_record.target' },
      { t: 900, log: '[XCU] Service remote_ctrl_record.target loaded successfully.' },
      { t: 1200, log: 'Connecting to galbot@192.168.1.88...' },
      { t: 1500, log: '[HPU] SSH Authenticated (Password: gb@2023)' },
      { t: 1800, log: '[HPU] Executing: systemctl start supervisor' },
      { t: 2100, log: '[HPU] supervisor.service started. Spawning subprocesses...' },
      { t: 2400, log: '[HPU] [supervisor] galbot_upper_bridge active (PID: 18442, log: /userdata/log/data-gather-upper/galbot-upper)' },
      { t: 2700, log: '[SYS] Commencing PTP clock synchronization (IEEE 1588)...' },
      { t: 3000, log: '[SYS] Clock lock: DELTA=0.08ms (<= 0.2ms benchmark). PTP synchronized.' },
      { t: 3300, log: '[SYS] 4-camera GMSL2 streams verified. Frame sync initialized.' },
      { t: 3600, log: '● System status: READY. Dual-core datastream running.' }
    ];

    simulatedTerminalSteps.forEach(step => {
      setTimeout(() => {
        setBootLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: step.log }]);
      }, step.t);
    });

    setTimeout(() => {
      setGalbotState('READY');
      setPtpDeviation(0.08);
      speakText('自检及双端进程全部就绪！网关时钟已同步，按 Space 键或点击开始录制。');
    }, 3700);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (galbotState === 'READY') {
          setGalbotState('COLLECTING');
          setCollectionFrameCount(0);
          setCollectionTime(0.0);
          speakText('录制开启。系统正在实时捕捉 XCU 轨迹和 HPU 视频帧，请开始作业。');
        } else if (galbotState === 'COLLECTING') {
          setGalbotState('READY');
          speakText('录制已暂停。');
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (galbotState === 'COMPLETE') {
          saveCurrentEpisode();
        }
      } else if (e.code === 'KeyR' || e.code === 'Backspace') {
        if (galbotState === 'COMPLETE') {
          e.preventDefault();
          discardCurrentEpisode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galbotState, collectionTime]);

  // Frame ticking logic
  useEffect(() => {
    let collectInterval;
    if (galbotState === 'COLLECTING') {
      collectInterval = setInterval(() => {
        setCollectionFrameCount(prev => {
          const next = prev + 3; // 3 frames per 100ms
          const maxFrames = tasksConfig.rgb_frame_number;

          if (next === Math.floor(maxFrames * 0.5)) {
            speakText('采集进度百分之五十，左右臂轨迹写入正常。');
          }
          if (next === Math.floor(maxFrames * 0.8)) {
            speakText('已采集百分之八十，请稳定末端夹爪。');
          }

          if (next >= maxFrames) {
            clearInterval(collectInterval);
            setGalbotState('COMPLETE');
            speakText('采集段落满额。按 Enter 键保存数据，按 R 键作废重录。');
            return maxFrames;
          }
          return next;
        });

        setCollectionTime(t => parseFloat((t + 0.1).toFixed(1)));
        setAngleOffset(a => (a + 8) % 360);
        setPtpDeviation(parseFloat((0.07 + Math.random() * 0.08).toFixed(3)));
      }, 100);
    }
    return () => clearInterval(collectInterval);
  }, [galbotState, tasksConfig.rgb_frame_number]);

  const saveCurrentEpisode = () => {
    const duration = collectionTime.toFixed(1);
    const newEp = {
      id: `EP_${String(completedEpisodes.length + 1).padStart(3, '0')}`,
      time: duration,
      frames: tasksConfig.rgb_frame_number,
      status: '已保存'
    };
    setCompletedEpisodes(prev => [newEp, ...prev]);
    setRecordedCount(prev => prev + 1);
    setGalbotState('READY');
    speakText(`第 ${completedEpisodes.length + 1} 段数据保存成功。请继续下一轮作业。`);
  };

  const discardCurrentEpisode = () => {
    setGalbotState('READY');
    speakText('当前段落数据已作废丢弃。');
    message.warning('数据已丢弃，请重新开始采集');
  };

  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(configJsonStr);
      setTasksConfig(parsed);
      setConfigEditorOpen(false);
      message.success('本地数采配置文件 tasks_config.json 保存成功，已动态重载参数！');
      speakText('任务目标参数已刷新。');
    } catch(e) {
      message.error('JSON 格式有误，请检查语法！');
    }
  };

  return (
    <div className="ui-workspace" style={{
      height: '100vh', 
      background: '#f8fafc', 
      color: '#0f172a',
      fontFamily: 'SFMono-Regular, Consolas, Courier New, monospace',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {/* 1. TOP DIAGNOSTICS BAR */}
      <div className="ui-toolbar" style={{
        height: 48, 
        borderBottom: '1px solid #e2e8f0', 
        background: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 16px',
        fontSize: 12
      }}>
        <Space size="large">
          <Space size="small">
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Galbot 1.16 Workspace</span>
            <StatusTag status="进行中" style={{ fontSize: 10, margin: 0 }}>XCU/HPU DUAL-CORE</StatusTag>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>XCU 控制底座:</span>
            <span style={{ color: galbotState === 'SERVICE_STOPPED' ? '#94a3b8' : '#10b981', fontWeight: 'bold' }}>192.168.1.66</span>
          </Space>
          
          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>HPU 算力板:</span>
            <span style={{ color: galbotState === 'SERVICE_STOPPED' ? '#94a3b8' : '#10b981', fontWeight: 'bold' }}>192.168.1.88</span>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>Wi-Fi SSID:</span>
            <span style={{ color: '#10b981' }}>miracle-office-5g</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: galbotState === 'SERVICE_STOPPED' ? '#94a3b8' : '#10b981', display: 'inline-block' }}></span>
          </Space>

          <Space size="small" style={{ color: 'rgba(15, 23, 42, 0.45)' }}>
            <span>PTP 偏差:</span>
            <span style={{ color: ptpDeviation > 0.2 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
              {galbotState === 'SERVICE_STOPPED' ? '—' : `${ptpDeviation.toFixed(3)}ms`}
            </span>
          </Space>
        </Space>

        <Space size="middle">
          <Button 
            size="small" 
            type={isMuted ? "default" : "primary"} 
            danger={!isMuted}
            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => {
              setIsMuted(!isMuted);
              message.info(isMuted ? '语音助理开启' : '语音助理已静音');
            }}
          >
            语音: {isMuted ? 'OFF' : 'ON'}
          </Button>
          <Button size="small" type="primary" danger ghost icon={<CloseCircleOutlined />} onClick={() => window.close()}>退出工作台</Button>
        </Space>
      </div>

      {/* 2. MAIN GRID LAYOUT */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Left: 4-Grid Camera View */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, padding: 16, background: '#f1f5f9', overflow: 'hidden' }}>
          
          {/* Top Left: HEAD_L Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
              <span>| 头部左相机视角 [HEAD_L]</span>
              {galbotState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● REC</span>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: galbotState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="head camera left" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400"; }} />
              {galbotState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>双端服务离线 (待启动)</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              1080p | 30 FPS | PTP Sync: OK
            </div>
          </div>

          {/* Top Right: HEAD_R Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
              <span>| 头部右相机视角 [HEAD_R]</span>
              {galbotState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● REC</span>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: galbotState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="head camera right" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=400"; }} />
              {galbotState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>双端服务离线 (待启动)</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              1080p | 30 FPS | PTP Sync: OK
            </div>
          </div>

          {/* Bottom Left: HAND_L Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
              <span>| 左手-腕部视角 [HAND_L]</span>
              {galbotState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● REC</span>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/left_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: galbotState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="left wrist camera" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400"; }} />
              {galbotState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>双端服务离线 (待启动)</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              720p | 30 FPS | PTP Sync: OK
            </div>
          </div>

          {/* Bottom Right: HAND_R Camera */}
          <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 8, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
              <span>| 右手-腕部视角 [HAND_R]</span>
              {galbotState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● REC</span>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src="/assets/images/right_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: galbotState === 'SERVICE_STOPPED' ? 0.2 : 0.95 }} alt="right wrist camera" onError={(e) => { e.target.src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400"; }} />
              {galbotState === 'SERVICE_STOPPED' && <span style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>双端服务离线 (待启动)</span>}
            </div>
            <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 10, color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 4 }}>
              720p | 30 FPS | PTP Sync: OK
            </div>
          </div>

        </div>

        {/* Center: Daemon logs & Joint Twin */}
        <div style={{ width: 420, borderLeft: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', padding: 16, gap: 16, overflowY: 'auto' }}>
          
          {/* Boot Control & Daemons Panel */}
          <Card className="ui-table-card"
            title={
              <div style={{ fontSize: 12, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DeploymentUnitOutlined style={{ color: '#3b82f6' }} />
                双端系统服务管理器
              </div>
            }
            size="small"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 'bold' }}>XCU 控制箱底座守护:</div>
                  <div style={{ fontSize: 9, color: 'rgba(15, 23, 42, 0.45)' }}>`remote_ctrl_record.target`</div>
                </div>
                <StatusTag status={galbotState === 'SERVICE_STOPPED' ? '未开始' : galbotState === 'BOOTING' ? '进行中' : '已完成'}>{galbotState === 'SERVICE_STOPPED' ? '已停止' : '已就绪'}</StatusTag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 'bold' }}>HPU 上位机守护:</div>
                  <div style={{ fontSize: 9, color: 'rgba(15, 23, 42, 0.45)' }}>`supervisor` -&gt; `galbot_upper_bridge`</div>
                </div>
                <StatusTag status={galbotState === 'SERVICE_STOPPED' ? '未开始' : galbotState === 'BOOTING' ? '进行中' : '已完成'}>{galbotState === 'SERVICE_STOPPED' ? '已停止' : '已就绪'}</StatusTag>
              </div>

              {galbotState === 'SERVICE_STOPPED' ? (
                <Button type="primary" block icon={<SyncOutlined spin={false} />} onClick={startBooting} style={{ background: '#1e3a8a', borderColor: '#3b82f6' }}>
                  一键启动双端服务
                </Button>
              ) : (
                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, height: 120, overflowY: 'auto', fontSize: 9, fontFamily: 'monospace', color: '#0f172a' }}>
                  {bootLogs.map((log, idx) => (
                    <div key={idx} style={{ marginBottom: 2 }}>
                      <span style={{ color: 'rgba(15, 23, 42, 0.3)' }}>[{log.time}]</span> {log.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 3D Kinematic Twin SVG */}
          <Card className="ui-table-card"
            title={
              <div style={{ fontSize: 12, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RobotOutlined style={{ color: '#10b981' }} />
                三维关节真值实时孪生 (14 DoF)
              </div>
            }
            size="small"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
          >
            <div style={{ background: '#f8fafc', borderRadius: 6, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="180" height="180" viewBox="0 0 100 100" style={{ opacity: galbotState === 'SERVICE_STOPPED' ? 0.2 : 1 }}>
                {/* Robot body base */}
                <rect x="44" y="65" width="12" height="25" rx="3" fill="#334155" />
                <line x1="50" y1="65" x2="50" y2="35" stroke="#475569" strokeWidth="2.5" />
                <circle cx="50" cy="35" r="5" fill="#f59e0b" /> {/* Head */}

                {/* Left Arm (Kinematic calculations using angleOffset) */}
                <g transform={`rotate(${Math.sin(angleOffset * Math.PI / 180) * 18}, 44, 42)`}>
                  <line x1="44" y1="42" x2="28" y2="46" stroke="#3b82f6" strokeWidth="3" />
                  <circle cx="28" cy="46" r="3" fill="#3b82f6" />
                  <g transform={`rotate(${Math.cos((angleOffset + 90) * Math.PI / 180) * 25}, 28, 46)`}>
                    <line x1="28" y1="46" x2="16" y2="38" stroke="#10b981" strokeWidth="2" />
                    <circle cx="16" cy="38" r="2" fill="#10b981" />
                    {/* Gripper */}
                    <path d="M 16 38 L 12 36 M 16 38 L 12 40" stroke="#f59e0b" strokeWidth="1.5" />
                  </g>
                </g>

                {/* Right Arm */}
                <g transform={`rotate(${Math.cos(angleOffset * Math.PI / 180) * 18}, 56, 42)`}>
                  <line x1="56" y1="42" x2="72" y2="46" stroke="#3b82f6" strokeWidth="3" />
                  <circle cx="72" cy="46" r="3" fill="#3b82f6" />
                  <g transform={`rotate(${Math.sin((angleOffset + 45) * Math.PI / 180) * 25}, 72, 46)`}>
                    <line x1="72" y1="46" x2="84" y2="38" stroke="#10b981" strokeWidth="2" />
                    <circle cx="84" cy="38" r="2" fill="#10b981" />
                    {/* Gripper */}
                    <path d="M 84 38 L 88 36 M 84 38 L 88 40" stroke="#f59e0b" strokeWidth="1.5" />
                  </g>
                </g>
              </svg>

              {galbotState === 'SERVICE_STOPPED' && (
                <div style={{ position: 'absolute', color: 'rgba(0,0,0,0.45)', fontSize: 11 }}>
                  等待双端服务启动...
                </div>
              )}

              <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 8, color: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>
                {galbotState === 'SERVICE_STOPPED' ? 'TELEMETRY: OFFLINE' : `PTP OFFSET: ${ptpDeviation.toFixed(4)}ms`}
              </div>
            </div>
          </Card>

          {/* Voice logs */}
          <Card className="ui-table-card"
            title={
              <div style={{ fontSize: 11, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                语音助手广播流
              </div>
            }
            size="small"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
          >
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', minHeight: 50, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#0f172a', lineHeight: 1.4 }}>
                🎙️ {voiceLogs[0]?.text || '就绪...'}
              </div>
            </div>
            <div style={{ height: 60, overflowY: 'auto', fontSize: 9, color: 'rgba(15, 23, 42, 0.45)' }}>
              {voiceLogs.slice(1, 4).map((log, idx) => (
                <div key={idx} style={{ marginBottom: 2 }}>
                  <span style={{ color: 'rgba(15, 23, 42, 0.3)' }}>[{log.time}]</span> {log.text}
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Right Sidebar: Config & Record details */}
        <div style={{ width: 380, borderLeft: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚙️ 边缘数采任务配置 (HPU)
            </span>
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setConfigEditorOpen(true)}>编辑 JSON</Button>
          </div>

          <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Visual configuration details */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>任务标识 ID:</span>
                <span style={{ color: '#0f172a' }}>{taskId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>作业名称:</span>
                <span style={{ color: '#0f172a' }}>{tasksConfig.task_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>保存路径 (HPU):</span>
                <span style={{ color: 'rgba(15, 23, 42, 0.7)', fontSize: 9 }}>{tasksConfig.save_path}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>录制上限:</span>
                <span style={{ color: '#faad14', fontWeight: 'bold' }}>{tasksConfig.rgb_frame_number} 帧 (15.0s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'rgba(15, 23, 42, 0.45)' }}>PTP 同步阀值:</span>
                <span style={{ color: '#10b981' }}>&lt;= {tasksConfig.ptp_sync_limit_ms}ms</span>
              </div>
            </div>

            {/* List of episodes */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 200 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>已保存 Episode 段落 ({recordedCount} / {tasksConfig.total_count})</span>
                <span style={{ color: '#10b981', fontSize: 10 }}>上传通路: OK</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', maxHeight: 220 }}>
                {completedEpisodes.map((ep, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}>{ep.id}</span>
                      <StatusTag status="已完成" style={{ fontSize: 9, margin: 0 }}>{ep.status}</StatusTag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15, 23, 42, 0.45)' }}>
                      <span>时长: {ep.time}s</span>
                      <span>总帧数: {ep.frames}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. FOOTER CONTROL BAR */}
      <div className="ui-action-footer" style={{ height: 64, borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'rgba(15, 23, 42, 0.45)' }}>
          作业时间: <span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 13 }}>{collectionTime.toFixed(1)}s</span> / 15.0s &nbsp;|&nbsp;
          时序帧率: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>30 FPS</span> &nbsp;|&nbsp;
          帧数采集: <span style={{ color: '#faad14', fontWeight: 'bold', fontSize: 13 }}>{collectionFrameCount}帧</span> / 450帧
        </div>

        {/* Play/Pause controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {galbotState === 'SERVICE_STOPPED' || galbotState === 'BOOTING' ? (
            <Button type="primary" disabled style={{ width: 180, fontWeight: 'bold' }}>等待双端服务启动...</Button>
          ) : galbotState === 'READY' ? (
            <Button type="primary" danger shape="round" icon={<PlayCircleOutlined />} size="large" onClick={() => {
              setGalbotState('COLLECTING');
              setCollectionFrameCount(0);
              setCollectionTime(0.0);
              speakText('数据录制已开启。');
            }} style={{ width: 180, fontWeight: 'bold' }}>
              开始录制 (Space)
            </Button>
          ) : galbotState === 'COLLECTING' ? (
            <Button shape="round" icon={<PauseCircleOutlined />} size="large" onClick={() => {
              setGalbotState('READY');
              speakText('录制已暂停。');
            }} style={{ width: 180, fontWeight: 'bold', background: '#f5f5f5', color: '#000' }}>
              暂停录制 (Space)
            </Button>
          ) : galbotState === 'COMPLETE' ? (
            <Space size="middle">
              <Button type="primary" style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 'bold' }} onClick={saveCurrentEpisode}>
                保存本段 (Enter)
              </Button>
              <Button danger onClick={discardCurrentEpisode}>
                作废重录 (Backspace)
              </Button>
            </Space>
          ) : null}
        </div>

        <div style={{ fontSize: 11, color: 'rgba(15, 23, 42, 0.45)' }}>
          {galbotState === 'SERVICE_STOPPED' && <span style={{ color: '#94a3b8' }}>● 双端控制器离线</span>}
          {galbotState === 'BOOTING' && <span style={{ color: '#3b82f6' }}>● 正在连接 XCU / HPU 并对齐时钟...</span>}
          {galbotState === 'READY' && <span style={{ color: '#10b981' }}>● 网关时钟同步就绪</span>}
          {galbotState === 'COLLECTING' && <span style={{ color: '#ef4444', animation: 'blink-dot 1s infinite' }}>● 正在捕捉 ROS 双端轨迹与视频帧...</span>}
          {galbotState === 'COMPLETE' && <span style={{ color: '#faad14' }}>● 数据捕获满额，待保存</span>}
        </div>
      </div>

      {/* JSON CONFIG DRAWER / MODAL */}
      <ConfigProvider>
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: configEditorOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <Card 
            title="编辑本地 tasks_config.json 配置文件 (HPU)" 
            style={{ width: 600, background: '#ffffff', border: '1px solid #e2e8f0' }}
            extra={
              <Space>
                <Button size="small" onClick={() => setConfigEditorOpen(false)}>取消</Button>
                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveConfig}>保存修改</Button>
              </Space>
            }
          >
            <div style={{ fontSize: 11, color: 'rgba(15, 23, 42, 0.45)', marginBottom: 8 }}>
              HPU 本地任务配置文件路径: `/userdata/user_config/data_collection/tasks_config.json`
            </div>
            <Input.TextArea 
              rows={12} 
              value={configJsonStr} 
              onChange={(e) => setConfigJsonStr(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 12, background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }} 
            />
          </Card>
        </div>
      </ConfigProvider>

    </div>
  );
}

// ==================== WORKSPACE ENTRY SWITCHER ====================
export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const taskId = searchParams.get('taskId') || 'CT-20250301001';
  const isGalbot116 = taskId?.includes('1.16') || taskId?.includes('GB116') || taskId?.includes('GB105') || taskId === 'CT-20260605001';
  const isLumos = !isGalbot116 && (taskId === 'CT-20260414001' || taskId?.includes('2026') || taskId?.includes('Lumos'));

  return (
    <App>
      {isGalbot116 ? (
        <Galbot116Workspace taskId={taskId} router={router} />
      ) : isLumos ? (
        <LumosWorkspace taskId={taskId} router={router} />
      ) : (
        <HumanoidWorkspace taskId={taskId} router={router} />
      )}
    </App>
  );
}
