'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Space, Typography, Table, Tag, Select, DatePicker, Button, Statistic, Progress, Divider, Empty } from 'antd';
import {
  DatabaseOutlined,
  RiseOutlined,
  FileSearchOutlined,
  CloudDownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { FilterPanel, PageHeader, TableToolbar } from '@/components/ui';

const { Title, Text } = Typography;

// Mock report data
const summaryStats = [
  { title: '数据资产总量', value: '1,247', suffix: '条', icon: <DatabaseOutlined />, color: '#1890ff', trend: '+12.5%', trendUp: true },
  { title: '本月新增', value: '86', suffix: '条', icon: <RiseOutlined />, color: '#52c41a', trend: '+23.1%', trendUp: true },
  { title: '质检通过率', value: '94.7', suffix: '%', icon: <CheckCircleOutlined />, color: '#722ed1', trend: '+1.2%', trendUp: true },
  { title: '数据总存储量', value: '2.38', suffix: 'TB', icon: <CloudDownloadOutlined />, color: '#fa8c16', trend: '+180GB', trendUp: true },
];

const monthlyTrend = [
  { month: '1月', count: 82, size: 156 },
  { month: '2月', count: 95, size: 178 },
  { month: '3月', count: 110, size: 210 },
  { month: '4月', count: 88, size: 165 },
  { month: '5月', count: 127, size: 245 },
  { month: '6月', count: 86, size: 198 },
];

const categoryDistribution = [
  { name: '仿真数据', count: 652, percent: 52.3, color: '#1890ff' },
  { name: '真实数据', count: 428, percent: 34.3, color: '#52c41a' },
  { name: '合成数据', count: 167, percent: 13.4, color: '#722ed1' },
];

const sourceDistribution = [
  { name: '银河科技', count: 580, percent: 46.5, color: '#1890ff' },
  { name: '鹿鸣机器人', count: 345, percent: 27.7, color: '#13c2c2' },
  { name: 'Franka Research', count: 198, percent: 15.9, color: '#722ed1' },
  { name: '其他', count: 124, percent: 9.9, color: '#8c8c8c' },
];

const qualityColumns = [
  { title: '数据来源', dataIndex: 'source', key: 'source', render: (text) => <Tag color="blue">{text}</Tag> },
  { title: '总数据量', dataIndex: 'total', key: 'total', sorter: (a, b) => a.total - b.total },
  { title: '质检通过', dataIndex: 'passed', key: 'passed', render: (v) => <Text style={{ color: '#52c41a' }}>{v}</Text> },
  { title: '质检失败', dataIndex: 'failed', key: 'failed', render: (v) => <Text style={{ color: '#ff4d4f' }}>{v}</Text> },
  { title: '通过率', dataIndex: 'rate', key: 'rate', sorter: (a, b) => parseFloat(a.rate) - parseFloat(b.rate), render: (v) => {
    const num = parseFloat(v);
    return <Progress percent={num} size="small" strokeColor={num >= 90 ? '#52c41a' : num >= 70 ? '#faad14' : '#ff4d4f'} style={{ width: 120 }} />;
  }},
  { title: '平均帧数', dataIndex: 'avgFrames', key: 'avgFrames' },
  { title: '存储占用', dataIndex: 'storage', key: 'storage' },
  { title: '最近更新', dataIndex: 'lastUpdate', key: 'lastUpdate', render: (v) => <Text type="secondary">{v}</Text> },
];

const qualityData = [
  { key: '1', source: '银河科技', total: 580, passed: 552, failed: 28, rate: '95.2%', avgFrames: '1,285', storage: '820 GB', lastUpdate: '2026-06-10' },
  { key: '2', source: '鹿鸣机器人', total: 345, passed: 331, failed: 14, rate: '95.9%', avgFrames: '14,520', storage: '680 GB', lastUpdate: '2026-06-09' },
  { key: '3', source: 'Franka Research', total: 198, passed: 180, failed: 18, rate: '90.9%', avgFrames: '2,100', storage: '540 GB', lastUpdate: '2026-06-08' },
  { key: '4', source: '仿真引擎 A', total: 124, passed: 115, failed: 9, rate: '92.7%', avgFrames: '980', storage: '340 GB', lastUpdate: '2026-06-07' },
];

// Simple CSS bar chart component
function SimpleBarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, padding: '0 8px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{item.count}</Text>
          <div style={{
            width: '100%',
            height: `${(item.count / max) * 120}px`,
            background: `linear-gradient(180deg, #1890ff 0%, #69c0ff 100%)`,
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.6s ease',
            minHeight: 8,
          }} />
          <Text style={{ fontSize: 11, color: '#595959' }}>{item.month}</Text>
        </div>
      ))}
    </div>
  );
}

