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
  RestOutlined, VideoCameraOutlined, DatabaseOutlined, LinkOutlined,
  UserOutlined, AuditOutlined, ThunderboltOutlined, SyncOutlined,
  UnorderedListOutlined, InfoCircleFilled, EditOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, AppModal, FormSection, PageHeader, StateView, StatusTag } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Collectors / Annotators / Auditors lists
const collectorsList = [
  { value: '张三', label: '张三 (采集员-001)' },
  { value: '李四', label: '李四 (采集员-002)' },
  { value: '王五', label: '王五 (采集员-003)' },
  { value: '赵六', label: '赵六 (采集员-004)' },
];

const annotatorsList = [
  { value: '张三', label: '张三 (标注员-001)' },
  { value: '李四', label: '李四 (标注员-002)' },
  { value: '陈七', label: '陈七 (标注员-A)' },
  { value: '孙八', label: '孙八 (标注员-B)' },
];

const auditorsList = [
  { value: '王五', label: '王五 (审核员-001)' },
  { value: '赵六', label: '赵六 (审核员-002)' },
  { value: '吴十', label: '吴十 (审核员-X)' },
];

const collectedDataSources = [
  {
    value: 'catalog_1',
    label: '桌面书籍整理 (organize_books_on_the_table) [ID: 1b3e56c1b...] (Galbot 2.2, 仿真数据)',
    project: 'InternalCommercial',
    taskbook: '桌面整理采集规范 V1.0',
    taskName: '桌面书籍整理_仿真任务',
    dataCount: 80,
    deviceType: 'galbot_2.2_RGB',
    steps: [
      { id: 1, effector: '右手 (Right Arm)', skill: '识别', object: '目标物品', target: '确认位置' },
      { id: 2, effector: '右手 (Right Arm)', skill: '靠近', object: '目标物品', target: '上方' },
      { id: 3, effector: '右手 (Right Arm)', skill: '抓取', object: '目标物品', target: '目标点' }
    ]
  },
  {
    value: 'catalog_2',
    label: '线缆整理动作采集 (session_028) [ID: session_028_6f8...] (Franka FR3, 真实数据)',
    project: 'InternalCommercial',
    taskbook: '线缆管理采集规范 V2.0',
    taskName: '线缆管理动作采集_028',
    dataCount: 120,
    deviceType: 'franka_std',
    steps: [
      { id: 1, effector: '右手 (Right Arm)', skill: '识别', object: '门把手', target: '确认位置' },
      { id: 2, effector: '右手 (Right Arm)', skill: '靠近', object: '门把手', target: '上方' },
      { id: 3, effector: '右手 (Right Arm)', skill: '抓取', object: '门把手', target: '目标点' }
    ]
  },
  {
    value: 'catalog_3',
    label: '餐具抓取测试数据 (tableware_grasping_test) [ID: a24d35e1c...] (鹿鸣 G1, 真实数据)',
    project: 'InternalCommercial',
    taskbook: '厨房操作采集规范 V1.2',
    taskName: '餐具抓取测试_01',
    dataCount: 60,
    deviceType: 'galbot_1.16_G2',
    steps: [
      { id: 1, effector: '左手 (Left Arm)', skill: '识别', object: '餐盘', target: '确认位置' },
      { id: 2, effector: '左手 (Left Arm)', skill: '靠近', object: '餐盘', target: '上方' },
      { id: 3, effector: '左手 (Left Arm)', skill: '抓取', object: '餐盘', target: '目标点' }
    ]
  }
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

function CreateCollectionTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [creationStage, setCreationStage] = useState('selection');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [taskFormType, setTaskFormType] = useState('collect');
  const [activeCatalog, setActiveCatalog] = useState(null);
  const [episodesList, setEpisodesList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [availableParts, setAvailableParts] = useState([]);
  const [selectedPartKeys, setSelectedPartKeys] = useState([]);
  const [filteredDeviceInstances, setFilteredDeviceInstances] = useState(allDeviceInstances);

  // Modal State for custom dropdown option creation
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [modalP1Id, setModalP1Id] = useState(null);

  // Dynamic Options Storage
  const [optionsMap, setOptionsMap] = useState({
    p1: [
      { value: 'InternalCommercial', label: 'InternalCommercial (商业拟真)' },
      { value: 'ResearchLab', label: 'ResearchLab (实验室通用算力)' },
    ],
    p2: [
      { value: 'GroceryVLA', label: 'GroceryVLA (超市物品抓取)', parent: 'InternalCommercial' },
      { value: 'HouseKeeping', label: 'HouseKeeping (家政保洁抓取)', parent: 'InternalCommercial' },
      { value: 'MobileManipulation', label: 'MobileManipulation (移动双臂操控)', parent: 'ResearchLab' },
    ],
    sop: [
      { value: 'SOP-2026-001', label: 'SOP-2026-001 具身双臂拾取与摆放操作规范 (V1.2)' },
      { value: 'SOP-2026-002', label: 'SOP-2026-002 桌面整理与收纳场景采集指南 (V2.0)' },
      { value: 'SOP-2026-003', label: 'SOP-2026-003 柔性物件折叠与精细遥操流程 (V1.0)' },
    ],
    usage: [
      { value: 'Training', label: 'Training (模型训练集数据)' },
      { value: 'Evaluation', label: 'Evaluation (模型评测集数据)' },
      { value: 'Benchmark', label: 'Benchmark (基准算法验证)' },
    ],
    mode: [
      { value: 'Real', label: 'Real (实机物理世界采集)' },
      { value: 'Sim', label: 'Sim (仿真虚拟环境采集)' },
    ],
    sceneCat: [
      { value: 'Kitchen', label: 'Kitchen (厨房场景)' },
      { value: 'LivingRoom', label: 'LivingRoom (客厅环境)' },
      { value: 'Warehouse', label: 'Warehouse (工业仓库/分拣线)' },
    ],
    subScene: [
      { value: 'sub_cuisine', label: 'Kitchen-台面烹饪区', parent: 'Kitchen' },
      { value: 'sub_sink', label: 'Kitchen-清洗水槽区', parent: 'Kitchen' },
      { value: 'sub_sofa', label: 'LivingRoom-沙发茶几区', parent: 'LivingRoom' },
      { value: 'sub_shelf', label: 'Warehouse-高层货架区', parent: 'Warehouse' },
    ],
    deviceType: [
      { value: 'UMI_Orin', label: 'UMI_Orin (银河四目数采终端卡包)' },
      { value: 'galbot_2.2_RGB', label: 'galbot_2.2_RGB (Galbot标准型)' },
      { value: 'galbot_2.2_RGBD', label: 'galbot_2.2_RGBD (深度型)' },
      { value: 'galbot_1.16_G2', label: 'galbot_1.16_G2 (XCU/HPU双端)' },
      { value: 'lumos_fastumi', label: 'lumos_fastumi (离线背包)' },
      { value: 'franka_std', label: 'franka_std (FR3标准型)' },
    ],
    teleType: [
      { value: 'VRController', label: 'VRController (VR手柄设备)' },
      { value: 'Master-slaveArm', label: 'Master-slaveArm (主从臂)' },
      { value: 'DualHandControl', label: 'DualHandControl (双手操控)' },
    ]
  });

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

  const [sopInputMode, setSopInputMode] = useState('format');
  const [naturalStepsList, setNaturalStepsList] = useState([
    { key: '1', text: '右手识别并定位桌上的目标书籍' },
    { key: '2', text: '' }
  ]);

  const addNaturalStep = () => {
    setNaturalStepsList(prev => [...prev, { key: String(Date.now()), text: '', frames: 120 }]);
  };

  const updateNaturalStep = (key, field, value) => {
    setNaturalStepsList(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
  };

  const removeNaturalStep = (key) => {
    if (naturalStepsList.length <= 1) return;
    setNaturalStepsList(prev => prev.filter(item => item.key !== key));
  };

  const handleTemplateSelectForSop = (value) => {
    const templatesMap = {
      box_packing: [
        '双臂移动靠近纸箱与泡沫块预备区域',
        '双手抓取底部泡沫填充纸放入箱内',
        '右手放置目标物件至胶带封装箱体',
        '双手合拢关扣纸箱上端盖板',
        '双手拿取胶带封装器对准中缝贴合',
        '双臂平稳托举已封箱体放置至托盘'
      ],
      books_organize: [
        '右手识别并定位桌上的目标书籍',
        '右手避障靠近目标书籍',
        '右手牢固夹紧抓取书籍',
        '右手平稳移动放置到指定书架'
      ],
      dishes_clean: [
        '双手识别并定位餐桌上的残余餐盘',
        '双手避障靠近餐盘两端',
        '双手牢固夹紧端起餐盘',
        '双手平稳移送至洗碗水槽上方释放'
      ],
      drawer_operation: [
        '右手定位并靠近抽屉拉手位置',
        '右手夹紧拉手并向外推拉合拢/拉开',
        '左手伸入抽屉内部抓取目标物品',
        '右手推回抽屉归位复原'
      ]
    };

    const list = templatesMap[value];
    if (list) {
      setNaturalStepsList(list.map((text, idx) => ({ key: String(idx + 1), text })));
      message.success('已成功填充预设动作步骤！');
    }
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

  useEffect(() => {
    if (mode === 'copy' || mode === 'edit') {
      setCreationStage('config');
      const prefix = mode === 'copy' ? '副本_' : '';
      
      const mockExistingData = {
        name: `${prefix}桌面数采任务_INS_01`,
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
    } else {
      handleDeviceTypeChange('UMI_Orin', false);
    }
  }, [mode, taskId]);

  const handleDeviceTypeChange = (value, shouldResetInstance = true) => {
    const partsMap = {
      'UMI_Orin': [
        { key: 'p1', name: 'UMI_头部左相机...', type: 'Body-HeadLeftCamera', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'p2', name: 'UMI_头部右相机...', type: 'Body-HeadRightCamera', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'p3', name: 'UMI_手部左上相机...', type: 'Body-HandleLeftTopCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'p4', name: 'UMI_手部左下相机...', type: 'Body-HandleLeftBottomCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      ],
      'galbot_2.2_RGB': [
        { key: 'cam_hl', name: 'UMI_头部左相机...', type: 'Body-HeadLeftCamera', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_hr', name: 'UMI_头部右相机...', type: 'Body-HeadRightCamera', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_slt', name: 'UMI_手部左上相机...', type: 'Body-HandleLeftTopCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_slb', name: 'UMI_手部左下相机...', type: 'Body-HandleLeftBottomCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      ],
      'galbot_1.16_G2': [
        { key: 'xcu', name: 'XCU 底座控制卡', type: 'ControlUnit-XCU', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'hpu', name: 'HPU Orin 算力板', type: 'ComputeUnit-HPU', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_hl', name: '头部左相机', type: 'Camera-HEAD_L', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_hr', name: '头部右相机', type: 'Camera-HEAD_R', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      ],
      'lumos_fastumi': [
        { key: 'backpack', name: '数采背包主机', type: 'ComputeUnit-Backpack', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_wl', name: '腕部左相机', type: 'Camera-Wrist_L', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_wr', name: '腕部右相机', type: 'Camera-Wrist_R', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      ],
      'franka_std': [
        { key: 'ctrl', name: 'Franka 控制器', type: 'Controller-FCI', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'cam_front', name: '前置相机', type: 'Camera-Front', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      ],
    };

    const parts = partsMap[value] || partsMap['galbot_2.2_RGB'];
    setAvailableParts(parts);
    setSelectedPartKeys(parts.map(p => p.key));

    const matchingInstances = allDeviceInstances.filter(inst => inst.parent === value);
    setFilteredDeviceInstances(matchingInstances.length > 0 ? matchingInstances : allDeviceInstances);

    if (shouldResetInstance) {
      form.setFieldsValue({ deviceInstance: undefined });
    }
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setCreationStage('config');
    setCurrentStep(0);

    if (tpl.id === 'blank') {
      form.resetFields();
      form.setFieldsValue({
        mode: 'Real',
        deviceType: 'galbot_2.2_RGB',
        teleType: 'Master-slaveArm',
        count: 100
      });
      handleDeviceTypeChange('galbot_2.2_RGB');
    } else {
      form.setFieldsValue({
        p1: 'InternalCommercial',
        p2: 'GroceryVLA',
        usage: 'Training',
        name: `基于模版_${tpl.name}_数采任务`,
        sceneCat: 'Kitchen',
        subScene: 'sub_cuisine',
        mode: 'Real',
        deviceType: tpl.device,
        teleType: tpl.tele,
        count: 500,
        initState: `模版[${tpl.name}]的物理工作区准备完毕`
      });
      handleDeviceTypeChange(tpl.device);
    }
  };

  const handleCatalogChange = (val) => {
    const selectedSource = collectedDataSources.find(item => item.value === val);
    if (!selectedSource) return;

    setActiveCatalog(selectedSource);

    form.setFieldsValue({
      p1: selectedSource.project,
      name: `关联标注_${selectedSource.taskName}`,
      deviceType: selectedSource.deviceType,
    });

    if (selectedSource.steps) {
      setSteps(selectedSource.steps);
    }

    const mockEpList = Array.from({ length: selectedSource.dataCount }).map((_, idx) => ({
      key: String(1001 + idx),
      id: 1001 + idx,
      episodeName: `ep_${selectedSource.value}_${String(idx + 1).padStart(3, '0')}`,
      collectTime: '2026-04-12 14:20:00',
      frames: 350 + (idx % 5) * 40,
      size: `${120 + (idx % 3) * 15}MB`,
      status: '机检通过'
    }));

    setEpisodesList(mockEpList);
    setSelectedRowKeys(mockEpList.slice(0, 20).map(item => item.key));
  };

  const renderSelection = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <FormSection title="基于模板快速创建" description="选择预置的标准化任务模板，快速继承硬件与场景配置。">
        <Row gutter={[20, 20]}>
          {mockTemplates.map((tpl) => (
            <Col span={6} key={tpl.id}>
              <Card 
                hoverable 
                onClick={() => handleSelectTemplate(tpl)}
                style={{ 
                  borderRadius: 12, 
                  border: '1px solid #e8e8e8',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
                styles={{ body: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <Avatar size={44} icon={tpl.icon} style={{ backgroundColor: tpl.bgColor, color: tpl.iconColor, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 15 }}>{tpl.name}</Text>
                        <Tag color="blue" variant="borderless" style={{ fontSize: 10 }}>{tpl.type}</Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', minHeight: 32 }}>{tpl.desc}</Text>
                    </div>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <Row gutter={[0, 8]}>
                    <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>设备：</Text></Col>
                    <Col span={16} style={{ textAlign: 'right' }}><Text style={{ fontSize: 11 }}>{tpl.device}</Text></Col>
                    <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>遥控：</Text></Col>
                    <Col span={16} style={{ textAlign: 'right' }}><Text style={{ fontSize: 11 }}>{tpl.tele}</Text></Col>
                  </Row>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </FormSection>

      <FormSection title="自定义新建" description="从空白表单开始，自主配置全部采集参数。">
        <Card 
          hoverable 
          onClick={() => handleSelectTemplate({ id: 'blank', name: '空白采集任务', device: 'galbot_2.2_RGB', tele: 'Master-slaveArm' })}
          style={{ borderRadius: 12, border: '1px dashed #d9d9d9', background: '#fafafa', width: 340 }}
          styles={{ body: { padding: '24px' } }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar size={44} icon={<FileTextOutlined />} style={{ backgroundColor: '#fff', color: '#8c8c8c', border: '1px solid #d9d9d9' }} />
            <div>
              <Title level={5} style={{ margin: '0 0 4px 0' }}>空白表单创建</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>从头自定义全部采集参数</Text>
            </div>
          </div>
        </Card>
      </FormSection>
    </div>
  );

  const renderConfigFlow = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, padding: '0 100px' }}>
        <Steps current={currentStep} titlePlacement="horizontal" style={{ width: '100%', maxWidth: 800 }}
          items={[
            { title: <Text strong style={{ fontSize: 15 }}>{taskFormType === 'collect' ? '基础参数 & 设备配置' : '基础参数 & 关联资产'}</Text> }, 
            { title: <Text strong style={{ fontSize: 15 }}>{taskFormType === 'collect' ? '动作步骤编排' : '动作与标注审核预设'}</Text> }
          ]} 
        />
      </div>

      <Form form={form} layout="vertical" onFinish={() => {
        if (currentStep === 0) setCurrentStep(1);
        else {
          message.success(mode === 'edit' ? '任务修改成功' : '新建采集任务发布成功');
          router.push('/collection/collection-tasks');
        }
      }}>
        {currentStep === 0 ? (
          <>
            <Alert 
              title={
                taskFormType === 'collect' 
                  ? '【数据数采模式】当前形式将生成针对具体物理设备/仿真场景的采集指令，派发给采集员执行。'
                  : '【资产关联模式】直接在系统已有的数据资产包（如已录制视频、已上传轨迹）中选择数据，建立标注审核待办。'
              } 
              type="info" 
              showIcon 
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 24, borderRadius: 8 }}
            />

            <FormSection title="基础信息">
              <Row gutter={24}>
                <Col span={8}><Form.Item label="一级项目" name="p1" required><Select placeholder="请选择" options={optionsMap.p1} popupRender={m => renderDropdown(m, 'p1')} onChange={() => form.setFieldsValue({ p2: undefined })} /></Form.Item></Col>
                <Col span={8}><Form.Item label="二级项目" name="p2" required><Select placeholder="请先选择一级项目" options={optionsMap.p2.filter(o => !o.parent || o.parent === form.getFieldValue('p1'))} popupRender={m => renderDropdown(m, 'p2')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="关联任务书" name="sop"><Select placeholder="请选择" options={optionsMap.sop} popupRender={m => renderDropdown(m, 'sop')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="采集任务名称" name="name" required><Input placeholder="请输入采集任务名称" /></Form.Item></Col>
                <Col span={8}><Form.Item label="英文名称" name="enName"><Input suffix={<QuestionCircleOutlined />} placeholder="En Name" /></Form.Item></Col>
                <Col span={8}><Form.Item label="任务用途" name="usage" required><Select placeholder="请选择" options={optionsMap.usage} popupRender={m => renderDropdown(m, 'usage')} /></Form.Item></Col>
                <Col span={8}><Form.Item label="场景分类" name="sceneCat" required><Select placeholder="请选择" options={optionsMap.sceneCat} popupRender={m => renderDropdown(m, 'sceneCat')} onChange={() => form.setFieldsValue({ subScene: undefined })} /></Form.Item></Col>
                <Col span={8}><Form.Item label="子场景分类" name="subScene"><Select placeholder="请先选择场景分类" options={optionsMap.subScene.filter(o => !o.parent || o.parent === form.getFieldValue('sceneCat'))} popupRender={m => renderDropdown(m, 'subScene')} /></Form.Item></Col>
              </Row>

              <Divider style={{ margin: '16px 0 24px' }} />

              <Row gutter={24} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Form.Item label="上传文件" name="layoutFile">
                    <Space>
                      <Upload>
                        <Button type="primary" icon={<UploadOutlined />}>上传文件</Button>
                      </Upload>
                      <Text type="secondary" style={{ fontSize: 13 }}>请上传场景的layout文件</Text>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Form.Item label="场景初始状态" name="initState">
                    <TextArea rows={3} maxLength={500} showCount placeholder="请描述场景初始状态" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="英文场景初始状态" name="enInitState">
                    <TextArea rows={3} maxLength={500} showCount placeholder="请描述英文场景初始状态" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item label="泛化条件" name="generalizationCond">
                    <TextArea rows={3} maxLength={500} showCount placeholder="请描述泛化条件" />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            <FormSection title="设备与采集配置">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#262626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#ff4d4f' }}>*</span>
                  <span>任务类型:</span>
                </div>
                <Radio.Group 
                  value={taskFormType} 
                  onChange={e => {
                    setTaskFormType(e.target.value);
                    setCurrentStep(0);
                  }}
                  style={{ display: 'flex', gap: 32 }}
                >
                  <Radio value="collect">
                    <span style={{ fontWeight: 600 }}>采集计划</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 6 }}>(需要物理/遥操采集，分包时需分配采集员与质检员)</span>
                  </Radio>
                  <Radio value="asset">
                    <span style={{ fontWeight: 600 }}>关联资产</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 6 }}>(关联已有数据资产/外部导入，分包时仅需配置数量与质检员)</span>
                  </Radio>
                </Radio.Group>
                <Divider style={{ borderStyle: 'dashed', margin: '16px 0 24px' }} />
              </div>

              {taskFormType === 'collect' ? (
                <>
                  <Row gutter={24} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Form.Item label="采集模式" name="mode" required initialValue="Real">
                        <Select placeholder="请选择采集模式" options={optionsMap.mode} popupRender={m => renderDropdown(m, 'mode')} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="设备类型" name="deviceType" required initialValue="UMI_Orin">
                        <Select placeholder="请选择设备类型" options={optionsMap.deviceType} popupRender={m => renderDropdown(m, 'deviceType')} onChange={handleDeviceTypeChange} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="遥操类型" name="teleType" required>
                        <Select placeholder="请选择遥操类型" options={optionsMap.teleType} popupRender={m => renderDropdown(m, 'teleType')} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="采集数量" name="count" required initialValue={100}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入采集数量" addonAfter="条" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ fontWeight: 600, color: '#262626', width: 80, paddingTop: 6, flexShrink: 0 }}>设备部件</div>
                    <div style={{ flex: 1, overflowX: 'auto' }}>
                      <Table 
                        dataSource={availableParts} 
                        columns={[
                          { title: '部件名称', dataIndex: 'name', key: 'name', width: 170, ellipsis: true },
                          { title: '部件类型', dataIndex: 'type', key: 'type', width: 180, ellipsis: true },
                          { 
                            title: '分辨率', key: 'resolution', width: 130,
                            render: (text, r) => (
                              <Select 
                                size="small"
                                defaultValue={r.resolution || '1280x960'} 
                                style={{ width: '100%' }}
                                options={[
                                  { value: '1280x960', label: '1280x960' },
                                  { value: '1280x1024', label: '1280x1024' },
                                  { value: '1920x1080', label: '1920x1080' },
                                  { value: '3840x2160', label: '3840x2160' }
                                ]} 
                              />
                            )
                          },
                          { 
                            title: '帧率', key: 'fps', width: 100,
                            render: (text, r) => (
                              <Select 
                                size="small"
                                defaultValue={r.fps || '30fps'} 
                                style={{ width: '100%' }}
                                options={[
                                  { value: '15fps', label: '15fps' },
                                  { value: '30fps', label: '30fps' },
                                  { value: '60fps', label: '60fps' }
                                ]} 
                              />
                            )
                          },
                          { 
                            title: '图像质量', key: 'quality', width: 95,
                            render: (text, r) => (
                              <Select 
                                size="small"
                                defaultValue={r.quality || '60'} 
                                style={{ width: '100%' }}
                                options={[
                                  { value: '60', label: '60' },
                                  { value: '80', label: '80' },
                                  { value: '100', label: '100' }
                                ]} 
                              />
                            )
                          },
                          { 
                            title: 'FOV', key: 'fov', width: 100,
                            render: (text, r) => (
                              <Select 
                                size="small"
                                defaultValue={r.fov || 'none'} 
                                style={{ width: '100%' }}
                                options={[
                                  { value: 'none', label: 'none' },
                                  { value: '60deg', label: '60°' },
                                  { value: '90deg', label: '90°' },
                                  { value: '120deg', label: '120°' }
                                ]} 
                              />
                            )
                          },
                          { 
                            title: '深度&红外信息', key: 'depth', width: 170,
                            render: () => (
                              <Radio.Group defaultValue="none" size="small">
                                <Radio value="none" style={{ fontSize: 12, marginRight: 6 }}>都不采集</Radio>
                                <Radio value="depth" style={{ fontSize: 12 }}>深度信息</Radio>
                              </Radio.Group>
                            )
                          }
                        ]} 
                        rowSelection={{
                          type: 'checkbox',
                          selectedRowKeys: selectedPartKeys,
                          onChange: setSelectedPartKeys,
                        }}
                        pagination={false} 
                        size="small" 
                        bordered 
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Row gutter={24}>
                    <Col span={16}>
                      <Form.Item label="选择数据资产包" name="assetDataSource" required>
                        <Select placeholder="请选择关联数据源" options={collectedDataSources} onChange={handleCatalogChange} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="选择 Episode 数量">
                        <InputNumber 
                          min={1} 
                          max={episodesList.length || 100} 
                          value={selectedRowKeys.length || 20} 
                          onChange={(val) => {
                            setSelectedRowKeys(episodesList.slice(0, val || 0).map(i => i.key));
                          }} 
                          style={{ width: '100%' }} 
                          addonAfter="条" 
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Table 
                    rowSelection={{
                      type: 'checkbox',
                      selectedRowKeys,
                      onChange: setSelectedRowKeys,
                    }}
                    columns={[
                      { title: 'Episode ID', dataIndex: 'id', key: 'id', width: 120 },
                      { title: 'Episode 名称', dataIndex: 'episodeName', key: 'episodeName' },
                      { title: '采集时间', dataIndex: 'collectTime', key: 'collectTime', width: 180 },
                      { title: '帧数', dataIndex: 'frames', key: 'frames', width: 90 },
                      { title: '尺寸 (MB)', dataIndex: 'size', key: 'size', width: 100 },
                      { title: '质检状态', dataIndex: 'status', key: 'status', width: 110, render: s => <StatusTag status={s} /> }
                    ]}
                    dataSource={episodesList.length > 0 ? episodesList : [
                      { key: '844101', id: 844101, episodeName: 'organize_books_ep_001', collectTime: '2026-06-12 15:10:20', frames: 450, size: '128MB', status: '机检通过' },
                      { key: '844102', id: 844102, episodeName: 'organize_books_ep_002', collectTime: '2026-06-12 15:15:40', frames: 520, size: '142MB', status: '机检通过' },
                      { key: '844103', id: 844103, episodeName: 'organize_books_ep_003', collectTime: '2026-06-12 15:22:10', frames: 380, size: '110MB', status: '机检通过' },
                    ]}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    bordered
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
            </FormSection>

            <ActionFooter>
              <Button type="primary" size="large" style={{ width: 140, borderRadius: 8 }} onClick={() => setCurrentStep(1)}>下一步</Button>
            </ActionFooter>
          </>
        ) : (
          <FormSection title="动作步骤编排" description="使用结构化步骤或自然语言描述任务 SOP。">
              <div className="ui-toolbar" style={{ padding: '0 0 16px', minHeight: 0 }}>
                <span />
                <Radio.Group 
                  value={sopInputMode} 
                  onChange={e => setSopInputMode(e.target.value)}
                  buttonStyle="solid"
                  size="medium"
                >
                  <Radio.Button value="format">
                    <Space><UnorderedListOutlined /> 结构化步骤</Space>
                  </Radio.Button>
                  <Radio.Button value="natural">
                    <Space><EditOutlined /> 自然语言描述</Space>
                  </Radio.Button>
                </Radio.Group>
              </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 20,
              background: '#f5f7fa',
              padding: '16px 20px',
              borderRadius: 12,
              border: '1px dashed #cbd5e1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <InfoCircleFilled style={{ color: '#1677ff' }} />
                  预设动作步骤模版一键填充:
                </span>
                <Select
                  placeholder="选择预设动作模版一键填充步骤数据..."
                  style={{ width: 340 }}
                  size="middle"
                  onChange={handleTemplateSelectForSop}
                  allowClear
                >
                  <Select.Option value="box_packing">📦 工业纸箱打包封装与装箱模版 (6 步)</Select.Option>
                  <Select.Option value="books_organize">📚 桌面书籍整理与摆放模版 (4 步)</Select.Option>
                  <Select.Option value="dishes_clean">🍽️ 餐盘清理与协同搬运模版 (4 步)</Select.Option>
                  <Select.Option value="drawer_operation">🚪 抽屉开关与取物操作模版 (4 步)</Select.Option>
                </Select>
              </div>
            </div>

            {sopInputMode === 'format' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 13, color: '#334155' }}>结构化动作步骤明细列表：</Text>
                  <Button icon={<PlusOutlined />} onClick={addStep} style={{ color: '#1677ff', borderColor: '#1677ff' }}>添加步骤</Button>
                </div>
                <Table 
                  dataSource={steps} 
                  rowKey="id"
                  pagination={false} 
                  bordered
                  columns={[
                    { title: '排序', width: 60, align: 'center', render: () => <DragOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} /> },
                    { title: '执行末端类型', width: 180, render: (_, r) => <Select value={r.effector} onChange={v => updateStep(r.id, 'effector', v)} style={{ width: '100%' }} options={[{value: '右手 (Right Arm)', label: '右手 (Right Arm)'}, {value: '左手 (Left Arm)', label: '左手 (Left Arm)'}, {value: '双手 (Dual Arms)', label: '双手 (Dual Arms)'}, {value: '底盘 (Base)', label: '底盘 (Base)'}]} /> },
                    { title: '原子技能', width: 130, render: (_, r) => <Select value={r.skill} onChange={v => updateStep(r.id, 'skill', v)} style={{ width: '100%' }} options={[{value:'识别', label:'识别'}, {value:'抓取', label:'抓取'}, {value:'移动', label:'移动'}, {value:'放置', label:'放置'}, {value:'靠近', label:'靠近'}]} /> },
                    { title: '操作对象', width: 140, render: (_, r) => <Select value={r.object} onChange={v => updateStep(r.id, 'object', v)} style={{ width: '100%' }} options={[{value:'目标物品', label:'目标物品'}, {value:'抽屉', label:'抽屉'}, {value:'门把手', label:'门把手'}, {value:'餐盘', label:'餐盘'}, {value:'桌面', label:'桌面'}]} /> },
                    { title: '操作目标描述', render: (_, r) => <Select value={r.target} onChange={v => updateStep(r.id, 'target', v)} style={{ width: '100%' }} options={[{value:'确认位置', label:'确认位置'}, {value:'避障靠近', label:'避障靠近'}, {value:'牢固夹紧', label:'牢固夹紧'}]} /> },
                    { title: '动作帧数', width: 130, render: (_, r) => <InputNumber min={1} value={r.frames || 300} onChange={v => updateStep(r.id, 'frames', v)} addonAfter="帧" style={{ width: '100%' }} /> },
                    { title: '操作', width: 70, align: 'center', fixed: 'right', render: (_, r) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeStep(r.id)} /> }
                  ]} 
                />
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {naturalStepsList.map((item, index) => (
                  <div key={item.key} style={{ display: 'flex', gap: 16, background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '16px 20px', alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {index + 1}
                    </div>
                    <Input 
                      placeholder={`请输入第 ${index + 1} 步动作步骤的自然语言描述（如：右手避障靠近目标物体）`}
                      value={item.text}
                      onChange={e => updateNaturalStep(item.key, 'text', e.target.value)}
                      size="large"
                      style={{ flex: 1, borderRadius: 8 }}
                    />
                    <InputNumber 
                      min={1} 
                      placeholder="帧数" 
                      value={item.frames || 300} 
                      onChange={v => updateNaturalStep(item.key, 'frames', v)} 
                      addonAfter="帧" 
                      style={{ width: 140 }} 
                      size="large"
                    />
                    <Button 
                      type="text" 
                      danger 
                      icon={<MinusCircleOutlined style={{ fontSize: 18 }} />} 
                      onClick={() => removeNaturalStep(item.key)}
                      disabled={naturalStepsList.length <= 1}
                    />
                  </div>
                ))}

                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addNaturalStep} 
                  block 
                  size="large"
                  style={{ height: 48 }}
                >
                  添加自然语言步骤描述
                </Button>
              </div>
            )}

            <ActionFooter>
              <Button size="large" onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" size="large" htmlType="submit">提交并发布任务</Button>
            </ActionFooter>
          </FormSection>
        )}
      </Form>
    </div>
  );

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title={creationStage === 'selection'
            ? '新建采集任务'
            : `${mode === 'edit' ? '编辑采集任务' : mode === 'copy' ? '复制采集任务' : '基于模板创建'}：${selectedTemplate?.name || ''}`}
          description="选择创建方式，配置基础信息、设备参数与动作步骤。"
          breadcrumbs={[
            { title: '数据采集' },
            { title: '任务中心' },
            { title: '采集任务', href: '/collection/collection-tasks' },
            { title: '新建采集任务' },
          ]}
          back={() => creationStage === 'selection' ? router.back() : setCreationStage('selection')}
        />

        <div>
        {creationStage === 'selection' ? renderSelection() : renderConfigFlow()}
        </div>

        <AppModal
        title={`快捷新增 - ${fieldLabels[currentField] || ''}`}
        open={modalVisible}
        onOk={handleCreateOption}
        onCancel={() => {
          setModalVisible(false);
          setNewOptionLabel('');
          setModalP1Id(null);
        }}
        okText="确认创建"
        cancelText="取消"
        widthSize="small"
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          {currentField === 'p2' && (
            <Form.Item label="所属一级项目" required>
              <Select 
                placeholder="请选择一级项目" 
                options={optionsMap.p1} 
                value={modalP1Id}
                onChange={v => setModalP1Id(v)}
              />
            </Form.Item>
          )}

          <Form.Item label="选项名称" required>
            <Input 
              placeholder={`请输入新增的${fieldLabels[currentField] || '数据'}`} 
              value={newOptionLabel}
              onChange={e => setNewOptionLabel(e.target.value)}
              onPressEnter={handleCreateOption}
            />
          </Form.Item>
        </Form>
        </AppModal>
      </div>
    </MainLayout>
  );
}

export default function CreateCollectionTaskPage() {
  return (
    <Suspense fallback={<StateView type="loading" />}>
      <CreateCollectionTaskContent />
    </Suspense>
  );
}
