'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Space, Card, Typography, Breadcrumb, Tag, 
  App, Row, Col, Avatar, Tooltip, Input, Divider, Form, Select, Tabs, Radio, Modal, InputNumber, Switch, Descriptions
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, LayoutOutlined,
  ShoppingOutlined, ToolOutlined, RestOutlined,
  SkinOutlined, ExperimentOutlined, DeleteOutlined,
  EditOutlined, PlayCircleOutlined, ReloadOutlined, DownOutlined, UpOutlined,
  NodeIndexOutlined, FileTextOutlined, FolderOpenOutlined, UserOutlined, TagOutlined,
  MinusCircleOutlined, UnorderedListOutlined, FullscreenOutlined,
  AppstoreOutlined, RobotOutlined, CopyOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, TableToolbar } from '@/components/ui';
import { buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text, Paragraph } = Typography;

const defaultAnnoTemplates = [
  {
    id: 'tpl_default_1',
    name: '🍽️ 餐厅餐盘整理标准标注模版',
    desc: '覆盖完整的双臂就餐收拾工序，包含300帧完整动作序列，适配鹿鸣双臂机器人。',
    category: 'service',
    device: '鹿鸣双臂机器人',
    stepCount: 9,
    creator: '系统内置',
    createTime: '2026-07-12 10:15:30',
    totalFrames: 300,
    steps: [
      { text: '右手从置物架抓取托盘并放置在餐桌上', startFrame: 0, endFrame: 35 },
      { text: '左手拿起杯子平稳放置到托盘边缘', startFrame: 35, endFrame: 70 },
      { text: '右手从餐桌抓取待收碗盘并叠放', startFrame: 70, endFrame: 105 },
      { text: '双手端起装载碗盘的托盘至工作区', startFrame: 105, endFrame: 140 },
      { text: '右手取消毒布快速擦拭餐桌残留油渍', startFrame: 140, endFrame: 175 },
      { text: '右手放置餐盘到清洗机架格内', startFrame: 175, endFrame: 210 },
      { text: '右手拿起备用刀叉整理归置', startFrame: 210, endFrame: 240 },
      { text: '左手协助校正主干刀叉位置', startFrame: 240, endFrame: 270 },
      { text: '双手清洁理顺并退回初始安全点', startFrame: 270, endFrame: 300 }
    ]
  },
  {
    id: 'tpl_default_2',
    name: '📦 工业打包贴标标准标注模版',
    desc: '标准的6工步纸箱开箱封底及贴标工段步骤（总长300帧），适配Galbot真机数据。',
    category: 'industry',
    device: 'Galbot-1.16',
    stepCount: 6,
    creator: '系统内置',
    createTime: '2026-07-14 16:40:00',
    totalFrames: 300,
    steps: [
      { text: '双手抓取纸箱并开箱定位', startFrame: 0, endFrame: 50 },
      { text: '右手取底部泡沫垫并放入纸箱', startFrame: 50, endFrame: 100 },
      { text: '右手抓取核心金属支架入箱', startFrame: 100, endFrame: 150 },
      { text: '左手取顶部泡沫垫覆盖定位', startFrame: 150, endFrame: 200 },
      { text: '双手折叠两侧箱盖合拢', startFrame: 200, endFrame: 250 },
      { text: '双手持胶带机封口封箱', startFrame: 250, endFrame: 300 }
    ]
  },
  {
    id: 'tpl_default_3',
    name: '📚 办公桌面书籍收纳与分类标注模版',
    desc: '面向办公场景的散落书本文档拾取、分类与立放书架全套4步SOP序列。',
    category: 'service',
    device: 'Air-SN201',
    stepCount: 4,
    creator: '标注员_陈明',
    createTime: '2026-08-10 14:20:00',
    totalFrames: 240,
    steps: [
      { text: '右臂伸出并定位识别桌面书籍边缘', startFrame: 0, endFrame: 60 },
      { text: '柔性夹爪夹持书脊并向上抬起', startFrame: 60, endFrame: 120 },
      { text: '平移至书架指定分区插槽', startFrame: 120, endFrame: 180 },
      { text: '垂直推进归位并松爪复位', startFrame: 180, endFrame: 240 }
    ]
  },
  {
    id: 'tpl_default_4',
    name: '🚪 智能家居抽屉开关取物标注模版',
    desc: '标准拉手识别、匀速拉出、内腔物品拾取与复位闭合的标准4工步序列。',
    category: 'service',
    device: 'Galbot-1.16',
    stepCount: 4,
    creator: '标注员_赵六',
    createTime: '2026-08-15 09:30:00',
    totalFrames: 200,
    steps: [
      { text: '对准把手并平稳拉开抽屉至最大行程', startFrame: 0, endFrame: 50 },
      { text: '探入抽屉腔体精准抓取目标药品包装盒', startFrame: 50, endFrame: 110 },
      { text: '取出物品并放置在台面上', startFrame: 110, endFrame: 160 },
      { text: '推回抽屉把手至完全闭合', startFrame: 160, endFrame: 200 }
    ]
  },
  {
    id: 'tpl_default_5',
    name: '🔩 工业精密螺栓紧固标准标注模版',
    desc: '高精度工业装配场景，手眼配合对准螺孔并紧固5步动作。',
    category: 'industry',
    device: 'Galbot-1.16',
    stepCount: 5,
    creator: '系统内置',
    createTime: '2026-08-18 11:00:00',
    totalFrames: 280,
    steps: [
      { text: '右手取高强度六角螺栓并移至工件上方', startFrame: 0, endFrame: 55 },
      { text: '左手微调装配孔位同轴度', startFrame: 55, endFrame: 110 },
      { text: '螺栓顺时针预拧入2圈防脱落', startFrame: 110, endFrame: 170 },
      { text: '电动扳手接入并紧固至设定扭矩', startFrame: 170, endFrame: 230 },
      { text: '双臂撤离并执行激光齐平度检测', startFrame: 230, endFrame: 280 }
    ]
  },
  {
    id: 'tpl_default_6',
    name: '🍎 零售货架水果生鲜分拣标注模版',
    desc: '无损吸盘夹取货架生鲜水果并按品类分区投放的柔性操作样例。',
    category: 'retail',
    device: 'Air-SN201',
    stepCount: 4,
    creator: '标注员_李华',
    createTime: '2026-08-20 16:45:00',
    totalFrames: 180,
    steps: [
      { text: '深度相机识别苹果瑕疵与摆放朝向', startFrame: 0, endFrame: 45 },
      { text: '负压吸盘靠近并无损吸附果品', startFrame: 45, endFrame: 90 },
      { text: '悬停转移至优质生鲜果盒上方', startFrame: 90, endFrame: 135 },
      { text: '释放负压轻柔落入缓冲槽', startFrame: 135, endFrame: 180 }
    ]
  }
];

