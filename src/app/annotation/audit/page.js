'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Typography,
  Progress,
  App,
  Modal,
  Form,
  Select,
  Tabs
} from 'antd';
import {
  EditOutlined,
  LoginOutlined,
  DownloadOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { ProFormSelect, ProFormText } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, QueryFilterBar, StatusTag, TableToolbar, TableToolbarActions } from '@/components/ui';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Text } = Typography;
const { Option } = Select;

const ANNO_TYPES = ['框标注', '点标注', '范围标注', '范围&框标注'];
const TASK_STATUSES = ['进行中', '已完成', '暂停'];

const projectNames = [
  'SimulatedCollection(模拟采集) sin',
  '天奇-餐盘整理任务',
  '垃圾分类抓取项目',
  'Galbot-厨房场景',
];
const taskbooks = ['TB-抓取红色方块', 'TB-餐盘整理', 'TB-垃圾分类', 'TB-物品摆放'];
const taskTypes = ['垃圾清理', '餐盘整理', '物品搬运', '工具使用'];
const people = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

const DEVICE_TYPES = ['galbot', '鹿鸣', '真机', '仿真机'];
const COLLECTION_MODES = ['UMI', 'galbot', '标准采集'];
const REMOTE_CONTROL_TYPES = ['双设备', '单设备', '遥操'];

const annoTypeColors = {
  '框标注': 'green',
  '点标注': 'blue',
  '范围标注': 'purple',
  '范围&框标注': 'magenta',
};

function makeProgress(total, type) {
  if (type === 'full') return total;
  if (type === 'partial') return Math.floor(total * (0.3 + Math.random() * 0.5));
  if (type === 'zero') return 0;
  return Math.floor(Math.random() * total);
}

const instanceMockData = Array.from({ length: 20 }).map((_, i) => {
  const dataCount = [186, 240, 312, 156, 420, 198, 88, 520, 164, 276][i % 10];
  const annoType = ANNO_TYPES[i % 4];
  const annoTotal = dataCount;
  const annoDone = makeProgress(annoTotal, i < 5 ? 'full' : i < 12 ? 'partial' : 'zero');
  const auditDone = makeProgress(annoDone, i < 3 ? 'partial' : 'zero');
  const taskStatus = i < 4 ? '已完成' : i < 16 ? '进行中' : '暂停';
  const deviceType = DEVICE_TYPES[i % DEVICE_TYPES.length];
  const collectionMode = COLLECTION_MODES[i % COLLECTION_MODES.length];
  const remoteControlType = REMOTE_CONTROL_TYPES[i % REMOTE_CONTROL_TYPES.length];

  return {
    key: String(i),
    project: projectNames[i % projectNames.length],
    taskbook: taskbooks[i % taskbooks.length],
    annoId: 16822 - i,
    taskId: 21795 - Math.floor(i / 2),
    instanceId: 19884 - i,
    taskName: `${taskTypes[i % taskTypes.length]}_任务_${String(i + 1).padStart(3, '0')}`,
    taskNameEn: `Task_${taskTypes[i % taskTypes.length]}_${String(i + 1).padStart(3, '0')}`,
    annoTaskName: `${taskTypes[i % taskTypes.length]}_标注_${people[i % people.length]}`,
    dataCount,
    dataMinutes: (dataCount * 0.5 / 60).toFixed(1),
    taskStatus,
    isShelfTask: i % 3 === 0 ? '是' : '否',
    rowCol: `R${Math.floor(i / 4) + 1}C${(i % 4) + 1}`,
    deviceSN: `SN-${String(2024001 + i)}`,
    deviceType,
    collectionMode,
    remoteControlType,
    taskUsage: i % 2 === 0 ? 'OfficialCollection(正式采集)' : 'TrialCollection(试用采集)',
    sceneCategory: i % 2 === 0 ? '真实数据' : '模拟数据',
    subSceneCategory: ['UMI工业', 'UMI家居', 'UMI物流', 'UMI医疗'][i % 4],
    qaer: people[(i + 1) % people.length],
    annotator: people[i % people.length],
    auditor: people[(i + 2) % people.length],
    collector: people[(i + 3) % people.length],
    qaProgress: i < 8 ? 100 : i < 14 ? Math.floor(40 + Math.random() * 50) : 0,
    annoProgress: annoDone,
    annoTotal,
    auditProgress: auditDone,
    auditTotal: annoDone,
    annoType,
    taskDesc: `${taskTypes[i % taskTypes.length]}场景数据标注`,
    creator: people[(i + 4) % people.length],
    createTime: `2026-0${3 + (i % 4)}-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(i * 3 % 60).padStart(2, '0')}:00`,
  };
});

