'use client';

import React, { useState } from 'react';
import {
  Table, Button, Input, Space, Tabs, Tag, Typography,
  Breadcrumb, Checkbox, Tooltip, App, Form, Row, Col, Select, Modal,
  Upload
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  LineHeightOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  LinkOutlined,
  SearchOutlined,
  UploadOutlined,
  RobotOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Link } = Typography;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const robotData = [
  {
    key: '1',
    name: 'galbot_2.2_RGB',
    enName: 'galbot_2.2',
    version: 'V2.2',
    urdf: 'galbot_v2.urdf',
    sensorDesc: '包含 galbot V2.2 平台，支持 RGB 彩色相机采集',
    regTime: '2025-12-20',
    status: 'active',
  },
  {
    key: '2',
    name: 'galbot_2.2_深度',
    enName: 'galbot_2.2',
    version: 'V2.2.1',
    urdf: 'galbot_v2_depth.urdf',
    sensorDesc: '包含 galbot V2.2 平台，支持深度/点云传感器采集',
    regTime: '2025-12-19',
    status: 'active',
  },
  {
    key: '3',
    name: 'galbot_2.2_红外',
    enName: 'galbot_2.2',
    version: 'V2.2',
    urdf: 'galbot_v2_ir.urdf',
    sensorDesc: '包含 galbot V2.2 平台，支持红外热成像传感器采集',
    regTime: '2025-12-19',
    status: 'active',
  },
  {
    key: '4',
    name: 'franka_fr3_std',
    enName: 'Franka_FR3',
    version: 'V1.0',
    urdf: 'franka_fr3.urdf',
    sensorDesc: '支持 Franka FR3 六轴机械臂，力控精度 0.1N',
    regTime: '2025-11-05',
    status: 'active',
  },
];

const partData = [
  {
    key: '1',
    name: '灵巧手_右',
    enName: 'LingQiaoShou_Right',
    version: 'G1.0',
    urdf: 'hand_r.urdf',
    sensorDesc: '包含触觉传感器、力矩传感器等多模态感知',
    regTime: '2025-12-20',
    status: 'active',
  },
  {
    key: '2',
    name: '夹爪_右',
    enName: 'JiaZhao_Right',
    version: 'C2.1',
    urdf: 'gripper_r.urdf',
    sensorDesc: '工业标准平行夹爪，最大夹持力 80N',
    regTime: '2025-12-20',
    status: 'active',
  },
  {
    key: '3',
    name: '吸盘组_标准',
    enName: 'Suction_STD',
    version: 'S1.5',
    urdf: 'suction_std.urdf',
    sensorDesc: '真空吸盘阵列，适用平面物品拣选',
    regTime: '2025-12-15',
    status: 'inactive',
  },
];

// ─── Reusable Table ────────────────────────────────────────────────────────────

function DeviceTable({ data, type }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [selectedKeys, setSelectedKeys] = useState([]);

  const isRobot = type === 'robot';
  const labelName = isRobot ? '机器人名称' : '部件名称';
  const addLabel = isRobot ? '添加设备' : '添加部件';

  const onAdd = () => {
    if (isRobot) {
      router.push('/collection/device-types/add');
    } else {
      message.info('添加部件功能页面开发中');
    }
  };

  const columns = [
    {
      title: labelName,
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (t) => (
        <Space>
          {isRobot ? <RobotOutlined style={{ color: '#1890ff' }} /> : <ApiOutlined style={{ color: '#722ed1' }} />}
          <Text strong style={{ fontSize: 13 }}>{t}</Text>
        </Space>
      ),
    },
    { title: '英文名称', dataIndex: 'enName', key: 'enName', width: 160 },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80, render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: 'URDF',
      dataIndex: 'urdf',
      key: 'urdf',
      width: 160,
      render: (f) => (
        <Space>
          <LinkOutlined style={{ color: '#1890ff' }} />
          <Link style={{ fontSize: 12 }} onClick={() => message.info(`预览 URDF: ${f}`)}>{f}</Link>
        </Space>
      ),
    },
    {
      title: '传感器描述',
      dataIndex: 'sensorDesc',
      key: 'sensorDesc',
      ellipsis: true,
      render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>,
    },
    { title: '注册时间', dataIndex: 'regTime', key: 'regTime', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) => <Tag color={s === 'active' ? 'success' : 'default'}>{s === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ color: '#1890ff', padding: '0 4px' }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ color: '#1890ff', padding: '0 4px' }}>编辑</Button>
          <Button
            type="link"
            size="small"
            icon={<StopOutlined />}
            style={{ color: record.status === 'active' ? '#ff4d4f' : '#52c41a', padding: '0 4px' }}
            onClick={() => message.info(record.status === 'active' ? '禁用操作开发中' : '启用操作开发中')}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text strong style={{ fontSize: 15 }}>{isRobot ? '机器人设备列表' : '机器人部件列表'}</Text>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>{addLabel}</Button>
          <Tooltip title="刷新"><Button icon={<ReloadOutlined />} /></Tooltip>
          <Tooltip title="密度"><Button icon={<LineHeightOutlined />} /></Tooltip>
          <Tooltip title="列设置"><Button icon={<SettingOutlined />} /></Tooltip>
        </Space>
      </div>

      <Table
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedKeys,
          onChange: setSelectedKeys,
        }}
        columns={columns}
        dataSource={data}
        scroll={{ x: 1100 }}
        pagination={{
          total: data.length,
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条数据`,
          pageSizeOptions: ['20', '50', '100'],
        }}
        size="middle"
      />
    </div>
  );
}

export default function DeviceTypesPage() {
  const [activeTab, setActiveTab] = useState('robot');
  const [nameFilter, setNameFilter] = useState('');
  const [versionFilter, setVersionFilter] = useState('');

  const filteredRobots = robotData.filter(
    (d) =>
      d.name.includes(nameFilter) &&
      d.version.toLowerCase().includes(versionFilter.toLowerCase())
  );
  const filteredParts = partData.filter(
    (d) =>
      d.name.includes(nameFilter) &&
      d.version.toLowerCase().includes(versionFilter.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb
          items={[{ title: '首页' }, { title: '设备管理' }, { title: '设备类型' }]}
          style={{ marginBottom: 12 }}
        />
        <Title level={4} style={{ margin: 0 }}>设备类型管理</Title>
        <Text type="secondary">统一管理机器人设备及其组成部件的类型定义与 URDF 配置</Text>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
          padding: '16px 24px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Space size="large" wrap>
          <Space>
            <Text style={{ whiteSpace: 'nowrap', color: '#595959' }}>设备名称：</Text>
            <Input
              placeholder="请输入设备名称"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
          </Space>
          <Space>
            <Text style={{ whiteSpace: 'nowrap', color: '#595959' }}>版本号：</Text>
            <Input
              placeholder="请输入版本号"
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              style={{ width: 180 }}
              allowClear
            />
          </Space>
        </Space>
        <Space style={{ marginLeft: 'auto' }}>
          <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setNameFilter(''); setVersionFilter(''); }}>重置</Button>
        </Space>
      </div>

      {/* Tabs + Table */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
          padding: '0 24px 24px',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'robot', label: '机器人设备' },
            { key: 'part', label: '机器人部件' },
          ]}
          style={{ marginBottom: 16 }}
        />

        {activeTab === 'robot' ? (
          <DeviceTable
            data={filteredRobots}
            type="robot"
          />
        ) : (
          <DeviceTable
            data={filteredParts}
            type="part"
          />
        )}
      </div>
    </MainLayout>
  );
}
