'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table, Button, Tag, Space, Input, Select, Form,
  Card, Typography, Modal, Progress, App, Row, Col,
  Statistic, Badge, Tooltip, Divider, Alert, Tabs
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlayCircleOutlined,
  CheckOutlined, CloseOutlined, EyeOutlined, AuditOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  DownloadOutlined, UserOutlined, ClockCircleOutlined,
  ArrowRightOutlined, LeftOutlined, RightOutlined,
  CameraOutlined, FormOutlined, FileSearchOutlined, DatabaseOutlined,
  MinusCircleOutlined, UndoOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { AppModal, FilterPanel, PageHeader, StatusTag, TableToolbar, TableToolbarActions } from '@/components/ui';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ANNO_TYPES = ['语义标注', '范围标注'];

const annoTypeColors = {
  '语义标注': 'blue',
  '范围标注': 'purple',
  '点标注': 'cyan',
  '框标注': 'green',
};

function ReviewListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const instanceId = searchParams.get('instanceId') || '19884';
  const taskName = searchParams.get('taskName') || '垃圾清理_任务_001';

  // Tabs: all, pending (未审核), passed (通过), rejected (不通过)
  const [activeTab, setActiveTab] = useState('all');
  const [filterId, setFilterId] = useState('');
  const [filterAnnoType, setFilterAnnoType] = useState();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableDensity, setTableDensity] = useState('middle');
  const [hiddenColumns, setHiddenColumns] = useState([]);

  // Mock Episode Data for the selected instance
  const [episodes, setEpisodes] = useState(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const isDual = i % 2 === 0;
      const device = isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)';
      const annoType = isDual ? '语义标注' : '范围标注';

      const annoStatuses = ['已标注', '已标注', '待校验'];
      const auditStatuses = ['未审核', '通过', '未审核', '不通过'];
      const annoStatus = annoStatuses[i % annoStatuses.length];
      const auditStatus = auditStatuses[i % auditStatuses.length];
      const totalFrames = 120 + (i * 12);

      return {
        key: String(i + 1),
        id: 744101 + i,
        episodeId: `EP-${instanceId}-${String(i + 1).padStart(3, '0')}`,
        taskName: isDual ? ['抓取垃圾物品', '移动纸箱', '清理台面'][i % 3] : ['桌面整理', '分类入桶', '废弃物收纳'][i % 3],
        instance: `实例_${instanceId}_${String(i + 1).padStart(3, '0')}`,
        annoTaskName: `${taskName}_标注_${['张三', '李四', '王五', '赵六'][i % 4]}_${String(i + 1).padStart(2, '0')}`,
        device,
        annoType,
        totalFrames,
        manualTime: `2026-04-16 10:${String(10 + i * 2).padStart(2, '0')}:00`,
        modelTime: i % 3 === 0 ? `2026-04-16 09:00:00` : '',
        parseStatus: '解析完成',
        annoStatus,
        auditStatus,
        annotator: ['张三', '李四', '王五', '赵六'][i % 4],
        auditor: ['天奇管理员', '王五', '李四'][(i + 1) % 3],
        segmentsCount: isDual ? 2 : 3,
      };
    });
  });

  // Tab counts
  const allCount = episodes.length;
  const pendingCount = episodes.filter(e => e.auditStatus === '未审核' || e.auditStatus === '待审核').length;
  const passedCount = episodes.filter(e => e.auditStatus === '通过' || e.auditStatus === '已通过').length;
  const rejectedCount = episodes.filter(e => e.auditStatus === '不通过' || e.auditStatus === '已驳回').length;

  const tabItems = [
    { key: 'all', label: `全部 (${allCount})` },
    { key: 'pending', label: <span><ClockCircleOutlined style={{ marginRight: 6 }} />待审核 ({pendingCount})</span> },
    { key: 'passed', label: <span><CheckCircleOutlined style={{ marginRight: 6 }} />已通过 ({passedCount})</span> },
    { key: 'rejected', label: <span><CloseCircleOutlined style={{ marginRight: 6 }} />未通过 ({rejectedCount})</span> },
  ];

  const filteredEpisodes = useMemo(() => {
    return episodes.filter(ep => {
      if (activeTab === 'pending' && ep.auditStatus !== '未审核' && ep.auditStatus !== '待审核') return false;
      if (activeTab === 'passed' && ep.auditStatus !== '通过' && ep.auditStatus !== '已通过') return false;
      if (activeTab === 'rejected' && ep.auditStatus !== '不通过' && ep.auditStatus !== '已驳回') return false;

      if (filterId && !String(ep.id).includes(filterId) && !ep.episodeId.toLowerCase().includes(filterId.toLowerCase())) return false;
      if (filterAnnoType && ep.annoType !== filterAnnoType) return false;

      return true;
    });
  }, [episodes, activeTab, filterId, filterAnnoType]);

  // Batch Pass
  const handleBatchPass = () => {
    if (selectedRowKeys.length === 0) return;
    setEpisodes(prev => prev.map(ep => {
      if (selectedRowKeys.includes(ep.key)) {
        return { ...ep, auditStatus: '通过' };
      }
      return ep;
    }));
    message.success(`已批量审核通过 ${selectedRowKeys.length} 条 Episode 数据！`);
    setSelectedRowKeys([]);
  };

  // Batch Reject
  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: '批量打回重标',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `确定要将选中的 ${selectedRowKeys.length} 条标注数据打回给标注员重新标注吗？`,
      okText: '确定打回',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return { ...ep, auditStatus: '不通过' };
          }
          return ep;
        }));
        message.warning(`已将 ${selectedRowKeys.length} 条标注数据驳回重标！`);
        setSelectedRowKeys([]);
      }
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      render: (id) => <span style={{ color: '#1677ff', fontFamily: 'monospace', fontWeight: 600 }}>{id}</span>
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 160,
      ellipsis: true
    },
    {
      title: '实例',
      dataIndex: 'instance',
      key: 'instance',
      width: 150,
      ellipsis: true,
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>
    },
    {
      title: '标注任务名',
      dataIndex: 'annoTaskName',
      key: 'annoTaskName',
      width: 200,
      ellipsis: true
    },
    {
      title: '标注类型',
      dataIndex: 'annoType',
      key: 'annoType',
      width: 110,
      align: 'center',
      render: (t) => <Tag color={annoTypeColors[t]} style={{ margin: 0 }}>{t}</Tag>
    },
    {
      title: '数据帧数',
      dataIndex: 'totalFrames',
      key: 'totalFrames',
      width: 100,
      align: 'right',
      render: (t) => <strong>{t} f</strong>
    },
    {
      title: '标注人员',
      dataIndex: 'annotator',
      key: 'annotator',
      width: 100,
      render: (a) => <Space size={4}><UserOutlined style={{ color: '#1890ff' }} /><Text>{a}</Text></Space>
    },
    {
      title: '人工标注时间',
      dataIndex: 'manualTime',
      key: 'manualTime',
      width: 170,
      render: (t) => t || <Text type="secondary">-</Text>
    },
    {
      title: '标注状态',
      dataIndex: 'annoStatus',
      key: 'annoStatus',
      width: 110,
      align: 'center',
      render: (s) => <StatusTag status={s} />
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 110,
      align: 'center',
      render: (s) => <StatusTag status={s === '不通过' ? '未通过' : s === '通过' ? '已通过' : s} />
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, r) => {
        return (
          <Space separator={<Divider orientation="vertical" />} size={0}>
            {/* 核心审核按钮：进入审核工作台 */}
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              style={{ padding: '0 4px', fontWeight: 600, color: '#722ed1' }}
              onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
                id: instanceId,
                episodeId: r.id,
                type: r.annoType,
                mode: 'audit',
              }))}
            >
              审核
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              style={{ padding: '0 4px' }}
              onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
                id: instanceId,
                episodeId: r.id,
                type: r.annoType,
                mode: 'view',
              }))}
            >
              查看
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title={`数据审核 — 实例 #${instanceId}`}
          description={`查看当前任务「${taskName}」的标注结果，执行质量审核、验收通过或驳回重标。`}
          breadcrumbs={[
            { title: '首页' },
            { title: '任务管理' },
            { title: '数据审核', href: '/annotation/review' },
            { title: `实例 #${instanceId}` },
          ]}
          back={() => router.push('/annotation/review')}
          extra={[
            <Button
              key="pass-all"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => {
                setEpisodes(prev => prev.map(ep => ({ ...ep, auditStatus: '通过' })));
                message.success('已将当前实例全部数据标记为【审核通过】！');
              }}
            >
              一键全部通过
            </Button>
          ]}
        />

        {/* Top Metric Cards */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>待审核 Episode</span>}
                value={pendingCount}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontWeight: 700 }}
                suffix={<Text type="secondary" style={{ fontSize: 12 }}>/ {episodes.length}</Text>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>审核已通过</span>}
                value={passedCount}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>未通过 (驳回重标)</span>}
                value={rejectedCount}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>审核合格率</span>}
                value={allCount > 0 ? ((passedCount / (passedCount + rejectedCount || 1)) * 100).toFixed(1) : '100'}
                prefix={<CheckOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* Filter Section */}
        <FilterPanel>
          <Row gutter={16} align="middle">
            <Col flex="260px">
              <Input
                placeholder="搜索 Episode ID"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                allowClear
                value={filterId}
                onChange={e => setFilterId(e.target.value)}
              />
            </Col>
            <Col flex="180px">
              <Select
                placeholder="标注类型"
                allowClear
                style={{ width: '100%' }}
                value={filterAnnoType}
                onChange={setFilterAnnoType}
                options={ANNO_TYPES.map(t => ({ label: t, value: t }))}
              />
            </Col>
            <Col>
              <Button onClick={() => { setFilterId(''); setFilterAnnoType(undefined); }}>
                重置
              </Button>
            </Col>
          </Row>
        </FilterPanel>

        {/* Table Card */}
        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          <div style={{ padding: '0 20px', borderBottom: '1px solid #f0f0f0' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ marginBottom: -1 }}
              items={tabItems}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f' }}>
              标注审核数据列表
            </div>
            <Space size={12}>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchPass}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                批量通过 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchReject}
              >
                批量打回 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
              </Button>
              <TableToolbarActions
                columns={columns}
                density={tableDensity}
                onDensityChange={setTableDensity}
                hiddenColumns={hiddenColumns}
                onHiddenColumnsChange={setHiddenColumns}
                onRefresh={() => message.success('数据已刷新')}
              />
            </Space>
          </div>

          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            columns={columns.filter(col => !hiddenColumns.includes(col.key))}
            dataSource={filteredEpisodes}
            scroll={{ x: 1600 }}
            size={tableDensity}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条标注审核数据`,
            }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}

export default function ReviewListPage() {
  return <ReviewListContent />;
}
