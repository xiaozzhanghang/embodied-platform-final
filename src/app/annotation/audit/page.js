'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Progress, App, Row, Col, Tooltip, Badge, Modal, Form, Select, InputNumber, Tabs } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, LoginOutlined, DownloadOutlined, UserOutlined, ExportOutlined, PlusOutlined, FileAddOutlined, MinusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect, ProFormDateRangePicker } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
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

// 设备类型选项
const DEVICE_TYPES = ['galbot', '鹿鸣', '真机', '仿真机'];
// 采集模式选项
const COLLECTION_MODES = ['UMI', 'galbot', '标准采集'];
// 遥操类型选项
const REMOTE_CONTROL_TYPES = ['双设备', '单设备', '遥操'];

// 已采集未标注的数据源列表（关联自数据资产目录）
const collectedDataSources = [
  { 
    value: 'catalog_1', 
    label: '桌面书籍整理 (organize_books_on_the_table) [ID: 1b3e56c1b...] (银河 v2.1, 仿真数据)', 
    project: '银河 v2.1 仿真测试', 
    taskbook: 'TB-物品摆放', 
    taskName: '桌面书籍整理_仿真任务', 
    dataCount: 1255, 
    deviceType: '仿真机', 
    steps: [
      { arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近' },
      { arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧' },
      { arm: '右手 (Right Arm)', skill: '放置', object: '桌面', goal: '稳定释放' }
    ] 
  },
  { 
    value: 'catalog_2', 
    label: '鹿鸣双臂手眼协同动作采集 (session_028) [ID: session_028_6f8...] (鹿鸣 v1.0, 真实数据)', 
    project: '鹿鸣高频协同抓取', 
    taskbook: 'TB-餐盘整理', 
    taskName: '鹿鸣手眼协同采集_028', 
    dataCount: 15222, 
    deviceType: '鹿鸣', 
    steps: [
      { arm: '双手 (Dual Arms)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '双手 (Dual Arms)', skill: '靠近', object: '目标物品', goal: '避障靠近' },
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '目标物品', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '桌面', goal: '稳定释放' }
    ] 
  },
  { 
    value: 'catalog_3', 
    label: '鹿鸣双手臂动作标定测试 (session_029) [ID: session_029_6f8...] (鹿鸣 v1.0, 真实数据)', 
    project: '鹿鸣高频协同抓取', 
    taskbook: 'TB-餐盘整理', 
    taskName: '鹿鸣手臂标定测试_029', 
    dataCount: 11020, 
    deviceType: '鹿鸣', 
    steps: [
      { arm: '双手 (Dual Arms)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '双手 (Dual Arms)', skill: '旋转', object: '目标物品', goal: '扭转至角度' },
      { arm: '双手 (Dual Arms)', skill: '松开', object: '目标物品', goal: '稳定释放' }
    ] 
  },
  {
    value: 'catalog_4',
    label: '工业纸箱打包封装与装箱任务 (session_175_mov) [ID: session_175_box...] (galbot, 真实数据)',
    project: '垃圾分类抓取项目',
    taskbook: 'TB-物品摆放',
    taskName: '纸箱打包装箱_session_175',
    dataCount: 120,
    deviceType: 'galbot',
    steps: [
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '纸箱', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '泡沫填充纸', goal: '稳定释放' },
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '工厂部件', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '泡沫填充纸', goal: '稳定释放' },
      { arm: '双手 (Dual Arms)', skill: '对准', object: '纸箱', goal: '推拉合拢' },
      { arm: '双手 (Dual Arms)', skill: '对准', object: '胶带封装器', goal: '对齐插槽' }
    ]
  }
];

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
  const [activeStatusTab, setActiveStatusTab] = useState('all');
   const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { message } = App.useApp();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignRecord, setReassignRecord] = useState(null);
  const [reassignForm] = Form.useForm();
  
  const [tableData, setTableData] = useState(instanceMockData);

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

  useEffect(() => {
    localStorage.setItem('embodied_anno_tasks', JSON.stringify(tableData));
  }, [tableData]);

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
      setTableData(prev => prev.map(item => {
        if (item.key === reassignRecord.key) {
          return {
            ...item,
            annotator: values.annotator,
            auditor: values.auditor,
            taskStatus: item.annotator === '-' || values.annotator === '-' ? '待分配' : '进行中'
          };
        }
        return item;
      }));
      message.success(`人员分配成功！`);
      setReassignModalOpen(false);
    });
  };

  const filteredData = React.useMemo(() => {
    return tableData.filter(item => {
      // 状态页签过滤
      if (activeStatusTab === 'pending' && item.taskStatus !== '待分配') return false;
      if (activeStatusTab === 'running' && item.taskStatus !== '进行中') return false;
      if (activeStatusTab === 'completed' && item.taskStatus !== '已完成') return false;
      if (activeStatusTab === 'paused' && item.taskStatus !== '暂停') return false;

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
  }, [filters, tableData, activeStatusTab]);

  const handleCreateTask = () => {
    newTaskForm.validateFields().then(values => {
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const newId = 16800 + Math.floor(Math.random() * 100);
      const newTask = {
        key: `new_${Date.now()}`,
        project: values.project || '新建项目',
        taskbook: values.taskbook || '新任务书',
        annoId: newId,
        taskId: 21700 + Math.floor(Math.random() * 100),
        instanceId: 19800 + Math.floor(Math.random() * 100),
        taskName: values.taskName,
        taskNameEn: values.taskName,
        annoTaskName: `${values.taskName}_标注_${values.annotator || '待分配'}`,
        dataCount: values.dataCount || 120,
        dataMinutes: ((values.dataCount || 120) * 0.5 / 60).toFixed(1),
        taskStatus: '待分配',
        isShelfTask: '否',
        rowCol: 'R1C1',
        deviceSN: `SN-${Date.now().toString().slice(-6)}`,
        deviceType: values.deviceType || 'galbot',
        collectionMode: 'UMI',
        remoteControlType: '单设备',
        taskUsage: 'OfficialCollection(正式采集)',
        sceneCategory: '真实数据',
        subSceneCategory: 'UMI工业',
        qaer: values.qaer || '',
        annotator: values.annotator || '待分配',
        auditor: values.auditor || '待分配',
        collector: '',
        qaProgress: 0,
        annoProgress: 0,
        annoTotal: values.dataCount || 120,
        auditProgress: 0,
        auditTotal: 0,
        annoType: values.annoType,
        taskDesc: values.taskDesc || `${values.taskName}场景数据标注`,
        creator: '当前用户',
        createTime: timeStr,
      };
      setTableData(prev => [newTask, ...prev]);
      setIsNewTaskOpen(false);
      newTaskForm.resetFields();
      message.success(`✅ 已成功新建标注任务「${values.taskName}」`);
    }).catch(() => message.warning('请补充必填项'));
  };

  const handleSourceChange = (value) => {
    const selectedSource = collectedDataSources.find(s => s.value === value);
    if (selectedSource) {
      newTaskForm.setFieldsValue({
        taskName: selectedSource.taskName,
        project: selectedSource.project,
        taskbook: selectedSource.taskbook,
        dataCount: selectedSource.dataCount,
        deviceType: selectedSource.deviceType,
        steps: selectedSource.steps || [],
      });
    }
  };

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
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => handleReassign(r)}>重新分配</Button>
          <Button type="link" size="small" icon={<LoginOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/annotation/audit/${r.instanceId}`)}>进入</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} style={{ padding: 0 }} onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: `确定要删除标注任务「${r.taskName}」(ID: ${r.annoId}) 吗？删除后不可恢复。`,
              okText: '确定删除',
              okType: 'danger',
              cancelText: '取消',
              onOk() {
                setTableData(prev => prev.filter(item => item.key !== r.key));
                message.success(`已删除标注任务「${r.taskName}」`);
              }
            });
          }}>删除</Button>
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
        <Breadcrumb items={[{ title: '数据采集' }, { title: '标注工作台' }]} style={{ marginBottom: 16 }} />
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
        title={<span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>标注列表</span>}
        tabList={[
          { key: 'all', tab: `全部 (${tableData.length})` },
          { key: 'running', tab: `进行中 (${tableData.filter(t => t.taskStatus === '进行中').length})` },
          { key: 'completed', tab: `已完成 (${tableData.filter(t => t.taskStatus === '已完成').length})` },
          { key: 'paused', tab: `暂停 (${tableData.filter(t => t.taskStatus === '暂停').length})` }
        ]}
        activeTabKey={activeStatusTab}
        onTabChange={(key) => setActiveStatusTab(key)}
        extra={
          <Space style={{ padding: '6px 0' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => router.push('/annotation/audit/create')}
              style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
            >
              新建标注任务
            </Button>
            <Button icon={<UserOutlined />} disabled={selectedRowKeys.length === 0} onClick={() => message.info(`已选 ${selectedRowKeys.length} 条，批量分配`)}>
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
