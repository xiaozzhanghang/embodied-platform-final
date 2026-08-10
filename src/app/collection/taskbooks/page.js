'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Card, Typography, Space, Tag, Input, Badge, Breadcrumb, Select, Form, Tooltip, Row, Col, Modal, App } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, ColumnHeightOutlined, SettingOutlined, RobotOutlined, DownOutlined, UpOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { FilterPanel, PageHeader, StatusTag, TableToolbar } from '@/components/ui';

const { Title, Text } = Typography;

export default function TaskbooksPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const mockData = [
    { key: '1', id: 'TB-2025001', name: '桌面抓取SOP规范', scene: '桌面场景', version: 'V1.0', status: '已发布', createTime: '2025-01-10 10:00:00', updateTime: '2025-01-12 14:30:00' },
    { key: '2', id: 'TB-2025002', name: '工业组装SOP规范', scene: '工厂场景', version: 'V2.1', status: '已发布', createTime: '2025-02-15 09:00:00', updateTime: '2025-02-16 11:20:00' },
    { key: '3', id: 'TB-2025005', name: '室内导航清扫规范', scene: '家庭场景', version: 'V1.0', status: '审核中', createTime: '2025-03-01 16:45:00', updateTime: '2025-03-01 16:45:00' },
  ];

  const columns = [
    { title: '任务书编号', dataIndex: 'id', key: 'id', width: 150 },
    { title: '任务书名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
    { title: '适用场景', dataIndex: 'scene', key: 'scene', width: 150 },
    { 
      title: '版本号', 
      dataIndex: 'version', 
      key: 'version', 
      width: 100,
      render: (v) => <Tag color="blue">{v}</Tag> 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 120,
      render: (s) => <StatusTag status={s} />
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
    {
      title: '操作', key: 'action', width: 360, fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/taskbooks/detail/${record.id}`)}>查看详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/collection/taskbooks/create?mode=edit&id=${record.id}`)}>编辑</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} style={{ padding: 0 }}>下载</Button>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: 0 }} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}>删除</Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="任务书"
          description="指导数据采集的标准作业程序（SOP），支持 PDF / Word 上传与智能生成。"
          breadcrumbs={[{ title: '首页' }, { title: '数据采集' }, { title: '任务书' }]}
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/taskbooks/create')}>手动新建</Button>}
        />

        <FilterPanel>
          <QueryFilter
            submitter={{
                submitButtonProps: { icon: <SearchOutlined /> },
                resetButtonProps: { icon: <ReloadOutlined /> },
            }}
        >
            <ProFormText name="name" label="任务书名称" placeholder="请输入" />
            <ProFormSelect name="scene" label="适用场景" placeholder="请选择" />
            <ProFormSelect name="status" label="状态" placeholder="全部" />
            <ProFormText name="createTime" label="创建时间" placeholder="请选择范围" />
            <ProFormText name="version" label="版本号" placeholder="请输入版本" />
          </QueryFilter>
        </FilterPanel>

        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          <TableToolbar
            title="任务书列表"
            count={mockData.length}
            actions={[
              <Button key="ai" icon={<RobotOutlined />}>AI 智能建书</Button>,
              <Tooltip key="refresh" title="刷新"><Button icon={<ReloadOutlined />} /></Tooltip>,
              <Tooltip key="density" title="密度"><Button icon={<ColumnHeightOutlined />} /></Tooltip>,
              <Tooltip key="columns" title="列设置"><Button icon={<SettingOutlined />} /></Tooltip>,
            ]}
          />

          <Table
            rowSelection={{ type: 'checkbox' }}
            columns={columns}
            dataSource={mockData}
            scroll={{ x: 1300 }}
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
