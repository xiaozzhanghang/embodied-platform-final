'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Drawer, Descriptions, Badge, Progress, Statistic, Row, Col, Steps, Modal, App } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockData = [
    { key: '1', taskId: 'CT-20250301001', name: 'FRANKA-FR3-抓取红色方块-001', desc: '使用FR3机器人抓取红色方块', robot: 'FRANKA-FR3-1号', scene: '桌面抓取', collector: '张三', startTime: '2025-03-01 09:00', endTime: '-', collectStatus: '采集中', dataStatus: '上传中', creator: '管理员', createTime: '2025-02-28 14:30', progress: '35/50', deviceStatus: '正常' },
    { key: '2', taskId: 'CT-20250301002', name: 'FRANKA-FR3-放置蓝色圆柱-002', desc: '使用FR3机器人放置蓝色圆柱', robot: 'FRANKA-FR3-2号', scene: '桌面放置', collector: '李四', startTime: '2025-03-01 10:30', endTime: '2025-03-01 16:00', collectStatus: '采集完成', dataStatus: '处理完成', creator: '管理员', createTime: '2025-02-28 15:00', progress: '50/50', deviceStatus: '正常' },
    { key: '3', taskId: 'CT-20250302001', name: 'UR5e-搬运任务-003', desc: '使用UR5e搬运物体', robot: 'UR5e-1号', scene: '仓库搬运', collector: '王五', startTime: '-', endTime: '-', collectStatus: '待采集', dataStatus: '-', creator: '管理员', createTime: '2025-03-02 09:00', progress: '0/30', deviceStatus: '正常' },
];

const collectStatusMap = { '采集中': 'processing', '采集完成': 'success', '待采集': 'default' };
const dataStatusMap = { '上传中': 'processing', '处理完成': 'success', '未上传': 'default', '处理中': 'warning', '-': 'default' };

export default function CollectTaskPage() {
  const router = useRouter();
  const { message } = App.useApp();
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [collectModalOpen, setCollectModalOpen] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [timer, setTimer] = useState(0);

    const columns = [
        { title: '采集任务ID', dataIndex: 'taskId', key: 'taskId', width: 150 },
        { title: '任务名称', dataIndex: 'name', key: 'name', width: 260 },
        { title: '任务描述', dataIndex: 'desc', key: 'desc', width: 200, ellipsis: true },
        { title: '采集机器人', dataIndex: 'robot', key: 'robot', width: 150 },
        { title: '采集场景', dataIndex: 'scene', key: 'scene', width: 120 },
        { title: '采集人员', dataIndex: 'collector', key: 'collector', width: 100 },
        { title: '采集状态', dataIndex: 'collectStatus', key: 'collectStatus', width: 100, render: (s) => <Tag color={collectStatusMap[s]}>{s}</Tag> },
        { title: '数据状态', dataIndex: 'dataStatus', key: 'dataStatus', width: 100, render: (s) => <Tag color={dataStatusMap[s]}>{s}</Tag> },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        {
            title: '操作', key: 'action', width: 200, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/collection/collect/detail/${record.taskId}`)}>查看任务</Button>
                    {record.collectStatus !== '采集完成' && (
                        <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => window.open(`/collection/collect/workspace/${record.taskId}`, '_blank')}>
                            {record.collectStatus === '待采集' ? '开始采集' : '继续采集'}
                        </Button>
                    )}
                    {record.dataStatus === '处理完成' && (
                        <Button type="link" size="small">查看数据</Button>
                    )}
                    {record.collectStatus === '采集完成' && record.dataStatus === '处理完成' && (
                        <Button type="link" size="small" onClick={() => message.success('任务已完成')}>完成任务</Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="page-header-title" style={{ margin: 0 }}>采集任务</h3>
                </div>
                <Card className="search-form" style={{ marginBottom: 16 }}>
                    <Form layout="inline">
                        <Form.Item label="任务名称"><Input placeholder="请输入" allowClear style={{ width: 180 }} /></Form.Item>
                        <Form.Item label="采集机器人"><Select placeholder="全部" allowClear style={{ width: 160 }} options={[{ value: 'FRANKA-FR3-1号' }, { value: 'UR5e-1号' }]} /></Form.Item>
                        <Form.Item label="采集状态"><Select placeholder="全部" allowClear style={{ width: 120 }} options={[{ value: '采集中' }, { value: '采集完成' }, { value: '待采集' }]} /></Form.Item>
                        <Form.Item label="数据状态"><Select placeholder="全部" allowClear style={{ width: 120 }} options={[{ value: '上传中' }, { value: '处理完成' }, { value: '未上传' }]} /></Form.Item>
                        <Form.Item><Space><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                    </Form>
                </Card>

                <Card styles={{ body: { padding: 0 } }}>
                    <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>采集任务列表</span>
                        <Space>
                            <Button type="primary" onClick={() => window.open('/collection/collect/connection/CT-20250301001', '_blank')}>设备连接</Button>
                        </Space>
                    </div>
                    <Table columns={columns} dataSource={mockData} scroll={{ x: 1600 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>


            </MainLayout>
    );
}
