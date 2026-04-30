'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Tree, Row, Col, Descriptions, Divider, Popconfirm, App } from 'antd';
import { PlusOutlined, SearchOutlined, FolderOutlined, FolderOpenOutlined, FileOutlined, SettingOutlined, DeleteOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const treeData = [
    {
        title: '具身抓取数据集',
        key: 'ds-001',
        icon: <FolderOutlined />,
        children: [
            { title: '抓取子集-01', key: 'ss-001', icon: <FileOutlined /> },
            { title: '抓取子集-02', key: 'ss-002', icon: <FileOutlined /> },
            { title: '抓取子集-03', key: 'ss-003', icon: <FileOutlined /> },
        ],
    },
    {
        title: '具身搬运数据集',
        key: 'ds-002',
        icon: <FolderOutlined />,
        children: [
            { title: '搬运子集-01', key: 'ss-004', icon: <FileOutlined /> },
        ],
    },
    {
        title: '具身分拣数据集',
        key: 'ds-003',
        icon: <FolderOutlined />,
        children: [
            { title: '分拣子集-01', key: 'ss-005', icon: <FileOutlined /> },
            { title: '分拣子集-02', key: 'ss-006', icon: <FileOutlined /> },
        ],
    },
];

const subsetData = [
    { key: '1', id: 1, name: '抓取子集-01', subsetId: 'SS-001', enName: 'grasp-subset-01', sendStatus: '已送标', annotationId: 'AD-001', annotationStatus: '标注中', creator: '管理员', updateTime: '2025-03-05 10:00' },
    { key: '2', id: 2, name: '抓取子集-02', subsetId: 'SS-002', enName: 'grasp-subset-02', sendStatus: '未送标', annotationId: '-', annotationStatus: '-', creator: '管理员', updateTime: '2025-03-04 14:00' },
    { key: '3', id: 3, name: '抓取子集-03', subsetId: 'SS-003', enName: 'grasp-subset-03', sendStatus: '已送标', annotationId: 'AD-003', annotationStatus: '已完成', creator: '张三', updateTime: '2025-03-03 09:00' },
];

const detailData = [
    { key: '1', id: 1, name: 'episode_001.hdf5', dataId: 'D-0001', size: '256 MB' },
    { key: '2', id: 2, name: 'episode_002.hdf5', dataId: 'D-0002', size: '312 MB' },
    { key: '3', id: 3, name: 'episode_003.hdf5', dataId: 'D-0003', size: '198 MB' },
    { key: '4', id: 4, name: 'episode_004.hdf5', dataId: 'D-0004', size: '275 MB' },
    { key: '5', id: 5, name: 'episode_005.hdf5', dataId: 'D-0005', size: '340 MB' },
];

export default function DatasetPage() {
    const { message } = App.useApp();
    const [selectedKey, setSelectedKey] = useState('ds-001');
    const [createDatasetOpen, setCreateDatasetOpen] = useState(false);
    const [createSubsetOpen, setCreateSubsetOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);

    const subsetColumns = [
        { title: '序号', dataIndex: 'id', key: 'id', width: 60 },
        { title: '子集名称', dataIndex: 'name', key: 'name', width: 140 },
        { title: '子集ID', dataIndex: 'subsetId', key: 'subsetId', width: 100 },
        { title: '英文名称', dataIndex: 'enName', key: 'enName', width: 160 },
        { title: '送标状态', dataIndex: 'sendStatus', key: 'sendStatus', width: 100, render: (s) => <Tag color={s === '已送标' ? 'blue' : 'default'}>{s}</Tag> },
        { title: '标注数据集ID', dataIndex: 'annotationId', key: 'annotationId', width: 120 },
        { title: '标注状态', dataIndex: 'annotationStatus', key: 'annotationStatus', width: 100, render: (s) => <Tag color={s === '已完成' ? 'success' : s === '标注中' ? 'processing' : 'default'}>{s}</Tag> },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
        {
            title: '操作', key: 'action', width: 150,
            render: () => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailOpen(true)}>查看</Button>
                    <Popconfirm title="确定删除？" onConfirm={() => message.success('已删除')}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    const detailColumns = [
        { title: '序号', dataIndex: 'id', key: 'id', width: 60 },
        { title: '数据名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '数据ID', dataIndex: 'dataId', key: 'dataId', width: 120 },
        { title: '数据大小', dataIndex: 'size', key: 'size', width: 120 },
        {
            title: '操作', key: 'action', width: 200,
            render: () => (
                <Space>
                    <Button type="link" size="small">查看详情</Button>
                    <Button type="link" size="small" icon={<PlayCircleOutlined />}>播放</Button>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="page-header"><h3 className="page-header-title">数据集</h3></div>
            <Row gutter={16}>
                <Col span={6}>
                    <Card
                        size="small"
                        title={
                            <Space>
                                <span>数据集目录</span>
                                <Button type="text" size="small" icon={<SearchOutlined />} />
                            </Space>
                        }
                        extra={<Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setCreateDatasetOpen(true)} />}
                        style={{ minHeight: 'calc(100vh - 56px - 72px)' }}
                    >
                        <div style={{ marginBottom: 8 }}>
                            <Select placeholder="选择项目" allowClear style={{ width: '100%' }} defaultValue="具身抓取项目A" options={[{ value: '具身抓取项目A' }, { value: '具身搬运项目B' }, { value: '具身分拣项目C' }]} size="small" />
                        </div>
                        <Tree
                            showIcon
                            defaultExpandAll
                            treeData={treeData}
                            selectedKeys={[selectedKey]}
                            onSelect={(keys) => keys.length && setSelectedKey(keys[0])}
                        />
                    </Card>
                </Col>
                <Col span={18}>
                    <Card
                        title={
                            <Space>
                                <FolderOpenOutlined />
                                <span>具身抓取数据集</span>
                                <Tag color="blue">数据集ID: DS-001</Tag>
                            </Space>
                        }
                        extra={
                            <Space>
                                <Button size="small" icon={<SettingOutlined />} onClick={() => message.info('配置数据集')}>配置</Button>
                                <Popconfirm title="确定删除数据集？"><Button size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                            </Space>
                        }
                    >
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setCreateSubsetOpen(true)}>新建子集</Button>
                        </div>
                        <Table columns={subsetColumns} dataSource={subsetData} size="middle" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                    </Card>
                </Col>
            </Row>

            <Modal title="新建数据集" open={createDatasetOpen} onCancel={() => setCreateDatasetOpen(false)} onOk={() => { setCreateDatasetOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消">
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="数据集名称" required><Input placeholder="请输入数据集名称" /></Form.Item>
                    <Form.Item label="英文名称" required><Input placeholder="请输入英文名称" /></Form.Item>
                    <Form.Item label="简介"><Input.TextArea rows={3} placeholder="请输入简介" /></Form.Item>
                </Form>
            </Modal>

            <Modal title="新建子集" open={createSubsetOpen} onCancel={() => setCreateSubsetOpen(false)} onOk={() => { setCreateSubsetOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消">
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="子集中文名称" required><Input placeholder="请输入中文名称" /></Form.Item>
                    <Form.Item label="子集英文名称" required><Input placeholder="请输入英文名称" /></Form.Item>
                    <Form.Item label="描述"><Input.TextArea rows={3} placeholder="请输入描述" /></Form.Item>
                </Form>
            </Modal>

            <Modal title="数据子集详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={800}>
                <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="子集ID">SS-001</Descriptions.Item>
                    <Descriptions.Item label="子集名称">抓取子集-01</Descriptions.Item>
                    <Descriptions.Item label="创建时间">2025-03-05 10:00</Descriptions.Item>
                    <Descriptions.Item label="所属项目">具身抓取项目A</Descriptions.Item>
                    <Descriptions.Item label="所属数据集ID">DS-001</Descriptions.Item>
                    <Descriptions.Item label="创建人">管理员</Descriptions.Item>
                </Descriptions>
                <Table columns={detailColumns} dataSource={detailData} size="small" pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条` }} />
            </Modal>
        </MainLayout>
    );
}
