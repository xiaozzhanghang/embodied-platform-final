'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Descriptions, Badge, App, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const publishStatusMap = { '已发布': 'success', '待发布': 'warning', '已废弃': 'default' };
const collectStatusMap = { '采集中': 'processing', '采集完成': 'success', '待采集': 'default' };

export default function TaskDetailPage({ params }) {
  const router = useRouter();
  const { message } = App.useApp();
  
  // Mock data based on params.taskId
  const selectedTask = {
    taskId: params.taskId || 'CT-20250301001',
    name: 'FRANKA-FR3-抓取红色方块-001',
    desc: '在桌面环境下，使用右臂抓取指定的红色方块并放置到目标位置。',
    robot: 'FRANKA-FR3',
    project: 'SimulatedCollection',
    scene: '居家场景',
    collector: '张三',
    publishStatus: '已发布',
    collectStatus: '采集中',
    creator: '管理员',
    createTime: '2025-02-28 14:30'
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={4} style={{ margin: 0 }}>采集任务宏观详情</Title>
        </div>
        <Space>
            <Button icon={<EditOutlined />}>编辑任务</Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: '确定废弃？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已废弃') })}>废弃任务</Button>
        </Space>
      </div>

      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
          <Descriptions title="基本配置信息" bordered column={2}>
              <Descriptions.Item label="采集任务ID">{selectedTask.taskId}</Descriptions.Item>
              <Descriptions.Item label="任务名称">{selectedTask.name}</Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>{selectedTask.desc}</Descriptions.Item>
              <Descriptions.Item label="采集机器人">{selectedTask.robot}</Descriptions.Item>
              <Descriptions.Item label="所属项目">{selectedTask.project}</Descriptions.Item>
              <Descriptions.Item label="采集场景">{selectedTask.scene}</Descriptions.Item>
              <Descriptions.Item label="采集人员">{selectedTask.collector}</Descriptions.Item>
              <Descriptions.Item label="发布状态"><Badge status={publishStatusMap[selectedTask.publishStatus] || 'default'} text={selectedTask.publishStatus} /></Descriptions.Item>
              <Descriptions.Item label="采集状态"><Badge status={collectStatusMap[selectedTask.collectStatus] || 'default'} text={selectedTask.collectStatus} /></Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedTask.creator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedTask.createTime}</Descriptions.Item>
          </Descriptions>
      </Card>
      
      <Card bordered={false} title="更多运行数据（按需扩展）">
          <p style={{ color: '#8c8c8c' }}>目前此任务正处于 {selectedTask.collectStatus} 阶段。如需查看具体的子实例（Instance），请返回列表并点击操作列的“进入”按钮进行下钻。</p>
      </Card>
    </MainLayout>
  );
}
