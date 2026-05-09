'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Tabs, Progress, App, Row, Col, Form, Select, Badge, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, LoginOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function AnnotationAuditPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const instanceMockData = Array.from({ length: 12 }).map((_, i) => ({
    key: i,
    project: 'SimulatedCollection(模拟采集) sin',
    taskbook: 'TB-抓取红色方块',
    annoId: 16822 - i,
    taskId: 21795,
    instanceId: 19884 - i,
    taskType: '垃圾清理',
    annoProgress: '186/186',
    auditProgress: '0/186',
  }));

  const columns = [
    { title: '', dataIndex: 'checkbox', width: 40, render: () => <Input type="checkbox" /> },
    { title: '项目', dataIndex: 'project', key: 'project', width: 200 },
    { title: '任务书', dataIndex: 'taskbook', key: 'taskbook', width: 180 },
    { title: '标注ID', dataIndex: 'annoId', key: 'annoId', width: 100 },
    { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 100, render: (t) => <Text style={{ color: '#1677ff' }}>{t}</Text> },
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 100, render: (t) => <Text style={{ color: '#1677ff' }}>{t}</Text> },
    { title: '任务类型', dataIndex: 'taskType', width: 100 },
    { title: '标注进度(数量)', dataIndex: 'annoProgress', width: 120 },
    { title: '审核进度(数量)', dataIndex: 'auditProgress', width: 120 },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right',
      render: (_, r) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }}>重新分配</Button>
          <Button type="link" size="small" icon={<LoginOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/annotation/audit/${r.instanceId}`)}>进入</Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: '数据采集' }, { title: '标注审核' }]} style={{ marginBottom: 16 }} />
      </div>

      {/* Filter Section */}
      <Card style={{ marginBottom: 16, borderRadius: 4 }} styles={{ body: { padding: '16px 24px' } }}>
        <Form layout="inline">
          <Row gutter={[8, 12]} style={{ width: '100%' }}>
            <Col span={4}><Select placeholder="请选择一级项目" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="请选择二级项目" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="请选择任务书" style={{ width: '100%' }} /></Col>
            <Col span={4}><Input placeholder="请输入任务名称" /></Col>
            <Col span={4}><Input placeholder="请输入任务ID" /></Col>
            <Col span={4}><Select placeholder="请选择标注类型" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="标注任务状态" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="标注员" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="审核员" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="标注状态" style={{ width: '100%' }} /></Col>
            <Col span={4}><Select placeholder="审核进度" style={{ width: '100%' }} /></Col>
            <Col span={4}><Input placeholder="标注任务名称" /></Col>
            <Col span={4}><Input placeholder="请输入标注任务ID" /></Col>
            <Col span={4}><Input placeholder="请输入实例ID" /></Col>
            <Col span={4}><Input placeholder="开始时间 - 结束时间" /></Col>
            <Col span={4}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                <Button icon={<ReloadOutlined />}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Table Section - Matching Screenshot Style */}
      <Card 
        title="审核任务列表" 
        extra={
          <Space>
            <Button icon={<UserOutlined />}>批量分配</Button>
            <Button icon={<DownloadOutlined />}>下载</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }} 
        style={{ borderRadius: 4 }}
      >
        <Table 
          columns={columns} 
          dataSource={instanceMockData} 
          scroll={{ x: 1500 }}
          pagination={{ 
            pageSize: 20, 
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
        />
      </Card>
    </MainLayout>
  );
}
