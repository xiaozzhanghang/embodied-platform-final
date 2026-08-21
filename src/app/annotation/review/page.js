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
  Input,
  Tabs,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
  UserOutlined,
  DownloadOutlined,
  EditOutlined,
  LoginOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { AppModal, StatusTag, TableToolbarActions } from '@/components/ui';
import { buildStaticHref } from '@/lib/staticRoutes';

const { Text } = Typography;

const ANNO_TYPES = ['框标注', '点标注', '范围标注', '范围&框标注'];
const projectNames = [
  'SimulatedCollection(模拟采集) sin',
  '天奇-餐盘整理任务',
  '垃圾分类抓取项目',
  'Galbot-厨房场景',
];
const taskbooks = ['TB-抓取红色方块', 'TB-餐盘整理', 'TB-垃圾分类', 'TB-物品摆放'];
const taskTypes = ['垃圾清理', '餐盘整理', '物品搬运', '工具使用'];
const people = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '天奇管理员'];

const instanceMockData = Array.from({ length: 20 }).map((_, i) => {
  const dataCount = [186, 240, 312, 156, 420, 198, 88, 520, 164, 276][i % 10];
  const annoType = ANNO_TYPES[i % 4];
  const taskStatus = i < 4 ? '已完成' : i < 16 ? '进行中' : '暂停';

  return {
    key: String(i + 1),
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
    annoType,
    qaer: people[(i + 1) % people.length],
    annotator: people[i % people.length],
    auditor: people[(i + 2) % people.length],
    createTime: `2026-0${3 + (i % 4)}-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(i * 3 % 60).padStart(2, '0')}:00`,
  };
});

