'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, Breadcrumb, Tabs, Progress, App, Row, Col, Form, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, AuditOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function AnnotationAuditPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('all');

  const mockData = [
    {
      key: '1',
      annoId: 'ANNO-9921-X',
      instanceId: 'INS-766794-A',
      taskName: '货架物品采集',
      annoTaskName: '手部动作边界标注',
      dataAmount: '120 帧',
      dataDuration: '4.0 分钟',
      status: '审核中',
      isShelf: '是',
      shelfPos: 'A-1-2',
      deviceSN: 'FR3-001-ALPHA',
      qaer: '质检员A',
      annoer: '标注员B',
      auditor: '审核员C',
      collector: '张三',
      qaProgress: '100%',
      annoProgress: '100%',
      auditProgress: '45%',
      annoType: '范围&框标注',
      createTime: '2026-03-24 09:15'
    },
    {
      key: '2',
      annoId: 'ANNO-9922-Y',
      instanceId: 'INS-766794-B',
      taskName: '桌面操作任务',
      annoTaskName: '关键点精准定位',
      dataAmount: '45 帧',
      dataDuration: '1.5 分钟',
      status: '待审核',
      isShelf: '是',
      shelfPos: '-',
      deviceSN: 'UR5-998-BETA',
      qaer: '质检员B',
      annoer: '标注员D',
      auditor: '审核员C',
      collector: '李四',
      qaProgress: '100%',
      annoProgress: '80%',
      auditProgress: '0%',
      annoType: '点标注',
      createTime: '2026-03-24 11:30'
    }
  ];

  const columns = [
    { title: '标注ID', dataIndex: 'annoId', key: 'annoId', width: 130, fixed: 'left' },
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 130 },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 180, ellipsis: true },
    { title: '标注任务名称', dataIndex: 'annoTaskName', key: 'annoTaskName', width: 180, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={s === '审核中' ? 'processing' : 'default'}>{s}</Tag> },
    { 
      title: '进度监控', 
      key: 'progress', 
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>质检: {record.qaProgress}</span>
            <span>标注: {record.annoProgress}</span>
            <span>审核: {record.auditProgress}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <div style={{ height: 4, flex: 1, backgroundColor: '#52c41a', borderRadius: 2 }} />
            <div style={{ height: 4, flex: 1, backgroundColor: '#1890ff', borderRadius: 2 }} />
            <div style={{ height: 4, flex: 1, backgroundColor: record.auditProgress === '0%' ? '#f0f0f0' : '#faad14', borderRadius: 2 }} />
          </div>
        </Space>
      )
    },
    { title: '标注人员', dataIndex: 'annoer', key: 'annoer', width: 100 },
    { title: '审核人员', dataIndex: 'auditor', key: 'auditor', width: 100 },
    { title: '数据量', dataIndex: 'dataAmount', key: 'dataAmount', width: 100 },
    { title: '时长', dataIndex: 'dataDuration', key: 'dataDuration', width: 100 },
    { title: '标注类型', dataIndex: 'annoType', key: 'annoType', width: 120 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<AuditOutlined />}>审核</Button>
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '标注审核' }]} style={{ marginBottom: 16 }} />
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>标注审核中心</Title>
        <Text type="secondary">对已完成标注的数据进行多阶段审核，支持点、框、范围等多种标注类型的质量验收。</Text>
      </div>

      <Card className="search-form" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Form layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col span={6}><Form.Item label="标注ID" style={{ margin: 0, width: '100%' }}><Input placeholder="请输入标注ID" /></Form.Item></Col>
            <Col span={6}><Form.Item label="标注员" style={{ margin: 0, width: '100%' }}><Input placeholder="请输入标注员姓名" /></Form.Item></Col>
            <Col span={6}><Form.Item label="标注状态" style={{ margin: 0, width: '100%' }}><Select placeholder="请选择状态" /></Form.Item></Col>
            <Col span={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>查询结果</Button>
                <Button>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          style={{ padding: '0 24px' }}
          items={[
            { key: 'all', label: '全部任务' },
            { key: 'pending', label: '待审核' },
            { key: 'doing', label: '审核中' },
            { key: 'passed', label: '已通过' },
            { key: 'failed', label: '驳回' },
          ]} 
        />
        <Table 
          columns={columns} 
          dataSource={mockData} 
          scroll={{ x: 2000 }}
          style={{ padding: '0 24px 24px' }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </MainLayout>
  );
}
