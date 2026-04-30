'use client';

import React, { useState } from 'react';
import { 
  Typography, Breadcrumb, Form, Input, Select, Button, 
  Card, Table, Space, Upload, App, Row, Col, Tooltip, Tag
} from 'antd';
import { 
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, 
  InfoCircleOutlined, UploadOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
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
      title: '操作', 
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
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb 
          items={[
            { title: '首页', href: '/' },
            { title: '设备类型管理', href: '/collection/device-types' },
            { title: '添加机器人设备' }
          ]} 
          style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" size={0}>
          <Space align="center">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()} 
              style={{ fontSize: 16, marginRight: 8 }}
            />
            <Title level={3} style={{ margin: 0 }}>添加机器人设备</Title>
          </Space>
          <Text type="secondary">填写以下信息创建新的机器人设备类型，带 <Text type="danger">*</Text> 的为必填项。</Text>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: 'enabled' }}
      >
        {/* Section 1: Basic Info */}
        <Card title="基本信息" bordered={false} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
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
        </Card>

        {/* Section 2: Component Configuration */}
        <Card 
          title="部件配置" 
          bordered={false} 
          style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
          extra={
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
          }
        >
          <Table 
            columns={componentColumns} 
            dataSource={components} 
            pagination={false}
            size="middle"
            bordered
            locale={{ emptyText: '暂无数据' }}
          />
        </Card>

        {/* Section 3: Files & Images */}
        <Card title="文件与图片" bordered={false} style={{ marginBottom: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
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
        </Card>

        {/* Footer actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 12, 
          paddingBottom: 40 
        }}>
          <Button onClick={() => router.back()}>取消</Button>
          <Button type="primary" htmlType="submit">确认添加</Button>
        </div>
      </Form>
    </MainLayout>
  );
}
