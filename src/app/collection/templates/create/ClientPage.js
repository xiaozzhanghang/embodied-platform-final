'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button, Typography, Space, Input, Select, Form, Row, Col,
  Card, Table, Radio, App, Breadcrumb, Divider, Tag, Switch,
  InputNumber, Tooltip, Alert, Badge
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  SaveOutlined, RobotOutlined, DragOutlined, CheckCircleOutlined,
  ThunderboltOutlined, InfoCircleOutlined, SafetyCertificateOutlined,
  EditOutlined, UnorderedListOutlined, SlidersOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { ActionFooter, FormSection, PageHeader, StateView } from '@/components/ui';

import { Suspense } from 'react';

const { Title, Text, Paragraph } = Typography;

function TemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  // Step arrangement mode: 'structured' | 'natural'
  const [stepMode, setStepMode] = useState('structured');

  // Structured SOP steps list with frame range
  const [structuredSteps, setStructuredSteps] = useState([
    { key: '1', effector: '右手 (Right Arm)', skill: '识别', object: '目标物品', target: '确认位置', startFrame: 0, endFrame: 300, desc: '视觉识别定位目标物品并获取位姿' },
    { key: '2', effector: '右手 (Right Arm)', skill: '靠近', object: '目标物品', target: '避障靠近', startFrame: 301, endFrame: 600, desc: '平稳移动末端执行器避障靠近目标' },
    { key: '3', effector: '右手 (Right Arm)', skill: '抓取', object: '目标物品', target: '牢固夹紧', startFrame: 601, endFrame: 900, desc: '夹爪施加恒定夹持力稳固抓取目标' },
    ...(isEdit ? [
      { key: '4', effector: '右手 (Right Arm)', skill: '放置', object: '容器', target: '稳定装箱', startFrame: 901, endFrame: 1200, desc: '将物品水平运送至容器内平稳放置' }
    ] : [])
  ]);

  // Natural language steps list
  const [naturalSteps, setNaturalSteps] = useState([
    { key: '1', prompt: '1. 视觉定位桌面上的目标物品并确认其空间三维坐标与抓取法向量', targetObject: '目标物品', weight: '核心阶段' },
    { key: '2', prompt: '2. 驱动右机械臂以平滑轨迹平稳靠近目标物品，保持末端朝向与接触法线平行', targetObject: '目标物品', weight: '平滑接近' },
    { key: '3', prompt: '3. 闭合夹爪以额定力矩牢固夹持物品，确保重心居中无侧翻风险', targetObject: '目标物品', weight: '抓取闭环' },
    { key: '4', prompt: '4. 将物品以 15cm/s 速度平稳运送至托盘上方并轻缓释放复位', targetObject: '托盘容器', weight: '终止归位' },
  ]);

  const [naturalRawText, setNaturalRawText] = useState(
    "1. 视觉定位桌面上的目标物品并确认其空间三维坐标与抓取法向量\n2. 驱动右机械臂以平滑轨迹平稳靠近目标物品，保持末端朝向与接触法线平行\n3. 闭合夹爪以额定力矩牢固夹持物品，确保重心居中无侧翻风险\n4. 将物品以 15cm/s 速度平稳运送至托盘上方并轻缓释放复位"
  );

  const [customActionTemplates, setCustomActionTemplates] = useState([]);
  const [selectedTemplateMeta, setSelectedTemplateMeta] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('embodied_action_templates');
      if (saved) {
        try {
          setCustomActionTemplates(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const ACTION_TEMPLATES_MOCK = {
    act_1: {
      key: 'act_1',
      name: '📦 工业纸箱打包封装与装箱模版',
      stepFormat: 'structured',
      stepType: '结构化步骤',
      steps: [
        { key: '1', effector: '双手 (Dual Arms)', skill: '展开', object: '纸箱', target: '封底定位', startFrame: 0, endFrame: 350, desc: '双手 展开 纸箱 (封底定位)' },
        { key: '2', effector: '右手 (Right Arm)', skill: '放置', object: '泡沫垫', target: '放入底部', startFrame: 351, endFrame: 600, desc: '右手 放置 泡沫垫 (放入底部)' },
        { key: '3', effector: '右手 (Right Arm)', skill: '抓取', object: '工厂部件', target: '牢固夹紧', startFrame: 601, endFrame: 1000, desc: '右手 抓取 工厂部件 (稳定装箱)' },
        { key: '4', effector: '左手 (Left Arm)', skill: '放置', object: '泡沫垫', target: '顶部覆盖', startFrame: 1001, endFrame: 1250, desc: '左手 放置 泡沫垫 (顶部覆盖)' },
        { key: '5', effector: '双手 (Dual Arms)', skill: '折叠', object: '箱盖', target: '合拢定位', startFrame: 1251, endFrame: 1550, desc: '双手 折叠 箱盖 (合拢定位)' },
        { key: '6', effector: '右手 (Right Arm)', skill: '封箱', object: '胶带机', target: '顶部密封', startFrame: 1551, endFrame: 1900, desc: '右手 封箱 胶带机 (顶部密封)' }
      ]
    },
    act_2: {
      key: 'act_2',
      name: '📚 桌面书籍整理与摆放模版',
      stepFormat: 'natural',
      stepType: '自然语言',
      rawText: "1. 视觉定位桌面上的散落书籍并计算书脊方向\n2. 伸出右机械臂调整夹爪开度平稳靠近书籍\n3. 夹取书籍并保持水平姿态匀速平移至书架前\n4. 将书籍垂直插入书架空位中并平稳松开复位",
      steps: [
        { key: '1', prompt: '1. 视觉定位桌面上的散落书籍并计算书脊方向', targetObject: '书籍', weight: '视觉对准' },
        { key: '2', prompt: '2. 伸出右机械臂调整夹爪开度平稳靠近书籍', targetObject: '书籍', weight: '避障接近' },
        { key: '3', prompt: '3. 夹取书籍并保持水平姿态匀速平移至书架前', targetObject: '书籍/书架', weight: '水平搬运' },
        { key: '4', prompt: '4. 将书籍垂直插入书架空位中并平稳松开复位', targetObject: '书架', weight: '垂直插入' }
      ]
    },
    act_3: {
      key: 'act_3',
      name: '🍽️ 餐盘清理与协同搬运模版',
      stepFormat: 'structured',
      stepType: '结构化步骤',
      steps: [
        { key: '1', effector: '双手 (Dual Arms)', skill: '识别', object: '餐盘', target: '确认位置', startFrame: 0, endFrame: 200, desc: '双手 识别 餐盘 (确认位置)' },
        { key: '2', effector: '双手 (Dual Arms)', skill: '靠近', object: '餐盘', target: '避障靠近', startFrame: 201, endFrame: 450, desc: '双手 靠近 餐盘 (避障对准)' },
        { key: '3', effector: '双手 (Dual Arms)', skill: '抓取', object: '餐盘', target: '牢固夹紧', startFrame: 451, endFrame: 750, desc: '双手 抓取 餐盘 (牢固夹紧)' },
        { key: '4', effector: '双手 (Dual Arms)', skill: '放置', object: '回收车', target: '平稳入框', startFrame: 751, endFrame: 1100, desc: '双手 放置 回收车 (平稳入框)' }
      ]
    },
    act_4: {
      key: 'act_4',
      name: '🚪 智能家居抽屉开关与取物模版',
      stepFormat: 'natural',
      stepType: '自然语言',
      rawText: "1. 视觉检测抽屉拉手三维空间位置与开合朝向\n2. 机械臂靠近拉手并钩锁拉出抽屉至最大开度\n3. 探入手爪精准抓取内部目标物品并取出\n4. 轻柔推动抽屉面板至完全闭合并复位",
      steps: [
        { key: '1', prompt: '1. 视觉检测抽屉拉手三维空间位置与开合朝向', targetObject: '抽屉拉手', weight: '拉手检测' },
        { key: '2', prompt: '2. 机械臂靠近拉手并钩锁拉出抽屉至最大开度', targetObject: '抽屉拉手', weight: '拉开机构' },
        { key: '3', prompt: '3. 探入手爪精准抓取内部目标物品并取出', targetObject: '目标物品', weight: '内部取物' },
        { key: '4', prompt: '4. 轻柔推动抽屉面板至完全闭合并复位', targetObject: '抽屉面板', weight: '推回闭合' }
      ]
    }
  };

  // Smart Template Import Handler: Auto-switches stepMode and loads corresponding data
  const handleSelectActionTemplate = (value) => {
    if (!value) {
      setSelectedTemplateMeta(null);
      return;
    }

    if (ACTION_TEMPLATES_MOCK[value]) {
      const tpl = ACTION_TEMPLATES_MOCK[value];
      if (tpl.stepFormat === 'structured') {
        setStepMode('structured');
        setStructuredSteps(tpl.steps);
      } else {
        setStepMode('natural');
        setNaturalSteps(tpl.steps);
        if (tpl.rawText) setNaturalRawText(tpl.rawText);
      }
      setSelectedTemplateMeta({
        key: value,
        name: tpl.name,
        stepFormat: tpl.stepFormat,
        stepType: tpl.stepType,
        count: tpl.steps.length
      });
      message.success(`已导入【${tpl.stepType}】动作模版：「${tpl.name}」！`);
      return;
    }

    const found = customActionTemplates.find(t => t.key === value);
    if (found) {
      const isNatural = found.stepFormat === 'natural' || found.stepType === '自然语言';
      if (isNatural) {
        setStepMode('natural');
        const rawLines = found.steps || [];
        const mappedNatural = rawLines.map((line, idx) => ({
          key: (idx + 1).toString(),
          prompt: line.startsWith(`${idx+1}.`) ? line : `${idx + 1}. ${line}`,
          targetObject: '目标实体',
          weight: idx === 0 ? '起始阶段' : (idx === rawLines.length - 1 ? '完成阶段' : '执行阶段')
        }));
        setNaturalSteps(mappedNatural);
        setNaturalRawText(mappedNatural.map(m => m.prompt).join('\n'));
      } else {
        setStepMode('structured');
        let currentFrame = 0;
        const mappedStructured = (found.steps || []).map((str, index) => {
          let effector = '右手 (Right Arm)';
          if (str.includes('左手')) effector = '左手 (Left Arm)';
          else if (str.includes('双手')) effector = '双手 (Dual Arms)';
          else if (str.includes('底盘')) effector = '底盘 (Base)';

          let skill = '靠近';
          if (str.includes('识别') || str.includes('定位')) skill = '识别';
          else if (str.includes('抓取') || str.includes('夹紧')) skill = '抓取';
          else if (str.includes('放置') || str.includes('放入') || str.includes('封箱')) skill = '放置';
          else if (str.includes('折叠') || str.includes('展开')) skill = '展开';

          let object = '目标物品';
          if (str.includes('抽屉')) object = '抽屉';
          else if (str.includes('纸箱') || str.includes('箱')) object = '纸箱';
          else if (str.includes('餐盘')) object = '餐盘';

          let target = '确认位置';
          if (str.includes('稳定') || str.includes('牢固')) target = '牢固夹紧';
          else if (str.includes('避障') || str.includes('对准')) target = '避障靠近';
          else if (str.includes('装箱') || str.includes('入框')) target = '稳定装箱';

          const sF = currentFrame;
          const eF = currentFrame + 300;
          currentFrame = eF + 1;

          return {
            key: (index + 1).toString(),
            effector,
            skill,
            object,
            target,
            startFrame: sF,
            endFrame: eF,
            desc: str
          };
        });
        setStructuredSteps(mappedStructured);
      }

      setSelectedTemplateMeta({
        key: value,
        name: found.name,
        stepFormat: isNatural ? 'natural' : 'structured',
        stepType: isNatural ? '自然语言' : '结构化步骤',
        count: (found.steps || []).length
      });
      message.success(`已导入【${isNatural ? '自然语言' : '结构化步骤'}】动作模版「${found.name}」！`);
    }
  };

  const updateStructuredStep = (key, field, value) => {
    setStructuredSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
  };

  const addStructuredStep = () => {
    const newKey = (structuredSteps.length + 1).toString();
    const lastStep = structuredSteps[structuredSteps.length - 1];
    const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
    const startF = prevEnd > 0 ? prevEnd + 1 : 0;
    setStructuredSteps([
      ...structuredSteps, 
      { 
        key: newKey, 
        effector: '右手 (Right Arm)', 
        skill: '靠近', 
        object: '目标物品', 
        target: '避障靠近', 
        startFrame: startF, 
        endFrame: startF + 300, 
        desc: '平稳对准目标物体并靠近' 
      }
    ]);
  };

  const removeStructuredStep = (key) => {
    setStructuredSteps(structuredSteps.filter(item => item.key !== key));
  };

  const updateNaturalStep = (key, field, value) => {
    setNaturalSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
  };

  const addNaturalStep = () => {
    const newKey = (naturalSteps.length + 1).toString();
    setNaturalSteps([
      ...naturalSteps,
      { key: newKey, prompt: `${newKey}. 执行下一步连贯操作并确认状态`, targetObject: '目标对象', weight: '执行阶段' }
    ]);
  };

  const removeNaturalStep = (key) => {
    setNaturalSteps(naturalSteps.filter(item => item.key !== key));
  };

  // Sync raw text to cards
  const handleRawTextSync = () => {
    const lines = naturalRawText.split('\n').filter(Boolean);
    const newCards = lines.map((line, idx) => ({
      key: (idx + 1).toString(),
      prompt: line.replace(/^\d+[\.\、\s]*/, `${idx + 1}. `),
      targetObject: line.includes('抽屉') ? '抽屉' : (line.includes('书') ? '书籍' : (line.includes('箱') ? '纸箱' : '目标物品')),
      weight: idx === 0 ? '起始识别' : (idx === lines.length - 1 ? '最终归位' : '核心动作')
    }));
    setNaturalSteps(newCards);
    message.success('已根据多行文本自动解析生成分步卡片流！');
  };

  useEffect(() => {
    if (isEdit) {
      form.setFieldsValue({
        name: '通用物体抓取与放置任务模板',
        code: 'TPL_GEN_GRASP_2026',
        device: 'galbot_2.2_RGB',
        mode: 'WholeBody',
        desc: '适用于具身服务场景中物体识别、接近、抓取及放置的标准任务流程模板。'
      });
    }
  }, [isEdit, form]);

  const onFinish = (values) => {
    message.success(isEdit ? '任务模版修改成功！' : '任务模版创建成功！');
    router.push('/collection/templates');
  };

  // Table columns for Structured SOP with Frame Range
  const structuredColumns = [
    { title: '排序', dataIndex: 'key', width: 50, align: 'center', render: () => <DragOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} /> },
    {
      title: '执行末端类型',
      dataIndex: 'effector',
      width: 145,
      render: (val, record) => (
        <Select value={val} onChange={(v) => updateStructuredStep(record.key, 'effector', v)} style={{ width: '100%' }} options={[
          { value: '右手 (Right Arm)', label: '右手 (Right Arm)' },
          { value: '左手 (Left Arm)', label: '左手 (Left Arm)' },
          { value: '双手 (Dual Arms)', label: '双手 (Dual Arms)' },
          { value: '底盘 (Base)', label: '底盘 (Base)' },
          { value: '头部相机 (Camera)', label: '头部相机 (Camera)' }
        ]} />
      )
    },
    {
      title: '原子技能',
      dataIndex: 'skill',
      width: 105,
      render: (val, record) => (
        <Select value={val} onChange={(v) => updateStructuredStep(record.key, 'skill', v)} style={{ width: '100%' }} options={[
          { value: '识别', label: '识别' },
          { value: '靠近', label: '靠近' },
          { value: '抓取', label: '抓取' },
          { value: '放置', label: '放置' },
          { value: '展开', label: '展开' },
          { value: '折叠', label: '折叠' },
          { value: '封箱', label: '封箱' },
          { value: '松开', label: '松开' }
        ]} />
      )
    },
    {
      title: '操作对象',
      dataIndex: 'object',
      width: 115,
      render: (val, record) => (
        <Select value={val} onChange={(v) => updateStructuredStep(record.key, 'object', v)} style={{ width: '100%' }} options={[
          { value: '目标物品', label: '目标物品' },
          { value: '纸箱', label: '纸箱' },
          { value: '泡沫垫', label: '泡沫垫' },
          { value: '工厂部件', label: '工厂部件' },
          { value: '餐盘', label: '餐盘' },
          { value: '抽屉', label: '抽屉' },
          { value: '胶带机', label: '胶带机' }
        ]} />
      )
    },
    {
      title: '操作目标 / 判据',
      dataIndex: 'target',
      width: 125,
      render: (val, record) => (
        <Select value={val} onChange={(v) => updateStructuredStep(record.key, 'target', v)} style={{ width: '100%' }} options={[
          { value: '确认位置', label: '确认位置' },
          { value: '避障靠近', label: '避障靠近' },
          { value: '牢固夹紧', label: '牢固夹紧' },
          { value: '稳定装箱', label: '稳定装箱' },
          { value: '封底定位', label: '封底定位' },
          { value: '合拢定位', label: '合拢定位' },
          { value: '顶部密封', label: '顶部密封' },
          { value: '平稳入框', label: '平稳入框' }
        ]} />
      )
    },
    {
      title: '预设帧区间',
      key: 'frameRange',
      width: 170,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <InputNumber 
            min={0} 
            value={record.startFrame ?? 0} 
            onChange={(v) => updateStructuredStep(record.key, 'startFrame', v ?? 0)}
            style={{ width: 68 }}
            placeholder="起始"
          />
          <span style={{ color: '#94a3b8' }}>-</span>
          <InputNumber 
            min={0} 
            value={record.endFrame ?? 300} 
            onChange={(v) => updateStructuredStep(record.key, 'endFrame', v ?? 300)}
            style={{ width: 68 }}
            placeholder="结束"
          />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>帧</span>
        </div>
      )
    },
    {
      title: '步骤动作描述',
      dataIndex: 'desc',
      render: (val, record) => (
        <Input 
          value={val} 
          onChange={(e) => updateStructuredStep(record.key, 'desc', e.target.value)}
          placeholder="说明此原子步骤的执行细节..."
        />
      )
    },
    {
      title: '操作', fixed: 'right',
      width: 50,
      align: 'center',
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} disabled={structuredSteps.length <= 1} onClick={() => removeStructuredStep(record.key)} />
      )
    }
  ];

  // Group custom action templates into structured and natural
  const customStructured = customActionTemplates.filter(t => t.stepFormat === 'structured' || t.stepType === '结构化步骤' || !t.stepFormat);
  const customNatural = customActionTemplates.filter(t => t.stepFormat === 'natural' || t.stepType === '自然语言');

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title={isEdit ? '编辑任务模版' : '新建任务模版'}
          description="配置任务模板基础属性，并针对「结构化步骤」或「自然语言」进行动作编排与质检规则绑定。"
          breadcrumbs={[
            { title: '数据采集' },
            { title: '模版中心', href: '/collection/templates' },
            { title: isEdit ? '编辑模板' : '新建模板' },
          ]}
          back={() => router.back()}
        />

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Section 1: Basic Config */}
          <FormSection title="基础配置">
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="模版名称" name="name" rules={[{ required: true, message: '请输入模版名称' }]}>
                  <Input placeholder="例如：超市场景物品分拣与装箱任务模版" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="模版编码" name="code" rules={[{ required: true, message: '请输入模版编码' }]}>
                  <Input placeholder="TPL_2026_XXXX" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="适配机器人硬件" name="device" initialValue="galbot_2.2_RGB">
                  <Select options={[
                    { value: 'galbot_2.2_RGB', label: 'Galbot V2.2 (银河机器人 - RGB多目)' },
                    { value: 'franka_fr3', label: 'Franka FR3 (桌面机械臂)' },
                    { value: 'ur5e_gripper', label: 'UR5e + 2F-85 夹爪' }
                  ]} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="默认控制模式" name="mode" initialValue="WholeBody">
                  <Select options={[
                    { value: 'WholeBody', label: 'WholeBody (全身协作控制模式)' },
                    { value: 'ArmOnly', label: 'ArmOnly (双/单机械臂模式)' },
                    { value: 'BaseOnly', label: 'BaseOnly (底盘移动巡检模式)' }
                  ]} />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="模版描述与适用场景" name="desc">
                  <Input placeholder="简述该任务模版的适用场景、物理环境约束和执行要点..." />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          {/* Section 2: SOP Step Arrangement & Smart Import */}
          <SpecMarker
            id="templates-sequence"
            number={1}
            title="动作模版导入与步骤模式配置"
            rules={[
              "先选定动作步骤模式（结构化步骤模式 vs 自然语言模式），并在对应模式下筛选动作模版。",
              "结构化步骤模式：配置执行末端、原子技能、操作对象、操作目标与预设帧区间（起始帧 - 结束帧），自动关联物理质检规则。",
              "自然语言模式：支持多行 Prompt 录入与分步指令卡片序列，自动关联大模型语义质检规则。"
            ]}
            remark="遵循先定模式、后选模版的极简交互流程，确保任务定义规范与质检规则精准对齐。"
            style={{ width: '100%' }}
          >
            <FormSection title="SOP 动作步骤编排">
              {/* Step 1: Mode Selection - Clean & Simple */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>选择步骤模式:</span>
                <Radio.Group 
                  value={stepMode} 
                  onChange={e => {
                    setStepMode(e.target.value);
                    setSelectedTemplateMeta(null);
                    message.info(`已切换至【${e.target.value === 'structured' ? '结构化步骤模式' : '自然语言模式'}】`);
                  }}
                  buttonStyle="solid"
                  size="middle"
                >
                  <Radio.Button value="structured" style={{ padding: '0 20px', fontWeight: 500 }}>
                    🔵 结构化步骤模式
                  </Radio.Button>
                  <Radio.Button value="natural" style={{ padding: '0 20px', fontWeight: 500 }}>
                    🟢 自然语言模式
                  </Radio.Button>
                </Radio.Group>
              </div>

              {/* Step 2: Template Selection in Current Mode */}
              <div style={{
                background: stepMode === 'structured' ? '#f8fafc' : '#f0fdfa',
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${stepMode === 'structured' ? '#e2e8f0' : '#ccfbf1'}`,
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 320 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: stepMode === 'structured' ? '#1e293b' : '#0f766e', whiteSpace: 'nowrap' }}>
                    导入{stepMode === 'structured' ? '结构化' : '自然语言'}动作模版:
                  </span>
                  
                  {stepMode === 'structured' ? (
                    <Select
                      key="select-structured"
                      placeholder="选择结构化动作模版快速填充步骤..."
                      style={{ flex: 1, maxWidth: 380 }}
                      onChange={handleSelectActionTemplate}
                      value={selectedTemplateMeta?.stepFormat === 'structured' ? selectedTemplateMeta.key : undefined}
                      allowClear
                    >
                      <Select.Option value="act_1">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>📦 工业纸箱打包封装与装箱模版</span>
                          <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>6 步四元组</Tag>
                        </div>
                      </Select.Option>
                      <Select.Option value="act_3">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🍽️ 餐盘清理与协同搬运模版</span>
                          <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>4 步四元组</Tag>
                        </div>
                      </Select.Option>
                      {customStructured.map(t => (
                        <Select.Option key={t.key} value={t.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t.name}</span>
                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>结构化</Tag>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  ) : (
                    <Select
                      key="select-natural"
                      placeholder="选择自然语言动作模版快速填充指令..."
                      style={{ flex: 1, maxWidth: 380 }}
                      onChange={handleSelectActionTemplate}
                      value={selectedTemplateMeta?.stepFormat === 'natural' ? selectedTemplateMeta.key : undefined}
                      allowClear
                    >
                      <Select.Option value="act_2">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>📚 桌面书籍整理与摆放模版</span>
                          <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>4 阶段 Prompt</Tag>
                        </div>
                      </Select.Option>
                      <Select.Option value="act_4">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🚪 智能家居抽屉开关与取物模版</span>
                          <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>4 阶段 Prompt</Tag>
                        </div>
                      </Select.Option>
                      {customNatural.map(t => (
                        <Select.Option key={t.key} value={t.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t.name}</span>
                            <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>自然语言</Tag>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </div>

                <div>
                  {stepMode === 'structured' ? (
                    <Button type="primary" ghost icon={<PlusOutlined />} onClick={addStructuredStep}>
                      添加步骤
                    </Button>
                  ) : (
                    <Button type="primary" ghost icon={<PlusOutlined />} onClick={addNaturalStep} style={{ color: '#0d9488', borderColor: '#0d9488' }}>
                      添加阶段
                    </Button>
                  )}
                </div>
              </div>

              {/* Dynamic Notification Banner */}
              {selectedTemplateMeta && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: '10px 16px', 
                  borderRadius: 8, 
                  background: selectedTemplateMeta.stepFormat === 'natural' ? '#f0fdfa' : '#eff6ff', 
                  border: `1.5px solid ${selectedTemplateMeta.stepFormat === 'natural' ? '#5eead4' : '#93c5fd'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tag color={selectedTemplateMeta.stepFormat === 'natural' ? 'cyan' : 'blue'} style={{ fontSize: 12, padding: '2px 8px', fontWeight: 600 }}>
                      {selectedTemplateMeta.stepType === '自然语言' ? '🟢 自然语言模版' : '🔵 结构化步骤模版'}
                    </Tag>
                    <span style={{ fontSize: 13, fontWeight: 600, color: selectedTemplateMeta.stepFormat === 'natural' ? '#0f766e' : '#1d4ed8' }}>
                      已选用动作模版「{selectedTemplateMeta.name}」
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      （共 {selectedTemplateMeta.count} 个动作步骤，已填入下方编排区）
                    </span>
                  </div>
                  <Tag color="default" style={{ cursor: 'pointer' }} onClick={() => setSelectedTemplateMeta(null)}>
                    ✕ 清除提示
                  </Tag>
                </div>
              )}

              {/* View 1: Structured Steps */}
              {stepMode === 'structured' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 14, color: '#1e293b' }}>结构化动作步骤明细表：</Text>
                      <Tag color="blue">{structuredSteps.length} 个步骤</Tag>
                    </div>
                  </div>

                  <Table
                    dataSource={structuredSteps}
                    columns={structuredColumns}
                    pagination={false}
                    size="middle"
                    bordered
                    style={{ marginBottom: 16 }}
                  />

                  {/* Structured QC Physical Rules Auto-binding Banner */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '14px 18px',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <SafetyCertificateOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                      <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                        🛡️ 依据当前原子技能链条自动绑定的【物理自检质检规则】：
                      </Text>
                      <Tag color="geekblue">实时联动生效</Tag>
                    </div>
                    <Row gutter={[12, 12]}>
                      <Col span={8}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>抓取技能夹持力上限校验</span>
                            <Tag color="green" style={{ margin: 0 }}>&le; 18.5 N</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>防止过载压损或夹碎物体（基于 Torque Sensor 阈值）</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>接近与对齐位姿容差</span>
                            <Tag color="cyan" style={{ margin: 0 }}>&le; 2.5 mm / 3&deg;</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>避免末端执行器与目标发生非预期碰撞</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>轨迹平滑度与抖动率</span>
                            <Tag color="purple" style={{ margin: 0 }}>Jerk &lt; 0.08</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>确保示教轨迹动力学连续，无机械臂急停震颤</div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              ) : (
                /* View 2: Natural Language Steps */
                <div>
                  <Row gutter={20} style={{ marginBottom: 16 }}>
                    {/* Left: Raw Prompt Multiline Input */}
                    <Col span={10}>
                      <div style={{ background: '#ffffff', padding: 16, borderRadius: 8, border: '1px solid #ccfbf1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                            📝 连续自然语言 Prompt 文本:
                          </span>
                          <Button size="small" type="primary" ghost onClick={handleRawTextSync}>
                            解析至卡片 &rarr;
                          </Button>
                        </div>
                        <Input.TextArea
                          rows={10}
                          value={naturalRawText}
                          onChange={e => setNaturalRawText(e.target.value)}
                          placeholder="请输入连续自然语言步骤描述序列，每行代表一个动作阶段..."
                          style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
                        />
                        <div style={{ marginTop: 8, fontSize: 11, color: '#0d9488' }}>
                          💡 支持粘贴大模型具身 Prompt，点击右上方「解析至卡片」即可同步至右侧卡片流。
                        </div>
                      </div>
                    </Col>

                    {/* Right: Step Cards Stream */}
                    <Col span={14}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text strong style={{ fontSize: 13, color: '#0f766e' }}>
                          🗂️ 自然语言步骤流式卡片 ({naturalSteps.length} 步):
                        </Text>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
                        {naturalSteps.map((item, index) => (
                          <div
                            key={item.key}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #ccfbf1',
                              borderRadius: 8,
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12
                            }}
                          >
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: '#0d9488',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: 12,
                              flexShrink: 0
                            }}>
                              {index + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                              <Input
                                value={item.prompt}
                                onChange={e => updateNaturalStep(item.key, 'prompt', e.target.value)}
                                style={{ fontSize: 12, marginBottom: 4 }}
                                placeholder="输入自然语言步骤描述..."
                              />
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#64748b' }}>目标实体:</span>
                                <Input
                                  size="small"
                                  value={item.targetObject}
                                  onChange={e => updateNaturalStep(item.key, 'targetObject', e.target.value)}
                                  style={{ width: 110, fontSize: 11 }}
                                  placeholder="如: 纸箱"
                                />
                                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>阶段属性:</span>
                                <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>{item.weight}</Tag>
                              </div>
                            </div>

                            <Button
                              type="text"
                              danger
                              size="small"
                              disabled={naturalSteps.length <= 1}
                              icon={<DeleteOutlined />}
                              onClick={() => removeNaturalStep(item.key)}
                            />
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>

                  {/* Natural Language Semantic QC Rules Banner */}
                  <div style={{
                    background: '#f0fdfa',
                    border: '1px solid #ccfbf1',
                    borderRadius: 8,
                    padding: '14px 18px',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <SafetyCertificateOutlined style={{ color: '#0d9488', fontSize: 16 }} />
                      <Text strong style={{ fontSize: 13, color: '#0f766e' }}>
                        🛡️ 依据自然语言 Prompt 描述自动绑定的【语义级质检规则】：
                      </Text>
                      <Tag color="cyan">大模型语义自检</Tag>
                    </div>
                    <Row gutter={[12, 12]}>
                      <Col span={8}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #99f6e4' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#134e4a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Prompt 意图执行完整度</span>
                            <Tag color="cyan" style={{ margin: 0 }}>&ge; 95.0%</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>通过 VLM 视频理解模型核验各阶段目标达成度</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #99f6e4' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#134e4a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>目标实体分割与聚焦 IoU</span>
                            <Tag color="green" style={{ margin: 0 }}>IoU &ge; 0.82</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>确保视频各视角中操作目标物体追踪一致</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #99f6e4' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#134e4a', display: 'flex', justifyContent: 'space-between' }}>
                            <span>终止判据语义满足度</span>
                            <Tag color="blue" style={{ margin: 0 }}>Binary True</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>终态视觉关键帧判定（物品已入框/抽屉已闭合）</div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              )}
            </FormSection>
          </SpecMarker>

          <ActionFooter>
            <Button style={{ width: 120 }} onClick={() => router.back()}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 140 }}>
              {isEdit ? '保存更改' : '保存任务模版'}
            </Button>
          </ActionFooter>
        </Form>
      </div>
    </MainLayout>
  );
}

export default function CreateTemplatePage() {
  return (
    <Suspense fallback={<StateView type="loading" />}>
      <TemplateForm />
    </Suspense>
  );
}

