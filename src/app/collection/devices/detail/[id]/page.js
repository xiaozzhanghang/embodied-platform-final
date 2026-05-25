'use client';

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Tag, Breadcrumb, Card, Row, Col, 
  Tabs, Table, Badge, Descriptions, Divider, Avatar, Progress,
  Timeline, Alert, List
} from 'antd';
import { 
  ArrowLeftOutlined, RobotOutlined, ApiOutlined, 
  ThunderboltOutlined, SettingOutlined, HistoryOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  RadarChartOutlined, LineChartOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function DeviceInstanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  const isEditing = searchParams.get('edit') === 'true';

  // Mock data for a specific device instance
  const device = {
    id: params.id || 'DEV-2026-001',
    name: 'Galbot-G2-Node-105',
    enName: 'galbot_g2_node_105',
    deviceNum: 'DEV-2026-001',
    type: 'galbot_2.2_RGB',
    status: '在线',
    ip: '192.168.1.105',
    uptime: '15d 4h 22m',
    battery: 85,
    lastActive: '2026-05-11 13:15:22',
    urdf: 'galbot_model.urdf',
    image: null,
    parts: [
      { name: 'Head-Camera', status: 'normal', latency: '12ms', temp: '42°C' },
      { name: 'Arm-Right', status: 'normal', load: '15%', temp: '38°C' },
      { name: 'Chassis-Base', status: 'normal', speed: '0.5m/s', battery: '85%' },
      { name: 'Lidar', status: 'warning', msg: '遮挡风险', latency: '45ms' }
    ],
    recentTasks: [
      { id: 'TSK-001', name: '桌面分拣任务', time: '2026-05-11 10:00', status: 'Success' },
      { id: 'TSK-002', name: '门口迎宾测试', time: '2026-05-10 16:30', status: 'Success' },
      { id: 'TSK-003', name: '避障逻辑验证', time: '2026-05-10 14:00', status: 'Failed' }
    ]
  };

  const partColumns = [
    { 
      title: '部件名称', 
      dataIndex: 'name', 
      render: (text) => <Space><ApiOutlined />{text}</Space> 
    },
    { 
      title: '状态', 
      dataIndex: 'status',
      render: (s, r) => (
        <Badge status={s === 'normal' ? 'success' : 'warning'} text={s === 'normal' ? '正常' : r.msg} />
      )
    },
    { title: '性能参数', render: (_, r) => <Text type="secondary">{r.latency || r.load || r.speed || '-'}</Text> },
    { title: '温度', dataIndex: 'temp', render: (t) => t ? <Tag color={parseInt(t) > 50 ? 'orange' : 'green'}>{t}</Tag> : '-' }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: '首页' },
          { title: '设备管理' },
          { title: '设备列表', href: '/collection/devices' },
          { title: '实例详情' }
        ]} style={{ marginBottom: 16 }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>{device.name}</Title>
                <Tag color={device.status === '在线' ? 'green' : 'red'}>{device.status}</Tag>
                <Text type="secondary">ID: {device.id}</Text>
              </div>
            </div>
          </Space>
          
          <Space>
            <Button icon={<ThunderboltOutlined />}>远程诊断</Button>
            {isEditing && <Button icon={<SettingOutlined />}>修改配置</Button>}
            <Button type="primary">开始采集</Button>
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={18}>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>电池电量</Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>{device.battery}%</Title>
                  <Progress type="circle" percent={device.battery} size={32} strokeColor="#52c41a" />
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>连续运行时间</Text>
                <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>{device.uptime}</Title>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>网络延迟 (P99)</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>18ms</Title>
                  <Tag color="green" bordered={false}>优</Tag>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} styles={{ body: { padding: '20px' } }} style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>环境温度</Text>
                <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>24.5 °C</Title>
              </Card>
            </Col>
          </Row>

          <Card bordered={false} styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
              items={[
                {
                  key: 'overview',
                  label: '健康状况',
                  children: (
                    <div style={{ padding: 24 }}>
                      {device.parts.some(p => p.status !== 'normal') && (
                        <Alert 
                          message="硬件异常预警" 
                          description="激光雷达 (Lidar) 检测到遮挡风险，可能影响 SLAM 定位稳定性。"
                          type="warning" 
                          showIcon 
                          style={{ marginBottom: 24 }} 
                        />
                      )}
                      <Table 
                        dataSource={device.parts} 
                        columns={partColumns} 
                        pagination={false}
                        size="middle"
                        rowKey="name"
                      />
                    </div>
                  )
                },
                {
                  key: 'history',
                  label: '任务记录',
                  children: (
                    <div style={{ padding: 24 }}>
                      <Table 
                        dataSource={device.recentTasks}
                        pagination={false}
                        columns={[
                          { title: '任务ID', dataIndex: 'id' },
                          { title: '任务名称', dataIndex: 'name' },
                          { title: '执行时间', dataIndex: 'time' },
                          { title: '结果', dataIndex: 'status', render: s => <Tag color={s === 'Success' ? 'green' : 'red'}>{s}</Tag> }
                        ]}
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card title="实例信息" bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="设备编号">{device.deviceNum}</Descriptions.Item>
              <Descriptions.Item label="英文名称">{device.enName || '—'}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{device.type}</Descriptions.Item>
              <Descriptions.Item label="内网IP">{device.ip}</Descriptions.Item>
              <Descriptions.Item label="注册时间">2026-02-25</Descriptions.Item>
              <Descriptions.Item label="最后通讯">{device.lastActive}</Descriptions.Item>
              <Descriptions.Item label="URDF文件">{device.urdf ? <a>{device.urdf}</a> : '—'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>设备图片</Text>
              {device.image ? (
                <img src={device.image} alt="设备图片" style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} />
              ) : (
                <div style={{ width: '100%', height: 120, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">暂无图片</Text>
                </div>
              )}
            </div>
          </Card>

          <Card title="运行日志" bordered={false} style={{ borderRadius: 8 }}>
            <Timeline 
              mode="left"
              style={{ marginTop: 16 }}
              items={[
                { color: 'green', children: '系统启动成功 13:10' },
                { color: 'blue', children: '任务 TSK-001 下发 10:00' },
                { color: 'green', children: '标定完成 09:45' },
                { color: 'gray', children: '例行检查 09:00' }
              ]}
            />
            <Button block type="link">查看完整日志</Button>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
