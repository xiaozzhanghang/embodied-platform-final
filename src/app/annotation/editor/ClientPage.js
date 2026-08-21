'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Tag, Space, Card, Typography, Row, Col, List, Badge, Input, Table, Divider, App, Tooltip, Radio } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlayCircleOutlined, PauseCircleOutlined, 
         BorderOutlined, AimOutlined, HistoryOutlined, SettingOutlined, SwapOutlined } from '@ant-design/icons';
import { StatusTag } from '@/components/ui';

const { Title, Text } = Typography;

const mockSopSteps = [
  { id: 1, name: '双手放置托盘', color: '#1890ff' },
  { id: 2, name: '双手拿起托盘', color: '#52c41a' },
  { id: 3, name: '右手拿起盘子', color: '#faad14' },
  { id: 4, name: '右手放置盘子', color: '#722ed1' },
];

export default function AnnotationEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [activeStep, setActiveStep] = useState(1);
  const [isCrossStep, setIsCrossStep] = useState(false);

  const type = searchParams.get('type') || 'range';
  const isBoxType = type === 'box' || type === 'range-box';
  const isPointType = type === 'point';
  const isRangeType = type === 'range' || type === 'range-box';

  return (
    <div className="ui-workspace" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{ height: 50, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#141414', borderBottom: '1px solid #333' }}>
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined style={{color: '#fff'}} />} onClick={() => router.back()} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>标注编辑器 - {type.toUpperCase()}</Text>
          <StatusTag status="进行中">标注中</StatusTag>
        </Space>
        <Space>
          {isRangeType && (
            <Button 
                type={isCrossStep ? 'primary' : 'default'} 
                icon={<SwapOutlined />} 
                onClick={() => { setIsCrossStep(!isCrossStep); message.info(isCrossStep ? '已取消跨步骤标注' : '已开启跨步骤标注'); }}
                style={{ background: isCrossStep ? '#f5222d' : 'transparent', borderColor: isCrossStep ? '#f5222d' : '#555', color: '#fff' }}
            >
              跨步骤标注
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} onClick={() => message.success('标注保存成功')}>保存并提交</Button>
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Steps */}
        <div style={{ width: 260, background: '#141414', borderRight: '1px solid #333', padding: 12 }}>
          <Title level={5} style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>动作步骤 (SOP)</Title>
          <List
            dataSource={mockSopSteps}
            renderItem={(item) => (
              <div 
                onClick={() => setActiveStep(item.id)}
                style={{ 
                  padding: '10px 12px', 
                  marginBottom: 8, 
                  borderRadius: 4, 
                  background: activeStep === item.id ? '#1677ff22' : '#1a1a1a',
                  border: `1px solid ${activeStep === item.id ? '#1677ff' : '#333'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Badge color={item.color} />
                <Text style={{ color: activeStep === item.id ? '#fff' : '#888', fontSize: 13 }}>{item.id}. {item.name}</Text>
              </div>
            )}
          />
          <Divider style={{ borderColor: '#333' }} />
          <Title level={5} style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>标注工具箱</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block icon={<BorderOutlined />} style={{ background: '#1a1a1a', color: '#ccc', border: '#444' }}>绘制边框 (R)</Button>
            <Button block icon={<AimOutlined />} style={{ background: '#1a1a1a', color: '#ccc', border: '#444' }}>打点中心 (P)</Button>
          </Space>
        </div>

        {/* Center - Canvas */}
        <div style={{ flex: 1, padding: 20, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 8, border: '1px solid #333', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#333', fontSize: 24, fontWeight: 'bold' }}>VIDEO CONTENT AREA</div>
            
            {/* Simulated Bounding Box */}
            {isBoxType && (
              <div style={{ 
                position: 'absolute', 
                top: '25%', left: '30%', 
                width: 150, height: 120, 
                border: '2px solid #52c41a', 
                background: 'rgba(82, 196, 26, 0.1)' 
              }}>
                <div style={{ position: 'absolute', top: -20, left: 0, background: '#52c41a', color: '#fff', fontSize: 10, padding: '0 4px' }}>RightHand</div>
              </div>
            )}
            
            {/* Simulated Points */}
            {isPointType && (
              <>
                <div style={{ position: 'absolute', top: '40%', left: '45%', width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', boxShadow: '0 0 8px #ff4d4f' }} />
                <div style={{ position: 'absolute', top: '42%', left: '48%', width: 8, height: 8, borderRadius: '50%', background: '#faad14', boxShadow: '0 0 8px #faad14' }} />
              </>
            )}
          </div>

          {/* Timeline */}
          <div style={{ height: 100, marginTop: 20, background: '#141414', borderRadius: 8, padding: '12px 20px', border: '1px solid #333' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#0f0', fontSize: 12, fontFamily: 'monospace' }}>FRAME: 145 / 3000</Text>
                <Text style={{ color: '#aaa', fontSize: 12 }}>Time: 00:04.833s</Text>
             </div>
             <div style={{ height: 12, background: '#333', borderRadius: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '20%', width: '15%', height: '100%', background: '#1890ff88', borderRadius: 6 }} />
                <div style={{ position: 'absolute', left: '35%', width: '25%', height: '100%', background: '#52c41a88', borderRadius: 6 }} />
                <div style={{ position: 'absolute', left: '38%', top: -4, width: 2, height: 20, background: 'red' }} />
             </div>
             <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <Space>
                    <Button type="text" size="small" icon={<PlayCircleOutlined style={{color: '#fff'}} />} />
                    <Text style={{ color: '#fff' }}>1x</Text>
                </Space>
             </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div style={{ width: 300, background: '#141414', borderLeft: '1px solid #333', padding: 16 }}>
          <Title level={5} style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>标注结果属性</Title>
          
          <Card size="small" style={{ background: '#1a1a1a', border: '1px solid #333', marginBottom: 16 }}>
            <div style={{ color: '#aaa', fontSize: 12, marginBottom: 12 }}>坐标 (归一化)</div>
            <Row gutter={8}>
              <Col span={12}><Input size="small" prefix="X1" defaultValue="0.214" variant="filled" style={{background: '#333', color: '#fff'}} /></Col>
              <Col span={12}><Input size="small" prefix="Y1" defaultValue="0.075" variant="filled" style={{background: '#333', color: '#fff'}} /></Col>
            </Row>
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col span={12}><Input size="small" prefix="X2" defaultValue="0.630" variant="filled" style={{background: '#333', color: '#fff'}} /></Col>
              <Col span={12}><Input size="small" prefix="Y2" defaultValue="0.808" variant="filled" style={{background: '#333', color: '#fff'}} /></Col>
            </Row>
          </Card>

          <Card size="small" style={{ background: '#1a1a1a', border: '1px solid #333', marginBottom: 16 }}>
            <div style={{ color: '#aaa', fontSize: 12, marginBottom: 12 }}>帧范围</div>
            <Row gutter={8}>
              <Col span={12}><Input size="small" prefix="Start" defaultValue="145" variant="filled" style={{background: '#333', color: '#fff'}} /></Col>
              <Col span={12}><Input size="small" prefix="End" defaultValue="280" variant="filled" style={{background: '#333', color: '#fff'}} /></Col>
            </Row>
          </Card>

          <Divider style={{ borderColor: '#333' }} />
          
          <Title level={5} style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>区域帧管理 (Success/Fail)</Title>
          <Radio.Group defaultValue="success" size="small" block>
            <Radio.Button value="success" style={{ background: '#1a1a1a', color: '#52c41a' }}>Success</Radio.Button>
            <Radio.Button value="fail" style={{ background: '#1a1a1a', color: '#ff4d4f' }}>Fail</Radio.Button>
            <Radio.Button value="takeover" style={{ background: '#1a1a1a', color: '#1677ff' }}>Takeover</Radio.Button>
          </Radio.Group>
          
          <div style={{ marginTop: 24 }}>
            <Button block type="link" icon={<HistoryOutlined />}>查看历史记录</Button>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        body { margin: 0; overflow: hidden; background: #000; }
        .ant-radio-button-wrapper-checked { background: #333 !important; }
      `}</style>
    </div>
  );
}
