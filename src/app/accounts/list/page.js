'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Form, Card, Typography, Modal, Select, Popconfirm, App } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, LockOutlined, KeyOutlined, MinusCircleFilled, PlusCircleFilled } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const mockData = [
    { key: '1', accountId: 'A-001', name: 'admin', type: '企业管理员', createTime: '2025-01-01 10:00', status: '启用' },
    { key: '2', accountId: 'A-002', name: 'annotator_a', type: '标注员', createTime: '2025-01-15 14:00', status: '启用' },
    { key: '3', accountId: 'A-003', name: 'annotator_b', type: '标注员', createTime: '2025-01-20 09:00', status: '启用' },
    { key: '4', accountId: 'A-004', name: 'reviewer_a', type: '审核员', createTime: '2025-02-01 10:00', status: '启用' },
    { key: '5', accountId: 'A-005', name: 'acceptor_a', type: '验收员', createTime: '2025-02-01 14:00', status: '启用' },
    { key: '6', accountId: 'A-006', name: 'annotator_c', type: '标注员', createTime: '2025-02-15 10:00', status: '停用' },
    { key: '7', accountId: 'A-007', name: 'leader_a', type: '验收组长', createTime: '2025-02-20 09:00', status: '启用' },
];

export default function AccountListPage() {
  const { message } = App.useApp();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [changeOpen, setChangeOpen] = useState(false);

    const columns = [
        { title: '账号ID', dataIndex: 'accountId', width: 80 },
        { title: '账号名', dataIndex: 'name', width: 160 },
        {
            title: '账号类型', dataIndex: 'type', width: 120, render: (t) => {
                const colorMap = { '企业管理员': 'blue', '标注员': 'green', '审核员': 'orange', '验收员': 'purple', '验收组长': 'red' };
                return <Tag color={colorMap[t]}>{t}</Tag>;
            }
        },
        { title: '创建时间', dataIndex: 'createTime', width: 170 },
        { title: '账号状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === '启用' ? 'success' : 'default'}>{s}</Tag> },
        {
            title: '操作', key: 'action', width: 360,
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button type="link" size="small" onClick={() => message.success(record.status === '启用' ? '已停用' : '已启用')}>{record.status === '启用' ? '停用' : '启用'}</Button>
                    <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => setResetOpen(true)}>重置密码</Button>
                    <Button type="link" size="small" icon={<LockOutlined />} onClick={() => setChangeOpen(true)}>修改密码</Button>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
                    <Popconfirm title="确定删除此账号？" onConfirm={() => message.success('已删除')}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                <div className="page-header"><h3 className="page-header-title">用户管理</h3></div>
                <Card className="search-form" style={{ marginBottom: 16 }}>
                    <Form layout="inline">
                        <Form.Item label="用户名"><Input placeholder="请输入用户名" allowClear style={{ width: 200 }} /></Form.Item>
                        <Form.Item><Space><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button icon={<ReloadOutlined />}>重置</Button></Space></Form.Item>
                    </Form>
                </Card>

                <Card>
                    <div className="table-toolbar">
                        <span className="table-toolbar-title">用户列表</span>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>添加用户</Button>
                    </div>
                    <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                <Modal title="添加成员" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => { setCreateOpen(false); message.success('创建成功'); }} okText="确定" cancelText="取消" width={560}>
                    <Form layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} style={{ marginTop: 24 }}>
                        <Form.Item label="成员" required name="memberName">
                            <Input placeholder="请输入成员姓名" maxLength={20} showCount />
                        </Form.Item>
                        <Form.Item label="账号" required name="account">
                            <Input placeholder="请输入账号" maxLength={20} showCount />
                        </Form.Item>
                        <Form.Item label="密码" required name="password">
                            <Input.Password placeholder="请输入密码" />
                        </Form.Item>
                        <Form.List name="centers" initialValue={[{}]}>
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <Form.Item
                                            key={key}
                                            label={index === 0 ? "数采中心" : " "}
                                            colon={index === 0}
                                            required
                                            style={{ marginBottom: 16 }}
                                        >
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <Form.Item {...restField} name={[name, 'center']} rules={[{ required: true, message: '请选择数采中心' }]} style={{ margin: 0, flex: 1 }}>
                                                    <Select placeholder="请选择数采中心" options={[{ value: '中心A', label: '中心A' }, { value: '中心B', label: '中心B' }]} />
                                                </Form.Item>
                                                <Form.Item {...restField} name={[name, 'role']} rules={[{ required: true, message: '请选择角色' }]} style={{ margin: 0, flex: 1 }}>
                                                    <Select placeholder="请选择角色" options={[
                                                        { value: '企业管理员', label: '企业管理员' },
                                                        { value: '标注员', label: '标注员' },
                                                        { value: '审核员', label: '审核员' },
                                                        { value: '验收员', label: '验收员' },
                                                        { value: '验收组长', label: '验收组长' },
                                                    ]} />
                                                </Form.Item>
                                                <MinusCircleFilled 
                                                    style={{ color: '#ff4d4f', fontSize: 22, cursor: fields.length > 1 ? 'pointer' : 'not-allowed', opacity: fields.length > 1 ? 1 : 0.5 }} 
                                                    onClick={() => fields.length > 1 && remove(name)} 
                                                />
                                                <PlusCircleFilled 
                                                    style={{ color: '#69b1ff', fontSize: 22, cursor: 'pointer' }} 
                                                    onClick={() => add()} 
                                                />
                                            </div>
                                        </Form.Item>
                                    ))}
                                </>
                            )}
                        </Form.List>
                    </Form>
                </Modal>

                <Modal title="编辑账号" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => { setEditOpen(false); message.success('编辑成功'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="账号类型" required>
                            <Select defaultValue="标注员" options={[
                                { value: '企业管理员' }, { value: '标注员' }, { value: '审核员' }, { value: '验收员' }, { value: '验收组长' },
                            ]} />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal title="重置密码" open={resetOpen} onCancel={() => setResetOpen(false)} onOk={() => { setResetOpen(false); message.success('密码已重置'); }} okText="确认重置" cancelText="取消">
                    <p>确认将此账号密码重置为默认密码？</p>
                    <p style={{ color: '#ff4d4f' }}>此操作不可撤销</p>
                </Modal>

                <Modal title="修改密码" open={changeOpen} onCancel={() => setChangeOpen(false)} onOk={() => { setChangeOpen(false); message.success('密码修改成功'); }} okText="确定" cancelText="取消">
                    <Form layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="当前密码" required><Input.Password placeholder="请输入当前密码" /></Form.Item>
                        <Form.Item label="新密码" required><Input.Password placeholder="请输入新密码" /></Form.Item>
                        <Form.Item label="确认新密码" required><Input.Password placeholder="请再次输入新密码" /></Form.Item>
                    </Form>
                </Modal>
            </MainLayout>
    );
}
