'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Table, Tag, Space, Row, Col, Descriptions, Steps, Button, Typography, Breadcrumb, Collapse } from 'antd';
import { 
  ArrowLeftOutlined, HddOutlined, PlayCircleOutlined, ApiOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined,
  FileTextOutlined, SafetyCertificateOutlined, WarningOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const humanoidEpisodes = [
  { key: '1', episodeId: 'EP-20250301-001', time: '2025-03-01 14:20:00', duration: '00:01:23', steps: 6, status: '已入库质检池', qaBatch: 'BATCH-766794-A' },
  { key: '2', episodeId: 'EP-20250301-002', time: '2025-03-01 14:22:15', duration: '00:01:45', steps: 6, status: '已入库质检池', qaBatch: 'BATCH-766794-A' },
  { key: '3', episodeId: 'EP-20250301-003', time: '2025-03-01 14:25:30', duration: '00:01:12', steps: 6, status: '等待解析', qaBatch: 'BATCH-766794-B' },
  { key: '4', episodeId: 'EP-20250301-004', time: '2025-03-01 14:28:10', duration: '00:02:01', steps: 6, status: '废弃', qaBatch: '-' },
  { key: '5', episodeId: 'EP-20250301-005', time: '2025-03-01 14:31:05', duration: '00:01:30', steps: 6, status: '等待解析', qaBatch: 'BATCH-766794-B' },
];

const lumosEpisodes = [
  { key: '1', episodeId: 'EP-20260414-001', time: '2026-04-14 14:20:00', duration: '00:00:15', steps: 4, status: '已入库质检池', qaBatch: 'BATCH-202604-A' },
  { key: '2', episodeId: 'EP-20260414-002', time: '2026-04-14 14:22:15', duration: '00:00:15', steps: 4, status: '已入库质检池', qaBatch: 'BATCH-202604-A' },
  { key: '3', episodeId: 'EP-20260414-003', time: '2026-04-14 14:25:30', duration: '00:00:15', steps: 4, status: '废弃', qaBatch: '-' },
];

export default function CollectTaskDataPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId || 'CT-20250301002';
  const isLumos = taskId === 'CT-20260414001' || taskId?.includes('2026') || taskId?.includes('Lumos');

  const [hasUploaded, setHasUploaded] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  useEffect(() => {
    // Check if task has uploaded Luming data
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

    let baseEpisodes = isLumos ? [...lumosEpisodes] : [...humanoidEpisodes];
    if (uploaded) {
      const lumingEpisode = { 
        key: 'session_028', 
        episodeId: 'session_028', 
        time: '2026-05-20 10:12:37', 
        duration: '00:00:40', 
        steps: 4, 
        status: '已入库质检池', 
        qaBatch: 'BATCH-202605-A',
        isLumingData: true
      };
      if (!baseEpisodes.some(ep => ep.episodeId === 'session_028')) {
        baseEpisodes = [lumingEpisode, ...baseEpisodes];
      }
    }
    setEpisodes(baseEpisodes);
    if (baseEpisodes.length > 0) {
      setSelectedEpisode(baseEpisodes[0]);
    }
  }, [taskId, isLumos]);

  // Task metadata
  const taskName = isLumos ? 'Lumos-双手筷子与勺子整理-001' : (taskId === 'CT-20250301002' ? 'FRANKA-FR3-放置蓝色圆柱-002' : 'FRANKA-FR3-抓取红色方块-001');

  return (
    <MainLayout>
      {/* Page Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space size="middle">
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.close()} />
          <div>
            <Breadcrumb items={[
              { title: '数据采集' },
              { title: '采集任务' },
              { title: '查看数据' }
            ]} />
            <Title level={4} style={{ margin: 0, marginTop: 4 }}>
              <Space>
                <HddOutlined style={{ color: '#1677ff' }} />
                <span>数据监控面板: {taskName} ({taskId})</span>
              </Space>
            </Title>
          </div>
        </Space>
        <Button onClick={() => window.close()}>关闭页面</Button>
      </div>

      <Row gutter={24} style={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* Left Column - Episode List */}
        <Col span={7}>
          <Card title="已采集序列包 (Episodes)" bordered={false} styles={{ body: { padding: 0 } }} style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8 }}>
            <Table
              dataSource={episodes}
              columns={[
                {
                  title: '序列包 ID',
                  dataIndex: 'episodeId',
                  key: 'episodeId',
                  render: (id) => (
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontWeight: selectedEpisode?.episodeId === id ? 'bold' : 'normal',
                      color: selectedEpisode?.episodeId === id ? '#1677ff' : 'inherit'
                    }}>{id}</span>
                  )
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (st) => {
                    let color = 'default';
                    if (st === '已入库质检池') color = 'success';
                    if (st === '等待解析') color = 'processing';
                    if (st === '废弃') color = 'error';
                    return <Tag color={color}>{st}</Tag>;
                  }
                }
              ]}
              pagination={{ pageSize: 10, size: 'small' }}
              rowKey="episodeId"
              onRow={(record) => ({
                onClick: () => setSelectedEpisode(record),
                style: { 
                  cursor: 'pointer',
                  background: selectedEpisode?.episodeId === record.episodeId ? '#e6f4ff' : 'inherit'
                }
              })}
            />
          </Card>
        </Col>

        {/* Right Column - Multi-modal Data View */}
        <Col span={17}>
          {selectedEpisode ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* Episode Metadata Details */}
              <Card bordered={false} styles={{ body: { padding: 16 } }} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8 }}>
                <Descriptions title={`序列详情: ${selectedEpisode.episodeId}`} size="small" column={3}>
                  <Descriptions.Item label="所属批次">{selectedEpisode.qaBatch}</Descriptions.Item>
                  <Descriptions.Item label="采集时间">{selectedEpisode.time}</Descriptions.Item>
                  <Descriptions.Item label="视频时长">{selectedEpisode.duration}</Descriptions.Item>
                  <Descriptions.Item label="动作帧数">{selectedEpisode.episodeId === 'session_028' ? '1800' : (selectedEpisode.steps * 30 || 450)} 帧</Descriptions.Item>
                  <Descriptions.Item label="系统状态">
                    <Tag color={selectedEpisode.status === '已入库质检池' ? 'success' : selectedEpisode.status === '废弃' ? 'error' : 'processing'}>
                      {selectedEpisode.status}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                {selectedEpisode.episodeId === 'session_028' && (
                  <Descriptions title="设备与采集环境配置" size="small" column={3} style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                    <Descriptions.Item label="夹爪类型">非平动夹爪 (pose_merge)</Descriptions.Item>
                    <Descriptions.Item label="ToF模式">关闭 (off)</Descriptions.Item>
                    <Descriptions.Item label="采集脚本">single_session_data_collector_buffered.py</Descriptions.Item>
                    <Descriptions.Item label="左臂 XV 序列号" span={2}>
                      <span style={{ fontFamily: 'monospace' }}>250801DR48FP26003296 (Vive 已禁用)</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="左臂标签">left_hand</Descriptions.Item>
                    <Descriptions.Item label="右臂 XV 序列号" span={2}>
                      <span style={{ fontFamily: 'monospace' }}>250801DR48FP26003349 (Vive 已禁用)</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="右臂标签">right_hand</Descriptions.Item>
                    <Descriptions.Item label="主控配置文件" span={3}>
                      <span style={{ fontFamily: 'monospace' }}>../config/start_process_config.json</span>
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </Card>

              {/* Cameras & Telemetry Visualization */}
              <Row gutter={16}>
                {/* 4-Camera Video Grid Simulator */}
                <Col span={14}>
                  <Card 
                    title={selectedEpisode.episodeId === 'session_028' ? "多视角相机流监视 (Luming Multi-Cam)" : (isLumos ? "多视角相机流监视 (Lumos Multi-Cam)" : "多视角相机监视 (Camera CCTV)")} 
                    bordered={false} 
                    styles={{ body: { padding: 8 } }} 
                    style={{ background: '#141414', color: '#fff', borderRadius: 8, overflow: 'hidden' }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000', borderRadius: 4, overflow: 'hidden' }}>
                      <svg viewBox="0 0 400 225" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        <rect width="400" height="225" fill="#18181c" />
                        <line x1="200" y1="0" x2="200" y2="225" stroke="#2a2a30" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="0" y1="112" x2="400" y2="112" stroke="#2a2a30" strokeWidth="1" strokeDasharray="5,5" />
                        
                        {/* Cam 1: Left view / Wrist L */}
                        <text x="10" y="20" fill="#888" fontSize="10" fontFamily="monospace">
                          {selectedEpisode.episodeId === 'session_028' ? 'CAM-01: WRIST_CAM_L (左手腕)' : (isLumos ? 'CAM-01: WRIST_CAM_L' : 'CAM-01: FRONT')}
                        </text>
                        <circle cx="100" cy="56" r="30" fill="none" stroke="#52c41a" strokeWidth="1" />
                        <line x1="100" y1="26" x2="100" y2="86" stroke="#52c41a" strokeWidth="0.5" />
                        <line x1="70" y1="56" x2="130" y2="56" stroke="#52c41a" strokeWidth="0.5" />
                        <rect x="90" y="46" width="20" height="20" rx="3" fill="#1677ff" opacity="0.8" />
                        <text x="94" y="59" fill="#fff" fontSize="8" fontWeight="bold">
                          {selectedEpisode.episodeId === 'session_028' ? 'CUP' : (isLumos ? 'BOX' : 'CUBE')}
                        </text>
                        
                        {/* Cam 2: Right view / Wrist R */}
                        <text x="210" y="20" fill="#888" fontSize="10" fontFamily="monospace">
                          {selectedEpisode.episodeId === 'session_028' ? 'CAM-02: WRIST_CAM_R (右手腕)' : (isLumos ? 'CAM-02: WRIST_CAM_R' : 'CAM-02: GRIPPER EYE')}
                        </text>
                        <path d="M 280 40 L 320 40 L 300 80 Z" fill="none" stroke="#1677ff" strokeWidth="1" />
                        <circle cx="300" cy="50" r="10" fill="red" opacity="0.6" />
                        {selectedEpisode.episodeId === 'session_028' && (
                          <text x="282" y="32" fill="#ff4d4f" fontSize="8">[STATIC STATE]</text>
                        )}
                        
                        {/* Cam 3: Head left eye */}
                        <text x="10" y="132" fill="#888" fontSize="10" fontFamily="monospace">
                          {selectedEpisode.episodeId === 'session_028' ? 'CAM-03: HEAD_LEFT_EYE (主视角)' : (isLumos ? 'CAM-03: HEAD_LEFT_EYE' : 'CAM-03: 3D MODEL')}
                        </text>
                        <path d="M 50 180 L 100 150 L 150 180 L 100 210 Z" fill="none" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 100 150 L 100 120" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 50 180 L 50 150" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 150 180 L 150 150" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 100 210 L 100 180 L 80 150 L 90 130" fill="none" stroke="#1890ff" strokeWidth="3" strokeLinecap="round" />
                        
                        {/* Cam 4: LIDAR DEPTH */}
                        <text x="210" y="132" fill="#888" fontSize="10" fontFamily="monospace">
                          {selectedEpisode.episodeId === 'session_028' ? 'CAM-04: LIDAR DEPTH (雷达深度图)' : (isLumos ? 'CAM-04: LIDAR DEPTH' : 'CAM-04: DEPTH MAP')}
                        </text>
                        <circle cx="300" cy="168" r="25" fill="#3f1285" opacity="0.7" />
                        <circle cx="300" cy="168" r="15" fill="#722ed1" opacity="0.8" />
                        <circle cx="300" cy="168" r="5" fill="#a868ff" />
                        {selectedEpisode.episodeId === 'session_028' && (
                          <rect x="235" y="195" width="55" height="12" rx="2" fill="rgba(24, 144, 255, 0.2)" />
                        )}
                        {selectedEpisode.episodeId === 'session_028' && (
                          <text x="238" y="204" fill="#1890ff" fontSize="7" fontWeight="bold">TOF: OFF</text>
                        )}

                        <rect x="330" y="200" width="60" height="15" rx="3" fill="rgba(82, 196, 26, 0.2)" />
                        <text x="335" y="211" fill="#52c41a" fontSize="8" fontWeight="bold">STREAMING</text>
                      </svg>
                      
                      {/* Video Player controls bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 32, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
                        <Space size="small">
                          <PlayCircleOutlined style={{ color: '#fff', fontSize: 16 }} />
                          <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{selectedEpisode.episodeId === 'session_028' ? '00:18' : (isLumos ? '00:08' : '00:45')} / {selectedEpisode.duration}</span>
                        </Space>
                        <Space size="middle">
                          <span style={{ fontSize: 10, color: '#52c41a', border: '1px solid #52c41a', padding: '1px 4px', borderRadius: 2 }}>
                            {selectedEpisode.episodeId === 'session_028' ? 'LUMING-SYNC' : (isLumos ? 'LUMOS-SYNC' : 'AUTO-ALIGN')}
                          </span>
                          <ApiOutlined style={{ color: '#fff' }} />
                        </Space>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Trajectory plot and joint sensor charts */}
                <Col span={10}>
                  <Card title="运动轨迹与力矩监视 (Telemetry)" bordered={false} styles={{ body: { padding: 12 } }} style={{ height: '100%', borderRadius: 8 }}>
                    <div style={{ background: '#f5f5f5', borderRadius: 4, height: 110, padding: 8, marginBottom: 12, position: 'relative' }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: '#888', display: 'block' }}>3D Trajectory Path Visualizer</span>
                      {selectedEpisode.episodeId === 'session_028' ? (
                        <>
                          <svg viewBox="0 0 200 80" style={{ width: '100%', height: 75 }}>
                            <path d="M 30 60 L 100 70 L 170 60 L 100 48 Z" fill="none" stroke="#d9d9d9" strokeWidth="0.5" />
                            <path d="M 30 60 L 30 20 L 100 10 L 100 48" fill="none" stroke="#d9d9d9" strokeWidth="0.5" />
                            <path d="M 170 60 L 170 20 L 100 10" fill="none" stroke="#d9d9d9" strokeWidth="0.5" />
                            
                            {/* Left arm: highly active */}
                            <path d="M 50 55 Q 85 10 120 40 T 160 30" fill="none" stroke="#1677ff" strokeWidth="2" strokeDasharray="3,1" />
                            <circle cx="50" cy="55" r="2" fill="#1677ff" />
                            <circle cx="160" cy="30" r="2" fill="#52c41a" />
                            
                            {/* Right arm: stationary at start */}
                            <path d="M 100 48 L 101 48 L 100 49 L 100 48" fill="none" stroke="#722ed1" strokeWidth="2.5" />
                            <circle cx="100" cy="48" r="2.5" fill="#722ed1" />
                          </svg>
                          <div style={{ position: 'absolute', bottom: 4, right: 8, display: 'flex', gap: 8, fontSize: 9 }}>
                            <span style={{ color: '#1677ff' }}>● 左臂(活动)</span>
                            <span style={{ color: '#722ed1' }}>● 右臂(静止)</span>
                          </div>
                        </>
                      ) : (
                        <svg viewBox="0 0 200 80" style={{ width: '100%', height: 75 }}>
                          <path d="M 30 60 L 100 70 L 170 60 L 100 48 Z" fill="none" stroke="#d9d9d9" strokeWidth="1" />
                          <path d="M 30 60 L 30 20 L 100 10 L 100 48" fill="none" stroke="#d9d9d9" strokeWidth="1" />
                          <path d="M 170 60 L 170 20 L 100 10" fill="none" stroke="#d9d9d9" strokeWidth="1" />
                          <path d="M 60 55 Q 90 15 120 30 T 150 55" fill="none" stroke="#13c2c2" strokeWidth="2" strokeDasharray="3,3" />
                          <circle cx="60" cy="55" r="2" fill="#ff4d4f" />
                          <circle cx="150" cy="55" r="2" fill="#52c41a" />
                        </svg>
                      )}
                    </div>
                    
                    <div style={{ background: '#f5f5f5', borderRadius: 4, height: 100, padding: 8, position: 'relative' }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: '#888', display: 'block' }}>Torque Feedback / Joint Speed</span>
                      {selectedEpisode.episodeId === 'session_028' ? (
                        <>
                          <svg viewBox="0 0 200 60" style={{ width: '100%', height: 65 }}>
                            {/* Left Hand: Speed showing sharp peaks matching kinematics speed_max = 1.0998 m/s */}
                            <path d="M 10 45 Q 25 10 40 40 T 70 48 T 100 12 T 130 38 T 160 42 T 190 28" fill="none" stroke="#1677ff" strokeWidth="1.2" />
                            {/* Right Hand: Extremely static speed max = 0.0074 m/s */}
                            <line x1="10" y1="52" x2="190" y2="52" stroke="#722ed1" strokeWidth="1.5" />
                            <line x1="10" y1="30" x2="190" y2="30" stroke="#bfbfbf" strokeWidth="0.5" strokeDasharray="4,4" />
                          </svg>
                          <div style={{ position: 'absolute', bottom: 4, right: 8, display: 'flex', gap: 8, fontSize: 9 }}>
                            <span style={{ color: '#1677ff' }}>● 左臂速度</span>
                            <span style={{ color: '#722ed1' }}>● 右臂速度</span>
                          </div>
                        </>
                      ) : (
                        <svg viewBox="0 0 200 60" style={{ width: '100%', height: 65 }}>
                          <path d="M 10 30 Q 30 8 50 32 T 90 38 T 130 20 T 170 30 T 190 25" fill="none" stroke="#1890ff" strokeWidth="1" />
                          <path d="M 10 22 Q 40 45 70 15 T 130 38 T 190 30" fill="none" stroke="#722ed1" strokeWidth="0.8" opacity="0.7" />
                          <path d="M 110 26 L 115 10 L 120 40 L 125 26" fill="none" stroke="#fa8c16" strokeWidth="1" />
                          <line x1="10" y1="30" x2="190" y2="30" stroke="#bfbfbf" strokeWidth="0.5" strokeDasharray="4,4" />
                        </svg>
                      )}
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* 自动质检诊断分析报告 (Auto QA & Diagnostic Report) */}
              {selectedEpisode.episodeId === 'session_028' && (
                <Card 
                  title={
                    <Space>
                      <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                      <span style={{ fontWeight: 600 }}>自动质检诊断分析报告 (Auto QA & Diagnostic Report)</span>
                      <Tag color="success" style={{ marginLeft: 8 }}>所有检查通过 (PASS)</Tag>
                    </Space>
                  } 
                  bordered={false} 
                  style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <Descriptions size="small" column={3} bordered style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="质检决策" span={2}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>通过 (Result: pass)</span>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>— 所有检查项符合自适应判定基准 (违规比例 1.50% &le; 3.0%)</span>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="诊断分析时间">2026-05-20 10:13:21</Descriptions.Item>
                    <Descriptions.Item label="左臂状态 (left_hand)">
                      <Tag color="success">通过 (PASS)</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="右臂状态 (right_hand)">
                      <Tag color="success">通过 (PASS)</Tag>
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>（处于静止状态，静止率 100.0% 豁免）</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="数据判定基准">
                      <Space>
                        <span>帧间位移 MERGE:</span>
                        <Tag color="success">通过</Tag>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>

                  <Collapse 
                    defaultActiveKey={['1']} 
                    ghost
                    items={[
                      {
                        key: '1',
                        label: <span style={{ fontWeight: 600 }}>双臂轨迹运动学指标对比与超标点统计 (Kinematics Stats)</span>,
                        children: (
                          <Table
                            size="small"
                            pagination={false}
                            dataSource={[
                              {
                                key: '1',
                                metric: '最大速度 (speed_max)',
                                threshold: '≤ 0.450 m/s',
                                leftValue: '1.0998 m/s',
                                leftStatus: 'pass',
                                leftDetail: '超限点: 110/14879 (0.74%)',
                                rightValue: '0.0074 m/s',
                                rightStatus: 'pass',
                                rightDetail: '无超限'
                              },
                              {
                                key: '2',
                                metric: '最大加速度 (accel_max)',
                                threshold: '≤ 5.000 m/s²',
                                leftValue: '54.5634 m/s²',
                                leftStatus: 'pass',
                                leftDetail: '超限点: 188/14879 (1.26%)',
                                rightValue: '0.3651 m/s²',
                                rightStatus: 'pass',
                                rightDetail: '无超限'
                              },
                              {
                                key: '3',
                                metric: '最大加加速度 (jerk_max)',
                                threshold: '≤ 2200.73 m/s³',
                                leftValue: '17185.06 m/s³',
                                leftStatus: 'pass',
                                leftDetail: '超限点: 112/14879 (0.75%)',
                                rightValue: '113.36 m/s³',
                                rightStatus: 'pass',
                                rightDetail: '无超限'
                              },
                              {
                                key: '4',
                                metric: '最大角速度 (angular_speed_max)',
                                threshold: '≤ 2.500 rad/s',
                                leftValue: '2.3233 rad/s',
                                leftStatus: 'pass',
                                leftDetail: '无超限 (-7.1%)',
                                rightValue: '0.8461 rad/s',
                                rightStatus: 'pass',
                                rightDetail: '无超限'
                              },
                              {
                                key: '5',
                                metric: '最大角加速度 (angular_accel_max)',
                                threshold: '≤ 23.00 rad/s²',
                                leftValue: '37.76 rad/s²',
                                leftStatus: 'pass',
                                leftDetail: '超限点: 14/14879 (0.09%)',
                                rightValue: '14.24 rad/s²',
                                rightStatus: 'pass',
                                rightDetail: '无超限'
                              },
                              {
                                key: '6',
                                metric: '最大角加加速度 (angular_jerk_max)',
                                threshold: '≤ 4000.41 rad/s³',
                                leftValue: '14330.67 rad/s³',
                                leftStatus: 'pass',
                                leftDetail: '超限点: 27/14879 (0.18%)',
                                rightValue: '5841.86 rad/s³',
                                rightStatus: 'pass',
                                rightDetail: '超标占比 0.0%'
                              },
                              {
                                key: '7',
                                metric: '起始位移距离 (max_pos_dist)',
                                threshold: '> 0.050 m',
                                leftValue: '0.2839 m',
                                leftStatus: 'pass',
                                leftDetail: '符合规范',
                                rightValue: '0.0024 m',
                                rightStatus: 'warning',
                                rightDetail: '判定失败，但因右臂静止率100%免除豁免'
                              }
                            ]}
                            columns={[
                              { title: '运动学检查项', dataIndex: 'metric', key: 'metric', width: 220 },
                              { title: '判定阈值', dataIndex: 'threshold', key: 'threshold', width: 120 },
                              { 
                                title: '左臂测量值 (left_hand)', dataIndex: 'leftValue', key: 'leftValue', width: 160,
                                render: (val, record) => (
                                  <Space>
                                    <span style={{ fontFamily: 'monospace' }}>{val}</span>
                                    {record.leftStatus === 'pass' ? <Tag color="success" size="small">通过</Tag> : <Tag color="error" size="small">超标</Tag>}
                                  </Space>
                                )
                              },
                              { title: '左臂超限详情', dataIndex: 'leftDetail', key: 'leftDetail', render: text => <span style={{ fontSize: 12, color: '#666' }}>{text}</span> },
                              { 
                                title: '右臂测量值 (right_hand)', dataIndex: 'rightValue', key: 'rightValue', width: 160,
                                render: (val, record) => (
                                  <Space>
                                    <span style={{ fontFamily: 'monospace' }}>{val}</span>
                                    {record.rightStatus === 'pass' ? <Tag color="success" size="small">通过</Tag> : <Tag color="warning" size="small">警告</Tag>}
                                  </Space>
                                )
                              },
                              { title: '右臂超限详情', dataIndex: 'rightDetail', key: 'rightDetail', render: text => <span style={{ fontSize: 12, color: '#666' }}>{text}</span> },
                            ]}
                          />
                        )
                      },
                      {
                        key: '2',
                        label: <span style={{ fontWeight: 600 }}>帧间位移检测详情 (Inter-frame Displacement)</span>,
                        children: (
                          <div style={{ padding: '0 8px' }}>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Card type="inner" title="左臂位移检测 (left_hand_250801DR48FP26003296)" size="small">
                                  <p style={{ margin: '4px 0' }}>判定基准: <b>MERGE</b> (结果: <Tag color="success">通过</Tag>)</p>
                                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.8 }}>
                                    <li><b>MERGE:</b> 阈值 = 7.00mm | 超标数 = 0/15221 (0.00%) | 最大位移 = 6.13mm | 平均位移 = 0.13mm</li>
                                    <li><b>SLAM:</b> 阈值 = 4.00mm | 超标数 = 3/15221 (0.02%) | 最大位移 = 6.17mm | 平均位移 = 0.13mm <Tag color="warning" style={{ transform: 'scale(0.85)', margin: 0 }}>超标</Tag></li>
                                    <li><b>VIVE:</b> <span style={{ color: '#8c8c8c' }}>数据不足或缺失（未启用）</span></li>
                                  </ul>
                                </Card>
                              </Col>
                              <Col span={12}>
                                <Card type="inner" title="右臂位移检测 (right_hand_250801DR48FP26003349)" size="small">
                                  <p style={{ margin: '4px 0' }}>判定基准: <b>MERGE</b> (结果: <Tag color="success">通过</Tag>)</p>
                                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.8 }}>
                                    <li><b>MERGE:</b> 阈值 = 7.00mm | 超标数 = 0/15234 (0.00%) | 最大位移 = 0.10mm | 平均位移 = 0.00mm</li>
                                    <li><b>SLAM:</b> 阈值 = 4.00mm | 超标数 = 0/15234 (0.00%) | 最大位移 = 0.03mm | 平均位移 = 0.00mm</li>
                                    <li><b>VIVE:</b> <span style={{ color: '#8c8c8c' }}>数据不足或缺失（未启用）</span></li>
                                  </ul>
                                </Card>
                              </Col>
                            </Row>
                          </div>
                        )
                      },
                      {
                        key: '3',
                        label: <span style={{ fontWeight: 600 }}>原始质检报告分析日志 (quality_report.txt)</span>,
                        children: (
                          <pre style={{ 
                            background: '#1e1e1e', 
                            color: '#d4d4d4', 
                            padding: 12, 
                            borderRadius: 6, 
                            maxHeight: 240, 
                            overflowY: 'auto',
                            fontFamily: 'monospace',
                            fontSize: 11,
                            lineHeight: 1.5,
                            margin: 0
                          }}>
{`Session: session_028
Path: Data/task_20260408W001_a/background_00/multi_sessions_20260520_101032/session_028
Layout: dual
Result: pass
Device Summary: [left] pass; [right] pass
Merged Status: [left] pass; [right] pass
违规比例: 1.50% (阈值: 3.0%)
Time: 2026-05-20T10:13:21.314410
----------------------------------------------------------------------------------------------------

[left] RGB平均频率: 60.03Hz | 阈值:60.0Hz±2.0Hz | pass
[left] 轨迹/slam
  speed_max: 1.0998m/s | 阈值:0.4500m/s | 超+144.4% | 超标点:110/14879(0.74%) | pass
  accel_max: 54.5634m/s² | 阈值:5.0000m/s² | 超+991.3% | 超标点:188/14879(1.26%) | pass
  jerk_max: 17185.06m/s³ | 阈值:2200.73m/s³ | 超+680.9% | 超标点:112/14879(0.75%) | pass
  angular_speed_max: 2.3233rad/s | 阈值:2.5000rad/s | 超-7.1% | pass
  angular_accel_max: 37.76rad/s² | 阈值:23.00rad/s² | 超+64.2% | 超标点:14/14879(0.09%) | pass
  angular_jerk_max: 14330.67rad/s³ | 阈值:4000.41rad/s³ | 超+258.2% | 超标点:27/14879(0.18%) | pass
  clamp_end: mean=0.00, std=0.00 | 期望:~88±1000.0或~19±1000.0 | pass
  clamp_static_ratio: 0.0% (夹爪静止占比)
  max_pos_dist_from_start: 0.2839m | 阈值:>0.05m | pass
  init_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass
  last_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass
  init_5cm_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass
  last_5cm_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass

  [帧间位移检测]
    判定基准: MERGE | 结果: pass
    MERGE: 阈值=7.00mm | 超限帧数=0/15221 (0.00%) | 最大位移=6.13mm | 平均位移=0.13mm
    SLAM: 阈值=4.00mm | 超限帧数=3/15221 (0.02%) | 最大位移=6.17mm | 平均位移=0.13mm
    VIVE: 数据不足或缺失

[right] RGB平均频率: 60.03Hz | 阈值:60.0Hz±2.0Hz | pass
[right] 轨迹/slam
  speed_max: 0.0074m/s | 阈值:0.4500m/s | 超-98.4% | pass
  accel_max: 0.3651m/s² | 阈值:5.0000m/s² | 超-92.7% | pass
  jerk_max: 113.36m/s³ | 阈值:2200.73m/s³ | 超-94.8% | pass
  angular_speed_max: 0.8461rad/s | 阈值:2.5000rad/s | 超-66.2% | pass
  angular_accel_max: 14.24rad/s² | 阈值:23.00rad/s² | 超-38.1% | pass
  angular_jerk_max: 5841.86rad/s³ | 阈值:4000.41rad/s³ | 超+46.0% | pass
  clamp_end: mean=0.00, std=0.00 | 期望:~88±1000.0或~19±1000.0 | pass
  clamp_static_ratio: 0.0% (夹爪静止占比)
  max_pos_dist_from_start: 0.0024m | 阈值:>0.05m | fail
  init_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass
  last_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass
  init_5cm_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass
  last_5cm_ratio: 0.0% | 阈值:15.0% | 超-100.0% | pass

  [帧间位移检测]
    判定基准: MERGE | 结果: pass
    MERGE: 阈值=7.00mm | 超限帧数=0/15234 (0.00%) | 最大位移=0.10mm | 平均位移=0.00mm
    SLAM: 阈值=4.00mm | 超限帧数=0/15234 (0.00%) | 最大位移=0.03mm | 平均位移=0.00mm
    VIVE: 数据不足或缺失`}
                          </pre>
                        )
                      }
                    ]}
                  />
                </Card>
              )}

              {/* Action Timeline */}
              <Card title="动作原语解析序列 (Action Timeline)" bordered={false} style={{ borderRadius: 8 }}>
                <Steps
                  direction="horizontal"
                  current={2}
                  size="small"
                  items={selectedEpisode.episodeId === 'session_028' ? [
                    { title: '餐具抓取', description: 'Grasp' },
                    { title: '餐具整理', description: 'Align' },
                    { title: '落盒置放', description: 'Place' },
                    { title: '松开复位', description: 'Release' }
                  ] : (isLumos ? [
                    { title: '端持餐具', description: 'Grasp' },
                    { title: '平行标定', description: 'Calibrate' },
                    { title: '平移整理', description: 'Align' },
                    { title: '落盒置放', description: 'Place' }
                  ] : [
                    { title: '靠近方块', description: 'Approach' },
                    { title: '张开手指', description: 'Open' },
                    { title: '贴合闭合', description: 'Grasp' },
                    { title: '垂直抬升', description: 'Lift' },
                    { title: '平移对准', description: 'Move' },
                    { title: '松开复位', description: 'Release' }
                  ])}
                />
              </Card>
            </Space>
          ) : (
            <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#aaa' }}>请选择左侧的一个序列包来查看多模态传感器和相机数据</div>
            </Card>
          )}
        </Col>
      </Row>
    </MainLayout>
  );
}
