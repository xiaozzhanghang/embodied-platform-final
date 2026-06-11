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
      instanceId: 'INS-766794-A',
      taskId: '12853', 
      name: '货架物品采集 - 实例 01', 
      project: 'SimulatedCollection',
      isShelfTask: '是',
      shelfPosition: 'A-1-2',
      annoType: '范围&框标注',
      collectedCount: 850,
      plannedCount: 1000,
      collector: '张三',
      startTime: '2026-03-23 10:23',
      endTime: '2026-03-23 11:45',
      collectProgress: '85%',
      qaProgress: '20%',
      status: '进行中', 
    },
    { 
      key: '2', 
      instanceId: 'INS-766794-B',
      taskId: '12837', 
      name: '桌面操作任务 - 实例 02', 
      project: 'SimulatedCollection',
      isShelfTask: '是',
      shelfPosition: '-',
      annoType: '框标注',
      collectedCount: 120,
      plannedCount: 500,
      collector: '李四',
      startTime: '2026-03-23 14:00',
      endTime: '-',
      collectProgress: '24%',
      qaProgress: '0%',
      status: '进行中', 
    },
    { 
      key: '3', 
      instanceId: 'INS-GB116-001',
      taskId: 'CT-Galbot-1.16', 
      name: 'Galbot-1.16-双臂精细整理作业-001', 
      project: 'InternalCommercial',
      isShelfTask: '否',
      shelfPosition: '-',
      annoType: '双端数采',
      collectedCount: 2,
      plannedCount: 50,
      collector: '赵六',
      startTime: '-',
      endTime: '-',
      collectProgress: '4%',
      qaProgress: '0%',
      status: '进行中', 
    },
    { 
      key: '4', 
      instanceId: 'INS-LUMOS-001',
      taskId: 'CT-20260414001', 
      name: 'Lumos-双手筷子与勺子整理-001', 
      project: 'InternalCommercial',
      isShelfTask: '否',
      shelfPosition: '-',
      annoType: '离线数采',
      collectedCount: 0,
      plannedCount: 50,
      collector: '王小二',
      startTime: '-',
      endTime: '-',
      collectProgress: '0%',
      qaProgress: '0%',
      status: '进行中', 
    },
  ];

  const columns = [
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 140, fixed: 'left' },
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
    { title: '是否货架任务', dataIndex: 'isShelfTask', key: 'isShelfTask', width: 110, align: 'center' },
    { title: '行列号', dataIndex: 'shelfPosition', key: 'shelfPosition', width: 80, align: 'center' },
    { title: '标注类型', dataIndex: 'annoType', key: 'annoType', width: 120 },
    { 
      title: '单包采集量 / 计划采集量', 
      key: 'quota', 
      width: 180,
      render: (_, record) => <span>{record.collectedCount} / {record.plannedCount}</span>
    },
    { title: '采集人员', dataIndex: 'collector', key: 'collector', width: 100 },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
    { 
      title: '采集进度', 
      dataIndex: 'collectProgress', 
      key: 'collectProgress', 
      width: 100,
      render: (p) => <Tag color="blue">{p}</Tag>
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (s) => <Tag color={s === '已完成' ? 'success' : 'processing'}>{s}</Tag>
    },
    {
      title: '操作', key: 'action', width: 350, fixed: 'right',
      render: (_, record) => (
        <Space separator={<Divider type="vertical" />} size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/collection/tasks/${record.taskId}`)} style={{ padding: '0 4px' }}>查看详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => router.push(`/collection/tasks/create?mode=edit&taskId=${record.taskId}`)} style={{ padding: '0 4px' }}>编辑</Button>
          <SpecMarker
            id="tasks-copy"
            number={4}
            title="模板复制与参数克隆"
            rules={[
              "点击‘复制’按钮，路由携带 `?mode=copy&taskId=[id]` 跳转到新建任务表单页。",
              "表单需自动复刻并回显源任务的所有采集参数（动作模板、自检规则、传感器时空配置等）。",
              "为防止冲突，复制后的‘任务名称’需清空或自动加上‘_copy’后缀，‘实例ID’重新自动生成。"
            ]}
            remark="提供便捷的采集任务模板化复制功能，避免重复性人工参数输入。"
          >
            <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => router.push(`/collection/tasks/create?mode=copy&taskId=${record.taskId}`)} style={{ padding: '0 4px' }}>复制</Button>
          </SpecMarker>
          <Button type="link" size="small" icon={<DeleteOutlined />} danger style={{ padding: '0 4px' }} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}>删除</Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '任务管理' }]} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
          </div>
        </div>
      </div>

      <SpecMarker
        id="tasks-query"
        number={1}
        title="所属项目与条件联合检索"
        rules={[
          "支持按所属项目（下拉精确匹配）、任务书、实例 ID、任务名称（模糊）、采集员及运行状态过滤任务实例。",
          "所有筛选项输入框应包含 placeholder 占位说明，且均需支持可一键清空状态（allowClear）。",
          "重置操作需同时清空所有输入并刷新表格为无过滤初始态。"
        ]}
        remark="该查询对应系统底层采集任务实例的大盘过滤，支持按状态实时检索。"
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
              <ProFormSelect name="project" label="所属项目" placeholder="请选择项目" />
              <ProFormSelect name="taskbook" label="任务书" placeholder="请选择任务书" />
              <ProFormText name="instanceId" label="实例ID" placeholder="请输入实例ID" />
              <ProFormText name="taskName" label="任务名称" placeholder="请输入任务名称" />
              <ProFormText name="collector" label="采集员" placeholder="请输入采集员" />
              <ProFormSelect name="status" label="状态" placeholder="请选择状态" options={[{label:'进行中', value:'active'}, {label:'已完成', value:'completed'}]} />
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
                      .map(item => item.instanceId);
                    
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
