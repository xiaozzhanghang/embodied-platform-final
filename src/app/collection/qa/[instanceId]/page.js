'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Select, App } from 'antd';
import { SearchOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

export default function QaSequencePage() {
  const { instanceId: id } = useParams();
  const router = useRouter();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 100 },
    { title: '设备SN', dataIndex: 'deviceSN', key: 'deviceSN', width: 120 },
    { title: '实例', dataIndex: 'instance', key: 'instance', width: 100 },
    { title: '文件路径', dataIndex: 'filePath', key: 'filePath', ellipsis: true, width: 200 },
    { title: '文件大小', dataIndex: 'fileSize', key: 'fileSize', width: 100 },
    { title: '内容时长', dataIndex: 'duration', key: 'duration', width: 100 },
    { title: '是否接管', dataIndex: 'isTakeover', key: 'isTakeover', width: 100 },
    { 
      title: '解析状态', 
      dataIndex: 'parseStatus', 
      key: 'parseStatus', 
      width: 180,
      render: () => (
        <Space size="small">
          <Tag color="success">解析完成</Tag>
          <Button type="primary" size="small" style={{ backgroundColor: '#4096ff', fontSize: 12 }}>重新解析</Button>
        </Space>
      )
    },
    { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 160 },
    { 
      title: '质检状态', 
      dataIndex: 'qaStatus', 
      key: 'qaStatus',
      width: 100,
      render: () => <Tag color="success">优秀</Tag>
    },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => router.push(`/collection/qa/${id}/${record.id}`)}>
            质检
          </Button>
          <Button type="link" size="small" danger style={{ padding: 0 }}>删除</Button>
        </Space>
      )
    }
  ];

  const data = [
    { key: '1', id: '766794', taskName: 'test', deviceSN: 'R001GB...', instance: 'test_job', filePath: 'collect-d...', fileSize: '84.71MB', duration: '4', isTakeover: '--', uploadTime: '2026-02-25 15:...' },
    { key: '2', id: '766804', taskName: 'test', deviceSN: 'R001GB...', instance: 'test_job', filePath: 'collect-d...', fileSize: '222.87MB', duration: '9.6', isTakeover: '--', uploadTime: '2026-02-25 15:...' }
  ];

  return (
    <MainLayout>
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: 8, 
        minHeight: 'calc(100vh - 48px)', // assuming standard 24px padding top/bottom in MainLayout
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#262626' }}>质检</span>
          <Button 
            type="text" 
            icon={<CloseOutlined style={{ color: '#8c8c8c' }} />} 
            onClick={() => router.back()} 
          />
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flexGrow: 1 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <Select defaultValue="解析完成" style={{ width: 160 }} allowClear mode="multiple" maxTagCount={1}>
              <Select.Option value="解析完成">解析完成</Select.Option>
            </Select>
            <Select placeholder="系统状态" style={{ width: 160 }} allowClear />
            <Select placeholder="是否接管" style={{ width: 160 }} allowClear />
            <Button type="primary" icon={<SearchOutlined />}>搜索</Button>
            <Button icon={<ReloadOutlined />}>重置</Button>
            <Button type="primary" style={{ backgroundColor: '#4096ff' }}>重新解析</Button>
          </div>

          {/* Table */}
          <Table 
            columns={columns} 
            dataSource={data} 
            scroll={{ x: 1500 }}
            pagination={{ 
              pageSize: 20, 
              showTotal: (t) => `共 ${t} 条`, 
              showSizeChanger: true,
              showQuickJumper: true,
              style: { marginTop: 24 }
            }} 
            size="middle"
          />
        </div>
      </div>
    </MainLayout>
  );
}
