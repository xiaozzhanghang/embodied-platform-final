'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Card, Typography, Space, Tag, Input, Badge, Breadcrumb, Select, Form, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, ColumnHeightOutlined, SettingOutlined, RobotOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function TaskbooksPage() {
  const router = useRouter();

  const mockData = [
    { key: '1', id: 'TB-2025001', name: '桌面抓取SOP规范', scene: '桌面场景', version: 'V1.0', status: '已发布', createTime: '2025-01-10 10:00:00', updateTime: '2025-01-12 14:30:00' },
    { key: '2', id: 'TB-2025002', name: '工业组装SOP规范', scene: '工厂场景', version: 'V2.1', status: '已发布', createTime: '2025-02-15 09:00:00', updateTime: '2025-02-16 11:20:00' },
    { key: '3', id: 'TB-2025005', name: '室内导航清扫规范', scene: '家庭场景', version: 'V1.0', status: '审核中', createTime: '2025-03-01 16:45:00', updateTime: '2025-03-01 16:45:00' },
  ];

  const columns = [
    { title: '任务书编号', dataIndex: 'id', key: 'id', width: 150 },
    { title: '任务书名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
    { title: '适用场景', dataIndex: 'scene', key: 'scene', width: 150 },
    { 
      title: '版本号', 
      dataIndex: 'version', 
      key: 'version', 
      width: 100,
      render: (v) => <Tag color="blue">{v}</Tag> 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 120,
      render: (s) => <Badge status={s === '已发布' ? 'success' : 'processing'} text={s} /> 
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/taskbooks/detail/${record.id}`)}>详情</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} style={{ padding: 0 }}>下载</Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '任务书' }]} style={{ marginBottom: 16 }} />
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>任务书</Title>
        <Text type="secondary">指导数据采集的标准作业程序(SOP)文档，支持上传 PDF/Word 或由 AI 智能生成。</Text>
      </div>

      <Card className="search-form" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Form layout="inline" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <Form.Item label="任务书名称" style={{ margin: 0 }}><Input placeholder="请输入" allowClear style={{ width: 220 }} /></Form.Item>
            <Form.Item label="适用场景" style={{ margin: 0 }}><Select placeholder="请选择" style={{ width: 220 }} /></Form.Item>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button>重置</Button>
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          </div>
        </Form>
      </Card>

      <Card styles={{ body: { padding: '24px' } }} style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>任务书列表</div>
          <Space>
            <Button type="default" icon={<RobotOutlined />} style={{ color: '#722ed1', borderColor: '#d3adf7', backgroundColor: '#f9f0ff' }}>
              AI 智能建书
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/taskbooks/create')}>手动新建</Button>
            <Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} /></Tooltip>
            <Tooltip title="密度"><Button type="text" icon={<ColumnHeightOutlined />} /></Tooltip>
            <Tooltip title="列设置"><Button type="text" icon={<SettingOutlined />} /></Tooltip>
          </Space>
        </div>

        <Table 
          rowSelection={{ type: 'checkbox' }} 
          columns={columns} 
          dataSource={mockData} 
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} 
        />
      </Card>
    </MainLayout>
  );
}
