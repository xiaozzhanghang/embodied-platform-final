'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Descriptions, Divider, Table, App } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

export default function LabelDetailPage({ params }) {
  const router = useRouter();
  const { message } = App.useApp();
  
  // In a real app, fetch data based on params.id
  const activeTag = { id: params.id, name: '示例主标签', usage: 12 };

  const columns = [
    { title: '子标签名', dataIndex: 'name' },
    { title: '唯一编码', dataIndex: 'code' },
    { title: '操作', fixed: 'right', render: () => <Space><Button type="link" size="small" icon={<EditOutlined />}>编辑</Button><Button type="link" size="small" danger icon={<DeleteOutlined />}>移除</Button></Space> }
  ];

  const dataSource = [
    { key: '1', name: '子项A', code: 'Sub_A', creator: 'admin' },
    { key: '2', name: '子项B', code: 'Sub_B', creator: 'admin' },
  ];

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={4} style={{ margin: 0 }}>二级标签管理</Title>
        </div>
        <Space>
            <Button onClick={() => router.back()}>返回</Button>
            <Button type="primary" onClick={() => { message.success('保存成功'); router.back(); }}>保存修改</Button>
        </Space>
      </div>

      <Card bordered={false} style={{ marginBottom: 24 }}>
          <Descriptions title="父级信息" bordered column={2} size="small">
              <Descriptions.Item label="标签ID">{activeTag.id}</Descriptions.Item>
              <Descriptions.Item label="标签名称">{activeTag.name}</Descriptions.Item>
              <Descriptions.Item label="当前使用量" span={2}>{activeTag.usage} 个任务关联</Descriptions.Item>
          </Descriptions>
      </Card>

      <Card title="二级子标签列表" bordered={false} extra={<Button type="primary" icon={<PlusOutlined />}>新增二级子项</Button>}>
          <Table size="small" pagination={false} dataSource={dataSource} columns={columns} />
      </Card>
    </MainLayout>
  );
}
