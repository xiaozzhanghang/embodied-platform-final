'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Select, App, Row, Col, Progress, Form, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, UserAddOutlined, EyeOutlined, FormOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const mockQaData = [
    {
        key: '1',
        project: 'SimulatedCollection',
        taskbook: 'TB-2025001-桌面抓取SOP',
        taskId: 'CT-20250301001',
        instanceId: 'INST-766794',
        qaBatchId: 'BATCH-766794-A',
        taskName: 'FRANKA-FR3-抓取红色方块-001',
        collectProgress: '153/2000',
        parseProgress: '100%',
        status: '进行中',
        isShelf: '否',
        shelfPos: '-',
        collector: '张三',
        qaer: '质检员A',
        passMinutes: '12',
        qaCountProgress: '20/153',
        qaMinuteProgress: '4/12',
        passRate: '95%',
        annoType: '框标注',
        desc: '抓取桌面中心红色木块',
        creator: '管理员',
        startTime: '2025-03-01 09:00',
        deviceSN: 'FR3-001-ALPHA',
        isQaed: '是',
        passedCount: 19
    },
    {
        key: '2',
        project: 'VLA-Data-Lab',
        taskbook: 'TB-2025005-通用操作SOP',
        taskId: 'CT-20250305022',
        instanceId: 'INST-882231',
        qaBatchId: 'BATCH-882231-A',
        taskName: 'UR5-放置杯子-022',
        collectProgress: '2000/2000',
        parseProgress: '100%',
        status: '已完成',
        isShelf: '是',
        shelfPos: 'B-2-04',
        collector: '李四',
        qaer: '质检员B',
        passMinutes: '45',
        qaCountProgress: '2000/2000',
        qaMinuteProgress: '45/45',
        passRate: '99%',
        annoType: '范围标注',
        desc: '将水杯精准放置在圆垫中心',
        creator: '张经理',
        startTime: '2025-03-02 10:15',
        deviceSN: 'UR5-998-BETA',
        isQaed: '是',
        passedCount: 1980
    }
];

