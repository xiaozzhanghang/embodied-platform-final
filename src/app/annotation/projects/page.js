'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Modal, Tabs, Statistic, Row, Col, Progress, Drawer, Descriptions, App, Badge, Typography, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, TeamOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const ANNO_TYPE_COLORS = {
  '点标注': 'purple',
  '范围标注': 'blue',
  '框标注': 'orange',
  '范围&框标注': 'geekblue',
  '无需标注': 'default',
};

const mockData = [
  {
    key: '1',
    annoId: 'ANNO-778891',
    name: 'FRANKA-FR3-抓取红色方块-001',
    annoType: '框标注',
    taskId: 'CT-20250301001',
    project: 'SimulatedCollection',
    annoer: '标注员X',
    reviewer: '审核员Y',
    status: '标注中',
    qaProgress: 100,
    annoProgress: 60,
    reviewProgress: 0,
    dataAmount: 153,
    createTime: '2025-03-02 09:00',
  },
  {
    key: '2',
    annoId: 'ANNO-992210',
    name: 'UR5-放置杯子-022',
    annoType: '点标注',
    taskId: 'CT-20250305022',
    project: 'VLA-Data-Lab',
    annoer: '标注员M',
    reviewer: '审核员N',
    status: '已完成',
    qaProgress: 100,
    annoProgress: 100,
    reviewProgress: 100,
    dataAmount: 2000,
    createTime: '2025-03-03 14:30',
  },
  {
    key: '3',
    annoId: 'ANNO-881122',
    name: 'G1-整理厨具-007',
    annoType: '范围&框标注',
    taskId: 'CT-20250308007',
    project: 'Kitchen-Action-Set',
    annoer: null,
    reviewer: null,
    status: '待分配',
    qaProgress: 100,
    annoProgress: 0,
    reviewProgress: 0,
    dataAmount: 480,
    createTime: '2025-03-08 11:00',
  },
  {
    key: '4',
    annoId: 'ANNO-663344',
    name: 'G1-搬运纸箱-015',
    annoType: '无需标注',
    taskId: 'CT-20250310015',
    project: 'Logistics-Dataset',
    annoer: '标注员A',
    reviewer: null,
    status: '审核中',
    qaProgress: 100,
    annoProgress: 100,
    reviewProgress: 45,
    dataAmount: 720,
    createTime: '2025-03-10 09:30',
  },
];

const annotators = ['标注员A', '标注员B', '标注员M', '标注员X', '标注员Z'];
const reviewers = ['审核员Y', '审核员N', '审核员P'];

const statusConfig = {
  '待分配': { color: 'default', icon: <ClockCircleOutlined /> },
  '标注中': { color: 'processing', icon: <SyncOutlined spin /> },
  '审核中': { color: 'warning', icon: <EyeOutlined /> },
  '已完成': { color: 'success', icon: <CheckCircleOutlined /> },
};

