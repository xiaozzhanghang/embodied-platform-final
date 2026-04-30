'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Card, Breadcrumb, 
  Descriptions, Tag, Divider, Row, Col, List, Empty
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, FilePdfOutlined, 
  ProjectOutlined, CheckCircleFilled
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Paragraph } = Typography;

export default function TaskbookDetailPage({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  
  // Mock data for detail
  const taskbook = {
    id: id,
    name: '医院场景垃圾清理采集规范 V2.0',
    project: 'SimulatedCollection',
    version: 'v2.0.4',
    creator: 'Admin',
    createTime: '2026-02-10 09:15:22',
    goal: '确保机器人能够稳定识别并抓取不同形态的医疗废弃物袋，采集光照环境下的多维数据。',
    content: `
# 采集环境要求
1. 室内光照需保持在 500lux 以上。
2. 机器人起始位置必须在物体正前方 30cm。

# 动作标准
- 接近动作需平滑，末端抖动控制在 2mm 以内。
- 抓取力度需保持在 15N 左右，防止袋子破裂。
- 抬起高度不少于 15cm，且在空中停留 2s 以确认稳定性。

# 异常处理
- 若发生碰撞，需立即停止录制并复位。
    `,
    checkpoints: [
      '环境光照检查',
      '动作连贯性检查',
      '物体边界无遮挡',
      '关键点标注闭环'
    ]
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb 
          items={[
            { title: '数据采集' },
            { title: '任务书', href: '/collection/taskbooks' },
            { title: '任务书详情' }
          ]} 
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={3} style={{ margin: 0 }}>{taskbook.name}</Title>
            <Tag color="blue" style={{ marginLeft: 16 }}>{taskbook.version}</Tag>
          </div>
          <Space>
            <Button icon={<FilePdfOutlined />} danger>下载 PDF</Button>
            <Button type="primary" icon={<EditOutlined />}>编辑任务书</Button>
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="基础详情" bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="所属项目"><ProjectOutlined /> {taskbook.project}</Descriptions.Item>
              <Descriptions.Item label="创建人">{taskbook.creator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{taskbook.createTime}</Descriptions.Item>
              <Descriptions.Item label="核心指标" span={2}>{taskbook.goal}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="正文内容" bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ padding: '0 16px', background: '#fafafa', borderRadius: 4, minHeight: 400 }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all', 
                fontFamily: 'inherit',
                lineHeight: '1.8'
              }}>
                {taskbook.content}
              </pre>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="质检必检项" bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
            <List
              dataSource={taskbook.checkpoints}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card title="附件预览" bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ 
              height: 200, 
              background: '#f0f2f5', 
              borderRadius: 4, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              border: '1px dashed #d9d9d9'
            }}>
              <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
              <Text type="secondary">PDF 文件预览占位</Text>
              <Button type="link" size="small">点击全屏查看</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
