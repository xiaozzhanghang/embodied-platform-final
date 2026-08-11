'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Descriptions, App, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { FormSection, PageHeader, StatusTag } from '@/components/ui';

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
      <div className="ui-page ui-detail-page">
        <PageHeader
          title="采集任务宏观详情"
          description={selectedTask.name}
          breadcrumbs={[
            { title: '首页' },
            { title: '数据采集' },
            { title: '采集任务' },
            { title: '任务详情' },
          ]}
          back={() => router.back()}
          extra={[
            <Button key="edit" icon={<EditOutlined />}>编辑任务</Button>,
            <Button key="delete" danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: '确定废弃？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已废弃') })}>废弃任务</Button>,
          ]}
        />

        <FormSection title="基本配置信息">
          <Descriptions bordered column={2}>
              <Descriptions.Item label="采集任务ID">{selectedTask.taskId}</Descriptions.Item>
              <Descriptions.Item label="任务名称">{selectedTask.name}</Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>{selectedTask.desc}</Descriptions.Item>
              <Descriptions.Item label="采集机器人">{selectedTask.robot}</Descriptions.Item>
              <Descriptions.Item label="所属项目">{selectedTask.project}</Descriptions.Item>
              <Descriptions.Item label="采集场景">{selectedTask.scene}</Descriptions.Item>
              <Descriptions.Item label="采集人员">{selectedTask.collector}</Descriptions.Item>
              <Descriptions.Item label="发布状态"><StatusTag status={selectedTask.publishStatus} /></Descriptions.Item>
              <Descriptions.Item label="采集状态"><StatusTag status="进行中">{selectedTask.collectStatus}</StatusTag></Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedTask.creator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedTask.createTime}</Descriptions.Item>
          </Descriptions>
        </FormSection>

        <FormSection title="更多运行数据（按需扩展）">
          <p style={{ color: '#8c8c8c' }}>目前此任务正处于 {selectedTask.collectStatus} 阶段。如需查看具体的子实例（Instance），请返回列表并点击操作列的“进入”按钮进行下钻。</p>
        </FormSection>
      </div>
    </MainLayout>
  );
}
