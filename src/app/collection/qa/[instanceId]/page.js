'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Card, Typography, Breadcrumb, Badge, App, Modal, Descriptions } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, PlayCircleOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockSequences = [
  { 
    key: '1', 
    seqId: 'SEQ-10029-01', 
    filePath: '/mnt/data/sim_coll/CT-001/INST-001/seq_01.h5', 
    sizeInfo: '1.2GB / 153帧', 
    isTakeover: '否', 
    parseStatus: '解析完成', 
    uploadTime: '2025-03-01 09:05', 
    reviewStatus: '待覆检' 
  },
  { 
    key: '2', 
    seqId: 'SEQ-10029-02', 
    filePath: '/mnt/data/sim_coll/CT-001/INST-001/seq_02.h5', 
    sizeInfo: '0.8GB / 92帧', 
    isTakeover: '是', 
    parseStatus: '解析完成', 
    uploadTime: '2025-03-01 09:15', 
    reviewStatus: '覆检通过' 
  },
];

export default function QaSequencePage() {
  const { instanceId: id } = useParams();
  const router = useRouter();
  const { message } = App.useApp();

  const columns = [
    { title: '序列包编号', dataIndex: 'seqId', key: 'seqId', width: 150 },
    { title: '文件路径', dataIndex: 'filePath', key: 'filePath', ellipsis: true },
    { title: '大小/帧数', dataIndex: 'sizeInfo', key: 'sizeInfo', width: 150 },
    { title: '是否接管', dataIndex: 'isTakeover', key: 'isTakeover', width: 100 },
    { title: '解析状态', dataIndex: 'parseStatus', key: 'parseStatus', width: 120, render: (s) => <Tag color="blue">{s}</Tag> },
    { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 170 },
    { title: '覆检状态', dataIndex: 'reviewStatus', key: 'reviewStatus', width: 120, render: (s) => <Tag color={s === '覆检通过' ? 'success' : 'orange'}>{s}</Tag> },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => router.push(`/collection/qa/${id}/${record.seqId}`)}>预览/质检</Button>
          <Button type="link" size="small" icon={<CheckCircleOutlined />}>通过</Button>
          <Button type="link" size="small" danger icon={<StopOutlined />}>不合格</Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>序列包列表</Title>
          <Text type="secondary">实例任务 ID: {id}</Text>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="所属项目">SimulatedCollection</Descriptions.Item>
          <Descriptions.Item label="任务书">TB-2025001-桌面抓取SOP</Descriptions.Item>
          <Descriptions.Item label="采集员">张三</Descriptions.Item>
          <Descriptions.Item label="总帧数">245帧</Descriptions.Item>
          <Descriptions.Item label="质检员">质检员A</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color="processing">质检进行中</Tag></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <div className="table-toolbar" style={{ padding: '16px 24px' }}>
          <span className="table-toolbar-title">序列分片明细</span>
          <Space>
            <Button icon={<CheckCircleOutlined />}>批量通过</Button>
            <Button danger icon={<StopOutlined />}>批量打回</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={mockSequences} scroll={{ x: 1500 }} pagination={false} />
      </Card>
      
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" size="large" onClick={() => message.success('该实例任务已完成整体质检，并同步至标库')}>完成本例质检</Button>
      </div>
    </MainLayout>
  );
}
