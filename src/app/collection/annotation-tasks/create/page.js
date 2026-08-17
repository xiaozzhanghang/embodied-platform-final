'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Table,
  Space,
  Tag,
  Typography,
  App,
  Divider,
  Radio,
  Empty
} from 'antd';
import {
  LeftOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { StatusTag } from '@/components/ui';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MOCK_EPISODES = [
  {
    key: 'EP-20260415-001',
    episodeId: 'EP-20260415-001',
    recCode: 'REC-20260415-01',
    sceneCategory: '超市场景',
    subSceneCategory: '货架区',
    taskName: '货架物品物理采集',
    completedTime: '2026-04-15 10:23:00',
    totalFrames: 3600,
    qcStatus: '已通过',
  },
  {
    key: 'EP-20260415-002',
    episodeId: 'EP-20260415-002',
    recCode: 'REC-20260415-02',
    sceneCategory: '超市场景',
    subSceneCategory: '货架区',
    taskName: '货架物品物理采集',
    completedTime: '2026-04-15 11:45:00',
    totalFrames: 3510,
    qcStatus: '已通过',
  },
  {
    key: 'EP-20260415-003',
    episodeId: 'EP-20260415-003',
    recCode: 'REC-20260415-03',
    sceneCategory: '厨房场景',
    subSceneCategory: '操作台',
    taskName: '厨房台面整理采集',
    completedTime: '2026-04-15 14:10:00',
    totalFrames: 2400,
    qcStatus: '已通过',
  },
  {
    key: 'EP-20260415-004',
    episodeId: 'EP-20260415-004',
    recCode: 'REC-20260415-04',
    sceneCategory: '客厅场景',
    subSceneCategory: '餐桌',
    taskName: '桌面操作物理数采',
    completedTime: '2026-04-15 16:30:00',
    totalFrames: 3720,
    qcStatus: '已通过',
  },
  {
    key: 'EP-20260415-005',
    episodeId: 'EP-20260415-005',
    recCode: 'REC-20260415-05',
    sceneCategory: '工业产线',
    subSceneCategory: '包装流水线',
    taskName: '工业纸箱打包封装',
    completedTime: '2026-04-16 09:20:00',
    totalFrames: 2880,
    qcStatus: '已通过',
  },
];

const ACTION_TEMPLATES = [
  { value: 'tpl-shelf-01', label: '货架抓取放置SOP标准模板 V1.2' },
  { value: 'tpl-table-02', label: '桌面整理动作时序模板 V2.0' },
  { value: 'tpl-bimanual-03', label: '双手协同装配动作序列模板 V1.0' },
  { value: 'tpl-box-04', label: '工业箱包打包SOP模板 V1.5' },
];

export default function CreateAnnotationTaskPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // Basic Info Form State
  const [taskName, setTaskName] = useState('');
  const [taskNameEn, setTaskNameEn] = useState('');
  const [annoType, setAnnoType] = useState('范围标注');
  const [device, setDevice] = useState([]);
  const [description, setDescription] = useState('');

  // Associated Data Filter State
  const [sceneCategory, setSceneCategory] = useState();
  const [subSceneCategory, setSubSceneCategory] = useState();
  const [filterTaskName, setFilterTaskName] = useState();
  const [isExpanded, setIsExpanded] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({ active: false });

  // Selected Episodes
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // SOP Steps State
  const [sopMode, setSopMode] = useState('natural'); // 'structured' | 'natural'
  const [actionTemplate, setActionTemplate] = useState();
  const [naturalSteps, setNaturalSteps] = useState([
    { id: 1, text: '机械臂从初始位姿移动至目标物体上方，夹爪张开准备抓取。' },
    { id: 2, text: '机械臂下压夹取物体，提升至安全高度并平移至目标容器上方释放。' }
  ]);
  const [structuredSteps, setStructuredSteps] = useState([
    { id: 1, action: 'Approach', target: 'Kiwi', startFrame: 15, endFrame: 45 },
    { id: 2, action: 'Grasp & Place', target: 'Fruit_Bowl', startFrame: 55, endFrame: 90 }
  ]);

  const filteredEpisodes = useMemo(() => {
    if (!appliedFilters.active) {
      return MOCK_EPISODES;
    }
    return MOCK_EPISODES.filter(ep => {
      if (appliedFilters.scene && ep.sceneCategory !== appliedFilters.scene) return false;
      if (appliedFilters.subScene && ep.subSceneCategory !== appliedFilters.subScene) return false;
      if (appliedFilters.taskName && ep.taskName !== appliedFilters.taskName) return false;
      return true;
    });
  }, [appliedFilters]);

  const handleSearch = () => {
    setAppliedFilters({
      active: true,
      scene: sceneCategory,
      subScene: subSceneCategory,
      taskName: filterTaskName,
    });
  };

  const handleReset = () => {
    setSceneCategory(undefined);
    setSubSceneCategory(undefined);
    setFilterTaskName(undefined);
    setAppliedFilters({ active: false });
  };

  const handleAddNaturalStep = () => {
    setNaturalSteps(prev => [
      ...prev,
      { id: Date.now(), text: '' }
    ]);
  };

  const handleAddStructuredStep = () => {
    setStructuredSteps(prev => [
      ...prev,
      { id: Date.now(), action: '', target: '', startFrame: 0, endFrame: 0 }
    ]);
  };

  const handlePublish = () => {
    if (!taskName.trim()) {
      message.error('请输入标注任务名称！');
      return;
    }
    if (selectedRowKeys.length === 0) {
      message.warning('请至少勾选一条关联 Episode 数据！');
      return;
    }
    message.success(`成功发布标注任务 [${taskName}]，已关联 ${selectedRowKeys.length} 条 Episode 数据！`);
    router.push('/collection/annotation-tasks');
  };

  const columns = [
    {
      title: 'Episode ID',
      dataIndex: 'episodeId',
      key: 'episodeId',
      width: 180,
      render: (id) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{id}</Text>
    },
    {
      title: 'recCode',
      dataIndex: 'recCode',
      key: 'recCode',
      width: 170,
      render: (c) => <span style={{ fontFamily: 'monospace' }}>{c}</span>
    },
    {
      title: '采集完成时间',
      dataIndex: 'completedTime',
      key: 'completedTime',
      width: 180,
    },
    {
      title: '总帧数',
      dataIndex: 'totalFrames',
      key: 'totalFrames',
      width: 120,
      align: 'right',
      render: (f) => `${f} f`
    },
    {
      title: '采集质检状态',
      dataIndex: 'qcStatus',
      key: 'qcStatus',
      width: 140,
      align: 'center',
      render: (s) => <StatusTag status={s} />
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '0 0 60px 0', background: '#f5f7fa', minHeight: '100vh' }}>
        {/* Top Navigation Header */}
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          borderBottom: '1px solid #eef0f4',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={<LeftOutlined style={{ fontSize: 14 }} />}
              onClick={() => router.push('/collection/annotation-tasks')}
              style={{ fontWeight: 600, fontSize: 16, padding: '4px 8px', color: '#1f1f1f' }}
            >
              新建标注任务
            </Button>
          </div>
          <div>
            <Tag color="purple" style={{ padding: '2px 10px', fontSize: 12, borderRadius: 4 }}>
              采集/质检成果数据标注
            </Tag>
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: '20px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* --- SECTION 1: 基础信息 --- */}
          <Card
            style={{ borderRadius: 8, border: '1px solid #eef0f4', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 20 }}>
              基础信息
            </div>

            <Row gutter={[24, 20]}>
              <Col span={12}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong><span style={{ color: '#ff4d4f' }}>* </span>标注任务名称</Text>
                </div>
                <Input
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  placeholder="请输入标注任务名称"
                  style={{ height: 38, borderRadius: 4 }}
                />
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong>英文名称</Text>
                </div>
                <Input
                  value={taskNameEn}
                  onChange={e => setTaskNameEn(e.target.value)}
                  placeholder="例如 Tabletop_Book_Organize_AnnoTask"
                  style={{ height: 38, borderRadius: 4 }}
                />
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong><span style={{ color: '#ff4d4f' }}>* </span>标注类型</Text>
                </div>
                <Select
                  value={annoType}
                  onChange={setAnnoType}
                  style={{ width: '100%', height: 38 }}
                  options={[
                    { value: '范围标注', label: '范围标注' },
                    { value: '框标注', label: '框标注' },
                    { value: '点标注', label: '点标注' },
                    { value: '范围&框标注', label: '范围&框标注' },
                    { value: '关键帧标注', label: '关键帧标注' },
                  ]}
                />
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong><span style={{ color: '#ff4d4f' }}>* </span>设备</Text>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  value={device}
                  onChange={setDevice}
                  placeholder="请选择设备"
                  style={{ width: '100%', minHeight: 38 }}
                  options={[
                    { value: 'Galbot_2.2_RGBD', label: 'Galbot_2.2_RGBD' },
                    { value: 'Lumos_FastUMI', label: 'Lumos_FastUMI' },
                    { value: 'Franka_FR3', label: 'Franka_FR3' },
                    { value: 'Galbot_1.16_G2', label: 'Galbot_1.16_G2' },
                  ]}
                />
              </Col>

              <Col span={24}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong>任务描述</Text>
                </div>
                <TextArea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="请输入任务描述"
                  style={{ borderRadius: 4 }}
                />
              </Col>
            </Row>
          </Card>

          {/* --- SECTION 2: 关联数据筛选与数量设定 --- */}
          <Card
            style={{ borderRadius: 8, border: '1px solid #eef0f4', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              <span>关联数据筛选与数量设定</span>
            </div>

            {/* Filter Bar */}
            <div style={{
              background: '#fafafa',
              padding: '16px 20px',
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              marginBottom: 16
            }}>
              <Row gutter={[16, 12]} align="middle">
                <Col flex="240px">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>场景分类：</span>
                    <Select
                      allowClear
                      placeholder="请选择场景分类"
                      style={{ width: 140 }}
                      value={sceneCategory}
                      onChange={setSceneCategory}
                      options={[
                        { value: '超市场景', label: '超市场景' },
                        { value: '厨房场景', label: '厨房场景' },
                        { value: '客厅场景', label: '客厅场景' },
                        { value: '工业产线', label: '工业产线' },
                      ]}
                    />
                  </div>
                </Col>

                <Col flex="240px">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>子场景分类：</span>
                    <Select
                      allowClear
                      placeholder="请选择子场景分类"
                      style={{ width: 140 }}
                      value={subSceneCategory}
                      onChange={setSubSceneCategory}
                      options={[
                        { value: '货架区', label: '货架区' },
                        { value: '操作台', label: '操作台' },
                        { value: '餐桌', label: '餐桌' },
                        { value: '包装流水线', label: '包装流水线' },
                      ]}
                    />
                  </div>
                </Col>

                <Col flex="260px">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>任务名（可选）：</span>
                    <Select
                      allowClear
                      placeholder="请选择任务名..."
                      style={{ width: 140 }}
                      value={filterTaskName}
                      onChange={setFilterTaskName}
                      options={[
                        { value: '货架物品物理采集', label: '货架物品物理采集' },
                        { value: '桌面操作物理数采', label: '桌面操作物理数采' },
                        { value: '厨房台面整理采集', label: '厨房台面整理采集' },
                        { value: '工业纸箱打包封装', label: '工业纸箱打包封装' },
                      ]}
                    />
                  </div>
                </Col>

                <Col>
                  <Space size={8}>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                      查询
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                      重置
                    </Button>
                    <Button type="link" onClick={() => setIsExpanded(!isExpanded)} style={{ padding: 0, fontSize: 13 }}>
                      {isExpanded ? <span>收起 <UpOutlined /></span> : <span>展开 <DownOutlined /></span>}
                    </Button>
                  </Space>
                </Col>
              </Row>

              {isExpanded && (
                <Row gutter={[16, 12]} align="middle" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e8e8e8' }}>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>质检状态：</span>
                      <Select placeholder="全部状态" defaultValue="已通过" style={{ width: 140 }} options={[{ value: '已通过', label: '已通过' }, { value: '全部', label: '全部' }]} />
                    </div>
                  </Col>
                </Row>
              )}
            </div>

            {/* Table */}
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys)
              }}
              columns={columns}
              dataSource={filteredEpisodes}
              size="small"
              pagination={{
                pageSize: 5,
                showTotal: (total) => `共 ${total} 条质检合格可用数据`,
                showSizeChanger: false
              }}
            />
          </Card>

          {/* --- SECTION 3: 预设SOP动作步骤序列 --- */}
          <Card
            style={{ borderRadius: 8, border: '1px solid #eef0f4', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UnorderedListOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              <span>预设SOP动作步骤序列</span>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <Button
                icon={<UnorderedListOutlined />}
                type={sopMode === 'structured' ? 'primary' : 'default'}
                onClick={() => setSopMode('structured')}
                style={{ borderRadius: 4 }}
              >
                结构化步骤
              </Button>
              <Button
                icon={<FileTextOutlined />}
                type={sopMode === 'natural' ? 'primary' : 'default'}
                onClick={() => setSopMode('natural')}
                style={{ borderRadius: 4 }}
              >
                自然语言描述
              </Button>
            </div>

            {/* Template Selector Bar */}
            <div style={{
              background: '#fafafa',
              padding: '12px 16px',
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>动作模版筛选：</span>
                <Select
                  allowClear
                  value={actionTemplate}
                  onChange={setActionTemplate}
                  placeholder="请选择动作模板"
                  style={{ width: 280 }}
                  options={ACTION_TEMPLATES}
                />
              </div>
              <Text type="secondary" style={{ fontSize: 12, color: '#8c8c8c' }}>
                未选择任务名时，可通过动作模版快速带入步骤与帧区间
              </Text>
            </div>

            {/* Step list body */}
            {sopMode === 'natural' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {naturalSteps.map((step, idx) => (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '8px 12px', border: '1px solid #eef0f4', borderRadius: 4 }}>
                    <Tag color="blue" style={{ margin: 0 }}>步骤 {idx + 1}</Tag>
                    <Input
                      value={step.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNaturalSteps(prev => prev.map(s => s.id === step.id ? { ...s, text: val } : s));
                      }}
                      placeholder="请输入自然语言步骤描述..."
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setNaturalSteps(prev => prev.filter(s => s.id !== step.id))}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={handleAddNaturalStep}
                  style={{ marginTop: 8, height: 40, borderRadius: 4 }}
                >
                  添加自然语言步骤
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {structuredSteps.map((step, idx) => (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '8px 12px', border: '1px solid #eef0f4', borderRadius: 4 }}>
                    <Tag color="cyan" style={{ margin: 0 }}>步骤 {idx + 1}</Tag>
                    <Input
                      value={step.action}
                      placeholder="动作行为 (如 Grasp)"
                      style={{ width: 160 }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredSteps(prev => prev.map(s => s.id === step.id ? { ...s, action: val } : s));
                      }}
                    />
                    <Input
                      value={step.target}
                      placeholder="目标实体 (如 Bowl)"
                      style={{ width: 160 }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredSteps(prev => prev.map(s => s.id === step.id ? { ...s, target: val } : s));
                      }}
                    />
                    <Input
                      value={step.startFrame}
                      placeholder="起始帧"
                      style={{ width: 100 }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredSteps(prev => prev.map(s => s.id === step.id ? { ...s, startFrame: val } : s));
                      }}
                    />
                    <Text type="secondary">-</Text>
                    <Input
                      value={step.endFrame}
                      placeholder="结束帧"
                      style={{ width: 100 }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredSteps(prev => prev.map(s => s.id === step.id ? { ...s, endFrame: val } : s));
                      }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setStructuredSteps(prev => prev.filter(s => s.id !== step.id))}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={handleAddStructuredStep}
                  style={{ marginTop: 8, height: 40, borderRadius: 4 }}
                >
                  添加结构化步骤
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* --- STICKY BOTTOM ACTION FOOTER --- */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          padding: '12px 32px',
          borderTop: '1px solid #eef0f4',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
          zIndex: 100
        }}>
          <Button onClick={() => router.push('/collection/annotation-tasks')}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handlePublish}
            style={{ minWidth: 160, height: 36, background: '#1677ff', borderColor: '#1677ff' }}
          >
            发布标注任务 ({selectedRowKeys.length} 条数据)
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
