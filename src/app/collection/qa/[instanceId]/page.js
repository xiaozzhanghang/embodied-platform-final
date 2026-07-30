'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, App, Badge, Select, Row, Col, Form, Tooltip, Statistic, Divider, Modal } from 'antd';
import { CloseOutlined, SearchOutlined, ReloadOutlined, LeftOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined, AuditOutlined, CloseCircleOutlined, DeleteOutlined, FileSearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

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

export default function QaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const instanceId = params.instanceId;
  const searchParams = useSearchParams();
  const [activeQcTab, setActiveQcTab] = useState('pending');
  const { message } = App.useApp();

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveQcTab(tabFromUrl);
    }
  }, [searchParams]);

  const [filterQcStatus, setFilterQcStatus] = useState(null);
  const [filterId, setFilterId] = useState('');

  // Stateful list of episodes for dynamic QC status updates
  const [episodes, setEpisodes] = useState(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const isDual = i % 2 === 0;
      const device = isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)';
      const annoType = isDual ? '语义标注' : '范围标注';

      const annoStatuses = ['已标注', '未标注', '待校验'];
      const annoStatus = i < 14 ? '已标注' : annoStatuses[i % 3];
      // Status distribution: 10 待质检, 4 质检中, 4 已通过, 2 未通过
      const qcStatus = i < 10 ? '待质检' : i < 14 ? '质检中' : i < 18 ? '已通过' : '未通过';
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

  // Table Row Selection States
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

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
      title: '批量质检驳回',
      content: `确定要将选中的 ${selectedRowKeys.length} 条 Episode 数据标记为质检不通过吗？`,
      okText: '确定驳回',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return { ...ep, qcStatus: '未通过', qcRemark: '质检驳回' };
          }
          return ep;
        }));
        message.success(`已驳回 ${selectedRowKeys.length} 条 Episode 数据`);
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

  // Stats
  const totalCount = episodes.length;
  const pendingCount = episodes.filter(d => d.qcStatus === '待质检').length;
  const checkingCount = episodes.filter(d => d.qcStatus === '质检中').length;
  const passedCount = episodes.filter(d => d.qcStatus === '已通过').length;
  const rejectedCount = episodes.filter(d => d.qcStatus === '未通过').length;

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
      render: (s) => {
        const config = annoStatusConfig[s] || { color: 'default' };
        return <Badge status={config.color} text={s} />;
      }
    },
    { 
      title: '质检状态', 
      dataIndex: 'qcStatus', 
      width: 120, 
      align: 'center',
      render: (s) => {
        const config = qcStatusConfig[s] || { color: 'default', text: s };
        return <Badge status={config.color} text={config.text} />;
      }
    },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right',
      render: (_, r) => {
        const typeParam = encodeURIComponent(r.annoType);
        return (
          <Space size="middle">
            <Button 
              type="link" 
              size="small" 
              icon={<FileSearchOutlined />}
              style={{ padding: 0 }}
              onClick={() => router.push(`/annotation/audit/${instanceId}/${r.id}?type=${typeParam}&mode=audit`)}
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
      <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
        {/* Header Bar */}
        <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
           <Space size={12}>
             <Button type="text" icon={<LeftOutlined />} onClick={() => router.push('/collection/qa')} style={{ fontWeight: 500 }}>返回列表</Button>
             <Divider orientation="vertical" />
             <Text strong style={{ fontSize: '14px' }}>数据质检 — 实例 #{instanceId}</Text>
           </Space>
           <Space>
             <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={handleBatchPass}>一键全部通过</Button>
             <Button type="text" icon={<CloseOutlined />} onClick={() => router.push('/collection/qa')} />
           </Space>
        </div>

        {/* Stats Row */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 16, borderBottom: '1px solid #f5f5f5' }}>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fafafa', border: '1px solid #d9d9d9' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>总数据量</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{totalCount}</div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fffbe6', border: '1px solid #ffe58f' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#faad14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>待质检</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{pendingCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {totalCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#e6f4ff', border: '1px solid #91caff' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2f54eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>质检中</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{checkingCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {totalCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>已通过</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{passedCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {totalCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fff2f0', border: '1px solid #ffccc7' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExclamationCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>未通过</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{rejectedCount}</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px 0 24px', marginBottom: 16 }}>
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
          <div style={{
            margin: '0 24px 16px 24px',
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
                批量质检驳回
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
        <div style={{ padding: '0 24px 24px 24px' }}>
          <Card
            title={<span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>数据列表</span>}
            tabList={[
              { key: 'pending', tab: `待质检 (${pendingCount})` },
              { key: 'checking', tab: `质检中 (${checkingCount})` },
              { key: 'passed', tab: `已通过 (${passedCount})` },
              { key: 'rejected', tab: `❌ 未通过 (${rejectedCount})` },
              { key: 'all', tab: `全部 (${totalCount})` },
            ]}
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
              columns={columns} 
              dataSource={filteredData} 
              pagination={{ 
                pageSize: 20, 
                showTotal: (t) => `共 ${t} 条`,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50']
              }}
              size="small"
              scroll={{ x: 1600 }}
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
