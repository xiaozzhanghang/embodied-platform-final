'use client';

import React from 'react';
import { Card, Typography, Row, Col, Statistic, Table, Tag, Tabs, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title, Text } = Typography;

const projectStatsData = [
    { key: '1', project: '具身抓取项目A', total: 500, annotated: 350, reviewed: 280, accepted: 200, annotators: 5 },
    { key: '2', project: '具身搬运项目B', total: 300, annotated: 180, reviewed: 120, accepted: 80, annotators: 3 },
    { key: '3', project: 'VLA标注项目E', total: 800, annotated: 600, reviewed: 500, accepted: 450, annotators: 8 },
];

const progressData = [
    { key: '1', projectId: 'P-001', name: '具身抓取项目A', progress: 70, status: '进行中', startTime: '2025-02-01', endTime: '2025-04-01' },
    { key: '2', projectId: 'P-002', name: '具身搬运项目B', progress: 45, status: '进行中', startTime: '2025-02-15', endTime: '2025-04-15' },
    { key: '3', projectId: 'P-005', name: 'VLA标注项目E', progress: 90, status: '即将完成', startTime: '2025-01-15', endTime: '2025-03-15' },
];

const taskDetailData = [
    { key: '1', taskId: 'T-001', name: '抓取标注任务-01', annotator: '标注员A', progress: 80, status: '进行中', startTime: '2025-03-01' },
    { key: '2', taskId: 'T-002', name: '抓取标注任务-02', annotator: '标注员B', progress: 100, status: '已完成', startTime: '2025-03-01' },
    { key: '3', taskId: 'T-003', name: '搬运标注任务-01', annotator: '标注员C', progress: 30, status: '进行中', startTime: '2025-03-03' },
];

const capacityData = [
    { key: '1', annotator: '标注员A', daily: 45, weekly: 210, monthly: 890, accuracy: 96.5 },
    { key: '2', annotator: '标注员B', daily: 52, weekly: 245, monthly: 980, accuracy: 98.2 },
    { key: '3', annotator: '标注员C', daily: 38, weekly: 185, monthly: 760, accuracy: 94.8 },
    { key: '4', annotator: '标注员D', daily: 60, weekly: 280, monthly: 1120, accuracy: 97.1 },
];

export default function StatsPage() {
    return (
        <MainLayout>
            <div className="ui-page">
            <PageHeader
                title="项目统计"
                description="汇总标注项目进度、团队产能与结算状态。"
                breadcrumbs={[{ title: '首页' }, { title: '数据标注' }, { title: '项目统计' }]}
            />
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}><Card hoverable><Statistic title="总项目数" value={12} prefix={<FileTextOutlined style={{ color: '#1677ff' }} />} /></Card></Col>
                <Col span={6}><Card hoverable><Statistic title="待标注数据" value={1580} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} suffix="条" /></Card></Col>
                <Col span={6}><Card hoverable><Statistic title="已完成标注" value={9542} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} suffix="条" /></Card></Col>
                <Col span={6}><Card hoverable><Statistic title="标注团队人数" value={16} prefix={<TeamOutlined style={{ color: '#722ed1' }} />} suffix="人" /></Card></Col>
            </Row>

            <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
                <TableToolbar title="统计明细" />
                <Tabs
                    defaultActiveKey="projectStats"
                    style={{ padding: '0 16px 16px' }}
                    items={[
                        {
                            key: 'projectStats', label: '项目统计',
                            children: (
                                <Table
                                    dataSource={projectStatsData}
                                    columns={[
                                        { title: '项目名称', dataIndex: 'project', width: 200 },
                                        { title: '总数据量', dataIndex: 'total', width: 100 },
                                        { title: '已标注', dataIndex: 'annotated', width: 100 },
                                        { title: '已审核', dataIndex: 'reviewed', width: 100 },
                                        { title: '已验收', dataIndex: 'accepted', width: 100 },
                                        { title: '标注员数', dataIndex: 'annotators', width: 100 },
                                        { title: '完成率', key: 'rate', width: 150, render: (_, r) => <Progress percent={Math.round(r.accepted / r.total * 100)} size="small" /> },
                                    ]}
                                    pagination={false}
                                />
                            ),
                        },
                        {
                            key: 'progress', label: '项目进度',
                            children: (
                                <Table
                                    dataSource={progressData}
                                    columns={[
                                        { title: '项目ID', dataIndex: 'projectId', width: 100 },
                                        { title: '项目名称', dataIndex: 'name', width: 200 },
                                        { title: '进度', dataIndex: 'progress', width: 200, render: (p) => <Progress percent={p} size="small" status={p >= 90 ? 'success' : 'active'} /> },
                                        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s} /> },
                                        { title: '开始时间', dataIndex: 'startTime', width: 120 },
                                        { title: '结束时间', dataIndex: 'endTime', width: 120 },
                                    ]}
                                    pagination={false}
                                />
                            ),
                        },
                        {
                            key: 'taskDetail', label: '任务详情',
                            children: (
                                <Table
                                    dataSource={taskDetailData}
                                    columns={[
                                        { title: '任务ID', dataIndex: 'taskId', width: 100 },
                                        { title: '任务名称', dataIndex: 'name', width: 200 },
                                        { title: '标注员', dataIndex: 'annotator', width: 120 },
                                        { title: '进度', dataIndex: 'progress', width: 200, render: (p) => <Progress percent={p} size="small" status={p === 100 ? 'success' : 'active'} /> },
                                        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s} /> },
                                        { title: '开始时间', dataIndex: 'startTime', width: 120 },
                                    ]}
                                    pagination={false}
                                />
                            ),
                        },
                        {
                            key: 'capacity', label: '产能监控',
                            children: (
                                <Table
                                    dataSource={capacityData}
                                    columns={[
                                        { title: '标注员', dataIndex: 'annotator', width: 120 },
                                        { title: '日产量', dataIndex: 'daily', width: 100, render: (v) => <Text strong>{v}</Text> },
                                        { title: '周产量', dataIndex: 'weekly', width: 100 },
                                        { title: '月产量', dataIndex: 'monthly', width: 100 },
                                        { title: '准确率', dataIndex: 'accuracy', width: 120, render: (v) => <Tag color={v >= 96 ? 'green' : v >= 94 ? 'orange' : 'red'}>{v}%</Tag> },
                                    ]}
                                    pagination={false}
                                />
                            ),
                        },
                        {
                            key: 'settlement', label: '结算统计',
                            children: (
                                <Table
                                    dataSource={[
                                        { key: '1', annotator: '标注员A', total: 890, unitPrice: 2.5, amount: 2225, status: '已结算' },
                                        { key: '2', annotator: '标注员B', total: 980, unitPrice: 2.5, amount: 2450, status: '待结算' },
                                        { key: '3', annotator: '标注员C', total: 760, unitPrice: 2.5, amount: 1900, status: '待结算' },
                                    ]}
                                    columns={[
                                        { title: '标注员', dataIndex: 'annotator', width: 120 },
                                        { title: '标注总量', dataIndex: 'total', width: 100 },
                                        { title: '单价(元)', dataIndex: 'unitPrice', width: 100 },
                                        { title: '金额(元)', dataIndex: 'amount', width: 120, render: (v) => <Text strong style={{ color: '#f5222d' }}>¥{v}</Text> },
                                        { title: '状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s} /> },
                                    ]}
                                    pagination={false}
                                />
                            ),
                        },
                    ]}
                />
            </Card>
            </div>
        </MainLayout>
    );
}
