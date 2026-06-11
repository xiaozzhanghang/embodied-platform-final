'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, App, Badge, Descriptions, Divider, Select, Row, Col, Form } from 'antd';
import { CloseOutlined, SearchOutlined, ReloadOutlined, LeftOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function AnnotationAuditEpisodeListPage() {
  const router = useRouter();
  const params = useParams();
  const instanceId = params.id;

  const episodeMockData = Array.from({ length: 15 }).map((_, i) => ({
    key: i,
    id: 744101 + i,
    taskName: '调试任务',
    instance: '调试实例...',
    annoTaskName: '调试任务_jo...',
    annoType: '框标注',
    manualTime: i === 0 ? '2026-02-13 09:20:22' : i === 7 ? '2026-03-25 13:36:06' : '',
    modelTime: '',
    parseStatus: '解析完成',
    annoStatus: i === 0 ? '自动标注处理中' : '未标注',
    auditStatus: '未审核',
  }));

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 120 },
    { title: '实例', dataIndex: 'instance', key: 'instance', width: 100, ellipsis: true },
    { title: '标注任务名', dataIndex: 'annoTaskName', width: 140, ellipsis: true },
    { title: '标注类型', dataIndex: 'annoType', width: 100 },
    { title: '人工标注时间', dataIndex: 'manualTime', width: 160 },
    { title: '模型标注时间', dataIndex: 'modelTime', width: 120 },
    { 
      title: '解析状态', 
      dataIndex: 'parseStatus', 
      width: 100, 
      render: (s) => <Tag color="success" style={{ background: '#52c41a', color: '#fff', border: 'none', borderRadius: 2 }}>{s}</Tag> 
    },
    { 
      title: '标注状态', 
      dataIndex: 'annoStatus', 
      width: 130, 
      render: (s) => (
        s === '自动标注处理中' 
        ? <Space><Tag color="orange" style={{ borderRadius: 2 }}>{s}</Tag><Button size="tiny" type="text" style={{ fontSize: 10 }}>重试</Button></Space>
        : <Tag color="default" style={{ borderRadius: 2 }}>{s}</Tag>
      )
    },
    { title: '审核状态', dataIndex: 'auditStatus', width: 100, render: (s) => <Tag color="default" style={{ borderRadius: 2 }}>{s}</Tag> },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => router.push(`/annotation/audit/${instanceId}/${r.id}`)}>标注</Button>
          <Button type="link" size="small" onClick={() => router.push(`/annotation/audit/${instanceId}/${r.id}`)}>审核</Button>
          <Button type="link" size="small">重置</Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
        {/* Header Bar */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
           <Text strong style={{ fontSize: '14px' }}>标注</Text>
           <Space>
             <Button type="primary" size="small">审核全部数据</Button>
             <Button type="text" icon={<CloseOutlined />} onClick={() => router.push('/annotation/audit')} />
           </Space>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Filters */}
          <div style={{ marginBottom: 16 }}>
            <Form layout="inline">
              <Row gutter={[12, 12]} style={{ width: '100%' }}>
                <Col><Input placeholder="ID" style={{ width: 160 }} /></Col>
                <Col><Select placeholder="标注状态" style={{ width: 160 }} /></Col>
                <Col><Select placeholder="审核状态" style={{ width: 160 }} /></Col>
                <Col><Select placeholder="是否报错" style={{ width: 160 }} /></Col>
                <Col>
                  <Space>
                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                    <Button icon={<ReloadOutlined />}>重置</Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </div>

          {/* Table */}
          <Table 
            columns={columns} 
            dataSource={episodeMockData} 
            pagination={{ 
              pageSize: 20, 
              showTotal: (t) => `共 ${t} 条`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
            size="small"
            bordered
            scroll={{ x: 1400 }}
          />
        </div>
      </div>
    </MainLayout>
  );
}
