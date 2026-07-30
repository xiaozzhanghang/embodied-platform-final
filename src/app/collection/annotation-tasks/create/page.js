'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, Table, Tag, Divider, Alert, App, Breadcrumb, InputNumber, Radio
} from 'antd';
import { 
  ArrowLeftOutlined, CheckCircleFilled, LinkOutlined,
  FileTextOutlined, FormOutlined, CheckOutlined,
  UnorderedListOutlined, InfoCircleOutlined, DatabaseOutlined,
  FilterOutlined, QuestionCircleOutlined, PlusOutlined, DeleteOutlined,
  MinusCircleOutlined, EditOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const p1Options = [
  { value: 'InternalCommercial', label: 'InternalCommercial (商业仿真)' },
  { value: 'SimulatedCollection', label: 'SimulatedCollection (仿真采集)' },
  { value: 'ExternalXupaosi', label: 'ExternalXupaosi (外部资产)' }
];

const p2OptionsMap = {
  InternalCommercial: [{ value: 'GroceryVLA', label: 'GroceryVLA (超市物品抓取)' }],
  SimulatedCollection: [{ value: 'FoundationModel', label: 'FoundationModel (基座模型)' }],
  ExternalXupaosi: [{ value: 'SubTag_X1', label: 'SubTag_X1 (子标签包)' }]
};

const taskBookOptions = [
  { value: 'sop_desk', label: '[3D 标注模版] 桌面整理 3D 边界框与轨迹标注规范 V1.0' },
  { value: 'sop_cable', label: '[动作切分模版] 线缆管理原子动作时间戳切分规范 V2.0' },
  { value: 'sop_kitchen', label: '[姿态标定模版] 厨房场景 6DoF 机械臂位姿标注规范 V1.5' }
];

const sceneCategories = [
  { value: 'Kitchen', label: 'Kitchen (厨房场景)' },
  { value: 'LivingRoom', label: 'LivingRoom (客厅场景)' },
  { value: 'Supermarket', label: 'Supermarket (商超场景)' }
];

const subSceneOptionsMap = {
  Kitchen: [
    { value: 'Kitchen_Counter', label: 'Kitchen-台面烹饪区' },
    { value: 'Kitchen_Cabinet', label: 'Kitchen-储物柜区' }
  ],
  LivingRoom: [
    { value: 'LivingRoom_Table', label: 'LivingRoom-餐桌整理区' }
  ],
  Supermarket: [
    { value: 'Supermarket_Shelf', label: 'Supermarket-货架摆放区' }
  ]
};

const allCollectionTasks = [
  {
    value: 'COLL-20260415-001',
    label: '基于模版_桌面整理_数采任务 (COLL-20260415-001 | 共 850 条已采数据)',
    p1: 'InternalCommercial',
    p2: 'GroceryVLA',
    sceneCat: 'Kitchen',
    subScene: 'Kitchen_Counter',
    taskName: '基于模版_桌面整理_标注任务',
    taskNameEn: 'Tabletop_Book_Organize_AnnoTask',
    taskBook: 'sop_desk',
    usage: 'Training',
    deviceType: 'Galbot_2.2_RGBD',
    totalDataCount: 850,
    steps: [
      { id: 1, effector: '右手 (Right Arm)', skill: '识别', object: '目标物品', target: '确认位置', startFrame: 0, endFrame: 300 },
      { id: 2, effector: '右手 (Right Arm)', skill: '靠近', object: '目标物品', target: '避障靠近', startFrame: 301, endFrame: 600 },
      { id: 3, effector: '右手 (Right Arm)', skill: '抓取', object: '目标物品', target: '牢固夹紧', startFrame: 601, endFrame: 900 }
    ]
  },
  {
    value: 'COLL-20260414-003',
    label: 'Lumos-双手整理离线资产任务 (COLL-20260414-003 | 共 50 条已采数据)',
    p1: 'ExternalXupaosi',
    p2: 'SubTag_X1',
    sceneCat: 'Kitchen',
    subScene: 'Kitchen_Cabinet',
    taskName: 'Lumos-双手整理离线资产标注任务',
    taskNameEn: 'Lumos_Bimanual_Sorting_Anno',
    taskBook: 'sop_cable',
    usage: 'Valid',
    deviceType: 'Lumos_FastUMI',
    totalDataCount: 50,
    steps: [
      { id: 1, effector: '左手 (Left Arm)', skill: '识别', object: '门把手', target: '确认位置', startFrame: 0, endFrame: 300 },
      { id: 2, effector: '左手 (Left Arm)', skill: '靠近', object: '柜门', target: '拉开打开', startFrame: 301, endFrame: 600 }
    ]
  },
  {
    value: 'COLL-20260415-002',
    label: '桌面操作物理数采任务 (COLL-20260415-002 | 共 500 条已采数据)',
    p1: 'SimulatedCollection',
    p2: 'FoundationModel',
    sceneCat: 'LivingRoom',
    subScene: 'LivingRoom_Table',
    taskName: '桌面操作物理数采标注任务',
    taskNameEn: 'Tabletop_Operation_Physical_Anno',
    taskBook: 'sop_desk',
    usage: 'Training',
    deviceType: 'Galbot_1.16_G2',
    totalDataCount: 500,
    steps: [
      { id: 1, effector: '双手 (Dual Arms)', skill: '定位', object: '桌面杂物', target: '确认位置', startFrame: 0, endFrame: 300 },
      { id: 2, effector: '右手 (Right Arm)', skill: '抓取', object: '目标书籍', target: '牢固夹紧', startFrame: 301, endFrame: 600 }
    ]
  }
];

function CreateAnnotationTaskContent() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [currentP1, setCurrentP1] = useState('InternalCommercial');
  const [currentP2, setCurrentP2] = useState('GroceryVLA');
  const [currentSceneCat, setCurrentSceneCat] = useState('Kitchen');
  const [currentSubScene, setCurrentSubScene] = useState('Kitchen_Counter');
  
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(allCollectionTasks[0]);
  const [episodesList, setEpisodesList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedDataCount, setSelectedDataCount] = useState(2);

  const [sopInputMode, setSopInputMode] = useState('format');

  // Editable SOP Action Steps state
  const [sopSteps, setSopSteps] = useState([
    { id: 1, effector: '右手 (Right Arm)', skill: '识别', object: '目标物品', target: '确认位置', startFrame: 0, endFrame: 300 },
    { id: 2, effector: '右手 (Right Arm)', skill: '靠近', object: '目标物品', target: '避障靠近', startFrame: 301, endFrame: 600 },
    { id: 3, effector: '右手 (Right Arm)', skill: '抓取', object: '目标物品', target: '牢固夹紧', startFrame: 601, endFrame: 900 }
  ]);

  const addSopStep = () => {
    setSopSteps(prev => {
      const last = prev[prev.length - 1];
      const startF = last ? (last.endFrame || 0) + 1 : 0;
      const endF = startF + 299;
      return [
        ...prev,
        { id: Date.now(), effector: '右手 (Right Arm)', skill: '抓取', object: '目标物品', target: '确认位置', startFrame: startF, endFrame: endF }
      ];
    });
  };

  const updateSopStep = (id, field, value) => {
    setSopSteps(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeSopStep = (id) => {
    if (sopSteps.length <= 1) return;
    setSopSteps(prev => prev.filter(item => item.id !== id));
  };

  // Initialize form fields
  useEffect(() => {
    filterTasksCascade('InternalCommercial', 'GroceryVLA', 'Kitchen', 'Kitchen_Counter');
  }, []);

  const handleP1Change = (p1) => {
    setCurrentP1(p1);
    const p2Opts = p2OptionsMap[p1] || [];
    const firstP2 = p2Opts[0]?.value || '';
    setCurrentP2(firstP2);
    form.setFieldsValue({ p1, p2: firstP2 });

    filterTasksCascade(p1, firstP2, currentSceneCat, currentSubScene);
  };

  const handleP2Change = (p2) => {
    setCurrentP2(p2);
    filterTasksCascade(currentP1, p2, currentSceneCat, currentSubScene);
  };

  const handleSceneCatChange = (sceneCat) => {
    setCurrentSceneCat(sceneCat);
    const subOptions = subSceneOptionsMap[sceneCat] || [];
    const firstSub = subOptions[0]?.value || '';
    setCurrentSubScene(firstSub);
    form.setFieldsValue({ sceneCat, subScene: firstSub });

    filterTasksCascade(currentP1, currentP2, sceneCat, firstSub);
  };

  const handleSubSceneChange = (subScene) => {
    setCurrentSubScene(subScene);
    filterTasksCascade(currentP1, currentP2, currentSceneCat, subScene);
  };

  const filterTasksCascade = (p1, p2, sceneCat, subScene) => {
    const matched = allCollectionTasks.filter(t => 
      t.p1 === p1 && t.p2 === p2 && t.sceneCat === sceneCat && t.subScene === subScene
    );

    const available = matched.length > 0 ? matched : allCollectionTasks.filter(t => t.p1 === p1 || t.sceneCat === sceneCat);
    setFilteredTasks(available);

    if (available.length > 0) {
      handleTaskSelect(available[0].value, available);
    } else {
      handleTaskSelect(allCollectionTasks[0].value, allCollectionTasks);
    }
  };

  const handleTaskSelect = (taskId, taskList = filteredTasks) => {
    const task = (taskList.length ? taskList : allCollectionTasks).find(t => t.value === taskId) || allCollectionTasks[0];
    setSelectedTask(task);

    const defaultCount = Math.min(2, task.totalDataCount);
    setSelectedDataCount(defaultCount);

    form.setFieldsValue({
      p1: task.p1,
      p2: task.p2,
      taskBook: task.taskBook,
      sceneCat: task.sceneCat,
      subScene: task.subScene,
      sourceTaskId: task.value,
      name: task.taskName,
      nameEn: task.taskNameEn,
      usage: task.usage,
      dataCount: defaultCount
    });

    if (task.steps) {
      setSopSteps(task.steps);
    }

    generateEpisodesList(task, defaultCount);
  };

  const generateEpisodesList = (task, count) => {
    const listLength = Math.max(count, Math.min(task.totalDataCount, 20));
    const mockEpisodes = Array.from({ length: listLength }).map((_, idx) => {
      const epId = 944101 + idx;
      return {
        key: String(epId),
        id: epId,
        episodeName: `${task.value}_ep_${String(idx + 1).padStart(3, '0')}`,
        collectTime: `2026-04-${String(10 + (idx % 15)).padStart(2, '0')} 15:${String(idx % 60).padStart(2, '0')}:20`,
        totalFrames: [150, 180, 220, 260, 320][idx % 5],
        collectStatus: '已采集完成 (机检合格)'
      };
    });

    setEpisodesList(mockEpisodes);
    const initialSelectedKeys = mockEpisodes.slice(0, count).map(item => item.key);
    setSelectedRowKeys(initialSelectedKeys);
    setSelectedDataCount(initialSelectedKeys.length);
  };

  // Linkage Direction 1: InputNumber -> Table RowSelection
  const handleDataCountChange = (val) => {
    const num = Math.min(Math.max(0, val || 0), selectedTask.totalDataCount);
    setSelectedDataCount(num);
    form.setFieldsValue({ dataCount: num });

    if (num > episodesList.length) {
      generateEpisodesList(selectedTask, num);
    } else {
      const newKeys = episodesList.slice(0, num).map(item => item.key);
      setSelectedRowKeys(newKeys);
    }
  };

  // Linkage Direction 2: Table Checkbox -> InputNumber
  const handleTableSelectionChange = (newSelectedKeys) => {
    setSelectedRowKeys(newSelectedKeys);
    setSelectedDataCount(newSelectedKeys.length);
    form.setFieldsValue({ dataCount: newSelectedKeys.length });
  };

  const handleFinish = () => {
    message.success(`新建标注任务成功！已关联 ${selectedRowKeys.length} 条 Episode 数据与 ${sopSteps.length} 步 SOP 动作序列，请前往详情页进行分包。`);
    router.push('/collection/annotation-tasks');
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[
          { title: '首页' }, 
          { title: '数据采集' }, 
          { title: '任务中心' }, 
          { title: '标注任务', href: '/collection/annotation-tasks' },
          { title: '新建标注任务' }
        ]} />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, background: '#fff', padding: '18px 24px', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/collection/annotation-tasks')} style={{ marginRight: 16 }} />
            <div>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FormOutlined style={{ color: '#722ed1' }} />
                新建标注任务
              </Title>
            </div>
          </div>
          <Tag color="purple" style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20 }}>
            采集关联模式
          </Tag>
        </div>

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {/* Card: 基础信息 (按截图精准对齐 2 列栅格) */}
          <Card 
            title={
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                基础信息
              </span>
            } 
            variant="borderless" 
            styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} 
            style={{ marginBottom: 24, borderRadius: 8, border: '1px solid #f0f0f0' }}
          >
            {/* Row 1: 一级项目 & 二级项目 */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>一级项目</span>} name="p1" required rules={[{ required: true, message: '请选择一级项目' }]}>
                  <Select 
                    placeholder="请选择" 
                    options={p1Options} 
                    onChange={handleP1Change} 
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>二级项目</span>} name="p2" required rules={[{ required: true, message: '请选择二级项目' }]}>
                  <Select 
                    placeholder="服务数据" 
                    options={p2OptionsMap[currentP1] || []} 
                    onChange={handleP2Change} 
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 2: 标注任务名称 & 英文名称 */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>标注任务名称</span>} name="name" required rules={[{ required: true, message: '请输入标注任务名称' }]}>
                  <Input placeholder="请输入标注任务名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>英文名称</span>} name="nameEn" required rules={[{ required: true, message: '请输入英文名称' }]}>
                  <Input placeholder="请输入" suffix={<QuestionCircleOutlined style={{ color: '#bfbfbf' }} />} />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 3: 任务用途 & 场景分类 */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>任务用途</span>} name="usage" required rules={[{ required: true, message: '请选择任务用途' }]}>
                  <Select placeholder="请选择" options={[
                    { value: 'Training', label: 'Training (模型训练集数据)' },
                    { value: 'Valid', label: 'Valid (验证评测集数据)' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>场景分类</span>} name="sceneCat" required rules={[{ required: true, message: '请选择场景分类' }]}>
                  <Select 
                    placeholder="请选择" 
                    options={sceneCategories} 
                    onChange={handleSceneCatChange} 
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 4: 关联任务书 (SOP) / 标注模版 & 子场景分类 */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label={
                  <span style={{ fontWeight: 600 }}>
                    <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>关联任务书 (SOP) / 标注模版 <QuestionCircleOutlined style={{ color: '#8c8c8c', marginLeft: 4 }} />
                  </span>
                } name="taskBook" required rules={[{ required: true, message: '请选择关联任务书/标注模版' }]}>
                  <Select 
                    placeholder="请选择标注模版/标准规范" 
                    options={taskBookOptions} 
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>子场景分类</span>} name="subScene" required rules={[{ required: true, message: '请选择子场景分类' }]}>
                  <Select 
                    placeholder="请选择" 
                    options={subSceneOptionsMap[currentSceneCat] || []} 
                    onChange={handleSubSceneChange} 
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Card 2: 关联 Episode 数据量选择与明细筛选 */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DatabaseOutlined style={{ color: '#1677ff' }} />
                  关联 Episode 数据筛选与数量设定
                </span>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  源采集任务共有 <Text type="danger" strong>{selectedTask.totalDataCount}</Text> 条已采数据，已选定 <Text type="success" strong>{selectedRowKeys.length}</Text> 条 Episode 导入标注
                </Text>
              </div>
            } 
            variant="borderless" 
            styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} 
            style={{ marginBottom: 24, borderRadius: 8, border: '1px solid #f0f0f0' }}
          >
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
                <Text strong style={{ fontSize: 14, color: '#334155', whiteSpace: 'nowrap' }}>选择关联导入的 Episode 数据数量:</Text>
                <InputNumber 
                  min={1} 
                  max={selectedTask.totalDataCount} 
                  value={selectedDataCount} 
                  onChange={handleDataCountChange} 
                  style={{ width: 140 }}
                  size="middle"
                />
                <Text type="secondary" style={{ fontSize: 14, whiteSpace: 'nowrap', fontWeight: 600, color: '#475569' }}>
                  / {selectedTask.totalDataCount} 条
                </Text>
              </div>
            </div>

            <Table 
              rowSelection={{
                selectedRowKeys,
                onChange: handleTableSelectionChange
              }}
              dataSource={episodesList} 
              rowKey="key"
              pagination={{ pageSize: 5 }} 
              size="small"
              bordered
              columns={[
                { title: 'Episode ID', dataIndex: 'id', key: 'id', width: 120 },
                { title: 'Episode 名称', dataIndex: 'episodeName', key: 'episodeName' },
                { title: '采集完成时间', dataIndex: 'collectTime', key: 'collectTime', width: 180 },
                { title: '总帧数', dataIndex: 'totalFrames', key: 'totalFrames', width: 100 },
                { title: '采集质检状态', dataIndex: 'collectStatus', key: 'collectStatus', width: 180, render: s => <Tag color="success">{s}</Tag> }
              ]} 
            />
          </Card>

          {/* Card 3: 预设SOP动作步骤序列 (高保真卡片卡槽样式) */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UnorderedListOutlined style={{ color: '#1677ff' }} />
                  预设SOP动作步骤序列
                </span>
                <Radio.Group 
                  value={sopInputMode} 
                  onChange={e => setSopInputMode(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="format">结构化步骤</Radio.Button>
                  <Radio.Button value="natural">自然语言描述</Radio.Button>
                </Radio.Group>
              </div>
            } 
            variant="borderless" 
            styles={{ header: { background: '#fafafa', borderRadius: '8px 8px 0 0' } }} 
            style={{ marginBottom: 24, borderRadius: 8, border: '1px solid #f0f0f0' }}
          >
            {sopInputMode === 'format' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sopSteps.map((step, idx) => {
                  const startF = step.startFrame !== undefined ? step.startFrame : (idx === 0 ? 0 : idx * 300 + 1);
                  const endF = step.endFrame !== undefined ? step.endFrame : (idx + 1) * 300;

                  return (
                    <div 
                      key={step.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 16, 
                        background: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 12, 
                        padding: '16px 20px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Step Number Badge */}
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#1677ff',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                        flexShrink: 0
                      }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Input Controls Grid */}
                      <Row gutter={12} style={{ flex: 1 }} align="middle">
                        <Col span={5}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>执行末端类型</div>
                          <Select 
                            value={step.effector} 
                            onChange={v => updateSopStep(step.id, 'effector', v)} 
                            style={{ width: '100%' }}
                            options={[
                              { value: '右手 (Right Arm)', label: '右手 (Right Arm)' },
                              { value: '左手 (Left Arm)', label: '左手 (Left Arm)' },
                              { value: '双手 (Dual Arms)', label: '双手 (Dual Arms)' },
                              { value: '底盘 (Base)', label: '底盘 (Base)' }
                            ]} 
                          />
                        </Col>

                        <Col span={4}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>原子技能</div>
                          <Select 
                            value={step.skill} 
                            onChange={v => updateSopStep(step.id, 'skill', v)} 
                            style={{ width: '100%' }}
                            options={[
                              { value: '识别', label: '识别' },
                              { value: '靠近', label: '靠近' },
                              { value: '避障靠近', label: '避障靠近' },
                              { value: '抓取', label: '抓取' },
                              { value: '放置', label: '放置' },
                              { value: '定位', label: '定位' }
                            ]} 
                          />
                        </Col>

                        <Col span={5}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>操作对象</div>
                          <Select 
                            value={step.object} 
                            onChange={v => updateSopStep(step.id, 'object', v)} 
                            style={{ width: '100%' }}
                            options={[
                              { value: '目标物品', label: '目标物品' },
                              { value: '桌面杂物', label: '桌面杂物' },
                              { value: '抽屉', label: '抽屉' },
                              { value: '门把手', label: '门把手' }
                            ]} 
                          />
                        </Col>

                        <Col span={5}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>操作目标</div>
                          <Select 
                            value={step.target} 
                            onChange={v => updateSopStep(step.id, 'target', v)} 
                            style={{ width: '100%' }}
                            options={[
                              { value: '确认位置', label: '确认位置' },
                              { value: '避障靠近', label: '避障靠近' },
                              { value: '牢固夹紧', label: '牢固夹紧' },
                              { value: '目标点', label: '目标点' }
                            ]} 
                          />
                        </Col>

                        <Col span={5}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>默认帧数区间</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InputNumber 
                              min={0} 
                              value={startF} 
                              onChange={v => updateSopStep(step.id, 'startFrame', v)} 
                              style={{ width: '100%' }} 
                            />
                            <span style={{ color: '#94a3b8' }}>-</span>
                            <InputNumber 
                              min={0} 
                              value={endF} 
                              onChange={v => updateSopStep(step.id, 'endFrame', v)} 
                              style={{ width: '100%' }} 
                            />
                          </div>
                        </Col>
                      </Row>

                      {/* Red Minus Delete Button */}
                      <Button 
                        type="text" 
                        icon={<MinusCircleOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />} 
                        onClick={() => removeSopStep(step.id)} 
                        disabled={sopSteps.length <= 1}
                      />
                    </div>
                  );
                })}

                {/* Full-width dashed Add button */}
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addSopStep} 
                  block 
                  size="large"
                  style={{ 
                    borderRadius: 8, 
                    height: 48, 
                    borderColor: '#1677ff', 
                    color: '#1677ff', 
                    background: '#f0f7ff',
                    fontWeight: 600,
                    fontSize: 15,
                    marginTop: 8
                  }}
                >
                  添加结构化步骤
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sopSteps.map((step, idx) => (
                  <div key={step.id} style={{ display: 'flex', gap: 16, background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '16px 20px', alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {idx + 1}
                    </div>
                    <Input 
                      placeholder={`请输入第 ${idx + 1} 步动作步骤的自然语言描述（如：右手避障靠近目标物体）`}
                      value={`${step.effector} ${step.skill} ${step.object} ${step.target}`}
                      onChange={e => updateSopStep(step.id, 'target', e.target.value)}
                      size="large"
                      style={{ flex: 1, borderRadius: 8 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 180 }}>
                      <InputNumber min={0} value={step.startFrame || (idx * 300 + (idx === 0 ? 0 : 1))} onChange={v => updateSopStep(step.id, 'startFrame', v)} style={{ width: '100%' }} />
                      <span>-</span>
                      <InputNumber min={0} value={step.endFrame || ((idx + 1) * 300)} onChange={v => updateSopStep(step.id, 'endFrame', v)} style={{ width: '100%' }} />
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<MinusCircleOutlined style={{ fontSize: 20 }} />} 
                      onClick={() => removeSopStep(step.id)}
                      disabled={sopSteps.length <= 1}
                    />
                  </div>
                ))}

                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addSopStep} 
                  block 
                  size="large"
                  style={{ borderRadius: 8, height: 48, borderColor: '#10b981', color: '#059669', background: '#f0fdf4' }}
                >
                  添加自然语言步骤描述
                </Button>
              </div>
            )}
          </Card>

          {/* Submit Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32, marginBottom: 40 }}>
            <Button size="large" onClick={() => router.push('/collection/annotation-tasks')}>
              取消
            </Button>
            <Button type="primary" size="large" icon={<CheckOutlined />} htmlType="submit" style={{ padding: '0 36px', borderRadius: 8, background: '#722ed1' }}>
              发布标注任务 ({selectedRowKeys.length} 条数据)
            </Button>
          </div>
        </Form>
      </div>
    </MainLayout>
  );
}

export default function CreateAnnotationTaskPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAnnotationTaskContent />
    </Suspense>
  );
}
