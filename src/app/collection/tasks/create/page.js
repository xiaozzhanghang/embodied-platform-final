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

// Inner component to access search params safely in Suspense
function CreateTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [creationStage, setCreationStage] = useState('selection'); // 'selection', 'config'
  const [currentStep, setCurrentStep] = useState(0); // 0: 基础参数, 1: 动作预设
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Task form type: 'collect' (需要采集数据) or 'asset' (关联数据资产)
  const [taskFormType, setTaskFormType] = useState('collect');
  const [activeCatalog, setActiveCatalog] = useState(null);
  const [episodesList, setEpisodesList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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
      { value: 'UMI_Orin', label: 'UMI_Orin' },
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

  const [sopInputMode, setSopInputMode] = useState('format'); // 'format' or 'natural'
  const [naturalStepsList, setNaturalStepsList] = useState([
    { key: '1', text: '右手识别并定位桌上的目标书籍' },
    { key: '2', text: '' }
  ]);

  const addNaturalStep = () => {
    const newKey = String(Date.now());
    setNaturalStepsList(prev => [...prev, { key: newKey, text: '' }]);
  };

  const updateNaturalStep = (key, text) => {
    setNaturalStepsList(prev => prev.map(item => item.key === key ? { ...item, text } : item));
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
      'UMI_Orin': [
        { key: 'p1', name: 'UMI_头部左相机...', type: 'Body-HeadLeftCamera', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'p2', name: 'UMI_头部右相机...', type: 'Body-HeadRightCamera', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'p3', name: 'UMI_手部左上相机...', type: 'Body-HandleLeftTopCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
        { key: 'p4', name: 'UMI_手部左下相机...', type: 'Body-HandleLeftBottomCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
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

    const defaultParts = [
      { key: 'p1', name: 'UMI_头部左相机...', type: 'Body-HeadLeftCamera', resolution: '1920x1080', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      { key: 'p2', name: 'UMI_头部右相机...', type: 'Body-HeadRightCamera', resolution: '1280x960', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      { key: 'p3', name: 'UMI_手部左上相机...', type: 'Body-HandleLeftTopCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
      { key: 'p4', name: 'UMI_手部左下相机...', type: 'Body-HandleLeftBottomCamera', resolution: '1280x1024', fps: '30fps', quality: '60', fov: 'none', depth: 'none' },
    ];

    const parts = partsMap[value] || defaultParts;
    setAvailableParts(parts);
    setSelectedPartKeys(['p1', 'p2']);
    
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

  const handleCatalogChange = (value) => {
    const catalog = collectedDataSources.find(c => c.value === value);
    if (!catalog) return;

    setActiveCatalog(catalog);

    // Autofill the form fields
    form.setFieldsValue({
      name: `${catalog.taskName}_${Math.floor(1000 + Math.random() * 9000)}`,
      p1: catalog.project,
      taskbook: catalog.taskbook,
      deviceType: catalog.deviceType,
      assetDataCount: 20
    });

    // Generate mock episodes for the table
    const mockEpisodes = Array.from({ length: catalog.dataCount }).map((_, idx) => {
      const epId = 844101 + idx;
      return {
        key: String(epId),
        id: epId,
        episodeName: `${catalog.taskName}_ep_${String(idx + 1).padStart(3, '0')}`,
        collectTime: `2026-06-${String(10 + (idx % 15)).padStart(2, '0')} 15:${String(idx % 60).padStart(2, '0')}:20`,
        totalFrames: [150, 180, 220, 260, 320][idx % 5],
        device: catalog.deviceType === 'galbot_2.2_RGB' ? 'Galbot' : catalog.deviceType,
        parseStatus: '已解析对齐'
      };
    });

    setEpisodesList(mockEpisodes);

    // Default select first 20 items
    const defaultKeys = mockEpisodes.slice(0, 20).map(item => item.key);
    setSelectedRowKeys(defaultKeys);

    // Sync template steps if available
    if (catalog.steps) {
      setSteps(catalog.steps.map((s, idx) => ({ ...s, id: idx + 1 })));
    }
  };

  const handleAssetCountChange = (val) => {
    const num = Math.min(val || 0, episodesList.length);
    const targetKeys = episodesList.slice(0, num).map(item => item.key);
    setSelectedRowKeys(targetKeys);
    form.setFieldsValue({ assetDataCount: num });
  };

  const handleAssetTableSelectChange = (keys) => {
    setSelectedRowKeys(keys);
    form.setFieldsValue({ assetDataCount: keys.length });
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setCreationStage('selection')} style={{ marginRight: 16 }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {mode === 'edit' ? '编辑任务：' : mode === 'copy' ? '复制任务：' : '基于模版创建：'}
              {selectedTemplate?.name}
            </Title>
          </div>
        </div>
        <Radio.Group 
          value={taskFormType} 
          onChange={e => {
            setTaskFormType(e.target.value);
            setCurrentStep(0);
          }} 
          buttonStyle="solid"
          size="medium"
        >
          <Radio.Button value="collect">
            <Space><VideoCameraOutlined /> 需要采集数据</Space>
          </Radio.Button>
          <Radio.Button value="asset">
            <Space><DatabaseOutlined /> 关联数据资产</Space>
          </Radio.Button>
        </Radio.Group>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, padding: '0 100px' }}>
        <Steps current={currentStep} labelPlacement="horizontal" style={{ width: '100%', maxWidth: 800 }}
          items={[
            { title: <Text strong style={{ fontSize: 15 }}>{taskFormType === 'collect' ? '基础参数' : '基础参数 & 关联资产'}</Text> }, 
            { title: <Text strong style={{ fontSize: 15 }}>{taskFormType === 'collect' ? '动作预设' : '动作与标注审核预设'}</Text> }
          ]} 
        />
      </div>

      <Form form={form} layout="vertical" onFinish={(values) => {
        if (currentStep === 0) setCurrentStep(1);
        else {
          message.success(mode === 'edit' ? '任务修改成功' : taskFormType === 'collect' ? '任务派发成功' : '任务关联并成功建立标注审核流');
          router.push('/collection/tasks');
        }
      }}>
        {currentStep === 0 ? (
          <>
            <Alert 
              message={
                taskFormType === 'collect' 
                  ? '【数据数采模式】当前形式将生成针对具体物理设备/仿真场景的采集指令，派发给采集员执行。'
                  : '【资产关联模式】直接在系统已有的数据资产包（如已录制视频、已上传轨迹）中选择数据，建立标注审核待办。'
              } 
              type="info" 
              showIcon 
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 24, borderRadius: 8 }}
            />

            {/* Render Step 0 Form for Collect Mode */}
            {taskFormType === 'collect' ? (
              <>
                <Card title="基础信息" bordered={false} styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} style={{ marginBottom: 24, borderRadius: 8 }}>
                  <Row gutter={24}>
                    <Col span={8}><Form.Item label="一级项目" name="p1" required><Select placeholder="请选择" options={optionsMap.p1} popupRender={m => renderDropdown(m, 'p1')} onChange={() => form.setFieldsValue({ p2: undefined })} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="二级项目" name="p2" required><Select placeholder="请先选择一级项目" options={optionsMap.p2.filter(o => !o.parent || o.parent === form.getFieldValue('p1'))} popupRender={m => renderDropdown(m, 'p2')} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="关联任务书" name="sop"><Select placeholder="请选择" options={optionsMap.sop} popupRender={m => renderDropdown(m, 'sop')} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="任务名称" name="name" required><Input placeholder="请输入任务名称" /></Form.Item></Col>
                    <Col span={8}><Form.Item label="英文名称" name="enName"><Input suffix={<QuestionCircleOutlined />} placeholder="En Name" /></Form.Item></Col>
                    <Col span={8}><Form.Item label="任务用途" name="usage" required><Select placeholder="请选择" options={optionsMap.usage} popupRender={m => renderDropdown(m, 'usage')} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="设备类型" name="deviceType" required><Select placeholder="请选择设备类型" options={optionsMap.deviceType} popupRender={m => renderDropdown(m, 'deviceType')} onChange={handleDeviceTypeChange} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="场景分类" name="sceneCat" required><Select placeholder="请选择" options={optionsMap.sceneCat} popupRender={m => renderDropdown(m, 'sceneCat')} onChange={() => form.setFieldsValue({ subScene: undefined })} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="子场景分类" name="subScene"><Select placeholder="请先选择场景分类" options={optionsMap.subScene.filter(o => !o.parent || o.parent === form.getFieldValue('sceneCat'))} popupRender={m => renderDropdown(m, 'subScene')} /></Form.Item></Col>
                  </Row>
                </Card>

                <Card title="采集配置" bordered={false} styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} style={{ marginBottom: 24, borderRadius: 8 }}>
                  <Row gutter={24} style={{ marginBottom: 16 }}>
                    <Col span={10}>
                      <Form.Item label="设备类型" name="deviceType" required initialValue="UMI_Orin">
                        <Select placeholder="请选择设备类型" options={optionsMap.deviceType} popupRender={m => renderDropdown(m, 'deviceType')} onChange={handleDeviceTypeChange} />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item label="遥操类型" name="teleType" required>
                        <Select placeholder="请选择遥操类型" options={optionsMap.teleType} popupRender={m => renderDropdown(m, 'teleType')} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ fontWeight: 600, color: '#262626', width: 70, paddingTop: 6, flexShrink: 0 }}>设备部件</div>
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
                                  { value: '90°', label: '90°' },
                                  { value: '120°', label: '120°' }
                                ]} 
                              />
                            )
                          },
                          { 
                            title: '深度&红外信息', key: 'depth', width: 260,
                            render: (text, r) => (
                              <Radio.Group defaultValue={r.depth || 'none'} size="small" style={{ fontSize: 12 }}>
                                <Radio value="none">都不采集</Radio>
                                <Radio value="infrared">红外信息</Radio>
                                <Radio value="depth">深度信息</Radio>
                              </Radio.Group>
                            )
                          },
                        ]} 
                        rowSelection={{ type: 'checkbox', selectedRowKeys: selectedPartKeys, onChange: setSelectedPartKeys }} 
                        pagination={false} 
                        size="small" 
                        bordered 
                      />
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* Render Step 0 Form for Data Asset Linkage Mode */}
                <Card title="基础信息" bordered={false} styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} style={{ marginBottom: 24, borderRadius: 8 }}>
                  <Row gutter={24}>
                    <Col span={8}><Form.Item label="一级项目" name="p1" required><Select placeholder="请选择" options={optionsMap.p1} popupRender={m => renderDropdown(m, 'p1')} onChange={() => form.setFieldsValue({ p2: undefined })} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="二级项目" name="p2" required><Select placeholder="请先选择一级项目" options={optionsMap.p2.filter(o => !o.parent || o.parent === form.getFieldValue('p1'))} popupRender={m => renderDropdown(m, 'p2')} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="关联任务书" name="sop"><Select placeholder="请选择" options={optionsMap.sop} popupRender={m => renderDropdown(m, 'sop')} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="任务名称" name="name" required><Input placeholder="请输入任务名称" /></Form.Item></Col>
                    <Col span={8}><Form.Item label="英文名称" name="enName"><Input suffix={<QuestionCircleOutlined />} placeholder="En Name" /></Form.Item></Col>
                    <Col span={8}><Form.Item label="任务用途" name="usage" required><Select placeholder="请选择" options={optionsMap.usage} popupRender={m => renderDropdown(m, 'usage')} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="设备类型" name="deviceType" required><Select placeholder="请选择设备类型" options={optionsMap.deviceType} popupRender={m => renderDropdown(m, 'deviceType')} onChange={handleDeviceTypeChange} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="场景分类" name="sceneCat" required><Select placeholder="请选择" options={optionsMap.sceneCat} popupRender={m => renderDropdown(m, 'sceneCat')} onChange={() => form.setFieldsValue({ subScene: undefined })} /></Form.Item></Col>
                    <Col span={8}><Form.Item label="子场景分类" name="subScene"><Select placeholder="请先选择场景分类" options={optionsMap.subScene.filter(o => !o.parent || o.parent === form.getFieldValue('sceneCat'))} popupRender={m => renderDropdown(m, 'subScene')} /></Form.Item></Col>
                  </Row>
                </Card>

                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LinkOutlined style={{ color: '#1677ff' }} />
                      <span>关联数据资产目录数据</span>
                    </div>
                  } 
                  bordered={false} 
                  styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} 
                  style={{ marginBottom: 24, borderRadius: 8 }}
                >
                  <Row gutter={16}>
                    <Col span={16}>
                      <Form.Item 
                        name="dataSource" 
                        label="数据资产目录数据源" 
                        required 
                        rules={[{ required: true, message: '请选择关联的数据资产目录' }]}
                        extra="从资产库导入对应的动作包数据，任务发布后将直接触发其标注审核流程"
                      >
                        <Select 
                          placeholder="请选择或输入搜索数据资产目录中的已采集动作段..." 
                          onChange={handleCatalogChange}
                          options={collectedDataSources}
                          showSearch
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item 
                        name="assetDataCount" 
                        label="需要关联数据数量" 
                        tooltip="设置本次任务关联引用的数据包条数，将自动对应下方明细表中的选中勾选状态"
                      >
                        <InputNumber
                          min={1}
                          max={episodesList.length || 1000}
                          style={{ width: '100%' }}
                          onChange={handleAssetCountChange}
                          disabled={!activeCatalog}
                          placeholder={activeCatalog ? "输入关联数量" : "请先选择数据源"}
                          addonAfter="条"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {activeCatalog && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{
                        padding: '12px 16px',
                        background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
                        display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13,
                        marginBottom: 16
                      }}>
                        <span><Text type="secondary">项目归属：</Text><Text strong>{activeCatalog.project}</Text></span>
                        <span><Text type="secondary">关联任务书：</Text><Text strong>{activeCatalog.taskbook}</Text></span>
                        <span><Text type="secondary">适配设备：</Text><Text strong>{activeCatalog.deviceType}</Text></span>
                        <span><Text type="secondary">资产数据包数：</Text><Text strong>{activeCatalog.dataCount} 条</Text></span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 13 }}>选择具体关联数据包明细：</Text>
                        <Tag color="blue">
                          已选择 {selectedRowKeys.length} / {episodesList.length} 条数据
                        </Tag>
                      </div>

                      <Table
                        rowSelection={{
                          selectedRowKeys,
                          onChange: handleAssetTableSelectChange
                        }}
                        columns={[
                          { title: '动作数据包 ID', dataIndex: 'id', width: 140 },
                          { title: '数据包名称 (Episode Name)', dataIndex: 'episodeName' },
                          { title: '包含帧数', dataIndex: 'totalFrames', width: 120, render: (frames) => <span>{frames} 帧</span> },
                          { title: '采集时间', dataIndex: 'collectTime', width: 180 },
                          { title: '解析状态', dataIndex: 'parseStatus', width: 120, render: (s) => <Tag color="success">{s}</Tag> }
                        ]}
                        dataSource={episodesList}
                        rowKey="key"
                        pagination={{ pageSize: 5, size: 'small' }}
                        size="small"
                        bordered
                      />
                    </div>
                  )}
                </Card>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
              <Button type="primary" size="large" style={{ width: 160 }} onClick={() => setCurrentStep(1)}>下一步</Button>
            </div>
          </>
        ) : (
          <>
            {/* Step 1 Form Card */}
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UnorderedListOutlined style={{ color: '#1677ff' }} />
                    动作步骤编排
                  </span>
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
              }
              bordered={false} 
              style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}
            >
              {/* 预设动作步骤模版一键填充工具条 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 20,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
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
                      { title: '执行末端类型', width: 200, render: (_, r) => <Select value={r.effector} onChange={v => updateStep(r.id, 'effector', v)} style={{ width: '100%' }} options={[{value: '右手 (Right Arm)', label: '右手 (Right Arm)'}, {value: '左手 (Left Arm)', label: '左手 (Left Arm)'}, {value: '双手 (Dual Arms)', label: '双手 (Dual Arms)'}, {value: '底盘 (Base)', label: '底盘 (Base)'}, {value: '相机 (Camera)', label: '相机 (Camera)'}]} /> },
                      { title: '原子技能', render: (_, r) => <Select value={r.skill} onChange={v => updateStep(r.id, 'skill', v)} style={{ width: '100%' }} options={[{value:'识别', label:'识别'}, {value:'抓取', label:'抓取'}, {value:'移动', label:'移动'}, {value:'放置', label:'放置'}, {value:'靠近', label:'靠近'}, {value:'对准', label:'对准'}, {value:'松开', label:'松开'}]} /> },
                      { title: '操作对象', render: (_, r) => <Select value={r.object} onChange={v => updateStep(r.id, 'object', v)} style={{ width: '100%' }} options={[{value:'目标物品', label:'目标物品'}, {value:'抽屉', label:'抽屉'}, {value:'门把手', label:'门把手'}, {value:'餐盘', label:'餐盘'}, {value:'桌面', label:'桌面'}, {value:'纸箱', label:'纸箱'}]} /> },
                      { title: '操作目标', render: (_, r) => <Select value={r.target} onChange={v => updateStep(r.id, 'target', v)} style={{ width: '100%' }} options={[{value:'确认位置', label:'确认位置'}, {value:'避障靠近', label:'避障靠近'}, {value:'牢固夹紧', label:'牢固夹紧'}, {value:'稳定释放', label:'稳定释放'}]} /> },
                      { title: '操作', width: 80, align: 'center', fixed: 'right', render: (_, r) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => removeStep(r.id) })} /> }
                    ]} 
                  />
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 12 }}>
                  {/* Vertical dashed line connecting step cards */}
                  <div style={{
                    position: 'absolute',
                    left: '27px',
                    top: '24px',
                    bottom: '70px',
                    width: '2px',
                    borderLeft: '2px dashed #cbd5e1',
                    zIndex: 0
                  }} />

                  {naturalStepsList.map((item, index) => (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        gap: 16,
                        background: '#ffffff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: 12,
                        padding: '16px 20px',
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Number Badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: 14,
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                        }}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 16, marginTop: 4, cursor: 'grab', userSelect: 'none' }}>
                          ⋮
                        </div>
                      </div>

                      {/* Input Text Box */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>自然语言动作描述</div>
                        <Input
                          value={item.text}
                          onChange={(e) => updateNaturalStep(item.key, e.target.value)}
                          placeholder="在此描述具体的机器人动作步骤，例如：双手抓取底部泡沫填充纸放入箱内"
                          size="large"
                          style={{
                            width: '100%',
                            borderRadius: 8,
                            borderColor: '#cbd5e1'
                          }}
                          prefix={<EditOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                        />
                      </div>

                      {/* Delete Button */}
                      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                        <Button
                          type="text"
                          danger
                          size="middle"
                          disabled={naturalStepsList.length <= 1}
                          icon={<MinusCircleOutlined style={{ fontSize: 16 }} />}
                          onClick={() => removeNaturalStep(item.key)}
                          style={{
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            width: 36,
                            height: 36
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Natural Language Step Button */}
                  <Button
                    type="dashed"
                    onClick={addNaturalStep}
                    icon={<PlusOutlined />}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 12,
                      color: '#10b981',
                      borderColor: '#a7f3d0',
                      background: '#ecfdf5',
                      fontWeight: 600,
                      fontSize: 14,
                      zIndex: 1
                    }}
                  >
                    添加自然语言步骤
                  </Button>
                </div>
              )}

               {taskFormType === 'collect' && (
                 <>
                   <Row gutter={24} style={{marginTop:24}}>
                      <Col span={12}><Form.Item label="计划采集数量" name="count"><InputNumber style={{width:'100%'}} placeholder="请输入本次任务计划采集的 Episode 动作序列数量" /></Form.Item></Col>
                      <Col span={12}><Form.Item label="采集参考附件书"><Upload><Button icon={<UploadOutlined />}>上传文件</Button></Upload></Form.Item></Col>
                   </Row>
                   <Row gutter={24}>
                      <Col span={12}><Form.Item label="场景物理初始状态" name="initState"><TextArea rows={4} placeholder="描述机器人和操作对象在数采启动前的物理初始要求" /></Form.Item></Col>
                      <Col span={12}><Form.Item label="英文物理初始状态"><TextArea rows={4} placeholder="Initial physical state description in English" /></Form.Item></Col>
                   </Row>
                 </>
               )}
            </Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
              <Button size="large" style={{ width: 120 }} onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" size="large" style={{ width: 160 }} htmlType="submit">
                {taskFormType === 'collect' ? '发布采集任务' : '建立标注审核流'}
              </Button>
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
