'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Progress, App, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, PlayCircleOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title } = Typography;

const mockData = [
    { key: '1', projectId: 'AP-001', name: '具身抓取标注项目', startTime: '2025-02-01 10:00', progress: 65, scene: '二维框选标注', publishTime: '2025-02-01 12:00' },
    { key: '2', projectId: 'AP-002', name: 'VLA动作标注项目', startTime: '2025-02-15 14:00', progress: 40, scene: 'VLA标注', publishTime: '2025-02-15 16:00' },
];

const packData = [
    { key: '1', packId: 'PK-001', name: '题包001', annotator: '标注员A', total: 50, reviewed: 35, status: '审核中' },
    { key: '2', packId: 'PK-002', name: '题包002', annotator: '标注员B', total: 45, reviewed: 45, status: '已通过' },
    { key: '3', packId: 'PK-003', name: '题包003', annotator: '标注员C', total: 55, reviewed: 0, status: '待审核' },
];

export default function ReviewPage() {
  const { message } = App.useApp();
    const [packOpen, setPackOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [filters, setFilters] = useState({});

    const filteredData = React.useMemo(() => {
        return mockData.filter(item => {
            const idMatch = !filters.projectId || item.projectId.toLowerCase().includes(filters.projectId.toLowerCase());
            const nameMatch = !filters.name || item.name.toLowerCase().includes(filters.name.toLowerCase());
            const sceneMatch = !filters.scene || item.scene === filters.scene;
            return idMatch && nameMatch && sceneMatch;
        });
    }, [filters]);

    const columns = [
        { title: '项目ID', dataIndex: 'projectId', width: 100 },
        { title: '项目名称', dataIndex: 'name', width: 200 },
        { title: '项目开始时间', dataIndex: 'startTime', width: 170 },
        { title: '审核进度', dataIndex: 'progress', width: 200, render: (p) => <Progress percent={p} size="small" /> },
        { title: '标注场景', dataIndex: 'scene', width: 140 },
        { title: '发布时间', dataIndex: 'publishTime', width: 170 },
        {
            title: '操作', key: 'action', width: 150, fixed: 'right',
            render: () => <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => setPackOpen(true)}>开始审核</Button>,
        },
    ];

    return (
            <MainLayout>
                <div className="ui-page">
                <PageHeader
                    title="审核管理"
                    description="查看待审核项目，进入题包完成审核与结果确认。"
                    breadcrumbs={[{ title: '首页' }, { title: '数据标注' }, { title: '审核管理' }]}
                />
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
                        <ProFormText name="projectId" label="项目ID" placeholder="请输入" />
                        <ProFormText name="name" label="项目名称" placeholder="请输入" />
                        <ProFormSelect name="scene" label="标注场景" placeholder="全部" options={[{ value: '二维框选标注', label: '二维框选标注' }, { value: 'VLA标注', label: 'VLA标注' }, { value: '视频质检', label: '视频质检' }]} />
                    </QueryFilter>
                </FilterPanel>
 
                <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
                    <TableToolbar title="审核管理列表" count={filteredData.length} />
                    <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <Modal title="题包列表" open={packOpen} onCancel={() => setPackOpen(false)} footer={null} width={700}>
                    <Table
                        size="small"
                        dataSource={packData}
                        columns={[
                            { title: '题包ID', dataIndex: 'packId', width: 100 },
                            { title: '题包名称', dataIndex: 'name', width: 120 },
                            { title: '标注员', dataIndex: 'annotator', width: 100 },
                            { title: '题目数', dataIndex: 'total', width: 80 },
                            { title: '已审核', dataIndex: 'reviewed', width: 80 },
                            { title: '状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s} /> },
                            {
                                title: '操作', key: 'action', width: 200, fixed: 'right',
                                render: (_, record) => (
                                    <Space>
                                        {record.status !== '已通过' && <Button type="primary" size="small" onClick={() => setReviewOpen(true)}>开始审核</Button>}
                                        {record.status === '已通过' && <Button size="small" onClick={() => setReviewOpen(true)}>查看详情</Button>}
                                    </Space>
                                ),
                            },
                        ]}
                    />
                </Modal>

                <Modal
                    title="审核工作台"
                    open={reviewOpen}
                    onCancel={() => setReviewOpen(false)}
                    footer={
                        <Space>
                            <Button onClick={() => setReviewOpen(false)}>退出</Button>
                            <Button onClick={() => message.info('上一题')}>上一题</Button>
                            <Button onClick={() => message.info('下一题')}>下一题</Button>
                            <Button danger icon={<CloseOutlined />} onClick={() => { setReviewOpen(false); message.warning('已打回'); }}>打回</Button>
                            <Button type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => { setReviewOpen(false); message.success('已通过'); }}>通过</Button>
                        </Space>
                    }
                    width={1000}
                >
                    <div style={{ display: 'flex', gap: 16, minHeight: 400 }}>
                        <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#999' }}>
                                <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
                                <div>标注结果审核区域</div>
                                <div style={{ fontSize: 12 }}>查看标注员提交的标注结果</div>
                            </div>
                        </div>
                        <div style={{ width: 250, background: '#fafafa', borderRadius: 8, padding: 16 }}>
                            <Title level={5} style={{ marginBottom: 12 }}>标注结果</Title>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="red">方块</Tag> <Tag color="green">准确</Tag>
                            </Card>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="blue">圆柱</Tag> <Tag color="green">准确</Tag>
                            </Card>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="purple">球体</Tag> <Tag color="orange">待确认</Tag>
                            </Card>
                        </div>
                    </div>
                </Modal>
                </div>
            </MainLayout>
    );
}
