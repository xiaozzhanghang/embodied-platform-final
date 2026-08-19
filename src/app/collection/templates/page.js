'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Space, Card, Typography, Breadcrumb, Tag, 
  App, Row, Col, Avatar, Tooltip, Input, Divider, Form, Select, Tabs, Radio, Modal, InputNumber
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, LayoutOutlined,
  ShoppingOutlined, ToolOutlined, RestOutlined,
  SkinOutlined, ExperimentOutlined, DeleteOutlined,
  EditOutlined, PlayCircleOutlined, ReloadOutlined, DownOutlined, UpOutlined,
  NodeIndexOutlined, FileTextOutlined, FolderOpenOutlined, UserOutlined, TagOutlined,
  MinusCircleOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { AppModal, FilterPanel, PageHeader, TableToolbar } from '@/components/ui';

const { Title, Text } = Typography;

const defaultAnnoTemplates = [
  {
    id: 'tpl_default_1',
    name: '🍽️ 餐厅餐盘整理标准标注模版',
    desc: '覆盖完整的双臂就餐收拾工序，包含300帧完整动作序列，适配鹿鸣双臂机器人。',
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
  }
];

export default function TaskTemplatesPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState('task');
  const [actionTemplates, setActionTemplates] = useState([]);
  const [annoTemplates, setAnnoTemplates] = useState([]);

  // Modal states for creating action templates
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalDevice, setModalDevice] = useState('galbot');
  const [enableFrameRange, setEnableFrameRange] = useState(false);
  const [actionForm] = Form.useForm();
  const [actionInputMode, setActionInputMode] = useState('structured');
  const [actionSteps, setActionSteps] = useState([
    { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置', startFrame: 0, endFrame: 300 },
    { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近', startFrame: 301, endFrame: 600 },
    { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧', startFrame: 601, endFrame: 900 }
  ]);
  const [actionNaturalText, setActionNaturalText] = useState(
    "1. 右手 (Right Arm) 识别 目标物品 (确认位置)\n2. 右手 (Right Arm) 靠近 目标物品 (避障靠近)\n3. 右手 (Right Arm) 抓取 目标物品 (牢固夹紧)"
  );

  const addActionStep = () => {
    const newKey = (actionSteps.length + 1).toString();
    const lastStep = actionSteps[actionSteps.length - 1];
    const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
    const startF = prevEnd > 0 ? prevEnd + 1 : 0;
    setActionSteps([
      ...actionSteps, 
      { 
        key: newKey, 
        arm: '右手 (Right Arm)', 
        skill: '识别', 
        object: '目标物品', 
        goal: '确认位置',
        startFrame: startF,
        endFrame: startF + 299
      }
    ]);
  };

  const removeActionStep = (key) => {
    setActionSteps(actionSteps.filter(item => item.key !== key));
  };

  const updateActionStepField = (key, field, val) => {
    setActionSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const handleActionModalSubmit = () => {
    actionForm.validateFields().then(values => {
      let stepTexts = [];
      if (actionInputMode === 'structured') {
        stepTexts = actionSteps.map(s => {
          if (enableFrameRange) {
            const sFrame = s.startFrame ?? 0;
            const eFrame = s.endFrame ?? (sFrame + 300);
            return `${s.arm} ${s.skill} ${s.object} (${s.goal}) [${sFrame} - ${eFrame} 帧]`;
          } else {
            return `${s.arm} ${s.skill} ${s.object} (${s.goal})`;
          }
        });
      } else {
        stepTexts = actionNaturalText.split('\n').map(line => line.replace(/^\d+[\.\、\s]*/, '').trim()).filter(Boolean);
      }

      if (stepTexts.length === 0) {
        message.error('动作步骤序列不能为空！');
        return;
      }

      const newTemplate = {
        key: 'act_user_' + Date.now(),
        name: values.name,
        desc: values.desc || '',
        type: '服务数据',
        device: values.device,
        stepCount: stepTexts.length,
        steps: stepTexts
      };

      const updated = [...actionTemplates, newTemplate];
      setActionTemplates(updated);
      localStorage.setItem('embodied_action_templates', JSON.stringify(updated));

      message.success('动作模板创建成功！');
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

  const defaultActionTemplates = [
    {
      key: 'act_1',
      name: '📦 工业纸箱打包封装与装箱模版',
      desc: '标准的工业包装与物流操作，支持结构化技能映射与自然语言描述，包含6个动作步骤。',
      type: '工业数据',
      device: 'galbot',
      stepCount: 6,
      steps: [
        '展开纸箱并封底 (Unfold box and seal bottom)',
        '放入底部泡沫垫 (Place bottom foam pad)',
        '放入工厂部件 (Place factory components)',
        '放入顶部泡沫垫 (Place top foam pad)',
        '折叠合拢箱盖 (Fold box lids)',
        '顶部封箱 (Seal top)'
      ]
    },
    {
      key: 'act_2',
      name: '📚 桌面书籍整理与摆放模版',
      desc: '面向家庭/办公室的服务机器人桌面物品理顺模板，包含4个动作步骤。',
      type: '服务数据',
      device: 'galbot',
      stepCount: 4,
      steps: [
        '右手识别定位目标书籍',
        '右手靠近目标书籍',
        '右手抓取目标书籍',
        '右手平稳放置在目标桌面上'
      ]
    },
    {
      key: 'act_3',
      name: '🍽️ 餐盘清理与协同搬运模版',
      desc: '用于餐饮或居家场景中待收拾的碗盘碟器皿抓取及运送，包含4个操作。',
      type: '服务数据',
      device: '鹿鸣/galbot',
      stepCount: 4,
      steps: [
        '双手识别餐盘位置',
        '双手避障靠近餐盘',
        '双手牢固夹紧抓取',
        '双手平稳放置指定盘区'
      ]
    },
    {
      key: 'act_4',
      name: '🚪 抽屉开关与取物操作模版',
      desc: '操纵滑轨结构体家具，支持左右/上下端手爪交互及微调，包含4个步骤。',
      type: '服务数据',
      device: 'galbot',
      stepCount: 4,
      steps: [
        '右手识别抽屉把手',
        '右手把手贴合对准',
        '右手拉开抽屉',
        '右手松开把手复位'
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="模板中心"
          description="统一管理任务模板、动作 SOP 模板与已审核的标注样例。"
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '模板中心' }]}
          extra={activeTab === 'task'
            ? <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/templates/create')}>创建任务模板</Button>
            : activeTab === 'action'
              ? <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsActionModalOpen(true)}>创建动作模板</Button>
              : null}
        />

      {/* Tab 分类切换 */}
      <Card className="ui-table-card" styles={{ body: { padding: '0 16px' } }} style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'task', label: `任务模版 (${mockTemplates.length})` },
            { key: 'action', label: `动作模版 (${actionTemplates.length})` },
            { key: 'annotation', label: `标注模版 (${annoTemplates.length})` }
          ]}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </Card>

      {activeTab === 'task' && (
        <>
          <FilterPanel>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Input placeholder="搜索模板名称..." style={{ width: 220 }} prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear />
              <Select placeholder="全部类型" style={{ width: 150 }} allowClear options={[{label:'服务数据', value:'service'}, {label:'工业数据', value:'industry'}]} />
              <Input placeholder="创建人" style={{ width: 150 }} allowClear />
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              <Button icon={<ReloadOutlined />}>重置</Button>
            </div>
          </FilterPanel>
          <TableToolbar title="任务模板" count={mockTemplates.length} />

          <Row gutter={[16, 16]}>
            {mockTemplates.map((tpl) => (
              <Col span={8} key={tpl.key}>
                <Card 
                  hoverable 
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div style={{ padding: '24px 24px 16px' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <Avatar 
                        size={48} 
                        icon={tpl.icon} 
                        style={{ backgroundColor: tpl.bgColor, color: tpl.iconColor, flexShrink: 0 }} 
                      />
                      <div>
                        <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 16 }}>{tpl.name}</Title>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', minHeight: 36 }}>
                          {tpl.desc}
                        </Text>
                      </div>
                    </div>
                    
                    <Space size={8}>
                      <Tag color="blue" variant="filled" style={{ fontSize: 11 }}>{tpl.type}</Tag>
                      <Tag variant="filled" style={{ fontSize: 11 }}>{tpl.device}</Tag>
                    </Space>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    borderTop: '1px solid #f0f0f0', 
                    background: '#fafafa'
                  }}>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer', borderRight: '1px solid #f0f0f0' }}
                      className="hover-action"
                      onClick={() => router.push('/collection/tasks/create')}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>在任务中心使用</Text>
                    </div>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer', borderRight: '1px solid #f0f0f0' }}
                      className="hover-action"
                      onClick={() => router.push(`/collection/templates/create?id=${tpl.key}`)}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>编辑</Text>
                    </div>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer' }}
                      className="hover-action"
                      onClick={() => modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>删除</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {activeTab === 'action' && (
        <>
          <FilterPanel>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Input placeholder="搜索动作模板..." style={{ width: 220 }} prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear />
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            </div>
          </FilterPanel>
          <TableToolbar 
            title="动作模板" 
            count={actionTemplates.length} 
            actions={[
              <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setIsActionModalOpen(true)}>
                新建动作模版
              </Button>
            ]}
          />
          <Row gutter={[16, 16]}>
          {actionTemplates.map((tpl) => (
            <Col span={12} key={tpl.key}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text strong style={{ fontSize: 14 }}>{tpl.name}</Text>
                    <Space>
                      <Tag color="purple">{tpl.type}</Tag>
                      {tpl.key.startsWith('act_user_') && (
                        <Button 
                          type="text" 
                          danger 
                          size="small" 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteActionTemplate(tpl.key, tpl.name)} 
                          style={{ padding: '0 4px', height: 'auto' }}
                        />
                      )}
                    </Space>
                  </div>
                }
                style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.01)' }}
                styles={{ body: { height: 220, display: 'flex', flexDirection: 'column' } }}
              >
                <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b', minHeight: 20 }}>{tpl.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Tag color="cyan">步骤数: {tpl.stepCount}</Tag>
                  <Tag>适配设备: {tpl.device}</Tag>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Text strong style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 8, flexShrink: 0 }}>预设SOP动作序列流程：</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9', flex: 1, overflowY: 'auto' }}>
                    {tpl.steps.map((st, idx) => {
                      const startFrame = idx === 0 ? 0 : (idx * 301);
                      const endFrame = (idx + 1) * 300;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '2px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', flexShrink: 0 }}>
                              {idx + 1}
                            </span>
                            <span style={{ color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st}</span>
                          </div>
                          <Tag color="blue" style={{ margin: 0, fontSize: 11, flexShrink: 0, borderRadius: 4, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 'bold' }}>
                            {startFrame} - {endFrame} 帧
                          </Tag>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        </>
      )}

      {activeTab === 'annotation' && (
        <div>
          <TableToolbar title="标注模板" count={annoTemplates.length} />
          {annoTemplates.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <FolderOpenOutlined style={{ fontSize: 40, color: '#94a3b8', marginBottom: 12 }} />
              <Title level={5} style={{ margin: 0, color: '#64748b' }}>暂无自定义标注模版</Title>
              <Text type="secondary" style={{ fontSize: 13, marginTop: 6, display: 'block' }}>
                当标注员在“标注工作台”标完某条具体的动作数据后，可以点击“生成标注模版”按钮，成功后数据即会在此集中展现。
              </Text>
              <Button type="primary" style={{ marginTop: 16 }} onClick={() => router.push('/annotation/audit')}>
                前往标注工作台
              </Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {annoTemplates.map((tpl) => (
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
                      <Tag color="green">标注模版</Tag>
                      <Tag color="blue">动作数: {tpl.stepCount}</Tag>
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

      {/* Create Action Template Modal matching User Screenshot */}
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
          <Button key="cancel" onClick={() => setIsActionModalOpen(false)}>
            取 消
          </Button>,
          <Button key="submit" type="primary" onClick={handleActionModalSubmit}>
            保 存
          </Button>
        ]}
        width={860}
        destroyOnClose
      >
        <Form 
          form={actionForm} 
          layout="vertical" 
          initialValues={{ device: 'galbot' }}
          style={{ marginTop: 16 }}
        >
          {/* Row 1: Name and Device */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 500 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>模板名称</span>} 
                name="name" 
                rules={[{ required: true, message: '请输入模板名称' }]} 
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="例如：工业纸箱打包封装与装箱模版" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 500 }}>适配设备</span>} 
                name="device" 
                style={{ marginBottom: 16 }}
              >
                <Select 
                  placeholder="请下拉选择设备" 
                  value={modalDevice}
                  onChange={(v) => {
                    setModalDevice(v);
                    if (v === 'galbot' || v === 'franka_fr3') {
                      setEnableFrameRange(false);
                      message.info(`已选择 [${v === 'galbot' ? 'Galbot (银河机器人)' : 'Franka FR3'}]：已自动适配为无帧数语义模式`);
                    } else {
                      setEnableFrameRange(true);
                      message.info(`已选择 [${v === '鹿鸣' ? '鹿鸣' : '新松工业机械臂'}]：已自动开启时序帧区间`);
                    }
                  }}
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

          {/* Row 2: Description with counter */}
          <Form.Item 
            label={<span style={{ fontWeight: 500 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>模板描述</span>} 
            name="desc" 
            rules={[{ required: true, message: '请输入模板描述' }]}
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea 
              rows={3} 
              maxLength={200} 
              showCount 
              placeholder="简要说明此动作模板的适用场景..." 
            />
          </Form.Item>

          {/* Row 3: Action Steps Section */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>动作步骤
              </span>
              <Space size="middle" align="center">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>预设帧区间</span>
                  <Switch 
                    size="small" 
                    checked={enableFrameRange} 
                    onChange={(checked) => {
                      setEnableFrameRange(checked);
                      message.info(`已${checked ? '开启' : '关闭'}动作模版帧区间配置`);
                    }} 
                  />
                </div>
                <Radio.Group 
                  value={actionInputMode} 
                  onChange={e => setActionInputMode(e.target.value)} 
                  optionType="button" 
                  buttonStyle="solid"
                  size="middle"
                >
                  <Radio.Button value="structured">
                    <UnorderedListOutlined style={{ marginRight: 4 }} /> 结构化步骤
                  </Radio.Button>
                  <Radio.Button value="natural">
                    <EditOutlined style={{ marginRight: 4 }} /> 自然语言描述
                  </Radio.Button>
                </Radio.Group>
              </Space>
            </div>

            {actionInputMode === 'structured' ? (
              <div>
                <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {actionSteps.map((item, index) => (
                    <div 
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                      }}
                    >
                      {/* Step Number Badge */}
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#1677ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: 12,
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Select Dropdowns Row */}
                      <div style={{ flex: 1 }}>
                        <Row gutter={[8, 8]}>
                          <Col span={enableFrameRange ? 5 : 6}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>执行末端类型</div>
                            <Select 
                              value={item.arm} 
                              placeholder="请选择"
                              onChange={(val) => updateActionStepField(item.key, 'arm', val)}
                              size="middle" 
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
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>原子技能</div>
                            <Select 
                              value={item.skill} 
                              placeholder="请选择"
                              onChange={(val) => updateActionStepField(item.key, 'skill', val)}
                              size="middle" 
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="识别">识别</Select.Option>
                              <Select.Option value="靠近">靠近</Select.Option>
                              <Select.Option value="抓取">抓取</Select.Option>
                              <Select.Option value="放置">放置</Select.Option>
                              <Select.Option value="旋转">旋转</Select.Option>
                              <Select.Option value="对准">对准</Select.Option>
                              <Select.Option value="松开">松开</Select.Option>
                            </Select>
                          </Col>

                          <Col span={enableFrameRange ? 4 : 6}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>操作对象</div>
                            <Select 
                              value={item.object} 
                              placeholder="请选择"
                              onChange={(val) => updateActionStepField(item.key, 'object', val)}
                              size="middle" 
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="目标物品">目标物品</Select.Option>
                              <Select.Option value="纸箱">纸箱</Select.Option>
                              <Select.Option value="胶带机">胶带机</Select.Option>
                              <Select.Option value="托盘">托盘</Select.Option>
                              <Select.Option value="零食盒">零食盒</Select.Option>
                              <Select.Option value="阀门">阀门</Select.Option>
                              <Select.Option value="抽屉">抽屉</Select.Option>
                              <Select.Option value="螺丝刀">螺丝刀</Select.Option>
                            </Select>
                          </Col>

                          <Col span={enableFrameRange ? 5 : 6}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>操作目标</div>
                            <Select 
                              value={item.goal} 
                              placeholder="请选择"
                              onChange={(val) => updateActionStepField(item.key, 'goal', val)}
                              size="middle" 
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="确认位置">确认位置</Select.Option>
                              <Select.Option value="避障靠近">避障靠近</Select.Option>
                              <Select.Option value="牢固夹紧">牢固夹紧</Select.Option>
                              <Select.Option value="稳定释放">稳定释放</Select.Option>
                              <Select.Option value="对齐插槽">对齐插槽</Select.Option>
                              <Select.Option value="推拉合拢">推拉合拢</Select.Option>
                            </Select>
                          </Col>

                          {/* Render Frame Range only when enabled */}
                          {enableFrameRange && (
                            <Col span={6}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>默认帧数区间</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <InputNumber 
                                  value={item.startFrame ?? 0} 
                                  onChange={(val) => updateActionStepField(item.key, 'startFrame', val ?? 0)}
                                  min={0}
                                  size="middle"
                                  placeholder="0"
                                  style={{ width: '48%' }}
                                />
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>-</span>
                                <InputNumber 
                                  value={item.endFrame ?? 300} 
                                  onChange={(val) => updateActionStepField(item.key, 'endFrame', val ?? 300)}
                                  min={0}
                                  size="middle"
                                  placeholder="300"
                                  style={{ width: '48%' }}
                                />
                              </div>
                            </Col>
                          )}
                        </Row>
                      </div>

                      {/* Delete Button */}
                      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                        <Button 
                          type="text" 
                          danger 
                          shape="circle"
                          size="small" 
                          disabled={actionSteps.length <= 1}
                          icon={<MinusCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />}
                          onClick={() => removeActionStep(item.key)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="dashed"
                  block
                  onClick={addActionStep}
                  style={{
                    height: 38,
                    marginTop: 10,
                    borderRadius: 6,
                    color: '#334155',
                    borderColor: '#cbd5e1',
                    fontSize: 13
                  }}
                >
                  + 添加结构化步骤
                </Button>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <Input.TextArea 
                  rows={6} 
                  value={actionNaturalText}
                  onChange={e => setActionNaturalText(e.target.value)}
                  placeholder="请输入自然语言描述的动作步骤流程，每行代表一个步骤。例如：&#10;1. 右手 (Right Arm) 识别 目标物品 (确认位置)&#10;2. 右手 (Right Arm) 靠近 目标物品 (避障靠近)"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
            )}
          </div>
        </Form>
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
