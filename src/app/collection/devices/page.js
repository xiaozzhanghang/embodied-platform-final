'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Input, Card, Typography, 
  Form, Popconfirm, Tooltip, Breadcrumb, Badge, Select, 
  Modal, Collapse, Row, Col, Divider, App, Radio, Upload, Descriptions,
  Alert, Steps
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, 
  ColumnHeightOutlined, SettingOutlined, EyeOutlined, 
  EditOutlined, StopOutlined, DownOutlined, UpOutlined, RobotOutlined, 
  ApiOutlined, InfoCircleOutlined, DeleteOutlined, InboxOutlined 
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

// ─── Mock Data ──────────────────────────────────────────────────────────────

const deviceTypes = [
  { value: 'galbot_rgb', label: 'galbot_2.2_RGB' },
  { value: 'galbot_depth', label: 'galbot_2.2_深度' },
  { value: 'galbot_ir', label: 'galbot_2.2_红外' },
  { value: 'galbot_1.16_G2', label: 'galbot_1.16_G2 (XCU/HPU)' },
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
    'galbot_std': ['2', '3', '4', '5'],
    'franka_std': ['5'],
    'ego_dev': ['1'],
    'galbot_1.16_G2': ['xcu-1', 'hpu-1', 'arm-g2', 'hand-g116', 'cam-head-g2'],
};

const initialDeviceData = [
  ...Array.from({ length: 5 }).map((_, i) => ({
    key: String(i),
    name: `R001GB-Node-${100 + i}`,
    deviceType: i % 2 === 0 ? 'galbot_std' : 'franka_std',
    deviceNum: `DEV-B-10${i}`,
    status: i % 3 === 0 ? '在线' : '离线',
    regTime: '2026-02-25 16:13:55',
    activeTime: '2026-02-25 17:00:01'
  })),
  {
    key: 'galbot-116-demo',
    name: 'Galbot-G2-Node-105',
    deviceType: 'galbot_1.16_G2',
    deviceNum: 'DEV-2026-001',
    ip: '192.168.1.105',
    wifiSsid: 'miracle-office-5g',
    status: '维护中',
    regTime: '2026-05-29 14:00:00',
    activeTime: '2026-05-29 14:30:00'
  }
];