// Simple horizontal bar distribution
function HorizontalDistribution({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 13 }}>{item.name}</Text>
            <Space size={4}>
              <Text strong style={{ fontSize: 13 }}>{item.count}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>({item.percent}%)</Text>
            </Space>
          </div>
          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 10, overflow: 'hidden' }}>
            <div style={{
              width: `${item.percent}%`,
              height: '100%',
              background: item.color,
              borderRadius: 4,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DataReportsPage() {
  return (
    <MainLayout>
      <div className="ui-page">
      <PageHeader
        title="数据资产报表"
        description="汇总数据规模、来源分布与质检趋势。"
        breadcrumbs={[{ title: '数据资产' }, { title: '数据资产报表' }]}
        extra={<Button icon={<CloudDownloadOutlined />}>导出报表</Button>}
      />
      <FilterPanel>
          <Space>
            <Select defaultValue="month" style={{ width: 120 }}>
              <Select.Option value="week">本周</Select.Option>
              <Select.Option value="month">本月</Select.Option>
              <Select.Option value="quarter">本季度</Select.Option>
              <Select.Option value="year">本年</Select.Option>
            </Select>
          </Space>
      </FilterPanel>

      <div className="fade-in-up">
        {/* Summary Stats */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {summaryStats.map((stat, i) => (
            <Col span={6} key={i}>
              <Card variant="borderless" style={{ borderRadius: 8 }} styles={{ body: { padding: '20px 24px' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>{stat.title}</Text>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginTop: 4 }}>
                      {stat.value}<span style={{ fontSize: 14, fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>{stat.suffix}</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {stat.trendUp ? <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12 }} /> : <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />}
                      <Text style={{ color: stat.trendUp ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>{stat.trend}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>较上月</Text>
                    </div>
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${stat.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: stat.color,
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts Row */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={14}>
            <Card
              title={<Space><BarChartOutlined style={{ color: '#1890ff' }} /><span>月度数据采集趋势</span></Space>}
              variant="borderless"
              style={{ borderRadius: 8, height: 320 }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <SimpleBarChart data={monthlyTrend} />
            </Card>
          </Col>
          <Col span={10}>
            <Card
              title={<Space><PieChartOutlined style={{ color: '#722ed1' }} /><span>数据类别分布</span></Space>}
              variant="borderless"
              style={{ borderRadius: 8, height: 320 }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <HorizontalDistribution data={categoryDistribution} />
              <Divider style={{ margin: '16px 0' }} />
              <HorizontalDistribution data={sourceDistribution} />
            </Card>
          </Col>
        </Row>

        {/* Quality Table */}
        <Card
          className="ui-table-card"
          variant="borderless"
          style={{ borderRadius: 8 }}
          styles={{ body: { padding: '16px 24px' } }}
        >
          <TableToolbar title="数据质检概览" count={qualityData.length} />
          <Table
            columns={qualityColumns}
            dataSource={qualityData}
            pagination={false}
            size="middle"
            style={{ marginTop: 8 }}
          />
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}