const defaultActionTemplates = [
  {
    key: 'act_1',
    name: '📦 工业纸箱打包封装与装箱模版',
    desc: '标准的工业包装与物流操作，按末端技能四元组拆解，包含6个结构化动作步骤。',
    type: '工业数据',
    device: 'Galbot (双臂)',
    stepFormat: 'structured',
    stepType: '结构化步骤',
    stepCount: 6,
    steps: [
      '双手 (Dual Arms) 展开 纸箱 (封底定位)',
      '右手 (Right Arm) 放置 泡沫垫 (放入底部)',
      '右手 (Right Arm) 抓取 工厂部件 (稳定装箱)',
      '左手 (Left Arm) 放置 泡沫垫 (顶部覆盖)',
      '双手 (Dual Arms) 折叠 箱盖 (合拢定位)',
      '右手 (Right Arm) 封箱 胶带机 (顶部密封)'
    ]
  },
  {
    key: 'act_2',
    name: '📚 桌面书籍整理与摆放模版',
    desc: '面向家庭/办公室的服务机器人桌面物品理顺模板，采用自然语言分步描述，包含4个自由文本步骤。',
    type: '服务数据',
    device: 'Air-SN (单臂)',
    stepFormat: 'natural',
    stepType: '自然语言',
    stepCount: 4,
    steps: [
      '视觉定位桌面上的目标散落书籍',
      '右臂伸出并调整手爪开度平稳靠近书籍',
      '夹取书籍并保持水平姿态移动至书架',
      '将书籍垂直插入指定空位并平稳复位'
    ]
  },
  {
    key: 'act_3',
    name: '🍽️ 餐盘清理与协同搬运模版',
    desc: '用于餐饮或居家场景中待收拾的碗盘碟器皿抓取及运送，结构化协同操作，包含4个步骤。',
    type: '服务数据',
    device: '鹿鸣机器人',
    stepFormat: 'structured',
    stepType: '结构化步骤',
    stepCount: 4,
    steps: [
      '双手 (Dual Arms) 识别 餐盘 (确认位置)',
      '双手 (Dual Arms) 靠近 餐盘 (避障对准)',
      '双手 (Dual Arms) 抓取 餐盘 (牢固夹紧)',
      '双手 (Dual Arms) 放置 回收车 (平稳入框)'
    ]
  },
  {
    key: 'act_4',
    name: '🚪 智能家居抽屉开关与取物模版',
    desc: '操纵滑轨结构体家具，支持左右/上下端手爪交互及微调，采用自然语言提示词描述，包含4个步骤。',
    type: '服务数据',
    device: 'Galbot (双臂)',
    stepFormat: 'natural',
    stepType: '自然语言',
    stepCount: 4,
    steps: [
      '识别目标抽屉的拉手位置与朝向',
      '移动末端对准把手并向外匀速拉开抽屉',
      '探入抽屉内部识别并拾取目标杂物',
      '将抽屉轻柔推回闭合位置'
    ]
  },
  {
    key: 'act_5',
    name: '🔩 精密工件螺钉紧固装配模版',
    desc: '高精度工业流水线组装，四元组精密抓取、对齐及紧固5步动作。',
    type: '工业数据',
    device: 'Galbot (双臂)',
    stepFormat: 'structured',
    stepType: '结构化步骤',
    stepCount: 5,
    steps: [
      '右手 (Right Arm) 抓取 螺栓 (精密取料)',
      '左手 (Left Arm) 扶持 机械工件 (保持基准)',
      '右手 (Right Arm) 预拧 螺孔 (防滑丝对准)',
      '右手 (Right Arm) 紧固 电动扭矩枪 (锁紧到位)',
      '双手 (Dual Arms) 复位 机械臂 (返回待命点)'
    ]
  },
  {
    key: 'act_6',
    name: '🥤 零售饮料货架陈列与理货模版',
    desc: '单臂吸盘柔性抓取饮料瓶身并整齐推入货架滑道。',
    type: '零售数据',
    device: 'Air-SN (单臂)',
    stepFormat: 'natural',
    stepType: '自然语言',
    stepCount: 3,
    steps: [
      '末端相机对准饮料条形码并识别品类',
      '吸盘平稳贴合并抓取饮料瓶身',
      '推进至货架空位并顺势平推归位'
    ]
  },
  {
    key: 'act_7',
    name: '🧹 工作台面非结构化垃圾清理模版',
    desc: '面向实验室或工厂台面杂物、纸屑、线头的快速扫除与归集。',
    type: '服务数据',
    device: 'Galbot (双臂)',
    stepFormat: 'natural',
    stepType: '自然语言',
    stepCount: 4,
    steps: [
      '视觉分割识别桌面非结构化垃圾碎屑',
      '右臂操纵毛刷将杂物扫入左手集尘盒',
      '移动至垃圾桶上方翻转集尘盒倾倒',
      '双手返回桌面原点并确认台面清洁度'
    ]
  },
  {
    key: 'act_8',
    name: '🧪 生物医药试管抓取与移液模版',
    desc: '微米级精密夹爪试管开盖、移液及封口6步动作。',
    type: '工业数据',
    device: '鹿鸣机器人',
    stepFormat: 'structured',
    stepType: '结构化步骤',
    stepCount: 6,
    steps: [
      '右手 (Right Arm) 夹取 试管 (精准取样)',
      '左手 (Left Arm) 旋开 密封盖 (防飞溅开启)',
      '右手 (Right Arm) 吸取 试剂 (定量移液)',
      '右手 (Right Arm) 注液 反应皿 (缓慢滴定)',
      '左手 (Left Arm) 旋紧 密封盖 (气密封装)',
      '右手 (Right Arm) 放置 恒温架 (归位存放)'
    ]
  }
];

