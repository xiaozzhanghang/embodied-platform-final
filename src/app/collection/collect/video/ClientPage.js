'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Card, Typography, Space, Table, Tag, Row, Col, 
  Breadcrumb, Progress, App 
} from 'antd';
import { 
  ArrowLeftOutlined, EyeOutlined, FolderOutlined, 
  FolderOpenOutlined, FileTextOutlined, PlayCircleOutlined, 
  FileOutlined, CaretRightOutlined, PauseOutlined, CloseOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { StatusTag } from '@/components/ui';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text } = Typography;

// Directory structure tree data helper (Luming data package style)
const getTreeData = (episodeId) => {
  const id = episodeId || 'session_028';
  return [
    {
      title: `${id} (数采会话包)`,
      key: id,
      icon: <FolderOpenOutlined style={{ color: '#ffc069' }} />,
      children: [
        {
          title: 'left_hand_250801DR48FP26003296 (左手腕传感器数据)',
          key: 'left_hand',
          icon: <FolderOutlined style={{ color: '#ffc069' }} />,
          children: [
            { title: 'Clamp_Data (夹爪数据)', key: 'left_clamp', icon: <FolderOutlined /> },
            { title: 'Merged_Trajectory (运动位姿轨迹)', key: 'left_trajectory', icon: <FolderOutlined /> },
            {
              title: 'RGB_Images (视频图片帧数据)',
              key: 'left_rgb',
              icon: <FolderOutlined style={{ color: '#ffc069' }} />,
              children: [
                { title: 'timestamps.csv (视频帧时间戳)', key: 'left_timestamps', icon: <FileTextOutlined />, isText: true, content: 'frame_id,timestamp,system_time\n0,1716174000.000,1716174000.005\n1,1716174000.033,1716174000.038\n2,1716174000.066,1716174000.071\n3,1716174000.100,1716174000.104\n4,1716174000.133,1716174000.139\n5,1716174000.166,1716174000.170\n6,1716174000.200,1716174000.205\n7,1716174000.233,1716174000.238' },
                { title: 'video.mp4 (左手腕彩色摄像监控视频)', key: 'left_video', icon: <PlayCircleOutlined style={{ color: '#1890ff' }} />, isVideo: true }
              ]
            },
            { title: 'SLAM_Poses (三维定位重建位姿)', key: 'left_slam', icon: <FolderOutlined /> },
            { title: 'queue_lengths.csv (传输队列缓冲分析)', key: 'left_queue', icon: <FileTextOutlined />, isText: true, content: 'timestamp,queue_size,drop_count\n1716174000.00,1,0\n1716174000.10,2,0\n1716174000.20,1,0\n1716174000.30,1,0\n1716174000.40,2,0\n1716174000.50,1,0' }
          ]
        },
        {
          title: 'right_hand_250801DR48FP26003349 (右手腕传感器数据)',
          key: 'right_hand',
          icon: <FolderOutlined style={{ color: '#ffc069' }} />,
          children: [
            { title: 'Clamp_Data (夹爪数据)', key: 'right_clamp', icon: <FolderOutlined /> },
            { title: 'Merged_Trajectory (运动位姿轨迹)', key: 'right_trajectory', icon: <FolderOutlined /> },
            {
              title: 'RGB_Images (视频图片帧数据)',
              key: 'right_rgb',
              icon: <FolderOutlined style={{ color: '#ffc069' }} />,
              children: [
                { title: 'timestamps.csv (视频帧时间戳)', key: 'right_timestamps', icon: <FileTextOutlined />, isText: true, content: 'frame_id,timestamp,system_time\n0,1716174000.000,1716174000.005\n1,1716174000.033,1716174000.039\n2,1716174000.066,1716174000.070\n3,1716174000.100,1716174000.105' },
                { title: 'video.mp4 (右手腕彩色摄像监控视频)', key: 'right_video', icon: <PlayCircleOutlined style={{ color: '#1890ff' }} />, isVideo: true }
              ]
            },
            { title: 'SLAM_Poses (三维定位重建位姿)', key: 'right_slam', icon: <FolderOutlined /> },
            { title: 'queue_lengths.csv (传输队列缓冲分析)', key: 'right_queue', icon: <FileTextOutlined />, isText: true, content: 'timestamp,queue_size,drop_count\n1716174000.00,1,0\n1716174000.10,1,0\n1716174000.20,1,0' }
          ]
        },
        {
          title: 'quality_report (质检分析报告)',
          key: 'quality_report',
          icon: <FolderOutlined style={{ color: '#ffc069' }} />,
          children: [
            { 
              title: 'check.log (规则运行明细日志)', 
              key: 'check_log', 
              icon: <FileTextOutlined />, 
              isText: true, 
              content: `[2026-05-20 10:12:37] session=${id} config_file=luming_dual_arm_v1.json\n[2026-05-20 10:12:39] INFO: 开始加载双臂数据轨迹包...\n[2026-05-20 10:12:44] INFO: 加载完成。左手帧数: 1200 帧, 右手帧数: 1200 帧\n[2026-05-20 10:12:47] CHECK: 启动运动学合理性指标检测...\n[2026-05-20 10:12:55] WARNING: [left_hand] 第 150-186 帧加速度超标，最大值=1.20 m/s² (阈值: 1.0 m/s²)\n[2026-05-20 10:13:02] CHECK: [right_hand] 检测到极高静止比 (static_ratio=1.000)。判定为右手臂处于标定就绪状态，豁免运动指标检查。\n[2026-05-20 10:13:10] CHECK: 启动帧间连续与位移变动判定...\n[2026-05-20 10:13:16] WARNING: [right_hand] 空间位移不足，最大位移变动=0.002m (阈值要求: > 0.05m)。基于右手静止豁免，判定通过。\n[2026-05-20 10:13:21] session=${id} path=Data/.../${id} overall_pass=True reason=所有检查通过(含静止侧豁免)` 
            },
            { 
              title: 'quality_report.json (核心机检参数度量)', 
              key: 'report_json', 
              icon: <FileTextOutlined />, 
              isText: true, 
              content: `{\n  "session_name": "${id}",\n  "overall_pass": true,\n  "violations": [],\n  "kinematics": {\n    "left": {\n      "max_speed": 0.45,\n      "max_accel": 1.20,\n      "max_jerk": 4.50,\n      "static_ratio": 0.01,\n      "violations_pct": 1.50\n    },\n    "right": {\n      "max_speed": 0.00,\n      "max_accel": 0.00,\n      "max_jerk": 0.00,\n      "static_ratio": 1.00,\n      "violations_pct": 0.00\n    }\n  },\n  "diagnostics": {\n    "vive_tracking": "DATA_INSUFFICIENT",\n    "slam_tracking": "TRACK_STEADY",\n    "merge_matching": "SUCCESS"\n  }\n}` 
            },
            { 
              title: 'quality_report.txt (机检概要可视化打印)', 
              key: 'report_txt', 
              icon: <FileTextOutlined />, 
              isText: true, 
              content: `Session: ${id}\nPath: Data/task_20260408W001_a/background_00/multi_sessions_20260520_101032/${id}\n---------------------------------------\n[Check 1] Kinematics (L: PASS | R: EXEMPTED)\n  - Left max speed: 0.45 m/s (Limit: 1.00) \n  - Left max accel: 1.20 m/s^2 (Limit: 1.00) -> Overlimit ratio: 1.50%\n    * Adaptive rules applied: 1.50% <= 3.00% Limit. Status: PASS.\n  - Right static ratio: 100.0% -> Exemption applied. Status: PASS.\n[Check 2] Displacement & Drifts (PASS)\n  - Left displacement: 0.892 m (PASS)\n  - Right displacement: 0.002 m -> Exemption applied (PASS)\n[Check 3] Calibration Matrices (PASS)\n  - Alignment check: SUCCESS\n---------------------------------------\nOVERALL STATUS: PASS (质检合格通过)` 
            }
          ]
        },
        { 
          title: 'relative_transforms_left_to_right.txt (双臂相对变换标定阵-正向)', 
          key: 'transforms_lr', 
          icon: <FileTextOutlined />, 
          isText: true, 
          content: 'timestamp,tx,ty,tz,qx,qy,qz,qw\n1716174000.00,0.452,-0.122,0.892,0.001,0.002,0.707,0.707\n1716174000.03,0.453,-0.121,0.893,0.001,0.002,0.707,0.707\n1716174000.06,0.455,-0.120,0.895,0.002,0.003,0.706,0.708\n1716174000.09,0.457,-0.119,0.896,0.002,0.003,0.706,0.708\n1716174000.12,0.459,-0.118,0.898,0.003,0.004,0.705,0.709\n1716174000.15,0.461,-0.117,0.899,0.003,0.004,0.705,0.709\n1716174000.18,0.462,-0.116,0.901,0.004,0.005,0.704,0.710' 
        },
        { 
          title: 'relative_transforms_right_to_left.txt (双臂相对变换标定阵-反向)', 
          key: 'transforms_rl', 
          icon: <FileTextOutlined />, 
          isText: true, 
          content: 'timestamp,tx,ty,tz,qx,qy,qz,qw\n1716174000.00,-0.452,0.122,-0.892,-0.001,-0.002,-0.707,0.707\n1716174000.03,-0.453,0.121,-0.893,-0.001,-0.002,-0.707,0.707\n1716174000.06,-0.455,0.120,-0.895,-0.002,-0.003,-0.706,0.708\n1716174000.09,-0.457,0.119,-0.896,-0.002,-0.003,-0.706,0.708' 
        }
      ]
    }
  ];
};

