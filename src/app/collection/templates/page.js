'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Space, Card, Typography, Breadcrumb, Tag, 
  App, Row, Col, Avatar, Tooltip, Input, Divider, Form, Select
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, LayoutOutlined,
  ShoppingOutlined, ToolOutlined, RestOutlined,
  SkinOutlined, ExperimentOutlined, DeleteOutlined,
  EditOutlined, PlayCircleOutlined, ReloadOutlined, DownOutlined, UpOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function TaskTemplatesPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [expand, setExpand] = useState(false);

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

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '任务模板' }]} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>任务模板管理</Title>
            <Text type="secondary">预定义采集 SOP 步骤模板，确保不同批次的采集任务具有统一的操作规范。</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => router.push('/collection/templates/create')}>
            创建新模板
          </Button>
        </div>
      </div>

      <Card 
        style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
        styles={{ body: { padding: '24px 24px 0' } }}
      >
        <Form layout="horizontal" labelCol={{ flex: '80px' }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="模板名称">
                <Input placeholder="搜索模板名称..." prefix={<SearchOutlined />} allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="模板类型">
                <Select placeholder="全部类型" allowClear options={[{label:'服务数据', value:'service'}, {label:'工业数据', value:'industry'}]} />
              </Form.Item>
            </Col>
            {!expand && (
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button icon={<ReloadOutlined />}>重置</Button>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                    展开 <DownOutlined />
                  </a>
                </Space>
              </Col>
            )}
          </Row>
          {expand && (
            <>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="创建人">
                    <Input placeholder="请输入创建人" allowClear />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="更新时间">
                    <Input placeholder="请选择时间范围" allowClear />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={24} style={{ textAlign: 'right', marginBottom: 24 }}>
                  <Space>
                    <Button icon={<ReloadOutlined />}>重置</Button>
                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                    <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                      收起 <UpOutlined />
                    </a>
                  </Space>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Card>

      <Row gutter={[24, 24]}>
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
                  <Tag color="blue" bordered={false} style={{ fontSize: 11 }}>{tpl.type}</Tag>
                  <Tag bordered={false} style={{ fontSize: 11 }}>{tpl.device}</Tag>
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

      <style jsx>{`
        .hover-action:hover {
          background: #f0f0f0;
        }
        .hover-action:hover span {
          color: #1677ff !important;
        }
      `}</style>
    </MainLayout>
  );
}
