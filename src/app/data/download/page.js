'use client';

import React from 'react';
import { Table, Button, Card, Typography, Space, Tag, Input, Badge, Progress } from 'antd';
import { DownloadOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'DL-001', name: '桌面抓取训练集_V1_202503', size: '2.4GB', type: 'Sequence Pack', status: '准备就绪', progress: 100, time: '2025-03-01' },
  { key: '2', id: 'DL-002', name: 'UR5e装配数据包_BETA', size: '15.8GB', type: 'Raw Data', status: '准备中', progress: 65, time: '2025-03-03' },
  { key: '3', id: 'DL-003', name: '2025-Q1-轨迹库导出', size: '850MB', type: 'Annotations', status: '准备就绪', progress: 100, time: '2025-03-04' },
];

export default function DownloadCenterPage() {
  const columns = [
    { title: '任务ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '导出记录名称', dataIndex: 'name', key: 'name' },
    { title: '数据大小', dataIndex: 'size', key: 'size', width: 120 },
    { title: '文件类型', dataIndex: 'type', key: 'type', width: 150 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 150, render: (s) => <Badge status={s === '准备就绪' ? 'success' : 'processing'} text={s} /> },
    { title: '进度', dataIndex: 'progress', key: 'progress', width: 180, render: (p) => <Progress percent={p} size="small" /> },
    { title: '创建日期', dataIndex: 'time', key: 'time', width: 150 },
    {
      title: '操作', key: 'action', width: 180, render: (_, r) => (
        <Space>
          <Button type="primary" size="small" icon={<DownloadOutlined />} disabled={r.status !== '准备就绪'}>下载</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <div className="page-header"><Title level={4}>下载中心</Title></div>
      <Card className="search-form" style={{ marginBottom: 16 }}>
        <Space><Input placeholder="搜索导出记录" prefix={<SearchOutlined />} style={{ width: 300 }} /><Button type="primary">查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space>
      </Card>
      <Card styles={{ body: { padding: 0 } }}><Table columns={columns} dataSource={mockData} /></Card>
    </MainLayout>
  );
}
