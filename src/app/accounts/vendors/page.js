'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Modal, Popconfirm, App, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title } = Typography;

const mockData = [
    { key: '1', vendorId: 'V-001', name: '标注服务商A', count: 15, admin: 'vendor_admin_a', createTime: '2025-01-10 10:00', status: '启用' },
    { key: '2', vendorId: 'V-002', name: '标注服务商B', count: 8, admin: 'vendor_admin_b', createTime: '2025-01-20 14:00', status: '启用' },
    { key: '3', vendorId: 'V-003', name: '标注服务商C', count: 20, admin: 'vendor_admin_c', createTime: '2025-02-01 09:00', status: '停用' },
];

export default function VendorPage() {
  const { message } = App.useApp();
    const [createOpen, setCreateOpen] = useState(false);

    const columns = [
        { title: '服务商ID', dataIndex: 'vendorId', width: 100 },
        { title: '服务商名称', dataIndex: 'name', width: 160 },
        { title: '服务商人数', dataIndex: 'count', width: 100 },
        { title: '服务商管理员', dataIndex: 'admin', width: 160 },
        { title: '创建时间', dataIndex: 'createTime', width: 170 },
        { title: '服务商状态', dataIndex: 'status', width: 100, render: (s) => <StatusTag status={s === '启用' ? '已完成' : '停用'}>{s}</StatusTag> },
        {
            title: '操作', key: 'action', width: 250, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={() => message.success(record.status === '启用' ? '已停用' : '已启用')}>{record.status === '启用' ? '停用' : '启用'}</Button>
                    <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => message.success('密码已重置')}>重置密码</Button>
                    <Popconfirm title="确定删除？" onConfirm={() => message.success('已删除')}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="ui-page">
                <PageHeader title="服务商" description="管理外部服务商账号与访问状态。" breadcrumbs={[{ title: '系统管理' }, { title: '服务商' }]} />
                <FilterPanel>
                    <QueryFilter
                        submitter={{
                            submitButtonProps: { icon: <SearchOutlined /> },
                            resetButtonProps: { icon: <ReloadOutlined /> },
                        }}
                    >
                        <ProFormText name="vendorName" label="服务商名称" placeholder="请输入服务商名称" />
                    </QueryFilter>
                </FilterPanel>

                <Card className="ui-table-card">
                    <TableToolbar title="服务商列表" count={mockData.length} actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>添加服务商</Button>} />
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <AppModal title="添加服务商" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => { setCreateOpen(false); message.success('添加成功'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="服务商名称" required><Input placeholder="请输入服务商名称" /></Form.Item>
                        <Form.Item label="账号名称" required><Input placeholder="请输入管理员账号" /></Form.Item>
                        <Form.Item label="账号密码" required><Input.Password placeholder="请输入密码" /></Form.Item>
                    </Form>
                </AppModal>
                </div>
            </MainLayout>
    );
}
