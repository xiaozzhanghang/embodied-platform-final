'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, App, Badge, Select, Row, Col, Form, Tooltip, Statistic, Divider, Modal, Progress } from 'antd';
import { CloseOutlined, SearchOutlined, ReloadOutlined, LeftOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined, AuditOutlined, CloseCircleOutlined, DeleteOutlined, FileSearchOutlined, AimOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag, TableToolbarActions } from '@/components/ui';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text } = Typography;

const ANNO_TYPES = ['语义标注', '范围标注'];

const annoTypeColors = {
  '语义标注': 'blue',
  '范围标注': 'purple',
};

const annoStatusConfig = {
  '已标注': { color: 'success', icon: <CheckCircleOutlined /> },
  '未标注': { color: 'default', icon: <MinusCircleOutlined /> },
  '待校验': { color: 'warning', icon: <ClockCircleOutlined /> },
};

const qcStatusConfig = {
  '待质检': { color: 'warning', text: '待质检', icon: <ClockCircleOutlined /> },
  '质检中': { color: 'processing', text: '质检中', icon: <ClockCircleOutlined /> },
  '已通过': { color: 'success', text: '已通过', icon: <CheckCircleOutlined /> },
  '未通过': { color: 'error', text: '未通过', icon: <ExclamationCircleOutlined /> },
};

const packageMetaMap = {
  'COLL-PK-12751': { 
    name: '超市场景物品物理采集 · 分包01', 
    totalCount: 0, 
    pending: 0, 
    checking: 0, 
    passed: 0, 
    rejected: 0,
    planCount: 50,
    taskbook: 'TB-超市场景采集规范 V1.0',
    collector: '张三',
    qaer: '李四',
    qcCheckedMinutes: '0.0',
    qcTotalMinutes: '0.0',
    qcPassedMinutes: '0.0'
  },
  'COLL-PK-12752': { 
    name: '超市场景物品物理采集 · 分包02', 
    totalCount: 0, 
    pending: 0, 
    checking: 0, 
    passed: 0, 
    rejected: 0,
    planCount: 50,
    taskbook: 'TB-超市场景采集规范 V1.0',
    collector: '李四',
    qaer: '王五',
    qcCheckedMinutes: '0.0',
    qcTotalMinutes: '0.0',
    qcPassedMinutes: '0.0'
  },
  'COLL-PK-12744': { 
    name: '货架物品物理采集 · 分包03', 
    totalCount: 30, 
    pending: 25, 
    checking: 4, 
    passed: 1, 
    rejected: 0,
    planCount: 50,
    taskbook: 'TB-货架抓取规范 V1.5',
    collector: '张三',
    qaer: '李四',
    qcCheckedMinutes: '0.3',
    qcTotalMinutes: '7.0',
    qcPassedMinutes: '0.3'
  },
  'COLL-PK-12745': { 
    name: '货架物品物理采集 · 分包04', 
    totalCount: 55, 
    pending: 0, 
    checking: 0, 
    passed: 52, 
    rejected: 3,
    planCount: 50,
    taskbook: 'TB-货架抓取规范 V1.5',
    collector: '李四',
    qaer: '天奇管理员',
    qcCheckedMinutes: '16.2',
    qcTotalMinutes: '16.2',
    qcPassedMinutes: '15.1'
  },
  'COLL-PK-12760': { 
    name: '桌面整理通用数采 · 分包01', 
    totalCount: 0, 
    pending: 0, 
    checking: 0, 
    passed: 0, 
    rejected: 0,
    planCount: 10000,
    taskbook: 'TB-桌面整理采集规范 V1.0',
    collector: '王五',
    qaer: '赵六',
    qcCheckedMinutes: '0.0',
    qcTotalMinutes: '0.0',
    qcPassedMinutes: '0.0'
  },
  'COLL-PK-12761': { 
    name: '桌面整理通用数采 · 分包02', 
    totalCount: 0, 
    pending: 0, 
    checking: 0, 
    passed: 0, 
    rejected: 0,
    planCount: 5000,
    taskbook: 'TB-桌面整理采集规范 V1.0',
    collector: 'cy00831',
    qaer: '李四',
    qcCheckedMinutes: '0.0',
    qcTotalMinutes: '0.0',
    qcPassedMinutes: '0.0'
  },
  'COLL-PK-12762': { 
    name: '双手装配离线资产 · 分包01', 
    totalCount: 0, 
    pending: 0, 
    checking: 0, 
    passed: 0, 
    rejected: 0,
    planCount: 5000,
    taskbook: 'TB-厨房操作规范 V1.2',
    collector: '张三',
    qaer: '天奇管理员',
    qcCheckedMinutes: '0.0',
    qcTotalMinutes: '0.0',
    qcPassedMinutes: '0.0'
  },
  'COLL-PK-12763': { 
    name: '双手装配离线资产 · 分包02', 
    totalCount: 0, 
    pending: 0, 
    checking: 0, 
    passed: 0, 
    rejected: 0,
    planCount: 5000,
    taskbook: 'TB-厨房操作规范 V1.2',
    collector: '李四',
    qaer: '王五',
    qcCheckedMinutes: '0.0',
    qcTotalMinutes: '0.0',
    qcPassedMinutes: '0.0'
  },
  'COLL-PK-12511': { 
    name: '工业纸箱打包封装 · 分包01', 
    totalCount: 50, 
    pending: 0, 
    checking: 0, 
    passed: 48, 
    rejected: 2,
    planCount: 5000,
    taskbook: 'TB-纸箱打包规范 V2.0',
    collector: 'cy00831',
    qaer: '天奇管理员',
    qcCheckedMinutes: '1103.7',
    qcTotalMinutes: '1103.7',
    qcPassedMinutes: '1080.2'
  },
  'COLL-PK-12620': { 
    name: '工业纸箱打包封装 · 分包02', 
    totalCount: 19, 
    pending: 0, 
    checking: 0, 
    passed: 19, 
    rejected: 0,
    planCount: 5000,
    taskbook: 'TB-纸箱打包规范 V2.0',
    collector: '王五',
    qaer: '李四',
    qcCheckedMinutes: '38.6',
    qcTotalMinutes: '38.6',
    qcPassedMinutes: '38.6'
  },
};

