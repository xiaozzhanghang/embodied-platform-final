'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Form, Row, Col, 
  Card, Table, Tag, Breadcrumb, Divider, App, Radio, 
  Tooltip, Select, Modal, Upload, Progress, Badge, Descriptions, Tabs
} from 'antd';
import { 
  ArrowLeftOutlined, SaveOutlined, 
  PlusOutlined, UploadOutlined, InfoCircleOutlined,
  ApiOutlined, RobotOutlined, InboxOutlined, DownloadOutlined,
  CodeOutlined, SlidersOutlined, DeploymentUnitOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Mock data
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

// Robot Schematic Visual Module
const RobotSchematic = ({ selectedAlignment }) => (
  <div style={{
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  }}>
    <div style={{
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      width: '120px',
      height: '120px',
      background: 'radial-gradient(circle, rgba(22,119,255,0.18) 0%, transparent 70%)',
      borderRadius: '50%'
    }} />
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Badge color="#1677ff" text={<span style={{ color: '#94a3b8', fontSize: 11 }}>硬件对齐图示</span>} />
      <Tag color="cyan" style={{ fontSize: 10 }}>本体对齐点: {selectedAlignment === '1' ? '灵巧手_右' : selectedAlignment === '3' ? '头部相机' : '未对齐'}</Tag>
    </div>

    <svg width="180" height="240" viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto', display: 'block' }}>
      {/* Grid Pattern Background */}
      <defs>
        <pattern id="schematic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="180" height="240" fill="url(#schematic-grid)" rx="8" />

      {/* Robot Base / Tracks */}
      <rect x="50" y="200" width="80" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
      <circle cx="65" cy="212" r="5" fill="#0f172a" />
      <circle cx="90" cy="212" r="5" fill="#0f172a" />
      <circle cx="115" cy="212" r="5" fill="#0f172a" />
      
      {/* Lift Torso Column */}
      <rect x="83" y="90" width="14" height="110" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <rect x="77" y="110" width="26" height="50" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
      
      {/* Left Arm (Passive) */}
      <path d="M 83 100 L 45 125 L 35 155" stroke="#334155" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45" cy="125" r="3.5" fill="#475569" />
      
      {/* Right Arm (Active alignment path) */}
      <path 
        d="M 97 100 L 135 125 L 145 155" 
        stroke={selectedAlignment === '1' ? '#1677ff' : '#334155'} 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ 
          filter: selectedAlignment === '1' ? 'drop-shadow(0 0 6px rgba(22, 119, 255, 0.6))' : 'none',
          transition: 'all 0.3s ease'
        }} 
      />
      <circle cx="135" cy="125" r="3.5" fill={selectedAlignment === '1' ? '#3b82f6' : '#475569'} style={{ transition: 'all 0.3s' }} />
      {/* Right Dexterous Hand */}
      <rect 
        x="139" 
        y="155" 
        width="12" 
        height="16" 
        rx="2" 
        fill={selectedAlignment === '1' ? '#1677ff' : '#475569'} 
        style={{ 
          filter: selectedAlignment === '1' ? 'drop-shadow(0 0 4px rgba(22, 119, 255, 0.4))' : 'none',
          transition: 'all 0.3s ease'
        }} 
      />

      {/* Neck */}
      <rect x="85" y="70" width="10" height="10" fill="#334155" />
      
      {/* Head Visual */}
      <rect x="65" y="44" width="50" height="28" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <rect x="72" y="50" width="36" height="10" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
      <line x1="76" y1="55" x2="104" y2="55" stroke="#00f2fe" strokeWidth="1.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(0, 242, 254, 0.8))' }} />
      
      {/* Head Camera alignment point */}
      <circle 
        cx="90" 
        cy="34" 
        r="8" 
        fill={selectedAlignment === '3' ? '#1677ff' : '#334155'} 
        stroke="#475569" 
        strokeWidth="1" 
        style={{ 
          filter: selectedAlignment === '3' ? 'drop-shadow(0 0 6px rgba(22, 119, 255, 0.6))' : 'none',
          transition: 'all 0.3s ease'
        }} 
      />
      <circle cx="90" cy="34" r="3.5" fill="#0f172a" />

      {/* Laser Guides */}
      {selectedAlignment === '3' && (
        <>
          <line x1="90" y1="34" x2="140" y2="34" stroke="#1677ff" strokeWidth="1.5" strokeDasharray="3 3" style={{ opacity: 0.8 }} />
          <circle cx="140" cy="34" r="3" fill="#1677ff" />
        </>
      )}
      {selectedAlignment === '1' && (
        <>
          <line x1="145" y1="163" x2="115" y2="163" stroke="#1677ff" strokeWidth="1.5" strokeDasharray="3 3" style={{ opacity: 0.8 }} />
          <circle cx="115" cy="163" r="3" fill="#1677ff" />
        </>
      )}
    </svg>
    <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
      点击右侧【硬件关联】选项中的“对齐点”可动态切换当前对齐的传感器/末端执行器。
    </div>
  </div>
);

