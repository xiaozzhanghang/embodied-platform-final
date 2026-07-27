'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Card, Table, Breadcrumb, 
  Descriptions, Tag, Divider, Row, Col, Statistic
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, CopyOutlined, 
  SolutionOutlined, HistoryOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function TemplateDetailPage({ params }) {
  const router = useRouter();
  
  // Mock data for detail
  const template = {
    id: params.id,
    name: '通用物体抓取模板',
    code: 'TPL_GEN_GRASP',
    device: 'Galbot V2.2 (RGB)',
    mode: 'WholeBody',
    creator: 'Admin',
    createTime: '2026-01-15 10:00:00',
    desc: '适用于大部分规则几何形状物体的桌面抓取任务。',
    usageCount: 128,
    avgSuccessRate: '94.5%'
  };

  const steps = [
    { key: '1', effector: '右手', skill: '识别', object: '目标物品', target: '确认位置' },
    { key: '2', effector: '右手', skill: '接近', object: '目标物品', target: '对齐中心' },
    { key: '3', effector: '右手', skill: '抓取', object: '目标物品', target: '稳定握持' },
    { key: '4', effector: '右手', skill: '抬起', object: '目标物品', target: '离地 10cm' },
    { key: '5', effector: '右手', skill: '放置', object: '容器', target: '精准落框' },
  ];

  const columns = [
    { title: '序号', dataIndex: 'key', width: 80, align: 'center' },
    { title: '执行末端类型', dataIndex: 'effector' },
    { title: '原子技能', dataIndex: 'skill', render: (s) => <Tag color="blue">{s}</Tag> },
    { title: '操作对象', dataIndex: 'object' },
    { title: '操作目标', dataIndex: 'target' },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb 
          items={[
            { title: '数据采集' },
            { title: '模版中心', href: '/collection/templates' },
            { title: '模板详情' }
          ]} 
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={3} style={{ margin: 0 }}>{template.name}</Title>
            <Tag color="cyan" style={{ marginLeft: 16 }}>{template.code}</Tag>
          </div>
          <Space>
            <Button icon={<CopyOutlined />}>克隆模板</Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => router.push(`/collection/templates/create?id=${template.id}`)}>编辑模板</Button>
          </Space>
        </div>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="基础信息" bordered={false} style={{ borderRadius: 8, height: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="适配设备">{template.device}</Descriptions.Item>
              <Descriptions.Item label="控制模式">{template.mode}</Descriptions.Item>
              <Descriptions.Item label="创建人">{template.creator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{template.createTime}</Descriptions.Item>
              <Descriptions.Item label="模板描述" span={2}>{template.desc}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="使用统计" bordered={false} style={{ borderRadius: 8, height: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="累计关联任务" value={template.usageCount} prefix={<SolutionOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="平均采集成功率" value={94.5} precision={1} suffix="%" />
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              <HistoryOutlined /> 上次更新时间：2026-03-20 15:44
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="SOP 动作步骤" bordered={false} style={{ borderRadius: 8 }}>
        <Table 
          dataSource={steps} 
          columns={columns} 
          pagination={false} 
          size="middle" 
        />
      </Card>
    </MainLayout>
  );
}
