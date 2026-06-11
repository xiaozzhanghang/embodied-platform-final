'use client';

import React, { useState } from 'react';
import {
  Table, Button, Input, Space, Tabs, Tag, Typography,
  Breadcrumb, Tooltip, App, Form, Row, Col, Select, Modal,
  Card, Collapse, Divider, Radio, Popconfirm, Alert
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
  RobotOutlined,
  ApiOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Title, Text, Link } = Typography;
const { Panel } = Collapse;

// ─── Mock Data & Constants ───────────────────────────────────────────────────

// Sourced from config/page.js component category
const componentCategories = [
  { value: 'RobotArm', label: '机械臂' },
  { value: 'Chassis', label: '底盘履带' },
  { value: 'LiftTorso', label: '升降躯干' },
  { value: 'Gripper', label: '二指夹爪' },
  { value: 'DexterousHand', label: '多指灵巧手' },
  { value: 'Camera', label: '相机' },
  { value: 'ControlUnit', label: '控制单元(XCU)' },
  { value: 'ComputeUnit', label: '算力单元(HPU)' },
];

const initialPartData = [
  {
    key: '1',
    name: '灵巧手_右',
    enName: 'LingQiaoShou_Right',
    category: 'DexterousHand',
    version: 'G1.0',
    urdf: 'hand_r.urdf',
    topics: [
      { label: '关节状态', enName: 'joint_states', path: '/hand_r/joint_states', tag: 'hand_j', note: '-' },
      { label: '触觉', enName: 'tactile', path: '/hand_r/tactile', tag: 'hand_t', note: '-' }
    ],
    regTime: '2025-12-20',
    status: 'active',
  },
  {
    key: '2',
    name: '夹爪_右',
    enName: 'JiaZhao_Right',
    category: 'Gripper',
    version: 'C2.1',
    urdf: 'gripper_r.urdf',
    topics: [
      { label: '状态', enName: 'status', path: '/gripper_r/status', tag: 'grip_s', note: '-' }
    ],
    regTime: '2025-12-20',
    status: 'active',
  },
  // ─── Galbot 1.16 XCU/HPU 部件 ────────────────────────────────────────
  {
    key: 'xcu-1',
    name: 'XCU 底层控制箱',
    enName: 'XCU_Controller_v116',
    category: 'ControlUnit',
    version: 'v1.16.0.2',
    urdf: '',
    ip: '192.168.1.66',
    sshUser: 'root',
    sshPass: '12345678',
    firmwareVersion: 'Galbot-OS v1.16.0.2',
    topics: [
      { label: '固件状态', enName: 'firmware_status', path: '/xcu/firmware_status', tag: 'xcu_fw', note: 'Galbot-OS 固件心跳' },
      { label: '底座关节', enName: 'base_joint_states', path: '/xcu/base_joint_states', tag: 'xcu_joint', note: 'IAP 底座关节反馈' }
    ],
    regTime: '2026-05-29',
    status: 'active',
  },
  {
    key: 'hpu-1',
    name: 'HPU Orin 算力单元',
    enName: 'HPU_Orin_v116',
    category: 'ComputeUnit',
    version: 'v1.16.0.2',
    urdf: '',
    ip: '192.168.1.88',
    sshUser: 'galbot',
    sshPass: 'gb@2023',
    firmwareVersion: 'Orin-JetPack 5.1.2 + VLA-Capsule',
    topics: [
      { label: 'VLA推理', enName: 'vla_inference', path: '/hpu/vla_inference', tag: 'hpu_vla', note: 'VLA 大模型推理输出' },
      { label: 'GPU状态', enName: 'gpu_status', path: '/hpu/gpu_status', tag: 'hpu_gpu', note: 'Orin GPU 利用率与温度' },
      { label: '网桥通讯', enName: 'bridge_comm', path: '/hpu/bridge_comm', tag: 'hpu_brg', note: 'galbot_upper_bridge 进程状态' }
    ],
    regTime: '2026-05-29',
    status: 'active',
  },
  {
    key: 'arm-g2',
    name: '双臂机械臂_G2',
    enName: 'DualArm_G2_v116',
    category: 'RobotArm',
    version: 'G2.2',
    urdf: 'galbot_g2_dual_arm.urdf',
    topics: [
      { label: '关节状态', enName: 'joint_states', path: '/arm_g2/joint_states', tag: 'arm_j', note: '双臂14轴关节角度与速度' },
      { label: '力矩反馈', enName: 'torque_feedback', path: '/arm_g2/torque_feedback', tag: 'arm_t', note: '关节电流力矩' }
    ],
    regTime: '2026-05-29',
    status: 'active',
  },
  {
    key: 'hand-g116',
    name: '灵巧手_G1.16',
    enName: 'DexHand_G116',
    category: 'DexterousHand',
    version: 'G1.16',
    urdf: 'galbot_dex_hand_g116.urdf',
    topics: [
      { label: '关节状态', enName: 'hand_joint_states', path: '/hand_g116/joint_states', tag: 'hand_j', note: '灵巧手多指关节' },
      { label: '触觉传感', enName: 'tactile_sensing', path: '/hand_g116/tactile', tag: 'hand_tac', note: '指尖触觉阵列' }
    ],
    regTime: '2026-05-29',
    status: 'active',
  },
  {
    key: 'cam-head-g2',
    name: '头部RGB相机_G2',
    enName: 'HeadCam_RGB_G2',
    category: 'Camera',
    version: 'G2.2',
    urdf: '',
    topics: [
      { label: '图像流', enName: 'image_raw', path: '/head_cam/image_raw', tag: 'cam_img', note: '1080p RGB 图像流 30fps' }
    ],
    regTime: '2026-05-29',
    status: 'active',
  },
];

