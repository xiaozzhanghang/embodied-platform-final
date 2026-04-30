'use client';

import React from 'react';
import { Table, Button, Tag, Space, Input, Card, Typography, Form, Popconfirm, Tooltip, Breadcrumb, Badge, Select } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, ColumnHeightOutlined, SettingOutlined, EyeOutlined, EditOutlined, StopOutlined, DownOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function DeviceListPage() {

  const deviceColumns = [
    { title: '设备名称', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
    { 
      title: '运行状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 110,
      render: (s) => {
        const map = {
          '在线': { status: 'success', color: '#52c41a' },
          '离线': { status: 'error', color: '#ff4d4f' },
          '维护中': { status: 'warning', color: '#faad14' },
        };
        const cfg = map[s] || map['离线'];
        return <Badge status={cfg.status} text={<span style={{ color: cfg.color, fontWeight: 500 }}>{s}</span>} />;
      },
      filters: [{ text: '在线', value: '在线' }, { text: '离线', value: '离线' }, { text: '维护中', value: '维护中' }],
      onFilter: (value, record) => record.status === value,
    },
    { title: '英文名称', dataIndex: 'enName', key: 'enName', width: 200, ellipsis: true },
    { 
      title: '设备编号', 
      dataIndex: 'deviceNum', 
      key: 'deviceNum', 
      width: 130,
      render: (text) => <Tag style={{ backgroundColor: '#f5f5f5', color: '#595959', border: '1px solid #d9d9d9' }}>{text}</Tag>
    },
    { 
      title: 'URDF', 
      dataIndex: 'urdf', 
      key: 'urdf',
      width: 150,
      render: (text) => text !== '-' ? <a href="#">{text}</a> : '-'
    },
    { 
      title: '设备图片', 
      dataIndex: 'image', 
      key: 'image', 
      width: 100,
      render: () => <span style={{ color: '#bfbfbf' }}>无图片</span>
    },
    { title: '注册时间', dataIndex: 'regTime', key: 'regTime', width: 170 },
    { title: '活跃时间', dataIndex: 'activeTime', key: 'activeTime', width: 170 },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: () => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }}>编辑</Button>
          <Popconfirm title="确定禁用此设备吗？" okText="是" cancelText="否">
            <Button type="link" danger size="small" icon={<StopOutlined />} style={{ padding: 0 }}>禁用</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  // Generate mock data mimicking the screenshot
  const statusList = ['在线', '在线', '离线', '在线', '维护中', '在线', '在线', '离线', '在线', '在线'];
  const deviceData = Array.from({ length: 10 }).map((_, i) => ({
    key: String(i),
    name: `R001GBDDAAAE081${i}`,
    enName: `R001GBDDAAA...`,
    deviceNum: `DEV-B-10${i}`,
    status: statusList[i],
    urdf: i % 3 === 0 ? 'galbot_v2.urdf' : '-',
    regTime: '2026-02-25 16:13:55',
    activeTime: '2026-02-25 16:13:55'
  }));

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: '首页' },
          { title: '设备管理' },
          { title: '设备列表' },
        ]} style={{ marginBottom: 16 }} />
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>设备列表</Title>
        <Text type="secondary">查看和管理所有已注册的机器人设备实例及其运行状态</Text>
      </div>

      <Card className="search-form" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Form layout="inline" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <Form.Item label="设备名称" style={{ margin: 0 }}><Input placeholder="请输入" allowClear style={{ width: 180 }} /></Form.Item>
            <Form.Item label="设备编号" style={{ margin: 0 }}><Input placeholder="请输入" allowClear style={{ width: 180 }} /></Form.Item>
            <Form.Item label="运行状态" style={{ margin: 0 }}><Select placeholder="全部" allowClear style={{ width: 120 }} options={[{ value: '在线', label: '🟢 在线' }, { value: '离线', label: '🔴 离线' }, { value: '维护中', label: '🟡 维护中' }]} /></Form.Item>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button>重置</Button>
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button type="link" style={{ padding: 0, marginLeft: 8 }}>展开 <DownOutlined /></Button>
          </div>
        </Form>
      </Card>

      <Card styles={{ body: { padding: '24px' } }} style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>设备实例列表</div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>新建</Button>
            <Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} /></Tooltip>
            <Tooltip title="密度"><Button type="text" icon={<ColumnHeightOutlined />} /></Tooltip>
            <Tooltip title="列设置"><Button type="text" icon={<SettingOutlined />} /></Tooltip>
          </Space>
        </div>

        <Table 
          rowSelection={{ type: 'checkbox' }} 
          columns={deviceColumns} 
          dataSource={deviceData} 
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} 
        />
      </Card>
    </MainLayout>
  );
}
