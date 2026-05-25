'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Form, Row, Col, 
  Card, Table, Tag, Breadcrumb, Divider, App, Radio, 
  Tooltip, Select, Modal, Upload, Avatar
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, SaveOutlined, 
  PlusOutlined, UploadOutlined, InfoCircleOutlined,
  ApiOutlined, RobotOutlined, InboxOutlined, DeleteOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Mock data shared with the list page logic
const componentCategories = [
  { value: 'RobotArm', label: '机械臂' },
  { value: 'Chassis', label: '底盘履带' },
  { value: 'LiftTorso', label: '升降躯干' },
  { value: 'Gripper', label: '二指夹爪' },
  { value: 'DexterousHand', label: '多指灵巧手' },
  { value: 'Camera', label: '相机' },
];

export default function PartDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');

  // Initial mock data
  const initialData = {
    name: '灵巧手_右',
    enName: 'hand_right_v2',
    category: 'DexterousHand',
    brand: 'RH-Platform',
    description: '采用高精度压力传感器，支持12个自由度控制。',
    topics: [
      { label: '关节状态', enName: 'joint_states', path: '/hand_r/joint_states', tag: 'grip_s', note: '-' },
      { label: '触觉反馈', enName: 'tactile', path: '/hand_r/tactile', tag: 'touch_s', note: '高频采样' }
    ]
  };

  useEffect(() => {
    form.setFieldsValue(initialData);
  }, []);

  const handleSave = () => {
    form.validateFields().then(values => {
      message.success('部件类型更新成功');
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
          { title: isEditing ? '编辑部件类型' : '查看部件详情' }
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
                <Text strong style={{ fontSize: 16 }}>基础参数</Text>
              </Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="name" label="部件名称" rules={[{ required: true }]}>
                    <Input placeholder="请输入部件名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="enName" label="英文名称">
                    <Input placeholder="请输入英文名称" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="category" label="部件类型" rules={[{ required: true }]}>
                    <Select placeholder="请选择部件类型" options={componentCategories} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="brand" label="部件品牌">
                    <Input placeholder="请输入部件品牌" suffix={<Text type="secondary" style={{ fontSize: 12 }}>0 / 50</Text>} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">
                <Text strong style={{ fontSize: 16 }}>Topic 节点配置</Text>
              </Divider>

              <Form.Item label="Topic组件" style={{ marginBottom: 16 }}>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  <div style={{ display: 'flex', background: '#fafafa', borderBottom: '1px solid #f0f0f0', padding: '8px 12px', fontWeight: 500 }}>
                    <div style={{ width: 40 }}>序号</div>
                    <div style={{ flex: 1, padding: '0 8px' }}>Topic名称</div>
                    <div style={{ flex: 1, padding: '0 8px' }}>英文名称</div>
                    <div style={{ flex: 1, padding: '0 8px' }}>Topic</div>
                    <div style={{ flex: 1, padding: '0 8px' }}>标识</div>
                    <div style={{ flex: 1, padding: '0 8px' }}>备注</div>
                    <div style={{ width: 80, textAlign: 'center' }}>操作</div>
                  </div>
                  <Form.List name="topics">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <div key={key} style={{ display: 'flex', padding: '8px 12px', alignItems: 'center', borderBottom: index === fields.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                            <div style={{ width: 40, textAlign: 'center' }}>{index + 1}</div>
                            <div style={{ flex: 1, padding: '0 4px' }}>
                              <Form.Item {...restField} name={[name, 'label']} noStyle><Input placeholder="名称" size="small" /></Form.Item>
                            </div>
                            <div style={{ flex: 1, padding: '0 4px' }}>
                              <Form.Item {...restField} name={[name, 'enName']} noStyle><Input placeholder="EN" size="small" /></Form.Item>
                            </div>
                            <div style={{ flex: 1, padding: '0 4px' }}>
                              <Form.Item {...restField} name={[name, 'path']} noStyle><Input placeholder="Path" size="small" /></Form.Item>
                            </div>
                            <div style={{ flex: 1, padding: '0 4px' }}>
                              <Form.Item {...restField} name={[name, 'tag']} noStyle><Input placeholder="Tag" size="small" /></Form.Item>
                            </div>
                            <div style={{ flex: 1, padding: '0 4px' }}>
                              <Form.Item {...restField} name={[name, 'note']} noStyle><Input placeholder="Note" size="small" /></Form.Item>
                            </div>
                            <div style={{ width: 80, textAlign: 'center' }}>
                              <Space>
                                <Button type="primary" danger icon={<DeleteOutlined />} size="small" shape="circle" onClick={() => remove(name)} disabled={!isEditing} />
                                <Button type="primary" icon={<PlusOutlined />} size="small" shape="circle" onClick={() => add()} disabled={!isEditing} />
                              </Space>
                            </div>
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <div style={{ padding: 16, textAlign: 'center' }}>
                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} disabled={!isEditing}>添加 Topic 节点</Button>
                          </div>
                        )}
                      </>
                    )}
                  </Form.List>
                </div>
              </Form.Item>

              <Divider orientation="left">
                <Text strong style={{ fontSize: 16 }}>详细描述与资源</Text>
              </Divider>

              <Form.Item name="description" label="传感器描述">
                <TextArea placeholder="请输入传感器描述" autoSize={{ minRows: 3, maxRows: 6 }} showCount maxLength={500} />
              </Form.Item>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="URDF文件" colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                    <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: '16px', textAlign: 'center', background: '#fafafa' }}>
                      <InboxOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 8 }} />
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>点击或拖拽上传 URDF 文件</div>
                      <Button size="small" type="primary" style={{ marginTop: 12 }} disabled={!isEditing}>选择文件</Button>
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="部件图片" colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                    <Upload listType="picture-card" disabled={!isEditing}>
                      <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
                    </Upload>
                    <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 4 }}>支持多张图片，每张不超过 2MB</div>
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
