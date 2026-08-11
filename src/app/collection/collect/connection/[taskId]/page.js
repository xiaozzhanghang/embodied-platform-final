'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Badge, Space, Typography, Progress, App } from 'antd';
import { 
  ApiOutlined, 
  CheckCircleFilled, 
  LoadingOutlined, 
  RobotOutlined, 
  VideoCameraOutlined, 
  HddOutlined, 
  ArrowLeftOutlined,
  MonitorOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { StatusTag } from '@/components/ui';

const { Title, Text } = Typography;

// Humanoid/VR Steps and Logs
const humanoidSteps = [
  { title: '本地网络', icon: <GlobalOutlined />, desc: '检查以太网适配器' },
  { title: '机器人控制箱', icon: <RobotOutlined />, desc: '建立 ROS2 通信握手' },
  { title: '多目感知系统', icon: <VideoCameraOutlined />, desc: '3路相机流初始化' },
  { title: '存储系统', icon: <HddOutlined />, desc: '本地 SSD 预热与权限确认' },
];

const humanoidLogs = [
  { time: '16:20:01', msg: '初始化边缘客户端硬件驱动...', type: 'info' },
  { time: '16:20:02', msg: '正在扫描以太网接口 (en0)...', type: 'info' },
  { time: '16:20:03', msg: '检测到网口直连: 192.168.1.50', type: 'success' },
  { time: '16:20:04', msg: '正在尝试 Ping 机器人控制器 (192.168.1.100)...', type: 'info' },
  { time: '16:20:05', msg: '机器人控制器响应正常 (Latency: 0.8ms)', type: 'success' },
  { time: '16:20:06', msg: '正在建立 ROS2 Node: /edge_collector_node', type: 'info' },
  { time: '16:20:07', msg: 'ROS2 握手成功, 版本: Galactic', type: 'success' },
  { time: '16:20:08', msg: '开启相机预览流: [Front, Wrist, Side]', type: 'info' },
  { time: '16:20:09', msg: '相机帧率校准中: 预计 30fps', type: 'info' },
  { time: '16:20:10', msg: '本地磁盘写权限校验成功', type: 'success' },
  { time: '16:20:11', msg: '自检完成: 系统已就绪。', type: 'done' },
];

// Lumos Steps and Logs
const lumosSteps = [
  { title: '本地网络', icon: <GlobalOutlined />, desc: '网卡直连 (en0)' },
  { title: '数采背包主机', icon: <HddOutlined />, desc: '背包 192.168.54.110 通信' },
  { title: '夹爪控制器', icon: <RobotOutlined />, desc: '双侧夹爪对位与校验' },
  { title: '多目相机系统', icon: <VideoCameraOutlined />, desc: '3路 RGB 及雷达自检' },
];

const lumosLogs = [
  { time: '16:20:01', msg: '启动 Lumos FastUMI Go 离线数采系统驱动...', type: 'info' },
  { time: '16:20:02', msg: '正在扫描本地网段 192.168.54.x...', type: 'info' },
  { time: '16:20:03', msg: '发现本地网卡直连: 192.168.54.53', type: 'success' },
  { time: '16:20:04', msg: '正在尝试通信握手 Lumos 背包主机 (192.168.54.110)...', type: 'info' },
  { time: '16:20:05', msg: '数采背包主机已接入 (延迟: 1.2ms)', type: 'success' },
  { time: '16:20:06', msg: '正在检测左右夹爪 USB 总线控制接口 (/dev/ttyUSB*)...', type: 'info' },
  { time: '16:20:07', msg: '双侧力反馈手势夹爪配置对齐成功', type: 'success' },
  { time: '16:20:08', msg: '初始化 3 路摄像头预览 [Wrist_L, Wrist_R, Head_Eye]...', type: 'info' },
  { time: '16:20:09', msg: '相机帧同步对齐成功 (时滞差 < 2ms)', type: 'success' },
  { time: '16:20:10', msg: '耳机阻抗与 HDMI 诱骗接口检测通过 (ACTIVE)', type: 'success' },
  { time: '16:20:11', msg: '自检完成: 背包系统已就绪。', type: 'done' },
];

// Galbot 1.16 Steps and Logs
const galbot116Steps = [
  { title: '物理网络', icon: <GlobalOutlined />, desc: 'XCU & HPU 双端心跳检测' },
  { title: 'Supervisor 网桥', icon: <RobotOutlined />, desc: '守护服务 galbot_upper_bridge 运行' },
  { title: 'WiFi 场景参数', icon: <HddOutlined />, desc: 'miracle-office-5g & 场景 JSON' },
  { title: '感知自检', icon: <VideoCameraOutlined />, desc: '4路多目相机与雷达深度流' },
];

const galbot116Logs = [
  { time: '14:20:01', msg: '启动 Galbot 1.16 双端物理数采环境自检程序...', type: 'info' },
  { time: '14:20:02', msg: '正在 Ping 控制底座 XCU 节点 (192.168.1.66)...', type: 'info' },
  { time: '14:20:03', msg: '发现 XCU 节点响应正常 (延迟: 0.4ms)，SSH 验证通过，系统版本: OS v1.16.0.2', type: 'success' },
  { time: '14:20:04', msg: '正在 Ping 计算单元 HPU 节点 (192.168.1.88)...', type: 'info' },
  { time: '14:20:05', msg: '发现 HPU (Nvidia Orin) 响应正常 (延迟: 0.9ms)，SSH 授权通过，系统版本: Ubuntu 22.04', type: 'success' },
  { time: '14:20:06', msg: '正在查询 HPU Supervisor 网桥进程守护状态...', type: 'info' },
  { time: '14:20:07', msg: 'Supervisor 服务激活：galbot_upper_bridge 处于 RUNNING 状态，PID: 4820', type: 'success' },
  { time: '14:20:08', msg: '正在拉取 XCU 本地服务 remote_ctrl_record.target 状态...', type: 'info' },
  { time: '14:20:09', msg: '数采记录服务已就绪 (ACTIVE)，正向标定矩阵同步成功。', type: 'success' },
  { time: '14:20:10', msg: '正在校验局域网 WiFi miracle-office-5g 连接与上报场景 JSON...', type: 'info' },
  { time: '14:20:11', msg: '无线网已接入 (IP: 192.168.76.57)，场景参数加载成功。', type: 'success' },
  { time: '14:20:12', msg: '执行 sys_tool SN 码比对检查：GALBOT-116-GB105，鉴权验证成功。', type: 'success' },
  { time: '14:20:13', msg: '正在开启 4 路多目感知流与 1 路雷达深度流帧率校验...', type: 'info' },
  { time: '14:20:14', msg: '相机流正常激活 [Head_L, Head_R, Hand_L, Hand_R] @ 30fps，PTP 时钟偏差 <= 0.2ms', type: 'success' },
  { time: '14:20:15', msg: '自检 100% 通过：Galbot 1.16 双物理核心环境全部就绪。', type: 'done' },
];

export default function DeviceConnectionPage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [scanning, setScanning] = useState(true);
  const logEndRef = useRef(null);

  const taskId = params?.taskId || 'CT-20250301001';
  const isGalbot116 = taskId?.includes('1.16') || taskId?.includes('GB116') || taskId?.includes('GB105') || taskId === 'CT-20260605001';
  const isLumos = !isGalbot116 && (taskId === 'CT-20260414001' || taskId?.includes('2026') || taskId?.includes('Lumos'));

  const steps = isGalbot116 ? galbot116Steps : (isLumos ? lumosSteps : humanoidSteps);
  const logMsgs = isGalbot116 ? galbot116Logs : (isLumos ? lumosLogs : humanoidLogs);

  useEffect(() => {
    if (step < steps.length) {
      const timer = setTimeout(() => {
        setStep(s => s + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setScanning(false);
      message.success('所有硬件已就绪，正在进入采集工作台...');
      setTimeout(() => {
        router.push(`/collection/collect/workspace/${taskId}`);
      }, 1500);
    }
  }, [step, taskId, router, steps.length, message]);

  useEffect(() => {
    let logIdx = 0;
    const intervalTime = isGalbot116 ? 500 : 1000;
    const logInterval = setInterval(() => {
      if (logIdx < logMsgs.length) {
        setLogs(prev => [...prev, logMsgs[logIdx]]);
        logIdx++;
      } else {
        clearInterval(logInterval);
      }
    }, intervalTime);
    return () => clearInterval(logInterval);
  }, [logMsgs, isGalbot116]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="ui-workspace" style={{
      minHeight: '100vh', 
      background: '#020817', 
      padding: '40px',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      <style jsx global>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes scan-line {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .radar-circle {
          position: absolute;
          border: 1px solid #1677ff;
          border-radius: 50%;
          animation: radar-pulse 3s infinite linear;
        }
        .log-item {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 13px;
          margin-bottom: 4px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="ui-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <Space size="large">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()} 
            style={{ color: 'rgba(255,255,255,0.45)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MonitorOutlined style={{ color: '#1677ff', fontSize: 20 }} />
              <Title level={4} style={{ color: '#fff', margin: 0 }}>设备自检与握手中心</Title>
              <StatusTag status="进行中" style={{ marginLeft: 8 }}>Task ID: {taskId}</StatusTag>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>正在检测边缘端硬件环境的稳定性 ({isGalbot116 ? 'Galbot 1.16 双端部署模式' : isLumos ? 'Lumos FastUMI Go 模式' : '通用人形机器人模式'})...</Text>
          </div>
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
        {/* Left: Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Scanner Card */}
          <Card className="ui-table-card" styles={{ body: { padding: 0 } }} style={{
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 20,
            height: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Grid */}
            <div style={{ 
              position: 'absolute', inset: 0, 
              backgroundImage: 'radial-gradient(circle at center, rgba(22,119,255,0.05) 0, transparent 70%), linear-gradient(rgba(22,119,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(22,119,255,0.03) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 40px 40px, 40px 40px',
              zIndex: 0
            }} />

            {/* Radar Animation */}
            <div style={{ position: 'relative', width: 400, height: 400, zIndex: 1 }}>
              <div className="radar-circle" style={{ inset: 0, animationDelay: '0s' }} />
              <div className="radar-circle" style={{ inset: 0, animationDelay: '1s' }} />
              <div className="radar-circle" style={{ inset: 0, animationDelay: '2s' }} />
              
              {/* Spinning Scan Line */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'conic-gradient(from 0deg, transparent 270deg, rgba(22, 119, 255, 0.2) 360deg)',
                borderRadius: '50%',
                animation: 'scan-line 4s infinite linear',
                border: '1px solid rgba(255,255,255,0.1)'
              }} />

              {/* Hardware Points */}
              <div style={{ position: 'absolute', top: '20%', left: '30%' }}>
                <Badge status={step > 1 ? 'success' : 'processing'} text={<span style={{ color: '#fff', fontSize: 12 }}>{isGalbot116 ? 'XCU NODE (192.168.1.66)' : isLumos ? 'LUMOS BACKPACK' : 'ROBOT CONTROL BOX'}</span>} />
              </div>
              <div style={{ position: 'absolute', top: '40%', right: '25%' }}>
                <Badge status={step > 2 ? 'success' : 'processing'} text={<span style={{ color: '#fff', fontSize: 12 }}>{isGalbot116 ? 'HPU NODE (192.168.1.88)' : isLumos ? 'LEFT GRIPPER' : 'CAM_01 (FRONT)'}</span>} />
              </div>
              <div style={{ position: 'absolute', bottom: '30%', left: '45%' }}>
                <Badge status={step > 2 ? 'success' : 'processing'} text={<span style={{ color: '#fff', fontSize: 12 }}>{isGalbot116 ? 'SUPERVISOR GATEWAY (ACTIVE)' : isLumos ? 'RIGHT GRIPPER' : 'CAM_02 (WRIST)'}</span>} />
              </div>

              {/* Center Icon */}
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', 
                transform: 'translate(-50%, -50%)',
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(22, 119, 255, 0.2)',
                border: '2px solid #1677ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(22, 119, 255, 0.4)'
              }}>
                {scanning ? <LoadingOutlined style={{ fontSize: 32, color: '#1677ff' }} /> : <CheckCircleFilled style={{ fontSize: 32, color: '#52c41a' }} />}
              </div>
            </div>

            {/* Scanning Text */}
            <div style={{ position: 'absolute', bottom: 40, textAlign: 'center', width: '100%' }}>
              <div style={{ color: '#1677ff', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
                {scanning ? 'SCANNING HARDWARE...' : 'SYSTEM READY'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>
                {scanning ? `正在建立第 ${step + 1} 项关键连接...` : '所有底层模块通讯已通过验证'}
              </div>
            </div>
          </Card>

          {/* Steps Progress */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {steps.map((item, idx) => (
              <Card key={idx} style={{ 
                background: idx === step ? 'rgba(22, 119, 255, 0.1)' : idx < step ? 'rgba(82, 196, 26, 0.05)' : 'rgba(255,255,255,0.02)',
                border: idx === step ? '1px solid #1677ff' : idx < step ? '1px solid #52c41a' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 8, 
                    background: idx <= step ? '#1677ff' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {idx < step ? <CheckCircleFilled style={{ color: '#fff' }} /> : React.cloneElement(item.icon, { style: { color: '#fff' } })}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{item.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Console Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Metrics */}
          <Card className="ui-table-card" style={{ background: '#111c30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
            <Title level={5} style={{ color: '#fff', marginBottom: 20 }}>实时连接指标</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{isGalbot116 ? 'Galbot Time Sync' : isLumos ? 'Lumos Heartbeat' : 'ROS2 Heartbeat'}</span>
                  <span style={{ color: '#52c41a' }}>{isGalbot116 ? 'PTP SYNCED' : 'STABLE'}</span>
                </div>
                <Progress percent={isGalbot116 ? 100 : 98} size="small" strokeColor="#1677ff" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{isGalbot116 ? 'XCU / HPU Latency' : isLumos ? 'Telemetry Latency' : 'Camera Sync Lag'}</span>
                  <span style={{ color: '#faad14' }}>{isGalbot116 ? '0.4ms / 0.9ms' : isLumos ? '1.2ms' : '2ms'}</span>
                </div>
                <Progress percent={15} size="small" strokeColor="#faad14" showInfo={false} />
              </div>
            </div>
          </Card>

          {/* Terminal Console */}
          <div className="ui-table-card" style={{
            flex: 1, 
            background: '#000', 
            borderRadius: 16, 
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
              <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Terminal - {isGalbot116 ? 'galbot116_deploy_status.log' : isLumos ? 'lumos_collector.log' : 'collector_v1.log'}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {logs.map((log, i) => (
                log && (
                  <div key={i} className="log-item">
                    <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 10 }}>[{log?.time}]</span>
                    <span style={{ 
                      color: log?.type === 'success' ? '#52c41a' : log?.type === 'done' ? '#1677ff' : '#fff'
                    }}>
                      {log?.msg}
                    </span>
                  </div>
                )
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
