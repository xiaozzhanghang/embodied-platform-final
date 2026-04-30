'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Progress, Statistic, Row, Col, DatePicker, App } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, EyeOutlined, DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const mockData = [
    { key: '1', projectId: 'AP-001', name: '具身抓取标注项目', progress: 60, totalPacks: 20, pendingPacks: 5, inProgressPacks: 3, passedPacks: 10, rejectedPacks: 2, scene: '二维框选标注' },
    { key: '2', projectId: 'AP-002', name: 'VLA动作标注项目', progress: 35, totalPacks: 15, pendingPacks: 6, inProgressPacks: 2, passedPacks: 5, rejectedPacks: 2, scene: 'VLA标注' },
    { key: '3', projectId: 'AP-003', name: '视频质检项目', progress: 100, totalPacks: 10, pendingPacks: 0, inProgressPacks: 0, passedPacks: 10, rejectedPacks: 0, scene: '视频质检' },
];

const packData = [
    { key: '1', packId: 'PK-001', name: '题包001', annotator: '标注员A', reviewer: '审核员A', status: '待验收' },
    { key: '2', packId: 'PK-002', name: '题包002', annotator: '标注员B', reviewer: '审核员A', status: '验收通过' },
    { key: '3', packId: 'PK-003', name: '题包003', annotator: '标注员A', reviewer: '审核员B', status: '验收中' },
    { key: '4', packId: 'PK-004', name: '题包004', annotator: '标注员C', reviewer: '审核员A', status: '验收打回' },
];

export default function AcceptancePage() {
  const { message } = App.useApp();
    const [packOpen, setPackOpen] = useState(false);
    const [acceptOpen, setAcceptOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    const columns = [
        { title: '项目ID', dataIndex: 'projectId', width: 100 },
        { title: '项目名称', dataIndex: 'name', width: 200 },
        { title: '验收进度', dataIndex: 'progress', width: 160, render: (p) => <Progress percent={p} size="small" status={p === 100 ? 'success' : 'active'} /> },
        { title: '总题包数', dataIndex: 'totalPacks', width: 100 },
        { title: '待验收', dataIndex: 'pendingPacks', width: 80 },
        { title: '验收中', dataIndex: 'inProgressPacks', width: 80 },
        { title: '验收通过', dataIndex: 'passedPacks', width: 90, render: (v) => <Tag color="success">{v}</Tag> },
        { title: '验收打回', dataIndex: 'rejectedPacks', width: 90, render: (v) => <Tag color={v > 0 ? 'error' : 'default'}>{v}</Tag> },
        { title: '标注场景', dataIndex: 'scene', width: 140 },
        {
            title: '操作', key: 'action', width: 220,
            render: () => (
                <Space>
                    <Button type="primary" size="small" onClick={() => setPackOpen(true)}>验收</Button>
                    <Button size="small" icon={<EyeOutlined />}>查看</Button>
                    <Button size="small" icon={<ExportOutlined />} onClick={() => setExportOpen(true)}>验收统计</Button>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="page-header"><h3 className="page-header-title">验收管理</h3></div>
                <Card className="search-form" style={{ marginBottom: 16 }}>
                    <Form layout="inline">
                        <Form.Item label="项目ID"><Input placeholder="请输入" allowClear style={{ width: 120 }} /></Form.Item>
                        <Form.Item label="项目名称"><Input placeholder="请输入" allowClear style={{ width: 180 }} /></Form.Item>
                        <Form.Item label="标注场景"><Select placeholder="全部" allowClear style={{ width: 140 }} options={[{ value: '二维框选标注' }, { value: 'VLA标注' }, { value: '视频质检' }]} /></Form.Item>
                        <Form.Item><Space><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                    </Form>
                </Card>

                <Card>
                    <div className="table-toolbar"><span className="table-toolbar-title">验收管理列表</span></div>
                    <Table columns={columns} dataSource={mockData} scroll={{ x: 1400 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <Modal title="验收列表" open={packOpen} onCancel={() => setPackOpen(false)} footer={null} width={800}>
                    <Table
                        size="small"
                        dataSource={packData}
                        columns={[
                            { title: '题包ID', dataIndex: 'packId', width: 100 },
                            { title: '题包名称', dataIndex: 'name', width: 120 },
                            { title: '标注员', dataIndex: 'annotator', width: 100 },
                            { title: '审核员', dataIndex: 'reviewer', width: 100 },
                            { title: '状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === '验收通过' ? 'success' : s === '验收打回' ? 'error' : s === '验收中' ? 'processing' : 'default'}>{s}</Tag> },
                            {
                                title: '操作', key: 'action', width: 250,
                                render: (_, record) => (
                                    <Space>
                                        {record.status === '待验收' && <Button type="primary" size="small" onClick={() => setAcceptOpen(true)}>验收</Button>}
                                        {record.status === '验收通过' && <Button size="small">查看</Button>}
                                        {record.status === '验收打回' && <Tag color="error">已打回至审核管理</Tag>}
                                    </Space>
                                ),
                            },
                        ]}
                    />
                </Modal>

                <Modal
                    title="验收工作台"
                    open={acceptOpen}
                    onCancel={() => setAcceptOpen(false)}
                    footer={
                        <Space>
                            <Button onClick={() => setAcceptOpen(false)}>退出</Button>
                            <Button onClick={() => message.info('上一题')}>上一题</Button>
                            <Button onClick={() => message.info('下一题')}>下一题</Button>
                            <Button danger icon={<CloseOutlined />} onClick={() => { setAcceptOpen(false); message.warning('已打回至审核管理'); }}>打回</Button>
                            <Button type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => { setAcceptOpen(false); message.success('验收通过'); }}>通过</Button>
                        </Space>
                    }
                    width={1000}
                >
                    <div style={{ display: 'flex', gap: 16, minHeight: 400 }}>
                        <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#999' }}>
                                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                                <div>验收审查区域</div>
                                <div style={{ fontSize: 12 }}>查看标注和审核结果进行最终验收</div>
                            </div>
                        </div>
                        <div style={{ width: 250, background: '#fafafa', borderRadius: 8, padding: 16 }}>
                            <Title level={5} style={{ marginBottom: 12 }}>标注&审核结果</Title>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="red">方块</Tag> <Tag color="green">审核通过</Tag>
                            </Card>
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <Tag color="blue">圆柱</Tag> <Tag color="green">审核通过</Tag>
                            </Card>
                            <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>验收意见</Title>
                            <Input.TextArea rows={3} placeholder="请输入验收意见（选填）" />
                        </div>
                    </div>
                </Modal>

                <Modal title="验收统计" open={exportOpen} onCancel={() => setExportOpen(false)} footer={
                    <Button type="primary" icon={<DownloadOutlined />} onClick={() => { setExportOpen(false); message.success('导出成功'); }}>导出验收列表</Button>
                } width={500}>
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="验收状态"><Select placeholder="全部" options={[{ value: '验收通过' }, { value: '验收打回' }, { value: '待验收' }]} /></Form.Item>
                        <Form.Item label="时间范围"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
                    </Form>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                        <Col span={8}><Statistic title="验收通过" value={10} valueStyle={{ color: '#52c41a' }} /></Col>
                        <Col span={8}><Statistic title="验收打回" value={2} valueStyle={{ color: '#ff4d4f' }} /></Col>
                        <Col span={8}><Statistic title="待验收" value={5} /></Col>
                    </Row>
                </Modal>
            </MainLayout>
    );
}
