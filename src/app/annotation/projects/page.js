'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Row, Col, Card, Modal, Tabs, Popconfirm, Steps, Badge, App, Dropdown, Menu, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, CopyOutlined, TeamOutlined, ScissorOutlined, SettingOutlined, StopOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const annotationMockData = [
    {
        key: '1',
        project: 'SimulatedCollection',
        taskbook: 'TB-2025001-桌面抓取SOP',
        annoId: 'ANNO-778891',
        taskId: 'CT-20250301001',
        instanceId: 'INST-766794',
        name: 'FRANKA-FR3-抓取红色方块-001',
        annoTaskName: '抓取轨迹逐帧标注',
        dataAmount: '153帧',
        dataDuration: '1.2min',
        status: '进行中',
        isShelf: '否',
        shelfPos: '-',
        deviceSN: 'FR3-001-ALPHA',
        qaer: '质检员A',
        annoer: '标注员X',
        reannoer: '审核员Y',
        collector: '张三',
        qaProgress: '100%',
        annoProgress: '60%',
        reannoProgress: '0%',
        annoType: '范围&框标注',
        desc: '标注机器人抓取轨迹的起始帧及手部边界框',
        creator: '管理员',
        createTime: '2025-03-02 09:00',
        annoCount: 92,
        reannoCount: 0
    },
    {
        key: '2',
        project: 'VLA-Data-Lab',
        taskbook: 'TB-2025005-通用操作SOP',
        annoId: 'ANNO-992210',
        taskId: 'CT-20250305022',
        instanceId: 'INST-882231',
        name: 'UR5-放置杯子-022',
        annoTaskName: '杯子放置关键点标注',
        dataAmount: '2000帧',
        dataDuration: '15min',
        status: '已完成',
        isShelf: '是',
        shelfPos: 'B-2-04',
        deviceSN: 'UR5-998-BETA',
        qaer: '质检员B',
        annoer: '标注员M',
        reannoer: '审核员N',
        collector: '李四',
        qaProgress: '100%',
        annoProgress: '100%',
        reannoProgress: '100%',
        annoType: '点标注',
        desc: '标记水杯触底瞬间的关键点位置',
        creator: '张经理',
        createTime: '2025-03-03 14:30',
        annoCount: 2000,
        reannoCount: 2000
    }
];

const splitData = [
    { key: '1', batchId: 'B-001', fileName: 'grasp_batch_001.zip', questionCount: 50, totalData: 200, progress: '80%', annotationId: 'AD-001', status: '完成', createTime: '2025-03-01' }
];

