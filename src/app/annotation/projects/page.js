'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Modal, Tabs, Statistic, Row, Col, Progress, Drawer, Descriptions, App, Badge, Typography, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, TeamOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

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
    taskId: '2067066846211522561',
    taskName: '货架包裹分拣_01',
    taskbook: '货架包裹扫码、抓取与倒框任务书',
    taskNameEn: 'RealMan Logistics Parcel Picking Task 01',
    project: 'SimulatedCollection',
    subSceneCategory: 'UMI工业',
    deviceType: 'galbot',
    taskUsage: 'OfficialCollection(正式采集)',
    sceneCategory: '真实数据',
    collectionMode: 'UMI',
    remoteControlType: '双设备',
    annoType: '框标注',
    planCount: 100,
    status: '标注中',
    qaProgress: 100,
    annoProgress: 60,
    reviewProgress: 0,
    dataAmount: 153,
    creator: 'system',
    createTime: '2026-06-17 10:08:35',
  },
  {
    key: '2',
    taskId: '2067066846127636482',
    taskName: '零部件装配_01',
    taskbook: '流水线精密零件插拔与装配任务书',
    taskNameEn: 'Likong Assembly Pin Task 01',
    project: 'VLA-Data-Lab',
    subSceneCategory: 'UMI工业',
    deviceType: '鹿鸣',
    taskUsage: 'OfficialCollection(正式采集)',
    sceneCategory: '真实数据',
    collectionMode: 'UMI',
    remoteControlType: '双设备',
    annoType: '点标注',
    planCount: 200,
    status: '已完成',
    qaProgress: 100,
    annoProgress: 100,
    reviewProgress: 100,
    dataAmount: 2000,
    creator: 'system',
    createTime: '2026-06-17 10:08:35',
  },
  {
    key: '3',
    taskId: '2067066846018584578',
    taskName: '快递拆封取出_01',
    taskbook: '快递包裹拆封与内部物品取出任务书',
    taskNameEn: 'Zhidongli Package Opening Task 01',
    project: 'Kitchen-Action-Set',
    subSceneCategory: 'UMI物流',
    deviceType: 'galbot',
    taskUsage: 'TrialCollection(试用采集)',
    sceneCategory: '模拟数据',
    collectionMode: 'galbot',
    remoteControlType: '单设备',
    annoType: '范围&框标注',
    planCount: 150,
    status: '待分配',
    qaProgress: 100,
    annoProgress: 0,
    reviewProgress: 0,
    dataAmount: 480,
    creator: 'admin',
    createTime: '2026-06-18 11:00:00',
  },
  {
    key: '4',
    taskId: '2067066845917921281',
    taskName: '冰箱食物冷藏_01',
    taskbook: '智能冰箱冷藏室食物收纳任务书',
    taskNameEn: 'Luming Fridge Food Stocking Task 01',
    project: 'Logistics-Dataset',
    subSceneCategory: 'UMI家居',
    deviceType: '鹿鸣',
    taskUsage: 'OfficialCollection(正式采集)',
    sceneCategory: '真实数据',
    collectionMode: 'UMI',
    remoteControlType: '双设备',
    annoType: '无需标注',
    planCount: 180,
    status: '审核中',
    qaProgress: 100,
    annoProgress: 100,
    reviewProgress: 45,
    dataAmount: 720,
    creator: 'system',
    createTime: '2026-06-19 09:30:00',
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
  const [filters, setFilters] = useState({});

  const filteredData = React.useMemo(() => {
    return mockData.filter(item => {
      const nameMatch = !filters.name || item.taskName.toLowerCase().includes(filters.name.toLowerCase()) || item.taskId.toLowerCase().includes(filters.name.toLowerCase());
      const typeMatch = !filters.annoType || item.annoType === filters.annoType;
      const statusMatch = !filters.status || item.status === filters.status;
      const deviceMatch = !filters.deviceType || item.deviceType === filters.deviceType;
      const subSceneMatch = !filters.subSceneCategory || item.subSceneCategory === filters.subSceneCategory;
      return nameMatch && typeMatch && statusMatch && deviceMatch && subSceneMatch;
    });
  }, [filters]);

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
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 160,
      render: (v) => <Text style={{ color: '#1677ff', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
      ellipsis: true,
      fixed: 'left',
      render: (v, r) => (
        <Button type="link" style={{ padding: 0, textAlign: 'left', height: 'auto' }} onClick={() => { setSelectedRecord(r); setDetailOpen(true); }}>
          {v}
        </Button>
      ),
    },
    {
      title: '英文名称',
      dataIndex: 'taskNameEn',
      key: 'taskNameEn',
      width: 200,
      ellipsis: true,
      render: (v) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '任务书',
      dataIndex: 'taskbook',
      key: 'taskbook',
      width: 200,
      ellipsis: true,
    },
    {
      title: '子场景分类',
      dataIndex: 'subSceneCategory',
      key: 'subSceneCategory',
      width: 110,
      align: 'center',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 100,
      align: 'center',
      render: (v) => <Tag color={v === 'galbot' ? 'orange' : v === '鹿鸣' ? 'green' : 'default'}>{v}</Tag>,
    },
    {
      title: '任务用途',
      dataIndex: 'taskUsage',
      key: 'taskUsage',
      width: 180,
      ellipsis: true,
      render: (v) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '场景分类',
      dataIndex: 'sceneCategory',
      key: 'sceneCategory',
      width: 100,
      align: 'center',
      render: (v) => <Tag color={v === '真实数据' ? 'green' : 'cyan'}>{v}</Tag>,
    },
    {
      title: '采集模式',
      dataIndex: 'collectionMode',
      key: 'collectionMode',
      width: 100,
      align: 'center',
    },
    {
      title: '遥操类型',
      dataIndex: 'remoteControlType',
      key: 'remoteControlType',
      width: 90,
      align: 'center',
    },
    {
      title: '标注类型',
      dataIndex: 'annoType',
      key: 'annoType',
      width: 110,
      render: (t) => <Tag color={ANNO_TYPE_COLORS[t]}>{t}</Tag>,
    },
    {
      title: '计划采集',
      dataIndex: 'planCount',
      key: 'planCount',
      width: 80,
      align: 'right',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        return <StatusTag status={s} />;
      },
    },
    {
      title: '标注进度',
      key: 'progress',
      width: 120,
      render: (_, r) => (
        <Tooltip title={`标注 ${r.annoProgress}%`}>
          <Progress percent={r.annoProgress} size="small" strokeColor={r.annoProgress === 100 ? '#52c41a' : '#1677ff'} style={{ margin: 0 }} />
        </Tooltip>
      ),
    },
    {
      title: '审核进度',
      key: 'reviewProgress',
      width: 120,
      render: (_, r) => (
        <Tooltip title={`审核 ${r.reviewProgress}%`}>
          <Progress percent={r.reviewProgress} size="small" strokeColor={r.reviewProgress === 100 ? '#52c41a' : '#722ed1'} style={{ margin: 0 }} />
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
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 80,
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
      <div className="ui-page">
      <PageHeader
        title="标注管理"
        description="统一管理标注项目、人员分配与任务执行进度。"
        breadcrumbs={[{ title: '首页' }, { title: '数据标注' }, { title: '标注管理' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/annotation/projects/create')}>新建标注项目</Button>}
      />

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
      <FilterPanel>
        <QueryFilter
          submitter={{
            submitButtonProps: { icon: <SearchOutlined /> },
            resetButtonProps: { icon: <ReloadOutlined /> },
          }}
          onFinish={async (values) => {
            setFilters(values);
          }}
          onReset={() => {
            setFilters({});
          }}
        >
          <ProFormText name="name" label="任务名称/ID" placeholder="请输入任务名称或任务ID" />
          <ProFormSelect name="subSceneCategory" label="子场景分类" placeholder="请选择" options={['UMI工业', 'UMI家居', 'UMI物流', 'UMI医疗'].map(v => ({ value: v, label: v }))} />
          <ProFormSelect name="deviceType" label="设备类型" placeholder="请选择" options={[{ value: 'galbot', label: 'galbot' }, { value: '鹿鸣', label: '鹿鸣' }, { value: '真机', label: '真机' }, { value: '仿真机', label: '仿真机' }]} />
          <ProFormSelect name="annoType" label="标注类型" placeholder="全部" options={Object.keys(ANNO_TYPE_COLORS).map(v => ({ value: v, label: v }))} />
          <ProFormSelect name="status" label="标注状态" placeholder="全部" options={Object.keys(statusConfig).map(v => ({ value: v, label: v }))} />
        </QueryFilter>
      </FilterPanel>

      <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
        <TableToolbar title="标注任务列表" count={filteredData.length} />
        <Table
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 2800 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          rowClassName={(r) => r.status === '待分配' ? 'row-pending' : ''}
        />
      </Card>

      {/* Assign Modal */}
      <AppModal
        title={`分配人员 — ${selectedRecord?.taskName || ''}`}
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={handleAssign}
        okText="确认分配"
        cancelText="取消"
        widthSize="small"
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
      </AppModal>

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
              <StatusTag status={selectedRecord.status} />
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
      </div>
    </MainLayout>
  );
}
