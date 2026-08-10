'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FormOutlined,
  InboxOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import {
  canPublishTask,
  filterEpisodes,
  summarizeReadyPool,
} from '@/lib/annotationTaskCreateModel.mjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

const SOURCE_META = {
  collection: { label: '采集任务产出', color: 'blue', icon: <RobotOutlined /> },
  asset: { label: '资产数据', color: 'cyan', icon: <DatabaseOutlined /> },
  simulation: { label: '仿真数据', color: 'geekblue', icon: <ExperimentOutlined /> },
};

const EPISODES = [
  { key: 'EP-20260807-001', id: 'EP-20260807-001', sourceType: 'asset', sourceName: '桌面整理高质量资产包 V2', scene: '厨房', subScene: '操作台', frames: 1860, duration: '01:02', status: '数据就绪' },
  { key: 'EP-20260807-002', id: 'EP-20260807-002', sourceType: 'asset', sourceName: '桌面整理高质量资产包 V2', scene: '厨房', subScene: '操作台', frames: 1724, duration: '00:57', status: '数据就绪' },
  { key: 'EP-20260807-003', id: 'EP-20260807-003', sourceType: 'collection', sourceName: '双臂桌面整理实采任务', scene: '客厅', subScene: '餐桌', frames: 2210, duration: '01:14', status: '数据就绪' },
  { key: 'EP-20260807-004', id: 'EP-20260807-004', sourceType: 'simulation', sourceName: 'Isaac Sim 抓取放置数据集', scene: '仓储', subScene: '货架', frames: 1498, duration: '00:50', status: '数据就绪' },
  { key: 'EP-20260807-005', id: 'EP-20260807-005', sourceType: 'collection', sourceName: '厨房台面收纳实采任务', scene: '厨房', subScene: '操作台', frames: 1942, duration: '01:05', status: '数据就绪' },
  { key: 'EP-20260807-006', id: 'EP-20260807-006', sourceType: 'asset', sourceName: '历史双臂操作资产包', scene: '客厅', subScene: '餐桌', frames: 2056, duration: '01:09', status: '数据就绪' },
  { key: 'EP-20260807-007', id: 'EP-20260807-007', sourceType: 'simulation', sourceName: '货架补货仿真数据 V1', scene: '仓储', subScene: '货架', frames: 1635, duration: '00:55', status: '数据就绪' },
  { key: 'EP-20260807-008', id: 'EP-20260807-008', sourceType: 'asset', sourceName: '外部导入厨房操作数据', scene: '厨房', subScene: '水槽区', frames: 1788, duration: '00:59', status: '数据就绪' },
];

const TEMPLATE_MODES = [
  {
    value: 'none',
    title: '无模板开始',
    description: '适合新场景，先人工完成首条标注，再决定是否生成模板。',
    icon: <InboxOutlined />,
    tone: '#0f766e',
    background: '#f0fdfa',
  },
  {
    value: 'action',
    title: '使用动作模板 / SOP',
    description: '预置动作步骤和帧段结构，标注员仍可在工作台调整。',
    icon: <FileTextOutlined />,
    tone: '#2563eb',
    background: '#eff6ff',
  },
  {
    value: 'sample',
    title: '使用标注样例模板',
    description: '套用已审核发布的样例结果，用于成熟任务批量提效。',
    icon: <ThunderboltOutlined />,
    tone: '#b45309',
    background: '#fffbeb',
  },
];

function SectionTitle({ step, title, description, icon }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: '#0f172a',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        flexShrink: 0,
      }}>
        {step}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontSize: 17, fontWeight: 750 }}>
          {icon}{title}
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 3, fontSize: 13 }}>{description}</Text>
      </div>
    </div>
  );
}

