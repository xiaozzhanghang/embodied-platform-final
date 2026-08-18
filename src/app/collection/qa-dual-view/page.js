'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Input, Card, Typography, 
  Progress, App, Row, Col, Tooltip, Badge, Modal, Form, 
  Select, Segmented, Drawer, Descriptions, Divider, Alert, Spin
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, EyeOutlined, PlayCircleOutlined,
  AppstoreOutlined, UnorderedListOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, VideoCameraOutlined,
  RobotOutlined, ThunderboltOutlined, DatabaseOutlined,
  ArrowRightOutlined, FileTextOutlined, FilterOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag, TableToolbar, TableToolbarActions } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;

// Mock Subpackage Dataset
const mockSubpackages = [
  {
    key: '1',
    instanceId: 'COLL-PK-12744',
    sourcePlanName: '超市场景物品物理采集计划',
    taskbook: 'TB-超市场景采集规范 V1.0',
    collectRatio: '28/50',
    parseRatio: '28/30',
    qcRatio: '1/30',
    passRatio: '1/1',
    durationRatio: '0.3/7.0',
    passedDuration: '0.3',
    passRate: '100.0%',
    qcStatus: '质检中',
    collector: '张三',
    qaer: '天奇管理员',
    deviceSN: 'R001GBD-20260401',
    episodeCount: 30,
    annoType: '范围标注',
    updateTime: '2026-04-15 14:20:00',
  },
  {
    key: '2',
    instanceId: 'COLL-PK-12745',
    sourcePlanName: '货架物品物理采集计划',
    taskbook: 'TB-货架抓取规范 V1.5',
    collectRatio: '55/55',
    parseRatio: '55/55',
    qcRatio: '55/55',
    passRatio: '55/55',
    durationRatio: '14.0/14.0',
    passedDuration: '14.0',
    passRate: '100.0%',
    qcStatus: '已通过',
    collector: '李四',
    qaer: '天奇管理员',
    deviceSN: 'R001GBD-20260402',
    episodeCount: 55,
    annoType: '范围标注',
    updateTime: '2026-04-15 16:00:00',
  },
  {
    key: '3',
    instanceId: 'COLL-PK-12751',
    sourcePlanName: '超市场景物品物理采集计划',
    taskbook: 'TB-超市场景采集规范 V1.0',
    collectRatio: '0/50',
    parseRatio: '0/0',
    qcRatio: '0/0',
    passRatio: '0/0',
    durationRatio: '0.0/0.0',
    passedDuration: '0.0',
    passRate: '0.0%',
    qcStatus: '质检中',
    collector: '张三',
    qaer: '李四',
    deviceSN: '—',
    episodeCount: 0,
    annoType: '范围标注',
    updateTime: '2026-04-15 11:30:00',
  },
  {
    key: '4',
    instanceId: 'COLL-PK-12760',
    sourcePlanName: '工业纸箱封装码垛采集计划',
    taskbook: 'TB-纸箱打包规范 V2.0',
    collectRatio: '50/50',
    parseRatio: '50/50',
    qcRatio: '50/50',
    passRatio: '48/50',
    durationRatio: '18.5/18.5',
    passedDuration: '17.8',
    passRate: '96.0%',
    qcStatus: '已通过',
    collector: '王五',
    qaer: '天奇管理员',
    deviceSN: 'LUMOS-UMI-009',
    episodeCount: 50,
    annoType: '语义分段',
    updateTime: '2026-04-14 17:10:00',
  },
];

