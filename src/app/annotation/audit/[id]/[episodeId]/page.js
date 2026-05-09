'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Tag, Space, Typography, App, Badge, Divider, Select, Input, Row, Col, Progress, Switch, Tooltip, Radio, Card, List } from 'antd';
import { 
  CloseOutlined, SearchOutlined, ReloadOutlined, AuditOutlined, EyeOutlined, 
  CheckCircleOutlined, FullscreenOutlined, RetweetOutlined, PlayCircleOutlined, 
  CheckOutlined, InfoCircleOutlined, SelectOutlined, BorderOutlined, AimOutlined, 
  VideoCameraOutlined, LeftOutlined, PauseOutlined, StepBackwardOutlined, 
  StepForwardOutlined, CaretRightOutlined, CaretLeftOutlined, UndoOutlined, 
  DeleteOutlined, QuestionCircleOutlined, SettingOutlined, CalendarOutlined, 
  ClockCircleOutlined, NodeIndexOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AnnotationAuditWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  
  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(128);
  const [activeTool, setActiveTool] = useState('select'); 
  const [annotations, setAnnotations] = useState([]);
  const [activeCamera, setActiveCamera] = useState('camera_head_left_color');
  const [selectedRange, setSelectedRange] = useState(null); // { start, end, label }

  const instanceId = params.id;
  const episodeId = params.episodeId;

  // Determine active types for this session (simulating a multi-type episode)
  const isPointEnabled = true;
  const isBBoxEnabled = episodeId.includes('2') || episodeId.includes('4');
  const isRangeEnabled = episodeId.includes('3') || episodeId.includes('4');
  const isNoneType = episodeId.includes('5');

  const handleViewportClick = (e) => {
    if (isNoneType) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);

    if (activeTool === 'point') {
      setAnnotations([...annotations, { id: Date.now(), type: '点', x, y, frame: currentFrame, color: '#1890ff' }]);
      message.success(`已添加点标注于第 ${currentFrame} 帧`);
    } else if (activeTool === 'bbox') {
      setAnnotations([...annotations, { id: Date.now(), type: '框', x, y, w: 80, h: 60, frame: currentFrame, color: '#52c41a' }]);
      message.success(`已生成边界框于第 ${currentFrame} 帧`);
    }
  };

  const handleAddRange = () => {
    setSelectedRange({ start: 100, end: 250, label: '有效抓取动作' });
    message.info('已定义范围：100 - 250 帧');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
      
      {/* 1. Global Navigation & Status Bar */}
      <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <Space size={16}>
          <Button icon={<LeftOutlined />} size="small" onClick={() => router.push(`/annotation/audit/${instanceId}`)}>返回列表</Button>
          <Text strong style={{ fontSize: '13px' }}>标注工作台 — 采集数据 #{episodeId}</Text>
          <Space>
             {isPointEnabled && <Tag color="blue">点标注</Tag>}
             {isBBoxEnabled && <Tag color="green">框标注</Tag>}
             {isRangeEnabled && <Tag color="purple">范围标注</Tag>}
             {isNoneType && <Tag color="default">无需标注</Tag>}
          </Space>
        </Space>
        <Space>
          <Tooltip title="操作指南：点标注(左键点击)，框标注(选择工具后点击)，范围(在时间轴或步骤区选择)">
            <Button type="text" icon={<QuestionCircleOutlined />} />
          </Tooltip>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => message.success('审核已保存')}>保存并提交</Button>
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 12, gap: 12 }}>
        
        {/* 2. Left Sidebar: Configuration & Tools */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Tool Selection Card */}
          <Card size="small" title="标注工具箱" style={{ borderRadius: 8 }}>
             <Space direction="vertical" style={{ width: '100%' }}>
                <Button block size="small" type={activeTool === 'select' ? 'primary' : 'default'} icon={<SelectOutlined />} onClick={() => setActiveTool('select')}>选择模式</Button>
                {isPointEnabled && <Button block size="small" type={activeTool === 'point' ? 'primary' : 'default'} icon={<AimOutlined />} onClick={() => setActiveTool('point')}>添加点标注</Button>}
                {isBBoxEnabled && <Button block size="small" type={activeTool === 'bbox' ? 'primary' : 'default'} icon={<BorderOutlined />} onClick={() => setActiveTool('bbox')}>绘制矩形框</Button>}
                {isRangeEnabled && <Button block size="small" icon={<CalendarOutlined />} onClick={handleAddRange}>定义动作范围</Button>}
             </Space>
          </Card>

          {/* Camera Config Card */}
          <Card size="small" title="视频源管理" style={{ borderRadius: 8 }}>
            <List
              size="small"
              dataSource={['head_left', 'head_right', 'hand_left', 'hand_right']}
              renderItem={(item) => (
                <div key={item} onClick={() => setActiveCamera(item)} style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4, marginBottom: 4, background: activeCamera.includes(item) ? '#e6f7ff' : 'transparent', border: activeCamera.includes(item) ? '1px solid #91caff' : '1px solid transparent', fontSize: '11px' }}>
                  <VideoCameraOutlined style={{ marginRight: 8 }} /> camera_{item}_color
                </div>
              )}
            />
          </Card>

          {/* Range Steps Card */}
          {isRangeEnabled && (
            <Card size="small" title="标注步骤" style={{ borderRadius: 8, flex: 1 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 1, text: '准备阶段', status: 'done' },
                    { id: 2, text: '抓取动作', status: 'doing' },
                    { id: 3, text: '放置动作', status: 'todo' },
                  ].map(step => (
                    <div key={step.id} style={{ display: 'flex', gap: 10, opacity: step.status === 'todo' ? 0.5 : 1 }}>
                       <Badge status={step.status === 'done' ? 'success' : step.status === 'doing' ? 'processing' : 'default'} />
                       <Text style={{ fontSize: '11px' }}>{step.id}. {step.text}</Text>
                    </div>
                  ))}
               </div>
            </Card>
          )}
        </div>

        {/* 3. Center: Immersive Viewport */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
           
           <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: activeTool !== 'select' ? 'crosshair' : 'default' }}
                onClick={handleViewportClick}>
              
              {isNoneType ? (
                <div style={{ textAlign: 'center' }}>
                   <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
                   <Title level={4} style={{ color: '#52c41a' }}>无需标注数据</Title>
                   <Text type="secondary">系统已自动识别该数据符合预置规范，直接点击“通过”即可</Text>
                </div>
              ) : (
                <div style={{ width: '90%', height: '90%', background: '#f8f9fa', border: '1px solid #f0f0f0', position: 'relative' }}>
                   {/* Grid Background */}
                   <div style={{ width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                   
                   {/* Point Helper */}
                   {activeTool === 'point' && (
                     <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', borderLeft: '1px dashed #1890ff', opacity: 0.5 }} />
                   )}

                   {/* Render Annotations */}
                   {annotations.map(anno => (
                     anno.type === '点' ? (
                       <div key={anno.id} style={{ position: 'absolute', top: `${anno.y}%`, left: `${anno.x}%`, width: 10, height: 10, background: anno.color, borderRadius: '50%', border: '2px solid #fff', transform: 'translate(-50%, -50%)', boxShadow: `0 0 8px ${anno.color}` }} />
                     ) : (
                       <div key={anno.id} style={{ position: 'absolute', top: `${anno.y}%`, left: `${anno.x}%`, width: 120, height: 80, border: `2px solid ${anno.color}`, background: `${anno.color}11`, transform: 'translate(-50%, -50%)' }}>
                          <span style={{ position: 'absolute', top: -18, left: -2, background: anno.color, color: '#fff', fontSize: '9px', padding: '0 4px' }}>BBox</span>
                       </div>
                     )
                   ))}

                   {/* Range Indicator Overlay */}
                   {selectedRange && (
                     <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '4px 10px', background: 'rgba(114, 46, 209, 0.9)', color: '#fff', borderRadius: 4, fontSize: '10px' }}>
                        当前范围: {selectedRange.label}
                     </div>
                   )}
                </div>
              )}

              {/* Floating Helper */}
              {activeTool !== 'select' && (
                <div style={{ position: 'absolute', top: 20, left: 20, background: '#1677ff', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: '11px', boxShadow: '0 4px 12px rgba(22,119,255,0.4)' }}>
                   正在使用: {activeTool === 'point' ? '定点工具' : '画框工具'} — 点击视频区进行标注
                </div>
              )}
           </div>

           {/* 4. Bottom: Timeline & Player */}
           <Card size="small" styles={{ body: { padding: '12px 20px' } }} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                 <Space size={20}>
                    <Button type="text" icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />} onClick={() => setIsPlaying(!isPlaying)} />
                    <Text strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>Frame: {currentFrame} / 1200</Text>
                 </Space>
                 <Space>
                    <Tag icon={<ClockCircleOutlined />}>00:12 / 01:25</Tag>
                    <Button size="small" icon={<FullscreenOutlined />} />
                 </Space>
              </div>
              
              {/* Interactive Timeline */}
              <div style={{ height: 28, background: '#f5f5f5', borderRadius: 14, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                 {/* Playback Progress */}
                 <div style={{ width: '45%', height: '100%', background: 'rgba(22,119,255,0.1)', borderRight: '2px solid #1677ff' }} />
                 {/* Range Mark */}
                 {isRangeEnabled && selectedRange && (
                   <div style={{ position: 'absolute', left: '20%', width: '30%', height: '100%', background: 'rgba(114, 46, 209, 0.3)', borderLeft: '2px solid #722ed1', borderRight: '2px solid #722ed1' }}>
                      <Text style={{ fontSize: '9px', color: '#722ed1', position: 'absolute', top: 4, left: 4 }}>有效动作区间</Text>
                   </div>
                 )}
                 {/* Annotation Marks */}
                 {annotations.map(anno => (
                    <div key={anno.id} style={{ position: 'absolute', left: `${(anno.id % 100)}%`, width: 2, height: '100%', background: anno.color }} />
                 ))}
              </div>
           </Card>
        </div>

        {/* 5. Right Sidebar: Data Inspection */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
           <Card size="small" title={`标注记录 (${annotations.length})`} extra={<DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} onClick={() => setAnnotations([])} />} style={{ borderRadius: 8, flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, overflowY: 'auto' } }}>
              {annotations.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                   <NodeIndexOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                   <Text style={{ fontSize: '11px' }}>暂无活跃标注</Text>
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={annotations}
                  renderItem={(anno) => (
                    <div key={anno.id} style={{ padding: '8px', border: `1px solid ${anno.color}44`, borderRadius: 4, background: `${anno.color}05`, marginBottom: 8 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '10px', color: anno.color }}>[{anno.type}] #{anno.id.toString().slice(-4)}</Text>
                          <Text type="secondary" style={{ fontSize: '10px' }}>F:{anno.frame}</Text>
                       </div>
                       <Text type="secondary" style={{ fontSize: '9px' }}>坐标: ({anno.x}%, {anno.y}%)</Text>
                    </div>
                  )}
                />
              )}
           </Card>

           <Card size="small" title="审核判定" style={{ borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                 <Text type="secondary" style={{ fontSize: '11px' }}>审核意见:</Text>
                 <Input.TextArea rows={3} placeholder="如有错误请注明帧数..." style={{ fontSize: '11px' }} />
                 <Row gutter={8}>
                    <Col span={12}><Button block danger ghost size="small">驳回</Button></Col>
                    <Col span={12}><Button block type="primary" size="small">通过</Button></Col>
                 </Row>
              </Space>
           </Card>
        </div>
      </div>
    </div>
  );
}
