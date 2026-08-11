'use client';

import React, { useState } from 'react';
import {
  Typography, Form, Input, Select, Button,
  Table, Space, Upload, App, Row, Col, Tooltip, Tag
} from 'antd';
import {
  PlusOutlined, DeleteOutlined,
  InfoCircleOutlined, UploadOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Text } = Typography;
const { TextArea } = Input;

// ─── Mock Data for Components Pool (Available to be linked) ──────────────────

const componentPool = [
  { id: 'p1', name: '头部视觉模块', type: 'Body-HeadCamera(本体-头部相机)', point: '头部' },
  { id: 'p2', name: '灵巧手_右', type: 'EndEffector-DexHand(末端-灵巧手)', point: '右臂' },
  { id: 'p3', name: '灵巧手_左', type: 'EndEffector-DexHand(末端-灵巧手)', point: '左臂' },
  { id: 'p4', name: '平行夹爪', type: 'EndEffector-Gripper(末端-夹爪)', point: '右臂' },
  { id: 'p5', name: '基座底盘', type: 'Body-Base(本体-底盘)', point: '底部' },
];

export default function AddRobotDevicePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Component configuration state (linked components)
  const [components, setComponents] = useState([]);

  const componentColumns = [
    {
      title: '对齐点',
      dataIndex: 'point',
      key: 'point',
      width: 120,
      render: (text) => <Tag color="blue" style={{ borderRadius: 2 }}>{text || '未指定'}</Tag>
    },
    { title: '部件名称', dataIndex: 'name', key: 'name' },
    { title: '部件类型', dataIndex: 'type', key: 'type' },
    {
      title: '数据规则',
      key: 'rule',
      render: (_, r) => (
        <Space size={4} wrap>
          <Tag color="cyan">30fps/≤5ms</Tag>
          <Tag color="purple">标准同步规则</Tag>
        </Space>
      )
    },
    {
      title: '操作', fixed: 'right',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setComponents(prev => prev.filter(c => c.id !== record.id))}
        />
      )
    },
  ];

  const handleAddComponent = (componentId) => {
    const component = componentPool.find(c => c.id === componentId);
    if (component) {
      if (components.find(c => c.id === componentId)) {
        message.warning('该部件已在配置列表中');
        return;
      }
      setComponents(prev => [...prev, component]);
      message.success(`已添加部件: ${component.name}`);
    }
  };

  const onFinish = (values) => {
    message.success('机器人设备创建成功');
    router.push('/collection/device-types');
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="添加机器人设备"
          description={<> 填写新的机器人设备类型，带 <Text type="danger">*</Text> 的为必填项。</>}
          breadcrumbs={[{ title: '首页', href: '/' }, { title: '设备类型管理', href: '/collection/device-types' }, { title: '添加机器人设备' }]}
          back={() => router.back()}
        />

        <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: 'enabled' }}
      >
        {/* Section 1: Basic Info */}
        <FormSection title="基本信息" description="定义设备类型的唯一身份、版本与启用状态。">
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="机器人名称"
                name="name"
                rules={[{ required: true, message: '请输入机器人名称' }]}
              >
                <Input placeholder="请输入机器人名称" maxLength={50} showCount />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={
                  <Space>
                    英文名称
                    <Tooltip title="机器人对应的英文唯一标识">
                      <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
                    </Tooltip>
                  </Space>
                }
                name="enName"
              >
                <Input placeholder="请输入英文名称" maxLength={50} showCount />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="机器人版本"
                name="version"
                rules={[{ required: true, message: '请输入机器人版本' }]}
              >
                <Input placeholder="请输入机器人版本" maxLength={50} showCount />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="状态" name="status">
                <Select
                  options={[
                    { label: '启用', value: 'enabled' },
                    { label: '禁用', value: 'disabled' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="传感器描述"
            name="sensorDesc"
            rules={[{ required: true, message: '请输入传感器描述' }]}
          >
            <TextArea
              placeholder="请输入传感器描述"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </FormSection>

        {/* Section 2: Component Configuration */}
        <FormSection title="部件配置" description="从部件池中建立设备类型的组成关系与数据规则。">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Select
              placeholder="选择并添加部件"
              style={{ width: 240 }}
              suffixIcon={<PlusOutlined />}
              onSelect={handleAddComponent}
              value={null}
              options={componentPool.map(c => ({
                label: `${c.name} (${c.type})`,
                value: c.id
              }))}
            />
          </div>
          <Table
            columns={componentColumns}
            dataSource={components}
            pagination={false}
            size="middle"
            bordered
            locale={{ emptyText: '暂无数据' }}
          />
        </FormSection>

        {/* Section 3: Files & Images */}
        <FormSection title="文件与图片" description="上传 URDF 模型文件与设备外观图片。">
          <Row gutter={48}>
            <Col span={12}>
              <Form.Item label="URDF 文件" name="urdfFile">
                <div style={{ padding: '8px 0' }}>
                  <Upload maxCount={1} accept=".urdf">
                    <Button icon={<UploadOutlined />}>上传 URDF 文件</Button>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    可上传最多 1 份 .urdf 格式的文件
                  </Text>
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="设备图片" name="deviceImages">
                <div style={{ padding: '8px 0' }}>
                  <Upload listType="picture-card" maxCount={5}>
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传图片</div>
                    </div>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    可上传最多 5 张，单个不超过 2MB，格式 jpg/jpeg/png/gif
                  </Text>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {/* Footer actions */}
        <ActionFooter>
          <Button onClick={() => router.back()}>取消</Button>
          <Button type="primary" htmlType="submit">确认添加</Button>
        </ActionFooter>
        </Form>
      </div>
    </MainLayout>
  );
}
