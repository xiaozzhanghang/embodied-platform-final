'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Tabs, Modal, Row, Col, Switch, Popconfirm, Tree, App, Descriptions } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const ioNodeData = [
    { key: '1', id: 1, name: '数据输入节点', nodeId: 'NI-001', desc: '系统预置输入节点', status: true, creator: '系统', createTime: '2025-01-01' },
    { key: '2', id: 2, name: '数据输出节点', nodeId: 'NO-001', desc: '系统预置输出节点', status: true, creator: '系统', createTime: '2025-01-01' },
];

const presetToolData = [
    { key: '1', id: 1, name: 'rosbag解析工具', nodeId: 'NT-001', desc: '解析ROS bag格式数据', status: true, creator: '系统', createTime: '2025-01-01', image: 'registry.cn-hangzhou.aliyuncs.com/tools/rosbag:v1.0', packageName: 'C2', command: 'python3 parse.py' },
    { key: '2', id: 2, name: 'HDF5转换工具', nodeId: 'NT-002', desc: '数据格式转换为HDF5', status: true, creator: '系统', createTime: '2025-01-01', image: 'registry.cn-hangzhou.aliyuncs.com/tools/hdf5:v2.1', packageName: 'C4', command: 'python3 convert.py' },
    { key: '3', id: 3, name: '视频抽帧工具', nodeId: 'NT-003', desc: '从视频中按帧率抽取图片', status: true, creator: '系统', createTime: '2025-01-15', image: 'registry.cn-hangzhou.aliyuncs.com/tools/video:v1.5', packageName: 'C2', command: 'ffmpeg -i input.mp4' },
];

const customToolData = [
    { key: '1', id: 1, name: '点云预处理工具', nodeId: 'NT-C01', desc: '3D点云数据预处理', status: true, creator: '管理员', createTime: '2025-02-01', image: 'registry.local/tools/pointcloud:v1.0', packageName: 'C8', command: 'python3 process.py' },
    { key: '2', id: 2, name: '图像增强工具', nodeId: 'NT-C02', desc: '采集图像亮度对比度增强', status: true, creator: '张三', createTime: '2025-02-15', image: 'registry.local/tools/image_enhance:v1.2', packageName: 'C4', command: 'python3 enhance.py' },
    { key: '3', id: 3, name: '数据清洗工具', nodeId: 'NT-C03', desc: '过滤无效数据', status: false, creator: '管理员', createTime: '2025-03-01', image: 'registry.local/tools/cleaner:v2.0', packageName: 'C2', command: 'python3 clean.py' },
];

const nodeTreeData = [
    { title: '输入节点', key: 'input', children: [{ title: '数据输入', key: 'data-input' }] },
    { title: '输出节点', key: 'output', children: [{ title: '数据输出', key: 'data-output' }] },
    {
        title: '工具节点', key: 'tools', children: [
            { title: 'rosbag解析', key: 'rosbag' },
            { title: 'HDF5转换', key: 'hdf5' },
            { title: '视频抽帧', key: 'video' },
            { title: '点云预处理', key: 'pointcloud' },
            { title: '图像增强', key: 'image' },
        ],
    },
];

