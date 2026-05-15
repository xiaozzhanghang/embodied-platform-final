'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Input, Card, Typography, 
  Form, Popconfirm, Tooltip, Breadcrumb, Badge, Select, 
  Modal, Collapse, Row, Col, Divider, App, Radio, Upload 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, 
  ColumnHeightOutlined, SettingOutlined, EyeOutlined, 
  EditOutlined, StopOutlined, DownOutlined, UpOutlined, RobotOutlined, 
  ApiOutlined, InfoCircleOutlined, DeleteOutlined, InboxOutlined 
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

// ─── Mock Data ──────────────────────────────────────────────────────────────

const deviceTypes = [
  { value: 'galbot_rgb', label: 'galbot_2.2_RGB' },
  { value: 'galbot_depth', label: 'galbot_2.2_深度' },
  { value: 'galbot_ir', label: 'galbot_2.2_红外' },
];

const componentCategories = [
    { value: 'RobotArm', label: '机械臂' },
    { value: 'Chassis', label: '底盘履带' },
    { value: 'LiftTorso', label: '升降躯干' },
    { value: 'Gripper', label: '二指夹爪' },
    { value: 'DexterousHand', label: '多指灵巧手' },
    { value: 'Camera', label: '相机' },
    { value: 'Body-HeadLeftCamera', label: 'Body-HeadLeftCamera(本体-头部左相机)' },
    { value: 'Body-HandLeftCamera', label: 'Body-HandLeftCamera(本体-手部左相机)' },
    { value: 'Body-HandRightCamera', label: 'Body-HandRightCamera(本体-手部右相机)' },
    { value: 'Body-HeadRightCamera', label: 'Body-HeadRightCamera(本体-头部右相机)' },
];

const partData = [
    { key: '1', name: 'GoPro相机', category: 'Body-HeadLeftCamera' },
    { key: '2', name: '短臂G1_手部左上相机', category: 'Body-HandLeftCamera' },
    { key: '3', name: '短臂G1_手部右下相机', category: 'Body-HandRightCamera' },
    { key: '4', name: '短臂G1_头部右相机', category: 'Body-HeadRightCamera' },
    { key: '5', name: '二指夹爪_左', category: 'Gripper' },
];

// Default parts mapping for each device type
const typeDefaultParts = {
    'galbot_std': ['2', '3', '4', '5'], // Standard Galbot components
    'franka_std': ['5'],           // Franka usually has a gripper
    'ego_dev': ['1'],              // Ego usually has a GoPro
};

const initialDeviceData = Array.from({ length: 5 }).map((_, i) => ({
  key: String(i),
  name: `R001GB-Node-${100 + i}`,
  deviceType: i % 2 === 0 ? 'galbot_std' : 'franka_std',
  deviceNum: `DEV-B-10${i}`,
  status: i % 3 === 0 ? '在线' : '离线',
  regTime: '2026-02-25 16:13:55',
  activeTime: '2026-02-25 17:00:01'
}));

