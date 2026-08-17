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
  ThunderboltOutlined, TagsOutlined, InfoCircleOutlined,
  DownloadOutlined, FileSearchOutlined, CloudUploadOutlined, EditOutlined, 
  DeleteOutlined, CheckCircleOutlined, ReloadOutlined,
  ExclamationCircleOutlined, UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockInstancesCollect = [
  { key: '1', instanceId: 'COLL-PK-12745', taskName: '货架物品物理采集', singlePack: 120, planCount: 120, collector: '张三', qaer: '李四', deviceInstance: 'R002GB-RGB-101', startTime: '2026-03-11 09:00', collectProgress: 53, status: '采集中' },
  { key: '2', instanceId: 'COLL-PK-12744', taskName: '货架物品物理采集', singlePack: 120, planCount: 120, collector: '李四', qaer: '天奇管理员', deviceInstance: 'R002GB-RGB-102', startTime: '2026-03-11 10:30', collectProgress: 80, status: '采集中' },
  { key: '3', instanceId: 'COLL-PK-12619', taskName: '货架物品物理采集', singlePack: 120, planCount: 120, collector: '-', qaer: '-', deviceInstance: '—', startTime: '-', collectProgress: 0, status: '待分配' },
  { key: '4', instanceId: 'COLL-PK-12511', taskName: '货架物品物理采集', singlePack: 120, planCount: 120, collector: '王五', qaer: '天奇管理员', deviceInstance: 'R002GB-RGB-101', startTime: '2026-03-10 14:30', collectProgress: 100, status: '已完成' },
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
  const isNoCollectTask = needCollectParam === 'false' || id === 'COLL-20260415-002' || (typeof id === 'string' && (id.includes('NOCOLLECT') || id.includes('ASSET_COLLECT') || id.includes('asset')));
  const isAssetTask = isNoCollectTask || isAnno || typeParam === 'asset';
  
  const initialMode = isAssetTask ? 'asset' : 'collect';
  const [taskMode, setTaskMode] = useState(initialMode);

  useEffect(() => {
    if (isAssetTask) {
      setTaskMode('asset');
    } else {
      setTaskMode('collect');
    }
  }, [typeParam, id, isAssetTask]);
  const [activeTab, setActiveTab] = useState('all');
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Track selected annotation types for dynamic rendering
  const [selectedTypes, setSelectedTypes] = useState(['point']);

  // Modal visibility states
  const [isAddPackVisible, setIsAddPackVisible] = useState(false);
  const [isAddAnnoVisible, setIsAddAnnoVisible] = useState(false);

  const handleCompletePack = (record) => {
    Modal.confirm({
      title: `标记分包 ${record.instanceId} 采集完成`,
      content: `确认后，该分包采集数据将自动打包并流转至【数据质检】环节，由指派的质检员 [${record.qaer || '天奇管理员'}] 进行数据质检。`,
      okText: '确认完成并送检',
      okButtonProps: { style: { background: '#52c41a', borderColor: '#52c41a' } },
      cancelText: '取消',
      onOk: () => {
        message.success(`分包 ${record.instanceId} 已成功流转至数据质检中心`);
      },
    });
  };

  const getStatusActions = (record) => {
    if (record.status === '已完成') {
      return (
        <Space separator={<Divider orientation="vertical" />} size={0}>
          <Button type="link" size="small" icon={<DownloadOutlined />} style={{ padding: '0 4px' }}>下载</Button>
          <Button type="link" size="small" icon={<FileSearchOutlined />} style={{ padding: '0 4px', color: '#52c41a' }} onClick={() => router.push('/collection/qa')}>详情</Button>
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
        <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', color: '#52c41a' }} onClick={() => handleCompletePack(record)}>完成</Button>
      </Space>
    );
  };

  const columnsCollect = [
    { 
      title: '分包实例ID', 
      dataIndex: 'instanceId', 
      key: 'instanceId', 
      width: 140,
      render: (id) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{id}</Text>
    },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 140 },
    { 
      title: '采集人员', 
      dataIndex: 'collector', 
      key: 'collector', 
      width: 110,
      render: (c) => <Tag color="blue">{c}</Tag>
    },
    { 
      title: '指派质检员', 
      dataIndex: 'qaer', 
      key: 'qaer', 
      width: 110,
      render: (q) => <Tag color="cyan">{q}</Tag>
    },
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
    { title: '分包实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 140, render: (id) => <Text style={{ color: '#722ed1', fontFamily: 'monospace' }}>{id}</Text> },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 150 },
    { title: '关联资产数据源', dataIndex: 'assetSource', key: 'assetSource', width: 180 },
    { 
      title: '指派质检员', 
      dataIndex: 'qaer', 
      key: 'qaer', 
      width: 110, 
      render: (q) => <Tag color="cyan">{q || '李四'}</Tag> 
    },
    { title: '分包数据量', key: 'planCount', width: 130, render: (_, r) => <span>{r.singlePack || r.planCount || 20} / {r.planCount || 100} 条</span> },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    {
      title: '质检进度', key: 'collectProgress', width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress percent={record.collectProgress || 100} size="small" showInfo={false} style={{ flex: 1 }} strokeColor="#52c41a" />
          <span style={{ fontSize: 12, color: '#595959' }}>{record.collectProgress || 100}%</span>
        </div>
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (s) => <StatusTag status={s}>{s}</StatusTag> },
    { title: '操作', key: 'action', width: 180, fixed: 'right', render: (_, record) => getStatusActions(record) },
  ];

  const mockInstancesNoCollect = [
    { key: '1', instanceId: 'COLL-PK-AST-844101', taskName: '关联数据资产包 · 分包01', assetSource: '资产包 - Lumos_FastUMI_202606', qaer: '李四', planCount: 100, singlePack: 50, startTime: '2026-04-15 10:00', collectProgress: 100, status: '已完成' },
    { key: '2', instanceId: 'COLL-PK-AST-844102', taskName: '关联数据资产包 · 分包02', assetSource: '资产包 - Lumos_FastUMI_202606', qaer: '天奇管理员', planCount: 100, singlePack: 50, startTime: '2026-04-15 14:30', collectProgress: 60, status: '进行中' },
  ];

  const currentColumns = isAssetTask ? columnsAsset : columnsCollect;
  const rawMockData = isAssetTask ? mockInstancesNoCollect : mockInstancesCollect;

  const currentMockData = rawMockData.filter(item => {
    if (activeTab === 'pending') return item.status === '待分配';
    if (activeTab === 'collecting') return item.status === '采集中' || item.status === '进行中';
    if (activeTab === 'done') return item.status === '已完成';
    return true;
  });

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={isAssetTask ? `任务详情：工业纸箱打包封装关联资产任务 (${id})` : `任务详情：餐具摆放数采采集计划 (${id})`}
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '任务详情' }]}
          back={() => router.back()}
          extra={(
            <Tag color={isAssetTask ? 'purple' : 'blue'} variant="borderless" style={{ fontWeight: 600 }}>
              {isAssetTask ? '任务类型：关联资产 (无需采集，需质检)' : '任务类型：采集计划 (需分配采集员与质检员)'}
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
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>任务类型</div>
                  <Tag color={isAssetTask ? 'purple' : 'blue'}>
                    {isAssetTask ? '关联资产 (已有采集资产包，仅需质检)' : '采集计划 (需要采集数据)'}
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
          {isAssetTask
            ? '关联资产任务（已有采集资产包）：无需人工采集录入，直接配置分包数据量与分配质检员，分包后直接进入数据质检流程'
            : '采集计划任务：每个分包配置单包采集量并分配具体的采集员与质检员'}
        </Text>

        <FilterPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16} align="bottom">
            <Form.Item label="分包ID" style={{ marginBottom: 0 }}><Input placeholder="分包ID" style={{ width: 140 }} /></Form.Item>
            {isAssetTask ? (
              <Form.Item label="质检员" style={{ marginBottom: 0 }}>
                <Select placeholder="请选择质检员" allowClear style={{ width: 140 }} options={[{value:'李四', label:'李四'}, {value:'王五', label:'王五'}, {value:'天奇管理员', label:'天奇管理员'}]} />
              </Form.Item>
            ) : (
              <>
                <Form.Item label="采集员" style={{ marginBottom: 0 }}><Select placeholder="采集人员" allowClear style={{ width: 140 }} options={[{value:'张三', label:'张三'}, {value:'李四', label:'李四'}]} /></Form.Item>
                <Form.Item label="质检员" style={{ marginBottom: 0 }}><Select placeholder="质检人员" allowClear style={{ width: 140 }} options={[{value:'王五', label:'王五'}, {value:'天奇管理员', label:'天奇管理员'}]} /></Form.Item>
              </>
            )}
            <Form.Item style={{ marginBottom: 0 }}><Button type="primary" icon={<SearchOutlined />}>搜索</Button></Form.Item>
          </Space>
            <Space size={12}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddPackVisible(true)}>新建分包</Button>
            </Space>
          </div>
        </FilterPanel>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: <span>全部 <Badge count={rawMockData.length} style={{ backgroundColor: '#e6f4ff', color: '#1677ff', boxShadow: 'none', marginLeft: 4 }} /></span> },
            { key: 'pending', label: '待分配' },
            { key: 'collecting', label: isAssetTask ? '质检中' : '采集中' },
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

      {/* 1. 添加分包弹窗 */}
      <AppModal
        title={isAssetTask ? "添加分包 (关联资产)" : "添加分包 (采集计划)"}
        open={isAddPackVisible}
        onCancel={() => setIsAddPackVisible(false)}
        width={560}
        okText="确定"
        cancelText="取消"
        onOk={() => {
          addPackForm.validateFields().then(values => {
            if (isAssetTask) {
              message.success('关联资产分包创建成功，已分配对应的质检员！');
            } else {
              message.success('采集分包创建成功，已分配对应的采集员与质检员！');
            }
            setIsAddPackVisible(false);
          });
        }}
      >
        <Form 
          form={addPackForm} 
          layout="horizontal" 
          labelCol={{ span: 6 }} 
          wrapperCol={{ span: 18 }} 
          style={{ paddingTop: 16 }}
        >
          {isAssetTask ? (
            <>
              <Form.Item 
                label="计划关联量" 
                name="totalPlanCount" 
                initialValue={100}
                required
                extra={<div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>继承任务计划关联资产量，分包内不可修改</div>}
                style={{ marginBottom: 18 }}
              >
                <Input disabled value={100} placeholder="100" style={{ background: '#fafafa', color: '#595959' }} />
              </Form.Item>

              <Form.Item 
                label="单包数据量" 
                name="singlePackCount" 
                rules={[{ required: true, message: '请输入单包数据量' }]}
                style={{ marginBottom: 18 }}
              >
                <InputNumber min={1} max={100} placeholder="请输入单包数据量" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="分配质检员" 
                name="qaer" 
                rules={[{ required: true, message: '请选择质检员' }]}
                style={{ marginBottom: 18 }}
              >
                <Select 
                  placeholder="请选择质检员" 
                  allowClear
                  options={[
                    { value: '李四', label: '李四' },
                    { value: '王五', label: '王五' },
                    { value: '赵六', label: '赵六' },
                    { value: '天奇管理员', label: '天奇管理员' },
                  ]} 
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item 
                label="计划采集量" 
                name="totalPlanCount" 
                initialValue={10}
                required
                extra={<div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>继承任务计划采集量，分包内不可修改</div>}
                style={{ marginBottom: 18 }}
              >
                <Input disabled value={10} placeholder="10" style={{ background: '#fafafa', color: '#595959' }} />
              </Form.Item>

              <Form.Item 
                label="单包采集量" 
                name="singlePackCount" 
                rules={[{ required: true, message: '请输入单包采集量' }]}
                style={{ marginBottom: 18 }}
              >
                <InputNumber min={1} max={10} placeholder="请输入单包采集量" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="分配采集员" 
                name="collector" 
                rules={[{ required: true, message: '请选择采集员' }]}
                style={{ marginBottom: 18 }}
              >
                <Select 
                  placeholder="请选择采集员" 
                  allowClear
                  options={[
                    { value: '张三', label: '张三' },
                    { value: '李四', label: '李四' },
                    { value: '王五', label: '王五' },
                    { value: 'cy00831', label: 'cy00831' },
                  ]} 
                />
              </Form.Item>

              <Form.Item 
                label="分配质检员" 
                name="qaer" 
                rules={[{ required: true, message: '请选择质检员' }]}
                style={{ marginBottom: 18 }}
              >
                <Select 
                  placeholder="请选择质检员" 
                  allowClear
                  options={[
                    { value: '李四', label: '李四' },
                    { value: '王五', label: '王五' },
                    { value: '赵六', label: '赵六' },
                    { value: '天奇管理员', label: '天奇管理员' },
                  ]} 
                />
              </Form.Item>
            </>
          )}
        </Form>
      </AppModal>

      {/* 2. 添加标注任务弹窗 (Dynamic Rendering) */}
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
