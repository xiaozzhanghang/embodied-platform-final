'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Progress, App, Row, Col, Tooltip, Badge, Modal, Form, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, LoginOutlined, DownloadOutlined, UserOutlined, ExportOutlined, CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect, ProFormDateRangePicker } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
const { Option } = Select;

const ANNO_TYPES = ['框标注', '点标注', '范围标注', '范围&框标注'];
const QC_STATUSES = ['待质检', '质检中', '已通过', '未通过'];

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

const instanceMockData = Array.from({ length: 20 }).map((_, i) => {
  const dataCount = [186, 240, 312, 156, 420, 198, 88, 520, 164, 276][i % 10];
  const annoType = ANNO_TYPES[i % 4];
  // QC statuses: first few are 已通过, then mix
  const qcStatus = i < 4 ? '已通过' : i < 8 ? '质检中' : i < 14 ? '待质检' : i % 3 === 0 ? '未通过' : '待质检';
  const qcPassCount = qcStatus === '已通过' ? dataCount : qcStatus === '质检中' ? Math.floor(dataCount * 0.6) : qcStatus === '未通过' ? Math.floor(dataCount * 0.8) : 0;
  const qcFailCount = qcStatus === '未通过' ? Math.floor(dataCount * 0.2) : qcStatus === '质检中' ? Math.floor(dataCount * 0.1) : 0;
  const deviceType = DEVICE_TYPES[i % DEVICE_TYPES.length];

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
    qcStatus,
    isShelfTask: i % 3 === 0 ? '是' : '否',
    rowCol: `R${Math.floor(i / 4) + 1}C${(i % 4) + 1}`,
    deviceSN: `SN-${String(2024001 + i)}`,
    deviceType,
    qaer: people[(i + 1) % people.length],
    annotator: people[i % people.length],
    auditor: people[(i + 2) % people.length],
    collector: people[(i + 3) % people.length],
    qcPassCount,
    qcFailCount,
    qcTotal: dataCount,
    qcProgress: qcStatus === '已通过' ? 100 : qcStatus === '质检中' ? Math.floor(60 + Math.random() * 30) : qcStatus === '未通过' ? 100 : 0,
    annoType,
    taskDesc: `${taskTypes[i % taskTypes.length]}场景数据质检`,
    creator: people[(i + 4) % people.length],
    createTime: `2026-0${3 + (i % 4)}-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(i * 3 % 60).padStart(2, '0')}:00`,
  };
});

