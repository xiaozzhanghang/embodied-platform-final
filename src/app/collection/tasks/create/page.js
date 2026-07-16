'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, Table, Radio, Switch, App, Breadcrumb, Steps, 
  InputNumber, Upload, Checkbox, Avatar, Tag, Divider, Alert, Modal
} from 'antd';
import { 
  ArrowLeftOutlined, SaveOutlined, PlusOutlined, 
  DeleteOutlined, UploadOutlined, DragOutlined,
  QuestionCircleOutlined, LayoutOutlined, FileTextOutlined,
  CheckOutlined, RightOutlined, InfoCircleOutlined, EyeOutlined,
  ShoppingOutlined, SkinOutlined, ToolOutlined, ExperimentOutlined,
  RestOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Collectors list
const collectorsList = [
  { value: '张三', label: '张三 (采集员-001)' },
  { value: '李四', label: '李四 (采集员-002)' },
  { value: '王五', label: '王五 (采集员-003)' },
  { value: '赵六', label: '赵六 (采集员-004)' },
];

// Device instances
const allDeviceInstances = [
  { value: 'R002GB-RGB-101', label: 'R002GB-RGB-101 (Galbot RGB - 在线)', parent: 'galbot_2.2_RGB' },
  { value: 'R002GB-RGB-102', label: 'R002GB-RGB-102 (Galbot RGB - 离线)', parent: 'galbot_2.2_RGB' },
  { value: 'R002GB-RGBD-101', label: 'R002GB-RGBD-101 (Galbot RGBD - 在线)', parent: 'galbot_2.2_RGBD' },
  { value: 'DEV-FR-301', label: 'FRANKA-FR3-1号 (Franka Std - 在线)', parent: 'franka_std' },
  { value: 'DEV-UR-501', label: 'UR5e-1号 (UR5e - 在线)', parent: 'ur5e_std' },
  { value: 'DEV-GB116-105', label: 'Galbot-G2-Node-105 (Galbot 1.16 XCU/HPU - 在线)', parent: 'galbot_1.16_G2' },
  { value: 'DEV-GB116-106', label: 'Galbot-G2-Node-106 (Galbot 1.16 XCU/HPU - 离线)', parent: 'galbot_1.16_G2' },
  { value: 'DEV-LUMOS-001', label: 'Lumos-FastUMI-Go-001 (Lumos背包 - 在线)', parent: 'lumos_fastumi' },
];

// Inner component to access search params safely in Suspense
function CreateTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [creationStage, setCreationStage] = useState('selection'); // 'selection', 'config'
  const [currentStep, setCurrentStep] = useState(0); // 0: 基础参数, 1: 动作预设
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Linkage States
  const [availableParts, setAvailableParts] = useState([]);
  const [selectedPartKeys, setSelectedPartKeys] = useState([]);
  const [filteredDeviceInstances, setFilteredDeviceInstances] = useState(allDeviceInstances);

  const [optionsMap, setOptionsMap] = useState({
    p1: [
      { value: 'InternalCommercial', label: 'InternalCommercial(内部-商业)' },
      { value: 'ExternalXupaosi', label: 'ExternalXupaosi(外部-芯片思)' },
      { value: 'InternalIndustrial', label: 'InternalIndustrial(内部-工业需求)' },
      { value: 'Backflow', label: 'Backflow(回传问题)' },
      { value: 'SimulatedCollection', label: 'SimulatedCollection(模拟采集)' },
    ],
    p2: [
      { value: 'GroceryVLA', label: 'GroceryVLA', parent: 'InternalCommercial' },
      { value: 'FoundationModel', label: 'FoundationModel', parent: 'InternalCommercial' },
      { value: 'TakeOver', label: 'TakeOver', parent: 'InternalCommercial' },
      { value: 'Zhiyuan', label: 'Zhiyuan(智源)', parent: 'InternalCommercial' },
      { value: 'Nvidia', label: 'Nvidia(英伟达)', parent: 'InternalCommercial' },
      { value: 'SubTag_X1', label: 'SubTag_X1', parent: 'ExternalXupaosi' },
      { value: 'SubTag_X2', label: 'SubTag_X2', parent: 'ExternalXupaosi' },
      { value: 'Industrial_A1', label: 'Industrial_A1', parent: 'InternalIndustrial' },
    ],
    sop: [
      { value: 'sop_desk', label: '桌面整理采集规范 V1.0' },
      { value: 'sop_cable', label: '线缆管理采集规范 V2.0' },
      { value: 'sop_kitchen', label: '厨房操作采集规范 V1.2' },
    ],
    usage: [
      { value: 'Training', label: 'Training(模型训练)' },
      { value: 'Valid', label: 'Valid(效果评测)' },
      { value: 'Demo', label: 'Demo(展会演示)' },
    ],
    mode: [
      { value: 'Real', label: 'Real(实机物理世界采集)' },
      { value: 'Sim', label: 'Sim(虚拟仿真引擎采集)' },
    ],
    sceneCat: [
      { value: 'Kitchen', label: 'Kitchen(厨房)' },
      { value: 'Supermarket', label: 'Supermarket(商超)' },
      { value: 'Industry', label: 'Industry(工业)' },
      { value: 'pharmacy', label: 'pharmacy(药房)' },
      { value: 'Scientific', label: 'Scientific(科研)' },
      { value: 'Hotel', label: 'Hotel(酒店)' },
      { value: 'Warehousing', label: 'Warehousing(仓储)' },
    ],
    subScene: [
      { value: 'sub_cuisine', label: '餐具整理', parent: 'Kitchen' },
      { value: 'sub_cook', label: '烹饪操作', parent: 'Kitchen' },
      { value: 'sub_food', label: '食材处理', parent: 'Kitchen' },
      { value: 'sub_clean', label: '清洁收纳', parent: 'Kitchen' },
      { value: 'sub_plate', label: '取餐摆盘', parent: 'Kitchen' },
      { value: 'sub_pot', label: '锅具操作', parent: 'Kitchen' },
      { value: 'sub_shelf', label: '货架拣选', parent: 'Supermarket' },
      { value: 'sub_scan', label: '商品扫码', parent: 'Supermarket' },
      { value: 'sub_cart', label: '购物车装载', parent: 'Supermarket' },
      { value: 'sub_price', label: '价签更换', parent: 'Supermarket' },
      { value: 'sub_assembly', label: '电子组装', parent: 'Industry' },
      { value: 'sub_auto', label: '汽车零部件', parent: 'Industry' },
      { value: 'sub_metal', label: '金属加工', parent: 'Industry' },
      { value: 'sub_weld', label: '焊接', parent: 'Industry' },
      { value: 'sub_sort', label: '分拣', parent: 'Industry' },
      { value: 'sub_pack', label: '包装', parent: 'Industry' },
      { value: 'sub_carry', label: '搬运', parent: 'Industry' },
      { value: 'sub_stack', label: '码垛', parent: 'Industry' },
    ],
    deviceType: [
      { value: 'galbot_2.2_RGB', label: 'galbot_2.2_RGB' },
      { value: 'galbot_2.2_RGBD', label: 'galbot_2.2_RGBD(深度)' },
      { value: 'galbot_1.16_G2', label: 'galbot_1.16_G2 (XCU/HPU双端)' },
      { value: 'lumos_fastumi', label: 'lumos_fastumi (离线背包)' },
      { value: 'franka_std', label: 'franka_std (FR3标准型)' },
      { value: 'ur5e_std', label: 'ur5e_std (UR5e协作臂)' },
    ],
    teleType: [
      { value: 'VRController', label: 'VRController(VR手柄设备)' },
      { value: 'MotionCapture', label: 'MotionCapture(六轴动捕手套)' },
      { value: 'KeyboardMouse', label: 'KeyboardMouse(键盘鼠标)' },
      { value: 'DualHandControl', label: 'DualHandControl(双手操控)' },
      { value: 'Master-slaveArm', label: 'Master-slaveArm(主从臂)' },
    ]
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState(null); 
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [modalP1Id, setModalP1Id] = useState(null);

  const [steps, setSteps] = useState([
    { id: 1, effector: '右手 (Right Arm)', skill: '识别', object: '目标物品', target: '确认位置' }
  ]);

  const addStep = () => {
    setSteps([...steps, { id: Date.now(), effector: '右手 (Right Arm)', skill: '', object: '', target: '' }]);
  };

  const updateStep = (id, field, value) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStep = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const fieldLabels = {
    p1: '一级项目',
    p2: '二级项目',
    sop: '任务书',
    usage: '任务用途',
    mode: '采集模式',
    sceneCat: '场景分类',
    subScene: '子场景分类',
    deviceType: '设备类型',
    teleType: '遥操主控方式'
  };

  const handleCreateOption = () => {
      if (!newOptionLabel.trim() || !currentField) return;
      if (currentField === 'p2' && !modalP1Id) {
          message.warning('请先选择所属一级项目');
          return;
      }

      const newId = `OPT_${Date.now().toString().slice(-4)}`;
      
      setOptionsMap(prev => ({
        ...prev,
        [currentField]: [...(prev[currentField] || []), { value: newId, label: newOptionLabel }]
      }));
      
      if (currentField === 'p2') {
          form.setFieldsValue({ p1: modalP1Id, p2: newId });
      } else {
          form.setFieldsValue({ [currentField]: newId });
      }
      
      if (currentField === 'deviceType') {
         handleDeviceTypeChange(newId);
      }
      
      setModalVisible(false);
      setNewOptionLabel('');
      setModalP1Id(null);
  };

  const renderDropdown = (menu, fieldKey) => (
    <>
      {menu}
      <Divider style={{ margin: '8px 0' }} />
      <Button 
        type="text" 
        block 
        style={{ textAlign: 'left', display: 'flex', alignItems: 'center', color: '#1677ff' }} 
        onClick={() => { 
            setCurrentField(fieldKey); 
            if (fieldKey === 'p2') setModalP1Id(form.getFieldValue('p1'));
            setModalVisible(true); 
        }}
      >
        <PlusOutlined style={{ marginRight: 8 }} /> 创建数据
      </Button>
    </>
  );

  const mode = searchParams.get('mode');
  const taskId = searchParams.get('taskId');

  const mockTemplates = [
    {
      id: 'desk',
      name: '桌面整理',
      desc: '书籍、收纳盒、垃圾清理等桌面物品整理任务',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      tele: 'Master-slaveArm',
      mode: 'WholeBody',
      icon: <ShoppingOutlined />,
      bgColor: '#e6f4ff',
      iconColor: '#1677ff'
    },
    {
      id: 'clothing',
      name: '衣物折叠',
      desc: '叠牛仔裤等柔性物体折叠操作，步骤多、精度高',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      tele: 'VR(VR)',
      mode: 'WholeBody',
      icon: <SkinOutlined />,
      bgColor: '#f0f5ff',
      iconColor: '#2f54eb'
    },
    {
      id: 'galbot116_lab',
      name: '精细整理作业',
      desc: '使用Galbot 1.16双端控制台进行精细桌面/实验室整理任务数据采集',
      type: '双端数采',
      device: 'galbot_1.16_G2',
      tele: 'DualHandControl',
      mode: 'DualArm',
      icon: <ExperimentOutlined />,
      bgColor: '#f6ffed',
      iconColor: '#52c41a'
    },
    {
      id: 'lumos_tabletop',
      name: '离线台面采集',
      desc: '使用Lumos FastUMI Go背包终端进行离线台面数据采集',
      type: '离线数采',
      device: 'lumos_fastumi',
      tele: 'DualHandControl',
      mode: 'DualHand',
      icon: <RestOutlined />,
      bgColor: '#fff7e6',
      iconColor: '#fa8c16'
    }
  ];

  // Logic for Copy/Edit mode initialization
  useEffect(() => {
    if (mode === 'copy' || mode === 'edit') {
      setCreationStage('config');
      const prefix = mode === 'copy' ? '副本_' : '';
      
      // Simulate fetching existing task data
      const mockExistingData = {
        name: `${prefix}桌面操作任务_INS_01`,
        p1: 'InternalCommercial',
        p2: 'GroceryVLA',
        usage: 'Training',
        mode: 'Real',
        sceneCat: 'Kitchen',
        subScene: 'sub_cuisine',
        deviceType: 'galbot_2.2_RGB',
        deviceInstance: 'R002GB-RGB-101',
        collector: '张三',
        teleType: 'Master-slaveArm',
        count: 500,
        initState: '物体随机摆放在桌面中央，机器人初始姿态复位。',
      };

      setSelectedTemplate({ name: '历史任务引用', id: 'ref' });
      form.setFieldsValue(mockExistingData);
      
      const matchingInstances = allDeviceInstances.filter(inst => inst.parent === 'galbot_2.2_RGB');
      setFilteredDeviceInstances(matchingInstances.length > 0 ? matchingInstances : allDeviceInstances);
      
      handleDeviceTypeChange('galbot_2.2_RGB', false);
    }
  }, [mode, taskId]);

  const handleDeviceTypeChange = (value, shouldResetInstance = true) => {
    // Device-type-specific part configurations
    const partsMap = {
      'galbot_1.16_G2': [
        { key: 'xcu', name: 'XCU 底座控制卡', type: 'ControlUnit-XCU (192.168.1.66)' },
        { key: 'hpu', name: 'HPU Orin 算力板', type: 'ComputeUnit-HPU (192.168.1.88)' },
        { key: 'cam_hl', name: '头部左相机 (GMSL2)', type: 'Camera-HEAD_L (1080p)' },
        { key: 'cam_hr', name: '头部右相机 (GMSL2)', type: 'Camera-HEAD_R (1080p)' },
        { key: 'cam_wl', name: '腕部左相机 (GMSL2)', type: 'Camera-HAND_L (720p)' },
        { key: 'cam_wr', name: '腕部右相机 (GMSL2)', type: 'Camera-HAND_R (720p)' },
        { key: 'arm_l', name: '左臂 (7-DOF)', type: 'Actuator-LeftArm' },
        { key: 'arm_r', name: '右臂 (7-DOF)', type: 'Actuator-RightArm' },
      ],
      'lumos_fastumi': [
        { key: 'backpack', name: '数采背包主机', type: 'ComputeUnit-Backpack (192.168.54.110)' },
        { key: 'cam_wl', name: '腕部左相机', type: 'Camera-Wrist_L (RGB)' },
        { key: 'cam_wr', name: '腕部右相机', type: 'Camera-Wrist_R (RGB)' },
        { key: 'cam_head', name: '头部相机', type: 'Camera-Head_Eye (RGB)' },
        { key: 'gripper_l', name: '左侧夹爪', type: 'Gripper-Left (USB)' },
        { key: 'gripper_r', name: '右侧夹爪', type: 'Gripper-Right (USB)' },
      ],
      'franka_std': [
        { key: 'ctrl', name: 'Franka 控制器', type: 'Controller-FCI (172.16.0.2)' },
        { key: 'cam_front', name: '前置相机', type: 'Camera-Front (RGB)' },
        { key: 'cam_wrist', name: '腕部相机', type: 'Camera-Wrist (RGB)' },
        { key: 'cam_side', name: '侧面相机', type: 'Camera-Side (RGB)' },
      ],
      'ur5e_std': [
        { key: 'ctrl', name: 'UR 控制器', type: 'Controller-URScript (192.168.1.10)' },
        { key: 'cam_front', name: '前置相机', type: 'Camera-Front (RGB)' },
        { key: 'cam_wrist', name: '腕部相机', type: 'Camera-Wrist (RGB)' },
      ],
    };

    const defaultParts = [
      { key: 'p1', name: '头部左相机', type: 'Body-HeadLeftCamera' },
      { key: 'p2', name: '头部右相机', type: 'Body-HeadRightCamera' },
      { key: 'p3', name: '手部左相机_RGB', type: 'Body-HandLeftCamera' },
    ];

    const parts = partsMap[value] || defaultParts;
    setAvailableParts(parts);
    setSelectedPartKeys(parts.map(p => p.key));
    
    const filtered = allDeviceInstances.filter(inst => inst.parent === value);
    setFilteredDeviceInstances(filtered.length > 0 ? filtered : allDeviceInstances);
    if (shouldResetInstance) {
      form.setFieldsValue({ deviceInstance: undefined });
    }
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setCreationStage('config');
    setCurrentStep(0);
    
    const matchingInstances = allDeviceInstances.filter(inst => inst.parent === tpl.device);
    const defaultInstance = matchingInstances.length > 0 ? matchingInstances[0].value : undefined;
    
    form.setFieldsValue({
      name: `${tpl.name}_${Math.floor(1000 + Math.random() * 9000)}`,
      p1: 'InternalCommercial',
      usage: 'Training',
      mode: 'Real',
      sceneCat: 'Kitchen',
      deviceType: tpl.device,
      deviceInstance: defaultInstance,
      collector: '张三',
      teleType: tpl.tele.includes('VR') ? 'VRController' : 'Master-slaveArm'
    });
    
    setFilteredDeviceInstances(matchingInstances.length > 0 ? matchingInstances : allDeviceInstances);
    handleDeviceTypeChange(tpl.device, false);
  };

  const renderSelection = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
        <Title level={4} style={{ margin: 0 }}>选择创建方式</Title>
      </div>

      <div style={{ marginBottom: 40 }}>
        <Title level={5} style={{ marginBottom: 20 }}>常用任务模版</Title>
        <Row gutter={[24, 24]}>
          {mockTemplates.map((tpl) => (
            <Col span={8} key={tpl.id}>
              <Card 
                hoverable 
                onClick={() => handleSelectTemplate(tpl)}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                styles={{ body: { padding: '20px' } }}
              >
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <Avatar size={44} icon={tpl.icon} style={{ backgroundColor: tpl.bgColor, color: tpl.iconColor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 15 }}>{tpl.name}</Text>
                      <Tag color="blue" bordered={false} style={{ fontSize: 10 }}>{tpl.type}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', minHeight: 32 }}>{tpl.desc}</Text>
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ background: '#fafafa', padding: '12px', borderRadius: 8 }}>
                  <Row gutter={[0, 8]}>
                    <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>设备：</Text></Col>
                    <Col span={16} style={{ textAlign: 'right' }}><Text style={{ fontSize: 11 }}>{tpl.device}</Text></Col>
                    <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>遥控：</Text></Col>
                    <Col span={16} style={{ textAlign: 'right' }}><Text style={{ fontSize: 11 }}>{tpl.tele}</Text></Col>
                    <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>模式：</Text></Col>
                    <Col span={16} style={{ textAlign: 'right' }}><Text style={{ fontSize: 11 }}>{tpl.mode}</Text></Col>
                  </Row>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <Title level={5} style={{ marginBottom: 20 }}>或自定义创建</Title>
        <Card 
          hoverable 
          onClick={() => handleSelectTemplate({ id: 'blank', name: '空白任务', device: 'galbot_2.2_RGB', tele: 'Master-slaveArm' })}
          style={{ borderRadius: 12, border: '1px dashed #d9d9d9', background: '#fafafa', width: 340 }}
          styles={{ body: { padding: '24px' } }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar size={44} icon={<FileTextOutlined />} style={{ backgroundColor: '#fff', color: '#8c8c8c', border: '1px solid #d9d9d9' }} />
            <div>
              <Title level={5} style={{ margin: '0 0 4px 0' }}>空白表单创建</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>从头自定义全部参数信息</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderConfigFlow = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setCreationStage('selection')} style={{ marginRight: 16 }} />
        <Title level={4} style={{ margin: 0 }}>
          {mode === 'edit' ? '编辑任务：' : mode === 'copy' ? '复制任务：' : '基于模版创建：'}
          {selectedTemplate?.name}
        </Title>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48, padding: '0 100px' }}>
        <Steps current={currentStep} labelPlacement="horizontal" style={{ width: '100%', maxWidth: 800 }}
          items={[{ title: <Text strong style={{ fontSize: 16 }}>基础参数</Text> }, { title: <Text strong style={{ fontSize: 16 }}>动作预设</Text> }]} 
        />
      </div>

      <Form form={form} layout="vertical" onFinish={(values) => {
        if (currentStep === 0) setCurrentStep(1);
        else {
          message.success(mode === 'edit' ? '任务修改成功' : '任务派发成功');
          router.push('/collection/tasks');
        }
      }}>
        {currentStep === 0 ? (
          <>
            <Alert 
              message={mode === 'edit' ? '正在编辑现有任务，修改后将覆盖原始配置。' : mode === 'copy' ? '正在基于已有任务复制，您可以修改副本内容后派发。' : `你正在使用【${selectedTemplate?.name}】模版，部分参数已自动填充`} 
              type={mode === 'edit' ? 'warning' : 'info'} showIcon icon={<InfoCircleOutlined />}
              style={{ marginBottom: 24, borderRadius: 8 }}
            />

            <Card title="基础信息" bordered={false} styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Row gutter={24}>
                <Col span={8}><Form.Item label="一级项目" name="p1" required><Select placeholder="请选择" options={optionsMap.p1} popupRender={m => renderDropdown(m, 'p1')} onChange={() => form.setFieldsValue({ p2: undefined })} /></Form.Item></Col>
                <Col span={8}><Form.Item label="二级项目" name="p2" required><Select placeholder="请先选择一级项目" options={optionsMap.p2.filter(o => !o.parent || o.parent === form.getFieldValue('p1'))} popupRender={m => renderDropdown(m, 'p2')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="任务书" name="sop"><Select placeholder="请选择" options={optionsMap.sop} popupRender={m => renderDropdown(m, 'sop')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="任务名称" name="name" required><Input /></Form.Item></Col>
                <Col span={8}><Form.Item label="英文名称" name="enName"><Input suffix={<QuestionCircleOutlined />} /></Form.Item></Col>
                <Col span={8}><Form.Item label="任务用途" name="usage" required><Select placeholder="请选择" options={optionsMap.usage} popupRender={m => renderDropdown(m, 'usage')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="采集模式" name="mode" required><Select placeholder="请选择" options={optionsMap.mode} popupRender={m => renderDropdown(m, 'mode')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="场景分类" name="sceneCat" required><Select placeholder="请选择" options={optionsMap.sceneCat} popupRender={m => renderDropdown(m, 'sceneCat')} onChange={() => form.setFieldsValue({ subScene: undefined })} /></Form.Item></Col>
                <Col span={8}><Form.Item label="子场景分类" name="subScene"><Select placeholder="请先选择场景分类" options={optionsMap.subScene.filter(o => !o.parent || o.parent === form.getFieldValue('sceneCat'))} popupRender={m => renderDropdown(m, 'subScene')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="指派默认采集员" name="collector" required><Select placeholder="请选择指派采集员" options={collectorsList} /></Form.Item></Col>
              </Row>
            </Card>

            <Card title="采集配置" bordered={false} styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Row gutter={24}>
                <Col span={8}><Form.Item label="设备类型" name="deviceType" required><Select options={optionsMap.deviceType} popupRender={m => renderDropdown(m, 'deviceType')} onChange={handleDeviceTypeChange} /></Form.Item></Col>
                <Col span={8}><Form.Item label="分配默认设备实例" name="deviceInstance" required><Select placeholder="请选择设备实例" options={filteredDeviceInstances} /></Form.Item></Col>
                <Col span={8}><Form.Item label="遥操主控方式" name="teleType" required><Select options={optionsMap.teleType} popupRender={m => renderDropdown(m, 'teleType')} /></Form.Item></Col>
              </Row>
              <Table dataSource={availableParts} columns={[{title:'名称', dataIndex:'name'},{title:'类型', dataIndex:'type'}]} rowSelection={{type:'checkbox', selectedRowKeys:selectedPartKeys}} pagination={false} size="small" bordered />
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
              <Button type="primary" size="large" style={{ width: 160 }} onClick={() => setCurrentStep(1)}>下一步</Button>
            </div>
          </>
        ) : (
          <>
            <Card bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
               <Row gutter={24}>
                  <Col span={12}><Form.Item label="动作步骤"><Radio.Group defaultValue="format"><Radio value="format">格式化步骤</Radio><Radio value="natural">自然语言描述</Radio></Radio.Group></Form.Item></Col>
                  <Col span={12}><Form.Item label="任务模版"><Select value={selectedTemplate?.id} onChange={(v) => setSelectedTemplate(mockTemplates.find(t => t.id === v))} options={mockTemplates.map(t => ({ value: t.id, label: t.name }))} style={{width:'100%'}} /></Form.Item></Col>
               </Row>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <Text strong>动作步骤编排 (SOP Steps)</Text>
                 <Button icon={<PlusOutlined />} onClick={addStep} style={{ color: '#1677ff', borderColor: '#1677ff' }}>添加步骤</Button>
               </div>
               <Table 
                 dataSource={steps} 
                 rowKey="id"
                 pagination={false} 
                 bordered
                 columns={[
                   { title: '排序', width: 60, align: 'center', render: () => <DragOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} /> },
                   { title: '执行末端类型', width: 200, render: (_, r) => <Select value={r.effector} onChange={v => updateStep(r.id, 'effector', v)} style={{ width: '100%' }} options={[{value: '右手 (Right Arm)', label: '右手 (Right Arm)'}, {value: '左手 (Left Arm)', label: '左手 (Left Arm)'}, {value: '底盘 (Base)', label: '底盘 (Base)'}]} /> },
                   { title: '原子技能', render: (_, r) => <Select value={r.skill} onChange={v => updateStep(r.id, 'skill', v)} style={{ width: '100%' }} options={[{value:'识别', label:'识别'}, {value:'抓取', label:'抓取'}, {value:'移动', label:'移动'}, {value:'放置', label:'放置'}]} /> },
                   { title: '操作对象', render: (_, r) => <Select value={r.object} onChange={v => updateStep(r.id, 'object', v)} style={{ width: '100%' }} options={[{value:'目标物品', label:'目标物品'}, {value:'抽屉', label:'抽屉'}, {value:'门把手', label:'门把手'}]} /> },
                   { title: '操作目标', render: (_, r) => <Select value={r.target} onChange={v => updateStep(r.id, 'target', v)} style={{ width: '100%' }} options={[{value:'确认位置', label:'确认位置'}, {value:'上方', label:'上方'}, {value:'目标点', label:'目标点'}]} /> },
                   { title: '操作', width: 80, align: 'center', fixed: 'right', render: (_, r) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => removeStep(r.id) })} /> }
                 ]} 
               />
               <Row gutter={24} style={{marginTop:24}}>
                  <Col span={12}><Form.Item label="采集数量" name="count"><InputNumber style={{width:'100%'}} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="上传文件"><Upload><Button icon={<UploadOutlined />}>上传文件</Button></Upload></Form.Item></Col>
               </Row>
               <Row gutter={24}>
                  <Col span={12}><Form.Item label="场景初始状态" name="initState"><TextArea rows={4} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="英文场景初始状态"><TextArea rows={4} /></Form.Item></Col>
               </Row>
            </Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
              <Button size="large" style={{ width: 120 }} onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" size="large" style={{ width: 120 }} htmlType="submit">确定</Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '数据采集' }, { title: '任务中心', href: '/collection/tasks' }, { title: '编辑/复制任务' }]} style={{ marginBottom: 16 }} />
      </div>
      {creationStage === 'selection' ? renderSelection() : renderConfigFlow()}
      
      <Modal
          title={`新建${currentField ? fieldLabels[currentField] : ''}`}
          open={modalVisible}
          onOk={handleCreateOption}
          onCancel={() => { setModalVisible(false); setNewOptionLabel(''); }}
          okText="确认创建"
          cancelText="取消"
          width={currentField === 'sop' ? 800 : 520}
      >
          <Form layout="vertical">
              {['deviceType', 'teleType'].includes(currentField) ? (
                  <>
                      <Form.Item label="设备/方式名称" required>
                          <Input placeholder="请输入名称" value={newOptionLabel} onChange={e => setNewOptionLabel(e.target.value)} onPressEnter={handleCreateOption} />
                      </Form.Item>
                      <Form.Item label="英文名称"><Input placeholder="请输入英文名称" /></Form.Item>
                      <Form.Item label="版本号"><Input placeholder="例如: V1.0" /></Form.Item>
                      <Form.Item label="相关配置/URDF"><Input placeholder="关联文件或配置" /></Form.Item>
                      <Form.Item label="功能描述"><Input.TextArea placeholder="简短描述特性" rows={2} /></Form.Item>
                  </>
              ) : ['usage', 'mode', 'sceneCat', 'subScene'].includes(currentField) ? (
                  <>
                      <Form.Item label="标签名称" required>
                          <Input placeholder="请输入标签名称" value={newOptionLabel} onChange={e => setNewOptionLabel(e.target.value)} onPressEnter={handleCreateOption} />
                      </Form.Item>
                      <Form.Item label="标签描述/备注"><Input.TextArea placeholder="选填，描述该分类的适用范围" rows={2} /></Form.Item>
                  </>
              ) : currentField === 'sop' ? (
                  <Row gutter={24}>
                      <Col span={15}>
                          <Form.Item label="任务书名称" required>
                              <Input placeholder="例: 医院场景垃圾清理采集规范 V2.0" value={newOptionLabel} onChange={e => setNewOptionLabel(e.target.value)} onPressEnter={handleCreateOption} />
                          </Form.Item>
                          <Form.Item label="所属项目">
                              <Select placeholder="请选择项目" options={optionsMap.p1} />
                          </Form.Item>
                          <Form.Item label="核心采集指标 (Goal)">
                              <Input.TextArea placeholder="请简述该任务书期望达到的采集目标和核心质量指标" rows={3} />
                          </Form.Item>
                          <Form.Item label="详细指导说明 (Markdown)">
                              <Input.TextArea placeholder="# 采集环境要求..." rows={5} />
                          </Form.Item>
                      </Col>
                      <Col span={9}>
                          <Form.Item label="附件与要求" style={{ marginBottom: 16 }}>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>上传标准 PDF 档</Text>
                              <Upload><Button icon={<UploadOutlined />}>上传任务书 PDF</Button></Upload>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>供采集员在工作台实时查阅</Text>
                          </Form.Item>
                          <Form.Item label="质检必检项">
                              <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <Checkbox value="1">环境光照检查</Checkbox>
                                  <Checkbox value="2">动作连贯性检查</Checkbox>
                                  <Checkbox value="3">物体边界无遮挡</Checkbox>
                                  <Checkbox value="4">关键点标注闭环</Checkbox>
                              </Checkbox.Group>
                          </Form.Item>
                      </Col>
                  </Row>
              ) : currentField === 'p2' ? (
                  <>
                      <Form.Item label="所属一级项目" required>
                          <Select 
                              placeholder="请选择所属一级项目" 
                              options={optionsMap.p1} 
                              value={modalP1Id}
                              onChange={v => setModalP1Id(v)}
                          />
                      </Form.Item>
                      <Form.Item label="二级项目名称" required>
                          <Input 
                              placeholder="请输入二级项目名称"
                              value={newOptionLabel} 
                              onChange={(e) => setNewOptionLabel(e.target.value)}
                              onPressEnter={handleCreateOption}
                          />
                      </Form.Item>
                  </>
              ) : (
                  <Form.Item label={`${currentField ? fieldLabels[currentField] : ''}名称`} required>
                      <Input 
                          placeholder={`请输入${currentField ? fieldLabels[currentField] : ''}名称`}
                          value={newOptionLabel} 
                          onChange={(e) => setNewOptionLabel(e.target.value)}
                          onPressEnter={handleCreateOption}
                      />
                  </Form.Item>
              )}
          </Form>
      </Modal>
    </MainLayout>
  );
}

export default function CreateTaskPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTaskContent />
    </Suspense>
  );
}
