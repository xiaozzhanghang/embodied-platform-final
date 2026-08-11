'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Table, Progress, Typography, Space, Timeline, Button } from 'antd';
import {
    CloudUploadOutlined,
    DatabaseOutlined,
    TagsOutlined,
    CheckCircleOutlined,
    RobotOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    PlusOutlined,
    ThunderboltOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag } from '@/components/ui';

const { Text } = Typography;

const recentTasks = [
    { key: '1', name: 'FRANKA-FR3-抓取任务-001', status: '采集中', robot: 'FRANKA-FR3-1号', progress: 65, time: '2025-03-06 10:30:00' },
    { key: '2', name: 'FRANKA-FR3-放置任务-002', status: '已完成', robot: 'FRANKA-FR3-2号', progress: 100, time: '2025-03-06 09:15:00' },
    { key: '3', name: 'UR5e-抓取任务-003', status: '待采集', robot: 'UR5e-1号', progress: 0, time: '2025-03-06 08:00:00' },
    { key: '4', name: 'FRANKA-FR3-搬运任务-004', status: '处理中', robot: 'FRANKA-FR3-3号', progress: 45, time: '2025-03-05 16:45:00' },
];

const columns = [
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 280 },
    {
        title: '状态', dataIndex: 'status', key: 'status', width: 100,
        render: (s) => <StatusTag status={s}>{s}</StatusTag>,
    },
    { title: '采集机器人', dataIndex: 'robot', key: 'robot', width: 160 },
    {
        title: '进度', dataIndex: 'progress', key: 'progress', width: 200,
        render: (p) => <Progress percent={p} size="small" status={p === 100 ? 'success' : 'active'} />,
    },
    { title: '更新时间', dataIndex: 'time', key: 'time' },
];

const statCards = [
    { title: '采集任务', value: 128, icon: <CloudUploadOutlined />, color: '#1677ff', bg: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)', trend: '+12%', trendUp: true, desc: '本周新增 15 个' },
    { title: '数据总量', value: 15680, icon: <DatabaseOutlined />, color: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', suffix: '条', trend: '+8.5%', trendUp: true, desc: '日均增长 320 条' },
    { title: '标注完成', value: 9542, icon: <TagsOutlined />, color: '#faad14', bg: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)', suffix: '条', trend: '+23%', trendUp: true, desc: '准确率 96.8%' },
    { title: '在线设备', value: 6, icon: <RobotOutlined />, color: '#722ed1', bg: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', suffix: '/ 8', trend: '-1', trendUp: false, desc: '2 台维护中' },
];

export default function DashboardPage() {
    return (
        <MainLayout>
            <div className="ui-page">
                <PageHeader
                    title="你好，管理员，开始新的一天！"
                    description="具身智能数据平台 — 高效采集、智能标注、快速迭代"
                    extra={[
                        <Button key="create" type="primary" icon={<PlusOutlined />}>新建采集任务</Button>,
                        <Button key="parse" icon={<ThunderboltOutlined />}>数据解析</Button>,
                        <Button key="report" icon={<EyeOutlined />}>查看报告</Button>,
                    ]}
                />

                {/* Statistics Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {statCards.map((item, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card
                                className="stat-card-hoverable"
                                styles={{ body: { padding: '20px 24px' } }}
                                style={{ borderTop: `3px solid ${item.color}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className="stat-card-inner">
                                        <Statistic
                                            title={item.title}
                                            value={item.value}
                                            suffix={item.suffix}
                                        />
                                    </div>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12,
                                        background: item.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 22, color: item.color,
                                    }}>
                                        {item.icon}
                                    </div>
                                </div>
                                <div className="stat-card-footer">
                                    <Space>
                                        <Text style={{ color: item.trendUp ? '#52c41a' : '#ff4d4f', fontSize: 13 }}>
                                            {item.trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {item.trend}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{item.desc}</Text>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Main Content: Task Table + Activity Timeline */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card
                            className="ui-table-card"
                            title="最近采集任务"
                            extra={<Button type="link">查看全部 →</Button>}
                            styles={{ body: { padding: '0 0 8px' } }}
                        >
                            <Table
                                columns={columns}
                                dataSource={recentTasks}
                                pagination={false}
                                size="middle"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card
                            className="ui-table-card"
                            title="系统动态"
                            styles={{ body: { paddingTop: 16 } }}
                            style={{ height: '100%' }}
                        >
                            <Timeline
                                items={[
                                    { color: 'blue', content: <><Text strong>张三</Text> <Text type="secondary">完成了采集任务</Text> FRANKA-FR3-001<br /><Text type="secondary" style={{ fontSize: 12 }}>3分钟前</Text></> },
                                    { color: 'green', content: <><Text strong>系统</Text> <Text type="secondary">数据解析任务完成</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>15分钟前</Text></> },
                                    { color: 'orange', content: <><Text strong>李四</Text> <Text type="secondary">提交了标注数据审核</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>30分钟前</Text></> },
                                    { color: 'blue', content: <><Text strong>王五</Text> <Text type="secondary">创建了新的工作流</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>1小时前</Text></> },
                                    { color: 'green', content: <><Text strong>系统</Text> <Text type="secondary">FRANKA-FR3-2号设备上线</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2小时前</Text></> },
                                    { color: 'red', content: <><Text strong>系统</Text> <Text type="secondary">工作流任务运行失败</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>3小时前</Text></> },
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </MainLayout>
    );
}