export default function ReviewPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // Search filter states
  const [firstLevel, setFirstLevel] = useState();
  const [taskbook, setTaskbook] = useState();
  const [taskNameInput, setTaskNameInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [annoIdInput, setAnnoIdInput] = useState('');
  const [taskIdInput, setTaskIdInput] = useState('');
  const [annotatorSelect, setAnnotatorSelect] = useState();
  const [auditorSelect, setAuditorSelect] = useState();

  // Active query applied
  const [appliedFilters, setAppliedFilters] = useState({});

  // Tabs
  const [activeTab, setActiveTab] = useState('all');

  // Selection & Modal states
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableDensity, setTableDensity] = useState('middle');
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [tableData, setTableData] = useState(instanceMockData);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalTitle, setAssignModalTitle] = useState('重新分配');
  const [assignTargetKeys, setAssignTargetKeys] = useState([]);
  const [assignForm] = Form.useForm();

  // Tab counts
  const allCount = tableData.length;
  const runningCount = tableData.filter(t => t.taskStatus === '进行中').length;
  const completedCount = tableData.filter(t => t.taskStatus === '已完成').length;
  const pausedCount = tableData.filter(t => t.taskStatus === '暂停').length;

  const tabItems = [
    { key: 'all', label: `全部 (${allCount})` },
    { key: 'running', label: `进行中 (${runningCount})` },
    { key: 'completed', label: `已完成 (${completedCount})` },
    { key: 'paused', label: `暂停 (${pausedCount})` },
  ];

  const handleSearch = () => {
    setAppliedFilters({
      firstLevel,
      taskbook,
      taskName: taskNameInput,
      annoId: annoIdInput,
      taskId: taskIdInput,
      annotator: annotatorSelect,
      auditor: auditorSelect,
    });
  };

  const handleReset = () => {
    setFirstLevel(undefined);
    setTaskbook(undefined);
    setTaskNameInput('');
    setAnnoIdInput('');
    setTaskIdInput('');
    setAnnotatorSelect(undefined);
    setAuditorSelect(undefined);
    setAppliedFilters({});
  };

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      if (activeTab === 'running' && item.taskStatus !== '进行中') return false;
      if (activeTab === 'completed' && item.taskStatus !== '已完成') return false;
      if (activeTab === 'paused' && item.taskStatus !== '暂停') return false;

      const f = appliedFilters;
      if (f.firstLevel && item.project !== f.firstLevel) return false;
      if (f.taskbook && item.taskbook !== f.taskbook) return false;
      if (f.taskName && !item.taskName.includes(f.taskName)) return false;
      if (f.annoId && !String(item.annoId).includes(f.annoId)) return false;
      if (f.taskId && !String(item.taskId).includes(f.taskId)) return false;
      if (f.annotator && item.annotator !== f.annotator) return false;
      if (f.auditor && item.auditor !== f.auditor) return false;

      return true;
    });
  }, [tableData, activeTab, appliedFilters]);

  const handleReassign = (record) => {
    setAssignModalTitle('重新分配');
    setAssignTargetKeys([record.key]);
    assignForm.setFieldsValue({
      annotator: record.annotator,
      auditor: record.auditor,
    });
    setAssignModalOpen(true);
  };

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) return;
    setAssignModalTitle('批量分配');
    setAssignTargetKeys(selectedRowKeys);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = () => {
    assignForm.validateFields().then(values => {
      setTableData(prev => prev.map(item => {
        if (assignTargetKeys.includes(item.key)) {
          return {
            ...item,
            annotator: values.annotator || item.annotator,
            auditor: values.auditor || item.auditor,
          };
        }
        return item;
      }));
      message.success('人员分配成功！');
      setAssignModalOpen(false);
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除任务「${record.taskName}」(ID: ${record.annoId}) 吗？删除后不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setTableData(prev => prev.filter(item => item.key !== record.key));
        setSelectedRowKeys(prev => prev.filter(k => k !== record.key));
        message.success(`已删除任务「${record.taskName}」`);
      }
    });
  };

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
      width: 90,
      render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 90,
      render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: '实例ID',
      dataIndex: 'instanceId',
      key: 'instanceId',
      width: 90,
      render: (t) => <Text style={{ color: '#1677ff', fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '标注任务名称',
      dataIndex: 'annoTaskName',
      key: 'annoTaskName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '数据量',
      dataIndex: 'dataCount',
      key: 'dataCount',
      width: 90,
      align: 'right',
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: '数据量(分钟)',
      dataIndex: 'dataMinutes',
      key: 'dataMinutes',
      width: 110,
      align: 'right',
      render: (v) => `${v} min`,
    },
    {
      title: '标注员',
      dataIndex: 'annotator',
      key: 'annotator',
      width: 90,
      align: 'center',
    },
    {
      title: '审核员',
      dataIndex: 'auditor',
      key: 'auditor',
      width: 100,
      align: 'center',
      render: (a) => <Tag color="cyan">{a}</Tag>
    },
    {
      title: '任务状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      width: 100,
      align: 'center',
      render: (s) => <StatusTag status={s} />,
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
            onClick={() => router.push(buildStaticHref('/annotation/review-list', {
              instanceId: r.instanceId,
              taskName: r.taskName,
            }))}
          >
            进入
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '16px 20px', background: '#f5f7fa', minHeight: '100vh' }}>
        {/* Filter Card */}
        <Card style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #eef0f4' }} styles={{ body: { padding: '16px 20px' } }}>
          <Row gutter={[16, 12]} align="middle">
            <Col flex="240px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>一级项目：</span>
                <Select
                  allowClear
                  placeholder="请选择"
                  style={{ width: 150 }}
                  value={firstLevel}
                  onChange={setFirstLevel}
                  options={projectNames.map(p => ({ label: p, value: p }))}
                />
              </div>
            </Col>

            <Col flex="240px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>任务书：</span>
                <Select
                  allowClear
                  placeholder="请选择"
                  style={{ width: 150 }}
                  value={taskbook}
                  onChange={setTaskbook}
                  options={taskbooks.map(t => ({ label: t, value: t }))}
                />
              </div>
            </Col>

            <Col flex="260px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>任务名称：</span>
                <Input
                  allowClear
                  placeholder="请输入"
                  style={{ width: 170 }}
                  value={taskNameInput}
                  onChange={e => setTaskNameInput(e.target.value)}
                />
              </div>
            </Col>

            <Col>
              <Space size={8}>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  查询
                </Button>
                <Button
                  type="link"
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{ padding: 0, fontSize: 13 }}
                >
                  {isExpanded ? <span>收起 <UpOutlined /></span> : <span>展开(5) <DownOutlined /></span>}
                </Button>
              </Space>
            </Col>
          </Row>

          {isExpanded && (
            <Row gutter={[16, 12]} align="middle" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #eef0f4' }}>
              <Col span={6}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>标注ID：</span>
                  <Input placeholder="请输入标注ID" value={annoIdInput} onChange={e => setAnnoIdInput(e.target.value)} style={{ width: '100%' }} />
                </div>
              </Col>
              <Col span={6}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>任务ID：</span>
                  <Input placeholder="请输入任务ID" value={taskIdInput} onChange={e => setTaskIdInput(e.target.value)} style={{ width: '100%' }} />
                </div>
              </Col>
              <Col span={6}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>标注员：</span>
                  <Select allowClear placeholder="请选择标注员" value={annotatorSelect} onChange={setAnnotatorSelect} style={{ width: '100%' }} options={people.map(p => ({ label: p, value: p }))} />
                </div>
              </Col>
              <Col span={6}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>审核员：</span>
                  <Select allowClear placeholder="请选择审核员" value={auditorSelect} onChange={setAuditorSelect} style={{ width: '100%' }} options={people.map(p => ({ label: p, value: p }))} />
                </div>
              </Col>
            </Row>
          )}
        </Card>

        {/* Table Card */}
        <Card style={{ borderRadius: 8, border: '1px solid #eef0f4' }} styles={{ body: { padding: 0 } }}>
          {/* Tabs */}
          <div style={{ padding: '0 20px', borderBottom: '1px solid #f0f0f0' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ marginBottom: -1 }}
              items={tabItems}
            />
          </div>

          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f1f1f' }}>
              审核列表 <span style={{ fontSize: 13, fontWeight: 400, color: '#8c8c8c' }}>共 {filteredData.length} 项</span>
            </div>
            <Space size={12}>
              <Button
                icon={<UserOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchAssign}
              >
                批量分配 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => message.success('正在导出审核列表数据...')}
              >
                导出
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

          {/* Table */}
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            columns={columns.filter(col => !hiddenColumns.includes(col.key))}
            dataSource={filteredData}
            scroll={{ x: 1700 }}
            size={tableDensity}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 项数据`,
            }}
          />
        </Card>

        {/* 批量 / 重新分配 Modal */}
        <AppModal
          title={assignModalTitle}
          open={assignModalOpen}
          onCancel={() => setAssignModalOpen(false)}
          onOk={handleAssignSubmit}
          okText="确定"
          cancelText="取消"
        >
          <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="annotator" label="指定标注员">
              <Select placeholder="请选择标注员" allowClear>
                {people.map(p => (
                  <Select.Option key={p} value={p}>{p}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="auditor" label="指定审核员">
              <Select placeholder="请选择审核员" allowClear>
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
