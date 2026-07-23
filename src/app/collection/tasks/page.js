'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Input, Select, Form, Card, Typography, 
  Breadcrumb, Tabs, Tooltip, App, Modal, Checkbox, 
  Row, Col, Dropdown, Divider, Switch 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined,
  SettingOutlined, ColumnHeightOutlined, CopyOutlined, EditOutlined, 
  DeleteOutlined, EyeOutlined, UsergroupAddOutlined, TagsOutlined, 
  NodeIndexOutlined, CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Title, Text } = Typography;

export default function TaskCenterPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  
  // Track selected annotation types for dynamic rendering
  const [selectedTypes, setSelectedTypes] = useState(['point']);

  const mockData = [
    { 
      key: '1', 
      taskId: 'TASK-20260415-001', 
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
      createBy: 'ingest_user',
      createTime: '2026-04-15 10:23:00',
      updateTime: '2026-04-18 16:30:00',
      progress: '85%',
      status: '进行中', 
    },
    { 
      key: '2', 
      taskId: 'TASK-20260415-002', 
      taskName: '工业纸箱打包封装标注任务', 
      taskNameEn: 'IndustrialPacking',
      taskBookName: '线缆管理采集规范 V2.0',
      firstLevel: 'InternalIndustrial',
      secondLevel: 'Industrial_A1',
      taskPurpose: 'Valid',
      sceneCategory: 'FactoryFloor',
      subSceneCategory: 'PackingLine',
      collectMode: 'Simulated',
      teleopType: 'VR_Controller',
      deviceType: 'Franka_FR3',
      totalCount: 100,
      finishCount: 75,
      createBy: 'admin',
      createTime: '2026-04-12 10:00:00',
      updateTime: '2026-04-14 11:20:00',
      progress: '75%',
      status: '进行中', 
    },
    { 
      key: '3', 
      taskId: 'TASK-20260415-003', 
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
      finishCount: 120,
      createBy: 'zhangsan',
      createTime: '2026-04-13 14:00:00',
      updateTime: '2026-04-15 09:10:00',
      progress: '24%',
      status: '进行中', 
    },
    { 
      key: '4', 
      taskId: 'TASK-20260414-004', 
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
      createBy: 'ingest_user',
      createTime: '2026-04-14 09:00:00',
      updateTime: '2026-04-14 18:00:00',
      progress: '100%',
      status: '已完成', 
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
    { title: '任务书', dataIndex: 'taskBookName', key: 'taskBookName', width: 190, ellipsis: true },
    { title: '一级项目', dataIndex: 'firstLevel', key: 'firstLevel', width: 150, ellipsis: true },
    { title: '二级项目', dataIndex: 'secondLevel', key: 'secondLevel', width: 140, ellipsis: true },
    { title: '任务用途', dataIndex: 'taskPurpose', key: 'taskPurpose', width: 120, render: (p) => <Tag color="blue">{p}</Tag> },
    { title: '场景分类', dataIndex: 'sceneCategory', key: 'sceneCategory', width: 130 },
    { title: '子场景分类', dataIndex: 'subSceneCategory', key: 'subSceneCategory', width: 130 },
    { title: '计划采集', dataIndex: 'totalCount', key: 'totalCount', width: 100 },
    { title: '已采集', dataIndex: 'finishCount', key: 'finishCount', width: 100 },
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
            onClick={() => router.push(`/collection/tasks/${record.taskId}`)} 
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

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '任务中心' }]} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
          </div>
        </div>
      </div>

      <SpecMarker
        id="tasks-query"
        number={1}
        title="任务中心多维度检索过滤"
        rules={[
          "支持按一级项目、二级项目、任务书、任务名称、任务ID、创建人、场景分类、任务用途、采集模式、遥操类型及设备类型联合筛选。",
          "所有筛选项支持可一键清空状态（allowClear）。",
          "重置操作清空所有输入并刷新表格为无过滤初始态。"
        ]}
        remark="对齐 JeecgBoot 具身智能数据采集管理平台任务中心筛选项"
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
              <ProFormSelect name="taskBookName" label="任务书" placeholder="请选择任务书" />
              <ProFormText name="taskName" label="任务名称" placeholder="请输入任务名称" />
              <ProFormText name="taskId" label="任务ID" placeholder="请输入任务ID" />
              <ProFormText name="createBy" label="创建人" placeholder="请输入创建人" />
              <ProFormSelect name="sceneCategory" label="场景分类" placeholder="请选择场景分类" />
              <ProFormSelect name="taskPurpose" label="任务用途" placeholder="请选择任务用途" />
              <ProFormSelect name="collectMode" label="采集模式" placeholder="请选择采集模式" />
              <ProFormSelect name="teleopType" label="遥操类型" placeholder="请选择遥操类型" />
              <ProFormSelect name="deviceType" label="设备类型" placeholder="请选择设备类型" />
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/tasks/create')}>模板创建</Button>
              <SpecMarker
                id="tasks-assign"
                number={2}
                title="任务分配与标注流绑定"
                rules={[
                  "仅在表格中有勾选项（selectedRowKeys.length > 0）时该按钮激活。",
                  "点击‘批量添加标注’弹出分配弹窗，支持选择点标注、范围标注、框标注及混合类型。",
                  "勾选对应标注类别后，表单会动态渲染出对应模块的审核员、标注员与自动生成数据集配置开关。"
                ]}
                remark="不同的标注类型会动态决定该 Episode 数据包在标注中心的流转审批规则。"
              >
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
                  ≡ 批量添加标注
                </Button>
              </SpecMarker>
              <SpecMarker
                id="tasks-complete"
                number={3}
                title="批量完成与状态变更校验"
                rules={[
                  "仅在表格中有选中行时激活。",
                  "点击弹出二次确认对话框，模态窗中需明确展示所选的任务实例 ID 列表以供核对。",
                  "前置逻辑校验：若选中的任务实例中存在‘实际采集量低于计划采集量’且‘未填写未完成补充备注’的情况，需阻断并提示错误，直至补全备注。"
                ]}
                remark="确认完成后，后端同步将该任务下所有 Episode 数据流转为待机检/待标注状态。"
              >
                <Button 
                  icon={<CheckCircleOutlined />} 
                  disabled={selectedRowKeys.length === 0}
                  onClick={() => {
                    const selectedIds = mockData
                      .filter(item => selectedRowKeys.includes(item.key))
                      .map(item => item.taskId);
                    
                    Modal.confirm({
                      title: '完成',
                      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                      content: `确定要完成选中的 ${selectedIds.join(', ')} 任务吗？`,
                      okText: '确认',
                      cancelText: '关闭',
                      okButtonProps: { type: 'primary' },
                      onOk: () => {
                        message.success('选中的任务已全部标记为完成');
                        setSelectedRowKeys([]);
                      }
                    });
                  }}
                  style={{ 
                    backgroundColor: selectedRowKeys.length > 0 ? '#fff' : '#f5f5f5',
                    borderColor: selectedRowKeys.length > 0 ? '#52c41a' : '#d9d9d9',
                    color: selectedRowKeys.length > 0 ? '#52c41a' : '#bfbfbf'
                  }}
                >
                  批量完成
                </Button>
              </SpecMarker>
              <Tooltip title="刷新"><Button icon={<ReloadOutlined />} type="text" /></Tooltip>
              <Tooltip title="密度"><Button icon={<ColumnHeightOutlined />} type="text" /></Tooltip>
              <Tooltip title="列设置"><Button icon={<SettingOutlined />} type="text" /></Tooltip>
            </Space>
          }
          items={[
            { key: 'all', label: '全部' },
            { key: 'doing', label: '⚡ 进行中' },
            { key: 'pending', label: '🕒 排队中' },
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
            dataSource={mockData} 
            scroll={{ x: 1800 }}
            style={{ marginBottom: 24 }}
            pagination={{ pageSize: 10 }} 
          />
        </div>
      </Card>

      {/* --- Batch Assignment Modal --- */}
      <Modal
        title="分配标注任务"
        open={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        width={680}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px' } }}
        footer={[
          <Button key="cancel" onClick={() => setIsAssignModalVisible(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={() => {
            message.success('标注任务已批量分配成功');
            setIsAssignModalVisible(false);
            setSelectedRowKeys([]);
          }}>确定</Button>
        ]}
      >
        <Form form={assignForm} layout="vertical">
          {/* Main Controls */}
          <Form.Item label="标注类型" name="types" rules={[{ required: true }]}>
            <Space direction="vertical" size={12}>
              <Checkbox.Group 
                value={selectedTypes} 
                onChange={(values) => setSelectedTypes(values)}
              >
                <Space size={16} wrap>
                  <Checkbox value="point">点标注</Checkbox>
                  <Checkbox value="range">范围标注</Checkbox>
                  <Checkbox value="box">框标注</Checkbox>
                  <Checkbox value="mixed">范围&框标注</Checkbox>
                </Space>
              </Checkbox.Group>
              <Checkbox value="none" onChange={(e) => e.target.checked && setSelectedTypes([])}>无需标注</Checkbox>
            </Space>
          </Form.Item>

          <Form.Item label="质检员" name="qa">
            <Select placeholder="请选择质检员" defaultValue="00810" options={[{label:'质检员00810', value:'00810'}]} style={{ width: '100%' }} />
          </Form.Item>

          {/* Section: 点标注 */}
          {selectedTypes.includes('point') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>点标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集">
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员">
                    <Select placeholder="请选择标注员" defaultValue="00482" options={[{label:'质检员00482', value:'00482'}]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员">
                    <Select placeholder="请选择审核员" defaultValue="admin" options={[{label:'天奇管理员', value:'admin'}]} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 范围标注 */}
          {selectedTypes.includes('range') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>范围标注</Text></Divider>
              <Form.Item label="自动生成数据集" labelCol={{ span: 5 }}>
                <Switch />
              </Form.Item>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="标注员" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Select placeholder="请选择标注员" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="审核员" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Select placeholder="请选择审核员" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 框标注 */}
          {selectedTypes.includes('box') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>框标注</Text></Divider>
              <Form.Item label="自动生成数据集" labelCol={{ span: 5 }}>
                <Switch />
              </Form.Item>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="标注员" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Select placeholder="请选择标注员" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="审核员" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Select placeholder="请选择审核员" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 范围&框标注 */}
          {selectedTypes.includes('mixed') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>范围&框标注</Text></Divider>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="自动生成数据集" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="跨步骤标注" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Switch defaultChecked checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="标注员" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Select placeholder="请选择标注员" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="审核员" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
                    <Select placeholder="请选择审核员" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal>
    </MainLayout>
  );
}
