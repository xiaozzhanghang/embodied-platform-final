'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Space, Descriptions, Table, App } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader } from '@/components/ui';

export default function LabelDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { message } = App.useApp();
  
  // In a real app, fetch data based on id
  const activeTag = { id, name: '示例主标签', usage: 12 };

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
      <div className="ui-page ui-detail-page">
        <PageHeader
          title="二级标签管理"
          description="维护当前父标签下的二级分类与唯一编码。"
          breadcrumbs={[{ title: '首页' }, { title: '基础数据' }, { title: '任务标签' }, { title: '二级标签' }]}
          back={() => router.back()}
          extra={[
            <Button key="back" onClick={() => router.back()}>返回</Button>,
            <Button key="save" type="primary" onClick={() => { message.success('保存成功'); router.back(); }}>保存修改</Button>,
          ]}
        />

      <div className="ui-detail-grid" style={{ display: 'grid', gap: 16 }}>
        <Card>
          <Descriptions title="父级信息" bordered column={2} size="small">
              <Descriptions.Item label="标签ID">{activeTag.id}</Descriptions.Item>
              <Descriptions.Item label="标签名称">{activeTag.name}</Descriptions.Item>
              <Descriptions.Item label="当前使用量" span={2}>{activeTag.usage} 个任务关联</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="二级子标签列表" extra={<Button type="primary" icon={<PlusOutlined />}>新增二级子项</Button>}>
          <Table size="small" pagination={false} dataSource={dataSource} columns={columns} />
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}