import { Tree } from 'antd';

export default function EpisodeVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId') || 'CT-20250301001';
  const episodeId = searchParams.get('episodeId') || 'session_028';

  const [selectedFileKey, setSelectedFileKey] = useState('left_video');
  const [selectedFileNode, setSelectedFileNode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const canvasRef = useRef(null);

  const [fileContent, setFileContent] = useState('');
  const [loadingFileContent, setLoadingFileContent] = useState(false);

  const currentTreeData = getTreeData(episodeId);

  // Initialize selected node to left hand video on load
  useEffect(() => {
    const findNode = (nodes) => {
      for (let n of nodes) {
        if (n.key === 'left_video') return n;
        if (n.children) {
          const found = findNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    const node = findNode(currentTreeData);
    setSelectedFileNode(node);
    setFileContent('');
  }, [episodeId]);

  // Canvas Render Loop for Video Preview Simulation (Scaled to 640x360)
  useEffect(() => {
    if (!canvasRef.current || !isPlaying || !selectedFileNode || !selectedFileNode.isVideo) return;
    
    let animationId;
    const ctx = canvasRef.current.getContext('2d');
    
    const renderFrame = () => {
      setFrame(f => (f + 1) % 1200);
      
      // Clear canvas
      ctx.fillStyle = '#0f172a'; // slate 900
      ctx.fillRect(0, 0, 640, 360);
      
      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 360);
        ctx.stroke();
      }
      for (let y = 0; y < 360; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }
      
      if (selectedFileKey === 'left_video') {
        // Draw left video (manipulation)
        const t = (frame % 300) / 300; // loop phase
        
        // Target cup
        const cupX = 430;
        const cupY = 210;
        ctx.fillStyle = '#f43f5e'; // rose 500
        ctx.beginPath();
        ctx.arc(cupX, cupY, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Cup Label
        ctx.fillStyle = '#f43f5e';
        ctx.font = '12px monospace';
        ctx.fillText('TARGET_CUP (98%)', cupX - 55, cupY - 26);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.strokeRect(cupX - 25, cupY - 25, 50, 50);
        
        // Robot arm
        const baseX = 100;
        const baseY = 310;
        
        // Kinematics calculation
        // Smooth trajectory reaching for cup
        let targetX = cupX;
        let targetY = cupY;
        if (t < 0.4) {
          // Approach
          const p = t / 0.4;
          targetX = baseX + (cupX - baseX) * p * 0.8;
          targetY = baseY - (baseY - cupY) * p * 0.5;
        } else if (t < 0.6) {
          // Grasp
          targetX = cupX;
          targetY = cupY;
        } else if (t < 0.9) {
          // Lift
          const p = (t - 0.6) / 0.3;
          targetX = cupX;
          targetY = cupY - 70 * p;
        } else {
          // Reset
          const p = (t - 0.9) / 0.1;
          targetX = cupX + (baseX - cupX) * p;
          targetY = (cupY - 70) + (baseY - (cupY - 70)) * p;
        }
        
        // Draw arm links
        const j1x = 210;
        const j1y = 190;
        
        ctx.strokeStyle = '#38bdf8'; // sky 400
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(j1x, j1y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        
        // Joint points
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(baseX, baseY, 8, 0, Math.PI*2);
        ctx.arc(j1x, j1y, 6, 0, Math.PI*2);
        ctx.fill();
        
        // Gripper
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, Math.PI*2);
        ctx.fill();
        
        // Bounding box gripper
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(targetX - 20, targetY - 20, 40, 40);
        ctx.fillText('GRIPPER_L', targetX - 30, targetY - 25);
        
        // Text Info Overlay
        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px monospace';
        ctx.fillText('CAMERA: WRIST_CAM_L (LEFT_ARM)', 20, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`FRAME: ${frame} / 1200`, 20, 50);
        ctx.fillText(`X_POS: ${targetX.toFixed(1)} mm`, 20, 70);
        ctx.fillText(`Y_POS: ${(360 - targetY).toFixed(1)} mm`, 20, 90);
        ctx.fillStyle = '#4ade80';
        ctx.fillText('STATE: ACTIVE (双手筷子与勺子整理)', 20, 110);
      } else if (selectedFileKey === 'right_video') {
        // Draw right video (Static arm)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 280);
        ctx.lineTo(600, 280);
        ctx.stroke();
        
        // Static arm wireframe
        const baseX = 540;
        const baseY = 310;
        const j1x = 450;
        const j1y = 210;
        const targetX = 410;
        const targetY = 250;
        
        ctx.strokeStyle = '#64748b'; // slate 500
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(j1x, j1y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(baseX, baseY, 8, 0, Math.PI*2);
        ctx.arc(j1x, j1y, 6, 0, Math.PI*2);
        ctx.fill();
        
        // Static label
        ctx.fillStyle = '#ef4444'; // red 500
        ctx.font = '14px monospace';
        ctx.fillText('[STATIC STATE - RIGHT ARM IDLE]', 170, 160);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.fillText('CAMERA: WRIST_CAM_R (RIGHT_ARM)', 20, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('STATE: STATIC (就绪标定状态)', 20, 50);
        ctx.fillText(`X_POS: ${targetX.toFixed(1)} mm`, 20, 70);
        ctx.fillText(`Y_POS: ${(360 - targetY).toFixed(1)} mm`, 20, 90);
      }
      
      animationId = requestAnimationFrame(renderFrame);
    };
    
    animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, [selectedFileKey, isPlaying, frame, selectedFileNode]);

  return (
    <MainLayout>
      <div className="ui-workspace">
      {/* Breadcrumb Header */}
      <div className="ui-toolbar" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space size="middle">
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.close()} />
          <div>
            <Breadcrumb items={[
              { title: '数据采集' },
              { title: '采集任务' },
              { title: '详情', href: buildStaticHref(STATIC_ROUTES.collectDetail, { taskId }) },
              { title: '原始包视频与数据预览' }
            ]} />
            <Title level={4} style={{ margin: 0, marginTop: 4 }}>
              <Space>
                <VideoCameraOutlined style={{ color: '#1677ff' }} />
                <span>数据预览与视频播放器: {episodeId}</span>
              </Space>
            </Title>
          </div>
        </Space>
        <StatusTag status="已完成">数据包已加载</StatusTag>
      </div>

      <Row gutter={20} style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Column: Directory structure */}
        <Col span={8}>
          <Card className="ui-table-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1677ff' }}>
                <FolderOpenOutlined style={{ fontSize: 16 }} />
                <span>原始数据目录树 ({episodeId})</span>
              </div>
            }
            variant="outlined"
            style={{ borderRadius: 8, height: 600, overflowY: 'auto' }}
          >
            <Tree
              showIcon
              defaultExpandAll
              treeData={currentTreeData}
              selectedKeys={[selectedFileKey]}
              onSelect={(keys, info) => {
                if (keys.length > 0) {
                  const key = keys[0];
                  setSelectedFileKey(key);
                  // Find node info recursively
                  const findNode = (nodes) => {
                    for (let n of nodes) {
                      if (n.key === key) return n;
                      if (n.children) {
                        const found = findNode(n.children);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  const node = findNode(currentTreeData);
                  setSelectedFileNode(node);
                  
                  if (node && node.isVideo) {
                    setIsPlaying(true);
                    setFrame(0);
                  } else {
                    setIsPlaying(false);
                  }

                  if (node && node.isText) {
                    setLoadingFileContent(true);
                    let url = '';
                    if (key === 'check_log') url = '/api/luming?type=log&file=log';
                    else if (key === 'report_txt') url = '/api/luming?type=log&file=txt';
                    else if (key === 'report_json') url = '/api/luming?type=report';
                    else if (key === 'left_timestamps') url = '/api/luming?type=log&file=left_timestamps';
                    else if (key === 'right_timestamps') url = '/api/luming?type=log&file=right_timestamps';
                    else if (key === 'left_queue') url = '/api/luming?type=log&file=left_queue';
                    else if (key === 'right_queue') url = '/api/luming?type=log&file=right_queue';
                    else if (key === 'transforms_lr') url = '/api/luming?type=log&file=transforms_lr';
                    else if (key === 'transforms_rl') url = '/api/luming?type=log&file=transforms_rl';

                    if (url) {
                      fetch(url)
                        .then(res => key === 'report_json' ? res.json() : res.text())
                        .then(data => {
                          const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
                          setFileContent(text);
                        })
                        .catch(err => {
                          console.error(err);
                          setFileContent('读取数据失败: ' + err.message);
                        })
                        .finally(() => {
                          setLoadingFileContent(false);
                        });
                    } else {
                      setFileContent(node.content || '');
                      setLoadingFileContent(false);
                    }
                  } else {
                    setFileContent('');
                  }
                }
              }}
            />
          </Card>
        </Col>

        {/* Right Column: File Content / Video simulation preview */}
        <Col span={16}>
          <Card className="ui-table-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Space>
                  <EyeOutlined style={{ color: '#1677ff' }} />
                  <span>实时数据预览区</span>
                </Space>
                {selectedFileNode && (
                  <Space>
                    {selectedFileNode.isVideo && <Tag color="processing">Video Stream (MP4)</Tag>}
                    {selectedFileNode.isText && <Tag color="orange">Text/Log File</Tag>}
                    {!selectedFileNode.isVideo && !selectedFileNode.isText && <Tag color="default">Binary Data</Tag>}
                  </Space>
                )}
              </div>
            }
            variant="outlined"
            style={{ borderRadius: 8, height: 600, display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, padding: 20, display: 'flex', flexDirection: 'column', height: 'calc(100% - 50px)' } }}
          >
            {selectedFileNode ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                  <Text strong style={{ color: '#1677ff', fontFamily: 'monospace', fontSize: 14 }}>
                    {selectedFileNode.title}
                  </Text>
                </div>
                
                {/* Video Player */}
                {selectedFileNode.isVideo && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: 640, height: 360, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', background: '#000' }}>
                      <video 
                        key={selectedFileKey} // reload on toggle
                        src={selectedFileKey === 'left_video' 
                          ? `/session_028/left_hand_250801DR48FP26003296/RGB_Images/video.mp4` 
                          : `/session_028/right_hand_250801DR48FP26003349/RGB_Images/video.mp4`}
                        controls
                        autoPlay
                        loop
                        muted
                        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Text log file preview */}
                {selectedFileNode.isText && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <pre style={{
                      flex: 1,
                      background: '#0d1117',
                      color: '#39ff14',
                      padding: '16px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      overflowY: 'auto',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      lineHeight: '1.6'
                    }}>
                      {loadingFileContent ? '正在从采集卡目录读取实时数据...' : fileContent}
                    </pre>
                  </div>
                )}
                
                {/* Non-previewable binary formats */}
                {!selectedFileNode.isVideo && !selectedFileNode.isText && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 24 }}>
                    <FileOutlined style={{ fontSize: 56, marginBottom: 16, color: '#d9d9d9' }} />
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 8 }}>非预览格式二进制传感器数据</div>
                    <div style={{ fontSize: 12, maxWidth: 500 }}>本文件类型为机械手臂关节力矩、位姿标定等底层二进制数据（如 HDF5/NPY/CSV 原始流格式），无法直接渲染为音视频。</div>
                    <div style={{ fontSize: 12, marginTop: 12, color: '#1677ff', cursor: 'pointer' }} onClick={() => {
                      window.open(buildStaticHref(STATIC_ROUTES.collectData, { taskId }), '_blank');
                    }}>
                      👉 点击这里进行可视化质检曲线分析
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)' }}>
                <FolderOpenOutlined style={{ fontSize: 60, marginBottom: 16, color: 'rgba(255,255,255,0.15)' }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>请在左侧数据目录树中选择文件进行预览</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>支持预览 video.mp4 视频源及各类 .txt / .log / .json 规则报表。</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
      </div>
    </MainLayout>
  );
}
