'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Badge, App } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function ComponentManagementPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const componentColumns = [
    { title: '组件名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '组件类型', dataIndex: 'type', key: 'type', width: 150, render: (t) => <Tag color="blue">{t}</Tag> },
    { title: '所属设备', dataIndex: 'device', key: 'device', width: 200 },
    { title: '包含Topic数', dataIndex: 'topicCount', key: 'topicCount', width: 120, render: (c) => <Badge count={c} style={{ backgroundColor: '#52c41a' }} /> },
    { title: '状态', render: () => <Badge status="success" text="正常运行" />, width: 120 },
    { title: '更新时间', dataIndex: 'time', key: 'time', width: 180 },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right', render: () => (
        <Space>
          <Button type="link" size="small" icon={<SettingOutlined />}>编辑详情</Button>
          <Button type="link" size="small" danger>移除</Button>
        </Space>
      )
    },
  ];

  const mockData = [
    { key: '1', name: '英特尔 RealSense D435', type: '深度相机', device: 'Galbot-G2-Alpha', topicCount: 3, time: '2025-03-01 10:00' },
    { key: '2', name: 'Robotiq 2F-85', type: '二指夹爪', device: 'Franka-FR3-Beta', topicCount: 2, time: '2025-02-28 15:30' },
    { key: '3', name: 'Velodyne VLP-16', type: '激光雷达', device: 'Galbot-G2-Alpha', topicCount: 1, time: '2025-03-01 11:15' },
    { key: '4', name: '九轴IMU传感器', type: 'IMU惯导', device: 'Franka-FR3-Beta', topicCount: 1, time: '2025-02-28 09:20' },
  ];

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <ToolOutlined style={{ fontSize: 24, marginRight: 12, color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>机器人部件管理</Title>
        </div>
      </div>
      
      <Card styles={{ body: { padding: '24px' } }}>
        <div className="table-toolbar" style={{ marginBottom: 16 }}>
          <Space>
            <Input placeholder="输入组件名称" prefix={<SearchOutlined />} style={{ width: 250 }} />
            <Button type="primary">查询</Button>
            <Button icon={<ReloadOutlined />} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/components/create')}>接入新部件 (配置 Topic)</Button>
        </div>
        <Table 
            columns={componentColumns} 
            dataSource={mockData} 
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条组件` }}
        />
      </Card>
    </MainLayout>
  );
}
