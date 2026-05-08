'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Button, 
  Typography, 
  Space, 
  Slider, 
  Tag, 
  Divider, 
  App, 
  Dropdown,
  InputNumber,
  Badge
} from 'antd';
import { 
  ArrowLeftOutlined,
  CloseOutlined,
  CaretRightOutlined, 
  PauseOutlined, 
  StepBackwardOutlined, 
  StepForwardOutlined, 
  ReloadOutlined,
  ExpandOutlined,
  DownOutlined,
  PlusOutlined,
  ExclamationCircleFilled,
  StampOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function QaReviewPage({ params }) {
  const router = useRouter();
  // Using React.use() to unwrap params per Next.js 15+ patterns, though here we can assume it works
  const { instanceId, seqId } = React.use(params);
  const { message } = App.useApp();
  
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames] = useState(1206);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeStepId, setActiveStepId] = useState(5);
  const [conclusion, setConclusion] = useState(null);

  // SOP Steps Data to match the screenshot
  const [sopSteps, setSopSteps] = useState([
    { id: 1, title: '双手从桌子拿起托盘到台面上方', start: 0, end: 181, total: 182, color: '#3b82f6' }, // blue
    { id: 2, title: '双手从台面上方放置托盘到桌子', start: 181, end: 298, total: 118, color: '#8b5cf6' }, // purple
    { id: 3, title: '右手从桌子拿起盘子到台面上方', start: 298, end: 488, total: 191, color: '#d97706' }, // orange
    { id: 4, title: '右手从台面上方放置盘子到托盘正中', start: 488, end: 667, total: 180, color: '#ec4899' }, // pink
    { id: 5, title: '右手从桌子拿起叉子到台面上方', start: 667, end: 818, total: 152, color: '#06b6d4', hasQaError: true }, // cyan, has QA error stamp
    { id: 6, title: '右手从台面上方放置叉子到盘子右侧', start: 818, end: 1022, total: 205, color: '#10b981', hasAlert: true }, // green, has alert icon
    { id: 7, title: '左手从桌子拿起餐刀到台面上方', start: 1022, end: 1206, total: 245, color: '#3b82f6' }, // blue
    { id: 8, title: '左手从台面上方放置餐刀到盘子左侧', start: 1206, end: 1400, total: 195, color: '#8b5cf6' }, // purple
  ]);

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
    const step = sopSteps.find(s => currentFrame >= s.start && currentFrame < s.end);
    if (step && step.id !== activeStepId) {
      setActiveStepId(step.id);
    }
  }, [currentFrame, sopSteps]);

  const seekTo = (frame) => {
    setCurrentFrame(Math.max(0, Math.min(totalFrames, frame)));
    setIsPlaying(false);
  };

  const handleFinish = (result) => {
    setConclusion(result);
    message.success(`质检结果已提交: ${result}`);
    setTimeout(() => router.back(), 1000);
  };

  const speedMenu = {
    items: [
      { key: '0.5', label: '0.5x', onClick: () => setPlaybackSpeed(0.5) },
      { key: '1.0', label: '1.0x', onClick: () => setPlaybackSpeed(1) },
      { key: '1.5', label: '1.5x', onClick: () => setPlaybackSpeed(1.5) },
      { key: '2.0', label: '2.0x', onClick: () => setPlaybackSpeed(2) },
    ],
  };

  // Helper to format time as seconds
  const formatTime = (frame, fps = 30) => {
    return (frame / fps).toFixed(3);
  };

  const renderVideoViewport = (id, title, imgUrl, hasBottomBar = true) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, border: '1px solid #e8e8e8', backgroundColor: '#fff', boxSizing: 'border-box' }}>
      <div style={{ 
        padding: '4px 8px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 12,
        backgroundColor: '#fafafa',
        height: 28,
        minHeight: 28,
        boxSizing: 'border-box'
      }}>
        <Space size={4}>
          <div style={{ width: 3, height: 12, backgroundColor: '#1890ff' }}></div>
          <Text strong style={{ fontSize: 12 }}>{title}</Text>
          <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
        </Space>
        <ExpandOutlined style={{ fontSize: 12, cursor: 'pointer', color: '#8c8c8c' }} />
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, backgroundColor: id === 'joints' ? '#141414' : '#e6e6e6', position: 'relative', overflow: 'hidden' }}>
        <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: id === 'joints' ? 'contain' : 'cover' }} alt={title} />
        {id !== 'joints' && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, textAlign: 'right', color: 'rgba(255,255,255,0.8)', fontSize: 10, textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            Fps: 30<br/>
            Resolution: 640 * 360<br/>
            Duration: 48.789857<br/>
            Download
          </div>
        )}
        {hasBottomBar && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#f0f0f0' }}>
            <div style={{ width: `${(currentFrame / totalFrames) * 100}%`, height: '100%', backgroundColor: '#52c41a' }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
        <Space size="middle" style={{ color: '#595959' }}>
          <Text style={{ color: '#8c8c8c' }}>餐具摆放 <span style={{ color: '#ff4d4f' }}>[共 8 步]</span></Text>
          <Text>解析状态: <span style={{ color: '#52c41a' }}>[解析完成]</span></Text>
          <Text>覆检状态: <Text type="secondary">[未质检]</Text></Text>
          <Text>任务ID: 10383</Text>
          <Text>实例ID: 12745</Text>
          <Text type="secondary" style={{ maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'bottom' }}>
            文件目录: collect-data/10383_12745/41b2903201e64273b021baa360c833eb3
          </Text>
        </Space>
        <CloseOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#595959' }} onClick={() => router.back()} />
      </div>

      {/* Shortcut Hint Bar */}
      <div style={{ padding: '4px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#8c8c8c' }}>
        <Space size="large">
          <span><strong style={{ color: '#595959' }}>Esc:</strong> 返回列表</span>
          <span><strong style={{ color: '#595959' }}>Space:</strong> 播放/暂停</span>
          <span><strong style={{ color: '#595959' }}>Z:</strong> 上一帧</span>
          <span><strong style={{ color: '#595959' }}>X:</strong> 下一帧</span>
          <span><strong style={{ color: '#595959' }}>A:</strong> 上一段落</span>
          <span><strong style={{ color: '#595959' }}>D:</strong> 下一段落</span>
        </Space>
      </div>

      {/* Main Workspace Area */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Left: Video Grid */}
        <div style={{ flex: '1 1 auto', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '16px' }}>
          <div style={{ 
            width: '100%', 
            maxWidth: 'calc((100vh - 180px) * 16 / 9)', 
            aspectRatio: '16 / 9', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridTemplateRows: '1fr 1fr', 
            gap: '8px' 
          }}>
            {renderVideoViewport('camera_hand_left_color', 'camera_hand_left_color', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80')}
          {renderVideoViewport('camera_head_left_color', 'camera_head_left_color', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80')}
          {renderVideoViewport('camera_hand_right_color', 'camera_hand_right_color', 'https://images.unsplash.com/photo-1531746790731-6c087fecd05a?w=800&q=80')}
          {renderVideoViewport('joints', 'joints.json', 'https://images.unsplash.com/photo-1535378917042-10a22c95961a?w=800&q=80', false)}
          </div>
        </div>

        {/* Right: SOP Steps Panel */}
        <div style={{ width: 280, borderLeft: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflowY: 'auto' }}>
          <div style={{ padding: '8px', flexGrow: 1 }}>
            {sopSteps.map((step) => {
              const isActive = activeStepId === step.id;
              return (
                <div key={step.id} style={{ 
                  marginBottom: 12, 
                  backgroundColor: isActive ? '#f5f5f5' : '#fff',
                  borderRadius: 4,
                  padding: '4px'
                }}>
                  {/* Step Title Row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ 
                      width: 8, height: 8, borderRadius: '50%', 
                      backgroundColor: step.color, 
                      marginTop: 6, marginRight: 8, flexShrink: 0
                    }} />
                    <div style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 600 : 400, color: '#333', lineHeight: 1.5, position: 'relative' }}>
                      {step.id} {step.title}
                      
                      {/* Floating Icons for QA Status */}
                      {step.hasQaError && (
                        <div style={{ position: 'absolute', right: 0, top: -4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: 2, padding: '0 2px', fontSize: 10, display: 'flex', alignItems: 'center' }}>
                            QA
                          </div>
                        </div>
                      )}
                      {step.hasAlert && (
                        <div style={{ position: 'absolute', right: -6, top: -4 }}>
                          <ExclamationCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Frame Inputs Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 2 }}>开始帧</Text>
                      <InputNumber 
                        size="small" 
                        value={step.start} 
                        controls 
                        style={{ width: 60, fontSize: 11 }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 2 }}>结束帧</Text>
                      <InputNumber 
                        size="small" 
                        value={step.end} 
                        controls 
                        style={{ width: 60, fontSize: 11 }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 2 }}>总共</Text>
                      <InputNumber 
                        size="small" 
                        value={step.total} 
                        controls 
                        style={{ width: 60, fontSize: 11 }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Divider style={{ margin: 0 }} />
          
          {/* Bottom Accordion: 区域帧管理 */}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#fafafa' }}>
            <Text style={{ fontSize: 12, color: '#595959' }}>区域帧管理 (0)</Text>
            <PlusOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
          </div>
        </div>
      </div>

      {/* Bottom Timeline & Controls */}
      <div style={{ height: 80, borderTop: '1px solid #d9d9d9', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
        
        {/* Timeline Bar Area */}
        <div style={{ position: 'relative', height: 24, paddingTop: 4 }}>
          {/* Segmented Timeline */}
          <div style={{ position: 'absolute', top: 4, left: 0, right: 0, height: 12, display: 'flex', padding: '0 16px' }}>
            {sopSteps.map((step) => (
              <div 
                key={step.id} 
                style={{ 
                  width: `${(step.total / totalFrames) * 100}%`, 
                  height: '100%', 
                  backgroundColor: step.color
                }} 
              />
            ))}
          </div>

          {/* Keyframe Dots */}
          <div style={{ position: 'absolute', top: 18, left: 0, right: 0, padding: '0 16px' }}>
            {sopSteps.map((step) => (
              <div 
                key={step.id} 
                style={{ 
                  position: 'absolute', 
                  left: `calc(16px + ${(step.start / totalFrames) * 100}% - 4px)`, 
                  width: 8, height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: '#52c41a' 
                }} 
              />
            ))}
          </div>
          
          {/* Invisible Slider for interaction */}
          <Slider 
            min={0} max={totalFrames} value={currentFrame} 
            onChange={setCurrentFrame} 
            tooltip={{ open: false }}
            style={{ position: 'absolute', top: -14, left: 16, right: 16, zIndex: 10, margin: 0, padding: '20px 0' }}
            styles={{ track: { backgroundColor: 'transparent' }, rail: { backgroundColor: 'transparent' }, handle: { backgroundColor: '#fff', border: '2px solid #595959', width: 4, height: 20, borderRadius: 2, transform: 'translateY(-2px)' } }}
          />
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px', flexGrow: 1 }}>
          <div style={{ width: 200, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>Time: {formatTime(currentFrame)}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>Frame: {currentFrame}</Text>
          </div>
          
          <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <ArrowLeftOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#8c8c8c' }} onClick={() => seekTo(0)} />
            <FastBackwardOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#8c8c8c' }} onClick={() => seekTo(currentFrame - 10)} />
            <StepBackwardOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#595959' }} onClick={() => seekTo(currentFrame - 1)} />
            <div 
              onClick={() => setIsPlaying(!isPlaying)} 
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#fff' }}
            >
              {isPlaying ? <PauseOutlined style={{ fontSize: 16, color: '#595959' }} /> : <CaretRightOutlined style={{ fontSize: 16, color: '#595959', marginLeft: 2 }} />}
            </div>
            <StepForwardOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#595959' }} onClick={() => seekTo(currentFrame + 1)} />
            <FastForwardOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#8c8c8c' }} onClick={() => seekTo(currentFrame + 10)} />
            <ArrowLeftOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#8c8c8c', transform: 'rotate(180deg)' }} onClick={() => seekTo(totalFrames)} />
          </div>

          <div style={{ width: 400, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <Button 
              type="primary" 
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 20, padding: '0 24px', height: 32 }}
              onClick={() => handleFinish('优秀')}
            >
              优秀
            </Button>
            <Button 
              type="primary" 
              style={{ backgroundColor: '#b48846', borderColor: '#b48846', borderRadius: 20, padding: '0 24px', height: 32 }}
              onClick={() => handleFinish('良好')}
            >
              良好
            </Button>
            <Button 
              type="primary" 
              style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', borderRadius: 20, padding: '0 24px', height: 32 }}
              onClick={() => handleFinish('不合格')}
            >
              不合格
            </Button>
            
            <Divider type="vertical" />
            
            <SyncOutlined style={{ cursor: 'pointer', color: '#8c8c8c' }} />
            
            <Dropdown menu={speedMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer', fontSize: 12, color: '#595959' }}>
                {playbackSpeed}x <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Dropdown>
          </div>
        </div>
      </div>
      
    </div>
  );
}
