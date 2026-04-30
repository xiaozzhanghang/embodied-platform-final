'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Progress, App } from 'antd';
import { SearchOutlined, ReloadOutlined, PlayCircleOutlined, EyeOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const mockData = [
    { key: '1', projectId: 'AP-001', name: '具身抓取标注项目', startTime: '2025-02-01 10:00', progress: 70, scene: '二维框选标注', publishTime: '2025-02-01 12:00' },
    { key: '2', projectId: 'AP-002', name: 'VLA动作标注项目', startTime: '2025-02-15 14:00', progress: 45, scene: 'VLA标注', publishTime: '2025-02-15 16:00' },
    { key: '3', projectId: 'AP-003', name: '视频质检项目', startTime: '2025-01-10 09:00', progress: 100, scene: '视频质检', publishTime: '2025-01-10 11:00' },
];

const packData = [
    { key: '1', packId: 'PK-001', name: '题包001', total: 50, annotated: 35, status: '标注中' },
    { key: '2', packId: 'PK-002', name: '题包002', total: 45, annotated: 45, status: '已完成' },
    { key: '3', packId: 'PK-003', name: '题包003', total: 55, annotated: 0, status: '待标注' },
];

export default function AnswerPage() {
  const { message } = App.useApp();
    const [packOpen, setPackOpen] = useState(false);
    const [answerOpen, setAnswerOpen] = useState(false);

    const columns = [
        { title: '项目ID', dataIndex: 'projectId', width: 100 },
        { title: '项目名称', dataIndex: 'name', width: 200 },
        { title: '项目开始时间', dataIndex: 'startTime', width: 170 },
        { title: '标注进度', dataIndex: 'progress', width: 200, render: (p) => <Progress percent={p} size="small" status={p === 100 ? 'success' : 'active'} /> },
        { title: '标注场景', dataIndex: 'scene', width: 140 },
        { title: '发布时间', dataIndex: 'publishTime', width: 170 },
        {
            title: '操作', key: 'action', width: 150,
            render: (_, record) => (
                <Space>
                    {record.progress < 100 && <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => setPackOpen(true)}>开始答题</Button>}
                    {record.progress === 100 && <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>}
                </Space>
            ),
        },
    ];

    const packColumns = [
        { title: '题包ID', dataIndex: 'packId', width: 100 },
        { title: '题包名称', dataIndex: 'name', width: 120 },
        { title: '总题目数', dataIndex: 'total', width: 100 },
        { title: '已标注数', dataIndex: 'annotated', width: 100 },
        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === '已完成' ? 'success' : s === '标注中' ? 'processing' : 'default'}>{s}</Tag> },
        {
            title: '操作', key: 'action', width: 150,
            render: (_, record) => (
                <Space>
                    {record.status !== '已完成' && <Button type="primary" size="small" onClick={() => setAnswerOpen(true)}>去答题</Button>}
                    {record.status === '已完成' && <Button type="link" size="small">查看</Button>}
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="page-header"><h3 className="page-header-title">答题管理</h3></div>
                <Card className="search-form" style={{ marginBottom: 16 }}>
                    <Form layout="inline">
                        <Form.Item label="项目名称"><Input placeholder="请输入" allowClear style={{ width: 180 }} /></Form.Item>
                        <Form.Item label="标注场景"><Select placeholder="全部" allowClear style={{ width: 140 }} options={[{ value: '二维框选标注' }, { value: 'VLA标注' }, { value: '视频质检' }]} /></Form.Item>
                        <Form.Item><Space><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                    </Form>
                </Card>

                <Card>
                    <div className="table-toolbar"><span className="table-toolbar-title">答题管理列表</span></div>
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <Modal title="题包列表" open={packOpen} onCancel={() => setPackOpen(false)} footer={null} width={700}>
                    <div style={{ marginBottom: 16 }}>
                        <Select placeholder="筛选状态" allowClear style={{ width: 150 }} options={[{ value: '待标注' }, { value: '标注中' }, { value: '已完成' }]} />
                    </div>
                    <Table columns={packColumns} dataSource={packData} size="small" />
                </Modal>

                <Modal
                    title="标注工作台"
                    open={answerOpen}
                    onCancel={() => setAnswerOpen(false)}
                    footer={
                        <Space>
                            <Button onClick={() => setAnswerOpen(false)}>退出</Button>
                            <Button onClick={() => message.info('上一题')}>上一题</Button>
                            <Button type="primary" onClick={() => message.info('下一题')}>下一题</Button>
                            <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => { setAnswerOpen(false); message.success('提交成功'); }}>提交</Button>
                        </Space>
                    }
                    width={1000}
                >
                    <div style={{ display: 'flex', gap: 16, minHeight: 400 }}>
                        <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ textAlign: 'center', color: '#999' }}>
                                <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
                                <div>图像标注区域</div>
                                <div style={{ fontSize: 12 }}>左侧工具栏支持标注、选择、移动等工具</div>
                            </div>
                            <div style={{ position: 'absolute', left: 8, top: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Button size="small" type="default">✏️</Button>
                                <Button size="small" type="default">⬜</Button>
                                <Button size="small" type="default">🖱️</Button>
                                <Button size="small" type="default">↔️</Button>
                                <Button size="small" type="default">🔍</Button>
                            </div>
                        </div>
                        <div style={{ width: 250, background: '#fafafa', borderRadius: 8, padding: 16 }}>
                            <Title level={5} style={{ marginBottom: 12 }}>标注结果</Title>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="red">方块</Tag> <span style={{ fontSize: 12 }}>x:120 y:80 w:60 h:60</span>
                            </Card>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="blue">圆柱</Tag> <span style={{ fontSize: 12 }}>x:200 y:150 w:40 h:80</span>
                            </Card>
                            <Button type="primary" block style={{ marginTop: 16 }}>确认标注</Button>
                        </div>
                    </div>
                </Modal>
            </MainLayout>
    );
}
