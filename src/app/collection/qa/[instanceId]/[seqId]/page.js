'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Button, 
  Typography, 
  Space, 
  Card, 
  Row, 
  Col, 
  Slider, 
  Tag, 
  Divider, 
  App, 
  Input, 
  Tooltip,
  ConfigProvider,
  theme,
  Badge,
  Dropdown
} from 'antd';
import { 
  ArrowLeftOutlined, 
  CaretRightOutlined, 
  PauseOutlined, 
  StepBackwardOutlined, 
  StepForwardOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  ExpandOutlined,
  ControlOutlined,
  AimOutlined,
  BorderOutlined,
  LineChartOutlined,
  FullscreenOutlined,
  DownOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Paragraph } = Typography;

export default function QaReviewPage({ params }) {
  const router = useRouter();
  const { instanceId, seqId } = React.use(params);
  const { message } = App.useApp();
  
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(112);
  const [totalFrames] = useState(300);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeStepId, setActiveStepId] = useState(2);
  const [conclusion, setConclusion] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  // SOP Steps Data
  const sopSteps = [
    { id: 1, title: '移动到货架旁', start: 0, end: 50, status: 'done' },
    { id: 2, title: '执行物体抓取', start: 51, end: 108, total: 58, status: 'active' },
    { id: 3, title: '提升并平稳转移', start: 109, end: 200, status: 'pending' },
    { id: 4, title: '精准放置到容器', start: 201, end: 300, status: 'pending' },
  ];

  // Auto-play logic
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= totalFrames) {
            setIsPlaying(false);
            return totalFrames;
          }
          return prev + 1;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalFrames, playbackSpeed]);

  // Sync active step with current frame during playback
  useEffect(() => {
    const step = sopSteps.find(s => currentFrame >= s.start && currentFrame <= s.end);
    if (step && step.id !== activeStepId) {
      setActiveStepId(step.id);
    }
  }, [currentFrame]);

  // Seeks to a specific frame and pauses
  const seekTo = (frame) => {
    setCurrentFrame(frame);
    setIsPlaying(false);
  };

  const handleFinish = () => {
    if (!conclusion) {
      message.warning('请先选择质检最终结论');
      return;
    }
    message.success('已完成抽检审核');
    router.back();
  };

  const speedMenu = {
    items: [
      { key: '0.5', label: '0.5x', onClick: () => setPlaybackSpeed(0.5) },
      { key: '1.0', label: '1.0x', onClick: () => setPlaybackSpeed(1) },
      { key: '1.5', label: '1.5x', onClick: () => setPlaybackSpeed(1.5) },
      { key: '2.0', label: '2.0x', onClick: () => setPlaybackSpeed(2) },
    ],
  };

  const renderVideoViewport = (id, title, label, imgUrl) => (
    <div 
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseEnter={() => setHoveredVideo(id)}
      onMouseLeave={() => setHoveredVideo(null)}
    >
      <div style={{ 
        padding: '8px 12px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        fontSize: 12,
        height: 36,
        visibility: hoveredVideo === id ? 'visible' : 'visible' // In ref design, status is always there, toolbar might appear on hover
      }}>
        <Space>
          <Text strong style={{ fontSize: 13 }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>● 录制中 帧率: 30 时间: 00:03:45:12</Text>
        </Space>
        <Space size="small">
          <Dropdown menu={{ items: [{ key: '1', label: '帧数' }, { key: '2', label: '时间戳' }] }}>
            <Space style={{ cursor: 'pointer', fontSize: 11, color: '#8c8c8c' }}>
              时间数 <DownOutlined style={{ fontSize: 8 }} />
            </Space>
          </Dropdown>
          <FullscreenOutlined style={{ fontSize: 12, cursor: 'pointer', color: '#8c8c8c' }} />
        </Space>
      </div>
      <div style={{ flexGrow: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
        <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt={label} />
        <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{label}</div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space size="middle">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ border: 'none', background: '#f5f5f5' }} />
          <div>
            <Space align="center">
              <Title level={4} style={{ margin: 0, fontSize: 18 }}>质检审核: {seqId || 'REC-001'}</Title>
              <Tag color="blue" style={{ borderRadius: 4, backgroundColor: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', padding: '0 8px' }}>
                数据包: PKG-20240301-001
              </Tag>
            </Space>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              最后更新时间: 2026-03-23 10:23:45
            </div>
          </div>
        </Space>
        <Space size="middle">
          <Button icon={<ReloadOutlined />} style={{ borderRadius: 6 }}>重置视图</Button>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={handleFinish}
            style={{ height: 40, padding: '0 24px', borderRadius: 6, fontWeight: 500 }}
          >
            完成抽检审核
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ height: 'calc(100vh - 260px)' }}>
        {/* Left: Viewport Grid */}
        <Col span={17}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16, height: '100%' }}>
            {renderVideoViewport('v1', '左侧手部相机 (左)', 'HAND_L', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800')}
            {renderVideoViewport('v2', '头部主视角 (主)', 'HEAD_MAIN', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800')}
            {renderVideoViewport('v3', '右侧手部相机 (右)', 'HAND_R', 'https://images.unsplash.com/photo-1531746790731-6c087fecd05a?w=800')}

            {/* 3D Viewport */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                padding: '8px 12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                fontSize: 12,
                height: 36
              }}>
                <Space>
                  <Text strong style={{ fontSize: 13 }}>机器人3D模型 (运动学)</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>● 已连接 关节: 1-7 激活</Text>
                </Space>
                <Space size="small">
                  <Text type="secondary">设置</Text>
                  <ExpandOutlined style={{ fontSize: 12, cursor: 'pointer', color: '#8c8c8c' }} />
                </Space>
              </div>
              <div style={{ flexGrow: 1, backgroundColor: '#0a0a0a', position: 'relative', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle, #1a2a3a 0%, #050505 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1535378917042-10a22c95961a?w=800" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.4 }} alt="3d_model" />
                  <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 'bold' }}>3D_MODEL</div>
                  
                  {/* Overlay Controls */}
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, cursor: 'pointer' }}><FullscreenOutlined style={{ color: '#fff' }} /></div>
                    <div style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, cursor: 'pointer' }}><ExpandOutlined style={{ color: '#fff' }} /></div>
                    <div style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, cursor: 'pointer' }}><ControlOutlined style={{ color: '#fff' }} /></div>
                    <div style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, cursor: 'pointer' }}><LineChartOutlined style={{ color: '#fff' }} /></div>
                  </div>

                  <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ backgroundColor: 'rgba(24,144,255,0.15)', border: '1px solid #1890ff', padding: '4px 10px', borderRadius: 4, color: '#1890ff', fontSize: 11 }}>
                      进行环境: RT-Kinematics v2.4 (激活)
                    </div>
                    <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                      末端误差: <span style={{ color: '#fff' }}>0.12mm</span> | 负载: <span style={{ color: '#fff' }}>45%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Right: SOP Panel */}
        <Col span={7} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>标注任务关键步骤</span>} 
            styles={{ body: { padding: '16px 12px' } }} 
            style={{ borderRadius: 12, flexGrow: 1, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sopSteps.map((step) => {
                const isActive = activeStepId === step.id;
                return (
                  <div 
                    key={step.id} 
                    style={{ 
                      borderRadius: 10, 
                      border: `1px solid ${isActive ? '#1890ff' : '#f0f0f0'}`, 
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: isActive ? '#f0f7ff' : '#fff'
                    }}
                    onClick={() => {
                      setActiveStepId(step.id);
                      seekTo(step.start);
                    }}
                  >
                    {/* Header */}
                    <div style={{ 
                      padding: '12px 16px', 
                      background: isActive ? '#1890ff' : '#fff',
                      color: isActive ? '#fff' : '#434343',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <Space size="middle">
                        <div style={{ 
                          width: 24, height: 24, borderRadius: '50%', 
                          border: `1px solid ${isActive ? '#fff' : '#d9d9d9'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                          color: isActive ? '#fff' : '#8c8c8c',
                          fontWeight: 500
                        }}>
                          {step.id}
                        </div>
                        <Text strong style={{ color: isActive ? '#fff' : 'inherit', fontSize: 13 }}>{step.title}</Text>
                      </Space>
                      {step.status === 'done' && <CheckCircleOutlined style={{ color: isActive ? '#fff' : '#52c41a', fontSize: 16 }} />}
                      {isActive && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{step.end - step.start}帧</Text>}
                    </div>

                    {/* Details Accordion */}
                    {isActive && (
                      <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e6f7ff' }}>
                        <Row gutter={8} style={{ marginBottom: 12 }}>
                          {['起始帧', '结束帧', '持续帧数'].map((label, idx) => (
                            <Col span={8} key={label}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 16, fontWeight: 'bold', background: '#f5f5f5', borderRadius: 4, padding: '4px 0', color: '#1890ff' }}>
                                  {idx === 0 ? step.start : idx === 1 ? step.end : (step.total || step.end - step.start)}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Button block icon={<ReloadOutlined />} size="small">重取异常时段</Button>
                          <Row gutter={8}>
                            <Col span={12}><Button block icon={<BorderOutlined />} size="small">异常区域框</Button></Col>
                            <Col span={12}><Button block icon={<AimOutlined />} size="small">异常定位点</Button></Col>
                          </Row>
                        </Space>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Conclusion Selection */}
          <div style={{ marginTop: 20 }}>
            <Text type="secondary" style={{ fontSize: 13, marginBottom: 12, display: 'block', color: '#8c8c8c' }}>质检最终结论</Text>
            <Row gutter={12}>
              {[
                { key: 'pass', label: '合格', icon: <CheckCircleOutlined /> },
                { key: 'undecided', label: '待定', icon: <InfoCircleOutlined /> },
                { key: 'fail', label: '不合格', icon: <CloseCircleOutlined /> }
              ].map(item => {
                const isSelected = conclusion === item.key;
                return (
                  <Col span={8} key={item.key}>
                    <div 
                      style={{ 
                        height: 70, 
                        borderRadius: 10, 
                        border: `2px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                        transition: 'all 0.25s',
                      }}
                      onClick={() => setConclusion(item.key)}
                    >
                      <div style={{ fontSize: 22, color: isSelected ? '#1890ff' : '#bfbfbf' }}>{item.icon}</div>
                      <Text style={{ fontSize: 12, marginTop: 4, color: isSelected ? '#1890ff' : '#8c8c8c', fontWeight: isSelected ? 600 : 400 }}>{item.label}</Text>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </Col>
      </Row>

      {/* Bottom Control Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 240, right: 0, height: 110, backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 32px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.03)' }}>
        <Row align="middle" gutter={32}>
          <Col style={{ width: 140 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#141414' }}>00:03:45 /</div>
            <div style={{ fontSize: 13, color: '#bfbfbf', marginTop: 2 }}>00:05:30</div>
          </Col>
          <Col flex="auto" style={{ position: 'relative', paddingTop: 10 }}>
            {/* Colored segments in rail */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 18, height: 8, zIndex: 0, pointerEvents: 'none' }}>
              {sopSteps.map((step, idx) => (
                <div 
                  key={step.id} 
                  style={{ 
                    position: 'absolute', 
                    left: `${(step.start/totalFrames)*100}%`, 
                    width: `${((step.end - step.start)/totalFrames)*100}%`, 
                    height: '100%', 
                    backgroundColor: idx % 2 === 0 ? 'rgba(255, 122, 69, 0.4)' : 'rgba(24, 144, 255, 0.4)',
                    borderRadius: 4
                  }} 
                />
              ))}
            </div>
            <Slider 
              min={0} max={totalFrames} value={currentFrame} 
              onChange={setCurrentFrame} 
              tooltip={{ open: false }}
              styles={{ track: { backgroundColor: 'transparent', height: 4 }, rail: { backgroundColor: '#f0f0f0', height: 8 }, handle: { width: 16, height: 16, border: '3px solid #1890ff', zIndex: 10 } }}
            />
            {/* Pass/Step Markers */}
            {sopSteps.map(step => (
              <div 
                key={step.id} 
                style={{ position: 'absolute', left: `${(step.start/totalFrames)*100}%`, top: -14, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', zIndex: 5 }}
                onClick={() => seekTo(step.start)}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                  <CheckCircleOutlined style={{ color: '#fff', fontSize: 8 }} />
                </div>
                <Text style={{ fontSize: 9, color: '#bfbfbf', marginTop: 32 }}>pass</Text>
              </div>
            ))}
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>播放</Text>
              <Space size="large">
                <StepBackwardOutlined style={{ fontSize: 22, cursor: 'pointer', color: '#595959' }} />
                <div onClick={() => setIsPlaying(!isPlaying)} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#f0f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {isPlaying ? 
                    <PauseOutlined style={{ fontSize: 24, color: '#1890ff' }} /> : 
                    <CaretRightOutlined style={{ fontSize: 24, color: '#1890ff', marginLeft: 3 }} />
                  }
                </div>
                <StepForwardOutlined style={{ fontSize: 22, cursor: 'pointer', color: '#595959' }} />
              </Space>
            </div>
            
            <Divider type="vertical" style={{ height: 32, borderColor: '#f0f0f0' }} />
            
            <Space size="middle">
              <Text style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer' }} onClick={() => seekTo(Math.max(0, currentFrame - 1))}>前一帧</Text>
              <Text style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer' }} onClick={() => seekTo(Math.min(totalFrames, currentFrame + 1))}>后一帧</Text>
            </Space>

            <Divider type="vertical" style={{ height: 32, borderColor: '#f0f0f0' }} />
            
            <Dropdown menu={speedMenu} trigger={['click']} placement="topRight">
              <Space style={{ cursor: 'pointer', fontSize: 12, color: '#595959', padding: '4px 12px', background: '#f5f5f5', borderRadius: 4 }}>
                倍速播放 <span style={{ color: '#1890ff', fontWeight: 600 }}>{playbackSpeed}x</span> <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Dropdown>
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .ant-layout-content { padding-bottom: 140px !important; }
        .ant-slider-handle:focus::after { box-shadow: none !important; }
        .ant-slider:hover .ant-slider-track { background-color: #1890ff !important; }
        .ant-slider-handle:hover { transform: scale(1.2) !important; transition: transform 0.2s; }
      `}</style>
    </MainLayout>
  );
}