function QaContent() {
    const { message } = App.useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const batchFromUrl = searchParams.get('batch') || '';
    const [filterBatch, setFilterBatch] = useState(batchFromUrl);
    
    // Batch Allocate Modal State
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isAllocateModalVisible, setIsAllocateModalVisible] = useState(false);
    const [allocateType, setAllocateType] = useState('batch'); // 'batch' | 'single'
    const [singleAllocateRecord, setSingleAllocateRecord] = useState(null);
    const [allocateForm] = Form.useForm();

    const handleBatchAllocate = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先在列表中勾选需要分配的质检任务！');
            return;
        }
        setAllocateType('batch');
        setIsAllocateModalVisible(true);
        allocateForm.resetFields();
    };

    const handleSingleAllocate = (record) => {
        setAllocateType('single');
        setSingleAllocateRecord(record);
        setIsAllocateModalVisible(true);
        allocateForm.setFieldsValue({ assignee: '质检员00792' });
    };

    const handleAllocateSubmit = () => {
        allocateForm.validateFields().then(values => {
            const count = allocateType === 'batch' ? selectedRowKeys.length : 1;
            message.success(`已成功将 ${count} 个任务分配给 ${values.assignee}`);
            setIsAllocateModalVisible(false);
            if (allocateType === 'batch') {
                setSelectedRowKeys([]);
            }
            allocateForm.resetFields();
        });
    };

    const filteredData = filterBatch 
        ? mockQaData.filter(d => d.qaBatchId.includes(filterBatch))
        : mockQaData;
    const columns = [
        { title: '项目', dataIndex: 'project', key: 'project', width: 150, ellipsis: true },
        { title: '任务书', dataIndex: 'taskbook', key: 'taskbook', width: 180, ellipsis: true },
        { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 130 },
        { title: '质检批次 (Batch)', dataIndex: 'qaBatchId', key: 'qaBatchId', width: 180, render: text => <span style={{ color: '#1677ff', fontWeight: 'bold' }}>{text}</span> },
        { title: '所属实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 130 },
        { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 220, ellipsis: true },
        { title: '采集进度', dataIndex: 'collectProgress', key: 'collectProgress', width: 120 },
        { title: '解析进度', dataIndex: 'parseProgress', key: 'parseProgress', width: 120, render: (p) => <Progress percent={parseInt(p)} size="small" /> },
        { title: '任务状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={s === '已完成' ? 'success' : 'processing'}>{s}</Tag> },
        { title: '是否货架任务', dataIndex: 'isShelf', key: 'isShelf', width: 110 },
        { title: '行列号', dataIndex: 'shelfPos', key: 'shelfPos', width: 100 },
        { title: '采集员', dataIndex: 'collector', key: 'collector', width: 100 },
        { title: '质检员', dataIndex: 'qaer', key: 'qaer', width: 100 },
        { title: '通过质检(分钟)', dataIndex: 'passMinutes', key: 'passMinutes', width: 130 },
        { title: '质检进度(数量)', dataIndex: 'qaCountProgress', key: 'qaCountProgress', width: 130 },
        { title: '质检进度(分钟)', dataIndex: 'qaMinuteProgress', key: 'qaMinuteProgress', width: 130 },
        { title: '质检合格率', dataIndex: 'passRate', key: 'passRate', width: 100 },
        { title: '标注类型', dataIndex: 'annoType', key: 'annoType', width: 110 },
        { title: '任务描述', dataIndex: 'desc', key: 'desc', width: 180, ellipsis: true },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
        { title: '开始上传时间', dataIndex: 'startTime', key: 'startTime', width: 170 },
        { title: '设备SN', dataIndex: 'deviceSN', key: 'deviceSN', width: 150 },
        { title: '已质检', dataIndex: 'isQaed', key: 'isQaed', width: 80 },
        { title: '通过质检(数量)', dataIndex: 'passedCount', key: 'passedCount', width: 120 },
        {
            title: '操作', key: 'action', width: 200, fixed: 'right',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="link" 
                        size="small" 
                        icon={<FormOutlined />} 
                        style={{ padding: 0 }}
                        onClick={() => handleSingleAllocate(record)}
                    >
                        重新分配
                    </Button>
                    <Button 
                        type="link" 
                        size="small" 
                        icon={<SearchOutlined />} 
                        style={{ padding: 0 }}
                        onClick={() => router.push(`/collection/qa/${record.instanceId}`)}
                    >
                        质检
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <MainLayout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>数据质检</Title>
            </div>

            <Card className="search-form" style={{ marginBottom: 16 }}>
                <Form layout="inline">
                    <Form.Item label="项目"><Input placeholder="请输入项目" allowClear style={{ width: 150 }} /></Form.Item>
                    <Form.Item label="任务ID"><Input placeholder="请输入任务ID" allowClear style={{ width: 130 }} /></Form.Item>
                    <Form.Item label="质检批次"><Input placeholder="例如 BATCH-..." allowClear style={{ width: 150 }} value={filterBatch} onChange={e => setFilterBatch(e.target.value)} /></Form.Item>
                    <Form.Item label="采集员"><Input placeholder="姓名" allowClear style={{ width: 100 }} /></Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button icon={<ReloadOutlined />}>重置</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Card styles={{ body: { padding: 0 } }}>
                <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>质检任务列表</span>
                    <Space>
                        <Button icon={<UserAddOutlined />} onClick={handleBatchAllocate}>批量分配</Button>
                        <Button icon={<DownloadOutlined />}>下载</Button>
                    </Space>
                </div>
                <Table 
                    rowSelection={{ 
                        type: 'checkbox',
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys)
                    }}
                    columns={columns} 
                    dataSource={filteredData} 
                    scroll={{ x: 3000 }} 
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} 
                />
            </Card>

            <Modal
                title={allocateType === 'batch' ? `批量重新分配 共(${selectedRowKeys.length})条` : '重新分配'}
                open={isAllocateModalVisible}
                onOk={handleAllocateSubmit}
                onCancel={() => setIsAllocateModalVisible(false)}
                okText="确定"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={allocateForm} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} preserve={false} style={{ marginTop: 24 }}>
                    <Form.Item 
                        label="质检员" 
                        name="assignee" 
                        rules={[{ required: true, message: '请选择质检员' }]}
                    >
                        <Select placeholder="请选择质检员">
                            <Select.Option value="质检员00792">质检员00792</Select.Option>
                            <Select.Option value="质检员00793">质检员00793</Select.Option>
                            <Select.Option value="专家质检组">专家质检组</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </MainLayout>
    );
}

export default function QaPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QaContent />
        </Suspense>
    );
}
