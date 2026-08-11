'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Tree, Row, Col, Descriptions, Divider, Popconfirm, App, Statistic, Progress, Drawer, Badge, Steps, Checkbox, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, FolderOutlined, FolderOpenOutlined, FileOutlined, SettingOutlined, DeleteOutlined, EyeOutlined, PlayCircleOutlined, RocketOutlined, HistoryOutlined, DownloadOutlined, CloudUploadOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title, Text } = Typography;

const treeData = [
    {
        title: '具身抓取数据集',
        key: 'ds-001',
        icon: <FolderOutlined />,
        children: [
            { title: '抓取子集-01', key: 'ss-001', icon: <FileOutlined /> },
            { title: '抓取子集-02', key: 'ss-002', icon: <FileOutlined /> },
            { title: '抓取子集-03', key: 'ss-003', icon: <FileOutlined /> },
        ],
    },
    {
        title: '具身搬运数据集',
        key: 'ds-002',
        icon: <FolderOutlined />,
        children: [
            { title: '搬运子集-01', key: 'ss-004', icon: <FileOutlined /> },
        ],
    },
    {
        title: '具身分拣数据集',
        key: 'ds-003',
        icon: <FolderOutlined />,
        children: [
            { title: '分拣子集-01', key: 'ss-005', icon: <FileOutlined /> },
            { title: '分拣子集-02', key: 'ss-006', icon: <FileOutlined /> },
        ],
    },
];

const subsetData = [
    { key: '1', id: 1, name: '抓取子集-01', subsetId: 'SS-001', enName: 'grasp-subset-01', sendStatus: '已送标', annotationId: 'AD-001', annotationStatus: '已完成', creator: '管理员', updateTime: '2025-03-05 10:00', episodes: 120, size: '32.5 GB' },
    { key: '2', id: 2, name: '抓取子集-02', subsetId: 'SS-002', enName: 'grasp-subset-02', sendStatus: '未送标', annotationId: '-', annotationStatus: '-', creator: '管理员', updateTime: '2025-03-04 14:00', episodes: 45, size: '12.8 GB' },
    { key: '3', id: 3, name: '抓取子集-03', subsetId: 'SS-003', enName: 'grasp-subset-03', sendStatus: '已送标', annotationId: 'AD-003', annotationStatus: '已完成', creator: '张三', updateTime: '2025-03-03 09:00', episodes: 88, size: '25.2 GB' },
];

const historyData = [
    { key: '1', version: 'v1.2.0', status: '已发布', format: 'HDF5, RLDS', episodes: 253, size: '70.5 GB', publisher: 'Admin', time: '2025-03-01 10:00' },
    { key: '2', version: 'v1.1.0', status: '已下架', format: 'HDF5', episodes: 120, size: '32.1 GB', publisher: 'Admin', time: '2025-02-15 14:00' },
];

