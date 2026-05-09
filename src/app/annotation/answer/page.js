'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Modal, Progress, App, Badge, Row, Col, Tabs, Tooltip, Divider, Radio, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, PlayCircleOutlined, EyeOutlined, CheckCircleOutlined, LeftOutlined, RightOutlined, SaveOutlined, SendOutlined, ToolOutlined, ScissorOutlined, BorderOutlined, AimOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockProjects = [
    { key: '1', projectId: 'AP-001', name: '具身抓取标注项目', startTime: '2025-02-01 10:00', progress: 70, type: '框标注', total: 50, annotated: 35 },
    { key: '2', projectId: 'AP-002', name: 'VLA动作标注项目', startTime: '2025-02-15 14:00', progress: 45, type: '范围&框标注', total: 100, annotated: 45 },
    { key: '3', projectId: 'AP-003', name: '关键点定位项目', startTime: '2025-03-01 09:00', progress: 10, type: '点标注', total: 200, annotated: 20 },
];

export default function AnswerPage() {
    const { message } = App.useApp();
    const [workspaceVisible, setWorkspaceVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const openWorkspace = (record) => {
        setSelectedProject(record);
        setWorkspaceVisible(true);
    };

    const columns = [
        { title: '项目ID', dataIndex: 'projectId', width: 100 },
        { title: '项目名称', dataIndex: 'name', key: 'name', width: 220 },
        { title: '标注类型', dataIndex: 'type', width: 120, render: (t) => <Tag color="blue">{t}</Tag> },
        { title: '总题目数', dataIndex: 'total', width: 100 },
        { title: '完成进度', key: 'progress', width: 200, render: (_, r) => (
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Text type="secondary">{r.annotated}/{r.total}</Text>
                    <Text strong>{r.progress}%</Text>
                </div>
                <Progress percent={r.progress} size="small" />
            </Space>
        )},
        { title: '分配时间', dataIndex: 'startTime', width: 170 },
        {
            title: '操作', key: 'action', width: 120, fixed: 'right',
            render: (_, record) => <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => openWorkspace(record)}>开始标注</Button>,
        },
    ];

    return (
        <MainLayout>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>标注作业中心</Title>
                <Text type="secondary">欢迎回来！您当前有 {mockProjects.length} 个待处理的标注项目。</Text>
            </div>

            <Card className="search-form" style={{ marginBottom: 16, borderRadius: 8 }}>
                <Form layout="inline">
                    <Form.Item label="项目名称"><Input placeholder="搜索项目" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} /></Form.Item>
                    <Form.Item label="任务类型">
                        <Select placeholder="全部" allowClear style={{ width: 140 }} options={[{ value: '点标注' }, { value: '框标注' }, { value: '范围标注' }, { value: '范围&框标注' }]} />
                    </Form.Item>
                    <Form.Item><Space><Button type="primary">查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                </Form>
            </Card>

            <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8 }}>
                <Table columns={columns} dataSource={mockProjects} style={{ padding: '0 24px 24px' }} pagination={{ pageSize: 10 }} />
            </Card>

            {/* Immersive Annotation Workspace */}
            <Modal
                title={null}
                open={workspaceVisible}
                onCancel={() => setWorkspaceVisible(false)}
                width="100vw"
                footer={null}
                styles={{ body: { padding: 0, backgroundColor: '#141414', height: '100vh' } }}
                closable={false}
                destroyOnClose
            >
                {selectedProject && <AnnotationWorkspace project={selectedProject} onClose={() => setWorkspaceVisible(false)} />}
            </Modal>
        </MainLayout>
    );
}

