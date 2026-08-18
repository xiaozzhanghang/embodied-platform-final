'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Input, Card, Typography, 
  Progress, App, Row, Col, Tooltip, Badge, Modal, Form, Select, Tabs, Divider 
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, 
  LoginOutlined, DownloadOutlined, UserOutlined, ExportOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined, 
  DeleteOutlined, ClockCircleOutlined, ThunderboltOutlined, CheckSquareOutlined,
  AppstoreOutlined, SettingOutlined, CameraOutlined, FormOutlined, FileSearchOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { AppModal, FilterPanel, PageHeader, StateView, StatusTag, TableToolbar, TableToolbarActions } from '@/components/ui';

const { Title, Text } = Typography;
const { Option } = Select;

const QC_STATUSES = ['待质检', '质检中', '已通过', '未通过'];
const projectNames = [
  'InternalCommercial (内部-商业)',
  'SimulatedCollection (模拟采集)',
  'InternalIndustrial (内部-工业)',
  'ExternalXupaosi (外部合作)',
];
const taskbooks = ['TB-桌面整理采集规范 V1.0', 'TB-货架抓取规范 V1.5', 'TB-线缆管理规范 V2.0', 'TB-厨房操作规范 V1.2'];
const people = ['张三', '李四', '王五', '赵六', '钱七', 'cy00831', '天奇管理员'];
const DEVICE_TYPES = ['Galbot_2.2_RGBD', 'Lumos_FastUMI', 'Franka_FR3', 'Galbot_1.16_G2'];

