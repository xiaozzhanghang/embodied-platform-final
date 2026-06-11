'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Progress, Statistic, Row, Col, DatePicker, App, Badge, Descriptions, Tooltip, Divider, Alert } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, EyeOutlined, DownloadOutlined, ExportOutlined, CheckCircleOutlined, InfoCircleOutlined, AuditOutlined, CloudUploadOutlined, TeamOutlined, HistoryOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockProjects = [
    { 
        key: '1', 
        projectId: 'AP-001', 
        name: '具身抓取标注项目', 
        type: '框标注',
        progress: 85, 
        totalPacks: 20, 
        pendingAcceptance: 5, 
        passed: 12, 
        rejected: 3, 
        samplingRate: '15%',
        qualityScore: 94.5,
        lastUpdate: '2025-03-05 10:00'
    },
    { 
        key: '2', 
        projectId: 'AP-002', 
        name: 'VLA动作标注项目', 
        type: '范围&框标注',
        progress: 35, 
        totalPacks: 15, 
        pendingAcceptance: 10, 
        passed: 4, 
        rejected: 1, 
        samplingRate: '10%',
        qualityScore: 88.2,
        lastUpdate: '2025-03-04 14:00'
    },
];

export default function AcceptancePage() {
    const { message } = App.useApp();
    const [batchModalVisible, setBatchModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [acceptVisible, setAcceptVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);
    const [filters, setFilters] = useState({});

    const filteredData = React.useMemo(() => {
        return mockProjects.filter(item => {
            const nameMatch = !filters.name || item.name.toLowerCase().includes(filters.name.toLowerCase());
            const typeMatch = !filters.type || item.type === filters.type;
            const statusMatch = !filters.status || (filters.status === '已完成' ? item.progress === 100 : item.progress < 100);
            return nameMatch && typeMatch && statusMatch;
        });
    }, [filters]);

    const handleBatchPass = () => {
        message.success('选中题包已全部验收通过，数据已进入就绪库');
        setBatchModalVisible(false);
    };

    const columns = [
        { title: '项目名称', dataIndex: 'name', key: 'name', width: 220, fixed: 'left' },
        { title: '标注类型', dataIndex: 'type', width: 120, render: (t) => <Tag color="blue">{t}</Tag> },
        { title: '验收进度', dataIndex: 'progress', width: 160, render: (p) => (
            <Tooltip title={`已完成 ${p}%`}>
                <Progress percent={p} size="small" />
            </Tooltip>
        )},
        { title: '题包概览', key: 'packs', width: 200, render: (_, r) => (
            <Space size={4}>
                <Tooltip title="通过"><Tag color="success">{r.passed}</Tag></Tooltip>
                <Tooltip title="打回"><Tag color="error">{r.rejected}</Tag></Tooltip>
                <Tooltip title="待验收"><Tag color="warning">{r.pendingAcceptance}</Tag></Tooltip>
                <Text type="secondary">/ {r.totalPacks}</Text>
            </Space>
        )},
        { title: '抽检率', dataIndex: 'samplingRate', width: 90 },
        { title: '平均质量分', dataIndex: 'qualityScore', width: 110, render: (v) => <Text strong style={{ color: v > 90 ? '#52c41a' : '#faad14' }}>{v}</Text> },
        { title: '最后更新', dataIndex: 'lastUpdate', width: 160 },
        {
            title: '操作', key: 'action', width: 240, fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" icon={<AuditOutlined />} onClick={() => { setSelectedProject(record); setBatchModalVisible(true); }}>批量处理</Button>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailRecord(record); setDetailVisible(true); }}>查看详情</Button>
                    <Button size="small" icon={<CloudUploadOutlined />} disabled={record.progress < 100}>准备发布</Button>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>验收管理中心</Title>
                <Text type="secondary">对审核通过的标注题包进行最终验收抽检。验收通过后，数据将正式转入可发布状态。</Text>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="待验收项目" value={2} prefix={<AuditOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
                <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="今日已验收" value={45} suffix="题包" valueStyle={{ color: '#52c41a' }} /></Card></Col>
                <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="平均打回率" value={3.5} precision={1} suffix="%" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
                <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="就绪 Episode" value={1250} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
            </Row>

            <Card className="search-form" style={{ marginBottom: 16, borderRadius: 8 }}>
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
                    <ProFormText name="name" label="项目名称" placeholder="请输入" />
                    <ProFormSelect name="type" label="标注场景" placeholder="全部" options={[{ value: '框标注', label: '框标注' }, { value: '范围&框标注', label: '范围&框标注' }]} />
                    <ProFormSelect name="status" label="状态" placeholder="全部" options={[{ value: '进行中', label: '进行中' }, { value: '已完成', label: '已完成' }]} />
                </QueryFilter>
            </Card>

            <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8 }}>
                <Table columns={columns} dataSource={filteredData} scroll={{ x: 1400 }} style={{ padding: '0 24px 24px' }} pagination={{ pageSize: 10 }} />
            </Card>

            {/* Batch Processing Modal */}
            <Modal
                title={`批量验收处理 — ${selectedProject?.name || ''}`}
                open={batchModalVisible}
                onCancel={() => setBatchModalVisible(false)}
                width={900}
                footer={
                    <Space>
                        <Button onClick={() => setBatchModalVisible(false)}>取消</Button>
                        <Button danger onClick={() => message.warning('已批量打回')}>批量打回</Button>
                        <Button type="primary" onClick={handleBatchPass}>全部通过验收</Button>
                    </Space>
                }
            >
                <Alert message="以下是该项目下所有已审核通过、等待最终验收的题包。" type="info" showIcon style={{ marginBottom: 16 }} />
                
                <Table
                    size="small"
                    rowSelection={{ type: 'checkbox' }}
                    dataSource={[
                        { key: '1', packId: 'PK-001', annotator: '标注员A', auditor: '审核员B', auditTime: '2025-03-05 09:00', score: 96, status: '待验收' },
                        { key: '2', packId: 'PK-002', annotator: '标注员C', auditor: '审核员B', auditTime: '2025-03-05 09:30', score: 92, status: '待验收' },
                        { key: '3', packId: 'PK-003', annotator: '标注员A', auditor: '审核员D', auditTime: '2025-03-05 10:15', score: 98, status: '待验收' },
                    ]}
                    columns={[
                        { title: '题包ID', dataIndex: 'packId' },
                        { title: '标注/审核人', key: 'people', render: (_, r) => <Text style={{ fontSize: 12 }}>{r.annotator} / {r.auditor}</Text> },
                        { title: '审核评分', dataIndex: 'score', render: (v) => <Badge status={v > 95 ? 'success' : 'warning'} text={`${v}分`} /> },
                        { title: '审核时间', dataIndex: 'auditTime' },
                        { title: '操作', key: 'op', fixed: 'right', render: () => (
                            <Space>
                                <Button type="link" size="small" onClick={() => setAcceptVisible(true)}>抽检审核</Button>
                            </Space>
                        )}
                    ]}
                    pagination={false}
                />
            </Modal>

            {/* Acceptance Viewport (Mini version of audit) */}
            <Modal
                title="最终验收抽检"
                open={acceptVisible}
                onCancel={() => setAcceptVisible(false)}
                width={1100}
                styles={{ body: { padding: 0, backgroundColor: '#f0f2f5' } }}
                footer={
                    <Space>
                        <Button onClick={() => setAcceptVisible(false)}>关闭</Button>
                        <Button danger onClick={() => { setAcceptVisible(false); message.warning('该题包验收不通过，已打回至标注员'); }}>不通过 (打回重标)</Button>
                        <Button type="primary" onClick={() => { setAcceptVisible(false); message.success('该题包验收通过'); }}>验收通过</Button>
                    </Space>
                }
            >
                <div style={{ display: 'flex', height: 600 }}>
                    <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ width: '80%', height: '80%', border: '2px solid #52c41a', background: '#141414' }}>
                           <div style={{ padding: 10, color: '#52c41a' }}>[验收预览模式] Episode_001_Frame_042</div>
                        </div>
                    </div>
                    <div style={{ width: 300, backgroundColor: '#fff', padding: 20, borderLeft: '1px solid #d9d9d9' }}>
                        <Title level={5}>标注质量分析</Title>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="标注完整度">100%</Descriptions.Item>
                            <Descriptions.Item label="坐标精确度">98.5%</Descriptions.Item>
                            <Descriptions.Item label="分类准确率">100%</Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        <Title level={5}>审核记录</Title>
                        <div style={{ backgroundColor: '#f6ffed', padding: 10, borderRadius: 4, border: '1px solid #b7eb8f' }}>
                            <Text type="success">审核员B: 标注非常准确，轨迹平滑度高。建议直接验收。</Text>
                        </div>
                        <div style={{ marginTop: 20 }}>
                            <Text strong>验收评语</Text>
                            <Input.TextArea rows={4} placeholder="如有建议请填写..." style={{ marginTop: 8 }} />
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal title="验收项目详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={640}>
                {detailRecord && (
                    <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
                        <Descriptions.Item label="项目ID">{detailRecord.projectId}</Descriptions.Item>
                        <Descriptions.Item label="项目名称">{detailRecord.name}</Descriptions.Item>
                        <Descriptions.Item label="标注类型">{detailRecord.type}</Descriptions.Item>
                        <Descriptions.Item label="抽检率">{detailRecord.samplingRate}</Descriptions.Item>
                        <Descriptions.Item label="验收进度">{detailRecord.progress}%</Descriptions.Item>
                        <Descriptions.Item label="平均质量分">{detailRecord.qualityScore}</Descriptions.Item>
                        <Descriptions.Item label="题包概览" span={2}>通过 {detailRecord.passed} / 打回 {detailRecord.rejected} / 待验收 {detailRecord.pendingAcceptance} / 总 {detailRecord.totalPacks}</Descriptions.Item>
                        <Descriptions.Item label="最后更新" span={2}>{detailRecord.lastUpdate}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </MainLayout>
    );
}
