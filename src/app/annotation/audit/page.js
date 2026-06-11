'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Tabs, Progress, App, Row, Col, Form, Select, Badge, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, LoginOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function AnnotationAuditPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({});

  const instanceMockData = Array.from({ length: 12 }).map((_, i) => ({
    key: i,
    project: 'SimulatedCollection(模拟采集) sin',
    taskbook: 'TB-抓取红色方块',
    annoId: 16822 - i,
    taskId: 21795,
    instanceId: 19884 - i,
    taskType: '垃圾清理',
    annoProgress: '186/186',
    auditProgress: '0/186',
  }));

  const filteredData = React.useMemo(() => {
    return instanceMockData.filter(item => {
      const projectMatch = !filters.project || item.project.includes(filters.project);
      const taskbookMatch = !filters.taskbook || item.taskbook === filters.taskbook;
      const nameMatch = !filters.name || item.taskbook.includes(filters.name);
      const idMatch = !filters.taskId || String(item.taskId).includes(filters.taskId) || String(item.instanceId).includes(filters.taskId);
      const typeMatch = !filters.taskType || item.taskType === filters.taskType;
      return projectMatch && taskbookMatch && nameMatch && idMatch && typeMatch;
    });
  }, [filters]);

  const columns = [
    { title: '', dataIndex: 'checkbox', width: 40, render: () => <Input type="checkbox" /> },
    { title: '项目', dataIndex: 'project', key: 'project', width: 200 },
    { title: '任务书', dataIndex: 'taskbook', key: 'taskbook', width: 180 },
    { title: '标注ID', dataIndex: 'annoId', key: 'annoId', width: 100 },
    { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 100, render: (t) => <Text style={{ color: '#1677ff' }}>{t}</Text> },
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 100, render: (t) => <Text style={{ color: '#1677ff' }}>{t}</Text> },
    { title: '任务类型', dataIndex: 'taskType', width: 100 },
    { title: '标注进度(数量)', dataIndex: 'annoProgress', width: 120 },
    { title: '审核进度(数量)', dataIndex: 'auditProgress', width: 120 },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right',
      render: (_, r) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: 0 }}>重新分配</Button>
          <Button type="link" size="small" icon={<LoginOutlined />} style={{ padding: 0 }} onClick={() => router.push(`/annotation/audit/${r.instanceId}`)}>进入</Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: '数据采集' }, { title: '标注审核' }]} style={{ marginBottom: 16 }} />
      </div>

      <Card 
        style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
        styles={{ body: { padding: '24px 24px 16px' } }}
      >
        <QueryFilter
          submitter={{
            submitButtonProps: { icon: <SearchOutlined /> },
            resetButtonProps: { icon: <ReloadOutlined /> },
          }}
          onFinish={async (values) => {
            setFilters(values);
          }}
          onReset={() => {
            setFilters({});
          }}
        >
          <ProFormSelect name="project" label="一级项目" placeholder="请选择" options={[{label: '模拟采集项目', value: 'SimulatedCollection(模拟采集) sin'}]} />
          <ProFormSelect name="p2" label="二级项目" placeholder="请选择" />
          <ProFormSelect name="taskbook" label="任务书" placeholder="请选择" options={[{label: 'TB-抓取红色方块', value: 'TB-抓取红色方块'}]} />
          <ProFormText name="name" label="任务名称" placeholder="请输入" />
          <ProFormText name="taskId" label="任务ID" placeholder="请输入" />
          <ProFormSelect name="taskType" label="标注类型" placeholder="请选择" options={[{label: '垃圾清理', value: '垃圾清理'}]} />
          <ProFormSelect name="status" label="任务状态" placeholder="请选择" />
          <ProFormSelect name="annotator" label="标注员" placeholder="请选择" />
          <ProFormSelect name="auditor" label="审核员" placeholder="请选择" />
        </QueryFilter>
      </Card>

      {/* Table Section - Matching Screenshot Style */}
      <Card 
        title="审核任务列表" 
        extra={
          <Space>
            <Button icon={<UserOutlined />}>批量分配</Button>
            <Button icon={<DownloadOutlined />}>下载</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }} 
        style={{ borderRadius: 4 }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          scroll={{ x: 1500 }}
          pagination={{ 
            pageSize: 20, 
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
        />
      </Card>
    </MainLayout>
  );
}