function CreateAnnotationTaskContent() {
  const router = useRouter();
  const { message } = App.useApp();
  const [taskName, setTaskName] = useState('桌面整理动作切分标注任务');
  const [annotationType, setAnnotationType] = useState('action-segment');
  const [usage, setUsage] = useState('training');
  const [description, setDescription] = useState('对桌面整理过程进行动作阶段切分，并标记操作对象与关键帧。');
  const [scene, setScene] = useState();
  const [subScene, setSubScene] = useState();
  const [keyword, setKeyword] = useState('');
  const [templateMode, setTemplateMode] = useState('none');
  const [actionTemplateId, setActionTemplateId] = useState();
  const [sampleTemplateId, setSampleTemplateId] = useState();
  const [selectedRowKeys, setSelectedRowKeys] = useState(['EP-20260807-001', 'EP-20260807-002', 'EP-20260807-003']);

  const sceneOptions = useMemo(
    () => [...new Set(EPISODES.map(item => item.scene))].map(value => ({ value, label: value })),
    [],
  );
  const subSceneOptions = useMemo(
    () => [...new Set(EPISODES.filter(item => !scene || item.scene === scene).map(item => item.subScene))]
      .map(value => ({ value, label: value })),
    [scene],
  );
  const filteredEpisodes = useMemo(
    () => filterEpisodes(EPISODES, { scene, subScene, keyword }),
    [scene, subScene, keyword],
  );
  const poolSummary = useMemo(() => summarizeReadyPool(EPISODES), []);
  const publishable = canPublishTask({
    name: taskName,
    annotationType,
    selectedEpisodeIds: selectedRowKeys,
  });

  const resetFilters = () => {
    setScene(undefined);
    setSubScene(undefined);
    setKeyword('');
  };

  const handlePublish = () => {
    if (!publishable) return;
    const templateText = templateMode === 'none'
      ? '无模板开始'
      : templateMode === 'action'
        ? '动作模板'
        : '标注样例模板';
    message.success(`标注任务已创建：${selectedRowKeys.length} 条 Episode，${templateText}`);
    router.push('/collection/annotation-tasks');
  };

  const columns = [
    {
      title: 'Episode ID',
      dataIndex: 'id',
      width: 170,
      render: value => <Text style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: '#0f172a' }}>{value}</Text>,
    },
    {
      title: '原始来源',
      dataIndex: 'sourceType',
      width: 120,
      render: value => {
        const meta = SOURCE_META[value];
        return <Tag color={meta.color} icon={meta.icon} bordered={false}>{meta.label}</Tag>;
      },
    },
    { title: '原始来源名称', dataIndex: 'sourceName', ellipsis: true },
    { title: '场景', dataIndex: 'scene', width: 90 },
    { title: '子场景', dataIndex: 'subScene', width: 100 },
    { title: '帧数', dataIndex: 'frames', width: 90, align: 'right' },
    { title: '时长', dataIndex: 'duration', width: 80, align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: value => <Tag color="success" bordered={false} icon={<CheckCircleFilled />}>{value}</Tag>,
    },
  ];

  return (
    <MainLayout>
      <div style={{ minHeight: '100vh', background: '#f5f7fa', margin: '-24px', padding: '20px 24px 48px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Breadcrumb
            style={{ marginBottom: 14 }}
            items={[
              { title: '首页' },
              { title: '数据标注' },
              { title: '标注任务', href: '/collection/annotation-tasks' },
              { title: '新建标注任务' },
            ]}
          />

          <div style={{
            background: 'linear-gradient(120deg, #0f172a 0%, #172554 58%, #0f766e 130%)',
            borderRadius: 18,
            padding: '24px 28px',
            color: '#fff',
            marginBottom: 18,
            boxShadow: '0 16px 38px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(45, 212, 191, 0.11)', right: -70, top: -105 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/collection/annotation-tasks')} style={{ color: '#fff' }} />
                <div>
                  <Space size={10} align="center">
                    <FormOutlined style={{ color: '#5eead4', fontSize: 21 }} />
                    <Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: 0.2 }}>新建标注任务</Title>
                  </Space>
                  <div style={{ color: 'rgba(255,255,255,.68)', marginTop: 6 }}>数据来源统一为可标注数据池，模板只是可选的效率工具</div>
                </div>
              </div>
              <Space size={24} style={{ color: 'rgba(255,255,255,.78)', fontSize: 13 }}>
                <span><b style={{ color: '#5eead4', marginRight: 6 }}>01</b>任务信息</span>
                <span><b style={{ color: '#5eead4', marginRight: 6 }}>02</b>选择数据</span>
                <span><b style={{ color: '#5eead4', marginRight: 6 }}>03</b>可选配置</span>
              </Space>
            </div>
          </div>

          <Card style={{ borderRadius: 14, marginBottom: 16, border: '1px solid #e7ebf0', boxShadow: '0 4px 16px rgba(15,23,42,.035)' }}>
            <SectionTitle step="01" title="任务信息" description="只填写开始标注真正需要的信息，模板和采集任务都不是创建前置条件。" icon={<FileDoneOutlined style={{ color: '#0f766e' }} />} />
            <Row gutter={20} style={{ marginTop: 20 }}>
              <Col span={10}>
                <Text strong><span style={{ color: '#ef4444' }}>* </span>标注任务名称</Text>
                <Input value={taskName} onChange={event => setTaskName(event.target.value)} placeholder="请输入标注任务名称" size="large" style={{ marginTop: 8 }} />
              </Col>
              <Col span={7}>
                <Text strong><span style={{ color: '#ef4444' }}>* </span>标注类型</Text>
                <Select
                  value={annotationType}
                  onChange={setAnnotationType}
                  size="large"
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: 'action-segment', label: '动作切分 / 时间段标注' },
                    { value: 'object-box', label: '目标框标注' },
                    { value: 'key-point', label: '关键点标注' },
                    { value: 'trajectory', label: '轨迹标注' },
                    { value: 'classification', label: '分类标注' },
                  ]}
                />
              </Col>
              <Col span={7}>
                <Text strong>任务用途</Text>
                <Select
                  value={usage}
                  onChange={setUsage}
                  size="large"
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: 'training', label: '模型训练集' },
                    { value: 'validation', label: '验证评测集' },
                    { value: 'research', label: '算法研究' },
                  ]}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 18 }}>
              <Text strong>任务说明</Text>
              <TextArea value={description} onChange={event => setDescription(event.target.value)} autoSize={{ minRows: 2, maxRows: 3 }} style={{ marginTop: 8 }} />
            </div>
          </Card>

          <Card style={{ borderRadius: 14, marginBottom: 16, border: '1px solid #e7ebf0', boxShadow: '0 4px 16px rgba(15,23,42,.035)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
              <SectionTitle step="02" title="从可标注数据池选择" description="采集完成数据、校验通过的资产数据和仿真数据统一汇入同一个数据池。" icon={<DatabaseOutlined style={{ color: '#2563eb' }} />} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#64748b', fontSize: 12 }}>已选择</div>
                <div style={{ color: '#0f766e', fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{selectedRowKeys.length}<span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4 }}>条</span></div>
              </div>
            </div>

            <div style={{
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              padding: '15px 18px',
              borderRadius: 12,
              background: 'linear-gradient(100deg, #ecfeff 0%, #f8fafc 62%, #eff6ff 100%)',
              border: '1px solid #bae6fd',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, display: 'grid', placeItems: 'center', background: '#0f766e', color: '#fff', fontSize: 19 }}>
                  <CloudServerOutlined />
                </div>
                <div>
                  <Text strong style={{ color: '#0f172a', fontSize: 15 }}>数据来源：可标注数据池</Text>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>数据在进入本池前已经完成采集、导入解析或仿真生成，并通过可用性校验。</div>
                </div>
              </div>
              <Space size={18} split={<span style={{ width: 1, height: 24, background: '#cbd5e1' }} />}>
                <Text><b style={{ color: '#0f766e', fontSize: 18 }}>{poolSummary.total}</b> 条就绪</Text>
                <Text type="secondary">采集产出 {poolSummary.collection}</Text>
                <Text type="secondary">资产数据 {poolSummary.asset}</Text>
                <Text type="secondary">仿真数据 {poolSummary.simulation}</Text>
              </Space>
            </div>

            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12, marginBottom: 16, border: '1px solid #dbeafe', background: '#f8fbff' }}
              message={<span><b>新建标注任务固定从可标注数据池取数。</b> 采集任务和资产包只作为原始来源保留，用于筛选和追溯。</span>}
            />

            <div style={{ background: '#f8fafc', border: '1px solid #e5eaf0', padding: 14, borderRadius: 12, marginBottom: 14 }}>
              <Row gutter={12} align="middle">
                <Col flex="150px">
                  <Select allowClear value={scene} onChange={(value) => { setScene(value); setSubScene(undefined); }} placeholder="场景（选填）" style={{ width: '100%' }} options={sceneOptions} />
                </Col>
                <Col flex="150px">
                  <Select allowClear value={subScene} onChange={setSubScene} placeholder="子场景（选填）" style={{ width: '100%' }} options={subSceneOptions} />
                </Col>
                <Col flex="240px">
                  <Input allowClear value={keyword} onChange={event => setKeyword(event.target.value)} prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="搜索来源名称或 Episode ID" />
                </Col>
                <Col flex="70px">
                  <Button type="link" onClick={resetFilters}>重置</Button>
                </Col>
              </Row>
            </div>

            <Table
              size="middle"
              rowKey="key"
              columns={columns}
              dataSource={filteredEpisodes}
              pagination={{ pageSize: 5, showSizeChanger: false, showTotal: total => `共 ${total} 条可用数据` }}
              rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, preserveSelectedRowKeys: true }}
              scroll={{ x: 1050 }}
            />
          </Card>

          <Card style={{ borderRadius: 14, marginBottom: 16, border: '1px solid #e7ebf0', boxShadow: '0 4px 16px rgba(15,23,42,.035)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <SectionTitle step="03" title="可选加速配置" description="不选模板也能发布任务；需要提效时再选择一种模板。" icon={<ThunderboltOutlined style={{ color: '#b45309' }} />} />
              <Tag color="default" bordered={false} style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px' }}>选填</Tag>
            </div>

            <Radio.Group value={templateMode} onChange={event => setTemplateMode(event.target.value)} style={{ width: '100%', marginTop: 20 }}>
              <Row gutter={14}>
                {TEMPLATE_MODES.map(mode => {
                  const selected = templateMode === mode.value;
                  return (
                    <Col span={8} key={mode.value}>
                      <label style={{ display: 'block', cursor: 'pointer' }}>
                        <div style={{
                          minHeight: 116,
                          padding: '17px 18px',
                          borderRadius: 12,
                          border: selected ? `2px solid ${mode.tone}` : '1px solid #dfe5ec',
                          background: selected ? mode.background : '#fff',
                          boxShadow: selected ? `0 7px 20px ${mode.tone}18` : 'none',
                          transition: 'all .18s ease',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size={10}>
                              <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: selected ? mode.tone : '#eef2f6', color: selected ? '#fff' : '#64748b', fontSize: 16 }}>{mode.icon}</span>
                              <Text strong style={{ color: selected ? mode.tone : '#0f172a' }}>{mode.title}</Text>
                            </Space>
                            <Radio value={mode.value} />
                          </div>
                          <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>{mode.description}</div>
                        </div>
                      </label>
                    </Col>
                  );
                })}
              </Row>
            </Radio.Group>

            {templateMode === 'none' && (
              <div style={{ marginTop: 16, borderRadius: 10, background: '#f0fdfa', color: '#115e59', padding: '11px 14px', fontSize: 13 }}>
                <CheckCircleFilled style={{ marginRight: 8 }} />进入工作台后先人工标注首条数据，审核通过后可一键创建样例模板并批量应用。
              </div>
            )}
            {templateMode === 'action' && (
              <div style={{ marginTop: 16 }}>
                <Text strong>动作模板 / SOP</Text>
                <Select
                  allowClear
                  value={actionTemplateId}
                  onChange={setActionTemplateId}
                  placeholder="请选择动作模板（选填）"
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: 'sop-table-v2', label: '桌面整理动作步骤 SOP V2.1' },
                    { value: 'sop-pick-v1', label: '抓取与放置通用动作模板 V1.4' },
                    { value: 'sop-bimanual-v1', label: '双臂协同操作 SOP V1.0' },
                  ]}
                />
              </div>
            )}
            {templateMode === 'sample' && (
              <div style={{ marginTop: 16 }}>
                <Text strong>已发布标注样例模板</Text>
                <Select
                  allowClear
                  value={sampleTemplateId}
                  onChange={setSampleTemplateId}
                  placeholder="请选择审核通过的样例模板（选填）"
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: 'sample-table-022', label: '桌面整理动作切分标准样例 #022 · 已审核' },
                    { value: 'sample-bimanual-008', label: '双臂整理关键帧样例 #008 · 已审核' },
                  ]}
                />
              </div>
            )}
          </Card>

          <div style={{
            position: 'sticky',
            bottom: 14,
            zIndex: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,.94)',
            backdropFilter: 'blur(14px)',
            border: '1px solid #dfe5ec',
            borderRadius: 14,
            padding: '13px 16px 13px 20px',
            boxShadow: '0 15px 38px rgba(15,23,42,.12)',
          }}>
            <div>
              <Text strong style={{ color: '#0f172a' }}>任务已具备发布条件</Text>
              <Text type="secondary" style={{ marginLeft: 10 }}>
                来源：可标注数据池 · {selectedRowKeys.length} 条 Episode · {templateMode === 'none' ? '无模板开始' : templateMode === 'action' ? '动作模板模式' : '样例模板模式'}
              </Text>
            </div>
            <Space>
              <Button size="large" onClick={() => router.push('/collection/annotation-tasks')}>取消</Button>
              <Button type="primary" size="large" icon={<CheckOutlined />} disabled={!publishable} onClick={handlePublish} style={{ minWidth: 170, background: publishable ? '#0f766e' : undefined }}>
                发布标注任务
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function CreateAnnotationTaskPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <CreateAnnotationTaskContent />
    </Suspense>
  );
}
