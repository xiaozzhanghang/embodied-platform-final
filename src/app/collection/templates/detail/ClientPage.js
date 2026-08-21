'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Card, Table, Breadcrumb, 
  Descriptions, Tag, Divider, Row, Col, Statistic, Tooltip, App
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, CopyOutlined, 
  SolutionOutlined, HistoryOutlined, RobotOutlined,
  AimOutlined, CheckCircleOutlined, DeleteOutlined,
  ExportOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { FormSection, PageHeader, StatusTag } from '@/components/ui';
import { buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text } = Typography;

export default function TemplateDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { message } = App.useApp();
  
  // Mock data for detail
  const template = {
    id,
    name: '通用物体抓取模板',
    code: 'TPL_GEN_GRASP',
    device: 'Galbot V2.2 (RGB)',
    mode: 'WholeBody',
    creator: 'Admin',
    createTime: '2026-01-15 10:00:00',
    updateTime: '2026-03-20 15:44:00',
    desc: '适用于大部分规则几何形状物体的桌面抓取任务。覆盖识别、接近、抓取、抬起、放置全流程，支持多种末端执行器适配。',
    usageCount: 128,
    avgSuccessRate: 94.5,
    status: '已发布',
    version: 'v1.2',
    category: '通用操作',
    totalFrames: 1500,
  };

  const steps = [
    { key: '1', effector: '右手 (Right Arm)', skill: '识别', object: '目标物品', target: '确认位置', startFrame: 0, endFrame: 300 },
    { key: '2', effector: '右手 (Right Arm)', skill: '接近', object: '目标物品', target: '对齐中心', startFrame: 301, endFrame: 600 },
    { key: '3', effector: '右手 (Right Arm)', skill: '抓取', object: '目标物品', target: '稳定握持', startFrame: 601, endFrame: 900 },
    { key: '4', effector: '右手 (Right Arm)', skill: '抬起', object: '目标物品', target: '离地 10cm', startFrame: 901, endFrame: 1200 },
    { key: '5', effector: '右手 (Right Arm)', skill: '放置', object: '容器', target: '精准落框', startFrame: 1201, endFrame: 1500 },
  ];

  const skillColorMap = {
    '识别': 'blue',
    '接近': 'cyan',
    '抓取': 'green',
    '抬起': 'orange',
    '放置': 'purple',
  };

  const columns = [
    { 
      title: '步骤', 
      dataIndex: 'key', 
      width: 72, 
      align: 'center',
      render: (key) => (
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: '#e6f4ff',
          color: '#1677ff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 13,
        }}>
          {key}
        </div>
      ),
    },
    { 
      title: '执行末端', 
      dataIndex: 'effector',
      width: 180,
      render: (val) => (
        <Space size={6}>
          <RobotOutlined style={{ color: '#1677ff' }} />
          <Text>{val}</Text>
        </Space>
      ),
    },
    { 
      title: '原子技能', 
      dataIndex: 'skill', 
      width: 120,
      render: (s) => <Tag color={skillColorMap[s] || 'blue'}>{s}</Tag>,
    },
    { 
      title: '操作对象', 
      dataIndex: 'object',
      width: 140,
      render: (val) => (
        <Space size={6}>
          <AimOutlined style={{ color: '#8c8c8c' }} />
          <Text>{val}</Text>
        </Space>
      ),
    },
    { 
      title: '操作目标', 
      dataIndex: 'target',
      render: (val) => <Text type="secondary">{val}</Text>,
    },
    {
      title: '帧范围',
      key: 'frameRange',
      width: 140,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {record.startFrame} – {record.endFrame}
        </Text>
      ),
    },
  ];

  const handleClone = () => {
    message.success('模板已克隆');
  };

  const handleDelete = () => {
    message.success('模板已删除');
    router.push('/collection/templates');
  };

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={template.name}
          description={`模板编码: ${template.code}`}
          breadcrumbs={[
            { title: '数据采集' },
            { title: '模版中心', href: '/collection/templates' },
            { title: '模板详情' },
          ]}
          back={() => router.back()}
          extra={[
            <Tooltip key="export" title="导出模板">
              <Button icon={<ExportOutlined />}>导出</Button>
            </Tooltip>,
            <Button key="clone" icon={<CopyOutlined />} onClick={handleClone}>克隆模板</Button>,
            <Button 
              key="edit" 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => router.push(buildStaticHref('/collection/templates/create', { id: template.id }))}
            >
              编辑模板
            </Button>,
          ]}
        />

        {/* Status & Meta Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '12px 20px',
          marginBottom: 16,
          background: '#fff',
          border: '1px solid var(--ui-border)',
          borderRadius: 'var(--ui-radius-card)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Space size={8}>
            <Text type="secondary">状态</Text>
            <Tag color="green" icon={<CheckCircleOutlined />}>{template.status}</Tag>
          </Space>
          <Divider type="vertical" style={{ height: 20 }} />
          <Space size={8}>
            <Text type="secondary">版本</Text>
            <Tag>{template.version}</Tag>
          </Space>
          <Divider type="vertical" style={{ height: 20 }} />
          <Space size={8}>
            <Text type="secondary">类别</Text>
            <Tag color="blue">{template.category}</Tag>
          </Space>
          <Divider type="vertical" style={{ height: 20 }} />
          <Space size={8}>
            <Text type="secondary">总帧数</Text>
            <Text strong>{template.totalFrames.toLocaleString()}</Text>
          </Space>
          <div style={{ flex: 1 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            <HistoryOutlined style={{ marginRight: 4 }} />
            更新于 {template.updateTime}
          </Text>
        </div>

        <Row gutter={16}>
          {/* Left: Basic Info */}
          <Col span={16}>
            <FormSection title="基础信息">
              <Descriptions 
                column={2} 
                bordered 
                size="small"
                labelStyle={{ 
                  background: '#fafbfc', 
                  color: 'rgba(0,0,0,0.65)', 
                  fontWeight: 500,
                  width: 120,
                }}
                contentStyle={{
                  color: 'rgba(0,0,0,0.88)',
                }}
              >
                <Descriptions.Item label="适配设备">
                  <Space size={6}>
                    <RobotOutlined style={{ color: '#1677ff' }} />
                    {template.device}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="控制模式">
                  <Tag color="geekblue">{template.mode}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建人">{template.creator}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{template.createTime}</Descriptions.Item>
                <Descriptions.Item label="模板描述" span={2}>
                  {template.desc}
                </Descriptions.Item>
              </Descriptions>
            </FormSection>
          </Col>

          {/* Right: Usage Stats */}
          <Col span={8}>
            <FormSection title="使用统计">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic 
                    title="累计关联任务" 
                    value={template.usageCount} 
                    prefix={<SolutionOutlined />}
                    valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="平均采集成功率" 
                    value={template.avgSuccessRate} 
                    precision={1} 
                    suffix="%" 
                    valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '16px 0 12px' }} />
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ThunderboltOutlined style={{ marginRight: 4, color: '#faad14' }} />
                  活跃任务: 12
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  本月新增: +8
                </Text>
              </div>
            </FormSection>
          </Col>
        </Row>

        {/* SOP Steps */}
        <FormSection title={
          <Space>
            <span>SOP 动作步骤</span>
            <Tag color="blue">{steps.length} 步</Tag>
          </Space>
        }>
          <Table 
            dataSource={steps} 
            columns={columns} 
            pagination={false} 
            size="middle"
            style={{ marginTop: 4 }}
            rowClassName={(_, index) => index % 2 === 0 ? '' : 'table-row-striped'}
          />

          {/* Visual Step Flow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            padding: '20px 0 4px',
            overflowX: 'auto',
          }}>
            {steps.map((step, idx) => (
              <React.Fragment key={step.key}>
                <div style={{
                  flex: 1,
                  minWidth: 100,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: '#1677ff',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 8,
                    boxShadow: '0 2px 8px rgba(22,119,255,0.25)',
                  }}>
                    {step.key}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', fontWeight: 500 }}>
                    {step.skill}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                    {step.target}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{
                    width: 40,
                    height: 2,
                    background: 'linear-gradient(90deg, #1677ff, #69b1ff)',
                    borderRadius: 1,
                    flexShrink: 0,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </FormSection>

        {/* Danger Zone */}
        <div style={{
          marginTop: 8,
          padding: '16px 24px',
          background: '#fff',
          border: '1px solid #ffccc7',
          borderRadius: 'var(--ui-radius-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <Text strong style={{ color: '#ff4d4f' }}>危险操作</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              删除此模板将同时解除所有关联任务的绑定，此操作不可撤销。
            </Text>
          </div>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除模板
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
