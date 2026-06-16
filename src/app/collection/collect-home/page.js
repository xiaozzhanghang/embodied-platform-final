'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Card, Statistic, Button, Space, Typography, Badge, Progress, Timeline } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  DashboardOutlined,
  RobotOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  SyncOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Paragraph } = Typography;

export default function CollectorHomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const quickStats = [
    { title: '待采集任务', value: 3, icon: <ClockCircleOutlined />, color: '#fa8c16', bg: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)' },
    { title: '采集中任务', value: 2, icon: <SyncOutlined spin />, color: '#1890ff', bg: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' },
    { title: '今日已采集', value: 12, icon: <CheckCircleOutlined />, color: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '4px 0 24px' }}>
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '16px',
          padding: '32px 40px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(24, 144, 255, 0.15)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 650, margin: '0 0 8px' }}>
              你好，采集员 cy00831！
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '15px', margin: 0 }}>
              设备链路已就绪，请前往“任务中心（采集端）”开始执行数据采集工作。
            </p>
          </div>
          <Button 
            type="primary" 
            size="large"
            icon={<PlayCircleOutlined />} 
            onClick={() => router.push('/collection/collect')}
            style={{ 
              background: '#fff', 
              color: '#096dd9', 
              border: 'none', 
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            进入任务中心 <ArrowRightOutlined />
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {quickStats.map((item, idx) => (
            <Col xs={24} sm={8} key={idx}>
              <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '14px' }}>{item.title}</Text>
                    <div style={{ fontSize: '30px', fontWeight: 700, color: '#1f1f1f', marginTop: '4px' }}>
                      {item.value} <span style={{ fontSize: '14px', fontWeight: 400, color: '#8c8c8c' }}>个</span>
                    </div>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    color: item.color
                  }}>
                    {item.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Detailed Grid: Device Status & Activity */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card title={<strong>设备在线状态</strong>} bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <RobotOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                    <div>
                      <strong style={{ fontSize: '15px' }}>Lumos UMI 双手控制台</strong>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>IP: 192.168.10.105 | PTP 时钟已同步</div>
                    </div>
                  </div>
                  <Badge status="success" text={<span style={{ color: '#52c41a', fontWeight: 600 }}>在线</span>} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <RobotOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
                    <div>
                      <strong style={{ fontSize: '15px' }}>FRANKA-FR3 机械臂</strong>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>IP: 192.168.10.110 | 控制器连接正常</div>
                    </div>
                  </div>
                  <Badge status="success" text={<span style={{ color: '#52c41a', fontWeight: 600 }}>在线</span>} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CompassOutlined style={{ fontSize: '28px', color: '#fa8c16' }} />
                    <div>
                      <strong style={{ fontSize: '15px' }}>多目相机传感器流</strong>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>3路视频流已就绪 | 帧率: 30FPS</div>
                    </div>
                  </div>
                  <Badge status="success" text={<span style={{ color: '#52c41a', fontWeight: 600 }}>在线</span>} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title={<strong>数采动态日志</strong>} bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
              <Timeline style={{ marginTop: '8px' }}
                items={[
                  { color: 'green', content: '14:02:15 Lumos 设备完成 IEEE 1588 时钟校准' },
                  { color: 'blue', content: '13:50:33 完成任务 42729 [CarTrunkStorage_job] 的数据上传' },
                  { color: 'blue', content: '13:45:00 开始执行第 4 组手眼协同动作采集' },
                  { color: 'green', content: '13:00:10 采集站设备全通道自检通过' },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
