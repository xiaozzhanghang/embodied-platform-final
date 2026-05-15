'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Row, Col, Popconfirm, App } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, EyeOutlined, DeleteOutlined, PlayCircleOutlined, SaveOutlined, BranchesOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockData = [
    { key: '1', id: 1, name: 'rosbag数据解析工作流', workflowId: 'WF-001', scene: 'rosbag解析', desc: '解析rosbag格式采集数据', creator: '管理员', createTime: '2025-02-01 10:00' },
    { key: '2', id: 2, name: 'HDF5数据转换工作流', workflowId: 'WF-002', scene: 'HDF5转换', desc: '将原始数据转换为HDF5格式', creator: '管理员', createTime: '2025-02-10 14:00' },
    { key: '3', id: 3, name: '视频抽帧工作流', workflowId: 'WF-003', scene: '视频处理', desc: '从视频中按帧率抽取图片', creator: '张三', createTime: '2025-02-15 09:00' },
    { key: '4', id: 4, name: '点云预处理工作流', workflowId: 'WF-004', scene: '点云处理', desc: '对3D点云数据进行预处理', creator: '管理员', createTime: '2025-02-20 16:00' },
    { key: '5', id: 5, name: '图像增强工作流', workflowId: 'WF-005', scene: '图像处理', desc: '对采集图像进行增强处理', creator: '李四', createTime: '2025-03-01 11:00' },
];

export default function WorkflowListPage() {
  const { message } = App.useApp();
    const [createOpen, setCreateOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [runOpen, setRunOpen] = useState(false);

    const columns = [
        { title: '序号', dataIndex: 'id', key: 'id', width: 60 },
        { title: '工作流名称', dataIndex: 'name', key: 'name', width: 220 },
        { title: '工作流ID', dataIndex: 'workflowId', key: 'workflowId', width: 100 },
        { title: '应用场景', dataIndex: 'scene', key: 'scene', width: 120 },
        { title: '描述', dataIndex: 'desc', key: 'desc', ellipsis: true },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        {
            title: '操作', key: 'action', width: 250,
            render: () => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditorOpen(true)}>编辑</Button>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setEditorOpen(true)}>查看详情</Button>
                    <Popconfirm title="确定删除？" onConfirm={() => message.success('已删除')}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="page-header"><h3 className="page-header-title">工作流列表</h3></div>
                <Card className="search-form" style={{ marginBottom: 16 }}>
                    <Form layout="vertical">
                        <Row gutter={16} align="bottom">
                            <Col>
                                <Form.Item label="工作流名称" style={{ marginBottom: 0 }}>
                                    <Input placeholder="请输入名称" allowClear style={{ width: 180 }} />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item label="应用场景" style={{ marginBottom: 0 }}>
                                    <Select placeholder="全部" allowClear style={{ width: 140 }} options={[{ value: 'rosbag解析' }, { value: 'HDF5转换' }, { value: '视频处理' }, { value: '点云处理' }]} />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item label="工作流ID" style={{ marginBottom: 0 }}>
                                    <Input placeholder="请输入ID" allowClear style={{ width: 120 }} />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item label="创建人" style={{ marginBottom: 0 }}>
                                    <Input placeholder="请输入创建人" allowClear style={{ width: 120 }} />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item style={{ marginBottom: 0 }}>
                                    <Space>
                                        <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                        <Button icon={<ReloadOutlined />}>重置</Button>
                                    </Space>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>

                <Card>
                    <div className="table-toolbar">
                        <span className="table-toolbar-title">工作流列表</span>
                        <Space>
                            <Button icon={<BranchesOutlined />} onClick={() => message.info('工作流模板')}>工作流模板</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建工作流</Button>
                        </Space>
                    </div>
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <Modal title="新建工作流" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => { setCreateOpen(false); setEditorOpen(true); message.success('工作流已创建'); }} okText="确认" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="工作流名称" required><Input placeholder="请输入工作流名称" /></Form.Item>
                        <Form.Item label="应用场景" required><Select placeholder="请选择应用场景" options={[{ value: 'rosbag解析' }, { value: 'HDF5转换' }, { value: '视频处理' }, { value: '点云处理' }, { value: '图像处理' }]} /></Form.Item>
                        <Form.Item label="描述"><Input.TextArea rows={3} placeholder="请输入描述" /></Form.Item>
                    </Form>
                </Modal>

                <Modal title="工作流编辑器" open={editorOpen} onCancel={() => setEditorOpen(false)} width={900} footer={
                    <Space>
                        <Button onClick={() => setEditorOpen(false)}>取消</Button>
                        <Button onClick={() => message.success('已保存为模板')}>另存为模板</Button>
                        <Button icon={<SaveOutlined />} onClick={() => { setEditorOpen(false); message.success('已保存'); }}>保存</Button>
                        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => { setEditorOpen(false); setRunOpen(true); }}>运行</Button>
                    </Space>
                }>
                    <Row gutter={16} style={{ minHeight: 400 }}>
                        <Col span={4}>
                            <Card size="small" title="组件库" style={{ height: '100%' }}>
                                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'move' }}>📥 输入节点</div>
                                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'move' }}>📤 输出节点</div>
                                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'move' }}>🔧 rosbag解析</div>
                                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'move' }}>🔧 HDF5转换</div>
                                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'move' }}>🔧 视频抽帧</div>
                                <div style={{ padding: '8px 0', cursor: 'move' }}>🔧 图像增强</div>
                            </Card>
                        </Col>
                        <Col span={14}>
                            <div className="workflow-canvas">
                                <div style={{ textAlign: 'center' }}>
                                    <BranchesOutlined style={{ fontSize: 48, marginBottom: 16 }} /><br />
                                    <Text type="secondary">拖拽左侧组件到此画布构建工作流</Text><br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>支持输入节点 → 工具节点 → 输出节点</Text>
                                </div>
                            </div>
                        </Col>
                        <Col span={6}>
                            <Card size="small" title="动态配置" style={{ height: '100%' }}>
                                <Form layout="vertical" size="small">
                                    <Form.Item label="原始数据地址"><Input placeholder="输入数据地址" /></Form.Item>
                                    <Form.Item label="原始数据ID"><Input placeholder="输入数据ID" /></Form.Item>
                                    <Form.Item label="子集ID"><Input placeholder="输入子集ID" /></Form.Item>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </Modal>

                <Modal title="运行工作流" open={runOpen} onCancel={() => setRunOpen(false)} onOk={() => { setRunOpen(false); message.success('工作流已开始运行'); }} okText="运行" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="任务名称" required><Input placeholder="请输入任务名称" /></Form.Item>
                        <Form.Item label="描述"><Input.TextArea rows={2} placeholder="请输入描述" /></Form.Item>
                        <Form.Item label="优先级" required>
                            <Select placeholder="请选择优先级" options={[
                                { value: 'high', label: '高 - 多任务并发时最优先运行' },
                                { value: 'medium', label: '中 - 多任务并发时排队等待运行' },
                                { value: 'low', label: '低 - 空闲时运行' },
                            ]} />
                        </Form.Item>
                    </Form>
                </Modal>
            </MainLayout>
    );
}
