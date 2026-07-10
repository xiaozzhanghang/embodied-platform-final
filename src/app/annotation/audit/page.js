'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Progress, App, Row, Col, Tooltip, Badge, Modal, Form, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, LoginOutlined, DownloadOutlined, UserOutlined, ExportOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect, ProFormDateRangePicker } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const ANNO_TYPES = ['框标注', '点标注', '范围标注', '范围&框标注'];
const TASK_STATUSES = ['进行中', '已完成', '待分配', '暂停'];

const projectNames = [
  'SimulatedCollection(模拟采集) sin',
  '天奇-餐盘整理任务',
  '垃圾分类抓取项目',
  'Galbot-厨房场景',
];
const taskbooks = ['TB-抓取红色方块', 'TB-餐盘整理', 'TB-垃圾分类', 'TB-物品摆放'];
const taskTypes = ['垃圾清理', '餐盘整理', '物品搬运', '工具使用'];
const people = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

// 设备类型选项
const DEVICE_TYPES = ['galbot', '鹿鸣', '真机', '仿真机'];
// 采集模式选项
const COLLECTION_MODES = ['UMI', 'galbot', '标准采集'];
// 遥操类型选项
const REMOTE_CONTROL_TYPES = ['双设备', '单设备', '遥操'];

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
  const taskStatus = i < 3 ? '已完成' : i < 12 ? '进行中' : i < 16 ? '待分配' : '暂停';
  const deviceType = DEVICE_TYPES[i % DEVICE_TYPES.length];
  const collectionMode = COLLECTION_MODES[i % COLLECTION_MODES.length];
  const remoteControlType = REMOTE_CONTROL_TYPES[i % REMOTE_CONTROL_TYPES.length];

  return {
    key: i,
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
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { message } = App.useApp();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignRecord, setReassignRecord] = useState(null);
  const [reassignForm] = Form.useForm();

  const handleReassign = (record) => {
    setReassignRecord(record);
    reassignForm.setFieldsValue({
      annotator: record.annotator,
      auditor: record.auditor,
    });
    setReassignModalOpen(true);
  };

  const handleReassignSubmit = () => {
    reassignForm.validateFields().then(values => {
      message.success(`已将「${values.annotator}」分配为标注员，「${values.auditor}」分配为审核员`);
      setReassignModalOpen(false);
    });
  };

  const filteredData = React.useMemo(() => {
    return instanceMockData.filter(item => {
      const projectMatch = !filters.project || item.project.includes(filters.project);
      const taskbookMatch = !filters.taskbook || item.taskbook === filters.taskbook;
      const nameMatch = !filters.name || item.taskName.includes(filters.name);
      const idMatch = !filters.taskId || String(item.taskId).includes(filters.taskId) || String(item.instanceId).includes(filters.taskId);
      const typeMatch = !filters.annoType || item.annoType === filters.annoType;
      const statusMatch = !filters.taskStatus || item.taskStatus === filters.taskStatus;
      const annotatorMatch = !filters.annotator || item.annotator === filters.annotator;
      const auditorMatch = !filters.auditor || item.auditor === filters.auditor;
      return projectMatch && taskbookMatch && nameMatch && idMatch && typeMatch && statusMatch && annotatorMatch && auditorMatch;
    });
  }, [filters]);

  const statusColors = {
    '进行中': 'processing',
    '已完成': 'success',
    '待分配': 'warning',
    '暂停': 'default',
  };

  const annoTypeColors = {
    '框标注': 'green',
    '点标注': 'blue',
    '范围标注': 'purple',
    '范围&框标注': 'magenta',
  };

  const columns = [
    { title: '项目', dataIndex: 'project', key: 'project', width: 200, ellipsis: true, fixed: 'left' },
    { title: '任务书', dataIndex: 'taskbook', key: 'taskbook', width: 140, ellipsis: true },
    { title: '标注ID', dataIndex: 'annoId', key: 'annoId', width: 80, render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text> },
    { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 80, render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text> },
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 80, render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text> },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 180, ellipsis: true },
    { title: '标注任务名称', dataIndex: 'annoTaskName', width: 180, ellipsis: true },
    { title: '数据量', dataIndex: 'dataCount', width: 70, align: 'right', render: (v) => <Text strong>{v}</Text> },
    { title: '数据量(分钟)', dataIndex: 'dataMinutes', width: 100, align: 'right', render: (v) => `${v} min` },
    {
      title: '任务状态', dataIndex: 'taskStatus', width: 90, align: 'center',
      render: (s) => <Badge status={statusColors[s]} text={s} />
    },
    { title: '货架任务', dataIndex: 'isShelfTask', width: 80, align: 'center', render: (v) => v === '是' ? <Tag color="orange">是</Tag> : <Text type="secondary">否</Text> },
    { title: '行列号', dataIndex: 'rowCol', width: 80, align: 'center' },
    { title: '设备SN', dataIndex: 'deviceSN', width: 120, render: (v) => <Text copyable={{ text: v }} style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text> },
    { title: '质检员', dataIndex: 'qaer', width: 80 },
    { title: '标注员', dataIndex: 'annotator', width: 80 },
    { title: '审核员', dataIndex: 'auditor', width: 80 },
    { title: '采集员', dataIndex: 'collector', width: 80 },
    {
      title: '质检进度', dataIndex: 'qaProgress', width: 100, align: 'center',
      render: (v) => <Progress percent={v} size="small" strokeColor={v === 100 ? '#52c41a' : '#1677ff'} style={{ margin: 0 }} />
    },
    {
      title: '标注进度(数量)', key: 'annoProgressBar', width: 100, align: 'center',
      render: (_, r) => <Text style={{ fontFamily: 'monospace' }}>{r.annoProgress}/{r.annoTotal}</Text>
    },
    {
      title: '审核进度(数量)', key: 'auditProgressBar', width: 100, align: 'center',
      render: (_, r) => <Text style={{ fontFamily: 'monospace' }}>{r.auditProgress}/{r.auditTotal}</Text>
    },
    {
      title: '标注类型', dataIndex: 'annoType', width: 110, align: 'center',
      render: (t) => <Tag color={annoTypeColors[t]} style={{ margin: 0 }}>{t}</Tag>
    },
    { title: '任务描述', dataIndex: 'taskDesc', width: 160, ellipsis: true },
    { title: '创建人', dataIndex: 'creator', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => handleReassign(r)}>重新分配</Button>
          <Button type="link" size="small" icon={<LoginOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/annotation/audit/${r.instanceId}`)}>进入</Button>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: '数据采集' }, { title: '标注审核' }]} style={{ marginBottom: 16 }} />
      </div>

      <Card 
        style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
        styles={{ body: { padding: '24px 24px 16px' } }}
      >
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
          <ProFormSelect name="project" label="一级项目" placeholder="请选择" options={projectNames.map(n => ({ label: n, value: n }))} />
          <ProFormSelect name="taskbook" label="任务书" placeholder="请选择" options={taskbooks.map(n => ({ label: n, value: n }))} />
          <ProFormText name="name" label="任务名称" placeholder="请输入" />
          <ProFormText name="taskId" label="任务ID/实例ID" placeholder="请输入" />
          <ProFormSelect name="annoType" label="标注类型" placeholder="请选择" options={ANNO_TYPES.map(t => ({ label: t, value: t }))} />
          <ProFormSelect name="taskStatus" label="任务状态" placeholder="请选择" options={TASK_STATUSES.map(s => ({ label: s, value: s }))} />
          <ProFormSelect name="annotator" label="标注员" placeholder="请选择" options={people.map(p => ({ label: p, value: p }))} />
          <ProFormSelect name="auditor" label="审核员" placeholder="请选择" options={people.map(p => ({ label: p, value: p }))} />
        </QueryFilter>
      </Card>

      {/* Table Section */}
      <Card 
        title={
          <Space>
            <Text strong style={{ fontSize: 15 }}>审核任务列表</Text>
            <Tag>{filteredData.length} 条记录</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<UserOutlined />} disabled={selectedRowKeys.length === 0} onClick={() => message.info(`已选 ${selectedRowKeys.length} 条，批量分配`)}>
              批量分配 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('正在导出...')}>导出</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }} 
        style={{ borderRadius: 4 }}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 3200 }}
          size="small"
          pagination={{
            pageSize: 20,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 重新分配弹窗 */}
      <Modal
        title="重新分配"
        open={reassignModalOpen}
        onCancel={() => setReassignModalOpen(false)}
        onOk={handleReassignSubmit}
        okText="确定"
        cancelText="取消"
      >
        <Form form={reassignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="annotator"
            label="标注员"
            rules={[{ required: true, message: '请选择标注员' }]}
          >
            <Select placeholder="请选择标注员">
              {people.map(p => (
                <Select.Option key={p} value={p}>{p}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="auditor"
            label="审核员"
            rules={[{ required: true, message: '请选择审核员' }]}
          >
            <Select placeholder="请选择审核员">
              {people.map(p => (
                <Select.Option key={p} value={p}>{p}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
