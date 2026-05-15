'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Modal, Descriptions, Popconfirm, App } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, StopOutlined, RedoOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockData = [
    { key: '1', id: 1, name: 'rosbag解析任务-001', status: '运行成功', taskId: 'WT-001', priority: '高', workflowId: 'WF-001', startTime: '2025-03-05 10:00', endTime: '2025-03-05 10:30', runTime: '30分钟', creator: '管理员', createTime: '2025-03-05 09:55' },
    { key: '2', id: 2, name: 'HDF5转换任务-001', status: '运行中', taskId: 'WT-002', priority: '中', workflowId: 'WF-002', startTime: '2025-03-06 09:00', endTime: '-', runTime: '进行中', creator: '管理员', createTime: '2025-03-06 08:55' },
    { key: '3', id: 3, name: '视频抽帧任务-001', status: '运行失败', taskId: 'WT-003', priority: '高', workflowId: 'WF-003', startTime: '2025-03-06 08:00', endTime: '2025-03-06 08:15', runTime: '15分钟', creator: '张三', createTime: '2025-03-06 07:55' },
    { key: '4', id: 4, name: '点云预处理任务-001', status: '排队中', taskId: 'WT-004', priority: '低', workflowId: 'WF-004', startTime: '-', endTime: '-', runTime: '-', creator: '管理员', createTime: '2025-03-06 10:00' },
    { key: '5', id: 5, name: 'rosbag解析任务-002', status: '运行成功', taskId: 'WT-005', priority: '中', workflowId: 'WF-001', startTime: '2025-03-04 14:00', endTime: '2025-03-04 14:45', runTime: '45分钟', creator: '李四', createTime: '2025-03-04 13:55' },
];

const statusMap = {
    '运行成功': { color: 'success', tagColor: 'green' },
    '运行中': { color: 'processing', tagColor: 'blue' },
    '运行失败': { color: 'error', tagColor: 'red' },
    '排队中': { color: 'warning', tagColor: 'orange' },
};

const priorityMap = { '高': 'red', '中': 'orange', '低': 'blue' };

export default function WorkflowTaskPage() {
    const { message } = App.useApp();
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const columns = [
        { title: '序号', dataIndex: 'id', key: 'id', width: 60 },
        { title: '任务名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={statusMap[s]?.tagColor}>{s}</Tag> },
        { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 100 },
        { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p) => <Tag color={priorityMap[p]}>{p}</Tag> },
        { title: '工作流ID', dataIndex: 'workflowId', key: 'workflowId', width: 100 },
        { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
        { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 160 },
        { title: '运行时间', dataIndex: 'runTime', key: 'runTime', width: 100 },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
        {
            title: '操作', key: 'action', width: 220, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedTask(record); setDetailOpen(true); }}>查看详情</Button>
                    {record.status === '运行中' && <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => message.warning('任务已终止')}>终止</Button>}
                    {record.status === '运行失败' && <Button type="link" size="small" icon={<RedoOutlined />} onClick={() => message.success('重新运行')}>重启</Button>}
                    <Popconfirm title="确定删除？" onConfirm={() => message.success('已删除')}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="page-header"><h3 className="page-header-title">预设工具</h3></div>
            <Card className="search-form" style={{ marginBottom: 16 }}>
                <Form layout="inline">
                    <Form.Item label="工作流ID"><Input placeholder="请输入" allowClear style={{ width: 120 }} /></Form.Item>
                    <Form.Item label="任务名称"><Input placeholder="请输入" allowClear style={{ width: 180 }} /></Form.Item>
                    <Form.Item label="任务ID"><Input placeholder="请输入" allowClear style={{ width: 120 }} /></Form.Item>
                    <Form.Item label="创建人"><Input placeholder="请输入" allowClear style={{ width: 120 }} /></Form.Item>
                    <Form.Item><Space><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                </Form>
            </Card>

            <Card>
                <div className="table-toolbar"><span className="table-toolbar-title">任务列表</span></div>
                <Table columns={columns} dataSource={mockData} scroll={{ x: 1600 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
            </Card>

            <Modal title="任务运行详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700}>
                {selectedTask && (
                    <>
                        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="任务名称">{selectedTask.name}</Descriptions.Item>
                            <Descriptions.Item label="任务ID">{selectedTask.taskId}</Descriptions.Item>
                            <Descriptions.Item label="工作流ID">{selectedTask.workflowId}</Descriptions.Item>
                            <Descriptions.Item label="优先级"><Tag color={priorityMap[selectedTask.priority]}>{selectedTask.priority}</Tag></Descriptions.Item>
                            <Descriptions.Item label="状态"><Tag color={statusMap[selectedTask.status]?.tagColor}>{selectedTask.status}</Tag></Descriptions.Item>
                            <Descriptions.Item label="运行时间">{selectedTask.runTime}</Descriptions.Item>
                            <Descriptions.Item label="开始时间">{selectedTask.startTime}</Descriptions.Item>
                            <Descriptions.Item label="结束时间">{selectedTask.endTime}</Descriptions.Item>
                        </Descriptions>
                        <Card size="small" title="运行日志" style={{ background: '#001529', color: '#52c41a' }}>
                            <pre style={{ color: '#52c41a', fontSize: 12, maxHeight: 200, overflow: 'auto', margin: 0 }}>
                                {`[2025-03-05 10:00:01] 任务开始运行...
[2025-03-05 10:00:02] 加载输入节点配置...
[2025-03-05 10:00:03] 输入数据路径: /data/raw/rosbag_001
[2025-03-05 10:00:05] 启动数据解析节点...
[2025-03-05 10:05:00] 解析进度: 25%
[2025-03-05 10:15:00] 解析进度: 50%
[2025-03-05 10:25:00] 解析进度: 75%
[2025-03-05 10:30:00] 解析进度: 100%
[2025-03-05 10:30:01] 数据写入输出节点...
[2025-03-05 10:30:02] 任务运行完成 ✓`}
                            </pre>
                        </Card>
                    </>
                )}
            </Modal>
        </MainLayout>
    );
}