// Mock data directly mirroring collection sub-packages and well-sourced fields
const initialQaData = [
  {
    key: '1',
    instanceId: 'COLL-PK-12745',
    sourcePlanId: 'COLL-20260415-001',
    sourcePlanName: '货架物品物理采集计划',
    taskbook: 'TB-货架抓取规范 V1.5',
    project: 'InternalCommercial (内部-商业)',
    taskName: '货架物品物理采集 · 分包01',
    collectProgress: 100,
    parseProgress: '100%',
    collector: '张三',
    qaer: '李四',
    qcPassedMinutes: '36.0',
    qcProgressCount: '74 / 120',
    qcProgressMinutes: '37.0 / 60.0',
    qcPassRate: '97.3%',
    annoType: '范围标注',
    taskDesc: '超市场景货架顶层零食抓取并放置到移动托盘',
    creator: '天奇管理员',
    startTime: '2026-04-15 11:30:00',
    deviceType: 'Galbot_2.2_RGBD',
    deviceSN: 'SN-20260401',
    dataCount: 120,
    dataMinutes: '60.0',
    totalFrames: 3600,
    qcStatus: '质检中',
    qcCheckedCount: 74,
    qcPassCount: 72,
    qcFailCount: 2,
    qcTotal: 120,
    qcProgress: 62,
    currentRound: 1,
    createTime: '2026-04-15 11:30:00',
  },
  {
    key: '2',
    instanceId: 'COLL-PK-12744',
    sourcePlanId: 'COLL-20260415-001',
    sourcePlanName: '货架物品物理采集计划',
    taskbook: 'TB-货架抓取规范 V1.5',
    project: 'InternalCommercial (内部-商业)',
    taskName: '货架物品物理采集 · 分包02',
    collectProgress: 100,
    parseProgress: '100%',
    collector: '李四',
    qaer: '天奇管理员',
    qcPassedMinutes: '0.0',
    qcProgressCount: '0 / 120',
    qcProgressMinutes: '0.0 / 58.5',
    qcPassRate: '0.0%',
    annoType: '范围标注',
    taskDesc: '货架底层重物双手搬运与货位对齐',
    creator: '天奇管理员',
    startTime: '2026-04-15 14:00:00',
    deviceType: 'Galbot_1.16_G2',
    deviceSN: 'SN-20260402',
    dataCount: 120,
    dataMinutes: '58.5',
    totalFrames: 3510,
    qcStatus: '质检中',
    qcCheckedCount: 0,
    qcPassCount: 0,
    qcFailCount: 0,
    qcTotal: 120,
    qcProgress: 0,
    currentRound: 1,
    createTime: '2026-04-15 14:00:00',
  },
  {
    key: '3',
    instanceId: 'COLL-PK-12511',
    sourcePlanId: 'COLL-20260415-001',
    sourcePlanName: '货架物品物理采集计划',
    taskbook: 'TB-货架抓取规范 V1.5',
    project: 'InternalCommercial (内部-商业)',
    taskName: '货架物品物理采集 · 分包03',
    collectProgress: 100,
    parseProgress: '100%',
    collector: '王五',
    qaer: '天奇管理员',
    qcPassedMinutes: '62.0',
    qcProgressCount: '120 / 120',
    qcProgressMinutes: '62.0 / 62.0',
    qcPassRate: '100.0%',
    annoType: '3D框标注',
    taskDesc: '货架中层饮料瓶位姿抓取与放置',
    creator: '天奇管理员',
    startTime: '2026-04-14 16:30:00',
    deviceType: 'Galbot_2.2_RGBD',
    deviceSN: 'SN-20260401',
    dataCount: 120,
    dataMinutes: '62.0',
    totalFrames: 3720,
    qcStatus: '已完成',
    qcCheckedCount: 120,
    qcPassCount: 120,
    qcFailCount: 0,
    qcTotal: 120,
    qcProgress: 100,
    currentRound: 1,
    createTime: '2026-04-14 16:30:00',
  },
  {
    key: '4',
    instanceId: 'COLL-PK-12619',
    sourcePlanId: 'COLL-20260415-002',
    sourcePlanName: '桌面操作物理数采计划',
    taskbook: 'TB-桌面整理采集规范 V1.0',
    project: 'SimulatedCollection (模拟采集)',
    taskName: '桌面操作物理数采 · 分包01',
    collectProgress: 100,
    parseProgress: '100%',
    collector: 'cy00831',
    qaer: '王五',
    qcPassedMinutes: '27.5',
    qcProgressCount: '80 / 80',
    qcProgressMinutes: '40.0 / 40.0',
    qcPassRate: '68.8%',
    annoType: '关键点标注',
    taskDesc: '桌面餐具收纳与托盘规整',
    creator: 'zhangsan',
    startTime: '2026-04-13 15:00:00',
    deviceType: 'Franka_FR3',
    deviceSN: 'SN-20260388',
    dataCount: 80,
    dataMinutes: '40.0',
    totalFrames: 2400,
    qcStatus: '已完成',
    qcCheckedCount: 80,
    qcPassCount: 55,
    qcFailCount: 25,
    qcTotal: 80,
    qcProgress: 100,
    currentRound: 1,
    createTime: '2026-04-13 15:00:00',
  },
  {
    key: '5',
    instanceId: 'COLL-PK-12620',
    sourcePlanId: 'COLL-20260414-003',
    sourcePlanName: '双手整理离线资产采集计划',
    taskbook: 'TB-厨房操作规范 V1.2',
    project: 'ExternalXupaosi (外部合作)',
    taskName: '双手整理离线资产 · 分包01',
    collectProgress: 100,
    parseProgress: '100%',
    collector: 'cy00831',
    qaer: '李四',
    qcPassedMinutes: '25.0',
    qcProgressCount: '50 / 50',
    qcProgressMinutes: '25.0 / 25.0',
    qcPassRate: '100.0%',
    annoType: '语义标注',
    taskDesc: '厨房双臂协同开闭柜门与物品移位',
    creator: '天奇管理员',
    startTime: '2026-04-14 18:20:00',
    deviceType: 'Lumos_FastUMI',
    deviceSN: 'SN-20260399',
    dataCount: 50,
    dataMinutes: '25.0',
    totalFrames: 1500,
    qcStatus: '已完成',
    qcCheckedCount: 50,
    qcPassCount: 50,
    qcFailCount: 0,
    qcTotal: 50,
    qcProgress: 100,
    currentRound: 1,
    createTime: '2026-04-14 18:20:00',
  }
];