export default function AnnotationAuditPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // Tab & Filters
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({});

  // Table Data & Selection
  const [tableData, setTableData] = useState(instanceMockData);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableDensity, setTableDensity] = useState('small');
  const [hiddenColumns, setHiddenColumns] = useState([]);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalTitle, setAssignModalTitle] = useState('重新分配');
  const [assignTargetKeys, setAssignTargetKeys] = useState([]);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    const saved = localStorage.getItem('embodied_anno_tasks');
    if (saved) {
      try {
        setTableData(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const persistData = (data) => {
    setTableData(data);
    localStorage.setItem('embodied_anno_tasks', JSON.stringify(data));
  };

  // Filtered List
  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      // Status Tab filter
      if (activeStatusTab === 'running' && item.taskStatus !== '进行中') return false;
      if (activeStatusTab === 'completed' && item.taskStatus !== '已完成') return false;
      if (activeStatusTab === 'paused' && item.taskStatus !== '暂停') return false;

      // Filter Bar filters
      const f = appliedFilters;
      if (f.project && (!item.project || !item.project.includes(f.project))) return false;
      if (f.taskbook && item.taskbook !== f.taskbook) return false;
      if (f.name && (!item.taskName || !item.taskName.toLowerCase().includes(f.name.toLowerCase()))) return false;
      if (f.taskId && !String(item.taskId).includes(f.taskId) && !String(item.instanceId).includes(f.taskId)) return false;
      if (f.annoType && item.annoType !== f.annoType) return false;
      if (f.taskStatus && item.taskStatus !== f.taskStatus) return false;
      if (f.annotator && item.annotator !== f.annotator) return false;
      if (f.auditor && item.auditor !== f.auditor) return false;

      return true;
    });
  }, [tableData, activeStatusTab, appliedFilters]);

  // Counts for Tabs
  const statusCounts = useMemo(() => {
    return {
      all: tableData.length,
      running: tableData.filter(t => t.taskStatus === '进行中').length,
      completed: tableData.filter(t => t.taskStatus === '已完成').length,
      paused: tableData.filter(t => t.taskStatus === '暂停').length,
    };
  }, [tableData]);

  // Single Reassign
  const handleReassign = (record) => {
    setAssignModalTitle('重新分配');
    setAssignTargetKeys([record.key]);
    assignForm.setFieldsValue({
      annotator: record.annotator && record.annotator !== '-' ? record.annotator : undefined,
      auditor: record.auditor && record.auditor !== '-' ? record.auditor : undefined,
    });
    setAssignModalOpen(true);
  };

  // Batch Assign
  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) return;
    setAssignModalTitle('批量分配');
    setAssignTargetKeys(selectedRowKeys);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = () => {
    assignForm.validateFields().then(values => {
      const updated = tableData.map(item => {
        if (assignTargetKeys.includes(item.key)) {
          return {
            ...item,
            annotator: values.annotator,
            auditor: values.auditor,
            annoTaskName: `${item.taskName || '任务'}_标注_${values.annotator}`,
          };
        }
        return item;
      });
      persistData(updated);
      message.success(assignModalTitle === '批量分配' ? `已成功批量分配 ${assignTargetKeys.length} 项任务！` : '人员分配成功！');
      setAssignModalOpen(false);
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除标注任务「${record.taskName}」(ID: ${record.annoId}) 吗？删除后不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        const updated = tableData.filter(item => item.key !== record.key);
        persistData(updated);
        setSelectedRowKeys(prev => prev.filter(k => k !== record.key));
        message.success(`已删除标注任务「${record.taskName}」`);
      }
    });
  };

  const handleExport = () => {
    message.success('正在导出标注任务列表数据...');
  };

  // Table Columns
  const columns = [
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 200,
      ellipsis: true,
      fixed: 'left',
    },
    {
      title: '任务书',
      dataIndex: 'taskbook',
      key: 'taskbook',
      width: 140,
      ellipsis: true,
    },
    {
      title: '标注ID',
      dataIndex: 'annoId',
      key: 'annoId',
      width: 80,
      align: 'center',
      render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 80,
      align: 'center',
      render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: '实例ID',
      dataIndex: 'instanceId',
      key: 'instanceId',
      width: 80,
      align: 'center',
      render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '标注任务名称',
      dataIndex: 'annoTaskName',
      key: 'annoTaskName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '数据量',
      dataIndex: 'dataCount',
      key: 'dataCount',
      width: 80,
      align: 'right',
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: '数据量(分钟)',
      dataIndex: 'dataMinutes',
      key: 'dataMinutes',
      width: 100,
      align: 'right',
      render: (v) => <span>{v} min</span>,
    },
    {
      title: '任务状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      width: 90,
      align: 'center',
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: '货架任务',
      dataIndex: 'isShelfTask',
      key: 'isShelfTask',
      width: 80,
      align: 'center',
      render: (v) => v === '是' ? <Tag color="orange">是</Tag> : <Text type="secondary">否</Text>,
    },
    {
      title: '行列号',
      dataIndex: 'rowCol',
      key: 'rowCol',
      width: 80,
      align: 'center',
    },
    {
      title: '设备SN',
      dataIndex: 'deviceSN',
      key: 'deviceSN',
      width: 120,
      align: 'center',
      render: (v) => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '质检员',
      dataIndex: 'qaer',
      key: 'qaer',
      width: 80,
      align: 'center',
    },
    {
      title: '标注员',
      dataIndex: 'annotator',
      key: 'annotator',
      width: 80,
      align: 'center',
    },
    {
      title: '审核员',
      dataIndex: 'auditor',
      key: 'auditor',
      width: 80,
      align: 'center',
    },
    {
      title: '采集员',
      dataIndex: 'collector',
      key: 'collector',
      width: 80,
      align: 'center',
    },
    {
      title: '质检进度',
      dataIndex: 'qaProgress',
      key: 'qaProgress',
      width: 110,
      align: 'center',
      render: (v) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={v === 100 ? '#52c41a' : '#1677ff'}
          style={{ margin: 0 }}
        />
      ),
    },
    {
      title: '标注进度(数量)',
      key: 'annoProgressBar',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <span style={{ fontFamily: 'monospace' }}>{r.annoProgress}/{r.annoTotal}</span>
      ),
    },
    {
      title: '审核进度(数量)',
      key: 'auditProgressBar',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <span style={{ fontFamily: 'monospace' }}>{r.auditProgress}/{r.auditTotal}</span>
      ),
    },
    {
      title: '标注类型',
      dataIndex: 'annoType',
      key: 'annoType',
      width: 110,
      align: 'center',
      render: (t) => <Tag color={annoTypeColors[t]} style={{ margin: 0 }}>{t}</Tag>,
    },
    {
      title: '任务描述',
      dataIndex: 'taskDesc',
      key: 'taskDesc',
      width: 160,
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 80,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            style={{ padding: 0 }}
            onClick={() => handleReassign(r)}
          >
            重新分配
          </Button>
          <Button
            type="link"
            size="small"
            icon={<LoginOutlined />}
            style={{ padding: 0, fontWeight: 600 }}
            onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditDetail, { id: r.instanceId }))}
          >
            进入
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="标注工作台"
          description="统一查看标注任务状态、作业进度与人员分配。"
          breadcrumbs={[{ title: '首页' }, { title: '任务管理' }, { title: '标注工作台' }]}
          extra={
            <Button 
              type="primary" 
              icon={<ThunderboltOutlined style={{ color: '#facc15' }} />}
              onClick={() => router.push('/annotation/long-video-workbench')}
              style={{ background: '#1e293b', borderColor: '#334155' }}
            >
              长视频循环标注交互方案演示 (3种)
            </Button>
          }
        />

        {/* 筛选栏 */}
        <FilterPanel>
          <QueryFilterBar
            onFinish={async (values) => {
              setAppliedFilters(values);
            }}
            onReset={() => {
              setAppliedFilters({});
            }}
          >
            <ProFormSelect name="project" label="一级项目" placeholder="请选择" options={projectNames.map(n => ({ label: n, value: n }))} />
            <ProFormSelect name="taskbook" label="任务书" placeholder="请选择" options={taskbooks.map(t => ({ label: t, value: t }))} />
            <ProFormText name="name" label="任务名称" placeholder="请输入" />
            <ProFormText name="taskId" label="任务ID/实例ID" placeholder="请输入" />
            <ProFormSelect name="annoType" label="标注类型" placeholder="请选择" options={ANNO_TYPES.map(t => ({ label: t, value: t }))} />
            <ProFormSelect name="taskStatus" label="任务状态" placeholder="请选择" options={TASK_STATUSES.map(s => ({ label: s, value: s }))} />
            <ProFormSelect name="annotator" label="标注员" placeholder="请选择" options={people.map(p => ({ label: p, value: p }))} />
            <ProFormSelect name="auditor" label="审核员" placeholder="请选择" options={people.map(p => ({ label: p, value: p }))} />
          </QueryFilterBar>
        </FilterPanel>

        {/* 标注列表 */}
        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          {/* Tab 栏 */}
          <Tabs
            activeKey={activeStatusTab}
            onChange={setActiveStatusTab}
            style={{ padding: '0 16px' }}
            items={[
              { key: 'all', label: `全部 (${statusCounts.all})` },
              { key: 'running', label: `进行中 (${statusCounts.running})` },
              { key: 'completed', label: `已完成 (${statusCounts.completed})` },
              { key: 'paused', label: `暂停 (${statusCounts.paused})` },
            ]}
          />

          <TableToolbar
            title="标注列表"
            count={filteredData.length}
            selectedCount={selectedRowKeys.length}
            actions={[
              <Button
                key="assign"
                icon={<UserOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchAssign}
              >
                批量分配 {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
              </Button>,
              <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>,
              <TableToolbarActions
                key="tableActions"
                columns={columns}
                density={tableDensity}
                onDensityChange={setTableDensity}
                hiddenColumns={hiddenColumns}
                onHiddenColumnsChange={setHiddenColumns}
                onRefresh={() => message.success('数据已刷新')}
              />
            ]}
          />

          {/* 表格 */}
          <Table
            rowSelection={rowSelection}
            columns={columns.filter(col => !hiddenColumns.includes(col.key))}
            dataSource={filteredData}
            scroll={{ x: 3200 }}
            size={tableDensity}
            pagination={{
              pageSize: 20,
              showTotal: (t) => `共 ${t} 条`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
        </Card>

        {/* 重新分配 / 批量分配 弹窗 */}
        <AppModal
          title={assignModalTitle}
          open={assignModalOpen}
          onCancel={() => setAssignModalOpen(false)}
          onOk={handleAssignSubmit}
          okText="确定"
          cancelText="取消"
          widthSize="small"
          forceRender
        >
          <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="annotator"
              label="标注员"
              rules={[{ required: true, message: '请选择标注员' }]}
            >
              <Select placeholder="请选择标注员">
                {people.map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="auditor"
              label="审核员"
              rules={[{ required: true, message: '请选择审核员' }]}
            >
              <Select placeholder="请选择审核员">
                {people.map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </AppModal>
      </div>
    </MainLayout>
  );
}
