'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Modal, Popconfirm, App, Descriptions } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, SettingOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, TableToolbar } from '@/components/ui';

const { Title } = Typography;

const mockData = [
    { key: '1', projectId: 'P-001', name: '具身抓取项目A', enName: 'grasp-project-a', remark: '桌面场景抓取数据采集项目', createTime: '2025-01-10 10:00', creator: '管理员' },
    { key: '2', projectId: 'P-002', name: '具身搬运项目B', enName: 'carry-project-b', remark: '仓库搬运场景数据采集', createTime: '2025-01-20 14:00', creator: '管理员' },
    { key: '3', projectId: 'P-003', name: '具身分拣项目C', enName: 'sort-project-c', remark: '基于颜色和形状的物体分拣', createTime: '2025-02-01 09:00', creator: '管理员' },
    { key: '4', projectId: 'P-004', name: '具身装配项目D', enName: 'assembly-project-d', remark: '零部件装配操作采集', createTime: '2025-02-15 10:30', creator: '管理员' },
    { key: '5', projectId: 'P-005', name: 'VLA标注项目E', enName: 'vla-annotation-e', remark: 'VLA模型训练数据标注', createTime: '2025-03-01 08:00', creator: '管理员' },
];

export default function ProjectManagementPage() {
  const { message } = App.useApp();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const columns = [
        { title: '项目ID', dataIndex: 'projectId', key: 'projectId', width: 100 },
        { title: '项目名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '英文名称', dataIndex: 'enName', key: 'enName', width: 180 },
        { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
        {
            title: '操作', key: 'action', width: 220, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => setEditOpen(true)}>配置</Button>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedProject(record); setDetailOpen(true); }}>查看详情</Button>
                    <Popconfirm title="确定删除此项目？" onConfirm={() => message.success('已删除')} okText="确定" cancelText="取消">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="ui-page">
                <PageHeader title="项目管理" description="管理数据采集与标注的项目空间。" breadcrumbs={[{ title: '系统管理' }, { title: '项目管理' }]} />
                <FilterPanel>
                    <QueryFilter
                        submitter={{
                            submitButtonProps: { icon: <SearchOutlined /> },
                            resetButtonProps: { icon: <ReloadOutlined /> },
                        }}
                    >
                        <ProFormText name="projectName" label="项目名称" placeholder="请输入项目名称" />
                    </QueryFilter>
                </FilterPanel>

                <Card className="ui-table-card">
                    <TableToolbar title="项目列表" count={mockData.length} actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建项目</Button>} />
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <AppModal title="新建项目" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => { setCreateOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="项目中文名称" required><Input placeholder="请输入项目中文名称" /></Form.Item>
                        <Form.Item label="英文名称" required><Input placeholder="请输入英文名称" /></Form.Item>
                        <Form.Item label="备注"><Input.TextArea rows={3} placeholder="请输入备注" /></Form.Item>
                    </Form>
                </AppModal>

                <AppModal title="项目配置" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => { setEditOpen(false); message.success('配置已保存'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="项目中文名称" required><Input defaultValue="具身抓取项目A" /></Form.Item>
                        <Form.Item label="描述"><Input.TextArea rows={3} defaultValue="桌面场景抓取数据采集项目" /></Form.Item>
                    </Form>
                </AppModal>

                <AppModal title="项目详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} widthSize="small">
                    {selectedProject && (
                        <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
                            <Descriptions.Item label="项目ID">{selectedProject.projectId}</Descriptions.Item>
                            <Descriptions.Item label="项目名称">{selectedProject.name}</Descriptions.Item>
                            <Descriptions.Item label="英文名称">{selectedProject.enName}</Descriptions.Item>
                            <Descriptions.Item label="创建人">{selectedProject.creator}</Descriptions.Item>
                            <Descriptions.Item label="备注" span={2}>{selectedProject.remark}</Descriptions.Item>
                            <Descriptions.Item label="创建时间" span={2}>{selectedProject.createTime}</Descriptions.Item>
                        </Descriptions>
                    )}
                </AppModal>
                </div>
            </MainLayout>
    );
}
