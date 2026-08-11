'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Card, Typography, App, Badge, Select, Row, Col, Form, Tooltip, Statistic, Divider, Modal, Radio, Progress, List, Upload, InputNumber } from 'antd';
import { CloseOutlined, SearchOutlined, ReloadOutlined, LeftOutlined, EyeOutlined, EditOutlined, UndoOutlined, AuditOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined, CopyOutlined, LoadingOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag } from '@/components/ui';

const { Title, Text } = Typography;
const { Option } = Select;

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

const auditStatusConfig = {
  '未审核': { color: 'default' },
  '审核中': { color: 'processing' },
  '通过': { color: 'success' },
  '不通过': { color: 'error' },
};

export default function AnnotationAuditEpisodeListPage() {
  const router = useRouter();
  const params = useParams();
  const instanceId = params.id;
  const searchParams = useSearchParams();
  const [activeAnnoTab, setActiveAnnoTab] = useState('unannotated');
  const { message } = App.useApp();

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveAnnoTab(tabFromUrl);
    }
  }, [searchParams]);

  const [filterAnnoStatus, setFilterAnnoStatus] = useState(null);
  const [filterAuditStatus, setFilterAuditStatus] = useState(null);
  const [filterId, setFilterId] = useState('');


  // Stateful list of episodes for dynamic updates
  const [episodes, setEpisodes] = useState(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const isDual = i % 2 === 0;
      const device = isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)';
      const annoType = isDual ? '语义标注' : '范围标注';

      const annoStatuses = ['已标注', '未标注', '待校验'];
      const auditStatuses = ['未审核', '审核中', '通过', '不通过'];
      const annoStatus = i < 6 ? '已标注' : i < 16 ? annoStatuses[i % 3] : '未标注';
      const auditStatus = (annoStatus === '已标注' || annoStatus === '待校验') ? auditStatuses[i % 4] : '未审核';
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
        manualTime: (annoStatus === '已标注' || annoStatus === '待校验') ? `2026-07-08 09:12:16` : '',
        modelTime: i % 5 === 0 ? `2026-07-08 08:00:00` : '',
        parseStatus: '解析完成',
        annoStatus,
        auditStatus,
        hasError: i === 3 || i === 11,
        segments: (annoStatus === '已标注' || annoStatus === '待校验') ? (
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

  // Batch Annotation Configurations
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTemplateId, setBatchTemplateId] = useState(null);
  const [batchStrategy, setBatchStrategy] = useState('proportional');
  const [isCopying, setIsCopying] = useState(false);
  const [copyProgress, setCopyProgress] = useState(0);

  // Upload Data Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadForm] = Form.useForm();

  // Dynamic template properties based on active selection type
  const getActiveBatchType = () => {
    if (selectedRows.length === 0) return '语义标注';
    return selectedRows[0].annoType;
  };

  const activeBatchType = getActiveBatchType();

  const annotatedTemplates = episodes.filter(ep => 
    ep.annoStatus === '已标注' && 
    ep.annoType === activeBatchType && 
    ep.segments && 
    ep.segments.length > 0
  );

  const defaultSystemTemplate = activeBatchType === '语义标注' ? {
    id: 'SYSTEM_PRESET',
    taskName: '系统预设语义模版 (双臂)',
    annoType: '语义标注',
    totalFrames: 120,
    segments: [
      { start: 18, end: 54, text: 'pick {Kiwi} from {desktop}', color: '#2563eb' },
      { start: 66, end: 102, text: 'place {Kiwi} on {Fruit Bowl}', color: '#16a34a' }
    ]
  } : {
    id: 'SYSTEM_PRESET',
    taskName: '系统预设范围模版 (单臂)',
    annoType: '范围标注',
    totalFrames: 120,
    segments: [
      { start: 15, end: 45, text: '右手从置物架抓取药品到药房工作台', color: '#13c2c2' },
      { start: 55, end: 95, text: '双手从台面上方放置托盘到桌子', color: '#1890ff' }
    ]
  };

  const getSelectedTemplate = () => {
    if (batchTemplateId === 'SYSTEM_PRESET') return defaultSystemTemplate;
    return episodes.find(ep => ep.id === batchTemplateId) || defaultSystemTemplate;
  };

  const handleOpenBatchModal = () => {
    const firstTemplate = annotatedTemplates[0];
    setBatchTemplateId(firstTemplate ? firstTemplate.id : 'SYSTEM_PRESET');
    setBatchStrategy('proportional');
    setCopyProgress(0);
    setIsCopying(false);
    setIsBatchModalOpen(true);
  };

  const applyStrategy = (segments, strategy, templateTotal, targetTotal) => {
    if (!segments || segments.length === 0) return [];
    if (strategy === 'proportional') {
      return segments.map(seg => {
        const startRatio = seg.start / templateTotal;
        const endRatio = seg.end / templateTotal;
        return {
          ...seg,
          start: Math.round(startRatio * targetTotal),
          end: Math.round(endRatio * targetTotal)
        };
      });
    } else if (strategy === 'fixed') {
      return segments.map(seg => {
        return {
          ...seg,
          start: Math.min(seg.start, targetTotal),
          end: Math.min(seg.end, targetTotal)
        };
      });
    } else if (strategy === 'full') {
      const n = segments.length;
      return segments.map((seg, i) => {
        return {
          ...seg,
          start: Math.round((i / n) * targetTotal),
          end: Math.round(((i + 1) / n) * targetTotal)
        };
      });
    }
    return segments;
  };

  const handleStartBatchCopy = () => {
    setIsCopying(true);
    setCopyProgress(0);
    const activeBatchType = getActiveBatchType();

    const interval = setInterval(() => {
      setCopyProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const template = getSelectedTemplate();

          setEpisodes(prevEpisodes => {
            return prevEpisodes.map(ep => {
              if (selectedRowKeys.includes(ep.key) && ep.id !== template.id && ep.annoType === activeBatchType) {
                const adjustedSegments = applyStrategy(
                  template.segments,
                  batchStrategy,
                  template.totalFrames,
                  ep.totalFrames
                );
                const nextStatus = ep.annoStatus === '未标注' ? '待校验' : '已标注';
                return {
                  ...ep,
                  annoStatus: nextStatus,
                  manualTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  segments: adjustedSegments
                };
              }
              return ep;
            });
          });

          setTimeout(() => {
            setIsCopying(false);
            setIsBatchModalOpen(false);
            setSelectedRowKeys([]);
            setSelectedRows([]);
            setActiveAnnoTab('to_verify');
            message.success(`✨ 批量标注完成！已自动为您切换至【待校验】页签等待审核。`);
          }, 300);

          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleBatchReset = () => {
    Modal.confirm({
      title: '确认清除标注？',
      content: `确定要清除选中的 ${selectedRowKeys.length} 个实例的标注数据吗？清除后不可恢复。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return {
              ...ep,
              annoStatus: '未标注',
              auditStatus: '未审核',
              manualTime: '',
              segments: []
            };
          }
          return ep;
        }));
        setSelectedRowKeys([]);
        setSelectedRows([]);
        message.success('已批量清除标注数据！');
      }
    });
  };

  const handleStartUpload = () => {
    uploadForm.validateFields().then(values => {
      setIsUploading(true);
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            
            const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const currentLength = episodes.length;
            const isDual = currentLength % 2 === 0;
            
            const newEpisodes = [
              {
                key: `uploaded_${Date.now()}_1`,
                id: 744101 + currentLength + 10,
                taskName: values.dataType === 'mp4' ? '抓取物品示范(RGB视频)' : values.dataType === 'trajectory' ? '桌面整理任务(双臂协同)' : '垃圾分类投放(点位)',
                instance: `实例_${instanceId}_${String(currentLength + 1).padStart(3, '0')}`,
                annoTaskName: `自动解析标注_${String(currentLength + 1).padStart(2, '0')}`,
                device: isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)',
                annoType: isDual ? '语义标注' : '范围标注',
                totalFrames: values.totalFrames || 150,
                manualTime: '',
                modelTime: nowStr,
                parseStatus: '解析完成',
                annoStatus: '未标注',
                auditStatus: '未审核',
                hasError: false,
                segments: []
              },
              {
                key: `uploaded_${Date.now()}_2`,
                id: 744101 + currentLength + 11,
                taskName: values.dataType === 'mp4' ? '移动水杯演示(RGB视频)' : values.dataType === 'trajectory' ? '旋转圆形阀门(双臂)' : '工具使用反馈',
                instance: `实例_${instanceId}_${String(currentLength + 2).padStart(3, '0')}`,
                annoTaskName: `自动解析标注_${String(currentLength + 2).padStart(2, '0')}`,
                device: isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)',
                annoType: isDual ? '语义标注' : '范围标注',
                totalFrames: values.totalFrames || 180,
                manualTime: '',
                modelTime: nowStr,
                parseStatus: '解析完成',
                annoStatus: '未标注',
                auditStatus: '未审核',
                hasError: false,
                segments: []
              },
              {
                key: `uploaded_${Date.now()}_3`,
                id: 744101 + currentLength + 12,
                taskName: values.dataType === 'mp4' ? '垃圾处理教学(RGB视频)' : values.dataType === 'trajectory' ? '餐盘整理序列' : '开合抽屉轨迹',
                instance: `实例_${instanceId}_${String(currentLength + 3).padStart(3, '0')}`,
                annoTaskName: `自动解析标注_${String(currentLength + 3).padStart(2, '0')}`,
                device: isDual ? '双臂手眼协同设备 (Galbot-1.16)' : '单臂物理遥操设备 (Air-SN201)',
                annoType: isDual ? '语义标注' : '范围标注',
                totalFrames: values.totalFrames || 210,
                manualTime: '',
                modelTime: nowStr,
                parseStatus: '解析完成',
                annoStatus: '未标注',
                auditStatus: '未审核',
                hasError: false,
                segments: []
              }
            ];

            setEpisodes(prev => [...newEpisodes, ...prev]);
            
            setTimeout(() => {
              setIsUploading(false);
              setIsUploadModalOpen(false);
              setUploadFileList([]);
              message.success('🚀 成功上传并自动解析 3 个新具身动作序列数据！');
            }, 300);

            return 100;
          }
          return prev + 20;
        });
      }, 150);
    }).catch(() => {
      message.warning('请补充必填信息');
    });
  };

  const handleBatchAuditPass = () => {
    Modal.confirm({
      title: '确认批量审核通过？',
      content: `确定要将选中的 ${selectedRowKeys.length} 个实例的审核状态设置为「通过」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return {
              ...ep,
              auditStatus: '通过',
              annoStatus: '已标注'
            };
          }
          return ep;
        }));
        setSelectedRowKeys([]);
        setSelectedRows([]);
        setActiveAnnoTab('annotated');
        message.success('🎉 批量审核通过成功！数据已流转完成并归档至【已标注 / 完成】页签。');
      }
    });
  };

  const handleBatchAuditReject = () => {
    Modal.confirm({
      title: '确认批量审核驳回？',
      content: `确定要将选中的 ${selectedRowKeys.length} 个实例的审核状态设置为「不通过」吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setEpisodes(prev => prev.map(ep => {
          if (selectedRowKeys.includes(ep.key)) {
            return {
              ...ep,
              auditStatus: '不通过'
            };
          }
          return ep;
        }));
        setSelectedRowKeys([]);
        setSelectedRows([]);
        message.warning('批量审核驳回操作成功！');
      }
    });
  };

  const filteredData = React.useMemo(() => {
    const list = episodes.filter(item => {
      // 标注状态页签过滤
      if (activeAnnoTab === 'unannotated' && item.annoStatus !== '未标注') return false;
      if (activeAnnoTab === 'annotated' && item.annoStatus !== '已标注') return false;
      if (activeAnnoTab === 'to_verify' && item.annoStatus !== '待校验') return false;
      if (activeAnnoTab === 'qc_failed' && item.auditStatus !== '不通过') return false;

      const idMatch = !filterId || String(item.id).includes(filterId);
      const annoMatch = !filterAnnoStatus || item.annoStatus === filterAnnoStatus;
      const auditMatch = !filterAuditStatus || item.auditStatus === filterAuditStatus;
      return idMatch && annoMatch && auditMatch;
    });

    // Sort: '可标注' (annoStatus !== '已标注' && annoStatus !== '待校验') at the top, '已标注'/'待校验' at the bottom
    return [...list].sort((a, b) => {
      const aIsFinished = a.annoStatus === '已标注' || a.annoStatus === '待校验';
      const bIsFinished = b.annoStatus === '已标注' || b.annoStatus === '待校验';
      if (!aIsFinished && bIsFinished) return -1;
      if (aIsFinished && !bIsFinished) return 1;
      return a.id - b.id;
    });
  }, [episodes, filterId, filterAnnoStatus, filterAuditStatus, activeAnnoTab]);

  // Stats
  const totalCount = episodes.length;
  const annoCount = episodes.filter(d => d.annoStatus === '已标注' || d.annoStatus === '待校验').length;
  const auditPassCount = episodes.filter(d => d.auditStatus === '通过').length;
  const auditRejectCount = episodes.filter(d => d.auditStatus === '不通过').length;

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
    { title: '模型标注时间', dataIndex: 'modelTime', width: 160, render: (t) => t || <Text type="secondary">-</Text> },
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
      width: 150, 
      align: 'center',
      render: (s, r) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <StatusTag status={s} />
            {s === '已标注' && r.segments && (
              <span style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                ({r.segments.length}段时序标注)
              </span>
            )}
          </div>
        );
      }
    },
    { 
      title: '审核状态', 
      dataIndex: 'auditStatus', 
      width: 100, 
      align: 'center',
      render: (s) => <StatusTag status={s === '不通过' ? '未通过' : s}>{s}</StatusTag>
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, r) => {
        const typeParam = encodeURIComponent(r.annoType);
        return (
          <Space size={4}>
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              style={{ padding: '0 4px' }}
              disabled={r.annoStatus === '已标注' || r.annoStatus === '待校验' || activeAnnoTab === 'to_verify'}
              onClick={() => router.push(`/annotation/audit/${instanceId}/${r.id}?type=${typeParam}&mode=annotate`)}
            >
              标注
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={<AuditOutlined />}
              style={{ padding: '0 4px', color: (r.annoStatus === '已标注' || r.annoStatus === '待校验') ? '#722ed1' : undefined }}
              disabled={r.annoStatus !== '已标注' && r.annoStatus !== '待校验'}
              onClick={() => router.push(`/annotation/audit/${instanceId}/${r.id}?type=${typeParam}&mode=audit`)}
            >
              审核
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              style={{ padding: '0 4px' }}
              onClick={() => router.push(`/annotation/audit/${instanceId}/${r.id}?type=${typeParam}&mode=view`)}
            >
              查看
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={<UndoOutlined />}
              style={{ padding: '0 4px' }}
              danger
              onClick={() => {
                setEpisodes(prev => prev.map(ep => {
                  if (ep.id === r.id) {
                    return {
                      ...ep,
                      annoStatus: '未标注',
                      auditStatus: '未审核',
                      manualTime: '',
                      segments: []
                    };
                  }
                  return ep;
                }));
                message.success(`已重置 ${r.id} 的标注状态`);
              }}
            >
              重置
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
          title={`标注工作台 — 实例 #${instanceId}`}
          description="统一查看、标注与审核当前实例的 Episode 数据"
          breadcrumbs={[
            { title: '数据标注' },
            { title: '标注工作台', href: '/annotation/audit' },
            { title: '实例详情' },
          ]}
          back={<Button type="text" icon={<LeftOutlined />} onClick={() => router.push('/annotation/audit')} style={{ fontWeight: 500 }}>返回列表</Button>}
          extra={[
            <Button
              key="upload"
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => { uploadForm.resetFields(); setUploadFileList([]); setIsUploadModalOpen(true); }}
              style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
            >
              上传数据
            </Button>,
            <Button key="audit-all" type="primary" size="small" icon={<AuditOutlined />} onClick={() => message.success('审核全部数据')}>审核全部数据</Button>,
            <Button key="close" type="text" aria-label="关闭" icon={<CloseOutlined />} onClick={() => router.push('/annotation/audit')} />,
          ]}
        />

        {/* Stats Row */}
        <div className="ui-form-section" style={{ display: 'flex', gap: 24 }}>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>总数据量</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{totalCount}</div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#e6f4ff', border: '1px solid #91caff' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EditOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>已标注</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{annoCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {totalCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#f9f0ff', border: '1px solid #d3adf7' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#722ed1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AuditOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>审核通过</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{auditPassCount} <Text type="secondary" style={{ fontSize: 12 }}>/ {annoCount}</Text></div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1, borderRadius: 8, background: '#fff2f0', border: '1px solid #ffccc7' }} styles={{ body: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExclamationCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>审核驳回</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f' }}>{auditRejectCount}</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="ui-form-section">
          <Form layout="inline">
            <Row gutter={[12, 12]} style={{ width: '100%' }}>
              <Col><Input placeholder="ID" style={{ width: 140 }} value={filterId} onChange={e => setFilterId(e.target.value)} prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear /></Col>
              <Col>
                <Select placeholder="标注状态" style={{ width: 160 }} allowClear value={filterAnnoStatus} onChange={setFilterAnnoStatus}
                  options={['已标注', '未标注', '待校验'].map(s => ({ label: s, value: s }))}
                />
              </Col>
              <Col>
                <Select placeholder="审核状态" style={{ width: 160 }} allowClear value={filterAuditStatus} onChange={setFilterAuditStatus}
                  options={['未审核', '审核中', '通过', '不通过'].map(s => ({ label: s, value: s }))}
                />
              </Col>
              <Col>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setFilterId(''); setFilterAnnoStatus(null); setFilterAuditStatus(null); setActiveAnnoTab('all'); }}>重置</Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Interactive Floating Selection alert bar */}
        {selectedRowKeys.length > 0 && (
          <div className="ui-toolbar" style={{
            background: '#e6f4ff',
            border: '1px solid #91caff',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <Space size={12}>
              <span style={{ fontSize: 13, color: '#0958d9', fontWeight: 600 }}>
                已选中 {selectedRowKeys.length} 个实例数据
              </span>
              <span style={{ fontSize: 12, color: '#4b5563' }}>
                (其中已标注: {selectedRows.filter(r => r.annoStatus === '已标注').length} 个，未标注: {selectedRows.filter(r => r.annoStatus !== '已标注').length} 个)
              </span>
            </Space>
            <Space>
              <Button 
                type="primary" 
                size="middle" 
                icon={<CopyOutlined />} 
                style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
                onClick={handleOpenBatchModal}
              >
                批量时序适配标注
              </Button>
              <Button 
                size="middle" 
                danger
                icon={<UndoOutlined />}
                onClick={handleBatchReset}
              >
                批量清除标注
              </Button>
              <Button 
                type="primary"
                size="middle" 
                icon={<CheckCircleOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold' }}
                onClick={handleBatchAuditPass}
              >
                批量一键通过
              </Button>
              <Button 
                type="primary"
                size="middle" 
                danger
                icon={<CloseOutlined />}
                style={{ fontWeight: 'bold' }}
                onClick={handleBatchAuditReject}
              >
                批量一键驳回
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
        <Card
          className="ui-table-card"
          title={<span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>数据列表</span>}
          tabList={[
            { key: 'unannotated', tab: `未标注 (${episodes.filter(e => e.annoStatus === '未标注').length})` },
            { key: 'to_verify', tab: `待校验 (${episodes.filter(e => e.annoStatus === '待校验').length})` },
            { key: 'annotated', tab: `已标注 / 完成 (${episodes.filter(e => e.annoStatus === '已标注').length})` },

            { key: 'qc_failed', tab: `❌ 质检不通过 (${episodes.filter(e => e.auditStatus === '不通过').length})` },
            { key: 'all', tab: `全部 (${episodes.length})` },
          ]}
          activeTabKey={activeAnnoTab}
          onTabChange={(key) => setActiveAnnoTab(key)}
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

      {/* ----------------------------------------------------
          POPUP MODAL: 批量时序适配标注配置 
          ---------------------------------------------------- */}
      <Modal
        title={
          <span style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CopyOutlined style={{ color: '#1677ff' }} /> 批量时序适配标注
          </span>
        }
        open={isBatchModalOpen}
        onCancel={() => !isCopying && setIsBatchModalOpen(false)}
        footer={null}
        width={750}
        mask={{ closable: !isCopying }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        {isCopying ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <LoadingOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 16 }} spin />
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}>
              正在批量适配复制中，请稍候... ({copyProgress}%)
            </div>
            <Progress percent={copyProgress} strokeColor="#1677ff" status="active" style={{ maxWidth: 400, margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* 1. Select Template */}
            <Card size="small" title={<span style={{ fontSize: 12, fontWeight: 'bold' }}>1. 选择标注模版 (Template Source)</span>} style={{ background: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#475569', width: 90 }}>选择模版:</span>
                  <Select 
                    style={{ flex: 1 }} 
                    value={batchTemplateId} 
                    onChange={setBatchTemplateId}
                  >
                    {annotatedTemplates.map(t => (
                      <Option key={t.id} value={t.id}>
                        实例 #{t.id} - {t.taskName} ({t.totalFrames}帧, 已含 {t.segments.length}段标注)
                      </Option>
                    ))}
                    <Option value="SYSTEM_PRESET">
                      【系统预设示范模板】抓取及放置场景 (120帧, 2段标注段)
                    </Option>
                  </Select>
                </div>
                <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: 6, fontSize: 11, color: '#1e40af' }}>
                  <strong>模版标注段预览：</strong>
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {getSelectedTemplate().segments.map((seg, idx) => (
                      <div key={idx}>
                        • 区间 <strong>{seg.start}f - {seg.end}f</strong>: <code style={{ background: '#fff', padding: '1px 4px', border: '1px solid #bfdbfe', borderRadius: 3 }}>{seg.text}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Choose Strategy */}
            <Card size="small" title={<span style={{ fontSize: 12, fontWeight: 'bold' }}>2. 选择时间段适配策略 (Temporal Strategy)</span>}>
              <Radio.Group 
                value={batchStrategy} 
                onChange={(e) => setBatchStrategy(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Radio value="proportional" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 12 }}>按比例适配 (Proportional)</strong>
                      <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                        按目标帧长等比拉伸。若模板动作处于15%-45%区间，目标实例亦调整为同样的百分比区间。
                      </span>
                    </Radio>
                  </Col>
                  <Col span={8}>
                    <Radio value="fixed" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 12 }}>固定帧数适配 (Fixed Frame)</strong>
                      <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                        严格保持模板的帧数值。如模板是 18f-54f，目标不管总帧数多长均对应 18f-54f。
                      </span>
                    </Radio>
                  </Col>
                  <Col span={8}>
                    <Radio value="full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 12 }}>全程适配 (Full Duration)</strong>
                      <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                        平分整个视频。若模板含两段动作，则目标实例自动均分为前50%与后50%两段。
                      </span>
                    </Radio>
                  </Col>
                </Row>
              </Radio.Group>
            </Card>

            {/* 3. Targets Adaptation Preview */}
            <Card size="small" title={<span style={{ fontSize: 12, fontWeight: 'bold' }}>3. 目标实例自适应预览 (Adaptation Preview)</span>}>
              <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                <List
                  size="small"
                  dataSource={selectedRows.filter(r => r.id !== getSelectedTemplate().id)}
                  renderItem={item => {
                    const template = getSelectedTemplate();
                    const adapted = applyStrategy(template.segments, batchStrategy, template.totalFrames, item.totalFrames);
                    return (
                      <List.Item style={{ fontSize: 11, padding: '4px 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>
                            实例 <strong>#{item.id}</strong> ({item.taskName}, 总长 <strong>{item.totalFrames}帧</strong>)
                          </span>
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                            {adapted.length > 0 
                              ? adapted.map(a => `[${a.start}-${a.end}f]`).join(' + ')
                              : '无标注段'}
                          </span>
                        </div>
                      </List.Item>
                    );
                  }}
                />
                {selectedRows.filter(r => r.id !== getSelectedTemplate().id).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 8, fontSize: 11 }}>
                    请选择除模板实例之外的其它目标实例进行批量复制
                  </div>
                )}
              </div>
            </Card>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
              <Button onClick={() => setIsBatchModalOpen(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                disabled={selectedRows.filter(r => r.id !== getSelectedTemplate().id).length === 0}
                onClick={handleStartBatchCopy}
                style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
              >
                开始批量时序适配
              </Button>
            </div>
            
          </div>
        )}
      </Modal>


      {/* ----------------------------------------------------
          POPUP MODAL: 上传数据 (Upload Data)
          ---------------------------------------------------- */}
      <Modal
        title={
          <Space>
            <UploadOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>上传数据 (导入机器人序列)</span>
          </Space>
        }
        open={isUploadModalOpen}
        onCancel={() => !isUploading && setIsUploadModalOpen(false)}
        onOk={handleStartUpload}
        okText="确认上传并自动解析"
        cancelText="取消"
        okButtonProps={{ style: { background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }, disabled: uploadFileList.length === 0 || isUploading }}
        width={640}
        destroyOnHidden
        mask={{ closable: !isUploading }}
      >
        {isUploading ? (
          <div style={{ padding: '30px 10px', textAlign: 'center' }}>
            <LoadingOutlined style={{ fontSize: 36, color: '#1677ff', marginBottom: 16 }} spin />
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}>
              正在上传并执行机器人运动解析与轨迹生成，请稍候... ({uploadProgress}%)
            </div>
            <Progress percent={uploadProgress} strokeColor="#1677ff" status="active" style={{ maxWidth: 400, margin: '0 auto' }} />
          </div>
        ) : (
          <Form
            form={uploadForm}
            layout="vertical"
            initialValues={{ dataType: 'zip', totalFrames: 120 }}
          >
            <Form.Item
              name="dataType"
              label="数据类型"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="zip">机器人轨迹 + 相机视频 (压缩包 ZIP)</Option>
                <Option value="mp4">单纯 RGB 视频录制文件 (MP4)</Option>
                <Option value="trajectory">关节角点控制轨迹信息 (JSON)</Option>
              </Select>
            </Form.Item>

            <Form.Item label="选择数据文件" required>
              <Upload.Dragger
                fileList={uploadFileList}
                beforeUpload={(file) => {
                  setUploadFileList([file]);
                  return false;
                }}
                onRemove={() => setUploadFileList([])}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#1677ff', fontSize: 36 }} />
                </p>
                <p style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', margin: '8px 0 4px' }}>
                  点击或拖拽文件至此区域进行上传
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>
                  支持拖放单文件，最大 200MB。机器人轨迹格式支持 JSON、CSV、ZIP 归档包。
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="totalFrames"
                  label="初始预设帧数"
                  rules={[{ required: true, message: '请输入初始预设帧数' }]}
                >
                  <InputNumber min={30} max={2000} style={{ width: '100%' }} suffix="帧" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="uploadOperator" label="上传操作员">
                  <Input placeholder="当前登录用户" disabled value="张三 (管理员)" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#1e40af' }}>
              <strong>📋 提示：</strong>上传成功后，系统会自动调用大模型解析服务进行视频分帧、手眼位置对齐及机器人本体关节状态估计（预计耗时 5~10 秒）。解析完成后，新上传的数据将自动在主列表中呈现，可进行时序标注和审核。
            </div>
          </Form>
        )}
      </Modal>

    </MainLayout>
  );
}
