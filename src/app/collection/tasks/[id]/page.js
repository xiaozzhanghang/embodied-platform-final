'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Card, Typography,
  Badge, App, Modal, Form, Select, Input, Switch, Tabs, 
  Progress, Tooltip, Descriptions, Divider, Row, Col, InputNumber, Upload, Radio, Checkbox, Alert
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, SyncOutlined,
  ThunderboltOutlined, PauseCircleOutlined, TagsOutlined, InfoCircleOutlined,
  DownloadOutlined, FileSearchOutlined, CloudUploadOutlined, EditOutlined, 
  DeleteOutlined, CheckCircleOutlined, ReloadOutlined, PauseOutlined,
  ExclamationCircleOutlined, UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockInstancesCollect = [
  { key: '1', instanceId: '12745', taskName: '货架物品物理采集', autoDataset: false, annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '张三', annotator: '李四', auditor: '王五', deviceInstance: 'R002GB-RGB-101', startTime: '2026-03-11 09:00', collectProgress: 53, status: '采集中' },
  { key: '2', instanceId: '12744', taskName: '货架物品物理采集', autoDataset: false, annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '李四', annotator: '赵六', auditor: '天奇管理员', deviceInstance: 'R002GB-RGB-102', startTime: '2026-03-11 10:30', collectProgress: 80, status: '采集中' },
  { key: '3', instanceId: '12619', taskName: '货架物品物理采集', autoDataset: false, annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '-', annotator: '-', auditor: '-', deviceInstance: '—', startTime: '-', collectProgress: 0, status: '待分配' },
  { key: '4', instanceId: '12511', taskName: '货架物品物理采集', autoDataset: false, annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '王五', annotator: '李四', auditor: '王五', deviceInstance: 'R002GB-RGB-101', startTime: '2026-03-10 14:30', collectProgress: 100, status: '已完成' },
];

const mockInstancesAsset = [
  { key: '1', instanceId: 'AST-844101', taskName: '工业纸箱打包封装', assetSource: 'Lumos_FastUMI_202606', annoType: '帧区间标注', planCount: 30, annotator: '李四', auditor: '王五', startTime: '2026-06-12 10:00', collectProgress: 75, status: '标注审核中' },
  { key: '2', instanceId: 'AST-844102', taskName: '工业纸箱打包封装', assetSource: 'Lumos_FastUMI_202606', annoType: '帧区间标注', planCount: 25, annotator: '张三', auditor: '天奇管理员', startTime: '2026-06-12 11:30', collectProgress: 40, status: '标注审核中' },
  { key: '3', instanceId: 'AST-844103', taskName: '工业纸箱打包封装', assetSource: 'Lumos_FastUMI_202606', annoType: '关键帧标注', planCount: 20, annotator: '-', auditor: '-', startTime: '-', collectProgress: 0, status: '待分配' },
];

