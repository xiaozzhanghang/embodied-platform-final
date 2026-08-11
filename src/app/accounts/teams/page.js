'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Modal, Transfer, Popconfirm, App, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, TeamOutlined, DeleteOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title } = Typography;

const mockData = [
    { key: '1', teamId: 'T-001', name: '标注团队A', admin: '标注员A', count: 5, createTime: '2025-01-15 10:00', status: '启用' },
    { key: '2', teamId: 'T-002', name: '审核团队A', admin: '审核员A', count: 3, createTime: '2025-01-20 14:00', status: '启用' },
    { key: '3', teamId: 'T-003', name: '标注团队B', admin: '标注员D', count: 8, createTime: '2025-02-01 09:00', status: '停用' },
];

const memberData = [
    { key: '1', name: '标注员A', role: '标注员', isAdmin: true, joinTime: '2025-01-15' },
    { key: '2', name: '标注员B', role: '标注员', isAdmin: false, joinTime: '2025-01-16' },
    { key: '3', name: '标注员E', role: '标注员', isAdmin: false, joinTime: '2025-02-01' },
    { key: '4', name: '审核员A', role: '审核员', isAdmin: false, joinTime: '2025-01-20' },
    { key: '5', name: '审核员B', role: '审核员', isAdmin: false, joinTime: '2025-02-10' },
];

export default function TeamManagementPage() {
  const { message } = App.useApp();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [memberOpen, setMemberOpen] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [targetKeys, setTargetKeys] = useState([]);

    const transferData = [
        { key: 'a1', title: '标注员F', description: '标注员' },
        { key: 'a2', title: '标注员G', description: '标注员' },
        { key: 'a3', title: '审核员C', description: '审核员' },
        { key: 'a4', title: '标注员H', description: '标注员' },
    ];

    const columns = [
        { title: '团队ID', dataIndex: 'teamId', width: 80 },
        { title: '团队名称', dataIndex: 'name', width: 160 },
        { title: '团队管理员', dataIndex: 'admin', width: 120 },
        { title: '团队人数', dataIndex: 'count', width: 100 },
        { title: '创建时间', dataIndex: 'createTime', width: 170 },
        { title: '状态', dataIndex: 'status', width: 80, render: (s) => <StatusTag status={s === '启用' ? '已完成' : '停用'}>{s}</StatusTag> },
        {
            title: '操作', key: 'action', width: 300, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={() => message.success(record.status === '启用' ? '已停用' : '已启用')}>{record.status === '启用' ? '停用' : '启用'}</Button>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑团队</Button>
                    <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => setMemberOpen(true)}>成员列表</Button>
                </Space>
            ),
        },
    ];

    const memberColumns = [
        { title: '成员名称', dataIndex: 'name', width: 120 },
        { title: '角色', dataIndex: 'role', width: 100, render: (r) => <Tag color={r === '标注员' ? 'green' : 'orange'}>{r}</Tag> },
        { title: '是否管理员', dataIndex: 'isAdmin', width: 100, render: (a) => a ? <Tag color="blue">管理员</Tag> : '-' },
        { title: '加入时间', dataIndex: 'joinTime', width: 120 },
        {
            title: '操作', key: 'action', width: 220, fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<UserSwitchOutlined />} onClick={() => message.success(record.isAdmin ? '已移除管理员' : '已设为管理员')}>
                        {record.isAdmin ? '移除管理员' : '设为管理员'}
                    </Button>
                    <Popconfirm title="确定移除？" onConfirm={() => message.success('已移除')}><Button type="link" size="small" danger>移除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="ui-page">
                <PageHeader title="团队管理" description="管理团队及成员归属关系。" breadcrumbs={[{ title: '系统管理' }, { title: '团队管理' }]} />
                <FilterPanel>
                    <QueryFilter
                        submitter={{
                            submitButtonProps: { icon: <SearchOutlined /> },
                            resetButtonProps: { icon: <ReloadOutlined /> },
                        }}
                    >
                        <ProFormText name="teamName" label="团队名称" placeholder="请输入团队名称" />
                    </QueryFilter>
                </FilterPanel>

                <Card className="ui-table-card">
                    <TableToolbar title="团队列表" count={mockData.length} actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建团队</Button>} />
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <AppModal title="新建团队" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => { setCreateOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="团队名称" required><Input placeholder="请输入团队名称" /></Form.Item>
                    </Form>
                </AppModal>

                <AppModal title="编辑团队" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => { setEditOpen(false); message.success('保存成功'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="团队名称" required><Input defaultValue="标注团队A" /></Form.Item>
                    </Form>
                </AppModal>

                <AppModal title="成员列表" open={memberOpen} onCancel={() => setMemberOpen(false)} footer={null}>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddMemberOpen(true)}>添加成员</Button>
                    </div>
                    <Table columns={memberColumns} dataSource={memberData} size="small" pagination={false} />
                </AppModal>

                <AppModal title="添加成员" open={addMemberOpen} onCancel={() => setAddMemberOpen(false)} onOk={() => { setAddMemberOpen(false); message.success('添加成功'); }} okText="确定" cancelText="取消">
                    <Transfer
                        dataSource={transferData}
                        targetKeys={targetKeys}
                        onChange={setTargetKeys}
                        render={(item) => `${item.title} (${item.description})`}
                        titles={['可选成员', '已选成员']}
                        listStyle={{ width: 240, height: 300 }}
                    />
                </AppModal>
                </div>
            </MainLayout>
    );
}