export default function DatasetPage() {
    const { message } = App.useApp();
    const [selectedKey, setSelectedKey] = useState('ds-001');
    const [createDatasetOpen, setCreateDatasetOpen] = useState(false);
    const [createSubsetOpen, setCreateSubsetOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [releaseOpen, setReleaseOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [releaseStep, setReleaseStep] = useState(0);

    const subsetColumns = [
        { title: '序号', dataIndex: 'id', key: 'id', width: 60 },
        { title: '子集名称', dataIndex: 'name', key: 'name', width: 140 },
        { title: '子集ID', dataIndex: 'subsetId', key: 'subsetId', width: 100 },
        { title: '送标状态', dataIndex: 'sendStatus', key: 'sendStatus', width: 100, render: (s) => <StatusTag status={s === '已送标' ? '进行中' : '未开始'}>{s}</StatusTag> },
        { title: '标注状态', dataIndex: 'annotationStatus', key: 'annotationStatus', width: 100, render: (s) => <StatusTag status={s === '已完成' ? '已完成' : s === '标注中' ? '标注中' : '未开始'}>{s}</StatusTag> },
        { title: 'Episode数', dataIndex: 'episodes', width: 100 },
        { title: '数据大小', dataIndex: 'size', width: 100 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
        {
            title: '操作', key: 'action', width: 150, fixed: 'right',
            render: () => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailOpen(true)}>查看详情</Button>
                    <Popconfirm title="确定从数据集中移除此子集？"><Button type="link" size="small" danger icon={<DeleteOutlined />}>移除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    const handleRelease = () => {
        message.success('数据集发布申请已提交，系统正在后台打包中...');
        setReleaseOpen(false);
        setReleaseStep(0);
    };

    return (
        <MainLayout>
            <div className="ui-page">
            <PageHeader title="数据集管理" description="组织数据子集、版本与发布记录。" breadcrumbs={[{ title: '数据资产' }, { title: '数据集管理' }]} />
            <FilterPanel>
                <Space>
                    <Text type="secondary">所属项目</Text>
                    <Select placeholder="筛选项目" allowClear style={{ width: 280 }} defaultValue="ds-001" options={[{ value: 'ds-001', label: '具身抓取项目' }]} />
                </Space>
            </FilterPanel>
            <Row gutter={16}>
                <Col span={6}>
                    <Card
                        size="small"
                        title={<Space><FolderOutlined /><span>数据集结构</span></Space>}
                        extra={<Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setCreateDatasetOpen(true)} />}
                        style={{ height: 'calc(100vh - 128px)', overflowY: 'auto' }}
                    >
                        <Tree
                            showIcon
                            defaultExpandAll
                            treeData={treeData}
                            selectedKeys={[selectedKey]}
                            onSelect={(keys) => keys.length && setSelectedKey(keys[0])}
                        />
                    </Card>
                </Col>
                <Col span={18}>
                    {/* Dataset Statistics Banner */}
                    <Card style={{ marginBottom: 16, borderRadius: 8 }} styles={{ body: { padding: '16px 24px' } }}>
                        <Row gutter={24}>
                            <Col span={6}>
                                <Statistic title="总Episode数" value={253} prefix={<FileOutlined />} />
                            </Col>
                            <Col span={6}>
                                <Statistic title="总时长 (h)" value={12.5} precision={1} prefix={<HistoryOutlined />} />
                            </Col>
                            <Col span={6}>
                                <Statistic title="数据总体积" value={70.5} suffix="GB" />
                            </Col>
                            <Col span={6}>
                                <div style={{ paddingTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>数据质量评分</Text>
                                    <div style={{ marginTop: 4 }}><Progress percent={92} size="small" status="active" /></div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        className="ui-table-card"
                        title={
                            <Space>
                                <FolderOpenOutlined style={{ color: '#1677ff' }} />
                                <span>具身抓取数据集</span>
                                <StatusTag status="已发布">已发布 v1.2.0</StatusTag>
                            </Space>
                        }
                        extra={
                            <Space>
                                <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>版本记录</Button>
                                <Button type="primary" icon={<RocketOutlined />} onClick={() => setReleaseOpen(true)}>发布新版本</Button>
                                <Button icon={<SettingOutlined />} />
                            </Space>
                        }
                    >
                        <TableToolbar title="包含子集列表" count={subsetData.length} actions={<Button icon={<PlusOutlined />} onClick={() => setCreateSubsetOpen(true)}>添加子集</Button>} />
                        <Table columns={subsetColumns} dataSource={subsetData} pagination={{ pageSize: 5 }} scroll={{ x: 1000 }} />
                    </Card>
                </Col>
            </Row>

            {/* Release Dataset Wizard */}
            <AppModal
                title="发布数据集新版本"
                open={releaseOpen}
                onCancel={() => { setReleaseOpen(false); setReleaseStep(0); }}
                footer={
                    <Space>
                        <Button onClick={() => setReleaseOpen(false)}>取消</Button>
                        {releaseStep > 0 && <Button onClick={() => setReleaseStep(s => s - 1)}>上一步</Button>}
                        {releaseStep < 2 ? (
                            <Button type="primary" onClick={() => setReleaseStep(s => s + 1)}>下一步</Button>
                        ) : (
                            <Button type="primary" onClick={handleRelease} icon={<CloudUploadOutlined />}>确认并发布</Button>
                        )}
                    </Space>
                }
            >
                <Steps current={releaseStep} size="small" style={{ margin: '20px 0 30px' }} items={[
                    { title: '版本选择' },
                    { title: '格式配置' },
                    { title: '发布确认' },
                ]} />
                
                {releaseStep === 0 && (
                    <Form layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="当前版本"><Input value="v1.2.0" disabled /></Form.Item></Col>
                            <Col span={12}><Form.Item label="新版本号" required><Input placeholder="例如 v1.3.0" /></Form.Item></Col>
                        </Row>
                        <Form.Item label="选择子集" required>
                            <Checkbox.Group style={{ width: '100%' }}>
                                <Row>
                                    {subsetData.map(s => (
                                        <Col span={24} key={s.key} style={{ marginBottom: 8 }}>
                                            <Checkbox value={s.key}>{s.name} ({s.episodes} episodes, {s.size})</Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>
                    </Form>
                )}

                {releaseStep === 1 && (
                    <Form layout="vertical">
                        <Form.Item label="输出格式" required extra="系统将根据选择的格式进行数据转换">
                            <Checkbox.Group defaultValue={['HDF5']}>
                                <Space direction="vertical">
                                    <Checkbox value="HDF5">HDF5 (标准具身格式)</Checkbox>
                                    <Checkbox value="RLDS">RLDS (Google RLDS 格式)</Checkbox>
                                    <Checkbox value="LeRobot">LeRobot (HuggingFace LeRobot 兼容)</Checkbox>
                                    <Checkbox value="CSV">元数据 CSV 导出</Checkbox>
                                </Space>
                            </Checkbox.Group>
                        </Form.Item>
                        <Form.Item label="数据清洗选项">
                            <Checkbox>移除未通过审核的帧</Checkbox><br/>
                            <Checkbox>自动遮蔽人脸/隐私信息</Checkbox>
                        </Form.Item>
                    </Form>
                )}

                {releaseStep === 2 && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <RocketOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
                        <Title level={4}>发布预览</Title>
                        <Descriptions column={1} style={{ textAlign: 'left', marginTop: 20 }}>
                            <Descriptions.Item label="版本号">v1.3.0</Descriptions.Item>
                            <Descriptions.Item label="包含数据量">253 Episodes (约 70.5 GB)</Descriptions.Item>
                            <Descriptions.Item label="输出格式">HDF5, RLDS</Descriptions.Item>
                            <Descriptions.Item label="预计转换耗时">约 45 分钟</Descriptions.Item>
                        </Descriptions>
                        <div style={{ marginTop: 20, backgroundColor: '#fffbe6', padding: 10, borderRadius: 4, textAlign: 'left' }}>
                            <Text type="warning"><InfoCircleOutlined /> 发布后，数据集将出现在“下载中心”供下载。</Text>
                        </div>
                    </div>
                )}
            </AppModal>

            {/* Version History Drawer */}
            <Drawer
                title="数据集版本历史"
                placement="right"
                onClose={() => setHistoryOpen(false)}
                open={historyOpen}
                styles={{ wrapper: { width: 600 } }}
            >
                <Table
                    dataSource={historyData}
                    columns={[
                        { title: '版本', dataIndex: 'version', width: 80, render: (v) => <Text strong>{v}</Text> },
                        { title: '状态', dataIndex: 'status', width: 80, render: (s) => <StatusTag status={s === '已发布' ? '已发布' : '未开始'}>{s}</StatusTag> },
                        { title: '格式', dataIndex: 'format', width: 120 },
                        { title: '发布时间', dataIndex: 'time', width: 160 },
                        {
                            title: '操作', key: 'action', width: 100, fixed: 'right',
                            render: (_, r) => (
                                <Space>
                                    <Tooltip title="下载"><Button type="text" icon={<DownloadOutlined />} onClick={() => router.push('/data/download')} /></Tooltip>
                                    <Button type="link" size="small" onClick={() => message.info(`版本 ${r.version} — 格式: ${r.format}, Episode数: ${r.episodes}, 大小: ${r.size}`)}>查看详情</Button>
                                </Space>
                            ),
                        },
                    ]}
                />
            </Drawer>

            <AppModal title="新建数据集" open={createDatasetOpen} onCancel={() => setCreateDatasetOpen(false)} onOk={() => { setCreateDatasetOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消">
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="数据集名称" required><Input placeholder="请输入数据集名称" /></Form.Item>
                    <Form.Item label="英文名称" required><Input placeholder="请输入英文名称" /></Form.Item>
                    <Form.Item label="简介"><Input.TextArea rows={3} placeholder="请输入简介" /></Form.Item>
                </Form>
            </AppModal>

            <AppModal title="新建子集" open={createSubsetOpen} onCancel={() => setCreateSubsetOpen(false)} onOk={() => { setCreateSubsetOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消">
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="子集中文名称" required><Input placeholder="请输入中文名称" /></Form.Item>
                    <Form.Item label="子集英文名称" required><Input placeholder="请输入英文名称" /></Form.Item>
                    <Form.Item label="描述"><Input.TextArea rows={3} placeholder="请输入描述" /></Form.Item>
                </Form>
            </AppModal>

            {/* Reuse detailed modal */}
            <AppModal title="数据子集详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null}>
                <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="子集ID">SS-001</Descriptions.Item>
                    <Descriptions.Item label="子集名称">抓取子集-01</Descriptions.Item>
                    <Descriptions.Item label="英文名称">grasp-subset-01</Descriptions.Item>
                    <Descriptions.Item label="所属数据集ID">DS-001</Descriptions.Item>
                    <Descriptions.Item label="所属项目">具身抓取项目A</Descriptions.Item>
                    <Descriptions.Item label="Episode数">120</Descriptions.Item>
                    <Descriptions.Item label="创建时间">2025-03-05 10:00</Descriptions.Item>
                    <Descriptions.Item label="描述" span={2}>这是具身抓取项目A的第一个数据子集，包含120个抓取动作序列。</Descriptions.Item>
                </Descriptions>
                <Table 
                  size="small" 
                  dataSource={[
                    { key: '1', id: 1, name: 'episode_001.hdf5', dataId: 'D-0001', size: '256 MB' },
                    { key: '2', id: 2, name: 'episode_002.hdf5', dataId: 'D-0002', size: '312 MB' },
                  ]} 
                  columns={[
                    { title: '序号', dataIndex: 'id', width: 60 },
                    { title: '数据名称', dataIndex: 'name', width: 200 },
                    { title: '数据ID', dataIndex: 'dataId', width: 120 },
                    { title: '操作', key: 'op', fixed: 'right', render: (_, record) => <Button type="link" size="small" onClick={() => message.info(`数据文件: ${record.name}, ID: ${record.dataId}, 大小: ${record.size}`)}>查看详情</Button> }
                  ]}
                />
            </AppModal>
            </div>
        </MainLayout>
    );
}