function NodeTable({ data, isCustom }) {
  const { message } = App.useApp();
    const [addOpen, setAddOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    const columns = [
        { title: '序号', dataIndex: 'id', key: 'id', width: 60 },
        { title: '节点名称', dataIndex: 'name', key: 'name', width: 180 },
        { title: '节点ID', dataIndex: 'nodeId', key: 'nodeId', width: 100 },
        { title: '节点描述', dataIndex: 'desc', key: 'desc' },
        { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s) => <Tag color={s ? 'success' : 'default'}>{s ? '启用' : '停用'}</Tag> },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 120 },
        {
            title: '操作', key: 'action', width: isCustom ? 220 : 150, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={() => message.success(record.status ? '已停用' : '已启用')}>{record.status ? '停用' : '启用'}</Button>
                    {isCustom ? (
                        <>
                            <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
                            <Popconfirm title="确定删除？" onConfirm={() => message.success('已删除')}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                        </>
                    ) : (
                        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedNode(record); setDetailOpen(true); }}>查看详情</Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <QueryFilter
                    submitter={{
                        submitButtonProps: { icon: <SearchOutlined /> },
                        resetButtonProps: { icon: <ReloadOutlined /> },
                    }}
                    style={{ padding: 0 }}
                >
                    <ProFormText name="name" label="节点名称" placeholder="请输入节点名称" />
                    <ProFormText name="creator" label="创建人" placeholder="请输入创建人" />
                </QueryFilter>
                {isCustom && <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>新增工具</Button>}
            </div>
            <Table columns={columns} dataSource={data} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />

            <Modal title="新增工具节点" open={addOpen} onCancel={() => setAddOpen(false)} onOk={() => { setAddOpen(false); message.success('新增成功'); }} width={680} okText="保存" cancelText="取消">
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Card size="small" title="基础参数配置" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="name (节点名称)" required><Input placeholder="请输入节点名称" /></Form.Item></Col>
                            <Col span={12}><Form.Item label="image (镜像地址)" required><Input placeholder="请输入镜像地址" /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="packageName (资源套餐)"><Input defaultValue="C1" /></Form.Item></Col>
                            <Col span={12}><Form.Item label="command (启动命令)"><Input defaultValue="python3" /></Form.Item></Col>
                        </Row>
                    </Card>
                    <Card size="small" title="动态参数配置">
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="参数名称" required><Input placeholder="请输入参数名称" /></Form.Item></Col>
                            <Col span={12}><Form.Item label="样式"><Input defaultValue="文本框" disabled /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="是否必填"><Switch defaultChecked checkedChildren="是" unCheckedChildren="否" /></Form.Item></Col>
                            <Col span={12}><Form.Item label="是否显示"><Switch defaultChecked checkedChildren="是" unCheckedChildren="否" /></Form.Item></Col>
                        </Row>
                        <Button type="dashed" block icon={<PlusOutlined />}>添加动态参数</Button>
                    </Card>
                </Form>
            </Modal>

            <Modal title="节点详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640}>
                {selectedNode && (
                    <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
                        <Descriptions.Item label="节点名称">{selectedNode.name}</Descriptions.Item>
                        <Descriptions.Item label="节点ID">{selectedNode.nodeId}</Descriptions.Item>
                        <Descriptions.Item label="镜像地址" span={2}>{selectedNode.image || '—'}</Descriptions.Item>
                        <Descriptions.Item label="资源套餐">{selectedNode.packageName || '—'}</Descriptions.Item>
                        <Descriptions.Item label="启动命令">{selectedNode.command || '—'}</Descriptions.Item>
                        <Descriptions.Item label="节点描述" span={2}>{selectedNode.desc}</Descriptions.Item>
                        <Descriptions.Item label="状态">{selectedNode.status ? '启用' : '停用'}</Descriptions.Item>
                        <Descriptions.Item label="创建人">{selectedNode.creator}</Descriptions.Item>
                        <Descriptions.Item label="创建时间" span={2}>{selectedNode.createTime}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </>
    );
}

export default function NodeManagementPage() {
  const { message } = App.useApp();
    return (
            <MainLayout>
                <div className="page-header"><h3 className="page-header-title">节点管理</h3></div>
                <Card>
                    <Tabs
                        defaultActiveKey="io"
                        items={[
                            { key: 'io', label: '输入/输出节点', children: <NodeTable data={ioNodeData} isCustom={false} /> },
                            { key: 'preset', label: '预置工具', children: <NodeTable data={presetToolData} isCustom={false} /> },
                            { key: 'custom', label: '自定义工具', children: <NodeTable data={customToolData} isCustom={true} /> },
                            {
                                key: 'config', label: '节点配置',
                                children: (
                                    <div style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('添加自定义分类')}>添加自定义分类</Button>
                                        </div>
                                        <Tree
                                            showLine
                                            defaultExpandAll
                                            treeData={nodeTreeData}
                                            onSelect={(keys) => keys.length && message.info(`已选择节点: ${keys[0]}`)}
                                        />
                                        <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12 }}>
                                            提示：双击节点可修改名称，点击右侧图标可删除节点（预置节点无法删除）
                                        </Text>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>
            </MainLayout>
    );
}
