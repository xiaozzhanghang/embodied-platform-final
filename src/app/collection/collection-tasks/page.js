'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Card, Typography, 
  Breadcrumb, Tabs, Tooltip, App, Modal, 
  Divider
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, 
  SettingOutlined, ColumnHeightOutlined, CopyOutlined, EditOutlined, 
  DeleteOutlined, EyeOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { FilterPanel, PageHeader, TableToolbar } from '@/components/ui';

const { Text } = Typography;

export default function CollectionTasksPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const mockData = [
    { 
      key: '1', 
      taskId: 'COLL-20260415-001', 
      taskName: '货架物品物理采集任务', 
      taskNameEn: 'ShelfPhysicalCollect',
      taskBookName: '桌面整理采集规范 V1.0',
      firstLevel: 'InternalCommercial',
      secondLevel: 'GroceryVLA',
      taskPurpose: 'Training',
      sceneCategory: 'Supermarket',
      subSceneCategory: 'ShelfArea',
      collectMode: 'Physical',
      teleopType: 'Exoskeleton',
      deviceType: 'Galbot_2.2_RGBD',
      totalCount: 1000,
      finishCount: 850,
      collector: 'cy00831',
      createBy: 'ingest_user',
      createTime: '2026-04-15 10:23:00',
      updateTime: '2026-04-18 16:30:00',
      progress: '85%',
      status: '进行中', 
      needCollect: true,
    },
    { 
      key: '2', 
      taskId: 'COLL-20260415-002', 
      taskName: '桌面操作物理数采任务', 
      taskNameEn: 'TabletopOperation',
      taskBookName: '桌面整理采集规范 V1.0',
      firstLevel: 'SimulatedCollection',
      secondLevel: 'FoundationModel',
      taskPurpose: 'Training',
      sceneCategory: 'LivingRoom',
      subSceneCategory: 'DiningTable',
      collectMode: 'Physical',
      teleopType: 'Keyboard',
      deviceType: 'Galbot_1.16_G2',
      totalCount: 500,
      finishCount: 500,
      collector: 'collector_02',
      createBy: 'zhangsan',
      createTime: '2026-04-13 14:00:00',
      updateTime: '2026-04-15 09:10:00',
      progress: '100%',
      status: '已完成', 
      needCollect: false,
    },
    { 
      key: '3', 
      taskId: 'COLL-20260414-003', 
      taskName: 'Lumos-双手整理离线资产任务', 
      taskNameEn: 'LumosBimanualSorting',
      taskBookName: '厨房操作采集规范 V1.2',
      firstLevel: 'ExternalXupaosi',
      secondLevel: 'SubTag_X1',
      taskPurpose: 'Demo',
      sceneCategory: 'Kitchen',
      subSceneCategory: 'Countertop',
      collectMode: 'Teleop',
      teleopType: 'Exoskeleton',
      deviceType: 'Lumos_FastUMI',
      totalCount: 50,
      finishCount: 50,
      collector: 'cy00831',
      createBy: 'ingest_user',
      createTime: '2026-04-14 09:00:00',
      updateTime: '2026-04-14 18:00:00',
      progress: '100%',
      status: '已完成', 
      needCollect: false,
    },
  ];

  const columns = [
    { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 170, fixed: 'left' },
    { 
      title: '任务名称', 
      dataIndex: 'taskName', 
      key: 'taskName', 
      width: 220, 
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>
    },
    { title: '英文名称', dataIndex: 'taskNameEn', key: 'taskNameEn', width: 170, ellipsis: true },
    { title: '关联任务书', dataIndex: 'taskBookName', key: 'taskBookName', width: 180, ellipsis: true },
    { title: '一级项目', dataIndex: 'firstLevel', key: 'firstLevel', width: 150 },
    { title: '二级项目', dataIndex: 'secondLevel', key: 'secondLevel', width: 150 },
    { title: '任务用途', dataIndex: 'taskPurpose', key: 'taskPurpose', width: 110 },
    { title: '场景分类', dataIndex: 'sceneCategory', key: 'sceneCategory', width: 130 },
    { title: '子场景分类', dataIndex: 'subSceneCategory', key: 'subSceneCategory', width: 130 },
    { title: '采集模式', dataIndex: 'collectMode', key: 'collectMode', width: 110 },
    { title: '遥操类型', dataIndex: 'teleopType', key: 'teleopType', width: 120 },
    { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 150 },
    { title: '目标采集数', dataIndex: 'totalCount', key: 'totalCount', width: 110, render: (c) => `${c} 条` },
    { title: '完成采集数', dataIndex: 'finishCount', key: 'finishCount', width: 110, render: (c) => `${c} 条` },
    { title: '采集员', dataIndex: 'collector', key: 'collector', width: 110 },
    { title: '创建人', dataIndex: 'createBy', key: 'createBy', width: 110 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170, ellipsis: true },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170, ellipsis: true },
    { 
      title: '进度', 
      dataIndex: 'progress', 
      key: 'progress', 
      width: 90,
      fixed: 'right',
      render: (p) => <Tag color={p === '100%' ? 'success' : 'cyan'}>{p}</Tag>
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right', align: 'center',
      render: (_, record) => (
        <Space separator={<Divider orientation="vertical" />} size={0}>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => {
              const isNoNeed = record.needCollect === false || record.taskId === 'COLL-20260414-003' || record.taskId === 'COLL-20260415-002';
              const param = isNoNeed ? '?needCollect=false' : '?needCollect=true';
              router.push(`/collection/tasks/${record.taskId}${param}`);
            }} 
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
      <div className="ui-page">
        <PageHeader
          title="采集任务"
          description="统一查看采集计划、执行进度与数据交付状态。"
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '任务中心' }, { title: '采集任务' }]}
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/collection-tasks/create')}>新建任务</Button>}
        />

        <SpecMarker
        id="collection-tasks-query"
        number={1}
        title="采集任务多维度检索过滤"
        rules={[
          "支持按一级项目、二级项目、任务书、任务名称、采集模式、遥操类型及设备类型联合筛选。",
          "所有筛选项支持一键清空状态。"
        ]}
        remark="采集任务专属配置页面"
        style={{ width: '100%' }}
      >
          <FilterPanel>
            <QueryFilter
            submitter={{
              submitButtonProps: { icon: <SearchOutlined /> },
              resetButtonProps: { icon: <ReloadOutlined /> },
            }}
          >
            <ProFormSelect name="firstLevel" label="一级项目" placeholder="请选择一级项目" options={[{label:'InternalCommercial', value:'InternalCommercial'}, {label:'ExternalXupaosi', value:'ExternalXupaosi'}, {label:'InternalIndustrial', value:'InternalIndustrial'}]} />
            <ProFormSelect name="secondLevel" label="二级项目" placeholder="请选择二级项目" options={[{label:'GroceryVLA', value:'GroceryVLA'}, {label:'FoundationModel', value:'FoundationModel'}]} />
            <ProFormSelect name="collectMode" label="采集模式" placeholder="请选择采集模式" options={[{label:'Physical', value:'Physical'}, {label:'Teleop', value:'Teleop'}, {label:'Simulated', value:'Simulated'}]} />
            <ProFormSelect name="teleopType" label="遥操类型" placeholder="请选择遥操类型" options={[{label:'Exoskeleton', value:'Exoskeleton'}, {label:'VR_Controller', value:'VR_Controller'}, {label:'Keyboard', value:'Keyboard'}]} />
            <ProFormSelect name="deviceType" label="设备类型" placeholder="请选择设备类型" options={[{label:'Galbot_2.2_RGBD', value:'Galbot_2.2_RGBD'}, {label:'Franka_FR3', value:'Franka_FR3'}, {label:'Lumos_FastUMI', value:'Lumos_FastUMI'}]} />
            <ProFormText name="taskName" label="任务名称" placeholder="请输入任务名称" />
            <ProFormText name="taskId" label="任务ID" placeholder="请输入任务ID" />
            </QueryFilter>
          </FilterPanel>
        </SpecMarker>

        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ padding: '0 16px' }}
            items={[
              { key: 'all', label: '全部采集任务' },
              { key: 'doing', label: '进行中' },
              { key: 'done', label: '已完成' },
            ]}
          />
          <TableToolbar
            count={filteredData.length}
            selectedCount={selectedRowKeys.length}
            actions={[
              <Button 
                key="complete"
                icon={<CheckCircleOutlined />} 
                disabled={selectedRowKeys.length === 0}
                onClick={() => {
                  const selectedIds = mockData
                    .filter(item => selectedRowKeys.includes(item.key))
                    .map(item => item.taskId);
                  
                  Modal.confirm({
                    title: '完成确认',
                    icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                    content: `确定要标记完成选中的 ${selectedIds.join(', ')} 任务吗？`,
                    okText: '确认',
                    cancelText: '关闭',
                    onOk: () => {
                      setSelectedRowKeys([]);
                      Modal.info({
                        title: '采集完成，自动生成数据标注任务',
                        content: `采集任务已标记完成！系统已自动生成对应的数据标注任务 [ANNO-20260415-001]。请前往数据标注详情页进行任务分包与人员配给。`,
                        okText: '前往数据标注',
                        onOk: () => router.push('/collection/annotation-tasks')
                      });
                    }
                  });
                }}
              >
                批量完成
              </Button>,
              <Tooltip key="refresh" title="刷新"><Button icon={<ReloadOutlined />} /></Tooltip>,
              <Tooltip key="columns" title="列设置"><Button icon={<SettingOutlined />} /></Tooltip>,
            ]}
          />
          <Table 
            rowSelection={{ 
              type: 'checkbox',
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys)
            }} 
            columns={columns} 
            dataSource={filteredData} 
            scroll={{ x: 1900 }}
            size="middle"
            pagination={{ pageSize: 10 }} 
          />
        </Card>
      </div>
    </MainLayout>
  );
}
