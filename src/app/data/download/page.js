'use client';

import React, { useState } from 'react';
import { Table, Button, Card, Typography, Space, Tag, Input, Badge, Progress, Tabs, Tooltip, App, Popconfirm, Row, Col } from 'antd';
import { DownloadOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined, FileZipOutlined, CopyOutlined, CloudDownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockData = [
  { key: '1', id: 'DL-001', name: '具身抓取训练集_V1.2.0', version: 'v1.2.0', size: '70.5GB', format: 'HDF5', status: '准备就绪', progress: 100, time: '2025-03-01 10:00' },
  { key: '2', id: 'DL-002', name: 'UR5e装配数据包_BETA', version: 'v0.9.5', size: '15.8GB', format: 'RLDS', status: '打包中', progress: 65, time: '2025-03-03 14:20' },
  { key: '3', id: 'DL-003', name: '具身抓取训练集_V1.2.0 (RLDS)', version: 'v1.2.0', size: '68.2GB', format: 'RLDS', status: '准备就绪', progress: 100, time: '2025-03-01 10:05' },
  { key: '4', id: 'DL-004', name: '分拣子集-01_原始轨迹导出', version: 'raw', size: '1.2GB', format: 'HDF5', status: '排队中', progress: 0, time: '2025-03-05 09:00' },
];

export default function DownloadCenterPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('all');

  const handleCopyLink = () => {
    message.success('内网高速下载链接已复制到剪贴板');
  };

  const columns = [
    { title: '导出记录', key: 'record', render: (_, r) => (
      <Space>
        <FileZipOutlined style={{ fontSize: 24, color: '#1677ff' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {r.id} | 版本: {r.version}</Text>
        </div>
      </Space>
    )},
    { title: '格式', dataIndex: 'format', key: 'format', width: 100, render: (f) => <Tag color="blue">{f}</Tag> },
    { title: '数据大小', dataIndex: 'size', key: 'size', width: 120 },
    { title: '状态/进度', key: 'status', width: 220, render: (_, r) => (
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Space size={4}>
            {r.status === '准备就绪' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            {r.status === '打包中' && <SyncOutlined spin style={{ color: '#1677ff' }} />}
            {r.status === '排队中' && <ClockCircleOutlined style={{ color: '#faad14' }} />}
            <Text style={{ fontSize: 12 }}>{r.status}</Text>
          </Space>
          <Text style={{ fontSize: 12 }}>{r.progress}%</Text>
        </div>
        <Progress percent={r.progress} size="small" showInfo={false} status={r.status === '准备就绪' ? 'success' : 'active'} />
      </div>
    )},
    { title: '创建日期', dataIndex: 'time', key: 'time', width: 170 },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right', render: (_, r) => (
        <Space>
          <Button type="primary" size="small" icon={<CloudDownloadOutlined />} disabled={r.status !== '准备就绪'} onClick={() => message.info('开始下载')}>高速下载</Button>
          <Tooltip title="复制高速下载链接"><Button size="small" icon={<CopyOutlined />} onClick={handleCopyLink} /></Tooltip>
          <Popconfirm title="确定删除记录？"><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>下载中心</Title>
        <Text type="secondary">管理已发布的训练集、原始数据导出记录及其下载状态。</Text>
      </div>

      <Card className="search-form" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Space style={{ width: '100%' }}>
              <Input placeholder="搜索记录名称或 ID" prefix={<SearchOutlined />} style={{ width: 400 }} />
              <Button type="primary">查询</Button>
              <Button icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Text type="secondary">内网带宽资源: </Text>
              <Progress type="circle" percent={35} size={30} />
              <Text strong>1.2 Gbps</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ padding: '0 24px' }}
          items={[
            { key: 'all', label: '全部记录' },
            { key: 'ready', label: '准备就绪' },
            { key: 'processing', label: '正在处理' },
          ]}
        />
        <Table 
          columns={columns} 
          dataSource={mockData} 
          style={{ padding: '0 24px 24px' }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8, border: '1px solid #adc6ff' }}>
        <Space align="start">
          <InfoCircleOutlined style={{ color: '#1677ff', marginTop: 4 }} />
          <div>
            <Text strong>高速下载说明</Text><br/>
            <Text type="secondary" style={{ fontSize: 13 }}>
              1. 数据集通常较大（{">"}10GB），建议在内网环境下使用“高速下载”功能。<br/>
              2. 系统支持多格式并行打包，您可以同时提交 HDF5 和 RLDS 格式的发布申请。<br/>
              3. 下载记录将保留 30 天，超期后系统将自动清理文件以节省空间。
            </Text>
          </div>
        </Space>
      </div>
    </MainLayout>
  );
}