const initialRobotData = [
  {
    key: '1',
    name: 'galbot_2.2_RGB',
    enName: 'galbot_2.2',
    version: 'V2.2',
    linkedParts: ['1', '2'],
    regTime: '2025-12-20',
    status: 'active',
  },
  {
    key: 'galbot-116',
    name: 'galbot_1.16_G2',
    enName: 'galbot_1.16_g2',
    version: 'V1.16',
    linkedParts: ['xcu-1', 'hpu-1', 'arm-g2', 'hand-g116', 'cam-head-g2'],
    regTime: '2026-05-29',
    status: 'active',
  },
];

// ─── Components ─────────────────────────────────────────────────────────────

function DeviceTable({ data, type, onEdit, partData }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [selectedKeys, setSelectedKeys] = useState([]);

  const isRobot = type === 'robot';
  const labelName = isRobot ? '设备类型名称' : '部件类型名称';

  const columns = [
    {
      title: labelName,
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (t, r) => (
        <Space direction="vertical" size={0}>
          <Space>
            {isRobot ? <RobotOutlined style={{ color: '#1890ff' }} /> : <ApiOutlined style={{ color: '#722ed1' }} />}
            <Text strong style={{ fontSize: 13 }}>{t}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.enName}</Text>
        </Space>
      ),
    },
    { 
        title: isRobot ? '包含部件' : '组件分类', 
        key: 'meta', 
        width: 180,
        render: (_, r) => {
            if (isRobot) {
                return (
                    <Space size={4} wrap>
                        {r.linkedParts?.map(pk => {
                            const p = partData.find(pd => pd.key === pk);
                            return <Tag key={pk} color="blue" style={{ fontSize: 10 }}>{p?.name || pk}</Tag>
                        })}
                    </Space>
                );
            }
            const cat = componentCategories.find(c => c.value === r.category);
            return <Tag color="purple">{cat?.label || r.category}</Tag>
        }
    },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80, render: (v) => <Tag color="blue" plain>{v}</Tag> },
    { 
      title: 'Topic组件', 
      dataIndex: 'topics', 
      key: 'topics', 
      render: (topics) => <Tag color="blue">{topics?.length || 0} 个节点</Tag> 
    },
    {
      title: '操作', fixed: 'right',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => {
        const detailPath = isRobot ? 'detail' : 'part-detail';
        return (
          <Space size="middle">
            <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/device-types/${detailPath}/${record.key}`)}>
              查看详情
            </Button>
            <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/device-types/${detailPath}/${record.key}?edit=true`)}>
              编辑
            </Button>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: 0 }} onClick={() => Modal.confirm({ title: '确定删除吗？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
      <Table
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedKeys,
          onChange: setSelectedKeys,
        }}
        columns={columns}
        dataSource={data}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10 }}
        size="middle"
      />
  );
}