export default function AnnotationProjectsPage() {
    const { message } = App.useApp();
  const router = useRouter();
    const [splitOpen, setSplitOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [packOpen, setPackOpen] = useState(false);
    const [createStep, setCreateStep] = useState(0);

    const columns = [
        { title: '项目', dataIndex: 'project', key: 'project', width: 150, ellipsis: true },
        { title: '任务书', dataIndex: 'taskbook', key: 'taskbook', width: 180, ellipsis: true },
        { title: '标注ID', dataIndex: 'annoId', key: 'annoId', width: 130 },
        { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 130 },
        { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 130 },
        { title: '任务名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
        { title: '标注任务名称', dataIndex: 'annoTaskName', key: 'annoTaskName', width: 200, ellipsis: true },
        { title: '数据量', dataIndex: 'dataAmount', key: 'dataAmount', width: 100 },
        { title: '数据量(分钟)', dataIndex: 'dataDuration', key: 'dataDuration', width: 120 },
        { title: '任务状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={s === '已完成' ? 'success' : 'processing'}>{s}</Tag> },
        { title: '是否货架任务', dataIndex: 'isShelf', key: 'isShelf', width: 110 },
        { title: '行列号', dataIndex: 'shelfPos', key: 'shelfPos', width: 100 },
        { title: '设备SN', dataIndex: 'deviceSN', key: 'deviceSN', width: 150 },
        { title: '质检员', dataIndex: 'qaer', key: 'qaer', width: 100 },
        { title: '标注员', dataIndex: 'annoer', key: 'annoer', width: 100 },
        { title: '审核员', dataIndex: 'reannoer', key: 'reannoer', width: 100 },
        { title: '采集员', dataIndex: 'collector', key: 'collector', width: 100 },
        { title: '质检进度', dataIndex: 'qaProgress', key: 'qaProgress', width: 100 },
        { title: '标注进度', dataIndex: 'annoProgress', key: 'annoProgress', width: 100 },
        { title: '审核进度', dataIndex: 'reannoProgress', key: 'reannoProgress', width: 100 },
        { title: '标注类型', dataIndex: 'annoType', key: 'annoType', width: 120 },
        { title: '任务描述', dataIndex: 'desc', key: 'desc', width: 180, ellipsis: true },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        { title: '标注进度(数量)', dataIndex: 'annoCount', key: 'annoCount', width: 130 },
        { title: '审核进度(数量)', dataIndex: 'reannoCount', key: 'reannoCount', width: 130 },
        {
            title: '操作', key: 'action', width: 220, fixed: 'right',
            render: () => (
                <Space size="small">
                    <Button type="link" size="small">标注</Button>
                    <Button type="link" size="small">审核</Button>
                    <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
                    <Button type="link" size="small" danger>重置</Button>
                </Space>
            ),
        },
    ];

    const splitColumns = [
        { title: '数据批次ID', dataIndex: 'batchId', width: 100 },
        { title: '文件名称', dataIndex: 'fileName', width: 200 },
        { title: '题目数', dataIndex: 'questionCount', width: 80 },
        { title: '数据总量', dataIndex: 'totalData', width: 100 },
        { title: '验收进度', dataIndex: 'progress', width: 100 },
        { title: '标注数据集ID', dataIndex: 'annotationId', width: 120 },
        { title: '状态', dataIndex: 'status', width: 80, render: (s) => <Tag color={s === '完成' ? 'success' : s === '进行中' ? 'processing' : 'error'}>{s}</Tag> },
        { title: '创建时间', dataIndex: 'createTime', width: 120 },
        {
            title: '操作', key: 'action', width: 180,
            render: (_, record) => (
                <Space>
                    {record.status === '完成' && <Button type="link" size="small">投放</Button>}
                    <Popconfirm title="确定删除？"><Button type="link" size="small" danger>删除</Button></Popconfirm>
                    <Button type="link" size="small" danger>作废</Button>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="page-header"><h3 className="page-header-title">标注管理</h3></div>
            <Card className="search-form" style={{ marginBottom: 16 }}>
                <Form layout="inline">
                    <Form.Item label="项目"><Input placeholder="请输入项目" allowClear style={{ width: 150 }} /></Form.Item>
                    <Form.Item label="标注ID"><Input placeholder="请输入标注ID" allowClear style={{ width: 150 }} /></Form.Item>
                    <Form.Item label="标注员"><Input placeholder="姓名" allowClear style={{ width: 120 }} /></Form.Item>
                    <Form.Item><Space><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                </Form>
            </Card>

            <Card>
                <div className="table-toolbar">
                    <span className="table-toolbar-title">标注任务列表</span>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/annotation/projects/create')}>新建项目</Button>
                </div>
                <Table columns={columns} dataSource={annotationMockData} scroll={{ x: 4000 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
            </Card>


            <Modal title="分配权限" open={assignOpen} onCancel={() => setAssignOpen(false)} footer={null} width={600}>
                <Tabs
                    defaultActiveKey="annotator"
                    items={[
                        { key: 'annotator', label: '标注权限', children: <><Form layout="inline" style={{ marginBottom: 16 }}><Form.Item label="选择标注员"><Select mode="multiple" placeholder="请选择" style={{ width: 300 }} options={[{ value: '标注员A' }, { value: '标注员B' }, { value: '标注员C' }]} /></Form.Item><Form.Item><Button type="primary" onClick={() => message.success('分配成功')}>确认分配</Button></Form.Item></Form></> },
                        { key: 'reviewer', label: '一审权限', children: <><Form layout="inline" style={{ marginBottom: 16 }}><Form.Item label="选择审核员"><Select mode="multiple" placeholder="请选择" style={{ width: 300 }} options={[{ value: '审核员A' }, { value: '审核员B' }]} /></Form.Item><Form.Item><Button type="primary" onClick={() => message.success('分配成功')}>确认分配</Button></Form.Item></Form></> },
                        { key: 'acceptor', label: '验收权限', children: <><Form layout="inline" style={{ marginBottom: 16 }}><Form.Item label="选择验收员"><Select mode="multiple" placeholder="请选择" style={{ width: 300 }} options={[{ value: '验收员A' }, { value: '验收组长B' }]} /></Form.Item><Form.Item><Button type="primary" onClick={() => message.success('分配成功')}>确认分配</Button></Form.Item></Form></> },
                    ]}
                />
            </Modal>

            <Modal title="拆分 - 导入待标注数据" open={splitOpen} onCancel={() => setSplitOpen(false)} footer={null} width={900}>
                <Card className="search-form" size="small" style={{ marginBottom: 16 }}>
                    <Form layout="inline" size="small">
                        <Form.Item label="状态"><Select placeholder="全部" allowClear style={{ width: 100 }} options={[{ value: '完成' }, { value: '进行中' }, { value: '异常' }]} /></Form.Item>
                        <Form.Item label="文件名称"><Input placeholder="请输入" allowClear style={{ width: 140 }} /></Form.Item>
                        <Form.Item label="数据批次ID"><Input placeholder="请输入" allowClear style={{ width: 120 }} /></Form.Item>
                        <Form.Item><Space><Button type="primary" size="small" icon={<SearchOutlined />}>查询</Button><Button size="small" icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                    </Form>
                </Card>
                <Table columns={splitColumns} dataSource={splitData} size="small" pagination={{ pageSize: 5 }} />
            </Modal>

            <Modal title="题包管理" open={packOpen} onCancel={() => setPackOpen(false)} footer={null} width={800}>
                <Table
                    size="small"
                    dataSource={[
                        { key: '1', packId: 'PK-001', name: '题包001', status: '已投放', annotator: '标注员A', progress: '80%', createTime: '2025-03-01' },
                        { key: '2', packId: 'PK-002', name: '题包002', status: '待投放', annotator: '-', progress: '0%', createTime: '2025-03-02' },
                        { key: '3', packId: 'PK-003', name: '题包003', status: '已完成', annotator: '标注员B', progress: '100%', createTime: '2025-03-01' },
                    ]}
                    columns={[
                        { title: '题包ID', dataIndex: 'packId', width: 100 },
                        { title: '题包名称', dataIndex: 'name', width: 120 },
                        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === '已完成' ? 'success' : s === '已投放' ? 'processing' : 'default'}>{s}</Tag> },
                        { title: '标注员', dataIndex: 'annotator', width: 100 },
                        { title: '进度', dataIndex: 'progress', width: 80 },
                        { title: '创建时间', dataIndex: 'createTime', width: 120 },
                        {
                            title: '操作', key: 'action', width: 200,
                            render: (_, r) => (
                                <Space>
                                    <Button type="link" size="small">下载题包</Button>
                                    {r.status === '已投放' && <Button type="link" size="small" danger>回收题包</Button>}
                                    <Button type="link" size="small">题包追溯</Button>
                                </Space>
                            ),
                        },
                    ]}
                />
            </Modal>
        </MainLayout>
    );
}