export default function QaPage() {
  const router = useRouter();
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { message } = App.useApp();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignRecord, setReassignRecord] = useState(null);
  const [reassignForm] = Form.useForm();

  const [tableData, setTableData] = useState(instanceMockData);

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
      message.success(`质检员分配成功！`);
      setReassignModalOpen(false);
    });
  };

  const filteredData = React.useMemo(() => {
    return tableData.filter(item => {
      // 状态页签过滤
      if (activeStatusTab === 'pending' && item.qcStatus !== '待质检') return false;
      if (activeStatusTab === 'checking' && item.qcStatus !== '质检中') return false;
      if (activeStatusTab === 'passed' && item.qcStatus !== '已通过') return false;
      if (activeStatusTab === 'failed' && item.qcStatus !== '未通过') return false;

      const projectMatch = !filters.project || item.project.includes(filters.project);
      const taskbookMatch = !filters.taskbook || item.taskbook === filters.taskbook;
      const nameMatch = !filters.name || item.taskName.includes(filters.name);
      const idMatch = !filters.taskId || String(item.taskId).includes(filters.taskId) || String(item.instanceId).includes(filters.taskId);
      const typeMatch = !filters.annoType || item.annoType === filters.annoType;
      const statusMatch = !filters.qcStatus || item.qcStatus === filters.qcStatus;
      const qaerMatch = !filters.qaer || item.qaer === filters.qaer;
      return projectMatch && taskbookMatch && nameMatch && idMatch && typeMatch && statusMatch && qaerMatch;
    });
  }, [filters, tableData, activeStatusTab]);

  const qcStatusColors = {
    '待质检': 'default',
    '质检中': 'processing',
    '已通过': 'success',
    '未通过': 'error',
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
      title: '质检状态', dataIndex: 'qcStatus', width: 100, align: 'center',
      render: (s) => <Badge status={qcStatusColors[s]} text={s} />
    },
    { title: '货架任务', dataIndex: 'isShelfTask', width: 80, align: 'center', render: (v) => v === '是' ? <Tag color="orange">是</Tag> : <Text type="secondary">否</Text> },
    { title: '行列号', dataIndex: 'rowCol', width: 80, align: 'center' },
    { title: '设备SN', dataIndex: 'deviceSN', width: 120, render: (v) => <Text copyable={{ text: v }} style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text> },
    { title: '质检员', dataIndex: 'qaer', width: 80 },
    { title: '标注员', dataIndex: 'annotator', width: 80 },
    { title: '审核员', dataIndex: 'auditor', width: 80 },
    { title: '采集员', dataIndex: 'collector', width: 80 },
    {
      title: '质检进度', key: 'qcProgressBar', width: 120, align: 'center',
      render: (_, r) => <Progress percent={r.qcProgress} size="small" strokeColor={r.qcProgress === 100 ? '#52c41a' : '#1677ff'} style={{ margin: 0 }} />
    },
    {
      title: '通过/不通过', key: 'qcResult', width: 120, align: 'center',
      render: (_, r) => (
        <Space size={4}>
          <Text style={{ color: '#52c41a', fontFamily: 'monospace' }}>{r.qcPassCount}</Text>
          <Text type="secondary">/</Text>
          <Text style={{ color: '#ff4d4f', fontFamily: 'monospace' }}>{r.qcFailCount}</Text>
        </Space>
      )
    },
    {
      title: '标注类型', dataIndex: 'annoType', width: 110, align: 'center',
      render: (t) => <Tag color={annoTypeColors[t]} style={{ margin: 0 }}>{t}</Tag>
    },
    { title: '任务描述', dataIndex: 'taskDesc', width: 160, ellipsis: true },
    { title: '创建人', dataIndex: 'creator', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => handleReassign(r)}>分配质检员</Button>
          <Button type="link" size="small" icon={<LoginOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/qa/${r.instanceId}`)}>进入</Button>
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
        <Breadcrumb items={[{ title: '任务管理' }, { title: '数据质检' }]} style={{ marginBottom: 16 }} />
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
          <ProFormSelect name="qcStatus" label="质检状态" placeholder="请选择" options={QC_STATUSES.map(s => ({ label: s, value: s }))} />
          <ProFormSelect name="qaer" label="质检员" placeholder="请选择" options={people.map(p => ({ label: p, value: p }))} />
        </QueryFilter>
      </Card>

      {/* Table Section */}
      <Card 
        title={<span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>质检列表</span>}
        tabList={[
          { key: 'all', tab: `全部 (${tableData.length})` },
          { key: 'pending', tab: `待质检 (${tableData.filter(t => t.qcStatus === '待质检').length})` },
          { key: 'checking', tab: `质检中 (${tableData.filter(t => t.qcStatus === '质检中').length})` },
          { key: 'passed', tab: `已通过 (${tableData.filter(t => t.qcStatus === '已通过').length})` },
          { key: 'failed', tab: `未通过 (${tableData.filter(t => t.qcStatus === '未通过').length})` },
        ]}
        activeTabKey={activeStatusTab}
        onTabChange={(key) => setActiveStatusTab(key)}
        extra={
          <Space style={{ padding: '6px 0' }}>
            <Button icon={<UserOutlined />} disabled={selectedRowKeys.length === 0} onClick={() => message.info(`已选 ${selectedRowKeys.length} 条，批量分配质检员`)}>
              批量分配 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('正在导出...')}>导出</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }} 
        style={{ borderRadius: 8 }}
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

      {/* 分配质检员弹窗 */}
      <Modal
        title="分配质检员"
        open={reassignModalOpen}
        onCancel={() => setReassignModalOpen(false)}
        onOk={handleReassignSubmit}
        okText="确定"
        cancelText="取消"
      >
        <Form form={reassignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="qaer"
            label="质检员"
            rules={[{ required: true, message: '请选择质检员' }]}
          >
            <Select placeholder="请选择质检员">
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
