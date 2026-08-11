'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Tabs, Modal, App } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title } = Typography;

const taskListData = [
    { key: '1', taskId: 'AT-001', name: '具身抓取标注任务', scene: '二维框选标注', type: '框选', count: 200, deadline: '2025-04-01', status: '可领取', reward: '¥2.5/条' },
    { key: '2', taskId: 'AT-002', name: 'VLA动作标注任务', scene: 'VLA标注', type: '音视频分段', count: 150, deadline: '2025-03-30', status: '可领取', reward: '¥3.0/条' },
    { key: '3', taskId: 'AT-003', name: '视频质检任务', scene: '视频质检', type: '质检', count: 300, deadline: '2025-04-15', status: '已领满', reward: '¥1.5/条' },
    { key: '4', taskId: 'AT-004', name: '搬运动作标注', scene: '二维框选标注', type: '框选', count: 100, deadline: '2025-03-25', status: '可领取', reward: '¥2.5/条' },
];

const claimedTaskData = [
    { key: '1', taskId: 'AT-001', name: '具身抓取标注任务', scene: '二维框选标注', total: 50, completed: 35, progress: 70, status: '进行中', deadline: '2025-04-01' },
    { key: '2', taskId: 'AT-002', name: 'VLA动作标注任务', scene: 'VLA标注', total: 30, completed: 30, progress: 100, status: '已完成', deadline: '2025-03-30' },
];

export default function MarketplacePage() {
    const { message } = App.useApp();
    const [detailOpen, setDetailOpen] = useState(false);
    const [filters, setFilters] = useState({});

    const filteredTasks = React.useMemo(() => {
        return taskListData.filter(item => {
            const nameMatch = !filters.name || item.name.toLowerCase().includes(filters.name.toLowerCase()) || item.taskId.toLowerCase().includes(filters.name.toLowerCase());
            const sceneMatch = !filters.scene || item.scene.toLowerCase().includes(filters.scene.toLowerCase());
            return nameMatch && sceneMatch;
        });
    }, [filters]);

    const taskColumns = [
        { title: '任务ID', dataIndex: 'taskId', width: 100 },
        { title: '任务名称', dataIndex: 'name', width: 200 },
        { title: '标注场景', dataIndex: 'scene', width: 140 },
        { title: '题型', dataIndex: 'type', width: 100 },
        { title: '数量', dataIndex: 'count', width: 80 },
        { title: '截止日期', dataIndex: 'deadline', width: 120 },
        { title: '报酬', dataIndex: 'reward', width: 100 },
        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s} /> },
        {
            title: '操作', key: 'action', width: 180, fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailOpen(true)}>查看详情</Button>
                    {record.status === '可领取' && <Button type="primary" size="small" onClick={() => message.success('领取成功')}>领取任务</Button>}
                </Space>
            ),
        },
    ];

    const claimedColumns = [
        { title: '任务ID', dataIndex: 'taskId', width: 100 },
        { title: '任务名称', dataIndex: 'name', width: 200 },
        { title: '标注场景', dataIndex: 'scene', width: 140 },
        { title: '总量', dataIndex: 'total', width: 80 },
        { title: '已完成', dataIndex: 'completed', width: 80 },
        { title: '进度', dataIndex: 'progress', width: 100, render: (p) => <Tag color={p === 100 ? 'success' : 'processing'}>{p}%</Tag> },
        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s} /> },
        { title: '截止日期', dataIndex: 'deadline', width: 120 },
        {
            title: '操作', key: 'action', width: 150, fixed: 'right',
            render: (_, record) => (
                <Space>
                    {record.status === '进行中' && <Button type="primary" size="small">继续标注</Button>}
                    {record.status === '已完成' && <Button type="link" size="small">查看结果</Button>}
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="ui-page">
            <PageHeader
                title="题包列表"
                description="浏览可领取标注任务并跟踪已领取任务的完成进度。"
                breadcrumbs={[{ title: '首页' }, { title: '数据标注' }, { title: '题包列表' }]}
            />
            <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
                <Tabs
                    defaultActiveKey="list"
                    style={{ padding: '0 16px' }}
                    items={[
                        {
                            key: 'list', label: '任务列表',
                             children: (
                                <>
                                    <FilterPanel>
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
                                        <ProFormText name="name" label="任务名称" placeholder="请输入" />
                                        <ProFormText name="scene" label="标注场景" placeholder="请输入" />
                                    </QueryFilter>
                                    </FilterPanel>
                                    <TableToolbar title="可领取任务" count={filteredTasks.length} />
                                    <Table columns={taskColumns} dataSource={filteredTasks} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                                </>
                            ),
                        },
                        {
                            key: 'claimed', label: '已领任务',
                            children: (
                                <>
                                    <TableToolbar title="已领任务" count={claimedTaskData.length} />
                                    <Table columns={claimedColumns} dataSource={claimedTaskData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                                </>
                            ),
                        },
                    ]}
                />
            </Card>

            <AppModal title="任务详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={<Button type="primary" onClick={() => { setDetailOpen(false); message.success('领取成功'); }}>领取任务</Button>} widthSize="medium">
                <Card size="small" style={{ marginBottom: 16 }}>
                    <p><strong>任务名称：</strong>具身抓取标注任务</p>
                    <p><strong>标注场景：</strong>二维框选标注</p>
                    <p><strong>题型：</strong>框选</p>
                    <p><strong>任务描述：</strong>对采集的桌面抓取场景图像进行物体框选标注，标注物体类别和位置。</p>
                    <p><strong>数据总量：</strong>200条</p>
                    <p><strong>截止日期：</strong>2025-04-01</p>
                    <p><strong>报酬：</strong>¥2.5/条</p>
                </Card>
            </AppModal>
            </div>
        </MainLayout>
    );
}