export default function AnnotationProjectsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [assignAnnotator, setAssignAnnotator] = useState(null);
  const [assignReviewer, setAssignReviewer] = useState(null);

  const openAssign = (record) => {
    setSelectedRecord(record);
    setAssignAnnotator(record.annoer);
    setAssignReviewer(record.reviewer);
    setAssignOpen(true);
  };

  const handleAssign = () => {
    if (!assignAnnotator) { message.warning('请选择标注员'); return; }
    message.success(`已成功分配标注员「${assignAnnotator}」`);
    setAssignOpen(false);
  };

  const columns = [
    {
      title: '标注ID',
      dataIndex: 'annoId',
      key: 'annoId',
      width: 130,
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 230,
      ellipsis: true,
      render: (v, r) => (
        <Button type="link" style={{ padding: 0, textAlign: 'left', height: 'auto' }} onClick={() => { setSelectedRecord(r); setDetailOpen(true); }}>
          {v}
        </Button>
      ),
    },
    {
      title: '标注类型',
      dataIndex: 'annoType',
      key: 'annoType',
      width: 120,
      render: (t) => <Tag color={ANNO_TYPE_COLORS[t]}>{t}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const cfg = statusConfig[s] || {};
        return <Badge status={cfg.color || 'default'} text={s} />;
      },
    },
    {
      title: '标注员',
      dataIndex: 'annoer',
      key: 'annoer',
      width: 110,
      render: (v, r) => v
        ? <Space size={4}><UserOutlined style={{ color: '#1677ff' }} /><span>{v}</span></Space>
        : <Button size="small" type="dashed" icon={<UserOutlined />} onClick={() => openAssign(r)}>待分配</Button>,
    },
    {
      title: '审核员',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 110,
      render: (v, r) => v
        ? <Space size={4}><UserOutlined style={{ color: '#52c41a' }} /><span>{v}</span></Space>
        : <Button size="small" type="dashed" icon={<UserOutlined />} onClick={() => openAssign(r)}>待分配</Button>,
    },
    {
      title: '标注进度',
      key: 'progress',
      width: 180,
      render: (_, r) => (
        <Tooltip title={`标注 ${r.annoProgress}% | 审核 ${r.reviewProgress}%`}>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>标注</div>
            <Progress percent={r.annoProgress} size="small" strokeColor="#1677ff" showInfo={false} />
            <div style={{ fontSize: 11, color: '#999', marginTop: 4, marginBottom: 2 }}>审核</div>
            <Progress percent={r.reviewProgress} size="small" strokeColor="#52c41a" showInfo={false} />
          </div>
        </Tooltip>
      ),
    },
    {
      title: '数据量',
      dataIndex: 'dataAmount',
      key: 'dataAmount',
      width: 80,
      render: (v) => `${v} 帧`,
    },
    {
      title: '所属项目',
      dataIndex: 'project',
      key: 'project',
      width: 160,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
    {
      title: '操作', fixed: 'right',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => router.push('/annotation/answer')}>标注</Button>
          <Button type="link" size="small" onClick={() => router.push('/annotation/review-list')}>审核</Button>
          <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => openAssign(r)}>分配</Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: mockData.length,
    pending: mockData.filter(d => d.status === '待分配').length,
    ongoing: mockData.filter(d => d.status === '标注中' || d.status === '审核中').length,
    done: mockData.filter(d => d.status === '已完成').length,
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h3 className="page-header-title">标注管理</h3>
      </div>

      {/* Stats Banner */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: '任务总数', value: stats.total, color: '#1677ff' },
          { label: '待分配', value: stats.pending, color: '#faad14' },
          { label: '进行中', value: stats.ongoing, color: '#1677ff' },
          { label: '已完成', value: stats.done, color: '#52c41a' },
        ].map(s => (
          <Col span={6} key={s.label}>
            <Card size="small" style={{ borderLeft: `4px solid ${s.color}`, borderRadius: 6 }}>
              <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color, fontSize: 28 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search Bar */}
      <Card 
        style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
        styles={{ body: { padding: '24px 24px 0' } }}
      >
        <Form layout="horizontal" labelCol={{ flex: '80px' }}>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="任务名称"><Input placeholder="请输入" allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="标注类型"><Select placeholder="全部" allowClear options={Object.keys(ANNO_TYPE_COLORS).map(v => ({ value: v }))} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="标注状态"><Select placeholder="全部" allowClear options={Object.keys(statusConfig).map(v => ({ value: v }))} /></Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ReloadOutlined />}>重置</Button>
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                <Button type="link" size="small" icon={<DownOutlined />}>展开</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div className="table-toolbar">
          <span className="table-toolbar-title">标注任务列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/annotation/projects/create')}>新建标注项目</Button>
        </div>
        <Table
          columns={columns}
          dataSource={mockData}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          rowClassName={(r) => r.status === '待分配' ? 'row-pending' : ''}
        />
      </Card>

      {/* Assign Modal */}
      <Modal
        title={`分配人员 — ${selectedRecord?.name || ''}`}
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={handleAssign}
        okText="确认分配"
        cancelText="取消"
        width={500}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="标注员" required>
            <Select
              placeholder="请选择标注员"
              value={assignAnnotator}
              onChange={setAssignAnnotator}
              options={annotators.map(v => ({ value: v, label: v }))}
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="审核员">
            <Select
              placeholder="请选择审核员（可选）"
              value={assignReviewer}
              onChange={setAssignReviewer}
              options={reviewers.map(v => ({ value: v, label: v }))}
              size="large"
              style={{ width: '100%' }}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={`任务详情 — ${selectedRecord?.annoId || ''}`}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        styles={{ wrapper: { width: 480 } }}
      >
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="标注ID">{selectedRecord.annoId}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{selectedRecord.name}</Descriptions.Item>
            <Descriptions.Item label="所属项目">{selectedRecord.project}</Descriptions.Item>
            <Descriptions.Item label="关联采集任务">{selectedRecord.taskId}</Descriptions.Item>
            <Descriptions.Item label="标注类型">
              <Tag color={ANNO_TYPE_COLORS[selectedRecord.annoType]}>{selectedRecord.annoType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={statusConfig[selectedRecord.status]?.color} text={selectedRecord.status} />
            </Descriptions.Item>
            <Descriptions.Item label="标注员">{selectedRecord.annoer || '未分配'}</Descriptions.Item>
            <Descriptions.Item label="审核员">{selectedRecord.reviewer || '未分配'}</Descriptions.Item>
            <Descriptions.Item label="数据量">{selectedRecord.dataAmount} 帧</Descriptions.Item>
            <Descriptions.Item label="标注进度">
              <Progress percent={selectedRecord.annoProgress} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label="审核进度">
              <Progress percent={selectedRecord.reviewProgress} size="small" strokeColor="#52c41a" />
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedRecord.createTime}</Descriptions.Item>
          </Descriptions>
        )}
        <div style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block type="primary" onClick={() => { setDetailOpen(false); router.push('/annotation/answer'); }}>进入标注工作台</Button>
            <Button block onClick={() => { setDetailOpen(false); openAssign(selectedRecord); }}>分配/修改人员</Button>
          </Space>
        </div>
      </Drawer>
    </MainLayout>
  );
}