export default function DeviceListPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceData, setDeviceData] = useState(initialDeviceData);
  const [selectedDeviceType, setSelectedDeviceType] = useState(null);
  const [form] = Form.useForm();

  const deviceColumns = [
    { title: '设备名称', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
    { 
      title: (
        <SpecMarker
          id="devices-status"
          number={1}
          title="设备运行状态监控"
          rules={[
            "在线 (Green): 设备定期上报心跳包（心跳间隔 <= 10s）。",
            "离线 (Red): 连续 30s 未收到设备心跳上报，或物理通信断联。",
            "维护中 (Yellow): 设备正处于自检异常、固件 OTA 升级或人工标定维护阶段。"
          ]}
          remark="运行状态心跳判定服务需由后台定时轮询或心跳队列管理器（如 Redis TTL / WebSocket 监听）实时驱动。"
        >
          运行状态
        </SpecMarker>
      ),
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
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/devices/detail/${record.key}`)}>查看详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/devices/detail/${record.key}?edit=true`)}>编辑</Button>
          <Popconfirm title="确定禁用此设备吗？">
            <Button type="link" danger size="small" icon={<StopOutlined />} style={{ padding: 0 }}>禁用</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  const handleCreate = (values) => {
    const newKey = String(Date.now());
    const newDevice = {
      key: newKey,
      ...values,
      deviceNum: values.deviceNum || 'DEV-NEW',
      status: values.deviceType === 'galbot_1.16_G2' ? '维护中' : '在线',
      regTime: new Date().toLocaleString('zh-CN'),
      activeTime: new Date().toLocaleString('zh-CN')
    };
    setDeviceData([newDevice, ...deviceData]);
    setIsModalOpen(false);
    setSelectedDeviceType(null);

    if (values.deviceType === 'galbot_1.16_G2') {
      Modal.confirm({
        title: '🎉 设备接入成功！',
        content: (
          <div>
            <p>设备 <strong>{values.name}</strong> 已成功创建，当前状态为「维护中」。</p>
            <p>该设备为 <strong>Galbot 1.16 双端架构 (XCU/HPU)</strong>，是否立即前往设备详情页执行固件部署？</p>
            <Steps
              size="small"
              direction="vertical"
              current={0}
              style={{ marginTop: 12 }}
              items={[
                { title: 'XCU 固件刷写', description: '刷写 Galbot-OS v1.16 底层固件' },
                { title: 'VLA 算法部署', description: '双端解压 3.7G 算法包' },
                { title: 'Supervisor 服务配置', description: '安装守护进程与网桥' },
              ]}
            />
          </div>
        ),
        okText: '立即前往部署',
        cancelText: '稍后再说',
        width: 480,
        onOk: () => {
          router.push(`/collection/devices/detail/${newKey}`);
        },
      });
    } else {
      message.success('设备接入成功');
    }
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

      <SpecMarker
        id="devices-query"
        number={2}
        title="设备条件联合检索"
        rules={[
          "支持按设备名称（模糊）、设备类型（下拉精确）、设备状态、SN 序列号（精确）以及所处物理区域（模糊）等多维度联合过滤。",
          "所有输入字段都必须配置 allowClear（可清空）选项。",
          "点击‘重置’按钮，重置所有筛选项，触发列表自动加载无状态数据。"
        ]}
        remark="重置操作需把查询参数重新初始化为默认空对象并刷新表格。"
        style={{ width: '100%' }}
      >
        <Card 
          style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
          styles={{ body: { padding: '24px 24px 16px' } }}
        >
          <QueryFilter
              submitter={{
                  submitButtonProps: { icon: <SearchOutlined /> },
                  resetButtonProps: { icon: <ReloadOutlined /> },
              }}
          >
              <ProFormText name="name" label="设备名称" placeholder="请输入设备名称" />
              <ProFormSelect name="type" label="设备类型" placeholder="请选择类型" options={deviceTypes} />
              <ProFormSelect name="status" label="设备状态" placeholder="全部" options={[{label:'在线', value:'online'}, {label:'离线', value:'offline'}]} />
              <ProFormText name="sn" label="SN序列号" placeholder="请输入SN" />
              <ProFormText name="area" label="区域位置" placeholder="请输入区域" />
          </QueryFilter>
        </Card>
      </SpecMarker>

      <Card styles={{ body: { padding: '24px' } }} style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space size={8}>
            <div style={{ width: 4, height: 16, background: '#1890ff', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 16 }}>设备实例列表</Text>
          </Space>
          <Space size={12}>
            <SpecMarker
              id="devices-create"
              number={3}
              title="新建设备接入校验"
              rules={[
                "设备接入必填表单项：设备名称、设备编号（SN）、设备类型大类。",
                "英文名称及设备编号需进行全局排重，不得与系统中已有设备冲突。",
                "支持上传该型号设备标准的 URDF 模型描述文件，限制后缀为 `.urdf` 或 `.xml`。"
              ]}
              remark="URDF 物理拓扑骨骼描述文件是平台实现 3D 关节姿态复现及动力学反解的前置条件。"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setIsModalOpen(true); }}>新建设备</Button>
            </SpecMarker>
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
                <Select 
                  placeholder="请选择设备类型" 
                  options={deviceTypes} 
                  onChange={(val) => setSelectedDeviceType(val)}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Galbot 1.16 XCU/HPU 架构提示与额外字段 */}
          {selectedDeviceType === 'galbot_1.16_G2' && (
            <>
              <Alert
                message="Galbot 1.16 双端架构 (XCU + HPU)"
                description={
                  <div>
                    <p style={{ margin: '4px 0' }}>该设备类型包含 XCU 底层控制箱 (192.168.1.66) 和 HPU Orin 算力单元 (192.168.1.88)，请确保已在「设备类型管理」中完成对应的部件类型与设备类型配置。</p>
                    <p style={{ margin: '4px 0', color: '#1677ff' }}>创建成功后可在设备详情页执行固件部署、VLA 算法包分发、Supervisor 服务管理等操作。</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="ip" label="内网 IP 地址">
                    <Input placeholder="192.168.1.105" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="wifiSsid" label="关联 WiFi SSID">
                    <Input placeholder="miracle-office-5g" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

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
    </MainLayout>
  );
}