export default function QaDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId');
  const [activeQcTab, setActiveQcTab] = useState('all');
  const { message } = App.useApp();

  const packageConfig = packageMetaMap[instanceId] || { 
    name: `分包 #${instanceId}`, 
    totalCount: 20, 
    pending: 10, 
    checking: 4, 
    passed: 4, 
    rejected: 2,
    planCount: 50,
    collector: '张三',
    qaer: '李四'
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveQcTab(tabFromUrl);
    }
  }, [searchParams]);

  const [filterQcStatus, setFilterQcStatus] = useState(null);
  const [filterId, setFilterId] = useState('');

  // Stateful list of episodes dynamically mapped from instanceId
  const [episodes, setEpisodes] = useState(() => {
    const config = packageMetaMap[instanceId];
    if (config && config.totalCount === 0) {
      return [];
    }
    const count = config ? config.totalCount : 20;
    const passedTarget = config ? config.passed : 4;
    const rejectedTarget = config ? config.rejected : 2;
    const checkingTarget = config ? config.checking : 4;

    return Array.from({ length: count }).map((_, i) => {
      const isDual = i % 2 === 0;
      const device = isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)';
      const annoType = isDual ? '语义标注' : '范围标注';

      let qcStatus = '待质检';
      if (i < passedTarget) {
        qcStatus = '已通过';
      } else if (i < passedTarget + rejectedTarget) {
        qcStatus = '未通过';
      } else if (i < passedTarget + rejectedTarget + checkingTarget) {
        qcStatus = '质检中';
      } else {
        qcStatus = '待质检';
      }

      const annoStatuses = ['已标注', '未标注', '待校验'];
      const annoStatus = qcStatus === '已通过' || qcStatus === '未通过' ? '已标注' : annoStatuses[i % 3];
      const totalFrames = 120 + (i * 12);

      return {
        key: i,
        id: 744101 + i,
        taskName: isDual ? ['抓取猕猴桃', '移动杯子', '扭动阀门'][i % 3] : ['桌面整理', '垃圾分类', '抽屉开关'][i % 3],
        instance: `实例_${instanceId}_${String(i + 1).padStart(3, '0')}`,
        annoTaskName: `标注任务_${['张三', '李四', '王五', '赵六'][i % 4]}_${String(i + 1).padStart(2, '0')}`,
        device,
        annoType,
        totalFrames,
        manualTime: annoStatus === '已标注' ? `2026-07-08 09:12:16` : '',
        modelTime: i % 5 === 0 ? `2026-07-08 08:00:00` : '',
        parseStatus: '解析完成',
        annoStatus,
        qcStatus,
        qcRemark: qcStatus === '未通过' ? '标注边界不严谨，需返工重标' : '',
        segments: annoStatus === '已标注' ? (
          isDual ? [
            { start: Math.round(totalFrames * 0.15), end: Math.round(totalFrames * 0.45), text: 'pick {Kiwi} from {desktop}', color: '#2563eb' },
            { start: Math.round(totalFrames * 0.55), end: Math.round(totalFrames * 0.85), text: 'place {Kiwi} on {Fruit Bowl}', color: '#16a34a' }
          ] : [
            { start: Math.round(totalFrames * 0.1), end: Math.round(totalFrames * 0.4), text: '右手从置物架抓取药品到药房工作台', color: '#13c2c2' },
            { start: Math.round(totalFrames * 0.5), end: Math.round(totalFrames * 0.9), text: '双手从台面上方放置托盘到桌子', color: '#1890ff' }
          ]
        ) : []
      };
    });
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tableDensity, setTableDensity] = useState('small');
  const [hiddenColumns, setHiddenColumns] = useState([]);

  // 一键全部通过 handler
  const handlePassAll = () => {
    const unpassedCount = episodes.filter(ep => ep.qcStatus !== '已通过').length;
    Modal.confirm({
      title: '确认一键全部质检通过？',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: `当前分包共有 ${episodes.length} 条 Episode 数据（其中 ${unpassedCount} 条未通过/待质检）。确认将全部数据一键标记为【质检已通过】并流转至待标注合格池吗？`,
      okText: '确认全部通过',
      okButtonProps: { style: { background: '#52c41a', borderColor: '#52c41a' } },
      cancelText: '取消',
      onOk: () => {
        setEpisodes(prev => prev.map(ep => ({
          ...ep,
          qcStatus: '已通过',
          qcRemark: ''
        })));
        message.success({
          content: `🎉 一键质检完成！分包 [${instanceId}] 内全部 ${episodes.length} 条数据已成功质检通过，已流转至合格待标池。`,
          duration: 4
        });
        setSelectedRowKeys([]);
        setSelectedRows([]);
      }
    });
  };

  // Batch QC handlers
  const handleBatchPass = () => {
    if (selectedRowKeys.length === 0) return;
    setEpisodes(prev => prev.map(ep => {
      if (selectedRowKeys.includes(ep.key)) {
        return { ...ep, qcStatus: '已通过', qcRemark: '' };
      }
      return ep;
    }));
    message.success(`已批量审核通过 ${selectedRowKeys.length} 条 Episode 数据`);
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: '批量标记未通过',
      content: `确定要将选中的 ${selectedRowKeys.length} 条 Episode 数据标记为【未通过】标签吗？`,
      okText: '确定标记',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return { ...ep, qcStatus: '未通过', qcRemark: '质检未通过' };
          }
          return ep;
        }));
        message.warning(`已将 ${selectedRowKeys.length} 条 Episode 数据标记为【未通过】标签`);
        setSelectedRowKeys([]);
        setSelectedRows([]);
      }
    });
  };

  const filteredData = React.useMemo(() => {
    return episodes.filter(item => {
      // 质检状态页签过滤
      if (activeQcTab === 'pending' && item.qcStatus !== '待质检') return false;
      if (activeQcTab === 'checking' && item.qcStatus !== '质检中') return false;
      if (activeQcTab === 'passed' && item.qcStatus !== '已通过') return false;
      if (activeQcTab === 'rejected' && item.qcStatus !== '未通过') return false;

      const idMatch = !filterId || String(item.id).includes(filterId);
      const qcMatch = !filterQcStatus || item.qcStatus === filterQcStatus;
      return idMatch && qcMatch;
    });
  }, [episodes, filterId, filterQcStatus, activeQcTab]);

  // Stats & Macro Metrics (Plan A)
  const totalCount = episodes.length;
  const pendingCount = episodes.filter(d => d.qcStatus === '待质检').length;
  const checkingCount = episodes.filter(d => d.qcStatus === '质检中').length;
  const passedCount = episodes.filter(d => d.qcStatus === '已通过').length;
  const rejectedCount = episodes.filter(d => d.qcStatus === '未通过').length;

  const checkedCount = passedCount + rejectedCount;
  const qcProgressRate = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const qcPassRate = checkedCount > 0 
    ? ((passedCount / checkedCount) * 100).toFixed(1) 
    : (totalCount === 0 ? '0.0' : '100.0');

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90, render: (t) => <Text style={{ fontFamily: 'monospace', color: '#1677ff' }}>{t}</Text> },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 120 },
    { title: '实例', dataIndex: 'instance', key: 'instance', width: 160, ellipsis: true },
    { 
      title: '采集设备', 
      dataIndex: 'device', 
      width: 220, 
      ellipsis: true,
      render: (d) => {
        const isDual = d.includes('双臂');
        return (
          <Space size={4}>
            <Badge status={isDual ? 'processing' : 'warning'} />
            <Text strong={isDual} style={{ color: isDual ? '#0958d9' : '#d46b08' }}>{d}</Text>
          </Space>
        );
      }
    },
    { title: '标注任务名', dataIndex: 'annoTaskName', width: 180, ellipsis: true },
    {
      title: '标注类型', dataIndex: 'annoType', width: 110, align: 'center',
      render: (t) => <Tag color={annoTypeColors[t]} style={{ margin: 0 }}>{t}</Tag>
    },
    { title: '数据帧数', dataIndex: 'totalFrames', width: 100, align: 'right', render: (t) => <strong>{t} f</strong> },
    { title: '人工标注时间', dataIndex: 'manualTime', width: 160, render: (t) => t || <Text type="secondary">-</Text> },
    { 
      title: '解析状态', 
      dataIndex: 'parseStatus', 
      width: 100, 
      align: 'center',
      render: (s) => <Tag color="success" style={{ background: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f', borderRadius: 4 }}>{s}</Tag> 
    },
    { 
      title: '标注状态', 
      dataIndex: 'annoStatus', 
      width: 120, 
      align: 'center',
      render: (s) => <StatusTag status={s} />
    },
    { 
      title: '质检状态', 
      dataIndex: 'qcStatus', 
      width: 120, 
      align: 'center',
      render: (s) => <StatusTag status={s} />
    },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right',
      render: (_, r) => {
        return (
          <Space size="middle">
            <Button 
              type="link" 
              size="small" 
              icon={<FileSearchOutlined />}
              style={{ padding: 0 }}
              onClick={() => router.push(buildStaticHref(STATIC_ROUTES.auditWorkbench, {
                id: instanceId,
                episodeId: r.id,
                type: r.annoType,
                mode: 'audit',
              }))}
            >
              质检
            </Button>
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              style={{ padding: 0 }}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除数据条目 #${r.id} (${r.taskName}) 吗？删除后不可恢复。`,
                  okText: '确定删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk() {
                    setEpisodes(prev => prev.filter(ep => ep.id !== r.id));
                    message.success(`已成功删除数据条目 #${r.id}`);
                  }
                });
              }}
            >
              删除
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={packageConfig.name ? `数采分包质检 — ${packageConfig.name} (${instanceId})` : `数采分包质检 — 分包 #${instanceId}`}
          breadcrumbs={[
            { title: '首页' },
            { title: '任务管理' },
            { title: '数据质检', href: '/collection/qa' },
            { title: '分包质检详情' },
          ]}
          back={<Button type="text" icon={<LeftOutlined />} onClick={() => router.push('/collection/qa')} style={{ fontWeight: 500 }}>返回列表</Button>}
          extra={[
            <Button key="close" type="text" aria-label="关闭" icon={<CloseOutlined />} onClick={() => router.push('/collection/qa')} />,
          ]}
        />

        {/* Macro Business & Quality Cards (Plan A) */}
        <div className="ui-form-section" style={{ display: 'flex', gap: 16 }}>
          {/* 1. 送检总条数 */}
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fafafa', border: '1px solid #e2e8f0' }} styles={{ body: { padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 } }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AimOutlined style={{ color: '#1677ff', fontSize: 22 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>本包送检总量</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {totalCount} <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>条</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                计划额定 {packageConfig.planCount || 50} 条
              </div>
            </div>
          </Card>

          {/* 2. 质检完成进度 */}
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fafafa', border: '1px solid #e2e8f0' }} styles={{ body: { padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 } }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e6fffb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#13c2c2', fontSize: 22 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>质检完成进度</Text>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#13c2c2' }}>{qcProgressRate}%</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {checkedCount} <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>/ {totalCount} 条</span>
              </div>
              <Progress percent={qcProgressRate} strokeColor="#13c2c2" size="small" showInfo={false} style={{ margin: '4px 0 0 0' }} />
            </div>
          </Card>

          {/* 3. 质检综合合格率 */}
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fafafa', border: '1px solid #e2e8f0' }} styles={{ body: { padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 } }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 22 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>质检综合合格率</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: parseFloat(qcPassRate) >= 90 ? '#52c41a' : '#faad14' }}>
                {qcPassRate}%
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                合格 {passedCount} 条 · 不合格 {rejectedCount} 条
              </div>
            </div>
          </Card>

          {/* 4. 累计质检时长 */}
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fafafa', border: '1px solid #e2e8f0' }} styles={{ body: { padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 } }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockCircleOutlined style={{ color: '#722ed1', fontSize: 22 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>累计质检时长 (已检/总长)</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>
                {packageConfig.qcCheckedMinutes || '0.0'} <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>/ {packageConfig.qcTotalMinutes || '0.0'} min</span>
              </div>
              <div style={{ fontSize: 12, color: '#52c41a', marginTop: 2 }}>
                合格有效时长 {packageConfig.qcPassedMinutes || '0.0'} min
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="ui-form-section">
          <Form layout="inline">
            <Row gutter={[12, 12]} style={{ width: '100%' }}>
              <Col><Input placeholder="ID" style={{ width: 140 }} value={filterId} onChange={e => setFilterId(e.target.value)} prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear /></Col>
              <Col>
                <Select placeholder="质检状态" style={{ width: 160 }} allowClear value={filterQcStatus} onChange={setFilterQcStatus}
                  options={['待质检', '质检中', '已通过', '未通过'].map(s => ({ label: s, value: s }))}
                />
              </Col>
              <Col>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setFilterId(''); setFilterQcStatus(null); setActiveQcTab('all'); }}>重置</Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Floating Selection Alert */}
        {selectedRowKeys.length > 0 && (
          <div className="ui-toolbar" style={{
            marginBottom: 16,
            background: '#e6f4ff',
            border: '1px solid #91caff',
            padding: '12px 18px',
            borderRadius: 8,
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <Space size={12}>
              <span style={{ fontSize: 13, color: '#0958d9', fontWeight: 600 }}>
                已选中 {selectedRowKeys.length} 个实例数据
              </span>
            </Space>
            <Space>
              <Button 
                type="primary"
                size="middle" 
                icon={<CheckCircleOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold' }}
                onClick={handleBatchPass}
              >
                批量质检通过
              </Button>
              <Button 
                type="primary"
                size="middle" 
                danger
                icon={<CloseCircleOutlined />}
                style={{ fontWeight: 'bold' }}
                onClick={handleBatchReject}
              >
                批量标记未通过
              </Button>
              <Button 
                size="middle"
                type="text"
                onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}
              >
                取消选择
              </Button>
            </Space>
          </div>
        )}

        {/* Table Section */}
        <div>
          <Card
            className="ui-table-card"
            title={<span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>数据列表</span>}
            tabList={[
              { key: 'all', tab: <span>全部 <Badge count={totalCount} style={{ backgroundColor: activeQcTab === 'all' ? '#1677ff' : '#f0f0f0', color: activeQcTab === 'all' ? '#fff' : '#8c8c8c', boxShadow: 'none', marginLeft: 4 }} /></span> },
              { key: 'pending', tab: <span>待质检 <Badge count={pendingCount} style={{ backgroundColor: '#fffbe6', color: '#d48806', border: '1px solid #ffe58f', boxShadow: 'none', marginLeft: 4 }} /></span> },
              { key: 'checking', tab: <span>质检中 <Badge count={checkingCount} style={{ backgroundColor: '#e6f4ff', color: '#1677ff', border: '1px solid #91caff', boxShadow: 'none', marginLeft: 4 }} /></span> },
              { key: 'passed', tab: <span>已通过 <Badge count={passedCount} style={{ backgroundColor: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f', boxShadow: 'none', marginLeft: 4 }} /></span> },
              { key: 'rejected', tab: <span>未通过 <Badge count={rejectedCount} style={{ backgroundColor: '#fff2f0', color: '#ff4d4f', border: '1px solid #ffccc7', boxShadow: 'none', marginLeft: 4 }} /></span> },
            ]}
            tabBarExtraContent={(
              <Space style={{ paddingRight: 16 }}>
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />} 
                  style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }} 
                  onClick={handlePassAll}
                >
                  一键全部通过
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
            )}
            activeTabKey={activeQcTab}
            onTabChange={(key) => setActiveQcTab(key)}
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 8 }}
          >
            <Table 
              rowSelection={{
                selectedRowKeys,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys);
                  setSelectedRows(rows);
                }
              }}
              columns={columns.filter(col => !hiddenColumns.includes(col.key))} 
              dataSource={filteredData} 
              pagination={{ 
                pageSize: 20, 
                showTotal: (t) => `共 ${t} 条`,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50']
              }}
              size={tableDensity}
              scroll={{ x: 1600 }}
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
