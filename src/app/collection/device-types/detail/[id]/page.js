'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Form, Row, Col, 
  Card, Table, Tag, Breadcrumb, Divider, App, Radio, 
  Tooltip, Select, Modal, Upload, Collapse, Avatar
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, SaveOutlined, 
  PlusOutlined, UploadOutlined, InfoCircleOutlined,
  ApiOutlined, RobotOutlined, InboxOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// Mock data shared with the list page logic
const componentCategories = [
  { value: 'RobotArm', label: '机械臂' },
  { value: 'Chassis', label: '底盘履带' },
  { value: 'LiftTorso', label: '升降躯干' },
  { value: 'Gripper', label: '二指夹爪' },
  { value: 'DexterousHand', label: '多指灵巧手' },
  { value: 'Camera', label: '相机' },
];

const partData = [
  { key: '1', name: '灵巧手_右', category: 'DexterousHand' },
  { key: '2', name: '底盘', category: 'Chassis' },
  { key: '3', name: '头部相机', category: 'Camera' },
];

export default function DeviceTypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');

  // Initial mock data
  const initialData = {
    name: 'galbot_2.2_RGB',
    enName: 'galbot_2.2',
    version: 'V2.2',
    deviceType: '机器人设备',
    linkedParts: ['1', '3'],
    alignmentPoint: '1',
    sensorDesc: '集成深度相机及双灵巧手触觉反馈。',
    desc: '通用型具身智能机器人平台，配备双灵巧手及升降主躯干，适用于多种室内服务场景。'
  };

  useEffect(() => {
    form.setFieldsValue(initialData);
  }, []);

  const handleSave = () => {
    form.validateFields().then(values => {
      message.success('设备类型更新成功');
      setIsEditing(false);
    });
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: '首页' },
          { title: '设备管理' },
          { title: '设备类型', href: '/collection/device-types' },
          { title: isEditing ? '编辑设备类型' : '查看设备详情' }
        ]} style={{ marginBottom: 16 }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <Title level={3} style={{ margin: 0 }}>{initialData.name}</Title>
          </Space>
          
          <Space>
            {isEditing && (
              <>
                <Button onClick={() => setIsEditing(false)}>取消</Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>提交更新</Button>
              </>
            )}
          </Space>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <Form 
            form={form} 
            layout="vertical"
            disabled={!isEditing}
          >
            <div style={{ padding: '0 20px' }}>
              <Divider orientation="left" style={{ marginTop: 0 }}>
                <Text strong style={{ fontSize: 16 }}>基础信息</Text>
              </Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
                    <Input placeholder="请输入设备名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="enName" label={<Space><span>英文名称</span><Tooltip title="仅支持英文、数字、下划线"><InfoCircleOutlined style={{ color: '#bfbfbf' }} /></Tooltip></Space>}>
                    <Input placeholder="请输入英文名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="version" label="设备版本" rules={[{ required: true }]}>
                    <Input placeholder="请输入设备版本" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="deviceType" label="设备类型" rules={[{ required: true }]}>
                    <Input placeholder="请输入设备类型" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">
                <Text strong style={{ fontSize: 16 }}>硬件关联</Text>
              </Divider>

              <Form.Item name="linkedParts" label="关联部件">
                <Select 
                    mode="multiple" 
                    placeholder="请选择部件" 
                    maxTagCount="responsive"
                    options={partData.map(p => ({ label: p.name, value: p.key }))}
                />
              </Form.Item>

              <Form.Item label="已选部件列表">
                <Form.Item shouldUpdate={(prevValues, curValues) => prevValues.linkedParts !== curValues.linkedParts} noStyle>
                    {({ getFieldValue, setFieldsValue }) => {
                        const selectedIds = getFieldValue('linkedParts') || [];
                        const dataSource = selectedIds.map(id => partData.find(p => p.key === id)).filter(Boolean);
                        
                        return (
                            <Table 
                                size="small"
                                pagination={false}
                                dataSource={dataSource}
                                rowKey="key"
                                bordered
                                columns={[
                                    { 
                                        title: '对齐点', 
                                        key: 'alignment', 
                                        width: 80, 
                                        align: 'center',
                                        render: (_, record) => (
                                            <Form.Item name="alignmentPoint" noStyle>
                                                <Radio.Group onChange={(e) => setFieldsValue({ alignmentPoint: record.key })}>
                                                    <Radio value={record.key} />
                                                </Radio.Group>
                                            </Form.Item>
                                        )
                                    },
                                    { title: '部件名称', dataIndex: 'name', key: 'name' },
                                    { 
                                        title: '部件类型', 
                                        dataIndex: 'category', 
                                        key: 'category',
                                        render: (cat) => {
                                            const found = componentCategories.find(c => c.value === cat);
                                            return found ? found.label : cat;
                                        }
                                    }
                                ]}
                            />
                        );
                    }}
                </Form.Item>
              </Form.Item>

              <Divider orientation="left">
                <Text strong style={{ fontSize: 16 }}>配置描述</Text>
              </Divider>

              <Form.Item name="sensorDesc" label="传感器描述" rules={[{ required: true }]}>
                <TextArea placeholder="请填写传感器型号、参数等描述信息" rows={3} showCount maxLength={200} />
              </Form.Item>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="URDF文件">
                    <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: '16px', textAlign: 'center', background: '#fafafa' }}>
                      <InboxOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 8 }} />
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>点击或拖拽上传 URDF 文件</div>
                      <Button size="small" type="primary" style={{ marginTop: 12 }} disabled={!isEditing}>选择文件</Button>
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="设备图片">
                    <Upload listType="picture-card" disabled={!isEditing}>
                      <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
                    </Upload>
                    <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 4 }}>支持多张图片，每张不超过 5MB</div>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