// --- Annotation Workspace Component ---
function AnnotationWorkspace({ project, onClose }) {
    const { message } = App.useApp();
    const [currentFrame, setCurrentFrame] = useState(42);
    const [activeTool, setActiveTool] = useState('box');

    const handleSave = () => {
        message.success('当前标注已保存到草稿');
    };

    const handleSubmit = () => {
        message.success('标注任务已提交，进入下一题');
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            {/* Toolbar Header */}
            <div style={{ height: 50, borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
                <Space size={20}>
                    <Button type="text" icon={<LeftOutlined />} onClick={onClose} style={{ color: '#fff' }} />
                    <Title level={5} style={{ color: '#fff', margin: 0 }}>{project.name} - Episode_001</Title>
                    <Divider vertical style={{ borderColor: '#434343' }} />
                    <Space>
                        <Tooltip title="框选标注 (B)"><Button type={activeTool === 'box' ? 'primary' : 'text'} icon={<BorderOutlined />} onClick={() => setActiveTool('box')} style={{ color: activeTool === 'box' ? '#fff' : '#aaa' }} /></Tooltip>
                        <Tooltip title="点标注 (P)"><Button type={activeTool === 'point' ? 'primary' : 'text'} icon={<AimOutlined />} onClick={() => setActiveTool('point')} style={{ color: activeTool === 'point' ? '#fff' : '#aaa' }} /></Tooltip>
                        <Tooltip title="剪切/分段 (C)"><Button type={activeTool === 'clip' ? 'primary' : 'text'} icon={<ScissorOutlined />} onClick={() => setActiveTool('clip')} style={{ color: activeTool === 'clip' ? '#fff' : '#aaa' }} /></Tooltip>
                    </Space>
                </Space>
                <Space>
                    <Text style={{ color: '#aaa' }}>题目 36/50</Text>
                    <Divider vertical style={{ borderColor: '#434343' }} />
                    <Button ghost icon={<SaveOutlined />} onClick={handleSave}>保存草稿</Button>
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}>提交并下一题</Button>
                </Space>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: Frame List */}
                <div style={{ width: 180, borderRight: '1px solid #303030', padding: 10, backgroundColor: '#1f1f1f', overflowY: 'auto' }}>
                    <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#aaa', fontSize: 12 }}>帧序列</Text>
                        <Badge count={153} style={{ backgroundColor: '#434343' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                        {[...Array(10)].map((_, i) => (
                            <div key={i} style={{ border: i === 4 ? '2px solid #1677ff' : '1px solid #303030', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}>
                                <div style={{ height: 60, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Frame {i * 10}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Viewport */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ width: '85%', height: '85%', background: '#141414', border: '1px solid #303030', position: 'relative', cursor: 'crosshair' }}>
                            <div style={{ position: 'absolute', top: '25%', left: '30%', width: '120px', height: '100px', border: '2px dashed #1677ff', backgroundColor: 'rgba(22, 119, 255, 0.1)' }}>
                                <div style={{ position: 'absolute', top: -20, left: 0, backgroundColor: '#1677ff', fontSize: 10, padding: '0 4px' }}>Robot Hand</div>
                            </div>
                            <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '2px 8px', background: 'rgba(0,0,0,0.5)', fontSize: 12 }}>
                                Resolution: 1280x720 | FPS: 30
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ height: 140, backgroundColor: '#1f1f1f', borderTop: '1px solid #303030', padding: '10px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Space>
                                <Button type="text" icon={<PlayCircleOutlined />} style={{ color: '#fff' }} />
                                <Text style={{ color: '#fff' }}>00:12:05 / 00:45:00</Text>
                            </Space>
                            <Space>
                                <Tooltip title="上一关键帧"><Button size="small" icon={<LeftOutlined />} /></Tooltip>
                                <Tooltip title="下一关键帧"><Button size="small" icon={<RightOutlined />} /></Tooltip>
                                <Divider vertical />
                                <Select defaultValue="1.0x" size="small" style={{ width: 70 }} options={[{ value: '0.5x' }, { value: '1.0x' }, { value: '2.0x' }]} />
                            </Space>
                        </div>
                        <div style={{ height: 50, background: '#262626', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                            {/* Annotation Segment */}
                            <div style={{ position: 'absolute', left: '20%', width: '40%', height: '100%', background: 'rgba(22, 119, 255, 0.2)', borderLeft: '2px solid #1677ff', borderRight: '2px solid #1677ff' }}>
                                <div style={{ fontSize: 10, padding: 4 }}>Grasp Attempt 1 (Success)</div>
                            </div>
                            {/* Ticks */}
                            {[...Array(20)].map((_, i) => (
                                <div key={i} style={{ position: 'absolute', left: `${i * 5}%`, top: 0, width: 1, height: i % 5 === 0 ? 15 : 8, background: '#434343' }} />
                            ))}
                            {/* Playhead */}
                            <div style={{ position: 'absolute', left: '42%', top: 0, width: 2, height: '100%', background: '#ff4d4f', zIndex: 10 }}>
                                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid #ff4d4f', position: 'absolute', top: 0, left: -4 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Attributes Panel */}
                <div style={{ width: 280, borderLeft: '1px solid #303030', backgroundColor: '#1f1f1f', display: 'flex', flexDirection: 'column' }}>
                    <Tabs
                        centered
                        items={[
                            {
                                key: 'attr',
                                label: '标注属性',
                                children: (
                                    <div style={{ padding: 16 }}>
                                        <Form layout="vertical">
                                            <Form.Item label={<Text style={{ color: '#aaa' }}>物体类型</Text>}>
                                                <Select defaultValue="cube" style={{ width: '100%' }}>
                                                    <Select.Option value="cube">红色方块</Select.Option>
                                                    <Select.Option value="cup">杯子</Select.Option>
                                                    <Select.Option value="tool">工具</Select.Option>
                                                </Select>
                                            </Form.Item>
                                            <Form.Item label={<Text style={{ color: '#aaa' }}>动作质量评分</Text>}>
                                                <Radio.Group defaultValue={5} size="small">
                                                    <Radio.Button value={1}>1</Radio.Button>
                                                    <Radio.Button value={3}>3</Radio.Button>
                                                    <Radio.Button value={5}>5</Radio.Button>
                                                </Radio.Group>
                                            </Form.Item>
                                            <Form.Item label={<Text style={{ color: '#aaa' }}>轨迹性质</Text>}>
                                                <Radio.Group defaultValue="success" size="small" style={{ width: '100%' }}>
                                                    <Radio.Button value="success" style={{ width: '33.3%', textAlign: 'center' }}>成功</Radio.Button>
                                                    <Radio.Button value="fail" style={{ width: '33.3%', textAlign: 'center' }}>失败</Radio.Button>
                                                    <Radio.Button value="takeover" style={{ width: '33.3%', textAlign: 'center' }}>接管</Radio.Button>
                                                </Radio.Group>
                                            </Form.Item>
                                            <Form.Item label={<Text style={{ color: '#aaa' }}>备注</Text>}>
                                                <Input.TextArea rows={3} placeholder="添加备注..." style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #434343' }} />
                                            </Form.Item>
                                        </Form>
                                    </div>
                                )
                            },
                            {
                                key: 'list',
                                label: '标注列表',
                                children: (
                                    <div style={{ padding: 16 }}>
                                        {[
                                            { id: '1', name: 'Robot Hand', type: 'Box', frame: '42' },
                                            { id: '2', name: 'Grasp Target', type: 'Point', frame: '42' },
                                        ].map(item => (
                                            <div key={item.id} style={{ padding: 10, background: '#262626', borderRadius: 4, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <Text style={{ color: '#fff', fontSize: 13 }}>{item.name}</Text><br/>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>{item.type} | Frame {item.frame}</Text>
                                                </div>
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}

function Divider({ vertical, style }) {
    return <div style={{ width: vertical ? 1 : '100%', height: vertical ? '60%' : 1, backgroundColor: '#434343', ...style }} />;
}
