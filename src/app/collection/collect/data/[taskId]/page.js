'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Table, Tag, Space, Row, Col, Descriptions, Steps, Button, Typography, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, HddOutlined, PlayCircleOutlined, ApiOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

const historicalEpisodes = [
  { key: '1', episodeId: 'EP-20250301-001', time: '2025-03-01 14:20:00', duration: '00:01:23', steps: 6, status: '已入库质检池', qaBatch: 'BATCH-766794-A' },
  { key: '2', episodeId: 'EP-20250301-002', time: '2025-03-01 14:22:15', duration: '00:01:45', steps: 6, status: '已入库质检池', qaBatch: 'BATCH-766794-A' },
  { key: '3', episodeId: 'EP-20250301-003', time: '2025-03-01 14:25:30', duration: '00:01:12', steps: 6, status: '等待解析', qaBatch: 'BATCH-766794-B' },
  { key: '4', episodeId: 'EP-20250301-004', time: '2025-03-01 14:28:10', duration: '00:02:01', steps: 6, status: '废弃', qaBatch: '-' },
  { key: '5', episodeId: 'EP-20250301-005', time: '2025-03-01 14:31:05', duration: '00:01:30', steps: 6, status: '等待解析', qaBatch: 'BATCH-766794-B' },
];

export default function CollectTaskDataPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId || 'CT-20250301002';
  
  const [selectedEpisode, setSelectedEpisode] = useState(historicalEpisodes[0]);

  // Mock task metadata
  const taskName = taskId === 'CT-20250301002' ? 'FRANKA-FR3-放置蓝色圆柱-002' : 'FRANKA-FR3-抓取红色方块-001';

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
              dataSource={historicalEpisodes}
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
                  <Descriptions.Item label="动作帧数">{selectedEpisode.steps * 30} 帧</Descriptions.Item>
                  <Descriptions.Item label="系统状态">
                    <Tag color={selectedEpisode.status === '已入库质检池' ? 'success' : selectedEpisode.status === '废弃' ? 'error' : 'processing'}>
                      {selectedEpisode.status}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Cameras & Telemetry Visualization */}
              <Row gutter={16}>
                {/* 4-Camera Video Grid Simulator */}
                <Col span={14}>
                  <Card title="多视角相机监视 (Camera CCTV)" bordered={false} styles={{ body: { padding: 8 } }} style={{ background: '#141414', color: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000', borderRadius: 4, overflow: 'hidden' }}>
                      <svg viewBox="0 0 400 225" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        <rect width="400" height="225" fill="#18181c" />
                        <line x1="200" y1="0" x2="200" y2="225" stroke="#2a2a30" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="0" y1="112" x2="400" y2="112" stroke="#2a2a30" strokeWidth="1" strokeDasharray="5,5" />
                        
                        {/* Cam 1: Front view */}
                        <text x="10" y="20" fill="#888" fontSize="10" fontFamily="monospace">CAM-01: FRONT</text>
                        <circle cx="100" cy="56" r="30" fill="none" stroke="#52c41a" strokeWidth="1" />
                        <line x1="100" y1="26" x2="100" y2="86" stroke="#52c41a" strokeWidth="0.5" />
                        <line x1="70" y1="56" x2="130" y2="56" stroke="#52c41a" strokeWidth="0.5" />
                        <rect x="90" y="46" width="20" height="20" rx="3" fill="#1677ff" opacity="0.8" />
                        <text x="94" y="59" fill="#fff" fontSize="8" fontWeight="bold">CUBE</text>
                        
                        {/* Cam 2: Gripper wrist view */}
                        <text x="210" y="20" fill="#888" fontSize="10" fontFamily="monospace">CAM-02: GRIPPER EYE</text>
                        <path d="M 280 40 L 320 40 L 300 80 Z" fill="none" stroke="#1677ff" strokeWidth="1" />
                        <circle cx="300" cy="50" r="10" fill="red" opacity="0.6" />
                        
                        {/* Cam 3: 3D pointcloud reconstruction */}
                        <text x="10" y="132" fill="#888" fontSize="10" fontFamily="monospace">CAM-03: 3D MODEL</text>
                        <path d="M 50 180 L 100 150 L 150 180 L 100 210 Z" fill="none" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 100 150 L 100 120" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 50 180 L 50 150" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 150 180 L 150 150" stroke="#2e2e38" strokeWidth="1" />
                        <path d="M 100 210 L 100 180 L 80 150 L 90 130" fill="none" stroke="#1890ff" strokeWidth="3" strokeLinecap="round" />
                        
                        {/* Cam 4: Depth map */}
                        <text x="210" y="132" fill="#888" fontSize="10" fontFamily="monospace">CAM-04: DEPTH MAP</text>
                        <circle cx="300" cy="168" r="25" fill="#3f1285" opacity="0.7" />
                        <circle cx="300" cy="168" r="15" fill="#722ed1" opacity="0.8" />
                        <circle cx="300" cy="168" r="5" fill="#a868ff" />

                        <rect x="330" y="200" width="60" height="15" rx="3" fill="rgba(82, 196, 26, 0.2)" />
                        <text x="335" y="211" fill="#52c41a" fontSize="8" fontWeight="bold">STREAMING</text>
                      </svg>
                      
                      {/* Video Player controls bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 32, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
                        <Space size="small">
                          <PlayCircleOutlined style={{ color: '#fff', fontSize: 16 }} />
                          <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>00:45 / {selectedEpisode.duration}</span>
                        </Space>
                        <Space size="middle">
                          <span style={{ fontSize: 10, color: '#52c41a', border: '1px solid #52c41a', padding: '1px 4px', borderRadius: 2 }}>AUTO-ALIGN</span>
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
                      <svg viewBox="0 0 200 80" style={{ width: '100%', height: 75 }}>
                        <path d="M 30 60 L 100 70 L 170 60 L 100 48 Z" fill="none" stroke="#d9d9d9" strokeWidth="1" />
                        <path d="M 30 60 L 30 20 L 100 10 L 100 48" fill="none" stroke="#d9d9d9" strokeWidth="1" />
                        <path d="M 170 60 L 170 20 L 100 10" fill="none" stroke="#d9d9d9" strokeWidth="1" />
                        <path d="M 60 55 Q 90 15 120 30 T 150 55" fill="none" stroke="#13c2c2" strokeWidth="2" strokeDasharray="3,3" />
                        <circle cx="60" cy="55" r="2" fill="#ff4d4f" />
                        <circle cx="150" cy="55" r="2" fill="#52c41a" />
                      </svg>
                    </div>
                    
                    <div style={{ background: '#f5f5f5', borderRadius: 4, height: 100, padding: 8, position: 'relative' }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: '#888', display: 'block' }}>Torque Feedback / Joint Speed</span>
                      <svg viewBox="0 0 200 60" style={{ width: '100%', height: 65 }}>
                        <path d="M 10 30 Q 30 8 50 32 T 90 38 T 130 20 T 170 30 T 190 25" fill="none" stroke="#1890ff" strokeWidth="1" />
                        <path d="M 10 22 Q 40 45 70 15 T 130 38 T 190 30" fill="none" stroke="#722ed1" strokeWidth="0.8" opacity="0.7" />
                        <path d="M 110 26 L 115 10 L 120 40 L 125 26" fill="none" stroke="#fa8c16" strokeWidth="1" />
                        <line x1="10" y1="30" x2="190" y2="30" stroke="#bfbfbf" strokeWidth="0.5" strokeDasharray="4,4" />
                      </svg>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Action Timeline */}
              <Card title="动作原语解析序列 (Action Timeline)" bordered={false} style={{ borderRadius: 8 }}>
                <Steps
                  direction="horizontal"
                  current={2}
                  size="small"
                  items={[
                    { title: '靠近方块', description: 'Approach' },
                    { title: '张开手指', description: 'Open' },
                    { title: '贴合闭合', description: 'Grasp' },
                    { title: '垂直抬升', description: 'Lift' },
                    { title: '平移对准', description: 'Move' },
                    { title: '松开复位', description: 'Release' }
                  ]}
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