export default function DeviceTypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [alignmentPoint, setAlignmentPoint] = useState('1');

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
    setAlignmentPoint(initialData.alignmentPoint);
  }, []);

  const handleSave = () => {
    form.validateFields().then(values => {
      message.success('设备类型更新成功');
      setIsEditing(false);
    });
  };

  return (
    <MainLayout>
      {/* Premium Header Breadcrumbs & Status Bar */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[
          { title: '首页' },
          { title: '设备管理' },
          { title: '设备类型', href: '/collection/device-types' },
          { title: isEditing ? '编辑设备类型' : '查看设备详情' }
        ]} style={{ marginBottom: 16 }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16}>
            <Button type="default" shape="circle" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>{initialData.name}</Title>
                <Tag color="blue" bordered={false} style={{ fontSize: 12, padding: '2px 8px', fontWeight: 'bold' }}>{initialData.version}</Tag>
                <Badge status="processing" text={<span style={{ color: '#52c41a', fontWeight: 'bold' }}>已发布</span>} />
              </div>
            </div>
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

      <Row gutter={24}>
        {/* Left Column: Visual Schematic & Core Details */}
        <Col span={8}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* Robot Schematic Card */}
            <RobotSchematic selectedAlignment={alignmentPoint} />

            {/* URDF File & Configuration Quick Info */}
            <Card 
              title={<Space><CodeOutlined style={{ color: '#1677ff' }} /><Text strong>URDF 模型与固件</Text></Space>}
              bordered={false} 
              style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13, fontFamily: 'monospace' }}>galbot_v2_2.urdf</Text>
                    <Tag color="cyan">85 KB</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>校验哈希: SHA-256 (3a1b82...)</Text>
                  <Button size="small" type="link" icon={<DownloadOutlined />} style={{ padding: 0, marginTop: 8, height: 'auto', fontSize: 11 }}>下载 URDF 模型</Button>
                </div>
                
                <Divider style={{ margin: '8px 0' }} />
                
                <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#262626', fontWeight: 500 }}>
                  <Descriptions.Item label="对齐基准点">
                    {alignmentPoint === '1' ? '右灵巧手 (DexterousHand_R)' : '头部相机 (Camera_Head)'}
                  </Descriptions.Item>
                  <Descriptions.Item label="传感器节点">2 个活跃节点 (Lidar / RGBD)</Descriptions.Item>
                  <Descriptions.Item label="控制频率">100 Hz</Descriptions.Item>
                </Descriptions>
              </div>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Tabbed Forms/Details */}
        <Col span={16}>
          <Card bordered={false} styles={{ body: { padding: '24px' } }} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Form form={form} layout="vertical" disabled={!isEditing}>
              <Tabs 
                defaultActiveKey="basic"
                tabBarStyle={{ marginBottom: 24 }}
                items={[
                  {
                    key: 'basic',
                    label: <Space><SlidersOutlined />基础参数</Space>,
                    children: isEditing ? (
                      <div style={{ padding: '8px 0' }}>
                        <Row gutter={24}>
                          <Col span={12}>
                            <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
                              <Input placeholder="请输入设备名称" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="enName" label={<Space><span>英文名称</span><Tooltip title="仅支持英文、数字、下划线"><InfoCircleOutlined style={{ color: '#bfbfbf' }} /></Tooltip></Space>} rules={[{ required: true, message: '请输入英文名称' }]}>
                              <Input placeholder="请输入英文名称" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={24}>
                          <Col span={12}>
                            <Form.Item name="version" label="设备版本" rules={[{ required: true, message: '请输入设备版本' }]}>
                              <Input placeholder="请输入设备版本" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="deviceType" label="设备类型" rules={[{ required: true, message: '请输入设备类型' }]}>
                              <Input placeholder="请输入设备类型" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item name="desc" label="设备背景描述">
                          <TextArea placeholder="请输入描述信息..." rows={4} maxLength={500} showCount />
                        </Form.Item>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 0' }}>
                        <Descriptions 
                          bordered={false} 
                          column={2} 
                          size="middle"
                          labelStyle={{ color: '#8c8c8c', fontWeight: '500', width: '130px' }}
                          contentStyle={{ color: '#1e293b', fontWeight: '600' }}
                          style={{ marginBottom: 24 }}
                        >
                          <Descriptions.Item label="设备类型名称">{initialData.name}</Descriptions.Item>
                          <Descriptions.Item label="英文标识">{initialData.enName}</Descriptions.Item>
                          <Descriptions.Item label="固件版本号">{initialData.version}</Descriptions.Item>
                          <Descriptions.Item label="基本类别">{initialData.deviceType}</Descriptions.Item>
                        </Descriptions>
                        
                        <Divider style={{ margin: '16px 0' }} />
                        
                        <div style={{ padding: '4px 0' }}>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>设备背景描述</Text>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #f1f5f9', color: '#334155', lineHeight: 1.6 }}>
                            {initialData.desc}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'hardware',
                    label: <Space><DeploymentUnitOutlined />硬件关联</Space>,
                    children: (
                      <div style={{ padding: '8px 0' }}>
                        <Form.Item name="linkedParts" label="管理关联组件" style={{ display: isEditing ? 'block' : 'none' }}>
                          <Select 
                            mode="multiple" 
                            placeholder="请选择部件" 
                            maxTagCount="responsive"
                            options={partData.map(p => ({ label: p.name, value: p.key }))}
                          />
                        </Form.Item>

                        <Form.Item label="已绑定部件列表" valuePropName="dataSource" style={{ marginBottom: 0 }}>
                          <Form.Item shouldUpdate={(prevValues, curValues) => prevValues.linkedParts !== curValues.linkedParts || prevValues.alignmentPoint !== curValues.alignmentPoint} noStyle>
                            {({ getFieldValue, setFieldsValue }) => {
                              const selectedIds = getFieldValue('linkedParts') || [];
                              const currentAlignment = getFieldValue('alignmentPoint') || alignmentPoint;
                              const dataSource = selectedIds.map(id => partData.find(p => p.key === id)).filter(Boolean);
                              
                              return (
                                <Table 
                                  size="middle"
                                  pagination={false}
                                  dataSource={dataSource}
                                  rowKey="key"
                                  bordered={false}
                                  style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}
                                  columns={[
                                    { 
                                      title: '对齐基准点', 
                                      key: 'alignment', 
                                      width: 120, 
                                      align: 'center',
                                      render: (_, record) => {
                                        const checked = currentAlignment === record.key;
                                        return (
                                          <Form.Item name="alignmentPoint" noStyle>
                                            <Radio 
                                              checked={checked}
                                              disabled={!isEditing}
                                              onChange={() => {
                                                setFieldsValue({ alignmentPoint: record.key });
                                                setAlignmentPoint(record.key);
                                              }} 
                                            />
                                          </Form.Item>
                                        );
                                      }
                                    },
                                    { 
                                      title: '部件名称', 
                                      dataIndex: 'name', 
                                      key: 'name',
                                      render: (text, record) => (
                                        <Space>
                                          <ApiOutlined style={{ color: currentAlignment === record.key ? '#1677ff' : '#8c8c8c' }} />
                                          <Text strong={currentAlignment === record.key} style={{ color: currentAlignment === record.key ? '#1677ff' : 'inherit' }}>{text}</Text>
                                          {currentAlignment === record.key && <Tag color="blue" bordered={false} size="small">Active Base</Tag>}
                                        </Space>
                                      )
                                    },
                                    { 
                                      title: '组件分类', 
                                      dataIndex: 'category', 
                                      key: 'category',
                                      render: (cat) => {
                                        const found = componentCategories.find(c => c.value === cat);
                                        return <Tag color="purple" bordered={false}>{found ? found.label : cat}</Tag>;
                                      }
                                    }
                                  ]}
                                />
                              );
                            }}
                          </Form.Item>
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'sensors',
                    label: <Space><InfoCircleOutlined />配置描述与资源</Space>,
                    children: (
                      <div style={{ padding: '8px 0' }}>
                        <Form.Item name="sensorDesc" label="传感器配置简述" rules={[{ required: true, message: '请输入传感器简述' }]}>
                          <TextArea placeholder="请填写传感器配置的说明" rows={3} maxLength={200} showCount />
                        </Form.Item>

                        <Row gutter={24} style={{ marginTop: 12 }}>
                          <Col span={12}>
                            <Form.Item label="URDF 模型管理">
                              <div style={{ 
                                border: '1px dashed #d9d9d9', 
                                borderRadius: 12, 
                                padding: '24px 16px', 
                                textAlign: 'center', 
                                background: '#fafafa',
                                transition: 'all 0.3s'
                              }}>
                                <InboxOutlined style={{ fontSize: 36, color: '#1677ff', marginBottom: 8 }} />
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#262626', marginBottom: 4 }}>点击或拖拽上传新模型</div>
                                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 12 }}>仅支持 .urdf, .xml 文件</div>
                                <Button size="small" type="primary" disabled={!isEditing}>选择文件</Button>
                              </div>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="设备图档">
                              <Upload listType="picture-card" disabled={!isEditing}>
                                <div><PlusOutlined /><div style={{ marginTop: 8, fontSize: 11 }}>添加图片</div></div>
                              </Upload>
                              <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 8 }}>支持多张图片，不超过5MB且格式为JPG/PNG/GIF</div>
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )
                  }
                ]}
              />
            </Form>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
