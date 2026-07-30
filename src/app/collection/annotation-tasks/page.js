'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Card, Typography, 
  Breadcrumb, Tabs, Tooltip, App, Modal, Checkbox, 
  Row, Col, Dropdown, Divider, Switch, Select, Form
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined,
  SettingOutlined, ColumnHeightOutlined, CopyOutlined, EditOutlined, 
  DeleteOutlined, EyeOutlined, TagsOutlined, 
  NodeIndexOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  FormOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Text } = Typography;

export default function AnnotationTasksPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  
  const [selectedTypes, setSelectedTypes] = useState(['point']);

  const mockData = [
    { 
      key: '1', 
      taskId: 'ANNO-20260415-001', 
      sourceTask: 'COLL-20260415-001 (采集完成)',
      taskName: '工业纸箱打包封装标注任务', 
      taskNameEn: 'IndustrialPackingAnnotation',
      taskBookName: '线缆管理标注规范 V2.0',
      firstLevel: 'InternalIndustrial',
      secondLevel: 'Industrial_A1',
      sceneCategory: 'FactoryFloor',
      subSceneCategory: 'PackingLine',
      totalCount: 100,
      finishCount: 75,
      createBy: 'admin',
      createTime: '2026-04-12 10:00:00',
      updateTime: '2026-04-14 11:20:00',
      progress: '75%',
      status: '进行中', 
    },
    { 
      key: '2', 
      taskId: 'ANNO-20260415-002', 
      sourceTask: 'COLL-20260415-002 (采集完成)',
      taskName: '货架物品多视角3D框标注任务', 
      taskNameEn: 'ShelfObject3DBox',
      taskBookName: '货架物体3D标注规范 V1.5',
      firstLevel: 'InternalCommercial',
      secondLevel: 'GroceryVLA',
      sceneCategory: 'Supermarket',
      subSceneCategory: 'ShelfArea',
      totalCount: 500,
      finishCount: 500,
      createBy: 'ingest_user',
      createTime: '2026-04-10 14:00:00',
      updateTime: '2026-04-15 09:30:00',
      progress: '100%',
      status: '已完成', 
    },
    { 
      key: '3', 
      taskId: 'ANNO-20260416-003', 
      sourceTask: 'COLL-20260416-003 (采集完成)',
      taskName: '桌面整理轨迹关键点标注任务', 
      taskNameEn: 'TabletopTrajectoryPoints',
      taskBookName: '桌面整理标注规范 V1.0',
      firstLevel: 'SimulatedCollection',
      secondLevel: 'FoundationModel',
      sceneCategory: 'LivingRoom',
      subSceneCategory: 'DiningTable',
      totalCount: 300,
      finishCount: 120,
      createBy: 'zhangsan',
      createTime: '2026-04-16 09:00:00',
      updateTime: '2026-04-17 16:45:00',
      progress: '40%',
      status: '进行中', 
    },
  ];

  const columns = [
    { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 170, fixed: 'left' },
    { 
      title: '标注任务名称', 
      dataIndex: 'taskName', 
      key: 'taskName', 
      width: 220, 
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>
    },
    { title: '来源采集任务', dataIndex: 'sourceTask', key: 'sourceTask', width: 220, render: (t) => <Tag color="blue">{t}</Tag> },
    { title: '英文名称', dataIndex: 'taskNameEn', key: 'taskNameEn', width: 180, ellipsis: true },
    { title: '任务书', dataIndex: 'taskBookName', key: 'taskBookName', width: 190, ellipsis: true },
    { title: '一级项目', dataIndex: 'firstLevel', key: 'firstLevel', width: 150, ellipsis: true },
    { title: '二级项目', dataIndex: 'secondLevel', key: 'secondLevel', width: 140, ellipsis: true },
    { title: '场景分类', dataIndex: 'sceneCategory', key: 'sceneCategory', width: 130 },
    { title: '计划标注数', dataIndex: 'totalCount', key: 'totalCount', width: 100 },
    { title: '已完成标注', dataIndex: 'finishCount', key: 'finishCount', width: 100 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (s) => <Tag color={s === '已完成' ? 'success' : 'processing'}>{s}</Tag>
    },
    { title: '创建人', dataIndex: 'createBy', key: 'createBy', width: 120 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170, ellipsis: true },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170, ellipsis: true },
    { 
      title: '进度', 
      dataIndex: 'progress', 
      key: 'progress', 
      width: 90,
      fixed: 'right',
      render: (p) => <Tag color="cyan">{p}</Tag>
    },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right', align: 'center',
      render: (_, record) => (
        <Space separator={<Divider orientation="vertical" />} size={0}>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => router.push(`/collection/tasks/${record.taskId}?type=asset`)} 
            style={{ padding: '0 4px', fontWeight: 600 }}
          >
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => router.push(`/collection/tasks/create?mode=edit&taskId=${record.taskId}`)} style={{ padding: '0 4px' }}>编辑</Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => router.push(`/collection/tasks/create?mode=copy&taskId=${record.taskId}`)} style={{ padding: '0 4px' }}>复制</Button>
          <Button type="link" size="small" icon={<DeleteOutlined />} danger style={{ padding: '0 4px' }} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}>删除</Button>
        </Space>
      )
    },
  ];

  const filteredData = mockData.filter(item => {
    if (activeTab === 'doing') return item.status === '进行中';
    if (activeTab === 'done') return item.status === '已完成';
    return true;
  });

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '任务中心' }, { title: '标注任务' }]} style={{ marginBottom: 16 }} />
      </div>

      <SpecMarker
        id="annotation-tasks-query"
        number={1}
        title="标注任务检索与筛选"
        rules={[
          "支持按一级项目、二级项目、标注类型、任务书、任务名称及标注员/审核员多维度筛选。",
          "一键重置筛选条件并更新表格数据。"
        ]}
        remark="标注任务专属配置页面"
        style={{ width: '100%' }}
      >
        <Card 
          style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
          styles={{ body: { padding: '24px 24px 16px' } }}
        >
          <QueryFilter
            submitter={{
              submitButtonProps: { icon: <SearchOutlined /> },
              resetButtonProps: { icon: <ReloadOutlined /> },
            }}
          >
            <ProFormSelect name="firstLevel" label="一级项目" placeholder="请选择一级项目" options={[{label:'InternalCommercial', value:'InternalCommercial'}, {label:'ExternalXupaosi', value:'ExternalXupaosi'}, {label:'InternalIndustrial', value:'InternalIndustrial'}]} />
            <ProFormSelect name="secondLevel" label="二级项目" placeholder="请选择二级项目" options={[{label:'GroceryVLA', value:'GroceryVLA'}, {label:'FoundationModel', value:'FoundationModel'}]} />
            <ProFormText name="taskName" label="任务名称" placeholder="请输入任务名称" />
            <ProFormText name="taskId" label="任务ID" placeholder="请输入任务ID" />
            <ProFormText name="assignee" label="标注员" placeholder="请输入标注员" />
          </QueryFilter>
        </Card>
      </SpecMarker>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ padding: '0 24px' }}
          tabBarExtraContent={
            <Space style={{ paddingBottom: 12 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/annotation-tasks/create')}>新建任务</Button>
              <Button 
                icon={<NodeIndexOutlined />} 
                disabled={selectedRowKeys.length === 0}
                onClick={() => setIsAssignModalVisible(true)}
                style={{ 
                  backgroundColor: selectedRowKeys.length > 0 ? '#fff' : '#f5f5f5',
                  borderColor: selectedRowKeys.length > 0 ? '#1677ff' : '#d9d9d9',
                  color: selectedRowKeys.length > 0 ? '#1677ff' : '#bfbfbf'
                }}
              >
                批量分派标注员
              </Button>
              <Tooltip title="刷新"><Button icon={<ReloadOutlined />} type="text" /></Tooltip>
              <Tooltip title="列设置"><Button icon={<SettingOutlined />} type="text" /></Tooltip>
            </Space>
          }
          items={[
            { key: 'all', label: '全部数据标注' },
            { key: 'doing', label: '⚡ 进行中' },
            { key: 'done', label: '✅ 已完成' },
          ]} 
        />
        
        <div style={{ padding: '0 24px' }}>
          <Table 
            rowSelection={{ 
              type: 'checkbox',
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys)
            }} 
            columns={columns} 
            dataSource={filteredData} 
            scroll={{ x: 1800 }}
            style={{ marginBottom: 24 }}
            pagination={{ pageSize: 10 }} 
          />
        </div>
      </Card>

      {/* Modal for Batch Assignment */}
      <Modal
        title="批量分派标注员"
        open={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        width={600}
        onOk={() => {
          message.success('已成功分配标注员');
          setIsAssignModalVisible(false);
          setSelectedRowKeys([]);
        }}
      >
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="标注员" name="assignee" rules={[{ required: true, message: '请选择标注员' }]}>
            <Select placeholder="请选择标注员" options={[{label:'标注员00482', value:'00482'}, {label:'标注员00120', value:'00120'}, {label:'标注员00331', value:'00331'}]} />
          </Form.Item>
          <Form.Item label="审核员" name="auditor">
            <Select placeholder="请选择审核员" defaultValue="admin" options={[{label:'天奇管理员', value:'admin'}, {label:'质检员00810', value:'00810'}]} />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
