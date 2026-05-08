'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, Space, Badge, message, Tabs, Switch, App, Progress, Tooltip, Tag } from 'antd';
import { 
  CaretDownOutlined, 
  ExpandOutlined, 
  CompressOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  CloseCircleOutlined, 
  ApiOutlined, 
  DashboardOutlined, 
  HddOutlined, 
  CheckCircleFilled, 
  WarningFilled,
  VideoCameraOutlined,
  ThunderboltFilled,
  MonitorOutlined,
  SaveOutlined,
  StepForwardOutlined,
  SafetyCertificateOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const { message: antdMessage } = App.useApp();
  const taskId = params?.taskId || 'CT-20250301001';
  
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [stepRecords, setStepRecords] = useState({});
  const [completedEpisodes, setCompletedEpisodes] = useState([]);
  const [fullscreenId, setFullscreenId] = useState(null);
  const elapsedRef = useRef(0);

  const steps = [
    { title: '右手拿起桌面上的筷子' },
    { title: '右手将筷子放置在厨具盒中' },
    { title: '左手拿起桌面上的餐叉' },
    { title: '左手将餐叉放置在厨具盒中' },
    { title: '右手拿起桌面上的勺子' },
    { title: '右手将勺子放置在厨具盒中' },
  ];

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

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
      } else if (e.code === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, activeStep]);

  const handleSave = () => {
    if (elapsedRef.current === 0) {
      antdMessage.warning('当前无数据录制，无法保存');
      return;
    }
    setCompletedEpisodes(prev => [...prev, {
        id: `EP_${String(prev.length + 1).padStart(3, '0')}`,
        time: (elapsedRef.current / 10).toFixed(1),
        frames: elapsedRef.current * 3,
        status: '已上传云端'
    }]);
    antdMessage.success(`当前 Episode (${(elapsedRef.current / 10).toFixed(1)}s) 动作序列已打包，成功保存至云端！`);
    setIsRecording(false);
    setElapsed(0);
    setActiveStep(0);
    setStepRecords({});
  };

  const toggleFullscreen = (id) => {
    setFullscreenId(prev => prev === id ? null : id);
  };

  const PanelHeader = ({ id, title, extra }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '8px 12px', 
      background: 'rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <Space size={8}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1677ff' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{title}</span>
      </Space>
      <Space>
        {extra}
        <Button 
          type="text" 
          size="small" 
          icon={fullscreenId === id ? <CompressOutlined /> : <ExpandOutlined />} 
          onClick={() => toggleFullscreen(id)}
          style={{ color: 'rgba(255,255,255,0.45)' }}
        />
      </Space>
    </div>
  );

  return (
    <div style={{ 
      height: '100vh', 
      background: '#020817', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#fff'
    }}>
      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .step-item-active {
          background: rgba(22, 119, 255, 0.15) !important;
          border-left: 3px solid #1677ff !important;
        }
      `}</style>

      {/* Edge Client Status Header */}
      <div style={{ 
        height: 64, 
        padding: '0 24px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.8)'
      }}>
        <Space size={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: 8, 
              background: 'linear-gradient(135deg, #1677ff, #0958d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MonitorOutlined style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{taskId} - 采集工作台</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>硬件实时同步模式</div>
            </div>
          </div>
          <Divider vertical />
          <Space size={20}>
            <Tooltip title="控制箱连通性">
              <Space size={4}>
                <ApiOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontSize: 12, color: '#52c41a' }}>1ms</span>
              </Space>
            </Tooltip>
            <Tooltip title="本地 SSD 剩余空间">
              <Space size={4}>
                <HddOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>128GB (Free)</span>
              </Space>
            </Tooltip>
            <Tooltip title="系统算力负载">
              <Space size={4}>
                <DashboardOutlined style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>CPU 24%</span>
              </Space>
            </Tooltip>
          </Space>
        </Space>

        <Space size="large">
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,77,79,0.1)', padding: '4px 16px', borderRadius: 20, border: '1px solid rgba(255,77,79,0.3)' }}>
              <span style={{ color: '#ff4d4f', fontSize: 20, animation: 'blink 1s infinite' }}>●</span>
              <span style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 18, fontFamily: 'monospace' }}>
                {(elapsed / 10).toFixed(1)}s
              </span>
            </div>
          )}
          <Space>
            <Button 
              type="primary" 
              danger={isRecording}
              icon={isRecording ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
              onClick={() => setIsRecording(!isRecording)}
              size="large"
              style={{ width: 140, height: 44, borderRadius: 8, fontWeight: 700 }}
            >
              {isRecording ? '停止录制' : '开始采集'}
            </Button>
            <Button 
              icon={<SaveOutlined />} 
              size="large" 
              onClick={handleSave}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', height: 44 }}
            >
              打包保存 (Enter)
            </Button>
            <Button 
              icon={<CloseCircleOutlined />} 
              size="large" 
              onClick={() => router.push('/collection/collect')}
              style={{ background: 'rgba(255,77,79,0.05)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.2)', height: 44 }}
            >
              退出
            </Button>
          </Space>
        </Space>
      </div>

      {/* Main Layout Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left: Video Streams */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 12, overflow: 'hidden' }}>
          <div style={{ 
            display: fullscreenId ? 'block' : 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridTemplateRows: '1fr 1fr', 
            gap: 12, 
            height: '100%' 
          }}>
            {(!fullscreenId || fullscreenId === 'cam1') && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}>
                <PanelHeader id="cam1" title="LEFT_WRIST_CAM" extra={<Tag color="green" bordered={false} style={{ fontSize: 10 }}>LIVE 30fps</Tag>} />
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                  <img src="/assets/images/left_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="cam" />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px' }}>640x360 | RGBD</div>
                </div>
              </div>
            )}
            {(!fullscreenId || fullscreenId === 'cam2') && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}>
                <PanelHeader id="cam2" title="RIGHT_WRIST_CAM" extra={<Tag color="green" bordered={false} style={{ fontSize: 10 }}>LIVE 30fps</Tag>} />
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                  <img src="/assets/images/right_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="cam" />
                </div>
              </div>
            )}
            {(!fullscreenId || fullscreenId === 'cam3') && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}>
                <PanelHeader id="cam3" title="HEAD_STEREO_CAM" extra={<Tag color="green" bordered={false} style={{ fontSize: 10 }}>LIVE 60fps</Tag>} />
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                  <img src="/assets/images/main_cam.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="cam" />
                </div>
              </div>
            )}
            {(!fullscreenId || fullscreenId === 'cam4') && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}>
                <PanelHeader id="cam4" title="DIGITAL_TWIN_RENDER" extra={<Tag color="blue" bordered={false} style={{ fontSize: 10 }}>120Hz</Tag>} />
                <div style={{ flex: 1, position: 'relative', background: '#0a0f1e' }}>
                  <div style={{ 
                    position: 'absolute', inset: 0, 
                    backgroundImage: 'linear-gradient(rgba(22,119,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(22,119,255,0.1) 1px, transparent 1px)', 
                    backgroundSize: '30px 30px', transform: 'perspective(500px) rotateX(60deg) scale(2)', transformOrigin: 'center 100%' 
                  }} />
                  <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', width: 30, height: 100, background: '#1677ff', borderRadius: 4, boxShadow: '0 0 20px rgba(22,119,255,0.5)' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', padding: '12px 12px 12px 0', gap: 12 }}>
          
          {/* Task Info & Steps */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Title level={5} style={{ color: '#fff', margin: 0, fontSize: 14 }}>任务流程指引</Title>
                <Tag color="blue">当前步骤 {activeStep + 1}/{steps.length}</Tag>
              </div>
              <div style={{ background: 'rgba(22,119,255,0.1)', padding: '12px', borderRadius: 8, border: '1px solid rgba(22,119,255,0.2)' }}>
                <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600 }}>目标: {steps[activeStep].title}</Text>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {steps.map((s, idx) => (
                <div key={idx} className={idx === activeStep ? 'step-item-active' : ''} style={{ 
                  padding: '12px 16px', 
                  borderRadius: 8, 
                  marginBottom: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  transition: 'all 0.3s'
                }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: '50%', 
                    background: idx < activeStep ? '#52c41a' : idx === activeStep ? '#1677ff' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700
                  }}>
                    {idx < activeStep ? <CheckCircleFilled style={{ color: '#fff' }} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: idx <= activeStep ? '#fff' : 'rgba(255,255,255,0.3)' }}>{s.title}</div>
                    {idx === activeStep && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Space: 录制 | X: 完成</div>}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <Button 
                block 
                icon={<StepForwardOutlined />} 
                onClick={() => setActiveStep(s => (s + 1) % steps.length)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                跳过当前步骤
              </Button>
            </div>
          </div>

          {/* Quick Controls & Status */}
          <div className="glass-panel" style={{ height: 240, borderRadius: 12, padding: 16 }}>
            <Title level={5} style={{ color: '#fff', margin: '0 0 16px 0', fontSize: 14 }}>快捷操作</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Button style={{ height: 60, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Space direction="vertical" size={0}>
                  <VideoCameraOutlined />
                  <span style={{ fontSize: 11 }}>画面重启</span>
                </Space>
              </Button>
              <Button style={{ height: 60, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Space direction="vertical" size={0}>
                  <ThunderboltFilled />
                  <span style={{ fontSize: 11 }}>扭矩重置</span>
                </Space>
              </Button>
              <Button style={{ height: 60, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Space direction="vertical" size={0}>
                  <SyncOutlined />
                  <span style={{ fontSize: 11 }}>回原点</span>
                </Space>
              </Button>
              <Button style={{ height: 60, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Space direction="vertical" size={0}>
                  <SafetyCertificateOutlined />
                  <span style={{ fontSize: 11 }}>安全锁</span>
                </Space>
              </Button>
            </div>
            <div style={{ marginTop: 20 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                 <span>缓冲区占用</span>
                 <span>12%</span>
               </div>
               <Progress percent={12} size="small" showInfo={false} strokeColor="#1677ff" trailColor="rgba(255,255,255,0.05)" />
            </div>
          </div>
        </div>
      </div>

      {/* Global Shortcut Legend */}
      <div style={{ 
        height: 32, 
        padding: '0 24px', 
        background: '#1677ff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        gap: 20
      }}>
        <span><kbd style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: 4 }}>SPACE</kbd> 开始/暂停录制</span>
        <span><kbd style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: 4 }}>X</kbd> 记录步骤结束</span>
        <span><kbd style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: 4 }}>ENTER</kbd> 打包并保存本集数据</span>
      </div>
    </div>
  );
}

const Divider = ({ vertical }) => (
  <div style={{ 
    width: vertical ? 1 : '100%', 
    height: vertical ? 24 : 1, 
    background: 'rgba(255,255,255,0.1)',
    margin: vertical ? '0 8px' : '8px 0'
  }} />
);
