'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Tabs, Progress, App, Row, Col, Form, Select, Badge, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, LoginOutlined, DownloadOutlined, UserOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function AnnotationAuditPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [expand, setExpand] = useState(false);

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

      <Card 
        style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
        styles={{ body: { padding: '24px 24px 0' } }}
      >
        <Form layout="horizontal" labelCol={{ flex: '80px' }}>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="一级项目"><Select placeholder="请选择" allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="二级项目"><Select placeholder="请选择" allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="任务书"><Select placeholder="请选择" allowClear /></Form.Item>
            </Col>
            {!expand && (
              <Col span={6} style={{ textAlign: 'right' }}>
                <Space>
                  <Button icon={<ReloadOutlined />}>重置</Button>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                    展开 <DownOutlined />
                  </a>
                </Space>
              </Col>
            )}
          </Row>
          {expand && (
            <>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item label="任务名称"><Input placeholder="请输入" allowClear /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="任务ID"><Input placeholder="请输入" allowClear /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="标注类型"><Select placeholder="请选择" allowClear /></Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item label="任务状态"><Select placeholder="请选择" allowClear /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="标注员"><Select placeholder="请选择" allowClear /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="审核员"><Select placeholder="请选择" allowClear /></Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={24} style={{ textAlign: 'right', marginBottom: 24 }}>
                  <Space>
                    <Button icon={<ReloadOutlined />}>重置</Button>
                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                    <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                      收起 <UpOutlined />
                    </a>
                  </Space>
                </Col>
              </Row>
            </>
          )}
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