export default function DeviceListPage() {
  const router = useRouter();
  const [expand, setExpand] = useState(false);
  const { message } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(initialDeviceData);
  const [form] = Form.useForm();

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
    },
    { 
        title: '设备类型', 
        dataIndex: 'deviceType', 
        width: 150, 
        render: (t) => {
            const type = deviceTypes.find(dt => dt.value === t);
            return <Tag color="blue" icon={<RobotOutlined />}>{type?.label || t}</Tag>
        }
    },
    { title: '设备编号', dataIndex: 'deviceNum', key: 'deviceNum', width: 130 },
    { title: '注册时间', dataIndex: 'regTime', key: 'regTime', width: 170 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => { setSelectedDevice(record); setDetailOpen(true); }}>查看详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/devices/detail/${record.key}?edit=true`)}>编辑</Button>
          <Popconfirm title="确定禁用此设备吗？">
            <Button type="link" danger size="small" icon={<StopOutlined />} style={{ padding: 0 }}>禁用</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

    const handleCreate = (values) => {
    const newDevice = {
      key: String(Date.now()),
      ...values,
      deviceNum: values.version || 'DEV-NEW', // Mapping version to deviceNum for mock
      status: '在线',
      regTime: '2026-05-11 10:50:00',
      activeTime: '2026-05-11 10:50:00'
    };
    setDeviceData([newDevice, ...deviceData]);
    setIsModalOpen(false);
    message.success('设备接入成功');
  };

  const handleDeviceTypeChange = (value) => {
    const defaults = typeDefaultParts[value] || [];
    form.setFieldsValue({ linkedParts: defaults });
    if (defaults.length > 0) {
      message.info(`已根据设备类型自动关联了 ${defaults.length} 个标准部件`);
    }
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: '首页' },
          { title: '设备管理' },
          { title: '设备列表' },
        ]} style={{ marginBottom: 16 }} />
        <Title level={3} style={{ margin: 0 }}>设备实例管理</Title>
      </div>

      <Card 
        style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
        styles={{ body: { padding: '24px 24px 0' } }}
      >
        <Form layout="horizontal" labelCol={{ flex: '80px' }}>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="设备名称"><Input placeholder="请输入设备名称" allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="设备类型"><Select placeholder="请选择类型" allowClear options={deviceTypes} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="设备状态"><Select placeholder="全部" allowClear options={[{label:'在线', value:'online'}, {label:'离线', value:'offline'}]} /></Form.Item>
            </Col>
            {!expand && (
              <Col span={6} style={{ textAlign: 'right' }}>
                <Space>
                  <Button icon={<ReloadOutlined />}>重置</Button>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                    展开 <DownOutlined />
                  </a>
                </Space>
              </Col>
            )}
          </Row>
          {expand && (
            <>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item label="SN序列号"><Input placeholder="请输入SN" allowClear /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="区域位置"><Input placeholder="请输入区域" allowClear /></Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={24} style={{ textAlign: 'right', marginBottom: 24 }}>
                  <Space>
                    <Button icon={<ReloadOutlined />}>重置</Button>
                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                    <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                      收起 <UpOutlined />
                    </a>
                  </Space>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Card>

      <Card styles={{ body: { padding: '24px' } }} style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space size={8}>
            <div style={{ width: 4, height: 16, background: '#1890ff', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 16 }}>设备实例列表</Text>
          </Space>
          <Space size={12}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setIsModalOpen(true); }}>新建设备</Button>
            <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            <Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} /></Tooltip>
          </Space>
        </div>

        <Table 
          rowSelection={{ type: 'checkbox' }} 
          columns={deviceColumns} 
          dataSource={deviceData} 
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10 }} 
        />
      </Card>

      {/* --- New Device Modal (As per Image) --- */}
      <Modal
        title="添加采集设备"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={720}
        okText="确定"
        cancelText="取消"
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
                <Input placeholder="请输入设备名称" showCount maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enName" label={<span>英文名称&nbsp;<Tooltip title="仅支持英文、数字、下划线"><InfoCircleOutlined style={{ color: '#bfbfbf' }} /></Tooltip></span>}>
                <Input placeholder="请输入英文名称" showCount maxLength={50} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="deviceNum" label="设备编号" rules={[{ required: true, message: '请输入设备编号' }]}>
                <Input placeholder="请输入设备编号" showCount maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceType" label="设备类型" rules={[{ required: true, message: '请选择设备类型' }]}>
                <Select placeholder="请选择设备类型" options={deviceTypes} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="URDF" name="urdf">
                <Upload listType="picture-card" maxCount={1} showUploadList={false} accept=".urdf,.xml">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                    <PlusOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="设备图片" name="image">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Upload listType="picture-card" maxCount={5} showUploadList={false}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                      <PlusOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                    </div>
                  </Upload>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 8 }}>
                    可上传最多5张单个不超过2MB且格式为jpg/jpeg/png/gif的图片
                  </div>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="设备详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={720}>
        {selectedDevice && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="设备名称">{selectedDevice.name}</Descriptions.Item>
              <Descriptions.Item label="英文名称">{selectedDevice.enName || '—'}</Descriptions.Item>
              <Descriptions.Item label="设备编号">{selectedDevice.deviceNum}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{deviceTypes.find(t => t.value === selectedDevice.deviceType)?.label || selectedDevice.deviceType || 'galbot_2.2_RGB'}</Descriptions.Item>
              <Descriptions.Item label="URDF文件" span={2}>{selectedDevice.urdf ? <a>{selectedDevice.urdf}</a> : '—'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>设备图片</Text>
              {selectedDevice.image ? (
                <img src={selectedDevice.image} alt="设备图片" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }} />
              ) : (
                <div style={{ width: 120, height: 120, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>暂无图片</Text>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </MainLayout>
  );
}