// Flat Episode Dataset across ALL subpackages
const mockEpisodes = [
  {
    key: 'ep-1',
    episodeId: 'COLL-PK-12744-EP-001',
    shortId: 'EP-001',
    subpackageId: 'COLL-PK-12744',
    planName: '超市场景物品物理采集计划',
    taskbook: 'TB-超市场景采集规范 V1.0',
    instruction: 'pick snack from top shelf and place onto moving tray',
    objects: ['薯片盒', '移动托盘'],
    frames: 316,
    durationSec: 10.53,
    qcStatus: '已通过',
    collector: '张三',
    qaer: '天奇管理员',
    deviceSN: 'R001GBD-20260401',
    deviceType: 'Galbot_2.2_RGBD',
    collectTime: '2026-04-15 14:02:11',
    hasFault: false,
  },
  {
    key: 'ep-2',
    episodeId: 'COLL-PK-12744-EP-002',
    shortId: 'EP-002',
    subpackageId: 'COLL-PK-12744',
    planName: '超市场景物品物理采集计划',
    taskbook: 'TB-超市场景采集规范 V1.0',
    instruction: 'pick snack from top shelf and place onto moving tray',
    objects: ['薯片盒', '移动托盘'],
    frames: 290,
    durationSec: 9.67,
    qcStatus: '质检中',
    collector: '张三',
    qaer: '天奇管理员',
    deviceSN: 'R001GBD-20260401',
    deviceType: 'Galbot_2.2_RGBD',
    collectTime: '2026-04-15 14:05:44',
    hasFault: false,
  },
  {
    key: 'ep-3',
    episodeId: 'COLL-PK-12744-EP-003',
    shortId: 'EP-003',
    subpackageId: 'COLL-PK-12744',
    planName: '超市场景物品物理采集计划',
    taskbook: 'TB-超市场景采集规范 V1.0',
    instruction: 'pick snack from top shelf and place onto moving tray',
    objects: ['薯片盒', '移动托盘'],
    frames: 340,
    durationSec: 11.33,
    qcStatus: '待质检',
    collector: '张三',
    qaer: '—',
    deviceSN: 'R001GBD-20260401',
    deviceType: 'Galbot_2.2_RGBD',
    collectTime: '2026-04-15 14:08:20',
    hasFault: false,
  },
  {
    key: 'ep-4',
    episodeId: 'COLL-PK-12745-EP-018',
    shortId: 'EP-018',
    subpackageId: 'COLL-PK-12745',
    planName: '货架物品物理采集计划',
    taskbook: 'TB-货架抓取规范 V1.5',
    instruction: 'grasp beverage bottles with orientation alignment and place into crate',
    objects: ['饮料瓶', '收纳筐'],
    frames: 420,
    durationSec: 14.00,
    qcStatus: '已通过',
    collector: '李四',
    qaer: '天奇管理员',
    deviceSN: 'R001GBD-20260402',
    deviceType: 'Galbot_2.2_RGBD',
    collectTime: '2026-04-15 15:32:00',
    hasFault: false,
  },
  {
    key: 'ep-5',
    episodeId: 'COLL-PK-12760-EP-009',
    shortId: 'EP-009',
    subpackageId: 'COLL-PK-12760',
    planName: '工业纸箱封装码垛采集计划',
    taskbook: 'TB-纸箱打包规范 V2.0',
    instruction: 'pick industrial box, seal with tape machine and stack on pallet',
    objects: ['瓦楞纸箱', '胶带机', '木托盘'],
    frames: 512,
    durationSec: 17.07,
    qcStatus: '未通过',
    collector: '王五',
    qaer: '天奇管理员',
    deviceSN: 'LUMOS-UMI-009',
    deviceType: 'Lumos_FastUMI',
    collectTime: '2026-04-14 16:45:12',
    hasFault: true,
    faultReason: '机械臂末端速度突变过大，胶带封口不平整',
  },
  {
    key: 'ep-6',
    episodeId: 'COLL-PK-12760-EP-010',
    shortId: 'EP-010',
    subpackageId: 'COLL-PK-12760',
    planName: '工业纸箱封装码垛采集计划',
    taskbook: 'TB-纸箱打包规范 V2.0',
    instruction: 'pick industrial box, seal with tape machine and stack on pallet',
    objects: ['瓦楞纸箱', '胶带机', '木托盘'],
    frames: 480,
    durationSec: 16.00,
    qcStatus: '已通过',
    collector: '王五',
    qaer: '天奇管理员',
    deviceSN: 'LUMOS-UMI-009',
    deviceType: 'Lumos_FastUMI',
    collectTime: '2026-04-14 16:50:00',
    hasFault: false,
  },
];

