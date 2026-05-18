'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Modal, Row, Col, Descriptions, DatePicker, App } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, UploadOutlined, ThunderboltOutlined, EyeOutlined, DownOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const mockData = [
    { key: '1', name: 'franka_grasp_20250301', rawId: 'RD-001', project: '具身抓取项目A', duration: '02:30:00', createTime: '2025-03-01 10:00', creator: '管理员', format: 'ZIP', fileSize: '2.5 GB' },
    { key: '2', name: 'franka_place_20250301', rawId: 'RD-002', project: '具身抓取项目A', duration: '01:45:00', createTime: '2025-03-01 14:00', creator: '管理员', format: 'TAR.GZ', fileSize: '1.8 GB' },
    { key: '3', name: 'ur5e_carry_20250302', rawId: 'RD-003', project: '具身搬运项目B', duration: '03:00:00', createTime: '2025-03-02 09:00', creator: '张三', format: 'ZIP', fileSize: '3.2 GB' },
    { key: '4', name: 'franka_sort_20250303', rawId: 'RD-004', project: '具身分拣项目C', duration: '02:15:00', createTime: '2025-03-03 10:00', creator: '管理员', format: 'ZIP', fileSize: '1.5 GB' },
    { key: '5', name: 'franka_assembly_20250305', rawId: 'RD-005', project: '具身装配项目D', duration: '04:00:00', createTime: '2025-03-05 08:00', creator: '李四', format: 'TAR.GZ', fileSize: '4.1 GB' },
];

export default function RawDataPage() {
  const { message } = App.useApp();
    const [uploadOpen, setUploadOpen] = useState(false);
    const [parseOpen, setParseOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRaw, setSelectedRaw] = useState(null);

    const columns = [
        { title: '数据名称', dataIndex: 'name', key: 'name', width: 260 },
        { title: '原始数据ID', dataIndex: 'rawId', key: 'rawId', width: 120 },
        { title: '项目名称', dataIndex: 'project', key: 'project', width: 160 },
        { title: '时长', dataIndex: 'duration', key: 'duration', width: 100 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
        {
            title: '操作', key: 'action', width: 200, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<ThunderboltOutlined />} onClick={() => { setSelectedData(record); setParseOpen(true); }}>数据解析</Button>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRaw(record); setDetailOpen(true); }}>查看详情</Button>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="page-header"><h3 className="page-header-title">原始数据</h3></div>
                <Card 
                    style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
                    styles={{ body: { padding: '24px 24px 0' } }}
                >
                    <Form layout="horizontal" labelCol={{ flex: '80px' }}>
                        <Row gutter={24}>
                            <Col span={6}>
                                <Form.Item label="所属项目"><Select placeholder="全部" allowClear options={[{ value: '具身抓取项目A' }, { value: '具身搬运项目B' }, { value: '具身分拣项目C' }]} /></Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="数据名称"><Input placeholder="请输入" allowClear /></Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="创建时间"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
                            </Col>
                            <Col span={6} style={{ textAlign: 'right' }}>
                                <Space>
                                    <Button icon={<ReloadOutlined />}>重置</Button>
                                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                    <Button type="link" size="small" icon={<DownOutlined />}>展开</Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form>
                </Card>

                <Card>
                    <div className="table-toolbar">
                        <span className="table-toolbar-title">原始数据列表</span>
                        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>上传数据</Button>
                    </div>
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <Modal title="上传数据" open={uploadOpen} onCancel={() => setUploadOpen(false)} onOk={() => { setUploadOpen(false); message.success('上传成功'); }} okText="确定" cancelText="取消" width={560}>
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="所属项目" required><Select placeholder="请选择项目" options={[{ value: '具身抓取项目A' }, { value: '具身搬运项目B' }]} /></Form.Item>
                        <Form.Item label="数据名称" required><Input placeholder="请输入数据名称" /></Form.Item>
                        <Form.Item label="上传文件" required>
                            <div style={{ border: '2px dashed #d9d9d9', borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                                <UploadOutlined style={{ fontSize: 32, color: '#bfbfbf', marginBottom: 8 }} /><br />
                                <span style={{ color: '#666' }}>点击或拖拽文件到此处上传</span><br />
                                <span style={{ color: '#999', fontSize: 12 }}>支持 .zip, .tar.gz 格式</span>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal title="数据解析" open={parseOpen} onCancel={() => setParseOpen(false)} onOk={() => { setParseOpen(false); message.success('解析任务已创建'); }} okText="开始解析" cancelText="取消" width={600}>
                    {selectedData && (
                        <Form layout="vertical" style={{ marginTop: 16 }}>
                            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                                <Descriptions.Item label="所属项目">{selectedData.project}</Descriptions.Item>
                                <Descriptions.Item label="数据名称">{selectedData.name}</Descriptions.Item>
                                <Descriptions.Item label="原始数据ID">{selectedData.rawId}</Descriptions.Item>
                                <Descriptions.Item label="时长">{selectedData.duration}</Descriptions.Item>
                            </Descriptions>
                            <Form.Item label="工作流模板" required extra="选择适合当前数据解析的模板">
                                <Select placeholder="请选择工作流模板" options={[{ value: 'rosbag解析模板', label: 'rosbag解析模板' }, { value: 'HDF5解析模板', label: 'HDF5解析模板' }, { value: '自定义模板', label: '自定义模板' }]} />
                            </Form.Item>
                            <Form.Item label="数据子集" required extra="选择解析后数据存放位置">
                                <Select placeholder="请选择数据子集" options={[{ value: '子集A-01' }, { value: '子集B-01' }]} />
                            </Form.Item>
                        </Form>
                    )}
                </Modal>

                <Modal title="原始数据详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
                    {selectedRaw && (
                        <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
                            <Descriptions.Item label="数据名称">{selectedRaw.name}</Descriptions.Item>
                            <Descriptions.Item label="原始数据ID">{selectedRaw.rawId}</Descriptions.Item>
                            <Descriptions.Item label="所属项目">{selectedRaw.project}</Descriptions.Item>
                            <Descriptions.Item label="时长">{selectedRaw.duration}</Descriptions.Item>
                            <Descriptions.Item label="文件格式">{selectedRaw.format || '—'}</Descriptions.Item>
                            <Descriptions.Item label="文件大小">{selectedRaw.fileSize || '—'}</Descriptions.Item>
                            <Descriptions.Item label="创建人">{selectedRaw.creator}</Descriptions.Item>
                            <Descriptions.Item label="创建时间">{selectedRaw.createTime}</Descriptions.Item>
                        </Descriptions>
                    )}
                </Modal>
            </MainLayout>
    );
}