export default function DeviceTypesPage() {
  const { message } = App.useApp();
  const [expand, setExpand] = useState(false);
  const [activeTab, setActiveTab] = useState('robot');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      if (tab === 'part' || tab === 'robot') {
        setActiveTab(tab);
      }
    }
  }, []);

  const [robotData, setRobotData] = useState(initialRobotData);
  const [partData, setPartData] = useState(initialPartData);
  
  // Modals state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);

  const handleAddPart = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ topics: [{ label: '', enName: '', path: '', tag: '', note: '' }] });
    setIsPartModalOpen(true);
  };

  const handleAddRobot = () => {
    setEditingItem(null);
    form.resetFields();
    setIsRobotModalOpen(true);
  };

  const onPartSubmit = (values) => {
    const newPart = {
      key: editingItem ? editingItem.key : String(Date.now()),
      ...values,
      regTime: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    if (editingItem) {
        setPartData(partData.map(p => p.key === editingItem.key ? newPart : p));
    } else {
        setPartData([...partData, newPart]);
    }
    setIsPartModalOpen(false);
    message.success(editingItem ? '修改成功' : '创建成功');
  };

  const onRobotSubmit = (values) => {
    const newRobot = {
      key: editingItem ? editingItem.key : String(Date.now()),
      ...values,
      regTime: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    if (editingItem) {
        setRobotData(robotData.map(r => r.key === editingItem.key ? newRobot : r));
    } else {
        setRobotData([...robotData, newRobot]);
    }
    setIsRobotModalOpen(false);
    message.success(editingItem ? '修改成功' : '创建成功');
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb
          items={[{ title: '首页' }, { title: '设备管理' }, { title: '设备类型' }]}
          style={{ marginBottom: 12 }}
        />
        <Title level={4} style={{ margin: 0 }}>设备类型管理</Title>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: '0 24px 24px' }}>
        <SpecMarker
          id="devicetypes-tab"
          number={1}
          title="设备与部件类型切换"
          rules={[
            "支持在‘设备类型’与‘部件类型’两个视图面板之间来回切换。",
            "切换页签时需清空当前表格选中的行 ID（selectedKeys），并触发对应的类型数据接口重新抓取。"
          ]}
          remark="由于设备模型和零配件（部件）模型字段差异较大，切换页签会影响后续新增弹窗的表单布局。"
          style={{ width: '100%' }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'robot', label: '设备类型' },
              { key: 'part', label: '部件类型' },
            ]}
          />
        </SpecMarker>

        <SpecMarker
          id="devicetypes-query"
          number={2}
          title="条件检索过滤"
          rules={[
            "支持对设备/部件类型的名称做模糊查询，状态进行下拉精确匹配，同时支持按创建人和更新时间过滤。",
            "各个表单项需配置‘一键清空（allowClear）’属性，以便研发调试快速重置检索条件。",
            "重置后表单数据恢复为初始空态，且自动加载无过滤条件的全局数据。"
          ]}
          remark="重置和提交操作建议增加 300ms 触发防抖限制，减缓大批量资产查询的后端并发压力。"
          style={{ width: '100%' }}
        >
          <Card 
            style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
            styles={{ body: { padding: '24px 24px 0' } }}
          >
            <Form layout="horizontal" labelCol={{ flex: '100px' }}>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label={activeTab === 'robot' ? "名称" : "名称"}>
                    <Input 
                      placeholder={activeTab === 'robot' ? "请输入设备类型" : "请输入部件类型"} 
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="状态">
                    <Select placeholder="请选择状态" allowClear options={[{label:'正常', value:'active'}, {label:'禁用', value:'inactive'}]} />
                  </Form.Item>
                </Col>
                {!expand && (
                  <Col span={8} style={{ textAlign: 'right' }}>
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
                    <Col span={8}>
                      <Form.Item label="创建人">
                        <Input placeholder="请输入创建人" allowClear />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="更新时间">
                        <Input placeholder="请选择时间范围" allowClear />
                      </Form.Item>
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
        </SpecMarker>

        <div style={{ 
          background: '#fff', 
          borderRadius: '8px 8px 0 0', 
          border: '1px solid #f0f0f0', 
          padding: '12px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 'none'
        }}>
          <Space size={8}>
            <div style={{ width: 4, height: 16, background: '#1890ff', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 15 }}>设备及部件列表</Text>
          </Space>
          <Space size={12}>
            <SpecMarker
              id="devicetypes-create"
              number={3}
              title="新建设备/部件类型"
              rules={[
                "根据当前 Tab 激活状态，点击按钮分别唤起‘新建设备’或‘新建部件’的大弹窗表单。",
                "新增设备表单：名称、版本、设备类型为必填项。支持从部件库列表中勾选关联多个零部件，并设定对齐主参考点。",
                "新增部件表单：名称、所属分类为必填项。支持动态追加多条 ROS Topic 信息（定义其名称、英文代码、Topic 路径和同步组标识）。"
              ]}
              remark="Topic 标识与路径将作为采集端硬件流过滤、时间戳同步的基础路由映射。"
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={activeTab === 'robot' ? handleAddRobot : handleAddPart}
              >
                {activeTab === 'robot' ? '新建设备' : '新建部件'}
              </Button>
            </SpecMarker>
            <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              共 {(activeTab === 'robot' ? robotData : partData).length} 条记录
            </Text>
          </Space>
        </div>

        <DeviceTable 
            data={activeTab === 'robot' ? robotData : partData} 
            type={activeTab} 
            partData={partData}
            onEdit={(record) => {
                setEditingItem(record);
                form.setFieldsValue(record);
                if (activeTab === 'robot') setIsRobotModalOpen(true);
                else setIsPartModalOpen(true);
            }}
        />
      </div>

      {/* --- Part Type Modal --- */}
      <Modal
        title="添加采集部件"
        open={isPartModalOpen}
        onCancel={() => setIsPartModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={onPartSubmit} style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="name" label="部件名称" rules={[{ required: true }]}>
                <Input placeholder="请输入部件名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enName" label={<Space><span>英文名称</span><Tooltip title="仅支持英文、数字、下划线"><InfoCircleOutlined style={{ color: '#bfbfbf' }} /></Tooltip></Space>}>
                <Input placeholder="请输入英文名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="category" label="部件类型" rules={[{ required: true }]}>
                <Select placeholder="请选择部件类型" options={componentCategories} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="部件品牌">
                <Input placeholder="请输入部件品牌" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
          </Row>

          {/* XCU/HPU 专属字段 —— 当部件类型为控制单元或算力单元时动态显示 */}
          <Form.Item shouldUpdate={(prev, cur) => prev.category !== cur.category} noStyle>
            {({ getFieldValue }) => {
              const cat = getFieldValue('category');
              const isXcuHpu = cat === 'ControlUnit' || cat === 'ComputeUnit';
              if (!isXcuHpu) return null;
              return (
                <>
                  <Alert
                    message={cat === 'ControlUnit' ? 'XCU 控制单元专属配置' : 'HPU 算力单元专属配置'}
                    description={cat === 'ControlUnit' 
                      ? '请填写 XCU 底层控制箱的网络接入信息、SSH 登录凭证和固件版本，用于后续固件刷写与远程部署。'
                      : '请填写 HPU (Nvidia Orin) 上位机的网络接入信息、SSH 登录凭证和算力环境版本，用于 VLA 算法包部署与 Supervisor 服务管理。'}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item name="ip" label="内网 IP 地址" rules={[{ required: true, message: '请输入内网IP' }]}>
                        <Input placeholder={cat === 'ControlUnit' ? '192.168.1.66' : '192.168.1.88'} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="sshUser" label="SSH 账号" rules={[{ required: true }]}>
                        <Input placeholder={cat === 'ControlUnit' ? 'root' : 'galbot'} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="sshPass" label="SSH 密码" rules={[{ required: true }]}>
                        <Input.Password placeholder="请输入密码" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="firmwareVersion" label="固件/算力环境版本">
                        <Input placeholder={cat === 'ControlUnit' ? 'Galbot-OS v1.16.x' : 'Orin-JetPack 5.x + VLA-Capsule'} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sshPort" label="SSH 端口">
                        <Input placeholder="22" defaultValue="22" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              );
            }}
          </Form.Item>
          
          <Form.Item label="Topic组件" style={{ marginBottom: 16 }}>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 4 }}>
              <div style={{ display: 'flex', background: '#fafafa', borderBottom: '1px solid #f0f0f0', padding: '8px 12px', fontWeight: 500 }}>
                <div style={{ width: 40 }}>序号</div>
                <div style={{ flex: 1, padding: '0 8px' }}>Topic名称</div>
                <div style={{ flex: 1, padding: '0 8px' }}>英文名称</div>
                <div style={{ flex: 1, padding: '0 8px' }}>Topic</div>
                <div style={{ flex: 1, padding: '0 8px' }}>标识</div>
                <div style={{ flex: 1, padding: '0 8px' }}>备注</div>
                <div style={{ width: 80, textAlign: 'center' }}>操作</div>
              </div>
              <Form.List name="topics">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div key={key} style={{ display: 'flex', padding: '8px 12px', alignItems: 'center', borderBottom: index === fields.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                        <div style={{ width: 40, textAlign: 'center' }}>{index + 1}</div>
                        <div style={{ flex: 1, padding: '0 4px' }}>
                          <Form.Item {...restField} name={[name, 'label']} noStyle><Input placeholder="请输入Topic名称" size="small" /></Form.Item>
                        </div>
                        <div style={{ flex: 1, padding: '0 4px' }}>
                          <Form.Item {...restField} name={[name, 'enName']} noStyle><Input placeholder="请输入英文名称" size="small" /></Form.Item>
                        </div>
                        <div style={{ flex: 1, padding: '0 4px' }}>
                          <Form.Item {...restField} name={[name, 'path']} noStyle><Input placeholder="请输入Topic" size="small" /></Form.Item>
                        </div>
                        <div style={{ flex: 1, padding: '0 4px' }}>
                          <Form.Item {...restField} name={[name, 'tag']} noStyle><Input placeholder="请输入标识" size="small" /></Form.Item>
                        </div>
                        <div style={{ flex: 1, padding: '0 4px' }}>
                          <Form.Item {...restField} name={[name, 'note']} noStyle><Input placeholder="请输入备注" size="small" /></Form.Item>
                        </div>
                        <div style={{ width: 80, textAlign: 'center' }}>
                          <Space>
                            <Button type="primary" danger icon={<DeleteOutlined />} size="small" shape="circle" onClick={() => remove(name)} />
                            <Button type="primary" icon={<PlusOutlined />} size="small" shape="circle" onClick={() => add()} />
                          </Space>
                        </div>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center' }}>
                        <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>添加 Topic 节点</Button>
                      </div>
                    )}
                  </>
                )}
              </Form.List>
            </div>
          </Form.Item>

          <Form.Item name="description" label="传感器描述">
            <Input.TextArea placeholder="请输入传感器描述" autoSize={{ minRows: 3, maxRows: 6 }} suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 500</Text>} />
          </Form.Item>

          <Form.Item label="URDF">
            <SpecMarker
              id="devicetypes-urdf"
              number={4}
              title="URDF 机器人三维描述文件"
              rules={[
                "设备或部件支持上传规范的机器人物理关节描述文件（URDF）。",
                "限制文件后缀名为 `.urdf`，每个类型限制最大上传1份。",
                "此文件作为前端 WebGL/Three.js 虚拟空间孪生及多臂运动轨迹复现的拓扑结构树基础。"
              ]}
              remark="前端会动态加载并解析 URDF XML 数据，渲染对应的骨骼关节并限制转动角度范围。"
            >
              <Space>
                <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#1677ff' }}>上传URDF文件</Button>
                <Text type="secondary" style={{ fontSize: 12 }}>可上传最多1份urdf格式的文件</Text>
              </Space>
            </SpecMarker>
          </Form.Item>

          <Form.Item label="设备图片">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 100, height: 100, border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa' }}>
                <PlusOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>可上传最多5张单个不超过2MB且格式为jpg/jpeg/png/gif的图片</Text>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Robot Type Modal --- */}
      <Modal
        title="添加采集设备"
        open={isRobotModalOpen}
        onCancel={() => setIsRobotModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={onRobotSubmit} style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
                <Input placeholder="请输入设备名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enName" label={<Space><span>英文名称</span><Tooltip title="仅支持英文、数字、下划线"><InfoCircleOutlined style={{ color: '#bfbfbf' }} /></Tooltip></Space>}>
                <Input placeholder="请输入英文名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="version" label="设备版本" rules={[{ required: true }]}>
                <Input placeholder="请输入设备版本" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceType" label="设备类型" rules={[{ required: true }]}>
                <Input placeholder="请输入设备类型" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="linkedParts" label="部件">
            <Select 
                mode="multiple" 
                placeholder="请选择部件" 
                maxTagCount="responsive"
                options={partData.map(p => ({ label: p.name, value: p.key }))}
            />
          </Form.Item>

          <Form.Item label="已选部件">
            <Form.Item shouldUpdate={(prevValues, curValues) => prevValues.linkedParts !== curValues.linkedParts} noStyle>
                {({ getFieldValue, setFieldsValue }) => {
                    const selectedIds = getFieldValue('linkedParts') || [];
                    const dataSource = selectedIds.map(id => partData.find(p => p.key === id)).filter(Boolean);
                    
                    return (
                        <Table 
                            size="small"
                            pagination={false}
                            dataSource={dataSource}
                            rowKey="key"
                            bordered
                            columns={[
                                { 
                                    title: '对齐点', 
                                    key: 'alignment', 
                                    width: 80, 
                                    align: 'center',
                                    render: (_, record) => (
                                        <Form.Item name="alignmentPoint" noStyle>
                                            <Radio.Group onChange={(e) => setFieldsValue({ alignmentPoint: record.key })}>
                                                <Radio value={record.key} />
                                            </Radio.Group>
                                        </Form.Item>
                                    )
                                },
                                { title: '部件名称', dataIndex: 'name', key: 'name' },
                                { 
                                    title: '部件类型', 
                                    dataIndex: 'category', 
                                    key: 'category',
                                    render: (cat) => {
                                        const found = componentCategories.find(c => c.value === cat);
                                        return found ? found.label : cat;
                                    }
                                },
                                { 
                                    title: '操作', fixed: 'right',
                                    key: 'action', 
                                    width: 80, 
                                    align: 'center',
                                    render: (_, record) => (
                                        <Button 
                                            type="primary" 
                                            danger 
                                            icon={<DeleteOutlined />} 
                                            size="small" 
                                            shape="circle" 
                                            onClick={() => {
                                                const newSelected = selectedIds.filter(id => id !== record.key);
                                                setFieldsValue({ linkedParts: newSelected });
                                            }}
                                        />
                                    )
                                }
                            ]}
                        />
                    );
                }}
            </Form.Item>
          </Form.Item>

          {/* 双端节点提示 */}
          <Form.Item shouldUpdate={(prev, cur) => prev.linkedParts !== cur.linkedParts} noStyle>
            {({ getFieldValue }) => {
              const selected = getFieldValue('linkedParts') || [];
              const hasXcu = selected.some(id => {
                const p = partData.find(pd => pd.key === id);
                return p?.category === 'ControlUnit';
              });
              const hasHpu = selected.some(id => {
                const p = partData.find(pd => pd.key === id);
                return p?.category === 'ComputeUnit';
              });
              if (!hasXcu || !hasHpu) return null;
              return (
                <Alert
                  message="检测到双端节点架构 (XCU + HPU)"
                  description="该设备类型包含 XCU 控制单元和 HPU 算力单元，创建设备实例后可在详情页使用「XCU/HPU 部署与更新」功能进行固件刷写、VLA 算法部署、Supervisor 进程管理等操作。"
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              );
            }}
          </Form.Item>

          <Form.Item name="description" label="传感器描述" rules={[{ required: true }]}>
            <Input.TextArea placeholder="请输入传感器描述" autoSize={{ minRows: 3, maxRows: 6 }} suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 500</Text>} />
          </Form.Item>

          <Form.Item label="URDF">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#1677ff' }}>上传URDF文件</Button>
              <Text type="secondary" style={{ fontSize: 12 }}>可上传最多1份urdf格式的文件</Text>
            </Space>
          </Form.Item>

          <Form.Item label="设备图片">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 100, height: 100, border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa' }}>
                <PlusOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>可上传最多5张单个不超过2MB且格式为jpg/jpeg/png/gif的图片</Text>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}

