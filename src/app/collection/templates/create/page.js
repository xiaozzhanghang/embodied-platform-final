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

const { Title, Text } = Typography;

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const editId = searchParams.get('id');
  const isEdit = !!editId;
  
  const [steps, setSteps] = useState([
    { key: '1', effector: '右手', skill: '识别', object: '目标物品', target: '确认位置' },
    ...(isEdit ? [
      { key: '2', effector: '右手', skill: '接近', object: '目标物品', target: '对齐中心' },
      { key: '3', effector: '右手', skill: '抓取', object: '目标物品', target: '稳定握持' }
    ] : [])
  ]);

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
    setSteps([...steps, { key: newKey, effector: '右手', skill: '', object: '', target: '' }]);
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
        <Select defaultValue={val} style={{ width: '100%' }} options={[
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
      render: (val) => (
        <Select defaultValue={val} style={{ width: '100%' }} options={[
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
      render: (val) => (
        <Select defaultValue={val} style={{ width: '100%' }} options={[
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
      render: (val) => (
        <Select defaultValue={val} style={{ width: '100%' }} options={[
          { value: '确认位置', label: '确认位置' },
          { value: '稳定握持', label: '稳定握持' },
          { value: '内部', label: '内部' }
        ]} />
      )
    },
    {
      title: '操作',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeStep(record.key)} />
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb 
          items={[
            { title: '数据采集' },
            { title: '任务模板', href: '/collection/templates' },
            { title: isEdit ? '编辑模板' : '新建模板' }
          ]} 
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
          <Title level={3} style={{ margin: 0 }}>{isEdit ? '编辑任务模版' : '新建任务模版'}</Title>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card title="基础配置" bordered={false} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
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
        </Card>

        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>动作步骤编排 (SOP Steps)</span>
              <Button type="primary" ghost icon={<PlusOutlined />} onClick={addStep}>添加步骤</Button>
            </div>
          } 
          bordered={false} 
          style={{ marginBottom: 40, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
        >
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
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, paddingBottom: 60 }}>
          <Button style={{ width: 120 }} onClick={() => router.back()}>取消</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 120 }}>{isEdit ? '保存更改' : '保存模版'}</Button>
        </div>
      </Form>
    </MainLayout>
  );
}