export default function TaskTemplatesPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState('task');
  const [actionTemplates, setActionTemplates] = useState(defaultActionTemplates);
  const [annoTemplates, setAnnoTemplates] = useState(defaultAnnoTemplates);

  // 1. Task Template Filters
  const [taskSearchText, setTaskSearchText] = useState('');
  const [taskFilterType, setTaskFilterType] = useState('all');
  const [taskFilterDevice, setTaskFilterDevice] = useState('all');
  const [taskQuickCategory, setTaskQuickCategory] = useState('all');

  // 2. Action Template Filters
  const [actionSearchText, setActionSearchText] = useState('');
  const [actionFilterFormat, setActionFilterFormat] = useState('all');
  const [actionFilterDevice, setActionFilterDevice] = useState('all');
  const [actionFilterType, setActionFilterType] = useState('all');
  const [actionFilterStepRange, setActionFilterStepRange] = useState('all');
  const [actionQuickCategory, setActionQuickCategory] = useState('all');

  // 3. Annotation Template Filters
  const [annoSearchText, setAnnoSearchText] = useState('');
  const [annoFilterStepRange, setAnnoFilterStepRange] = useState('all');
  const [annoFilterSource, setAnnoFilterSource] = useState('all');
  const [annoQuickCategory, setAnnoQuickCategory] = useState('all');

  // Modal states for creating and viewing action templates
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalDevice, setModalDevice] = useState('galbot');
  const [enableFrameRange, setEnableFrameRange] = useState(true);
  const [selectedActionDetail, setSelectedActionDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionForm] = Form.useForm();
  const [actionInputMode, setActionInputMode] = useState('natural'); // 'structured' | 'natural'
  const [actionSteps, setActionSteps] = useState([
    { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置', startFrame: 0, endFrame: 300 },
    { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近', startFrame: 301, endFrame: 600 },
    { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧', startFrame: 601, endFrame: 900 }
  ]);
  const [actionNaturalSteps, setActionNaturalSteps] = useState([
    { key: '1', text: '展开纸箱并封底', startFrame: 0, endFrame: 300 },
    { key: '2', text: '放置底部泡沫垫并对准角落', startFrame: 301, endFrame: 600 }
  ]);

  const addActionStep = () => {
    if (actionInputMode === 'structured') {
      const newKey = (actionSteps.length + 1).toString();
      const lastStep = actionSteps[actionSteps.length - 1];
      const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
      const startF = prevEnd > 0 ? prevEnd + 1 : 0;
      setActionSteps([
        ...actionSteps, 
        { 
          key: newKey, 
          arm: '右手 (Right Arm)', 
          skill: '靠近', 
          object: '目标物品', 
          goal: '避障靠近',
          startFrame: startF,
          endFrame: startF + 299
        }
      ]);
    } else {
      const newKey = (actionNaturalSteps.length + 1).toString();
      const lastStep = actionNaturalSteps[actionNaturalSteps.length - 1];
      const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
      const startF = prevEnd > 0 ? prevEnd + 1 : 0;
      setActionNaturalSteps([
        ...actionNaturalSteps,
        {
          key: newKey,
          text: '',
          startFrame: startF,
          endFrame: startF + 299
        }
      ]);
    }
  };

  const removeActionStep = (key) => {
    if (actionInputMode === 'structured') {
      setActionSteps(actionSteps.filter(item => item.key !== key));
    } else {
      setActionNaturalSteps(actionNaturalSteps.filter(item => item.key !== key));
    }
  };

  const updateActionStepField = (key, field, val) => {
    setActionSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const updateActionNaturalStepField = (key, field, val) => {
    setActionNaturalSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const handleActionModalSubmit = () => {
    actionForm.validateFields().then(values => {
      let stepTexts = [];
      if (actionInputMode === 'structured') {
        stepTexts = actionSteps.map(s => {
          const sFrame = s.startFrame ?? 0;
          const eFrame = s.endFrame ?? (sFrame + 300);
          return enableFrameRange 
            ? `${s.arm} ${s.skill} ${s.object} (${s.goal}) [${sFrame} - ${eFrame} 帧]`
            : `${s.arm} ${s.skill} ${s.object} (${s.goal})`;
        });
      } else {
        stepTexts = actionNaturalSteps.map((s, idx) => {
          const sFrame = s.startFrame ?? 0;
          const eFrame = s.endFrame ?? (sFrame + 300);
          const txt = s.text || `步骤 ${idx + 1}`;
          return enableFrameRange ? `${txt} [${sFrame} - ${eFrame} 帧]` : txt;
        });
      }

      if (stepTexts.length === 0) {
        message.error('动作步骤序列不能为空！');
        return;
      }

      const newTemplate = {
        key: 'act_user_' + Date.now(),
        name: values.name,
        desc: values.desc || '',
        type: values.type || '服务数据',
        device: values.device || 'galbot',
        stepFormat: actionInputMode, // 'structured' | 'natural'
        stepType: actionInputMode === 'structured' ? '结构化步骤' : '自然语言',
        enableFrameRange: enableFrameRange,
        stepCount: stepTexts.length,
        steps: stepTexts,
        structuredSteps: actionInputMode === 'structured' ? actionSteps : [],
        naturalSteps: actionInputMode === 'natural' ? actionNaturalSteps : []
      };

      const updated = [...actionTemplates, newTemplate];
      setActionTemplates(updated);
      localStorage.setItem('embodied_action_templates', JSON.stringify(updated));

      message.success(`已成功创建【${newTemplate.stepType}】动作模板！`);
      setIsActionModalOpen(false);
      actionForm.resetFields();
    });
  };

  // 加载已保存标注模版
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('embodied_anno_templates');
      if (saved) {
        try {
          setAnnoTemplates(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setAnnoTemplates(defaultAnnoTemplates);
        localStorage.setItem('embodied_anno_templates', JSON.stringify(defaultAnnoTemplates));
      }
    }
  }, [activeTab]);

  // 加载已保存动作模版
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('embodied_action_templates');
      if (saved) {
        try {
          setActionTemplates(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setActionTemplates(defaultActionTemplates);
        localStorage.setItem('embodied_action_templates', JSON.stringify(defaultActionTemplates));
      }
    }
  }, [activeTab]);

  const handleDeleteAnnoTemplate = (id, name) => {
    modal.confirm({
      title: '确定删除该标注模版吗？',
      content: `删除后，标注工作台将无法在批量标注中套用此模版。此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const updated = annoTemplates.filter(t => t.id !== id);
        setAnnoTemplates(updated);
        localStorage.setItem('embodied_anno_templates', JSON.stringify(updated));
        message.success(`标注模版「${name}」已删除`);
      }
    });
  };

  const handleDeleteActionTemplate = (id, name) => {
    modal.confirm({
      title: '确定删除该动作模版吗？',
      content: `删除后，新建任务模版时将无法再选择该模版。此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const updated = actionTemplates.filter(t => t.key !== id);
        setActionTemplates(updated);
        localStorage.setItem('embodied_action_templates', JSON.stringify(updated));
        message.success(`动作模版「${name}」已删除`);
      }
    });
  };

  const mockTemplates = [
    {
      key: '1',
      name: '桌面整理',
      desc: '书籍、收纳盒、垃圾清理等桌面物品整理任务',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      icon: <ShoppingOutlined />,
      bgColor: '#e6f4ff',
      iconColor: '#1677ff'
    },
    {
      key: '2',
      name: '衣物折叠',
      desc: '叠牛仔裤等柔性物体折叠操作，步骤多、精度高',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      icon: <SkinOutlined />,
      bgColor: '#f0f5ff',
      iconColor: '#2f54eb'
    },
    {
      key: '3',
      name: '物品分拣',
      desc: '分拣物品、电子产品，按类别放入对应区域',
      type: '工业数据',
      device: 'galbot_2.2_R',
      icon: <LayoutOutlined />,
      bgColor: '#fff7e6',
      iconColor: '#fa8c16'
    },
    {
      key: '4',
      name: '工业组装',
      desc: '组装管道支架等精密组装任务，需高精度对准',
      type: '工业数据',
      device: 'galbot_2.2_R',
      icon: <ToolOutlined />,
      bgColor: '#fff1f0',
      iconColor: '#f5222d'
    },
    {
      key: '5',
      name: '零售商品操作',
      desc: '零售薄饼、绿茶、茶里王等商品的货架操作',
      type: '零售数据',
      device: 'galbot_2.2_RGB',
      icon: <ExperimentOutlined />,
      bgColor: '#f6ffed',
      iconColor: '#52c41a'
    },
    {
      key: '6',
      name: '清洁操作',
      desc: '清理台面垃圾等非结构化目标清洁任务',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      icon: <RestOutlined />,
      bgColor: '#f9f0ff',
      iconColor: '#722ed1'
    }
  ];

  // 1. Task Template Filter Logic
  const filteredTaskTemplates = mockTemplates.filter(tpl => {
    const matchText = !taskSearchText || 
      tpl.name.toLowerCase().includes(taskSearchText.toLowerCase()) || 
      (tpl.desc && tpl.desc.toLowerCase().includes(taskSearchText.toLowerCase())) ||
      (tpl.code && tpl.code.toLowerCase().includes(taskSearchText.toLowerCase()));
    
    const matchType = taskFilterType === 'all' || 
      (taskFilterType === 'service' && tpl.type === '服务数据') ||
      (taskFilterType === 'industry' && tpl.type === '工业数据') ||
      (taskFilterType === 'retail' && tpl.type === '零售数据');

    const matchDevice = taskFilterDevice === 'all' || 
      (tpl.device && tpl.device.toLowerCase().includes(taskFilterDevice.toLowerCase()));

    const matchQuick = taskQuickCategory === 'all' ||
      (taskQuickCategory === 'service' && tpl.type === '服务数据') ||
      (taskQuickCategory === 'industry' && tpl.type === '工业数据') ||
      (taskQuickCategory === 'retail' && tpl.type === '零售数据');

    return matchText && matchType && matchDevice && matchQuick;
  });

  // 2. Action Template Filter Logic
  const filteredActionTemplates = actionTemplates.filter(tpl => {
    const matchText = !actionSearchText || 
      (tpl.name && tpl.name.toLowerCase().includes(actionSearchText.toLowerCase())) || 
      (tpl.desc && tpl.desc.toLowerCase().includes(actionSearchText.toLowerCase())) ||
      (tpl.steps && tpl.steps.some(s => typeof s === 'string' && s.toLowerCase().includes(actionSearchText.toLowerCase())));
    
    const matchFormat = actionFilterFormat === 'all' || 
      (tpl.stepFormat === actionFilterFormat) || 
      (!tpl.stepFormat && actionFilterFormat === 'structured');

    const matchDevice = actionFilterDevice === 'all' ||
      (tpl.device && tpl.device.toLowerCase().includes(actionFilterDevice.toLowerCase()));

    const matchType = actionFilterType === 'all' || tpl.type === actionFilterType;

    const count = tpl.stepCount || tpl.steps?.length || 0;
    const matchStepRange = actionFilterStepRange === 'all' ||
      (actionFilterStepRange === '1-3' && count <= 3) ||
      (actionFilterStepRange === '4-6' && count >= 4 && count <= 6) ||
      (actionFilterStepRange === '7+' && count >= 7);

    const matchQuick = actionQuickCategory === 'all' ||
      (actionQuickCategory === 'structured' && (tpl.stepFormat === 'structured' || tpl.stepType === '结构化步骤')) ||
      (actionQuickCategory === 'natural' && (tpl.stepFormat === 'natural' || tpl.stepType === '自然语言')) ||
      (actionQuickCategory === 'dual' && (tpl.device || '').toLowerCase().includes('galbot') || (tpl.device || '').includes('双臂')) ||
      (actionQuickCategory === 'single' && (tpl.device || '').toLowerCase().includes('air') || (tpl.device || '').includes('单臂')) ||
      (actionQuickCategory === 'industry' && tpl.type === '工业数据') ||
      (actionQuickCategory === 'service' && tpl.type === '服务数据');

    return matchText && matchFormat && matchDevice && matchType && matchStepRange && matchQuick;
  });

  // 3. Annotation Template Filter Logic
  const filteredAnnoTemplates = annoTemplates.filter(tpl => {
    const matchText = !annoSearchText ||
      (tpl.name && tpl.name.toLowerCase().includes(annoSearchText.toLowerCase())) ||
      (tpl.desc && tpl.desc.toLowerCase().includes(annoSearchText.toLowerCase())) ||
      (tpl.steps && tpl.steps.some(s => (s.text || '').toLowerCase().includes(annoSearchText.toLowerCase())));

    const count = tpl.stepCount || tpl.steps?.length || 0;
    const matchStepRange = annoFilterStepRange === 'all' ||
      (annoFilterStepRange === '1-4' && count <= 4) ||
      (annoFilterStepRange === '5-8' && count >= 5 && count <= 8) ||
      (annoFilterStepRange === '9+' && count >= 9);

    const matchSource = annoFilterSource === 'all' ||
      (annoFilterSource === 'system' && tpl.creator === '系统内置') ||
      (annoFilterSource === 'user' && tpl.creator !== '系统内置');

    const matchQuick = annoQuickCategory === 'all' ||
      (annoQuickCategory === 'system' && tpl.creator === '系统内置') ||
      (annoQuickCategory === 'user' && tpl.creator !== '系统内置') ||
      (annoQuickCategory === 'service' && tpl.category === 'service') ||
      (annoQuickCategory === 'industry' && tpl.category === 'industry') ||
      (annoQuickCategory === 'retail' && tpl.category === 'retail');

    return matchText && matchStepRange && matchSource && matchQuick;
  });

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="模板中心"
          description="统一管理任务模板、动作 SOP 模板与已审核的标注样例。"
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '模板中心' }]}
        />

      {/* Tab 分类切换 */}
      <Card className="ui-table-card" styles={{ body: { padding: '0 16px' } }} style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'task', label: `任务模版 (${filteredTaskTemplates.length}/${mockTemplates.length})` },
            { key: 'action', label: `动作模版 (${filteredActionTemplates.length}/${actionTemplates.length})` },
            { key: 'annotation', label: `标注模版 (${filteredAnnoTemplates.length}/${annoTemplates.length})` }
          ]}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </Card>

      {/* ========================================================
          TAB 1: 任务模版 (Task Templates)
          ======================================================== */}
      {activeTab === 'task' && (
        <>
          <FilterPanel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Quick Tag Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>场景分类:</span>
                {[
                  { key: 'all', label: '全部场景' },
                  { key: 'service', label: '🤖 服务数据' },
                  { key: 'industry', label: '🏭 工业数据' },
                  { key: 'retail', label: '🏪 零售数据' }
                ].map(cat => (
                  <Tag.CheckableTag
                    key={cat.key}
                    checked={taskQuickCategory === cat.key}
                    onChange={() => {
                      setTaskQuickCategory(cat.key);
                      setTaskFilterType(cat.key);
                    }}
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 4,
                      background: taskQuickCategory === cat.key ? '#1677ff' : '#f1f5f9',
                      color: taskQuickCategory === cat.key ? '#fff' : '#475569',
                      border: '1px solid ' + (taskQuickCategory === cat.key ? '#1677ff' : '#cbd5e1')
                    }}
                  >
                    {cat.label}
                  </Tag.CheckableTag>
                ))}
              </div>

              {/* Form Filter Row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input 
                  placeholder="搜索任务模板名称、编码或描述..." 
                  value={taskSearchText}
                  onChange={e => setTaskSearchText(e.target.value)}
                  style={{ width: 260 }} 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  allowClear 
                />
                <Select 
                  placeholder="数据类型" 
                  value={taskFilterType}
                  onChange={v => {
                    setTaskFilterType(v);
                    setTaskQuickCategory(v);
                  }}
                  style={{ width: 140 }} 
                  options={[
                    { label: '全部类型', value: 'all' },
                    { label: '🤖 服务数据', value: 'service' },
                    { label: '🏭 工业数据', value: 'industry' },
                    { label: '🏪 零售数据', value: 'retail' }
                  ]} 
                />
                <Select 
                  placeholder="适配硬件" 
                  value={taskFilterDevice}
                  onChange={setTaskFilterDevice}
                  style={{ width: 150 }} 
                  options={[
                    { label: '全部硬件设备', value: 'all' },
                    { label: 'Galbot (RGB相机)', value: 'galbot' },
                    { label: 'Air-SN (遥操臂)', value: 'air' }
                  ]} 
                />
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => { 
                    setTaskSearchText(''); 
                    setTaskFilterType('all'); 
                    setTaskFilterDevice('all'); 
                    setTaskQuickCategory('all'); 
                  }}
                >
                  重置
                </Button>
              </div>
            </div>
          </FilterPanel>

          <TableToolbar 
            title="任务模板" 
            count={filteredTaskTemplates.length} 
            actions={[
              <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/templates/create')}>
                新建任务模板
              </Button>
            ]}
          />

          <Row gutter={[16, 16]}>
            {filteredTaskTemplates.map((tpl) => (
              <Col span={8} key={tpl.key}>
                <Card 
                  hoverable 
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div style={{ padding: '24px 24px 16px' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <Avatar 
                        shape="square" 
                        size={48} 
                        style={{ 
                          background: tpl.type === '服务数据' ? '#e6f4ff' : tpl.type === '工业数据' ? '#fff7e6' : '#f6ffed', 
                          color: tpl.type === '服务数据' ? '#1677ff' : tpl.type === '工业数据' ? '#fa8c16' : '#52c41a',
                          borderRadius: 8,
                          fontSize: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {tpl.type === '服务数据' ? <RobotOutlined /> : <AppstoreOutlined />}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text strong style={{ fontSize: 16, color: '#1f1f1f' }} ellipsis={{ tooltip: tpl.name }}>
                            {tpl.name}
                          </Text>
                          <Tag color={tpl.type === '服务数据' ? 'blue' : tpl.type === '工业数据' ? 'orange' : 'green'} style={{ margin: 0, borderRadius: 4 }}>
                            {tpl.type}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>编码: TPL-2026-0{tpl.key}</Text>
                      </div>
                    </div>

                    <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16, height: 40 }} ellipsis={{ rows: 2, tooltip: tpl.desc }}>
                      {tpl.desc}
                    </Paragraph>

                    <div style={{ background: '#fafafa', padding: '12px', borderRadius: 6, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>适配硬件:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 500 }}>{tpl.device}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>默认采集模式:</Text>
                        <Tag color="geekblue" style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>双目RGB-D + 关节遥操</Tag>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#8c8c8c', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                      <span>创建人: 系统管理员</span>
                      <span>2026-08-15</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    borderTop: '1px solid #f0f0f0', 
                    background: '#fafafa'
                  }}>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '10px 0', cursor: 'pointer' }}
                      className="hover-action"
                      onClick={() => router.push(`/collection/templates/create?edit=${tpl.key}`)}
                    >
                      <Space size={4}>
                        <EditOutlined style={{ fontSize: 13, color: '#595959' }} />
                        <span style={{ fontSize: 12, color: '#595959' }}>编辑</span>
                      </Space>
                    </div>
                    <div style={{ width: 1, background: '#f0f0f0' }} />
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '10px 0', cursor: 'pointer' }}
                      className="hover-action"
                      onClick={() => router.push('/collection/collection-tasks/create')}
                    >
                      <Space size={4}>
                        <CopyOutlined style={{ fontSize: 13, color: '#595959' }} />
                        <span style={{ fontSize: 12, color: '#595959' }}>基于此创建任务</span>
                      </Space>
                    </div>
                    <div style={{ width: 1, background: '#f0f0f0' }} />
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '10px 0', cursor: 'pointer' }}
                      className="hover-action"
                      onClick={() => {
                        Modal.confirm({
                          title: `确定删除任务模版「${tpl.name}」吗？`,
                          onOk: () => message.success(`任务模版「${tpl.name}」已删除`)
                        });
                      }}
                    >
                      <Space size={4}>
                        <DeleteOutlined style={{ fontSize: 13, color: '#ff4d4f' }} />
                        <span style={{ fontSize: 12, color: '#ff4d4f' }}>删除</span>
                      </Space>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* ========================================================
          TAB 2: 动作模版 (Action Templates)
          ======================================================== */}
      {activeTab === 'action' && (
        <>
          <FilterPanel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Quick Checkable Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>快速分类:</span>
                {[
                  { key: 'all', label: '全部模版' },
                  { key: 'structured', label: '🔵 结构化四元组' },
                  { key: 'natural', label: '🟢 自然语言Prompt' },
                  { key: 'dual', label: '🤖 双臂协同' },
                  { key: 'single', label: '🦾 单臂遥操' },
                  { key: 'industry', label: '📦 工业包装/装配' },
                  { key: 'service', label: '🍽️ 服务整理/清洁' }
                ].map(cat => (
                  <Tag.CheckableTag
                    key={cat.key}
                    checked={actionQuickCategory === cat.key}
                    onChange={() => {
                      setActionQuickCategory(cat.key);
                      if (cat.key === 'structured' || cat.key === 'natural') {
                        setActionFilterFormat(cat.key);
                      } else if (cat.key === 'dual') {
                        setActionFilterDevice('galbot');
                      } else if (cat.key === 'single') {
                        setActionFilterDevice('air');
                      } else if (cat.key === 'industry') {
                        setActionFilterType('工业数据');
                      } else if (cat.key === 'service') {
                        setActionFilterType('服务数据');
                      } else {
                        setActionFilterFormat('all');
                        setActionFilterDevice('all');
                        setActionFilterType('all');
                      }
                    }}
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 4,
                      background: actionQuickCategory === cat.key ? '#1677ff' : '#f1f5f9',
                      color: actionQuickCategory === cat.key ? '#fff' : '#475569',
                      border: '1px solid ' + (actionQuickCategory === cat.key ? '#1677ff' : '#cbd5e1')
                    }}
                  >
                    {cat.label}
                  </Tag.CheckableTag>
                ))}
              </div>

              {/* Input Filters */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input 
                  placeholder="搜索动作模版名称、描述、步骤关键词..." 
                  value={actionSearchText}
                  onChange={e => setActionSearchText(e.target.value)}
                  style={{ width: 250 }} 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  allowClear 
                />
                <Select 
                  value={actionFilterFormat}
                  onChange={setActionFilterFormat}
                  style={{ width: 150 }}
                  options={[
                    { value: 'all', label: '全部步骤模式' },
                    { value: 'structured', label: '🔵 结构化步骤' },
                    { value: 'natural', label: '🟢 自然语言Prompt' }
                  ]}
                />
                <Select 
                  value={actionFilterDevice}
                  onChange={setActionFilterDevice}
                  style={{ width: 140 }}
                  options={[
                    { value: 'all', label: '全部适配设备' },
                    { value: 'galbot', label: 'Galbot (双臂)' },
                    { value: 'air', label: 'Air-SN (单臂)' },
                    { value: 'luming', label: '鹿鸣机器人' }
                  ]}
                />
                <Select 
                  value={actionFilterType}
                  onChange={setActionFilterType}
                  style={{ width: 130 }}
                  options={[
                    { value: 'all', label: '全部业务场景' },
                    { value: '工业数据', label: '🏭 工业数据' },
                    { value: '服务数据', label: '🤖 服务数据' },
                    { value: '零售数据', label: '🏪 零售数据' }
                  ]}
                />
                <Select 
                  value={actionFilterStepRange}
                  onChange={setActionFilterStepRange}
                  style={{ width: 130 }}
                  options={[
                    { value: 'all', label: '全部工步数' },
                    { value: '1-3', label: '1~3 步 (简单)' },
                    { value: '4-6', label: '4~6 步 (标准)' },
                    { value: '7+', label: '7 步以上 (复杂)' }
                  ]}
                />
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => { 
                    setActionSearchText(''); 
                    setActionFilterFormat('all'); 
                    setActionFilterDevice('all'); 
                    setActionFilterType('all'); 
                    setActionFilterStepRange('all'); 
                    setActionQuickCategory('all'); 
                  }}
                >
                  重置
                </Button>
              </div>
            </div>
          </FilterPanel>

          <TableToolbar 
            title="动作模板" 
            count={filteredActionTemplates.length} 
            actions={[
              <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setIsActionModalOpen(true)}>
                新建动作模版
              </Button>
            ]}
          />

          <Row gutter={[16, 16]}>
            {filteredActionTemplates.map((tpl) => {
              const isNatural = tpl.stepFormat === 'natural' || tpl.stepType === '自然语言';
              return (
                <Col span={8} key={tpl.key}>
                  <Card 
                    hoverable
                    style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
                  >
                    <div style={{ padding: '20px 20px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <Title level={5} style={{ margin: 0, fontSize: 15, color: '#1e293b', flex: 1, paddingRight: 8 }} ellipsis={{ tooltip: tpl.name }}>
                          {tpl.name}
                        </Title>
                        <Tag color={tpl.type === '工业数据' ? 'gold' : tpl.type === '服务数据' ? 'purple' : 'green'} style={{ margin: 0 }}>
                          {tpl.type}
                        </Tag>
                      </div>

                      {/* Description */}
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', minHeight: 36, marginBottom: 10, lineHeight: 1.5 }}>
                        {tpl.desc}
                      </Text>

                      {/* Metadata Tags */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {isNatural ? (
                          <Tag color="cyan" icon={<EditOutlined />} style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                            自然语言Prompt
                          </Tag>
                        ) : (
                          <Tag color="blue" icon={<UnorderedListOutlined />} style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                            结构化四元组
                          </Tag>
                        )}
                        <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>步骤数: {tpl.stepCount || tpl.steps?.length}</Tag>
                        <Tag style={{ margin: 0, fontSize: 11 }}>设备: {tpl.device}</Tag>
                      </div>

                      <Divider style={{ margin: '6px 0 10px 0' }} />

                      {/* SOP Sequence preview */}
                      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text strong style={{ fontSize: 11, color: '#475569' }}>
                            预设SOP动作序列流程：
                          </Text>
                          <span style={{ fontSize: 10, color: isNatural ? '#0891b2' : '#2563eb', fontWeight: 600 }}>
                            {isNatural ? '自然语言文本' : '四元组拆解'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, background: isNatural ? '#f0fdfa' : '#f8fafc', padding: 8, borderRadius: 6, border: `1px solid ${isNatural ? '#ccfbf1' : '#f1f5f9'}`, height: 96, overflowY: 'auto' }}>
                          {tpl.steps.map((st, idx) => {
                            const startFrame = idx === 0 ? 0 : (idx * 301);
                            const endFrame = (idx + 1) * 300;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 11, padding: '1px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: isNatural ? '#0d9488' : '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', flexShrink: 0 }}>
                                    {idx + 1}
                                  </span>
                                  <span style={{ color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st}</span>
                                </div>
                                {!isNatural && (
                                  <Tag color="blue" style={{ margin: 0, fontSize: 10, flexShrink: 0, padding: '0 4px', lineHeight: '16px' }}>
                                    {startFrame}-{endFrame}帧
                                  </Tag>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div style={{ 
                      display: 'flex', 
                      borderTop: '1px solid #f0f0f0', 
                      background: '#fafafa'
                    }}>
                      <div 
                        style={{ flex: 1, textAlign: 'center', padding: '10px 0', cursor: 'pointer', borderRight: '1px solid #f0f0f0' }}
                        className="hover-action"
                        onClick={() => {
                          setSelectedActionDetail(tpl);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Space size={4}>
                          <FullscreenOutlined style={{ fontSize: 12, color: '#1677ff' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>查看详情</Text>
                        </Space>
                      </div>
                      <div 
                        style={{ flex: 1, textAlign: 'center', padding: '10px 0', cursor: 'pointer' }}
                        className="hover-action"
                        onClick={() => handleDeleteActionTemplate(tpl.key, tpl.name)}
                      >
                        <Text style={{ fontSize: 12, color: '#ff4d4f' }}>删除</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}

      {/* ========================================================
          TAB 3: 标注模版 (Annotation Templates)
          ======================================================== */}
      {activeTab === 'annotation' && (
        <div>
          <FilterPanel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Quick Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>快速分类:</span>
                {[
                  { key: 'all', label: '全部模版' },
                  { key: 'system', label: '⭐ 系统内置SOP' },
                  { key: 'user', label: '📋 工作台生成' },
                  { key: 'service', label: '🍽️ 餐饮收拾' },
                  { key: 'industry', label: '📦 工业装配' },
                  { key: 'retail', label: '🍎 零售生鲜' }
                ].map(cat => (
                  <Tag.CheckableTag
                    key={cat.key}
                    checked={annoQuickCategory === cat.key}
                    onChange={() => {
                      setAnnoQuickCategory(cat.key);
                      if (cat.key === 'system' || cat.key === 'user') {
                        setAnnoFilterSource(cat.key);
                      } else {
                        setAnnoFilterSource('all');
                      }
                    }}
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 4,
                      background: annoQuickCategory === cat.key ? '#1677ff' : '#f1f5f9',
                      color: annoQuickCategory === cat.key ? '#fff' : '#475569',
                      border: '1px solid ' + (annoQuickCategory === cat.key ? '#1677ff' : '#cbd5e1')
                    }}
                  >
                    {cat.label}
                  </Tag.CheckableTag>
                ))}
              </div>

              {/* Form Input Filters */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input 
                  placeholder="搜索标注模版名称、描述、已封存步骤..." 
                  value={annoSearchText}
                  onChange={e => setAnnoSearchText(e.target.value)}
                  style={{ width: 280 }} 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  allowClear 
                />
                <Select 
                  value={annoFilterStepRange}
                  onChange={setAnnoFilterStepRange}
                  style={{ width: 140 }}
                  options={[
                    { value: 'all', label: '全部动作段数' },
                    { value: '1-4', label: '1~4 段 (短序列)' },
                    { value: '5-8', label: '5~8 段 (中序列)' },
                    { value: '9+', label: '9 段及以上 (长序列)' }
                  ]}
                />
                <Select 
                  value={annoFilterSource}
                  onChange={v => {
                    setAnnoFilterSource(v);
                    setAnnoQuickCategory(v);
                  }}
                  style={{ width: 150 }}
                  options={[
                    { value: 'all', label: '全部模版来源' },
                    { value: 'system', label: '⭐ 系统内置SOP' },
                    { value: 'user', label: '📋 标注工作台生成' }
                  ]}
                />
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => { 
                    setAnnoSearchText(''); 
                    setAnnoFilterStepRange('all'); 
                    setAnnoFilterSource('all'); 
                    setAnnoQuickCategory('all'); 
                  }}
                >
                  重置
                </Button>
              </div>
            </div>
          </FilterPanel>

          <TableToolbar title="标注模板" count={filteredAnnoTemplates.length} />

          {filteredAnnoTemplates.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <FolderOpenOutlined style={{ fontSize: 40, color: '#94a3b8', marginBottom: 12 }} />
              <Title level={5} style={{ margin: 0, color: '#64748b' }}>未找到匹配的标注模版</Title>
              <Text type="secondary" style={{ fontSize: 13, marginTop: 6, display: 'block' }}>
                请调整上方筛选条件，或在“标注工作台”完成标注后点击“生成标注模版”。
              </Text>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredAnnoTemplates.map((tpl) => (
                <Col span={12} key={tpl.id}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Text strong style={{ fontSize: 14 }}>{tpl.name}</Text>
                        <Button 
                          type="text" 
                          danger 
                          size="small" 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteAnnoTemplate(tpl.id, tpl.name)}
                        >
                          删除模版
                        </Button>
                      </div>
                    }
                    style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    styles={{ body: { height: 220, display: 'flex', flexDirection: 'column' } }}
                  >
                    <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b', minHeight: 20 }}>{tpl.desc}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <Tag color={tpl.creator === '系统内置' ? 'gold' : 'cyan'}>
                        {tpl.creator === '系统内置' ? '⭐ 系统内置SOP' : '📋 标注员生成'}
                      </Tag>
                      <Tag color="blue">动作数: {tpl.stepCount}</Tag>
                      <Tag color="purple">总长: {tpl.totalFrames}帧</Tag>
                      <Tag color="orange">创建时间: {tpl.createTime}</Tag>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Text strong style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 8, flexShrink: 0 }}>已封存动作帧区间数据：</Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#ecfdf5', padding: 12, borderRadius: 8, border: '1px solid #d1fae5', flex: 1, overflowY: 'auto' }}>
                        {tpl.steps.map((st, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', flexShrink: 0 }}>
                                {idx + 1}
                              </span>
                              <span style={{ color: '#065f46', fontWeight: 500 }}>{st.text}</span>
                            </div>
                            <Tag color="emerald" style={{ margin: 0, background: '#10b981', color: '#fff', border: 'none', fontSize: 11, flexShrink: 0 }}>
                              {st.startFrame} - {st.endFrame} 帧
                            </Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}

      {/* Create Action Template Modal matching the exact user UI in a single dialog */}
      <Modal
        title={
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            新建动作模版
          </span>
        }
        open={isActionModalOpen}
        onCancel={() => {
          setIsActionModalOpen(false);
          actionForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsActionModalOpen(false)} style={{ width: 80 }}>
            取 消
          </Button>,
          <Button key="submit" type="primary" onClick={handleActionModalSubmit} style={{ width: 80, background: '#1677ff' }}>
            保 存
          </Button>
        ]}
        width={920}
        destroyOnClose
      >
        <Form 
          form={actionForm} 
          layout="vertical" 
          initialValues={{ device: 'galbot', type: '服务数据' }}
          style={{ marginTop: 16 }}
        >
          {/* Row 1: Name and Device (Exact match to screenshot) */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 500 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>模版名称</span>} 
                name="name" 
                rules={[{ required: true, message: '请输入模版名称' }]} 
                style={{ marginBottom: 18 }}
              >
                <Input placeholder="例如：工业纸箱打包封装与装箱模版" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 500 }}>适配设备</span>} 
                name="device" 
                style={{ marginBottom: 18 }}
              >
                <Select 
                  placeholder="请下拉选择设备" 
                  value={modalDevice}
                  onChange={(v) => setModalDevice(v)}
                  options={[
                    { value: 'galbot', label: 'Galbot (银河机器人 / 单双臂)' },
                    { value: 'franka_fr3', label: 'Franka FR3 (桌面机械臂)' },
                    { value: '鹿鸣', label: '鹿鸣 (时序抽检设备)' },
                    { value: 'xinsong', label: '新松工业机械臂' }
                  ]} 
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: Description */}
          <Form.Item 
            label={<span style={{ fontWeight: 500 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>模版描述</span>} 
            name="desc" 
            rules={[{ required: true, message: '请输入模版描述' }]}
            style={{ marginBottom: 20 }}
          >
            <Input.TextArea 
              rows={3} 
              maxLength={200} 
              showCount 
              placeholder="简要说明此动作模版的适用场景..." 
            />
          </Form.Item>

          {/* Row 3: Action Steps Header with Frame Switch and Step Mode Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16,
            paddingTop: 8,
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>*</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>动作步骤</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>（请先选择步骤模式）</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Preset Frame Range Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, color: '#334155' }}>预设帧区间</span>
                <Switch 
                  size="small" 
                  checked={enableFrameRange} 
                  onChange={(checked) => {
                    setEnableFrameRange(checked);
                    message.info(`已${checked ? '开启' : '关闭'}预设帧区间`);
                  }} 
                />
              </div>

              {/* Step Mode Buttons Toggle (Select Mode First) */}
              <Radio.Group 
                value={actionInputMode} 
                onChange={(e) => setActionInputMode(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="structured" style={{ borderRadius: '6px 0 0 6px' }}>
                  <Space size={4}>
                    <UnorderedListOutlined />
                    <span>结构化步骤</span>
                  </Space>
                </Radio.Button>
                <Radio.Button value="natural" style={{ borderRadius: '0 6px 6px 0' }}>
                  <Space size={4}>
                    <EditOutlined />
                    <span>自然语言描述</span>
                  </Space>
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>

          {/* Steps List */}
          <div style={{ marginBottom: 16 }}>
            {actionInputMode === 'natural' ? (
              /* View A: Natural Language Step Rows (Exact match to screenshot) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                {actionNaturalSteps.map((item, index) => (
                  <div 
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                    }}
                  >
                    {/* Blue Round Badge */}
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#1677ff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 12,
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>

                    {/* Step Natural Description Input */}
                    <Input 
                      placeholder="例如：展开纸箱并封底"
                      value={item.text}
                      onChange={(e) => updateActionNaturalStepField(item.key, 'text', e.target.value)}
                      style={{ flex: 1 }}
                    />

                    {/* Frame Range (if switch is active) */}
                    {enableFrameRange && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>帧数区间:</span>
                        <InputNumber 
                          value={item.startFrame ?? 0} 
                          onChange={(val) => updateActionNaturalStepField(item.key, 'startFrame', val ?? 0)}
                          min={0}
                          style={{ width: 75 }}
                        />
                        <span style={{ color: '#94a3b8' }}>-</span>
                        <InputNumber 
                          value={item.endFrame ?? 300} 
                          onChange={(val) => updateActionNaturalStepField(item.key, 'endFrame', val ?? 300)}
                          min={0}
                          style={{ width: 75 }}
                        />
                      </div>
                    )}

                    {/* Delete Link */}
                    <Button 
                      type="link" 
                      danger 
                      size="small"
                      disabled={actionNaturalSteps.length <= 1}
                      onClick={() => removeActionStep(item.key)}
                      style={{ padding: '0 4px', fontSize: 13 }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              /* View B: Structured 4-Tuple Step Rows */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                {actionSteps.map((item, index) => (
                  <div 
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                    }}
                  >
                    {/* Blue Round Badge */}
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#1677ff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 12,
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>

                    {/* Dropdowns row */}
                    <div style={{ flex: 1 }}>
                      <Row gutter={[8, 8]}>
                        <Col span={enableFrameRange ? 5 : 6}>
                          <Select 
                            value={item.arm} 
                            placeholder="执行末端"
                            onChange={(val) => updateActionStepField(item.key, 'arm', val)}
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="右手 (Right Arm)">右手 (Right Arm)</Select.Option>
                            <Select.Option value="左手 (Left Arm)">左手 (Left Arm)</Select.Option>
                            <Select.Option value="双手 (Dual Arms)">双手 (Dual Arms)</Select.Option>
                            <Select.Option value="底盘 (Base)">底盘 (Base)</Select.Option>
                            <Select.Option value="相机 (Camera)">相机 (Camera)</Select.Option>
                          </Select>
                        </Col>

                        <Col span={enableFrameRange ? 4 : 6}>
                          <Select 
                            value={item.skill} 
                            placeholder="原子技能"
                            onChange={(val) => updateActionStepField(item.key, 'skill', val)}
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="识别">识别</Select.Option>
                            <Select.Option value="靠近">靠近</Select.Option>
                            <Select.Option value="抓取">抓取</Select.Option>
                            <Select.Option value="放置">放置</Select.Option>
                            <Select.Option value="旋转">旋转</Select.Option>
                            <Select.Option value="对准">对准</Select.Option>
                            <Select.Option value="展开">展开</Select.Option>
                            <Select.Option value="折叠">折叠</Select.Option>
                            <Select.Option value="封箱">封箱</Select.Option>
                            <Select.Option value="松开">松开</Select.Option>
                          </Select>
                        </Col>

                        <Col span={enableFrameRange ? 5 : 6}>
                          <Select 
                            value={item.object} 
                            placeholder="操作对象"
                            onChange={(val) => updateActionStepField(item.key, 'object', val)}
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="目标物品">目标物品</Select.Option>
                            <Select.Option value="纸箱">纸箱</Select.Option>
                            <Select.Option value="泡沫垫">泡沫垫</Select.Option>
                            <Select.Option value="工厂部件">工厂部件</Select.Option>
                            <Select.Option value="箱盖">箱盖</Select.Option>
                            <Select.Option value="胶带机">胶带机</Select.Option>
                            <Select.Option value="餐盘">餐盘</Select.Option>
                            <Select.Option value="抽屉">抽屉</Select.Option>
                            <Select.Option value="门把手">门把手</Select.Option>
                          </Select>
                        </Col>

                        <Col span={enableFrameRange ? 5 : 6}>
                          <Select 
                            value={item.goal} 
                            placeholder="操作目标"
                            onChange={(val) => updateActionStepField(item.key, 'goal', val)}
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="确认位置">确认位置</Select.Option>
                            <Select.Option value="避障靠近">避障靠近</Select.Option>
                            <Select.Option value="牢固夹紧">牢固夹紧</Select.Option>
                            <Select.Option value="稳定装箱">稳定装箱</Select.Option>
                            <Select.Option value="封底定位">封底定位</Select.Option>
                            <Select.Option value="合拢定位">合拢定位</Select.Option>
                            <Select.Option value="顶部密封">顶部密封</Select.Option>
                            <Select.Option value="平稳入框">平稳入框</Select.Option>
                          </Select>
                        </Col>

                        {enableFrameRange && (
                          <Col span={5}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <InputNumber 
                                value={item.startFrame ?? 0} 
                                onChange={(val) => updateActionStepField(item.key, 'startFrame', val ?? 0)}
                                min={0}
                                style={{ width: '48%' }}
                              />
                              <span style={{ color: '#94a3b8' }}>-</span>
                              <InputNumber 
                                value={item.endFrame ?? 300} 
                                onChange={(val) => updateActionStepField(item.key, 'endFrame', val ?? 300)}
                                min={0}
                                style={{ width: '48%' }}
                              />
                            </div>
                          </Col>
                        )}
                      </Row>
                    </div>

                    {/* Delete Link */}
                    <Button 
                      type="link" 
                      danger 
                      size="small"
                      disabled={actionSteps.length <= 1}
                      onClick={() => removeActionStep(item.key)}
                      style={{ padding: '0 4px', fontSize: 13 }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Wide Dashed Add Button */}
            <Button
              type="dashed"
              block
              onClick={addActionStep}
              style={{
                height: 38,
                marginTop: 12,
                borderRadius: 6,
                color: '#475569',
                borderColor: '#cbd5e1',
                fontSize: 13,
                background: '#ffffff'
              }}
            >
              + 新增步骤
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Action Template Zoom-in Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FullscreenOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>动作模版详情 — {selectedActionDetail?.name}</span>
            {selectedActionDetail && (
              <Tag color={selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? 'cyan' : 'blue'}>
                {selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? '🟢 自然语言模版' : '🔵 结构化步骤模版'}
              </Tag>
            )}
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsDetailModalOpen(false)}>
            关 闭
          </Button>
        ]}
        width={780}
        destroyOnClose
      >
        {selectedActionDetail && (
          <div style={{ padding: '8px 0' }}>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="模版名称" span={2}>
                <Text strong style={{ fontSize: 14, color: '#1e293b' }}>{selectedActionDetail.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="模版步骤格式">
                <Tag color={selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? 'cyan' : 'blue'}>
                  {selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? '自然语言描述' : '结构化步骤'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="数据类型">
                <Tag color={selectedActionDetail.type === '工业数据' ? 'gold' : 'purple'}>{selectedActionDetail.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="适配设备">
                <Tag color="blue">{selectedActionDetail.device}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="动作步骤总数">
                <span style={{ fontWeight: 600, color: '#1677ff' }}>{selectedActionDetail.stepCount || selectedActionDetail.steps?.length} 步</span>
              </Descriptions.Item>
              <Descriptions.Item label="模版描述" span={2}>
                <span style={{ color: '#475569' }}>{selectedActionDetail.desc || '暂无描述'}</span>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ background: selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? '#f0fdfa' : '#f8fafc', padding: '14px 16px', borderRadius: 8, border: `1px solid ${selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? '#ccfbf1' : '#e2e8f0'}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 完整预设 SOP 动作序列流程 ({selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? '自然语言' : '结构化'})</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>支持直接供采集与任务模版套用</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {selectedActionDetail.steps?.map((stepText, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '10px 14px', 
                      background: '#ffffff', 
                      borderRadius: 6, 
                      border: '1px solid #e2e8f0' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? '#0d9488' : '#1677ff', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 'bold', flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{stepText}</span>
                    </div>
                    <Tag color={selectedActionDetail.stepFormat === 'natural' || selectedActionDetail.stepType === '自然语言' ? 'cyan' : 'geekblue'} style={{ margin: 0, fontSize: 11, flexShrink: 0 }}>步骤 {idx + 1}</Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .hover-action:hover {
          background: #f0f0f0;
        }
        .hover-action:hover span {
          color: #1677ff !important;
        }
      `}</style>
      </div>
    </MainLayout>
  );
}