const StatCard = ({ icon, value, label, iconBg, color }) => (
  <Card size="small" style={{ borderRadius: 12, border: '1px solid #f0f0f0', flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ 
        width: 48, height: 48, borderRadius: 10, background: iconBg, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{label}</div>
      </div>
    </div>
  </Card>
);

export default function TaskInstancePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [addPackForm] = Form.useForm();
  const [annoForm] = Form.useForm();
  
  const typeParam = searchParams ? searchParams.get('type') : null;
  const needCollectParam = searchParams ? searchParams.get('needCollect') : null;

  const isAnno = typeParam === 'asset' || id === '12854' || (typeof id === 'string' && (id.startsWith('ANNO') || id.startsWith('asset')));
  const isNoCollectTask = needCollectParam === 'false' || id === 'COLL-20260415-002' || (typeof id === 'string' && (id.includes('NOCOLLECT') || id.includes('ASSET_COLLECT')));
  
  const initialMode = isAnno ? 'asset' : 'collect';
  const [taskMode, setTaskMode] = useState(initialMode);

  useEffect(() => {
    if (isAnno) {
      setTaskMode('asset');
    } else {
      setTaskMode('collect');
    }
  }, [typeParam, id, isAnno]);
  const [activeTab, setActiveTab] = useState('all');
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Track selected annotation types for dynamic rendering
  const [selectedTypes, setSelectedTypes] = useState(['point']);

  // Modal visibility states
  const [isAddPackVisible, setIsAddPackVisible] = useState(false);
  const [isPauseTaskVisible, setIsPauseTaskVisible] = useState(false);
  const [isAddAnnoVisible, setIsAddAnnoVisible] = useState(false);

  const handlePausePack = (record) => {
    Modal.confirm({
      title: `暂停包 ${record.instanceId}`,
      content: `暂停后，操作员将无法继续录入。该包内已完成的数据将自动打包解析并流转至质检中心。`,
      okText: '确认暂停',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => message.success(`包 ${record.instanceId} 已暂停`),
    });
  };

  const handleCompletePack = (record) => {
    Modal.confirm({
      title: `标记包 ${record.instanceId} 为完成`,
      content: `确认后，该包将结束流程并自动打包解析，数据将流转至质检中心。`,
      okText: '确认完成',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => message.success(`包 ${record.instanceId} 已完成`),
    });
  };

  const getStatusActions = (record) => {
    if (record.status === '已完成') {
      return (
        <Space separator={<Divider orientation="vertical" />} size={0}>
          <Button type="link" size="small" icon={<DownloadOutlined />} style={{ padding: '0 4px' }}>下载</Button>
          <Button type="link" size="small" icon={<FileSearchOutlined />} style={{ padding: '0 4px', color: '#52c41a' }}>质检详情</Button>
          <Button type="link" size="small" icon={<CloudUploadOutlined />} style={{ padding: '0 4px', color: '#722ed1' }}>手动上传</Button>
        </Space>
      );
    }
    if (record.status === '待分配') {
      return (
        <Space separator={<Divider orientation="vertical" />} size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: '0 4px' }}>编辑</Button>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '0 4px' }} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}>删除</Button>
        </Space>
      );
    }
    return (
      <Space separator={<Divider orientation="vertical" />} size={0}>
        <Button type="link" size="small" icon={<PauseCircleOutlined />} style={{ padding: '0 4px', color: '#faad14' }} onClick={() => handlePausePack(record)}>暂停</Button>
        <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', color: '#52c41a' }} onClick={() => handleCompletePack(record)}>完成</Button>
      </Space>
    );
  };

  const columnsCollect = [
    { title: '分包实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 110 },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 140 },
    { title: '采集人员', dataIndex: 'collector', key: 'collector', width: 110 },
    { title: '分包数/计划数', key: 'planCount', width: 120, render: (_, r) => <span>{r.singlePack} / {r.planCount} 条</span> },
    { title: '分配设备实例', dataIndex: 'deviceInstance', key: 'deviceInstance', width: 140 },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    {
      title: '采集进度', key: 'collectProgress', width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress percent={record.collectProgress} size="small" showInfo={false} style={{ flex: 1 }} strokeColor="#1677ff" />
          <span style={{ fontSize: 12, color: '#595959' }}>{record.collectProgress}%</span>
        </div>
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <StatusTag status={s}>{s}</StatusTag> },
    { title: '操作', key: 'action', width: 180, fixed: 'right', render: (_, record) => getStatusActions(record) },
  ];

  const columnsAsset = [
    { title: '分包实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 120 },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 140 },
    { title: '关联资产数据源', dataIndex: 'assetSource', key: 'assetSource', width: 160 },
    { title: '指派标注员', dataIndex: 'annotator', key: 'annotator', width: 100 },
    { title: '指派审核员', dataIndex: 'auditor', key: 'auditor', width: 100 },
    { title: '分包关联数据数', key: 'planCount', width: 130, render: (_, r) => <span>{r.planCount} 条</span> },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    {
      title: '标注审核进度', key: 'collectProgress', width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress percent={record.collectProgress} size="small" showInfo={false} style={{ flex: 1 }} strokeColor="#52c41a" />
          <span style={{ fontSize: 12, color: '#595959' }}>{record.collectProgress}%</span>
        </div>
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (s) => <StatusTag status={s}>{s}</StatusTag> },
    { title: '操作', key: 'action', width: 180, fixed: 'right', render: (_, record) => getStatusActions(record) },
  ];

  const mockInstancesNoCollect = [
    { key: '1', instanceId: 'AST-AUTO-844101', taskName: '关联数据资产包导入', autoDataset: true, planCount: 100, singlePack: 100, collector: '外部导入 (自动归档)', deviceInstance: '资产包 - Lumos_FastUMI_202606', startTime: '2026-04-15 10:00', collectProgress: 100, status: '已完成' },
  ];

  const currentColumns = taskMode === 'collect' ? columnsCollect : columnsAsset;
  const rawMockData = taskMode === 'collect' 
    ? (isNoCollectTask ? mockInstancesNoCollect : mockInstancesCollect) 
    : mockInstancesAsset;

  const currentMockData = rawMockData.filter(item => {
    if (activeTab === 'pending') return item.status === '待分配';
    if (activeTab === 'collecting') return taskMode === 'collect' ? item.status === '采集中' : item.status.includes('标注');
    if (activeTab === 'done') return item.status === '已完成';
    return true;
  });

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={`${taskMode === 'collect' ? '任务详情：餐具摆放数采任务' : '任务详情：工业纸箱打包封装关联标注任务'} (${id})`}
          description={taskMode === 'collect' ? '查看采集分包、执行进度与人员分配。' : '查看关联资产分包、标注审核进度与人员分配。'}
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '任务详情' }]}
          back={() => router.back()}
          extra={(
            <Tag color={taskMode === 'collect' ? (isNoCollectTask ? 'cyan' : 'blue') : 'purple'} variant="borderless">
              {taskMode === 'collect' ? (isNoCollectTask ? '采集模式：不需要采集 (外部导入/关联资产)' : '采集模式：需要采集数据') : '标注任务模式'}
            </Tag>
          )}
        />

      {/* High-Fidelity Header Card */}
      <Card style={{ marginBottom: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#f8f9fc' }} styles={{ body: { padding: '24px 28px' } }}>
        {/* Basic Info Bar - Collapsible */}
        <div style={{ 
          background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, 
          padding: '16px 20px', marginBottom: 20, transition: 'all 0.3s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              </div>
              <span style={{ fontWeight: 600, color: '#262626' }}>任务基本信息</span>
            </div>
            <Button 
              type="text" 
              size="small" 
              onClick={() => setInfoExpanded(!infoExpanded)}
              style={{ borderRadius: 20, background: '#f5f5f5', padding: '0 12px', fontSize: 12, color: '#8c8c8c' }}
            >
              {infoExpanded ? '点击收起 ▴' : '点击展开详情 ▾'}
            </Button>
          </div>
          
          {infoExpanded && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px dashed #f0f0f0' }}>
              <Row gutter={[40, 24]}>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>任务ID</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>{id}</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>任务模式类型</div>
                  <Tag color={taskMode === 'collect' ? (isNoCollectTask ? 'cyan' : 'blue') : 'purple'}>
                    {taskMode === 'collect' ? (isNoCollectTask ? '不需要采集 (外部导入/关联资产)' : '需要采集数据') : '关联数据资产 / 外部导入'}
                  </Tag>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>创建人</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>天奇管理员</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>项目名</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>InternalCommercial (内部-商业)</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>场景分类</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>Supermarket (超市场景)</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>创建时间</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>2026-03-10 14:22</div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* Statistics Row */}
        <div style={{ display: 'flex', gap: 16 }}>
          <StatCard icon="📦" value={currentMockData.length} label="总分包数" iconBg="#e6f4ff" color="#1677ff" />
          <StatCard icon="✅" value="1" label="已完成分包" iconBg="#f6ffed" color="#52c41a" />
          <StatCard icon="⚡" value="2" label="处理中分包" iconBg="#fffbe6" color="#faad14" />
          <StatCard icon="🔢" value={taskMode === 'collect' ? '300/400' : '75/100'} label="总关联/采集条目数" iconBg="#f9f0ff" color="#722ed1" />
        </div>
      </Card>

      <Card className="ui-table-card" style={{ borderRadius: 12 }}>
        <TableToolbar
          title="分包明细列表"
          count={currentMockData.length}
          selectedCount={selectedRowKeys.length}
          actions={<Button type="text" icon={<ReloadOutlined />} aria-label="刷新分包列表" />}
        />
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          {taskMode === 'collect'
            ? '每个分包包含具体的采集员、标注员、审核员及计划采集数量'
            : '每个关联分包指定具体的标注员、审核员及分包关联数据数量'}
        </Text>

        <FilterPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16} align="bottom">
            <Form.Item label="分包ID" style={{ marginBottom: 0 }}><Input placeholder="分包ID" style={{ width: 140 }} /></Form.Item>
            {taskMode !== 'collect' && (
              <>
                <Form.Item label="标注员" style={{ marginBottom: 0 }}><Select placeholder="请选择标注员" style={{ width: 140 }} options={[{value:'李四', label:'李四'}, {value:'张三', label:'张三'}]} /></Form.Item>
                <Form.Item label="审核员" style={{ marginBottom: 0 }}><Select placeholder="请选择审核员" style={{ width: 140 }} options={[{value:'王五', label:'王五'}, {value:'天奇管理员', label:'天奇管理员'}]} /></Form.Item>
              </>
            )}
            {taskMode === 'collect' && (
              <Form.Item label="采集员" style={{ marginBottom: 0 }}><Select placeholder="采集人员" style={{ width: 140 }} options={[{value:'张三', label:'张三'}, {value:'李四', label:'李四'}]} /></Form.Item>
            )}
            <Form.Item style={{ marginBottom: 0 }}><Button type="primary" icon={<SearchOutlined />}>搜索</Button></Form.Item>
          </Space>
            <Space size={12}>
              {isNoCollectTask ? (
                <Tooltip title="关联资产数据/外部导入无需人工采集，系统已自动解析归档，新建分包按钮已置灰">
                  <Button type="primary" disabled icon={<PlusOutlined />}>新建分包</Button>
                </Tooltip>
              ) : (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddPackVisible(true)}>新建分包</Button>
              )}
              <Button 
                icon={<PauseOutlined />} 
                disabled={selectedRowKeys.length === 0} 
                onClick={() => setIsPauseTaskVisible(true)}
                style={{ borderRadius: 6, background: selectedRowKeys.length > 0 ? '#e6f7ff' : '#f5f5f5', color: selectedRowKeys.length > 0 ? '#1677ff' : '#bfbfbf', border: 'none' }}
              >
                暂停分包
              </Button>
            </Space>
          </div>
        </FilterPanel>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: <span>全部 <Badge count={rawMockData.length} style={{ backgroundColor: '#e6f4ff', color: '#1677ff', boxShadow: 'none', marginLeft: 4 }} /></span> },
            { key: 'pending', label: '待分配' },
            { key: 'collecting', label: taskMode === 'collect' ? '采集中' : '标注中' },
            { key: 'done', label: '已完成' },
          ]}
          style={{ marginBottom: 16 }}
        />

        <Table
          rowSelection={{ type: 'checkbox', selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={currentColumns}
          dataSource={currentMockData}
          scroll={{ x: 1400 }}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* --- MODALS --- */}

      {/* 1. 新建分包弹窗 (区分需要采集数据 vs 关联数据资产) */}
      <AppModal
        title={
          <div style={{ paddingBottom: 12, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>新建任务分包</span>
            <Tag color={taskMode === 'collect' ? 'blue' : 'purple'}>
              {taskMode === 'collect' ? '需要采集数据分包' : '关联数据资产分包'}
            </Tag>
          </div>
        }
        open={isAddPackVisible}
        onCancel={() => setIsAddPackVisible(false)}
        width={560}
        okText="确定创建分包"
        cancelText="取消"
        onOk={() => {
          message.success('分包创建成功，已分配对应的成员与分包数据量！');
          setIsAddPackVisible(false);
        }}
      >
        <Form form={addPackForm} layout="vertical" style={{ paddingTop: 16 }}>
          {taskMode === 'collect' ? (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="选择采集员" name="collector" required rules={[{ required: true, message: '请选择采集员' }]}>
                    <Select placeholder="请选择采集员" options={[{ value: 'u1', label: '张三 (采集员)' }, { value: 'u2', label: '李四 (采集员)' }, { value: 'u3', label: 'cy00831' }]} defaultValue="u3" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="采集数量" name="planCount" required initialValue={100} rules={[{ required: true, message: '请输入采集数量' }]}>
                    <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入采集数量" addonAfter="条" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="分配设备实例" name="deviceInstance">
                    <Select placeholder="请选择设备" options={[{ value: 'R002GB-RGB-101', label: 'R002GB-RGB-101 (Galbot RGB)' }, { value: 'DEV-FR-301', label: 'DEV-FR-301 (Franka Std)' }]} defaultValue="R002GB-RGB-101" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="选择标注员" name="annotator" required rules={[{ required: true, message: '请选择标注员' }]}>
                    <Select placeholder="请选择标注员" options={[{ value: 'a1', label: '李四 (标注员)' }, { value: 'a2', label: '张三 (标注员)' }]} defaultValue="a1" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="选择审核员" name="auditor" required rules={[{ required: true, message: '请选择审核员' }]}>
                    <Select placeholder="请选择审核员" options={[{ value: 'v1', label: '王五 (审核员)' }, { value: 'v2', label: '天奇管理员' }]} defaultValue="v1" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="标注数量" name="planCount" required initialValue={30} rules={[{ required: true, message: '请输入标注数量' }]}>
                    <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入标注数量" addonAfter="条" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item label="分包备注说明" name="remarks">
            <TextArea rows={2} placeholder="请输入分包备注信息..." />
          </Form.Item>
        </Form>
      </AppModal>

      {/* 2. 暂停任务弹窗 */}
      <Modal
        title={<Space><ExclamationCircleOutlined style={{ color: '#faad14' }} /> 确认暂停采集任务</Space>}
        open={isPauseTaskVisible}
        onCancel={() => setIsPauseTaskVisible(false)}
        okText="确认暂停"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => {
          message.success(`已暂停选中的 ${selectedRowKeys.length} 个分包任务`);
          setIsPauseTaskVisible(false);
          setSelectedRowKeys([]);
        }}
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph>您已选中 <Text strong type="danger">{selectedRowKeys.length}</Text> 个分包实例。暂停操作将产生以下影响：</Paragraph>
          <ul style={{ color: '#8c8c8c', fontSize: 13, paddingLeft: 20 }}>
            <li>对应采集员将立即收到暂停通知，无法继续录入新数据。</li>
            <li>已采集但未提交的数据将自动保存，采集任务进入“已暂停”状态。</li>
          </ul>
        </div>
      </Modal>

      {/* 3. 添加标注任务弹窗 (Dynamic Rendering) */}
      <AppModal
        title={<div style={{ paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>分配标注任务</div>}
        open={isAddAnnoVisible}
        onCancel={() => setIsAddAnnoVisible(false)}
        width={680}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px' } }}
        footer={[
          <Button key="cancel" onClick={() => setIsAddAnnoVisible(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={() => {
            message.success('标注任务已成功指派至工作台');
            setIsAddAnnoVisible(false);
            setSelectedRowKeys([]);
          }}>确定</Button>
        ]}
      >
        <Alert
          title={`当前已选中 ${selectedRowKeys.length} 个包实例，将统一配置标注流程。`}
          type="info" showIcon style={{ marginBottom: 24 }} 
        />
        <Form form={annoForm} layout="vertical">
          <Form.Item label="标注类型" name="types" rules={[{ required: true }]}>
            <Space direction="vertical" size={12}>
              <Checkbox.Group 
                value={selectedTypes} 
                onChange={(values) => setSelectedTypes(values)}
              >
                <Space size={16} wrap>
                  <Checkbox value="point">点标注</Checkbox>
                  <Checkbox value="range">范围标注</Checkbox>
                  <Checkbox value="box">框标注</Checkbox>
                  <Checkbox value="mixed">范围&框标注</Checkbox>
                </Space>
              </Checkbox.Group>
              <Checkbox value="none" onChange={(e) => e.target.checked && setSelectedTypes([])}>无需标注</Checkbox>
            </Space>
          </Form.Item>

          <Form.Item label="质检员" name="qa">
            <Select placeholder="请选择质检员" defaultValue="00810" options={[{label:'质检员00810', value:'00810'}]} style={{ width: '100%' }} />
          </Form.Item>

          {/* Section: 点标注 */}
          {selectedTypes.includes('point') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>点标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 范围标注 */}
          {selectedTypes.includes('range') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>范围标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 框标注 */}
          {selectedTypes.includes('box') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>框标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 范围&框标注 */}
          {selectedTypes.includes('mixed') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>范围&框标注</Text></Divider>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="跨步骤标注"><Switch defaultChecked /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </AppModal>
      </div>
    </MainLayout>
  );
}
