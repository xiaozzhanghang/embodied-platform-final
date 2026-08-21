'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button, Typography, Space, Input, Select, Form, Row, Col,
  Card, Table, Radio, App, Breadcrumb, Divider, Tag
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  SaveOutlined, RobotOutlined, DragOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { ActionFooter, FormSection, PageHeader, StateView } from '@/components/ui';

import { Suspense } from 'react';

const { Title, Text } = Typography;

function TemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [steps, setSteps] = useState([
    { key: '1', effector: '右手', skill: '识别', object: '目标物品', target: '确认位置' },
    ...(isEdit ? [
      { key: '2', effector: '右手', skill: '移动', object: '目标物品', target: '确认位置' },
      { key: '3', effector: '右手', skill: '抓取', object: '目标物品', target: '稳定握持' }
    ] : [])
  ]);

  const [customActionTemplates, setCustomActionTemplates] = useState([]);

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
    act_1: [
      { key: '1', effector: '双手', skill: '识别', object: '容器', target: '确认位置' },
      { key: '2', effector: '右手', skill: '移动', object: '目标物品', target: '确认位置' },
      { key: '3', effector: '右手', skill: '抓取', object: '目标物品', target: '稳定握持' },
      { key: '4', effector: '左手', skill: '移动', object: '目标物品', target: '确认位置' },
      { key: '5', effector: '双手', skill: '放置', object: '容器', target: '内部' }
    ],
    act_2: [
      { key: '1', effector: '右手', skill: '识别', object: '目标物品', target: '确认位置' },
      { key: '2', effector: '右手', skill: '移动', object: '目标物品', target: '确认位置' },
      { key: '3', effector: '右手', skill: '抓取', object: '目标物品', target: '稳定握持' },
      { key: '4', effector: '右手', skill: '放置', object: '目标物品', target: '内部' }
    ],
    act_3: [
      { key: '1', effector: '双手', skill: '识别', object: '容器', target: '确认位置' },
      { key: '2', effector: '双手', skill: '移动', object: '容器', target: '确认位置' },
      { key: '3', effector: '双手', skill: '抓取', object: '容器', target: '稳定握持' },
      { key: '4', effector: '双手', skill: '放置', object: '容器', target: '内部' }
    ],
    act_4: [
      { key: '1', effector: '右手', skill: '识别', object: '抽屉', target: '确认位置' },
      { key: '2', effector: '右手', skill: '移动', object: '抽屉', target: '确认位置' },
      { key: '3', effector: '右手', skill: '打开', object: '抽屉', target: '内部' },
      { key: '4', effector: '右手', skill: '放置', object: '目标物品', target: '内部' }
    ]
  };

  const handleSelectActionTemplate = (value) => {
    if (!value) return;
    if (ACTION_TEMPLATES_MOCK[value]) {
      setSteps(ACTION_TEMPLATES_MOCK[value]);
      message.success('已成功导入动作模版的步骤编排！');
      return;
    }
    const found = customActionTemplates.find(t => t.key === value);
    if (found && found.steps) {
      const mappedSteps = found.steps.map((str, index) => {
        let effector = '右手';
        if (str.includes('左手')) effector = '左手';
        else if (str.includes('双手')) effector = '双手';
        else if (str.includes('底盘')) effector = '底盘';

        let skill = '移动';
        if (str.includes('识别') || str.includes('定位')) skill = '识别';
        else if (str.includes('抓取') || str.includes('夹紧') || str.includes('取')) skill = '抓取';
        else if (str.includes('放置') || str.includes('放入') || str.includes('折叠') || str.includes('封口')) skill = '放置';
        else if (str.includes('打开') || str.includes('拉开')) skill = '打开';

        let object = '目标物品';
        if (str.includes('抽屉')) object = '抽屉';
        else if (str.includes('把手')) object = '门把手';
        else if (str.includes('纸箱') || str.includes('箱') || str.includes('盒') || str.includes('容器') || str.includes('盘')) object = '容器';

        let target = '确认位置';
        if (str.includes('稳定') || str.includes('牢固') || str.includes('握持')) target = '稳定握持';
        else if (str.includes('内') || str.includes('底') || str.includes('里') || str.includes('中')) target = '内部';

        return {
          key: (index + 1).toString(),
          effector,
          skill,
          object,
          target
        };
      });
      setSteps(mappedSteps);
      message.success(`已成功导入动作模版「${found.name}」的步骤编排！`);
    }
  };

  const updateStepField = (key, field, value) => {
    setSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
  };

  useEffect(() => {
    if (isEdit) {
      form.setFieldsValue({
        name: '通用物体抓取模板',
        code: 'TPL_GEN_GRASP',
        device: 'galbot_2.2_RGB',
        mode: 'WholeBody',
        desc: '适用于大部分规则几何形状物体的桌面抓取任务。'
      });
    }
  }, [isEdit, form]);

  const addStep = () => {
    const newKey = (steps.length + 1).toString();
    setSteps([...steps, { key: newKey, effector: '右手', skill: '识别', object: '目标物品', target: '确认位置' }]);
  };

  const removeStep = (key) => {
    setSteps(steps.filter(item => item.key !== key));
  };

  const onFinish = (values) => {
    message.success(isEdit ? '任务模版修改成功' : '任务模版创建成功');
    router.push('/collection/templates');
  };

  const columns = [
    { title: '排序', dataIndex: 'key', width: 60, align: 'center', render: () => <DragOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} /> },
    {
      title: '执行末端类型',
      dataIndex: 'effector',
      render: (val, record) => (
        <Select value={val} onChange={(value) => updateStepField(record.key, 'effector', value)} style={{ width: '100%' }} options={[
          { value: '右手', label: '右手 (Right Arm)' },
          { value: '左手', label: '左手 (Left Arm)' },
          { value: '双手', label: '双手 (Dual Arms)' },
          { value: '底盘', label: '底盘 (Base)' },
        ]} />
      )
    },
    {
      title: '原子技能',
      dataIndex: 'skill',
      render: (val, record) => (
        <Select value={val} onChange={(value) => updateStepField(record.key, 'skill', value)} style={{ width: '100%' }} options={[
          { value: '识别', label: '识别' },
          { value: '抓取', label: '抓取' },
          { value: '移动', label: '移动' },
          { value: '放置', label: '放置' },
          { value: '打开', label: '打开' }
        ]} />
      )
    },
    {
      title: '操作对象',
      dataIndex: 'object',
      render: (val, record) => (
        <Select value={val} onChange={(value) => updateStepField(record.key, 'object', value)} style={{ width: '100%' }} options={[
          { value: '目标物品', label: '目标物品' },
          { value: '抽屉', label: '抽屉' },
          { value: '门把手', label: '门把手' },
          { value: '容器', label: '容器' }
        ]} />
      )
    },
    {
      title: '操作目标',
      dataIndex: 'target',
      render: (val, record) => (
        <Select value={val} onChange={(value) => updateStepField(record.key, 'target', value)} style={{ width: '100%' }} options={[
          { value: '确认位置', label: '确认位置' },
          { value: '稳定握持', label: '稳定握持' },
          { value: '内部', label: '内部' }
        ]} />
      )
    },
    {
      title: '操作', fixed: 'right',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeStep(record.key)} />
      )
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title={isEdit ? '编辑任务模版' : '新建任务模版'}
          description="配置模板基础属性，并编排可复用的 SOP 动作步骤。"
          breadcrumbs={[
            { title: '数据采集' },
            { title: '模版中心', href: '/collection/templates' },
            { title: isEdit ? '编辑模板' : '新建模板' },
          ]}
          back={() => router.back()}
        />

        <Form form={form} layout="vertical" onFinish={onFinish}>
        <FormSection title="基础配置">
          <Row gutter={48}>
            <Col span={8}>
              <Form.Item label="模版名称" name="name" rules={[{ required: true }]}>
                <Input placeholder="请输入模版名称，如：货架物品分拣模版" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="模版编码" name="code" rules={[{ required: true }]}>
                <Input placeholder="TPL_XXXX_XXXX" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="适配设备类型" name="device">
                <Select placeholder="请选择" options={[
                  { value: 'galbot_2.2_RGB', label: 'Galbot V2.2 (RGB)' },
                  { value: 'franka_fr3', label: 'Franka FR3' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={48}>
            <Col span={8}>
              <Form.Item label="默认采集模式" name="mode">
                <Select options={[
                  { value: 'WholeBody', label: 'WholeBody (全身控制)' },
                  { value: 'ArmOnly', label: 'ArmOnly (单臂控制)' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="模版描述" name="desc">
                <Input placeholder="简述该模版的适用场景和采集重点" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <SpecMarker
          id="templates-sequence"
          number={1}
          title="动作编排链条与原子规则绑定"
          rules={[
            "支持可视化新增、删除和调整动作步骤（SOP Steps），每个步骤明确指定“末端动作类型”、“原子技能”、“操作对象”和“操作目标”。",
            "逻辑合理性约束：禁止存在无序、循环或矛盾的技能连接关系（如未执行“接近”或“识别”动作而直接添加“抓取”步骤）。保存时进行向导合法性校验。",
            "在保存模版时，系统依据选定的原子技能和对象类型，自动从规则库中选出并关联对应的质检自检物理阈值校验规则（例如：最大夹爪开合力、时变误差界限等）。"
          ]}
          remark="在前置阶段校验动作步骤设计的合理性，防止不规范的流程定义下发污染数采及质检池数据。"
          style={{ width: '100%' }}
        >
          <FormSection title="动作步骤编排（SOP Steps）">
              <div className="ui-toolbar" style={{ padding: '0 0 16px', minHeight: 0 }}>
                <span />
                <Space>
                  <span style={{ fontSize: 13, fontWeight: 'normal', color: '#595959' }}>导入动作模板:</span>
                  <Select
                    placeholder="选择已有动作模板快速导入步骤"
                    style={{ width: 280 }}
                    onChange={handleSelectActionTemplate}
                    options={[
                      { value: 'act_1', label: '📦 工业纸箱打包封装与装箱模版' },
                      { value: 'act_2', label: '📚 桌面书籍整理与摆放模版' },
                      { value: 'act_3', label: '🍽️ 餐盘清理与协同搬运模版' },
                      { value: 'act_4', label: '🚪 抽屉开关与取物操作模版' },
                      ...customActionTemplates.map(t => ({ value: t.key, label: t.name }))
                    ]}
                    allowClear
                  />
                  <Button type="primary" ghost icon={<PlusOutlined />} onClick={addStep}>添加步骤</Button>
                </Space>
              </div>
            <Table
              dataSource={steps}
              columns={columns}
              pagination={false}
              size="middle"
              bordered
              style={{ marginBottom: 16 }}
            />
            <div style={{ background: '#fafafa', padding: 16, borderRadius: 4, border: '1px dashed #d9d9d9' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                提示：编排后的动作步骤将在“新建任务”阶段作为预设值自动填充，采集员在工作台中将看到这些指引。
              </Text>
            </div>
          </FormSection>
        </SpecMarker>

        <ActionFooter>
          <Button style={{ width: 120 }} onClick={() => router.back()}>取消</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 120 }}>{isEdit ? '保存更改' : '保存模版'}</Button>
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
