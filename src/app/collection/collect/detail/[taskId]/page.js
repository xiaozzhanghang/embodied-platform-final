'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Button, Card, Typography, Space, Descriptions, Badge, 
  Progress, Table, Tag, Steps, App, Modal, Tree, Row, Col 
} from 'antd';
import { 
  ArrowLeftOutlined, VideoCameraOutlined, ApiOutlined, DesktopOutlined, 
  EyeOutlined, SolutionOutlined, FileSearchOutlined, FolderOutlined, 
  FolderOpenOutlined, FileTextOutlined, PlayCircleOutlined, FileOutlined,
  CaretRightOutlined, PauseOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function CollectTaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  const taskId = params?.taskId || 'CT-20250301001';
  const isLumos = taskId === 'CT-20260414001' || taskId?.includes('2026') || taskId?.includes('Lumos');
  
  const [hasUploaded, setHasUploaded] = useState(false);
  const [episodes, setEpisodes] = useState([]);



  useEffect(() => {
    const stored = localStorage.getItem('luming_uploaded_tasks');
    let uploaded = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        uploaded = !!parsed[taskId];
      } catch (e) {
        console.error(e);
      }
    }
    setHasUploaded(uploaded);

    let baseEpisodes = isLumos ? [
      { key: '1', episodeId: 'EP-20260414-001', time: '2026-04-14 14:20:00', duration: '00:00:15', steps: 4, status: '已入库质检池', qaBatch: 'BATCH-202604-A' },
      { key: '2', episodeId: 'EP-20260414-002', time: '2026-04-14 14:22:15', duration: '00:00:15', steps: 4, status: '已入库质检池', qaBatch: 'BATCH-202604-A' },
      { key: '3', episodeId: 'EP-20260414-003', time: '2026-04-14 14:25:30', duration: '00:00:15', steps: 4, status: '废弃', qaBatch: '-' },
    ] : [
      { key: '1', episodeId: 'EP-20250301-001', time: '2025-03-01 14:20:00', duration: '00:01:23', steps: 6, status: '已入库质检池', qaBatch: 'BATCH-766794-A' },
      { key: '2', episodeId: 'EP-20250301-002', time: '2025-03-01 14:22:15', duration: '00:01:45', steps: 6, status: '已入库质检池', qaBatch: 'BATCH-766794-A' },
      { key: '3', episodeId: 'EP-20250301-003', time: '2025-03-01 14:25:30', duration: '00:01:12', steps: 6, status: '等待解析', qaBatch: 'BATCH-766794-B' },
      { key: '4', episodeId: 'EP-20250301-004', time: '2025-03-01 14:28:10', duration: '00:02:01', steps: 6, status: '废弃', qaBatch: '-' },
      { key: '5', episodeId: 'EP-20250301-005', time: '2025-03-01 14:31:05', duration: '00:01:30', steps: 6, status: '等待解析', qaBatch: 'BATCH-766794-B' },
    ];

    if (uploaded) {
      const lumingEpisode = { 
        key: 'session_028', 
        episodeId: 'session_028', 
        time: '2026-05-20 10:12:37', 
        duration: '00:00:40', 
        steps: 4, 
        status: '已入库质检池', 
        qaBatch: 'BATCH-202605-A' 
      };
      if (!baseEpisodes.some(ep => ep.episodeId === 'session_028')) {
        baseEpisodes = [lumingEpisode, ...baseEpisodes];
      }
    }
    setEpisodes(baseEpisodes);
  }, [taskId, isLumos]);

  const handleOpenVideoModal = (episodeId) => {
    const epId = episodeId || 'session_028';
    window.open(`/collection/collect/video/${taskId}/${epId}`, '_blank');
  };

  // Mock data based on taskId
  const selectedTask = isLumos ? {
      taskId: taskId, 
      name: 'Lumos-双手筷子与勺子整理-001', 
      desc: '使用Lumos离线背包数采终端进行餐具整理数据采集', 
      robot: 'Lumos FastUMI Go 离线数采背包', 
      scene: '离线台面', 
      collector: '王小二', 
      progress: hasUploaded ? '50/50' : '3/50', 
      deviceStatus: '正常'
  } : { 
      taskId: taskId || 'CT-20250301001', 
      name: 'FRANKA-FR3-抓取红色方块-001', 
      desc: '使用FR3机器人抓取红色方块', 
      robot: 'FRANKA-FR3-1号', 
      scene: '桌面抓取', 
      collector: '张三', 
      progress: hasUploaded ? '50/50' : '35/50', 
      deviceStatus: '正常' 
  };

  const columns = [
    { title: '包 ID (Episode)', dataIndex: 'episodeId', key: 'episodeId', render: text => <span style={{ fontFamily: 'monospace' }}>{text}</span> },
    { title: '所属质检批次', dataIndex: 'qaBatch', key: 'qaBatch', render: (text) => text !== '-' ? <a onClick={() => router.push(`/collection/qa/${encodeURIComponent(text)}`)} style={{ color: '#1677ff', fontWeight: 500 }}>{text}</a> : <span style={{ color: '#aaa' }}>-</span> },
    { title: '采集时间', dataIndex: 'time', key: 'time' },
    { title: '视频时长', dataIndex: 'duration', key: 'duration' },
    { title: '包含动作数', dataIndex: 'steps', key: 'steps' },
    { 
      title: '当前状态', 
      dataIndex: 'status', 
      key: 'status',
      render: status => {
        let color = 'default';
        if (status === '已入库质检池') color = 'success';
        if (status === '等待解析') color = 'processing';
        if (status === '废弃') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { 
      title: '操作', fixed: 'right',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            disabled={record.status === '废弃'}
            onClick={() => {
              handleOpenVideoModal(record.episodeId);
            }}
          >
            查看视频
          </Button>
          <Button 
            type="primary" 
            size="small" 
            disabled={record.status === '废弃' || record.qaBatch === '-'} 
            onClick={() => {
              if (record.episodeId === 'session_028') {
                window.open(`/collection/collect/data/${taskId}`, '_blank');
              } else {
                router.push(`/collection/qa/${encodeURIComponent(record.qaBatch)}`);
              }
            }}
          >
            追踪质检
          </Button>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={4} style={{ margin: 0 }}>工作台采集任务详情</Title>
        </div>
        <Space>
            <Button type="primary" size="large" onClick={() => window.open(`/collection/collect/connection/${taskId}`, '_blank')}>进入数采自检与工作台</Button>
        </Space>
      </div>



      <Card title="任务信息" bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
          <Descriptions bordered column={2}>
              <Descriptions.Item label="任务ID">{selectedTask.taskId}</Descriptions.Item>
              <Descriptions.Item label="任务名称">{selectedTask.name}</Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>{selectedTask.desc}</Descriptions.Item>
              <Descriptions.Item label="采集数量">{selectedTask.progress}</Descriptions.Item>
              <Descriptions.Item label="平均时长">{isLumos ? '15.0 秒 (固定帧)' : '2分30秒'}</Descriptions.Item>
          </Descriptions>
      </Card>
      
      <Card title="采集情况" bordered={false} style={{ borderRadius: 8, marginBottom: 24 }}>
          <Descriptions bordered column={2}>
              <Descriptions.Item label="采集机器人">{selectedTask.robot}</Descriptions.Item>
              <Descriptions.Item label="采集场景">{selectedTask.scene}</Descriptions.Item>
              <Descriptions.Item label="设备状态"><Badge status={selectedTask.deviceStatus === '正常' ? 'success' : 'error'} text={selectedTask.deviceStatus} /></Descriptions.Item>
              <Descriptions.Item label="采集进度"><Progress percent={parseFloat(selectedTask.progress.split('/')[0]) / parseFloat(selectedTask.progress.split('/')[1]) * 100} size="small" /></Descriptions.Item>
          </Descriptions>
      </Card>
 
      <Card title="已采集序列包记录 (Historical Episodes)" bordered={false} style={{ borderRadius: 8 }}>
          <Table 
            dataSource={episodes} 
            columns={columns} 
            pagination={{ pageSize: 5 }} 
            size="middle"
          />
      </Card>

      {/* Dynamic video viewer is now opened in a new tab */}
    </MainLayout>
  );
}