export default function QaPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [tableData, setTableData] = useState(initialQaData);
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableDensity, setTableDensity] = useState('middle');
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignRecord, setReassignRecord] = useState(null);
  const [reassignForm] = Form.useForm();

  const allCount = tableData.length;
  const checkingCount = tableData.filter(t => t.qcStatus === '质检中' || t.qcStatus === '待质检').length;
  const doneCount = tableData.filter(t => t.qcStatus === '已通过' || t.qcStatus === '未通过').length;

  const tabItems = [
    { key: 'all', label: `全部 (${allCount})` },
    { key: 'checking', label: <span><ThunderboltOutlined style={{ marginRight: 6 }} />质检中 ({checkingCount})</span> },
    { key: 'done', label: <span><CheckSquareOutlined style={{ marginRight: 6 }} />已完成 ({doneCount})</span> },
  ];

  const handleReassign = (record) => {
    setReassignRecord(record);
    reassignForm.setFieldsValue({
      qaer: record.qaer,
    });
    setReassignModalOpen(true);
  };

  const handleReassignSubmit = () => {
    reassignForm.validateFields().then(values => {
      setTableData(prev => prev.map(item => {
        if (item.key === reassignRecord.key) {
          return { ...item, qaer: values.qaer };
        }
        return item;
      }));
      message.success(`分包 [${reassignRecord.instanceId}] 质检员已成功变更为 [${values.qaer}]`);
      setReassignModalOpen(false);
    });
  };

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      if (activeStatusTab === 'checking' && item.qcStatus !== '质检中' && item.qcStatus !== '待质检') return false;
      if (activeStatusTab === 'done' && item.qcStatus !== '已通过' && item.qcStatus !== '未通过') return false;

      const projectMatch = !filters.project || item.project.includes(filters.project);
      const taskbookMatch = !filters.taskbook || item.taskbook === filters.taskbook;
      const nameMatch = !filters.name || item.taskName.includes(filters.name) || item.sourcePlanName.includes(filters.name);
      const idMatch = !filters.taskId || item.instanceId.toLowerCase().includes(filters.taskId.toLowerCase()) || item.sourcePlanId.toLowerCase().includes(filters.taskId.toLowerCase());
      const statusMatch = !filters.qcStatus || item.qcStatus === filters.qcStatus;
      const qaerMatch = !filters.qaer || item.qaer === filters.qaer;
      const collectorMatch = !filters.collector || item.collector === filters.collector;

      return projectMatch && taskbookMatch && nameMatch && idMatch && statusMatch && qaerMatch && collectorMatch;
    });
  }, [filters, tableData, activeStatusTab]);

  const columns = [
    {
      title: '来源采集分包ID',
      dataIndex: 'instanceId',
      key: 'instanceId',
      width: 170,
      fixed: 'left',
      render: (id) => <Text strong style={{ color: '#1677ff', fontFamily: 'monospace' }}>{id}</Text>,
    },
    { 
      title: '任务名称', 
      dataIndex: 'taskName', 
      key: 'taskName', 
      width: 220, 
      ellipsis: true,
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: '采集进度',
      key: 'collectProgress',
      width: 130,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Progress percent={r.collectProgress || 100} size="small" showInfo={false} style={{ flex: 1 }} strokeColor="#1677ff" />
          <span style={{ fontSize: 12, color: '#595959' }}>{r.collectProgress || 100}%</span>
        </div>
      )
    },
    {
      title: '解析进度',
      dataIndex: 'parseProgress',
      key: 'parseProgress',
      width: 110,
      align: 'center',
      render: (v) => <Tag color="blue">{v || '100%'}</Tag>
    },
    {
      title: '任务状态', 
      dataIndex: 'qcStatus', 
      key: 'qcStatus', 
      width: 110, 
      align: 'center',
      render: (s) => <StatusTag status={s} />
    },
    { 
      title: '采集员', 
      dataIndex: 'collector', 
      key: 'collector',
      width: 100, 
      render: (c) => <Tag color="blue">{c}</Tag>
    },
    { 
      title: '质检员', 
      dataIndex: 'qaer', 
      key: 'qaer',
      width: 120, 
      render: (q) => <Tag color="cyan">{q}</Tag>
    },
    {
      title: '通过质检(分钟)',
      dataIndex: 'qcPassedMinutes',
      key: 'qcPassedMinutes',
      width: 130,
      align: 'right',
      render: (v) => <Text style={{ color: '#52c41a', fontWeight: 600 }}>{v || '0.0'} min</Text>
    },
    {
      title: '质检进度(数量)',
      dataIndex: 'qcProgressCount',
      key: 'qcProgressCount',
      width: 140,
      align: 'center',
      render: (v, r) => (
        <div>
          <Text strong style={{ color: '#1677ff' }}>{v || `${r.qcPassCount || 0} / ${r.dataCount || 120}`}</Text>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>条数</div>
        </div>
      )
    },
    {
      title: '质检进度(分钟)',
      dataIndex: 'qcProgressMinutes',
      key: 'qcProgressMinutes',
      width: 140,
      align: 'center',
      render: (v, r) => (
        <div>
          <Text strong style={{ color: '#722ed1' }}>{v || `${r.dataMinutes} / ${r.dataMinutes}`}</Text>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>分钟</div>
        </div>
      )
    },
    {
      title: '质检合格率',
      dataIndex: 'qcPassRate',
      key: 'qcPassRate',
      width: 110,
      align: 'right',
      render: (v) => <Text strong style={{ color: parseFloat(v) >= 90 ? '#52c41a' : '#faad14' }}>{v || '100%'}</Text>
    },
    {
      title: '已质检数量',
      dataIndex: 'qcCheckedCount',
      key: 'qcCheckedCount',
      width: 110,
      align: 'right',
      render: (v, r) => <span>{v ?? (r.qcPassCount + r.qcFailCount)} 条</span>
    },
    {
      title: '标注类型',
      dataIndex: 'annoType',
      key: 'annoType',
      width: 110,
      align: 'center',
      render: (v) => <Tag color="geekblue">{v || '范围标注'}</Tag>
    },
    {
      title: '任务描述',
      dataIndex: 'taskDesc',
      key: 'taskDesc',
      width: 200,
      ellipsis: true,
      render: (text) => <Tooltip title={text}><span>{text || '超市场景物品抓取与放置任务'}</span></Tooltip>
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 110,
      render: (v) => <span>{v || '天奇管理员'}</span>
    },
    {
      title: '开始上传时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (t, r) => <span style={{ fontSize: 12, color: '#595959' }}>{t || r.createTime}</span>
    },
    {
      title: '设备SN',
      dataIndex: 'deviceSN',
      key: 'deviceSN',
      width: 140,
      render: (sn) => <Tag style={{ fontFamily: 'monospace' }}>{sn || 'SN-20260401'}</Tag>
    },
    {
      title: '操作', 
      key: 'action', 
      width: 170, 
      fixed: 'right', 
      align: 'center',
      render: (_, r) => (
        <Space separator={<Divider orientation="vertical" />} size={0}>
          <Button 
            type="link" 
            size="small" 
            icon={<LoginOutlined />} 
            style={{ padding: '0 4px', fontWeight: 600 }} 
            onClick={() => router.push(`/collection/qa/${r.instanceId}`)}
          >
            进入
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            style={{ padding: '0 4px' }} 
            onClick={() => handleReassign(r)}
          >
            重新分配
          </Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="数据质检"
          description="来源于数据采集计划的分包数据质量检查，支持质检员分配与批量判定。质检合格后流转至数据标注环节。"
          breadcrumbs={[{ title: '首页' }, { title: '任务管理' }, { title: '数据质检' }]}
        />

        <SpecMarker
          id="collection-qa-query"
          number={1}
          title="数采分包质检检索与过滤"
          rules={[
            "数据质检来源直接对应采集计划的子分包，支持按来源计划、分包编号、采集员及质检员筛选。",
            "支持一键重置筛选条件并刷新表格。"
          ]}
          remark="数据质检来源采集计划分包"
          style={{ width: '100%' }}
        >
          <FilterPanel>
            <QueryFilter
              submitter={{
                submitButtonProps: { icon: <SearchOutlined /> },
                resetButtonProps: { icon: <ReloadOutlined /> },
              }}
              onFinish={async (values) => setFilters(values)}
              onReset={() => setFilters({})}
            >
              <ProFormSelect name="project" label="所属项目" placeholder="请选择项目" options={projectNames.map(n => ({ label: n, value: n }))} />
              <ProFormSelect name="taskbook" label="任务书" placeholder="请选择任务书" options={taskbooks.map(n => ({ label: n, value: n }))} />
              <ProFormText name="taskId" label="分包/计划编号" placeholder="请输入分包ID或计划ID" />
              <ProFormText name="name" label="任务名称" placeholder="请输入任务名称" />
              <ProFormSelect name="collector" label="采集员" placeholder="请选择采集员" options={people.map(p => ({ label: p, value: p }))} />
              <ProFormSelect name="qaer" label="质检员" placeholder="请选择质检员" options={people.map(p => ({ label: p, value: p }))} />
              <ProFormSelect name="qcStatus" label="质检状态" placeholder="请选择状态" options={QC_STATUSES.map(s => ({ label: s, value: s }))} />
            </QueryFilter>
          </FilterPanel>
        </SpecMarker>

        {/* Table Section */}
        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          <div style={{ padding: '0 20px', borderBottom: '1px solid #f0f0f0' }}>
            <Tabs
              activeKey={activeStatusTab}
              onChange={setActiveStatusTab}
              style={{ marginBottom: -1 }}
              items={tabItems}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f' }}>
              质检列表
            </div>
            <Space size={12}>
              <Button 
                icon={<UserOutlined />} 
                disabled={selectedRowKeys.length === 0} 
                onClick={() => message.info(`已选 ${selectedRowKeys.length} 个分包，批量分配质检员`)}
              >
                批量分配质检员 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={() => message.success('正在导出质检报表...')}
              >
                导出报表
              </Button>
              <TableToolbarActions
                columns={columns}
                density={tableDensity}
                onDensityChange={setTableDensity}
                hiddenColumns={hiddenColumns}
                onHiddenColumnsChange={setHiddenColumns}
                onRefresh={() => message.success('数据已刷新')}
              />
            </Space>
          </div>

          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            columns={columns.filter(col => !hiddenColumns.includes(col.key))}
            dataSource={filteredData}
            scroll={{ x: 1900 }}
            size={tableDensity}
            pagination={{
              pageSize: 10,
              showTotal: (t) => `共 ${t} 条质检分包数据`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
          />
        </Card>

        {/* 分配质检员弹窗 */}
        <AppModal
          title={`重新分配 — 分包 [${reassignRecord?.instanceId || ''}]`}
          open={reassignModalOpen}
          onCancel={() => setReassignModalOpen(false)}
          onOk={handleReassignSubmit}
          okText="确定"
          cancelText="取消"
        >
          <Form form={reassignForm} layout="vertical" style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f5f5f5', borderRadius: 6, fontSize: 13 }}>
              <div><strong>来源计划：</strong>{reassignRecord?.sourcePlanName} ({reassignRecord?.sourcePlanId})</div>
              <div style={{ marginTop: 4 }}><strong>采集人员：</strong>{reassignRecord?.collector}</div>
            </div>
            <Form.Item
              name="qaer"
              label="指定质检员"
              rules={[{ required: true, message: '请选择质检员' }]}
            >
              <Select placeholder="请选择质检员">
                {people.map(p => (
                  <Select.Option key={p} value={p}>{p}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </AppModal>
      </div>
    </MainLayout>
  );
}