function DualViewContent() {
  const router = useRouter();
  const { message } = App.useApp();

  // View state: 'subpackage' (按分包) vs 'episode' (按单条数据)
  const [viewMode, setViewMode] = useState('subpackage');

  // Drawer inspector state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  // Search filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPackage, setFilterPackage] = useState(null);
  const [filterCollector, setFilterCollector] = useState(null);

  // Filtered subpackages
  const filteredSubpackages = useMemo(() => {
    return mockSubpackages.filter(pkg => {
      const matchKeyword = !searchKeyword || pkg.instanceId.includes(searchKeyword) || pkg.sourcePlanName.includes(searchKeyword) || pkg.collector.includes(searchKeyword);
      const matchStatus = !filterStatus || pkg.qcStatus === filterStatus;
      const matchCollector = !filterCollector || pkg.collector === filterCollector;
      return matchKeyword && matchStatus && matchCollector;
    });
  }, [searchKeyword, filterStatus, filterCollector]);

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    return mockEpisodes.filter(ep => {
      const matchKeyword = !searchKeyword || 
        ep.episodeId.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        ep.instruction.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        ep.subpackageId.includes(searchKeyword) || 
        ep.deviceSN.includes(searchKeyword);
      const matchStatus = !filterStatus || ep.qcStatus === filterStatus;
      const matchPackage = !filterPackage || ep.subpackageId === filterPackage;
      const matchCollector = !filterCollector || ep.collector === filterCollector;
      return matchKeyword && matchStatus && matchPackage && matchCollector;
    });
  }, [searchKeyword, filterStatus, filterPackage, filterCollector]);

  const openEpisodeDrawer = (ep) => {
    setSelectedEpisode(ep);
    setDrawerVisible(true);
  };

  // Subpackage Columns
  const subpackageColumns = [
    {
      title: '分包编号',
      dataIndex: 'instanceId',
      key: 'instanceId',
      width: 170,
      fixed: 'left',
      render: (id, r) => (
        <div>
          <Text strong style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => router.push(`/collection/qa/${id}`)}>
            {id}
          </Text>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.sourcePlanName}</div>
        </div>
      )
    },
    { 
      title: '已采/计划', 
      dataIndex: 'collectRatio', 
      key: 'collectRatio', 
      width: 95, 
      align: 'center', 
      render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span> 
    },
    { 
      title: '已解/已传', 
      dataIndex: 'parseRatio', 
      key: 'parseRatio', 
      width: 95, 
      align: 'center', 
      render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> 
    },
    { 
      title: '任务状态', 
      dataIndex: 'qcStatus', 
      key: 'qcStatus', 
      width: 95, 
      align: 'center', 
      render: s => <StatusTag status={s} /> 
    },
    { 
      title: '已检/送检', 
      dataIndex: 'qcRatio', 
      key: 'qcRatio', 
      width: 95, 
      align: 'center', 
      render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> 
    },
    { 
      title: '合格/已检', 
      dataIndex: 'passRatio', 
      key: 'passRatio', 
      width: 95, 
      align: 'center', 
      render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> 
    },
    { 
      title: '已检/总长', 
      dataIndex: 'durationRatio', 
      key: 'durationRatio', 
      width: 95, 
      align: 'center', 
      render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> 
    },
    { 
      title: '合格时长', 
      dataIndex: 'passedDuration', 
      key: 'passedDuration', 
      width: 90, 
      align: 'center', 
      render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> 
    },
    { 
      title: '综合合格率', 
      dataIndex: 'passRate', 
      key: 'passRate', 
      width: 105, 
      align: 'center', 
      render: r => <Tag color={r === '100.0%' ? 'success' : (r === '0.0%' ? 'default' : 'processing')} style={{ fontFamily: 'monospace' }}>{r}</Tag> 
    },
    { title: '采集员', dataIndex: 'collector', key: 'collector', width: 90, align: 'center' },
    { title: '质检员', dataIndex: 'qaer', key: 'qaer', width: 90, align: 'center' },
    { title: '设备SN', dataIndex: 'deviceSN', key: 'deviceSN', width: 140, render: sn => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{sn}</span> },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/qa/${r.instanceId}`)}>
            进入
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<UnorderedListOutlined />} 
            style={{ padding: 0, color: '#722ed1' }}
            onClick={() => {
              setFilterPackage(r.instanceId);
              setViewMode('episode');
              message.info(`已切换至【单条数据视图】，自动筛选分包 [${r.instanceId}] 包含的 Episodes`);
            }}
          >
            查单条 ({r.episodeCount})
          </Button>
        </Space>
      )
    }
  ];

  // Flat Episode Columns
  const episodeColumns = [
    {
      title: 'Episode 编号 / 快速预览',
      dataIndex: 'episodeId',
      key: 'episodeId',
      width: 230,
      fixed: 'left',
      render: (epId, r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong style={{ color: '#1677ff', cursor: 'pointer', fontFamily: 'monospace' }} onClick={() => openEpisodeDrawer(r)}>
              {r.shortId}
            </Text>
            <Tag color="geekblue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px', margin: 0 }}>
              {r.frames}帧 · {r.durationSec}s
            </Tag>
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace', marginTop: 2 }}>
            {epId}
          </div>
        </div>
      )
    },
    {
      title: '多视角回放',
      key: 'preview',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <Button 
          type="dashed" 
          size="small" 
          icon={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
          onClick={() => openEpisodeDrawer(r)}
          style={{ fontSize: 12 }}
        >
          查看视频
        </Button>
      )
    },
    {
      title: '所属分包',
      dataIndex: 'subpackageId',
      key: 'subpackageId',
      width: 140,
      render: pkgId => (
        <Tag 
          color="blue" 
          style={{ cursor: 'pointer', fontFamily: 'monospace' }}
          onClick={() => router.push(`/collection/qa/${pkgId}`)}
        >
          {pkgId}
        </Tag>
      )
    },
    {
      title: '动作语言指令 (Language Instruction / Prompt)',
      dataIndex: 'instruction',
      key: 'instruction',
      width: 320,
      render: (inst, r) => (
        <div>
          <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>"{inst}"</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            涉及物体: {r.objects.join('、')}
          </div>
        </div>
      )
    },
    {
      title: '质检状态',
      dataIndex: 'qcStatus',
      key: 'qcStatus',
      width: 100,
      align: 'center',
      render: s => <StatusTag status={s} />
    },
    { title: '采集员', dataIndex: 'collector', key: 'collector', width: 90, align: 'center' },
    { title: '质检员', dataIndex: 'qaer', key: 'qaer', width: 90, align: 'center' },
    {
      title: '采集设备 SN',
      dataIndex: 'deviceSN',
      key: 'deviceSN',
      width: 160,
      render: (sn, r) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{sn}</span>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.deviceType}</div>
        </div>
      )
    },
    { title: '采集时间', dataIndex: 'collectTime', key: 'collectTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => openEpisodeDrawer(r)}>
            查看详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            style={{ padding: 0, color: '#52c41a' }}
            onClick={() => message.success(`已标记 [${r.shortId}] 质检合格`)}
          >
            快速合格
          </Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="数据质检 (双视图穿透系统演示)"
          description="点击右侧切换器可在【按分包管理视图】与【按单条 Episode 数据视图】之间瞬间无缝切换，无需层层点进分包即可全局精准搜寻任意单条采集轨迹！"
          breadcrumbs={[{ title: '首页' }, { title: '任务管理' }, { title: '数据质检 (双视图演示)' }]}
          extra={[
            <div key="viewSwitcher" style={{ background: '#f1f5f9', padding: '4px 6px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: 'subpackage',
                    label: (
                      <Space size={6}>
                        <AppstoreOutlined />
                        <span>按分包管理视图 ({filteredSubpackages.length})</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'episode',
                    label: (
                      <Space size={6}>
                        <UnorderedListOutlined />
                        <span>按单条数据 (Episode) 视图 ({filteredEpisodes.length})</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          ]}
        />

        {/* Explain Alert */}
        <Alert
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          message={
            viewMode === 'subpackage'
              ? '当前处于【按分包视图】：适合宏观掌握每个分包的送检进度、合格率，并批量点击「进入」下钻。若想直接找单条数据，可切换右上角【按单条数据视图】或点击操作栏「查单条」。'
              : '当前处于【按单条数据 (Episode) 视图】：所有分包内的数据已被全量打平展开，您可以在上方直接搜索 Episode ID、设备 SN、Prompt 动作指令或采集员，点击单行直接抽屉回放视频！'
          }
          style={{ marginBottom: 16 }}
        />

        {/* Filter Panel */}
        <div className="ui-form-section">
          <Form layout="inline">
            <Row gutter={[12, 12]} style={{ width: '100%' }}>
              <Col>
                <Input 
                  placeholder={viewMode === 'subpackage' ? "搜索分包编号 / 采集计划 / 采集员" : "全局搜索 Episode ID / 指令 / 设备SN / 分包号"} 
                  style={{ width: 320 }} 
                  value={searchKeyword} 
                  onChange={e => setSearchKeyword(e.target.value)} 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  allowClear 
                />
              </Col>
              {viewMode === 'episode' && (
                <Col>
                  <Select 
                    placeholder="所属分包" 
                    style={{ width: 170 }} 
                    allowClear 
                    value={filterPackage} 
                    onChange={setFilterPackage}
                    options={[
                      { label: 'COLL-PK-12744 (30条)', value: 'COLL-PK-12744' },
                      { label: 'COLL-PK-12745 (55条)', value: 'COLL-PK-12745' },
                      { label: 'COLL-PK-12760 (50条)', value: 'COLL-PK-12760' },
                    ]}
                  />
                </Col>
              )}
              <Col>
                <Select 
                  placeholder="质检状态" 
                  style={{ width: 130 }} 
                  allowClear 
                  value={filterStatus} 
                  onChange={setFilterStatus}
                  options={[
                    { label: '待质检', value: '待质检' },
                    { label: '质检中', value: '质检中' },
                    { label: '已通过', value: '已通过' },
                    { label: '未通过', value: '未通过' },
                  ]}
                />
              </Col>
              <Col>
                <Select 
                  placeholder="采集员" 
                  style={{ width: 120 }} 
                  allowClear 
                  value={filterCollector} 
                  onChange={setFilterCollector}
                  options={[
                    { label: '张三', value: '张三' },
                    { label: '李四', value: '李四' },
                    { label: '王五', value: '王五' },
                  ]}
                />
              </Col>
              <Col>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                      setSearchKeyword('');
                      setFilterStatus(null);
                      setFilterPackage(null);
                      setFilterCollector(null);
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Dynamic Table Card */}
        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          <TableToolbar
            title={viewMode === 'subpackage' ? "分包质检列表" : "单条 Episode 数据明细池"}
            count={viewMode === 'subpackage' ? filteredSubpackages.length : filteredEpisodes.length}
            actions={[
              <Button 
                key="toggleView" 
                type="dashed" 
                icon={viewMode === 'subpackage' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
                onClick={() => setViewMode(viewMode === 'subpackage' ? 'episode' : 'subpackage')}
              >
                切换为{viewMode === 'subpackage' ? '【按单条数据视图】' : '【按分包视图】'}
              </Button>
            ]}
          />

          {viewMode === 'subpackage' ? (
            <Table
              columns={subpackageColumns}
              dataSource={filteredSubpackages}
              scroll={{ x: 1500 }}
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个分包` }}
            />
          ) : (
            <Table
              columns={episodeColumns}
              dataSource={filteredEpisodes}
              scroll={{ x: 1700 }}
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条采集 Episode` }}
            />
          )}
        </Card>

        {/* Episode Quick View & Inspection Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <VideoCameraOutlined style={{ color: '#1677ff', fontSize: 18 }} />
              <span>单条采集数据详情 — {selectedEpisode?.episodeId}</span>
              <Tag color={selectedEpisode?.qcStatus === '已通过' ? 'success' : 'processing'}>
                {selectedEpisode?.qcStatus}
              </Tag>
            </div>
          }
          width={720}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          extra={
            <Space>
              <Button danger onClick={() => message.warning('已标记质检不通过')}>
                不通过
              </Button>
              <Button type="primary" onClick={() => { message.success('质检已通过'); setDrawerVisible(false); }}>
                质检通过
              </Button>
            </Space>
          }
        >
          {selectedEpisode && (
            <div>
              {/* Video 4-Camera Matrix Preview Placeholder */}
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>🎬 多视角相机回放 (Head RGB / Head Depth / Wrist Left / Wrist Right)</span>
                  <span>{selectedEpisode.durationSec} 秒 · 30 FPS</span>
                </div>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ height: 130, background: '#1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <PlayCircleOutlined style={{ fontSize: 28, color: '#38bdf8', marginBottom: 4 }} />
                      <span style={{ fontSize: 12 }}>头部 RGB (1080P)</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ height: 130, background: '#1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <EyeOutlined style={{ fontSize: 28, color: '#a855f7', marginBottom: 4 }} />
                      <span style={{ fontSize: 12 }}>头部 Depth 点云深度</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ height: 100, background: '#1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <span style={{ fontSize: 11 }}>左腕手眼相机 Wrist_L</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ height: 100, background: '#1e293b', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <span style={{ fontSize: 11 }}>右腕手眼相机 Wrist_R</span>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Descriptions */}
              <Descriptions title="动作语义与采集元数据" bordered column={2} size="small">
                <Descriptions.Item label="Episode ID" span={2}>
                  <Text strong style={{ fontFamily: 'monospace' }}>{selectedEpisode.episodeId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="所属分包">
                  <Tag color="blue">{selectedEpisode.subpackageId}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="所属采集计划">
                  {selectedEpisode.planName}
                </Descriptions.Item>
                <Descriptions.Item label="语言指令 Prompt" span={2}>
                  <Text style={{ fontFamily: 'monospace', color: '#0958d9', fontWeight: 600 }}>
                    "{selectedEpisode.instruction}"
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="涉及物体">
                  {selectedEpisode.objects.join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="有效帧数/时长">
                  {selectedEpisode.frames} 帧 ({selectedEpisode.durationSec}s)
                </Descriptions.Item>
                <Descriptions.Item label="采集员">
                  {selectedEpisode.collector}
                </Descriptions.Item>
                <Descriptions.Item label="设备 SN">
                  <span style={{ fontFamily: 'monospace' }}>{selectedEpisode.deviceSN}</span> ({selectedEpisode.deviceType})
                </Descriptions.Item>
                <Descriptions.Item label="采集时间" span={2}>
                  {selectedEpisode.collectTime}
                </Descriptions.Item>
              </Descriptions>

              {/* taskinfo JSON payload preview */}
              <div style={{ marginTop: 20 }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  🎯 自动组装的 downstream taskinfo.json 片段：
                </Text>
                <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, fontFamily: 'monospace', color: '#334155' }}>
{JSON.stringify({
  episode_id: selectedEpisode.episodeId,
  task: {
    title: selectedEpisode.taskbook,
    language_instruction: selectedEpisode.instruction,
    objects: selectedEpisode.objects
  },
  lineage: {
    subpackage_id: selectedEpisode.subpackageId,
    device_sn: selectedEpisode.deviceSN,
    collector: selectedEpisode.collector,
    qc_status: selectedEpisode.qcStatus
  },
  stats: {
    fps: 30,
    valid_frames: selectedEpisode.frames,
    duration_sec: selectedEpisode.durationSec
  }
}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </MainLayout>
  );
}

export default function DualViewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>}>
      <DualViewContent />
    </Suspense>
  );
}
